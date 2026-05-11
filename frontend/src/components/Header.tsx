import { useState } from "react";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onLoginClick?: () => void;
  isLoggedIn?: boolean;
}

const Header = ({ cartItemCount = 0, onCartClick, onLoginClick, isLoggedIn }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Cardápio", href: "/cardapio" },
    { name: "Contato", href: "/contato" },
    { name: "Localização", href: "/localizacao" },
    { name: "Sobre Nós", href: "/sobrenos" }, 
    { name: "Minha Conta", href: "/auth" },
  ];

  return (
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
          <div className="flex items-center gap-4">
            {/* Botão Carrinho - mesmo estilo do btn-primary */}
            <Button
              size="icon"
              className="btn-primary relative"
              onClick={onCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-rose-900 text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {cartItemCount}
                </span>
              )}
            </Button>

            {/* Botão Usuário - mesmo estilo do btn-primary */}
            <Button
              size="icon"
              onClick={onLoginClick}
              className="hidden md:flex btn-primary"
            >
              <User className="h-5 w-5" />
            </Button>

            <Link to="/cardapio" className="hidden md:block">
              <Button className="btn-primary">
                Fazer Pedido
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-rose-900/60"
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
                  className="relative group text-rose-900/60 hover:text-rose-900/90 font-medium py-2 transition-colors px-3 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="absolute inset-0 rounded-lg bg-pink-400/0 group-hover:bg-pink-400/20 transition-all duration-300 scale-0 group-hover:scale-100"></span>
                  <span className="relative z-10">{link.name}</span>
                </Link>
              ))}
              <Button className="btn-primary mt-2" onClick={onLoginClick}>
                <User className="h-4 w-4 mr-2" />
                {isLoggedIn ? "Minha Conta" : "Entrar"}
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;