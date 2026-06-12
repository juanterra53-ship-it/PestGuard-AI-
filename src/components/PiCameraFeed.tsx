import { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Cpu, 
  Wifi, 
  HardDrive, 
  Play, 
  Square, 
  RefreshCw, 
  Eye, 
  ShieldAlert, 
  Scan, 
  MapPin, 
  AlertCircle 
} from 'lucide-react';
import type { Detection } from './DetectionList';

interface PiCameraFeedProps {
  onNewDetection: (detection: Detection) => void;
  isPiConnected: boolean;
}

const PESt_SCENARIOS = [
  {
    type: 'escorpião',
    name: 'Escorpião Amarelo',
    image: 'https://images.unsplash.com/photo-1594411124239-cf392f447d2f?w=600&auto=format&fit=crop&q=60',
    location: 'Setor 4 - Depósito de Pallets',
    confidence: 94,
    x: '40%',
    y: '45%',
    w: '80px',
    h: '80px'
  },
  {
    type: 'rato',
    name: 'Rato de Esgoto',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=60',
    location: 'Setor 1 - Sala de Máquinas (Fundo)',
    confidence: 89,
    x: '55%',
    y: '60%',
    w: '110px',
    h: '90px'
  },
  {
    type: 'aranha',
    name: 'Aranha Marrom',
    image: 'https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?w=600&auto=format&fit=crop&q=60',
    location: 'Setor 3 - Almoxarifado Central',
    confidence: 97,
    x: '30%',
    y: '35%',
    w: '70px',
    h: '70px'
  }
];

export default function PiCameraFeed({ onNewDetection, isPiConnected }: PiCameraFeedProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [offlineBufferCount, setOfflineBufferCount] = useState(0);
  const [ssdUsed, setSsdUsed] = useState(4.2); // Em GB
  const [fps, setFps] = useState(15);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const activeScenario = PESt_SCENARIOS[currentScenarioIdx];

  // Live timestamp overlay
  const [timestamp, setTimestamp] = useState(new Date().toISOString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toISOString());
      if (isPlaying) {
        // Mock a slight variation of FPS
        setFps(Math.floor(Math.random() * 4) + 14);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const toggleFeed = () => {
    setIsPlaying(prev => !prev);
    if (isPlaying) {
      setFps(0);
    } else {
      setFps(15);
    }
  };

  const nextScenario = () => {
    setCurrentScenarioIdx(prev => (prev + 1) % PESt_SCENARIOS.length);
  };

  const handleSimulateDetection = () => {
    if (!isPiConnected) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      // Coordinates close to Catedral de Ponta Grossa (random offset)
      const latOffset = (Math.random() - 0.5) * 0.008;
      const lngOffset = (Math.random() - 0.5) * 0.008;
      const lat = -25.0958 + latOffset;
      const lng = -50.1614 + lngOffset;

      const newDet: Detection = {
        id: `pi4-${Date.now()}`,
        type: activeScenario.type as any,
        confidence: activeScenario.confidence + Math.floor(Math.random() * 3),
        timestamp: new Date(),
        location: activeScenario.location,
        imageUrl: activeScenario.image,
        source: 'Monitoramento IA',
        coordinates: { lat, lng }
      };

      onNewDetection(newDet);
      setIsAnalyzing(false);

      // Simulate local SSD save & sync feedback
      setSsdUsed(prev => parseFloat((prev + 0.012).toFixed(3))); // 12MB image size
      setLastCheckTime(new Date().toLocaleTimeString());
    }, 1500);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-[#00f59b] animate-pulse" />
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#00f59b] font-black">
              Câmerà RPi4 em Tempo Real
            </h3>
            <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider">
              Mapeamento de Vídeo IoT Inteligente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase flex items-center gap-1.5 ${
            isPiConnected && isPlaying 
              ? 'bg-[#00f59b]/10 text-[#00f59b] border border-[#00f59b]/20' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPiConnected && isPlaying ? 'bg-[#00f59b] animate-ping' : 'bg-red-500'}`} />
            {isPiConnected && isPlaying ? 'TRANSMITINDO' : 'PAUSADO'}
          </div>
          <button 
            onClick={toggleFeed}
            className="p-1 px-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all text-[8px] font-mono uppercase font-bold"
            title={isPlaying ? "Congelar Imagem" : "Iniciar Transmissão"}
          >
            {isPlaying ? 'Congelar' : 'Iniciar'}
          </button>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black group select-none">
        {isPiConnected && isPlaying ? (
          <>
            {/* Live Camera Image */}
            <img 
              src={activeScenario.image} 
              alt="Transmissão RPi4" 
              className="w-full h-full object-cover opacity-80 transition-all duration-700"
              referrerPolicy="no-referrer"
            />

            {/* Bounding Box HUD (AI simulation) */}
            <div 
              style={{
                position: 'absolute',
                left: activeScenario.x,
                top: activeScenario.y,
                width: activeScenario.w,
                height: activeScenario.h,
              }}
              className="border-2 border-red-500 bg-red-500/10 rounded-lg pointer-events-none flex flex-col justify-between p-1 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
            >
              <div className="flex justify-between items-start">
                <span className="bg-red-600 text-white font-mono text-[6px] font-bold px-1 rounded uppercase tracking-tighter shadow-md">
                  {activeScenario.name.toUpperCase()}
                </span>
                <span className="text-white font-black font-mono text-[7px]">
                  {activeScenario.confidence}%
                </span>
              </div>
              <div className="w-full h-[1px] bg-red-500/40 animate-bounce" />
              <span className="text-[6px] text-white/60 font-mono text-center">ALERTA</span>
            </div>

            {/* Top-Right HUD details */}
            <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 pointer-events-none">
              <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-mono text-white/80 border border-white/10 uppercase tracking-wider">
                FPS: {fps}
              </span>
              <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[7px] font-mono text-cyan-400 font-bold border border-cyan-500/10 uppercase">
                CAM_NoIR_v3
              </span>
            </div>

            {/* Camera Overlay HUD (Standard live details) */}
            <div className="absolute inset-x-3 top-3 pointer-events-none flex justify-between">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00f59b] animate-ping" />
                <span className="text-[8px] font-mono font-bold text-[#00f59b] bg-black/40 px-1 py-0.5 rounded">ONLINE FEED</span>
              </div>
            </div>

            {/* Scanning Laser Line */}
            <div className="absolute inset-x-0 h-0.5 bg-[#00f59b]/30 shadow-[0_0_10px_rgba(0,245,155,0.5)] animate-scan pointer-events-none" style={{ animationDuration: '3.5s', animationIterationCount: 'infinite' }} />

            {/* Live Timestamp overlay */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-[7px] font-mono text-white/50 space-y-0.5 pointer-events-none">
              <p className="text-white/90">TIME: {timestamp}</p>
              <p>COORD: -25.0958, -50.1614</p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-white/20" />
            <div>
              <p className="font-mono text-xs text-white/40 uppercase font-black">
                Instabilidade ou Sem Sinal
              </p>
              <p className="font-sans text-[10px] text-white/30 max-w-[200px] mx-auto mt-1 leading-snug">
                Inicie a transmissão ou verifique a alimentação de 5V da Raspberry Pi.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Control Panel and SSD Info */}
      <div className="space-y-4">
        {/* Interactive Scenario selection & manual analysis testing */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={nextScenario}
            disabled={!isPiConnected || !isPlaying || isAnalyzing}
            className="p-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-[9px] font-mono uppercase font-bold text-white transition-all"
            title="Mudar o cenário de simulação do Pi4"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Próximo Cenário
          </button>
          <button
            onClick={handleSimulateDetection}
            disabled={!isPiConnected || isAnalyzing || !isPlaying}
            className={`p-2.5 rounded-xl border text-[9px] font-mono uppercase font-black tracking-wider flex items-center justify-center gap-2 transition-all ${
              isAnalyzing 
                ? 'bg-[#00f59b]/20 border-[#00f59b]/40 text-[#00f59b]' 
                : 'bg-[#00f59b] hover:bg-[#00f59b]/90 text-black border-[#00f59b]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 text-black" />
                Capturar e Enviar Link
              </>
            )}
          </button>
        </div>

        {/* Info panel about the SSD buffer */}
        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-left space-y-2.5">
          <div className="flex items-center gap-2 text-white/40">
            <HardDrive className="w-4 h-4 text-[#00f59b]" />
            <span className="font-mono text-[9px] uppercase tracking-wider font-bold">Armazenamento Local SSD Pi4</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-[8px] font-mono text-white/30 uppercase">Armazenado SSD:</span>
              <p className="font-mono text-white font-bold">{ssdUsed.toFixed(3)} GB / 120 GB</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[8px] font-mono text-white/30 uppercase">Modo de Gravação:</span>
              <p className="font-mono text-emerald-400 font-bold uppercase text-[10px]">Dual-Flow (Auto)</p>
            </div>
          </div>

          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
            <div 
              style={{ width: `${(ssdUsed / 120) * 100}%` }}
              className="h-full bg-[#00f59b] transition-all duration-300" 
            />
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-white/40">
            <span>Cache Offline SSD: {offlineBufferCount} itens</span>
            {lastCheckTime && <span>Ùltimo registro IoT: {lastCheckTime}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
