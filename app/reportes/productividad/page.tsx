'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/app/hooks/useRole'
import { BarChart3, Users, DollarSign, Calendar, ArrowLeft, Loader2, TrendingUp, AlertCircle, Printer } from 'lucide-react'
import Link from 'next/link'

export default function ReporteProductividad() {
  const { isAdmin, cargando: cargandoRol } = useRole()
  const [loading, setLoading] = useState(true)
  const [datos, setDatos] = useState<any[]>([])
  const [errorDB, setErrorDB] = useState<string | null>(null)
  const [rango, setRango] = useState({ 
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!cargandoRol && isAdmin) {
      fetchReporte()
    }
  }, [isAdmin, cargandoRol, rango])

  async function fetchReporte() {
    setLoading(true)
    setErrorDB(null)
    try {
      // Consultamos atenciones_realizadas uniendo con perfiles para traer los nombres reales
      const { data, error } = await supabase
        .from('atenciones_realizadas')
        .select(`
          monto_cobrado, 
          profesional_id, 
          created_at,
          perfiles:profesional_id ( nombre_completo )
        `)
        .gte('created_at', `${rango.inicio}T00:00:00`)
        .lte('created_at', `${rango.fin}T23:59:59`)

      if (error) throw error

      if (data) {
        const agrupado = data.reduce((acc: any, curr: any) => {
          // Si tiene perfil con nombre, lo usa. Si no, usa el ID.
          const nombreReal = curr.perfiles?.nombre_completo || `Dr. (${curr.profesional_id?.substring(0,5)})`
          const id = curr.profesional_id || 'Sin_Identificar'

          if (!acc[id]) {
            acc[id] = { 
              nombre: nombreReal, 
              total: 0, 
              cantidad: 0 
            }
          }
          acc[id].total += Number(curr.monto_cobrado || 0)
          acc[id].cantidad += 1
          return acc
        }, {})
        
        setDatos(Object.values(agrupado))
      }
    } catch (err: any) {
      console.error("Error en reporte:", err.message)
      setErrorDB(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (cargandoRol) return (
    <div className="p-20 text-center flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  )

  if (!isAdmin) return (
    <div className="p-20 text-center font-black text-red-500 bg-red-50 min-h-screen flex flex-col items-center justify-center">
      <AlertCircle size={48} className="mb-4" />
      <h2 className="text-2xl uppercase tracking-tighter text-red-800">Acceso Denegado</h2>
      <p className="text-sm font-bold opacity-70 mt-2">Este reporte es exclusivo para la administración clínica.</p>
      <Link href="/" className="mt-8 bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs uppercase font-black shadow-xl">Volver al Inicio</Link>
    </div>
  )

  return (
    <main className="p-8 max-w-6xl mx-auto min-h-screen bg-slate-50 text-slate-900">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 no-print">
        <div>
          <Link href="/" className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 mb-4 hover:text-blue-600 transition-colors">
            <ArrowLeft size={14} /> Panel Principal
          </Link>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
            Rendimiento <span className="text-blue-600">Profesional</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">Cálculo de producción mensual y comisiones de dentistas.</p>
        </div>

        <div className="flex gap-4 bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 w-full md:w-auto">
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1">Fecha Inicio</span>
            <input type="date" value={rango.inicio} onChange={(e) => setRango({...rango, inicio: e.target.value})} className="outline-none font-black text-slate-700 p-1 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 transition-all" />
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1">Fecha Término</span>
            <input type="date" value={rango.fin} onChange={(e) => setRango({...rango, fin: e.target.value})} className="outline-none font-black text-slate-700 p-1 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 transition-all" />
          </div>
        </div>
      </header>

      {errorDB ? (
        <div className="bg-red-50 border-2 border-red-100 p-12 rounded-[3.5rem] text-center shadow-inner">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-red-900 font-black text-2xl tracking-tighter leading-none">Estructura incompleta</h3>
          <p className="text-red-600 font-bold mt-3">Columna faltante: {errorDB}</p>
          <div className="mt-8 p-4 bg-white/50 rounded-2xl border border-red-100">
             <code className="text-[10px] text-red-400 font-mono">ALTER TABLE atenciones_realizadas ADD COLUMN created_at timestamptz DEFAULT now();</code>
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[4rem] border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Analizando libros contables...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {datos.length > 0 ? datos.map((dentista, idx) => (
            <div key={idx} className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-50 hover:translate-y-[-8px] transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:rotate-45 transition-transform"><BarChart3 size={120} /></div>
              
              <div className="bg-blue-600 w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-100">
                <TrendingUp size={30} />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1 truncate">{dentista.nombre}</h3>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-8">{dentista.cantidad} Atenciones Realizadas</p>
              
              <div className="space-y-6 relative z-10">
                <div className="flex flex-col bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Total Producción</span>
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">${dentista.total.toLocaleString('es-CL')}</span>
                </div>

                <div className="flex flex-col bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 leading-none">Honorarios Sugeridos (40%)</span>
                  <span className="text-3xl font-black text-emerald-700 tracking-tighter">${(dentista.total * 0.4).toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full bg-white p-24 rounded-[4rem] text-center border-4 border-dashed border-slate-100">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300 shadow-inner">
                <Users size={48} />
              </div>
              <h4 className="text-3xl font-black text-slate-300 tracking-tighter uppercase leading-none">Periodo sin movimientos</h4>
              <p className="text-slate-400 font-bold mt-4">Verifica los registros de evolución clínica en este rango de fechas.</p>
            </div>
          )}
        </div>
      )}

      {/* FOOTER RESUMEN CLÍNICA */}
      {!loading && datos.length > 0 && (
        <footer className="mt-12 p-10 bg-slate-900 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-6">
            <div className="bg-blue-500/20 p-5 rounded-[2rem] border border-blue-500/20"><DollarSign size={32} className="text-blue-400" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 mb-2 leading-none">Ingreso Total Clínica</p>
              <p className="text-5xl font-black tracking-tighter leading-none">${datos.reduce((a, b) => a + b.total, 0).toLocaleString('es-CL')}</p>
            </div>
          </div>
          <button 
            onClick={() => window.print()} 
            className="bg-white text-slate-900 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3 active:scale-95 no-print"
          >
            <Printer size={18} /> Imprimir Reporte
          </button>
        </footer>
      )}
    </main>
  )
}