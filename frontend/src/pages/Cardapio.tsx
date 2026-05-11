import { useState, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Cart from "../components/Cart";
import MenuSidebar from "../components/MenuSidebar";
import ProductCard from "../components/ProductCard";
import { useCart } from "../contexts/CartContext";
import { products, categories } from "../data/products";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const Cardapio = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, isOpen, setIsOpen, addToCart, updateQuantity, removeItem, clearCart, itemCount, total } = useCart();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const selectedCategory = searchParams.get("categoria") || "all";

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory !== "all") {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        filtered = filtered.filter(p => p.category === category.name);
      }
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [selectedCategory, searchQuery]);

  // Group products by category for sectioned display
  const groupedProducts = useMemo(() => {
    const groups: { name: string; products: typeof products }[] = [];
    const categoryOrder = categories.map(c => c.name);
    
    const grouped = filteredProducts.reduce((acc, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, typeof products>);

    categoryOrder.forEach(catName => {
      if (grouped[catName]) {
        groups.push({ name: catName, products: grouped[catName] });
      }
    });

    return groups;
  }, [filteredProducts]);

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === "all") {
      searchParams.delete("categoria");
    } else {
      searchParams.set("categoria", categoryId);
    }
    setSearchParams(searchParams);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const selectedCategoryName = selectedCategory === "all"
    ? "Todos os Produtos"
    : categories.find(c => c.id === selectedCategory)?.name || "Todos";

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartItemCount={itemCount}
        onCartClick={() => setIsOpen(true)}
        onLoginClick={() => navigate("/auth")}
      />

      <MenuSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryChange}
      />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-secondary mb-4">
              Nosso Cardápio
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore nossa seleção de pães, bolos e delícias artesanais.
            </p>
          </div>

          {/* Search + Filter Bar */}
          <div className="flex gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 border-secondary/30 hover:bg-secondary/10 shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Categorias</span>
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 input-styled"
              />
            </div>
          </div>

          {/* Active filter + count */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1.5 bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-sm font-medium">
                  {selectedCategoryName}
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              <p className="text-muted-foreground text-sm">
                {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Products grouped by category */}
          {groupedProducts.length > 0 ? (
            <div className="space-y-12">
              {groupedProducts.map((group) => (
                <section key={group.name}>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="font-display text-2xl font-bold text-secondary">
                      {group.name}
                    </h2>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-sm text-muted-foreground">
                      {group.products.length} {group.products.length === 1 ? "item" : "itens"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {group.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">Nenhum produto encontrado</p>
              <Button onClick={() => { setSearchQuery(""); handleCategoryChange("all"); }}>
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Floating cart summary bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-secondary text-secondary-foreground shadow-lg border-t border-secondary/20">
          <div className="container mx-auto px-4">
            <button
              onClick={() => setIsOpen(true)}
              className="w-full flex items-center justify-between py-4 hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <span className="bg-secondary-foreground text-secondary rounded-full h-7 w-7 flex items-center justify-center text-sm font-bold">
                  {itemCount}
                </span>
                <span className="font-medium">Ver carrinho</span>
              </div>
              <span className="font-bold text-lg">{formatPrice(total)}</span>
            </button>
          </div>
        </div>
      )}

      <Footer />

      <Cart
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default Cardapio;