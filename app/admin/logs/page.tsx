'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdHistory,
  MdFilterList,
  MdSearch,
  MdRefresh,
  MdPerson,
  MdAccessTime,
  MdDescription,
  MdBusiness,
  MdClose,
  MdExpandMore,
  MdExpandLess,
  MdArrowBack,
  MdDownload,
  MdCalendarToday,
  MdGroup,
  MdWarning,
} from 'react-icons/md';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

interface ActionLog {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  action_type: string;
  action_description: string;
  resource_type: string | null;
  resource_id: number | null;
  establishment_id: number | null;
  establishment_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_method: string | null;
  request_url: string | null;
  status: string;
  additional_data: any;
  created_at: string;
}

interface Stats {
  totalActions: number;
  recentActions24h: number;
  actionsByType: { action_type: string; count: number }[];
  actionsByRole: { user_role: string; count: number }[];
  topUsers: { user_name: string; user_email: string; user_role: string; count: number }[];
}

interface User {
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
}

export default function ActionLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    userId: '',
    userRole: '',
    actionType: '',
    resourceType: '',
    establishmentId: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  // Buscar logs
  const fetchLogs = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      // Construir query params
      const queryParams = new URLSearchParams();
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.userRole) queryParams.append('userRole', filters.userRole);
      if (filters.actionType) queryParams.append('actionType', filters.actionType);
      if (filters.resourceType) queryParams.append('resourceType', filters.resourceType);
      if (filters.establishmentId) queryParams.append('establishmentId', filters.establishmentId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('limit', pagination.limit.toString());
      queryParams.append('offset', pagination.offset.toString());

      const url = `${API_URL}/api/action-logs?${queryParams}`;
      console.log('🔍 Buscando logs da URL:', url);
      console.log('🔑 Token presente:', token ? 'Sim' : 'Não');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: response.headers
      });

      // Token inválido ou expirado - redireciona para login
      if (response.status === 401) {
        console.log('❌ Status 401 - Token inválido');
        localStorage.removeItem('authToken');
        router.push('/login');
        return;
      }

      // Sem permissão (não é admin) - redireciona para acesso negado
      if (response.status === 403) {
        console.log('⚠️ Status 403 - Verificando tipo de erro...');
        try {
          const errorData = await response.json();
          console.log('Dados do erro 403:', errorData);
          // Se o erro é de token (MISSING_TOKEN ou INVALID_TOKEN), vai para login
          if (errorData.error === 'MISSING_TOKEN' || errorData.error === 'INVALID_TOKEN') {
            console.log('❌ Token inválido - redirecionando para login');
            localStorage.removeItem('authToken');
            router.push('/login');
            return;
          }
          // Se é por falta de permissão (não é admin), vai para acesso negado
          console.log('❌ Sem permissão - redirecionando para acesso negado');
          router.push('/acesso-negado');
          return;
        } catch (e) {
          console.error('Erro ao parsear JSON do erro 403:', e);
          router.push('/acesso-negado');
          return;
        }
      }

      // 404 - Rota não existe (provavelmente não foi feito deploy)
      if (response.status === 404) {
        console.error('❌ Status 404 - A rota /api/action-logs não existe no servidor');
        console.error('⚠️ ATENÇÃO: Você precisa fazer deploy do código para o servidor!');
        console.error('📋 Veja as instruções em: DEPLOY_LOGS_INSTRUCOES.md');
        setError('A API de logs ainda não foi implantada no servidor. Faça o deploy do código primeiro.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: url
        });
        throw new Error(`Erro ao buscar logs: ${response.status} - ${errorText || response.statusText}`);
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        hasMore: data.pagination.hasMore,
      }));

    } catch (err) {
      console.error('Erro ao buscar logs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      // Mostra o erro no console também
      console.log('Detalhes do erro:', {
        error: err,
        filters,
        token: localStorage.getItem('authToken') ? 'presente' : 'ausente'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, pagination.limit, pagination.offset, router]);

  // Buscar estatísticas
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(`${API_URL}/api/action-logs/stats?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Token inválido ou sem permissão - já será tratado pelo fetchLogs
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  }, [filters.startDate, filters.endDate]);

  // Buscar usuários para filtro
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/action-logs/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Token inválido ou sem permissão - já será tratado pelo fetchLogs
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
    fetchUsers();
  }, [fetchLogs, fetchStats, fetchUsers]);

  const handleRefresh = () => {
    fetchLogs(true);
    fetchStats();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      userRole: '',
      actionType: '',
      resourceType: '',
      establishmentId: '',
      startDate: '',
      endDate: '',
      search: '',
    });
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'promoter':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'gerente':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionTypeBadgeColor = (actionType: string) => {
    if (actionType.includes('create')) return 'bg-green-100 text-green-800';
    if (actionType.includes('update')) return 'bg-yellow-100 text-yellow-800';
    if (actionType.includes('delete')) return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <MdArrowBack size={20} />
            <span>Voltar ao Admin</span>
          </button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
                <MdHistory className="text-orange-500" size={40} />
                Logs de Ações
              </h1>
              <p className="text-gray-400 mt-2">
                Rastreamento completo de todas as ações dos usuários no sistema
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <MdRefresh className={refreshing ? 'animate-spin' : ''} size={20} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total de Ações</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.totalActions}</p>
                </div>
                <MdHistory className="text-orange-500" size={32} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Últimas 24h</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.recentActions24h}</p>
                </div>
                <MdAccessTime className="text-blue-500" size={32} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Tipos de Ação</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.actionsByType.length}</p>
                </div>
                <MdDescription className="text-green-500" size={32} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.topUsers.length}</p>
                </div>
                <MdGroup className="text-purple-500" size={32} />
              </div>
            </motion.div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MdFilterList size={24} />
              <span className="font-semibold">Filtros</span>
              {Object.values(filters).some(v => v) && (
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  Ativos
                </span>
              )}
            </div>
            {showFilters ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-700 p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Busca geral */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Buscar</label>
                    <div className="relative">
                      <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        placeholder="Nome, email ou descrição..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Usuário */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Usuário</label>
                    <select
                      value={filters.userId}
                      onChange={(e) => handleFilterChange('userId', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Todos os usuários</option>
                      {users.map(user => (
                        <option key={user.user_id} value={user.user_id}>
                          {user.user_name} ({user.user_role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Função</label>
                    <select
                      value={filters.userRole}
                      onChange={(e) => handleFilterChange('userRole', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Todas as funções</option>
                      <option value="admin">Admin</option>
                      <option value="promoter">Promoter</option>
                      <option value="gerente">Gerente</option>
                      <option value="cliente">Cliente</option>
                    </select>
                  </div>

                  {/* Tipo de Ação */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tipo de Ação</label>
                    <select
                      value={filters.actionType}
                      onChange={(e) => handleFilterChange('actionType', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Todos os tipos</option>
                      <option value="create_reservation">Criar Reserva</option>
                      <option value="update_reservation">Atualizar Reserva</option>
                      <option value="delete_reservation">Deletar Reserva</option>
                      <option value="create">Criar</option>
                      <option value="update">Atualizar</option>
                      <option value="delete">Deletar</option>
                      <option value="view">Visualizar</option>
                    </select>
                  </div>

                  {/* Data Inicial */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Data Inicial</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Data Final */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Data Final</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <MdClose size={16} />
                    <span>Limpar Filtros</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logs Table */}
        {error ? (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-8">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                <MdClose className="text-red-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Erro ao Carregar Logs</h3>
              <p className="text-red-300">{error}</p>
            </div>
            
            {error.includes('404') || error.includes('não foi implantada') ? (
              <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-6 mt-4">
                <h4 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                  <MdWarning size={20} />
                  Deploy Necessário
                </h4>
                <p className="text-yellow-300 text-sm mb-3">
                  A rota da API de logs ainda não está disponível no servidor de produção.
                </p>
                <div className="text-left text-yellow-300 text-sm space-y-2">
                  <p className="font-semibold">Para resolver:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Faça commit e push do código para o Git</li>
                    <li>Aguarde o deploy automático no Render (~3-5 min)</li>
                    <li>Recarregue esta página</li>
                  </ol>
                  <p className="mt-3 text-xs">
                    📋 Veja instruções detalhadas em: <code className="bg-yellow-900/30 px-1 rounded">DEPLOY_LOGS_INSTRUCOES.md</code>
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
            <MdHistory className="mx-auto text-gray-600 mb-4" size={64} />
            <p className="text-gray-400 text-lg">Nenhum log encontrado</p>
            <p className="text-gray-500 text-sm mt-2">
              Tente ajustar os filtros ou aguarde novas ações no sistema
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-orange-500 transition-colors"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(log.user_role)}`}>
                          {log.user_role}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionTypeBadgeColor(log.action_type)}`}>
                          {log.action_type}
                        </span>
                        {log.establishment_name && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                            <MdBusiness size={12} />
                            {log.establishment_name}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-white font-medium mb-1">
                        {log.action_description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MdPerson size={16} />
                          {log.user_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MdAccessTime size={16} />
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </div>

                    <button className="text-gray-400 hover:text-white transition-colors">
                      {expandedLog === log.id ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedLog === log.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                      >
                        <div>
                          <p className="text-gray-400 mb-1">Email do Usuário</p>
                          <p className="text-white">{log.user_email}</p>
                        </div>
                        
                        {log.ip_address && (
                          <div>
                            <p className="text-gray-400 mb-1">IP Address</p>
                            <p className="text-white font-mono">{log.ip_address}</p>
                          </div>
                        )}
                        
                        {log.request_method && (
                          <div>
                            <p className="text-gray-400 mb-1">Método HTTP</p>
                            <p className="text-white">{log.request_method}</p>
                          </div>
                        )}
                        
                        {log.resource_type && (
                          <div>
                            <p className="text-gray-400 mb-1">Tipo de Recurso</p>
                            <p className="text-white">{log.resource_type}</p>
                          </div>
                        )}
                        
                        {log.resource_id && (
                          <div>
                            <p className="text-gray-400 mb-1">ID do Recurso</p>
                            <p className="text-white">#{log.resource_id}</p>
                          </div>
                        )}
                        
                        {log.additional_data && (
                          <div className="md:col-span-2">
                            <p className="text-gray-400 mb-1">Dados Adicionais</p>
                            <pre className="text-white bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.additional_data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
            <p className="text-gray-400">
              Mostrando {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} logs
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={pagination.offset === 0}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Anterior
              </button>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={!pagination.hasMore}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

