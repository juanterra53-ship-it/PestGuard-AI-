import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Maximize2, Download, Share2 } from 'lucide-react';
import { Detection } from './DetectionList';

interface VideoModalProps {
  detection: Detection | null;
  onClose: () => void;
}

export default function VideoModal({ detection, onClose }: VideoModalProps) {
  if (!detection) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-[#011a14] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 text-red-500 fill-red-500" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-black text-white uppercase tracking-tighter">
                  Gravação de Evento: {detection.type.toUpperCase()}
                </h3>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  {detection.location} • {detection.timestamp.toLocaleString()}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Video Area */}
          <div className="relative aspect-video bg-black flex items-center justify-center group">
            {/* Simulated Video Feed */}
            <img 
              src={detection.imageUrl || `https://picsum.photos/seed/${detection.id}/1280/720`} 
              alt="Video Feed" 
              className="w-full h-full object-cover opacity-80"
              referrerPolicy="no-referrer"
            />
            
            {/* Overlay UI */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
              <div className="flex justify-between items-start">
                <div className="bg-red-600 px-3 py-1 rounded-md flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <span className="font-mono text-[10px] font-bold text-white uppercase tracking-widest">REC</span>
                </div>
                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-md border border-white/10">
                  <span className="font-mono text-[10px] text-white/80 uppercase tracking-widest">CAM-0{Math.floor(Math.random() * 9) + 1}</span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 pointer-events-auto hover:scale-110 hover:bg-white/20 transition-all cursor-pointer">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#00f59b]" />
                    <span className="font-mono text-[10px] font-bold text-[#00f59b] uppercase tracking-widest">IA Ativa</span>
                  </div>
                  <p className="font-mono text-[12px] text-white font-black uppercase">
                    {detection.type} Detectado ({detection.confidence}%)
                  </p>
                </div>
                <div className="flex gap-2 pointer-events-auto">
                  <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-white/5 flex items-center justify-between">
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all text-[10px] font-mono uppercase font-bold">
                <Download className="w-4 h-4" />
                Baixar Clip
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all text-[10px] font-mono uppercase font-bold">
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
            </div>
            <p className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
              ID: {detection.id} • Armazenamento em Nuvem Ativo
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
