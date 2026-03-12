'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UserPlus, Save, Trash2, Stethoscope, Loader2 } from 'lucide-react'

export default function ConfigProfesionales() {
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [especialidades, setEspecialidades] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  const [nuevoPro, setNuevoPro] = useState({ nombre: '', apellido: '', especialidad_id: '' })

  useEffect(() => { fetchDatos() }, [])

  async function fetchDatos() {
    const { data: esp } = await supabase.from('especialidades').select('*')
    const { data: pro } = await supabase.from('profesionales').select('*, especialidades(nombre)')
    setEspecialidades(esp || [])
    setProfesionales(pro || [])
    setCargando(false)
  }

  const agregarProfesional = async () => {
    if (!nuevoPro.nombre || !nuevoPro.especialidad_id) return alert("Completa los datos")
    const { error } = await supabase.from('profesionales').insert([nuevoPro])
    if (!error) {
      setNuevoPro({ nombre: '', apellido: '', especialidad_id: '' })
      fetchDatos()
    }
  }

  if (cargando) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
        <Stethoscope className="text-blue-600" size={32} /> Gestión de Especialistas
      </h1>

      {/* FORMULARIO DE REGISTRO */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10">
        <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest mb-6">Registrar Nuevo Doctor</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" placeholder="Nombre" 
            className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-blue-500 font-bold"
            value={nuevoPro.nombre} onChange={e => setNuevoPro({...nuevoPro, nombre: e.target.value})}
          />
          <input 
            type="text" placeholder="Apellido" 
            className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-blue-500 font-bold"
            value={nuevoPro.apellido} onChange={e => setNuevoPro({...nuevoPro, apellido: e.target.value})}
          />
          <select 
            className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-blue-500 font-bold"
            value={nuevoPro.especialidad_id} onChange={e => setNuevoPro({...nuevoPro, especialidad_id: e.target.value})}
          >
            <option value="">Especialidad...</option>
            {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <button 
          onClick={agregarProfesional}
          className="mt-6 w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <UserPlus size={18}/> Guardar Especialista
        </button>
      </div>

      {/* LISTADO DE DOCTORES */}
      <div className="space-y-4">
        {profesionales.map(pro => (
          <div key={pro.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black">
                {pro.nombre[0]}
              </div>
              <div>
                <p className="font-black text-slate-700">Dr. {pro.nombre} {pro.apellido}</p>
                <p className="text-xs font-bold text-blue-500 uppercase">{pro.especialidades?.nombre}</p>
              </div>
            </div>
            <button className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
          </div>
        ))}
      </div>
    </div>
  )
}