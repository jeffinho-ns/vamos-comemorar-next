"use client";
import React from 'react';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  MdViewList,
  MdViewModule,
  MdAttachMoney,
} from 'react-icons/md';
import { WithPermission } from '../../../../components/WithPermission/WithPermission';
import EntradaStatusModal, { EntradaTipo } from '../../../../components/EntradaStatusModal';

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
  entrada_tipo?: EntradaTipo;
  entrada_valor?: number;
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
  entrada_tipo?: EntradaTipo;
  entrada_valor?: number;
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
  entrada_tipo?: EntradaTipo;
  entrada_valor?: number;
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
  const [promoterGuestsViewMode, setPromoterGuestsViewMode] = useState<'grid' | 'list'>('grid');
  const [promoterGuestsSearch, setPromoterGuestsSearch] = useState('');
  
  // Estados para modal de status de entrada
  const [entradaModalOpen, setEntradaModalOpen] = useState(false);
  const [convidadoParaCheckIn, setConvidadoParaCheckIn] = useState<{
    tipo: 'reserva' | 'promoter' | 'guest_list';
    id: number;
    nome: string;
    guestListId?: number; // Para guest lists
  } | null>(null);
  const [arrecadacao, setArrecadacao] = useState<{
    totalGeral: number;
    porPromoter: Record<number, { nome: string; total: number }>;
    porTipo: { vip: number; seco: number; consuma: number };
  }>({
    totalGeral: 0,
    porPromoter: {},
    porTipo: { vip: 0, seco: 0, consuma: 0 }
  });
  
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
  
  // Função helper para validar se um item é realmente um convidado de promoter
  const isValidPromoterGuest = (c: any): c is ConvidadoPromoter => {
    return (
      c &&
      typeof c === 'object' &&
      c.tipo === 'convidado_promoter' &&
      c.status_checkin !== undefined &&
      c.status_checkin !== null &&
      ['Pendente', 'Check-in', 'No-Show'].includes(c.status_checkin) &&
      c.promoter_id !== undefined &&
      c.promoter_id !== null &&
      typeof c.promoter_id === 'number' &&
      c.tipo_lista !== undefined &&
      c.tipo_lista !== null &&
      (c.status === undefined || c.status === null) &&
      (!c.email || c.email === null || c.email === '') &&
      (!c.documento || c.documento === null || c.documento === '')
    );
  };
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
        
        // Debug: verificar dados brutos recebidos do backend
        console.log('🔍 Debug - Dados brutos do backend:', {
          convidadosPromoters_raw: data.dados.convidadosPromoters?.length || 0,
          convidadosReservas_raw: data.dados.convidadosReservas?.length || 0,
          tipos_convidadosPromoters: [...new Set(data.dados.convidadosPromoters?.map((c: any) => c.tipo) || [])],
          tipos_convidadosReservas: [...new Set(data.dados.convidadosReservas?.map((c: any) => c.tipo) || [])],
        });
        
        // VALIDAÇÃO RIGOROSA: Garantir que apenas convidados de promoters sejam exibidos
        // Limpar array primeiro
        setConvidadosPromoters([]);
        
        // Filtrar e validar apenas convidados de promoters
        const convidadosPromotersFiltrados = (data.dados.convidadosPromoters || [])
          .filter((c: any) => {
            if (!isValidPromoterGuest(c)) {
              console.warn('⚠️ Item REJEITADO da lista de promoters (não é um convidado de promoter válido):', {
                id: c?.id,
                nome: c?.nome,
                tipo: c?.tipo,
                status_checkin: c?.status_checkin,
                status: c?.status,
                promoter_id: c?.promoter_id,
                email: c?.email,
                documento: c?.documento
              });
              return false;
            }
            return true;
          })
          .map((c: any) => ({
            ...c,
            // Garantir que todos os campos obrigatórios estão presentes
            tipo: 'convidado_promoter' as const,
            status_checkin: c.status_checkin as 'Pendente' | 'Check-in' | 'No-Show',
            promoter_id: Number(c.promoter_id),
            tipo_lista: c.tipo_lista || ''
          }));
        
        console.log('✅ Convidados de Promoters FINAL após filtro:', {
          total: convidadosPromotersFiltrados.length,
          validados: convidadosPromotersFiltrados.length,
          primeiros: convidadosPromotersFiltrados.slice(0, 3).map((c: any) => ({
            id: c.id,
            nome: c.nome,
            tipo: c.tipo,
            promoter_id: c.promoter_id
          }))
        });
        
        setConvidadosPromoters(convidadosPromotersFiltrados);
        setCamarotes(data.dados.camarotes || []);
        setEstatisticas(data.estatisticas);
        
        // A arrecadação será calculada automaticamente pelo useEffect quando os estados mudarem
        
        // Debug: verificar dados filtrados
        console.log('✅ Debug - Convidados de Promoters Filtrados:', {
          total: convidadosPromotersFiltrados.length,
          tipos: [...new Set(convidadosPromotersFiltrados.map((c: any) => c.tipo))],
          primeiros: convidadosPromotersFiltrados.slice(0, 3).map((c: any) => ({
            id: c.id,
            nome: c.nome,
            tipo: c.tipo,
            responsavel: c.responsavel
          }))
        });
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

  // Função para calcular arrecadação
  const calcularArrecadacao = useCallback((
    convidadosReservas: ConvidadoReserva[],
    convidadosPromoters: ConvidadoPromoter[],
    promotersList: Promoter[],
    guestsByList: Record<number, GuestItem[]>
  ) => {
    let totalGeral = 0;
    const porPromoter: Record<number, { nome: string; total: number }> = {};
    const porTipo = { vip: 0, seco: 0, consuma: 0 };

    // Calcular de convidados de reservas
    convidadosReservas.forEach(c => {
      if (c.status === 'CHECK-IN' && c.entrada_valor) {
        totalGeral += c.entrada_valor;
        if (c.entrada_tipo === 'SECO') porTipo.seco += c.entrada_valor;
        else if (c.entrada_tipo === 'CONSUMA') porTipo.consuma += c.entrada_valor;
        else if (c.entrada_tipo === 'VIP') porTipo.vip += 0;
      }
    });

    // Calcular de convidados de promoters
    convidadosPromoters.forEach(c => {
      if (c.status_checkin === 'Check-in' && c.entrada_valor) {
        totalGeral += c.entrada_valor;
        if (c.entrada_tipo === 'SECO') porTipo.seco += c.entrada_valor;
        else if (c.entrada_tipo === 'CONSUMA') porTipo.consuma += c.entrada_valor;
        else if (c.entrada_tipo === 'VIP') porTipo.vip += 0;

        // Acumular por promoter
        if (c.promoter_id) {
          const promoter = promotersList.find(p => p.id === c.promoter_id);
          if (promoter) {
            if (!porPromoter[c.promoter_id]) {
              porPromoter[c.promoter_id] = { nome: promoter.nome, total: 0 };
            }
            porPromoter[c.promoter_id].total += c.entrada_valor || 0;
          }
        }
      }
    });

    // Calcular de guests (guest lists de restaurante)
    Object.values(guestsByList).flat().forEach(g => {
      if ((g.checked_in === 1 || g.checked_in === true) && g.entrada_valor) {
        totalGeral += g.entrada_valor;
        if (g.entrada_tipo === 'SECO') porTipo.seco += g.entrada_valor;
        else if (g.entrada_tipo === 'CONSUMA') porTipo.consuma += g.entrada_valor;
        else if (g.entrada_tipo === 'VIP') porTipo.vip += 0;
      }
    });

    setArrecadacao({ totalGeral, porPromoter, porTipo });
  }, []);

  // Recalcular arrecadação quando os dados mudarem
  useEffect(() => {
    if (convidadosReservas.length > 0 || convidadosPromoters.length > 0 || Object.keys(guestsByList).length > 0) {
      calcularArrecadacao(
        convidadosReservas,
        convidadosPromoters,
        promoters,
        guestsByList
      );
    }
  }, [convidadosReservas, convidadosPromoters, promoters, guestsByList, calcularArrecadacao]);

  // Funções de check-in - Abre modal primeiro
  const handleConvidadoReservaCheckIn = (convidado: ConvidadoReserva) => {
    setConvidadoParaCheckIn({
      tipo: 'reserva',
      id: convidado.id,
      nome: convidado.nome
    });
    setEntradaModalOpen(true);
  };

  const handleConvidadoPromoterCheckIn = (convidado: ConvidadoPromoter) => {
    setConvidadoParaCheckIn({
      tipo: 'promoter',
      id: convidado.id,
      nome: convidado.nome
    });
    setEntradaModalOpen(true);
  };

  // Função que realmente faz o check-in após seleção do status
  const handleConfirmarCheckIn = async (tipo: EntradaTipo, valor: number) => {
    if (!convidadoParaCheckIn) return;

    try {
      const token = localStorage.getItem('authToken');
      let response;

      if (convidadoParaCheckIn.tipo === 'reserva') {
        // Check-in de convidado de reserva
        response = await fetch(`${API_URL}/api/checkin`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            convidadoId: convidadoParaCheckIn.id,
            eventId: eventoId,
            entrada_tipo: tipo,
            entrada_valor: valor
          })
        });
      } else if (convidadoParaCheckIn.tipo === 'guest_list') {
        // Check-in de convidado de guest list (reservas de restaurante)
        response = await fetch(`${API_URL}/api/admin/guests/${convidadoParaCheckIn.id}/checkin`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            entrada_tipo: tipo,
            entrada_valor: valor
          })
        });
      } else {
        // Check-in de convidado de promoter
        response = await fetch(`${API_URL}/api/v1/eventos/checkin/${convidadoParaCheckIn.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status_checkin: 'Check-in',
            entrada_tipo: tipo,
            entrada_valor: valor
          })
        });
      }

      if (response.ok) {
        const tipoTexto = tipo === 'VIP' ? 'VIP (grátis)' : tipo === 'SECO' ? `SECO (R$ ${valor.toFixed(2)})` : `CONSUMA (R$ ${valor.toFixed(2)})`;
        alert(`✅ Check-in de ${convidadoParaCheckIn.nome} confirmado!\nStatus: ${tipoTexto}`);
        setEntradaModalOpen(false);
        
        // Se for guest list, atualizar o estado local também
        if (convidadoParaCheckIn.tipo === 'guest_list' && convidadoParaCheckIn.guestListId) {
          const responseData = await response.json();
          setGuestsByList(prev => ({
            ...prev,
            [convidadoParaCheckIn.guestListId!]: (prev[convidadoParaCheckIn.guestListId!] || []).map(g => 
              g.id === convidadoParaCheckIn.id 
                ? { ...g, checked_in: true, checkin_time: new Date().toISOString(), entrada_tipo: tipo, entrada_valor: valor }
                : g
            )
          }));
        }
        
        setConvidadoParaCheckIn(null);
        loadCheckInData();
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.message || errorData.error || 'Erro ao fazer check-in'}`);
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
      const response = await fetch(`${API_URL}/api/admin/guests/${convidado.id}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
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

  const handleGuestCheckIn = (guestListId: number, guestId: number, guestName: string) => {
    // Abre o modal ao invés de fazer check-in direto
    setConvidadoParaCheckIn({
      tipo: 'guest_list',
      id: guestId,
      nome: guestName,
      guestListId: guestListId
    });
    setEntradaModalOpen(true);
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

  // Filtrar convidados de promoters
  // VALIDAÇÃO RIGOROSA: Garantir que apenas convidados de promoters sejam exibidos
  // Usar apenas os dados que já foram validados ao carregar
  const filteredConvidadosPromoters = useMemo(() => {
    // Primeiro, validar que são realmente convidados de promoters
    const validados = convidadosPromoters.filter(c => isValidPromoterGuest(c));
    
    // Depois, aplicar filtro de busca
    const searchText = promoterGuestsSearch.trim();
    if (!searchText) {
      return validados;
    }
    
    const searchLower = searchText.toLowerCase();
    const filtrados = validados.filter(c => {
      const nome = (c.nome || '').toLowerCase();
      const telefone = (c.telefone || '').toLowerCase();
      const responsavel = (c.responsavel || '').toLowerCase();
      const origem = (c.origem || '').toLowerCase();
      
      // Buscar principalmente pelo nome, mas também nos outros campos
      const encontrado = nome.includes(searchLower) || 
                        telefone.includes(searchLower) || 
                        responsavel.includes(searchLower) ||
                        origem.includes(searchLower);
      
      // Debug temporário
      if (process.env.NODE_ENV === 'development' && encontrado) {
        console.log('✅ Match encontrado:', {
          nome: c.nome,
          busca: searchText,
          matchNome: nome.includes(searchLower),
          matchTelefone: telefone.includes(searchLower),
          matchResponsavel: responsavel.includes(searchLower),
          matchOrigem: origem.includes(searchLower)
        });
      }
      
      return encontrado;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Filtro aplicado:', {
        busca: searchText,
        totalAntes: validados.length,
        totalDepois: filtrados.length,
        primeirosNomes: filtrados.slice(0, 3).map(c => c.nome)
      });
    }
    
    return filtrados;
  }, [convidadosPromoters, promoterGuestsSearch]);

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
                          <div className="text-center space-y-1">
                            <div className="text-sm text-green-400 font-medium">
                              ✅ Check-in feito às {convidado.data_checkin ? new Date(convidado.data_checkin).toLocaleTimeString('pt-BR') : ''}
                            </div>
                            {convidado.entrada_tipo && (
                              <div className={`text-xs px-2 py-1 rounded-full inline-block font-semibold ${
                                convidado.entrada_tipo === 'VIP' 
                                  ? 'bg-green-100 text-green-700' 
                                  : convidado.entrada_tipo === 'SECO'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {convidado.entrada_tipo}
                                {convidado.entrada_valor && ` - R$ ${convidado.entrada_valor.toFixed(2)}`}
                              </div>
                            )}
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
                    {guestListsRestaurante.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        Nenhuma lista de convidados encontrada para este evento.
                      </div>
                    ) : (
                      guestListsRestaurante
                        // Os dados já vêm filtrados do backend por establishment_id e data_evento
                        // Apenas aplicar filtro de busca textual
                        .filter(gl => filterBySearch(gl.owner_name) || filterBySearch(gl.origin))
                        .map((gl) => {
                        const listUrl = `https://agilizaiapp.com.br/lista/${gl.shareable_link_token}`;
                        
                        return (
                          <div key={gl.guest_list_id} className="border rounded-lg border-white/20 bg-white/5">
                            <div
                              onClick={async () => {
                                const willExpand = expandedGuestListId !== gl.guest_list_id;
                                setExpandedGuestListId(willExpand ? gl.guest_list_id : null);
                                
                                // Se está expandindo e ainda não carregou os convidados, carregar
                                if (willExpand && !guestsByList[gl.guest_list_id]) {
                                  try {
                                    const token = localStorage.getItem('authToken');
                                    console.log(`🔄 Carregando convidados para guest list ${gl.guest_list_id}...`);
                                    
                                    // Carregar convidados
                                    const guestsRes = await fetch(`${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/guests`, { 
                                      headers: { Authorization: `Bearer ${token}` } 
                                    });
                                    
                                    let guestsData: { guests: GuestItem[] } | null = null;
                                    if (guestsRes.ok) {
                                      guestsData = await guestsRes.json();
                                      console.log(`✅ Convidados carregados:`, guestsData);
                                      setGuestsByList(prev => ({ ...prev, [gl.guest_list_id]: guestsData?.guests || [] }));
                                    } else {
                                      console.error(`❌ Erro ao carregar convidados:`, await guestsRes.text());
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
                                  } catch (e) { 
                                    console.error('❌ Erro ao carregar dados da guest list:', e); 
                                  }
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
                                      {(() => {
                                        const guests = guestsByList[gl.guest_list_id] || [];
                                        const filteredGuests = guests.filter((g) => {
                                          const q = (guestSearch[gl.guest_list_id] || '').toLowerCase();
                                          if (!q) return true;
                                          return (
                                            g.name.toLowerCase().includes(q) ||
                                            (g.whatsapp || '').toLowerCase().includes(q)
                                          );
                                        });
                                        
                                        if (filteredGuests.length === 0 && guests.length > 0) {
                                          return (
                                            <tr>
                                              <td className="px-4 py-4 text-sm text-gray-400 text-center" colSpan={4}>
                                                Nenhum convidado encontrado com a busca.
                                              </td>
                                            </tr>
                                          );
                                        }
                                        
                                        if (filteredGuests.length === 0) {
                                          return (
                                            <tr>
                                              <td className="px-4 py-4 text-sm text-gray-400 text-center" colSpan={4}>
                                                {guests.length === 0 ? 'Nenhum convidado cadastrado nesta lista.' : 'Carregando convidados...'}
                                              </td>
                                            </tr>
                                          );
                                        }
                                        
                                        return filteredGuests.map((g) => {
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
                                                {isCheckedIn && g.entrada_tipo && (
                                                  <div className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block ${
                                                    g.entrada_tipo === 'VIP'
                                                      ? 'bg-green-100 text-green-700'
                                                      : g.entrada_tipo === 'SECO'
                                                      ? 'bg-blue-100 text-blue-700'
                                                      : 'bg-purple-100 text-purple-700'
                                                  }`}>
                                                    {g.entrada_tipo}
                                                    {g.entrada_valor && ` - R$ ${g.entrada_valor.toFixed(2)}`}
                                                  </div>
                                                )}
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
                                        });
                                      })()}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
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
                    {(() => {
                      // Debug: verificar dados antes de renderizar
                      if (process.env.NODE_ENV === 'development') {
                        console.log('🎯 Renderizando Convidados de Promoters:', {
                          total: filteredConvidadosPromoters.length,
                          tipos: [...new Set(filteredConvidadosPromoters.map(c => c.tipo))],
                          primeirosNomes: filteredConvidadosPromoters.slice(0, 5).map(c => c.nome)
                        });
                      }
                      return null;
                    })()}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MdEvent size={24} className="text-purple-400" />
                        Convidados de Promoters ({filteredConvidadosPromoters.length})
                      </h2>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPromoterGuestsViewMode('grid')}
                          className={`p-2 rounded-lg transition-colors ${
                            promoterGuestsViewMode === 'grid'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                          title="Visualização em grade"
                        >
                          <MdViewModule size={24} />
                        </button>
                        <button
                          onClick={() => setPromoterGuestsViewMode('list')}
                          className={`p-2 rounded-lg transition-colors ${
                            promoterGuestsViewMode === 'list'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                          title="Visualização em lista"
                        >
                          <MdViewList size={24} />
                        </button>
                      </div>
                    </div>

                    {/* Campo de busca específico para convidados de promoters */}
                    <div className="mb-4">
                      <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Buscar convidado por nome..."
                          value={promoterGuestsSearch}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPromoterGuestsSearch(value);
                            // Debug temporário
                            if (process.env.NODE_ENV === 'development') {
                              console.log('🔍 Busca alterada:', value, 'Total de convidados:', convidadosPromoters.length);
                            }
                          }}
                          className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {promoterGuestsSearch && (
                          <button
                            onClick={() => {
                              setPromoterGuestsSearch('');
                              if (process.env.NODE_ENV === 'development') {
                                console.log('🔍 Busca limpa');
                              }
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            <MdClose size={20} />
                          </button>
                        )}
                      </div>
                      {promoterGuestsSearch && (
                        <div className="mt-2 text-sm text-gray-400">
                          Buscando: "{promoterGuestsSearch}" - {filteredConvidadosPromoters.length} resultado(s) encontrado(s)
                        </div>
                      )}
                    </div>

                    {/* Visualização em Grade */}
                    {promoterGuestsViewMode === 'grid' && (
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
                              <div className="text-center space-y-1">
                                <div className="text-sm text-green-400 font-medium">
                                  ✅ Check-in feito às {convidado.data_checkin ? new Date(convidado.data_checkin).toLocaleTimeString('pt-BR') : ''}
                                </div>
                                {convidado.entrada_tipo && (
                                  <div className={`text-xs px-2 py-1 rounded-full inline-block font-semibold ${
                                    convidado.entrada_tipo === 'VIP' 
                                      ? 'bg-green-100 text-green-700' 
                                      : convidado.entrada_tipo === 'SECO'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {convidado.entrada_tipo}
                                    {convidado.entrada_valor && ` - R$ ${convidado.entrada_valor.toFixed(2)}`}
                                  </div>
                                )}
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
                    )}

                    {/* Visualização em Lista - Apenas nomes */}
                    {promoterGuestsViewMode === 'list' && (
                      <div className="space-y-2">
                        {filteredConvidadosPromoters.map(convidado => (
                          <motion.div
                            key={convidado.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`border rounded-lg p-4 flex items-center justify-between ${
                              convidado.status_checkin === 'Check-in'
                                ? 'bg-green-900/30 border-green-500/50'
                                : convidado.status_checkin === 'No-Show'
                                ? 'bg-red-900/30 border-red-500/50'
                                : 'bg-white/5 border-white/20 hover:border-purple-400/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex items-center gap-2">
                                {convidado.status_checkin === 'Check-in' && (
                                  <MdCheckCircle size={24} className="text-green-400" />
                                )}
                                {convidado.status_checkin === 'No-Show' && (
                                  <MdClose size={24} className="text-red-400" />
                                )}
                                {convidado.status_checkin === 'Pendente' && (
                                  <MdPending size={24} className="text-gray-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg text-white">{convidado.nome}</h3>
                                {convidado.is_vip && (
                                  <MdStar size={18} className="text-yellow-400" title="VIP" />
                                )}
                              </div>
                            </div>
                            {convidado.status_checkin === 'Pendente' && (
                              <button
                                onClick={() => handleConvidadoPromoterCheckIn(convidado)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                              >
                                <MdCheckCircle size={18} />
                                Check-in
                              </button>
                            )}
                            {convidado.status_checkin === 'Check-in' && (
                              <div className="flex flex-col items-end gap-1">
                                <div className="text-sm text-green-400 font-medium">
                                  ✅ {convidado.data_checkin ? new Date(convidado.data_checkin).toLocaleTimeString('pt-BR') : 'Presente'}
                                </div>
                                {convidado.entrada_tipo && (
                                  <div className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                    convidado.entrada_tipo === 'VIP' 
                                      ? 'bg-green-100 text-green-700' 
                                      : convidado.entrada_tipo === 'SECO'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {convidado.entrada_tipo}
                                    {convidado.entrada_valor && ` R$ ${convidado.entrada_valor.toFixed(2)}`}
                                  </div>
                                )}
                              </div>
                            )}
                            {convidado.status_checkin === 'No-Show' && (
                              <div className="text-sm text-red-400 font-medium">
                                ❌ No-Show
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {filteredConvidadosPromoters.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            Nenhum convidado de promoter encontrado
                          </div>
                        )}
                      </div>
                    )}
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

          {/* Seção de Contabilização */}
          {!loading && (
            <section className="mt-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 border border-green-500/50">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MdAttachMoney size={28} />
                Contabilização de Entradas
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-1">Total Arrecadado</div>
                  <div className="text-3xl font-bold text-white">
                    R$ {arrecadacao.totalGeral.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-1">Entradas SECO</div>
                  <div className="text-2xl font-bold text-white">
                    R$ {arrecadacao.porTipo.seco.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-1">Entradas CONSUMA</div>
                  <div className="text-2xl font-bold text-white">
                    R$ {arrecadacao.porTipo.consuma.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Arrecadação por Promoter */}
              {Object.keys(arrecadacao.porPromoter).length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-3">Arrecadação por Promoter</h3>
                  <div className="space-y-2">
                    {Object.entries(arrecadacao.porPromoter).map(([promoterId, data]) => (
                      <div key={promoterId} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <span className="text-white font-medium">{data.nome}</span>
                        <span className="text-green-200 font-bold text-lg">R$ {data.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Modal de Status de Entrada */}
        {convidadoParaCheckIn && (
          <EntradaStatusModal
            isOpen={entradaModalOpen}
            onClose={() => {
              setEntradaModalOpen(false);
              setConvidadoParaCheckIn(null);
            }}
            onConfirm={handleConfirmarCheckIn}
            nomeConvidado={convidadoParaCheckIn.nome}
            horaAtual={new Date()}
          />
        )}
      </div>
  );
}

