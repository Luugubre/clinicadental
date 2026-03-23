'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  History, Calendar, Clock, Stethoscope, 
  Quote, UserRoundPen, Loader2, Image as ImageIcon, 
  FileText, DollarSign, User, CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function HistorialPage() {
  const { id: paciente_id } = useParams()
  const [bitacora, setBitacora] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todas' | 'mias'>('todas')

  useEffect(() => {
    if (paciente_id) {
      obtenerTodoElHistorial()
    }
  }, [paciente_id])

  async function obtenerTodoElHistorial() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)

    try {
      // 1. Consultas en paralelo para mayor velocidad
      const [
        { data: evoluciones },
        { data: presupuestos },
        { data: archivos },
        { data: documentos },
        { data: profesionales }
      ] = await Promise.all([
        supabase.from('evoluciones').select('*').eq('paciente_id', paciente_id),
        supabase.from('presupuestos').select('*').eq('paciente_id', paciente_id),
        supabase.from('archivos_pacientes').select('*').eq('paciente_id', paciente_id),
        supabase.from('documentos_clinicos').select('*').eq('paciente_id', paciente_id),
        supabase.from('profesionales').select('user_id, nombre, apellido')
      ])

      // 2. Normalizar y etiquetar cada tipo de evento
      const evs = (evoluciones || []).map(e => ({
        ...e,
        tipo: 'evolucion',
        fecha: e.fecha_registro,
        icon: <Stethoscope size={16} />,
        color: 'blue'
      }))

      const pres = (presupuestos || []).map(p => ({
        ...p,
        tipo: 'presupuesto',
        fecha: p.created_at,
        titulo: `Nuevo Presupuesto: ${p.nombre_tratamiento || 'Sin nombre'}`,
        descripcion: `Monto total: $${p.total?.toLocaleString('es-CL')}`,
        icon: <DollarSign size={16} />,
        color: 'emerald'
      }))

      const arcs = (archivos || []).map(a => ({
        ...a,
        tipo: 'archivo',
        fecha: a.fecha_subida,
        titulo: `Archivo Subido: ${a.nombre_archivo}`,
        descripcion: `Tipo: ${a.tipo_archivo}`,
        icon: <ImageIcon size={16} />,
        color: 'purple'
      }))

      const docs = (documentos || []).map(d => ({
        ...d,
        tipo: 'documento',
        fecha: d.fecha_creacion,
        titulo: d.titulo_documento,
        descripcion: `Documento clínico generado`,
        icon: <FileText size={16} />,
        color: 'orange'
      }))

      // 3. Unir todo y ordenar por fecha descendente
      const total = [...evs, ...pres, ...arcs, ...docs].sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )

      // 4. Mapear nombres de profesionales
      const final = total.map(item => ({
        ...item,
        autor: profesionales?.find(p => p.user_id === (item.profesional_id || item.especialista_id || item.creado_por))
      }))

      setBitacora(final)
    } catch (err) {
      console.error("Error al cargar bitacora completa")
    } finally {
      setLoading(false)
    }
  }

  const bitacoraFiltrada = bitacora.filter(item => {
    if (filtro === 'mias') return (item.profesional_id || item.especialista_id || item.creado_por) === currentUserId
    return true
  })

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Sincronizando Bitácora Total...</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* HEADER COMPACTO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase italic leading-none">Bitácora del Paciente</h2>
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Historial Maestro de Actividad</p>
          </div>
        </div>

        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
          <button onClick={() => setFiltro('todas')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filtro === 'todas' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Todas</button>
          <button onClick={() => setFiltro('mias')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 ${filtro === 'mias' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><User size={10} /> Mis Acciones</button>
        </div>
      </div>

      {/* LÍNEA DE TIEMPO MULTIPROPÓSITO */}
      <div className="relative ml-6 border-l-2 border-slate-100 pl-10 space-y-8">
        <AnimatePresence mode='popLayout'>
          {bitacoraFiltrada.map((item) => (
            <motion.div 
              layout key={item.id} 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              {/* PUNTO DE LA LÍNEA SEGÚN COLOR */}
              <div className={`absolute -left-[51px] top-2 w-5 h-5 bg-white border-4 rounded-full shadow-sm z-10 ${
                item.color === 'blue' ? 'border-blue-500' : 
                item.color === 'emerald' ? 'border-emerald-500' :
                item.color === 'purple' ? 'border-purple-500' : 'border-orange-500'
              }`}></div>
              
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      item.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                      item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                      item.color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase italic">
                        {item.titulo || (item.tipo === 'evolucion' ? 'Evolución Clínica' : 'Evento')}
                      </h4>
                      <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                        <Calendar size={10} />
                        {new Date(item.fecha).toLocaleDateString('es-CL')}
                        <Clock size={10} className="ml-1" />
                        {new Date(item.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  {/* AUTOR */}
                  <div className="text-right">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter block">Realizado por:</span>
                    <span className="text-[9px] font-bold text-slate-600 uppercase italic">
                       {item.autor ? `Dr. ${item.autor.nombre} ${item.autor.apellido}` : 'Sistema'}
                    </span>
                  </div>
                </div>

                {/* CONTENIDO VARIABLE */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                  {item.tipo === 'evolucion' ? (
                    <p className="text-xs text-slate-700 italic leading-relaxed">"{item.descripcion_procedimiento}"</p>
                  ) : (
                    <p className="text-xs text-slate-600 font-medium">{item.descripcion}</p>
                  )}
                  
                  {/* VISTA PREVIA SI ES IMAGEN */}
                  {item.tipo === 'archivo' && item.url_archivo && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 w-32 h-20">
                       <img src={item.url_archivo} className="w-full h-full object-cover hover:scale-110 transition-all cursor-zoom-in" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}