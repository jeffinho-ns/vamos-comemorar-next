"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdList,
  MdPerson,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdVisibility,
  MdArrowBack,
  MdEvent,
  MdFilterList,
  MdExpandMore,
  MdExpandLess,
  MdPhone,
  MdEmail,
  MdStar,
  MdStarBorder,
  MdRefresh
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
}

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
  convidados?: Convidado[];
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
  const [expandedListas, setExpandedListas] = useState<Set<number>>(new Set());
  const [checkingIn, setCheckingIn] = useState<number | null>(null);

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
        console.log('📋 Listas carregadas:', data.listas);
        console.log('📋 Evento:', data.evento);
        setListas(data.listas);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar listas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleListaExpansion = (listaId: number) => {
    setExpandedListas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listaId)) {
        newSet.delete(listaId);
      } else {
        newSet.add(listaId);
      }
      return newSet;
    });
  };

  const handleCheckin = async (convidadoId: number, novoStatus: string, listaId: number) => {
    try {
      setCheckingIn(convidadoId);
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
        setListas(prev =>
          prev.map(lista => {
            if (lista.lista_id === listaId && lista.convidados) {
              const updatedConvidados = lista.convidados.map(c =>
                c.lista_convidado_id === convidadoId
                  ? { ...c, status_checkin: novoStatus as any, data_checkin: new Date().toISOString() }
                  : c
              );
              
              // Recalcular totais
              const total_checkins = updatedConvidados.filter(c => c.status_checkin === 'Check-in').length;
              const total_pendentes = updatedConvidados.filter(c => c.status_checkin === 'Pendente').length;
              const total_noshow = updatedConvidados.filter(c => c.status_checkin === 'No-Show').length;
              
              return {
                ...lista,
                convidados: updatedConvidados,
                total_checkins,
                total_pendentes,
                total_noshow
              };
            }
            return lista;
          })
        );
        
        // Mostrar feedback visual
        const statusText = novoStatus === 'Check-in' ? '✅ Check-in' : novoStatus === 'No-Show' ? '❌ No-Show' : '⏳ Pendente';
        console.log(`${statusText} realizado com sucesso!`);
      }
    } catch (error) {
      console.error('❌ Erro ao fazer check-in:', error);
      alert('Erro ao atualizar check-in. Tente novamente.');
    } finally {
      setCheckingIn(null);
    }
  };

  const handleCheckInAll = async (listaId: number) => {
    const lista = listas.find(l => l.lista_id === listaId);
    if (!lista || !lista.convidados) return;
    
    const convidadosPendentes = lista.convidados.filter(c => c.status_checkin === 'Pendente');
    
    if (convidadosPendentes.length === 0) {
      alert('Não há convidados pendentes nesta lista.');
      return;
    }
    
    if (!confirm(`Deseja fazer check-in de ${convidadosPendentes.length} convidados?`)) {
      return;
    }
    
    for (const convidado of convidadosPendentes) {
      await handleCheckin(convidado.lista_convidado_id, 'Check-in', listaId);
    }
    
    alert(`✅ Check-in em lote realizado! ${convidadosPendentes.length} convidados.`);
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

  // Importar funções de formatação de data
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
            <p className="text-gray-500 mb-4">
              {selectedEventoId
                ? 'Este evento não possui listas cadastradas ainda.'
                : 'Selecione um evento para ver suas listas'}
            </p>
            {selectedEventoId && (
              <div className="mt-6 max-w-2xl mx-auto text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">💡 Como criar listas:</h4>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li>• As listas são criadas pelos promoters vinculados ao evento</li>
                  <li>• Certifique-se de que há promoters associados a este evento</li>
                  <li>• Verifique se o evento está habilitado para usar listas (<code className="bg-yellow-100 px-1 rounded">usado_para_listas = TRUE</code>)</li>
                  <li>• Consulte o arquivo <code className="bg-yellow-100 px-1 rounded">PASSOS_PARA_VER_LISTAS.md</code> para mais detalhes</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <p className="text-sm text-yellow-700">
                    <strong>Evento ID:</strong> {selectedEventoId} - Use este ID para verificar no banco de dados
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    <strong>Evento:</strong> {selectedEvento?.nome || 'Nome não disponível'}
                  </p>
                  <p className="text-sm text-yellow-700">
                    <strong>Tipo:</strong> {selectedEvento?.tipo_evento === 'semanal' ? 'Semanal' : 'Único'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredListas.map((lista, index) => {
              const isExpanded = expandedListas.has(lista.lista_id);
              const convidados = lista.convidados || [];
              
              return (
                <motion.div
                  key={lista.lista_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(lista.tipo)}`}>
                            {lista.tipo}
                          </span>
                          <h3 className="text-xl font-bold">{lista.nome}</h3>
                        </div>
                        {lista.promoter_nome && (
                          <p className="text-sm text-green-100 flex items-center gap-1">
                            <MdPerson size={16} />
                            {lista.promoter_nome}
                          </p>
                        )}
                      </div>
                      <MdList size={32} className="opacity-50" />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-4">
                    {/* Estatísticas em linha */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

                    {/* Botões de Ação */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleListaExpansion(lista.lista_id)}
                        className="flex-1 min-w-[200px] px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        {isExpanded ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                        {isExpanded ? 'Ocultar Convidados' : `Ver Convidados (${convidados.length})`}
                      </button>
                      
                      {lista.total_pendentes > 0 && (
                        <button
                          onClick={() => handleCheckInAll(lista.lista_id)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <MdCheckCircle size={20} />
                          Check-in em Lote
                        </button>
                      )}
                      
                      <button
                        onClick={() => fetchListas(selectedEventoId!)}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <MdRefresh size={20} />
                        Atualizar
                      </button>
                      
                      <button
                        onClick={() => router.push(`/admin/eventos/listas/${lista.lista_id}/detalhes`)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <MdVisibility size={20} />
                        Detalhes
                      </button>
                    </div>

                    {/* Lista de Convidados Expandida */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-200 pt-4"
                        >
                          {convidados.length > 0 ? (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                              {convidados.map((convidado) => (
                                <motion.div
                                  key={convidado.lista_convidado_id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    {/* Info do Convidado */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        {convidado.is_vip ? (
                                          <MdStar size={18} className="text-yellow-500 flex-shrink-0" />
                                        ) : (
                                          <MdPerson size={18} className="text-gray-400 flex-shrink-0" />
                                        )}
                                        <p className="font-semibold text-gray-900 truncate">
                                          {convidado.nome_convidado}
                                        </p>
                                      </div>
                                      
                                      {/* Contatos */}
                                      <div className="text-xs text-gray-600 space-y-1">
                                        {convidado.telefone_convidado && (
                                          <div className="flex items-center gap-1">
                                            <MdPhone size={12} />
                                            <span>{convidado.telefone_convidado}</span>
                                          </div>
                                        )}
                                        {convidado.email_convidado && (
                                          <div className="flex items-center gap-1">
                                            <MdEmail size={12} />
                                            <span className="truncate">{convidado.email_convidado}</span>
                                          </div>
                                        )}
                                        {convidado.beneficios && (
                                          <div className="text-green-600 font-medium">
                                            🎁 {convidado.beneficios}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Status e Ações */}
                                    <div className="flex flex-col items-end gap-2">
                                      {/* Badge de Status */}
                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                        convidado.status_checkin === 'Check-in'
                                          ? 'bg-green-100 text-green-800'
                                          : convidado.status_checkin === 'Pendente'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {convidado.status_checkin}
                                      </span>

                                      {/* Botões de Check-in */}
                                      <div className="flex gap-1">
                                        {convidado.status_checkin !== 'Check-in' && (
                                          <button
                                            onClick={() => handleCheckin(convidado.lista_convidado_id, 'Check-in', lista.lista_id)}
                                            disabled={checkingIn === convidado.lista_convidado_id}
                                            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                                            title="Check-in"
                                          >
                                            <MdCheckCircle size={14} />
                                          </button>
                                        )}
                                        {convidado.status_checkin !== 'No-Show' && (
                                          <button
                                            onClick={() => handleCheckin(convidado.lista_convidado_id, 'No-Show', lista.lista_id)}
                                            disabled={checkingIn === convidado.lista_convidado_id}
                                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                                            title="No-Show"
                                          >
                                            <MdCancel size={14} />
                                          </button>
                                        )}
                                        {convidado.status_checkin !== 'Pendente' && (
                                          <button
                                            onClick={() => handleCheckin(convidado.lista_convidado_id, 'Pendente', lista.lista_id)}
                                            disabled={checkingIn === convidado.lista_convidado_id}
                                            className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                                            title="Marcar como Pendente"
                                          >
                                            <MdPending size={14} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <MdPerson size={48} className="mx-auto mb-2 opacity-30" />
                              <p>Nenhum convidado cadastrado nesta lista</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

