"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MdEvent,
  MdPeople,
  MdCheckCircle,
  MdStars,
  MdList,
  MdGroups,
  MdCake,
  MdDashboard,
  MdAssignmentInd
} from 'react-icons/md';

interface EventoSemanal {
  evento_id: number;
  nome: string;
  horario_funcionamento: string;
  dia_da_semana: number;
  tipo_evento: string;
}

interface DashboardData {
  proximoEvento: {
    evento_id: number;
    nome: string;
    data_evento: string;
    horario_funcionamento: string;
    descricao: string;
    tipo_evento: string;
    dia_da_semana: number | null;
  } | null;
  eventosSemanais: EventoSemanal[];
  totalConvidados: number;
  totalCheckins: number;
  totalPromotersAtivos: number;
  estatisticasPorTipo: Array<{
    tipo: string;
    total_convidados: number;
    total_checkins: number;
  }>;
}

type TabType = 'dashboard' | 'promoters' | 'listas' | 'hostess' | 'aniversarios';

export default function EventosDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/v1/eventos/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do dashboard');
      }

      const data = await response.json();
      if (data.success) {
        setDashboardData(data.dashboard);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'promoters':
        router.push('/admin/eventos/promoters');
        break;
      case 'listas':
        router.push('/admin/eventos/listas');
        break;
      case 'hostess':
        router.push('/admin/eventos/hostess');
        break;
      case 'aniversarios':
        router.push('/admin/eventos/aniversarios');
        break;
      default:
        // Já está no dashboard
        break;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getDiaSemanaTexto = (dia: number) => {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[dia] || '';
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'Promoter':
        return <MdAssignmentInd size={24} />;
      case 'Aniversário':
        return <MdCake size={24} />;
      case 'Casa':
        return <MdEvent size={24} />;
      default:
        return <MdList size={24} />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Promoter':
        return 'bg-purple-500';
      case 'Aniversário':
        return 'bg-pink-500';
      case 'Casa':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MdEvent size={36} />
            Gerenciamento de Eventos e Listas
          </h1>
          <p className="mt-2 text-green-100">
            Controle completo de eventos, promoters, listas e check-ins
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MdDashboard size={20} />
              Dashboard
            </button>
            <button
              onClick={() => handleTabChange('promoters')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'promoters'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MdAssignmentInd size={20} />
              Promoters
            </button>
            <button
              onClick={() => handleTabChange('listas')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'listas'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MdList size={20} />
              Listas
            </button>
            <button
              onClick={() => handleTabChange('hostess')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'hostess'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MdGroups size={20} />
              Hostess
            </button>
            <button
              onClick={() => handleTabChange('aniversarios')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'aniversarios'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MdCake size={20} />
              Aniversários
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card: Próximo Evento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between mb-2">
              <MdEvent size={32} className="text-blue-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Próximo Evento</h3>
            {dashboardData?.proximoEvento ? (
              <>
                <p className="text-xl font-bold text-gray-900 truncate">
                  {dashboardData.proximoEvento.nome}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(dashboardData.proximoEvento.data_evento)}
                </p>
                <p className="text-sm text-gray-500">
                  {dashboardData.proximoEvento.horario_funcionamento}
                </p>
              </>
            ) : (
              <p className="text-lg text-gray-400">Nenhum evento próximo</p>
            )}
          </motion.div>

          {/* Card: Total de Convidados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between mb-2">
              <MdPeople size={32} className="text-purple-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total de Convidados</h3>
            <p className="text-3xl font-bold text-gray-900">
              {dashboardData?.totalConvidados || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">No próximo evento</p>
          </motion.div>

          {/* Card: Check-ins Realizados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between mb-2">
              <MdCheckCircle size={32} className="text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Check-ins Realizados</h3>
            <p className="text-3xl font-bold text-gray-900">
              {dashboardData?.totalCheckins || 0}
            </p>
            {dashboardData?.totalConvidados ? (
              <p className="text-sm text-gray-500 mt-1">
                {Math.round((dashboardData.totalCheckins / dashboardData.totalConvidados) * 100)}% de comparecimento
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">Aguardando convidados</p>
            )}
          </motion.div>

          {/* Card: Promoters Ativos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500"
          >
            <div className="flex items-center justify-between mb-2">
              <MdStars size={32} className="text-orange-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Promoters Ativos</h3>
            <p className="text-3xl font-bold text-gray-900">
              {dashboardData?.totalPromotersAtivos || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Gerenciando listas</p>
          </motion.div>
        </div>

        {/* Estatísticas por Tipo de Lista */}
        {dashboardData?.estatisticasPorTipo && dashboardData.estatisticasPorTipo.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MdList size={24} />
              Estatísticas por Tipo de Lista
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardData.estatisticasPorTipo.map((stat, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 flex items-center gap-4"
                >
                  <div className={`${getTipoColor(stat.tipo)} text-white p-3 rounded-lg`}>
                    {getTipoIcon(stat.tipo)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.tipo}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {stat.total_convidados} convidados
                    </p>
                    <p className="text-sm text-gray-500">
                      {stat.total_checkins} check-ins
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Informação do Próximo Evento Único */}
        {dashboardData?.proximoEvento && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MdEvent size={24} />
              Próximo Evento Único
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Nome:</span>
                <p className="text-lg font-medium text-gray-900">
                  {dashboardData.proximoEvento.nome}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Data:</span>
                <p className="text-lg font-medium text-gray-900">
                  {formatDate(dashboardData.proximoEvento.data_evento)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Horário:</span>
                <p className="text-lg font-medium text-gray-900">
                  {dashboardData.proximoEvento.horario_funcionamento}
                </p>
              </div>
              {dashboardData.proximoEvento.descricao && (
                <div>
                  <span className="text-sm text-gray-600">Descrição:</span>
                  <p className="text-base text-gray-700 mt-1">
                    {dashboardData.proximoEvento.descricao}
                  </p>
                </div>
              )}
              <div className="pt-4">
                <button
                  onClick={() => router.push(`/admin/eventos/listas?evento_id=${dashboardData.proximoEvento?.evento_id}`)}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Ver Listas do Evento
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Eventos Semanais Ativos */}
        {dashboardData?.eventosSemanais && dashboardData.eventosSemanais.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MdEvent size={24} />
              Eventos Semanais Recorrentes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.eventosSemanais.map((evento, index) => (
                <div
                  key={evento.evento_id}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
                >
                  <h4 className="font-semibold text-blue-900 mb-2">{evento.nome}</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p className="font-medium">
                      📅 {getDiaSemanaTexto(evento.dia_da_semana)}
                    </p>
                    <p>🕐 {evento.horario_funcionamento}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/admin/eventos/listas?evento_id=${evento.evento_id}`)}
                    className="mt-3 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Ver Listas
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

