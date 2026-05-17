import { useState } from "react";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import MinhaContaModal from "./MinhaContaModal";

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onLoginClick?: () => void;
  isLoggedIn?: boolean;
}

const Header = ({ cartItemCount = 0, onCartClick, onLoginClick, isLoggedIn }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMinhaContaModalOpen, setIsMinhaContaModalOpen] = useState(false);

  const handleMinhaContaClick = () => {
    setIsMinhaContaModalOpen(true);
  };

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Cardápio", href: "/cardapio" },
    { name: "Contato", href: "/contato" },
    { name: "Localização", href: "/localizacao" },
    { name: "Sobre Nós", href: "/sobrenos" },
  ];

  // Classe comum para o efeito de borda e contorno da imagem
  const buttonStyle = "btn-primary ring-2 ring-offset-2 ring-rose-300/60 transition-all duration-300 hover:scale-105";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Desktop Navigation - Centralizado */}
            <nav className="hidden md:flex items-center justify-center flex-1 gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="relative group text-rose-900/60 hover:text-rose-900/90 font-medium transition-colors duration-200 px-3 py-2"
                >
                  <span className="absolute inset-0 rounded-lg bg-pink-400/0 group-hover:bg-pink-400/20 transition-all duration-300 scale-0 group-hover:scale-100"></span>
                  <span className="relative z-10">{link.name}</span>
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-5">
              {/* Botão Carrinho */}
              <Button
                size="icon"
                className={`${buttonStyle} relative rounded-xl`}
                onClick={onCartClick}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-rose-900 text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm">
                    {cartItemCount}
                  </span>
                )}
              </Button>

              {/* Botão Minha Conta - Desktop */}
              <Button
                onClick={handleMinhaContaClick}
                className={`hidden md:flex ${buttonStyle} px-5 gap-2 rounded-xl`}
              >
                <User className="h-4 w-4" />
                <span className="font-medium">Minha Conta</span>
              </Button>

              {/* Botão Fazer Pedido - Desktop */}
              <Link to="/cardapio" className="hidden md:block">
                <Button className={`${buttonStyle} px-6 rounded-xl font-medium`}>
                  Fazer Pedido
                </Button>
              </Link>

              {/* Botão Menu Mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-[#8B4513] hover:text-[#6B3410]"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border animate-fade-in">
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="relative group text-rose-900/60 hover:text-rose-900/90 font-medium py-2 transition-colors px-3 rounded-lg"
                  >
                    <span className="absolute inset-0 rounded-lg bg-pink-400/0 group-hover:bg-pink-400/20 transition-all duration-300 scale-0 group-hover:scale-100"></span>
                    <span className="relative z-10">{link.name}</span>
                  </Link>
                ))}
                
                <Button 
                  className={`${buttonStyle} mt-2 gap-2 rounded-xl`} 
                  onClick={() => {
                    handleMinhaContaClick();
                    setIsMenuOpen(false);
                  }}
                >
                  <User className="h-4 w-4" />
                  Minha Conta
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Modal Minha Conta */}
      <MinhaContaModal 
        isOpen={isMinhaContaModalOpen} 
        onClose={() => setIsMinhaContaModalOpen(false)} 
      />

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Header;