import React, { useState, useEffect } from 'react';

interface Recado {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: 'cardapio' | 'recado' | 'popup' | 'carrossel';
  imagem?: string;
  ativo: boolean;
  dataCriacao: string;
  intervaloPopup?: number;
  local?: string;
  data?: string;
  hora?: string;
}

export default function RecadosHome() {
  const [recados, setRecados] = useState<Recado[]>([]);
  const [popupAberto, setPopupAberto] = useState<string | null>(null);

  // Carregar recados do localStorage
  useEffect(() => {
    const salvos = localStorage.getItem('recados-santuario');
    if (salvos) {
      const todosRecados: Recado[] = JSON.parse(salvos);
      const ativos = todosRecados.filter(r => r.ativo);
      setRecados(ativos);
    }
  }, []);

  // Lógica para popups automáticos (APENAS POPUPS)
  useEffect(() => {
    const popups = recados.filter(r => r.tipo === 'popup' && r.ativo);
    
    if (popups.length > 0) {
      const intervalo = setInterval(() => {
        // Pega um popup aleatório
        const popupAleatorio = popups[Math.floor(Math.random() * popups.length)];
        setPopupAberto(popupAleatorio.id);
        
        // Fechar popup após 8 segundos
        setTimeout(() => {
          setPopupAberto(null);
        }, 8000);
      }, 30000); // ✅ APARECE A CADA 30 SEGUNDOS

      return () => clearInterval(intervalo);
    }
  }, [recados]);

  const popupAtual = recados.find(r => r.id === popupAberto);

  return (
    <>
      {/* Popup Automático - Aparece a cada 30 segundos */}
      {popupAtual && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 relative border-l-4 border-blue-500 animate-fade-in">
            <button
              onClick={() => setPopupAberto(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">{popupAtual.titulo}</h3>
            <p className="text-gray-700 mb-4">{popupAtual.conteudo}</p>
            
            {popupAtual.imagem && (
              <div className="mt-4">
                <img 
                  src={popupAtual.imagem} 
                  alt={popupAtual.titulo}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
            
            <div className="mt-4 text-sm text-gray-500 text-center">
              ⏰ Este popup aparece automaticamente a cada 30 segundos
            </div>
          </div>
        </div>
      )}
    </>
  );
}