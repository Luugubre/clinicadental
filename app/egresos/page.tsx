'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/app/hooks/useRole'
import { Receipt, Plus, Trash2, TrendingDown, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function GestionEgresos() {
  const { isAdmin, cargando: cargandoRol } = useRole()
  const [egresos, setEgresos] = useState<any[]>([])
  const [nuevoEgreso, setNuevoEgreso] = useState({ monto: '', categoria: 'Materiales', descripcion: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { if (isAdmin) fetchEgresos() }, [isAdmin])

  async function fetchEgresos() {
    const { data } = await supabase.from('egresos').select('*').order('fecha', { ascending: false })
    setEgresos(data || [])
  }

  async function guardarEgreso(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoEgreso.monto) return
    setGuardando(true)
    await supabase.from('egresos').insert([{ ...nuevoEgreso, monto: Number(nuevoEgreso.monto) }])
    setNuevoEgreso({ monto: '', categoria: 'Materiales', descripcion: '' })
    fetchEgresos()
    setGuardando(false)
  }

  if (!isAdmin && !cargandoRol) return <div className="p-20 text-center font-black">ACCESO RESTRINGIDO</div>

  return (
    <main className="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <Link href="/" className="text-slate-400 font-bold text-xs uppercase flex items-center gap-2 mb-2"><ArrowLeft size={14}/> Volver</Link>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Gestión de Gastos</h1>
          <p className="text-slate-500 font-medium">Controla los egresos de la clínica</p>
        </div>
        <div className="bg-red-500 text-white p-6 rounded-[2rem] shadow-xl shadow-red-100 flex items-center gap-4 transition-transform hover:scale-105">
          <TrendingDown size={32} />
          <div>
            <p className="text-[10px] font-black uppercase opacity-80">Total Gastado</p>
            <p className="text-3xl font-black">${egresos.reduce((a, b) => a + Number(b.monto), 0).toLocaleString('es-CL')}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORMULARIO */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
          <form onSubmit={guardarEgreso} className="space-y-4">
            <h3 className="font-black text-lg mb-4">Registrar Gasto</h3>
            <input type="number" placeholder="Monto $" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xl outline-none focus:ring-2 ring-red-500" value={nuevoEgreso.monto} onChange={e => setNuevoEgreso({...nuevoEgreso, monto: e.target.value})} />
            <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={nuevoEgreso.categoria} onChange={e => setNuevoEgreso({...nuevoEgreso, categoria: e.target.value})}>
              <option>Materiales</option><option>Arriendo</option><option>Sueldos</option><option>Servicios</option><option>Marketing</option><option>Otros</option>
            </select>
            <textarea placeholder="Descripción (ej: Compra de resinas 3M)" className="w-full p-4 bg-slate-50 rounded-2xl font-medium outline-none" value={nuevoEgreso.descripcion} onChange={e => setNuevoEgreso({...nuevoEgreso, descripcion: e.target.value})} />
            <button disabled={guardando} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all">
              {guardando ? <Loader2 className="animate-spin mx-auto"/> : 'Guardar Gasto'}
            </button>
          </form>
        </div>

        {/* LISTADO */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
           <div className="space-y-3">
             {egresos.map(eg => (
               <div key={eg.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-red-100 transition-all group">
                 <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl text-red-500 shadow-sm"><Receipt size={20}/></div>
                    <div>
                      <p className="font-black text-slate-800 text-sm leading-none mb-1">{eg.descripcion || eg.categoria}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(eg.fecha).toLocaleDateString()}</p>
                    </div>
                 </div>
                 <p className="font-black text-red-500 text-lg">-${Number(eg.monto).toLocaleString()}</p>
               </div>
             ))}
           </div>
        </div>
      </div>
    </main>
  )
}