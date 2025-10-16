"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MdList,
  MdPerson,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdVisibility,
  MdArrowBack,
  MdEvent,
  MdFilterList
} from 'react-icons/md';

interface Lista {
  lista_id: number;
  evento_id: number;
  nome: string;
  tipo: string;
  promoter_nome: string | null;
  promoter_email: string | null;
  total_convidados: number;
  total_checkins: number;
  total_pendentes: number;
  total_noshow: number;
}

interface Evento {
  evento_id: number;
  nome: string;
  data_evento: string | null;
  horario_funcionamento: string;
  tipo_evento: 'unico' | 'semanal';
  dia_da_semana: number | null;
}

export default function ListasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventoIdParam = searchParams?.get('evento_id');

  const [loading, setLoading] = useState(true);
  const [listas, setListas] = useState<Lista[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEventoId, setSelectedEventoId] = useState<number | null>(
    eventoIdParam ? parseInt(eventoIdParam) : null
  );
  const [tipoFilter, setTipoFilter] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    fetchEventos();
  }, []);

  useEffect(() => {
    if (selectedEventoId) {
      fetchListas(selectedEventoId);
    }
  }, [selectedEventoId]);

  const fetchEventos = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/v1/eventos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar eventos');
      }

      const data = await response.json();
      if (data.success) {
        setEventos(data.eventos);
        // Se não tiver evento selecionado, seleciona o mais recente
        if (!selectedEventoId && data.eventos.length > 0) {
          setSelectedEventoId(data.eventos[0].evento_id);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar eventos:', error);
    }
  };

  const fetchListas = async (eventoId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/v1/eventos/${eventoId}/listas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar listas');
      }

      const data = await response.json();
      if (data.success) {
        setListas(data.listas);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar listas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Promoter':
        return 'bg-purple-100 text-purple-800';
      case 'Aniversário':
        return 'bg-pink-100 text-pink-800';
      case 'Casa':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const formatEventoDisplay = (evento: Evento) => {
    if (evento.tipo_evento === 'semanal' && evento.dia_da_semana !== null) {
      return `${evento.nome} (${getDiaSemanaTexto(evento.dia_da_semana)} - ${evento.horario_funcionamento})`;
    }
    return `${evento.nome} - ${evento.data_evento ? formatDate(evento.data_evento) : 'Data não definida'}`;
  };

  const filteredListas = tipoFilter
    ? listas.filter((l) => l.tipo === tipoFilter)
    : listas;

  const selectedEvento = eventos.find((e) => e.evento_id === selectedEventoId);

  if (loading && !eventos.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando listas...</p>
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
            onClick={() => router.push('/admin/eventos/dashboard')}
            className="flex items-center gap-2 text-white hover:text-green-100 mb-4 transition-colors"
          >
            <MdArrowBack size={20} />
            Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MdList size={36} />
            Listas de Convidados
          </h1>
          <p className="mt-2 text-green-100">
            Gerenciamento de listas e check-in de convidados
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seletor de Evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdEvent className="inline mr-2" />
                Selecione o Evento
              </label>
              <select
                value={selectedEventoId || ''}
                onChange={(e) => setSelectedEventoId(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecione um evento</option>
                {eventos.map((evento) => (
                  <option key={evento.evento_id} value={evento.evento_id}>
                    {formatEventoDisplay(evento)}
                    {evento.tipo_evento === 'semanal' ? ' ⟳' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdFilterList className="inline mr-2" />
                Tipo de Lista
              </label>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                <option value="Promoter">Promoter</option>
                <option value="Aniversário">Aniversário</option>
                <option value="Casa">Casa</option>
              </select>
            </div>
          </div>

          {/* Info do Evento Selecionado */}
          {selectedEvento && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedEvento.nome}</h3>
                    {selectedEvento.tipo_evento === 'semanal' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                        ⟳ Semanal
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedEvento.tipo_evento === 'semanal' && selectedEvento.dia_da_semana !== null
                      ? `Toda ${getDiaSemanaTexto(selectedEvento.dia_da_semana)} - ${selectedEvento.horario_funcionamento}`
                      : `${selectedEvento.data_evento ? formatDate(selectedEvento.data_evento) : 'Data não definida'} - ${selectedEvento.horario_funcionamento}`
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total de Listas</p>
                  <p className="text-2xl font-bold text-green-600">{filteredListas.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Listas Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando listas...</p>
          </div>
        ) : filteredListas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <MdList size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhuma lista encontrada
            </h3>
            <p className="text-gray-500">
              {selectedEventoId
                ? 'Este evento não possui listas cadastradas'
                : 'Selecione um evento para ver suas listas'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListas.map((lista, index) => (
              <motion.div
                key={lista.lista_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(lista.tipo)}`}>
                      {lista.tipo}
                    </span>
                    <MdList size={24} />
                  </div>
                  <h3 className="text-xl font-bold truncate">{lista.nome}</h3>
                  {lista.promoter_nome && (
                    <p className="text-sm text-green-100 mt-1 flex items-center gap-1">
                      <MdPerson size={16} />
                      {lista.promoter_nome}
                    </p>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <MdPerson size={20} className="mx-auto text-blue-600 mb-1" />
                      <p className="text-2xl font-bold text-blue-600">{lista.total_convidados}</p>
                      <p className="text-xs text-gray-600">Convidados</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <MdCheckCircle size={20} className="mx-auto text-green-600 mb-1" />
                      <p className="text-2xl font-bold text-green-600">{lista.total_checkins}</p>
                      <p className="text-xs text-gray-600">Check-ins</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <MdPending size={20} className="mx-auto text-yellow-600 mb-1" />
                      <p className="text-2xl font-bold text-yellow-600">{lista.total_pendentes}</p>
                      <p className="text-xs text-gray-600">Pendentes</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <MdCancel size={20} className="mx-auto text-red-600 mb-1" />
                      <p className="text-2xl font-bold text-red-600">{lista.total_noshow}</p>
                      <p className="text-xs text-gray-600">No-Show</p>
                    </div>
                  </div>

                  {/* Taxa de Conversão */}
                  {lista.total_convidados > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Taxa de Check-in:</span>
                        <span className="font-bold text-green-600">
                          {Math.round((lista.total_checkins / lista.total_convidados) * 100)}%
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.round((lista.total_checkins / lista.total_convidados) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Botão Ver Detalhes */}
                  <button
                    onClick={() => router.push(`/admin/eventos/listas/${lista.lista_id}/detalhes`)}
                    className="w-full mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <MdVisibility size={20} />
                    Ver Detalhes
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

