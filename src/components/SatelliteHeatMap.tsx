import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { Map as MapIcon, Navigation, Target, Globe, Maximize2, Minimize2, RefreshCw, Share2, LocateFixed, MousePointer2, Layers } from 'lucide-react';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { Detection } from './DetectionList';

// Fix Leaflet icon issue
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Create a custom red pulsing marker for Monitoring IA
const PulsingRedMarker = L.divIcon({
  className: 'radar-marker',
  html: `
    <div class="relative w-6 h-6 flex items-center justify-center">
      <div class="absolute w-6 h-6 bg-red-600 rounded-full animate-ping opacity-75"></div>
      <div class="relative w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-lg"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Create a custom red marker for App Pestscan
const AppRedMarker = L.divIcon({
  className: 'app-marker',
  html: `
    <div class="relative w-8 h-8 flex flex-col items-center justify-center">
      <div class="absolute w-6 h-6 bg-red-600 rounded-full animate-pulse opacity-40"></div>
      <div class="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg z-10"></div>
      <div class="w-0.5 h-3 bg-red-600 -mt-1 shadow-md"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 28]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface HeatPoint {
  id: string;
  lat: number;
  lng: number;
  intensity: number;
  label: string;
}

// Component to handle map view updates imperatively
function MapController({ lat, lng, zoom, setMapRef }: { lat: number, lng: number, zoom: number, setMapRef: (map: L.Map) => void }) {
  const map = useMap();
  const lastSync = useRef({ lat: 0, lng: 0, zoom: 0 });

  useEffect(() => {
    setMapRef(map);
  }, [map, setMapRef]);

  useEffect(() => {
    // Only move map if the coordinates changed significantly from the last time WE moved it
    // This prevents fighting with the user's manual pan/zoom
    const distance = Math.sqrt(Math.pow(lat - lastSync.current.lat, 2) + Math.pow(lng - lastSync.current.lng, 2));
    const zoomChanged = zoom !== lastSync.current.zoom;

    if (distance > 0.0001 || zoomChanged) {
      map.setView([lat, lng], zoom, { animate: true });
      lastSync.current = { lat, lng, zoom };
    }
  }, [lat, lng, zoom, map]);

  return null;
}

// Component to handle map events and sync back to React state
function MapEvents({ onMapClick, onMapMove }: { 
  onMapClick: (lat: number, lng: number) => void,
  onMapMove: (lat: number, lng: number, zoom: number) => void 
}) {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    zoomend() {
      const center = map.getCenter();
      onMapMove(center.lat, center.lng, map.getZoom());
    },
    moveend() {
      const center = map.getCenter();
      onMapMove(center.lat, center.lng, map.getZoom());
    }
  });
  return null;
}

// Exact coordinates for Catedral de Ponta Grossa (City Center)
const PG_COORDS: [number, number] = [-25.0958, -50.1614];

export default function SatelliteHeatMap({ detections = [] }: { detections?: Detection[] }) {
  const [lat, setLat] = useState(PG_COORDS[0]);
  const [lng, setLng] = useState(PG_COORDS[1]);
  const [address, setAddress] = useState<string>('Ponta Grossa, PR');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [zoom, setZoom] = useState(16);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'standard'>('satellite');
  const hasInitialLocateRun = useRef(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 300);

    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [isFullscreen]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 1, 20));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 1, 10));

  const handleSearch = async (e: any) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat: sLat, lon: sLon } = data[0];
        updateLocation(parseFloat(sLat), parseFloat(sLon), 18);
        setSearchQuery('');
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const getAddress = useCallback(async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  }, []);

  const updateLocation = useCallback((newLat: number, newLng: number, newZoom?: number) => {
    setLat(newLat);
    setLng(newLng);
    if (newZoom !== undefined) setZoom(newZoom);
    getAddress(newLat, newLng);
  }, [getAddress]);

  const onMapMove = useCallback((newLat: number, newLng: number, newZoom: number) => {
    // Only update state if it actually changed to avoid re-render loops
    setLat(newLat);
    setLng(newLng);
    setZoom(newZoom);
  }, []);

  const handleLocate = useCallback(() => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation(latitude, longitude, 18);
          setIsLocating(false);
          console.log("Localização obtida com sucesso:", latitude, longitude);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          setIsLocating(false);
          // Fallback para as coordenadas iniciais mas com mensagem de erro
          updateLocation(PG_COORDS[0], PG_COORDS[1], 16);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      updateLocation(PG_COORDS[0], PG_COORDS[1], 16);
    }
  }, [updateLocation]);

  const onMapClick = useCallback((lat: number, lng: number) => {
    updateLocation(lat, lng);
  }, [updateLocation]);

  useEffect(() => {
    if (!hasInitialLocateRun.current) {
      handleLocate();
      hasInitialLocateRun.current = true;
    }
  }, [handleLocate]);

  // Memoize detection markers to avoid re-rendering 1000 markers on every map move
  const markers = useMemo(() => {
    return detections
      .filter(d => d.coordinates)
      .map((detection) => (
        <Marker 
          key={detection.id} 
          position={[detection.coordinates!.lat, detection.coordinates!.lng]}
          icon={detection.source === 'App Pestscan' ? AppRedMarker : PulsingRedMarker}
        >
          <Popup>
            <div className="p-2 min-w-[150px]">
              <h4 className="font-mono text-[10px] font-black uppercase text-black border-b border-gray-100 pb-1 mb-1">
                {detection.type.toUpperCase()}
              </h4>
              <p className="font-mono text-[8px] text-gray-500 mb-2">
                FONTE: {detection.source.toUpperCase()}
              </p>
              {detection.imageUrl && (
                <img 
                  src={detection.imageUrl} 
                  className="w-full h-20 object-cover rounded-lg mb-2 border border-gray-100" 
                  alt="Evidência"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex justify-between items-center text-[8px] font-mono mb-1">
                <span className="text-gray-400">Confiança:</span>
                <span className="text-red-500 font-bold">{detection.confidence.toFixed(1)}%</span>
              </div>
              <p className="font-sans text-[9px] text-gray-600 leading-tight">
                {detection.location}
              </p>
              <p className="text-[7px] text-gray-400 mt-1 font-mono italic">
                {detection.timestamp.toLocaleString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ));
  }, [detections]);

  return (
    <div className={cn(
      "bg-black transition-all duration-300 overflow-hidden shadow-2xl group",
      isFullscreen 
        ? "fixed inset-0 w-screen h-screen z-[9999] rounded-none border-0" 
        : "relative w-full h-[600px] rounded-[32px] border-4 border-white/5"
    )}>
      <MapContainer 
        center={[PG_COORDS[0], PG_COORDS[1]]} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        className="w-full h-full z-0"
        zoomControl={false}
        preferCanvas={true}
        zoomAnimation={true}
        markerZoomAnimation={true}
      >
        {/* Map Layers */}
        {mapStyle === 'satellite' ? (
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          />
        ) : (
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          />
        )}
        
        <MapController lat={lat} lng={lng} zoom={zoom} setMapRef={(map) => mapRef.current = map} />
        <MapEvents onMapClick={onMapClick} onMapMove={onMapMove} />

        {/* Marcadores Memoizados */}
        {markers}

        {/* Center Crosshair for Calibration */}
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className={cn(
            "relative transition-all duration-500",
            isCalibrating ? "opacity-100 scale-100" : "opacity-0 scale-150"
          )}>
            <div className="w-12 h-12 border-2 border-[#00f59b] rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-[#00f59b] rounded-full" />
              <div className="absolute w-6 h-px bg-[#00f59b]" />
              <div className="absolute h-6 w-px bg-[#00f59b]" />
            </div>
          </div>
        </div>

        <Marker key="dashboard-center-marker" position={[lat, lng]}>
          <Popup>
            <div className="p-2 min-w-[200px]">
              <p className="font-mono text-[10px] font-black uppercase text-black border-b border-gray-100 pb-1 mb-2">Localização do Dashboard</p>
              <div className="space-y-1">
                <p className="font-mono text-[9px] text-gray-500">LAT: {lat.toFixed(6)}</p>
                <p className="font-mono text-[9px] text-gray-500">LNG: {lng.toFixed(6)}</p>
                <p className="font-sans text-[10px] text-gray-800 font-medium leading-tight mt-2">{address}</p>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Minimalist Controls Overlay */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-end items-end gap-3 z-10">
        {/* Fullscreen Option */}
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="w-12 h-12 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white pointer-events-auto shadow-2xl hover:bg-white/20 transition-all"
          title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia (Mais Amplitude)"}
        >
          {isFullscreen ? <Minimize2 className="w-6 h-6 text-[#00f59b]" /> : <Maximize2 className="w-6 h-6 text-white" />}
        </button>

        {/* Locate Button */}
        <button 
          onClick={() => handleLocate()}
          disabled={isLocating}
          className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white pointer-events-auto shadow-2xl hover:bg-white/10 transition-all disabled:opacity-50"
          title="Atualizar Localização"
        >
          <LocateFixed className={cn("w-6 h-6", isLocating && "animate-spin")} />
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-black/60 backdrop-blur-xl border border-white/10 p-1 rounded-2xl pointer-events-auto shadow-2xl">
          <button 
            onClick={handleZoomIn}
            className="w-12 h-12 flex items-center justify-center text-white font-bold text-xl hover:bg-white/10 transition-colors rounded-t-xl"
          >
            +
          </button>
          <div className="h-px bg-white/10 mx-2" />
          <button 
            onClick={handleZoomOut}
            className="w-12 h-12 flex items-center justify-center text-white font-bold text-xl hover:bg-white/10 transition-colors rounded-b-xl"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
