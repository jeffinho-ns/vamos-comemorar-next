'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  MdRestaurant, 
  MdAdd, 
  MdEdit, 
  MdImage, 
  MdCategory, 
  MdList, 
  MdSettings,
  MdCheckCircle,
  MdWarning,
  MdInfo
} from 'react-icons/md';

export default function CardapioSection() {
  const tabs = [
    {
      id: 'estabelecimentos',
      title: '🏢 Estabelecimentos',
      icon: MdRestaurant,
      description: 'Gerenciar dados e imagens do seu bar',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'categorias',
      title: '📂 Categorias',
      icon: MdCategory,
      description: 'Organizar itens em categorias lógicas',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'itens',
      title: '🍕 Itens do Menu',
      icon: MdList,
      description: 'Criar e gerenciar produtos do cardápio',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'edicao-rapida',
      title: '⚡ Edição Rápida',
      icon: MdSettings,
      description: 'Gerenciar subcategorias de forma organizada',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const estabelecimentoFeatures = [
    {
      icon: MdEdit,
      title: 'Editar Dados Básicos',
      description: 'Nome, descrição, endereço e informações de contato',
      allowed: true
    },
    {
      icon: MdImage,
      title: 'Gerenciar Imagens',
      description: 'Logo, imagens de capa e imagem do popup',
      allowed: true
    },
    {
      icon: MdSettings,
      title: 'Configurações de Localização',
      description: 'Latitude, longitude e endereço para mapas',
      allowed: true
    },
    {
      icon: MdAdd,
      title: 'Criar Novo Estabelecimento',
      description: 'Adicionar novos bares ao sistema',
      allowed: false
    }
  ];

  const categoriaSteps = [
    {
      step: 1,
      title: 'Clique em "Adicionar Categoria"',
      description: 'Use o botão com ícone + na aba Categorias',
      icon: MdAdd
    },
    {
      step: 2,
      title: 'Preencha os Campos',
      description: 'Nome da categoria e ordem de exibição',
      icon: MdEdit
    },
    {
      step: 3,
      title: 'Selecione o Estabelecimento',
      description: 'Será preenchido automaticamente com o seu bar',
      icon: MdRestaurant
    },
    {
      step: 4,
      title: 'Clique em "Salvar"',
      description: 'A categoria será criada e aparecerá na lista',
      icon: MdCheckCircle
    }
  ];

  const itemSteps = [
    {
      step: 1,
      title: 'Clique em "Adicionar Item"',
      description: 'Use o botão com ícone + na aba Itens do Menu',
      icon: MdAdd
    },
    {
      step: 2,
      title: 'Preencha Informações Básicas',
      description: 'Nome, descrição, preço e categoria',
      icon: MdEdit
    },
    {
      step: 3,
      title: 'Adicione Imagem do Produto',
      description: 'Upload de foto para o cardápio digital',
      icon: MdImage
    },
    {
      step: 4,
      title: 'Configure Adicionais (Opcional)',
      description: 'Toppings, extras e preços adicionais',
      icon: MdSettings
    },
    {
      step: 5,
      title: 'Salve o Item',
      description: 'O produto aparecerá no seu cardápio',
      icon: MdCheckCircle
    }
  ];

  const imageGuidelines = [
    {
      type: 'Logo',
      size: '200x200 pixels',
      format: 'JPG, PNG',
      usage: 'Cabeçalho e identificação do bar',
      tip: 'Use fundo transparente para melhor resultado'
    },
    {
      type: 'Imagens de Capa',
      size: '1200x600 pixels',
      format: 'JPG, PNG',
      usage: 'Carrossel na página principal',
      tip: 'Máximo de 5 imagens recomendado'
    },
    {
      type: 'Imagem do Popup',
      size: '400x300 pixels',
      format: 'JPG, PNG',
      usage: 'Aparece quando clientes clicam no mapa',
      tip: 'Use imagem representativa do ambiente'
    },
    {
      type: 'Itens do Menu',
      size: '800x600 pixels',
      format: 'JPG, PNG',
      usage: 'Cardápio digital dos produtos',
      tip: 'Fundo neutro para destacar o produto'
    }
  ];

  const bestPractices = [
    {
      category: '📋 Organização',
      tips: [
        'Crie categorias lógicas (Bebidas, Pratos Principais, Sobremesas)',
        'Use subcategorias para detalhar (Carnes: Bovina, Frango, Porco)',
        'Mantenha ordem sequencial (1, 2, 3...) para melhor visualização',
        'Agrupe itens similares na mesma categoria'
      ]
    },
    {
      category: '🖼️ Imagens',
      tips: [
        'Use imagens de boa qualidade e proporções consistentes',
        'Evite imagens muito grandes que podem demorar para carregar',
        'Mantenha fundos neutros para destacar os produtos',
        'Atualize imagens regularmente para manter o cardápio atrativo'
      ]
    },
    {
      category: '💰 Preços',
      tips: [
        'Use vírgula para centavos (ex: 15,50)',
        'Configure adicionais com preços claros',
        'Mantenha preços atualizados e competitivos',
        'Considere criar combos para aumentar o ticket médio'
      ]
    },
    {
      category: '📝 Descrições',
      tips: [
        'Seja claro e objetivo nas descrições',
        'Mencione ingredientes principais e características especiais',
        'Use linguagem atrativa para despertar interesse',
        'Destaque itens veganos, sem glúten ou outras restrições'
      ]
    }
  ];

  return (
    <section id="cardapio" className="py-16 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🍽️ Gerenciamento de Cardápio
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Aprenda a gerenciar completamente o cardápio do seu estabelecimento, desde categorias 
            até itens individuais, com imagens e preços organizados.
          </p>
        </div>

        {/* Overview */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-8 mb-12 border border-orange-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MdRestaurant className="text-orange-600 mr-3" size={28} />
            Visão Geral do Sistema
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                O sistema de cardápio está dividido em <strong>4 abas principais</strong>, cada uma 
                com funcionalidades específicas para organizar e gerenciar seu menu de forma profissional.
              </p>
              <p className="text-gray-700">
                Como <strong>Promoter</strong>, você tem acesso completo para criar, editar e organizar 
                todos os elementos do cardápio do seu estabelecimento, sempre respeitando as restrições 
                de segurança.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MdCheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">4 abas organizadas por funcionalidade</span>
              </div>
              <div className="flex items-center space-x-3">
                <MdCheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Upload e gerenciamento de imagens</span>
              </div>
              <div className="flex items-center space-x-3">
                <MdCheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Sistema de categorias e subcategorias</span>
              </div>
              <div className="flex items-center space-x-3">
                <MdCheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Controle completo de preços e descrições</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tabs.map((tab, index) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200"
            >
              <div className={`h-2 bg-gradient-to-r ${tab.color}`}></div>
              <div className="p-6 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${tab.color} text-white rounded-full mx-auto mb-4`}>
                  <tab.icon size={32} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{tab.title}</h4>
                <p className="text-gray-600 text-sm">{tab.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Estabelecimentos Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MdRestaurant className="text-blue-600 mr-3" size={28} />
            🏢 Gerenciando seu Estabelecimento
          </h3>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-gray-700 mb-4">
                Na aba <strong>Estabelecimentos</strong>, você pode visualizar e editar as informações 
                básicas do seu bar, incluindo dados de contato, localização e imagens.
              </p>
              <p className="text-gray-700">
                <strong>⚠️ Importante:</strong> Você só pode editar o estabelecimento ao qual está 
                associado. Não é possível criar novos estabelecimentos ou acessar dados de outros bares.
              </p>
            </div>
            <div className="space-y-3">
              {estabelecimentoFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  {feature.allowed ? (
                    <MdCheckCircle className="text-green-600" size={20} />
                  ) : (
                    <MdWarning className="text-red-600" size={20} />
                  )}
                  <div>
                    <span className={`font-medium ${feature.allowed ? 'text-green-700' : 'text-red-700'}`}>
                      {feature.title}
                    </span>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <MdInfo className="mr-2" size={20} />
              Como Editar seu Estabelecimento
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Clique no botão &quot;Editar&quot; (ícone de lápis) ao lado do nome do seu bar</li>
              <li>Modifique os campos necessários (nome, descrição, endereço)</li>
              <li>Gerencie as imagens (logo, capa, popup)</li>
              <li>Atualize informações de localização (latitude, longitude)</li>
              <li>Clique em &quot;Salvar&quot; para aplicar as alterações</li>
            </ol>
          </div>
        </div>

        {/* Categorias Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MdCategory className="text-green-600 mr-3" size={28} />
            📂 Organizando Categorias
          </h3>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-gray-700 mb-4">
                As <strong>categorias</strong> são a base para organizar seu cardápio de forma lógica. 
                Elas ajudam os clientes a encontrar rapidamente o que procuram.
              </p>
              <p className="text-gray-700">
                Exemplos de categorias: Bebidas, Entradas, Pratos Principais, Sobremesas, Combos, etc.
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">💡 Dica de Organização</h4>
              <p className="text-green-800 text-sm">
                Use números sequenciais (1, 2, 3...) na ordem para controlar como as categorias 
                aparecem no cardápio. Coloque as mais importantes primeiro!
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoriaSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-green-600">{step.step}</span>
                </div>
                <h5 className="font-semibold text-gray-900 mb-2">{step.title}</h5>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Itens Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MdList className="text-orange-600 mr-3" size={28} />
            🍕 Criando Itens do Menu
          </h3>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-gray-700 mb-4">
                Os <strong>itens do menu</strong> são os produtos que aparecem no seu cardápio. 
                Cada item pode ter imagem, descrição, preço e adicionais configuráveis.
              </p>
              <p className="text-gray-700">
                <strong>⚠️ Lembre-se:</strong> Você só pode criar e editar itens para o seu próprio 
                estabelecimento. O sistema automaticamente associa novos itens ao seu bar.
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2">💰 Configurando Preços</h4>
              <p className="text-orange-800 text-sm">
                Use vírgula para centavos (ex: 15,50). Para adicionais, configure preços extras 
                que serão somados ao preço base do item.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {itemSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-bold text-orange-600">{step.step}</span>
                </div>
                <h5 className="font-semibold text-gray-900 mb-2 text-sm">{step.title}</h5>
                <p className="text-gray-600 text-xs">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Edição Rápida Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MdSettings className="text-purple-600 mr-3" size={28} />
            ⚡ Edição Rápida de Subcategorias
          </h3>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-gray-700 mb-4">
                A <strong>Edição Rápida</strong> permite gerenciar subcategorias de forma organizada, 
                reorganizando a ordem e criando novas subcategorias rapidamente.
              </p>
              <p className="text-gray-700">
                Esta funcionalidade é ideal para organizar itens similares dentro de uma categoria 
                principal, como &quot;Carnes: Bovina, Frango, Porco&quot;.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">🎯 Como Usar</h4>
              <ol className="list-decimal list-inside space-y-1 text-purple-800 text-sm">
                <li>Selecione uma categoria na aba &quot;Edição Rápida&quot;</li>
                <li>Clique no ícone ⚡ para abrir o modal</li>
                <li>Gerencie subcategorias existentes ou crie novas</li>
                <li>Reorganize a ordem usando as setas ↑↓</li>
                <li>Salve as alterações</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Image Guidelines */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MdImage className="text-indigo-600 mr-3" size={28} />
            🖼️ Diretrizes para Imagens
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {imageGuidelines.map((guideline, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <h4 className="font-semibold text-gray-900 mb-3">{guideline.type}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tamanho:</span>
                    <p className="text-gray-600">{guideline.size}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Formato:</span>
                    <p className="text-gray-600">{guideline.format}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Uso:</span>
                    <p className="text-gray-600">{guideline.usage}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                    <span className="text-blue-800 text-xs font-medium">💡 {guideline.tip}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-8 mb-12 border border-teal-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            💡 Dicas e Boas Práticas
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {bestPractices.map((practice, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg p-6 shadow-md border border-gray-200"
              >
                <h4 className="font-semibold text-gray-900 mb-4 text-lg">{practice.category}</h4>
                <ul className="space-y-2">
                  {practice.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700 text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Next Section */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Agora que você domina o gerenciamento de cardápio, vamos explorar as outras funcionalidades disponíveis!
          </p>
          <div className="inline-flex items-center space-x-2 text-blue-600 font-medium">
            <span>Próxima seção: Eventos e Reservas</span>
            <span>↓</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
