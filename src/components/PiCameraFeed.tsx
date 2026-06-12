import { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Cpu, 
  Wifi, 
  WifiOff,
  HardDrive, 
  Play, 
  Square, 
  RefreshCw, 
  Eye, 
  ShieldAlert, 
  Scan, 
  MapPin, 
  AlertCircle,
  Copy,
  Check,
  Terminal,
  ArrowRight
} from 'lucide-react';
import type { Detection } from './DetectionList';

interface PiCameraFeedProps {
  onNewDetection: (detection: Detection) => void;
  isPiConnected: boolean;
}

const PEST_SCENARIOS = [
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
  const [feedMode, setFeedMode] = useState<'simulated' | 'real'>('real');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [offlineBufferCount, setOfflineBufferCount] = useState(0);
  const [ssdUsed, setSsdUsed] = useState(4.2); // Em GB
  const [fps, setFps] = useState(15);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [isRealPiStreaming, setIsRealPiStreaming] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [streamCacheBuster, setStreamCacheBuster] = useState(0);

  const activeScenario = PEST_SCENARIOS[currentScenarioIdx];

  // Live timestamp overlay
  const [timestamp, setTimestamp] = useState(new Date().toISOString());

  // Detect RPi4 Streaming Status and dynamically alert user
  useEffect(() => {
    const checkStatus = () => {
      fetch('/api/pi/status')
        .then(res => res.json())
        .then(data => {
          setIsRealPiStreaming(data.online);
        })
        .catch(() => {
          setIsRealPiStreaming(false);
        });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toISOString());
      if (isPlaying) {
        if (feedMode === 'simulated') {
          // Mock standard variations of FPS
          setFps(Math.floor(Math.random() * 4) + 14);
        } else {
          // If we are on real mode, standard FPS is active if streaming
          setFps(isRealPiStreaming ? 12 : 0);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, feedMode, isRealPiStreaming]);

  const toggleFeed = () => {
    setIsPlaying(prev => !prev);
    if (isPlaying) {
      setFps(0);
    } else {
      setFps(feedMode === 'simulated' ? 15 : (isRealPiStreaming ? 12 : 0));
    }
  };

  const nextScenario = () => {
    setCurrentScenarioIdx(prev => (prev + 1) % PEST_SCENARIOS.length);
  };

  const handleSimulateDetection = () => {
    setIsAnalyzing(true);

    setTimeout(() => {
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

      setSsdUsed(prev => parseFloat((prev + 0.012).toFixed(3))); // 12MB image SSD simulation
      setLastCheckTime(new Date().toLocaleTimeString());
    }, 1500);
  };

  const serverUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const pythonScript = `import cv2
import requests
import time
import subprocess
import os

# Host do Servidor PestGuard AI (Gerado Automaticamente)
SERVER_URL = "${serverUrl}"
UPLOAD_URL = f"{SERVER_URL}/api/pi/upload-frame"

print("==============================================")
print("     PestGuard AI - Transmissor RPi4 NoIR     ")
print("==============================================")
print(f"Buscando servidor em: {SERVER_URL}")
print(f"Endpoint de Transmissão: {UPLOAD_URL}")

# Tenta usar o OpenCV padrão primeiro (funciona com webcams USB e drivers compatíveis)
def get_opencv_capture():
    try:
        cap = cv2.VideoCapture(0)
        # Resolução recomendada para streaming leve e mínimo atraso
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        if cap.isOpened():
            # Testa leitura de 1 frame
            ret, frame = cap.read()
            if ret:
                print("[OK] Câmera OpenCV (Webcam/V4L2) inicializada com sucesso!")
                return cap
    except Exception:
        pass
    print("[INFO] OpenCV clássico indisponível. Buscando drivers oficiais da Pi...")
    return None

cap = get_opencv_capture()
use_libcamera = (cap is None)

if use_libcamera:
    print("[INFO] Usando sistema de captura libcamera/rpicam (oficial do novo Raspberry Pi OS)")
    # Verifica qual comando está disponível no sistema
    if os.system("which rpicam-still > /dev/null") == 0:
        cmd_base = "rpicam-still"
    elif os.system("which libcamera-still > /dev/null") == 0:
        cmd_base = "libcamera-still"
    else:
        print("[ERRO] Nem OpenCV clássico nem libcamera-still/rpicam-still foram encontrados!")
        print("Certifique-se de que sua câmera está ativa no raspi-config e conectada fisicamente.")
        exit(1)

fps_target = 10
interval = 1.0 / fps_target

print("[PRONTO] Transmissão ativa! Pressione Ctrl+C para parar.\\n")

try:
    while True:
        start_time = time.time()
        jpg_bytes = None
        
        if not use_libcamera:
            ret, frame = cap.read()
            if not ret:
                print("[ERRO] Falha ao capturar imagem com OpenCV. Reiniciando captura...")
                cap.release()
                time.sleep(2)
                cap = cv2.VideoCapture(0)
                continue
                
            # Comprimir em formato JPEG de alta performance
            success, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if success:
                jpg_bytes = buffer.tobytes()
        else:
            # Captura ultra-rápida via libcamera por pipe direto em memória (evita desgaste do cartão SD)
            try:
                cmd = [cmd_base, "-t", "1", "--immediate", "-o", "-", "--width", "640", "--height", "480", "-n"]
                process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                stdout, _ = process.communicate()
                if len(stdout) > 0:
                    jpg_bytes = stdout
            except Exception as e:
                print(f"[ALERTA] Falha de leitura {cmd_base}: {e}")
                time.sleep(1.5)
                continue
        
        if jpg_bytes:
            try:
                res = requests.post(
                    UPLOAD_URL,
                    data=jpg_bytes,
                    headers={'Content-Type': 'image/jpeg'},
                    timeout=1.5
                )
                if res.status_code == 200:
                    print(f"[LIVE] Transmitindo... bytes: {len(jpg_bytes)} | OK", end="\\r")
                else:
                    print(f"\\n[REJEITADO] Erro do servidor: {res.status_code}")
            except Exception as e:
                print(f"\\n[ALERTA] Conexão com PestGuard falhou: {e}")
                time.sleep(1.5)
            
        elapsed = time.time() - start_time
        sleep_time = interval - elapsed
        if sleep_time > 0:
            time.sleep(sleep_time)
except KeyboardInterrupt:
    print("\\n[STOP] Transmissão interrompida pelo usuário.")
finally:
    if not use_libcamera and cap:
        cap.release()
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Camera className={`w-5 h-5 text-[#00f59b] ${isRealPiStreaming && feedMode === 'real' ? 'animate-pulse' : ''}`} />
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#00f59b] font-black">
              Câmera RPi4 em Tempo Real
            </h3>
            <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider">
              Monitoramento de Vídeo IoT Inteligente
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setFeedMode('real')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase font-black transition-all ${
              feedMode === 'real'
                ? 'bg-[#00f59b] text-black shadow-lg shadow-[#00f59b]/10'
                : 'text-white/50 hover:text-white'
            }`}
          >
            📹 Câmera Real {isRealPiStreaming && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-ping ml-1" />}
          </button>
          <button
            onClick={() => setFeedMode('simulated')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase font-black transition-all ${
              feedMode === 'simulated'
                ? 'bg-[#00f59b] text-black shadow-lg shadow-[#00f59b]/10'
                : 'text-white/50 hover:text-white'
            }`}
          >
            🧪 Simulador
          </button>
        </div>
      </div>

      {/* Banner if real transmission detected while simulating */}
      {isRealPiStreaming && feedMode === 'simulated' && (
        <div 
          onClick={() => setFeedMode('real')}
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-red-500/15 transition-all text-[10px] text-red-400 font-mono animate-bounce"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold uppercase">🔴 Transmissão RPi4 Detectada!</span>
          </div>
          <span className="text-[8px] uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
            Mudar para Câmera Real <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      )}

      {/* Camera Viewport */}
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black group select-none">
        {isPlaying ? (
          feedMode === 'simulated' ? (
            <>
              {/* Simulated Scenario Image */}
              <img 
                src={activeScenario.image} 
                alt="Simulação PestGuard" 
                className="w-full h-full object-cover opacity-85 transition-all duration-700"
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

              {/* HUD overlays */}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 pointer-events-none">
                <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-mono text-white/80 border border-white/10 uppercase tracking-wider">
                  FPS: {fps}
                </span>
                <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[7px] font-mono text-amber-400 font-bold border border-amber-500/10 uppercase">
                  MODO_SIMULAÇÃO
                </span>
              </div>

              <div className="absolute inset-x-3 top-3 pointer-events-none flex justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-[8px] font-mono font-bold text-amber-500 bg-black/40 px-1 py-0.5 rounded">SIMULATOR ACTIVE</span>
                </div>
              </div>

              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-[7px] font-mono text-white/50 space-y-0.5 pointer-events-none">
                <p className="text-white/90">TIME: {timestamp}</p>
                <p>COORD: -25.0958, -50.1614</p>
              </div>
            </>
          ) : (
            /* REAL CAMERA FEED MODE */
            isRealPiStreaming ? (
              <>
                <img 
                  src={`/api/pi/stream-video?cb=${streamCacheBuster}`}
                  alt="Transmissão Ao Vivo do Raspberry Pi 4" 
                  className="w-full h-full object-contain bg-black"
                  onError={() => {
                    // Try to bust video source caches or retry status
                    setIsRealPiStreaming(false);
                  }}
                  referrerPolicy="no-referrer"
                />

                {/* Real-time scanning overlay indicators */}
                <div className="absolute inset-x-3 top-3 pointer-events-none flex justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[8px] font-mono font-bold text-red-500 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-red-500/20">
                      RPI4 AO VIVO
                    </span>
                  </div>
                  <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-mono text-[#00f59b] border border-[#00f59b]/20 flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-[#00f59b]" /> STREAMING ENCODE
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[7px] font-mono text-white/70 space-y-0.5 pointer-events-none">
                  <p className="text-white">LINK: CONECTADO AO VIVO</p>
                  <p className="text-white/50">TIME: {timestamp}</p>
                </div>

                {/* Laser scan animation line */}
                <div className="absolute inset-x-0 h-0.5 bg-red-500/25 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-scan pointer-events-none" style={{ animationDuration: '4s', animationIterationCount: 'infinite' }} />
              </>
            ) : (
              /* REAL CAMERA OFFLINE STATE */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <WifiOff className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="font-mono text-xs text-white/80 uppercase font-black tracking-wider">
                    Sem sinal do Raspberry Pi 4
                  </p>
                  <p className="font-sans text-[10px] text-white/40 max-w-[280px] mx-auto mt-1 leading-snug">
                    O servidor de streaming está pronto para receber imagens! Para transmitir o vídeo do seu RPi4, execute o script em Python integrado abaixo.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowInstructions(prev => !prev)}
                    className="px-3 py-1.5 bg-[#00f59b]/10 hover:bg-[#00f59b]/20 text-[#00f59b] font-mono text-[9px] uppercase font-bold rounded-lg transition-all border border-[#00f59b]/20 flex items-center gap-1.5"
                  >
                    <Terminal className="w-3 h-3" />
                    {showInstructions ? "Ocultar Script Python" : "Como Conectar (Script)"}
                  </button>
                  <button 
                    onClick={() => setStreamCacheBuster(prev => prev + 1)}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white border border-white/5 font-mono text-[9px]"
                    title="Tentar reconectar stream"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-white/20" />
            <div>
              <p className="font-mono text-xs text-white/40 uppercase font-black">
                Transmissão Interrompida
              </p>
              <p className="font-sans text-[10px] text-white/30 max-w-[200px] mx-auto mt-1 leading-snug">
                Inicie a transmissão para ativar os sensores de captura.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Python Script Guide */}
      {showInstructions && (
        <div className="bg-black/60 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#00f59b] font-bold flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" /> Guia de Instalação na Pi 4
            </span>
            <button 
              onClick={handleCopyCode}
              className={`p-1.5 rounded-lg border flex items-center gap-1.5 text-[8px] font-mono uppercase font-black transition-all ${
                copied 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-[#00f59b]' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {copied ? <Check className="w-3 h-3 text-[#00f59b]" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado!' : 'Copiar Script'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-white/40 font-mono mb-1.5">1. Instale as dependências na sua Raspberry Pi:</p>
              <div className="bg-black p-2.5 rounded-xl border border-white/5 font-mono text-[9px] text-orange-400 select-all">
                pip install opencv-python requests
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-white/40 font-mono">2. Salve o script abaixo como <code className="text-white font-bold bg-white/5 px-1 py-0.5 rounded">stream_pi.py</code> e execute-o:</p>
              <pre className="text-[8px] text-white/50 font-mono bg-black p-3 rounded-xl border border-white/5 max-h-56 overflow-y-auto whitespace-pre-wrap select-all text-left scrollbar-thin">
                {pythonScript}
              </pre>
            </div>

            <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl text-[9px] text-blue-300 font-mono leading-relaxed">
              <strong>💡 Dica do Desenvolvedor:</strong> Este script envia as capturas da sua Pi Camera padrão ou Webcam USB em alta velocidade diretamente para este deploy. Mude a linha <code className="text-white">cv2.VideoCapture(0)</code> se estiver usando uma câmera do módulo Pi específica de placa de vídeo ou USB secundária.
            </div>
          </div>
        </div>
      )}

      {/* Control Panel and SSD Info */}
      <div className="space-y-4">
        {/* Interactive Scenario selection & manual analysis testing */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={nextScenario}
            disabled={!isPlaying || isAnalyzing}
            className="p-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-[9px] font-mono uppercase font-bold text-white transition-all"
            title="Mudar o cenário de simulação"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Mudar Cenário
          </button>
          <button
            onClick={handleSimulateDetection}
            disabled={isAnalyzing || !isPlaying}
            className={`p-2.5 rounded-xl border text-[9px] font-mono uppercase font-black tracking-wider flex items-center justify-center gap-2 transition-all ${
              isAnalyzing 
                ? 'bg-[#00f59b]/20 border-[#00f59b]/40 text-[#00f59b]' 
                : 'bg-[#00f59b] hover:bg-[#00f59b]/90 text-black border-[#00f59b]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 text-black" />
                Capturar e Analisar
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
            {lastCheckTime && <span>Último registro IoT: {lastCheckTime}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
