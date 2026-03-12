'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/app/hooks/useRole' // Hook de seguridad
import { Tag, Plus, Save, Trash2, DollarSign, Loader2, ShieldAlert, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function GestionAranceles() {
  const { isAdmin, cargando: cargandoRol } = useRole()
  const router = useRouter()
  const [prestaciones, setPrestaciones] = useState<any[]>([])
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [nuevaPrestacion, setNuevaPrestacion] = useState({ nombre: '', precio_base: '' })
  const [guardando, setGuardando] = useState(false)

  // 1. Efecto de seguridad: Redirigir si no es Admin
  useEffect(() => {
    if (!cargandoRol && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, cargandoRol, router])

  useEffect(() => {
    if (isAdmin) {
      fetchAranceles()
    }
  }, [isAdmin])

  async function fetchAranceles() {
    const { data } = await supabase.from('prestaciones').select('*').order('nombre', { ascending: true })
    setPrestaciones(data || [])
    setCargandoDatos(false)
  }

  async function agregarPrestacion(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevaPrestacion.nombre || !nuevaPrestacion.precio_base) return
    
    setGuardando(true)
    const { error } = await supabase.from('prestaciones').insert([
      { nombre: nuevaPrestacion.nombre, precio_base: Number(nuevaPrestacion.precio_base) }
    ])

    if (!error) {
      setNuevaPrestacion({ nombre: '', precio_base: '' })
      fetchAranceles()
    }
    setGuardando(false)
  }

  async function eliminarPrestacion(id: string) {
    if (!confirm("¿Seguro que quieres eliminar este servicio del arancel?")) return
    const { error } = await supabase.from('prestaciones').delete().eq('id', id)
    if (!error) fetchAranceles()
  }

  // Estado de carga inicial de seguridad
  if (cargandoRol || (isAdmin && cargandoDatos)) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Verificando Credenciales...</p>
      </div>
    )
  }

  // Pantalla de Bloqueo si no es Admin
  if (!isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-red-600 p-10 text-center">
        <ShieldAlert size={64} className="mb-6" />
        <h1 className="text-3xl font-black uppercase tracking-tighter">Acceso Restringido</h1>
        <p className="font-bold text-red-400 mt-2">Solo el Administrador puede gestionar los precios de la clínica.</p>
        <Link href="/" className="mt-8 bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl shadow-red-200">
          Volver al Inicio
        </Link>
      </div>
    )
  }

  return (
    <main className="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen text-slate-900">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-4 rounded-[1.5rem] text-white shadow-xl shadow-slate-200">
            <Tag size={28} />
          </div>
          <div>
            <Link href="/" className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 hover:text-blue-600 mb-1 transition-colors">
              <ArrowLeft size={12} /> Volver
            </Link>
            <h1 className="text-4xl font-black tracking-tighter leading-none">Gestión de Aranceles</h1>
            <p className="text-slate-500 font-medium text-sm">Control centralizado de precios para Daniel.</p>
          </div>
        </div>
        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-200">
          Admin Mode Active
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULARIO AGREGAR */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 h-fit sticky top-8">
          <h3 className="font-black text-xl mb-8 flex items-center gap-3 tracking-tight">
            <Plus className="text-blue-600" size={24} /> Nueva Prestación
          </h3>
          <form onSubmit={agregarPrestacion} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Nombre del Servicio</label>
              <input 
                type="text" 
                placeholder="Ej: Endodoncia Pieza 1.1" 
                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                value={nuevaPrestacion.nombre}
                onChange={(e) => setNuevaPrestacion({...nuevaPrestacion, nombre: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Precio de Lista ($)</label>
              <div className="relative">
                <span className="absolute left-5 top-5 font-black text-slate-300 text-xl">$</span>
                <input 
                  type="number" 
                  placeholder="0" 
                  className="w-full p-5 pl-10 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-slate-800 text-xl"
                  value={nuevaPrestacion.precio_base}
                  onChange={(e) => setNuevaPrestacion({...nuevaPrestacion, precio_base: e.target.value})}
                />
              </div>
            </div>
            <button 
              disabled={guardando}
              className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100 flex justify-center items-center gap-2 active:scale-95 uppercase text-xs tracking-widest"
            >
              {guardando ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Guardar Arancel
            </button>
          </form>
        </div>

        {/* LISTADO DE PRECIOS */}
        <div className="lg:col-span-2 bg-white rounded-[3.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
          <h3 className="font-black text-2xl mb-8 tracking-tight">Listado Maestro</h3>
          <div className="space-y-4">
            {prestaciones.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] group hover:bg-slate-900 hover:text-white transition-all duration-300 border border-transparent hover:border-slate-800">
                <div className="flex items-center gap-5">
                  <div className="bg-white p-4 rounded-2xl text-blue-600 shadow-sm group-hover:bg-slate-800">
                    <DollarSign size={22} />
                  </div>
                  <div>
                    <p className="font-black uppercase text-sm tracking-tight">{p.nombre}</p>
                    <p className="text-xl font-black text-blue-600 group-hover:text-emerald-400 tracking-tighter">
                      ${Number(p.precio_base).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                  <button 
                    onClick={() => eliminarPrestacion(p.id)} 
                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    title="Eliminar del catálogo"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {prestaciones.length === 0 && (
              <div className="py-20 text-center border-4 border-dashed border-slate-50 rounded-[3rem]">
                <p className="text-slate-300 font-black italic uppercase tracking-widest">Catálogo de precios vacío.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}