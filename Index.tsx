import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import Cart, { CartItem } from "@/components/Cart";
import CategoryCard from "@/components/CategoryCard";
import { Product } from "@/components/ProductCard";
import { categories } from "@/data/products";
import { Cake, Cookie, Sandwich, Pizza, IceCream, ChefHat, Croissant, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const iconMap: { [key: string]: any } = {
  cake: Cake,
  bread: Cookie,
  sandwich: Sandwich,
  pizza: Pizza,
  dessert: IceCream,
  pie: ChefHat,
  candy: Cookie,
  croissant: Croissant,
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    toast({
      title: "Adicionado ao carrinho!",
      description: `${quantity}x ${product.name}`,
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        onLoginClick={() => navigate("/auth")}
      />

      <main>
        <Hero />

        {/* Categories Section */}
        <section className="py-20 bg-section-gradient">
          <div className="container mx-auto px-4">
            <h2 className="section-title">Nosso Cardápio</h2>
            <p className="section-subtitle">
              Explore nossa variedade de pães, bolos e delícias artesanais, 
              todos feitos com carinho e ingredientes selecionados.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => {
                const Icon = iconMap[category.icon] || UtensilsCrossed;
                return (
                  <CategoryCard
                    key={category.id}
                    title={category.name}
                    description={category.description}
                    icon={Icon}
                    onClick={() => navigate(`/cardapio?categoria=${category.id}`)}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="section-title">Sobre a Pani Di Grano</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Nascemos do amor pela panificação artesanal. Cada pão, cada bolo é 
                preparado com dedicação, usando receitas tradicionais e ingredientes 
                de primeira qualidade. Nosso objetivo é levar até você o sabor caseiro 
                que só a verdadeira arte da panificação pode oferecer.
              </p>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <ChefHat className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">Artesanal</h3>
                  <p className="text-sm text-muted-foreground">Feito à mão com carinho</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <Cookie className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">Ingredientes</h3>
                  <p className="text-sm text-muted-foreground">Selecionados com cuidado</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <Cake className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">Tradição</h3>
                  <p className="text-sm text-muted-foreground">Receitas de família</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-hero-gradient">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-secondary mb-4">
              Pronto para fazer seu pedido?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Cadastre-se e faça seu pedido online. Receba fresquinho em sua casa!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/cardapio")}
                className="btn-primary"
              >
                Ver Cardápio Completo
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="btn-outline"
              >
                Criar Minha Conta
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
};

export default Index;
