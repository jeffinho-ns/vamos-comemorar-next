import React from "react";
import { MdSecurity, MdDataUsage, MdShield, MdInfo, MdDelete } from "react-icons/md";

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Saiba como protegemos e utilizamos suas informações pessoais no Agilizaí App
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Last Updated */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <MdInfo className="text-blue-500 text-2xl" />
              <h2 className="text-2xl font-bold text-gray-800">Última Atualização</h2>
            </div>
            <p className="text-gray-600">
              Esta política foi atualizada pela última vez em <strong>26 de fevereiro de 2025</strong>.
            </p>
          </div>

          {/* Privacy Content */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <MdShield className="text-green-500" />
                1. Introdução
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  O Agilizaí App (&ldquo;nós&rdquo;, &ldquo;nosso&rdquo;, &ldquo;a empresa&rdquo;) está comprometido em proteger sua privacidade. 
                  Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas 
                  informações pessoais quando você usa nosso serviço.
                </p>
                <p>
                  Ao usar o Agilizaí App, você concorda com a coleta e uso de informações de acordo com 
                  esta política. Suas informações pessoais são usadas para fornecer e melhorar nossos serviços.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <MdDataUsage className="text-blue-500" />
                2. Informações que Coletamos
              </h2>
              <div className="text-gray-600 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">2.1 Informações Pessoais</h3>
                <p>Coletamos as seguintes informações pessoais:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Nome completo e informações de contato</li>
                  <li>Endereço de e-mail e número de telefone</li>
                  <li>Data de nascimento e informações de identificação</li>
                  <li>Endereço residencial e informações de localização</li>
                  <li>Informações de pagamento (quando aplicável)</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-6">2.2 Informações de Uso</h3>
                <p>Coletamos automaticamente informações sobre como você usa nosso serviço:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Histórico de reservas e preferências</li>
                  <li>Interações com estabelecimentos</li>
                  <li>Dados de navegação e uso do aplicativo</li>
                  <li>Informações do dispositivo e localização</li>
                  <li>Cookies e tecnologias similares</li>
                </ul>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Como Usamos suas Informações</h2>
              <div className="text-gray-600 space-y-4">
                <p>Usamos suas informações pessoais para:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornecer e manter nossos serviços de reserva</li>
                  <li>Processar e confirmar suas reservas</li>
                  <li>Comunicar-se com você sobre reservas e serviços</li>
                  <li>Personalizar sua experiência e recomendações</li>
                  <li>Melhorar nossos serviços e desenvolver novos recursos</li>
                  <li>Enviar notificações e atualizações importantes</li>
                  <li>Prevenir fraudes e garantir a segurança</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                </ul>
              </div>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Compartilhamento de Informações</h2>
              <div className="text-gray-600 space-y-4">
                <p>Podemos compartilhar suas informações nas seguintes situações:</p>
                
                <h3 className="text-lg font-semibold text-gray-800">4.1 Estabelecimentos Parceiros</h3>
                <p>
                  Compartilhamos informações necessárias com estabelecimentos para processar suas reservas, 
                  incluindo nome, número de pessoas e detalhes da reserva.
                </p>

                <h3 className="text-lg font-semibold text-gray-800">4.2 Prestadores de Serviços</h3>
                <p>
                  Trabalhamos com terceiros confiáveis que nos ajudam a operar nosso serviço, como 
                  processadores de pagamento e provedores de hospedagem.
                </p>

                <h3 className="text-lg font-semibold text-gray-800">4.3 Obrigações Legais</h3>
                <p>
                  Podemos divulgar informações quando exigido por lei ou para proteger nossos direitos, 
                  propriedade ou segurança.
                </p>

                <h3 className="text-lg font-semibold text-gray-800">4.4 Consentimento</h3>
                <p>
                  Compartilhamos informações com terceiros apenas com seu consentimento explícito.
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <MdSecurity className="text-green-500" />
                5. Segurança dos Dados
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Implementamos medidas de segurança técnicas e organizacionais para proteger suas 
                  informações pessoais:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Criptografia de dados em trânsito e em repouso</li>
                  <li>Controles de acesso rigorosos</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Backups regulares e seguros</li>
                  <li>Treinamento da equipe em práticas de segurança</li>
                  <li>Auditorias regulares de segurança</li>
                </ul>
                <p>
                  No entanto, nenhum método de transmissão pela internet ou armazenamento eletrônico 
                  é 100% seguro. Embora nos esforcemos para usar meios comercialmente aceitáveis para 
                  proteger suas informações pessoais, não podemos garantir sua segurança absoluta.
                </p>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Retenção de Dados</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os 
                  propósitos descritos nesta política:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Dados de conta: enquanto sua conta estiver ativa</li>
                  <li>Histórico de reservas: por 7 anos para fins fiscais</li>
                  <li>Dados de uso: por 2 anos para melhorias do serviço</li>
                  <li>Logs de segurança: por 1 ano</li>
                </ul>
                <p>
                  Após esses períodos, os dados são excluídos de forma segura ou anonimizados.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Seus Direitos</h2>
              <div className="text-gray-600 space-y-4">
                <p>Você tem os seguintes direitos relacionados aos seus dados pessoais:</p>
                
                <h3 className="text-lg font-semibold text-gray-800">7.1 Acesso e Correção</h3>
                <p>
                  Você pode acessar, corrigir ou atualizar suas informações pessoais através de sua conta 
                  ou entrando em contato conosco.
                </p>

                <h3 className="text-lg font-semibold text-gray-800">7.2 Exclusão</h3>
                <p>
                  Você pode solicitar a exclusão de suas informações pessoais, sujeito a certas exceções 
                  legais e operacionais.
                </p>

                <h3 className="text-lg font-semibold text-gray-800">7.3 Portabilidade</h3>
                <p>
                  Você pode solicitar uma cópia de seus dados pessoais em formato estruturado e legível.
                </p>

                <h3 className="text-lg font-semibold text-gray-800">7.4 Oposição</h3>
                <p>
                  Você pode se opor ao processamento de seus dados pessoais em certas circunstâncias.
                </p>

                <h3 className="text-lg font-semibold text-gray-800">7.5 Revogação de Consentimento</h3>
                <p>
                  Você pode revogar seu consentimento para o processamento de dados a qualquer momento.
                </p>
              </div>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Cookies e Tecnologias de Rastreamento</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Usamos cookies e tecnologias similares para melhorar sua experiência:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Cookies Essenciais:</strong> Necessários para o funcionamento básico do serviço</li>
                  <li><strong>Cookies de Performance:</strong> Para analisar como você usa nosso serviço</li>
                  <li><strong>Cookies de Funcionalidade:</strong> Para lembrar suas preferências</li>
                  <li><strong>Cookies de Marketing:</strong> Para personalizar anúncios (com seu consentimento)</li>
                </ul>
                <p>
                  Você pode controlar o uso de cookies através das configurações do seu navegador.
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Serviços de Terceiros</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Nosso serviço pode conter links para sites de terceiros ou usar serviços de terceiros. 
                  Não somos responsáveis pelas práticas de privacidade desses terceiros.
                </p>
                <p>
                  Recomendamos que você leia as políticas de privacidade de qualquer site de terceiros 
                  que visitar.
                </p>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Privacidade de Menores</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Nosso serviço não é destinado a menores de 18 anos. Não coletamos intencionalmente 
                  informações pessoais de menores de 18 anos.
                </p>
                <p>
                  Se você é pai ou responsável e sabe que seu filho nos forneceu informações pessoais, 
                  entre em contato conosco imediatamente.
                </p>
              </div>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Transferências Internacionais</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Suas informações podem ser transferidas e processadas em países diferentes do seu. 
                  Garantimos que essas transferências são feitas de acordo com as leis de proteção 
                  de dados aplicáveis.
                </p>
              </div>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">12. Alterações nesta Política</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você 
                  sobre mudanças significativas através do aplicativo ou por e-mail.
                </p>
                <p>
                  Recomendamos que você revise esta política regularmente para se manter informado 
                  sobre como protegemos suas informações.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">13. Informações de Contato</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos 
                  suas informações pessoais, entre em contato conosco:
                </p>
                <ul className="list-none space-y-2 ml-4">
                  <li><strong>E-mail:</strong> privacidade@agilizai.com.br</li>
                  <li><strong>Telefone:</strong> +55 11 9999-9999</li>
                  <li><strong>Endereço:</strong> R. Heitor de Morais, 87 - Pacaembu, São Paulo - SP</li>
                  <li><strong>Encarregado de Dados (DPO):</strong> dpo@agilizai.com.br</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Contact Section */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dúvidas sobre Privacidade?</h2>
            <p className="text-gray-600 mb-6">
              Nossa equipe de privacidade está disponível para esclarecer qualquer dúvida sobre o tratamento de seus dados
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contato"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Entre em Contato
              </a>
              <a
                href="mailto:privacidade@agilizai.com.br"
                className="bg-white hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg border border-gray-200"
              >
                E-mail Direto
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 