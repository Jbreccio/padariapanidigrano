import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { ChefHat, Heart, Award, Users, ChevronLeft, ChevronRight } from "lucide-react";

const SobreNos = () => {
  const navigate = useNavigate();
  
  // Array de imagens para o carrossel
  const images = [
    "/images/loja.png",
    "/images/loja02.png",
    "/images/loja03.png",
    "/images/loja04.png",
    "/images/loja05.png",
    "/images/loja06.png",
    "/images/loja07.png",
    "/images/loja08.png",
    "/images/loja09.png",
    "/images/loja10.png",
    "/images/loja11.png",
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Timer automático a cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header onLoginClick={() => navigate("/auth")} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero - COM LOGO IGUAL AO FOOTER */}
          <div className="text-center mb-16">
            {/* Logo com bordas curvas e fundo cinza como no footer */}
            <div className="flex justify-center mb-6">
              <img 
                src="/images/logo.png" 
                alt="Pani Di Grano" 
                className="h-32 w-auto bg-gray-100 rounded-2xl p-3 shadow-md" 
              />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-secondary mb-4">
              Nossa História
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Conheça a Pani Di Grano, uma padaria artesanal nascida do amor 
              pela arte da panificação e pela tradição das receitas de família.
            </p>
          </div>

          {/* Carrossel de Fotos */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="relative group">
              {/* Imagem Principal */}
              <div className="overflow-hidden rounded-2xl shadow-xl">
                <img
                  src={images[currentImageIndex]}
                  alt={`Loja Pani Di Grano - Imagem ${currentImageIndex + 1}`}
                  className="w-full h-[400px] object-cover transition-transform duration-300"
                />
              </div>

              {/* Botão Anterior */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              {/* Botão Próximo */}
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Indicadores/Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? "bg-white w-4"
                        : "bg-white/50 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </div>

            
          </div>

          {/* Story */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-card rounded-2xl border border-border p-8">
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                Do forno para sua mesa
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A Pani Di Grano nasceu do sonho de levar o verdadeiro sabor artesanal 
                até você. Com receitas passadas de geração em geração e ingredientes 
                cuidadosamente selecionados, cada pão, cada bolo carrega uma história 
                de dedicação e amor.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Nosso nome, "Pani Di Grano" (Pão de Trigo em italiano), reflete nossa 
                paixão pela arte da panificação e pelo respeito aos ingredientes 
                simples que transformamos em verdadeiras delícias.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Trabalhamos com fermentação natural, farinhas de qualidade e um 
                processo artesanal que respeita o tempo de cada massa. O resultado 
                são produtos únicos, com sabor e textura incomparáveis.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="section-title">Nossos Valores</h2>
            <p className="section-subtitle">
              O que nos guia em cada produto que fazemos
            </p>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <ChefHat className="h-10 w-10 text-secondary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Artesanal</h3>
                <p className="text-muted-foreground text-sm">
                  Cada produto é feito à mão com cuidado e atenção aos detalhes
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Heart className="h-10 w-10 text-secondary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Com Amor</h3>
                <p className="text-muted-foreground text-sm">
                  Colocamos carinho em cada etapa da produção
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Award className="h-10 w-10 text-secondary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Qualidade</h3>
                <p className="text-muted-foreground text-sm">
                  Ingredientes selecionados para o melhor sabor
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-10 w-10 text-secondary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Família</h3>
                <p className="text-muted-foreground text-sm">
                  Receitas tradicionais passadas de geração em geração
                </p>
              </div>
            </div>
          </div>

          {/* Products Highlight */}
          <div className="bg-hero-gradient rounded-2xl p-8 md:p-12 text-center">
            <h2 className="font-display text-3xl font-bold text-secondary mb-4">
              Mais de 100 produtos artesanais
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Bolos caseiros, pães de diversos tipos, focaccias, baguetes recheadas, 
              sobremesas, salgados e muito mais. Tudo feito com receitas exclusivas.
            </p>
            <button
              onClick={() => navigate("/cardapio")}
              className="btn-primary"
            >
              Conhecer o Cardápio
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SobreNos;