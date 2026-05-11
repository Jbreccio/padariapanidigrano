import React from 'react';
import Header from "../components/Header";
import Footer from "../components/Footer";
import { MapPin, Phone, Mail, Clock, Car, Bus, Footprints } from 'lucide-react';
import { useNavigate } from "react-router-dom";

export default function Localizacao() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => navigate("/auth")} />
      
      {/* BANNER RESPONSIVO */}
      <section className="relative w-full overflow-hidden bg-gray-900 mt-20">
        <div className="relative h-[400px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
          <img 
            src="/images/lojatoda.png"
            alt="Localização Pani Di Grano"
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={(e) => {
              const img = e.currentTarget;
              img.onerror = null;
              img.src = '/images/logo.png';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center">
            <div className="text-center px-4 max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg">
                Localização
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto px-4 drop-shadow-md">
                Encontre o caminho até nossa padaria
              </p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
      </section>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Informações */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            {/* Endereço */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-primary" size={24} />
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Endereço</h3>
              </div>
              <div className="text-gray-700 space-y-1">
                <p>Rua Cel. Seabra, 1044</p>
                <p>Vila Marina</p>
                <p>09176-000 – Santo André, SP</p>
              </div>
            </div>

            {/* Telefone */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="text-primary" size={24} />
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Telefone / WhatsApp</h3>
              </div>
              <div className="text-gray-700">
                <p>(11) 2379-7077</p>
              </div>
              <div className="text-gray-700">
                <p>(11) 94056-6647</p>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="text-primary" size={24} />
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Email</h3>
              </div>
              <div className="text-gray-700">
                <p>contato@panidigrano.com.br</p>
              </div>
            </div>

            {/* Horário */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-primary" size={34} />
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Horário de Funcionamento</h3>
              </div>
              <div className="text-gray-700 space-y-3">
                <div>
                  <p className="font-semibold text-primary">Domingo</p>
                  <p>Fechado</p>
                </div>
                <div>
                  <p className="font-semibold">Segunda à Sexta-feira</p>
                  <p>08hs às 18hs30</p>
                </div>
                <div>
                  <p className="font-semibold">Sábado</p>
                  <p>09hs às 18hs30</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-primary font-bold text-sm">
                    ⚠️ Os horários podem sofrer alterações em feriados
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mapa + Foto da loja */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mapa do Google */}
            <div className="bg-gray-300 rounded-lg shadow-sm h-72 md:h-96 overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3652.391391366212!2d-46.5191356!3d-23.6748302!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce4276826f91c1%3A0xdb3a758a814851ce!2sPani%20Bolos%20e%20P%C3%A3es%20Artesanais!5e0!3m2!1spt-BR!2sbr!4v1746720000000!5m2!1spt-BR!2sbr"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização Pani Di Grano"
              ></iframe>
            </div>
            <p className="text-gray-500 text-sm">
              *O mapa acima mostra a localização exata da Pani Di Grano.
            </p>

            {/* Foto da loja */}
            <div className="rounded-lg overflow-hidden shadow-sm">
              <img
                src="/images/lojametade.png"
                alt="Fachada Pani Di Grano"
                className="w-full h-64 md:h-80 object-cover"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.onerror = null;
                  img.src = '/images/logo.png';
                }}
              />
            </div>
          </div>
        </div>

        {/* Como Chegar */}
        <section className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Como Chegar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            
            {/* De Carro */}
            <div className="bg-gray-50 rounded-lg p-4 md:p-6 border-l-4 border-primary">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Car className="text-primary" size={24} />
                De Carro
              </h3>
              <div className="space-y-3 text-gray-700 text-sm md:text-base">
                <p><strong>Estacionamento:</strong> Estacionamento próprio disponível para clientes.</p>
                <p><strong>Vias de Acesso:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Via Anchieta (sentido Santo André)</li>
                  <li>Av. dos Estados</li>
                  <li>Rua Cel. Seabra</li>
                </ul>
                <p className="text-sm text-primary">
                  <strong>Dica:</strong> Recomendamos chegar com 10 minutos de antecedência para encontrar vagas com mais facilidade.
                </p>
              </div>
            </div>
            
            {/* De Ônibus (ABC) */}
            <div className="bg-gray-50 rounded-lg p-4 md:p-6 border-l-4 border-primary">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Bus className="text-primary" size={24} />
                De Ônibus (ABC)
              </h3>
              <div className="space-y-3 text-gray-700 text-sm md:text-base">
                <p><strong>Linhas da Região do ABC:</strong></p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['B 63', 'I 03', 'I 04', 'T 14', 'T 15', 'T 23', '287', '288'].map((line) => (
                    <span key={line} className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-sm font-medium">
                      {line}
                    </span>
                  ))}
                </div>
                <p><strong>Parada mais próxima:</strong> A aproximadamente 50 metros da padaria, na Rua Cel. Seabra.</p>
                <p><strong>Terminal de Ônibus:</strong> Terminal Metropolitano Santo André - Leste (10 minutos a pé)</p>
                <p><strong>Empresas que atendem:</strong> EMTU, Sumaré, Santo André Transportes</p>
              </div>
            </div>
            
            {/* A Pé */}
            <div className="bg-gray-50 rounded-lg p-4 md:p-6 border-l-4 border-primary">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Footprints className="text-primary" size={24} />
                A Pé
              </h3>
              <div className="space-y-3 text-gray-700 text-sm md:text-base">
                <p><strong>Localização:</strong> Área central do bairro Vila Marina, de fácil acesso e bem sinalizada.</p>
                <p><strong>Próximo a:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Comércios locais</li>
                  <li>Farmácias</li>
                  <li>Supermercados</li>
                  <li>Bancos</li>
                </ul>
                <p><strong>Acessibilidade:</strong> Calçadas rebaixadas e acesso para cadeirantes disponível.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}