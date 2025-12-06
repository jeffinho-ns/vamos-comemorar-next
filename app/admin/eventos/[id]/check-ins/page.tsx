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
  table_number?: string | number;
  area_name?: string;
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
  table_number?: string | number;
  area_name?: string;
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
  
  // Estados para organização e filtros (mobile/tablet)
  const [sortBy, setSortBy] = useState<'nome' | 'status' | 'tipo' | 'hora'>('nome');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'checkin'>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  
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
  
  // Estado para atrações
  interface Atracao {
    id: number;
    nome_atracao: string;
    ambiente: string;
    horario_inicio: string;
    horario_termino: string;
  }
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  
  // Estados para brindes
  interface GiftRule {
    id: number;
    descricao: string;
    checkins_necessarios: number;
    status: string;
  }
  interface GiftAwarded {
    id: number;
    descricao: string;
    checkins_necessarios: number;
    status: string;
    liberado_em: string;
  }
  const [giftRules, setGiftRules] = useState<GiftRule[]>([]);
  const [giftsByGuestList, setGiftsByGuestList] = useState<Record<number, GiftAwarded[]>>({});
  
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
      (typeof c.promoter_id === 'number' || typeof c.promoter_id === 'string') &&
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
        const guestLists = data.dados.guestListsRestaurante || [];
        console.log('📋 Dados brutos de guestListsRestaurante recebidos:', data.dados.guestListsRestaurante);
        console.log('📋 Guest Lists processadas:', guestLists);
        console.log('📋 Total de guest lists:', guestLists.length);
        setGuestListsRestaurante(guestLists);
        console.log('📋 Guest Lists carregadas:', guestLists.map((gl: GuestListRestaurante) => ({
          id: gl.guest_list_id,
          owner: gl.owner_name,
          total_guests: gl.total_guests,
          reservation_date: gl.reservation_date,
          reservation_id: gl.reservation_id
        })));
        
        // Armazenar o establishment_id para uso posterior se necessário
        if (data.evento?.establishment_id) {
          setEstablishmentFilterId(Number(data.evento.establishment_id));
        }
        
        console.log('📋 Total de guest lists para exibir:', (data.dados.guestListsRestaurante || []).length);
        
        setPromoters(data.dados.promoters || []);
        
        // Carregar regras de brindes para este estabelecimento/evento
        if (data.evento?.establishment_id) {
          try {
            const giftRulesRes = await fetch(`${API_URL}/api/gift-rules?establishment_id=${data.evento.establishment_id}&evento_id=${eventoId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (giftRulesRes.ok) {
              const giftRulesData = await giftRulesRes.json();
              setGiftRules(giftRulesData.rules || []);
              console.log('🎁 Regras de brindes carregadas:', giftRulesData.rules?.length || 0);
            }
          } catch (error) {
            console.error('Erro ao carregar regras de brindes:', error);
          }
        }
        
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
        // Log dos dados brutos recebidos do backend
        console.log('🔍 Dados brutos recebidos do backend (convidadosPromoters):', {
          total: data.dados.convidadosPromoters?.length || 0,
          primeiro: data.dados.convidadosPromoters?.[0] || null,
          todos: data.dados.convidadosPromoters || []
        });
        
        const convidadosPromotersFiltrados = (data.dados.convidadosPromoters || [])
          .filter((c: any) => {
            // Log de cada item antes da validação
            console.log('🔍 Validando convidado:', {
              id: c?.id,
              nome: c?.nome,
              tipo: c?.tipo,
              status_checkin: c?.status_checkin,
              promoter_id: c?.promoter_id,
              tipo_lista: c?.tipo_lista,
              email: c?.email,
              documento: c?.documento,
              status: c?.status
            });
            
            if (!isValidPromoterGuest(c)) {
              console.warn('⚠️ Item REJEITADO da lista de promoters (não é um convidado de promoter válido):', {
                id: c?.id,
                nome: c?.nome,
                tipo: c?.tipo,
                status_checkin: c?.status_checkin,
                status: c?.status,
                promoter_id: c?.promoter_id,
                tipo_lista: c?.tipo_lista,
                email: c?.email,
                documento: c?.documento,
                motivo: 'Validação falhou'
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
            tipo_lista: c.tipo_lista || 'Promoter'
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
        setAtracoes(data.dados.atracoes || []);
        setEstatisticas(data.estatisticas);
        
        // Carregar brindes e status de check-in automaticamente para todas as guest lists
        if (guestLists.length > 0) {
          const loadAllGiftsAndStatus = async () => {
            const token = localStorage.getItem('authToken');
            
            // Carregar brindes e status de check-in em paralelo para cada lista
            const promises = guestLists.map(async (gl: GuestListRestaurante) => {
              try {
                // Carregar brindes
                const giftsRes = await fetch(`${API_URL}/api/gift-rules/guest-list/${gl.guest_list_id}/gifts`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                // Carregar status de check-in
                const checkinRes = await fetch(`${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/checkin-status`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                let gifts: GiftAwarded[] = [];
                let checkinStatus: { ownerCheckedIn: boolean; guestsCheckedIn: number; totalGuests: number } | null = null;
                
                if (giftsRes.ok) {
                  const giftsData = await giftsRes.json();
                  gifts = giftsData.gifts || [];
                }
                
                if (checkinRes.ok) {
                  const checkinData = await checkinRes.json();
                  checkinStatus = {
                    ownerCheckedIn: checkinData.checkin_status.owner_checked_in || false,
                    guestsCheckedIn: checkinData.checkin_status.guests_checked_in || 0,
                    totalGuests: checkinData.checkin_status.total_guests || gl.total_guests || 0
                  };
                } else {
                  // Fallback: usar dados da lista se não conseguir carregar
                  checkinStatus = {
                    ownerCheckedIn: gl.owner_checked_in === 1,
                    guestsCheckedIn: gl.guests_checked_in || 0,
                    totalGuests: gl.total_guests || 0
                  };
                }
                
                return { 
                  guestListId: gl.guest_list_id, 
                  gifts,
                  checkinStatus
                };
              } catch (error) {
                console.error(`Erro ao carregar dados para lista ${gl.guest_list_id}:`, error);
                return { 
                  guestListId: gl.guest_list_id, 
                  gifts: [],
                  checkinStatus: {
                    ownerCheckedIn: gl.owner_checked_in === 1,
                    guestsCheckedIn: gl.guests_checked_in || 0,
                    totalGuests: gl.total_guests || 0
                  }
                };
              }
            });
            
            const results = await Promise.all(promises);
            
            // Atualizar estado de brindes
            const giftsMap: Record<number, GiftAwarded[]> = {};
            const statusMap: Record<number, { ownerCheckedIn: boolean; guestsCheckedIn: number; totalGuests: number }> = {};
            
            results.forEach(result => {
              giftsMap[result.guestListId] = result.gifts;
              if (result.checkinStatus) {
                statusMap[result.guestListId] = result.checkinStatus;
              }
            });
            
            setGiftsByGuestList(giftsMap);
            setCheckInStatus(prev => ({ ...prev, ...statusMap }));
            
            console.log('🎁 Brindes e status carregados automaticamente:', {
              listas: Object.keys(giftsMap).length,
              brindes: Object.values(giftsMap).flat().length,
              status: Object.keys(statusMap).length
            });
          };
          
          // Carregar em background sem bloquear a UI
          loadAllGiftsAndStatus();
        }
        
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

    // Helper para converter entrada_valor para número
    const toNumber = (value: any): number => {
      if (typeof value === 'number') return value;
      const parsed = parseFloat(String(value));
      return isNaN(parsed) ? 0 : parsed;
    };

    // Calcular de convidados de reservas
    convidadosReservas.forEach(c => {
      if (c.status === 'CHECK-IN' && c.entrada_valor) {
        const valor = toNumber(c.entrada_valor);
        totalGeral += valor;
        if (c.entrada_tipo === 'SECO') porTipo.seco += valor;
        else if (c.entrada_tipo === 'CONSUMA') porTipo.consuma += valor;
        else if (c.entrada_tipo === 'VIP') porTipo.vip += 0;
      }
    });

    // Calcular de convidados de promoters
    convidadosPromoters.forEach(c => {
      if (c.status_checkin === 'Check-in' && c.entrada_valor) {
        const valor = toNumber(c.entrada_valor);
        totalGeral += valor;
        if (c.entrada_tipo === 'SECO') porTipo.seco += valor;
        else if (c.entrada_tipo === 'CONSUMA') porTipo.consuma += valor;
        else if (c.entrada_tipo === 'VIP') porTipo.vip += 0;

        // Acumular por promoter
        if (c.promoter_id) {
          const promoter = promotersList.find(p => p.id === c.promoter_id);
          if (promoter) {
            if (!porPromoter[c.promoter_id]) {
              porPromoter[c.promoter_id] = { nome: promoter.nome, total: 0 };
            }
            porPromoter[c.promoter_id].total += valor;
          }
        }
      }
    });

    // Calcular de guests (guest lists de restaurante)
    Object.values(guestsByList).flat().forEach(g => {
      if ((g.checked_in === 1 || g.checked_in === true) && g.entrada_valor) {
        const valor = toNumber(g.entrada_valor);
        totalGeral += valor;
        if (g.entrada_tipo === 'SECO') porTipo.seco += valor;
        else if (g.entrada_tipo === 'CONSUMA') porTipo.consuma += valor;
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
          
          // Atualizar contador de check-ins
          setCheckInStatus(prev => {
            const current = prev[convidadoParaCheckIn.guestListId!] || { ownerCheckedIn: false, guestsCheckedIn: 0, totalGuests: 0 };
            return {
              ...prev,
              [convidadoParaCheckIn.guestListId!]: {
                ...current,
                guestsCheckedIn: current.guestsCheckedIn + 1
              }
            };
          });
          
          // Recarregar brindes para verificar se algum foi liberado
          try {
            const token = localStorage.getItem('authToken');
            const guestListId = convidadoParaCheckIn.guestListId!;
            const previousGifts = giftsByGuestList[guestListId] || [];
            
            const giftsRes = await fetch(`${API_URL}/api/gift-rules/guest-list/${guestListId}/gifts`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (giftsRes.ok) {
              const giftsData = await giftsRes.json();
              const newGifts = giftsData.gifts || [];
              
              // Se algum brinde foi liberado, mostrar mensagem
              if (newGifts.length > previousGifts.length) {
                const newlyAwarded = newGifts.filter((g: any) => {
                  return !previousGifts.some((p: any) => p.id === g.id);
                });
                if (newlyAwarded.length > 0) {
                  setTimeout(() => {
                    alert(`🎁 Brinde(s) liberado(s)!\n\n${newlyAwarded.map((g: any) => `✅ ${g.descricao}`).join('\n')}`);
                  }, 500);
                }
              }
              
              setGiftsByGuestList(prev => ({
                ...prev,
                [guestListId]: newGifts
              }));
            }
          } catch (error) {
            console.error('Erro ao recarregar brindes:', error);
          }
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
  const filterBySearch = (text: string | null | undefined) => {
    if (!searchTerm.trim()) return true;
    if (!text) return false;
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

  // Filtrar dados - Mostrar todos se não houver busca
  const filteredConvidadosReservas = useMemo(() => {
    let filtered;
    if (!searchTerm.trim()) {
      filtered = convidadosReservas;
    } else {
      filtered = convidadosReservas.filter(c => 
        filterBySearch(c.nome) || 
        filterBySearch(c.email || '') || 
        filterBySearch(c.responsavel) ||
        filterBySearch(c.origem)
      );
    }
    // Ordenar alfabeticamente
    return filtered.sort((a, b) => 
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
    );
  }, [convidadosReservas, searchTerm]);

  // Filtrar convidados de promoters - agora também usa searchTerm principal
  const filteredConvidadosPromoters = useMemo(() => {
    // Primeiro, validar que são realmente convidados de promoters
    const validados = convidadosPromoters.filter(c => isValidPromoterGuest(c));
    
    // Usar searchTerm principal se existir, senão usar promoterGuestsSearch
    const searchText = searchTerm.trim() || promoterGuestsSearch.trim();
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
      
      return encontrado;
    });
    
    return filtrados;
  }, [convidadosPromoters, searchTerm, promoterGuestsSearch]);

  const filteredConvidadosReservasRestaurante = useMemo(() => {
    const filtered = convidadosReservasRestaurante.filter(c => 
      filterBySearch(c.nome) || 
      filterBySearch(c.telefone || '') || 
      filterBySearch(c.responsavel) ||
      filterBySearch(c.origem) ||
      filterBySearch(c.data_nascimento || '')
    );
    // Ordenar alfabeticamente
    return filtered.sort((a, b) => 
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
    );
  }, [convidadosReservasRestaurante, searchTerm]);

  // Função de busca melhorada (busca em múltiplos campos)
  const enhancedSearch = useCallback((term: string, item: any) => {
    if (!term.trim()) return true;
    const searchLower = term.toLowerCase().trim();
    
    // Busca em nome
    const nome = (item.nome || item.name || '').toLowerCase();
    if (nome.includes(searchLower)) return true;
    
    // Busca em telefone/whatsapp
    const telefone = (item.telefone || item.whatsapp || item.phone || '').replace(/\D/g, '');
    const searchNumbers = searchLower.replace(/\D/g, '');
    if (telefone.includes(searchNumbers)) return true;
    
    // Busca em responsável
    const responsavel = (item.responsavel || item.responsible || '').toLowerCase();
    if (responsavel.includes(searchLower)) return true;
    
    // Busca em origem
    const origem = (item.origem || item.origin || '').toLowerCase();
    if (origem.includes(searchLower)) return true;
    
    // Busca em email
    const email = (item.email || '').toLowerCase();
    if (email.includes(searchLower)) return true;
    
    return false;
  }, []);

  // Resultados unificados de busca - todos os convidados encontrados (com filtros e ordenação)
  const resultadosBuscaUnificados = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }

    const resultados: Array<{
      tipo: 'reserva' | 'promoter' | 'guest_list' | 'restaurante';
      id: number;
      nome: string;
      origem: string;
      responsavel: string;
      status: string;
      data_checkin?: string;
      email?: string;
      telefone?: string;
      documento?: string;
      entrada_tipo?: EntradaTipo;
      entrada_valor?: number;
      convidado?: ConvidadoReserva | ConvidadoPromoter | ConvidadoReservaRestaurante | GuestItem;
      guestListId?: number;
    }> = [];

    // Adicionar convidados de reservas
    filteredConvidadosReservas.forEach(c => {
      resultados.push({
        tipo: 'reserva',
        id: c.id,
        nome: c.nome,
        origem: c.origem,
        responsavel: c.responsavel,
        status: c.status,
        data_checkin: c.data_checkin,
        email: c.email,
        documento: c.documento,
        entrada_tipo: c.entrada_tipo,
        entrada_valor: c.entrada_valor,
        convidado: c
      });
    });

    // Adicionar convidados de promoters
    filteredConvidadosPromoters.forEach(c => {
      resultados.push({
        tipo: 'promoter',
        id: c.id,
        nome: c.nome,
        origem: c.origem || c.tipo_lista || 'Promoter',
        responsavel: c.responsavel,
        status: c.status_checkin,
        data_checkin: c.data_checkin,
        telefone: c.telefone,
        entrada_tipo: c.entrada_tipo,
        entrada_valor: c.entrada_valor,
        convidado: c
      });
    });

    // Adicionar convidados de reservas de restaurante
    filteredConvidadosReservasRestaurante.forEach(c => {
      resultados.push({
        tipo: 'restaurante',
        id: c.id,
        nome: c.nome,
        origem: c.origem,
        responsavel: c.responsavel,
        status: c.status_checkin === 1 || c.status_checkin === true ? 'CHECK-IN' : 'Pendente',
        data_checkin: c.data_checkin,
        telefone: c.telefone,
        convidado: c
      });
    });

    // Adicionar convidados de guest lists (listas de aniversário)
    Object.entries(guestsByList).forEach(([listId, guests]) => {
      if (!searchTerm.trim()) {
        // Se não há busca, adiciona todos
        guests.forEach(g => {
          const guestList = guestListsRestaurante.find(gl => gl.guest_list_id === Number(listId));
          resultados.push({
            tipo: 'guest_list',
            id: g.id,
            nome: g.name || 'Sem nome',
            origem: guestList ? guestList.owner_name : 'Lista de Aniversário',
            responsavel: guestList ? guestList.owner_name : 'Aniversário',
            status: (g.checked_in === 1 || g.checked_in === true) ? 'CHECK-IN' : 'Pendente',
            data_checkin: g.checkin_time,
            telefone: g.whatsapp,
            entrada_tipo: g.entrada_tipo,
            entrada_valor: g.entrada_valor,
            convidado: g,
            guestListId: Number(listId)
          });
        });
      } else {
        const searchLower = searchTerm.toLowerCase();
        guests.forEach(g => {
          const nome = (g.name || '').toLowerCase();
          const whatsapp = (g.whatsapp || '').toLowerCase();
          
          if (nome.includes(searchLower) || whatsapp.includes(searchLower)) {
            // Encontrar a guest list correspondente
            const guestList = guestListsRestaurante.find(gl => gl.guest_list_id === Number(listId));
            
            resultados.push({
              tipo: 'guest_list',
              id: g.id,
              nome: g.name || 'Sem nome',
              origem: guestList ? guestList.owner_name : 'Lista de Aniversário',
              responsavel: guestList ? guestList.owner_name : 'Aniversário',
              status: (g.checked_in === 1 || g.checked_in === true) ? 'CHECK-IN' : 'Pendente',
              data_checkin: g.checkin_time,
              telefone: g.whatsapp,
              entrada_tipo: g.entrada_tipo,
              entrada_valor: g.entrada_valor,
              convidado: g,
              guestListId: Number(listId)
            });
          }
        });
      }
    });

    // Aplicar filtros
    let filtered = resultados;
    
    if (filterStatus !== 'todos') {
      filtered = filtered.filter(r => {
        const isCheckedIn = r.status === 'CHECK-IN' || r.status === 'Check-in';
        return filterStatus === 'checkin' ? isCheckedIn : !isCheckedIn;
      });
    }
    
    // Aplicar ordenação (padrão: alfabética por nome)
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'nome':
          return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
        case 'status':
          const statusA = a.status === 'CHECK-IN' || a.status === 'Check-in' ? 1 : 0;
          const statusB = b.status === 'CHECK-IN' || b.status === 'Check-in' ? 1 : 0;
          if (statusA !== statusB) return statusB - statusA; // Check-in primeiro
          // Se mesmo status, ordenar alfabeticamente
          return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
        case 'tipo':
          const tipoCompare = a.tipo.localeCompare(b.tipo);
          if (tipoCompare !== 0) return tipoCompare;
          // Se mesmo tipo, ordenar alfabeticamente
          return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
        case 'hora':
          const horaA = a.data_checkin ? new Date(a.data_checkin).getTime() : 0;
          const horaB = b.data_checkin ? new Date(b.data_checkin).getTime() : 0;
          if (horaA !== horaB) return horaB - horaA; // Mais recente primeiro
          // Se mesma hora, ordenar alfabeticamente
          return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
        default:
          // Padrão: ordenação alfabética
          return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
      }
    });
    
    return sorted;
  }, [searchTerm, filteredConvidadosReservas, filteredConvidadosPromoters, filteredConvidadosReservasRestaurante, guestsByList, guestListsRestaurante, filterStatus, sortBy]);

  // Ordenar listas e convidados alfabeticamente
  const sortedGuestListsRestaurante = useMemo(() => {
    return [...guestListsRestaurante].sort((a, b) => 
      (a.owner_name || '').localeCompare(b.owner_name || '', 'pt-BR', { sensitivity: 'base' })
    );
  }, [guestListsRestaurante]);

  const sortedReservasMesa = useMemo(() => {
    return [...reservasMesa].sort((a, b) => 
      (a.responsavel || '').localeCompare(b.responsavel || '', 'pt-BR', { sensitivity: 'base' })
    );
  }, [reservasMesa]);

  const sortedFilteredConvidadosPromoters = useMemo(() => {
    return [...filteredConvidadosPromoters].sort((a, b) => 
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
    );
  }, [filteredConvidadosPromoters]);

  const filteredCamarotes = useMemo(() => {
    const filtered = camarotes.filter(c => 
      filterBySearch(c.responsavel) || 
      filterBySearch(c.origem)
    );
    return filtered.sort((a, b) => 
      (a.responsavel || '').localeCompare(b.responsavel || '', 'pt-BR', { sensitivity: 'base' })
    );
  }, [camarotes, searchTerm]);

  const filteredReservasRestaurante = useMemo(() => {
    const filtered = reservasRestaurante.filter(r => 
      filterBySearch(r.responsavel) || 
      filterBySearch(r.origem)
    );
    return filtered.sort((a, b) => 
      (a.responsavel || '').localeCompare(b.responsavel || '', 'pt-BR', { sensitivity: 'base' })
    );
  }, [reservasRestaurante, searchTerm]);

  const sortedFilteredPromoters = useMemo(() => {
    const filtered = promoters.filter(p => 
      filterBySearch(p.nome) || 
      filterBySearch(p.email || '') ||
      filterBySearch(p.telefone || '')
    );
    return filtered.sort((a, b) => 
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
    );
  }, [promoters, searchTerm]);

  const reservasMetrics = useMemo(() => {
    // Contar convidados (não reservas)
    const totalConvidadosReservas = convidadosReservas.length;
    const checkinConvidadosReservas = convidadosReservas.filter((c) => c.status === 'CHECK-IN').length;

    const totalConvidadosRestaurante =
      convidadosReservasRestaurante.length > 0
        ? convidadosReservasRestaurante.length
        : guestListsRestaurante.reduce((acc, gl) => acc + (gl.total_guests || 0), 0);

    const checkinConvidadosRestaurante =
      convidadosReservasRestaurante.length > 0
        ? convidadosReservasRestaurante.filter(
            (c) => c.status_checkin === 1 || c.status_checkin === true
          ).length
        : guestListsRestaurante.reduce((acc, gl) => acc + (gl.guests_checked_in || 0), 0);

    return {
      total: totalConvidadosReservas + totalConvidadosRestaurante,
      checkins: checkinConvidadosReservas + checkinConvidadosRestaurante
    };
  }, [convidadosReservas, convidadosReservasRestaurante, guestListsRestaurante]);

  const promoterMetrics = useMemo(() => {
    const total = convidadosPromoters.length;
    const checkins = convidadosPromoters.filter((c) => c.status_checkin === 'Check-in').length;

    return {
      total,
      checkins
    };
  }, [convidadosPromoters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 md:p-6 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              >
                <MdArrowBack size={20} className="md:w-6 md:h-6" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
                  <MdCheckCircle size={24} className="md:w-9 md:h-9" />
                  <span className="truncate">Check-ins do Evento</span>
                </h1>
                {evento && (
                  <div className="mt-2 text-green-100 space-y-1">
                    <p className="text-base md:text-lg font-semibold truncate">{evento.nome}</p>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
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
                      <span className="truncate">🏢 {evento.establishment_name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto p-3 md:p-4">
            {/* Mobile: Layout simplificado */}
            <div className="md:hidden space-y-3">
              {/* Busca rápida */}
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar nome, telefone, responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  autoFocus={false}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                  >
                    <MdClose size={18} />
                  </button>
                )}
              </div>

              {/* Botões de ação rápida */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                    showFilters 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <MdViewList size={18} />
                  <span>Filtros</span>
                </button>
                <button
                  onClick={loadCheckInData}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium text-sm"
                >
                  <MdRefresh className={loading ? 'animate-spin' : ''} size={18} />
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/10 text-gray-300 hover:bg-white/20 rounded-lg transition-colors text-sm"
                >
                  <MdViewModule size={18} />
                </button>
              </div>

              {/* Filtros expandidos (mobile) */}
              {showFilters && (
                <div className="bg-white/10 rounded-lg p-3 space-y-3 border border-white/20">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Status</label>
                    <div className="flex gap-2">
                      {(['todos', 'pendente', 'checkin'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            filterStatus === status
                              ? 'bg-green-600 text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          {status === 'todos' ? 'Todos' : status === 'pendente' ? 'Pendentes' : 'Check-in'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Ordenar por</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="nome">Nome</option>
                      <option value="status">Status</option>
                      <option value="tipo">Tipo</option>
                      <option value="hora">Horário</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tabs mobile - scroll horizontal */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedTab('todos')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm ${
                    selectedTab === 'todos'
                      ? 'bg-green-600 text-white'
                      : 'bg-white/10 text-gray-300'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSelectedTab('reservas')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm ${
                    selectedTab === 'reservas'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300'
                  }`}
                >
                  Reservas
                </button>
                <button
                  onClick={() => setSelectedTab('promoters')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm ${
                    selectedTab === 'promoters'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-300'
                  }`}
                >
                  Promoters
                </button>
                <button
                  onClick={() => setSelectedTab('camarotes')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm ${
                    selectedTab === 'camarotes'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white/10 text-gray-300'
                  }`}
                >
                  Camarotes
                </button>
              </div>
            </div>

            {/* Desktop: Layout original */}
            <div className="hidden md:flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center">
              {/* Busca */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por nome, telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 md:pl-10 pr-9 md:pr-10 py-2.5 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                    >
                      <MdClose size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Botão recarregar */}
              <button
                onClick={loadCheckInData}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold text-sm md:text-base"
              >
                <MdRefresh className={loading ? 'animate-spin' : ''} size={18} />
                <span>Atualizar</span>
              </button>
            </div>

            {/* Tabs Desktop */}
            <div className="hidden md:flex gap-2 mt-3 md:mt-4 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedTab('todos')}
                className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm md:text-base ${
                  selectedTab === 'todos'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedTab('reservas')}
                className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm md:text-base ${
                  selectedTab === 'reservas'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Reservas ({reservasMesa.length + reservasRestaurante.length})
              </button>
              <button
                onClick={() => setSelectedTab('promoters')}
                className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm md:text-base ${
                  selectedTab === 'promoters'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Promoters ({promoterMetrics.total})
              </button>
              <button
                onClick={() => setSelectedTab('camarotes')}
                className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm md:text-base ${
                  selectedTab === 'camarotes'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Camarotes ({camarotes.length})
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas - Ocultas em mobile/tablet, visíveis em desktop/notebook */}
        <div className="hidden md:block max-w-7xl mx-auto p-3 md:p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-4 border border-white/20">
              <div className="text-sm text-gray-300 mb-1">Total Geral</div>
              <div className="text-2xl font-bold text-white">
                {Number(reservasMetrics.checkins + promoterMetrics.checkins + (camarotes.reduce((sum, c) => sum + (c.convidados_checkin || 0), 0)))}/{Number(reservasMetrics.total + promoterMetrics.total + camarotes.reduce((sum, c) => sum + (c.total_convidados || 0), 0))}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {(() => {
                  const total = reservasMetrics.total + promoterMetrics.total + camarotes.reduce((sum, c) => sum + (c.total_convidados || 0), 0);
                  const checkins = reservasMetrics.checkins + promoterMetrics.checkins + camarotes.reduce((sum, c) => sum + (c.convidados_checkin || 0), 0);
                  return total > 0 ? `${Math.round((checkins / total) * 100)}%` : '0%';
                })()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-4 border border-blue-500/50">
              <div className="text-sm text-gray-300 mb-1">Reservas</div>
              <div className="text-2xl font-bold text-white">
                {Number(reservasMetrics.checkins)}/{Number(reservasMetrics.total)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {reservasMesa.length + reservasRestaurante.length} reserva{(reservasMesa.length + reservasRestaurante.length) !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-4 border border-purple-500/50">
              <div className="text-sm text-gray-300 mb-1">Promoters</div>
              <div className="text-2xl font-bold text-white">
                {Number(promoterMetrics.checkins)}/{Number(promoterMetrics.total)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-4 border border-orange-500/50">
              <div className="text-sm text-gray-300 mb-1">Camarotes</div>
              <div className="text-2xl font-bold text-white">
                {Number(camarotes.reduce((sum, c) => sum + (c.convidados_checkin || 0), 0))}/{Number(camarotes.reduce((sum, c) => sum + (c.total_convidados || 0), 0))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-3 md:p-4">
          {loading && (
            <div className="text-center py-12">
              <MdRefresh className="animate-spin inline-block text-green-600" size={48} />
              <p className="mt-4 text-gray-300">Carregando dados...</p>
            </div>
          )}

          {!loading && (
            <div className="space-y-6">
              {/* Resultados Unificados de Busca */}
              {searchTerm.trim() && resultadosBuscaUnificados.length > 0 && (
                <section className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-lg shadow-sm p-3 md:p-6 border border-blue-500/50">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h2 className="text-base md:text-xl font-bold text-white flex items-center gap-2">
                      <MdSearch size={18} className="md:w-6 md:h-6 text-blue-400" />
                      <span className="hidden md:inline">Resultados: "{searchTerm}" ({resultadosBuscaUnificados.length})</span>
                      <span className="md:hidden">Busca: {resultadosBuscaUnificados.length} resultado{resultadosBuscaUnificados.length !== 1 ? 's' : ''}</span>
                    </h2>
                  </div>
                  {/* Mobile/Tablet: Lista simples em linhas */}
                  <div className="md:hidden divide-y divide-white/10">
                    {resultadosBuscaUnificados.map(resultado => {
                      const isCheckedIn = resultado.status === 'CHECK-IN' || resultado.status === 'Check-in';
                      return (
                        <div
                          key={`${resultado.tipo}-${resultado.id}`}
                          className={`flex items-center justify-between gap-2 px-3 py-2.5 ${
                            isCheckedIn ? 'bg-green-900/10' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isCheckedIn ? (
                              <MdCheckCircle size={18} className="text-green-400 flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-sm truncate">{resultado.nome}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  resultado.tipo === 'reserva' 
                                    ? 'bg-blue-500/30 text-blue-200'
                                    : resultado.tipo === 'promoter'
                                    ? 'bg-purple-500/30 text-purple-200'
                                    : resultado.tipo === 'guest_list'
                                    ? 'bg-green-500/30 text-green-200'
                                    : 'bg-orange-500/30 text-orange-200'
                                }`}>
                                  {resultado.tipo === 'reserva' ? '📋' : resultado.tipo === 'promoter' ? '⭐' : resultado.tipo === 'guest_list' ? '🎂' : '🍽️'}
                                </span>
                                {resultado.entrada_tipo && isCheckedIn && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    resultado.entrada_tipo === 'VIP'
                                      ? 'bg-green-500/30 text-green-200'
                                      : resultado.entrada_tipo === 'SECO'
                                      ? 'bg-blue-500/30 text-blue-200'
                                      : 'bg-purple-500/30 text-purple-200'
                                  }`}>
                                    {resultado.entrada_tipo}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 truncate mt-0.5">
                                {resultado.telefone || resultado.origem}
                              </div>
                            </div>
                          </div>
                          {!isCheckedIn && (
                            <button
                              onClick={() => {
                                if (resultado.tipo === 'reserva' && resultado.convidado) {
                                  handleConvidadoReservaCheckIn(resultado.convidado as ConvidadoReserva);
                                } else if (resultado.tipo === 'promoter' && resultado.convidado) {
                                  handleConvidadoPromoterCheckIn(resultado.convidado as ConvidadoPromoter);
                                } else if (resultado.tipo === 'restaurante' && resultado.convidado) {
                                  handleConvidadoReservaRestauranteCheckIn(resultado.convidado as ConvidadoReservaRestaurante);
                                } else if (resultado.tipo === 'guest_list' && resultado.guestListId) {
                                  handleGuestCheckIn(resultado.guestListId, resultado.id, resultado.nome);
                                }
                              }}
                              className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors touch-manipulation font-medium flex-shrink-0"
                            >
                              Check-in
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Desktop: Grid original */}
                  <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {resultadosBuscaUnificados.map(resultado => {
                      const isCheckedIn = resultado.status === 'CHECK-IN' || resultado.status === 'Check-in';
                      const getBorderClass = () => {
                        if (isCheckedIn) return 'bg-green-900/30 border-green-500/50';
                        if (resultado.tipo === 'reserva') return 'bg-white/5 border-blue-500/30 hover:border-blue-400/50';
                        if (resultado.tipo === 'promoter') return 'bg-white/5 border-purple-500/30 hover:border-purple-400/50';
                        if (resultado.tipo === 'guest_list') return 'bg-white/5 border-green-500/30 hover:border-green-400/50';
                        return 'bg-white/5 border-orange-500/30 hover:border-orange-400/50';
                      };
                      const getButtonClass = () => {
                        if (resultado.tipo === 'reserva') return 'bg-blue-600 hover:bg-blue-700';
                        if (resultado.tipo === 'promoter') return 'bg-purple-600 hover:bg-purple-700';
                        if (resultado.tipo === 'guest_list') return 'bg-green-600 hover:bg-green-700';
                        return 'bg-orange-600 hover:bg-orange-700';
                      };
                      
                      return (
                        <motion.div
                          key={`${resultado.tipo}-${resultado.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`border rounded-lg p-3 ${getBorderClass()}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base text-white truncate">{resultado.nome}</h3>
                              <div className="text-xs text-gray-300 space-y-0.5 mt-1">
                                <div className={`text-xs px-2 py-0.5 rounded-full inline-block font-medium ${
                                  resultado.tipo === 'reserva' 
                                    ? 'bg-blue-100 text-blue-700'
                                    : resultado.tipo === 'promoter'
                                    ? 'bg-purple-100 text-purple-700'
                                    : resultado.tipo === 'guest_list'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {resultado.tipo === 'reserva' ? '📋 Reserva' : resultado.tipo === 'promoter' ? '⭐ Promoter' : resultado.tipo === 'guest_list' ? '🎂 Aniversário' : '🍽️ Restaurante'}
                                </div>
                                <div className="text-xs text-gray-400 truncate mt-1">
                                  <strong>Lista:</strong> {resultado.origem}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                  <strong>Responsável:</strong> {resultado.responsavel}
                                </div>
                                {resultado.email && (
                                  <div className="flex items-center gap-1 truncate">
                                    <MdEmail size={12} />
                                    <span className="truncate text-xs">{resultado.email}</span>
                                  </div>
                                )}
                                {resultado.telefone && (
                                  <div className="flex items-center gap-1 truncate">
                                    <MdPhone size={12} />
                                    <span className="truncate text-xs">{resultado.telefone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {isCheckedIn && (
                              <MdCheckCircle size={24} className="text-green-400 flex-shrink-0 ml-2" />
                            )}
                          </div>

                          {!isCheckedIn ? (
                            <button
                              onClick={() => {
                                if (resultado.tipo === 'reserva' && resultado.convidado) {
                                  handleConvidadoReservaCheckIn(resultado.convidado as ConvidadoReserva);
                                } else if (resultado.tipo === 'promoter' && resultado.convidado) {
                                  handleConvidadoPromoterCheckIn(resultado.convidado as ConvidadoPromoter);
                                } else if (resultado.tipo === 'restaurante' && resultado.convidado) {
                                  handleConvidadoReservaRestauranteCheckIn(resultado.convidado as ConvidadoReservaRestaurante);
                                } else if (resultado.tipo === 'guest_list' && resultado.guestListId) {
                                  handleGuestCheckIn(resultado.guestListId, resultado.id, resultado.nome);
                                }
                              }}
                              className={`w-full ${getButtonClass()} text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm touch-manipulation`}
                            >
                              <MdCheckCircle size={16} />
                              Check-in
                            </button>
                          ) : (
                            <div className="text-center space-y-1">
                              <div className="text-xs text-green-400 font-medium">
                                ✅ {resultado.data_checkin ? new Date(resultado.data_checkin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </div>
                              {resultado.entrada_tipo && (
                                <div className={`text-xs px-2 py-0.5 rounded-full inline-block font-medium ${
                                  resultado.entrada_tipo === 'VIP'
                                    ? 'bg-green-100 text-green-700'
                                    : resultado.entrada_tipo === 'SECO'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {resultado.entrada_tipo}
                                  {resultado.entrada_valor && (() => {
                                    const valor = typeof resultado.entrada_valor === 'number' 
                                      ? resultado.entrada_valor 
                                      : parseFloat(String(resultado.entrada_valor));
                                    return !isNaN(valor) ? ` R$ ${valor.toFixed(2)}` : '';
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Mensagem quando busca não encontra resultados */}
              {searchTerm.trim() && resultadosBuscaUnificados.length === 0 && (
                <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
                  <div className="text-center py-8 text-gray-400">
                    <MdSearch size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Nenhum resultado encontrado para "{searchTerm}"</p>
                    <p className="text-sm mt-2">Tente buscar por nome, telefone ou responsável</p>
                  </div>
                </section>
              )}

              {/* Reservas de Mesa */}
              {(selectedTab === 'todos' || selectedTab === 'reservas') && reservasMesa.length > 0 && (
                <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-4 md:p-6 border border-white/20">
                  <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                    <MdTableBar size={20} className="md:w-6 md:h-6 text-blue-400" />
                    <span className="truncate">Reservas de Mesa ({reservasMesa.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {sortedReservasMesa.map((reserva) => (
                        <motion.div
                          key={reserva.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`border rounded-lg p-3 ${
                            reserva.convidados_checkin > 0
                              ? 'bg-blue-900/20 border-blue-500/40'
                              : 'bg-white/5 border-white/20 hover:border-blue-400/50'
                          }`}
                        >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-white truncate">{reserva.responsavel}</h3>
                            <div className="text-xs text-gray-300 space-y-0.5 mt-1">
                              <div className="text-xs text-gray-400 truncate">Origem: {reserva.origem || '—'}</div>
                              <div className="flex items-center gap-1">
                                <MdAccessTime size={12} />
                                <span className="text-xs">{reserva.data_reserva || '—'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MdPerson size={12} />
                                <span className="text-xs">{reserva.quantidade_convidados ?? reserva.total_convidados ?? 0} pessoas</span>
                              </div>
                              {typeof reserva.total_convidados === 'number' && (
                                <div className="text-xs text-gray-400">
                                  {reserva.convidados_checkin || 0}/{reserva.total_convidados} presentes
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


              {/* Guest Lists de Reservas de Restaurante (Sistema de Reservas) */}
            {(selectedTab === 'todos' || selectedTab === 'reservas') && !searchTerm.trim() && (
                <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-4 md:p-6 border border-white/20">
                    <div className="mb-4">
  <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
    <MdRestaurant size={20} className="md:w-6 md:h-6 text-green-400" />
        <span className="truncate">Listas de Convidados e Reservas ({guestListsRestaurante.length})</span>
  </h2>
  
  {/* Descrição adicionada aqui */}
  <p className="text-xs md:text-sm text-gray-400 mt-1 ml-1 md:ml-8">
    Gerencie aqui as listas de aniversários, despedidas, confraternizações e reservas de mesas.
  </p>
</div>
                    
                  
                  <div className="space-y-2 md:space-y-3">
                    {sortedGuestListsRestaurante.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        Nenhuma lista de convidados encontrada para este evento.
                      </div>
                    ) : (
                      sortedGuestListsRestaurante
                        // Os dados já vêm filtrados do backend por establishment_id e data_evento
                        // Apenas aplicar filtro de busca textual
                        .filter(gl => filterBySearch(gl.owner_name) || filterBySearch(gl.origin))
                        .map((gl) => {
                        const listUrl = `https://agilizaiapp.com.br/lista/${gl.shareable_link_token}`;
                        
                        return (
                          <div key={gl.guest_list_id} className="border rounded-lg border-white/20 bg-white/5 overflow-hidden">
                            <div
                              onClick={async () => {
                                const willExpand = expandedGuestListId !== gl.guest_list_id;
                                setExpandedGuestListId(willExpand ? gl.guest_list_id : null);
                                
                                // Se está expandindo, sempre verificar e carregar se necessário
                                if (willExpand) {
                                  // Verificar se já tem dados carregados
                                  const hasGuests = guestsByList[gl.guest_list_id] && guestsByList[gl.guest_list_id].length > 0;
                                  
                                  // Se não tem dados ou array vazio, carregar
                                  if (!hasGuests) {
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
                                        console.log(`✅ Convidados carregados para ${gl.owner_name}:`, {
                                          total: guestsData?.guests?.length || 0,
                                          dados: guestsData
                                        });
                                        
                                        if (guestsData && guestsData.guests) {
                                          // Ordenar convidados alfabeticamente por nome
                                          const sortedGuests = [...(guestsData.guests || [])].sort((a, b) => 
                                            (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
                                          );
                                          setGuestsByList(prev => ({ ...prev, [gl.guest_list_id]: sortedGuests }));
                                        } else {
                                          console.warn(`⚠️ Resposta vazia ou sem guests para ${gl.guest_list_id}`);
                                          setGuestsByList(prev => ({ ...prev, [gl.guest_list_id]: [] }));
                                        }
                                      } else {
                                        const errorText = await guestsRes.text();
                                        console.error(`❌ Erro ao carregar convidados (${guestsRes.status}):`, errorText);
                                        // Ainda assim, definir como array vazio para evitar tentativas infinitas
                                        setGuestsByList(prev => ({ ...prev, [gl.guest_list_id]: [] }));
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
                                        // Calcular do guestsData se disponível
                                        const guestsCheckedIn = guestsData ? guestsData.guests.filter((g: GuestItem) => g.checked_in === 1 || g.checked_in === true).length : 0;
                                        setCheckInStatus(prev => ({
                                          ...prev,
                                          [gl.guest_list_id]: {
                                            ownerCheckedIn: gl.owner_checked_in === 1,
                                            guestsCheckedIn: guestsCheckedIn,
                                            totalGuests: guestsData ? guestsData.guests.length : 0
                                          }
                                        }));
                                      }

                                      // Carregar brindes liberados para esta lista
                                      try {
                                        const giftsRes = await fetch(`${API_URL}/api/gift-rules/guest-list/${gl.guest_list_id}/gifts`, {
                                          headers: { Authorization: `Bearer ${token}` }
                                        });
                                        if (giftsRes.ok) {
                                          const giftsData = await giftsRes.json();
                                          setGiftsByGuestList(prev => ({
                                            ...prev,
                                            [gl.guest_list_id]: giftsData.gifts || []
                                          }));
                                        }
                                      } catch (giftError) {
                                        console.error('Erro ao carregar brindes:', giftError);
                                      }
                                    } catch (e) { 
                                      console.error('❌ Erro ao carregar dados da guest list:', e);
                                      // Definir como array vazio em caso de erro para evitar loops
                                      setGuestsByList(prev => ({ ...prev, [gl.guest_list_id]: [] }));
                                    }
                                  } else {
                                    console.log(`✅ Convidados já carregados para ${gl.owner_name}: ${guestsByList[gl.guest_list_id].length} convidados`);
                                  }
                                }
                              }}
                              className="w-full text-left px-3 md:px-4 py-2.5 md:py-3 bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-white text-sm md:text-base truncate">{gl.owner_name}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                                    gl.reservation_type === 'large' 
                                      ? 'bg-orange-100 text-orange-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    Reserva Normal
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-2">
                                  <div className="text-xs md:text-sm text-gray-300">
                                    {gl.reservation_date ? new Date(gl.reservation_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data não informada'} 
                                    {gl.event_type ? ` • ${gl.event_type}` : ''} • {gl.reservation_time}
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <div
                                      className="rounded-full bg-white/10 px-2 md:px-3 py-1 text-xs md:text-sm font-semibold text-amber-200"
                                    >
                                      Mesa: <span className="text-white">
                                        {gl.table_number ? `Mesa ${gl.table_number}` : gl.area_name || '—'}
                                      </span>
                                    </div>
                                    {(() => {
                                      const guestsCheckedIn = checkInStatus[gl.guest_list_id]?.guestsCheckedIn || 0;
                                      const activeRules = giftRules.filter(r => r.status === 'ATIVA').sort((a, b) => a.checkins_necessarios - b.checkins_necessarios);
                                      const nextRule = activeRules.find(r => guestsCheckedIn < r.checkins_necessarios);
                                      if (nextRule) {
                                        const faltam = nextRule.checkins_necessarios - guestsCheckedIn;
                                        return (
                                          <div
                                            className="rounded-full bg-gradient-to-r from-orange-500/90 to-red-500/90 px-2 md:px-3 py-1 text-xs md:text-sm font-bold text-white shadow-lg animate-pulse"
                                          >
                                            ⚠️ Faltam {faltam} check-in{faltam !== 1 ? 's' : ''} para o brinde!
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                                
                                {/* Check-in do dono e Indicadores de Brinde */}
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOwnerCheckIn(gl.guest_list_id, gl.owner_name);
                                      }}
                                      className={`px-2 md:px-3 py-1 text-xs rounded-full transition-colors font-medium touch-manipulation ${
                                        checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1
                                          ? 'bg-green-100 text-green-700 border border-green-300'
                                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                                      }`}
                                    >
                                      {checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1 ? '✅ Dono Presente' : '📋 Check-in Dono'}
                                    </button>
                                  </div>
                                  
                                  {/* Indicadores de Progresso e Brindes */}
                                  {(() => {
                                    const guestsCheckedIn = checkInStatus[gl.guest_list_id]?.guestsCheckedIn || 0;
                                    const totalGuests = checkInStatus[gl.guest_list_id]?.totalGuests || gl.total_guests || 0;
                                    const percentage = totalGuests > 0 ? Math.round((guestsCheckedIn / totalGuests) * 100) : 0;
                                    const activeRules = giftRules.filter(r => r.status === 'ATIVA').sort((a, b) => a.checkins_necessarios - b.checkins_necessarios);
                                    const nextRule = activeRules.find(r => guestsCheckedIn < r.checkins_necessarios);
                                    const awardedGifts = giftsByGuestList[gl.guest_list_id] || [];
                                    
                                    return (
                                      <div className="space-y-2">
                                        {/* Barra de Progresso */}
                                        {activeRules.length > 0 && (
                                          <div className="bg-gradient-to-br from-white/15 to-white/5 rounded-xl p-3 border border-white/20 shadow-lg">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-white">🎯 Progresso do Brinde</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-300">{guestsCheckedIn} / {nextRule?.checkins_necessarios || activeRules[activeRules.length - 1]?.checkins_necessarios || 0}</span>
                                                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                                                  percentage >= 80 ? 'bg-green-500/20 text-green-300' : percentage >= 50 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
                                                }`}>
                                                  {percentage}%
                                                </span>
                                              </div>
                                            </div>
                                            <div className="relative w-full bg-gray-800/50 rounded-full h-5 overflow-hidden shadow-inner border border-gray-700/50">
                                              <div
                                                className={`h-full rounded-full transition-all duration-500 ease-out relative ${
                                                  percentage >= 80 
                                                    ? 'bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 shadow-lg shadow-green-500/50' 
                                                    : percentage >= 50 
                                                    ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 shadow-lg shadow-yellow-500/50' 
                                                    : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 shadow-lg shadow-blue-500/50'
                                                }`}
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                              >
                                                {percentage > 20 && (
                                                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                                                    {percentage}%
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            {nextRule && (
                                              <div className="mt-2 pt-2 border-t border-white/10">
                                                <p className="text-xs text-gray-300">
                                                  Próximo brinde: <span className="font-semibold text-amber-300">{nextRule.descricao}</span>
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* Brindes Liberados */}
                                        {awardedGifts.length > 0 && (
                                          <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 rounded-lg p-2 border border-green-500/50">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-lg">🎁</span>
                                              <span className="text-sm font-semibold text-green-200">Brinde(s) Liberado(s)!</span>
                                            </div>
                                            <div className="space-y-1">
                                              {awardedGifts.map((gift) => (
                                                <div key={gift.id} className="text-xs text-green-100">
                                                  ✅ {gift.descricao}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Mensagem quando atinge 80% */}
                                        {percentage >= 80 && nextRule && guestsCheckedIn >= nextRule.checkins_necessarios && awardedGifts.some(g => g.checkins_necessarios === nextRule.checkins_necessarios) && (
                                          <div className="bg-gradient-to-r from-yellow-900/50 to-orange-800/50 rounded-lg p-2 border border-yellow-500/50">
                                            <p className="text-xs text-yellow-200 font-semibold">
                                              🎉 Meta atingida! Brinde liberado para o dono da lista.
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${gl.is_valid === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {gl.is_valid === 1 ? 'Ativo' : 'Expirado'}
                              </span>
                            </div>

                            {expandedGuestListId === gl.guest_list_id && (
                              <div className="p-3 md:p-4 space-y-2 md:space-y-3 bg-white/5">
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
                                    className="w-full px-3 py-2.5 md:py-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                                  />
                                </div>

                                {/* Lista de convidados */}
                                <div className="border rounded border-white/20 bg-white/5">
                                  {/* Desktop: Tabela */}
                                  <div className="hidden md:block overflow-x-auto">
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
                                          const filteredGuests = guests
                                            .filter((g) => {
                                              const q = (guestSearch[gl.guest_list_id] || '').toLowerCase();
                                              if (!q) return true;
                                              return (
                                                g.name.toLowerCase().includes(q) ||
                                                (g.whatsapp || '').toLowerCase().includes(q)
                                              );
                                            })
                                            .sort((a, b) => 
                                              (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
                                            );
                                          
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
                                                  {guests.length === 0 ? (
                                                    <div>
                                                      <div>Nenhum convidado cadastrado nesta lista.</div>
                                                      <div className="text-xs mt-1 text-gray-500">
                                                        Total esperado: {gl.total_guests || 0} convidados
                                                      </div>
                                                    </div>
                                                  ) : 'Carregando convidados...'}
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
                                                      {g.entrada_valor && (() => {
                                                        const valor = typeof g.entrada_valor === 'number' 
                                                          ? g.entrada_valor 
                                                          : parseFloat(String(g.entrada_valor));
                                                        return !isNaN(valor) ? ` - R$ ${valor.toFixed(2)}` : '';
                                                      })()}
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

                                  {/* Mobile/Tablet: Lista simples em linhas */}
                                  <div className="md:hidden divide-y divide-white/10">
                                    {(() => {
                                      const guests = guestsByList[gl.guest_list_id] || [];
                                      const filteredGuests = guests
                                        .filter((g) => {
                                          const q = (guestSearch[gl.guest_list_id] || '').toLowerCase();
                                          if (!q) return true;
                                          return (
                                            g.name.toLowerCase().includes(q) ||
                                            (g.whatsapp || '').toLowerCase().includes(q)
                                          );
                                        })
                                        .sort((a, b) => 
                                          (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
                                        );
                                      
                                      if (filteredGuests.length === 0 && guests.length > 0) {
                                        return (
                                          <div className="text-center py-4 text-sm text-gray-400 px-3">
                                            Nenhum convidado encontrado com a busca.
                                          </div>
                                        );
                                      }
                                      
                                      if (filteredGuests.length === 0) {
                                        return (
                                          <div className="text-center py-4 text-sm text-gray-400 px-3">
                                            {guests.length === 0 ? (
                                              <div>
                                                <div>Nenhum convidado cadastrado nesta lista.</div>
                                                <div className="text-xs mt-1 text-gray-500">
                                                  Total esperado: {gl.total_guests || 0} convidados
                                                </div>
                                              </div>
                                            ) : 'Carregando convidados...'}
                                          </div>
                                        );
                                      }
                                      
                                      return filteredGuests.map((g) => {
                                        const isCheckedIn = g.checked_in === 1 || g.checked_in === true;
                                        return (
                                          <div 
                                            key={g.id} 
                                            className={`flex items-center justify-between gap-2 px-3 py-2 ${
                                              isCheckedIn 
                                                ? 'bg-green-900/10' 
                                                : 'hover:bg-white/5'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              {isCheckedIn ? (
                                                <MdCheckCircle size={18} className="text-green-400 flex-shrink-0" />
                                              ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex-shrink-0" />
                                              )}
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-medium text-white text-sm truncate">{g.name}</span>
                                                  {g.entrada_tipo && isCheckedIn && (
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                      g.entrada_tipo === 'VIP'
                                                        ? 'bg-green-500/30 text-green-200'
                                                        : g.entrada_tipo === 'SECO'
                                                        ? 'bg-blue-500/30 text-blue-200'
                                                        : 'bg-purple-500/30 text-purple-200'
                                                    }`}>
                                                      {g.entrada_tipo}
                                                    </span>
                                                  )}
                                                </div>
                                                {g.whatsapp && (
                                                  <div className="text-xs text-gray-400 truncate mt-0.5">
                                                    {g.whatsapp}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            {!isCheckedIn && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleGuestCheckIn(gl.guest_list_id, g.id, g.name);
                                                }}
                                                className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg touch-manipulation font-medium flex-shrink-0"
                                              >
                                                Check-in
                                              </button>
                                            )}
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
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
              {(selectedTab === 'todos' || selectedTab === 'promoters') && !searchTerm.trim() && (
                <>
                  {/* Lista de Promoters */}
                  {sortedFilteredPromoters.length > 0 && (
                    <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-4 md:p-6 border border-white/20">
                      <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                        <MdStar size={20} className="md:w-6 md:h-6 text-yellow-400" />
                        <span className="truncate">Promoters ({sortedFilteredPromoters.length})</span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                        {sortedFilteredPromoters.map(promoter => (
                          <motion.div
                            key={promoter.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border rounded-lg p-3 bg-purple-900/20 border-purple-500/50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                                  <span className="truncate">{promoter.nome}</span>
                                  <MdStar size={16} className="text-yellow-400 flex-shrink-0" />
                                </h3>
                                <div className="text-xs text-gray-300 space-y-0.5 mt-1">
                                  {promoter.email && (
                                    <div className="flex items-center gap-1 truncate">
                                      <MdEmail size={12} />
                                      <span className="truncate">{promoter.email}</span>
                                    </div>
                                  )}
                                  {promoter.telefone && (
                                    <div className="flex items-center gap-1 truncate">
                                      <MdPhone size={12} />
                                      <span className="truncate">{promoter.telefone}</span>
                                    </div>
                                  )}
                                  <div className="text-xs text-purple-300 mt-1.5">
                                    {promoter.convidados_checkin}/{promoter.total_convidados} presentes
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
                  <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-4 md:p-6 border border-white/20">
                    {(() => {
                      // Debug: verificar dados antes de renderizar
                      if (process.env.NODE_ENV === 'development') {
                        console.log('🎯 Renderizando Convidados de Promoters:', {
                          total: sortedFilteredConvidadosPromoters.length,
                          tipos: [...new Set(sortedFilteredConvidadosPromoters.map(c => c.tipo))],
                          primeirosNomes: sortedFilteredConvidadosPromoters.slice(0, 5).map(c => c.nome)
                        });
                      }
                      return null;
                    })()}
<div className="flex items-start justify-between mb-3 md:mb-4 gap-4">
    <div className="flex-1 min-w-0"> {/* Container para Título e Descrição */}
      <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
        <MdEvent size={20} className="md:w-6 md:h-6 text-purple-400 flex-shrink-0" />
        <span className="truncate">Listas de Promoters e Cadastros ({sortedFilteredConvidadosPromoters.length})</span>
      </h2>
      <p className="text-xs md:text-sm text-gray-400 mt-1 ml-1 md:ml-8">
        Inclui convidados de promoters, cadastros via Site/Instagram e listas promocionais (ex: VIP até horário).
      </p>
    </div>

    {/* Botões de Visualização (Grid/List) - Mantidos à direita */}
    <div className="flex items-center gap-2 flex-shrink-0 mt-1">
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
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
                          className="w-full pl-9 md:pl-10 pr-9 md:pr-10 py-2.5 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                        />
                        {promoterGuestsSearch && (
                          <button
                            onClick={() => {
                              setPromoterGuestsSearch('');
                              if (process.env.NODE_ENV === 'development') {
                                console.log('🔍 Busca limpa');
                              }
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                          >
                            <MdClose size={18} />
                          </button>
                        )}
                      </div>
                      {promoterGuestsSearch && (
                        <div className="mt-2 text-sm text-gray-400">
                          Buscando: "{promoterGuestsSearch}" - {sortedFilteredConvidadosPromoters.length} resultado(s) encontrado(s)
                        </div>
                      )}
                    </div>

                    {/* Mobile/Tablet: Lista simples em linhas */}
                    <div className="md:hidden divide-y divide-white/10">
                      {sortedFilteredConvidadosPromoters.map(convidado => {
                        const isCheckedIn = convidado.status_checkin === 'Check-in';
                        const isNoShow = convidado.status_checkin === 'No-Show';
                        return (
                          <div
                            key={convidado.id}
                            className={`flex items-center justify-between gap-2 px-3 py-2 ${
                              isCheckedIn
                                ? 'bg-green-900/10'
                                : isNoShow
                                ? 'bg-red-900/10'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isCheckedIn ? (
                                <MdCheckCircle size={18} className="text-green-400 flex-shrink-0" />
                              ) : isNoShow ? (
                                <MdClose size={18} className="text-red-400 flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-white text-sm truncate">{convidado.nome}</span>
                                  {convidado.is_vip && (
                                    <MdStar size={14} className="text-yellow-400 flex-shrink-0" />
                                  )}
                                  {convidado.entrada_tipo && isCheckedIn && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      convidado.entrada_tipo === 'VIP'
                                        ? 'bg-green-500/30 text-green-200'
                                        : convidado.entrada_tipo === 'SECO'
                                        ? 'bg-blue-500/30 text-blue-200'
                                        : 'bg-purple-500/30 text-purple-200'
                                    }`}>
                                      {convidado.entrada_tipo}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 truncate mt-0.5">
                                  {convidado.telefone || convidado.origem}
                                </div>
                              </div>
                            </div>
                            {!isCheckedIn && !isNoShow && (
                              <button
                                onClick={() => handleConvidadoPromoterCheckIn(convidado)}
                                className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg touch-manipulation font-medium flex-shrink-0"
                              >
                                Check-in
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop: Visualização em Grade */}
                    {promoterGuestsViewMode === 'grid' && (
                      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                        {sortedFilteredConvidadosPromoters.map(convidado => (
                          <motion.div
                            key={convidado.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`border rounded-lg p-3 ${
                              convidado.status_checkin === 'Check-in'
                                ? 'bg-green-900/30 border-green-500/50'
                                : convidado.status_checkin === 'No-Show'
                                ? 'bg-red-900/30 border-red-500/50'
                                : 'bg-white/5 border-white/20 hover:border-purple-400/50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-bold text-base text-white truncate">{convidado.nome}</h3>
                                  {convidado.is_vip && (
                                    <MdStar size={16} className="text-yellow-400 flex-shrink-0" title="VIP" />
                                  )}
                                </div>
                                <div className="text-xs text-gray-300 space-y-0.5 mt-1">
                                  <div className="text-xs text-gray-400 truncate">Lista: {convidado.origem}</div>
                                  <div className="truncate">Promoter: {convidado.responsavel}</div>
                                  {convidado.telefone && (
                                    <div className="flex items-center gap-1 truncate">
                                      <MdPhone size={12} />
                                      <span className="truncate text-xs">{convidado.telefone}</span>
                                    </div>
                                  )}
                                  {convidado.observacoes && (
                                    <div className="flex items-center gap-1">
                                      <MdDescription size={12} />
                                      <span className="text-xs truncate">{convidado.observacoes}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {convidado.status_checkin === 'Check-in' && (
                                <MdCheckCircle size={24} className="text-green-400 flex-shrink-0 ml-2" />
                              )}
                            </div>

                            {convidado.status_checkin === 'Pendente' ? (
                              <button
                                onClick={() => handleConvidadoPromoterCheckIn(convidado)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm touch-manipulation"
                              >
                                <MdCheckCircle size={16} />
                                Check-in
                              </button>
                            ) : convidado.status_checkin === 'Check-in' ? (
                              <div className="text-center space-y-1">
                                <div className="text-xs text-green-400 font-medium">
                                  ✅ {convidado.data_checkin ? new Date(convidado.data_checkin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                                {convidado.entrada_tipo && (
                                  <div className={`text-xs px-2 py-0.5 rounded-full inline-block font-medium ${
                                    convidado.entrada_tipo === 'VIP'
                                      ? 'bg-green-100 text-green-700'
                                      : convidado.entrada_tipo === 'SECO'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {convidado.entrada_tipo}
                                    {convidado.entrada_valor && (() => {
                                      const valor = typeof convidado.entrada_valor === 'number' 
                                        ? convidado.entrada_valor 
                                        : parseFloat(String(convidado.entrada_valor));
                                      return !isNaN(valor) ? ` R$ ${valor.toFixed(2)}` : '';
                                    })()}
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
                        {sortedFilteredConvidadosPromoters.length === 0 && (
                          <div className="col-span-full text-center py-8 text-gray-400">
                            Nenhum convidado de promoter encontrado
                          </div>
                        )}
                      </div>
                    )}

                    {/* Desktop: Visualização em Lista - Apenas nomes */}
                    {promoterGuestsViewMode === 'list' && (
                      <div className="hidden md:block space-y-2">
                        {sortedFilteredConvidadosPromoters.map(convidado => (
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
                                    {convidado.entrada_valor && (() => {
                                      const valor = typeof convidado.entrada_valor === 'number' 
                                        ? convidado.entrada_valor 
                                        : parseFloat(String(convidado.entrada_valor));
                                      return !isNaN(valor) ? ` R$ ${valor.toFixed(2)}` : '';
                                    })()}
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
              {(selectedTab === 'todos' || selectedTab === 'camarotes') && !searchTerm.trim() && filteredCamarotes.length > 0 && (
                <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-4 md:p-6 border border-white/20">
                  <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                    <MdTableBar size={20} className="md:w-6 md:h-6 text-orange-400" />
                    <span className="truncate">Camarotes / Reservas Grandes ({filteredCamarotes.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {filteredCamarotes.map(camarote => (
                      <motion.div
                        key={camarote.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-lg p-3 ${
                          camarote.checked_in
                            ? 'bg-green-900/30 border-green-500/50'
                            : 'bg-white/5 border-white/20 hover:border-orange-400/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-white truncate">{camarote.responsavel}</h3>
                            <div className="text-xs text-gray-300 space-y-0.5 mt-1">
                              <div className="text-xs bg-orange-800/30 text-orange-300 px-2 py-0.5 rounded inline-block">
                                {camarote.origem}
                              </div>
                              <div className="flex items-center gap-1">
                                <MdAccessTime size={12} />
                                <span className="text-xs">{camarote.reservation_time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MdPerson size={12} />
                                <span className="text-xs">{camarote.number_of_people} pessoas</span>
                              </div>
                              {camarote.total_convidados > 0 && (
                                <div className="text-xs text-gray-400">
                                  {camarote.convidados_checkin}/{camarote.total_convidados} presentes
                                </div>
                              )}
                            </div>
                          </div>
                          {camarote.checked_in && (
                            <MdCheckCircle size={24} className="text-green-400 flex-shrink-0 ml-2" />
                          )}
                        </div>

                        {!camarote.checked_in ? (
                          <button
                            onClick={() => handleCamaroteCheckIn(camarote)}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm touch-manipulation"
                          >
                            <MdCheckCircle size={16} />
                            Check-in
                          </button>
                        ) : (
                          <div className="text-center text-xs text-green-400 font-medium">
                            ✅ {camarote.checkin_time ? new Date(camarote.checkin_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Line Up - Atrações do Evento */}
              {(selectedTab === 'todos' || selectedTab === 'reservas') && !searchTerm.trim() && (
                <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-4 md:p-6 border border-white/20">
                  <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                    <MdEvent size={20} className="md:w-6 md:h-6 text-pink-400" />
                    <span className="truncate">Line Up ({atracoes.length})</span>
                  </h2>
                  {atracoes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {atracoes.map(atracao => (
                        <motion.div
                          key={atracao.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-lg p-4 bg-pink-900/20 border-pink-500/50 hover:border-pink-400/70 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg text-white mb-2 truncate">{atracao.nome_atracao}</h3>
                              <div className="text-sm text-gray-300 space-y-1">
                                <div className="flex items-center gap-2">
                                  <MdTableBar size={16} className="text-pink-400 flex-shrink-0" />
                                  <span className="truncate">{atracao.ambiente}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MdAccessTime size={16} className="text-pink-400 flex-shrink-0" />
                                  <span>
                                    {(() => {
                                      const inicio = atracao.horario_inicio ? atracao.horario_inicio.substring(0, 5) : '';
                                      const termino = atracao.horario_termino ? atracao.horario_termino.substring(0, 5) : '';
                                      return `${inicio} - ${termino}`;
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      Nenhuma atração cadastrada para este evento
                    </div>
                  )}
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
                    R$ {(() => {
                      const valor = typeof arrecadacao.totalGeral === 'number' 
                        ? arrecadacao.totalGeral 
                        : parseFloat(String(arrecadacao.totalGeral)) || 0;
                      return valor.toFixed(2);
                    })()}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-1">Entradas SECO</div>
                  <div className="text-2xl font-bold text-white">
                    R$ {(() => {
                      const valor = typeof arrecadacao.porTipo.seco === 'number' 
                        ? arrecadacao.porTipo.seco 
                        : parseFloat(String(arrecadacao.porTipo.seco)) || 0;
                      return valor.toFixed(2);
                    })()}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-1">Entradas CONSUMA</div>
                  <div className="text-2xl font-bold text-white">
                    R$ {(() => {
                      const valor = typeof arrecadacao.porTipo.consuma === 'number' 
                        ? arrecadacao.porTipo.consuma 
                        : parseFloat(String(arrecadacao.porTipo.consuma)) || 0;
                      return valor.toFixed(2);
                    })()}
                  </div>
                </div>
              </div>

              {/* Arrecadação por Promoter */}
              {Object.keys(arrecadacao.porPromoter).length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-3">Arrecadação por Promoter</h3>
                  <div className="space-y-2">
                    {Object.entries(arrecadacao.porPromoter).map(([promoterId, data]) => {
                      const valor = typeof data.total === 'number' 
                        ? data.total 
                        : parseFloat(String(data.total)) || 0;
                      return (
                        <div key={promoterId} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <span className="text-white font-medium">{data.nome}</span>
                          <span className="text-green-200 font-bold text-lg">R$ {valor.toFixed(2)}</span>
                        </div>
                      );
                    })}
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

