'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Pill, Plus, FileText, Trash2, Loader2, 
  Save, ClipboardList, X, ChevronRight, Clock 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function RecetasPage() {
  const { id: paciente_id } = useParams()
  const [recetas, setRecetas] = useState<any[]>([])
  const [planes, setPlanes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [creando, setCreando] = useState(false)

  const [nuevaReceta, setNuevaReceta] = useState({
    presupuesto_id: '',
    indicaciones: ''
  })

  useEffect(() => {
    if (paciente_id) {
      fetchData()
    }
  }, [paciente_id])

  async function fetchData() {
    setCargando(true)
    try {
      const { data: recs } = await supabase
        .from('recetas')
        .select(`*, presupuestos ( nombre_tratamiento )`)
        .eq('paciente_id', paciente_id)
        .order('fecha_emision', { ascending: false })
      
      const { data: trats } = await supabase
        .from('presupuestos')
        .select('id, nombre_tratamiento')
        .eq('paciente_id', paciente_id)

      if (recs) setRecetas(recs)
      if (trats) setPlanes(trats)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setCargando(false)
    }
  }

  const guardarReceta = async () => {
    if (!nuevaReceta.indicaciones.trim()) {
      return alert("Debe ingresar las indicaciones de la receta.");
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no válida o expirada.");

      const payload = {
        paciente_id: paciente_id,
        presupuesto_id: nuevaReceta.presupuesto_id || null,
        indicaciones: nuevaReceta.indicaciones,
        medicamentos: 'Ver indicaciones',
        profesional_id: user.id
      };

      const { error } = await supabase.from('recetas').insert([payload]);
      if (error) throw error;

      setNuevaReceta({ presupuesto_id: '', indicaciones: '' });
      setCreando(false);
      fetchData();
      alert("¡Receta guardada con éxito!");

    } catch (error: any) {
      alert(`Error al guardar receta: ${error.message}`);
    }
  }

  const eliminarReceta = async (id: string) => {
    if (!confirm("¿Desea eliminar esta receta?")) return
    try {
      const { error } = await supabase.from('recetas').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert("Error al eliminar: " + error.message);
    }
  }

  if (cargando) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest italic">Accediendo al recetario...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4">
      
      {/* HEADER */}
      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-slate-800 uppercase italic leading-none flex items-center gap-3">
            <Pill className="text-blue-600" size={28} /> Recetas Médicas
          </h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Historial de prescripciones</p>
        </div>
        {!creando && (
          <button 
            onClick={() => setCreando(true)}
            className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={18}/> Nueva Receta
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LISTADO HISTÓRICO CON HORA */}
        <div className="lg:col-span-4 space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Registros Guardados</h4>
          <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
            {recetas.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase italic">No hay recetas emitidas</p>
              </div>
            ) : (
              recetas.map(r => (
                <motion.div 
                  key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group relative hover:border-blue-400 transition-all"
                >
                  <button onClick={() => eliminarReceta(r.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black text-slate-800 uppercase">
                      {new Date(r.fecha_emision).toLocaleDateString()}
                    </p>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(r.fecha_emision).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-3 line-clamp-1">
                    {r.presupuestos?.nombre_tratamiento || 'Consulta General'}
                  </p>
                  
                  <div className="bg-slate-50 p-3 rounded-2xl text-[11px] text-slate-600 font-bold italic line-clamp-3">
                    "{r.indicaciones}"
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {creando ? (
              <motion.div 
                key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100"
              >
                <div className="flex justify-between items-center mb-10">
                  <h4 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Nueva Indicación</h4>
                  <button onClick={() => setCreando(false)} className="bg-slate-50 text-slate-400 p-3 rounded-2xl hover:text-red-500 transition-colors"><X size={20}/></button>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-3 block">Vincular a Plan de Tratamiento</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-50 p-6 rounded-[2rem] text-xs font-bold outline-none border-2 border-transparent focus:border-blue-500/20 appearance-none shadow-inner"
                        value={nuevaReceta.presupuesto_id}
                        onChange={(e) => setNuevaReceta({...nuevaReceta, presupuesto_id: e.target.value})}
                      >
                        <option value="">Receta General (Sin plan)</option>
                        {planes.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre_tratamiento}</option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight size={18} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-3 block italic">Receta e Indicaciones Clínicas</label>
                    <textarea 
                      rows={12}
                      className="w-full bg-slate-50 p-8 rounded-[2.5rem] text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500/20 shadow-inner leading-relaxed"
                      placeholder="Escribe aquí los medicamentos, dosis e indicaciones..."
                      value={nuevaReceta.indicaciones}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, indicaciones: e.target.value})}
                    />
                  </div>

                  <button 
                    onClick={guardarReceta}
                    className="w-full bg-blue-600 text-white py-8 rounded-[2rem] font-black text-sm uppercase shadow-2xl shadow-blue-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Save size={20}/> Guardar Receta
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 p-20 text-center">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] text-slate-200 mb-8 border border-slate-50">
                  <ClipboardList size={64} strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-black text-slate-800 uppercase italic">Recetario Digital</h4>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-4 max-w-xs leading-relaxed">
                  Historial de prescripciones. Selecciona "Nueva Receta" para redactar una orden.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  )
}