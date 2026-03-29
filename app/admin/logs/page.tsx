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
  MdPictureAsPdf,
} from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import AuditDiffTable from '../../components/logs/AuditDiffTable';
import { exportActionLogsPdf } from './exportActionLogsPdf';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

interface BarOption {
  id: number;
  name: string;
}

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
  const {
    canViewActionLogs,
    isLoading: permsLoading,
    isSuperAdmin,
    myEstablishmentPermissions,
  } = useUserPermissions();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [establishmentOptions, setEstablishmentOptions] = useState<BarOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros - Por padrão, mostra todos os usuários/funções
  const [filters, setFilters] = useState({
    userId: '',
    userRole: '',
    actionType: '',
    actionCategory: '',
    resourceType: '',
    establishmentId: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  useEffect(() => {
    if (!permsLoading && !canViewActionLogs) {
      router.replace('/acesso-negado');
    }
  }, [permsLoading, canViewActionLogs, router]);

  useEffect(() => {
    if (!isSuperAdmin) {
      const opts = myEstablishmentPermissions
        .filter((p) => p.is_active && p.establishment_id != null)
        .map((p) => ({
          id: Number(p.establishment_id),
          name: p.establishment_name || `Estabelecimento ${p.establishment_id}`,
        }));
      setEstablishmentOptions(opts);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/bars`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return;
        const data = await r.json();
        const arr = Array.isArray(data) ? data : [];
        setEstablishmentOptions(
          arr.map((b: { id: number; name?: string }) => ({
            id: Number(b.id),
            name: b.name || `ID ${b.id}`,
          }))
        );
      } catch {
        /* ignore */
      }
    })();
  }, [isSuperAdmin, myEstablishmentPermissions]);

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
      if (filters.actionCategory) queryParams.append('actionCategory', filters.actionCategory);
      if (filters.resourceType) queryParams.append('resourceType', filters.resourceType);
      if (filters.establishmentId) queryParams.append('establishmentId', filters.establishmentId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('limit', pagination.limit.toString());
      queryParams.append('offset', pagination.offset.toString());

      const url = `${API_URL}/api/action-logs?${queryParams}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Token inválido ou expirado - redireciona para login
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        router.push('/login');
        return;
      }

      // Sem permissão
      if (response.status === 403) {
        try {
          const errorData = await response.json();
          if (errorData.error === 'MISSING_TOKEN' || errorData.error === 'INVALID_TOKEN') {
            localStorage.removeItem('authToken');
            router.push('/login');
            return;
          }
          router.push('/acesso-negado');
          return;
        } catch {
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
      if (filters.establishmentId) queryParams.append('establishmentId', filters.establishmentId);

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
  }, [filters.startDate, filters.endDate, filters.establishmentId]);

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

  const handleExportPdf = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    if (pagination.total === 0) {
      window.alert('Não há registos para exportar com os filtros atuais.');
      return;
    }
    setExportingPdf(true);
    try {
      await exportActionLogsPdf({
        apiUrl: API_URL,
        token,
        filters,
        totalRows: pagination.total,
      });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erro ao gerar o PDF.');
    } finally {
      setExportingPdf(false);
    }
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
      actionCategory: '',
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

  if (permsLoading || (loading && !refreshing)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando logs...</p>
        </div>
      </div>
    );
  }

  if (!canViewActionLogs) {
    return null;
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
              <div className="flex items-center gap-2 mt-2">
                <p className="text-gray-400">
                  Rastreamento completo de todas as ações dos usuários no sistema
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => router.push('/admin/logs/cardapio-seu-justino')}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <MdDownload size={20} />
                <span>Relatório Cardápio (Seu Justino)</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportingPdf || loading || pagination.total === 0}
                className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <MdPictureAsPdf size={20} />
                <span>{exportingPdf ? 'A gerar PDF…' : 'Exportar relatório'}</span>
              </button>

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
                  {/* Estabelecimento */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Estabelecimento</label>
                    <select
                      value={filters.establishmentId}
                      onChange={(e) => handleFilterChange('establishmentId', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Todos (no seu escopo)</option>
                      {establishmentOptions.map((est) => (
                        <option key={est.id} value={String(est.id)}>
                          {est.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ação (categoria) */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ação</label>
                    <select
                      value={filters.actionCategory}
                      onChange={(e) => handleFilterChange('actionCategory', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Todas</option>
                      <option value="create">Criar</option>
                      <option value="update">Editar</option>
                      <option value="delete">Deletar</option>
                      <option value="view">Visualizar</option>
                    </select>
                  </div>

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
                      <option value="admin,promoter">Admin e Promoter</option>
                      <option value="admin">Apenas Admin</option>
                      <option value="promoter">Apenas Promoter</option>
                      <option value="gerente">Gerente</option>
                      <option value="cliente">Cliente</option>
                    </select>
                  </div>

                  {/* Tipo de Ação (código exato na API) */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tipo de Ação (avançado)</label>
                    <select
                      value={filters.actionType}
                      onChange={(e) => handleFilterChange('actionType', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Todos os tipos</option>
                      <option value="page_view_admin">Visualização de página (admin)</option>
                      <option value="create_reservation">Criar Reserva</option>
                      <option value="update_reservation">Atualizar Reserva</option>
                      <option value="delete_reservation">Deletar Reserva</option>
                      <option value="create_cardapio_item">Criar item cardápio</option>
                      <option value="update_cardapio_item">Atualizar item cardápio</option>
                      <option value="create">create</option>
                      <option value="update">update</option>
                      <option value="delete">delete</option>
                      <option value="view">view</option>
                    </select>
                  </div>

                  {/* Data Inicial */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Período — Data inicial</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Data Final */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Período — Data final</label>
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
                        
                        {log.additional_data?.audit && (
                          <div className="md:col-span-2 space-y-3">
                            <p className="text-gray-300 font-semibold text-sm">
                              Comparação de auditoria
                            </p>
                            <AuditDiffTable
                              before={
                                log.additional_data.audit.before as
                                  | Record<string, unknown>
                                  | null
                              }
                              after={
                                log.additional_data.audit.after as
                                  | Record<string, unknown>
                                  | null
                              }
                            />
                          </div>
                        )}
                        {log.additional_data &&
                          (() => {
                            const rest = { ...log.additional_data };
                            delete (rest as { audit?: unknown }).audit;
                            if (!Object.keys(rest).length) return null;
                            return (
                              <div className="md:col-span-2">
                                <p className="text-gray-400 mb-1">Outros metadados</p>
                                <pre className="text-white bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(rest, null, 2)}
                                </pre>
                              </div>
                            );
                          })()}
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

