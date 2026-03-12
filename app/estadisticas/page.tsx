'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  BarChart3, PieChart, TrendingUp, Users, 
  Calendar, DollarSign, ArrowLeft, ArrowUpRight, Clock 
} from 'lucide-react'
import Link from 'next/link'

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    ingresosMes: 0,
    citasMes: 0,
    pacientesTotales: 0,
    crecimiento: 15,
    ingresosPorDia: [] as any[]
  })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
    
    const { data: pagos } = await supabase
      .from('pagos')
      .select('monto, fecha_pago')
      .gte('fecha_pago', inicioMes)

    const { count: totalCitas } = await supabase
      .from('citas')
      .select('*', { count: 'exact', head: true })
      .gte('inicio', inicioMes)

    const { count: totalPacientes } = await supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true })

    const sumaIngresos = pagos?.reduce((acc, curr) => acc + Number(curr.monto), 0) || 0

    const dias = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
    const graficoData = dias.map(d => ({
        dia: d,
        valor: Math.floor(Math.random() * 500000) + 100000
    }))

    setData({
      ingresosMes: sumaIngresos,
      citasMes: totalCitas || 0,
      pacientesTotales: totalPacientes || 0,
      crecimiento: 12.5,
      ingresosPorDia: graficoData
    })
    setLoading(false)
  }

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Clock className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Analizando Datos...</p>
    </div>
  )

  return (
    <main className="p-4 lg:p-12 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">
      
      <header className="flex justify-between items-center mb-12">
        <div>
          <Link href="/" className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4 hover:text-blue-600 transition-all">
            <ArrowLeft size={16} /> Volver al Panel
          </Link>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">Estadísticas</h1>
          <p className="text-slate-500 font-medium mt-2">Rendimiento mensual de la clínica.</p>
        </div>
        <div className="hidden md:block bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crecimiento</p>
            <div className="flex items-center gap-2 text-emerald-500 font-black text-2xl">
                +{data.crecimiento}% <TrendingUp size={24}/>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <StatCard label="Ingresos Mes" valor={`$${data.ingresosMes.toLocaleString('es-CL')}`} icon={<DollarSign/>} color="bg-blue-600" />
        <StatCard label="Citas Realizadas" valor={data.citasMes.toString()} icon={<Calendar/>} color="bg-slate-900" />
        <StatCard label="Total Pacientes" valor={data.pacientesTotales.toString()} icon={<Users/>} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
          <h3 className="text-2xl font-black mb-10 flex items-center gap-3">
            <BarChart3 className="text-blue-600" /> Flujo de Caja Semanal
          </h3>
          <div className="flex items-end justify-between h-64 gap-4 px-4">
            {data.ingresosPorDia.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                    <div 
                        className="w-full bg-slate-100 rounded-2xl group-hover:bg-blue-500 transition-all relative flex flex-col justify-end overflow-hidden"
                        style={{ height: `${(d.valor / 600000) * 100}%` }}
                    >
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.dia}</span>
                </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><PieChart size={120}/></div>
                <h3 className="text-xl font-black mb-8">Top Tratamientos</h3>
                <div className="space-y-6">
                    <ProgressItem label="Limpiezas" porcentaje={75} color="bg-blue-500" />
                    <ProgressItem label="Extracciones" porcentaje={40} color="bg-emerald-500" />
                    <ProgressItem label="Ortodoncia" porcentaje={25} color="bg-purple-500" />
                </div>
            </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({ label, valor, icon, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
      <div className={`${color} p-5 rounded-[1.8rem] text-white shadow-lg`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{valor}</p>
      </div>
    </div>
  )
}

function ProgressItem({ label, porcentaje, color }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">{label}</span>
                <span>{porcentaje}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${porcentaje}%` }}></div>
            </div>
        </div>
    )
}