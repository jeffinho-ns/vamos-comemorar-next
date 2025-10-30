"use client";
import React from 'react';

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

interface ReservaRestaurante {
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

interface ConvidadoReservaRestaurante {
  id: number;
  tipo: string;
  nome: string;
  telefone?: string;
  data_nascimento?: string;
  status_checkin: number | boolean;
  data_checkin?: string;
  responsavel: string;
  origem: string;
  reserva_id: number;
}

interface GuestListRestaurante {
  guest_list_id: number;
  reservation_type: string;
  event_type?: string;
  shareable_link_token: string;
  expires_at: string;
  owner_checked_in: number;
  owner_checkin_time?: string;
  is_valid: number;
  owner_name: string;
  reservation_id: number;
  reservation_date: string;
  reservation_time: string;
  number_of_people: number;
  origin: string;
  reservation_checked_in: number;
  reservation_checkin_time?: string;
  created_by_name: string;
  total_guests: number;
  guests_checked_in: number;
  establishment_id?: number;
  establishment_name?: string;
}

interface GuestItem {
  id: number;
  name: string;
  whatsapp?: string;
  checked_in: number | boolean;
  checkin_time?: string;
  created_at?: string;
}

interface Estatisticas {
  totalReservasMesa: number;
  totalConvidadosReservas: number;
  checkinConvidadosReservas: number;
  totalReservasRestaurante: number;
  totalConvidadosReservasRestaurante: number;
  checkinConvidadosReservasRestaurante: number;
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
  const [reservasRestaurante, setReservasRestaurante] = useState<ReservaRestaurante[]>([]);
  const [convidadosReservasRestaurante, setConvidadosReservasRestaurante] = useState<ConvidadoReservaRestaurante[]>([]);
  const [guestListsRestaurante, setGuestListsRestaurante] = useState<GuestListRestaurante[]>([]);
  const [establishmentFilterId, setEstablishmentFilterId] = useState<number | null>(null);
  const [expandedGuestListId, setExpandedGuestListId] = useState<number | null>(null);
  const [guestsByList, setGuestsByList] = useState<Record<number, GuestItem[]>>({});
  const [guestSearch, setGuestSearch] = useState<Record<number, string>>({});
  const [checkInStatus, setCheckInStatus] = useState<Record<number, { ownerCheckedIn: boolean; guestsCheckedIn: number; totalGuests: number }>>({});
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [convidadosPromoters, setConvidadosPromoters] = useState<ConvidadoPromoter[]>([]);
  const [camarotes, setCamarotes] = useState<Camarote[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    totalReservasMesa: 0,
    totalConvidadosReservas: 0,
    checkinConvidadosReservas: 0,
    totalReservasRestaurante: 0,
    totalConvidadosReservasRestaurante: 0,
    checkinConvidadosReservasRestaurante: 0,
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
        setReservasRestaurante(data.dados.reservasRestaurante || []);
        setConvidadosReservasRestaurante(data.dados.convidadosReservasRestaurante || []);
        
        // Debug: verificar dados recebidos do backend
        console.log('🔍 Debug - Dados recebidos do backend:', {
          establishment_id: data.evento?.establishment_id,
          establishment_name: data.evento?.establishment_name,
          data_evento: data.evento?.data_evento,
          guestListsRestaurante_count: (data.dados.guestListsRestaurante || []).length,
          reservasRestaurante_count: (data.dados.reservasRestaurante || []).length,
          convidadosReservasRestaurante_count: (data.dados.convidadosReservasRestaurante || []).length
        });
        
        // O backend agora vincula automaticamente reservas ao evento e retorna os dados corretos
        // Não precisamos mais buscar via API admin/guest-lists
        setGuestListsRestaurante(data.dados.guestListsRestaurante || []);
        
        // Armazenar o establishment_id para uso posterior se necessário
        if (data.evento?.establishment_id) {
          setEstablishmentFilterId(Number(data.evento.establishment_id));
        }
        
        console.log('📋 Total de guest lists para exibir:', (data.dados.guestListsRestaurante || []).length);
        
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

  const handleReservaRestauranteCheckIn = async (reserva: ReservaRestaurante) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/restaurant-reservations/${reserva.id}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        alert(`✅ Check-in de ${reserva.responsavel} confirmado!`);
        loadCheckInData();
      } else {
        alert('❌ Erro ao fazer check-in');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao fazer check-in');
    }
  };

  const handleConvidadoReservaRestauranteCheckIn = async (convidado: ConvidadoReservaRestaurante) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/guest-lists/guests/${convidado.id}/checkin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ checked_in: true })
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

  // Funções para guest lists (replicando Sistema de Reservas)
  const handleOwnerCheckIn = async (guestListId: number, ownerName: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/guest-lists/${guestListId}/owner-checkin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setCheckInStatus(prev => ({
          ...prev,
          [guestListId]: { ...prev[guestListId], ownerCheckedIn: true }
        }));
        alert(`✅ Check-in de ${ownerName} confirmado!`);
        loadCheckInData();
      } else {
        alert('❌ Erro ao fazer check-in do dono');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao fazer check-in do dono');
    }
  };

  const handleGuestCheckIn = async (guestListId: number, guestId: number, guestName: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/guest-lists/guests/${guestId}/checkin`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ checked_in: true })
      });

      if (response.ok) {
        setGuestsByList(prev => ({
          ...prev,
          [guestListId]: (prev[guestListId] || []).map(g => 
            g.id === guestId ? { ...g, checked_in: true } : g
          )
        }));
        setCheckInStatus(prev => ({
          ...prev,
          [guestListId]: {
            ...prev[guestListId],
            guestsCheckedIn: (prev[guestListId]?.guestsCheckedIn || 0) + 1
          }
        }));
        alert(`✅ Check-in de ${guestName} confirmado!`);
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

  // Normalizador para comparação de nomes de estabelecimentos
  const normalizeName = (name: string): string => {
    if (!name) return '';
    return name
      .replace(/Jutino|Jutstino/gi, 'Justino')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ') // remove pontuação, hífens etc.
      .replace(/\s+/g, ' ')
      .trim();
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

  const filteredReservasRestaurante = reservasRestaurante.filter(r => 
    filterBySearch(r.responsavel) || 
    filterBySearch(r.origem)
  );

  const filteredConvidadosReservasRestaurante = convidadosReservasRestaurante.filter(c => 
    filterBySearch(c.nome) || 
    filterBySearch(c.telefone || '') || 
    filterBySearch(c.responsavel) ||
    filterBySearch(c.origem) ||
    filterBySearch(c.data_nascimento || '')
  );

  const filteredPromoters = promoters.filter(p => 
    filterBySearch(p.nome) || 
    filterBySearch(p.email || '') ||
    filterBySearch(p.telefone || '')
  );

  return (
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
                    <span>📅 {(() => {
                      const raw = evento.data_evento || '';
                      const datePart = raw.split('T')[0].split(' ')[0];
                      if (datePart && datePart.length === 10) {
                        const d = new Date(`${datePart}T12:00:00`);
                        return isNaN(d.getTime()) ? 'Data inválida' : d.toLocaleDateString('pt-BR');
                      }
                      const d2 = new Date(raw);
                      return isNaN(d2.getTime()) ? 'Data inválida' : d2.toLocaleDateString('pt-BR');
                    })()}</span>
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
              {/* Reservas de Mesa */}
              {(selectedTab === 'todos' || selectedTab === 'reservas') && reservasMesa.length > 0 && (
                <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MdTableBar size={24} className="text-blue-400" />
                    Reservas de Mesa ({reservasMesa.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reservasMesa.map((reserva) => (
                      <motion.div
                        key={reserva.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-lg p-4 ${
                          reserva.convidados_checkin > 0
                            ? 'bg-blue-900/20 border-blue-500/40'
                            : 'bg-white/5 border-white/20 hover:border-blue-400/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-white">{reserva.responsavel}</h3>
                            <div className="text-sm text-gray-300 space-y-1 mt-1">
                              <div className="text-xs text-gray-400">Origem: {reserva.origem || '—'}</div>
                              <div className="flex items-center gap-1">
                                <MdAccessTime size={14} />
                                {reserva.data_reserva || '—'}
                              </div>
                              <div className="flex items-center gap-1">
                                <MdPerson size={14} />
                                {reserva.quantidade_convidados ?? reserva.total_convidados ?? 0} pessoas
                              </div>
                              {typeof reserva.total_convidados === 'number' && (
                                <div className="text-xs text-gray-400">
                                  {reserva.convidados_checkin || 0}/{reserva.total_convidados} convidados presentes
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

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

              {/* Guest Lists de Reservas de Restaurante (Sistema de Reservas) */}
            {(selectedTab === 'todos' || selectedTab === 'reservas') && (
                <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MdRestaurant size={24} className="text-green-400" />
                    Lista de Convidados - Reservas de Restaurante ({guestListsRestaurante.length})
                  </h2>
                  
                  <div className="space-y-3">
                    {guestListsRestaurante
                      // Os dados já vêm filtrados do backend por establishment_id e data_evento
                      // Apenas aplicar filtro de busca textual
                      .filter(gl => filterBySearch(gl.owner_name) || filterBySearch(gl.origin))
                      .map((gl) => {
                        const listUrl = `https://agilizaiapp.com.br/lista/${gl.shareable_link_token}`;
                        
                        return (
                          <div key={gl.guest_list_id} className="border rounded-lg border-white/20 bg-white/5">
                            <div
                              onClick={async () => {
                                setExpandedGuestListId(expandedGuestListId === gl.guest_list_id ? null : gl.guest_list_id);
                                if (!guestsByList[gl.guest_list_id]) {
                                  try {
                                    const token = localStorage.getItem('authToken');
                                    
                                    // Carregar convidados
                                    const guestsRes = await fetch(`${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/guests`, { 
                                      headers: { Authorization: `Bearer ${token}` } 
                                    });
                                    
                                    let guestsData: { guests: GuestItem[] } | null = null;
                                    if (guestsRes.ok) {
                                      guestsData = await guestsRes.json();
                                      setGuestsByList(prev => ({ ...prev, [gl.guest_list_id]: guestsData?.guests || [] }));
                                    }

                                    // Carregar status de check-in
                                    const checkinRes = await fetch(`${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/checkin-status`, { 
                                      headers: { Authorization: `Bearer ${token}` } 
                                    });
                                    
                                    if (checkinRes.ok) {
                                      const checkinData = await checkinRes.json();
                                      setCheckInStatus(prev => ({
                                        ...prev,
                                        [gl.guest_list_id]: {
                                          ownerCheckedIn: checkinData.checkin_status.owner_checked_in,
                                          guestsCheckedIn: checkinData.checkin_status.guests_checked_in,
                                          totalGuests: checkinData.checkin_status.total_guests
                                        }
                                      }));
                                    } else {
                                      const guestsCheckedIn = guestsData ? guestsData.guests.filter(g => g.checked_in).length : 0;
                                      setCheckInStatus(prev => ({
                                        ...prev,
                                        [gl.guest_list_id]: {
                                          ownerCheckedIn: gl.owner_checked_in === 1,
                                          guestsCheckedIn: guestsCheckedIn,
                                          totalGuests: guestsData ? guestsData.guests.length : 0
                                        }
                                      }));
                                    }
                                  } catch (e) { console.error(e); }
                                }
                              }}
                              className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{gl.owner_name}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    gl.reservation_type === 'large' 
                                      ? 'bg-orange-100 text-orange-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    Reserva Normal
                                  </span>
                                </div>
                                <div className="text-sm text-gray-300 mt-1">
                                  {gl.reservation_date ? new Date(gl.reservation_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data não informada'} 
                                  {gl.event_type ? ` • ${gl.event_type}` : ''} • {gl.reservation_time}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Criado por: {gl.created_by_name}
                                </div>
                                
                                {/* Check-in do dono */}
                                <div className="mt-2 flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOwnerCheckIn(gl.guest_list_id, gl.owner_name);
                                    }}
                                    className={`px-3 py-1 text-xs rounded-full transition-colors font-medium ${
                                      checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1
                                        ? 'bg-green-100 text-green-700 border border-green-300'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                                    }`}
                                  >
                                    {checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1 ? '✅ Dono Presente' : '📋 Check-in Dono'}
                                  </button>
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ${gl.is_valid === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {gl.is_valid === 1 ? 'Ativo' : 'Expirado'}
                              </span>
                            </div>

                            {expandedGuestListId === gl.guest_list_id && (
                              <div className="p-4 space-y-3 bg-white/5">
                                {/* Resumo de presença */}
                                <div className="bg-white/10 rounded-lg p-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300">Resumo de Presença:</span>
                                    <div className="flex gap-4">
                                      <span className={`px-2 py-1 rounded-full text-xs ${
                                        checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        Dono: {(checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1) ? '✅ Presente' : '⏳ Aguardando'}
                                      </span>
                                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                                        Convidados: {checkInStatus[gl.guest_list_id]?.guestsCheckedIn || 0} / {(guestsByList[gl.guest_list_id] || []).length || gl.total_guests}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Busca rápida por nome/telefone */}
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={guestSearch[gl.guest_list_id] || ''}
                                    onChange={(e) => setGuestSearch(prev => ({ ...prev, [gl.guest_list_id]: e.target.value }))}
                                    placeholder="Buscar convidado por nome ou WhatsApp..."
                                    className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                </div>

                                {/* Lista de convidados */}
                                <div className="border rounded border-white/20 bg-white/5">
                                  <table className="min-w-full divide-y divide-white/20">
                                    <thead className="bg-white/10">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">WhatsApp</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Ação</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white/5 divide-y divide-white/10">
                                      {(guestsByList[gl.guest_list_id] || [])
                                        .filter((g) => {
                                          const q = (guestSearch[gl.guest_list_id] || '').toLowerCase();
                                          if (!q) return true;
                                          return (
                                            g.name.toLowerCase().includes(q) ||
                                            (g.whatsapp || '').toLowerCase().includes(q)
                                          );
                                        })
                                        .map((g) => {
                                        const isCheckedIn = g.checked_in === 1 || g.checked_in === true;
                                        return (
                                          <tr key={g.id} className="hover:bg-white/10">
                                            <td className="px-4 py-2 text-sm text-white">{g.name}</td>
                                            <td className="px-4 py-2 text-sm text-gray-300">{g.whatsapp || '-'}</td>
                                            <td className="px-4 py-2 text-sm">
                                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                isCheckedIn
                                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                                  : 'bg-gray-100 text-gray-600 border border-gray-300'
                                              }`}>
                                                {isCheckedIn ? '✅ Presente' : '⏳ Aguardando'}
                                              </span>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                              {!isCheckedIn && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleGuestCheckIn(gl.guest_list_id, g.id, g.name);
                                                  }}
                                                  className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded border border-green-300"
                                                >
                                                  📋 Check-in
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                      {(!guestsByList[gl.guest_list_id] || guestsByList[gl.guest_list_id].length === 0) && (
                                        <tr>
                                          <td className="px-4 py-4 text-sm text-gray-400 text-center" colSpan={4}>
                                            Nenhum convidado cadastrado nesta lista.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                    })
                  }
                  {guestListsRestaurante.length === 0 && (
                    <div className="text-sm text-gray-400 px-4 py-6 border rounded-lg border-white/10 bg-white/5">
                      Nenhuma lista de convidados encontrada para este estabelecimento e data.
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
  );
}

