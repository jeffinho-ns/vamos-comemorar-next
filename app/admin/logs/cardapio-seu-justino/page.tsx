'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MdArrowBack,
  MdDownload,
  MdFilterList,
  MdHistory,
  MdPerson,
  MdRefresh,
  MdRestaurantMenu,
} from 'react-icons/md';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';
const SEU_JUSTINO_ESTABLISHMENT_ID = 1;

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
  request_method: string | null;
  request_url: string | null;
  additional_data: unknown;
  created_at: string;
}

interface UserSummary {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  total: number;
  lastActionAt: string;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.toLowerCase();
  try {
    return JSON.stringify(value).toLowerCase();
  } catch {
    return String(value).toLowerCase();
  }
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('pt-BR');
}

function isCardapioLog(log: ActionLog): boolean {
  const joined = [
    log.action_type,
    log.action_description,
    log.resource_type,
    log.request_url,
    log.additional_data,
  ]
    .map(normalizeText)
    .join(' ');

  return (
    joined.includes('cardapio') ||
    joined.includes('cardápio') ||
    joined.includes('menu') ||
    joined.includes('categoria') ||
    joined.includes('subcategoria') ||
    joined.includes('item')
  );
}

function isSeuJustinoLog(log: ActionLog): boolean {
  const establishmentName = normalizeText(log.establishment_name);
  const additionalData = normalizeText(log.additional_data);

  const matchesName =
    establishmentName.includes('seu justino') && !establishmentName.includes('pracinha');
  const matchesAdditionalData =
    additionalData.includes('seu justino') && !additionalData.includes('pracinha');

  return (
    log.establishment_id === SEU_JUSTINO_ESTABLISHMENT_ID ||
    matchesName ||
    matchesAdditionalData
  );
}

function isAlteration(log: ActionLog): boolean {
  const method = normalizeText(log.request_method);
  const actionType = normalizeText(log.action_type);
  const description = normalizeText(log.action_description);

  if (['post', 'put', 'patch', 'delete'].includes(method)) return true;
  if (actionType.includes('create') || actionType.includes('update') || actionType.includes('delete')) return true;

  return (
    description.includes('criou') ||
    description.includes('alterou') ||
    description.includes('atualizou') ||
    description.includes('editou') ||
    description.includes('removeu') ||
    description.includes('excluiu')
  );
}

function buildUserSummary(logs: ActionLog[]): UserSummary[] {
  const usersMap = new Map<number, UserSummary>();

  for (const log of logs) {
    const existing = usersMap.get(log.user_id);

    if (!existing) {
      usersMap.set(log.user_id, {
        userId: log.user_id,
        userName: log.user_name,
        userEmail: log.user_email,
        userRole: log.user_role,
        total: 1,
        lastActionAt: log.created_at,
      });
      continue;
    }

    existing.total += 1;
    if (new Date(log.created_at).getTime() > new Date(existing.lastActionAt).getTime()) {
      existing.lastActionAt = log.created_at;
    }
  }

  return Array.from(usersMap.values()).sort((a, b) => b.total - a.total);
}

export default function RelatorioCardapioSeuJustinoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [textFilter, setTextFilter] = useState('');

  const [period, setPeriod] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 15);
    return {
      startDate: toDateInputValue(start),
      endDate: toDateInputValue(end),
    };
  });

  const fetchLogs = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
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

      const queryParams = new URLSearchParams();
      queryParams.append('startDate', `${period.startDate}T00:00:00`);
      queryParams.append('endDate', `${period.endDate}T23:59:59`);
      queryParams.append('limit', '1000');
      queryParams.append('offset', '0');

      const response = await fetch(`${API_URL}/api/action-logs?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        router.push('/acesso-negado');
        return;
      }

      if (!response.ok) {
        throw new Error(`Erro ao buscar logs (${response.status})`);
      }

      const data = await response.json();
      const apiLogs: ActionLog[] = Array.isArray(data.logs) ? data.logs : [];
      setLogs(apiLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao buscar logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period.endDate, period.startDate, router]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const reportLogs = useMemo(() => {
    return logs.filter((log) => isCardapioLog(log) && isSeuJustinoLog(log));
  }, [logs]);

  const filteredReportLogs = useMemo(() => {
    if (!textFilter.trim()) return reportLogs;
    const normalized = textFilter.toLowerCase();
    return reportLogs.filter((log) =>
      [
        log.user_name,
        log.user_email,
        log.user_role,
        log.action_type,
        log.action_description,
        log.request_url,
      ]
        .map(normalizeText)
        .join(' ')
        .includes(normalized)
    );
  }, [reportLogs, textFilter]);

  const accessLogs = useMemo(
    () => filteredReportLogs.filter((log) => !isAlteration(log)),
    [filteredReportLogs]
  );
  const alterationLogs = useMemo(
    () => filteredReportLogs.filter((log) => isAlteration(log)),
    [filteredReportLogs]
  );

  const usersWithAccess = useMemo(() => buildUserSummary(accessLogs), [accessLogs]);
  const usersWhoChanged = useMemo(() => buildUserSummary(alterationLogs), [alterationLogs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white print:bg-white print:text-black">
      <div className="max-w-7xl mx-auto px-4 py-8 print:px-0 print:py-0">
        <div className="mb-8 print:hidden">
          <button
            onClick={() => router.push('/admin/logs')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
          >
            <MdArrowBack size={20} />
            Voltar para Logs
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MdRestaurantMenu className="text-orange-500" />
                Relatório de Cardápio - Seu Justino
              </h1>
              <p className="text-gray-400 mt-2">
                Auditoria completa de acessos e alterações de cardápio nos últimos 15 dias.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => fetchLogs(true)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2"
              >
                <MdRefresh className={refreshing ? 'animate-spin' : ''} size={18} />
                Atualizar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center gap-2"
              >
                <MdDownload size={18} />
                Imprimir / PDF
              </button>
            </div>
          </div>
        </div>

        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Relatório de Cardápio - Seu Justino</h1>
          <p>
            Período: {period.startDate} até {period.endDate}
          </p>
          <p>Emitido em: {new Date().toLocaleString('pt-BR')}</p>
        </div>

        {error ? (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-6">{error}</div>
        ) : (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 print:hidden">
              <div className="flex items-center gap-2 mb-4 text-gray-300">
                <MdFilterList size={20} />
                Filtros do relatório
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="date"
                  value={period.startDate}
                  onChange={(e) => setPeriod((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                />
                <input
                  type="date"
                  value={period.endDate}
                  onChange={(e) => setPeriod((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  value={textFilter}
                  onChange={(e) => setTextFilter(e.target.value)}
                  placeholder="Filtrar por usuário/ação..."
                  className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total de registros</p>
                <p className="text-2xl font-bold">{filteredReportLogs.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Acessos ao cardápio</p>
                <p className="text-2xl font-bold">{accessLogs.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Alterações realizadas</p>
                <p className="text-2xl font-bold">{alterationLogs.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Usuários que alteraram</p>
                <p className="text-2xl font-bold">{usersWhoChanged.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <section className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MdPerson /> Usuários com acesso ao cardápio
                </h2>
                {usersWithAccess.length === 0 ? (
                  <p className="text-gray-400">Nenhum acesso encontrado no período.</p>
                ) : (
                  <div className="space-y-2">
                    {usersWithAccess.map((user) => (
                      <div key={user.userId} className="bg-gray-800 rounded-lg p-3">
                        <p className="font-semibold">{user.userName}</p>
                        <p className="text-sm text-gray-300">{user.userEmail}</p>
                        <p className="text-sm text-gray-400">
                          Perfil: {user.userRole} | Acessos: {user.total} | Último: {formatDateTime(user.lastActionAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MdHistory /> Usuários que alteraram o cardápio
                </h2>
                {usersWhoChanged.length === 0 ? (
                  <p className="text-gray-400">Nenhuma alteração encontrada no período.</p>
                ) : (
                  <div className="space-y-2">
                    {usersWhoChanged.map((user) => (
                      <div key={user.userId} className="bg-gray-800 rounded-lg p-3">
                        <p className="font-semibold">{user.userName}</p>
                        <p className="text-sm text-gray-300">{user.userEmail}</p>
                        <p className="text-sm text-gray-400">
                          Perfil: {user.userRole} | Alterações: {user.total} | Última: {formatDateTime(user.lastActionAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Detalhamento de ações</h2>
              {filteredReportLogs.length === 0 ? (
                <p className="text-gray-400">Nenhum registro de cardápio para Seu Justino neste período.</p>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-left">
                        <th className="py-2 pr-4">Data/Hora</th>
                        <th className="py-2 pr-4">Usuário</th>
                        <th className="py-2 pr-4">Tipo</th>
                        <th className="py-2 pr-4">Ação</th>
                        <th className="py-2 pr-4">Endpoint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-800">
                          <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                          <td className="py-2 pr-4">
                            <div>{log.user_name}</div>
                            <div className="text-xs text-gray-400">{log.user_email}</div>
                          </td>
                          <td className="py-2 pr-4">
                            {isAlteration(log) ? (
                              <span className="px-2 py-1 rounded bg-amber-600/20 text-amber-300">Alteração</span>
                            ) : (
                              <span className="px-2 py-1 rounded bg-blue-600/20 text-blue-300">Acesso</span>
                            )}
                          </td>
                          <td className="py-2 pr-4">{log.action_description || log.action_type}</td>
                          <td className="py-2 pr-4 text-gray-400">{log.request_url || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
