'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Wallet, Plus, Lock, Unlock, Users, Info, 
  Calendar, ArrowRight, Loader2, CheckCircle2, History,
  Banknote, X, ReceiptText, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export default function GestionCajasPage() {
  const router = useRouter()
  const [cajasAbiertas, setCajasAbiertas] = useState<any[]>([])
  const [cajasCerradas, setCajasCerradas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalApertura, setModalApertura] = useState(false)
  const [abriendoCaja, setAbriendoCaja] = useState(false)
  
  // Formulario Apertura
  const [responsable, setResponsable] = useState('Cargando...')
  const [montoInicial, setMontoInicial] = useState('0')

  useEffect(() => {
    fetchCajas()
    obtenerNombreUsuario()
  }, [])

  async function obtenerNombreUsuario() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('nombre_completo')
          .eq('id', user.id)
          .single()

        if (perfil?.nombre_completo) {
          setResponsable(perfil.nombre_completo)
        } else {
          setResponsable(user.user_metadata?.nombre_completo || user.email || 'Recepcionista')
        }
      }
    } catch (err) {
      setResponsable('Error al cargar nombre')
    }
  }

  async function fetchCajas() {
    setCargando(true)
    try {
      // Obtenemos cajas abiertas y sumamos los pagos vinculados
      const { data: abiertas, error: errAb } = await supabase
        .from('sesiones_caja')
        .select(`
          *,
          pagos(monto)
        `)
        .eq('estado', 'abierta')
        .order('fecha_apertura', { ascending: false })

      if (errAb) throw errAb

      const { data: cerradas, error: errCe } = await supabase
        .from('sesiones_caja')
        .select('*')
        .eq('estado', 'cerrada')
        .limit(15)
        .order('fecha_cierre', { ascending: false })
      
      if (errCe) throw errCe
      
      const abiertasProcesadas = abiertas?.map(caja => {
        const sumaPagos = caja.pagos?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0
        return { ...caja, acumulado: Number(caja.monto_apertura) + sumaPagos }
      }) || []

      setCajasAbiertas(abiertasProcesadas)
      setCajasCerradas(cerradas || [])
    } catch (error) {
      console.error("Error al cargar cajas:", error)
      toast.error("Error al sincronizar datos de caja")
    } finally {
      setCargando(false)
    }
  }

  const handleAbrirCaja = async () => {
    if (abriendoCaja) return
    setAbriendoCaja(true)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error("No autenticado")

      const nuevaCaja = {
        usuario_id: user.id,
        nombre_responsable: responsable,
        monto_apertura: Number(montoInicial) || 0,
        estado: 'abierta',
        fecha_apertura: new Date().toISOString()
      }

      const { error } = await supabase.from('sesiones_caja').insert([nuevaCaja])
      if (error) throw error

      toast.success("Caja abierta correctamente")
      setModalApertura(false)
      setMontoInicial('0')
      fetchCajas()
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setAbriendoCaja(false)
    }
  }

  const handleCerrarCaja = async (caja: any) => {
    if (!confirm(`¿Cerrar caja de ${caja.nombre_responsable}?`)) return

    try {
      const { error } = await supabase.from('sesiones_caja')
        .update({ 
          estado: 'cerrada', 
          fecha_cierre: new Date().toISOString(),
          monto_cierre: caja.acumulado 
        })
        .eq('id', caja.id)

      if (error) throw error
      toast.success("Caja cerrada y guardada en historial")
      fetchCajas()
    } catch (error: any) {
      toast.error("Error al cerrar caja")
    }
  }

  if (cargando) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Cargando Módulo...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-end bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-800">Control de Caja</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Terminal de Arqueo y Recaudación</p>
          </div>
          <button 
            onClick={() => setModalApertura(true)}
            className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase flex items-center gap-3 shadow-xl shadow-blue-100 hover:bg-slate-900 active:scale-95 transition-all"
          >
            <Plus size={20} /> Abrir Turno
          </button>
        </div>

        {/* ALERTA */}
        <div className="bg-amber-50 border-l-8 border-amber-400 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
          <div className="bg-white p-3 rounded-xl text-amber-500 shadow-sm"><Info size={24} /></div>
          <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
            Atención: Los pagos reflejados en los resumenes presentes en estas secciones <span className="underline decoration-2 font-black">no reflejan</span> los pagos recibidos de descuentos por planilla.
          </p>
        </div>

        {/* CAJAS ABIERTAS */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-4">Sesiones Activas</h2>
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr className="text-[9px] font-black uppercase text-slate-400">
                  <th className="px-8 py-6">Responsable</th>
                  <th className="px-8 py-6">Apertura</th>
                  <th className="px-8 py-6">Saldo Inicial</th>
                  <th className="px-8 py-6">Acumulado</th>
                  <th className="px-8 py-6 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cajasAbiertas.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-300 font-black uppercase text-xs italic">Sin turnos abiertos</td></tr>
                ) : cajasAbiertas.map((caja) => (
                  <tr key={caja.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-8 font-black text-sm uppercase italic text-slate-800">{caja.nombre_responsable}</td>
                    <td className="px-8 py-8 text-xs font-bold text-slate-400">{new Date(caja.fecha_apertura).toLocaleString('es-CL')}</td>
                    <td className="px-8 py-8 font-black text-sm text-slate-400">${caja.monto_apertura.toLocaleString('es-CL')}</td>
                    <td className="px-8 py-8 font-black text-2xl text-emerald-600">${caja.acumulado?.toLocaleString('es-CL')}</td>
                    <td className="px-8 py-8 text-center">
                      <button onClick={() => handleCerrarCaja(caja)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-red-600 transition-all shadow-xl">Cerrar Caja</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* HISTORIAL */}
        <section className="space-y-4 pt-6">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-4 flex items-center gap-2">
            <History size={16} /> Historial (Clic para detalle)
          </h2>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr className="text-[9px] font-black uppercase text-slate-400">
                  <th className="px-8 py-5">Responsable</th>
                  <th className="px-8 py-5">Fecha Cierre</th>
                  <th className="px-8 py-5 text-right pr-12">Recaudación Final</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cajasCerradas.map((caja) => (
                  <tr 
                    key={caja.id} 
                    onClick={() => router.push(`/cajas/${caja.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-all group"
                  >
                    <td className="px-8 py-6 flex items-center gap-3">
                      <span className="font-bold text-xs uppercase text-slate-600">{caja.nombre_responsable}</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </td>
                    <td className="px-8 py-6 text-[11px] font-medium text-slate-400">{new Date(caja.fecha_cierre).toLocaleString('es-CL')}</td>
                    <td className="px-8 py-6 font-black text-sm text-slate-700 text-right pr-12">${(caja.monto_cierre || 0).toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* MODAL APERTURA */}
      <AnimatePresence>
        {modalApertura && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg"><Wallet size={24}/></div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Apertura de Caja</h3>
                </div>
                <button onClick={() => setModalApertura(false)} className="p-3 hover:bg-red-500 rounded-2xl transition-all"><X size={24}/></button>
              </div>

              <div className="p-12 space-y-8">
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Responsable:</label>
                  <div className="flex items-center gap-4 text-slate-800">
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-600"><Users size={24}/></div>
                    <span className="font-black uppercase text-lg italic tracking-tight">{responsable}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block tracking-widest">Saldo inicial de sencillo ($)</label>
                  <div className="relative">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-emerald-500">$</span>
                    <input 
                      type="number" 
                      value={montoInicial} 
                      onChange={(e) => setMontoInicial(e.target.value)}
                      className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 focus:bg-white rounded-[2.5rem] py-8 pl-16 pr-8 text-4xl font-black outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setModalApertura(false)} className="flex-1 py-6 rounded-3xl font-black text-xs uppercase text-slate-400">Cancelar</button>
                  <button 
                    disabled={abriendoCaja}
                    onClick={handleAbrirCaja}
                    className="flex-[2] bg-blue-600 text-white py-6 rounded-[2rem] font-black text-sm uppercase shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-3"
                  >
                    {abriendoCaja ? <Loader2 className="animate-spin" /> : 'Confirmar Apertura'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}