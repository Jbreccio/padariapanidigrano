import { Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { cn } from "../lib/utils";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  available?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
  className?: string;
}

const ProductCard = ({ product, onAddToCart, className }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    onAddToCart?.(product, quantity);
    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1);
    }, 500);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className={cn(
      "group bg-card rounded-xl border border-border overflow-hidden card-hover",
      !product.available && "opacity-60",
      className
    )}>
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
    </div>
  );
};

export default ProductCard;

