'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserPlus, ArrowLeft, Save, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function NuevoPaciente() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(false)
  
  const [form, setForm] = useState({
    rut: '',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    direccion: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)

    // Limpiamos el RUT de puntos y guion antes de guardar si es necesario
    const rutLimpio = form.rut.replace(/\./g, '').toUpperCase()

    const { error } = await supabase
      .from('pacientes')
      .insert([{ ...form, rut: rutLimpio }])

    if (error) {
      alert("Error al guardar: " + error.message)
      setCargando(false)
    } else {
      setExito(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  if (exito) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-sm w-full border border-slate-100">
        <CheckCircle2 className="text-emerald-500 mx-auto mb-6" size={80} />
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">¡Registrado!</h2>
        <p className="text-slate-500 font-bold mt-2">Paciente guardado con éxito. Redirigiendo...</p>
      </div>
    </div>
  )

  return (
    <main className="p-6 lg:p-12 max-w-4xl mx-auto min-h-screen bg-slate-50">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-blue-600 transition-colors mb-8">
        <ArrowLeft size={16} /> Volver al Panel
      </Link>

      <header className="mb-12">
        <div className="bg-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-100">
          <UserPlus size={32} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Ficha de Ingreso</h1>
        <p className="text-slate-500 font-medium mt-2">Completa los datos para dar de alta al nuevo paciente.</p>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-10 lg:p-16 rounded-[4rem] shadow-xl border border-slate-100">
        
        {/* Campo RUT */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">RUT del Paciente</label>
          <input 
            required
            placeholder="12.345.678-9"
            className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 transition-all text-xl"
            value={form.rut}
            onChange={(e) => setForm({...form, rut: e.target.value})}
          />
        </div>

        {/* Nombres */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Nombres</label>
          <input 
            required
            placeholder="Juan Ignacio"
            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900"
            value={form.nombre}
            onChange={(e) => setForm({...form, nombre: e.target.value})}
          />
        </div>

        {/* Apellidos */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Apellidos</label>
          <input 
            required
            placeholder="Pérez Cotapos"
            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900"
            value={form.apellido}
            onChange={(e) => setForm({...form, apellido: e.target.value})}
          />
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Teléfono Móvil</label>
          <input 
            type="tel"
            placeholder="+56 9 1234 5678"
            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900"
            value={form.telefono}
            onChange={(e) => setForm({...form, telefono: e.target.value})}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Correo Electrónico</label>
          <input 
            type="email"
            placeholder="paciente@correo.cl"
            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
          />
        </div>

        {/* Botón Guardar */}
        <div className="md:col-span-2 pt-6">
          <button 
            type="submit"
            disabled={cargando}
            className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center gap-3 disabled:opacity-50"
          >
            {cargando ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <Save size={24} />
            )}
            {cargando ? 'Guardando en la nube...' : 'Finalizar Registro'}
          </button>
        </div>
      </form>
    </main>
  )
}