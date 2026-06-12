import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { type Detection } from './DetectionList';

interface PestAlertProps {
  detection: Detection | null;
  onClose: () => void;
}

export default function PestAlert({ detection, onClose }: PestAlertProps) {
  return (
    <AnimatePresence>
      {detection && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          className="fixed top-20 left-4 right-4 z-[100] sm:left-auto sm:right-8 sm:w-96"
        >
          <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl shadow-red-600/20 flex items-start gap-4 border border-red-500">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-mono text-sm font-bold uppercase tracking-tight">Alerta de Praga!</h4>
              <p className="text-xs text-white/80 font-mono mt-1">
                {detection.type.toUpperCase()} detetado em {detection.location} com {detection.confidence}% de confiança.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
