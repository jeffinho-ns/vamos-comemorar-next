'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdArrowBack, MdDownload, MdFilterList, MdHistory, MdPerson, MdRefresh } from 'react-icons/md';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.agilizaiapp.com.br';

interface ActionLog {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  action_type: string;
  action_description: string;
  resource_type: string | null;
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

function normalizeText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.toLowerCase();
  try {
    return JSON.stringify(value).toLowerCase();
  } catch {
    return String(value).toLowerCase();
  }
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('pt-BR');
}

function getEstablishmentLabel(log: ActionLog): string {
  if (log.establishment_name && String(log.establishment_name).trim()) {
    return String(log.establishment_name);
  }

  const text = normalizeText([log.request_url, log.action_description, log.additional_data]);
  if (text.includes('highline') || text.includes('high line')) return 'High Line';
  if (text.includes('pracinha')) return 'Pracinha do Seu Justino';
  if (text.includes('seu justino') || text.includes('justino')) return 'Seu Justino';

  return 'Não identificado';
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isAdminCardapioContext(log: ActionLog): boolean {
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
    joined.includes('/admin/cardapio') ||
    joined.includes('/api/cardapio') ||
    joined.includes('/cardapio/') ||
    joined.includes('cardapio') ||
    joined.includes('cardápio')
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

function summarizeUsers(logs: ActionLog[]): UserSummary[] {
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
  const [allLogs, setAllLogs] = useState<ActionLog[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEstablishment, setSelectedEstablishment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<'all' | 'access' | 'change'>('all');
  const [period, setPeriod] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 15);
    return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) };
  });

  const fetchLogs = useCallback(
    async (manual = false) => {
      try {
        manual ? setRefreshing(true) : setLoading(true);
        setError(null);

        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const queryParams = new URLSearchParams();
        queryParams.append('startDate', `${period.startDate}T00:00:00`);
        queryParams.append('endDate', `${period.endDate}T23:59:59`);
        queryParams.append('limit', '5000');
        queryParams.append('offset', '0');

        const response = await fetch(`${API_URL}/api/action-logs?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
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
        setAllLogs(Array.isArray(data.logs) ? data.logs : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro inesperado');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period.endDate, period.startDate, router]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const cardapioContextLogs = useMemo(
    () => allLogs.filter((log) => isAdminCardapioContext(log)),
    [allLogs]
  );

  const establishmentOptions = useMemo(() => {
    const values = Array.from(
      new Set(cardapioContextLogs.map((log) => getEstablishmentLabel(log)))
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return values;
  }, [cardapioContextLogs]);

  const roleOptions = useMemo(() => {
    const values = Array.from(
      new Set(cardapioContextLogs.map((log) => log.user_role).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return values;
  }, [cardapioContextLogs]);

  const filteredContextLogs = useMemo(() => {
    return cardapioContextLogs.filter((log) => {
      if (selectedEstablishment && getEstablishmentLabel(log) !== selectedEstablishment) return false;
      if (selectedRole && log.user_role !== selectedRole) return false;
      if (selectedEventType === 'access' && isAlteration(log)) return false;
      if (selectedEventType === 'change' && !isAlteration(log)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const searchable = [
          log.user_name,
          log.user_email,
          log.user_role,
          log.action_type,
          log.action_description,
          log.request_url,
          getEstablishmentLabel(log),
        ]
          .map(normalizeText)
          .join(' ');
        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [cardapioContextLogs, search, selectedEstablishment, selectedEventType, selectedRole]);

  const accessLogs = useMemo(
    () => filteredContextLogs.filter((log) => !isAlteration(log)),
    [filteredContextLogs]
  );
  const alterationLogs = useMemo(
    () => filteredContextLogs.filter((log) => isAlteration(log)),
    [filteredContextLogs]
  );

  const usersWithAccess = useMemo(() => summarizeUsers(filteredContextLogs), [filteredContextLogs]);
  const usersWhoChanged = useMemo(() => summarizeUsers(alterationLogs), [alterationLogs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white print:bg-white print:text-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 print:hidden">
          <button onClick={() => router.push('/admin/logs')} className="flex items-center gap-2 text-gray-300 hover:text-white mb-4">
            <MdArrowBack size={20} /> Voltar para Logs
          </button>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Relatório `/admin/cardapio`</h1>
              <p className="text-gray-400 mt-1">Usuários com acesso e logs de alteração dos últimos 15 dias.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => fetchLogs(true)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2">
                <MdRefresh className={refreshing ? 'animate-spin' : ''} /> Atualizar
              </button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center gap-2">
                <MdDownload /> Imprimir / PDF
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">{error}</div>
        ) : (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-5 print:hidden">
              <div className="flex items-center gap-2 mb-3"><MdFilterList /> Filtros</div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <input type="date" value={period.startDate} onChange={(e) => setPeriod((p) => ({ ...p, startDate: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" />
                <input type="date" value={period.endDate} onChange={(e) => setPeriod((p) => ({ ...p, endDate: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" />
                <select value={selectedEstablishment} onChange={(e) => setSelectedEstablishment(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <option value="">Todos estabelecimentos</option>
                  {establishmentOptions.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <option value="">Todas funções</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <select value={selectedEventType} onChange={(e) => setSelectedEventType(e.target.value as 'all' | 'access' | 'change')} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <option value="all">Todos eventos</option>
                  <option value="access">Apenas acessos</option>
                  <option value="change">Apenas alterações</option>
                </select>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por usuário/ação/endpoint..." className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 lg:col-span-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4"><p className="text-gray-400 text-sm">Logs API</p><p className="text-2xl font-bold">{allLogs.length}</p></div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4"><p className="text-gray-400 text-sm">Contexto `/admin/cardapio`</p><p className="text-2xl font-bold">{filteredContextLogs.length}</p></div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4"><p className="text-gray-400 text-sm">Usuários com acesso</p><p className="text-2xl font-bold">{usersWithAccess.length}</p></div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4"><p className="text-gray-400 text-sm">Logs de alteração</p><p className="text-2xl font-bold">{alterationLogs.length}</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <section className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><MdPerson /> Todos usuários com acesso</h2>
                {usersWithAccess.length === 0 ? <p className="text-gray-400">Nenhum usuário encontrado.</p> : (
                  <div className="space-y-2">
                    {usersWithAccess.map((u) => (
                      <div key={u.userId} className="bg-gray-800 rounded-lg p-3">
                        <p className="font-semibold">{u.userName}</p>
                        <p className="text-sm text-gray-300">{u.userEmail}</p>
                        <p className="text-sm text-gray-400">Perfil: {u.userRole} | Logs: {u.total} | Último: {formatDateTime(u.lastActionAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><MdHistory /> Usuários com alteração</h2>
                {usersWhoChanged.length === 0 ? <p className="text-gray-400">Nenhuma alteração encontrada.</p> : (
                  <div className="space-y-2">
                    {usersWhoChanged.map((u) => (
                      <div key={u.userId} className="bg-gray-800 rounded-lg p-3">
                        <p className="font-semibold">{u.userName}</p>
                        <p className="text-sm text-gray-300">{u.userEmail}</p>
                        <p className="text-sm text-gray-400">Perfil: {u.userRole} | Alterações: {u.total} | Última: {formatDateTime(u.lastActionAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Logs de alteração em `/admin/cardapio`</h2>
              {alterationLogs.length === 0 ? (
                <p className="text-gray-400">Nenhum log de alteração no período.</p>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-left">
                        <th className="py-2 pr-4">Data/Hora</th>
                        <th className="py-2 pr-4">Usuário</th>
                        <th className="py-2 pr-4">Tipo</th>
                        <th className="py-2 pr-4">Estabelecimento</th>
                        <th className="py-2 pr-4">Descrição</th>
                        <th className="py-2 pr-4">Endpoint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alterationLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-800">
                          <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                          <td className="py-2 pr-4">
                            <div>{log.user_name}</div>
                            <div className="text-xs text-gray-400">{log.user_email}</div>
                          </td>
                          <td className="py-2 pr-4">{log.action_type}</td>
                          <td className="py-2 pr-4">{getEstablishmentLabel(log)}</td>
                          <td className="py-2 pr-4">{log.action_description}</td>
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
