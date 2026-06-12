import { format } from 'date-fns';
import { AlertTriangle, Bug, MousePointer2, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Detection {
  id: string;
  type: string;
  confidence: number;
  timestamp: Date;
  imageUrl?: string;
  location: string;
  source: string;
  coordinates?: { lat: number; lng: number };
}

const PEST_CONFIG: Record<string, any> = {
  scorpion: {
    icon: ShieldAlert,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    label: 'Escorpião',
  },
  rat: {
    icon: MousePointer2,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    label: 'Rato',
  },
  cockroach: {
    icon: Bug,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    label: 'Barata',
  },
  cupim: {
    icon: Bug,
    color: 'text-amber-600',
    bg: 'bg-amber-600/10',
    label: 'Cupim',
  },
  formiga: {
    icon: Bug,
    color: 'text-stone-400',
    bg: 'bg-stone-400/10',
    label: 'Formiga',
  },
  aranha: {
    icon: Bug,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    label: 'Aranha',
  },
  mosca: {
    icon: Bug,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    label: 'Mosca',
  },
  percevejo: {
    icon: Bug,
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    label: 'Percevejo',
  },
  default: {
    icon: Bug,
    color: 'text-[#00f59b]',
    bg: 'bg-[#00f59b]/10',
    label: 'Praga Identificada',
  }
};

export default function DetectionList({ detections, onSelect }: { detections: Detection[], onSelect?: (d: Detection) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-white/50 italic">
          Deteções em Tempo Real (Georreferenciadas)
        </h2>
        <span className="font-mono text-[10px] text-[#00f59b] uppercase font-bold">
          Total: {detections.length}
        </span>
      </div>

      <div className="grid gap-2">
        {detections.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-mono text-xs text-white/20 italic">Aguardando dados georreferenciados...</p>
          </div>
        ) : (
          detections.map((detection) => {
            const config = PEST_CONFIG[detection.type] || PEST_CONFIG.default;
            const Icon = config.icon;
            const displayLabel = config.label || detection.type.charAt(0).toUpperCase() + detection.type.slice(1);

            return (
              <motion.div
                key={detection.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onSelect?.(detection)}
                className={cn(
                  "group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 cursor-pointer",
                  "bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#00f59b]/30 hover:shadow-lg hover:shadow-[#00f59b]/5"
                )}
              >
                <div className={cn("p-3 rounded-xl shadow-inner", config.bg)}>
                  <Icon className={cn("w-5 h-5", config.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-mono text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
                      {displayLabel}
                      <span className={cn(
                        "px-1.5 py-0.5 text-[8px] rounded border tracking-widest uppercase font-bold",
                        detection.source === 'App Pestscan' 
                          ? "bg-red-600/10 text-red-600 border-red-600/20" 
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {detection.source}
                      </span>
                    </h3>
                    <span className="font-mono text-[10px] text-white/40">
                      {format(detection.timestamp, 'HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/60 uppercase tracking-widest">
                      Confiança: <span className={cn("font-bold", config.color)}>{detection.confidence}%</span>
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-tighter truncate">
                      {detection.location}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:block">
                   {detection.imageUrl ? (
                     <div className="relative group/img">
                       <img 
                         src={detection.imageUrl} 
                         alt="Detection" 
                         className="w-14 h-14 rounded-xl object-cover border border-white/10 group-hover/img:border-[#00f59b]/50 transition-colors"
                         referrerPolicy="no-referrer"
                       />
                       <div className="absolute inset-0 bg-[#00f59b]/10 opacity-0 group-hover/img:opacity-100 rounded-xl transition-opacity pointer-events-none" />
                     </div>
                   ) : (
                     <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                       <AlertTriangle className="w-4 h-4 text-white/20" />
                     </div>
                   )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
