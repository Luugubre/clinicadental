'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Loader2, Clock, Calendar, User, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

const DIAS = [
  { id: 1, label: 'Lunes' }, { id: 2, label: 'Martes' }, { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' }, { id: 5, label: 'Viernes' }, { id: 6, label: 'Sábado' }, { id: 0, label: 'Domingo' }
];

export default function BoxConfigPage() {
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [profesionalId, setProfesionalId] = useState('')
  const [disponibilidad, setDisponibilidad] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  // Estado para el nuevo bloque
  const [nuevoBloque, setNuevoBloque] = useState({ dia_semana: 1, hora_inicio: '09:00', hora_fin: '13:00', box_id: 1 })

  useEffect(() => {
    fetchInicial()
  }, [])

  useEffect(() => {
    if (profesionalId) fetchDisponibilidad()
  }, [profesionalId])

  async function fetchInicial() {
    const { data } = await supabase.from('profesionales').select('*')
    if (data && data.length > 0) {
      setProfesionales(data)
      setProfesionalId(data[0].user_id)
    }
    setCargando(false)
  }

  async function fetchDisponibilidad() {
    const { data } = await supabase
      .from('disponibilidad_profesional')
      .select('*')
      .eq('profesional_id', profesionalId)
      .order('dia_semana', { ascending: true })
    setDisponibilidad(data || [])
  }

  const agregarBloque = async () => {
    setGuardando(true)
    const { error } = await supabase.from('disponibilidad_profesional').insert([{
      profesional_id: profesionalId,
      ...nuevoBloque
    }])
    if (!error) fetchDisponibilidad()
    setGuardando(false)
  }

  const eliminarBloque = async (id: string) => {
    await supabase.from('disponibilidad_profesional').delete().eq('id', id)
    fetchDisponibilidad()
  }

  if (cargando) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase italic">Configuración de Box</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Horarios de especialistas por sillón</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <User size={20} className="text-blue-600"/>
            <select 
              className="bg-transparent font-black text-xs uppercase outline-none cursor-pointer"
              value={profesionalId}
              onChange={(e) => setProfesionalId(e.target.value)}
            >
              {profesionales.map(p => <option key={p.id} value={p.user_id}>Dr. {p.nombre} {p.apellido}</option>)}
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FORMULARIO AGREGAR */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit space-y-6">
            <h2 className="font-black text-sm uppercase italic text-blue-600 flex items-center gap-2">
              <Clock size={18}/> Asignar Nuevo Horario
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Día de la semana</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" 
                  value={nuevoBloque.dia_semana} onChange={(e) => setNuevoBloque({...nuevoBloque, dia_semana: Number(e.target.value)})}>
                  {DIAS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Desde</label>
                  <input type="time" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none"
                    value={nuevoBloque.hora_inicio} onChange={(e) => setNuevoBloque({...nuevoBloque, hora_inicio: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Hasta</label>
                  <input type="time" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none"
                    value={nuevoBloque.hora_fin} onChange={(e) => setNuevoBloque({...nuevoBloque, hora_fin: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Box / Sillón</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none"
                  value={nuevoBloque.box_id} onChange={(e) => setNuevoBloque({...nuevoBloque, box_id: Number(e.target.value)})}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>Sillón {n}</option>)}
                </select>
              </div>

              <button 
                onClick={agregarBloque}
                disabled={guardando}
                className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-xs uppercase shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                {guardando ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                Guardar Horario
              </button>
            </div>
          </div>

          {/* VISTA CALENDARIO SEMANAL */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
             <div className="space-y-4">
                {DIAS.map(dia => {
                  const bloquesDia = disponibilidad.filter(b => b.dia_semana === dia.id);
                  return (
                    <div key={dia.id} className="flex items-start gap-6 p-4 hover:bg-slate-50 rounded-3xl transition-all border-b border-slate-50 last:border-0">
                      <div className="w-24 shrink-0">
                        <span className="text-xs font-black uppercase text-slate-800 italic">{dia.label}</span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-3">
                        {bloquesDia.length === 0 ? (
                          <span className="text-[10px] font-bold text-slate-300 uppercase italic">Sin horario asignado</span>
                        ) : bloquesDia.map(b => (
                          <div key={b.id} className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <span className="text-[10px] font-black text-blue-600">
                              {b.hora_inicio.substring(0,5)} - {b.hora_fin.substring(0,5)}
                            </span>
                            <span className="text-[9px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-lg">B{b.box_id}</span>
                            <button onClick={() => eliminarBloque(b.id)} className="text-blue-300 hover:text-red-500 transition-colors">
                              <Trash2 size={12}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}