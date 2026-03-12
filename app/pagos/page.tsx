'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DollarSign, TrendingUp, Users, Calendar, Download } from 'lucide-react'

export default function PagosPage() {
  const [pagos, setPagos] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, promedio: 0, cantidad: 0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetchPagos()
  }, [])

  async function fetchPagos() {
    // Traemos las evoluciones con los datos del paciente para saber quién pagó
    const { data, error } = await supabase
      .from('evoluciones')
      .select(`
        id, 
        monto_cobrado, 
        descripcion_procedimiento, 
        fecha_registro,
        pacientes (nombre, apellido)
      `)
      .order('fecha_registro', { ascending: false })

    if (data) {
      setPagos(data)
      const total = data.reduce((acc, curr) => acc + Number(curr.monto_cobrado), 0)
      setStats({
        total: total,
        cantidad: data.length,
        promedio: data.length > 0 ? total / data.length : 0
      })
    }
    setCargando(false)
  }

  return (
    <main className="p-8 text-slate-900 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Resumen Financiero</h1>
        <button className="flex items-center gap-2 bg-white border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
          <Download size={18} /> Exportar Reporte
        </button>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-xl text-green-600"><DollarSign /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Ingresos Totales</p>
              <h3 className="text-2xl font-bold">${stats.total.toLocaleString('es-CL')}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><TrendingUp /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Promedio por Atención</p>
              <h3 className="text-2xl font-bold">${Math.round(stats.promedio).toLocaleString('es-CL')}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><Users /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Atenciones</p>
              <h3 className="text-2xl font-bold">{stats.cantidad}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE ÚLTIMOS PAGOS */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="font-bold text-lg">Historial de Ingresos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Paciente</th>
                <th className="p-4 font-semibold">Procedimiento</th>
                <th className="p-4 font-semibold text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {pagos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-500">
                    {new Date(p.fecha_registro).toLocaleDateString('es-CL')}
                  </td>
                  <td className="p-4 font-bold">
                    {p.pacientes?.nombre} {p.pacientes?.apellido}
                  </td>
                  <td className="p-4 text-gray-600">{p.descripcion_procedimiento}</td>
                  <td className="p-4 text-right font-bold text-green-600">
                    ${Number(p.monto_cobrado).toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
              {pagos.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-400 italic">
                    No se han registrado pagos aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}