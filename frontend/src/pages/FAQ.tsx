import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, HelpCircle, Package, CreditCard, Truck, Clock, Shield, RefreshCw, MapPin } from "lucide-react";

const FAQ = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Como faço para fazer um pedido?",
      answer: "Você pode fazer seu pedido diretamente pelo nosso site na seção 'Cardápio', escolhendo os produtos desejados e adicionando ao carrinho. Depois, é só seguir as instruções para finalizar a compra.",
      icon: Package
    },
    {
      question: "Qual é o prazo de entrega?",
      answer: "O prazo de entrega varia de acordo com sua localização. Em geral, entregamos em até 2 horas para a região de Santo André e arredores. Para outras regiões, o prazo pode ser de até 24 horas úteis.",
      icon: Truck
    },
    {
      question: "Quais são as formas de pagamento aceitas?",
      answer: "Aceitamos pagamento via PIX, cartão de crédito (na entrega), cartão de débito (na entrega) e dinheiro. Para pedidos online, o PIX é a forma mais rápida e segura.",
      icon: CreditCard
    },
    {
      question: "Vocês entregam em todo o Brasil?",
      answer: "Atualmente atendemos apenas a região do Grande ABC e São Paulo Capital. Estamos expandindo nossa área de entrega gradativamente.",
      icon: MapPin
    },
    {
      question: "Posso retirar meu pedido na loja?",
      answer: "Sim! Você pode retirar seu pedido diretamente em nossa loja na Rua Cel. Seabra, 1044 - Vila Marina, Santo André - SP. Basta selecionar a opção 'Retirada' no checkout.",
      icon: Clock
    },
    {
      question: "Como posso acompanhar meu pedido?",
      answer: "Após a confirmação do pedido, você receberá um código de rastreamento por WhatsApp ou email. Também pode entrar em contato conosco pelo WhatsApp (11) 94056-6647 para atualizações.",
      icon: Package
    },
    {
      question: "Vocês têm opções sem glúten ou lactose?",
      answer: "Sim! Temos opções sem glúten e sem lactose em nosso cardápio. Entre em contato conosco para mais informações sobre os produtos disponíveis.",
      icon: Shield
    },
    {
      question: "Qual é a política de cancelamento?",
      answer: "Cancelamentos podem ser feitos até 1 hora antes do horário agendado para entrega ou retirada. Entre em contato conosco imediatamente para solicitar o cancelamento.",
      icon: RefreshCw
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLoginClick={() => navigate("/auth")} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-secondary mb-4">
              Perguntas Frequentes
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tire suas dúvidas sobre nossos produtos, entregas e serviços.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => {
              const Icon = faq.icon;
              const isOpen = openIndex === index;
              
              return (
                <div
                  key={index}
                  className="mb-4 bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20 text-secondary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {faq.question}
                      </h3>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contato adicional */}
          <div className="max-w-3xl mx-auto mt-12 p-6 bg-secondary/10 rounded-2xl text-center">
            <HelpCircle className="h-10 w-10 text-secondary mx-auto mb-3" />
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Ainda tem dúvidas?
            </h3>
            <p className="text-muted-foreground mb-4">
              Entre em contato conosco e teremos prazer em ajudar!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/5511940566647"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all duration-300"
              >
                WhatsApp
              </a>
              <button
                onClick={() => navigate("/contato")}
                className="inline-flex items-center justify-center gap-2 px-6 py-2 btn-primary rounded-full"
              >
                Formulário de Contato
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;