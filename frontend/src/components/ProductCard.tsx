// frontend/src/components/ProductCard.tsx
import { Plus, Minus, ShoppingBag, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { toggleFavorito, loadFavoritosFromStorage } from "../data/products";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  available?: boolean;
  favorito?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
  onFavoriteChange?: (productId: string, isFavorited: boolean) => void;
  className?: string;
}

const ProductCard = ({ product, onAddToCart, onFavoriteChange, className }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorited, setIsFavorited] = useState(product.favorito || false);

  // Carregar estado do favorito quando o produto mudar
  useEffect(() => {
    setIsFavorited(product.favorito || false);
  }, [product.favorito, product.id]);

  const handleAddToCart = () => {
    setIsAdding(true);
    onAddToCart?.(product, quantity);
    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1);
    }, 500);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = toggleFavorito(product.id);
    setIsFavorited(newStatus);
    if (onFavoriteChange) {
      onFavoriteChange(product.id, newStatus);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className={cn(
      "group bg-card rounded-xl border border-border overflow-hidden card-hover relative",
      !product.available && "opacity-60",
      className
    )}>
      {/* Botão Favorito - Estrela */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:scale-110 transition-all duration-200"
        aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Star
          size={18}
          className={`transition-all duration-200 ${
            isFavorited 
              ? 'fill-yellow-400 text-yellow-500' 
              : 'text-gray-400 hover:text-yellow-500'
          }`}
        />
      </button>

      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/placeholder.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {!product.available && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium">
              Indisponível
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {product.category}
        </span>
        <h3 className="font-display text-lg font-semibold text-foreground mt-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-2 min-h-[2.5rem]">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold text-secondary">
            {formatPrice(product.price)}
          </span>

          {product.available !== false && (
            <div className="flex items-center gap-2">
              {/* Quantity selector */}
              <div className="flex items-center gap-1 bg-muted rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Add to cart */}
              <Button
                size="icon"
                className={cn(
                  "h-8 w-8 btn-primary",
                  isAdding && "animate-pulse"
                )}
                onClick={handleAddToCart}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </div>
  );
};

export default ProductCard;