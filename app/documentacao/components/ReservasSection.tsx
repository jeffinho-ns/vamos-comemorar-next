'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MdRestaurant,
  MdCalendarToday,
  MdPerson,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdTableBar,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdEdit,
  MdSearch,
  MdFilterList,
  MdAdd,
  MdWarning,
} from 'react-icons/md';

export default function ReservasSection() {
  return (
    <motion.section
      id="reservas"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg">
          <MdRestaurant className="text-white" size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📅 Sistema de Reservas</h2>
          <p className="text-gray-600">Guia completo para gerenciar reservas de mesas</p>
        </div>
      </div>

      {/* Introdução */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">📋 Visão Geral</h3>
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-l-4 border-pink-500 rounded-lg p-6">
          <p className="text-gray-700 leading-relaxed mb-4">
            O Sistema de Reservas é sua principal ferramenta para gerenciar as reservas de mesas dos estabelecimentos. 
            Com ele, você pode criar, editar, visualizar e gerenciar todas as reservas de forma eficiente e organizada.
          </p>
          <p className="text-gray-700 leading-relaxed font-semibold">
            ⚡ Funcionalidades principais: Criação de reservas, gerenciamento de mesas, controle de status, 
            notificações automáticas e muito mais!
          </p>
        </div>
      </div>

      {/* Acessando o Sistema */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">🚀 Como Acessar</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Faça login no sistema</h4>
                <p className="text-gray-600">
                  Acesse com seu email de promoter e senha fornecida pela administração
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Acesse a área administrativa</h4>
                <p className="text-gray-600">
                  No menu principal, clique em &quot;Admin&quot; ou &quot;Painel Administrativo&quot;
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Clique em &quot;Sistema de Reservas&quot;</h4>
                <p className="text-gray-600">
                  Você verá o painel completo com calendário, lista de reservas e opções de gerenciamento
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Criar Nova Reserva */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          <MdAdd className="inline mr-2" />
          Criar Nova Reserva
        </h3>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
              <MdCheckCircle size={24} />
              Passo a Passo
            </h4>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">1.</span>
                <span>Clique no botão &quot;+ Nova Reserva&quot; no canto superior direito</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">2.</span>
                <span>
                  <strong>Selecione o estabelecimento</strong> - Escolha qual bar/restaurante receberá a reserva
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">3.</span>
                <span>
                  <strong>Preencha os dados do cliente:</strong>
                  <ul className="mt-2 ml-4 space-y-1">
                    <li className="flex items-center gap-2">
                      <MdPerson size={16} className="text-gray-500" />
                      Nome completo (obrigatório)
                    </li>
                    <li className="flex items-center gap-2">
                      <MdPhone size={16} className="text-gray-500" />
                      Telefone/WhatsApp (obrigatório)
                    </li>
                    <li className="flex items-center gap-2">
                      <MdEmail size={16} className="text-gray-500" />
                      Email (opcional, mas recomendado para confirmações)
                    </li>
                    <li className="flex items-center gap-2">
                      <MdCalendarToday size={16} className="text-gray-500" />
                      Data de nascimento (opcional)
                    </li>
                  </ul>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">4.</span>
                <span>
                  <strong>Defina data e horário:</strong>
                  <ul className="mt-2 ml-4 space-y-1">
                    <li>📅 Data da reserva</li>
                    <li>🕐 Horário de chegada</li>
                  </ul>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">5.</span>
                <span>
                  <strong>Número de pessoas</strong> - Informe quantas pessoas virão
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">6.</span>
                <span>
                  <strong>Selecione a área</strong> - Escolha qual área do estabelecimento (Salão, Varanda, VIP, etc.)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">7.</span>
                <span>
                  <strong>Escolha a mesa (opcional)</strong> - Se disponível, selecione uma mesa específica
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">8.</span>
                <span>
                  <strong>Adicione observações</strong> - Informações especiais (aniversário, alergia, etc.)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">9.</span>
                <span>
                  Clique em &quot;Criar Reserva&quot; para finalizar
                </span>
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <MdWarning className="text-yellow-600 flex-shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-yellow-900 mb-2">⚠️ Reservas Grandes (11+ pessoas)</h4>
                <p className="text-yellow-800 text-sm">
                  Para grupos acima de 10 pessoas, você só precisa escolher a área. 
                  O admin selecionará as mesas específicas posteriormente. 
                  O sistema notificará automaticamente o administrador sobre reservas grandes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizar e Filtrar Reservas */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          <MdSearch className="inline mr-2" />
          Visualizar e Filtrar Reservas
        </h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            O sistema oferece várias formas de visualizar as reservas:
          </p>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MdCalendarToday className="text-pink-500" />
                Calendário
              </h4>
              <p className="text-gray-600 text-sm">
                Visualize as reservas em formato de calendário mensal. Clique em um dia para ver todas as reservas daquela data.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MdFilterList className="text-pink-500" />
                Filtros
              </h4>
              <p className="text-gray-600 text-sm mb-2">
                Use os filtros para encontrar reservas específicas:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Por estabelecimento</li>
                <li>• Por data</li>
                <li>• Por status (Nova, Confirmada, Cancelada, etc.)</li>
                <li>• Por área</li>
                <li>• Por nome do cliente</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MdTableBar className="text-pink-500" />
                Visualização Semanal
              </h4>
              <p className="text-gray-600 text-sm">
                Alterne para a visualização semanal para ter uma visão mais detalhada das reservas da semana.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Editar Reservas */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          <MdEdit className="inline mr-2" />
          Editar Reservas
        </h3>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            Para editar uma reserva existente:
          </p>
          <ol className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">1.</span>
              <span>Encontre a reserva na lista ou calendário</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">2.</span>
              <span>Clique na reserva para abrir os detalhes</span>
            </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Clique no botão &quot;Editar&quot;</span>
              </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">4.</span>
              <span>Modifique os campos necessários</span>
            </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">5.</span>
                <span>Clique em &quot;Salvar Alterações&quot;</span>
              </li>
          </ol>
          <div className="mt-4 bg-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Dica:</strong> Todas as alterações são registradas no sistema de logs, 
              permitindo rastrear quem fez cada modificação.
            </p>
          </div>
        </div>
      </div>

      {/* Status das Reservas */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">📊 Status das Reservas</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <MdCheckCircle className="text-green-600" size={24} />
              <h4 className="font-semibold text-green-900">NOVA / CONFIRMADA</h4>
            </div>
            <p className="text-sm text-gray-700">
              Reserva criada e aguardando ou já confirmada pelo cliente. 
              Envie notificações automáticas de confirmação.
            </p>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <MdCancel className="text-red-600" size={24} />
              <h4 className="font-semibold text-red-900">CANCELADA</h4>
            </div>
            <p className="text-sm text-gray-700">
              Reserva cancelada pelo cliente ou pelo estabelecimento. 
              A mesa fica liberada automaticamente.
            </p>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <MdPending className="text-yellow-600" size={24} />
              <h4 className="font-semibold text-yellow-900">PENDENTE</h4>
            </div>
            <p className="text-sm text-gray-700">
              Aguardando confirmação ou mais informações do cliente.
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <MdCheckCircle className="text-purple-600" size={24} />
              <h4 className="font-semibold text-purple-900">CONCLUÍDA</h4>
            </div>
            <p className="text-sm text-gray-700">
              Cliente compareceu e a reserva foi concluída com sucesso.
            </p>
          </div>
        </div>
      </div>

      {/* Boas Práticas */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">✨ Boas Práticas</h3>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <strong>Sempre confirme os dados do cliente</strong> - Telefone e email corretos evitam problemas
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <strong>Adicione observações importantes</strong> - Aniversário, alergias, preferências especiais
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <strong>Atualize o status regularmente</strong> - Mantenha as informações sempre atualizadas
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <strong>Verifique conflitos de mesa</strong> - O sistema avisa, mas sempre confira antes de confirmar
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <strong>Use os filtros para organizar</strong> - Facilita encontrar reservas específicas rapidamente
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Notificações */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">🔔 Notificações Automáticas</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            O sistema envia notificações automáticas para:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
              <h4 className="font-semibold text-gray-900 mb-2">📧 Email</h4>
              <p className="text-sm text-gray-600">
                Confirmação de reserva enviada automaticamente para o email do cliente
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-900 mb-2">📱 WhatsApp</h4>
              <p className="text-sm text-gray-600">
                Mensagem de confirmação enviada para o WhatsApp do cliente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Perguntas Frequentes */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">❓ Perguntas Frequentes</h3>
        <div className="space-y-4">
          <details className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors">
            <summary className="font-semibold text-gray-900">
              E se o cliente quiser mudar a data da reserva?
            </summary>
            <p className="text-gray-600 mt-2 text-sm">
              Basta editar a reserva existente e alterar a data. O sistema verificará automaticamente 
              se há disponibilidade na nova data e horário.
            </p>
          </details>

            <details className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors">
              <summary className="font-semibold text-gray-900">
                Como cancelar uma reserva?
              </summary>
              <p className="text-gray-600 mt-2 text-sm">
                Abra a reserva, clique em &quot;Editar&quot; e mude o status para &quot;CANCELADA&quot;. 
                A mesa ficará automaticamente disponível.
              </p>
            </details>

          <details className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors">
            <summary className="font-semibold text-gray-900">
              O que fazer se duas pessoas reservarem a mesma mesa?
            </summary>
            <p className="text-gray-600 mt-2 text-sm">
              O sistema não permite reservas duplicadas para a mesma mesa no mesmo dia. 
              Se isso acontecer, você verá um aviso e precisará escolher outra mesa.
            </p>
          </details>

          <details className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors">
            <summary className="font-semibold text-gray-900">
              Posso criar reservas para vários estabelecimentos?
            </summary>
            <p className="text-gray-600 mt-2 text-sm">
              Sim! Como promoter, você pode criar reservas para todos os estabelecimentos 
              aos quais tem acesso. Basta selecionar o estabelecimento ao criar a reserva.
            </p>
          </details>
        </div>
      </div>
    </motion.section>
  );
}

