'use client';

import React from 'react';

export default function ApresentacaoSection() {
  return (
    <div id="apresentacao" className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">🎯 Apresentação Completa dos Projetos</h2>
        <p className="text-xl text-gray-600">
          Visão geral detalhada do sistema Agilizaí App e plataforma administrativa
        </p>
      </div>

      {/* Seção 1: Visão Geral do Sistema */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-lg mr-3">🎯</span>
          O que é o Agilizaí App?
        </h3>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl border border-blue-200 mb-8">
          <div className="text-center mb-6">
            <h4 className="text-2xl font-bold text-blue-900 mb-4">📱 Aplicativo Móvel para Usuários</h4>
            <p className="text-lg text-blue-800 max-w-3xl mx-auto">
              O Agilizaí App é um aplicativo móvel que conecta pessoas a eventos e estabelecimentos da noite. 
              Os usuários podem descobrir eventos, fazer reservas, encontrar bares e restaurantes próximos, 
              e gerenciar suas experiências de entretenimento.
            </p>
          </div>
          
          {/* Mockup do App */}
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <div className="bg-gray-900 rounded-t-lg p-4 flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-8 text-white text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h5 className="text-xl font-bold mb-2">Agilizaí App</h5>
              <p className="text-sm opacity-90">Descubra eventos incríveis</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">🏠</div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-1 bg-gray-100 rounded w-1/2 mt-1"></div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">📅</div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-1 bg-gray-100 rounded w-1/3 mt-1"></div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">📍</div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-1 bg-gray-100 rounded w-2/5 mt-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl border border-green-200">
          <div className="text-center mb-6">
            <h4 className="text-2xl font-bold text-green-900 mb-4">🖥️ Painel Administrativo para Gestão</h4>
            <p className="text-lg text-green-800 max-w-3xl mx-auto">
              O Painel Administrativo é uma plataforma web onde você pode gerenciar todos os aspectos do negócio: 
              estabelecimentos, cardápios, eventos, reservas, usuários e relatórios. É a ferramenta principal 
              para administrar o ecossistema Agilizaí.
            </p>
          </div>
          
          {/* Mockup do Admin */}
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-t-lg p-4 flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="bg-gray-100 p-4 flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">A</div>
              <div className="flex-1">
                <div className="h-2 bg-gray-300 rounded w-1/4"></div>
                <div className="h-1 bg-gray-200 rounded w-1/6 mt-1"></div>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            </div>
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="space-y-2">
                <div className="h-3 bg-blue-200 rounded w-full"></div>
                <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="col-span-3 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-500 text-white p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-xs">Usuários</div>
                  </div>
                  <div className="bg-green-500 text-white p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">52</div>
                    <div className="text-xs">Estabelecimentos</div>
                  </div>
                  <div className="bg-orange-500 text-white p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">3,891</div>
                    <div className="text-xs">Reservas</div>
                  </div>
                  <div className="bg-purple-500 text-white p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">15,420</div>
                    <div className="text-xs">Pontos</div>
                  </div>
                </div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 2: Experiência do Usuário no App */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-2 rounded-lg mr-3">📱</span>
          Como os Usuários Usam o App
        </h3>

        {/* Fluxo de Onboarding */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl border border-purple-200 mb-8">
          <h4 className="text-xl font-bold text-purple-900 mb-6 text-center">🚀 Primeira Experiência - Onboarding</h4>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                <div className="text-4xl mb-3">🎉</div>
                <h5 className="font-semibold text-gray-900 mb-2">Splash Screen</h5>
                <p className="text-sm text-gray-600">Animação de boas-vindas com logo do app</p>
              </div>
              <div className="text-sm text-purple-700 font-medium">1. Primeiro Acesso</div>
            </div>
            <div className="text-center">
              <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                <div className="text-4xl mb-3">🌍</div>
                <h5 className="font-semibold text-gray-900 mb-2">Seleção de Idioma</h5>
                <p className="text-sm text-gray-600">Usuário escolhe entre 4 idiomas disponíveis</p>
              </div>
              <div className="text-sm text-purple-700 font-medium">2. Personalização</div>
            </div>
            <div className="text-center">
              <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                <div className="text-4xl mb-3">🔐</div>
                <h5 className="font-semibold text-gray-900 mb-2">Login/Cadastro</h5>
                <p className="text-sm text-gray-600">Email, Google ou cadastro rápido</p>
              </div>
              <div className="text-sm text-purple-700 font-medium">3. Autenticação</div>
            </div>
          </div>
        </div>

        {/* Telas Principais do App */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">🏠 Tela Principal (Home)</h4>
            <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">🏠</div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="h-2 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="h-2 bg-gray-300 rounded w-2/3 mb-2"></div>
                  <div className="h-1 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>• Lista de eventos em destaque</li>
              <li>• Estabelecimentos próximos</li>
              <li>• Categorias de eventos</li>
              <li>• Busca rápida</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <h4 className="text-lg font-semibold text-green-900 mb-4">🔍 Tela de Busca e Filtros</h4>
            <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">🔍</div>
                <div className="flex-1 bg-gray-100 p-2 rounded">
                  <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-100 p-2 rounded text-center text-xs">📅 Data</div>
                <div className="bg-gray-100 p-2 rounded text-center text-xs">📍 Local</div>
                <div className="bg-gray-100 p-2 rounded text-center text-xs">🎉 Tipo</div>
                <div className="bg-gray-100 p-2 rounded text-center text-xs">💰 Preço</div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded w-full"></div>
                <div className="h-2 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <ul className="space-y-2 text-green-800 text-sm">
              <li>• Filtros por data, localização, categoria</li>
              <li>• Busca por texto livre</li>
              <li>• Resultados em tempo real</li>
              <li>• Ordenação por relevância</li>
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
            <h4 className="text-lg font-semibold text-orange-900 mb-4">📅 Calendário de Eventos</h4>
            <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
              <div className="grid grid-cols-7 gap-1 mb-3">
                <div className="text-center text-xs font-bold text-gray-500">D</div>
                <div className="text-center text-xs font-bold text-gray-500">S</div>
                <div className="text-center text-xs font-bold text-gray-500">T</div>
                <div className="text-center text-xs font-bold text-gray-500">Q</div>
                <div className="text-center text-xs font-bold text-gray-500">Q</div>
                <div className="text-center text-xs font-bold text-gray-500">S</div>
                <div className="text-center text-xs font-bold text-gray-500">S</div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({length: 28}, (_, i) => (
                  <div key={i} className={`h-8 rounded flex items-center justify-center text-xs ${
                    i === 15 ? 'bg-orange-500 text-white' : 'bg-gray-100'
                  }`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
            <ul className="space-y-2 text-orange-800 text-sm">
              <li>• Visualização mensal dos eventos</li>
              <li>• Eventos marcados nos dias</li>
              <li>• Navegação entre meses</li>
              <li>• Toque para ver detalhes</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl border border-pink-200">
            <h4 className="text-lg font-semibold text-pink-900 mb-4">👤 Perfil do Usuário</h4>
            <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">U</div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-pink-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-pink-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-pink-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
            <ul className="space-y-2 text-pink-800 text-sm">
              <li>• Dados pessoais editáveis</li>
              <li>• Histórico de reservas</li>
              <li>• Configurações de notificação</li>
              <li>• Preferências de idioma</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Seção 3: Como Usar o Painel Administrativo */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="bg-gradient-to-r from-green-500 to-green-600 text-white p-2 rounded-lg mr-3">🖥️</span>
          Como Usar o Painel Administrativo
        </h3>

        {/* Acesso e Login */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-xl border border-indigo-200 mb-8">
          <h4 className="text-xl font-bold text-indigo-900 mb-6 text-center">🔐 Acesso ao Sistema</h4>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h5 className="font-semibold text-gray-900 mb-4">👑 Administrador</h5>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm">A</div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Acesso completo a todas as funcionalidades</li>
                  <li>• Gerenciamento de usuários e estabelecimentos</li>
                  <li>• Configurações do sistema</li>
                  <li>• Relatórios globais</li>
                </ul>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h5 className="font-semibold text-gray-900 mb-4">🎯 Promoter</h5>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm">P</div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Gerenciamento do seu estabelecimento</li>
                  <li>• Controle de cardápio e eventos</li>
                  <li>• Visualização de reservas</li>
                  <li>• Relatórios do estabelecimento</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Principal */}
        <div className="mb-8">
          <h4 className="text-xl font-semibold text-gray-900 mb-4">📊 Dashboard - Visão Geral</h4>
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total de Usuários</p>
                    <p className="text-2xl font-bold">1,247</p>
                  </div>
                  <div className="text-3xl">👥</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Estabelecimentos</p>
                    <p className="text-2xl font-bold">52</p>
                  </div>
                  <div className="text-3xl">🏢</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Reservas Totais</p>
                    <p className="text-2xl font-bold">3,891</p>
                  </div>
                  <div className="text-3xl">📅</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Pontos Acumulados</p>
                    <p className="text-2xl font-bold">15,420</p>
                  </div>
                  <div className="text-3xl">⭐</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="h-32 bg-gray-200 rounded"></div>
              <p className="text-sm text-gray-600 mt-2 text-center">Gráficos de performance e tendências</p>
            </div>
          </div>
        </div>

        {/* Principais Funcionalidades do Admin */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">🍽️ Gerenciamento de Cardápio</h4>
            <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">🍽️</div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-gray-100 p-2 rounded flex items-center justify-between">
                  <div className="h-2 bg-gray-300 rounded w-1/3"></div>
                  <div className="w-4 h-4 bg-green-200 rounded"></div>
                </div>
                <div className="bg-gray-100 p-2 rounded flex items-center justify-between">
                  <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                  <div className="w-4 h-4 bg-green-200 rounded"></div>
                </div>
                <div className="bg-gray-100 p-2 rounded flex items-center justify-between">
                  <div className="h-2 bg-gray-300 rounded w-2/5"></div>
                  <div className="w-4 h-4 bg-green-200 rounded"></div>
                </div>
              </div>
            </div>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>• <strong>Estrutura Hierárquica:</strong> Bares → Categorias → Itens</li>
              <li>• <strong>Edição Rápida:</strong> Drag & drop para reordenação</li>
              <li>• <strong>Upload de Imagens:</strong> Múltiplas fotos por item</li>
              <li>• <strong>Preços e Descrições:</strong> Informações detalhadas</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <h4 className="text-lg font-semibold text-green-900 mb-4">📅 Sistema de Reservas</h4>
            <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">📅</div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-blue-100 p-2 rounded text-center text-xs">Reservas</div>
                <div className="bg-orange-100 p-2 rounded text-center text-xs">Passantes</div>
                <div className="bg-purple-100 p-2 rounded text-center text-xs">Lista de Espera</div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded w-full"></div>
                <div className="h-2 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <ul className="space-y-2 text-green-800 text-sm">
              <li>• <strong>Reservas:</strong> Agendamento com data/hora específica</li>
              <li>• <strong>Passantes:</strong> Controle de entrada sem reserva</li>
              <li>• <strong>Lista de Espera:</strong> Fila para estabelecimentos lotados</li>
              <li>• <strong>Relatórios:</strong> Analytics de ocupação</li>
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <h4 className="text-lg font-semibold text-purple-900 mb-4">👥 Gerenciamento de Usuários</h4>
            <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white">👥</div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-purple-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-300 rounded w-1/2 mb-1"></div>
                    <div className="h-1 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-4 h-4 bg-green-200 rounded"></div>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-purple-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-300 rounded w-2/3 mb-1"></div>
                    <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-4 h-4 bg-green-200 rounded"></div>
                </div>
              </div>
            </div>
            <ul className="space-y-2 text-purple-800 text-sm">
              <li>• <strong>Lista Completa:</strong> Todos os usuários cadastrados</li>
              <li>• <strong>Filtros Avançados:</strong> Por status, data, tipo</li>
              <li>• <strong>Perfil Detalhado:</strong> Histórico e atividades</li>
              <li>• <strong>Controle de Acesso:</strong> Ativar/desativar contas</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
            <h4 className="text-lg font-semibold text-orange-900 mb-4">🏢 Gerenciamento de Estabelecimentos</h4>
            <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">🏢</div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-gray-100 p-3 rounded">
                  <div className="h-2 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex space-x-1 mt-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            <ul className="space-y-2 text-orange-800 text-sm">
              <li>• <strong>Cadastro Completo:</strong> Dados, imagens, localização</li>
              <li>• <strong>Horários:</strong> Configuração de funcionamento</li>
              <li>• <strong>Amenities:</strong> Wi-Fi, estacionamento, etc.</li>
              <li>• <strong>Redes Sociais:</strong> Links para Instagram, Facebook</li>
            </ul>
          </div>
        </div>

        {/* Fluxo de Trabalho Típico */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-xl border border-teal-200">
          <h4 className="text-xl font-bold text-teal-900 mb-6 text-center">🔄 Fluxo de Trabalho Típico</h4>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-lg mb-3">
                <div className="text-3xl mb-2">📊</div>
                <h5 className="font-semibold text-gray-900 mb-2">1. Dashboard</h5>
                <p className="text-sm text-gray-600">Ver métricas e status geral</p>
              </div>
              <div className="text-sm text-teal-700 font-medium">Monitoramento</div>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-lg mb-3">
                <div className="text-3xl mb-2">🍽️</div>
                <h5 className="font-semibold text-gray-900 mb-2">2. Cardápio</h5>
                <p className="text-sm text-gray-600">Gerenciar itens e categorias</p>
              </div>
              <div className="text-sm text-teal-700 font-medium">Conteúdo</div>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-lg mb-3">
                <div className="text-3xl mb-2">📅</div>
                <h5 className="font-semibold text-gray-900 mb-2">3. Reservas</h5>
                <p className="text-sm text-gray-600">Controlar agendamentos</p>
              </div>
              <div className="text-sm text-teal-700 font-medium">Operação</div>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-lg mb-3">
                <div className="text-3xl mb-2">📈</div>
                <h5 className="font-semibold text-gray-900 mb-2">4. Relatórios</h5>
                <p className="text-sm text-gray-600">Analisar performance</p>
              </div>
              <div className="text-sm text-teal-700 font-medium">Análise</div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 4: Benefícios para o Negócio */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-2 rounded-lg mr-3">💼</span>
          Benefícios para o Negócio
        </h3>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">📱 Para os Usuários (App)</h4>
            <ul className="space-y-3 text-blue-800">
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                <div>
                  <strong>Descoberta Fácil:</strong> Encontre eventos e estabelecimentos próximos
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                <div>
                  <strong>Reservas Simples:</strong> Agende com poucos toques na tela
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                <div>
                  <strong>Experiência Personalizada:</strong> Interface em 4 idiomas
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                <div>
                  <strong>Informações Completas:</strong> Cardápios, preços, localização
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <h4 className="text-lg font-semibold text-green-900 mb-4">🖥️ Para os Gestores (Admin)</h4>
            <ul className="space-y-3 text-green-800">
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                <div>
                  <strong>Controle Total:</strong> Gerencie cardápios, eventos e reservas
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                <div>
                  <strong>Relatórios Detalhados:</strong> Acompanhe performance e vendas
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                <div>
                  <strong>Interface Intuitiva:</strong> Fácil de usar, mesmo sem conhecimento técnico
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                <div>
                  <strong>Economia de Tempo:</strong> Automação de processos manuais
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Métricas de Sucesso */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-xl text-white">
          <h4 className="text-xl font-bold mb-6 text-center">📊 Resultados Alcançados</h4>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-indigo-100">Reservas Processadas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-indigo-100">Estabelecimentos Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">1,247</div>
              <div className="text-indigo-100">Usuários Cadastrados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 5: Conclusão */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-xl text-white">
        <h3 className="text-2xl font-bold mb-4">🎯 Resumo Executivo</h3>
        <p className="text-lg mb-6 text-indigo-100">
          O Agilizaí App é uma solução completa que conecta usuários a estabelecimentos de entretenimento, 
          oferecendo uma experiência moderna e intuitiva tanto para clientes quanto para gestores.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">📱 App Móvel</h4>
            <ul className="space-y-2 text-indigo-100">
              <li>• Interface amigável e fácil de usar</li>
              <li>• Suporte a 4 idiomas</li>
              <li>• Busca inteligente e filtros avançados</li>
              <li>• Sistema de reservas integrado</li>
              <li>• Integração com mapas e localização</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">🖥️ Painel Administrativo</h4>
            <ul className="space-y-2 text-indigo-100">
              <li>• Dashboard com métricas em tempo real</li>
              <li>• Gerenciamento completo de cardápios</li>
              <li>• Controle de reservas e eventos</li>
              <li>• Relatórios detalhados de performance</li>
              <li>• Interface intuitiva para não-programadores</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <div className="bg-white/20 p-6 rounded-lg">
            <h4 className="text-xl font-bold mb-2">🚀 Próximos Passos</h4>
            <p className="text-indigo-100">
              O sistema está pronto para uso e pode ser facilmente expandido conforme as necessidades do negócio crescem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}