'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  ChevronLeft, ChevronRight, Search, Calendar as CalendarIcon, 
  User, Phone, Plus, Loader2, X, Clock, DoorOpen, Stethoscope, ChevronDown 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date()) 
  const [citas, setCitas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)

  // ESTADOS PARA ESPECIALISTAS REALES
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [profesionalesFiltrados, setProfesionalesFiltrados] = useState<any[]>([])

  // Datos para los selectores
  const especialidades = [
    "Todas", "Endodoncia", "General", "Implantología", 
    "Odontopediatría", "Ortodoncia", "Podología", "Rehabilitación oral"
  ]

  const duraciones = [
    { label: "30 minutos", value: "30" }, { label: "60 minutos", value: "60" },
    { label: "90 minutos", value: "90" }, { label: "120 minutos", value: "120" },
    { label: "150 minutos", value: "150" }, { label: "180 minutos", value: "180" },
    { label: "210 minutos", value: "210" }, { label: "240 minutos", value: "240" },
    { label: "270 minutos", value: "270" }, { label: "300 minutos", value: "300" },
    { label: "330 minutos", value: "330" }, { label: "360 minutos", value: "360" },
    { label: "390 minutos", value: "390" }, { label: "420 minutos", value: "420" },
    { label: "450 minutos", value: "450" }
  ]

  const [nuevaCita, setNuevaCita] = useState({
    especialidad: 'Todas',
    doctor: '',
    box: 'Box 01',
    duracion: '30',
    hora: '',
    paciente_id: ''
  })

  // Lógica de mini-calendario para el Modal
  const [currMonth, setCurrMonth] = useState(new Date())
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const handlePrevMonth = () => setCurrMonth(new Date(currMonth.setMonth(currMonth.getMonth() - 1)))
  const handleNextMonth = () => setCurrMonth(new Date(currMonth.setMonth(currMonth.getMonth() + 1)))

  // --- CARGAR PROFESIONALES DESDE BD ---
  useEffect(() => {
    async function fetchProfesionales() {
      const { data, error } = await supabase
        .from('profesionales')
        .select('*, especialidades(nombre)')
      if (!error) setProfesionales(data || [])
    }
    fetchProfesionales()
    setCargando(false)
  }, [])

  // --- FILTRAR DOCTORES POR ESPECIALIDAD ---
  useEffect(() => {
    if (nuevaCita.especialidad === 'Todas') {
      setProfesionalesFiltrados(profesionales)
    } else {
      const filtrados = profesionales.filter(p => p.especialidades?.nombre === nuevaCita.especialidad)
      setProfesionalesFiltrados(filtrados)
    }
    setNuevaCita(prev => ({ ...prev, doctor: '' })) // Limpiar doctor al cambiar especialidad
  }, [nuevaCita.especialidad, profesionales])

  const cambiarDia = (offset: number) => {
    const nuevaFecha = new Date(selectedDate)
    nuevaFecha.setDate(selectedDate.getDate() + offset)
    setSelectedDate(nuevaFecha)
  }

  const diaNombre = selectedDate.toLocaleDateString('es-CL', { weekday: 'long' })
  const diaNumero = selectedDate.getDate()
  const mesAnio = selectedDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  const horasDisponibles = ["09:00", "09:30", "10:00", "11:30", "12:00", "15:00", "16:30"]

  return (
    <div className="flex h-full overflow-hidden bg-[#f4f7f6] relative">
      
      {/* SIDEBAR IZQUIERDO */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 shrink-0">
        <div className="mb-6 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] capitalize">{diaNombre}</p>
          <div className="flex items-center justify-center gap-4 my-2">
            <button onClick={() => cambiarDia(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-blue-600"><ChevronLeft size={24}/></button>
            <span className="text-5xl font-black text-slate-800 w-16 tabular-nums">{diaNumero}</span>
            <button onClick={() => cambiarDia(1)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-blue-600"><ChevronRight size={24}/></button>
          </div>
          <p className="text-xs font-bold text-slate-500 capitalize">{mesAnio}</p>
        </div>
      </aside>

      {/* ÁREA CENTRAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
             <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><CalendarIcon size={20}/></div>
             <h2 className="font-black text-slate-700 uppercase text-xs tracking-widest">Agenda del día</h2>
          </div>
          <button 
            onClick={() => setModalAbierto(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Plus size={16}/> Nueva Cita
          </button>
        </div>
        <div className="flex-1 p-8 overflow-y-auto">
          {cargando ? <Loader2 className="animate-spin mx-auto text-blue-600" /> : <p className="text-center text-slate-400 text-sm">No hay citas para este día</p>}
        </div>
      </div>

      {/* MODAL DE NUEVA CITA */}
      <AnimatePresence>
        {modalAbierto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalAbierto(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row"
            >
              {/* COLUMNA IZQUIERDA: CALENDARIO */}
              <div className="lg:w-[400px] bg-slate-50 p-8 border-r border-slate-100">
                <h4 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-blue-600"/> Fecha y Hora
                </h4>
                
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-black text-slate-700 capitalize">
                      {currMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg"><ChevronLeft size={16}/></button>
                      <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg"><ChevronRight size={16}/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2 uppercase">
                    {['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth(currMonth.getFullYear(), currMonth.getMonth()) }).map((_, i) => <div key={i} />)}
                    {Array.from({ length: daysInMonth(currMonth.getFullYear(), currMonth.getMonth()) }).map((_, i) => (
                      <button key={i} className={`h-8 w-8 text-xs font-bold rounded-lg hover:bg-blue-50 text-slate-600 transition-colors`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horas Disponibles</label>
                  <div className="grid grid-cols-3 gap-2">
                    {horasDisponibles.map(h => (
                      <button 
                        key={h} onClick={() => setNuevaCita({...nuevaCita, hora: h})}
                        className={`py-2 rounded-xl text-xs font-black border transition-all ${nuevaCita.hora === h ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: FORMULARIO FILTRADO */}
              <div className="flex-1 p-10 relative">
                <button onClick={() => setModalAbierto(false)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors"><X size={28} /></button>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Detalles de la Cita</h3>
                
                <div className="space-y-6">
                  {/* Especialidad */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Stethoscope size={14}/> Especialidad</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white p-4 rounded-2xl font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                        value={nuevaCita.especialidad}
                        onChange={(e) => setNuevaCita({...nuevaCita, especialidad: e.target.value})}
                      >
                        {especialidades.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                  </div>

                  {/* Profesional Filtrado */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Profesional</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white p-4 rounded-2xl font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                        value={nuevaCita.doctor}
                        onChange={(e) => setNuevaCita({...nuevaCita, doctor: e.target.value})}
                      >
                        <option value="">Seleccionar profesional...</option>
                        {profesionalesFiltrados.map(pro => (
                          <option key={pro.id} value={pro.id}>Dr. {pro.nombre} {pro.apellido}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><DoorOpen size={14}/> Box / Clínica</label>
                      <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-700 outline-none" value={nuevaCita.box} onChange={(e) => setNuevaCita({...nuevaCita, box: e.target.value})}>
                        <option>Box 01</option><option>Box 02</option><option>Box 03</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Duración</label>
                      <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-700 outline-none" value={nuevaCita.duracion} onChange={(e) => setNuevaCita({...nuevaCita, duracion: e.target.value})}>
                        {duraciones.map(dur => <option key={dur.value} value={dur.value}>{dur.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <button 
                    disabled={!nuevaCita.doctor || !nuevaCita.hora}
                    onClick={() => { console.log("Agendando:", nuevaCita); setModalAbierto(false); }}
                    className={`w-full py-5 rounded-3xl font-black text-lg transition-all mt-4 shadow-xl ${(!nuevaCita.doctor || !nuevaCita.hora) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'}`}
                  >
                    Confirmar Cita
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