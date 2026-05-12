import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Cardapio from "./pages/Cardapio";
import Auth from "./pages/Auth";
import Contato from "./pages/Contato";
import SobreNos from "./pages/SobreNos";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import WhatsAppButton from './components/layout/WhatsAppButton';
import Localizacao from "./pages/Localizacao";
import TermosUso from "./pages/TermosUso";
import FAQ from "./pages/FAQ";
import PoliticasPrivacidade from "./pages/PoliticasPrivacidade";
import PainelAdmin from "./pages/PainelAdmin";
import PaniLogin from "./pages/PaniLogin";
import { SpeedInsights } from "@vercel/speed-insights/react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SpeedInsights />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cardapio" element={<Cardapio />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/sobrenos" element={<SobreNos />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/localizacao" element={<Localizacao />} />
              <Route path="/termos-uso" element={<TermosUso />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/politicas-privacidade" element={<PoliticasPrivacidade />} />
              <Route path="/paineladmin" element={<PainelAdmin />} />
              <Route path="/panilogin" element={<PaniLogin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <WhatsAppButton />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;