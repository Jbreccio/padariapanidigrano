import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, Instagram } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";

const Contato = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#form-contato") {
      const element = document.getElementById("form-contato");
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Mensagem enviada!",
      description: "Entraremos em contato em breve.",
    });
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLoginClick={() => navigate("/auth")} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-secondary mb-4">
              Fale Conosco
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tem alguma dúvida ou quer fazer uma encomenda especial? 
              Entre em contato conosco!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto mb-12">
            {/* Coluna da Esquerda - Informações de Contato */}
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Informações de Contato
                </h2>
                
                <div className="space-y-4">
                  {/* Telefone Fixo */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="p-3 rounded-lg bg-blue-500/20 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Telefone Fixo</h3>
                      <a 
                        href="tel:551123797077" 
                        className="text-muted-foreground hover:text-blue-600 transition-colors block mt-1"
                      >
                        (11) 2379-7077
                      </a>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="p-3 rounded-lg bg-green-500/20 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.18-1.24-6.169-3.495-8.418"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">WhatsApp</h3>
                      <a 
                        href="https://wa.me/5511940566647?text=Olá! Gostaria de mais informações sobre os produtos da Pani Di Grano."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-green-600 transition-colors block mt-1"
                      >
                        (11) 94056-6647
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="p-3 rounded-lg bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Email</h3>
                      <a 
                        href="mailto:panibolosepaes@gmail.com"
                        className="text-muted-foreground hover:text-primary transition-colors block mt-1"
                      >
                        panibolosepaes@gmail.com
                      </a>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="p-3 rounded-lg bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Endereço</h3>
                      <p className="text-muted-foreground mt-1">
                        R. Cel. Seabra, 1044 - Vila Marina<br />
                        Santo André - SP, 09176-000
                      </p>
                    </div>
                  </div>

                  {/* Horário */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="p-3 rounded-lg bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Horário de Funcionamento</h3>
                      <p className="text-muted-foreground mt-1">
                        Segunda a Sábado: 8h às 18h
                      </p>
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 text-white">
                      <Instagram className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Instagram</h3>
                      <a 
                        href="https://www.instagram.com/panidigrano/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-pink-500 transition-colors block mt-1"
                      >
                        @panidigrano
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna da Direita - Formulário */}
            <div id="form-contato" className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">
                Envie uma Mensagem
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm">Nome</Label>
                  <Input id="name" placeholder="Seu nome" className="h-9" required />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input id="email" type="email" placeholder="seu@email.com" className="h-9" required />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-sm">Telefone</Label>
                  <Input id="phone" type="tel" placeholder="(11) 99999-9999" className="h-9" />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="message" className="text-sm">Mensagem</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Escreva sua mensagem aqui..."
                    rows={4}
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <Button type="submit" className="w-full btn-primary mt-2" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
                </Button>
              </form>
            </div>
          </div>

          {/* Mapa */}
          <div className="w-full max-w-6xl mx-auto mt-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              Como Chegar
            </h2>
            <div className="rounded-xl overflow-hidden shadow-lg border border-border hover:shadow-xl transition-all duration-300">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3652.391391366212!2d-46.5191356!3d-23.6748302!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce4276826f91c1%3A0xdb3a758a814851ce!2sPani%20Bolos%20e%20P%C3%A3es%20Artesanais!5e0!3m2!1spt-BR!2sbr!4v1746720000000!5m2!1spt-BR!2sbr"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa da Pani Di Grano"
                className="w-full"
              ></iframe>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              R. Cel. Seabra, 1044 - Vila Marina, Santo André - SP, 09176-000
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contato;