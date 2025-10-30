"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MdArrowBack,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdSearch,
  MdStar,
  MdStarBorder,
  MdPerson,
  MdPhone,
  MdEmail,
  MdCardGiftcard
} from 'react-icons/md';

interface Convidado {
  lista_convidado_id: number;
  nome_convidado: string;
  telefone_convidado: string | null;
  email_convidado: string | null;
  status_checkin: 'Pendente' | 'Check-in' | 'No-Show';
  is_vip: boolean;
  data_checkin: string | null;
  beneficios: string | null;
  observacoes: string | null;
}

interface ListaDetalhes {
  lista_id: number;
  nome: string;
  tipo: string;
  evento_nome: string;
  data_evento: string;
  horario_funcionamento: string;
  promoter_nome: string | null;
  promoter_email: string | null;
  promoter_telefone: string | null;
  total_convidados: number;
  total_checkins: number;
  total_pendentes: number;
}

export default function DetalhesListaPage() {
  const router = useRouter();
  const params = useParams();
  const listaId = params?.listaId as string;

  const [loading, setLoading] = useState(true);
  const [lista, setLista] = useState<ListaDetalhes | null>(null);
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [filteredConvidados, setFilteredConvidados] = useState<Convidado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    if (listaId) {
      fetchDetalhesLista();
    }
  }, [listaId]);

  useEffect(() => {
    filterConvidados();
  }, [searchTerm, statusFilter, convidados]);

  const fetchDetalhesLista = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/v1/eventos/listas/${listaId}/detalhes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes da lista');
      }

      const data = await response.json();
      if (data.success) {
        setLista(data.lista);
        setConvidados(data.convidados);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes da lista:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterConvidados = () => {
    let filtered = [...convidados];

    // Filtro por nome
    if (searchTerm) {
      filtered = filtered.filter((c) =>
        c.nome_convidado.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter) {
      filtered = filtered.filter((c) => c.status_checkin === statusFilter);
    }

    setFilteredConvidados(filtered);
  };

  const handleCheckin = async (convidadoId: number, novoStatus: string) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/v1/eventos/checkin/${convidadoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status_checkin: novoStatus }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar check-in');
      }

      const data = await response.json();
      if (data.success) {
        // Atualizar lista local
        setConvidados((prev) =>
          prev.map((c) =>
            c.lista_convidado_id === convidadoId
              ? { ...c, status_checkin: novoStatus as any, data_checkin: new Date().toISOString() }
              : c
          )
        );

        // Recarregar dados completos
        fetchDetalhesLista();
      }
    } catch (error) {
      console.error('❌ Erro ao fazer check-in:', error);
      alert('Erro ao atualizar check-in. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Check-in':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'No-Show':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Check-in':
        return <MdCheckCircle size={20} />;
      case 'Pendente':
        return <MdPending size={20} />;
      case 'No-Show':
        return <MdCancel size={20} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      // Adiciona T12:00:00 para evitar problemas de timezone
      const dateWithTime = dateString.includes('T') || dateString.includes(' ') 
        ? dateString 
        : dateString + 'T12:00:00';
      const date = new Date(dateWithTime);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Erro ao formatar data:', dateString, error);
      return 'Data inválida';
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data/hora:', dateString, error);
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes da lista...</p>
        </div>
      </div>
    );
  }

  if (!lista) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Lista não encontrada</h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/admin/eventos/listas')}
            className="flex items-center gap-2 text-white hover:text-green-100 mb-4 transition-colors"
          >
            <MdArrowBack size={20} />
            Voltar para Listas
          </button>
          <h1 className="text-3xl font-bold">{lista.nome}</h1>
          <div className="mt-2 space-y-1">
            <p className="text-green-100">
              {lista.evento_nome} - {formatDate(lista.data_evento)}
            </p>
            <p className="text-green-100">
              Horário: {lista.horario_funcionamento}
            </p>
            {lista.promoter_nome && (
              <p className="text-green-100">
                Promoter: {lista.promoter_nome}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Convidados</p>
                <p className="text-3xl font-bold text-blue-600">{lista.total_convidados}</p>
              </div>
              <MdPerson size={48} className="text-blue-200" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Check-ins Realizados</p>
                <p className="text-3xl font-bold text-green-600">{lista.total_checkins}</p>
              </div>
              <MdCheckCircle size={48} className="text-green-200" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aguardando Check-in</p>
                <p className="text-3xl font-bold text-yellow-600">{lista.total_pendentes}</p>
              </div>
              <MdPending size={48} className="text-yellow-200" />
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdSearch className="inline mr-2" />
                Buscar Convidado
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome do convidado..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status do Check-in
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="Pendente">Pendente</option>
                <option value="Check-in">Check-in</option>
                <option value="No-Show">No-Show</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Convidados */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VIP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Benefícios
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConvidados.map((convidado) => (
                  <motion.tr
                    key={convidado.lista_convidado_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MdPerson size={20} className="text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {convidado.nome_convidado}
                          </div>
                          {convidado.data_checkin && (
                            <div className="text-xs text-gray-500">
                              Check-in: {formatDateTime(convidado.data_checkin)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {convidado.telefone_convidado && (
                          <div className="flex items-center gap-1">
                            <MdPhone size={14} />
                            {convidado.telefone_convidado}
                          </div>
                        )}
                        {convidado.email_convidado && (
                          <div className="flex items-center gap-1 mt-1">
                            <MdEmail size={14} />
                            <span className="truncate max-w-xs">{convidado.email_convidado}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full border ${getStatusColor(convidado.status_checkin)}`}>
                        {getStatusIcon(convidado.status_checkin)}
                        {convidado.status_checkin}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {convidado.is_vip ? (
                        <MdStar size={24} className="text-yellow-500 inline" />
                      ) : (
                        <MdStarBorder size={24} className="text-gray-300 inline" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {convidado.beneficios ? (
                        <div className="flex items-start gap-1 text-sm text-gray-600">
                          <MdCardGiftcard size={16} className="mt-0.5 flex-shrink-0" />
                          <span>{convidado.beneficios}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Nenhum</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {convidado.status_checkin !== 'Check-in' && (
                          <button
                            onClick={() => handleCheckin(convidado.lista_convidado_id, 'Check-in')}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                          >
                            <MdCheckCircle size={16} />
                            Check-in
                          </button>
                        )}
                        {convidado.status_checkin !== 'No-Show' && (
                          <button
                            onClick={() => handleCheckin(convidado.lista_convidado_id, 'No-Show')}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                          >
                            <MdCancel size={16} />
                            No-Show
                          </button>
                        )}
                        {convidado.status_checkin !== 'Pendente' && (
                          <button
                            onClick={() => handleCheckin(convidado.lista_convidado_id, 'Pendente')}
                            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                          >
                            <MdPending size={16} />
                            Pendente
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredConvidados.length === 0 && (
            <div className="text-center py-12">
              <MdPerson size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum convidado encontrado
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter
                  ? 'Tente ajustar os filtros de busca'
                  : 'Esta lista ainda não possui convidados'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}







