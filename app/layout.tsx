'use client'
import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, Search, Calendar, Users, 
  Briefcase, BarChart3, Settings, LogOut,
  LayoutGrid, ShieldCheck, ChevronDown,
  Building2, Stethoscope, Package, Beaker,
  Calculator, DoorOpen, BadgeDollarSign,
  Library, FileSignature, Ban, FileText,
  TrendingUp, FileSpreadsheet, PieChart, 
  ArrowRightLeft, UserMinus, Trophy,
  FileSearch, Users2, ChevronRight,
  Receipt // <--- IMPORTACIÓN FALTANTE AGREGADA
} from 'lucide-react'
import Link from 'next/link'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  
  const isAuthPage = pathname === '/login' || pathname === '/register'
  
  const [session, setSession] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showReportMenu, setShowReportMenu] = useState(false)
  const [hoverGraficos, setHoverGraficos] = useState(false)
  
  const adminMenuRef = useRef<HTMLDivElement>(null)
  const reportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) setShowAdminMenu(false)
      if (reportMenuRef.current && !reportMenuRef.current.contains(event.target as Node)) setShowReportMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const getUserData = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      if (currentSession) {
        const { data } = await supabase.from('perfiles').select('*').eq('id', currentSession.user.id).single()
        setPerfil(data)
      }
    }
    getUserData()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (!newSession) setPerfil(null)
      else getUserData()
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const modulos = [
    { href: '/agenda', label: 'Agenda', icon: <Calendar size={16}/>, roles: ['ADMIN', 'RECEPCIONISTA', 'DENTISTA'] },
    { href: '/pacientes', label: 'Pacientes', icon: <Users size={16}/>, roles: ['ADMIN', 'RECEPCIONISTA', 'DENTISTA'] },
    { href: '/cajas', label: 'Cajas', icon: <Briefcase size={16}/>, roles: ['ADMIN', 'RECEPCIONISTA'] },
  ]

  return (
    <html lang="es">
      <body className="bg-slate-50 h-screen flex flex-col font-sans antialiased overflow-hidden">
        
        {!isAuthPage && session && (
          <>
            <header className="w-full h-16 bg-slate-900 text-white flex items-center justify-between px-6 shadow-xl shrink-0 z-[40] relative">
              <div className="flex items-center gap-10">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <Activity size={18}/>
                  </div>
                  <span className="text-lg font-black tracking-tighter uppercase italic">DentaPro</span>
                </Link>
                <div className="relative hidden lg:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input type="text" placeholder="Buscar..." className="w-[450px] bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-300 outline-none focus:ring-2 ring-blue-500/50" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-slate-800/50 pl-4 pr-2 py-1.5 rounded-2xl border border-slate-700/50">
                  <div className="flex flex-col items-end mr-1">
                    <span className="text-xs font-black text-slate-100 uppercase tracking-tight leading-none">{perfil?.nombre_completo || session.user.email?.split('@')[0]}</span>
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic mt-1 flex items-center gap-1">
                      {perfil?.rol === 'ADMIN' && <ShieldCheck size={10} />}
                      {perfil?.rol || 'Cargando...'}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm uppercase">{perfil?.nombre_completo?.[0] || 'U'}</div>
                  <button onClick={handleSignOut} className="ml-2 p-2 text-slate-500 hover:text-red-400 transition-all"><LogOut size={18} /></button>
                </div>
              </div>
            </header>

            <nav className="w-full h-12 bg-white border-b border-slate-200 flex items-center px-6 gap-8 shadow-sm shrink-0 z-[40] relative">
              {modulos
                .filter(m => m.roles.includes(perfil?.rol))
                .map((m) => (
                  <ModuleLink key={m.href} href={m.href} label={m.label} icon={m.icon} active={pathname.startsWith(m.href)} />
                ))
              }

              {/* MENU REPORTES - 3 OPCIONES */}
              {perfil?.rol === 'ADMIN' && (
                <div className="relative h-full" ref={reportMenuRef}>
                  <button 
                    onClick={() => { setShowReportMenu(!showReportMenu); setShowAdminMenu(false); }}
                    className={`flex items-center gap-2 px-1 h-full border-b-2 transition-all group ${showReportMenu || pathname.startsWith('/reportes') ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-800'}`}
                  >
                    <BarChart3 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Reportes</span>
                    <ChevronDown size={12} className={`transition-transform ${showReportMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showReportMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute top-[110%] left-0 bg-white shadow-2xl rounded-3xl border border-slate-100 p-4 z-[100] w-[280px]"
                      >
                        <div className="flex flex-col gap-1">
                          <MenuOption href="/reportes/desempeno" label="Panel de Desempeño" icon={<TrendingUp size={14}/>} onClick={() => setShowReportMenu(false)} />
                          <MenuOption href="/reportes/excel" label="Reportes Excel" icon={<FileSpreadsheet size={14}/>} onClick={() => setShowReportMenu(false)} />
                          
                          {/* REPORTES GRÁFICOS CON HOVER */}
                          <div 
                            className="relative"
                            onMouseEnter={() => setHoverGraficos(true)}
                            onMouseLeave={() => setHoverGraficos(false)}
                          >
                            <div className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group ${hoverGraficos ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl shadow-sm ${hoverGraficos ? 'bg-blue-500' : 'bg-slate-50 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                  <PieChart size={14}/>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tight leading-tight">Reportes Gráficos</span>
                              </div>
                              <ChevronRight size={12} />
                            </div>

                            <AnimatePresence>
                              {hoverGraficos && (
                                <motion.div 
                                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                  className="absolute top-0 left-full ml-2 bg-white shadow-2xl rounded-3xl border border-slate-100 p-4 w-[280px] z-[110]"
                                >
                                  <h3 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3 pl-2 italic">Categorías Disponibles</h3>
                                  <div className="grid gap-1 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {[
                                      { href: "/reportes/graficos/resultados", label: "Resultados", icon: <BarChart3 size={12}/> },
                                      { href: "/reportes/graficos/flujos", label: "Flujos de dinero", icon: <ArrowRightLeft size={12}/> },
                                      { href: "/reportes/graficos/pacientes", label: "Análisis de pacientes", icon: <Users size={12}/> },
                                      { href: "/reportes/graficos/gastos", label: "Gastos", icon: <BadgeDollarSign size={12}/> },
                                      { href: "/reportes/graficos/eficiencia", label: "Eficiencia por profesional", icon: <Stethoscope size={12}/> },
                                      { href: "/reportes/graficos/ventas-prestacion", label: "Ventas por prestación", icon: <Receipt size={12}/> },
                                      { href: "/reportes/graficos/ventas-categoria", label: "Ventas por categoría", icon: <LayoutGrid size={12}/> },
                                      { href: "/reportes/graficos/captacion", label: "Eficiencia captación", icon: <FileSearch size={12}/> },
                                      { href: "/reportes/graficos/recaudacion", label: "Informe recaudación diario", icon: <Calculator size={12}/> },
                                      { href: "/reportes/graficos/ranking", label: "Ranking profesionales", icon: <Trophy size={12}/> },
                                      { href: "/reportes/graficos/morosos", label: "Pacientes morosos", icon: <UserMinus size={12}/> },
                                      { href: "/reportes/graficos/financiamientos", label: "Estado financiamientos", icon: <BadgeDollarSign size={12}/> },
                                      { href: "/reportes/graficos/planilla", label: "Descuentos por planilla", icon: <Calculator size={12}/> },
                                      { href: "/reportes/graficos/derivacion", label: "Derivación de pacientes", icon: <ArrowRightLeft size={12}/> },
                                      { href: "/reportes/graficos/capturados", label: "Presupuestos capturados", icon: <ShieldCheck size={12}/> },
                                      { href: "/reportes/graficos/estadisticas", label: "Estadísticas de pacientes", icon: <Users2 size={12}/> },
                                    ].map((item) => (
                                      <MenuOption key={item.href} {...item} onClick={() => { setShowReportMenu(false); setHoverGraficos(false); }} />
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* MENU ADMINISTRACION */}
              {perfil?.rol === 'ADMIN' && (
                <div className="relative h-full" ref={adminMenuRef}>
                  <button 
                    onClick={() => { setShowAdminMenu(!showAdminMenu); setShowReportMenu(false); }}
                    className={`flex items-center gap-2 px-1 h-full border-b-2 transition-all group ${showAdminMenu || pathname.startsWith('/administracion') ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-800'}`}
                  >
                    <LayoutGrid size={16} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Administración</span>
                    <ChevronDown size={12} className={`transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showAdminMenu && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-[110%] left-0 bg-white shadow-2xl rounded-[2.5rem] border border-slate-100 p-8 z-[100] w-[600px] overflow-hidden">
                        <div className="grid grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4 pl-2">Panel Administrativo</h3>
                            <div className="grid gap-1">
                              <MenuOption href="/administracion/convenios" label="Convenios" icon={<Building2 size={14}/>} onClick={() => setShowAdminMenu(false)} />
                              <MenuOption href="/administracion/profesionales" label="Profesionales" icon={<Users size={14}/>} onClick={() => setShowAdminMenu(false)} />
                              <MenuOption href="/administracion/especialidades" label="Especialidades" icon={<Stethoscope size={14}/>} onClick={() => setShowAdminMenu(false)} />
                              <MenuOption href="/administracion/inventario" label="Inventario" icon={<Package size={14}/>} onClick={() => setShowAdminMenu(false)} />
                              <MenuOption href="/administracion/laboratorios" label="Laboratorios" icon={<Beaker size={14}/>} onClick={() => setShowAdminMenu(false)} />
                              <MenuOption href="/administracion/liquidaciones" label="Liquidaciones" icon={<Calculator size={14}/>} onClick={() => setShowAdminMenu(false)} />
                              <MenuOption href="/administracion/box" label="Planificación Box" icon={<DoorOpen size={14}/>} onClick={() => setShowAdminMenu(false)} />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 pl-2">Configuración Sistema</h3>
                            <div className="grid gap-1">
                              <MenuOption href="/administracion/configuracion/aranceles" label="Arancel Precios" icon={<BadgeDollarSign size={14}/>} onClick={() => setShowAdminMenu(false)} />
                              <MenuOption href="/administracion/configuracion/bancos" label="Bancos y Entidades" icon={<Library size={14}/>} onClick={() => setShowAdminMenu(false)} />
                              <MenuOption href="/administracion/configuracion/documentos" label="Docs Clínicos" icon={<FileText size={14}/>} onClick={() => setShowAdminMenu(false)} />
                              <MenuOption href="/administracion/configuracion/consentimientos" label="Consentimientos" icon={<FileSignature size={14}/>} onClick={() => setShowAdminMenu(false)} />
                              <MenuOption href="/administracion/configuracion/pagos-pendientes" label="Pagos Pendientes" icon={<Ban size={14}/>} onClick={() => setShowAdminMenu(false)} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </nav>
          </>
        )}

        <main className="flex-1 overflow-y-auto bg-slate-50 relative z-0">
          {children}
        </main>
      </body>
    </html>
  )
}

function MenuOption({ href, label, icon, onClick }: any) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all group">
      <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm shrink-0">
        {icon}
      </div>
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight group-hover:text-slate-900 transition-colors leading-tight">
        {label}
      </span>
    </Link>
  )
}

function ModuleLink({ href, label, icon, active }: any) {
  return (
    <Link href={href} className={`flex items-center gap-2 px-1 h-full border-b-2 transition-all ${active ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-800'}`}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </Link>
  )
}