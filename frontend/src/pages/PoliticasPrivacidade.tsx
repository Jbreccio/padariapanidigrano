import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, Database, Users, Shield, FileCheck } from "lucide-react";

const PoliticasPrivacidade = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header onLoginClick={() => navigate("/auth")} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-secondary mb-4">
              Políticas de Privacidade
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Saiba como protegemos e utilizamos suas informações pessoais.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-card rounded-2xl border border-border p-8">
            <div className="space-y-8">
              {/* Seção 1 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="h-6 w-6 text-secondary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">1. Coleta de Informações</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Coletamos informações que você nos fornece diretamente, como nome, e-mail, telefone e endereço 
                  quando você faz um pedido, se cadastra em nosso site ou entra em contato conosco. Também coletamos 
                  automaticamente informações sobre seu dispositivo e como você interage com nosso site.
                </p>
              </div>

              {/* Seção 2 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-6 w-6 text-secondary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">2. Uso das Informações</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  Utilizamos suas informações para:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Processar e entregar seus pedidos</li>
                  <li>Comunicar sobre seu pedido (confirmação, atualizações, etc.)</li>
                  <li>Melhorar nossos produtos e serviços</li>
                  <li>Enviar ofertas e novidades (com seu consentimento)</li>
                  <li>Responder suas dúvidas e solicitações</li>
                </ul>
              </div>

              {/* Seção 3 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-6 w-6 text-secondary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">3. Compartilhamento de Dados</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros sem o seu 
                  consentimento, exceto quando necessário para a entrega do seu pedido (como compartilhar seu 
                  endereço com a transportadora) ou quando exigido por lei.
                </p>
              </div>

              {/* Seção 4 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="h-6 w-6 text-secondary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">4. Segurança dos Dados</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Implementamos medidas de segurança para proteger suas informações pessoais contra acesso não 
                  autorizado, alteração, divulgação ou destruição. Utilizamos criptografia SSL para transmissão 
                  segura de dados e armazenamos suas informações em servidores seguros.
                </p>
              </div>

              {/* Seção 5 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">5. Seus Direitos</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  Você tem o direito de:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Acessar suas informações pessoais</li>
                  <li>Corrigir informações incorretas ou desatualizadas</li>
                  <li>Solicitar a exclusão de seus dados</li>
                  <li>Cancelar o recebimento de comunicações promocionais</li>
                </ul>
              </div>

              {/* Seção 6 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FileCheck className="h-6 w-6 text-secondary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">6. Cookies</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizamos cookies para melhorar sua experiência em nosso site, lembrar suas preferências e 
                  analisar o tráfego. Você pode optar por desabilitar os cookies nas configurações do seu navegador, 
                  mas isso pode afetar o funcionamento de algumas funcionalidades.
                </p>
              </div>

              {/* Seção 7 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FileCheck className="h-6 w-6 text-secondary" />
                  <h2 className="font-display text-2xl font-bold text-foreground">7. Alterações nesta Política</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos atualizar esta política de privacidade periodicamente. Recomendamos que você revise 
                  esta página regularmente para ficar ciente de quaisquer alterações. A data da última atualização 
                  será sempre exibida no final desta página.
                </p>
              </div>

              {/* Seção 8 - Contato */}
              <div className="pt-6 border-t border-border">
                <h3 className="font-display text-xl font-bold text-foreground mb-3">Contato</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  Se você tiver dúvidas sobre esta política de privacidade, entre em contato conosco:
                </p>
                <ul className="text-muted-foreground">
                  <li>Email: panibolosepaes@gmail.com</li>
                  <li>WhatsApp: (11) 94056-6647</li>
                  <li>Telefone: (11) 2379-7077</li>
                </ul>
              </div>

              {/* Última atualização */}
              <div className="pt-4 border-t border-border">
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

export default PoliticasPrivacidade;