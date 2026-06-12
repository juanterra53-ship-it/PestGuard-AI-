import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Settings, 
  Bell, 
  LayoutDashboard, 
  History, 
  Cpu,
  Wifi,
  WifiOff,
  Smartphone,
  ShieldAlert,
  Navigation,
  Bug,
  RefreshCw,
  FileText,
  TrendingUp,
  Cloud,
  Map as MapIcon
} from 'lucide-react';
import DetectionList, { type Detection } from './components/DetectionList';
import StatsOverview from './components/StatsOverview';
import Guide from './components/Guide';
import PestAlert from './components/PestAlert';
import SatelliteHeatMap from './components/SatelliteHeatMap';
import VideoModal from './components/VideoModal';
import GoogleDriveBackups from './components/GoogleDriveBackups';
import PiCameraFeed from './components/PiCameraFeed';
import { supabase } from './lib/supabase';

export default function App() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings' | 'cloud'>('dashboard');
  const [isPiConnected, setIsPiConnected] = useState(true);
  const [latestAlert, setLatestAlert] = useState<Detection | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [debugData, setDebugData] = useState<any>(null);
  const [debugKeys, setDebugKeys] = useState<string[]>([]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (supabase) {
      try {
        const { data, error } = await supabase.from('pest_detections').select('*').limit(1);
        if (error) {
          setShowToast(`Erro: ${error.message}`);
        } else if (!data || data.length === 0) {
          setShowToast('Tabela Vazia ou RLS bloqueando!');
        } else {
          setDebugKeys(Object.keys(data[0]));
          setDebugData(data[0]);
          setShowToast('Dados sincronizados com sucesso!');
        }
      } catch (e) {
        setShowToast('Falha na conexão!');
      }
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2500);
  };

  const handleDownload = (type: string) => {
    setShowToast(`Gerando ${type}...`);
    setTimeout(() => setShowToast(null), 3000);
  };

  // Simulation of incoming detections from Raspberry Pi
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8 && activeTab === 'dashboard' && !isRefreshing) {
        const types = ['scorpion', 'rat', 'cockroach', 'cupim', 'formiga', 'aranha', 'mosca', 'percevejo'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const newDetection: Detection = {
          id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: type as any,
          confidence: Math.floor(Math.random() * 20) + 80,
          timestamp: new Date(),
          location: `Setor ${Math.floor(Math.random() * 5) + 1} - Sensor 0${Math.floor(Math.random() * 9) + 1}`,
          imageUrl: `https://picsum.photos/seed/${Math.random()}/200/200`,
          source: 'camera'
        };
        setDetections(prev => [newDetection, ...prev].slice(0, 5000));
        
        if (type === 'scorpion' || type === 'aranha' || newDetection.confidence > 95) {
          setLatestAlert(newDetection);
          // Auto close alert after 5 seconds
          setTimeout(() => setLatestAlert(null), 5000);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab, isRefreshing]);

  // Real-time integration with Supabase (Pestscan)
  useEffect(() => {
    if (!supabase) return;

    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('pest_detections').select('id').limit(1);
        if (!error) {
          setIsConnected(true);
          console.log('Conexão com Supabase ok!');
        } else {
          setIsConnected(false);
        }
      } catch (err) {
        setIsConnected(false);
      }
    };
    
    const fetchFieldDetections = async () => {
      try {
        const { data, error } = await supabase
          .from('pest_detections')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (data && !error) {
          const formatted = data.map((d: any) => {
            // Busca ultra-agressiva por variantes de nomes
            const keys = Object.keys(d);
            
            // Extração do novo formato JSON detectado (analysis_result)
            let analysis = d.analysis_result || {};
            if (typeof analysis === 'string') {
              try { analysis = JSON.parse(analysis); } catch (e) { analysis = {}; }
            }
            const analysisLoc = analysis.location || {};
            const analysisPest = analysis.pest || {};

            let lat = d.lat || d.latitude || d.latidude || analysisLoc.latitude || d.lat_geografica || d.lat_geo || (d.coordinates?.lat) || (d.location_data?.lat);
            let lng = d.lng || d.longitude || d.long || analysisLoc.longitude || d.long_geografica || d.long_geo || d.lon || (d.coordinates?.lng) || (d.location_data?.lng);
            
            // Se ainda não achou, tenta procurar por qualquer coluna que contenha 'lat' ou 'lon'/'lng'
            if (lat === undefined || lat === null || lng === undefined || lng === null) {
              const latKey = keys.find(k => k.toLowerCase().includes('lat'));
              const lngKey = keys.find(k => k.toLowerCase().includes('lon') || k.toLowerCase().includes('lng'));
              if (latKey && lngKey) {
                lat = d[latKey];
                lng = d[lngKey];
              }
            }

            // Tenta tratar se vier de uma coluna de geometria/geografia do Postgres
            if ((lat === undefined || lat === null || lng === undefined || lng === null) && (d.location || d.geom || d.geog)) {
              const geo = d.location || d.geom || d.geog;
              if (typeof geo === 'object' && geo !== null) {
                lat = geo.lat || geo.y || geo.latitude;
                lng = geo.lng || geo.x || geo.longitude;
              }
            }

            const parsedLat = Number(lat);
            const parsedLng = Number(lng);
            
            const isApp = !!(d.user_id || d.user_email || d.userEmail || d.userId);
            const sourceLabel = isApp ? 'App Pestscan' : 'Monitoramento IA';

            const pestType = analysisPest.name || d.pest_name || d.pestname || d.name || d.type || d.pest_type || d.pesttype || d.praga || d.species || 'Pest';

            return {
              id: String(d.id),
              type: pestType,
              confidence: Number(analysis.confidence ? analysis.confidence * 100 : d.confidence) || 100,
              timestamp: new Date(d.created_at || d.timestamp || Date.now()),
              location: analysisLoc.address || (typeof d.location === 'string' ? d.location : null) || d.setor || d.address || 'Localização de Campo',
              imageUrl: d.image_data || d.image_url || d.imageUrl || d.photo_url || d.foto || d.url_foto || d.path_foto,
              source: sourceLabel,
              coordinates: (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0) ? { lat: parsedLat, lng: parsedLng } : undefined
            };
          });

          // Ensure uniqueness of IDs within the fetched data themselves
          const uniqueFetched = Array.from(new Map(formatted.map(item => [item.id, item])).values());
          
          setDetections(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = uniqueFetched.filter((f: any) => !existingIds.has(f.id));
            const all = [...newOnes, ...prev];
            return all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5000);
          });
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      }
    };

    checkConnection();
    fetchFieldDetections();

    const channel = supabase
      .channel('pestscan-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pest_detections' },
        (payload: { new: any }) => {
          const newEntry = payload.new;
          
          // Compatibilidade cirúrgica com o formato da IA Online (analysis_result)
          let analysis = newEntry.analysis_result || {};
          if (typeof analysis === 'string') {
            try { analysis = JSON.parse(analysis); } catch (e) { analysis = {}; }
          }
          const analysisLoc = analysis.location || {};
          const analysisPest = analysis.pest || {};

          // Extração robusta de coordenadas (unificada com fetch)
          const keys = Object.keys(newEntry);
          let lat = newEntry.lat || newEntry.latitude || analysisLoc.latitude || newEntry.lat_geografica || newEntry.lat_geo || (newEntry.coordinates?.lat);
          let lng = newEntry.lng || newEntry.longitude || analysisLoc.longitude || newEntry.long_geografica || newEntry.long_geo || newEntry.lon || (newEntry.coordinates?.lng);
          
          if (lat === undefined || lat === null || lng === undefined || lng === null) {
            const latKey = keys.find(k => k.toLowerCase().includes('lat'));
            const lngKey = keys.find(k => k.toLowerCase().includes('lon') || k.toLowerCase().includes('lng'));
            if (latKey && lngKey) {
              lat = newEntry[latKey];
              lng = newEntry[lngKey];
            }
          }

          const isApp = !!(newEntry.user_id || newEntry.user_email || newEntry.userEmail || newEntry.userId);
          const sourceLabel = isApp ? 'App Pestscan' : 'Monitoramento IA';
          const pestType = analysisPest.name || newEntry.pest_name || newEntry.pestname || newEntry.name || newEntry.type || newEntry.pest_type || newEntry.pesttype || newEntry.praga || newEntry.species || 'Pest';

          const formatted: Detection = {
            id: String(newEntry.id),
            type: pestType,
            confidence: Number(analysis.confidence ? analysis.confidence * 100 : newEntry.confidence) || 100,
            timestamp: new Date(newEntry.created_at || newEntry.timestamp || Date.now()),
            location: analysisLoc.address || (typeof newEntry.location === 'string' ? newEntry.location : null) || 'Localização de Campo',
            imageUrl: newEntry.image_data || newEntry.image_url || newEntry.imageUrl || newEntry.photo_url || newEntry.foto || newEntry.url_foto || newEntry.path_foto,
            source: sourceLabel,
            coordinates: (lat && lng && Number(lat) !== 0) ? { lat: Number(lat), lng: Number(lng) } : undefined
          };
          
            setDetections(prev => {
              const exists = prev.some(p => p.id === formatted.id);
              if (exists) return prev;
              const updated = [formatted, ...prev];
              return updated.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5000);
            });
          setLatestAlert(formatted);
          setTimeout(() => setLatestAlert(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#011a14] text-white font-sans selection:bg-[#00f59b]/30">
      <PestAlert detection={latestAlert} onClose={() => setLatestAlert(null)} />
      <VideoModal detection={selectedDetection} onClose={() => setSelectedDetection(null)} />
      
      {/* Toast Notification */}
      <AnimatePresence>
        {debugKeys.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-32 left-4 z-50 bg-[#011a14] border border-[#00f59b]/30 p-4 rounded-lg shadow-2xl max-w-sm overflow-hidden"
          >
            <p className="text-[9px] font-bold text-[#00f59b] uppercase mb-2 tracking-widest flex justify-between items-center">
              Diagnóstico de Dados
              <button onClick={() => { setDebugKeys([]); setDebugData(null); }} className="text-white/40 hover:text-white">×</button>
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-[7px] text-white/40 uppercase font-mono">Colunas Detectadas na Tabela:</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {debugKeys.map((key, idx) => (
                  <span key={`${key}-${idx}`} className="text-[6px] px-1.5 py-0.5 bg-white/5 rounded text-[#00f59b]/70 font-mono border border-[#00f59b]/10">
                    {key}
                  </span>
                ))}
              </div>

              {debugData && (
                <>
                  <p className="text-[7px] text-white/40 uppercase font-mono border-t border-white/5 pt-2">Amostra do 1º Registro:</p>
                  <pre className="text-[8px] text-white/80 font-mono bg-black/40 p-2 rounded border border-white/5 whitespace-pre-wrap">
                    {JSON.stringify(debugData, null, 2)}
                  </pre>
                  <p className="text-[7px] text-[#00f59b]/60 mt-2 italic">
                    * Verifique acima onde estão lat, lng e praga.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}

        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-[#00f59b] text-black px-6 py-3 rounded-full font-mono text-xs font-bold shadow-2xl flex items-center gap-3"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#011a14]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-[#00f59b]/10 rounded-2xl border border-[#00f59b]/20 flex items-center justify-center shadow-lg shadow-[#00f59b]/5">
              <Bug className="w-8 h-8 text-[#00f59b]" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <h1 className="text-2xl font-black tracking-tighter text-white uppercase">PestGuard</h1>
                <h1 className="text-2xl font-black tracking-tighter text-[#00f59b] uppercase">AI</h1>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[9px] font-bold tracking-[0.3em] text-[#00f59b] uppercase">Monitoramento Inteligente 24h</p>
                <div className="h-2 w-px bg-white/10" />
                <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Tecnologia • Prevenção • Conformidade (BPF)</p>
              </div>
            </div>
          </div>

            <div className="flex items-center gap-4">
              {!supabase ? (
                <div className="flex flex-col items-end px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-amber-500">
                      Configuração Faltando
                    </span>
                  </div>
                  <span className="text-[7px] text-amber-500/60 font-mono -mt-0.5">
                    {!import.meta.env.VITE_SUPABASE_URL && 'URL '}
                    {!import.meta.env.VITE_SUPABASE_ANON_KEY && 'KEY '}
                    Pendente
                  </span>
                </div>
              ) : (
                <div className="hidden sm:flex flex-col items-center px-3 py-1 bg-black/20 rounded-full border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                    <span className={cn("text-[8px] font-bold uppercase tracking-widest", isConnected ? "text-green-500" : "text-red-500")}>
                      Supabase {isConnected ? 'Sync' : 'Offline'}
                    </span>
                  </div>
                  <span className="text-[7px] text-white/40 font-mono -mt-1">
                    {detections.filter(d => d.source === 'pestscan').length} Registros
                  </span>
                </div>
              )}
            <button 
              onClick={handleRefresh}
              className="p-2.5 hover:bg-white/5 rounded-full transition-colors group"
            >
              <RefreshCw className={cn("w-5 h-5 text-white/40 group-hover:text-[#00f59b]", isRefreshing && "animate-spin text-[#00f59b]")} />
            </button>
            
            <div className="hidden md:flex flex-col items-end mr-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-bold">Sistema Online</span>
              </div>
              <span className="text-[8px] font-mono text-white/20 uppercase mt-0.5 tracking-tighter">v3.0.0 Enterprise</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              {isPiConnected ? <Wifi className="w-3 h-3 text-[#00f59b]" /> : <WifiOff className="w-3 h-3 text-red-500" />}
              <span className="font-mono text-[10px] text-white/60 uppercase tracking-tighter">Raspberry Pi 4</span>
            </div>
            <button className="p-2.5 hover:bg-white/5 rounded-full transition-colors relative">
              <Bell className="w-5 h-5 text-white/60" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#00f59b] rounded-full border-2 border-[#011a14]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Stats & Map */}
              <div className="col-span-1 lg:col-span-8 space-y-8">
                {/* Satellite Heat Map Section */}
                <section className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/20">
                  <SatelliteHeatMap detections={detections} />
                </section>

                {/* Real-time Feed */}
                <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <DetectionList detections={detections} onSelect={setSelectedDetection} />
                </section>
              </div>

              {/* Right Column: Analysis & Reports */}
              <div className="lg:col-span-4 space-y-8">
                <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <StatsOverview />
                </section>

                <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-5 h-5 text-[#00f59b]" />
                    <h3 className="font-mono text-xs uppercase tracking-widest text-white/50 italic">Retorno sobre Investimento (ROI)</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="p-4 bg-[#00f59b]/5 rounded-2xl border border-[#00f59b]/10">
                      <p className="font-mono text-[10px] text-[#00f59b] uppercase mb-1">Redução de Perdas</p>
                      <p className="text-2xl font-black text-white">Até 30%</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="font-mono text-[8px] text-white/40 uppercase mb-1">ROI Médio</p>
                        <p className="font-mono text-sm text-white font-bold">3 a 6 meses</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="font-mono text-[8px] text-white/40 uppercase mb-1">Conformidade</p>
                        <p className="font-mono text-sm text-[#00f59b] font-bold">ANVISA/BPF</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="w-5 h-5 text-[#00f59b]" />
                    <h3 className="font-mono text-xs uppercase tracking-widest text-white/50 italic">Relatórios Automáticos</h3>
                  </div>
                  <div className="space-y-3">
                    <button 
                      onClick={() => handleDownload('Relatório Semanal')}
                      className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between group transition-all"
                    >
                      <span className="font-mono text-[10px] text-white/60 uppercase">Relatório Semanal PDF</span>
                      <FileText className="w-4 h-4 text-white/20 group-hover:text-[#00f59b] transition-colors" />
                    </button>
                    <button 
                      onClick={() => handleDownload('Mapa de Calor')}
                      className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between group transition-all"
                    >
                      <span className="font-mono text-[10px] text-white/60 uppercase">Mapa de Calor Mensal</span>
                      <MapIcon className="w-4 h-4 text-white/20 group-hover:text-[#00f59b] transition-colors" />
                    </button>
                  </div>
                </section>

                <PiCameraFeed 
                  isPiConnected={isPiConnected}
                  onNewDetection={(newDet) => {
                    setDetections(prev => [newDet, ...prev]);
                    setLatestAlert(newDet);
                    setShowToast(`Novo Alerta IoT RPi4: ${newDet.type.toUpperCase()} detectado no ${newDet.location}!`);
                    setTimeout(() => {
                      setLatestAlert(null);
                      setShowToast(null);
                    }, 5000);
                  }}
                />

                <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Cpu className="w-5 h-5 text-[#00f59b]" />
                    <h3 className="font-mono text-xs uppercase tracking-widest text-white/50 italic">Status do Hardware</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-white/40">CPU Temp</span>
                      <span className="font-mono text-xs text-emerald-500">42°C</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-[42%] h-full bg-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-white/40">SSD (Storage)</span>
                      <span className="font-mono text-xs text-white/60">128GB / 512GB</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-[25%] h-full bg-[#00f59b]" />
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto"
            >
              <section className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
                <Guide />
              </section>
            </motion.div>
          )}

          {activeTab === 'cloud' && (
            <motion.div 
              key="cloud"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto"
            >
              <GoogleDriveBackups currentDetections={detections} onAddToast={(msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); }} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto"
            >
              <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 mb-8">
                  <h2 className="font-mono text-xs uppercase tracking-widest text-white/50 italic">
                    Histórico de Ocorrências Georreferenciadas
                  </h2>
                </div>
                <div className="space-y-4">
                  {detections.length > 0 ? (
                    <DetectionList detections={detections} onSelect={setSelectedDetection} />
                  ) : (
                    <div className="py-32 text-center">
                      <History className="w-16 h-16 text-white/5 mx-auto mb-6" />
                      <p className="font-mono text-sm text-white/20 italic max-w-md mx-auto">
                        Nenhum histórico encontrado para o período selecionado.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Desktop Sidebar / Nav */}
      <nav className="fixed left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Live" />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Histórico" />
        <NavButton active={activeTab === 'cloud'} onClick={() => setActiveTab('cloud')} icon={Cloud} label="Drive Cloud" />
        <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Config" />
      </nav>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#011a14]/90 backdrop-blur-xl border-t border-white/5 lg:hidden">
        <div className="flex items-center justify-around h-20">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn("p-2 flex flex-col items-center gap-1.5", activeTab === 'dashboard' ? "text-[#00f59b]" : "text-white/40")}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[9px] font-mono uppercase tracking-widest">Live</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn("p-2 flex flex-col items-center gap-1.5", activeTab === 'history' ? "text-[#00f59b]" : "text-white/40")}
          >
            <History className="w-6 h-6" />
            <span className="text-[9px] font-mono uppercase tracking-widest">Histórico</span>
          </button>
          <button 
            onClick={() => setActiveTab('cloud')}
            className={cn("p-2 flex flex-col items-center gap-1.5", activeTab === 'cloud' ? "text-[#00f59b]" : "text-white/40")}
          >
            <Cloud className="w-6 h-6" />
            <span className="text-[9px] font-mono uppercase tracking-widest">Drive</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn("p-2 flex flex-col items-center gap-1.5", activeTab === 'settings' ? "text-[#00f59b]" : "text-white/40")}
          >
            <Settings className="w-6 h-6" />
            <span className="text-[9px] font-mono uppercase tracking-widest">Config</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-2xl border transition-all duration-500",
        active ? "bg-[#00f59b] border-[#00f59b] text-black shadow-xl shadow-[#00f59b]/20 scale-110" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="absolute left-full ml-6 px-3 py-1.5 bg-white text-black text-[10px] font-mono uppercase font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap shadow-xl">
        {label}
      </span>
    </button>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
