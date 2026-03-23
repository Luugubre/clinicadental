'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserPlus, ArrowLeft, Save, Loader2, CheckCircle2, Info, UserCircle } from 'lucide-react'
import Link from 'next/link'

export default function NuevoPaciente() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(false)
  
  const [form, setForm] = useState({
    // Requeridos
    tipo_paciente: '-',
    nombre: '',
    apellido: '',
    rut: '',
    fecha_nacimiento: '',
    
    // Opcionales
    nombre_social: '',
    email: '',
    prevision: 'Sin convenio',
    numero_interno: '',
    sexo: '',
    genero: '',
    ciudad: '',
    comuna: '',
    direccion: '',
    telefono_fijo: '',
    telefono: '', 
    actividad_profesion: '',
    empleador: '',
    observaciones_personales: '',
    apoderado_nombre: '',
    apoderado_rut: '',
    referencia: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)

    // Limpieza automática de RUT (siempre se limpia ahora que no hay excepción de extranjero)
    const rutFinal = form.rut.replace(/\./g, '').toUpperCase()

    const { error } = await supabase
      .from('pacientes')
      .insert([{ ...form, rut: rutFinal }])

    if (error) {
      alert("Error al guardar: " + error.message)
      setCargando(false)
    } else {
      setExito(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  if (exito) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-sm w-full border border-slate-100">
        <CheckCircle2 className="text-emerald-500 mx-auto mb-6" size={80} />
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">¡Registrado!</h2>
        <p className="text-slate-500 font-bold mt-2 text-sm uppercase tracking-widest">Paciente guardado con éxito.</p>
      </div>
    </div>
  )

  return (
    <main className="p-6 lg:p-12 max-w-5xl mx-auto min-h-screen bg-slate-50">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 mb-8 transition-all">
        <ArrowLeft size={14} /> Volver al Panel
      </Link>

      <header className="mb-12">
        <div className="bg-blue-600 w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-100">
          <UserPlus size={32} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">Ficha de Ingreso</h1>
        <p className="text-slate-500 font-medium mt-2 uppercase text-[10px] tracking-[0.2em] italic">Clínica Dignidad • Registro de Paciente</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECCIÓN 1: DATOS REQUERIDOS */}
        <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-10 text-blue-600">
            <Info size={18} />
            <h2 className="font-black text-[10px] uppercase tracking-[0.3em]">Información Obligatoria</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block mb-2">Tipo de Paciente *</label>
               <select 
                required
                className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 ring-blue-500/20 appearance-none transition-all"
                value={form.tipo_paciente}
                onChange={(e) => setForm({...form, tipo_paciente: e.target.value})}
               >
                 <option value="-">-</option>
                 <option value="discapacidad">Discapacidad</option>
                 <option value="embarazada">Embarazada</option>
                 <option value="funcionario clinica">Funcionario Clínica</option>
                 <option value="menor de edad">Menor de Edad</option>
                 <option value="paciente adulto mayor">Paciente Adulto Mayor</option>
               </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Legal *</label>
              <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-blue-500/20" 
                value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Apellidos *</label>
              <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-blue-500/20" 
                value={form.apellido} onChange={(e) => setForm({...form, apellido: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">RUT *</label>
              <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-blue-500/20" 
                placeholder="12.345.678-9" value={form.rut} onChange={(e) => setForm({...form, rut: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha de Nacimiento *</label>
              <input required type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-blue-500/20 text-slate-500" 
                value={form.fecha_nacimiento} onChange={(e) => setForm({...form, fecha_nacimiento: e.target.value})} />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: DATOS OPCIONALES */}
        <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-10 text-slate-400">
            <UserCircle size={18} />
            <h2 className="font-black text-[10px] uppercase tracking-[0.3em]">Campos Opcionales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block mb-2">Convenio</label>
              <select 
                className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 ring-blue-500/20 appearance-none transition-all"
                value={form.prevision}
                onChange={(e) => setForm({...form, prevision: e.target.value})}
              >
                <option value="Sin convenio">Sin convenio</option>
                <option value="black power">Black Power</option>
                <option value="Gabriela mistral">Gabriela Mistral</option>
                <option value="cesfam la granja">Cesfam La Granja</option>
                <option value="Jorge hunneus">Jorge Hunneus</option>
                <option value="san jose de la familia">San José de la Familia</option>
                <option value="tarjeta + comunidad">Tarjeta + Comunidad</option>
              </select>
            </div>

            <InputGroup label="Nombre Social" value={form.nombre_social} onChange={(v:any) => setForm({...form, nombre_social: v})} />
            <InputGroup label="Email" type="email" value={form.email} onChange={(v:any) => setForm({...form, email: v})} />
            <InputGroup label="N° Interno" value={form.numero_interno} onChange={(v:any) => setForm({...form, numero_interno: v})} />
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block mb-2">Sexo</label>
              <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={form.sexo} onChange={(e) => setForm({...form, sexo: e.target.value})}>
                <option value="">Seleccione...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <InputGroup label="Género" value={form.genero} onChange={(v:any) => setForm({...form, genero: v})} />
            <InputGroup label="Ciudad" value={form.ciudad} onChange={(v:any) => setForm({...form, ciudad: v})} />
            <InputGroup label="Comuna" value={form.comuna} onChange={(v:any) => setForm({...form, comuna: v})} />
            <div className="lg:col-span-2">
              <InputGroup label="Dirección" value={form.direccion} onChange={(v:any) => setForm({...form, direccion: v})} />
            </div>
            <InputGroup label="Teléfono Fijo" value={form.telefono_fijo} onChange={(v:any) => setForm({...form, telefono_fijo: v})} />
            <InputGroup label="Teléfono Móvil" value={form.telefono} onChange={(v:any) => setForm({...form, telefono: v})} />
            <InputGroup label="Profesión" value={form.actividad_profesion} onChange={(v:any) => setForm({...form, actividad_profesion: v})} />
            <InputGroup label="Empleador" value={form.empleador} onChange={(v:any) => setForm({...form, empleador: v})} />
            <InputGroup label="Referencia" value={form.referencia} onChange={(v:any) => setForm({...form, referencia: v})} />
          </div>

          <div className="mt-10 pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputGroup label="Nombre Apoderado" value={form.apoderado_nombre} onChange={(v:any) => setForm({...form, apoderado_nombre: v})} />
            <InputGroup label="RUT Apoderado" value={form.apoderado_rut} onChange={(v:any) => setForm({...form, apoderado_rut: v})} />
          </div>

          <div className="mt-8">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block mb-2">Observaciones Clínicas / Personales</label>
            <textarea className="w-full p-6 bg-slate-50 rounded-[2.5rem] font-medium outline-none focus:ring-2 ring-blue-500/10 transition-all" rows={4}
              value={form.observaciones_personales} onChange={(e) => setForm({...form, observaciones_personales: e.target.value})} />
          </div>
        </div>

        {/* ACCIÓN FINAL */}
        <div className="pt-6">
          <button 
            type="submit"
            disabled={cargando}
            className="w-full bg-slate-900 text-white py-8 rounded-[3rem] font-black text-2xl shadow-2xl hover:bg-blue-600 transition-all active:scale-[0.98] flex justify-center items-center gap-4 disabled:opacity-50"
          >
            {cargando ? <Loader2 className="animate-spin" size={32} /> : <Save size={32} />}
            {cargando ? 'Sincronizando...' : 'Crear Paciente'}
          </button>
        </div>
      </form>
    </main>
  )
}

function InputGroup({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
      <input 
        type={type}
        className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-blue-500/10 transition-all"
        value={value} 
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}