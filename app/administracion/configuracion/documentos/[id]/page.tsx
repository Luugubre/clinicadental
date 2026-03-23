'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Type, AlignLeft, Image as ImageIcon, 
  Minus, Columns, Eye, Save, Trash2, ChevronUp, 
  ChevronDown, FileText, Loader2, X, EyeOff,
  UploadCloud, Search, Layout
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ConstructorDocumentosPage() {
  const { id } = useParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState<string | null>(null)
  const [modoVistaPrevia, setModoVistaPrevia] = useState(false)
  const [menuColumnasAbierto, setMenuColumnasAbierto] = useState(false)
  
  const [bloques, setBloques] = useState<any[]>([])
  const [nombrePlantilla, setNombrePlantilla] = useState('Nuevo Documento Clínico')
  const [plantillaId, setPlantillaId] = useState<string | null>(null)

  useEffect(() => { fetchPlantilla() }, [id])

  async function fetchPlantilla() {
    setCargando(true)
    const { data } = await supabase.from('documentos_plantillas').select('*').eq('categoria_id', id).single()
    if (data) {
      setPlantillaId(data.id)
      setNombrePlantilla(data.nombre)
      setBloques(data.contenido || [])
    }
    setCargando(false)
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const payload = { categoria_id: id, nombre: nombrePlantilla.toUpperCase(), contenido: bloques, updated_at: new Date() }
      let error;
      if (plantillaId) {
        const { error: err } = await supabase.from('documentos_plantillas').update(payload).eq('id', plantillaId)
        error = err
      } else {
        const { data, error: err } = await supabase.from('documentos_plantillas').insert([payload]).select().single()
        if (data) setPlantillaId(data.id)
        error = err
      }
      if (error) throw error
      alert("✅ Documento guardado")
    } catch (err: any) { alert("Error: " + err.message) } 
    finally { setGuardando(false) }
  }

  const gestionarSubidaImagen = async (bloqueId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSubiendoImagen(bloqueId);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('documentos_imagenes').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('documentos_imagenes').getPublicUrl(fileName);
        actualizarContenido(bloqueId, publicUrl);
    } catch (error: any) { alert('Error: ' + error.message); } 
    finally { setSubiendoImagen(null); }
  };

  // MODIFICADO: Agregar bloque con N columnas
  const agregarFila = (numColumnas: number) => {
    const nuevoBloque = {
      id: Math.random().toString(36).substr(2, 9),
      tipo: 'fila',
      columnas: numColumnas,
      contenido: Array(numColumnas).fill(''),
    }
    setBloques([...bloques, nuevoBloque])
    setMenuColumnasAbierto(false)
  }

  const agregarBloque = (tipo: string) => {
    const nuevoBloque = {
      id: Math.random().toString(36).substr(2, 9),
      tipo,
      contenido: '',
    }
    setBloques([...bloques, nuevoBloque])
  }

  const eliminarBloque = (id: string) => setBloques(bloques.filter(b => b.id !== id))
  const actualizarContenido = (id: string, valor: any) => {
    setBloques(bloques.map(b => b.id === id ? { ...b, contenido: valor } : b))
  }
  const moverBloque = (index: number, direccion: 'subir' | 'bajar') => {
    const nuevaLista = [...bloques]
    const item = nuevaLista.splice(index, 1)[0]
    nuevaLista.splice(direccion === 'subir' ? index - 1 : index + 1, 0, item)
    setBloques(nuevaLista)
  }

  if (cargando) return <div className="h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>

  return (
    <div className={`min-h-screen transition-all duration-500 ${modoVistaPrevia ? 'bg-slate-200 p-0 md:p-12' : 'bg-[#F8FAFC] p-8'}`}>
      
      <AnimatePresence>
        {modoVistaPrevia && (
          <motion.button
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            onClick={() => setModoVistaPrevia(false)}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 px-8 py-5 bg-slate-900/90 backdrop-blur-xl text-white rounded-full font-black text-xs uppercase shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/10"
          >
            <EyeOff size={18} className="text-blue-400" /> Volver a Editar
          </motion.button>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto space-y-8">
        {!modoVistaPrevia && (
          <header className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center sticky top-8 z-50 transition-all">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><ArrowLeft size={20}/></button>
              <div>
                <input className="text-xl font-black text-slate-800 uppercase italic bg-transparent outline-none border-none focus:ring-0" value={nombrePlantilla} onChange={(e) => setNombrePlantilla(e.target.value)}/>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest ml-1">Configuración de Plantilla</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModoVistaPrevia(true)} className="flex items-center gap-2 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all"><Eye size={16}/> Vista Previa</button>
              <button onClick={handleGuardar} disabled={guardando} className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-slate-900 transition-all shadow-lg disabled:bg-slate-300">
                {guardando ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Guardar
              </button>
            </div>
          </header>
        )}

        {!modoVistaPrevia && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 relative">
            <BotonTool icon={<Type size={18}/>} label="Título" onClick={() => agregarBloque('titulo')} />
            <BotonTool icon={<AlignLeft size={18}/>} label="Texto" onClick={() => agregarBloque('texto')} />
            <BotonTool icon={<ImageIcon size={18}/>} label="Imagen PC" onClick={() => agregarBloque('imagen')} />
            
            {/* BOTÓN FILA CON MENÚ */}
            <div className="relative">
                <BotonTool 
                    active={menuColumnasAbierto}
                    icon={<Layout size={18}/>} 
                    label="Fila / Columnas" 
                    onClick={() => setMenuColumnasAbierto(!menuColumnasAbierto)} 
                />
                <AnimatePresence>
                    {menuColumnasAbierto && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute top-full mt-4 left-0 w-full bg-slate-900 rounded-[2rem] p-4 shadow-2xl z-[100] grid grid-cols-1 gap-2"
                        >
                            {[1, 2, 3, 4].map(n => (
                                <button key={n} onClick={() => agregarFila(n)} className="w-full py-3 px-4 rounded-xl text-white font-black text-[10px] uppercase hover:bg-blue-600 transition-all flex justify-between items-center group">
                                    {n} {n === 1 ? 'Columna' : 'Columnas'}
                                    <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                                        {Array(n).fill(0).map((_, i) => <div key={i} className="w-2 h-2 bg-white/30 rounded-sm group-hover:bg-white" />)}
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <BotonTool icon={<Minus size={18}/>} label="Separador" onClick={() => agregarBloque('separador')} />
          </div>
        )}

        <div className={`min-h-[842px] transition-all duration-700 relative shadow-2xl ${modoVistaPrevia ? 'bg-white p-20 rounded-none shadow-black/20' : 'bg-white rounded-[3rem] p-12 border border-slate-100'}`}>
          <div className="space-y-8">
            {bloques.map((bloque, index) => (
              <div key={bloque.id} className="relative group">
                {!modoVistaPrevia && (
                  <div className="absolute -left-16 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <button onClick={() => moverBloque(index, 'subir')} className="p-2 bg-white rounded-lg shadow-md border border-slate-100 hover:text-blue-600"><ChevronUp size={14}/></button>
                    <button onClick={() => moverBloque(index, 'bajar')} className="p-2 bg-white rounded-lg shadow-md border border-slate-100 hover:text-blue-600"><ChevronDown size={14}/></button>
                    <button onClick={() => eliminarBloque(bloque.id)} className="p-2 bg-white rounded-lg shadow-md border border-slate-100 text-red-400 hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button>
                  </div>
                )}

                {bloque.tipo === 'titulo' && (
                  modoVistaPrevia ? <h2 className="text-4xl font-black uppercase italic text-slate-900 mb-4">{bloque.contenido}</h2> :
                  <input placeholder="Escribe el Título..." className="w-full text-3xl font-black uppercase italic text-slate-800 outline-none border-b-2 border-transparent focus:border-blue-500/20 pb-2 transition-all" value={bloque.contenido} onChange={(e) => actualizarContenido(bloque.id, e.target.value)}/>
                )}

                {bloque.tipo === 'texto' && (
                  modoVistaPrevia ? <p className="text-slate-700 leading-[1.8] text-justify whitespace-pre-wrap text-sm">{bloque.contenido}</p> :
                  <textarea placeholder="Contenido..." className="w-full min-h-[120px] text-sm text-slate-600 outline-none resize-none bg-slate-50/50 p-6 rounded-[2rem] border border-transparent focus:bg-white focus:border-blue-500/10 transition-all" value={bloque.contenido} onChange={(e) => actualizarContenido(bloque.id, e.target.value)}/>
                )}

                {bloque.tipo === 'imagen' && (
                  <div className={`flex flex-col items-center justify-center ${modoVistaPrevia ? '' : 'bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 group/droparea'}`}>
                    {!modoVistaPrevia && <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => gestionarSubidaImagen(bloque.id, e)}/>}
                    {subiendoImagen === bloque.id ? (
                        <div className="flex flex-col items-center gap-2 py-10"><Loader2 className="animate-spin text-blue-500" size={32} /><p className="text-[10px] font-black uppercase text-slate-400">Subiendo...</p></div>
                    ) : bloque.contenido ? (
                      <div className="relative group/img">
                        <img src={bloque.contenido} className="max-h-[350px] rounded-2xl shadow-xl" />
                        {!modoVistaPrevia && (
                          <div className="absolute -top-3 -right-3 flex gap-1.5 opacity-0 group-hover/img:opacity-100 transition-all">
                              <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-slate-900 transition-all"><Search size={14}/></button>
                              <button onClick={() => actualizarContenido(bloque.id, '')} className="p-2.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-700 transition-all"><X size={14}/></button>
                          </div>
                        )}
                      </div>
                    ) : (
                      !modoVistaPrevia && <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-3 py-10 hover:scale-105 transition-all text-slate-400 hover:text-blue-600"><UploadCloud size={48} strokeWidth={1} /><span className="text-xs font-black uppercase tracking-widest">Subir del PC</span></button>
                    )}
                  </div>
                )}

                {/* BLOQUE FILA DINÁMICO (1 a 4 columnas) */}
                {bloque.tipo === 'fila' && (
                  <div 
                    className={`grid gap-10 pt-10 mt-10 transition-all`}
                    style={{ gridTemplateColumns: `repeat(${bloque.columnas}, minmax(0, 1fr))` }}
                  >
                    {bloque.contenido.map((textoCol: string, i: number) => (
                      <div key={i} className="flex flex-col items-center">
                        {modoVistaPrevia ? (
                          <>
                            <div className="w-full border-t border-slate-900 mb-2" />
                            <span className="text-[10px] font-black uppercase text-slate-900 text-center">{textoCol}</span>
                          </>
                        ) : (
                          <input 
                            placeholder={`Columna ${i + 1}`} 
                            className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black text-center uppercase outline-none border-2 border-transparent focus:border-blue-500/10" 
                            value={textoCol} 
                            onChange={(e) => {
                                const n = [...bloque.contenido];
                                n[i] = e.target.value;
                                actualizarContenido(bloque.id, n);
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {bloque.tipo === 'separador' && <div className="py-6 flex justify-center"><div className="h-[1px] bg-slate-100 w-full relative">{!modoVistaPrevia && <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-white text-[8px] font-bold text-slate-300 uppercase tracking-widest">Separador</div>}</div></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function BotonTool({ icon, label, onClick, active }: any) {
  return (
    <button onClick={onClick} className={`w-full flex flex-col items-center justify-center gap-3 p-6 border rounded-[2rem] transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-95 group ${active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-600'}`}>
      <div className={`p-4 rounded-[1.2rem] transition-colors ${active ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-blue-50'}`}>{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
    </button>
  )
}