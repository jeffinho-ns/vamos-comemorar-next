'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MdRestaurant,
  MdEvent,
  MdEditCalendar,
  MdQrCodeScanner,
  MdSecurity,
  MdHelp,
  MdMenu,
  MdClose,
  MdSearch,
  MdHome,
  MdArrowBack,
} from 'react-icons/md';
import Link from 'next/link';
import IntroducaoSection from './components/IntroducaoSection';
import AcessoSection from './components/AcessoSection';
import CardapioSection from './components/CardapioSection';

export default function DocumentacaoPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const sections = [
    {
      id: 'introducao',
      title: '🎯 Introdução',
      icon: MdHome,
      description: 'Bem-vindo ao sistema AgilizaiApp',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'acesso',
      title: '🔐 Acesso e Segurança',
      icon: MdSecurity,
      description: 'Credenciais e permissões',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'cardapio',
      title: '🍽️ Gerenciamento de Cardápio',
      icon: MdRestaurant,
      description: 'Como gerenciar seu menu completo',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'eventos',
      title: '🎉 Eventos',
      icon: MdEvent,
      description: 'Gerenciar eventos do estabelecimento',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'reservas',
      title: '📅 Reservas',
      icon: MdEditCalendar,
      description: 'Sistema de reservas e agendamentos',
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'qrcode',
      title: '📱 Scanner QR Code',
      icon: MdQrCodeScanner,
      description: 'Check-in e presença em eventos',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'dicas',
      title: '💡 Dicas e Boas Práticas',
      icon: MdHelp,
      description: 'Como otimizar seu uso do sistema',
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 'suporte',
      title: '📞 Suporte e Contato',
      icon: MdHelp,
      description: 'Como obter ajuda e resolver problemas',
      color: 'from-red-500 to-red-600'
    }
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <MdMenu size={24} />
              </button>
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <MdArrowBack size={20} />
                <span>Voltar ao Sistema</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">📚 Documentação</h1>
              <div className="hidden md:block text-sm text-gray-500">
                Sistema Agilizaiapp
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Navegação</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <MdClose size={20} />
            </button>
          </div>
          
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar na documentação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
            {filteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="w-full text-left flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
              >
                <section.icon size={20} className="text-gray-500" />
                <div>
                  <div className="font-medium">{section.title}</div>
                  <div className="text-sm text-gray-500">{section.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                📚 Documentação Completa
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Manual completo para Promoters do sistema Agilizaiapp
              </p>
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                <MdSecurity size={20} />
                <span className="font-medium">Acesso Restrito - Apenas Promoters</span>
              </div>
            </motion.div>

            {/* Quick Start */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Início Rápido</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">Para começar:</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Faça login com seu email específico</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Verifique se está no estabelecimento correto</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Comece criando categorias para seu menu</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">Funcionalidades principais:</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center space-x-2">
                      <MdRestaurant className="text-orange-500" size={16} />
                      <span>Gerenciar cardápio completo</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <MdEvent className="text-purple-500" size={16} />
                      <span>Visualizar eventos</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <MdQrCodeScanner className="text-indigo-500" size={16} />
                      <span>Scanner QR Code</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Sections Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredSections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => scrollToSection(section.id)}
                >
                  <div className={`h-2 bg-gradient-to-r ${section.color}`}></div>
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${section.color} text-white`}>
                        <section.icon size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{section.description}</p>
                    <div className="inline-flex items-center space-x-2 text-blue-600 font-medium">
                      <span>Clique para ler</span>
                      <span>→</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Content Sections */}
            <IntroducaoSection />
            <AcessoSection />
            <CardapioSection />

            {/* Placeholder for remaining sections */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">🚧 Em Construção</h3>
                <p className="text-gray-600 mb-4">
                  As próximas seções estão sendo desenvolvidas e estarão disponíveis em breve!
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Próximas seções:</h4>
                    <ul className="space-y-1 text-gray-600 text-sm">
                      <li>• 🎉 Eventos</li>
                      <li>• 📅 Reservas</li>
                      <li>• 📱 Scanner QR Code</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Funcionalidades:</h4>
                    <ul className="space-y-1 text-gray-600 text-sm">
                      <li>• 💡 Dicas e Boas Práticas</li>
                      <li>• 📞 Suporte e Contato</li>
                      <li>• 🔍 Guias passo a passo</li>
                      <li>• 📱 Screenshots e vídeos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-center mt-16 pt-8 border-t border-gray-200"
            >
              <p className="text-gray-500">
                📚 Documentação do Sistema Agilizaiapp - Versão 1.0
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Última atualização: Agosto 2025
              </p>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
