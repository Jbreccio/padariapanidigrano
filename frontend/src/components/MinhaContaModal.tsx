import { X } from "lucide-react";
import MinhaConta from "../pages/MinhaConta";

interface MinhaContaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MinhaContaModal = ({ isOpen, onClose }: MinhaContaModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Fundo escuro */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          {/* Componente MinhaConta com isModal=true */}
          <MinhaConta isModal={true} />
        </div>
      </div>
    </div>
  );
};

export default MinhaContaModal;