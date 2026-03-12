'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/app/hooks/useRole'
import { 
  User, Search, Trash2, ArrowUpRight, 
  Loader2, UserPlus, ArrowLeft, Phone 
} from 'lucide-react'
import Link from 'next/link'

export default function ListaPacientes() {
  const { isAdmin } = useRole()
  const [pacientes, setPacientes] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetchPacientes()
  }, [])

  async function fetchPacientes() {
    setCargando(true)
    const { data } = await supabase
      .from('pacientes')
      .select('*')
      .order('apellido', { ascending: true })
    setPacientes(data || [])
    setCargando(false)
  }

  // FUNCIÓN PARA ELIMINAR
  const handleEliminar = async (id: string, nombre: string) => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar permanentemente a ${nombre}? Esta acción no se puede deshacer y borrará su historial.`);
    
    if (confirmar) {
      const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', id)

      if (error) {
        alert("Error al eliminar: " + error.message)
      } else {
        // Actualizamos la lista localmente para que desaparezca de inmediato
        setPacientes(pacientes.filter(p => p.id !== id))
      }
    }
  }

  const pacientesFiltrados = pacientes.filter(p => 
    `${p.nombre} ${p.apellido} ${p.rut}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <main className="p-8 max-w-6xl mx-auto min-h-screen bg-slate-50/30">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <Link href="/" className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4 hover:text-blue-600 transition-all">
            <ArrowLeft size={16} /> Volver
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Directorio de Pacientes</h1>
          <p className="text-slate-500 font-medium mt-1">Gestiona la base de datos de la clínica.</p>
        </div>
        <Link href="/pacientes/nuevo" className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-lg transition-all active:scale-95 text-sm uppercase">
          <UserPlus size={20} /> Nuevo Paciente
        </Link>
      </header>

      {/* BARRA DE BÚSQUEDA */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-5 text-slate-300" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, apellido o RUT..." 
          className="w-full p-5 pl-14 bg-white border-2 border-transparent rounded-[2rem] shadow-sm outline-none focus:border-blue-500 transition-all font-bold text-slate-700"
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* LISTADO */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        {cargando ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Cargando pacientes...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {pacientesFiltrados.map((p) => (
              <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-center gap-5">
                  <div className="bg-slate-100 p-4 rounded-2xl text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg">{p.nombre} {p.apellido}</h4>
                    <div className="flex gap-4 mt-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{p.rut}</p>
                      {p.telefono && (
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Phone size={12} /> {p.telefono}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* BOTÓN ELIMINAR (Solo visible para Admin) */}
                  {isAdmin && (
                    <button 
                      onClick={() => handleEliminar(p.id, p.nombre)}
                      className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      title="Eliminar Paciente"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  
                  <Link href={`/pacientes/${p.id}`} className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                    <ArrowUpRight size={20} />
                  </Link>
                </div>
              </div>
            ))}
            {pacientesFiltrados.length === 0 && (
              <div className="p-20 text-center text-slate-400 font-bold italic">
                No se encontraron pacientes que coincidan con tu búsqueda.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}