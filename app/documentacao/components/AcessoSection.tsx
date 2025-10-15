'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MdSecurity, MdLock, MdVisibility, MdBlock, MdCheckCircle, MdWarning } from 'react-icons/md';

export default function AcessoSection() {
  const permissions = [
    {
      category: '🏢 Estabelecimento',
      allowed: ['Visualizar dados', 'Editar informações básicas', 'Gerenciar imagens'],
      denied: ['Criar novos estabelecimentos', 'Excluir estabelecimento', 'Acessar outros bares']
    },
    {
      category: '📂 Categorias',
      allowed: ['Criar novas categorias', 'Editar categorias existentes', 'Excluir categorias vazias', 'Organizar ordem'],
      denied: ['Modificar categorias de outros bares', 'Excluir categorias com itens']
    },
    {
      category: '🍕 Itens do Menu',
      allowed: ['Criar novos itens', 'Editar itens existentes', 'Excluir itens', 'Upload de imagens', 'Gerenciar preços'],
      denied: ['Modificar itens de outros bares', 'Acessar dados de outros estabelecimentos']
    },
    {
      category: '🎉 Eventos e Reservas',
      allowed: ['Visualizar eventos do seu bar', 'Consultar reservas', 'Ver detalhes dos clientes'],
      denied: ['Criar novos eventos', 'Modificar eventos existentes', 'Acessar eventos de outros bares']
    }
  ];

  const securityFeatures = [
    {
      icon: MdLock,
      title: 'Autenticação Segura',
      description: 'Login com email e senha específicos para cada estabelecimento',
      color: 'text-blue-600'
    },
    {
      icon: MdVisibility,
      title: 'Visibilidade Restrita',
      description: 'Você só vê e gerencia dados do seu próprio estabelecimento',
      color: 'text-green-600'
    },
    {
      icon: MdBlock,
      title: 'Acesso Negado',
      description: 'Tentativas de acessar áreas restritas são bloqueadas automaticamente',
      color: 'text-red-600'
    },
    {
      icon: MdSecurity,
      title: 'Monitoramento',
      description: 'Todas as ações são registradas e monitoradas pelo sistema',
      color: 'text-purple-600'
    }
  ];

  const loginSteps = [
    {
      step: 1,
      title: 'Acesse o Sistema',
      description: 'Digite a URL do sistema no seu navegador',
      code: 'https://seu-dominio.com/login'
    },
    {
      step: 2,
      title: 'Insira suas Credenciais',
      description: 'Use o email específico do seu estabelecimento',
      code: 'analista@seuestabelecimento.com'
    },
    {
      step: 3,
      title: 'Digite a Senha',
      description: 'Use a senha padrão fornecida',
      code: '********'
    },
    {
      step: 4,
      title: 'Acesso Confirmado',
      description: 'O sistema verifica suas permissões e redireciona para o painel',
      code: 'Painel Promoter'
    }
  ];

  return (
    <section id="acesso" className="py-16 bg-gray-50">
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
            🔐 Acesso e Segurança
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Entenda como funciona o sistema de permissões e como acessar o sistema de forma segura.
          </p>
        </div>

        {/* Security Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MdSecurity className="text-blue-600 mr-3" size={28} />
            Sistema de Segurança
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 mb-4">
                O sistema <strong>Agilizaiapp</strong> implementa um sistema de segurança robusto 
                baseado em <strong>roles e permissões</strong>. Como Promoter, você tem acesso controlado 
                apenas às funcionalidades necessárias para gerenciar seu estabelecimento.
              </p>
              <p className="text-gray-700">
                Todas as tentativas de acesso são <strong>validadas em tempo real</strong>, garantindo 
                que você não possa acessar dados de outros bares ou funcionalidades restritas.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MdCheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Acesso restrito por estabelecimento</span>
              </div>
              <div className="flex items-center space-x-3">
                <MdCheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Validação de permissões em tempo real</span>
              </div>
              <div className="flex items-center space-x-3">
                <MdCheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Registro de todas as ações</span>
              </div>
              <div className="flex items-center space-x-3">
                <MdCheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Bloqueio automático de tentativas inválidas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <feature.icon className={feature.color} size={32} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Permissions Table */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📋 Matriz de Permissões
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Funcionalidade</th>
                  <th className="text-center py-3 px-4 font-semibold text-green-600">✅ Permitido</th>
                  <th className="text-center py-3 px-4 font-semibold text-red-600">❌ Negado</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium text-gray-900">{permission.category}</td>
                    <td className="py-4 px-4">
                      <ul className="space-y-1">
                        {permission.allowed.map((item, idx) => (
                          <li key={idx} className="text-sm text-green-700 flex items-center">
                            <MdCheckCircle className="text-green-600 mr-2" size={16} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-4 px-4">
                      <ul className="space-y-1">
                        {permission.denied.map((item, idx) => (
                          <li key={idx} className="text-sm text-red-700 flex items-center">
                            <MdBlock className="text-red-600 mr-2" size={16} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Login Process */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-12 border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🔑 Processo de Login
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loginSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg p-6 shadow-md border border-gray-200 text-center"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-blue-600">{step.step}</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono break-all">
                  {step.code}
                </code>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Novos Usuários Promoters */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-lg p-8 mb-12 border border-indigo-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-center">
            <MdSecurity className="text-indigo-600 mr-3" size={28} />
            👥 Usuários Promoters - Informações de Acesso
          </h3>
          
          <div className="bg-white rounded-lg p-6 mb-6 border border-indigo-200">
            <p className="text-gray-700 mb-4">
              <strong>Data de criação:</strong> 15 de outubro de 2025
            </p>
            <p className="text-gray-700 mb-4">
              Foram criadas três contas de usuário com a função de <span className="font-semibold text-indigo-700">Promoter</span> para gerenciamento de reservas e listas de convidados:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Usuário 1 */}
            <div className="bg-white rounded-lg p-6 border-2 border-indigo-200 hover:border-indigo-400 transition-colors">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="font-bold text-gray-900 text-center mb-3">Regiane Brunno</h4>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-600 text-xs mb-1">Email:</p>
                  <p className="font-mono text-gray-900 break-all">regianebrunno@gmail.com</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-600 text-xs mb-1">ID:</p>
                  <p className="font-mono text-gray-900">71</p>
                </div>
                <div className="bg-indigo-50 rounded p-2">
                  <p className="text-gray-600 text-xs mb-1">Função:</p>
                  <p className="font-semibold text-indigo-700">Promoter</p>
                </div>
              </div>
            </div>

            {/* Usuário 2 */}
            <div className="bg-white rounded-lg p-6 border-2 border-indigo-200 hover:border-indigo-400 transition-colors">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h4 className="font-bold text-gray-900 text-center mb-3">Franciely Mendes</h4>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-600 text-xs mb-1">Email:</p>
                  <p className="font-mono text-gray-900 break-all">franciely.mendes@ideiaum.com.br</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-600 text-xs mb-1">ID:</p>
                  <p className="font-mono text-gray-900">72</p>
                </div>
                <div className="bg-indigo-50 rounded p-2">
                  <p className="text-gray-600 text-xs mb-1">Função:</p>
                  <p className="font-semibold text-indigo-700">Promoter</p>
                </div>
              </div>
            </div>

            {/* Usuário 3 */}
            <div className="bg-white rounded-lg p-6 border-2 border-indigo-200 hover:border-indigo-400 transition-colors">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h4 className="font-bold text-gray-900 text-center mb-3">Coordenadora Reservas</h4>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-600 text-xs mb-1">Email:</p>
                  <p className="font-mono text-gray-900 break-all">coordenadora.reservas@ideiaum.com.br</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-600 text-xs mb-1">ID:</p>
                  <p className="font-mono text-gray-900">73</p>
                </div>
                <div className="bg-indigo-50 rounded p-2">
                  <p className="text-gray-600 text-xs mb-1">Função:</p>
                  <p className="font-semibold text-indigo-700">Promoter</p>
                </div>
              </div>
            </div>
          </div>

          {/* Credenciais */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <MdWarning className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-bold text-yellow-900 mb-2">🔐 Senha Padrão</h4>
                <div className="bg-white rounded p-3 mb-3">
                  <p className="text-gray-700 text-sm mb-1">Senha para todos os usuários:</p>
                  <p className="font-mono text-lg font-bold text-yellow-900">*********</p>
                </div>
                <p className="text-yellow-800 text-sm">
                  <strong>⚠️ IMPORTANTE:</strong> Recomenda-se que cada usuário altere sua senha no primeiro acesso ao sistema para garantir a segurança.
                </p>
              </div>
            </div>
          </div>

          {/* Responsabilidades */}
          <div className="bg-white rounded-lg p-6 border border-indigo-200">
            <h4 className="font-bold text-gray-900 mb-4 text-center">📋 Responsabilidades dos Promoters</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="font-semibold text-indigo-700 mb-2">Gerenciamento de Reservas</h5>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                    <span>Criar e gerenciar reservas de mesas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                    <span>Confirmar e atualizar status das reservas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                    <span>Gerenciar cancelamentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                    <span>Atribuir mesas e áreas</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-semibold text-indigo-700 mb-2">Lista de Convidados</h5>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                    <span>Criar e gerenciar listas de convidados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                    <span>Adicionar e remover convidados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                    <span>Fazer check-in de convidados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                    <span>Acompanhar presença em eventos</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MdWarning className="text-yellow-600 mr-3" size={28} />
            Dicas de Segurança
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-green-600">✅ O que fazer:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Mantenha suas credenciais em local seguro</li>
                <li>• Faça logout ao terminar de usar o sistema</li>
                <li>• Use apenas em dispositivos confiáveis</li>
                <li>• Reporte qualquer comportamento suspeito</li>
                <li>• Mantenha seu navegador atualizado</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-red-600">❌ O que NÃO fazer:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Compartilhar suas credenciais com outros</li>
                <li>• Usar em computadores públicos</li>
                <li>• Deixar o sistema logado sem supervisão</li>
                <li>• Tentar acessar áreas restritas</li>
                <li>• Ignorar mensagens de segurança</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-8 mb-12 border border-yellow-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🚨 Problemas de Acesso
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Problema: Acesso Negado</h4>
              <p className="text-gray-700 mb-3">
                Se você receber uma mensagem de &quot;Acesso Negado&quot;:
              </p>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Verifique se está usando o email correto</li>
                <li>• Confirme se a senha está correta</li>
                <li>• Recarregue a página</li>
                <li>• Limpe o cache do navegador</li>
                <li>• Entre em contato com o administrador</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Problema: Dados Incorretos</h4>
              <p className="text-gray-700 mb-3">
                Se estiver vendo dados de outro estabelecimento:
              </p>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Faça logout e login novamente</li>
                <li>• Verifique se está no email correto</li>
                <li>• Confirme se o estabelecimento está correto</li>
                <li>• Recarregue a página</li>
                <li>• Reporte o problema ao administrador</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Next Section */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Agora que você entende como acessar o sistema com segurança, vamos explorar as funcionalidades do cardápio!
          </p>
          <div className="inline-flex items-center space-x-2 text-blue-600 font-medium">
            <span>Próxima seção: Gerenciamento de Cardápio</span>
            <span>↓</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
