import React from "react";
import { MdGavel, MdSecurity, MdPrivacyTip, MdInfo } from "react-icons/md";

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Termos de Uso</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Conheça os termos e condições que regem o uso do Agilizaí App
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
              Estes termos foram atualizados pela última vez em <strong>26 de fevereiro de 2025</strong>.
            </p>
          </div>

          {/* Terms Content */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <MdGavel className="text-yellow-500" />
                1. Introdução
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Bem-vindo ao Agilizaí App. Estes Termos de Uso (&ldquo;Termos&rdquo;) regem o uso do nosso serviço 
                  de agendamento de reservas em estabelecimentos. Ao acessar ou usar o Agilizaí App, 
                  você concorda em cumprir estes Termos.
                </p>
                <p>
                  O Agilizaí App é uma plataforma que conecta usuários a estabelecimentos parceiros, 
                  facilitando o processo de reservas online. Nossos serviços incluem, mas não se limitam a, 
                  busca de estabelecimentos, agendamento de reservas, e sistema de avaliações.
                </p>
              </div>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Cadastro de Conta</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Para usar nossos serviços, você deve criar uma conta fornecendo informações precisas, 
                  completas e atualizadas. Você é responsável por:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Manter a confidencialidade de suas credenciais de login</li>
                  <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
                  <li>Ser responsável por todas as atividades que ocorrem em sua conta</li>
                  <li>Ter pelo menos 18 anos de idade ou ter autorização de um responsável legal</li>
                </ul>
              </div>
            </section>

            {/* Use of Service */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Uso do Serviço</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Você concorda em usar o Agilizaí App apenas para propósitos legais e de acordo com estes Termos. 
                  Você não deve:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Usar o serviço para atividades ilegais ou fraudulentas</li>
                  <li>Interferir na operação do sistema ou na experiência de outros usuários</li>
                  <li>Tentar acessar áreas restritas do sistema</li>
                  <li>Transmitir vírus, malware ou código malicioso</li>
                  <li>Fazer reservas falsas ou usar informações fraudulentas</li>
                  <li>Violar direitos de propriedade intelectual</li>
                </ul>
              </div>
            </section>

            {/* Reservations */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Sistema de Reservas</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  O Agilizaí App facilita o agendamento de reservas, mas não garante a disponibilidade 
                  de mesas. Você reconhece que:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>As reservas estão sujeitas à disponibilidade do estabelecimento</li>
                  <li>Políticas de cancelamento podem variar entre estabelecimentos</li>
                  <li>É sua responsabilidade chegar no horário agendado</li>
                  <li>Estabelecimentos podem modificar ou cancelar reservas em circunstâncias excepcionais</li>
                  <li>O Agilizaí App atua como intermediário e não é responsável por disputas com estabelecimentos</li>
                </ul>
              </div>
            </section>

            {/* Privacy and Data */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <MdPrivacyTip className="text-blue-500" />
                5. Privacidade e Dados
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Sua privacidade é importante para nós. O uso de suas informações pessoais é regido 
                  pela nossa Política de Privacidade, que faz parte destes Termos.
                </p>
                <p>
                  Você concorda que podemos coletar, usar e compartilhar suas informações conforme 
                  descrito na Política de Privacidade, incluindo:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Informações de cadastro e perfil</li>
                  <li>Histórico de reservas e preferências</li>
                  <li>Dados de uso da plataforma</li>
                  <li>Comunicações com estabelecimentos e suporte</li>
                </ul>
              </div>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <MdSecurity className="text-green-500" />
                6. Segurança
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Implementamos medidas de segurança para proteger suas informações, mas você também 
                  tem responsabilidades:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Manter suas credenciais de login seguras</li>
                  <li>Não compartilhar sua conta com terceiros</li>
                  <li>Fazer logout ao usar dispositivos compartilhados</li>
                  <li>Notificar-nos sobre atividades suspeitas</li>
                </ul>
              </div>
            </section>

            {/* Payments */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Pagamentos</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  O uso do Agilizaí App é gratuito para usuários. Você paga apenas pelos serviços 
                  dos estabelecimentos conforme acordado diretamente com eles.
                </p>
                <p>
                  Para estabelecimentos parceiros, podem ser aplicadas taxas de comissão conforme 
                  contratos específicos.
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Propriedade Intelectual</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  O Agilizaí App e todo seu conteúdo são protegidos por direitos autorais, marcas 
                  registradas e outras leis de propriedade intelectual. Você não pode:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Copiar, modificar ou distribuir nosso conteúdo sem autorização</li>
                  <li>Usar nossas marcas ou logos sem permissão</li>
                  <li>Engenheirar reversamente nosso software</li>
                  <li>Remover avisos de direitos autorais ou propriedade</li>
                </ul>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Limitação de Responsabilidade</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  O Agilizaí App é fornecido &ldquo;como está&rdquo; e &ldquo;conforme disponível&rdquo;. Em nenhuma circunstância 
                  seremos responsáveis por:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Danos indiretos, incidentais ou consequenciais</li>
                  <li>Perda de lucros, dados ou oportunidades de negócio</li>
                  <li>Disputas entre usuários e estabelecimentos</li>
                  <li>Interrupções no serviço ou perda de dados</li>
                  <li>Ações de terceiros ou estabelecimentos parceiros</li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Rescisão</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Podemos suspender ou encerrar sua conta a qualquer momento, com ou sem aviso prévio, 
                  se você violar estes Termos. Você também pode encerrar sua conta a qualquer momento.
                </p>
                <p>
                  Após a rescisão, suas informações podem ser mantidas conforme nossa Política de Privacidade 
                  e obrigações legais.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Alterações nos Termos</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações 
                  significativas serão comunicadas através do aplicativo ou por e-mail.
                </p>
                <p>
                  O uso continuado do serviço após as alterações constitui aceitação dos novos Termos.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">12. Lei Aplicável</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Estes Termos são regidos pelas leis do Brasil. Qualquer disputa será resolvida 
                  nos tribunais competentes de São Paulo, SP.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">13. Contato</h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Se você tiver dúvidas sobre estes Termos, entre em contato conosco:
                </p>
                <ul className="list-none space-y-2 ml-4">
                  <li><strong>E-mail:</strong> legal@agilizai.com.br</li>
                  <li><strong>Telefone:</strong> +55 11 9999-9999</li>
                  <li><strong>Endereço:</strong> R. Heitor de Morais, 87 - Pacaembu, São Paulo - SP</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Contact Section */}
          <div className="mt-8 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dúvidas sobre os Termos?</h2>
            <p className="text-gray-600 mb-6">
              Nossa equipe jurídica está disponível para esclarecer qualquer dúvida sobre estes termos
            </p>
            <a
              href="/contato"
              className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Entre em Contato
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 