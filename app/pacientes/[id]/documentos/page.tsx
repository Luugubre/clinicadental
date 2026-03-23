'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  FileText, Plus, Printer, Mail, PenTool, 
  Trash2, Loader2, Save, X, User, ShieldCheck, MapPin, Phone
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DocumentosClinicosPage() {
  const { id: paciente_id } = useParams()
  const [documentos, setDocumentos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [creando, setCreando] = useState(false)
  const [docSeleccionado, setDocSeleccionado] = useState<any>(null)

  // Formulario para nuevo documento
  const [nuevoDoc, setNuevoDoc] = useState({
    titulo: 'Certificado Médico Dental',
    especialista: 'Diego Sebastian Torrijos Alarcón',
    rut_especialista: '10329012-0',
    llenado_por: 'Tania Javiera Sanchez Reyes',
    contenido: ''
  })

  useEffect(() => {
    if (paciente_id) fetchDocumentos()
  }, [paciente_id])

  async function fetchDocumentos() {
    setCargando(true)
    const { data } = await supabase
      .from('documentos_clinicos')
      .select('*')
      .eq('paciente_id', paciente_id)
      .order('fecha_creacion', { ascending: false })
    if (data) setDocumentos(data)
    setCargando(false)
  }

  const guardarDocumento = async () => {
    if (!nuevoDoc.contenido) return alert("El documento no puede estar vacío")
    
    const { error } = await supabase.from('documentos_clinicos').insert([{
      paciente_id,
      titulo_documento: nuevoDoc.titulo,
      llenado_por: nuevoDoc.llenado_por,
      contenido: nuevoDoc.contenido
    }])

    if (!error) {
      setCreando(false)
      setNuevoDoc({ ...nuevoDoc, contenido: '' })
      fetchDocumentos()
    }
  }

  const handleImprimir = () => {
    window.print()
  }

  if (cargando) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></div>

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20 space-y-8">
      
      {/* HEADER DE ACCIONES (No se imprime) */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h3 className="text-2xl font-black text-slate-800 uppercase italic leading-none flex items-center gap-3">
            <FileText className="text-blue-600" /> Documentos Clínicos
          </h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Certificados y Consentimientos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCreando(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-slate-900 transition-all">
            <Plus size={14}/> Agregar Datos
          </button>
          <button onClick={handleImprimir} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-slate-200 transition-all">
            <Printer size={14}/> Imprimir
          </button>
          <button className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-slate-200 transition-all">
            <Mail size={14}/> Enviar por Mail
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LISTADO LATERAL (No se imprime) */}
        <div className="lg:col-span-1 space-y-4 print:hidden">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Documentos Guardados</h4>
          {documentos.map(doc => (
            <div 
              key={doc.id} 
              onClick={() => setDocSeleccionado(doc)}
              className={`p-5 rounded-[2rem] border transition-all cursor-pointer ${docSeleccionado?.id === doc.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-300'}`}
            >
              <p className="text-[10px] font-black uppercase italic">{doc.titulo_documento}</p>
              <p className="text-[9px] font-bold opacity-60 mt-1">{new Date(doc.fecha_creacion).toLocaleDateString()}</p>
            </div>
          ))}
        </div>

        {/* ÁREA DE DOCUMENTO (ESTILO HOJA DE PAPEL) */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {creando || docSeleccionado ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-12 lg:p-20 rounded-sm shadow-2xl border border-slate-200 min-h-[1000px] flex flex-col relative print:shadow-none print:border-none print:p-0"
              >
                {/* Cabecera Técnica del Documento */}
                <div className="grid grid-cols-2 gap-y-4 text-[11px] border-b border-slate-100 pb-8 mb-10 text-slate-600">
                  <div className="space-y-1">
                    <p><span className="font-black uppercase text-[9px] text-slate-400 block">Especialista Responsable</span> <span className="font-bold">{nuevoDoc.especialista}</span></p>
                    <p><span className="font-black uppercase text-[9px] text-slate-400 block">RUT</span> <span className="font-bold">{nuevoDoc.rut_especialista}</span></p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p><span className="font-black uppercase text-[9px] text-slate-400 block">Llenado por</span> <span className="font-bold">{docSeleccionado?.llenado_por || nuevoDoc.llenado_por}</span></p>
                    <p><span className="font-black uppercase text-[9px] text-slate-400 block">Fecha</span> <span className="font-bold">{new Date(docSeleccionado?.fecha_creacion || Date.now()).toLocaleString()}</span></p>
                  </div>
                  <div className="col-span-2 flex justify-between pt-4 border-t border-slate-50">
                    <p className="flex items-center gap-2"><User size={12} className="text-blue-500" /> <span className="font-black uppercase text-[9px]">Firma Paciente:</span> {docSeleccionado?.firma_paciente || 'Sin asignar'}</p>
                    <p className="flex items-center gap-2"><ShieldCheck size={12} className="text-blue-500" /> <span className="font-black uppercase text-[9px]">Firma Profesional:</span> {docSeleccionado?.firma_profesional || 'Sin asignar'}</p>
                  </div>
                </div>

                {/* Título y Contenido */}
                <div className="flex-1 space-y-10">
                  <input 
                    type="text" 
                    className="w-full text-center text-3xl font-black uppercase italic border-none focus:ring-0 text-slate-800"
                    placeholder="TÍTULO DEL DOCUMENTO"
                    value={creando ? nuevoDoc.titulo : docSeleccionado.titulo_documento}
                    readOnly={!creando}
                    onChange={(e) => setNuevoDoc({...nuevoDoc, titulo: e.target.value})}
                  />

                  {creando ? (
                    <textarea 
                      className="w-full h-[600px] border-none focus:ring-0 text-sm font-medium leading-relaxed text-slate-700 whitespace-pre-wrap p-0"
                      placeholder="Escriba el contenido del documento aquí..."
                      value={nuevoDoc.contenido}
                      onChange={(e) => setNuevoDoc({...nuevoDoc, contenido: e.target.value})}
                    />
                  ) : (
                    <div className="text-sm font-medium leading-relaxed text-slate-700 whitespace-pre-wrap min-h-[500px]">
                      {docSeleccionado.contenido}
                    </div>
                  )}
                </div>

                {/* Firmas y Footer (Solo se ve al final o al imprimir) */}
                <div className="mt-20 border-t-2 border-slate-100 pt-16">
                  <div className="grid grid-cols-2 gap-20 text-center">
                    <div className="space-y-2">
                      <div className="h-[1px] bg-slate-300 w-48 mx-auto"></div>
                      <p className="text-[10px] font-black uppercase">Firma Paciente</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-[1px] bg-slate-300 w-48 mx-auto"></div>
                      <p className="text-[10px] font-black uppercase">Firma Profesional</p>
                    </div>
                  </div>

                  <div className="mt-20 text-center space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2">
                      <MapPin size={10} /> Venancia Leiva 1871, La Pintana, Región Metropolitana
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2">
                      <Phone size={10} /> +56966467641 / +56994464662
                    </p>
                  </div>
                </div>

                {/* Botón Flotante para Guardar (No se imprime) */}
                {creando && (
                  <button 
                    onClick={guardarDocumento}
                    className="absolute bottom-10 right-10 bg-emerald-500 text-white p-5 rounded-full shadow-2xl hover:bg-slate-900 transition-all print:hidden"
                  >
                    <Save size={24} />
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="bg-slate-50 h-[800px] rounded-[3.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-20">
                <FileText size={80} className="text-slate-200 mb-6" />
                <h4 className="text-xl font-black text-slate-300 uppercase italic">Seleccione o cree un documento</h4>
                <button onClick={() => setCreando(true)} className="mt-6 bg-white text-blue-600 px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-sm border border-slate-100">Empezar a escribir</button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; background: white !important; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0 !important; }
          .print-hidden { display: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  )
}