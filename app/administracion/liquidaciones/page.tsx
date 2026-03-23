'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Calculator, Search, Eye, CheckCircle2, 
  Loader2, Calendar as CalendarIcon, DollarSign
} from 'lucide-react'
import Link from 'next/link'

export default function LiquidacionesPage() {
  const [liquidaciones, setLiquidaciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchLiquidaciones()
  }, [])

  async function fetchLiquidaciones() {
    setCargando(true)
    try {
      // 1. Traemos a los profesionales
      const { data: profs } = await supabase
        .from('profesionales')
        .select('id, nombre, apellido, user_id')
        .eq('activo', true)

      if (!profs) return

      // 2. Traemos la producción de atenciones realizadas
      const { data: atenciones } = await supabase
        .from('atenciones_realizadas')
        .select('monto_cobrado, profesional_id')

      // 3. Traemos los abonos de la tabla presupuesto_items
      const { data: itemsPresupuesto } = await supabase
        .from('presupuesto_items')
        .select(`
          abonado,
          presupuestos!inner(especialista_id)
        `)
        .gt('abonado', 0)

      // 4. Cruzamos los datos asegurando valores numéricos (0 si es undefined/null)
      const dataReal = profs.map(p => {
        const produccionAtenciones = atenciones
          ?.filter(a => a.profesional_id === p.user_id)
          .reduce((acc, curr) => acc + Number(curr.monto_cobrado || 0), 0) || 0

        const produccionAbonos = itemsPresupuesto
          ?.filter((item: any) => item.presupuestos?.especialista_id === p.user_id)
          .reduce((acc, curr) => acc + Number(curr.abonado || 0), 0) || 0

        const totalPro = produccionAtenciones + produccionAbonos

        return {
          id: p.id,
          nombre: p.nombre || 'Sin nombre',
          apellido: p.apellido || '',
          fecha: new Date().toLocaleDateString('es-CL'),
          realizado: totalPro,
          detalle_abonos: produccionAbonos,
          detalle_atenciones: produccionAtenciones,
          a_pagar: totalPro * 0.4, // 40% de honorarios
        }
      })

      setLiquidaciones(dataReal)
    } catch (error) {
      console.error("Error cargando liquidaciones:", error)
    } finally {
      setCargando(false)
    }
  }

  const totalRealizado = liquidaciones.reduce((acc, curr) => acc + (curr.realizado || 0), 0)
  const totalHonorarios = liquidaciones.reduce((acc, curr) => acc + (curr.a_pagar || 0), 0)
  const utilidadClinica = totalRealizado - totalHonorarios

  const filtradas = liquidaciones.filter(l => 
    `${l.nombre} ${l.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-5 rounded-[2rem] text-white shadow-xl shadow-blue-100">
              <Calculator size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 uppercase italic leading-none">Liquidaciones</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Producción Real + Abonos de Tratamientos</p>
            </div>
          </div>
        </div>

        {/* TABLA PRINCIPAL - Protegida contra undefined */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profesional</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Atenciones</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Abonos Planes</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Realizado</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">A Pagar (40%)</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cargando ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filtradas.map((liq) => (
                <tr key={liq.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-slate-700 uppercase italic">{liq.nombre} {liq.apellido}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Corte: {liq.fecha}</p>
                  </td>
                  {/* CORRECCIÓN: (liq.propiedad || 0).toLocaleString() asegura que nunca falle */}
                  <td className="px-8 py-6 text-center text-xs font-bold text-slate-500">${(liq.detalle_atenciones || 0).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center text-xs font-bold text-blue-600">${(liq.detalle_abonos || 0).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center text-xs font-black text-slate-800">${(liq.realizado || 0).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center text-xs font-black text-emerald-600">${(liq.a_pagar || 0).toLocaleString()}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                        <Link href={`/administracion/liquidaciones/${liq.id}`} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                            <Eye size={16} />
                        </Link>
                        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600 transition-all">
                            Liquidar
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RESUMEN KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Recaudación Global</p>
            <p className="text-3xl font-black text-slate-800 mt-2">${(totalRealizado || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total Honorarios Doctor</p>
            <p className="text-3xl font-black text-emerald-600 mt-2">${(totalHonorarios || 0).toLocaleString()}</p>
          </div>
          <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-100 text-white relative overflow-hidden">
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest italic">Utilidad Estimada</p>
            <p className="text-3xl font-black mt-2">${(utilidadClinica || 0).toLocaleString()}</p>
            <DollarSign className="absolute -right-4 -bottom-4 text-white/10" size={100} />
          </div>
        </div>

      </div>
    </div>
  )
}