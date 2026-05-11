import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface RecadoItem {
  id: string;
  titulo: string;
  conteudo: string;
  dataCriacao: string;
  ativo: boolean;
  avisoimportante?: boolean;
  tempoExibicao?: number;
}

interface MiniCarrosselRecadosProps {
  recados: RecadoItem[];
  tempoExibicao?: number;
}

export default function MiniCarrosselRecados({ 
  recados, 
  tempoExibicao = 5 
}: MiniCarrosselRecadosProps) {

  const [recadosAtivos, setRecadosAtivos] = useState<RecadoItem[]>([]);
  const [recadoAtual, setRecadoAtual] = useState<RecadoItem | null>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [visivel, setVisivel] = useState(true);
  const [pausado, setPausado] = useState(false);

  // 🔥 CORREÇÃO AQUI (browser, não Node)
  const intervalRef = useRef<number | null>(null);

  // 🔥 Carrega recados ativos
  useEffect(() => {
    console.log("🔥 RECADOS RECEBIDOS:", recados);

    const ativos = recados.filter(r => r.ativo);

    console.log("🔥 RECADOS ATIVOS:", ativos);

    setRecadosAtivos(ativos);

    if (ativos.length > 0) {
      setRecadoAtual(ativos[0]);
      setIndiceAtual(0);
    } else {
      setRecadoAtual(null);
    }
  }, [recados]);

  // 🔥 Controle do carrossel
  useEffect(() => {
    if (!visivel || recadosAtivos.length === 0 || pausado) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const tempoMs = ((recadoAtual?.tempoExibicao ?? tempoExibicao) || 5) * 1000;

    intervalRef.current = window.setInterval(() => {
      setIndiceAtual(prev => {
        const proximo = (prev + 1) % recadosAtivos.length;
        setRecadoAtual(recadosAtivos[proximo]);
        return proximo;
      });
    }, tempoMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visivel, recadosAtivos, pausado, recadoAtual, tempoExibicao]);

  // 🔥 Evita render bugado
  if (!visivel) return null;
  if (recadosAtivos.length === 0) return null;
  if (!recadoAtual) return null;

  return (
    <>
      <div 
        className="fixed left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
        style={{ top: 'calc(96px + env(safe-area-inset-top))' }}
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 flex items-center justify-between">
            
            <div className="flex items-center gap-3 flex-1 min-w-0">

              {recadoAtual.avisoimportante && (
                <AlertCircle 
                  size={16} 
                  className="text-yellow-300 animate-pulse flex-shrink-0" 
                />
              )}

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="whitespace-nowrap animate-marquee inline-block">

                  <span className="font-bold text-white mr-2">
                    {recadoAtual.titulo}:
                  </span>

                  <span className="text-white/90">
                    {recadoAtual.conteudo}
                  </span>

                  {recadoAtual.avisoimportante && (
                    <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">
                      AVISO IMPORTANTE
                    </span>
                  )}

                </div>
              </div>
            </div>

            <button
              onClick={() => setVisivel(false)}
              className="flex-shrink-0 ml-2 p-1.5 hover:bg-blue-800 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X size={16} className="text-white" />
            </button>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </>
  );
}