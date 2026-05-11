import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { FileText, Shield, AlertCircle, CheckCircle } from "lucide-react";

const TermosUso = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header onLoginClick={() => navigate("/auth")} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-secondary mb-4">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Leia atentamente nossos termos e condições antes de utilizar nossos serviços.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-card rounded-2xl border border-border p-8">
            <div className="space-y-8">
              {/* Seção 1 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-6 w-6 text-secondary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">1. Aceitação dos Termos</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Ao acessar e usar o site da Pani Di Grano, você concorda em cumprir estes Termos de Uso, 
                  todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, 
                  está proibido de usar ou acessar este site.
                </p>
              </div>

              {/* Seção 2 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-6 w-6 text-secondary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">2. Licença de Uso</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  É concedida permissão para baixar temporariamente uma cópia dos materiais 
                  (informações ou software) no site da Pani Di Grano apenas para visualização 
                  transitória pessoal e não comercial.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Esta é a concessão de uma licença, não uma transferência de título, e sob esta licença você não pode:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
                  <li>Modificar ou copiar os materiais;</li>
                  <li>Usar os materiais para qualquer finalidade comercial;</li>
                  <li>Tentar descompilar ou fazer engenharia reversa de qualquer software;</li>
                  <li>Remover quaisquer direitos autorais ou outras notações de propriedade.</li>
                </ul>
              </div>

              {/* Seção 3 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-secondary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">3. Isenção de responsabilidade</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Os materiais no site da Pani Di Grano são fornecidos "como estão". A Pani Di Grano 
                  não oferece garantias, expressas ou implícitas, e, por este meio, nega e anula todas 
                  as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de 
                  comercialização, adequação a um fim específico ou não violação de propriedade intelectual.
                </p>
              </div>

              {/* Seção 4 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-secondary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">4. Limitações</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Em nenhum caso a Pani Di Grano ou seus fornecedores serão responsáveis por quaisquer danos 
                  (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos 
                  negócios) decorrentes do uso ou da incapacidade de usar os materiais em seu site, 
                  mesmo que a Pani Di Grano ou um representante autorizado tenha sido notificado oralmente 
                  ou por escrito da possibilidade de tais danos.
                </p>
              </div>

              {/* Última atualização */}
              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermosUso;