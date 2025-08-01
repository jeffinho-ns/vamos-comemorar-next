import React from "react";
import { MdSearch, MdCalendarToday, MdCheckCircle, MdStar, MdSecurity, MdSupport } from "react-icons/md";

export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Como Funciona</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Descubra como o Agilizaí App simplifica o processo de reservas e 
            conecta você aos melhores estabelecimentos
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Step by Step Process */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Processo Simples em 4 Passos</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdSearch className="text-white text-3xl" />
                </div>
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Busque</h3>
              <p className="text-gray-600">
                Explore nossa lista de estabelecimentos parceiros e encontre o local perfeito para sua comemoração
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdCalendarToday className="text-white text-3xl" />
                </div>
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Agende</h3>
              <p className="text-gray-600">
                Escolha a data, horário e número de pessoas. Confirme sua reserva em poucos cliques
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="bg-gradient-to-r from-green-500 to-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdCheckCircle className="text-white text-3xl" />
                </div>
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Confirme</h3>
              <p className="text-gray-600">
                Receba a confirmação por e-mail e SMS. Sua mesa estará garantida no horário escolhido
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdStar className="text-white text-3xl" />
                </div>
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Avalie</h3>
              <p className="text-gray-600">
                Após sua visita, avalie sua experiência e ajude outros usuários a escolherem o melhor local
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Por que escolher o Agilizaí App?</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdSearch className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Busca Inteligente</h3>
              <p className="text-gray-600">
                Encontre estabelecimentos por localização, tipo de culinária, avaliações e muito mais
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-green-500 to-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdCalendarToday className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Reservas Instantâneas</h3>
              <p className="text-gray-600">
                Confirme sua reserva em tempo real, sem necessidade de ligações ou esperas
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdSecurity className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Segurança Total</h3>
              <p className="text-gray-600">
                Suas informações estão protegidas com a mais alta tecnologia de segurança
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdStar className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Avaliações Reais</h3>
              <p className="text-gray-600">
                Leia avaliações autênticas de outros usuários para fazer a melhor escolha
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-red-500 to-red-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdSupport className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Suporte 24/7</h3>
              <p className="text-gray-600">
                Nossa equipe está sempre disponível para ajudar você com qualquer dúvida
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdCheckCircle className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Gratuito</h3>
              <p className="text-gray-600">
                Use nossa plataforma gratuitamente. Você paga apenas o valor da reserva
              </p>
            </div>
          </div>
        </div>

        {/* How it works for Users */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Para Usuários</h2>
            
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Crie sua conta gratuitamente</h3>
                  <p className="text-gray-600">
                    Cadastre-se em menos de 2 minutos com seu e-mail ou redes sociais. 
                    Não há taxas de cadastro ou mensalidades.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Explore estabelecimentos</h3>
                  <p className="text-gray-600">
                    Navegue por nossa lista de estabelecimentos parceiros, veja fotos, 
                    avaliações, menus e informações detalhadas.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Faça sua reserva</h3>
                  <p className="text-gray-600">
                    Escolha data, horário e número de pessoas. Confirme sua reserva 
                    e receba a confirmação instantaneamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Aproveite sua experiência</h3>
                  <p className="text-gray-600">
                    Chegue no horário agendado e aproveite sua comemoração. 
                    Após a visita, avalie sua experiência.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works for Establishments */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Para Estabelecimentos</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Benefícios da Parceria</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Aumento na visibilidade e alcance</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Gestão eficiente de reservas</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Relatórios detalhados de performance</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Suporte dedicado da nossa equipe</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Processo de Integração</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Cadastro e validação do estabelecimento</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Configuração do sistema de reservas</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Treinamento da equipe</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Início das operações</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Pronto para começar?</h2>
            <p className="text-gray-600 mb-8">
              Junte-se a milhares de usuários que já descobriram a facilidade de fazer reservas com o Agilizaí App
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Criar Conta Grátis
              </a>
              <a
                href="/tutoriais"
                className="bg-white hover:bg-gray-50 text-gray-800 px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg border border-gray-200"
              >
                Ver Tutoriais
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 