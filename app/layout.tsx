'use client'
import './globals.css'
import { 
  Activity, Search, Bell, ChevronDown, Calendar, Users, 
  Briefcase, BarChart3, Settings, LogOut 
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // FUNCIÓN PARA CERRAR SESIÓN
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/login') // Redirigir al login después de salir
    } else {
      alert("Error al cerrar sesión: " + error.message)
    }
  }

  return (
    <html lang="es">
      <body className="bg-slate-50 min-h-screen flex flex-col font-sans antialiased">
        
        {/* NIVEL 1: NAVBAR GLOBAL */}
        <header className="w-full h-16 bg-slate-900 text-white flex items-center justify-between px-6 z-[100] shadow-xl shrink-0">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Activity size={18} className="text-white" />
              </div>
              <span className="text-lg font-black tracking-tighter uppercase italic">DentaPro</span>
            </Link>

            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por nombre, RUT o cita..." 
                className="w-[450px] bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-xs text-slate-300 focus:ring-2 ring-blue-500/50 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* PERFIL Y LOGOUT */}
            <div className="flex items-center gap-3 bg-slate-800/50 pl-4 pr-2 py-1.5 rounded-2xl border border-slate-700/50 group transition-all">
              <div className="flex flex-col items-end mr-1">
                <span className="text-xs font-black text-slate-100 uppercase tracking-tight">Dr. Daniel</span>
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Administrador</span>
              </div>
              
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm shadow-lg border border-blue-400/20">
                D
              </div>

              {/* BOTÓN DE CERRAR SESIÓN */}
              <button 
                onClick={handleSignOut}
                title="Cerrar Sesión"
                className="ml-2 p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* NIVEL 2: MENÚ DE MÓDULOS */}
        <nav className="w-full h-12 bg-white border-b border-slate-200 flex items-center px-6 gap-8 shadow-sm z-40 shrink-0 overflow-x-auto no-scrollbar">
          <ModuleLink 
            href="/agenda" 
            label="Agenda" 
            icon={<Calendar size={16}/>} 
            active={pathname === '/agenda'} 
          />
          <ModuleLink 
            href="/pacientes" 
            label="Pacientes" 
            icon={<Users size={16}/>} 
            active={pathname.startsWith('/pacientes')} 
          />
          <ModuleLink 
            href="/cajas" 
            label="Cajas" 
            icon={<Briefcase size={16}/>} 
            active={pathname === '/cajas'} 
          />
          <ModuleLink 
            href="/reportes" 
            label="Reportes" 
            icon={<BarChart3 size={16}/>} 
            active={pathname === '/reportes'} 
          />
          <ModuleLink 
            href="/configuracion" 
            label="Configuración" 
            icon={<Settings size={16}/>} 
            active={pathname === '/configuracion'} 
          />
        </nav>

        {/* CONTENIDO DINÁMICO */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  )
}

function ModuleLink({ href, label, icon, active }: any) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-2 px-1 h-full cursor-pointer border-b-2 transition-all ${
        active 
          ? 'border-blue-600 text-blue-600 font-bold' 
          : 'border-transparent text-slate-400 hover:text-slate-800'
      }`}
    >
      {icon}
      <span className="text-[11px] uppercase tracking-wider">{label}</span>
    </Link>
  )
}