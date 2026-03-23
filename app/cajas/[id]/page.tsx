'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ChevronLeft, Banknote, CreditCard, Landmark, 
  User, Calendar, Receipt, ArrowLeft, Printer, Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function DetalleCajaPage() {
  const { id: cajaId } = useParams()
  const router = useRouter()
  const [caja, setCaja] = useState<any>(null)
  const [pagos, setPagos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetchDetalleCaja()
  }, [cajaId])

  async function fetchDetalleCaja() {
    setCargando(true)
    try {
      // 1. Info de la sesión
      const { data: sesion } = await supabase
        .from('sesiones_caja')
        .select('*')
        .eq('id', cajaId)
        .single()

      // 2. Pagos con las columnas específicas que solicitaste
      // Nota: Asegúrate de que estas columnas existan en tu tabla 'pagos'
      const { data: listaPagos } = await supabase
        .from('pagos')
        .select(`
          id,
          monto,
          metodo_pago,
          convenio,
          fecha_vencimiento,
          numero_referencia,
          numero_boleta,
          fecha_pago,
          pacientes(nombre, apellido)
        `)
        .eq('caja_id', cajaId)
        .order('fecha_pago', { ascending: true })

      setCaja(sesion)
      setPagos(listaPagos || [])
    } catch (error) {
      console.error("Error cargando detalle:", error)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="font-black text-xs uppercase tracking-widest text-slate-400">Generando reporte de caja...</p>
    </div>
  )

  if (!caja) return <div className="p-20 text-center font-black">CAJA NO ENCONTRADA</div>

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => router.push('/cajas')}
            className="flex items-center gap-2 font-black text-[10px] text-slate-400 uppercase hover:text-blue-600 transition-all bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
          >
            <ArrowLeft size={14} /> Volver a gestión
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 font-black text-[10px] text-white uppercase bg-slate-900 px-6 py-2 rounded-xl shadow-lg hover:bg-blue-600 transition-all"
          >
            <Printer size={14} /> Imprimir Cierre
          </button>
        </div>

        {/* RESUMEN SUPERIOR */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-blue-200 shadow-lg">
              <Receipt size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen de Caja</p>
              <h1 className="text-3xl font-black uppercase italic text-slate-800 tracking-tighter">
                {caja.nombre_responsable}
              </h1>
              <p className="text-xs font-bold text-slate-500">Cierre: {new Date(caja.fecha_cierre).toLocaleString('es-CL')}</p>
            </div>
          </div>
          <div className="flex gap-10 text-right">
             <div>
               <p className="text-[9px] font-black text-slate-400 uppercase">Fondo Inicial</p>
               <p className="text-xl font-black text-slate-700">${Number(caja.monto_apertura).toLocaleString('es-CL')}</p>
             </div>
             <div>
               <p className="text-[9px] font-black text-slate-400 uppercase text-blue-600">Total Recaudado</p>
               <p className="text-3xl font-black text-blue-600">${Number(caja.monto_cierre).toLocaleString('es-CL')}</p>
             </div>
          </div>
        </div>

        {/* TABLA DETALLADA */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase font-black text-[9px] tracking-[0.1em]">
                  <th className="px-6 py-5">#</th>
                  <th className="px-6 py-5">Nombre Paciente</th>
                  <th className="px-6 py-5">Medio de Pago</th>
                  <th className="px-6 py-5">Convenio</th>
                  <th className="px-6 py-5">Vencimiento</th>
                  <th className="px-6 py-5"># Referencia</th>
                  <th className="px-6 py-5"># Boleta</th>
                  <th className="px-6 py-5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagos.map((p, index) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-400 italic">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black uppercase text-slate-700">
                        {p.pacientes?.nombre} {p.pacientes?.apellido}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {p.metodo_pago === 'efectivo' ? <Banknote size={14} className="text-emerald-500"/> : <CreditCard size={14} className="text-blue-500"/>}
                        <span className="text-[10px] font-black uppercase text-slate-500">{p.metodo_pago}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">
                      {p.convenio || '—'}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                      {p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString('es-CL') : '—'}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-blue-600">
                      {p.numero_referencia || '—'}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-700">
                      {p.numero_boleta || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900">
                        ${Number(p.monto).toLocaleString('es-CL')}
                      </span>
                    </td>
                  </tr>
                ))}
                {pagos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <p className="text-slate-300 font-black uppercase text-xs italic tracking-widest">No se registraron pagos en esta sesión</p>
                    </td>
                  </tr>
                )}
              </tbody>
              {/* TOTAL FINAL DE TABLA */}
              <tfoot className="bg-slate-50 border-t-2 border-slate-100">
                <tr>
                  <td colSpan={7} className="px-6 py-6 text-right text-[10px] font-black uppercase text-slate-400">Total Turno:</td>
                  <td className="px-6 py-6 text-right text-xl font-black text-slate-900">
                    ${Number(caja.monto_cierre - caja.monto_apertura).toLocaleString('es-CL')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}