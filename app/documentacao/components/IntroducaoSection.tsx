'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MdCheckCircle, MdSecurity, MdRestaurant, MdEvent, MdQrCodeScanner } from 'react-icons/md';

export default function IntroducaoSection() {
  const features = [
    {
      icon: MdRestaurant,
      title: 'Gerenciamento de Cardápio',
      description: 'Crie, edite e organize seu menu completo com categorias, subcategorias e imagens',
      color: 'text-orange-600'
    },
    {
      icon: MdEvent,
      title: 'Visualização de Eventos',
      description: 'Acompanhe eventos programados e detalhes dos clientes',
      color: 'text-purple-600'
    },
    {
      icon: MdQrCodeScanner,
      title: 'Scanner QR Code',
      description: 'Faça check-in de clientes e gerencie presença em eventos',
      color: 'text-indigo-600'
    },
    {
      icon: MdSecurity,
      title: 'Segurança Total',
      description: 'Acesso restrito apenas aos dados do seu estabelecimento',
      color: 'text-green-600'
    }
  ];

  const userTypes = [
    {
      name: 'Seu Justino',
      email: 'analista@seujustino.com',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      name: 'Oh Fregues',
      email: 'analista@ohfregues.com',
      color: 'bg-green-100 text-green-800'
    },
    {
      name: 'HighLine',
      email: 'analista@highline.com',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      name: 'Pracinha do Seu Justino',
      email: 'analista@pracinha.com',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      name: 'Reserva Rooftop',
      email: 'analista@reserva.com',
      color: 'bg-pink-100 text-pink-800'
    }
  ];

  return (
    <section id="introducao" className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🎯 Bem-vindo ao Sistema Agilizaiapp
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Como <strong>Promoter</strong>, você tem acesso a funcionalidades específicas para gerenciar 
            o cardápio e operações do seu estabelecimento de forma profissional e segura.
          </p>
        </div>

        {/* What is this system */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MdCheckCircle className="text-green-600 mr-3" size={28} />
            O que é este sistema?
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-700 mb-4">
                O <strong>Agilizaiapp</strong> é uma plataforma completa para gerenciamento de 
                estabelecimentos gastronômicos, eventos e reservas. Como Promoter, você tem acesso 
                controlado às funcionalidades específicas do seu estabelecimento.
              </p>
              <p className="text-gray-700">
                O sistema foi desenvolvido para ser <strong>intuitivo, seguro e eficiente</strong>, 
                permitindo que você foque no que realmente importa: oferecer a melhor experiência 
                para seus clientes.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Interface moderna e responsiva</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Sistema de permissões avançado</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Upload e gerenciamento de imagens</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Organização inteligente do cardápio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className={`p-3 rounded-lg bg-gray-100`}>
                  <feature.icon className={feature.color} size={24} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">{feature.title}</h4>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* User Access */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🔐 Acesso e Usuários
          </h3>
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-4">
              Cada estabelecimento possui um usuário <strong>Promoter</strong> específico com acesso 
              restrito apenas aos dados do seu bar.
            </p>
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
              <MdSecurity size={20} />
              <span className="font-medium">Senha padrão: ********</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTypes.map((user, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg p-4 shadow-md border border-gray-200"
              >
                <div className="text-center">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${user.color}`}>
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-600 font-mono break-all">
                    {user.email}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-12 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🚀 Como Começar
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Faça Login</h4>
              <p className="text-gray-600 text-sm">
                Use seu email específico e a senha padrão para acessar o sistema
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Verifique o Estabelecimento</h4>
              <p className="text-gray-600 text-sm">
                Confirme se está visualizando os dados corretos do seu bar
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Comece a Organizar</h4>
              <p className="text-gray-600 text-sm">
                Crie categorias e adicione itens para estruturar seu cardápio
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Agora que você entendeu o básico, vamos explorar cada funcionalidade em detalhes!
          </p>
          <div className="inline-flex items-center space-x-2 text-blue-600 font-medium">
            <span>Continue navegando pela documentação</span>
            <span>↓</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}


