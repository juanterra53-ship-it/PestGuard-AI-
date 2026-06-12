import { useState, useEffect } from 'react';
import { 
  Cloud, 
  CheckCircle2, 
  AlertTriangle, 
  Folder, 
  FileJson, 
  Upload, 
  Play, 
  Trash2, 
  Smartphone, 
  Cpu, 
  ExternalLink,
  Code,
  Check,
  LogOut,
  RefreshCw,
  Info,
  Database,
  ArrowRight,
  MapPin,
  HardDrive,
  Camera,
  GitMerge
} from 'lucide-react';
import { getAuth, User } from 'firebase/auth';
import { googleSignIn, initAuth, logout, getAccessToken } from '../services/googleAuth';
import { GoogleDriveService, DriveFile } from '../services/googleDriveService';

interface GoogleDriveBackupsProps {
  currentDetections: any[];
  onAddToast: (msg: string) => void;
}

export default function GoogleDriveBackups({ currentDetections, onAddToast }: GoogleDriveBackupsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Drive States
  const [folderId, setFolderId] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'fluxograma' | 'pi-integration' | 'android-apk'>('fluxograma');
  
  // Interactive copy feedback
  const [copiedScript, setCopiedScript] = useState<'python' | 'capacitor' | null>(null);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch or setup Folder and list files once token is available
  useEffect(() => {
    if (token) {
      handleSyncDrive();
    }
  }, [token]);

  const handleSyncDrive = async () => {
    if (!token) return;
    setIsLoadingFiles(true);
    try {
      const fId = await GoogleDriveService.findOrCreateFolder(token);
      setFolderId(fId);
      const fileList = await GoogleDriveService.listReports(token, fId);
      setFiles(fileList);
    } catch (err: any) {
      console.error(err);
      onAddToast('Erro ao sincronizar com Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        onAddToast('Autenticado com o Google Drive!');
      }
    } catch (err) {
      console.error('Login failed:', err);
      onAddToast('Falha na autenticação do Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setFolderId(null);
      setFiles([]);
      onAddToast('Desconectado com sucesso');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBackup = async () => {
    if (!token || !folderId) {
      onAddToast('Conecte ao Google Drive primeiro!');
      return;
    }

    if (currentDetections.length === 0) {
      onAddToast('Não há detecções para fazer backup!');
      return;
    }

    setIsUploading(true);
    try {
      const now = new Date();
      const filename = `PestGuard_Backup_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.json`;
      
      const payload = {
        app: 'PestGuard AI',
        version: '3.0.0',
        exportedAt: now.toISOString(),
        totalDetections: currentDetections.length,
        detections: currentDetections.map(d => ({
          id: d.id,
          type: d.type,
          confidence: d.confidence,
          timestamp: d.timestamp,
          location: d.location,
          source: d.source,
          coordinates: d.coordinates
        }))
      };

      await GoogleDriveService.uploadReportFile(token, folderId, filename, payload);
      onAddToast('Backup criado em PestGuard AI Reports!');
      handleSyncDrive(); // reload files
    } catch (err) {
      console.error(err);
      onAddToast('Erro ao criar backup no Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const confirmed = window.confirm(`Deseja realmente deletar o backup "${fileName}" permanentemente do seu Google Drive?`);
    if (!confirmed) return;

    try {
      const ok = await GoogleDriveService.deleteFile(token!, fileId);
      if (ok) {
        onAddToast('Arquivo deletado do Google Drive');
        setFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        onAddToast('Falha ao deletar arquivo');
      }
    } catch (err) {
      console.error(err);
      onAddToast('Erro de exclusão');
    }
  };

  const copyToClipboard = (type: 'python' | 'capacitor', text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(type);
    onAddToast(type === 'python' ? 'Código Python copiado!' : 'Comandos de build copiados!');
    setTimeout(() => {
      setCopiedScript(null);
    }, 2500);
  };

  const pythonScript = `import os
import time
import json
import requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# =========================================================================
# INTEGRAÇÃO OFFLINE-FIRST PESTGUARD AI NO RASPBERRY PI 4 (SSD 120GB)
# =========================================================================
# Este script escaneia e armazena localmente no seu SSD de 120GB em caso de
# perda de conexão industrial e descarrega automaticamente quando restabelecido.
# =========================================================================

SSD_MOUNT_POINT = "/mnt/ssd" # Ponto de montagem do seu SSD de 120GB
BUFFER_DIR = os.path.join(SSD_MOUNT_POINT, "pest_scans_buffer")
os.makedirs(BUFFER_DIR, exist_ok=True)

# Credenciais da API coletadas do Painel do PestGuard / Supabase
SUPABASE_URL = "SUA_API_URL_SUPABASE" 
SUPABASE_KEY = "SUA_ANON_KEY_SUPABASE"

# Token Google OAuth gerado pelo seu Dashboard (Drive Cloud)
OAUTH_ACCESS_TOKEN = "SEU_OAUTH_ACCESS_TOKEN_DO_DASHBOARD"

def is_connected():
    """Verifica se há conectividade de internet com servidores Google."""
    try:
        requests.head("https://www.googleapis.com", timeout=3)
        return True
    except requests.RequestException:
        return False

def save_to_ssd_buffer(image_path, payload):
    """
    Salva uma detecção de praga com foto localmente no SSD.
    Essa persistência garante segurança contra apagões de rede ou flutuações de 4G/Wi-Fi.
    """
    file_id = f"pest_{int(time.time())}"
    buffer_img = os.path.join(BUFFER_DIR, f"{file_id}.jpg")
    buffer_json = os.path.join(BUFFER_DIR, f"{file_id}.json")

    # Armazena a foto original capturada no SSD
    try:
        with open(image_path, 'rb') as source, open(buffer_img, 'wb') as dest:
            dest.write(source.read())
        
        # Armazena metadados (timestamp, coordenadas GPS fictícias/setor, confiança)
        with open(buffer_json, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=4)
            
        print(f"[SSD CACHE] Salvo offline no SSD de 120GB: {file_id}.jpg")
    except Exception as e:
        print(f"[ERROR SAVE SSD]: {e}")

def get_or_create_drive_folder(drive_service):
    """Retorna o ID da pasta PestGuard AI Reports no Drive."""
    folder_name = "PestGuard AI Reports"
    query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    
    results = drive_service.files().list(q=query, fields="files(id)").execute()
    folders = results.get('files', [])
    
    if folders:
        return folders[0]['id']
        
    # Se não existir, cria remotamente no Drive
    folder_meta = {
        'name': folder_name,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    new_folder = drive_service.files().create(body=folder_meta, fields='id').execute()
    return new_folder.get('id')

def sync_ssd_buffer_to_cloud():
    """
    Sincroniza todas as capturas pendentes no SSD para a nuvem
    (Google Drive para fotos brutas + Supabase para alerta e pontos de mapa em tempo real).
    """
    if not is_connected():
        print("[STANDBY] Aguardando sinal de internet...")
        return

    # Procura arquivos .json no buffer do SSD
    files = sorted(os.listdir(BUFFER_DIR))
    json_files = [f for f in files if f.endswith('.json')]

    if not json_files:
        print("[SYNC] SSD Buffer limpo. Sem arquivos pendentes.")
        return

    print(f"[SYNC] Sinal detectado! Sincronizando {len(json_files)} varreduras do SSD para nuvem...")

    # Autenticação Google Drive
    creds = Credentials(token=OAUTH_ACCESS_TOKEN)
    drive_service = build('drive', 'v3', credentials=creds)
    folder_id = get_or_create_drive_folder(drive_service)

    for j_file in json_files:
        file_base = j_file.replace('.json', '')
        json_path = os.path.join(BUFFER_DIR, j_file)
        img_path = os.path.join(BUFFER_DIR, f"{file_base}.jpg")

        if not os.path.exists(img_path):
            continue

        try:
            # 1. Carrega os metadados offline
            with open(json_path, 'r', encoding='utf-8') as f:
                payload = json.load(f)

            # 2. Faz Upload do Arquivo de Imagem para o Google Drive
            print(f"[SYNC] Subindo foto {file_base}.jpg para o Google Drive...")
            media = MediaFileUpload(img_path, mimetype='image/jpeg')
            drive_meta = {
                'name': f"PestCapture_{file_base}.jpg",
                'parents': [folder_id]
            }
            drive_file = drive_service.files().create(
                body=drive_meta,
                media_body=media,
                fields='id, webViewLink'
            ).execute()

            # Pega o link oficial do Google Drive gerado
            drive_link = drive_file.get('webViewLink')

            # 3. Atualiza os metadados com a URL oficial da imagem e envia para o Supabase
            payload['image_url'] = drive_link
            payload['source'] = 'Monitoramento IA (Pi4)'

            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            }
            
            print(f"[SYNC] Carregando metadados no Supabase...")
            res = requests.post(
                f"{SUPABASE_URL}/rest/v1/pest_detections",
                headers=headers,
                json=payload,
                timeout=5
            )

            if res.status_code in [200, 201]:
                # Sincronizado com sucesso! Removemos do SSD local os arquivos correspondentes para liberar espaço
                os.remove(json_path)
                os.remove(img_path)
                print(f"[SYNC SUCCESS] Varredura {file_base} enviada e removida do SSD de 120GB.")
            else:
                print(f"[ERROR SUPABASE] Código {res.status_code}: {res.text}")

        except Exception as e:
            print(f"[SYNC FAILED] Erro ao sincronizar o item {file_base}: {e}")

# LOOP PRINCIPAL DO RASPBERRY PI
if __name__ == "__main__":
    print("Iniciando Agente de Escaneamento PestGuard AI...")
    while True:
        # 1. Tenta rodar a sincronização se houver itens no buffer
        try:
            sync_ssd_buffer_to_cloud()
        except Exception as err:
            print(f"[CRITICAL ERR SYSTEM]: {err}")
            
        time.sleep(30) # Roda a cada 30 segundos
`;

  const capacitorScript = `# 1. Instale o Capacitor no projeto
npm install @capacitor/core @capacitor/cli

# 2. Inicialize o Capacitor informando o nome e o package_id (usando o do seu app Android)
npx cap init "PestGuard AI" "com.juanterra.pestguard" --web-dir=dist

# 3. Adicione a plataforma Android nativa
npm install @capacitor/android
npx cap add android

# 4. Compile a build de produção estática (HTML/Vite)
npm run build

# 5. Sincronize os arquivos gerados com o projeto Android Studio nativo
npx cap sync

# 6. Abra o projeto no Android Studio para gerar o APK final de depuração ou assinatura
npx cap open android`;

  return (
    <div className="space-y-8 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00f59b]/10 rounded-xl border border-[#00f59b]/20 text-[#00f59b]">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Sincronização Avançada</h2>
              <p className="text-xs text-white/45 tracking-widest font-mono uppercase">Google Cloud • Drive Storage • Raspberry Pi 4</p>
            </div>
          </div>
        </div>

        {/* Auth status on the top right */}
        <div>
          {needsAuth ? (
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button transition-all transform hover:scale-105"
              id="google-signin-btn"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">Conectar Google Drive</span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-[#00f59b]/20" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#00f59b]/20 border border-[#00f59b]/40 flex items-center justify-center font-mono text-xs text-[#00f59b]">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-[10px] font-bold text-white uppercase truncate max-w-40">{user?.displayName || 'Usuário Google'}</p>
                <p className="text-[8px] font-mono text-white/50 truncate max-w-40">{user?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="ml-2 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                title="Desconectar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-px">
        <button 
          onClick={() => setActiveSubTab('fluxograma')}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'fluxograma' 
              ? 'border-[#00f59b] text-[#00f59b] font-bold' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          Fluxograma de Integração
        </button>
        <button 
          onClick={() => setActiveSubTab('status')}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'status' 
              ? 'border-[#00f59b] text-[#00f59b] font-bold' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          Painel do Drive
        </button>
        <button 
          onClick={() => setActiveSubTab('pi-integration')}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'pi-integration' 
              ? 'border-[#00f59b] text-[#00f59b] font-bold' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          Script do Pi 4
        </button>
        <button 
          onClick={() => setActiveSubTab('android-apk')}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'android-apk' 
              ? 'border-[#00f59b] text-[#00f59b] font-bold' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          Mobile (APK)
        </button>
      </div>

      {/* SUBTAB CONTENTS */}
      {activeSubTab === 'fluxograma' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Architecture Intro */}
          <div className="p-5 bg-[#00f59b]/5 border border-[#00f59b]/20 rounded-2xl">
            <h3 className="font-mono text-sm uppercase text-[#00f59b] font-black flex items-center gap-2 mb-2">
              <GitMerge className="w-5 h-5 animate-pulse" />
              Arquitetura Unificada de Monitoramento Geral (PestGuard AI)
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Aqui está como o seu ecossistema se integra por completo. A combinação do aplicativo móvel de campo com um 
              <strong> Raspberry Pi 4 de sensoriamento automático permanente</strong> e seu <strong>SSD de 120GB</strong> garante cobertura contínua sob qualquer condição (online ou offline). O processamento com IA unifica tudo!
            </p>
          </div>

          {/* Interactive Flow Visual representation */}
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Environment 1 */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 flex flex-col justify-between hover:border-[#00f59b]/30 transition-all text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2.5 bg-sky-500/10 text-sky-400 font-mono text-[9px] font-bold uppercase rounded-full border border-sky-500/20">
                    Ambiente 1
                  </div>
                  <span className="text-[10px] font-mono text-white/50 uppercase">Operações de Campo</span>
                </div>
                <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase">
                  <Smartphone className="w-5 h-5 text-sky-400" />
                  App PestScan (Mobile)
                </h4>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Operadores realizam rondas manuais com smartphone. Ao registrar uma foto, ela é enviada imediatamente via SDK.
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-2 font-mono text-[10px]">
                <div className="flex items-center justify-between text-white/40">
                  <span>Conexão:</span>
                  <span className="text-white/80 font-bold">Supabase REST</span>
                </div>
                <div className="flex items-center justify-between text-[#00f59b] font-bold uppercase">
                  <span>Destino:</span>
                  <span className="flex items-center gap-0.5">
                    Pontos no Mapa <MapPin className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>

            {/* Environment 2 */}
            <div className="p-5 bg-white/5 border border-amber-500/20 rounded-2xl space-y-4 flex flex-col justify-between hover:border-amber-500/40 transition-all text-left ring-1 ring-amber-500/10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2.5 bg-amber-500/10 text-amber-400 font-mono text-[9px] font-bold uppercase rounded-full border border-amber-500/20">
                    Ambiente 2
                  </div>
                  <span className="text-[10px] font-mono text-white/50 uppercase">Monitoria Autônoma</span>
                </div>
                <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase">
                  <Cpu className="w-5 h-5 text-amber-500" />
                  Silo RPi 4 • Câmera + SSD 120GB
                </h4>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Câmera fixa acoplada com sensor de presença detecta pragas 24 horas. Imagens brutas salvas primeiro no SSD local para contingência offline.
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-2 font-mono text-[10px]">
                <div className="flex items-center justify-between text-white/40">
                  <span>Armazenagem:</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5" /> SSD Buffer
                  </span>
                </div>
                <div className="flex items-center justify-between text-amber-400 font-bold uppercase">
                  <span>Upload:</span>
                  <span className="flex items-center gap-0.5">
                    Drive + Supabase <Cloud className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Environment 3 */}
            <div className="p-5 bg-white/5 border border-[#00f59b]/20 rounded-2xl space-y-4 flex flex-col justify-between hover:border-[#00f59b]/40 transition-all text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2.5 bg-[#00f59b]/10 text-[#00f59b] font-mono text-[9px] font-bold uppercase rounded-full border border-[#00f59b]/20">
                    Ambiente 3
                  </div>
                  <span className="text-[10px] font-mono text-white/50 uppercase">Centro de Decisões</span>
                </div>
                <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase">
                  <Database className="w-5 h-5 text-[#00f59b]" />
                  Dashboard PestGuard AI (Web)
                </h4>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Esta plataforma centraliza os logs em tempo real. Dispara o HUD de alarmes e consolida relatórios de auditoria da ANVISA e CRM.
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-2 font-mono text-[10px]">
                <div className="flex items-center justify-between text-white/40">
                  <span>Validação:</span>
                  <span className="text-[#00f59b] font-bold">Google Gemini AI</span>
                </div>
                <div className="flex items-center justify-between text-emerald-400 font-bold uppercase">
                  <span>Saídas:</span>
                  <span>Relatórios PDF/Análises</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed step-by-step interactive workflow tutorial */}
          <div className="bg-black/40 rounded-2xl border border-white/5 p-6 text-left space-y-6">
            <h4 className="font-mono text-xs text-white/45 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00f59b]" />
              Como a unificação por IA protege seus dados contra oscilação de Rede:
            </h4>

            <div className="space-y-4 text-xs">
              <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-[#00f59b]/10 border border-[#00f59b]/20 flex items-center justify-center font-bold text-[#00f59b] shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-white uppercase text-[11px] tracking-tight">Loop Permanente (RPi4)</p>
                  <p className="text-white/60 leading-relaxed">
                    A câmera do Raspberry Pi tira uma foto ao detectar movimento (ex: ratos, aranhas e escorpiões). O script do loop envia o payload de dados completo ao seu SSD de 120GB, salvando-o localmente em <code className="text-amber-400 font-mono bg-black/40 px-1 py-0.5 rounded">/mnt/ssd/pest_scans_buffer/</code>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-400 shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-white uppercase text-[11px] tracking-tight">Sincronizador Inteligente</p>
                  <p className="text-white/60 leading-relaxed">
                    O script monitora a conexão de internet a cada 30s. Ao encontrar link de rede ativo, ele executa os envios em paralelo: primeiro a imagem de 12MP é salva de forma organizada no seu Google Drive pessoal e o registro georreferenciado correspondente é integrado ao Supabase.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400 shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-white uppercase text-[11px] tracking-tight">Pontuação Automática no Dashboard</p>
                  <p className="text-white/60 leading-relaxed">
                    Assim que integrado à tabela do Supabase, o canal assíncrono em tempo real do seu Dashboard PestGuard recebe o sinal, adiciona a localização exata como um ponto escalonável no <strong>Satelite Heat Map</strong> e ativa os alertas imediatos na tela do operador.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'status' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-white/40 uppercase font-mono text-[9px] mb-2">
                  <Folder className="w-4 h-4 text-emerald-400" />
                  Pasta do Google Drive
                </div>
                <h3 className="text-xl font-bold font-mono">PestGuard AI Reports</h3>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  Todos os arquivos criados ou sincronizados pelo dashboard e seus dispositivos serão salvos de forma isolada nesta pasta.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono flex items-center justify-between text-white/40">
                Status: {folderId ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ATIVA / MONITORADA
                  </span>
                ) : (
                  <span className="text-yellow-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> REQUER CONEXÃO
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-white/40 uppercase font-mono text-[9px] mb-2">
                  <FileJson className="w-4 h-4 text-[#00f59b]" />
                  Dados Temporários Locais
                </div>
                <h3 className="text-xl font-bold font-mono">{currentDetections.length} Registros</h3>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  Tanto as varreduras de simulação quanto as leituras de campo do app Pest Scan Pro estão guardadas localmente.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5">
                <button 
                  onClick={handleCreateBackup}
                  disabled={isUploading || needsAuth}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#00f59b] hover:bg-[#00d586] disabled:bg-white/10 text-black rounded-lg font-mono text-xs font-bold transition-all transform active:scale-95 disabled:pointer-events-none"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      ENVIANDO...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      CRIAR BACKUP MANUAL
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#00f59b]/5 border border-[#00f59b]/10 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-[#00f59b] font-mono text-[10px] font-bold uppercase">
                <Info className="w-4 h-4" />
                Dica de Segurança
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Este sistema utiliza o escopo <code className="text-[#00f59b]">drive.file</code> que garante
                que o aplicativo <strong>apenas acesse ou controle os arquivos criados por ele mesmo</strong>. 
                Seus arquivos pessoais e o resto do seu Drive permanecem 100% seguros de acessos externos.
              </p>
            </div>
          </div>

          {/* Drive Files List */}
          <div className="p-4 bg-black/25 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs text-white/50 uppercase tracking-wider">Histórico de Backups no Drive</h4>
              {token && (
                <button 
                  onClick={handleSyncDrive}
                  disabled={isLoadingFiles}
                  className="text-[10px] font-mono font-bold text-[#00f59b] hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingFiles && 'animate-spin'}`} />
                  ATUALIZAR LISTA
                </button>
              )}
            </div>

            {needsAuth ? (
              <div className="py-8 text-center text-white/30 text-xs italic">
                Faça login com sua conta Google acima para listar e gerenciar seus arquivos de backup no Drive.
              </div>
            ) : isLoadingFiles ? (
              <div className="py-8 text-center flex justify-center items-center gap-2 text-xs font-mono text-white/40">
                <RefreshCw className="w-4 h-4 animate-spin text-[#00f59b]" />
                LENDO BANCO DE ARQUIVOS GOOGLE DRIVE...
              </div>
            ) : files.length === 0 ? (
              <div className="py-8 text-center text-white/30 text-xs italic">
                Nenhum backup encontrado na pasta "PestGuard AI Reports" do Google Drive. Clique em "Criar Backup Manual" para subir o primeiro!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {files.map(file => (
                  <div key={file.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg text-emerald-400 border border-white/10">
                        <FileJson className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white truncate max-w-xs md:max-w-md">{file.name}</p>
                        <p className="text-[10px] font-mono text-white/40">
                          {new Date(file.createdTime).toLocaleString('pt-BR')} • {file.size ? `${(parseInt(file.size) / 1024).toFixed(2)} KB` : 'Tamanho Desconhecido'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.webViewLink && (
                        <a 
                          href={file.webViewLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1 px-2.5 bg-[#00f59b]/10 hover:bg-[#00f59b]/20 text-[#00f59b] border border-[#00f59b]/20 rounded-md text-[10px] uppercase font-mono tracking-tight flex items-center gap-1"
                        >
                          Visualizar
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      
                      <button 
                        onClick={() => handleDeleteFile(file.id, file.name)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                        title="Deletar Backup permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'pi-integration' && (
        <div className="space-y-6">
          <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl space-y-4">
            <h3 className="font-mono text-sm uppercase text-orange-400 font-bold flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              Sincronização Direta do Raspberry Pi para o Google Drive
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Deseja que as imagens e leituras registradas no local por sua <strong>Raspberry Pi 4</strong> ou pela sua aplicação de escaneamento 
              conectem-se diretamente à sua nuvem pessoal do Drive? Isso permite criar um repositório centralizado de provas de escaneamento para relatórios da ANVISA.
            </p>
            <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <h4 className="text-[11px] font-bold text-white uppercase">Vantagens da Integração:</h4>
              <ul className="text-[10px] text-white/50 space-y-1 list-disc list-inside">
                <li>Backups contínuos sem custo de bancos de dados adicionais</li>
                <li>Imagens brutas de alta definição (12MP) salvas direto com data de coleta</li>
                <li>Segurança e integridade de ponta a ponta pelo Google Cloud Platform</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="font-mono text-xs text-white/50 uppercase">Escrita do Script Python para o RPi4:</span>
              <button 
                onClick={() => copyToClipboard('python', pythonScript)}
                className="text-[10px] font-mono py-1 px-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[#00f59b] font-bold flex items-center gap-1.5"
              >
                {copiedScript === 'python' ? <Check className="w-3 h-3" /> : <Code className="w-3.5 h-3.5" />}
                {copiedScript === 'python' ? 'COPIADO!' : 'COPIAR SCRIPT'}
              </button>
            </div>
            <pre className="p-4 bg-black/60 border border-white/10 rounded-2xl text-[10px] font-mono text-emerald-400 overflow-x-auto select-all max-h-96">
              {pythonScript}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === 'android-apk' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-4">
            <h3 className="font-mono text-sm uppercase text-blue-400 font-bold flex items-center gap-2">
              <Smartphone className="w-5 h-5 animate-bounce" />
              Migração para aplicativo Android APK Nativo
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              O PestGuard AI foi inteiramente desenvolvido em React Moderno estruturado com Vite. Isto nos possibilita convertê-lo 
              com <strong>100% de compatibilidade</strong> em um aplicativo móvel Android (.apk) que roda nativamente no smartphone usando a tecnologia 
              <strong> Capacitor (da Ionic)</strong>.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-[#00f59b] font-mono uppercase">COMO FUNCIONA</span>
                <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                  O Capacitor toma sua build JS embalada da web e cria uma ponte nativa (WebView) de altíssimo desempenho, permitindo acesso à câmera do celular, biometria e notificações push nativas.
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-orange-400 font-mono uppercase">CHAVES DE SINCRO (SUPABASE)</span>
                <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                  Por se comunicar via APIs normais, as transmissões em tempo real do seu banco Pestscan AI continuarão funcionando normalmente tanto no APK quanto na web.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="font-mono text-xs text-white/50 uppercase">Comandos para Gerar seu APK Android:</span>
              <button 
                onClick={() => copyToClipboard('capacitor', capacitorScript)}
                className="text-[10px] font-mono py-1 px-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-blue-400 font-bold flex items-center gap-1.5"
              >
                {copiedScript === 'capacitor' ? <Check className="w-3 h-3" /> : <Play className="w-3.5 h-3.5" />}
                {copiedScript === 'capacitor' ? 'COPIADO!' : 'COPIAR COMANDOS'}
              </button>
            </div>
            <pre className="p-4 bg-black/60 border border-white/10 rounded-2xl text-[10px] font-mono text-blue-400 overflow-x-auto select-all max-h-96">
              {capacitorScript}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
