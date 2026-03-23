'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  X, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar as CalendarIcon, 
  CheckCircle2, Loader2, Clock, Stethoscope, CalendarDays, Timer, UserPlus, Edit3, AlertTriangle, 
  Info, ListChecks, Mail, ArrowDown, MessageCircle, Trash2 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner' 

export default function AgendaPage() {
  // --- ESTADOS VISTA PRINCIPAL ---
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [citasDia, setCitasDia] = useState<any[]>([])
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [especialidades, setEspecialidades] = useState<any[]>([])
  const [cargandoPagina, setCargandoPagina] = useState(true)

  // --- ESTADOS MODAL ---
  const [modalAbierto, setModalAbierto] = useState(false)
  const [paso, setPaso] = useState(1) 
  const [semanaInicio, setSemanaInicio] = useState(new Date())
  const [filtro, setFiltro] = useState({ especialidad: 'Todas', profesional_id: '', box_id: 1, duracionDefault: 15 })
  const [horasSeleccionadas, setHorasSeleccionadas] = useState<{fecha: string, hora: string, duracion: number}[]>([])
  const [horariosConfigurados, setHorariosConfigurados] = useState<any[]>([])
  const [citasSemana, setCitasSemana] = useState<any[]>([])
  const [citaEditando, setCitaEditando] = useState<any>(null)
  const [errorColision, setErrorColision] = useState<string | null>(null)

  // --- ESTADOS PACIENTE ---
  const [modoNuevoPaciente, setModoNuevoPaciente] = useState(false)
  const [nuevoPaciente, setNuevoPaciente] = useState({ nombre: '', apellido: '', rut: '', telefono: '', email: '', fecha_nacimiento: '' })
  const [busqueda, setBusqueda] = useState('')
  const [pacientesEncontrados, setPacientesEncontrados] = useState<any[]>([])
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null)
  const [buscando, setBuscando] = useState(false)
  const [cargandoAccion, setCargandoAccion] = useState(false)

  // --- ESTADOS TRATAMIENTOS ---
  const [tratamientosPaciente, setTratamientosPaciente] = useState<any[]>([])
  const [tratamientoSeleccionado, setTratamientoSeleccionado] = useState<string | null>(null)
  const [nuevoTratamientoNombre, setNuevoTratamientoNombre] = useState('')
  const [creandoNuevoTratamiento, setCreandoNuevoTratamiento] = useState(false)

  // 1. CARGA INICIAL
  useEffect(() => {
    const cargarBasicos = async () => {
      try {
        const { data: esp } = await supabase.from('especialidades').select('*')
        const { data: pro } = await supabase.from('profesionales').select('*, especialidades(nombre)')
        setEspecialidades(esp || [])
        setProfesionales(pro || [])
        if (pro?.length) setFiltro(prev => ({ ...prev, profesional_id: pro[0].user_id }))
      } catch (error) { toast.error("Error al cargar datos básicos") }
      finally { setCargandoPagina(false) }
    }
    cargarBasicos()
  }, [])

  useEffect(() => { fetchCitasDia() }, [selectedDate])

  useEffect(() => {
    if (modalAbierto && filtro.profesional_id) { fetchCitasSemana(); fetchHorariosDoctor(); }
  }, [semanaInicio, modalAbierto, filtro.profesional_id])

  useEffect(() => {
    if (paso === 2 && busqueda.length === 0 && !modoNuevoPaciente) {
      buscarPacientes("");
    }
  }, [paso, modoNuevoPaciente]);

  // 2. FUNCIONES DE CARGA
  const fetchCitasDia = async () => {
    const f = selectedDate.toLocaleDateString('sv-SE');
    const { data } = await supabase.from('citas').select('*, pacientes(*)').gte('inicio', `${f}T00:00:00`).lte('inicio', `${f}T23:59:59`).order('inicio', { ascending: true })
    setCitasDia(data || [])
  }

  const fetchCitasSemana = async () => {
    const dias = getDiasLunesSabado()
    const { data } = await supabase.from('citas').select('*').gte('inicio', dias[0].toLocaleDateString('sv-SE') + 'T00:00:00').lte('inicio', dias[5].toLocaleDateString('sv-SE') + 'T23:59:59').eq('profesional_id', filtro.profesional_id)
    setCitasSemana(data || [])
  }

  const fetchHorariosDoctor = async () => {
    const { data } = await supabase.from('disponibilidad_profesional').select('*').eq('profesional_id', filtro.profesional_id)
    setHorariosConfigurados(data || [])
  }

  const buscarPacientes = async (term: string) => {
    setBuscando(true);
    let query = supabase.from('pacientes').select('*').limit(10);
    if (term.trim().length > 0) {
      query = query.or(`nombre.ilike.%${term}%,apellido.ilike.%${term}%,rut.ilike.%${term}%`);
    } else {
      query = query.order('created_at', { ascending: false });
    }
    const { data } = await query;
    setPacientesEncontrados(data || []);
    setBuscando(false);
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      if (!modoNuevoPaciente && paso === 2 && busqueda.length > 0) buscarPacientes(busqueda);
    }, 400);
    return () => clearTimeout(delay);
  }, [busqueda, modoNuevoPaciente]);

  const seleccionarPacienteExistente = async (paciente: any) => {
    setPacienteSeleccionado(paciente);
    setCreandoNuevoTratamiento(false);
    setBuscando(true);
    
    const { data } = await supabase
      .from('presupuestos')
      .select('id, nombre_tratamiento')
      .eq('paciente_id', paciente.id)
      .neq('estado', 'finalizado')
      .order('fecha_creacion', { ascending: false });

    setTratamientosPaciente(data || []);
    if (data && data.length > 0) {
      setTratamientoSeleccionado(data[0].id);
    } else {
      setTratamientoSeleccionado(null);
      setCreandoNuevoTratamiento(true);
    }
    setBuscando(false);
  };

  const handleGuardar = async () => {
    if (!validarChoqueRango()) return
    setCargandoAccion(true)
    try {
      let pId = pacienteSeleccionado?.id
      let tId = tratamientoSeleccionado

      // 1. Crear paciente si es nuevo y OBTENER ID REAL
      if (modoNuevoPaciente) {
        const { data: pNew, error: pErr } = await supabase
          .from('pacientes')
          .insert([{ 
              nombre: nuevoPaciente.nombre.toUpperCase(), 
              apellido: nuevoPaciente.apellido.toUpperCase(), 
              rut: nuevoPaciente.rut.toUpperCase(),
              telefono: nuevoPaciente.telefono,
              email: nuevoPaciente.email 
          }])
          .select()
          .single() // Esto garantiza que pNew sea el objeto creado directamente

        if (pErr) throw pErr;
        pId = pNew.id; // Asignamos el ID recién creado
      }

      // 2. Crear tratamiento si es nuevo (ahora con el pId correcto)
      if ((creandoNuevoTratamiento || modoNuevoPaciente) && nuevoTratamientoNombre) {
        const { data: tNew, error: tErr } = await supabase
          .from('presupuestos')
          .insert([{
            paciente_id: pId,
            nombre_tratamiento: nuevoTratamientoNombre.toUpperCase(),
            estado: 'borrador',
            especialista_id: filtro.profesional_id 
          }])
          .select()
          .single()

        if (tErr) throw tErr;
        tId = tNew.id;
      }

      // 3. Insertar citas vinculadas
      const nuevas = horasSeleccionadas.map(s => {
        const inicioDate = new Date(`${s.fecha}T${s.hora}:00`);
        const finDate = new Date(inicioDate.getTime() + s.duracion * 60000);
        
        const tratamientoObj = tratamientosPaciente.find(t => t.id === tId);
        const motivoCita = (creandoNuevoTratamiento || modoNuevoPaciente) 
          ? nuevoTratamientoNombre.toUpperCase() 
          : (tratamientoObj?.nombre_tratamiento || 'Consulta');

        return { 
          paciente_id: pId, 
          presupuesto_id: tId, 
          profesional_id: filtro.profesional_id, 
          box_id: filtro.box_id, 
          inicio: `${s.fecha}T${s.hora}:00`, 
          fin: `${s.fecha}T${finDate.toLocaleTimeString('es-CL',{hour12:false, hour:'2-digit', minute:'2-digit'})}:00`, 
          estado: 'programada',
          motivo: motivoCita
        }
      })

      const { error: insError } = await supabase.from('citas').insert(nuevas)
      if (insError) throw insError;

      toast.success("Cita agendada con éxito");
      setModalAbierto(false); fetchCitasDia(); resetEstados();
    } catch (e: any) { 
      console.error(e);
      toast.error("Error al procesar el registro: " + e.message);
    } finally { 
      setCargandoAccion(false);
    }
  }

  const resetEstados = () => {
    setPaso(1); setHorasSeleccionadas([]); setPacienteSeleccionado(null);
    setModoNuevoPaciente(false); setBusqueda(''); setTratamientosPaciente([]); 
    setTratamientoSeleccionado(null); setNuevoTratamientoNombre(''); setCreandoNuevoTratamiento(false);
    setErrorColision(null);
  }

  const getDiasLunesSabado = () => {
    const curr = new Date(semanaInicio); const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    return Array.from({ length: 6 }, (_, i) => new Date(curr.getFullYear(), curr.getMonth(), diff + i))
  }

  const slotsHorarios = useMemo(() => {
    const slots = []; let inicioC = new Date(); inicioC.setHours(8, 30, 0, 0)
    while (inicioC.getHours() < 19 || (inicioC.getHours() === 19 && inicioC.getMinutes() <= 30)) {
      slots.push(inicioC.toLocaleTimeString('es-CL', { hour12: false, hour: '2-digit', minute: '2-digit' })); inicioC.setMinutes(inicioC.getMinutes() + 15)
    }
    return slots
  }, [])

  const estaDisponible = (fecha: string, hora: string) => {
    const diaSemana = new Date(fecha + 'T00:00:00').getDay()
    const enHorario = horariosConfigurados.some(h => h.dia_semana === diaSemana && hora >= h.hora_inicio.substring(0,5) && hora < h.hora_fin.substring(0,5))
    if (!enHorario) return false
    return !citasSemana.some(c => c.inicio.startsWith(fecha) && (hora >= c.inicio.split('T')[1].substring(0,5) && hora < c.fin.split('T')[1].substring(0,5)))
  }

  const toggleHora = (fecha: string, hora: string) => {
    setHorasSeleccionadas(prev => {
      const existe = prev.find(h => h.fecha === fecha && h.hora === hora);
      if (existe) return prev.filter(h => !(h.fecha === fecha && h.hora === hora));
      return [...prev, { fecha, hora, duracion: filtro.duracionDefault }];
    });
  }

  const validarChoqueRango = () => {
    for (const sel of horasSeleccionadas) {
      const inicioNuevo = new Date(`${sel.fecha}T${sel.hora}:00`); const finNuevo = new Date(inicioNuevo.getTime() + sel.duracion * 60000)
      if (citasSemana.some(c => inicioNuevo < new Date(c.fin) && finNuevo > new Date(c.inicio))) {
        toast.error(`El horario ${sel.hora} ya está ocupado`); return false
      }
    }
    return true
  }

  const enviarWhatsApp = async (c: any) => {
    const tel = c.pacientes?.telefono?.replace(/\D/g, ''); if (!tel) return toast.error("Sin teléfono");
    const msg = `Hola ${c.pacientes.nombre}, confirmamos tu cita hoy a las ${c.inicio.split('T')[1].substring(0,5)}.`;
    window.open(`https://api.whatsapp.com/send?phone=56${tel}&text=${encodeURIComponent(msg)}`, '_blank');
    await supabase.from('citas').update({ estado_confirmacion: 'confirmado' }).eq('id', c.id); fetchCitasDia();
  }

  const eliminarCita = async (id: string) => {
    if (window.confirm("¿Eliminar cita?")) { await supabase.from('citas').delete().eq('id', id); fetchCitasDia(); }
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-8">
            <div><h1 className="text-xl font-black uppercase tracking-tighter">Gestión de Agenda</h1><p className="text-blue-600 text-[10px] font-black italic">Clínica Dignidad</p></div>
            <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
              <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate()-1)))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronLeft size={18}/></button>
              <span className="px-6 text-sm font-black capitalize min-w-[200px] text-center">{selectedDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate()+1)))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronRight size={18}/></button>
            </div>
          </div>
          <button onClick={() => { resetEstados(); setModalAbierto(true); }} className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">AGENDAR CITA</button>
        </header>

        <div className="flex-1 p-8 overflow-y-auto space-y-4 bg-slate-50/50">
          {citasDia.map(c => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={c.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group">
              <div className="flex items-center gap-8">
                <div className="bg-slate-50 w-24 h-24 rounded-3xl flex flex-col items-center justify-center border border-slate-100">
                  <span className="text-sm font-black text-blue-600">{c.inicio.split('T')[1].substring(0,5)}</span>
                  <ArrowDown size={14} className="text-slate-300 my-1" strokeWidth={3} />
                  <span className="text-sm font-black text-slate-700">{c.fin.split('T')[1].substring(0,5)}</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase text-lg">{c.pacientes?.nombre} {c.pacientes?.apellido}</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">{c.pacientes?.rut}</p>
                    {c.estado_confirmacion === 'confirmado' && <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100">CONFIRMADO</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => enviarWhatsApp(c)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><MessageCircle size={18} /></button>
                <button onClick={() => eliminarCita(c.id)} className="p-3 bg-red-50 text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-red-600 hover:text-white"><Trash2 size={18}/></button>
                <div className="text-right min-w-[100px]"><span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">{c.estado}</span></div>
              </div>
            </motion.div>
          ))}
          {citasDia.length === 0 && <div className="py-20 text-center text-slate-300 font-bold uppercase text-xs border-2 border-dashed rounded-[3rem]">No hay citas agendadas</div>}
        </div>
      </main>

      <AnimatePresence>
        {modalAbierto && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-7xl h-[calc(100vh-100px)] mt-10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative">
              <button onClick={() => setModalAbierto(false)} className="absolute top-6 right-8 p-4 bg-red-500 text-white rounded-2xl hover:rotate-90 transition-all z-50 shadow-xl"><X size={20} /></button>

              <div className="p-8 border-b bg-white relative">
                <div className="flex items-center gap-6">
                  <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100"><CalendarDays size={24} /></div>
                  <div><h2 className="font-black uppercase text-sm tracking-widest">Paso {paso} de 2</h2><p className="text-[10px] font-bold text-slate-400 uppercase">Gestión de Agenda</p></div>
                  <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button onClick={() => setSemanaInicio(new Date(semanaInicio.setDate(semanaInicio.getDate() - 7)))} className="p-2 bg-white rounded-xl shadow-sm hover:text-blue-600 transition-colors"><ChevronsLeft size={20}/></button>
                    <span className="px-6 text-[11px] font-black uppercase min-w-[180px] text-center">{semanaInicio.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => setSemanaInicio(new Date(semanaInicio.setDate(semanaInicio.getDate() + 7)))} className="p-2 bg-white rounded-xl shadow-sm hover:text-blue-600 transition-colors"><ChevronsRight size={20}/></button>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {paso === 1 ? (
                  <>
                    <aside className="w-80 border-r p-8 space-y-6 bg-slate-50/30 overflow-y-auto">
                      <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-lg shadow-blue-100">
                        <p className="text-[10px] font-black uppercase italic mb-1 opacity-70">Slots seleccionados</p>
                        <p className="text-3xl font-black">{horasSeleccionadas.length}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Especialista</label>
                        <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs shadow-sm outline-none" value={filtro.profesional_id} onChange={(e) => setFiltro({...filtro, profesional_id: e.target.value})}>
                          {profesionales.map(p => <option key={p.id} value={p.user_id}>Dr. {p.nombre} {p.apellido}</option>)}
                        </select>
                      </div>
                    </aside>
                    <main className="flex-1 overflow-y-auto p-6 grid grid-cols-6 gap-3 bg-white">
                      {getDiasLunesSabado().map(dia => {
                        const fStr = dia.toLocaleDateString('sv-SE');
                        return (
                          <div key={fStr} className="space-y-1.5">
                            <p className="text-center text-[10px] font-black uppercase text-slate-400 mb-4">{dia.toLocaleDateString('es-CL', {weekday: 'short', day: 'numeric'})}</p>
                            {slotsHorarios.map(h => {
                              const libre = estaDisponible(fStr, h); 
                              const sel = horasSeleccionadas.some(x => x.fecha === fStr && x.hora === h);
                              return (
                                <button key={h} disabled={!libre && !sel} onClick={() => toggleHora(fStr, h)} className={`w-full py-3 text-[10px] font-black rounded-xl border transition-all ${sel ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-95' : libre ? 'bg-white border-slate-100 text-slate-600 hover:border-blue-400 hover:bg-blue-50' : 'bg-slate-50 text-slate-200 cursor-not-allowed opacity-50'}`}>{h}</button>
                              )
                            })}
                          </div>
                        )
                      })}
                    </main>
                  </>
                ) : (
                  <div className="flex-1 flex overflow-hidden bg-white">
                    <div className="w-1/2 border-r p-10 overflow-y-auto space-y-4 bg-slate-50/20">
                       <h3 className="text-xs font-black uppercase text-blue-600 mb-6 flex items-center gap-2 tracking-widest"><Clock size={16}/> Resumen de Atención</h3>
                       {horasSeleccionadas.map((s, idx) => (
                         <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                            <div><p className="text-[10px] font-black text-slate-400 uppercase">{s.fecha}</p><p className="text-sm font-black text-slate-700">{s.hora} hrs</p></div>
                            <select className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs" value={s.duracion} onChange={e => { const n = [...horasSeleccionadas]; n[idx].duracion = Number(e.target.value); setHorasSeleccionadas(n); }}>
                              {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
                            </select>
                         </div>
                       ))}
                    </div>
                    <div className="w-1/2 p-10 overflow-y-auto space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">{modoNuevoPaciente ? 'Nuevo Registro' : 'Vincular Paciente'}</h3>
                        <button onClick={() => { setModoNuevoPaciente(!modoNuevoPaciente); setPacienteSeleccionado(null); }} className="text-[10px] font-black text-blue-600 uppercase underline decoration-2 underline-offset-4">{modoNuevoPaciente ? 'Volver a Buscar' : '+ Registrar Nuevo'}</button>
                      </div>

                      {modoNuevoPaciente ? (
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                          <input placeholder="Nombre" className="p-4 bg-white rounded-xl font-bold text-xs uppercase shadow-sm outline-none" onChange={e => setNuevoPaciente({...nuevoPaciente, nombre: e.target.value})}/>
                          <input placeholder="Apellido" className="p-4 bg-white rounded-xl font-bold text-xs uppercase shadow-sm outline-none" onChange={e => setNuevoPaciente({...nuevoPaciente, apellido: e.target.value})}/>
                          <input placeholder="RUT" className="p-4 bg-white rounded-xl font-bold text-xs uppercase shadow-sm outline-none" onChange={e => setNuevoPaciente({...nuevoPaciente, rut: e.target.value})}/>
                          <input placeholder="Teléfono" className="p-4 bg-white rounded-xl font-bold text-xs shadow-sm outline-none" onChange={e => setNuevoPaciente({...nuevoPaciente, telefono: e.target.value})}/>
                          <input placeholder="Email" className="col-span-2 p-4 bg-white rounded-xl font-bold text-xs shadow-sm outline-none" onChange={e => setNuevoPaciente({...nuevoPaciente, email: e.target.value})}/>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18}/>
                            <input placeholder="Buscar por Nombre o RUT..." className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl font-black text-xs outline-none focus:border-blue-500 transition-all shadow-sm" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                            {buscando && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={16}/>}
                          </div>
                          <div className="space-y-2">
                            {pacientesEncontrados.map(p => (
                              <button key={p.id} onClick={() => seleccionarPacienteExistente(p)} className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between ${pacienteSeleccionado?.id === p.id ? 'border-blue-600 bg-blue-50 shadow-md scale-[1.01]' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}>
                                <div className="text-left"><p className="font-black text-xs uppercase text-slate-800">{p.nombre} {p.apellido}</p><p className="text-[10px] font-bold text-slate-400">{p.rut}</p></div>
                                {pacienteSeleccionado?.id === p.id && <CheckCircle2 className="text-blue-600" size={20}/>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(pacienteSeleccionado || modoNuevoPaciente) && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 shadow-inner">
                          <h4 className="text-[10px] font-black uppercase text-blue-700 mb-4 flex items-center gap-2 tracking-widest"><ListChecks size={14}/> Asignar a Tratamiento</h4>
                          {!creandoNuevoTratamiento && tratamientosPaciente.length > 0 ? (
                            <div className="space-y-3">
                              <select className="w-full p-4 bg-white border border-blue-200 rounded-2xl font-bold text-xs outline-none shadow-sm" value={tratamientoSeleccionado || ''} onChange={(e) => setTratamientoSeleccionado(e.target.value)}>
                                {tratamientosPaciente.map(t => <option key={t.id} value={t.id}>{t.nombre_tratamiento}</option>)}
                              </select>
                              <button onClick={() => setCreandoNuevoTratamiento(true)} className="text-[9px] font-black text-blue-600 uppercase hover:underline tracking-tighter">+ Iniciar nuevo tratamiento</button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <input placeholder="Nombre del tratamiento (ej: Limpieza Dental)" className="w-full p-4 bg-white border border-blue-200 rounded-2xl font-bold text-xs outline-none focus:ring-2 ring-blue-500/10 shadow-sm" value={nuevoTratamientoNombre} onChange={(e) => setNuevoTratamientoNombre(e.target.value)} />
                              {tratamientosPaciente.length > 0 && <button onClick={() => setCreandoNuevoTratamiento(false)} className="text-[9px] font-black text-slate-500 uppercase">Volver a lista</button>}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t bg-slate-50 flex justify-between items-center px-12 shrink-0">
                <div><span className="text-[10px] font-black text-slate-400 uppercase italic">Confirmación</span><p className="text-sm font-black text-slate-700">{horasSeleccionadas.length} horarios listos</p></div>
                <div className="flex gap-4">
                  {paso === 2 && <button onClick={() => setPaso(1)} className="font-black text-slate-400 px-6 text-xs uppercase hover:text-slate-600 transition-colors">Atrás</button>}
                  <button 
                    disabled={cargandoAccion || horasSeleccionadas.length === 0 || (paso === 2 && !modoNuevoPaciente && !pacienteSeleccionado)} 
                    onClick={() => { if(paso === 1) { if(validarChoqueRango()) setPaso(2); } else { handleGuardar(); } }} 
                    className="px-14 py-5 rounded-[2rem] font-black bg-green-500 text-white text-sm uppercase shadow-xl hover:bg-green-600 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {cargandoAccion ? <Loader2 className="animate-spin" size={20}/> : (paso === 1 ? 'Continuar' : 'Confirmar Todo')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}