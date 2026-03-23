'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { crearCuentaStaff, actualizarCuentaStaff, eliminarCuentaStaff } from './actions' 
import { 
  Plus, Search, Mail, Lock, Trash2, Stethoscope, X, Save, 
  Loader2, UserCircle, ChevronRight, KeyRound, UserCog, ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GestionStaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [especialidades, setEspecialidades] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [editandoUser, setEditandoUser] = useState<any>(null)
  const [busqueda, setBusqueda] = useState('')

  const initialState = { 
    nombre: '', apellido: '', correo: '', password: '', 
    especialidad_id: '', rol: 'DENTISTA' 
  }
  const [form, setForm] = useState(initialState)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setCargando(true)
    const { data: perfiles } = await supabase.from('perfiles').select('*').order('rol')
    const { data: esps } = await supabase.from('especialidades').select('*').order('nombre')
    const { data: profs } = await supabase.from('profesionales').select('user_id, especialidades(nombre)')
    
    if (perfiles) {
        const staffMapeado = perfiles.map(p => ({
            ...p,
            especialidad: profs?.find(pr => pr.user_id === p.id)?.especialidades?.nombre
        }))
        setStaff(staffMapeado)
    }
    if (esps) setEspecialidades(esps)
    setCargando(false)
  }

  const handleGuardar = async () => {
    if (guardando) return;
    if (!form.nombre.trim() || (!editandoUser && (!form.correo.trim() || !form.password.trim()))) {
        return alert("Por favor, completa los campos obligatorios.");
    }

    setGuardando(true)
    try {
      const res = editandoUser 
        ? await actualizarCuentaStaff(editandoUser.id, editandoUser.id, form)
        : await crearCuentaStaff(form)
      
      if (res.error) throw new Error(res.error);

      setModalAbierto(false); 
      fetchData(); 
      resetForm();
    } catch (error: any) { 
      alert("Error: " + error.message) 
    } finally { 
      setGuardando(false) 
    }
  }

  const handleEliminar = async () => {
    if (guardando || !editandoUser || !confirm(`¿Eliminar acceso de ${editandoUser.nombre_completo}?`)) return
    setGuardando(true)
    try {
      const res = await eliminarCuentaStaff(editandoUser.id)
      if (res.error) throw new Error(res.error)
      setModalAbierto(false); 
      fetchData(); 
      resetForm();
    } catch (error: any) { 
        alert(error.message) 
    } finally { 
        setGuardando(false) 
    }
  }

  const abrirEditor = (persona: any) => {
    setEditandoUser(persona)
    const [nombre, ...apellidos] = persona.nombre_completo.split(' ')
    setForm({ 
        ...initialState, 
        nombre: nombre, 
        apellido: apellidos.join(' '), 
        rol: persona.rol,
        especialidad_id: '' 
    })
    setModalAbierto(true)
  }

  const resetForm = () => { 
    setEditandoUser(null); 
    setForm(initialState);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 pb-20 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-slate-900 p-5 rounded-[2rem] text-white shadow-xl">
              <UserCog size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 uppercase italic leading-none">Equipo Clínico</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Gestión de roles y accesos</p>
            </div>
          </div>
          <button 
            onClick={() => { resetForm(); setModalAbierto(true); }} 
            className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase hover:bg-slate-900 transition-all shadow-xl shadow-blue-100"
          >
            <Plus size={18} /> Nuevo Miembro
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff
            .filter(p => p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()))
            .map(persona => (
                <motion.div 
                    key={persona.id} 
                    whileHover={{ y: -5 }} 
                    onClick={() => abrirEditor(persona)} 
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer group relative overflow-hidden"
                >
                    <div className={`absolute top-0 right-0 p-4 text-[8px] font-black uppercase tracking-widest ${
                        persona.rol === 'ADMIN' ? 'bg-red-500 text-white' : 
                        persona.rol === 'DENTISTA' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-white'
                    }`}>
                        {persona.rol}
                    </div>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                        persona.rol === 'DENTISTA' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                        {persona.rol === 'DENTISTA' ? <Stethoscope size={28}/> : <UserCircle size={28}/>}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 uppercase">{persona.nombre_completo}</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">
                        {persona.especialidad || 'Personal Administrativo'}
                    </p>
                </motion.div>
            ))}
        </div>
      </div>

      <AnimatePresence>
        {modalAbierto && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999999] flex justify-end items-start p-4">
            {/* Overlay para cerrar al hacer clic fuera */}
            <div className="absolute inset-0" onClick={() => !guardando && setModalAbierto(false)} />

            <motion.div 
              initial={{ x: '100%', opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg mt-24 rounded-[3rem] shadow-2xl flex flex-col relative z-10 overflow-hidden border border-slate-100 h-[calc(100vh-140px)]"
            >
              <div className="p-10 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-2xl font-black text-slate-800 uppercase italic">
                   {editandoUser ? 'Editar Miembro' : 'Nuevo Registro'}
                </h2>
                <button 
                  disabled={guardando}
                  onClick={() => setModalAbierto(false)} 
                  className="p-4 bg-white shadow-lg border border-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 p-10 space-y-6 overflow-y-auto">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase italic ml-3 flex items-center gap-2">
                    <ShieldCheck size={12}/> Rol del Usuario
                  </label>
                  <select 
                    className="w-full bg-slate-50 p-5 rounded-2xl text-xs font-bold border-none shadow-inner outline-none focus:ring-2 ring-blue-500/20" 
                    value={form.rol} 
                    onChange={(e) => setForm({...form, rol: e.target.value})}
                  >
                    <option value="DENTISTA">Dentista / Especialista</option>
                    <option value="RECEPCIONISTA">Recepcionista</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nombre" value={form.nombre} onChange={(v:any) => setForm({...form, nombre: v})} />
                  <Input label="Apellido" value={form.apellido} onChange={(v:any) => setForm({...form, apellido: v})} />
                </div>

                {!editandoUser && (
                  <div className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase italic flex items-center gap-2"><KeyRound size={12}/> Credenciales de Acceso</p>
                    <Input label="Email Institucional" value={form.correo} icon={<Mail size={14}/>} onChange={(v:any) => setForm({...form, correo: v})} />
                    <Input label="Contraseña Temporal" value={form.password} type="password" icon={<Lock size={14}/>} onChange={(v:any) => setForm({...form, password: v})} />
                  </div>
                )}

                {form.rol === 'DENTISTA' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase italic ml-3 flex items-center gap-2">
                        <Stethoscope size={12}/> Especialidad Clínica
                    </label>
                    <select 
                      className="w-full bg-slate-50 p-5 rounded-2xl text-xs font-bold border-none shadow-inner outline-none focus:ring-2 ring-blue-500/20" 
                      value={form.especialidad_id} 
                      onChange={(e) => setForm({...form, especialidad_id: e.target.value})}
                    >
                      <option value="">Seleccionar especialidad...</option>
                      {especialidades.map(esp => <option key={esp.id} value={esp.id}>{esp.nombre}</option>)}
                    </select>
                  </div>
                )}

                {editandoUser && (
                  <button onClick={handleEliminar} className="w-full p-4 text-red-500 font-black text-[10px] uppercase hover:bg-red-50 rounded-2xl transition-all flex items-center justify-center gap-2">
                    <Trash2 size={14}/> Revocar todos los accesos
                  </button>
                )}
              </div>

              <div className="p-10 border-t bg-slate-50/50">
                <button 
                  onClick={handleGuardar} disabled={guardando} 
                  className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xs uppercase shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-3"
                >
                  {guardando ? <Loader2 className="animate-spin" /> : <Save size={18}/>}
                  {editandoUser ? 'Guardar Cambios' : 'Crear Cuenta de Staff'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Input({ label, value, onChange, icon, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase italic ml-3 flex items-center gap-2">{icon} {label}</label>
      <input 
        type={type} value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full bg-white p-5 rounded-2xl text-xs font-bold outline-none border border-slate-100 shadow-sm focus:ring-2 ring-blue-500/10" 
      />
    </div>
  )
}