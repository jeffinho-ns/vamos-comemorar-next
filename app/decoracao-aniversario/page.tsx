'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaBirthdayCake, FaGift, FaGlassCheers, FaPalette, FaInfoCircle, FaArrowRight } from 'react-icons/fa';
import { useGoogleAnalytics } from '../hooks/useGoogleAnalytics';

export default function DecoracaoAniversarioPage() {
  const [activeTab, setActiveTab] = useState('como-funciona');
  const { trackPageView } = useGoogleAnalytics();

  useEffect(() => {
    trackPageView('Decoração de Aniversário', '/decoracao-aniversario');
  }, [trackPageView]);

  const decorationOptions = [
    { name: 'Decoração Pequena 1', price: 200.00, image: '/agilizai/kit-1.jpg', description: 'Kit básico com painel, balões e acessórios para festas íntimas', includes: ['Painel decorativo', 'Balões coloridos', 'Bandeja de doces', 'Acessórios básicos'] },
    { name: 'Decoração Pequena 2', price: 220.00, image: '/agilizai/kit-2.jpg', description: 'Kit pequeno com tema personalizado e elementos especiais', includes: ['Painel temático', 'Balões especiais', 'Bandeja decorada', 'Acessórios temáticos'] },
    { name: 'Decoração Média 3', price: 250.00, image: '/agilizai/kit-3.jpg', description: 'Kit médio com mais elementos e decoração elaborada', includes: ['Painel grande', 'Balões em quantidade', 'Bandejas decoradas', 'Acessórios variados'] },
    { name: 'Decoração Média 4', price: 270.00, image: '/agilizai/kit-4.jpg', description: 'Kit médio premium com elementos exclusivos', includes: ['Painel premium', 'Balões especiais', 'Bandejas exclusivas', 'Acessórios premium'] },
    { name: 'Decoração Grande 5', price: 300.00, image: '/agilizai/kit-5.jpg', description: 'Kit grande para festas com muitos convidados', includes: ['Painel grande', 'Muitos balões', 'Várias bandejas', 'Acessórios completos'] },
    { name: 'Decoração Grande 6', price: 320.00, image: '/agilizai/kit-6.jpg', description: 'Kit grande premium com decoração luxuosa', includes: ['Painel luxuoso', 'Balões premium', 'Bandejas especiais', 'Acessórios exclusivos'] }
  ];

  const barOptions = [
    { name: 'Seu Justino', location: 'Centro da cidade' },
    { name: 'Oh Fregues', location: 'Zona sul' },
    { name: 'HighLine', location: 'Zona norte' },
    { name: 'Pracinha do Seu Justino', location: 'Centro histórico' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative h-80 sm:h-96"> {/* AJUSTE RESPONSIVO */}
        <Image
          src="/agilizai/niver.jpeg"
          alt="Decoração de Aniversário"
          fill
          sizes="100vw"
          className="absolute z-0 object-cover"
          priority
          unoptimized={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-70"></div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white px-4"> {/* Adicionado padding para segurança */}
            <FaBirthdayCake className="text-5xl sm:text-6xl mx-auto mb-4" /> {/* AJUSTE RESPONSIVO */}
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Decoração de Aniversário</h1> {/* AJUSTE RESPONSIVO */}
            <p className="text-lg sm:text-xl">Transforme sua festa em um momento mágico!</p> {/* AJUSTE RESPONSIVO */}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* AJUSTE RESPONSIVO: Adicionado overflow-x-auto e ajustado o espaçamento */}
          <nav className="flex space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'como-funciona', label: 'Como Funciona', icon: FaInfoCircle },
              { id: 'opcoes', label: 'Opções', icon: FaPalette },
              { id: 'bares', label: 'Bares', icon: FaGlassCheers },
              { id: 'precos', label: 'Preços', icon: FaGift }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  /* AJUSTE RESPONSIVO: Adicionado whitespace-nowrap para não quebrar o texto do botão */
                  className={`py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-slate-300 hover:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className="text-base sm:text-lg" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Como Funciona */}
        {activeTab === 'como-funciona' && (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Como Funciona o Aluguel</h2> {/* AJUSTE RESPONSIVO */}
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
                Nosso serviço transforma qualquer espaço em uma festa mágica e personalizada.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Cards de como funciona (já são responsivos por padrão) */}
              <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700 text-center flex flex-col">
                <div className="bg-orange-500 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 flex-shrink-0">
                  <FaPalette className="text-xl sm:text-2xl text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">1. Escolha sua Decoração</h3>
                <p className="text-slate-300 text-sm sm:text-base">
                  Selecione entre nossos kits de decoração, com diferentes estilos e preços.
                </p>
              </div>

              <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700 text-center flex flex-col">
                <div className="bg-orange-500 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 flex-shrink-0">
                  <FaGift className="text-xl sm:text-2xl text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">2. Personalize seu Painel</h3>
                <p className="text-slate-300 text-sm sm:text-base">
                  Use um painel do nosso estoque ou crie um personalizado com seu tema e frase.
                </p>
              </div>

              <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700 text-center flex flex-col sm:col-span-2 lg:col-span-1">
                <div className="bg-orange-500 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 flex-shrink-0">
                  <FaGlassCheers className="text-xl sm:text-2xl text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">3. Adicione Extras</h3>
                <p className="text-slate-300 text-sm sm:text-base">
                  Complemente com bebidas, comidas e uma lista de presentes para sua festa.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 sm:p-8 rounded-2xl text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">⚠️ Informação Importante</h3>
              <p className="text-white text-base sm:text-lg">
                A decoração é um <strong>ALUGUEL</strong> - você não pode levar os painéis e bandejas,
                apenas os brindes. O valor será adicionado à sua comanda no bar.
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/reserva-aniversario"
                /* AJUSTE RESPONSIVO */
                className="inline-flex items-center px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl"
              >
                Quero Fazer Minha Reserva
                <FaArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        )}
        
        {/* Outras abas (Opções, Bares, Preços) */}
        {/* O código delas já usa grids responsivos e deve funcionar bem. */}
        {/* Apenas ajustei os títulos principais para responsividade. */}

        {/* Opções de Decoração */}
        {activeTab === 'opcoes' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Opções de Decoração</h2> {/* AJUSTE RESPONSIVO */}
              <p className="text-lg sm:text-xl text-slate-300">
                Escolha o kit que melhor se adapta ao seu evento e orçamento
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {decorationOptions.map((option, index) => (
                <div key={index} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-orange-500 transition-all hover:shadow-2xl hover:shadow-orange-500/20 flex flex-col">
                  <div className="h-48 sm:h-56 relative overflow-hidden flex-shrink-0">
                    <Image 
                      src={option.image} 
                      alt={option.name} 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                      className="object-cover transition-transform hover:scale-110"
                      unoptimized={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="p-4 sm:p-6 flex flex-col flex-grow">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{option.name}</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-500 mb-3 sm:mb-4">R$ {option.price.toFixed(2)}</p>
                    <p className="text-slate-300 mb-4 text-sm sm:text-base flex-grow">{option.description}</p>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-white">Inclui:</p>
                      <ul className="text-xs sm:text-sm text-slate-300 space-y-1">
                        {option.includes.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nossos Bares */}
        {activeTab === 'bares' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Nossos Bares Parceiros</h2> {/* AJUSTE RESPONSIVO */}
              <p className="text-lg sm:text-xl text-slate-300">
                Escolha o local perfeito para sua celebração
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {barOptions.map((bar, index) => (
                <div key={index} className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700 hover:border-orange-500 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaGlassCheers className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">{bar.name}</h3>
                      <p className="text-slate-300">{bar.location}</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-slate-300 mb-4">
                      Ambiente acolhedor e preparado para receber sua festa com toda a infraestrutura necessária.
                    </p>
                    <div className="flex items-center text-orange-500 font-semibold cursor-pointer">
                      <span>Ver localização</span>
                      <FaArrowRight className="ml-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preços e Custos */}
        {activeTab === 'precos' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Preços e Custos</h2> {/* AJUSTE RESPONSIVO */}
              <p className="text-lg sm:text-xl text-slate-300">
                Transparência total sobre o que você vai pagar
              </p>
            </div>

            <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-6">💰 Como Funciona o Pagamento</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Decoração Base</h4>
                    <p className="text-slate-300">
                      O valor da decoração escolhida (R$ 200,00 a R$ 320,00) é o custo base do aluguel.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Extras Opcionais</h4>
                    <p className="text-slate-300">
                      Bebidas e comidas são adicionados ao valor total e cobrados separadamente.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Cobrança na Comanda</h4>
                    <p className="text-slate-300">
                      Todo o valor será adicionado à sua comanda no bar, facilitando o pagamento.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 p-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                <h4 className="text-xl font-bold text-white mb-4">💡 Dica Importante</h4>
                <p className="text-white">
                  O painel <strong>não tem custo adicional</strong> - já está incluso no valor da decoração!
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/reserva-aniversario"
                /* AJUSTE RESPONSIVO */
                className="inline-flex items-center px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl"
              >
                Fazer Minha Reserva Agora
                <FaArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}