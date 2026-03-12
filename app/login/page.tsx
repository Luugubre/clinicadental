'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { LogIn, Loader2, ShieldCheck, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cargando) return
    setCargando(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      })

      if (authError) {
        setError('Correo o contraseña incorrectos')
        setCargando(false)
        return
      }

      if (data?.session) {
        // Redirección total para que el Proxy lea las cookies frescas
        window.location.href = '/'
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      setCargando(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-slate-100 transition-all">
        
        {/* Encabezado */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-blue-600 p-4 rounded-3xl text-white mb-4 shadow-xl shadow-blue-100">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">DentaPro</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Gestión Clínica La Pintana</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="ejemplo@correo.com" 
                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none text-slate-900 font-medium transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Contraseña</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none text-slate-900 font-medium transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-600 text-xs font-bold text-center bg-red-50 p-4 rounded-2xl border border-red-100 animate-pulse">
              {error}
            </div>
          )}

          <div className="pt-2 space-y-4">
            <button 
              type="submit"
              disabled={cargando}
              className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center gap-3 disabled:opacity-50"
            >
              {cargando ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <LogIn size={22} />
                  <span>Entrar al Sistema</span>
                </>
              )}
            </button>

            {/* BOTÓN NUEVO: REGISTRO */}
            <Link 
              href="/register" 
              className="w-full bg-white text-slate-500 py-4 rounded-[2rem] font-bold text-sm border-2 border-slate-100 hover:bg-slate-50 hover:text-blue-600 transition-all flex justify-center items-center gap-2 group"
            >
              <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
              ¿No tienes cuenta? Regístrate aquí
            </Link>
          </div>
        </form>

        <p className="mt-8 text-center text-slate-300 text-[10px] font-medium uppercase tracking-widest">
          Desarrollado para Tania y Daniel
        </p>
      </div>
    </main>
  )
}