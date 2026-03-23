'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Activity, X, ChevronLeft, Stethoscope, Search, Plus, Trash2, CheckCircle2, 
  ChevronDown, ChevronUp, DollarSign, Wallet2, Loader2, Edit3,
  Banknote, CreditCard, Landmark, User
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { toast } from 'sonner'

const c1 = [18, 17, 16, 15, 14, 13, 12, 11];
const c2 = [21, 22, 23, 24, 25, 26, 27, 28];
const c3 = [48, 47, 46, 45, 44, 43, 42, 41];
const c4 = [31, 32, 33, 34, 35, 36, 37, 38];

const METODOS_PAGO = [
  { id: 'efectivo', label: 'Efectivo', icon: <Banknote size={16}/> },
  { id: 'debito', label: 'T. Débito', icon: <CreditCard size={16}/> },
  { id: 'credito', label: 'T. Crédito', icon: <CreditCard size={16}/> },
  { id: 'transferencia', label: 'Transferencia', icon: <Landmark size={16}/> },
];

const ICONOS_DISPONIBLES = [
  { id: 'corona', label: 'Corona' },
  { id: 'endodoncia', label: 'Endodoncia' },
  { id: 'extraccion', label: 'Extracción' },
  { id: 'implante', label: 'Implante' },
  { id: 'restauracion', label: 'Restauración' },
  { id: 'rayosx', label: 'Rayos X' },
  { id: 'perno', label: 'Perno Muñón' },
  { id: 'protesis', label: 'Prótesis Removible' },
  { id: 'pulido', label: 'Pulido Radicular' },
  { id: 'otro', label: 'Otro (Punto)' }
];

export default function DetalleTratamientoPage() {
  const { id: pacienteId, presupuestoId } = useParams()
  
  const [items, setItems] = useState<any[]>([])
  const [dentadura, setDentadura] = useState<Record<number, any>>({})
  const [secciones, setSecciones] = useState<Record<string, any[]>>({})
  const [cargando, setCargando] = useState(true)
  const [dienteSeleccionado, setDienteSeleccionado] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriasAbiertas, setCategoriasAbiertas] = useState<Record<string, boolean>>({})
  
  // --- NUEVOS ESTADOS MULTI-ESPECIALISTA ---
  const [listaProfesionales, setListaProfesionales] = useState<any[]>([])
  const [profesionalAsignado, setProfesionalAsignado] = useState<string>('')
  const [especialistaDefault, setEspecialistaDefault] = useState<string | null>(null)

  const [tratamientoParaMapear, setTratamientoParaMapear] = useState<any>(null);
  const [itemParaAbonar, setItemParaAbonar] = useState<any>(null)
  const [montoAbono, setMontoAbono] = useState<string>('')
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>('efectivo')
  const [guardandoAbono, setGuardandoAbono] = useState(false)
  const [numBoleta, setNumBoleta] = useState('')
  const [numReferencia, setNumReferencia] = useState('')

  const inicializado = useRef(false);

  useEffect(() => {
    if (pacienteId && presupuestoId) {
      fetchTodo()
      fetchPrestaciones()
      fetchProfesionales()
    }
  }, [pacienteId, presupuestoId])

  useEffect(() => {
    if (!inicializado.current) {
      if (Object.keys(dentadura).length > 0) inicializado.current = true;
      return;
    }
    const guardarOdonto = async () => {
      await supabase.from('presupuestos').update({ odontograma_estado: dentadura }).eq('id', presupuestoId);
    };
    const timer = setTimeout(guardarOdonto, 1000); 
    return () => clearTimeout(timer);
  }, [dentadura]);

  async function fetchProfesionales() {
    const { data } = await supabase.from('profesionales').select('user_id, nombre, apellido').eq('activo', true);
    if (data) setListaProfesionales(data);
  }

  async function fetchPrestaciones() {
    const { data } = await supabase.from('prestaciones').select('*').order('Nombre Accion', { ascending: true });
    if (data) {
      const filtradas = data.filter(p => String(p.Habilitado).toLowerCase() !== 'no');
      const agrupado = filtradas.reduce((acc: any, curr: any) => {
        const cat = curr["Nombre Categoria"] || "OTROS";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(curr);
        return acc;
      }, {});
      setSecciones(agrupado);
    }
  }

  async function fetchTodo() {
    setCargando(true)
    try {
      const { data: pres } = await supabase.from('presupuestos').select('*').eq('id', presupuestoId).single()
      const { data: listaItems } = await supabase
        .from('presupuesto_items')
        .select(`
          *, 
          prestaciones:prestacion_id(icono_tipo, "Nombre Accion"),
          profesionales:profesional_id(nombre, apellido)
        `)
        .eq('presupuesto_id', presupuestoId)

      if (pres) {
        setDentadura(pres.odontograma_estado || {});
        setEspecialistaDefault(pres.especialista_id);
        // Por defecto, asignamos al creador del presupuesto en el selector
        if (pres.especialista_id) setProfesionalAsignado(pres.especialista_id);
      }
      if (listaItems) setItems(listaItems)
    } catch (error) { console.error(error) } 
    finally { setCargando(false) }
  }

  const actualizarGlobalPresupuesto = async (nuevosItems: any[]) => {
    const nuevoTotal = nuevosItems.reduce((acc, curr) => acc + (Number(curr.precio_pactado) || 0), 0);
    const nuevoTotalAbonado = nuevosItems.reduce((acc, curr) => acc + (Number(curr.abonado) || 0), 0);
    await supabase.from('presupuestos').update({ total: nuevoTotal, total_abonado: nuevoTotalAbonado }).eq('id', presupuestoId);
  }

  const handleSeleccionarTratamiento = (prestacion: any) => {
    if (prestacion.icono_tipo) {
      ejecutarInsercion(prestacion);
    } else {
      setTratamientoParaMapear(prestacion);
    }
  }

  const guardarIconoYAgregar = async (tipoIcono: string) => {
    const prestacion = tratamientoParaMapear;
    await supabase.from('prestaciones').update({ icono_tipo: tipoIcono }).eq('id', prestacion.id);
    await ejecutarInsercion({ ...prestacion, icono_tipo: tipoIcono });
    setTratamientoParaMapear(null);
    fetchPrestaciones();
  }

  const ejecutarInsercion = async (prestacion: any) => {
    if (!profesionalAsignado) {
      return toast.error("Debes seleccionar un profesional responsable");
    }

    const { data, error } = await supabase
      .from('presupuesto_items')
      .insert([{
        presupuesto_id: presupuestoId,
        prestacion_id: prestacion.id,
        diente_id: dienteSeleccionado,
        precio_pactado: prestacion["Precio"],
        abonado: 0,
        estado: 'pendiente',
        profesional_id: profesionalAsignado // <--- Vínculo Dentalink style
      }])
      .select('*, prestaciones:prestacion_id(icono_tipo, "Nombre Accion"), profesionales:profesional_id(nombre, apellido)') 
      .single()
    
    if (!error && data) {
      const nuevosItems = [...items, data];
      setItems(nuevosItems);
      actualizarGlobalPresupuesto(nuevosItems);
      setDienteSeleccionado(null);
      toast.success("Tratamiento asignado correctamente");
    } else {
      toast.error("Error al asignar tratamiento");
    }
  }

  const guardarAbono = async () => {
    if (!itemParaAbonar || montoAbono === '') return
    const montoNum = Number(montoAbono);
    
    setGuardandoAbono(true)
    try {
      const { data: cajasOpen } = await supabase.from('sesiones_caja').select('id').eq('estado', 'abierta').order('fecha_apertura', { ascending: false }).limit(1);

      if (!cajasOpen || cajasOpen.length === 0) {
        toast.error("Abre una caja antes de abonar.");
        setGuardandoAbono(false);
        return;
      }

      const { data: paciente } = await supabase.from('pacientes').select('prevision').eq('id', pacienteId).single();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: errorPago } = await supabase.from('pagos').insert([{
        paciente_id: pacienteId,
        presupuesto_id: presupuestoId,
        item_id: itemParaAbonar.id,
        monto: montoNum,
        metodo_pago: metodoSeleccionado,
        profesional_id: itemParaAbonar.profesional_id || user?.id, // Prioridad al profesional del item
        caja_id: cajasOpen[0].id,
        convenio: paciente?.prevision || 'Particular',
        numero_boleta: numBoleta,
        numero_referencia: numReferencia,
        fecha_pago: new Date().toISOString()
      }]);

      if (errorPago) throw errorPago;

      const nuevoAbonoItem = Number(itemParaAbonar.abonado || 0) + montoNum;
      await supabase.from('presupuesto_items').update({ abonado: nuevoAbonoItem }).eq('id', itemParaAbonar.id);

      const nuevosItems = items.map(i => i.id === itemParaAbonar.id ? { ...i, abonado: nuevoAbonoItem } : i);
      setItems(nuevosItems);
      await actualizarGlobalPresupuesto(nuevosItems);
      
      setItemParaAbonar(null);
      setMontoAbono('');
      setNumBoleta('');
      setNumReferencia('');
      toast.success("Abono registrado");
      window.dispatchEvent(new CustomEvent('presupuestoActualizado'));

    } catch (e: any) { 
      toast.error("Error: " + e.message); 
    } finally { 
      setGuardandoAbono(false); 
    }
  }

  const eliminarItem = async (itemId: string) => {
    if(!confirm("¿Eliminar tratamiento?")) return;
    const { error } = await supabase.from('presupuesto_items').delete().eq('id', itemId);
    if (!error) {
      const nuevosItems = items.filter(i => i.id !== itemId);
      setItems(nuevosItems);
      actualizarGlobalPresupuesto(nuevosItems);
      toast.success("Item eliminado");
    }
  }

  const cambiarEstadoCara = (piezaId: number, cara: string) => {
    const d = dentadura[piezaId] || {};
    const estados = ['sano', 'caries', 'restauracion'];
    const proximo = estados[(estados.indexOf(d[cara] || 'sano') + 1) % estados.length];
    setDentadura({ ...dentadura, [piezaId]: { ...d, [cara]: proximo } })
  }

  const totalPresupuesto = items.reduce((acc, curr) => acc + (Number(curr.precio_pactado) || 0), 0)
  const normalizarTexto = (texto: string) => String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

  if (cargando) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex relative font-sans text-slate-900 pb-20">
      
      {/* MODAL ASIGNAR ICONO */}
      <AnimatePresence>
        {tratamientoParaMapear && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[10002] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl">
              <h3 className="text-2xl font-black uppercase italic mb-6">Asignar Icono Clínico</h3>
              <div className="grid grid-cols-2 gap-3">
                {ICONOS_DISPONIBLES.map(ico => (
                  <button key={ico.id} onClick={() => guardarIconoYAgregar(ico.id)} className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all font-bold text-[10px] uppercase border border-slate-100 group">
                    <CheckCircle2 size={14} className="text-blue-500 group-hover:text-white"/> {ico.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setTratamientoParaMapear(null)} className="w-full mt-6 py-4 text-slate-400 font-black text-[10px] uppercase hover:text-red-500 transition-colors">Cancelar</button>
            </motion.div>
          </div>
        )}

        {/* MODAL ABONO */}
        {itemParaAbonar && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black uppercase italic text-slate-800">Registrar Abono</h3>
                <button onClick={() => setItemParaAbonar(null)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-2xl">$</span>
                  <input type="number" value={montoAbono} onChange={(e) => setMontoAbono(e.target.value)} placeholder="0" className="w-full p-5 pl-12 bg-slate-50 rounded-2xl text-2xl font-black outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {METODOS_PAGO.map(m => (
                        <button key={m.id} onClick={() => setMetodoSeleccionado(m.id)} className={`p-3 rounded-xl border-2 font-black text-[9px] uppercase flex items-center gap-2 ${metodoSeleccionado === m.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                          {m.icon} {m.label}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={numBoleta} onChange={(e) => setNumBoleta(e.target.value)} placeholder="N° Boleta" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold" />
                  <input type="text" value={numReferencia} onChange={(e) => setNumReferencia(e.target.value)} placeholder="Referencia" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold" />
                </div>
                <button onClick={guardarAbono} disabled={guardandoAbono} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase">
                    {guardandoAbono ? <Loader2 className="animate-spin" size={16}/> : 'Confirmar Abono'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={`flex-1 p-10 transition-all ${dienteSeleccionado ? 'ml-[450px] blur-md' : ''}`}>
        <div className="max-w-5xl mx-auto space-y-10 pt-4">
          <Link href={`/pacientes/${pacienteId}`} className="flex items-center gap-2 font-black text-[10px] text-slate-400 uppercase hover:text-blue-600"><ChevronLeft size={14}/> Volver al Perfil</Link>

          <section className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col items-center gap-10">
            <div className="flex gap-4">
              <div className="flex gap-2 border-r-4 border-slate-50 pr-4">{c1.map(pid => <DienteVisual key={pid} id={pid} datos={dentadura[pid]} itemsDiente={items.filter(i => i.diente_id === pid)} onSelect={() => setDienteSeleccionado(pid)} onClickCara={cambiarEstadoCara} />)}</div>
              <div className="flex gap-2">{c2.map(pid => <DienteVisual key={pid} id={pid} datos={dentadura[pid]} itemsDiente={items.filter(i => i.diente_id === pid)} onSelect={() => setDienteSeleccionado(pid)} onClickCara={cambiarEstadoCara} />)}</div>
            </div>
            <div className="flex gap-4">
              <div className="flex gap-2 border-r-4 border-slate-50 pr-4">{c3.map(pid => <DienteVisual key={pid} id={pid} datos={dentadura[pid]} itemsDiente={items.filter(i => i.diente_id === pid)} onSelect={() => setDienteSeleccionado(pid)} onClickCara={cambiarEstadoCara} invert />)}</div>
              <div className="flex gap-2">{c4.map(pid => <DienteVisual key={pid} id={pid} datos={dentadura[pid]} itemsDiente={items.filter(i => i.diente_id === pid)} onSelect={() => setDienteSeleccionado(pid)} onClickCara={cambiarEstadoCara} invert />)}</div>
            </div>
          </section>

          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3"><Stethoscope className="text-blue-400"/> Tratamientos Seleccionados</h4>
                <span className="text-4xl font-black text-emerald-400">${totalPresupuesto.toLocaleString('es-CL')}</span>
             </div>
             <table className="w-full text-left">
               <tbody className="divide-y divide-slate-50">
                 {items.map((item) => (
                   <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                     <td className="px-10 py-6">
                        <div className="flex items-center">
                            <span className="px-3 py-2 bg-slate-100 rounded-xl text-[12px] font-black mr-4 text-slate-600">{item.diente_id || 'Gral'}</span>
                            <div>
                                <span className="text-[13px] font-black uppercase italic text-slate-700">{item.prestaciones?.["Nombre Accion"]}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Dr. {item.profesionales?.nombre} {item.profesionales?.apellido}</p>
                                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                  <p className="text-[9px] font-bold text-emerald-600 uppercase">Abonado: ${Number(item.abonado || 0).toLocaleString('es-CL')}</p>
                                </div>
                            </div>
                        </div>
                     </td>
                     <td className="px-6 py-6 text-right font-black text-slate-800">${Number(item.precio_pactado).toLocaleString('es-CL')}</td>
                     <td className="px-10 py-6 text-right flex gap-2 justify-end">
                        <button onClick={() => { setItemParaAbonar(item); setMontoAbono(''); }} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all">Abonar</button>
                        <button onClick={() => eliminarItem(item.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {dienteSeleccionado && (
          <motion.aside initial={{ x: -450 }} animate={{ x: 0 }} exit={{ x: -450 }} className="fixed top-0 left-0 h-screen w-[450px] bg-white shadow-2xl z-[9999] flex flex-col border-r border-slate-100">
            <div className="pt-24 pb-8 px-8 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-black uppercase italic">Pieza {dienteSeleccionado}</h3>
              <button onClick={() => setDienteSeleccionado(null)} className="p-2 hover:bg-red-500 rounded-lg"><X size={24}/></button>
            </div>
            
            {/* SELECTOR DE ESPECIALISTA */}
            <div className="p-4 bg-blue-50 border-b">
              <label className="text-[9px] font-black uppercase text-blue-600 block mb-2 flex items-center gap-2"><User size={12}/> Profesional Responsable</label>
              <select 
                className="w-full p-3 rounded-xl border-2 border-blue-100 font-bold text-xs outline-none focus:border-blue-500"
                value={profesionalAsignado}
                onChange={(e) => setProfesionalAsignado(e.target.value)}
              >
                <option value="">Seleccionar Doctor...</option>
                {listaProfesionales.map(pro => (
                  <option key={pro.user_id} value={pro.user_id}>Dr. {pro.nombre} {pro.apellido}</option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-slate-50 border-b"><input type="text" placeholder="Buscar prestación..." className="w-full p-4 rounded-2xl font-bold text-sm outline-none" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
            <div className="flex-1 overflow-y-auto p-2">
               {Object.keys(secciones).sort().map(cat => {
                 const filtrados = secciones[cat].filter(p => normalizarTexto(p["Nombre Accion"]).includes(normalizarTexto(busqueda)));
                 if (busqueda && filtrados.length === 0) return null;
                 const isOpen = categoriasAbiertas[cat] || busqueda.length > 0;
                 return (
                   <div key={cat} className="mb-2">
                     <button onClick={() => setCategoriasAbiertas(prev => ({...prev, [cat]: !prev[cat]}))} className="w-full flex justify-between p-4 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase">
                       {cat} {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                     </button>
                     {isOpen && (
                       <div className="p-2 space-y-1">
                         {filtrados.map(p => (
                           <button key={p.id} onClick={() => handleSeleccionarTratamiento(p)} className="w-full text-left p-4 bg-white border border-slate-50 rounded-xl hover:border-blue-400 transition-all">
                             <p className="text-xs font-bold uppercase text-slate-700">{p["Nombre Accion"]}</p>
                             <p className="text-[10px] text-emerald-600 font-black mt-1">${Number(p["Precio"]).toLocaleString('es-CL')}</p>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                 )
               })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

function DienteVisual({ id, datos, onSelect, onClickCara, invert = false, itemsDiente = [] }: any) {
  const getClaseCara = (cara: string) => {
    const e = datos?.[cara] || 'sano';
    if (e === 'caries') return 'fill-red-500 stroke-red-700';
    if (e === 'restauracion') return 'fill-blue-500 stroke-blue-700';
    return 'fill-white stroke-slate-200';
  };
  const tiposIconos = itemsDiente.map((i: any) => i.prestaciones?.icono_tipo).filter(Boolean);
  return (
    <div className={`flex flex-col items-center gap-2 transition-all hover:scale-110 ${invert ? 'flex-col-reverse' : ''}`}>
      <span className="text-[10px] font-black text-slate-300">{id}</span>
      <div onClick={onSelect} className={`relative w-14 h-16 flex items-center justify-center rounded-2xl border-2 cursor-pointer transition-all ${tiposIconos.length > 0 ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-slate-100'}`}>
        <svg viewBox="0 0 100 100" className={`w-10 h-12 ${invert ? 'rotate-180' : ''}`}>
           <path d="M25,20 L75,20 L80,85 Q80,95 50,95 Q20,95 20,85 Z" fill={tiposIconos.includes('corona') ? "#fbbf24" : "white"} fillOpacity={tiposIconos.includes('corona') ? "0.3" : "1"} stroke={tiposIconos.length > 0 ? "#3b82f6" : "#cbd5e1"} strokeWidth="5"/>
           {tiposIconos.includes('endodoncia') && <path d="M45,25 Q50,50 45,85" stroke="#ef4444" strokeWidth="8" fill="none" />}
           {tiposIconos.includes('extraccion') && <g stroke="#ef4444" strokeWidth="10"><line x1="20" y1="20" x2="80" y2="90" /><line x1="80" y1="20" x2="20" y2="90" /></g>}
           {tiposIconos.includes('implante') && <rect x="40" y="55" width="20" height="35" rx="2" fill="#64748b" />}
        </svg>
      </div>
      <div className="bg-white p-1 rounded-lg border border-slate-100 flex">
        <svg width="32" height="32" viewBox="0 0 100 100" className="cursor-pointer">
          <path d="M10,10 L90,10 L70,30 L30,30 Z" className={getClaseCara('top')} onClick={(e) => { e.stopPropagation(); onClickCara(id, 'top'); }} />
          <path d="M10,90 L90,90 L70,70 L30,70 Z" className={getClaseCara('bottom')} onClick={(e) => { e.stopPropagation(); onClickCara(id, 'bottom'); }} />
          <path d="M10,10 L30,30 L30,70 L10,90 Z" className={getClaseCara('left')} onClick={(e) => { e.stopPropagation(); onClickCara(id, 'left'); }} />
          <path d="M90,10 L70,30 L70,70 L90,90 Z" className={getClaseCara('right')} onClick={(e) => { e.stopPropagation(); onClickCara(id, 'right'); }} />
          <path d="M30,30 L70,30 L70,70 L30,70 Z" className={getClaseCara('center')} onClick={(e) => { e.stopPropagation(); onClickCara(id, 'center'); }} />
        </svg>
      </div>
    </div>
  )
}