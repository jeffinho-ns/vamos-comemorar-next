"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdCheckCircle,
  MdPending,
  MdPerson,
  MdRestaurant,
  MdEvent,
  MdPhone,
  MdAccessTime,
  MdSearch,
  MdClose,
  MdRefresh,
  MdGroups,
  MdTableBar,
  MdStar,
  MdArrowBack,
  MdVpnKey,
  MdEmail,
  MdDescription,
} from 'react-icons/md';
import { WithPermission } from '../../../../components/WithPermission/WithPermission';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.agilizaiapp.com.br';

// Tipos
interface EventoInfo {
  evento_id: number;
  nome: string;
  data_evento: string;
  horario: string;
  tipo_evento: string;
  establishment_id: number;
  establishment_name: string;
}

interface ReservaMesa {
  id: number;
  tipo: string;
  origem: string;
  responsavel: string;
  data_reserva: string;
  quantidade_convidados: number;
  total_convidados: number;
  convidados_checkin: number;
}

interface ConvidadoReserva {
  id: number;
  tipo: string;
  nome: string;
  email?: string;
  documento?: string;
  status: string;
  data_checkin?: string;
  origem: string;
  responsavel: string;
}

interface ConvidadoPromoter {
  id: number;
  tipo: string;
  nome: string;
  telefone?: string;
  status_checkin: 'Pendente' | 'Check-in' | 'No-Show';
  data_checkin?: string;
  is_vip: boolean;
  observacoes?: string;
  origem: string;
  tipo_lista: string;
  responsavel: string;
  promoter_id: number;
}

interface Promoter {
  id: number;
  tipo: string;
  nome: string;
  email?: string;
  telefone?: string;
  tipo_categoria?: string;
  total_listas: number;
  total_convidados: number;
  convidados_checkin: number;
}

interface Camarote {
  id: number;
  tipo: string;
  responsavel: string;
  origem: string;
  reservation_date: string;
  reservation_time: string;
  number_of_people: number;
  checked_in: boolean;
  checkin_time?: string;
  total_convidados: number;
  convidados_checkin: number;
}

interface Estatisticas {
  totalReservasMesa: number;
  totalConvidadosReservas: number;
  checkinConvidadosReservas: number;
  totalPromoters: number;
  totalConvidadosPromoters: number;
  checkinConvidadosPromoters: number;
  totalCamarotes: number;
  checkinCamarotes: number;
  totalGeral: number;
  checkinGeral: number;
}

export default function EventoCheckInsPage() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params?.id?.toString() ?? '';

  // Estados
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'todos' | 'reservas' | 'promoters' | 'camarotes'>('todos');
  
  // Dados
  const [evento, setEvento] = useState<EventoInfo | null>(null);
  const [reservasMesa, setReservasMesa] = useState<ReservaMesa[]>([]);
  const [convidadosReservas, setConvidadosReservas] = useState<ConvidadoReserva[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [convidadosPromoters, setConvidadosPromoters] = useState<ConvidadoPromoter[]>([]);
  const [camarotes, setCamarotes] = useState<Camarote[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    totalReservasMesa: 0,
    totalConvidadosReservas: 0,
    checkinConvidadosReservas: 0,
    totalPromoters: 0,
    totalConvidadosPromoters: 0,
    checkinConvidadosPromoters: 0,
    totalCamarotes: 0,
    checkinCamarotes: 0,
    totalGeral: 0,
    checkinGeral: 0,
  });

  // Carregar dados
  const loadCheckInData = useCallback(async () => {
    if (!eventoId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/v1/eventos/${eventoId}/checkins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos:', data);
        
        setEvento(data.evento);
        setReservasMesa(data.dados.reservasMesa || []);
        setConvidadosReservas(data.dados.convidadosReservas || []);
        setPromoters(data.dados.promoters || []);
        setConvidadosPromoters(data.dados.convidadosPromoters || []);
        setCamarotes(data.dados.camarotes || []);
        setEstatisticas(data.estatisticas);
      } else {
        console.error('Erro ao carregar dados:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [eventoId]);

  useEffect(() => {
    loadCheckInData();
  }, [loadCheckInData]);

  // Funções de check-in
  const handleConvidadoReservaCheckIn = async (convidado: ConvidadoReserva) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Usar a API de check-in de convidados existente
      const response = await fetch(`${API_URL}/api/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          convidadoId: convidado.id,
          eventId: eventoId 
        })
      });

      if (response.ok) {
        alert(`✅ Check-in de ${convidado.nome} confirmado!`);
        loadCheckInData();
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.message || 'Erro ao fazer check-in'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao fazer check-in');
    }
  };

  const handleConvidadoPromoterCheckIn = async (convidado: ConvidadoPromoter) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/v1/eventos/checkin/${convidado.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status_checkin: 'Check-in' })
      });

      if (response.ok) {
        alert(`✅ Check-in de ${convidado.nome} confirmado!`);
        loadCheckInData();
      } else {
        alert('❌ Erro ao fazer check-in');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao fazer check-in');
    }
  };

  const handleCamaroteCheckIn = async (camarote: Camarote) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/large-reservations/${camarote.id}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        alert(`✅ Check-in de ${camarote.responsavel} confirmado!`);
        loadCheckInData();
      } else {
        alert('❌ Erro ao fazer check-in');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao fazer check-in');
    }
  };

  // Filtrar por busca
  const filterBySearch = (text: string) => {
    if (!searchTerm.trim()) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Filtrar dados
  const filteredConvidadosReservas = convidadosReservas.filter(c => 
    filterBySearch(c.nome) || 
    filterBySearch(c.email || '') || 
    filterBySearch(c.responsavel) ||
    filterBySearch(c.origem)
  );

  const filteredConvidadosPromoters = convidadosPromoters.filter(c => 
    filterBySearch(c.nome) || 
    filterBySearch(c.telefone || '') || 
    filterBySearch(c.responsavel) ||
    filterBySearch(c.origem)
  );

  const filteredCamarotes = camarotes.filter(c => 
    filterBySearch(c.responsavel) || 
    filterBySearch(c.origem)
  );

  const filteredPromoters = promoters.filter(p => 
    filterBySearch(p.nome) || 
    filterBySearch(p.email || '') ||
    filterBySearch(p.telefone || '')
  );

  return (
    <WithPermission allowedRoles={["admin", "gerente", "hostess"]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <MdArrowBack size={24} />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <MdCheckCircle size={36} />
                  Check-ins do Evento
                </h1>
                {evento && (
                  <div className="mt-2 text-green-100 space-y-1">
                    <p className="text-lg font-semibold">{evento.nome}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>📅 {new Date(evento.data_evento).toLocaleDateString('pt-BR')}</span>
                      <span>🕐 {evento.horario}</span>
                      <span>🏢 {evento.establishment_name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Busca */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por nome, telefone, responsável..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <MdClose size={20} />
                    </button>
                  )}
                </div>
              </div>

              {/* Botão recarregar */}
              <button
                onClick={loadCheckInData}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold"
              >
                <MdRefresh className={loading ? 'animate-spin' : ''} size={20} />
                Atualizar
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4 overflow-x-auto">
              <button
                onClick={() => setSelectedTab('todos')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                  selectedTab === 'todos'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedTab('reservas')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                  selectedTab === 'reservas'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Reservas ({estatisticas.totalConvidadosReservas})
              </button>
              <button
                onClick={() => setSelectedTab('promoters')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                  selectedTab === 'promoters'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Promoters ({estatisticas.totalConvidadosPromoters})
              </button>
              <button
                onClick={() => setSelectedTab('camarotes')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                  selectedTab === 'camarotes'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Camarotes ({estatisticas.totalCamarotes})
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-4 border border-white/20">
              <div className="text-sm text-gray-300 mb-1">Total Geral</div>
              <div className="text-2xl font-bold text-white">
                {estatisticas.checkinGeral}/{estatisticas.totalGeral}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {estatisticas.totalGeral > 0 
                  ? `${Math.round((estatisticas.checkinGeral / estatisticas.totalGeral) * 100)}%`
                  : '0%'
                }
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-4 border border-blue-500/50">
              <div className="text-sm text-gray-300 mb-1">Reservas</div>
              <div className="text-2xl font-bold text-white">
                {estatisticas.checkinConvidadosReservas}/{estatisticas.totalConvidadosReservas}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-4 border border-purple-500/50">
              <div className="text-sm text-gray-300 mb-1">Promoters</div>
              <div className="text-2xl font-bold text-white">
                {estatisticas.checkinConvidadosPromoters}/{estatisticas.totalConvidadosPromoters}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-4 border border-orange-500/50">
              <div className="text-sm text-gray-300 mb-1">Camarotes</div>
              <div className="text-2xl font-bold text-white">
                {estatisticas.checkinCamarotes}/{estatisticas.totalCamarotes}
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <MdRefresh className="animate-spin inline-block text-green-600" size={48} />
              <p className="mt-4 text-gray-300">Carregando dados...</p>
            </div>
          )}

          {!loading && (
            <div className="space-y-6">
              {/* Convidados de Reservas */}
              {(selectedTab === 'todos' || selectedTab === 'reservas') && (
                <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MdGroups size={24} className="text-blue-400" />
                    Convidados de Reservas ({filteredConvidadosReservas.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredConvidadosReservas.map(convidado => (
                      <motion.div
                        key={convidado.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-lg p-4 ${
                          convidado.status === 'CHECK-IN'
                            ? 'bg-green-900/30 border-green-500/50'
                            : 'bg-white/5 border-white/20 hover:border-blue-400/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-white">{convidado.nome}</h3>
                            <div className="text-sm text-gray-300 space-y-1 mt-1">
                              <div className="text-xs text-gray-400">Lista: {convidado.origem}</div>
                              <div>Responsável: {convidado.responsavel}</div>
                              {convidado.email && (
                                <div className="flex items-center gap-1">
                                  <MdEmail size={14} />
                                  {convidado.email}
                                </div>
                              )}
                              {convidado.documento && (
                                <div className="flex items-center gap-1">
                                  <MdVpnKey size={14} />
                                  {convidado.documento}
                                </div>
                              )}
                            </div>
                          </div>
                          {convidado.status === 'CHECK-IN' && (
                            <MdCheckCircle size={32} className="text-green-400" />
                          )}
                        </div>

                        {convidado.status !== 'CHECK-IN' ? (
                          <button
                            onClick={() => handleConvidadoReservaCheckIn(convidado)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <MdCheckCircle size={20} />
                            Fazer Check-in
                          </button>
                        ) : (
                          <div className="text-center text-sm text-green-400 font-medium">
                            ✅ Check-in feito às {convidado.data_checkin ? new Date(convidado.data_checkin).toLocaleTimeString('pt-BR') : ''}
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {filteredConvidadosReservas.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-400">
                        Nenhum convidado de reserva encontrado
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Convidados de Promoters */}
              {(selectedTab === 'todos' || selectedTab === 'promoters') && (
                <>
                  {/* Lista de Promoters */}
                  {filteredPromoters.length > 0 && (
                    <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
                      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <MdStar size={24} className="text-yellow-400" />
                        Promoters ({filteredPromoters.length})
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPromoters.map(promoter => (
                          <motion.div
                            key={promoter.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border rounded-lg p-4 bg-purple-900/20 border-purple-500/50"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                  {promoter.nome}
                                  <MdStar size={20} className="text-yellow-400" />
                                </h3>
                                <div className="text-sm text-gray-300 space-y-1 mt-1">
                                  {promoter.email && (
                                    <div className="flex items-center gap-1">
                                      <MdEmail size={14} />
                                      {promoter.email}
                                    </div>
                                  )}
                                  {promoter.telefone && (
                                    <div className="flex items-center gap-1">
                                      <MdPhone size={14} />
                                      {promoter.telefone}
                                    </div>
                                  )}
                                  <div className="text-xs text-purple-300 mt-2">
                                    {promoter.convidados_checkin}/{promoter.total_convidados} convidados presentes
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Convidados dos Promoters */}
                  <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <MdEvent size={24} className="text-purple-400" />
                      Convidados de Promoters ({filteredConvidadosPromoters.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredConvidadosPromoters.map(convidado => (
                        <motion.div
                          key={convidado.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`border rounded-lg p-4 ${
                            convidado.status_checkin === 'Check-in'
                              ? 'bg-green-900/30 border-green-500/50'
                              : convidado.status_checkin === 'No-Show'
                              ? 'bg-red-900/30 border-red-500/50'
                              : 'bg-white/5 border-white/20 hover:border-purple-400/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-white">{convidado.nome}</h3>
                                {convidado.is_vip && (
                                  <MdStar size={20} className="text-yellow-400" title="VIP" />
                                )}
                              </div>
                              <div className="text-sm text-gray-300 space-y-1 mt-1">
                                <div className="text-xs text-gray-400">Lista: {convidado.origem}</div>
                                <div>Promoter: {convidado.responsavel}</div>
                                {convidado.telefone && (
                                  <div className="flex items-center gap-1">
                                    <MdPhone size={14} />
                                    {convidado.telefone}
                                  </div>
                                )}
                                {convidado.observacoes && (
                                  <div className="flex items-center gap-1">
                                    <MdDescription size={14} />
                                    <span className="text-xs">{convidado.observacoes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {convidado.status_checkin === 'Check-in' && (
                              <MdCheckCircle size={32} className="text-green-400" />
                            )}
                          </div>

                          {convidado.status_checkin === 'Pendente' ? (
                            <button
                              onClick={() => handleConvidadoPromoterCheckIn(convidado)}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <MdCheckCircle size={20} />
                              Fazer Check-in
                            </button>
                          ) : convidado.status_checkin === 'Check-in' ? (
                            <div className="text-center text-sm text-green-400 font-medium">
                              ✅ Check-in feito às {convidado.data_checkin ? new Date(convidado.data_checkin).toLocaleTimeString('pt-BR') : ''}
                            </div>
                          ) : (
                            <div className="text-center text-sm text-red-400 font-medium">
                              ❌ No-Show
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {filteredConvidadosPromoters.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-400">
                          Nenhum convidado de promoter encontrado
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* Camarotes */}
              {(selectedTab === 'todos' || selectedTab === 'camarotes') && filteredCamarotes.length > 0 && (
                <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MdTableBar size={24} className="text-orange-400" />
                    Camarotes / Reservas Grandes ({filteredCamarotes.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCamarotes.map(camarote => (
                      <motion.div
                        key={camarote.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-lg p-4 ${
                          camarote.checked_in
                            ? 'bg-green-900/30 border-green-500/50'
                            : 'bg-white/5 border-white/20 hover:border-orange-400/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-white">{camarote.responsavel}</h3>
                            <div className="text-sm text-gray-300 space-y-1 mt-1">
                              <div className="text-xs bg-orange-800/30 text-orange-300 px-2 py-1 rounded inline-block">
                                {camarote.origem}
                              </div>
                              <div className="flex items-center gap-1">
                                <MdAccessTime size={14} />
                                {camarote.reservation_time}
                              </div>
                              <div className="flex items-center gap-1">
                                <MdPerson size={14} />
                                {camarote.number_of_people} pessoas
                              </div>
                              {camarote.total_convidados > 0 && (
                                <div className="text-xs text-gray-400">
                                  {camarote.convidados_checkin}/{camarote.total_convidados} convidados presentes
                                </div>
                              )}
                            </div>
                          </div>
                          {camarote.checked_in && (
                            <MdCheckCircle size={32} className="text-green-400" />
                          )}
                        </div>

                        {!camarote.checked_in ? (
                          <button
                            onClick={() => handleCamaroteCheckIn(camarote)}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <MdCheckCircle size={20} />
                            Fazer Check-in
                          </button>
                        ) : (
                          <div className="text-center text-sm text-green-400 font-medium">
                            ✅ Check-in feito às {camarote.checkin_time ? new Date(camarote.checkin_time).toLocaleTimeString('pt-BR') : ''}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </WithPermission>
  );
}

