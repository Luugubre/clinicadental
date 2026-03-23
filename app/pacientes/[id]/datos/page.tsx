'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, Loader2, Info } from 'lucide-react'
import { motion } from 'framer-motion'

export default function DatosPersonalesPage() {
  const { id } = useParams()
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  
  const [datos, setDatos] = useState<any>({
    tipo_paciente: '',
    nombre: '',
    apellido: '',
    rut: '',
    fecha_nacimiento: '',
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

  useEffect(() => {
    if (id) fetchDatos()
  }, [id])

  async function fetchDatos() {
    const { data, error } = await supabase.from('pacientes').select('*').eq('id', id).single()
    if (error) console.error("Error al cargar:", error.message)
    if (data) {
      // Saneamiento inicial: null a string vacío para los inputs
      const saneados = Object.fromEntries(
        Object.entries(data).map(([key, val]) => [key, val === null ? '' : val])
      )
      setDatos(saneados)
    }
    setCargando(false)
  }

  const handleGuardar = async () => {
    if (!id) return alert("ID de paciente no encontrado en la URL");
    
    setGuardando(true)
    console.log("Enviando actualización para ID:", id);

    // 1. CONSTRUCCIÓN DEL PAYLOAD (Mapeo estricto 1:1 con tu base de datos)
    const payload = {
      rut: datos.rut ? datos.rut.replace(/\./g, '').toUpperCase().trim() : null,
      nombre: datos.nombre || null,
      apellido: datos.apellido || null,
      fecha_nacimiento: datos.fecha_nacimiento === '' ? null : datos.fecha_nacimiento,
      telefono: datos.telefono || null,
      email: datos.email || null,
      prevision: datos.prevision || 'Sin convenio',
      direccion: datos.direccion || null,
      nombre_social: datos.nombre_social || null,
      tipo_paciente: datos.tipo_paciente || null,
      sexo: datos.sexo || null,
      genero: datos.genero || null,
      ciudad: datos.ciudad || null,
      comuna: datos.comuna || null,
      telefono_fijo: datos.telefono_fijo || null,
      actividad_profesion: datos.actividad_profesion || null,
      empleador: datos.empleador || null,
      observaciones_personales: datos.observaciones_personales || null,
      apoderado_nombre: datos.apoderado_nombre || null,
      apoderado_rut: datos.apoderado_rut || null,
      referencia: datos.referencia || null,
      numero_interno: datos.numero_interno || null
    }

    try {
      // 2. EJECUCIÓN DE LA ACTUALIZACIÓN
      // Usamos .select() para forzar el retorno de datos y confirmar el cambio
      const { data: updateData, error: updateError, status } = await supabase
        .from('pacientes')
        .update(payload)
        .eq('id', id)
        .select()

      if (updateError) throw updateError

      // 3. VALIDACIÓN DE RESULTADO
      if (updateData && updateData.length > 0) {
        alert("✅ Datos actualizados correctamente");
        setDatos(Object.fromEntries(
          Object.entries(updateData[0]).map(([key, val]) => [key, val === null ? '' : val])
        ));
      } else {
        console.warn("Supabase respondió con éxito pero 0 filas afectadas. Status:", status);
        alert("⚠️ No se detectaron cambios nuevos o no tienes permisos para editar este registro.");
      }

    } catch (error: any) {
      console.error("DETALLE ERROR SUPABASE:", error)
      alert(`❌ Error técnico: ${error.message}`)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-800 uppercase italic leading-none">Información Personal</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Edición de ficha maestra</p>
        </div>
        <button 
          onClick={handleGuardar}
          disabled={guardando}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-600 transition-all flex items-center gap-2 disabled:bg-slate-300 active:scale-95"
        >
          {guardando ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <h4 className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
          <Info size={14}/> Datos Requeridos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <InputGroup label="Tipo de Paciente" type="select" value={datos.tipo_paciente} 
            onChange={(v:any) => setDatos({...datos, tipo_paciente: v})} 
            options={['discapacidad', 'embarazada', 'funcionario clinica', 'menor de edad', 'paciente adulto mayor']} />
          <InputGroup label="Nombre Legal" value={datos.nombre} onChange={(v:any) => setDatos({...datos, nombre: v})} />
          <InputGroup label="Apellidos" value={datos.apellido} onChange={(v:any) => setDatos({...datos, apellido: v})} />
          <InputGroup label="RUT" value={datos.rut} onChange={(v:any) => setDatos({...datos, rut: v})} />
          <InputGroup label="Fecha Nacimiento" type="date" value={datos.fecha_nacimiento} onChange={(v:any) => setDatos({...datos, fecha_nacimiento: v})} />
        </div>
      </section>

      <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-10">Campos Opcionales</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <InputGroup label="Convenio (Previsión)" type="select" value={datos.prevision} 
            onChange={(v:any) => setDatos({...datos, prevision: v})} 
            options={['Sin convenio', 'black power', 'Gabriela mistral', 'cesfam la granja', 'Jorge hunneus', 'san jose de la familia', 'tarjeta + comunidad']} />
          <InputGroup label="Nombre Social" value={datos.nombre_social} onChange={(v:any) => setDatos({...datos, nombre_social: v})} />
          <InputGroup label="Email" type="email" value={datos.email} onChange={(v:any) => setDatos({...datos, email: v})} />
          <InputGroup label="N° Interno" value={datos.numero_interno} onChange={(v:any) => setDatos({...datos, numero_interno: v})} />
          <InputGroup label="Sexo" type="select" value={datos.sexo} onChange={(v:any) => setDatos({...datos, sexo: v})} options={['Masculino', 'Femenino', 'Otro']} />
          <InputGroup label="Ciudad" value={datos.ciudad} onChange={(v:any) => setDatos({...datos, ciudad: v})} />
          <InputGroup label="Comuna" value={datos.comuna} onChange={(v:any) => setDatos({...datos, comuna: v})} />
          <InputGroup label="Dirección" value={datos.direccion} onChange={(v:any) => setDatos({...datos, direccion: v})} />
          <InputGroup label="WhatsApp" value={datos.telefono} onChange={(v:any) => setDatos({...datos, telefono: v})} />
          <InputGroup label="Actividad" value={datos.actividad_profesion} onChange={(v:any) => setDatos({...datos, actividad_profesion: v})} />
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-100">
          <InputGroup label="Nombre Apoderado" value={datos.apoderado_nombre} onChange={(v:any) => setDatos({...datos, apoderado_nombre: v})} />
          <InputGroup label="RUT Apoderado" value={datos.apoderado_rut} onChange={(v:any) => setDatos({...datos, apoderado_rut: v})} />
        </div>

        <div className="mt-10">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4 block mb-2 tracking-widest">Observaciones</label>
          <textarea 
            className="w-full p-6 bg-slate-50 rounded-[2.5rem] font-medium border-none outline-none focus:ring-2 ring-blue-500/10 transition-all shadow-inner leading-relaxed" 
            rows={4}
            value={datos.observaciones_personales || ''} 
            onChange={(e) => setDatos({...datos, observaciones_personales: e.target.value})} 
          />
        </div>
      </section>
    </motion.div>
  )
}

function InputGroup({ label, value, onChange, type = "text", options = [] }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.1em]">{label}</label>
      {type === "select" ? (
        <div className="relative">
          <select 
            className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-blue-500/20 appearance-none transition-all cursor-pointer"
            value={value || ''} onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Seleccione...</option>
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 text-[8px]">▼</div>
        </div>
      ) : (
        <input 
          type={type}
          className={`w-full p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-blue-500/20 transition-all shadow-inner`}
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}