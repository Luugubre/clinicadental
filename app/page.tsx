'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/app/hooks/useRole'
import { toast } from 'sonner'
import { 
  DollarSign, Users, Calendar, ArrowUpRight, UserPlus, 
  Activity, Clock, Search, User, LogOut, MessageCircle, 
  BellRing, CheckCircle2, BarChart3, Wallet, TrendingUp, TrendingDown,
  LayoutGrid, Stethoscope, Edit3, X, Check, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import CierreCaja from './dashboard/cierrecaja' 

export default function Dashboard() {
  const { rol, isAdmin, isRecepcionista, isDentista, cargando } = useRole()
  const [stats, setStats] = useState({ citas: 0, pacientesNuevos: 0, ingresos: 0 })
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [balance, setBalance] = useState({ ingresos: 0, gastos: 0, utilidad: 0 })

  // ESTADOS PARA REPROGRAMAR
  const [citaAEditar, setCitaAEditar] = useState<any>(null)
  const [nuevaHora, setNuevaHora] = useState('')
  const [nuevaFecha, setNuevaFecha] = useState('')

  const horasDisponibles = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00']

  useEffect(() => {
    if (!cargando) {
        fetchRealStats()
        fetchProximasCitas()
        if (isAdmin) fetchBalanceMensual()
    }
  }, [cargando, isAdmin])

  // --- LÓGICA REALTIME ---
  useEffect(() => {
    if (cargando) return;
    const canalCitas = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => {
        fetchProximasCitas()
        fetchRealStats()
      })
      .subscribe()
    return () => { supabase.removeChannel(canalCitas) }
  }, [cargando])

  async function fetchBalanceMensual() {
    const mes = new Date().getMonth() + 1
    const anio = new Date().getFullYear()
    const { data } = await supabase.rpc('obtener_balance_mensual', { mes, anio })
    if (data && data[0]) {
      setBalance({
        ingresos: Number(data[0].total_ingresos),
        gastos: Number(data[0].total_egresos),
        utilidad: Number(data[0].utilidad_neta)
      })
    }
  }

  const reprogramarCita = async () => {
    if (!nuevaHora || !nuevaFecha) return toast.error("Selecciona fecha y hora");
    
    const inicio = `${nuevaFecha} ${nuevaHora}:00`;
    const horaFin = (parseInt(nuevaHora.split(':')[0]) + 1).toString().padStart(2, '0') + ':00';
    const fin = `${nuevaFecha} ${horaFin}:00`;

    const { error } = await supabase
      .from('citas')
      .update({ inicio, fin })
      .eq('id', citaAEditar.id);

    if (error) {
      toast.error("Error al reprogramar: El horario o box podrían estar ocupados");
    } else {
      toast.success("Cita reprogramada con éxito");
      setCitaAEditar(null);
      fetchProximasCitas();
    }
  }

  const gestionarConfirmacionWsp = async (cita: any) => {
    const mensaje = `Hola ${cita.paciente_nombre}, confirmamos tu cita hoy a las ${cita.hora.substring(0, 5)} en Clínica Dental. ¿Asistes?`;
    const tel = cita.paciente_telefono?.replace(/\D/g, '');
    window.open(`https://api.whatsapp.com/send?phone=56${tel}&text=${encodeURIComponent(mensaje)}`, '_blank');
    await supabase.from('citas').update({ estado_confirmacion: 'enviado' }).eq('id', cita.id);
    fetchProximasCitas();
  }

  const marcarConfirmado = async (id: string) => {
    await supabase.from('citas').update({ estado_confirmacion: 'confirmado' }).eq('id', id);
    fetchProximasCitas();
  }

  const marcarLlegada = async (id: string) => {
    await supabase.from('citas').update({ llegada_confirmada: true, hora_llegada: new Date().toISOString() }).eq('id', id);
    fetchProximasCitas();
  }

  const finalizarAtencion = async (id: string) => {
    if(!window.confirm("¿Finalizar atención?")) return;
    await supabase.from('citas').update({ estado: 'completada', llegada_confirmada: false }).eq('id', id);
    fetchProximasCitas();
  }

  async function fetchRealStats() {
    const hoy = new Date().toLocaleDateString('en-CA') 
    const { count: cCitas } = await supabase.from('citas').select('*', { count: 'exact', head: true }).gte('inicio', `${hoy} 00:00:00`).lt('inicio', `${hoy} 23:59:59`)
    const { count: cPac } = await supabase.from('pacientes').select('*', { count: 'exact', head: true }).gte('created_at', `${hoy}`)
    
    let totalIngresos = 0
    if (isAdmin) {
        const { data: pagos } = await supabase.from('pagos').select('monto').gte('fecha_pago', `${hoy}T00:00:00`)
        totalIngresos = pagos?.reduce((acc, curr) => acc + Number(curr.monto), 0) || 0
    }
    setStats({ citas: cCitas || 0, pacientesNuevos: cPac || 0, ingresos: totalIngresos })
  }

  async function fetchProximasCitas() {
    const hoy = new Date().toLocaleDateString('en-CA')
    const { data, error } = await supabase
      .from('citas_detalladas')
      .select('*')
      .eq('fecha', hoy)
      .eq('estado', 'programada') 
      .order('hora', { ascending: true })
    
    if (error) console.error("Error fetching citas:", error)
    else setProximasCitas(data || [])
  }

  if (cargando) return <div className="p-20 text-center animate-pulse font-black text-blue-600">Sincronizando DentaPro...</div>

  return (
    <main className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 text-slate-900">
      
      {/* 1. SECCIÓN DENTISTA: BANNER DE PACIENTE EN SALA */}
      {isDentista && proximasCitas.filter(c => c.llegada_confirmada).map(cita => (
        <div key={cita.id} className="mb-6 bg-emerald-500 text-white p-6 rounded-[2.5rem] shadow-2xl flex justify-between items-center border-4 border-white animate-bounce">
          <div className="flex items-center gap-4">
            <User size={32} className="bg-white/20 p-2 rounded-2xl" />
            <div>
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">Atendiendo en Box {cita.box_id}</p>
              <h4 className="text-2xl font-black">{cita.paciente_nombre} {cita.paciente_apellido}</h4>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/pacientes/${cita.paciente_id}`} className="bg-white/20 px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-white/30">Ficha</Link>
            <button onClick={() => finalizarAtencion(cita.id)} className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-black text-xs uppercase">Finalizar</button>
          </div>
        </div>
      ))}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Módulo {rol}</span>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">DentaPro Panel</h1>
        </div>
        {(isAdmin || isRecepcionista) && (
          <Link href="/pacientes/nuevo" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl transition-all active:scale-95 uppercase text-xs">
            <UserPlus size={18} /> Nuevo Paciente
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <CardMetrica label="Citas de Hoy" valor={stats.citas.toString()} icon={<Calendar className="text-blue-600" />} color="bg-blue-50" />
        {isAdmin ? (
          <CardMetrica label="Recaudación Hoy" valor={`$${stats.ingresos.toLocaleString()}`} icon={<DollarSign className="text-emerald-600" />} color="bg-emerald-50" destacado />
        ) : (
          <CardMetrica label="Nuevos Pacientes" valor={stats.pacientesNuevos.toString()} icon={<Users className="text-purple-600" />} color="bg-purple-50" />
        )}
        
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center gap-2">
          {isAdmin && <Link href="/reportes/productividad" className="flex items-center gap-2 text-xs font-black text-blue-600 hover:underline"><BarChart3 size={14}/> Reporte Productividad</Link>}
          {isDentista && <Link href="/reportes/productividad" className="flex items-center gap-2 text-xs font-black text-purple-600 hover:underline"><Wallet size={14}/> Mis Honorarios</Link>}
          <button onClick={() => supabase.auth.signOut()} className="text-left flex items-center gap-2 text-xs font-black text-red-400 hover:text-red-600 mt-1"><LogOut size={14}/> Cerrar Sesión</button>
        </div>
      </div>

      {/* BALANCE MENSUAL */}
      {isAdmin && (
        <section className="mb-12">
          <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 scale-150">
              <DollarSign size={200} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-600 p-2 rounded-lg"><Activity size={18}/></div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-blue-400">Balance Mensual • {new Date().toLocaleString('es-CL', { month: 'long' })}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"><TrendingUp size={12} className="text-emerald-500"/> Ingresos</p>
                  <p className="text-4xl font-black text-white tracking-tighter">${balance.ingresos.toLocaleString('es-CL')}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"><TrendingDown size={12} className="text-red-500"/> Gastos</p>
                  <p className="text-4xl font-black text-white tracking-tighter">-${balance.gastos.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-sm">
                  <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-2 leading-none">Utilidad Neta</p>
                  <p className={`text-5xl font-black tracking-tighter leading-none ${balance.utilidad >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                    ${balance.utilidad.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black flex items-center gap-3"><Clock className="text-blue-500" /> Agenda de Hoy</h3>
                <Link href="/agenda" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Multibox</Link>
            </div>
            <div className="space-y-4">
                {proximasCitas.length > 0 ? proximasCitas.map((cita) => (
                    <div key={cita.id} className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${
                      cita.estado_confirmacion === 'confirmado' ? 'bg-emerald-50 border-emerald-100' : 
                      cita.estado_confirmacion === 'enviado' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-transparent'
                    }`}>
                        <div className="flex items-center gap-5">
                            <div className={`p-3 rounded-2xl font-mono font-black text-sm ${cita.estado_confirmacion === 'confirmado' ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600 shadow-sm'}`}>
                              {cita.hora.substring(0, 5)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-black text-slate-800 uppercase text-sm">{cita.paciente_nombre} {cita.paciente_apellido}</p>
                                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">Box {cita.box_id}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                                        <Stethoscope size={10} /> {cita.nombre_dentista || 'Sin asignar'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                      {cita.llegada_confirmada ? '✅ EN SALA' : (cita.estado_confirmacion || 'PENDIENTE')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            {(isRecepcionista || isAdmin) && !cita.llegada_confirmada && (
                              <>
                                <button 
                                  onClick={() => {
                                    setCitaAEditar(cita);
                                    setNuevaFecha(cita.fecha);
                                    setNuevaHora(cita.hora.substring(0, 5));
                                  }}
                                  className="p-3 bg-white text-blue-500 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                                  <Edit3 size={18}/>
                                </button>
                                <button onClick={() => gestionarConfirmacionWsp(cita)} className="p-3 bg-white text-amber-500 rounded-xl border border-amber-100 hover:bg-amber-500 hover:text-white transition-all"><MessageCircle size={18}/></button>
                                <button onClick={() => marcarLlegada(cita.id)} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100">Llegó</button>
                              </>
                            )}
                            <Link href={`/pacientes/${cita.paciente_id}`} className="p-3 bg-white rounded-xl text-slate-400 hover:text-blue-600 border border-slate-100 shadow-sm"><ArrowUpRight size={18} /></Link>
                        </div>
                    </div>
                )) : <p className="text-center text-slate-400 py-10 italic">Sin citas para hoy.</p>}
            </div>
          </div>
        </div>

        {/* MONITOR DE BOXES */}
        <div className="space-y-8">
           {isAdmin && <CierreCaja />}
           <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12"><LayoutGrid size={100}/></div>
             <h4 className="font-black text-xl mb-4 tracking-tight">Ocupación Boxes</h4>
             <div className="space-y-3">
                {[1, 2, 3].map(box => {
                    const ocupado = proximasCitas.some(c => c.box_id === box && c.llegada_confirmada);
                    return (
                        <div key={box} className="flex items-center justify-between bg-white/10 p-3 rounded-2xl">
                            <span className="text-xs font-black uppercase">Box {box}</span>
                            <span className={`h-3 w-3 rounded-full ${ocupado ? 'bg-red-400 animate-pulse shadow-[0_0_10px_rgba(248,113,113,0.8)]' : 'bg-emerald-400'}`}></span>
                        </div>
                    )
                })}
             </div>
           </div>
        </div>
      </div>

      {/* MODAL REPROGRAMAR */}
      <AnimatePresence>
        {citaAEditar && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative">
              <button onClick={() => setCitaAEditar(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"><X size={24}/></button>
              <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tighter">Reprogramar Cita</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Nueva Fecha</label>
                  <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Nueva Hora</label>
                  <div className="grid grid-cols-3 gap-2">
                    {horasDisponibles.map(h => (
                      <button key={h} onClick={() => setNuevaHora(h)}
                        className={`py-3 rounded-xl font-bold text-xs transition-all ${nuevaHora === h ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={reprogramarCita} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all">
                  Confirmar Cambio
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

function CardMetrica({ label, valor, icon, color, destacado = false }: any) {
  return (
    <div className={`p-8 rounded-[2.8rem] border border-slate-100 shadow-sm flex items-center gap-6 transition-all hover:translate-y-[-4px] bg-white ${destacado ? 'border-b-[10px] border-b-emerald-500' : ''}`}>
      <div className={`${color} p-5 rounded-[1.6rem] shadow-sm`}>{icon}</div>
      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p><p className="text-4xl font-black text-slate-900 tracking-tighter">{valor}</p></div>
    </div>
  )
}