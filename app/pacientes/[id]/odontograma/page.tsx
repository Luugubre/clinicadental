'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Activity, Save, Loader2, X, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'

const c1 = [18, 17, 16, 15, 14, 13, 12, 11];
const c2 = [21, 22, 23, 24, 25, 26, 27, 28];
const c3 = [48, 47, 46, 45, 44, 43, 42, 41];
const c4 = [31, 32, 33, 34, 35, 36, 37, 38];

export default function OdontogramaPage() {
  const { id } = useParams()
  const [dentadura, setDentadura] = useState<Record<number, any>>({})
  const [itemsGlobales, setItemsGlobales] = useState<any[]>([]) // Para mostrar iconos de todos los tratamientos
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (id) {
        fetchTodo();
    }
  }, [id])

  async function fetchTodo() {
    setCargando(true)
    try {
      // 1. Traer el estado maestro (caries, restauraciones, ausencias)
      const { data: odonto } = await supabase
        .from('odontogramas')
        .select('dentadura')
        .eq('paciente_id', id)
        .maybeSingle()
      
      // 2. Traer todos los items de todos los presupuestos para mostrar los logos clínicos
      const { data: items } = await supabase
        .from('presupuesto_items')
        .select('*, prestaciones:prestacion_id(icono_tipo)')
        .in('presupuesto_id', (
            await supabase.from('presupuestos').select('id').eq('paciente_id', id)
        ).data?.map(p => p.id) || [])

      if (odonto) setDentadura(odonto.dentadura)
      if (items) setItemsGlobales(items)
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  const cambiarEstadoCara = (piezaId: number, cara: string) => {
    const d = dentadura[piezaId] || {};
    const estados = ['sano', 'caries', 'restauracion'];
    const proximo = estados[(estados.indexOf(d[cara] || 'sano') + 1) % estados.length];
    setDentadura({ ...dentadura, [piezaId]: { ...d, [cara]: proximo } })
  }

  const cambiarEstadoGeneral = (piezaId: number) => {
    const d = dentadura[piezaId] || {};
    const proximo = d.estado_general === 'ausente' ? 'presente' : 'ausente';
    setDentadura({ ...dentadura, [piezaId]: { ...d, estado_general: proximo } });
  }

  const guardarOdontograma = async () => {
    setGuardando(true)
    // ESTO SOLO AFECTA AL MAESTRO, NO A LOS PRESUPUESTOS INDIVIDUALES
    const { error } = await supabase
      .from('odontogramas')
      .upsert({ 
        paciente_id: id, 
        dentadura: dentadura, 
        ultima_actualizacion: new Date() 
      }, { onConflict: 'paciente_id' })

    if (error) alert("Error al guardar")
    else alert("Estado clínico principal actualizado")
    setGuardando(false)
  }

  if (cargando) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Activity size={24} className="text-blue-600"/> Odontograma Clínico Principal
          </h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Este mapa representa el estado actual permanente del paciente</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex gap-4 bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100">
            <LegendItem color="bg-white border border-slate-200" label="Sano" />
            <LegendItem color="bg-red-500 shadow-sm" label="Caries" />
            <LegendItem color="bg-blue-500 shadow-sm" label="Restauración" />
          </div>
          <button 
            onClick={guardarOdontograma} 
            disabled={guardando} 
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-black transition-all disabled:bg-slate-300"
          >
            {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} 
            Guardar Ficha Maestra
          </button>
        </div>
      </div>

      <div className="bg-slate-50/30 p-10 rounded-[3rem] border-2 border-slate-100 overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] flex flex-col gap-14 items-center">
          <div className="flex justify-center items-end gap-1">
            <div className="flex gap-1 border-r-4 border-slate-100 pr-4">
              {c1.map(pid => <Diente key={pid} id={pid} datos={dentadura[pid]} itemsDiente={itemsGlobales.filter(i => i.diente_id === pid)} onClickCara={cambiarEstadoCara} onDienteClick={cambiarEstadoGeneral} superior />)}
            </div>
            <div className="flex gap-1 pl-4">
              {c2.map(pid => <Diente key={pid} id={pid} datos={dentadura[pid]} itemsDiente={itemsGlobales.filter(i => i.diente_id === pid)} onClickCara={cambiarEstadoCara} onDienteClick={cambiarEstadoGeneral} superior />)}
            </div>
          </div>

          <div className="flex justify-center items-start gap-1">
            <div className="flex gap-1 border-r-4 border-slate-100 pr-4">
              {c3.map(pid => <Diente key={pid} id={pid} datos={dentadura[pid]} itemsDiente={itemsGlobales.filter(i => i.diente_id === pid)} onClickCara={cambiarEstadoCara} onDienteClick={cambiarEstadoGeneral} superior={false} />)}
            </div>
            <div className="flex gap-1 pl-4">
              {c4.map(pid => <Diente key={pid} id={pid} datos={dentadura[pid]} itemsDiente={itemsGlobales.filter(i => i.diente_id === pid)} onClickCara={cambiarEstadoCara} onDienteClick={cambiarEstadoGeneral} superior={false} />)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function Diente({ id, datos, onClickCara, onDienteClick, superior = false, itemsDiente = [] }: any) {
  const estadoDiente = datos?.estado_general || 'presente';
  
  // Lógica de iconos mapeados (Igual que en presupuestos pero leyendo de itemsGlobales)
  const tiposIconos = itemsDiente.map((i: any) => i.prestaciones?.icono_tipo).filter(Boolean);

  const getClaseCara = (cara: string) => {
    const e = datos?.[cara] || 'sano';
    if (e === 'caries') return 'fill-red-500 stroke-red-700';
    if (e === 'restauracion') return 'fill-blue-500 stroke-blue-700';
    return 'fill-white stroke-slate-200';
  };

  return (
    <div className={`flex flex-col items-center gap-2 group relative ${superior ? 'flex-col' : 'flex-col-reverse'}`}>
      <span className="text-[10px] font-black text-slate-400">{id}</span>
      
      <div className={`relative w-12 h-14 flex items-center justify-center transition-all ${estadoDiente === 'ausente' ? 'grayscale opacity-10' : 'hover:scale-110'}`}>
        <button onClick={(e) => { e.stopPropagation(); onDienteClick(id); }} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white p-1 rounded-full shadow-lg z-20">
            {estadoDiente === 'ausente' ? <RotateCcw size={8}/> : <X size={8}/>}
        </button>

        <svg viewBox="0 0 100 100" className={`w-full h-full ${!superior ? 'rotate-180' : ''}`}>
           {/* Anatomía base */}
           <path d="M25,20 L75,20 L80,85 Q80,95 50,95 Q20,95 20,85 Z" fill={tiposIconos.includes('corona') ? "#fbbf24" : "white"} fillOpacity={tiposIconos.includes('corona') ? "0.3" : "1"} stroke={tiposIconos.length > 0 ? "#3b82f6" : "#cbd5e1"} strokeWidth="5"/>
           
           {/* Logos clínicos automáticos */}
           {tiposIconos.includes('endodoncia') && <path d="M45,25 Q50,50 45,85" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="round" />}
           {tiposIconos.includes('extraccion') && <g stroke="#ef4444" strokeWidth="10"><line x1="20" y1="20" x2="80" y2="90" /><line x1="80" y1="20" x2="20" y2="90" /></g>}
           {tiposIconos.includes('implante') && <rect x="40" y="55" width="20" height="35" rx="2" fill="#64748b" />}
           {tiposIconos.includes('restauracion') && <circle cx="50" cy="45" r="12" fill="#3b82f6" />}
           {tiposIconos.includes('perno') && <path d="M50,10 L50,45 M35,45 L65,45" stroke="#1e293b" strokeWidth="8" />}
           {tiposIconos.includes('rayosx') && <path d="M85,30 L95,30 M90,25 L90,35" stroke="#f59e0b" strokeWidth="4" />}
           {tiposIconos.includes('pulido') && <path d="M25,80 Q50,90 75,80" stroke="#10b981" strokeWidth="6" fill="none" />}

           {estadoDiente === 'ausente' && (
             <g stroke="#cbd5e1" strokeWidth="3"><line x1="0" y1="0" x2="100" y2="100" /><line x1="100" y1="0" x2="0" y2="100" /></g>
           )}
        </svg>
      </div>

      <div className={`relative transition-all ${estadoDiente === 'ausente' ? 'opacity-0 pointer-events-none' : ''}`}>
        <svg width="36" height="36" viewBox="0 0 100 100" className="cursor-pointer drop-shadow-sm">
          <path d="M10,10 L90,10 L70,30 L30,30 Z" className={getClaseCara('top')} onClick={() => onClickCara(id, 'top')} />
          <path d="M10,90 L90,90 L70,70 L30,70 Z" className={getClaseCara('bottom')} onClick={() => onClickCara(id, 'bottom')} />
          <path d="M10,10 L30,30 L30,70 L10,90 Z" className={getClaseCara('left')} onClick={() => onClickCara(id, 'left')} />
          <path d="M90,10 L70,30 L70,70 L90,90 Z" className={getClaseCara('right')} onClick={() => onClickCara(id, 'right')} />
          <path d="M30,30 L70,30 L70,70 L30,70 Z" className={getClaseCara('center')} onClick={() => onClickCara(id, 'center')} />
        </svg>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
    </div>
  )
}