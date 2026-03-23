'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/app/hooks/useRole'
import { toast } from 'sonner'
import { 
  DollarSign, Users, Calendar, ArrowUpRight, UserPlus, 
  Activity, Clock, User, LogOut, MessageCircle, 
  CheckCircle2, BarChart3, Wallet, TrendingUp, TrendingDown,
  LayoutGrid, Stethoscope, Edit3, X, Loader2, HeartPulse, 
  CalendarCheck, ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import CierreCaja from './dashboard/cierrecaja' 

export default function Dashboard() {
  const router = useRouter()
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

  // --- LÓGICA CIERRE DE SESIÓN ---
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

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

    const { error } = await supabase.from('citas').update({ inicio, fin }).eq('id', citaAEditar.id);
    if (error) toast.error("Horario no disponible");
    else {
      toast.success("Cita reprogramada");
      setCitaAEditar(null);
      fetchProximasCitas();
    }
  }

  const gestionarConfirmacionWsp = async (cita: any) => {
    const mensaje = `Hola ${cita.paciente_nombre}, confirmamos tu cita hoy a las ${cita.hora.substring(0, 5)} en Clínica Dental Dignidad. Asistiras?`;
    const tel = cita.paciente_telefono?.replace(/\D/g, '');
    window.open(`https://api.whatsapp.com/send?phone=56${tel}&text=${encodeURIComponent(mensaje)}`, '_blank');
    await supabase.from('citas').update({ estado_confirmacion: 'enviado' }).eq('id', cita.id);
    fetchProximasCitas();
  }

  // --- ACTUALIZADO: REGISTRA HORA DE ENTRADA A BOX ---
  const marcarLlegada = async (id: string) => {
    const { error } = await supabase
      .from('citas')
      .update({ 
        llegada_confirmada: true, 
        hora_llegada: new Date().toISOString(),
        hora_inicio_atencion: new Date().toISOString() // Vital para Eficiencia $/hr
      })
      .eq('id', id);

    if (error) toast.error("Error al registrar llegada");
    else {
      toast.success("Paciente en sillón / Box");
      fetchProximasCitas();
    }
  }

  // --- ACTUALIZADO: REGISTRA HORA DE SALIDA Y ESTADO 'FINALIZADA' ---
  const finalizarAtencion = async (id: string) => {
    if(!window.confirm("¿Deseas finalizar la atención de este paciente?")) return;
    
    const { error } = await supabase
      .from('citas')
      .update({ 
        estado: 'finalizada',           // Cambiado de 'completada' para que el reporte lo lea
        llegada_confirmada: false,
        hora_fin_atencion: new Date().toISOString() // Vital para Eficiencia $/hr
      })
      .eq('id', id);

    if (error) {
      toast.error("Error al finalizar la atención");
    } else {
      toast.success("Atención finalizada con éxito");
      fetchProximasCitas();
      fetchRealStats();
    }
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
    let query = supabase.from('citas_detalladas').select('*').eq('fecha', hoy).eq('estado', 'programada').order('hora', { ascending: true })
    
    if (isDentista) {
      const { data: { user } } = await supabase.auth.getUser();
      query = query.eq('profesional_id', user?.id);
    }

    const { data } = await query
    setProximasCitas(data || [])
  }

  if (cargando) return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="font-black text-xs uppercase tracking-widest text-slate-400">Sincronizando Sistema...</p>
    </div>
  )

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 text-slate-900">
      
      {/* PACIENTE EN SILLÓN (ALERTA DENTISTA) */}
      {isDentista && proximasCitas.filter(c => c.llegada_confirmada).map(cita => (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} key={cita.id} className="mb-8 bg-blue-600 text-white p-8 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 border-4 border-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><HeartPulse size={120}/></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md"><User size={40} /></div>
            <div>
              <p className="text-[10px] font-black uppercase opacity-70 tracking-widest mb-1">Paciente en Box {cita.box_id}</p>
              <h4 className="text-3xl font-black tracking-tight">{cita.paciente_nombre} {cita.paciente_apellido}</h4>
            </div>
          </div>
          <div className="flex gap-3 relative z-10">
            <Link href={`/pacientes/${cita.paciente_id}`} className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-xs uppercase hover:bg-blue-50 transition-all shadow-lg">Ficha Clínica</Link>
            <button onClick={() => finalizarAtencion(cita.id)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase hover:bg-black transition-all">Finalizar Atención</button>
          </div>
        </motion.div>
      ))}

      <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <ShieldCheck size={16} className="text-blue-500" />
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sistema de Gestión Clínica</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
            {isAdmin ? 'Dashboard Administrador' : isDentista ? 'Mi Agenda Médica' : 'Panel de Recepción'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {(isAdmin || isRecepcionista) && (
            <Link href="/pacientes/nuevo" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 uppercase text-[10px]">
              <UserPlus size={18} /> Registrar Paciente
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <CardMetrica label="Citas para hoy" valor={stats.citas.toString()} sub="Total programado" icon={<CalendarCheck className="text-blue-600" />} color="bg-blue-50" />
        
        {isAdmin ? (
          <CardMetrica label="Ingresos del día" valor={`$${stats.ingresos.toLocaleString('es-CL')}`} sub="Recaudación caja" icon={<DollarSign className="text-emerald-600" />} color="bg-emerald-50" destacado />
        ) : (
          <CardMetrica label="Pacientes nuevos" valor={stats.pacientesNuevos.toString()} sub="Registros hoy" icon={<UserPlus className="text-purple-600" />} color="bg-purple-50" />
        )}
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center gap-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atajos rápidos</p>
          <div className="grid grid-cols-2 gap-2">
            <Link href={isAdmin ? "/reportes" : "/mi-perfil"} className="p-3 bg-slate-50 rounded-xl flex flex-col gap-2 hover:bg-blue-50 transition-all">
                {isAdmin ? <BarChart3 size={16} className="text-blue-600"/> : <User size={16} className="text-blue-600"/>}
                <span className="text-[9px] font-black uppercase">{isAdmin ? 'Reportes' : 'Mi Perfil'}</span>
            </Link>
            <button onClick={handleSignOut} className="p-3 bg-red-50 rounded-xl flex flex-col gap-2 hover:bg-red-100 transition-all">
                <LogOut size={16} className="text-red-600"/>
                <span className="text-[9px] font-black uppercase text-red-600">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {isAdmin && (
        <section className="mb-10">
          <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
              <div>
                <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-4">Estado Mensual</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg"><TrendingUp size={16} className="text-emerald-400"/></div>
                    <div><p className="text-[9px] text-slate-400 uppercase font-bold">Ingresos</p><p className="text-2xl font-black">${balance.ingresos.toLocaleString('es-CL')}</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-500/20 rounded-lg"><TrendingDown size={16} className="text-red-400"/></div>
                    <div><p className="text-[9px] text-slate-400 uppercase font-bold">Gastos</p><p className="text-2xl font-black">-${balance.gastos.toLocaleString('es-CL')}</p></div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 bg-white/5 p-10 rounded-[3rem] border border-white/10 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                  <p className="text-blue-400 font-black text-xs uppercase tracking-widest mb-2">Utilidad Estimada</p>
                  <p className={`text-6xl font-black tracking-tighter ${balance.utilidad >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                    ${balance.utilidad.toLocaleString('es-CL')}
                  </p>
                </div>
                <Link href="/finanzas" className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase hover:scale-105 transition-all shadow-lg">Gestión Financiera</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black flex items-center gap-3"><Clock className="text-blue-500" /> Agenda Próxima</h3>
                <Link href="/agenda" className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full uppercase">Agenda Completa</Link>
            </div>
            
            <div className="space-y-3">
                {proximasCitas.length > 0 ? proximasCitas.map((cita) => (
                    <div key={cita.id} className={`flex flex-col md:flex-row items-center justify-between p-5 rounded-[2rem] border-2 transition-all gap-4 ${
                      cita.llegada_confirmada ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-transparent hover:border-slate-100'
                    }`}>
                        <div className="flex items-center gap-5 w-full">
                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${cita.llegada_confirmada ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 shadow-sm'}`}>
                              <span className="text-xs">{cita.hora.substring(0, 5)}</span>
                              <span className="text-[8px] uppercase opacity-60">Box {cita.box_id}</span>
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 uppercase text-sm mb-1">{cita.paciente_nombre} {cita.paciente_apellido}</h4>
                                <div className="flex items-center gap-3">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><Stethoscope size={10}/> Dr. {cita.nombre_dentista}</span>
                                  {cita.llegada_confirmada && <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-[5px] text-[7px] font-black animate-pulse uppercase">En Atención</span>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto justify-end">
                            {(isRecepcionista || isAdmin) && !cita.llegada_confirmada && (
                              <>
                                <button onClick={() => gestionarConfirmacionWsp(cita)} className="p-3 bg-white text-amber-500 rounded-xl border border-slate-100 hover:bg-amber-500 hover:text-white transition-all shadow-sm"><MessageCircle size={16}/></button>
                                <button onClick={() => { setCitaAEditar(cita); setNuevaFecha(cita.fecha); setNuevaHora(cita.hora.substring(0, 5)); }} className="p-3 bg-white text-blue-500 rounded-xl border border-slate-100 hover:bg-blue-500 hover:text-white transition-all shadow-sm"><Edit3 size={16}/></button>
                                <button onClick={() => marcarLlegada(cita.id)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase shadow-lg">Ingresar</button>
                              </>
                            )}
                            <Link href={`/pacientes/${cita.paciente_id}`} className="p-3 bg-white rounded-xl text-slate-300 hover:text-blue-600 border border-slate-100 shadow-sm"><ArrowUpRight size={16} /></Link>
                        </div>
                    </div>
                )) : <p className="text-center text-slate-400 py-16 italic text-sm">No hay citas pendientes para hoy.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           {isAdmin && <CierreCaja />}
           
           <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-6">
               <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><LayoutGrid size={18}/></div>
               <h4 className="font-black text-sm uppercase tracking-widest text-slate-800">Estado de Boxes</h4>
             </div>
             <div className="space-y-4">
                {[1, 2, 3].map(box => {
                    const ocupado = proximasCitas.find(c => c.box_id === box && c.llegada_confirmada);
                    return (
                        <div key={box} className={`p-4 rounded-2xl border-2 transition-all ${ocupado ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black uppercase text-slate-500">Box {box}</span>
                              <span className={`h-2 w-2 rounded-full ${ocupado ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                            </div>
                            <p className="text-xs font-black uppercase text-slate-800">{ocupado ? ocupado.paciente_nombre : 'Disponible'}</p>
                            {ocupado && <p className="text-[8px] font-bold text-red-400 uppercase mt-1">Atendiendo: Dr. {ocupado.nombre_dentista}</p>}
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
                <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none font-bold" />
                
                <div className="grid grid-cols-3 gap-2">
                    {horasDisponibles.map(h => (
                      <button key={h} onClick={() => setNuevaHora(h)}
                        className={`py-3 rounded-xl font-black text-[10px] transition-all ${nuevaHora === h ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        {h}
                      </button>
                    ))}
                </div>
                <button onClick={reprogramarCita} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Confirmar Cambio</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

function CardMetrica({ label, valor, sub, icon, color, destacado = false }: any) {
  return (
    <div className={`p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6 transition-all hover:translate-y-[-4px] bg-white ${destacado ? 'border-b-[12px] border-b-emerald-500' : ''}`}>
      <div className={`${color} p-5 rounded-[1.8rem] shadow-sm`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{valor}</p>
        <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">{sub}</p>
      </div>
    </div>
  )
}