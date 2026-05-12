import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Cart from "../components/Cart";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { useToast } from "../hooks/use-toast";
import { ShoppingBag, CreditCard, Truck, Store, User, Trash2, Minus, Plus } from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, itemCount, total } = useCart();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [address, setAddress] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [notes, setNotes] = useState("");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  // Preencher dados do usuário se estiver logado
  useEffect(() => {
    if (user) {
      setName(user.nome || "");
      // Telefone não está disponível no user, manter vazio ou preencher depois
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para finalizar o pedido.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (items.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione produtos antes de finalizar.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      // Aqui você pode enviar o pedido para a API
      toast({ title: "Pedido enviado!", description: `Total: ${formatPrice(total)}. Em breve entraremos em contato.` });
      clearCart();
      navigate("/");
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível enviar o pedido.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartItemCount={itemCount}
        onCartClick={() => setIsOpen(true)}
        onLoginClick={() => navigate("/auth")}
      />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-secondary mb-2">Finalizar Pedido</h1>
              <p className="text-muted-foreground">Preencha os dados para concluir sua encomenda</p>
            </div>

            {!user && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8 text-center">
                <User className="h-12 w-12 mx-auto text-secondary mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">Faça login para continuar</h3>
                <p className="text-muted-foreground mb-4">Você precisa estar logado para finalizar seu pedido</p>
                <Button onClick={() => navigate("/auth")} className="btn-primary">Entrar ou Cadastrar</Button>
              </div>
            )}

            {/* Cart Summary - Editable */}
            <div className="bg-card rounded-2xl border border-border p-6 mb-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-secondary" />
                Itens do Pedido ({itemCount})
              </h2>

              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Seu carrinho está vazio</p>
                  <Button onClick={() => navigate("/cardapio")} variant="outline" className="mt-4">
                    Ver Cardápio
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                            <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm line-clamp-1">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">{formatPrice(item.product.price)} cada</p>
                      </div>
                      <div className="flex items-center gap-1 bg-background rounded-lg">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-semibold text-secondary text-sm whitespace-nowrap">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeItem(item.product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="font-medium text-lg">Total</span>
                    <span className="font-bold text-secondary text-2xl">{formatPrice(total)}</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Info */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-secondary" />
                  Dados Pessoais
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Seu nome" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="(11) 99999-9999" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Type */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-secondary" />
                  Tipo de Entrega
                </h2>
                <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === "delivery" ? "border-secondary bg-secondary/5" : "border-border"}`}>
                      <RadioGroupItem value="delivery" id="delivery" />
                      <div className="flex items-center gap-3">
                        <Truck className="h-6 w-6 text-secondary" />
                        <div><p className="font-medium">Entrega</p><p className="text-sm text-muted-foreground">Receba em casa</p></div>
                      </div>
                    </label>
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === "pickup" ? "border-secondary bg-secondary/5" : "border-border"}`}>
                      <RadioGroupItem value="pickup" id="pickup" />
                      <div className="flex items-center gap-3">
                        <Store className="h-6 w-6 text-secondary" />
                        <div><p className="font-medium">Retirada</p><p className="text-sm text-muted-foreground">Retire no local</p></div>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
                {deliveryType === "delivery" && (
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número" required={deliveryType === "delivery"} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input id="complement" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, bloco, etc." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" required={deliveryType === "delivery"} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-secondary" />
                  Forma de Pagamento
                </h2>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    {[
                      { value: "pix", label: "PIX", desc: "Pagamento instantâneo" },
                      { value: "card", label: "Cartão (na entrega)", desc: "Débito ou crédito" },
                      { value: "cash", label: "Dinheiro", desc: "Pague na entrega" },
                    ].map(opt => (
                      <label key={opt.value} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === opt.value ? "border-secondary bg-secondary/5" : "border-border"}`}>
                        <RadioGroupItem value={opt.value} id={opt.value} />
                        <div><p className="font-medium">{opt.label}</p><p className="text-sm text-muted-foreground">{opt.desc}</p></div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Notes */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-secondary" />
                  Observações
                </h2>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguma observação especial?" rows={3} />
              </div>

              <Button type="submit" className="w-full btn-primary py-6 text-lg" disabled={isLoading || !user || items.length === 0}>
                {isLoading ? "Enviando..." : `Confirmar Pedido — ${formatPrice(total)}`}
              </Button>
            </form>
          </div>
        </div>
      </main>

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

export default Checkout;