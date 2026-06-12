import { Camera, Cpu, Database, Smartphone, Code, ShieldAlert, Settings, Wind } from 'lucide-react';

export default function Guide() {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-white/50 italic">
          Guia de Configuração Técnica
        </h2>
      </div>

      <div className="grid gap-6">
        {/* Hardware Recommendation */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-[#00f59b]" />
            <h3 className="font-mono text-sm font-bold uppercase">Hardware Recomendado</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-white/60 leading-relaxed">
                <strong className="text-white">Raspberry Pi Camera Module 3 (NoIR):</strong> A melhor escolha para o PestGuard AI. Possui <span className="text-[#00f59b]">Autofoco</span> (essencial para pragas pequenas) e o sensor NoIR permite visão noturna total com LEDs infravermelhos.
              </p>
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
              <h4 className="font-mono text-xs font-bold text-blue-400 uppercase">Como funciona a Captura? (Fluxo Duplo)</h4>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center font-mono text-[10px] text-blue-400">1</div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-white uppercase tracking-tight">Fluxo "Pixelada" (Vigilância)</p>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      O sistema monitora um fluxo de vídeo leve (640x480). O software compara os pixels. Se houver mudança (movimento), o alerta é disparado.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center font-mono text-[10px] text-blue-400">2</div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-white uppercase tracking-tight">Fluxo "Normal" (Identificação)</p>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      No momento da detecção, a câmera tira uma foto de 12MP (Alta Definição). É esta imagem que a IA usa para identificar a praga com precisão.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SSD Storage Section */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-[#00f59b]" />
            <h3 className="font-mono text-sm font-bold uppercase">Armazenamento no SSD</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <h4 className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Configuração do Disco</h4>
              <p className="text-[10px] text-white/60 leading-relaxed">
                Para evitar corrupção de dados, use um SSD via USB 3.0. Configure a montagem automática no <code className="text-[#00f59b]">/etc/fstab</code> usando o UUID do disco.
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <h4 className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Banco de Dados Local</h4>
              <p className="text-[10px] text-white/60 leading-relaxed">
                Instale o PostgreSQL diretamente no SSD. Isso permite armazenar anos de histórico sem depender de planos pagos na nuvem.
              </p>
            </div>
          </div>
        </div>

        {/* GPIO Power Guide */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-orange-500" />
            <h3 className="font-mono text-sm font-bold uppercase">Alimentação via Pinos (GPIO)</h3>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <p className="text-[11px] text-red-400 font-bold uppercase mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> ATENÇÃO CRÍTICA
              </p>
              <p className="text-[10px] text-white/60 leading-relaxed">
                Ligar a fonte nos pinos errados ou inverter a polaridade pode <strong className="text-white">queimar sua Raspberry Pi instantaneamente</strong>, pois os pinos GPIO não possuem o circuito de proteção que a porta USB-C tem.
              </p>
            </div>

            {/* Visual Pinout Diagram */}
            <div className="flex flex-col items-center gap-4 bg-black/40 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Diagrama de Conexão (Vista Superior)</p>
              
              <div className="grid grid-cols-2 gap-x-12 gap-y-2 relative">
                {/* Pin 1 & 2 */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-mono">1</div>
                  <span className="text-[9px] font-mono text-white/20">3.3V</span>
                </div>
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-white/20">2</div>
                  <span className="text-[10px] font-mono text-red-400 font-bold">5V (POSITIVO)</span>
                </div>

                {/* Pin 3 & 4 */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-mono">3</div>
                  <span className="text-[9px] font-mono text-white/20">SDA</span>
                </div>
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-white/20">4</div>
                  <span className="text-[10px] font-mono text-red-400 font-bold">5V (OPCIONAL)</span>
                </div>

                {/* Pin 5 & 6 */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-mono">5</div>
                  <span className="text-[9px] font-mono text-white/20">SCL</span>
                </div>
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-md bg-black border-2 border-white/40 flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]">6</div>
                  <span className="text-[10px] font-mono text-white/80 font-bold">GND (NEGATIVO)</span>
                </div>

                {/* Vertical Line representing the header edge */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />
              </div>

              <div className="mt-6 flex flex-col gap-3 w-full">
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                  <p className="text-[10px] text-white/70">
                    <strong className="text-white">Fio Vermelho (+):</strong> Ligue no <strong className="text-red-400">Pino 2</strong> (o primeiro pino da fileira de fora, canto superior direito).
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-white mt-1.5" />
                  <p className="text-[10px] text-white/70">
                    <strong className="text-white">Fio Preto (-):</strong> Ligue no <strong className="text-white">Pino 6</strong> (o terceiro pino da fileira de fora).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cooling System (124mm Fan) */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Wind className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold uppercase">Sistema de Refrigeração</h3>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
              <p className="text-[10px] text-white/70 leading-relaxed">
                Você confirmou o uso de um Cooler de <strong className="text-white">124mm (5V)</strong>. Essa é a escolha ideal para manter o fluxo de ar constante sem complicação de fiação ou conversores.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                <h4 className="font-mono text-[9px] text-white/40 uppercase tracking-widest">Escolha do Cooler</h4>
                <p className="text-[9px] text-white/60 leading-tight">
                  Como sua fonte Mean Well é de <strong className="text-cyan-400">5V</strong>, certifique-se de comprar um Cooler de <strong className="text-white">5V</strong>. <br/><br/>
                  <span className="text-yellow-500/80 italic text-[8px]">Nota: Coolers de PC comuns de 12V girarão muito devagar ou nem ligarão em 5V.</span>
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                <h4 className="font-mono text-[9px] text-white/40 uppercase tracking-widest">Instalação Final</h4>
                <p className="text-[9px] text-white/60 leading-tight">
                  Ligue os fios do cooler grande <strong className="text-white">direto nos terminais +V e -V</strong> da fonte Mean Well. Assim você não sobrecarrega os pinos da Raspberry Pi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Power Setup (Industrial PSU) */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="font-mono text-sm font-bold uppercase">Setup Profissional (Fonte Industrial)</h3>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <p className="text-[10px] text-white/70 leading-relaxed">
                Para o seu setup com <strong className="text-white">Raspberry Pi + LEDs + Cooler</strong>, a fonte <strong className="text-blue-400">Mean Well LRS-50-5</strong> que você mostrou é a escolha perfeita. Ela entrega até <span className="text-blue-400 font-bold">10 Amperes</span>, o que sobra para alimentar tudo com folga e estabilidade.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                <h4 className="font-mono text-[9px] text-white/40 uppercase tracking-widest">Vantagens</h4>
                <ul className="text-[9px] text-white/60 space-y-1 list-disc list-inside">
                  <li>Tensão ajustável (Trimpot)</li>
                  <li>Alta durabilidade (Industrial)</li>
                  <li>Suporta múltiplos periféricos</li>
                </ul>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
                <h4 className="font-mono text-[9px] text-red-400 uppercase tracking-widest font-bold">⚠️ Diagnóstico da Compra (RS-15)</h4>
                <p className="text-[10px] text-white/70 leading-relaxed">
                  Infelizmente, o modelo <strong className="text-white">RS-15</strong> que aparece no seu pedido entrega apenas <span className="text-red-400 font-bold">3.0 Amperes</span>. 
                </p>
                <div className="space-y-1">
                  <p className="text-[9px] text-white/40 uppercase font-mono">Consumo Estimado:</p>
                  <ul className="text-[9px] text-white/60 list-disc list-inside">
                    <li>Raspberry Pi 4: 3.0A (Pico)</li>
                    <li>SSD + Cooler: 0.7A</li>
                    <li>LEDs: 1.0A a 3.0A</li>
                    <li className="text-red-400 font-bold">Total: ~5.0A a 7.0A</li>
                  </ul>
                </div>
                <p className="text-[10px] text-red-400 italic">
                  Resultado: A RS-15 vai desarmar ou causar travamentos constantes. Se possível, tente cancelar ou trocar pela <strong className="text-white">LRS-50-5 (10A)</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-3">
              <h4 className="font-mono text-[10px] text-white/40 uppercase text-center">Esquema de Terminais (Esquerda para Direita)</h4>
              <div className="flex justify-center gap-2 font-mono text-[9px]">
                <div className="flex flex-col items-center gap-1">
                  <div className="px-1.5 py-1 bg-yellow-500/20 text-yellow-500 rounded border border-yellow-500/30">L</div>
                  <span className="text-[7px] text-center">Fase</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="px-1.5 py-1 bg-yellow-500/20 text-yellow-500 rounded border border-yellow-500/30">N</div>
                  <span className="text-[7px] text-center">Neutro</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="px-1.5 py-1 bg-yellow-500/20 text-yellow-500 rounded border border-yellow-500/30">FG</div>
                  <span className="text-[7px] text-center">Terra</span>
                </div>
                <div className="w-2" />
                <div className="flex flex-col items-center gap-1">
                  <div className="px-1.5 py-1 bg-black border border-white/20 text-white rounded shadow-[0_0_10px_rgba(255,255,255,0.1)]">-V</div>
                  <span className="text-[7px] text-center font-bold">NEGATIVO</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="px-1.5 py-1 bg-red-500 text-white rounded shadow-[0_0_10px_rgba(239,68,68,0.3)]">+V</div>
                  <span className="text-[7px] text-center font-bold">POSITIVO</span>
                </div>
              </div>
              <p className="text-[8px] text-white/30 text-center italic mt-2">
                Conecte a Pi, LEDs e Cooler em paralelo nos terminais -V e +V.
              </p>
            </div>
          </div>
        </div>

        {/* Step by Step Integration */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-[#00f59b]" />
            <h3 className="font-mono text-sm font-bold uppercase">Integração do Software</h3>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-mono text-xs text-orange-500">
                01
              </div>
              <div className="space-y-2">
                <h3 className="font-mono text-sm font-bold uppercase">Ambiente Python</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Instale o <code className="text-orange-500">tflite-runtime</code> e a biblioteca <code className="text-orange-500">picamera2</code> no seu Raspberry Pi.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-mono text-xs text-orange-500">
                02
              </div>
              <div className="space-y-2">
                <h3 className="font-mono text-sm font-bold uppercase">Script de Integração</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Carregue seu modelo e o arquivo <code className="text-orange-500">labels.txt</code>. Use detecção de movimento via software para economizar CPU.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-mono text-xs text-orange-500">
                03
              </div>
              <div className="space-y-2">
                <h3 className="font-mono text-sm font-bold uppercase">Georreferenciamento Real</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Adicione as coordenadas GPS no envio dos dados para que o mapa de calor via satélite mostre a localização exata da praga.
                </p>
                <div className="bg-black p-3 rounded-lg border border-white/5 font-mono text-[10px] text-white/40 overflow-x-auto">
                  data[<span className="text-emerald-400">"lat"</span>] = <span className="text-orange-400">-23.5505</span><br/>
                  data[<span className="text-emerald-400">"lng"</span>] = <span className="text-orange-400">-46.6333</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl">
        <div className="flex items-start gap-3">
          <Code className="w-4 h-4 text-orange-500 mt-0.5" />
          <p className="text-[11px] text-orange-500/80 font-mono leading-relaxed italic">
            Nota: O sistema PestGuard AI foi otimizado para modelos TensorFlow Lite (.tflite) personalizados com suporte a geolocalização em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
