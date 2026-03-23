'use client'
import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  User, ClipboardList, Activity, Camera, Wallet, 
  ArrowLeft, HeartPulse, AlertCircle, UserCircle,
  History, Pill, FileCheck, ClipboardCheck,
  Image as ImageIcon, DollarSign, Briefcase, Tag, Calendar, Loader2, ArrowDown
} from 'lucide-react'
import Link from 'next/link'

export default function PacienteLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams()
  const pathname = usePathname()
  
  const regex = /\/tratamientos\/([a-f0-9-]{36})/;
  const match = pathname.match(regex);
  const presupuestoId = match ? match[1] : null;

  const [paciente, setPaciente] = useState<any>(null)
  const [datosPresupuesto, setDatosPresupuesto] = useState<any>(null)
  const [citas, setCitas] = useState<any[]>([])

  useEffect(() => {
    if (id) {
      fetchPaciente()
    }

    const handleUpdateFicha = () => {
      if (id) fetchPaciente()
    }

    window.addEventListener('pacienteActualizado', handleUpdateFicha)
    return () => window.removeEventListener('pacienteActualizado', handleUpdateFicha)
  }, [id])

  useEffect(() => {
    if (presupuestoId) {
      fetchDatosPresupuesto(presupuestoId)
    } else {
      setDatosPresupuesto(null)
    }

    const handleUpdatePresupuesto = () => {
      if (presupuestoId) fetchDatosPresupuesto(presupuestoId)
    }

    window.addEventListener('presupuestoActualizado', handleUpdatePresupuesto)
    return () => window.removeEventListener('presupuestoActualizado', handleUpdatePresupuesto)
  }, [presupuestoId, pathname])

  async function fetchPaciente() {
    // 1. Traer datos del paciente
    const { data } = await supabase.from('pacientes').select('*').eq('id', id).single()
    if (data) setPaciente(data)

    // 2. Traer citas próximas incluyendo el MOTIVO
    const now = new Date().toISOString()
    const { data: cData } = await supabase.from('citas')
      .select('id, inicio, motivo, estado')
      .eq('paciente_id', id)
      .gte('inicio', now) // Solo citas desde hoy en adelante
      .order('inicio', { ascending: true })
      .limit(3)
    
    if (cData) setCitas(cData)
  }

  async function fetchDatosPresupuesto(pId: string) {
    const { data } = await supabase
      .from('presupuestos')
      .select(`
        *,
        profesionales:especialista_id (nombre, apellido)
      `)
      .eq('id', pId)
      .single()
    
    if (data) setDatosPresupuesto(data)
  }

  if (!paciente) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  )

  const esFicha = pathname === `/pacientes/${id}` || 
                  pathname.includes('/evoluciones') || 
                  pathname.includes('/historial') ||
                  pathname.includes('/antecedentes') ||
                  pathname.includes('/rx-documentos') ||
                  pathname.includes('/recetas') ||
                  pathname.includes('/documentos') || 
                  pathname.includes('/consentimientos');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[100] px-8 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-[1.8rem] text-white shadow-xl shadow-blue-100"><User size={30} /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase leading-none">
                {paciente.nombre} {paciente.apellido}
              </h1>
              <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest">{paciente.rut}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <nav className="bg-slate-100 p-1.5 rounded-[1.5rem] flex border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
              <TabLink href={`/pacientes/${id}`} active={esFicha} icon={<ClipboardList size={18}/>} label="Ficha" />
              <TabLink href={`/pacientes/${id}/datos`} active={pathname.includes('/datos')} icon={<UserCircle size={18}/>} label="Datos" />
              <TabLink href={`/pacientes/${id}/tratamientos`} active={pathname.includes('/tratamientos')} icon={<Wallet size={18}/>} label="Tratamientos" />
              <TabLink href={`/pacientes/${id}/odontograma`} active={pathname.includes('/odontograma')} icon={<Activity size={18}/>} label="Odonto" />
              <TabLink href={`/pacientes/${id}/archivos`} active={pathname.includes('/archivos')} icon={<Camera size={18}/>} label="Imágenes" />
            </nav>
            <Link href="/agenda" className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-slate-900 transition-all shadow-sm">
              <ArrowLeft size={20}/>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-100 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Tag size={18}/></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Convenio / Previsión</p>
                <p className="text-[11px] font-bold text-slate-700 uppercase leading-none mt-1">
                  {paciente.prevision || 'Particular'}
                </p>
              </div>
            </div>
          </div>

          {datosPresupuesto && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <p className="text-[10px] font-black uppercase text-blue-400 mb-1 tracking-widest italic">Plan Activo</p>
                <h3 className="text-xl font-black uppercase italic leading-tight mb-2">{datosPresupuesto.nombre_tratamiento}</h3>
                {datosPresupuesto.profesionales && (
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Dr. {datosPresupuesto.profesionales.nombre} {datosPresupuesto.profesionales.apellido}</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-100 space-y-4">
                <h4 className="font-black text-[10px] uppercase text-slate-400 mb-2 flex items-center gap-2">
                  <DollarSign size={14} className="text-emerald-500"/> Resumen Financiero
                </h4>
                <FinanceRow label="Total Plan" value={datosPresupuesto.total || 0} />
                <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-black text-emerald-700 uppercase">Abonado</span>
                  <span className="text-lg font-black text-emerald-600">${Number(datosPresupuesto.total_abonado || 0).toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-100">
            <h4 className="font-black text-[10px] uppercase text-slate-400 mb-4 flex items-center gap-2">
              <Calendar size={14} className="text-blue-500"/> Próximas Citas
            </h4>
            <div className="space-y-3">
              {citas.length > 0 ? citas.map(c => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-700">{new Date(c.inicio).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} hrs</p>
                  <p className="text-[9px] text-blue-600 font-black uppercase mt-1 truncate">{c.motivo || 'Consulta General'}</p>
                </div>
              )) : (
                <div className="py-4 text-center">
                  <p className="text-[10px] text-slate-300 font-black uppercase italic tracking-widest">Sin citas pendientes</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3 flex flex-col gap-6">
          {esFicha && (
            <nav className="bg-white p-1 rounded-2xl border border-slate-200 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-sm sticky top-28 z-50">
              <SubTabLink href={`/pacientes/${id}`} active={pathname === `/pacientes/${id}`} label="Historial" icon={<History size={14}/>} />
              <SubTabLink href={`/pacientes/${id}/evoluciones`} active={pathname.includes('/evoluciones')} label="Evoluciones" icon={<Activity size={14}/>} />
              <SubTabLink href={`/pacientes/${id}/antecedentes`} active={pathname.includes('/antecedentes')} label="Ant. Médicos" icon={<AlertCircle size={14}/>} />
              <SubTabLink href={`/pacientes/${id}/rx-documentos`} active={pathname.includes('/rx-documentos')} label="RX y Docs" icon={<ImageIcon size={14}/>} />
              <SubTabLink href={`/pacientes/${id}/recetas`} active={pathname.includes('/recetas')} label="Recetas" icon={<Pill size={14}/>} />
              <SubTabLink href={`/pacientes/${id}/documentos`} active={pathname.includes('/documentos')} label="Docs. Clínicos" icon={<FileCheck size={14}/>} />
              <SubTabLink href={`/pacientes/${id}/consentimientos`} active={pathname.includes('/consentimientos')} label="Consentimientos" icon={<ClipboardCheck size={14}/>} />
            </nav>
          )}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}

function TabLink({ href, active, icon, label }: any) {
  return (
    <Link href={href} className={`flex items-center gap-2 px-6 py-2.5 rounded-[1.2rem] font-black text-[11px] uppercase tracking-tighter transition-all shrink-0 ${active ? 'bg-white text-blue-600 shadow-md border border-slate-100 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
      {icon} <span>{label}</span>
    </Link>
  )
}

function SubTabLink({ href, active, label, icon }: any) {
  return (
    <Link href={href} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all whitespace-nowrap ${active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
      {icon} {label}
    </Link>
  )
}

function FinanceRow({ label, value, isNegative, isHighlight }: any) {
  return (
    <div className="flex justify-between items-center text-[11px]">
      <span className="text-slate-400 font-bold uppercase">{label}</span>
      <span className={`font-black ${isNegative ? 'text-red-500' : isHighlight ? 'text-emerald-600' : 'text-slate-700'}`}>
        {isNegative ? '-' : ''}${Number(value || 0).toLocaleString('es-CL')}
      </span>
    </div>
  )
}