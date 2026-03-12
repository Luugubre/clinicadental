'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { 
  User, ClipboardList, Plus, Save, X, Activity, Image as ImageIcon, Loader2, 
  DollarSign, Trash2, FileText, ArrowLeft, Stethoscope, AlertTriangle, 
  Pencil, HeartPulse, Camera, Wallet
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// Constantes FDI
const c1 = [18, 17, 16, 15, 14, 13, 12, 11];
const c2 = [21, 22, 23, 24, 25, 26, 27, 28];
const c3 = [48, 47, 46, 45, 44, 43, 42, 41];
const c4 = [31, 32, 33, 34, 35, 36, 37, 38];

export default function FichaPaciente() {
  const { id } = useParams()
  const [paciente, setPaciente] = useState<any>(null)
  const [evoluciones, setEvoluciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [tabActiva, setTabActiva] = useState('ficha') 

  const [dentadura, setDentadura] = useState<Record<number, any>>({})
  const [guardandoOdontograma, setGuardandoOdontograma] = useState(false)
  const [archivos, setArchivos] = useState<any[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [prestacionesDisp, setPrestacionesDisp] = useState<any[]>([])
  const [itemsPresupuesto, setItemsPresupuesto] = useState<any[]>([])
  const [totalPresupuesto, setTotalPresupuesto] = useState(0)
  const [guardandoPresupuesto, setGuardandoPresupuesto] = useState(false)
  const [totalAbonado, setTotalAbonado] = useState(0)
  
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false)
  const [nuevoPago, setNuevoPago] = useState({ monto: 0, metodo: 'Transferencia', comentario: '' })
  
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nuevaEv, setNuevaEv] = useState({ descripcion_procedimiento: '', observaciones: '', monto_cobrado: 0 })

  const [anamnesis, setAnamnesis] = useState<any>({ enfermedades_sistemicas: '', alergias_criticas: '', medicamentos_actuales: '' })

  useEffect(() => { if (id) fetchInitialData() }, [id])

  async function fetchInitialData() {
    const { data: prestData } = await supabase.from('prestaciones').select('*').order('nombre', { ascending: true })
    setPrestacionesDisp(prestData || [])
    const { data: pData } = await supabase.from('pacientes').select('*').eq('id', id).single()
    setPaciente(pData)
    const { data: eData } = await supabase.from('evoluciones').select('*').eq('paciente_id', id).order('fecha_registro', { ascending: false })
    setEvoluciones(eData || [])
    const { data: oData } = await supabase.from('odontogramas').select('dentadura').eq('paciente_id', id).maybeSingle()
    if (oData) setDentadura(oData.dentadura)
    const { data: anaData } = await supabase.from('anamnesis').select('*').eq('paciente_id', id).maybeSingle()
    if (anaData) setAnamnesis(anaData)
    
    const { data: preData } = await supabase.from('presupuestos').select(`*, presupuesto_items(*)`).eq('paciente_id', id).eq('estado', 'borrador').maybeSingle()
    if (preData && preData.presupuesto_items) {
      const mapeados = preData.presupuesto_items.map((it: any) => {
        const prestInfo = (prestData || []).find(p => p.id === it.prestacion_id)
        return { ...prestInfo, diente: it.diente_id || '', precio_pactado: it.precio_pactado }
      })
      setItemsPresupuesto(mapeados); setTotalPresupuesto(Number(preData.total))
    }
    fetchArchivos(); fetchPagos(); setCargando(false)
  }

  // --- FUNCIONES CORREGIDAS ---
  const guardarEvolucion = async () => {
    if (!nuevaEv.descripcion_procedimiento) return alert("Escribe el procedimiento");
    try {
      const { error } = await supabase.from('evoluciones').insert([{ 
        paciente_id: id,
        descripcion_procedimiento: nuevaEv.descripcion_procedimiento,
        observaciones: nuevaEv.observaciones,
        monto_cobrado: nuevaEv.monto_cobrado
      }])
      
      if (error) throw error;
      
      setModalAbierto(false);
      setNuevaEv({ descripcion_procedimiento: '', observaciones: '', monto_cobrado: 0 });
      alert("Registro clínico guardado");
      fetchInitialData();
    } catch (e: any) {
      alert("Error al guardar: " + e.message);
    }
  }

  const generarPDFPresupuesto = () => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.text("PRESUPUESTO DENTAL", 105, 20, { align: 'center' });
    const tableRows = itemsPresupuesto.map(it => [it.nombre, it.diente || 'N/A', `$${Number(it.precio_pactado || it.precio_base).toLocaleString('es-CL')}`]);
    autoTable(doc, { startY: 55, head: [['Procedimiento', 'Pieza', 'Valor']], body: tableRows });
    doc.save(`Presupuesto_${paciente.apellido}.pdf`);
  };

  const cambiarEstadoCara = (piezaId: number, cara: string) => {
    const d = dentadura[piezaId] || {}; const s = ['sano', 'caries', 'restauracion'];
    const next = s[(s.indexOf(d[cara] || 'sano') + 1) % s.length];
    setDentadura({ ...dentadura, [piezaId]: { ...d, [cara]: next } })
  }

  const cambiarEstadoGeneral = (piezaId: number) => {
    const d = dentadura[piezaId] || {};
    const proximo = d.estado_general === 'ausente' ? 'presente' : 'ausente';
    setDentadura({ ...dentadura, [piezaId]: { ...d, estado_general: proximo } });
  }

  const guardarOdontograma = async () => {
    setGuardandoOdontograma(true)
    await supabase.from('odontogramas').upsert({ paciente_id: id, dentadura: dentadura, ultima_actualizacion: new Date() }, { onConflict: 'paciente_id' })
    alert("Mapa dental guardado"); setGuardandoOdontograma(false)
  }

  const fetchPagos = async () => {
    const { data } = await supabase.from('pagos').select('*').eq('paciente_id', id).order('fecha_pago', { ascending: false })
    setTotalAbonado(data?.reduce((acc, curr) => acc + Number(curr.monto), 0) || 0)
  }

  const registrarPago = async () => {
    try {
      const { error } = await supabase.from('pagos').insert([{ paciente_id: id, monto: nuevoPago.monto, metodo_pago: nuevoPago.metodo, comentario: nuevoPago.comentario }])
      if (error) throw error;
      setModalPagoAbierto(false); 
      setNuevoPago({ monto: 0, metodo: 'Transferencia', comentario: '' });
      fetchPagos();
    } catch (e: any) {
      alert("Error al registrar pago: " + e.message);
    }
  }

  const agregarAlPresupuesto = (pId: string) => {
    const p = prestacionesDisp.find(item => item.id === pId)
    if (p) { setItemsPresupuesto([...itemsPresupuesto, { ...p, diente: '', precio_pactado: p.precio_base }]); setTotalPresupuesto(prev => prev + Number(p.precio_base)) }
  }

  const eliminarDelPresupuesto = (index: number) => {
    const item = itemsPresupuesto[index]; setTotalPresupuesto(totalPresupuesto - Number(item.precio_pactado || item.precio_base))
    setItemsPresupuesto(itemsPresupuesto.filter((_, i) => i !== index))
  }

  const guardarPresupuestoDB = async () => {
    if (itemsPresupuesto.length === 0) return alert("Añade prestaciones");
    setGuardandoPresupuesto(true)
    try {
      const { data: existente } = await supabase.from('presupuestos').select('id').eq('paciente_id', id).eq('estado', 'borrador').maybeSingle();
      let presuId;
      if (existente) {
        await supabase.from('presupuestos').update({ total: totalPresupuesto }).eq('id', existente.id);
        presuId = existente.id;
      } else {
        const { data: nuevo } = await supabase.from('presupuestos').insert({ paciente_id: id, total: totalPresupuesto, estado: 'borrador' }).select().single();
        presuId = nuevo.id;
      }
      await supabase.from('presupuesto_items').delete().eq('presupuesto_id', presuId)
      await supabase.from('presupuesto_items').insert(itemsPresupuesto.map(it => ({ 
        presupuesto_id: presuId, 
        prestacion_id: it.id, 
        diente_id: it.diente ? parseInt(it.diente) : null, 
        precio_pactado: it.precio_pactado || it.precio_base 
      })))
      alert("¡Presupuesto guardado!")
    } catch (err) { alert("Error al guardar presupuesto") }
    setGuardandoPresupuesto(false)
  }

  const fetchArchivos = async () => {
    const { data } = await supabase.from('archivos_pacientes').select('*').eq('paciente_id', id).order('fecha_subida', { ascending: false })
    setArchivos(data || [])
  }

  const subirArchivo = async (e: any) => {
    setSubiendo(true); const file = e.target.files[0]; const path = `${id}/${Math.random()}.${file.name.split('.').pop()}`
    await supabase.storage.from('radiografias').upload(path, file)
    const { data: { publicUrl } } = supabase.storage.from('radiografias').getPublicUrl(path)
    await supabase.from('archivos_pacientes').insert([{ paciente_id: id, url_archivo: publicUrl, nombre_archivo: file.name, tipo_archivo: 'foto' }])
    fetchArchivos(); setSubiendo(false);
  }

  if (cargando) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>

  return (
    <main className="max-w-[1600px] mx-auto bg-slate-50 min-h-screen text-slate-900 flex flex-col">
      
      {/* HEADER DASHBOARD */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[100] px-8 py-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl shadow-blue-100"><User size={32} /></div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">{paciente.nombre} {paciente.apellido}</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{paciente.rut} • {paciente.prevision}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-2xl flex border border-slate-200">
              <TabButton active={tabActiva === 'ficha'} onClick={() => setTabActiva('ficha')} icon={<ClipboardList size={18}/>} label="Ficha" />
              <TabButton active={tabActiva === 'presupuesto'} onClick={() => setTabActiva('presupuesto')} icon={<Wallet size={18}/>} label="Plan" />
              <TabButton active={tabActiva === 'odontograma'} onClick={() => setTabActiva('odontograma')} icon={<Activity size={18}/>} label="Odonto" />
              <TabButton active={tabActiva === 'archivos'} onClick={() => setTabActiva('archivos')} icon={<Camera size={18}/>} label="Imágenes" />
            </div>
            <Link href="/" className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-slate-900 transition-all"><ArrowLeft size={20}/></Link>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR */}
        <aside className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h4 className="font-black text-xs uppercase text-slate-400 mb-4 tracking-widest">Anamnesis</h4>
            <div className="space-y-4">
              <SidebarItem label="Alergias" value={anamnesis.alergias_criticas} alert={anamnesis.alergias_criticas} />
              <SidebarItem label="Enfermedades" value={anamnesis.enfermedades_sistemicas} />
            </div>
          </section>

          <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl">
             <p className="text-[10px] font-black uppercase text-blue-400 mb-4 tracking-widest">Estado Financiero</p>
             <div className="space-y-4">
                <div><p className="text-[9px] font-bold text-slate-500 uppercase">Total</p><p className="text-2xl font-black">${totalPresupuesto.toLocaleString()}</p></div>
                <div><p className="text-[9px] font-bold text-slate-500 uppercase">Abonado</p><p className="text-2xl font-black text-emerald-400">${totalAbonado.toLocaleString()}</p></div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Saldo</p>
                  <p className="text-3xl font-black text-red-400">${(totalPresupuesto - totalAbonado).toLocaleString()}</p>
                </div>
             </div>
          </section>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {tabActiva === 'ficha' && (
              <motion.div key="ficha" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-6">
                <div className="flex justify-between items-center"><h3 className="text-2xl font-black tracking-tight">Evoluciones</h3><button onClick={() => setModalAbierto(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-100">+ Nueva Evolución</button></div>
                <div className="space-y-4">
                  {evoluciones.map(ev => (
                    <div key={ev.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex gap-6">
                      <div className="flex flex-col items-center gap-2"><div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-blue-600 border border-slate-100 shadow-inner"><Stethoscope size={20}/></div><div className="h-full w-0.5 bg-slate-100"></div></div>
                      <div className="flex-1"><p className="text-xs font-black text-slate-400 mb-1">{new Date(ev.fecha_registro).toLocaleDateString('es-CL')}</p><h4 className="text-lg font-black text-slate-800 mb-2">{ev.descripcion_procedimiento}</h4><p className="text-sm text-slate-500 italic">"{ev.observaciones}"</p></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {tabActiva === 'presupuesto' && (
              <motion.div key="presu" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black tracking-tight flex items-center gap-3"><DollarSign size={24}/> Plan de Tratamiento</h3>
                   <div className="flex gap-2">
                     <button onClick={generarPDFPresupuesto} className="p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all"><FileText size={20}/></button>
                     <button onClick={() => setModalPagoAbierto(true)} className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-sm">Abonar</button>
                     <button onClick={guardarPresupuestoDB} disabled={guardandoPresupuesto} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">
                        {guardandoPresupuesto ? <Loader2 className="animate-spin" size={14}/> : 'Guardar'}
                     </button>
                   </div>
                </div>
                <select className="w-full p-5 bg-slate-50 rounded-2xl mb-8 font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all shadow-inner" onChange={(e) => agregarAlPresupuesto(e.target.value)} value="">
                  <option value="">Añadir prestación...</option>
                  {prestacionesDisp.map(p => <option key={p.id} value={p.id}>{p.nombre} — ${Number(p.precio_base).toLocaleString()}</option>)}
                </select>
                <div className="space-y-3">
                  {itemsPresupuesto.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                      <div className="flex items-center gap-5"><span className="bg-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-blue-600 shadow-sm border border-slate-100">{item.diente || '—'}</span><div><p className="font-black text-slate-800">{item.nombre}</p></div></div>
                      <div className="flex items-center gap-8"><p className="font-black text-slate-900 text-lg">${Number(item.precio_pactado || item.precio_base).toLocaleString()}</p><button onClick={() => eliminarDelPresupuesto(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {tabActiva === 'odontograma' && (
              <motion.div key="odonto" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-2xl font-black tracking-tight flex items-center gap-3"><Activity size={24}/> Odontograma FDI</h3>
                   <div className="flex gap-4 items-center">
                      <div className="flex gap-4 bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100">
                        <LegendItem color="bg-white border-2 border-slate-200" label="Sano" />
                        <LegendItem color="bg-red-500 shadow-sm" label="Caries" />
                        <LegendItem color="bg-blue-500 shadow-sm" label="Tratado" />
                      </div>
                      <button onClick={guardarOdontograma} disabled={guardandoOdontograma} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-black transition-all">
                        {guardandoOdontograma ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} Guardar
                      </button>
                   </div>
                </div>
                <div className="bg-slate-50/30 p-10 rounded-[3rem] border-2 border-slate-100 overflow-x-auto">
                   <div className="min-w-[950px] flex flex-col gap-14 items-center">
                      <div className="flex justify-center items-end gap-1">
                        <div className="flex gap-1 border-r-4 border-slate-100 pr-4">{c1.map(pid => <DienteHibrido key={pid} id={pid} datos={dentadura[pid]} onClickCara={(cara:string)=>cambiarEstadoCara(pid, cara)} onDienteClick={cambiarEstadoGeneral} superior />)}</div>
                        <div className="flex gap-1 pl-4">{c2.map(pid => <DienteHibrido key={pid} id={pid} datos={dentadura[pid]} onClickCara={(cara:string)=>cambiarEstadoCara(pid, cara)} onDienteClick={cambiarEstadoGeneral} superior />)}</div>
                      </div>
                      <div className="flex items-center w-full gap-4"><div className="h-px bg-slate-200 flex-1"></div><span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">Línea Oclusal</span><div className="h-px bg-slate-200 flex-1"></div></div>
                      <div className="flex justify-center items-start gap-1">
                        <div className="flex gap-1 border-r-4 border-slate-100 pr-4">{c3.map(pid => <DienteHibrido key={pid} id={pid} datos={dentadura[pid]} onClickCara={(cara:string)=>cambiarEstadoCara(pid, cara)} onDienteClick={cambiarEstadoGeneral} superior={false} />)}</div>
                        <div className="flex gap-1 pl-4">{c4.map(pid => <DienteHibrido key={pid} id={pid} datos={dentadura[pid]} onClickCara={(cara:string)=>cambiarEstadoCara(pid, cara)} onDienteClick={cambiarEstadoGeneral} superior={false} />)}</div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {tabActiva === 'archivos' && (
              <motion.div key="fotos" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black tracking-tight flex items-center gap-3"><Camera size={24}/> Galería Clínica</h3>
                   <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-blue-700 transition-all"><ImageIcon size={16}/>{subiendo ? 'Subiendo...' : 'Subir Imagen'}<input type="file" className="hidden" onChange={subirArchivo} accept="image/*" /></label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {archivos.map(arc => <a key={arc.id} href={arc.url_archivo} target="_blank" className="group relative aspect-square rounded-[2.5rem] overflow-hidden border-4 border-white shadow-md hover:shadow-xl transition-all hover:-translate-y-1"><img src={arc.url_archivo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></a>)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MODALES */}
      <AnimatePresence>
        {modalAbierto && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl">
              <h2 className="text-3xl font-black tracking-tighter mb-8">Nueva Evolución</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Procedimiento realizado..." className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none shadow-inner" value={nuevaEv.descripcion_procedimiento} onChange={(e) => setNuevaEv({...nuevaEv, descripcion_procedimiento: e.target.value})} />
                <textarea rows={4} placeholder="Observaciones detalladas..." className="w-full p-5 bg-slate-50 rounded-2xl font-medium outline-none border-2 border-transparent focus:border-blue-500 shadow-inner" value={nuevaEv.observaciones} onChange={(e) => setNuevaEv({...nuevaEv, observaciones: e.target.value})} />
                <button onClick={guardarEvolucion} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl shadow-xl hover:bg-blue-700 transition-all">Guardar</button>
                <button onClick={() => setModalAbierto(false)} className="w-full text-slate-400 font-bold mt-4 text-sm uppercase tracking-widest text-center">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}

        {modalPagoAbierto && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl text-center">
              <h2 className="text-3xl font-black tracking-tighter mb-8">Abonar</h2>
              <input type="number" className="w-full bg-slate-50 p-6 rounded-3xl text-4xl font-black text-center mb-6 outline-none focus:ring-4 ring-emerald-100" value={nuevoPago.monto} onChange={(e) => setNuevoPago({...nuevoPago, monto: Number(e.target.value)})} />
              <div className="grid grid-cols-2 gap-2 mb-8">{['Transferencia', 'Efectivo', 'Débito', 'Crédito'].map(m => <button key={m} onClick={() => setNuevoPago({...nuevoPago, metodo: m})} className={`py-3 rounded-xl font-bold text-xs ${nuevoPago.metodo === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{m}</button>)}</div>
              <button onClick={registrarPago} className="w-full bg-emerald-500 text-white py-6 rounded-3xl font-black text-xl shadow-xl hover:bg-emerald-600 transition-all">Confirmar Pago</button>
              <button onClick={() => setModalPagoAbierto(false)} className="w-full text-slate-400 font-bold mt-6 uppercase text-sm tracking-widest text-center text-center">Cerrar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

// COMPONENTES AUXILIARES
function DienteHibrido({ id, datos, onClickCara, onDienteClick, superior = false }: any) {
  const estadoDiente = datos?.estado_general || 'presente';
  const getClase = (cara: string) => {
    if (estadoDiente === 'ausente') return 'fill-slate-100 stroke-slate-200 opacity-10';
    const e = datos?.[cara] || 'sano';
    if (e === 'caries') return 'fill-red-500 stroke-red-700';
    if (e === 'restauracion') return 'fill-blue-500 stroke-blue-700';
    return 'fill-white stroke-slate-300';
  };
  return (
    <div className={`flex flex-col items-center gap-2 group relative ${superior ? 'flex-col' : 'flex-col-reverse'}`}>
      <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 font-mono transition-colors">{id}</span>
      <div className={`relative w-12 h-16 flex items-center justify-center transition-all ${estadoDiente === 'ausente' ? 'grayscale opacity-10' : 'hover:scale-110'} ${!superior ? 'rotate-180' : ''}`}>
        <img src={`/dientes/${id}.png`} alt={`Diente ${id}`} className="w-full h-full object-contain pointer-events-none" onError={(e:any) => e.target.style.display = 'none'} />
        <button onClick={() => onDienteClick(id)} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white p-1 rounded-full shadow-lg z-10"><X size={8} /></button>
      </div>
      <div className={`relative transition-all ${estadoDiente === 'ausente' ? 'opacity-20' : ''}`}>
        <svg width="40" height="40" viewBox="0 0 45 45" className="cursor-pointer transition-transform active:scale-95 drop-shadow-sm">
          <polygon points="0,0 45,0 35,10 10,10" className={`${getClase('top')} transition-all hover:brightness-90`} onClick={() => onClickCara('top')} />
          <polygon points="0,45 45,45 35,35 10,35" className={`${getClase('bottom')} transition-all hover:brightness-90`} onClick={() => onClickCara('bottom')} />
          <polygon points="0,0 10,10 10,35 0,45" className={`${getClase('left')} transition-all hover:brightness-90`} onClick={() => onClickCara('left')} />
          <polygon points="45,0 35,10 35,35 45,45" className={`${getClase('right')} transition-all hover:brightness-90`} onClick={() => onClickCara('right')} />
          <rect x="10" y="10" width="25" height="25" className={`${getClase('center')} transition-all hover:brightness-90`} onClick={() => onClickCara('center')} />
          {estadoDiente === 'ausente' && (<g className="stroke-red-400 stroke-[2px] opacity-60"><line x1="0" y1="0" x2="45" y2="45" /><line x1="45" y1="0" x2="0" y2="45" /></g>)}
        </svg>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-tight transition-all ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
      {icon} {label}
    </button>
  )
}

function SidebarItem({ label, value, alert = false }: any) {
  return (
    <div className={`p-4 rounded-2xl border-l-4 ${alert ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-200'}`}>
      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">{label}</label>
      <p className={`text-xs font-bold ${alert ? 'text-red-700' : 'text-slate-800'}`}>{value || 'No registra'}</p>
    </div>
  )
}

function LegendItem({ color, label }: any) {
  return <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${color}`}></div><span className="text-[10px] font-black text-slate-400 uppercase">{label}</span></div>
}