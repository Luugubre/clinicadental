'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  DollarSign, Search, Calendar, 
  User, ArrowRight, Loader2, 
  CheckCircle2, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function PagosPendientesPage() {
  const [items, setItems] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchPagosPendientes()
  }, [])

  async function fetchPagosPendientes() {
    setCargando(true)
    try {
      // 1. IMPORTANTE: Traemos 'paciente_id' directamente de la tabla presupuestos
      const { data, error } = await supabase
        .from('presupuestos')
        .select(`
          id,
          paciente_id, 
          nombre_tratamiento,
          total,
          total_abonado,
          fecha_creacion,
          estado,
          pacientes ( nombre, apellido, rut )
        `)
        .neq('estado', 'finalizado') 
        .order('fecha_creacion', { ascending: false })

      if (error) throw error

      const pendientes = data?.filter(p => (Number(p.total) - Number(p.total_abonado)) > 0) || []
      setItems(pendientes)
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setCargando(false)
    }
  }

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor)
  }

  const filtrados = items.filter(i => 
    i.pacientes?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.pacientes?.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.pacientes?.rut?.includes(busqueda)
  )

  if (cargando) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={30} />
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sincronizando deudas...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3.5 rounded-2xl text-white shadow-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 uppercase italic leading-none">Cuentas por Cobrar</h1>
              <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-1.5">Saldos pendientes de presupuestos</p>
            </div>
          </div>
          
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase">Deuda Total Cartera</p>
            <p className="text-sm font-black text-emerald-600">
              {formatearMoneda(filtrados.reduce((acc, curr) => acc + (Number(curr.total) - Number(curr.total_abonado)), 0))}
            </p>
          </div>
        </header>

        {/* BUSCADOR */}
        <div className="relative group max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text"
            placeholder="Buscar por nombre o RUT..."
            className="w-full bg-white p-3 pl-10 rounded-xl border border-slate-100 shadow-sm outline-none focus:ring-2 ring-blue-500/10 font-bold text-[10px] uppercase"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtrados.map((item) => {
              const saldo = Number(item.total) - Number(item.total_abonado);
              
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <User size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-black text-slate-800 uppercase italic truncate">
                        {item.pacientes?.nombre} {item.pacientes?.apellido}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                        {item.nombre_tratamiento || 'Tratamiento sin nombre'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-4">
                    <div className="flex justify-between text-[9px] uppercase font-bold">
                      <span className="text-slate-400">Presupuesto:</span>
                      <span className="text-slate-700">{formatearMoneda(item.total)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] uppercase font-bold">
                      <span className="text-slate-400">Abonado:</span>
                      <span className="text-blue-600">{formatearMoneda(item.total_abonado)}</span>
                    </div>
                    <div className="h-[1px] bg-slate-200 my-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase italic">Pendiente:</span>
                      <span className="text-sm font-black text-red-500">{formatearMoneda(saldo)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={12} />
                      <span className="text-[9px] font-bold uppercase">{new Date(item.fecha_creacion).toLocaleDateString()}</span>
                    </div>
                    
                    {/* 2. SOLUCIÓN AL UNDEFINED: Usamos item.paciente_id directamente */}
                    <Link 
                      href={`/pacientes/${item.paciente_id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                      Ver Ficha <ArrowRight size={12}/>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtrados.length === 0 && !cargando && (
          <div className="p-20 text-center flex flex-col items-center gap-4 bg-white rounded-[3rem] border border-slate-100">
            <CheckCircle2 size={40} className="text-emerald-200" />
            <p className="text-slate-400 font-black text-xs uppercase italic tracking-widest">No hay saldos pendientes</p>
          </div>
        )}
      </div>
    </div>
  )
}