"use client";
import React from 'react';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  MdDownload,
} from 'react-icons/md';
import * as XLSX from 'xlsx';
import { WithPermission } from '../../../../components/WithPermission/WithPermission';
import EntradaStatusModal, { EntradaTipo } from '../../../../components/EntradaStatusModal';
import BirthdayDetailsModal from '../../../../components/painel/BirthdayDetailsModal';
import { BirthdayReservation } from '../../../../services/birthdayService';
import { Reservation } from '@/app/types/reservation';

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
  guest_list_id?: number | null; // Para identificar se tem guest list ou não
  // Campos alternativos que podem vir do backend
  client_name?: string;
  origin?: string;
  status?: string;
  notes?: string;
  admin_notes?: string;
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
  owner_checked_out?: number;
  owner_checkout_time?: string;
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
  notes?: string;
  admin_notes?: string;
}

interface GuestItem {
  id: number;
  name: string;
  whatsapp?: string;
  checked_in: number | boolean;
  checkin_time?: string;
  checked_out?: number | boolean;
  checkout_time?: string;
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

  // Detectar se é mobile para otimizar animações
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Estados
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'todos' | 'reservas' | 'promoters' | 'camarotes'>('todos');
  const [promoterGuestsViewMode, setPromoterGuestsViewMode] = useState<'grid' | 'list'>('grid');
  const [promoterGuestsSearch, setPromoterGuestsSearch] = useState('');
  
  // Debounce da busca para melhorar performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150); // 150ms de debounce para desktop
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Estado para modal de planilha
  const [planilhaModalOpen, setPlanilhaModalOpen] = useState(false);
  // Estados para Planilha (estilo restaurant-reservations)
  const [planilhaReservas, setPlanilhaReservas] = useState<Reservation[]>([]);
  const [planilhaLoading, setPlanilhaLoading] = useState(false);
  const [sheetFilters, setSheetFilters] = useState<{ date?: string; search?: string; name?: string; phone?: string; event?: string; table?: string; status?: string }>({});
  const [todasMesasAreas, setTodasMesasAreas] = useState<Map<string, Array<{ area_id: number; area_name: string; table_number: string }>>>(new Map());
  
  // Função helper para mapear mesa -> área do Seu Justino
  const getSeuJustinoAreaName = useCallback((tableNumber?: string | number, areaName?: string, areaId?: number): string => {
    if (!tableNumber && !areaName && !areaId) return areaName || '';
    
    const tableNum = String(tableNumber || '').trim();
    
    // Mapeamento de mesas para áreas do Seu Justino
    const seuJustinoSubareas = [
      { key: 'lounge-aquario-spaten', area_id: 1, label: 'Lounge Aquario Spaten', tableNumbers: ['210'] },
      { key: 'lounge-aquario-tv', area_id: 1, label: 'Lounge Aquario TV', tableNumbers: ['208'] },
      { key: 'lounge-palco', area_id: 1, label: 'Lounge Palco', tableNumbers: ['204','206'] },
      { key: 'lounge-bar', area_id: 1, label: 'Lounge Bar', tableNumbers: ['200','202'] },
      { key: 'quintal-lateral-esquerdo', area_id: 2, label: 'Quintal Lateral Esquerdo', tableNumbers: ['20','22','24','26','28','29'] },
      { key: 'quintal-central-esquerdo', area_id: 2, label: 'Quintal Central Esquerdo', tableNumbers: ['30','32','34','36','38','39'] },
      { key: 'quintal-central-direito', area_id: 2, label: 'Quintal Central Direito', tableNumbers: ['40','42','44','46','48'] },
      { key: 'quintal-lateral-direito', area_id: 2, label: 'Quintal Lateral Direito', tableNumbers: ['50','52','54','56','58','60','62','64'] },
    ];
    
    // Se temos número da mesa, buscar pela mesa (suporta múltiplas mesas separadas por vírgula)
    if (tableNum) {
      const tableNumbers = tableNum.includes(',') ? tableNum.split(',').map(t => t.trim()) : [tableNum];
      for (const tn of tableNumbers) {
        const subarea = seuJustinoSubareas.find(sub => sub.tableNumbers.includes(tn));
        if (subarea) {
          return subarea.label;
        }
      }
    }
    
    // Se não encontrou pela mesa, verificar se area_name já está correto
    if (areaName) {
      const normalizedAreaName = areaName.toLowerCase();
      // Se já é uma das áreas corretas, retornar como está
      if (seuJustinoSubareas.some(sub => sub.label.toLowerCase() === normalizedAreaName)) {
        return areaName;
      }
      // Se contém "coberta" ou "descoberta", mapear baseado no area_id
      if (normalizedAreaName.includes('coberta') || normalizedAreaName.includes('descoberta')) {
        if (areaId === 1) {
          // Área 1 = Lounge, mas não sabemos qual subárea, então retornar genérico ou tentar pela mesa
          if (tableNum) {
            const tableNumbers = tableNum.includes(',') ? tableNum.split(',').map(t => t.trim()) : [tableNum];
            for (const tn of tableNumbers) {
              const subarea = seuJustinoSubareas.find(sub => sub.tableNumbers.includes(tn) && sub.area_id === 1);
              if (subarea) return subarea.label;
            }
          }
          return 'Lounge'; // Fallback genérico
        } else if (areaId === 2) {
          // Área 2 = Quintal, mas não sabemos qual subárea, então retornar genérico ou tentar pela mesa
          if (tableNum) {
            const tableNumbers = tableNum.includes(',') ? tableNum.split(',').map(t => t.trim()) : [tableNum];
            for (const tn of tableNumbers) {
              const subarea = seuJustinoSubareas.find(sub => sub.tableNumbers.includes(tn) && sub.area_id === 2);
              if (subarea) return subarea.label;
            }
          }
          return 'Quintal'; // Fallback genérico
        }
      }
    }
    
    // Fallback: retornar area_name original ou vazio
    return areaName || '';
  }, []);
  
  // Funções auxiliares para a planilha
  const formatDate = (dateString: string, fallbackDate?: string) => {
    // Se tiver data de fallback (do filtro), usar ela se a data original for inválida
    if (fallbackDate) {
      try {
        const fallback = new Date(fallbackDate + 'T12:00:00');
        if (!isNaN(fallback.getTime())) {
          const formatted = fallback.toLocaleDateString('pt-BR');
          // Se a data original não for válida, retornar o fallback formatado
          if (!dateString || dateString.trim() === '') return formatted;
          try {
            const date = new Date(dateString + 'T12:00:00');
            if (isNaN(date.getTime())) return formatted;
            return date.toLocaleDateString('pt-BR');
          } catch {
            return formatted;
          }
        }
      } catch {}
    }
    
    if (!dateString || dateString.trim() === '') {
      return fallbackDate ? new Date(fallbackDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data não informada';
    }
    try {
      const date = new Date(dateString + 'T12:00:00');
      if (isNaN(date.getTime())) {
        return fallbackDate ? new Date(fallbackDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data inválida';
      }
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return fallbackDate ? new Date(fallbackDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data inválida';
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString || timeString.trim() === '') return '';
    try {
      return timeString.slice(0, 5);
    } catch (error) {
      return '';
    }
  };
  
  // Estado para reservas adicionais buscadas diretamente da API
  const [reservasAdicionaisAPI, setReservasAdicionaisAPI] = useState<Array<{
    id: number;
    client_name: string;
    reservation_date: string;
    reservation_time: string;
    number_of_people: number;
    table_number?: string;
    area_name?: string;
    checked_in: boolean;
    checkin_time?: string;
    status?: string;
    origin?: string;
    guest_list_id?: null;
  }>>([]);
  const [loadingReservasAdicionais, setLoadingReservasAdicionais] = useState(false);
  
  // Estados para modal de status de entrada
  const [entradaModalOpen, setEntradaModalOpen] = useState(false);
  const [convidadoParaCheckIn, setConvidadoParaCheckIn] = useState<{
    tipo: 'reserva' | 'promoter' | 'guest_list' | 'restaurante';
    id: number;
    nome: string;
    guestListId?: number; // Para guest lists
    reservationId?: number; // Para reservas sem guest list
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
  const [checkInStatus, setCheckInStatus] = useState<Record<number, { ownerCheckedIn: boolean; ownerCheckedOut?: boolean; guestsCheckedIn: number; totalGuests: number }>>({});
  const [ownerCheckInTimeMap, setOwnerCheckInTimeMap] = useState<Record<number, string>>({});
  const [ownerCheckOutTimeMap, setOwnerCheckOutTimeMap] = useState<Record<number, string>>({});
  
  // Histórico de reservas concluídas (check-in + check-out completos)
  interface ReservaConcluida {
    guest_list_id: number;
    owner_name: string;
    reservation_id: number;
    table_number?: string | number;
    area_name?: string;
    checkin_time: string;
    checkout_time: string;
    guests: Array<{
      id: number;
      name: string;
      checkin_time?: string;
      checkout_time?: string;
    }>;
  }
  const [historicoReservasConcluidas, setHistoricoReservasConcluidas] = useState<ReservaConcluida[]>([]);
  
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
  
  // Estado para reservas de aniversário relacionadas às guest lists
  const [birthdayReservationsByReservationId, setBirthdayReservationsByReservationId] = useState<Record<number, BirthdayReservation>>({});
  const [selectedBirthdayReservation, setSelectedBirthdayReservation] = useState<BirthdayReservation | null>(null);
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  
  // Estado para itens do menu por reserva de aniversário (para cálculo preciso do valor total)
  const [menuItemsByBirthdayReservation, setMenuItemsByBirthdayReservation] = useState<Record<number, { bebidas: any[], comidas: any[] }>>({});
  
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

  // Refs para prevenir múltiplos cliques simultâneos (debounce)
  const checkInInProgressRef = useRef<Record<string, boolean>>({});
  
  // Cache para comparações de strings (otimização de performance)
  const stringCompareCache = useRef<Map<string, number>>(new Map());
  
  // Função para carregar itens do cardápio para reservas de aniversário
  const loadMenuItemsForBirthdayReservations = useCallback(async (
    birthdayReservationsMap: Record<number, BirthdayReservation>,
    establishmentId: number
  ) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';
      const API_BASE_URL = `${API_URL}/api/cardapio`;
      
      // Buscar o estabelecimento (place) para pegar o nome/slug
      const placesResponse = await fetch(`${API_URL}/api/places`);
      let establishmentName = '';
      let establishmentSlug = '';
      
      if (placesResponse.ok) {
        const placesData = await placesResponse.json();
        const places = Array.isArray(placesData) ? placesData : (placesData.data || []);
        const place = places.find((p: any) => Number(p.id) === Number(establishmentId));
        if (place) {
          establishmentName = place.name || '';
          establishmentSlug = place.slug || '';
        }
      }

      if (!establishmentName) {
        console.warn('Estabelecimento não encontrado para carregar cardápio');
        return;
      }

      // Buscar bars, categories e items do cardápio
      const [barsResponse, categoriesResponse, itemsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/bars`),
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/items`)
      ]);

      if (!barsResponse.ok || !categoriesResponse.ok || !itemsResponse.ok) {
        throw new Error('Erro ao carregar dados do cardápio');
      }

      const [bars, categories, items] = await Promise.all([
        barsResponse.json(),
        categoriesResponse.json(),
        itemsResponse.json()
      ]);

      // Normalizar nomes para comparação
      const normalizeName = (name: string) => {
        return name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/[^a-z0-9\s]/g, '');
      };
      
      const simplifyName = (name: string) => {
        return normalizeName(name)
          .replace(/\s+/g, '')
          .replace(/[^a-z0-9]/g, '');
      };
      
      // Buscar bar por slug, ID ou nome
      let bar = null;
      if (establishmentSlug) {
        bar = bars.find((b: any) => b.slug === establishmentSlug);
      }
      if (!bar) {
        bar = bars.find((b: any) => Number(b.id) === Number(establishmentId));
      }
      if (!bar) {
        const normalizedEstablishmentName = normalizeName(establishmentName);
        const simplifiedEstablishmentName = simplifyName(establishmentName);
        bar = bars.find((b: any) => {
          const normalizedBarName = normalizeName(b.name);
          const simplifiedBarName = simplifyName(b.name);
          return normalizedBarName === normalizedEstablishmentName || 
                 simplifiedBarName === simplifiedEstablishmentName;
        });
      }

      if (!bar) {
        console.warn('Bar não encontrado no cardápio');
        return;
      }

      // Processar selos dos itens
      const processedItems = items.map((item: any) => {
        let seals = [];
        if (item.seals) {
          if (Array.isArray(item.seals)) {
            seals = item.seals;
          } else if (typeof item.seals === 'string') {
            try {
              seals = JSON.parse(item.seals);
              if (!Array.isArray(seals)) seals = [];
            } catch (e) {
              seals = [];
            }
          }
        }
        return { ...item, seals };
      });

      // Filtrar itens do bar
      const normalizedBarId = String(bar.id);
      const barItemsFiltered = processedItems.filter((item: any) => {
        const matchesBar = String(item.barId) === normalizedBarId;
        const isVisible = item.visible === undefined || item.visible === null || item.visible === 1 || item.visible === true;
        return matchesBar && isVisible;
      });

      const customSeals = bar.custom_seals || [];

      // Filtrar categorias
      const beverageCategories = categories.filter((cat: any) => {
        const categoryName = normalizeName(cat.name || '');
        return categoryName === 'drinks' || 
               categoryName === 'carta de vinho' ||
               categoryName === 'bebidas' ||
               categoryName.includes('drink') || 
               categoryName.includes('vinho') ||
               categoryName.includes('bebida');
      }).map((cat: any) => String(cat.id));

      const foodCategories = categories.filter((cat: any) => {
        const categoryName = normalizeName(cat.name || '');
        return categoryName === 'menu' || categoryName.includes('menu');
      }).map((cat: any) => String(cat.id));

      // Filtrar itens com selo B-day
      const beveragesWithBday = barItemsFiltered.filter((item: any) => {
        const hasBeverageCategory = beverageCategories.includes(String(item.categoryId));
        if (!hasBeverageCategory) return false;
        if (!item.seals || !Array.isArray(item.seals) || item.seals.length === 0) return false;
        return item.seals.some((sealId: string) => {
          if (!sealId || typeof sealId !== 'string') return false;
          const normalizedSeal = simplifyName(sealId);
          if (normalizedSeal.includes('b-day') || normalizedSeal.includes('bday') || normalizedSeal.includes('birthday')) {
            return true;
          }
          const customSeal = customSeals.find((cs: any) => cs.id === sealId);
          if (customSeal) {
            const customSealName = simplifyName(customSeal.name || '');
            if (customSealName.includes('b-day') || customSealName.includes('bday') || customSealName.includes('birthday')) {
              return true;
            }
          }
          return false;
        });
      });

      const foodsWithBday = barItemsFiltered.filter((item: any) => {
        const hasFoodCategory = foodCategories.includes(String(item.categoryId));
        if (!hasFoodCategory) return false;
        if (!item.seals || !Array.isArray(item.seals) || item.seals.length === 0) return false;
        return item.seals.some((sealId: string) => {
          if (!sealId || typeof sealId !== 'string') return false;
          const normalizedSeal = simplifyName(sealId);
          if (normalizedSeal.includes('b-day') || normalizedSeal.includes('bday') || normalizedSeal.includes('birthday')) {
            return true;
          }
          const customSeal = customSeals.find((cs: any) => cs.id === sealId);
          if (customSeal) {
            const customSealName = simplifyName(customSeal.name || '');
            if (customSealName.includes('b-day') || customSealName.includes('bday') || customSealName.includes('birthday')) {
              return true;
            }
          }
          return false;
        });
      });

      // Mapear itens selecionados para cada reserva de aniversário
      const menuItemsMap: Record<number, { bebidas: any[], comidas: any[] }> = {};
      
      Object.values(birthdayReservationsMap).forEach((br) => {
        const bebidasSelecionadas = [];
        const comidasSelecionadas = [];

        // Mapear bebidas
        for (let i = 1; i <= 10; i++) {
          const quantidade = (br as any)[`item_bar_bebida_${i}`] as number;
          if (quantidade && quantidade > 0) {
            const itemIndex = i - 1;
            if (itemIndex < beveragesWithBday.length) {
              const item = beveragesWithBday[itemIndex];
              bebidasSelecionadas.push({
                nome: item.name || `Bebida ${i}`,
                quantidade,
                preco: parseFloat(item.price) || 0,
              });
            }
          }
        }

        // Mapear comidas
        for (let i = 1; i <= 10; i++) {
          const quantidade = (br as any)[`item_bar_comida_${i}`] as number;
          if (quantidade && quantidade > 0) {
            const itemIndex = i - 1;
            if (itemIndex < foodsWithBday.length) {
              const item = foodsWithBday[itemIndex];
              comidasSelecionadas.push({
                nome: item.name || `Porção ${i}`,
                quantidade,
                preco: parseFloat(item.price) || 0,
              });
            }
          }
        }

        menuItemsMap[br.id] = { bebidas: bebidasSelecionadas, comidas: comidasSelecionadas };
      });

      setMenuItemsByBirthdayReservation(menuItemsMap);
    } catch (error) {
      console.error('Erro ao carregar itens do cardápio:', error);
    }
  }, []);
  
  // Função otimizada de comparação de strings com cache
  const cachedStringCompare = useCallback((a: string, b: string): number => {
    const cacheKey = `${a}|||${b}`;
    if (stringCompareCache.current.has(cacheKey)) {
      return stringCompareCache.current.get(cacheKey)!;
    }
    const result = (a || '').localeCompare(b || '', 'pt-BR', { sensitivity: 'base' });
    // Limitar cache a 1000 entradas para não consumir muita memória
    if (stringCompareCache.current.size < 1000) {
      stringCompareCache.current.set(cacheKey, result);
    }
    return result;
  }, []);

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
        
        setEvento(data.evento);
        setReservasMesa(data.dados.reservasMesa || []);
        setConvidadosReservas(data.dados.convidadosReservas || []);
        setReservasRestaurante(data.dados.reservasRestaurante || []);
        setConvidadosReservasRestaurante(data.dados.convidadosReservasRestaurante || []);
        
        // O backend agora vincula automaticamente reservas ao evento e retorna os dados corretos
        // Não precisamos mais buscar via API admin/guest-lists
        const guestLists = data.dados.guestListsRestaurante || [];
        
        // Usar diretamente os dados do backend (que são a fonte da verdade)
        // O backend agora retorna owner_checked_out e owner_checkout_time corretamente
        setGuestListsRestaurante(guestLists);
        
        // Atualizar checkInStatus diretamente a partir dos dados das guest lists
        // Isso garante que o status de check-out seja exibido corretamente
        setCheckInStatus(prev => {
          const updated = { ...prev };
          guestLists.forEach((gl: GuestListRestaurante) => {
            updated[gl.guest_list_id] = {
              ...updated[gl.guest_list_id],
              ownerCheckedIn: gl.owner_checked_in === 1,
              ownerCheckedOut: gl.owner_checked_out === 1,
              guestsCheckedIn: gl.guests_checked_in || 0,
              totalGuests: gl.total_guests || 0
            };
          });
          return updated;
        });
        
        // Limpar guests antigos - serão recarregados abaixo com dados atualizados do backend
        // Isso garante que sempre usamos os dados mais recentes do backend
        setGuestsByList({});
        
        // Buscar reservas de aniversário relacionadas às guest lists com event_type='aniversario'
        const birthdayReservationsMap: Record<number, BirthdayReservation> = {};
        const aniversarioGuestLists = guestLists.filter((gl: GuestListRestaurante) => gl.event_type === 'aniversario');
        
        if (aniversarioGuestLists.length > 0 && data.evento?.establishment_id) {
          try {
            const birthdayResResponse = await fetch(`${API_URL}/api/birthday-reservations?establishment_id=${data.evento.establishment_id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (birthdayResResponse.ok) {
              const birthdayData = await birthdayResResponse.json();
              const birthdayReservations = Array.isArray(birthdayData) ? birthdayData : (birthdayData.data || []);
              
              // Mapear reservas de aniversário pelo restaurant_reservation_id e também por nome/date como fallback
              const allReservationsRestaurante = [...reservasRestaurante, ...(data.dados.reservasRestaurante || [])];
              
              birthdayReservations.forEach((br: any) => {
                // Primeiro tenta mapear pelo restaurant_reservation_id
                if (br.restaurant_reservation_id) {
                  const resId = Number(br.restaurant_reservation_id);
                  birthdayReservationsMap[resId] = br;
                  console.log('🎂 [check-ins] Mapeada por restaurant_reservation_id:', {
                    restaurantReservationId: resId,
                    birthdayId: br.id,
                    nome: br.aniversariante_nome
                  });
                }
                
                // Fallback: tentar encontrar pela reserva de restaurante correspondente usando nome e data
                if (br.aniversariante_nome && br.data_aniversario) {
                  const relatedReservation = allReservationsRestaurante.find((rr: ReservaRestaurante) => {
                    // Verificar se nome do cliente e data correspondem
                    const reservationDate = rr.reservation_date ? rr.reservation_date.split('T')[0] : null;
                    const birthdayDate = br.data_aniversario ? br.data_aniversario.split('T')[0] : null;
                    const nameMatch = rr.responsavel && (
                      rr.responsavel.toLowerCase().includes(br.aniversariante_nome.toLowerCase()) ||
                      br.aniversariante_nome.toLowerCase().includes(rr.responsavel.toLowerCase())
                    );
                    const dateMatch = reservationDate === birthdayDate;
                    
                    return nameMatch && dateMatch && !birthdayReservationsMap[rr.id];
                  });
                  
                  if (relatedReservation) {
                    birthdayReservationsMap[relatedReservation.id] = br;
                    console.log('🎂 [check-ins] Mapeada por nome e data (fallback):', {
                      restaurantReservationId: relatedReservation.id,
                      birthdayId: br.id,
                      nome: br.aniversariante_nome,
                      cliente: relatedReservation.responsavel
                    });
                  }
                }
              });
              
              // Também mapear diretamente para guest lists com event_type='aniversario'
              aniversarioGuestLists.forEach((gl: GuestListRestaurante) => {
                // Se não encontrou pelo restaurant_reservation_id, tenta encontrar pela guest list
                if (!birthdayReservationsMap[gl.reservation_id]) {
                  const relatedBr = birthdayReservations.find((br: any) => {
                    // Verificar se a reserva de aniversário corresponde à guest list
                    const brDate = br.data_aniversario ? br.data_aniversario.split('T')[0] : null;
                    const glDate = gl.reservation_date ? gl.reservation_date.split('T')[0] : null;
                    const nameMatch = gl.owner_name && (
                      gl.owner_name.toLowerCase().includes((br.aniversariante_nome || '').toLowerCase()) ||
                      (br.aniversariante_nome || '').toLowerCase().includes(gl.owner_name.toLowerCase())
                    );
                    
                    return (brDate === glDate && nameMatch) || 
                           (br.restaurant_reservation_id && Number(br.restaurant_reservation_id) === gl.reservation_id);
                  });
                  
                  if (relatedBr) {
                    birthdayReservationsMap[gl.reservation_id] = relatedBr;
                    console.log('🎂 [check-ins] Mapeada por guest list:', {
                      guestListId: gl.guest_list_id,
                      reservationId: gl.reservation_id,
                      birthdayId: relatedBr.id,
                      nome: relatedBr.aniversariante_nome,
                      ownerName: gl.owner_name
                    });
                  }
                }
              });
              
              console.log('🎂 [check-ins] Total de reservas de aniversário mapeadas:', Object.keys(birthdayReservationsMap).length);
              console.log('🎂 [check-ins] IDs mapeados:', Object.keys(birthdayReservationsMap));
              
              setBirthdayReservationsByReservationId(birthdayReservationsMap);
              
              // Carregar itens do cardápio para todas as reservas de aniversário encontradas
              if (Object.keys(birthdayReservationsMap).length > 0 && data.evento?.establishment_id) {
                console.log('🎂 [check-ins] Carregando itens do cardápio para', Object.keys(birthdayReservationsMap).length, 'reservas de aniversário');
                loadMenuItemsForBirthdayReservations(birthdayReservationsMap, data.evento.establishment_id);
              }
            }
          } catch (error) {
            console.error('Erro ao buscar reservas de aniversário:', error);
          }
        }
        
        // Armazenar o establishment_id para uso posterior se necessário
        if (data.evento?.establishment_id) {
          setEstablishmentFilterId(Number(data.evento.establishment_id));
        }
        
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
            }
          } catch (error) {
            console.error('Erro ao carregar regras de brindes:', error);
          }
        }
        
        // VALIDAÇÃO RIGOROSA: Garantir que apenas convidados de promoters sejam exibidos
        // Limpar array primeiro
        setConvidadosPromoters([]);
        
        // Filtrar e validar apenas convidados de promoters
        const convidadosPromotersFiltrados = (data.dados.convidadosPromoters || [])
          .filter((c: any) => {
            if (!isValidPromoterGuest(c)) {
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
                let checkinStatus: { ownerCheckedIn: boolean; ownerCheckedOut?: boolean; guestsCheckedIn: number; totalGuests: number } | null = null;
                
                if (giftsRes.ok) {
                  const giftsData = await giftsRes.json();
                  gifts = giftsData.gifts || [];
                }
                
                if (checkinRes.ok) {
                  const checkinData = await checkinRes.json();
                  checkinStatus = {
                    ownerCheckedIn: checkinData.checkin_status.owner_checked_in || false,
                    ownerCheckedOut: checkinData.checkin_status.owner_checked_out || false,
                    guestsCheckedIn: checkinData.checkin_status.guests_checked_in || 0,
                    // Usar total_guests do checkin_status se disponível, caso contrário será atualizado quando guests forem carregados
                    totalGuests: checkinData.checkin_status.total_guests || 0
                  };
                } else {
                  // Fallback: usar dados da lista se não conseguir carregar
                  // O totalGuests será atualizado quando os guests forem carregados
                  checkinStatus = {
                    ownerCheckedIn: gl.owner_checked_in === 1,
                    guestsCheckedIn: gl.guests_checked_in || 0,
                    totalGuests: 0 // Será atualizado quando guests forem carregados
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
                    totalGuests: 0 // Será atualizado quando guests forem carregados
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
          };
          
          // Carregar em background sem bloquear a UI
          loadAllGiftsAndStatus();
        }
        
        // Carregar todos os guests automaticamente para preservar dados de check-in/check-out
        if (guestLists.length > 0) {
          const loadAllGuests = async () => {
            const token = localStorage.getItem('authToken');
            
            // Carregar guests em paralelo para todas as guest lists
            const promises = guestLists.map(async (gl: GuestListRestaurante) => {
              try {
                const guestsRes = await fetch(`${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/guests`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                if (guestsRes.ok) {
                  const guestsData = await guestsRes.json();
                  const guests = guestsData.guests || [];
                  
                  // Ordenar convidados alfabeticamente por nome
                  const sortedGuests = [...guests].sort((a, b) => 
                    (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
                  );
                  
                  return {
                    guestListId: gl.guest_list_id,
                    guests: sortedGuests
                  };
                } else {
                  console.error(`Erro ao carregar guests para lista ${gl.guest_list_id}:`, guestsRes.status);
                  return {
                    guestListId: gl.guest_list_id,
                    guests: []
                  };
                }
              } catch (error) {
                console.error(`Erro ao carregar guests para lista ${gl.guest_list_id}:`, error);
                return {
                  guestListId: gl.guest_list_id,
                  guests: []
                };
              }
            });
            
            const results = await Promise.all(promises);
            
            // Atualizar estado de guests, sempre usando dados do backend (que são a fonte da verdade)
            // O backend já retorna os dados de check-out corretos
            setGuestsByList(prev => {
              const updated = { ...prev };
              results.forEach(result => {
                // Sempre usar os dados do backend como fonte da verdade
                // O backend já retorna checked_out, checkout_time, checked_in, checkin_time corretos
                updated[result.guestListId] = result.guests;
              });
              return updated;
            });
            
            // Atualizar totalGuests no checkInStatus
            setCheckInStatus(prev => {
              const updated = { ...prev };
              results.forEach(result => {
                if (result.guests.length > 0) {
                  updated[result.guestListId] = {
                    ...updated[result.guestListId],
                    totalGuests: result.guests.length
                  };
                }
              });
              return updated;
            });
            
            // Carregar histórico de reservas concluídas a partir das guest lists com owner_checked_out = 1
            // Usar os dados já carregados anteriormente
            const loadHistoricoConcluidas = () => {
              const concluidas: ReservaConcluida[] = [];
              
              // Buscar todas as guest lists concluídas
              const guestListsConcluidas = guestLists.filter((gl: GuestListRestaurante) => 
                gl.owner_checked_out === 1 && gl.owner_checkin_time && gl.owner_checkout_time
              );
              
              // Para cada guest list concluída, construir o objeto de histórico
              guestListsConcluidas.forEach((gl: GuestListRestaurante) => {
                const guests = results.find(r => r.guestListId === gl.guest_list_id)?.guests || [];
                
                // Usar dados da guest list diretamente (já tem table_number e area_name se disponíveis)
                const reservaConcluida: ReservaConcluida = {
                  guest_list_id: gl.guest_list_id,
                  owner_name: gl.owner_name,
                  reservation_id: gl.reservation_id,
                  table_number: (gl as any).table_number || undefined,
                  area_name: (gl as any).area_name || undefined,
                  checkin_time: gl.owner_checkin_time || '',
                  checkout_time: gl.owner_checkout_time || '',
                  guests: guests.map((g: GuestItem) => ({
                    id: g.id,
                    name: g.name || '',
                    checkin_time: g.checkin_time,
                    checkout_time: g.checkout_time
                  }))
                };
                
                concluidas.push(reservaConcluida);
              });
              
              // Atualizar histórico
              setHistoricoReservasConcluidas(concluidas);
            };
            
            // Carregar histórico após guests serem carregados
            loadHistoricoConcluidas();
          };
          
          // Carregar em background sem bloquear a UI
          loadAllGuests();
        }
        
        // A arrecadação será calculada automaticamente pelo useEffect quando os estados mudarem
      } else {
        console.error('Erro ao carregar dados:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [eventoId, loadMenuItemsForBirthdayReservations]);

  useEffect(() => {
    loadCheckInData();
  }, [loadCheckInData]);

  // Carregar histórico de reservas concluídas da tabela checkouts
  useEffect(() => {
    if (!eventoId || !evento) {
      return;
    }

    const loadCheckoutsFromTable = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Buscar check-outs da tabela checkouts
        const checkoutsRes = await fetch(
          `${API_URL}/api/admin/checkouts?evento_id=${eventoId}`,
          { headers }
        );

        if (checkoutsRes.ok) {
          const checkoutsData = await checkoutsRes.json();
          const checkouts = checkoutsData.checkouts || [];

          // Agrupar check-outs por guest_list_id (owner check-outs)
          const ownerCheckouts = checkouts.filter((c: any) => c.checkout_type === 'owner');
          const guestCheckouts = checkouts.filter((c: any) => c.checkout_type === 'guest');

          // Construir histórico a partir dos check-outs da tabela
          const historico: ReservaConcluida[] = ownerCheckouts.map((checkout: any) => {
            // Buscar guests que fizeram check-out desta guest list
            const guestsFromCheckout = guestCheckouts
              .filter((gc: any) => gc.guest_list_id === checkout.guest_list_id)
              .map((gc: any) => ({
                id: gc.entity_id,
                name: gc.name,
                checkin_time: gc.checkin_time,
                checkout_time: gc.checkout_time
              }));

            return {
              guest_list_id: checkout.guest_list_id,
              owner_name: checkout.name,
              reservation_id: checkout.reservation_id || 0,
              table_number: checkout.table_number,
              area_name: checkout.area_name,
              checkin_time: checkout.checkin_time || '',
              checkout_time: checkout.checkout_time || '',
              guests: guestsFromCheckout
            };
          });

          setHistoricoReservasConcluidas(historico);
        } else {
          // Fallback: usar método antigo se a tabela não existir ainda
          if (guestListsRestaurante.length === 0) {
            setHistoricoReservasConcluidas([]);
            return;
          }

          const guestListsConcluidas = guestListsRestaurante.filter((gl: GuestListRestaurante) => 
            gl.owner_checked_out === 1 && gl.owner_checkin_time && gl.owner_checkout_time
          );

          if (guestListsConcluidas.length === 0) {
            setHistoricoReservasConcluidas([]);
            return;
          }

          const concluidas: ReservaConcluida[] = guestListsConcluidas.map((gl: GuestListRestaurante) => {
            const guests = guestsByList[gl.guest_list_id] || [];
            
            return {
              guest_list_id: gl.guest_list_id,
              owner_name: gl.owner_name,
              reservation_id: gl.reservation_id,
              table_number: (gl as any).table_number || undefined,
              area_name: (gl as any).area_name || undefined,
              checkin_time: gl.owner_checkin_time || '',
              checkout_time: gl.owner_checkout_time || '',
              guests: guests.map((g: GuestItem) => ({
                id: g.id,
                name: g.name || '',
                checkin_time: g.checkin_time,
                checkout_time: g.checkout_time
              }))
            };
          });

          setHistoricoReservasConcluidas(concluidas);
        }
      } catch (error) {
        console.error('Erro ao carregar check-outs da tabela:', error);
        // Fallback para método antigo em caso de erro
        if (guestListsRestaurante.length > 0) {
          const guestListsConcluidas = guestListsRestaurante.filter((gl: GuestListRestaurante) => 
            gl.owner_checked_out === 1 && gl.owner_checkin_time && gl.owner_checkout_time
          );

          if (guestListsConcluidas.length > 0) {
            const concluidas: ReservaConcluida[] = guestListsConcluidas.map((gl: GuestListRestaurante) => {
              const guests = guestsByList[gl.guest_list_id] || [];
              
              return {
                guest_list_id: gl.guest_list_id,
                owner_name: gl.owner_name,
                reservation_id: gl.reservation_id,
                table_number: (gl as any).table_number || undefined,
                area_name: (gl as any).area_name || undefined,
                checkin_time: gl.owner_checkin_time || '',
                checkout_time: gl.owner_checkout_time || '',
                guests: guests.map((g: GuestItem) => ({
                  id: g.id,
                  name: g.name || '',
                  checkin_time: g.checkin_time,
                  checkout_time: g.checkout_time
                }))
              };
            });

            setHistoricoReservasConcluidas(concluidas);
          }
        }
      }
    };

    loadCheckoutsFromTable();
  }, [eventoId, evento, guestListsRestaurante, guestsByList]);

  useEffect(() => {
    if (!planilhaModalOpen || !evento || !eventoId) {
      setPlanilhaReservas([]);
      return;
    }
    const dataEvento = evento.data_evento?.split('T')[0] || evento.data_evento || '';
    if (!sheetFilters.date) {
      setSheetFilters(prev => ({ ...prev, date: dataEvento }));
      return;
    }

    const carregarPlanilhaReservas = async () => {
      setPlanilhaLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const dateToUse = sheetFilters.date || dataEvento;
        const dateParam = dateToUse ? `&date=${encodeURIComponent(dateToUse)}` : '';
        const normalReservationsPromise = fetch(
          `${API_URL}/api/restaurant-reservations?establishment_id=${evento.establishment_id}${dateParam}`,
          { headers }
        ).then(res => res.ok ? res.json() : { reservations: [] });

        const largeReservationsPromise = fetch(
          `${API_URL}/api/large-reservations?establishment_id=${evento.establishment_id}${dateParam}`,
          { headers }
        ).then(res => res.ok ? res.json() : { reservations: [] });

        const [normalData, largeData] = await Promise.all([
          normalReservationsPromise,
          largeReservationsPromise
        ]);

        const allReservations = [
          ...(normalData.reservations || []),
          ...(largeData.reservations || [])
        ] as Reservation[];

        setPlanilhaReservas(allReservations);

        // Buscar todas as áreas e mesas para mostrar mesas sem reserva
        const getAreaKeyFromAreaName = (areaName: string): string | null => {
          const name = areaName.toLowerCase();
          if (name.includes('roof') || name.includes('rooftop')) return 'rooftop';
          if (name.includes('deck')) return 'deck';
          if (name.includes('bar')) return 'bar';
          if (name.includes('balada')) return 'balada';
          return null;
        };

        const areasRes = await fetch(`${API_URL}/api/restaurant-areas`, { headers });
        if (areasRes.ok) {
          const areasData = await areasRes.json();
          const areas = areasData.areas || [];
          const mesasMap = new Map<string, Array<{ area_id: number; area_name: string; table_number: string }>>();

          for (const area of areas) {
            try {
              const tablesRes = await fetch(
                `${API_URL}/api/restaurant-tables/${area.id}/availability?date=${dateToUse}${evento.establishment_id ? `&establishment_id=${evento.establishment_id}` : ''}`,
                { headers }
              );
              if (tablesRes.ok) {
                const tablesData = await tablesRes.json();
                const tables = tablesData.tables || [];
                // Usar o nome da área como chave (nome único do banco)
                // Criar uma chave única usando area_id para garantir precisão
                const areaKeyUnique = `area_${area.id}`;
                mesasMap.set(areaKeyUnique, tables.map((t: any) => ({
                  area_id: area.id,
                  area_name: area.name,
                  table_number: t.table_number?.toString() || t.table_number
                })));
              }
            } catch (err) {
              console.error(`Erro ao carregar mesas da área ${area.name}:`, err);
            }
          }

          setTodasMesasAreas(mesasMap);
        }

        console.log(`✅ [PLANILHA] ${allReservations.length} reservas carregadas`);
      } catch (error) {
        console.error('❌ Erro ao carregar planilha:', error);
        setPlanilhaReservas([]);
      } finally {
        setPlanilhaLoading(false);
      }
    };

    carregarPlanilhaReservas();
  }, [planilhaModalOpen, evento, eventoId, sheetFilters.date]);

  const handleExportPlanilhaExcel = useCallback(() => {
    const matches = (r: Reservation) => {
      if (sheetFilters.date) {
        let d = '';
        try {
          const dateStr = String(r.reservation_date || '').trim();
          if (dateStr && dateStr !== 'null' && dateStr !== 'undefined') {
            const dt = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
            if (!isNaN(dt.getTime())) d = dt.toISOString().split('T')[0];
          }
        } catch { /* ignore */ }
        if (d !== sheetFilters.date) return false;
      }
      if (sheetFilters.search) {
        const q = sheetFilters.search.toLowerCase();
        const hay = `${(r as any).client_name || ''} ${(r as any).client_phone || ''} ${(r as any).event_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (sheetFilters.name && !(`${(r as any).client_name || ''}`.toLowerCase().includes((sheetFilters.name || '').toLowerCase()))) return false;
      if (sheetFilters.phone && !(`${(r as any).client_phone || ''}`.toLowerCase().includes((sheetFilters.phone || '').toLowerCase()))) return false;
      if (sheetFilters.event && !(`${(r as any).event_name || ''}`.toLowerCase().includes((sheetFilters.event || '').toLowerCase()))) return false;
      if (sheetFilters.table && !(`${(r as any).table_number || ''}`.toString().toLowerCase().includes((sheetFilters.table || '').toLowerCase()))) return false;
      if (sheetFilters.status && !((r as any).status || '').toLowerCase().includes((sheetFilters.status || '').toLowerCase())) return false;
      return true;
    };
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr + 'T12:00:00');
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
      } catch { return ''; }
    };
    const formatTime = (t?: string) => (t && t.trim() ? String(t).slice(0, 5) : '');
    const filtered = planilhaReservas.filter(matches);
    const headers = ['Data', 'Hora', 'Nome', 'Mesa', 'Área', 'Telefone', 'Pessoas', 'Status', 'Observação'];
    const rows = filtered.map(r => [
      formatDate(String((r as any).reservation_date || '').split('T')[0]),
      formatTime((r as any).reservation_time),
      (r as any).client_name || '',
      (r as any).table_number != null ? String((r as any).table_number) : '',
      (() => {
        const establishmentName = (evento?.establishment_name || '').toLowerCase();
        const isSeuJustinoCheckIns = evento?.establishment_id === 1 || 
          (establishmentName.includes('seu justino') && !establishmentName.includes('pracinha'));
        const isPracinhaJustino = establishmentName.includes('pracinha') && establishmentName.includes('seu justino');
        return (isSeuJustinoCheckIns || isPracinhaJustino)
          ? getSeuJustinoAreaName((r as any).table_number, (r as any).area_name, (r as any).area_id)
          : ((r as any).area_name || '');
      })(),
      (r as any).client_phone || '',
      typeof (r as any).number_of_people === 'number' ? (r as any).number_of_people : parseInt(String((r as any).number_of_people || '0'), 10) || 0,
      (r as any).status || '',
      (r as any).notes || (r as any).admin_notes || ''
    ]);
    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reservas');
    const dateLabel = sheetFilters.date ? `_${sheetFilters.date}` : '';
    const est = evento?.establishment_name || 'estabelecimento';
    const safe = est.replace(/[^a-z0-9]/gi, '_').slice(0, 30);
    XLSX.writeFile(wb, `planilha_reservas${dateLabel}_${safe}.xlsx`);
  }, [planilhaReservas, sheetFilters, evento]);

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

  // Recalcular arrecadação quando os dados mudarem (otimizado - só recalcula quando realmente necessário)
  const prevDataRef = useRef<{ 
    reservas: number; 
    promoters: number; 
    guests: number;
    guestsByListKeys: string;
  }>({ reservas: 0, promoters: 0, guests: 0, guestsByListKeys: '' });
  
  useEffect(() => {
    const guestsByListKeys = Object.keys(guestsByList).sort().join(',');
    const currentData = {
      reservas: convidadosReservas.length,
      promoters: convidadosPromoters.length,
      guests: Object.values(guestsByList).flat().length,
      guestsByListKeys
    };
    
    // Só recalcular se os dados realmente mudaram
    const hasChanged = 
      prevDataRef.current.reservas !== currentData.reservas ||
      prevDataRef.current.promoters !== currentData.promoters ||
      prevDataRef.current.guests !== currentData.guests ||
      prevDataRef.current.guestsByListKeys !== currentData.guestsByListKeys;
    
    if (hasChanged && (convidadosReservas.length > 0 || convidadosPromoters.length > 0 || Object.keys(guestsByList).length > 0)) {
      calcularArrecadacao(
        convidadosReservas,
        convidadosPromoters,
        promoters,
        guestsByList
      );
      prevDataRef.current = currentData;
    }
  }, [convidadosReservas, convidadosPromoters, promoters, guestsByList, calcularArrecadacao]);

  // Funções de check-in - Abre modal primeiro (memoizadas para evitar re-renderizações)
  const handleConvidadoReservaCheckIn = useCallback((convidado: ConvidadoReserva) => {
    const key = `reserva-${convidado.id}`;
    if (checkInInProgressRef.current[key]) return;
    
    checkInInProgressRef.current[key] = true;
    setConvidadoParaCheckIn({
      tipo: 'reserva',
      id: convidado.id,
      nome: convidado.nome
    });
    setEntradaModalOpen(true);
    setTimeout(() => {
      checkInInProgressRef.current[key] = false;
    }, 500);
  }, []);

  const handleConvidadoPromoterCheckIn = useCallback((convidado: ConvidadoPromoter) => {
    const key = `promoter-${convidado.id}`;
    if (checkInInProgressRef.current[key]) return;
    
    checkInInProgressRef.current[key] = true;
    setConvidadoParaCheckIn({
      tipo: 'promoter',
      id: convidado.id,
      nome: convidado.nome
    });
    setEntradaModalOpen(true);
    setTimeout(() => {
      checkInInProgressRef.current[key] = false;
    }, 500);
  }, []);

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
      } else if (convidadoParaCheckIn.tipo === 'restaurante' && convidadoParaCheckIn.reservationId) {
        // Check-in de reserva de restaurante sem guest list
        response = await fetch(`${API_URL}/api/restaurant-reservations/${convidadoParaCheckIn.reservationId}/checkin`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        // Atualizar estado local após check-in bem-sucedido
        if (response.ok) {
          setReservasRestaurante(prev => prev.map(r => 
            r.id === convidadoParaCheckIn.reservationId
              ? { ...r, checked_in: true, checkin_time: new Date().toISOString() }
              : r
          ));
        }
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
        const tipoTexto = convidadoParaCheckIn.tipo === 'restaurante' 
          ? 'Check-in confirmado' 
          : tipo === 'VIP' 
            ? 'VIP (grátis)' 
            : tipo === 'SECO' 
              ? `SECO (R$ ${valor.toFixed(2)})` 
              : `CONSUMA (R$ ${valor.toFixed(2)})`;
        toast.success(`✅ Check-in de ${convidadoParaCheckIn.nome} confirmado! ${convidadoParaCheckIn.tipo !== 'restaurante' ? `Status: ${tipoTexto}` : ''}`, {
          position: "top-center",
          autoClose: 3000,
        });
        setEntradaModalOpen(false);
        
        // Atualizar estado local para reservas sem guest list
        if (convidadoParaCheckIn.tipo === 'restaurante' && convidadoParaCheckIn.reservationId) {
          setReservasRestaurante(prev => prev.map(r => 
            r.id === convidadoParaCheckIn.reservationId
              ? { ...r, checked_in: true, checkin_time: new Date().toISOString() }
              : r
          ));
          // Recarregar dados para atualizar a busca
          loadCheckInData();
        }
        
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
                    toast.success(`🎁 Brinde(s) liberado(s)!\n\n${newlyAwarded.map((g: any) => `✅ ${g.descricao}`).join('\n')}`, {
                      position: "top-center",
                      autoClose: 5000,
                    });
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
        toast.error(`❌ ${errorData.message || errorData.error || 'Erro ao fazer check-in'}`, {
          position: "top-center",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Erro ao fazer check-in', {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      // Limpar flag de progresso
      if (convidadoParaCheckIn) {
        const key = `${convidadoParaCheckIn.tipo}-${convidadoParaCheckIn.id}`;
        checkInInProgressRef.current[key] = false;
      }
    }
  };

  const handleCamaroteCheckIn = useCallback(async (camarote: Camarote, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const key = `camarote-${camarote.id}`;
    if (checkInInProgressRef.current[key]) return;
    checkInInProgressRef.current[key] = true;
    
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
        toast.success(`✅ Check-in de ${camarote.responsavel} confirmado!`, {
          position: "top-center",
          autoClose: 3000,
        });
        loadCheckInData();
      } else {
        toast.error('❌ Erro ao fazer check-in', {
          position: "top-center",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Erro ao fazer check-in', {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      checkInInProgressRef.current[key] = false;
    }
  }, [loadCheckInData]);

  const handleReservaRestauranteCheckIn = useCallback(async (reserva: ReservaRestaurante, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const key = `reserva-restaurante-${reserva.id}`;
    if (checkInInProgressRef.current[key]) return;
    checkInInProgressRef.current[key] = true;
    
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
        toast.success(`✅ Check-in de ${reserva.responsavel} confirmado!`, {
          position: "top-center",
          autoClose: 3000,
        });
        loadCheckInData();
      } else {
        toast.error('❌ Erro ao fazer check-in', {
          position: "top-center",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Erro ao fazer check-in', {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      checkInInProgressRef.current[key] = false;
    }
  }, [loadCheckInData]);

  const handleConvidadoReservaRestauranteCheckIn = useCallback(async (convidado: ConvidadoReservaRestaurante, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const key = `convidado-restaurante-${convidado.id}`;
    if (checkInInProgressRef.current[key]) return;
    checkInInProgressRef.current[key] = true;
    
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
        toast.success(`✅ Check-in de ${convidado.nome} confirmado!`, {
          position: "top-center",
          autoClose: 3000,
        });
        loadCheckInData();
      } else {
        toast.error('❌ Erro ao fazer check-in', {
          position: "top-center",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Erro ao fazer check-in', {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      checkInInProgressRef.current[key] = false;
    }
  }, [loadCheckInData]);

  // Funções para guest lists (replicando Sistema de Reservas)
  const handleOwnerCheckIn = useCallback(async (guestListId: number, ownerName: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const key = `owner-${guestListId}`;
    if (checkInInProgressRef.current[key]) return;
    checkInInProgressRef.current[key] = true;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/guest-lists/${guestListId}/owner-checkin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const now = new Date().toISOString();
        setCheckInStatus(prev => ({
          ...prev,
          [guestListId]: { ...prev[guestListId], ownerCheckedIn: true }
        }));
        setOwnerCheckInTimeMap(prev => ({ ...prev, [guestListId]: now }));
        toast.success(`✅ Check-in de ${ownerName} confirmado!`, {
          position: "top-center",
          autoClose: 3000,
        });
        loadCheckInData();
      } else {
        toast.error('❌ Erro ao fazer check-in do dono', {
          position: "top-center",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Erro ao fazer check-in do dono', {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      checkInInProgressRef.current[key] = false;
    }
  }, [loadCheckInData]);

  // Função para fazer check-out do dono
  const handleOwnerCheckOut = useCallback(async (guestListId: number, ownerName: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!confirm(`Confirmar check-out de ${ownerName}? Isso liberará a mesa para novos clientes.`)) return;
    
    const key = `owner-checkout-${guestListId}`;
    if (checkInInProgressRef.current[key]) return;
    checkInInProgressRef.current[key] = true;
    
    try {
      const token = localStorage.getItem('authToken');
      
      // Buscar informações da guest list para obter o reservation_id
      const guestListInfo = guestListsRestaurante.find(gl => gl.guest_list_id === guestListId);
      
      // Fazer check-out do dono
      const response = await fetch(`${API_URL}/api/admin/guest-lists/${guestListId}/owner-checkout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const now = data.guestList?.owner_checkout_time || new Date().toISOString();
        
        // Atualizar estado local imediatamente
        setCheckInStatus(prev => ({
          ...prev,
          [guestListId]: {
            ...prev[guestListId],
            ownerCheckedIn: false,
            ownerCheckedOut: true
          }
        }));
        setOwnerCheckOutTimeMap(prev => ({ ...prev, [guestListId]: now }));
        
        // Atualizar também a lista de guestListsRestaurante para refletir o check-out
        setGuestListsRestaurante(prev => prev.map(gl => 
          gl.guest_list_id === guestListId 
            ? { ...gl, owner_checked_out: 1, owner_checkout_time: now }
            : gl
        ));

        // Buscar informações dos convidados para o histórico
        const guestsInfo = guestsByList[guestListId] || [];
        const guestsCompletos = guestsInfo.map(g => ({
          id: g.id,
          name: g.name,
          checkin_time: g.checkin_time,
          checkout_time: g.checkout_time
        }));

        // Adicionar ao histórico de reservas concluídas
        const reservaConcluida: ReservaConcluida = {
          guest_list_id: guestListId,
          owner_name: ownerName,
          reservation_id: guestListInfo?.reservation_id || 0,
          table_number: guestListInfo?.table_number,
          area_name: guestListInfo?.area_name,
          checkin_time: guestListInfo?.owner_checkin_time || ownerCheckInTimeMap[guestListId] || '',
          checkout_time: now,
          guests: guestsCompletos
        };
        
        setHistoricoReservasConcluidas(prev => {
          // Verificar se já existe no histórico (evitar duplicatas)
          const exists = prev.some(h => h.guest_list_id === guestListId);
          if (exists) {
            return prev.map(h => h.guest_list_id === guestListId ? reservaConcluida : h);
          }
          return [...prev, reservaConcluida];
        });

        // Após check-out, liberar mesa automaticamente se houver reserva associada
        if (guestListInfo && guestListInfo.reservation_id && guestListInfo.reservation_type === 'restaurant') {
          try {
            // Atualizar status da reserva para 'completed' para liberar a mesa
            const updateReservationResponse = await fetch(`${API_URL}/api/restaurant-reservations/${guestListInfo.reservation_id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                status: 'completed'
              })
            });

            if (updateReservationResponse.ok) {
              console.log(`✅ Mesa liberada para reserva ${guestListInfo.reservation_id}`);
            } else {
              console.warn(`⚠️ Não foi possível atualizar status da reserva ${guestListInfo.reservation_id}`);
            }
          } catch (tableError) {
            console.error('❌ Erro ao liberar mesa:', tableError);
            // Não bloquear o check-out se houver erro na liberação da mesa
          }
        }

        toast.success(`✅ Check-out de ${ownerName} confirmado! Mesa liberada.`, {
          position: "top-center",
          autoClose: 3000,
        });
        
        // Não recarregar dados imediatamente - o estado já foi atualizado
        // O useEffect que reconstrói o histórico vai cuidar disso automaticamente
        // Os dados já estão atualizados no estado local e serão preservados
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`❌ Erro ao fazer check-out: ${errorData.error || 'Erro desconhecido'}`, {
          position: "top-center",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Erro ao fazer check-out do dono', {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      checkInInProgressRef.current[key] = false;
    }
  }, [loadCheckInData, guestListsRestaurante]);


  const handleGuestCheckIn = useCallback((guestListId: number, guestId: number, guestName: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const key = `guest-${guestListId}-${guestId}`;
    if (checkInInProgressRef.current[key]) return;
    checkInInProgressRef.current[key] = true;
    
    // Abre o modal ao invés de fazer check-in direto
    setConvidadoParaCheckIn({
      tipo: 'guest_list',
      id: guestId,
      nome: guestName,
      guestListId: guestListId
    });
    setEntradaModalOpen(true);
    
    setTimeout(() => {
      checkInInProgressRef.current[key] = false;
    }, 500);
  }, []);

  // Função para fazer check-out de um convidado de guest list
  const handleGuestCheckOut = useCallback(async (guestListId: number, guestId: number, guestName: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!confirm(`Confirmar check-out de ${guestName}?`)) return;
    
    const key = `guest-checkout-${guestListId}-${guestId}`;
    if (checkInInProgressRef.current[key]) return;
    checkInInProgressRef.current[key] = true;
    
    // Atualização otimista do estado - marcar como checked_out imediatamente
    setGuestsByList(prev => {
      const updated = { ...prev };
      if (updated[guestListId]) {
        updated[guestListId] = updated[guestListId].map(guest => {
          if (guest.id === guestId) {
            return {
              ...guest,
              checked_out: 1,
              checkout_time: new Date().toISOString()
            };
          }
          return guest;
        });
      }
      return updated;
    });
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/guests/${guestId}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast.success(`✅ Check-out de ${guestName} confirmado!`, {
          position: "top-center",
          autoClose: 3000,
        });
        // Não recarregar dados imediatamente - o estado já foi atualizado otimisticamente
        // O useEffect que reconstrói o histórico vai cuidar disso automaticamente
        // Os dados já estão atualizados no estado local e serão preservados
      } else {
        // Reverter atualização otimista em caso de erro
        setGuestsByList(prev => {
          const updated = { ...prev };
          if (updated[guestListId]) {
            updated[guestListId] = updated[guestListId].map(guest => {
              if (guest.id === guestId) {
                return {
                  ...guest,
                  checked_out: 0,
                  checkout_time: undefined
                };
              }
              return guest;
            });
          }
          return updated;
        });
        const errorData = await response.json().catch(() => ({}));
        toast.error(`❌ Erro ao fazer check-out: ${errorData.error || 'Erro desconhecido'}`, {
          position: "top-center",
          autoClose: 4000,
        });
      }
    } catch (error) {
      // Reverter atualização otimista em caso de erro
      setGuestsByList(prev => {
        const updated = { ...prev };
        if (updated[guestListId]) {
          updated[guestListId] = updated[guestListId].map(guest => {
            if (guest.id === guestId) {
              return {
                ...guest,
                checked_out: 0,
                checkout_time: undefined
              };
            }
            return guest;
          });
        }
        return updated;
      });
      console.error('Erro no check-out do convidado:', error);
      toast.error('❌ Erro ao fazer check-out do convidado', {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setTimeout(() => {
        checkInInProgressRef.current[key] = false;
      }, 500);
    }
  }, [loadCheckInData]);

  // Função para fazer check-out de um convidado de reserva restaurante
  const handleConvidadoReservaRestauranteCheckOut = useCallback(async (convidado: ConvidadoReservaRestaurante, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!confirm(`Confirmar check-out de ${convidado.nome}?`)) return;
    
    const key = `convidado-restaurante-checkout-${convidado.id}`;
    if (checkInInProgressRef.current[key]) return;
    checkInInProgressRef.current[key] = true;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/guests/${convidado.id}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast.success(`✅ Check-out de ${convidado.nome} confirmado!`, {
          position: "top-center",
          autoClose: 3000,
        });
        loadCheckInData();
      } else {
        toast.error('❌ Erro ao fazer check-out', {
          position: "top-center",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Erro no check-out do convidado:', error);
      toast.error('❌ Erro ao fazer check-out do convidado', {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setTimeout(() => {
        checkInInProgressRef.current[key] = false;
      }, 500);
    }
  }, [loadCheckInData]);

  // Filtrar por busca (otimizado com cache de lowercase)
  const searchTermLower = useMemo(() => debouncedSearchTerm.toLowerCase().trim(), [debouncedSearchTerm]);
  const filterBySearch = useCallback((text: string | null | undefined) => {
    if (!searchTermLower) return true;
    if (!text) return false;
    return text.toLowerCase().includes(searchTermLower);
  }, [searchTermLower]);

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

  // Filtrar dados - Mostrar todos se não houver busca (otimizado)
  const filteredConvidadosReservas = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      // Se não há busca, retornar array ordenado uma vez
      const sorted = [...convidadosReservas].sort((a, b) => 
        cachedStringCompare(a.nome || '', b.nome || '')
      );
      return sorted;
    }
    
    const filtered = convidadosReservas.filter(c => 
      filterBySearch(c.nome) || 
      filterBySearch(c.email || '') || 
      filterBySearch(c.responsavel) ||
      filterBySearch(c.origem)
    );
    // Ordenar alfabeticamente usando cache
    return filtered.sort((a, b) => 
      cachedStringCompare(a.nome || '', b.nome || '')
    );
  }, [convidadosReservas, debouncedSearchTerm, filterBySearch, cachedStringCompare]);

  // Filtrar convidados de promoters - agora também usa searchTerm principal (otimizado)
  const filteredConvidadosPromoters = useMemo(() => {
    // Primeiro, validar que são realmente convidados de promoters (cachear resultado)
    const validados = convidadosPromoters.filter(c => isValidPromoterGuest(c));
    
    // Usar searchTerm principal se existir, senão usar promoterGuestsSearch
    const searchText = debouncedSearchTerm.trim() || promoterGuestsSearch.trim();
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
      return nome.includes(searchLower) || 
             telefone.includes(searchLower) || 
             responsavel.includes(searchLower) ||
             origem.includes(searchLower);
    });
    
    return filtrados;
  }, [convidadosPromoters, debouncedSearchTerm, promoterGuestsSearch]);

  const filteredConvidadosReservasRestaurante = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      const sorted = [...convidadosReservasRestaurante].sort((a, b) => 
        cachedStringCompare(a.nome || '', b.nome || '')
      );
      return sorted;
    }
    
    const filtered = convidadosReservasRestaurante.filter(c => 
      filterBySearch(c.nome) || 
      filterBySearch(c.telefone || '') || 
      filterBySearch(c.responsavel) ||
      filterBySearch(c.origem) ||
      filterBySearch(c.data_nascimento || '')
    );
    // Ordenar alfabeticamente usando cache
    return filtered.sort((a, b) => 
      cachedStringCompare(a.nome || '', b.nome || '')
    );
  }, [convidadosReservasRestaurante, debouncedSearchTerm, filterBySearch, cachedStringCompare]);

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

  // Resultados unificados de busca - todos os convidados encontrados (com filtros e ordenação) - OTIMIZADO
  const resultadosBuscaUnificados = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
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
      data_checkout?: string;
      email?: string;
      telefone?: string;
      documento?: string;
      entrada_tipo?: EntradaTipo;
      entrada_valor?: number;
      convidado?: ConvidadoReserva | ConvidadoPromoter | ConvidadoReservaRestaurante | GuestItem | undefined;
      guestListId?: number;
      reservationId?: number; // Para reservas sem guest list
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
            status: (g.checked_out === 1 || g.checked_out === true) ? 'CHECK-OUT' : (g.checked_in === 1 || g.checked_in === true) ? 'CHECK-IN' : 'Pendente',
            data_checkin: g.checkin_time,
            data_checkout: g.checkout_time,
            telefone: g.whatsapp,
            entrada_tipo: g.entrada_tipo,
            entrada_valor: g.entrada_valor,
            convidado: g,
            guestListId: Number(listId)
          });
        });
      } else {
        const searchLower = debouncedSearchTerm.toLowerCase();
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

    // Adicionar reservas de restaurante sem guest list (reservas simples)
    const searchLower = debouncedSearchTerm.toLowerCase();
    // Buscar reservas sem guest list (guest_list_id é null ou undefined)
    reservasRestaurante.forEach(r => {
      // Verificar se esta reserva não tem guest list associada
      // guest_list_id será null/undefined para reservas sem guest list
      const hasGuestList = r.guest_list_id != null; // Usar != para verificar null e undefined
      
      if (!hasGuestList) {
        const reserva = r as any; // Type assertion para acessar campos opcionais
        // Buscar nome em múltiplos campos possíveis
        const nomeCompleto = (r.responsavel || reserva.client_name || reserva.owner_name || '').toLowerCase();
        const origem = (r.origem || reserva.origin || '').toLowerCase();
        
        // Debug: log para verificar se está encontrando a reserva
        if (nomeCompleto.includes('luis') || nomeCompleto.includes('felipe') || nomeCompleto.includes('martins')) {
          console.log('🔍 [BUSCA] Reserva encontrada:', {
            id: r.id,
            responsavel: r.responsavel,
            client_name: reserva.client_name,
            guest_list_id: r.guest_list_id,
            nomeCompleto,
            searchLower,
            match: nomeCompleto.includes(searchLower)
          });
        }
        
        if (nomeCompleto.includes(searchLower) || origem.includes(searchLower)) {
          resultados.push({
            tipo: 'restaurante',
            id: r.id,
            nome: r.responsavel || reserva.client_name || reserva.owner_name || 'Sem nome',
            origem: r.origem || reserva.origin || 'Reserva',
            responsavel: r.responsavel || reserva.client_name || reserva.owner_name || 'Cliente',
            status: r.checked_in ? 'CHECK-IN' : 'Pendente',
            data_checkin: r.checkin_time,
            telefone: undefined,
            convidado: undefined // Reserva sem guest list não tem convidado
          });
        }
      }
    });

    return resultados;
  }, [debouncedSearchTerm, filteredConvidadosReservas, filteredConvidadosPromoters, filteredConvidadosReservasRestaurante, guestsByList, guestListsRestaurante, reservasRestaurante, cachedStringCompare]);

  // Ref para evitar múltiplas buscas simultâneas
  const buscandoReservasAdicionaisRef = useRef(false);

  // Buscar reservas adicionais diretamente da API quando houver busca
  useEffect(() => {
    if (!debouncedSearchTerm.trim() || !evento) {
      setReservasAdicionaisAPI([]);
      return;
    }

    // Evitar múltiplas buscas simultâneas
    if (buscandoReservasAdicionaisRef.current) {
      return;
    }

    const buscarReservasAdicionais = async () => {
      buscandoReservasAdicionaisRef.current = true;
      setLoadingReservasAdicionais(true);
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const dataEvento = evento.data_evento?.split('T')[0] || evento.data_evento;
        const url = `${API_URL}/api/restaurant-reservations?establishment_id=${evento.establishment_id}&date=${dataEvento}`;
        
        const response = await fetch(url, { headers });
        if (response.ok) {
          const data = await response.json();
          const todasReservas = data.reservations || [];
          
          // Filtrar apenas reservas que não estão já em reservasRestaurante
          // Se não está em reservasRestaurante, provavelmente não tem guest list ou não foi incluída no endpoint de check-ins
          const idsJaIncluidos = new Set(reservasRestaurante.map(r => r.id));
          const reservasSemGuestList = todasReservas.filter((r: any) => {
            // Verificar se não está já incluída em reservasRestaurante
            return !idsJaIncluidos.has(r.id);
          });

          setReservasAdicionaisAPI(reservasSemGuestList);
          
          if (reservasSemGuestList.length > 0) {
            console.log(`✅ [BUSCA API] ${reservasSemGuestList.length} reservas adicionais encontradas (não estavam em check-ins consolidados)`);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar reservas adicionais:', error);
        setReservasAdicionaisAPI([]);
      } finally {
        setLoadingReservasAdicionais(false);
        buscandoReservasAdicionaisRef.current = false;
      }
    };

    // Debounce da busca API
    const timeoutId = setTimeout(buscarReservasAdicionais, 500);
    return () => {
      clearTimeout(timeoutId);
      buscandoReservasAdicionaisRef.current = false;
    };
  }, [debouncedSearchTerm, evento?.establishment_id, evento?.data_evento]);

  // Adicionar reservas da API aos resultados
  const resultadosCompletos = useMemo(() => {
    const resultados = [...resultadosBuscaUnificados];
    const searchLower = debouncedSearchTerm.toLowerCase();
    
    // Adicionar reservas encontradas na API adicional
    reservasAdicionaisAPI.forEach(r => {
      const nomeCompleto = (r.client_name || '').toLowerCase();
      const origem = (r.origin || '').toLowerCase();
      
      if (nomeCompleto.includes(searchLower) || origem.includes(searchLower)) {
        // Verificar se já não está nos resultados
        const jaExiste = resultados.some(res => res.id === r.id && res.tipo === 'restaurante');
        if (!jaExiste) {
          resultados.push({
            tipo: 'restaurante',
            id: r.id,
            nome: r.client_name || 'Sem nome',
            origem: r.origin || 'Reserva',
            responsavel: r.client_name || 'Cliente',
            status: r.checked_in ? 'CHECK-IN' : 'Pendente',
            data_checkin: r.checkin_time,
            telefone: undefined,
            convidado: undefined,
            reservationId: r.id
          });
        }
      }
    });
    
    // Ordenar alfabeticamente por nome
    return resultados.sort((a, b) => {
      return cachedStringCompare(a.nome, b.nome);
    });
  }, [resultadosBuscaUnificados, reservasAdicionaisAPI, debouncedSearchTerm, cachedStringCompare]);

  // Ordenar listas e convidados alfabeticamente (otimizado)
  const sortedGuestListsRestaurante = useMemo(() => {
    return [...guestListsRestaurante].sort((a, b) => 
      cachedStringCompare(a.owner_name || '', b.owner_name || '')
    );
  }, [guestListsRestaurante, cachedStringCompare]);

  const sortedReservasMesa = useMemo(() => {
    return [...reservasMesa].sort((a, b) => 
      cachedStringCompare(a.responsavel || '', b.responsavel || '')
    );
  }, [reservasMesa, cachedStringCompare]);

  const sortedFilteredConvidadosPromoters = useMemo(() => {
    return [...filteredConvidadosPromoters].sort((a, b) => 
      cachedStringCompare(a.nome || '', b.nome || '')
    );
  }, [filteredConvidadosPromoters, cachedStringCompare]);

  const filteredCamarotes = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return [...camarotes].sort((a, b) => 
        cachedStringCompare(a.responsavel || '', b.responsavel || '')
      );
    }
    const filtered = camarotes.filter(c => 
      filterBySearch(c.responsavel) || 
      filterBySearch(c.origem)
    );
    return filtered.sort((a, b) => 
      cachedStringCompare(a.responsavel || '', b.responsavel || '')
    );
  }, [camarotes, debouncedSearchTerm, filterBySearch, cachedStringCompare]);

  const filteredReservasRestaurante = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return [...reservasRestaurante].sort((a, b) => 
        cachedStringCompare(a.responsavel || '', b.responsavel || '')
      );
    }
    const filtered = reservasRestaurante.filter(r => 
      filterBySearch(r.responsavel) || 
      filterBySearch(r.origem)
    );
    return filtered.sort((a, b) => 
      cachedStringCompare(a.responsavel || '', b.responsavel || '')
    );
  }, [reservasRestaurante, debouncedSearchTerm, filterBySearch, cachedStringCompare]);

  const sortedFilteredPromoters = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return [...promoters].sort((a, b) => 
        cachedStringCompare(a.nome || '', b.nome || '')
      );
    }
    const filtered = promoters.filter(p => 
      filterBySearch(p.nome) || 
      filterBySearch(p.email || '') ||
      filterBySearch(p.telefone || '')
    );
    return filtered.sort((a, b) => 
      cachedStringCompare(a.nome || '', b.nome || '')
    );
  }, [promoters, debouncedSearchTerm, filterBySearch, cachedStringCompare]);

  const reservasMetrics = useMemo(() => {
    // Pessoas em reservas de mesa (convidados)
    const totalConvidadosReservas = convidadosReservas.length;
    const checkinConvidadosReservas = convidadosReservas.filter((c) => c.status === 'CHECK-IN').length;

    // Pessoas em reservas restaurante (guest lists + convidados): incluir dono da lista em cada lista
    let totalConvidadosRestaurante = 0;
    let checkinConvidadosRestaurante = 0;

    if (convidadosReservasRestaurante.length > 0) {
      totalConvidadosRestaurante = convidadosReservasRestaurante.length;
      checkinConvidadosRestaurante = convidadosReservasRestaurante.filter(
        (c) => c.status_checkin === 1 || c.status_checkin === true
      ).length;
    } else {
      const guestsLoaded = Object.values(guestsByList).reduce((sum, guests) => sum + guests.length, 0);
      const guestsCheckedInLoaded = Object.values(guestsByList).reduce((sum, guests) => 
        sum + guests.filter(g => g.checked_in === 1 || g.checked_in === true).length, 0
      );
      if (guestsLoaded > 0) {
        totalConvidadosRestaurante = guestsLoaded;
        checkinConvidadosRestaurante = guestsCheckedInLoaded;
      } else {
        guestListsRestaurante.forEach(gl => {
          const status = checkInStatus[gl.guest_list_id];
          if (status && status.totalGuests > 0) {
            totalConvidadosRestaurante += status.totalGuests;
            checkinConvidadosRestaurante += status.guestsCheckedIn || 0;
          }
        });
      }
    }

    // Dono da lista: +1 pessoa por guest list, check-in se dono presente
    guestListsRestaurante.forEach(gl => {
      totalConvidadosRestaurante += 1;
      if (checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1) {
        checkinConvidadosRestaurante += 1;
      }
    });

    const reservasSemLista = reservasRestaurante.filter(r => r.guest_list_id == null);
    reservasSemLista.forEach(r => {
      totalConvidadosRestaurante += 1;
      if (r.checked_in) checkinConvidadosRestaurante += 1;
    });

    return {
      total: totalConvidadosReservas + totalConvidadosRestaurante,
      checkins: checkinConvidadosReservas + checkinConvidadosRestaurante,
      numReservas: reservasMesa.length + reservasRestaurante.length
    };
  }, [convidadosReservas, convidadosReservasRestaurante, guestListsRestaurante, guestsByList, checkInStatus, reservasMesa, reservasRestaurante]);

  const promoterMetrics = useMemo(() => {
    const total = convidadosPromoters.length;
    const checkins = convidadosPromoters.filter((c) => c.status_checkin === 'Check-in').length;

    return {
      total,
      checkins
    };
  }, [convidadosPromoters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" style={{ touchAction: 'manipulation' }}>
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

              {/* Botões de ação rápida - Mobile */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPlanilhaModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MdDescription size={18} />
                  <span>Planilha</span>
                </button>
                <button
                  onClick={loadCheckInData}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium text-sm"
                >
                  <MdRefresh className={loading ? 'animate-spin' : ''} size={18} />
                </button>
              </div>

              {/* Estatísticas de pessoas - Apenas mobile */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 space-y-3">
                <h3 className="text-sm font-semibold text-white mb-3">Estatísticas de Pessoas</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Na Lista</div>
                    <div className="text-lg font-bold text-white">
                      {(() => {
                        const nomesUnicos = new Set<string>();
                        convidadosReservas.forEach(c => {
                          if (c.nome && c.nome.trim()) {
                            nomesUnicos.add(c.nome.trim().toLowerCase());
                          }
                        });
                        convidadosReservasRestaurante.forEach(c => {
                          if (c.nome && c.nome.trim()) {
                            nomesUnicos.add(c.nome.trim().toLowerCase());
                          }
                        });
                        Object.values(guestsByList).flat().forEach(g => {
                          const nome = (g.name || '').trim();
                          if (nome) {
                            nomesUnicos.add(nome.toLowerCase());
                          }
                        });
                        convidadosPromoters.forEach(c => {
                          if (c.nome && c.nome.trim()) {
                            nomesUnicos.add(c.nome.trim().toLowerCase());
                          }
                        });
                        return nomesUnicos.size;
                      })()}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Check-in</div>
                    <div className="text-lg font-bold text-green-400">
                      {(() => {
                        const nomesCheckin = new Set<string>();
                        convidadosReservas.forEach(c => {
                          if (c.nome && c.nome.trim() && c.status === 'CHECK-IN') {
                            nomesCheckin.add(c.nome.trim().toLowerCase());
                          }
                        });
                        convidadosReservasRestaurante.forEach(c => {
                          if (c.nome && c.nome.trim() && (c.status_checkin === 1 || c.status_checkin === true)) {
                            nomesCheckin.add(c.nome.trim().toLowerCase());
                          }
                        });
                        Object.values(guestsByList).flat().forEach(g => {
                          const nome = (g.name || '').trim();
                          if (nome && (g.checked_in === 1 || g.checked_in === true)) {
                            nomesCheckin.add(nome.toLowerCase());
                          }
                        });
                        convidadosPromoters.forEach(c => {
                          if (c.nome && c.nome.trim() && c.status_checkin === 'Check-in') {
                            nomesCheckin.add(c.nome.trim().toLowerCase());
                          }
                        });
                        return nomesCheckin.size;
                      })()}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Vão para Casa</div>
                    <div className="text-lg font-bold text-blue-400">
                      {(() => {
                        const nomesUnicos = new Set<string>();
                        const nomesCheckin = new Set<string>();
                        convidadosReservas.forEach(c => {
                          if (c.nome && c.nome.trim()) {
                            const nomeNorm = c.nome.trim().toLowerCase();
                            nomesUnicos.add(nomeNorm);
                            if (c.status === 'CHECK-IN') {
                              nomesCheckin.add(nomeNorm);
                            }
                          }
                        });
                        convidadosReservasRestaurante.forEach(c => {
                          if (c.nome && c.nome.trim()) {
                            const nomeNorm = c.nome.trim().toLowerCase();
                            nomesUnicos.add(nomeNorm);
                            if (c.status_checkin === 1 || c.status_checkin === true) {
                              nomesCheckin.add(nomeNorm);
                            }
                          }
                        });
                        Object.values(guestsByList).flat().forEach(g => {
                          const nome = (g.name || '').trim();
                          if (nome) {
                            const nomeNorm = nome.toLowerCase();
                            nomesUnicos.add(nomeNorm);
                            if (g.checked_in === 1 || g.checked_in === true) {
                              nomesCheckin.add(nomeNorm);
                            }
                          }
                        });
                        convidadosPromoters.forEach(c => {
                          if (c.nome && c.nome.trim()) {
                            const nomeNorm = c.nome.trim().toLowerCase();
                            nomesUnicos.add(nomeNorm);
                            if (c.status_checkin === 'Check-in') {
                              nomesCheckin.add(nomeNorm);
                            }
                          }
                        });
                        return nomesUnicos.size - nomesCheckin.size;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

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

              {/* Botões de ação */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPlanilhaModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm md:text-base"
                >
                  <MdDescription size={18} />
                  <span>Planilha</span>
                </button>
                <button
                  onClick={loadCheckInData}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold text-sm md:text-base"
                >
                  <MdRefresh className={loading ? 'animate-spin' : ''} size={18} />
                  <span>Atualizar</span>
                </button>
              </div>
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
              <div className="text-2xl font-bold text-white" style={{ fontVariantNumeric: 'normal' }}>
                {(() => {
                  const nomesUnicos = new Set<string>();
                  const nomesCheckin = new Set<string>();
                  convidadosReservas.forEach(c => {
                    if (c.nome && c.nome.trim()) {
                      const n = c.nome.trim().toLowerCase();
                      nomesUnicos.add(n);
                      if (c.status === 'CHECK-IN') nomesCheckin.add(n);
                    }
                  });
                  convidadosReservasRestaurante.forEach(c => {
                    if (c.nome && c.nome.trim()) {
                      const n = c.nome.trim().toLowerCase();
                      nomesUnicos.add(n);
                      if (c.status_checkin === 1 || c.status_checkin === true) nomesCheckin.add(n);
                    }
                  });
                  Object.values(guestsByList).flat().forEach(g => {
                    const nome = (g.name || '').trim();
                    if (nome) {
                      const n = nome.toLowerCase();
                      nomesUnicos.add(n);
                      if (g.checked_in === 1 || g.checked_in === true) nomesCheckin.add(n);
                    }
                  });
                  guestListsRestaurante.forEach(gl => {
                    const owner = (gl.owner_name || '').trim();
                    if (owner) {
                      const n = owner.toLowerCase();
                      nomesUnicos.add(n);
                      if (checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1) nomesCheckin.add(n);
                    }
                  });
                  convidadosPromoters.forEach(c => {
                    if (c.nome && c.nome.trim()) {
                      const n = c.nome.trim().toLowerCase();
                      nomesUnicos.add(n);
                      if (c.status_checkin === 'Check-in') nomesCheckin.add(n);
                    }
                  });
                  const camTotal = camarotes.reduce((s, c) => s + (c.total_convidados || 0), 0);
                  const camCheckin = camarotes.reduce((s, c) => s + (c.convidados_checkin || 0), 0);
                  const total = nomesUnicos.size + camTotal;
                  const checkins = nomesCheckin.size + camCheckin;
                  return `${checkins}/${total}`;
                })()}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {(() => {
                  const nomesUnicos = new Set<string>();
                  const nomesCheckin = new Set<string>();
                  convidadosReservas.forEach(c => {
                    if (c.nome && c.nome.trim()) {
                      const n = c.nome.trim().toLowerCase();
                      nomesUnicos.add(n);
                      if (c.status === 'CHECK-IN') nomesCheckin.add(n);
                    }
                  });
                  convidadosReservasRestaurante.forEach(c => {
                    if (c.nome && c.nome.trim()) {
                      const n = c.nome.trim().toLowerCase();
                      nomesUnicos.add(n);
                      if (c.status_checkin === 1 || c.status_checkin === true) nomesCheckin.add(n);
                    }
                  });
                  Object.values(guestsByList).flat().forEach(g => {
                    const nome = (g.name || '').trim();
                    if (nome) {
                      const n = nome.toLowerCase();
                      nomesUnicos.add(n);
                      if (g.checked_in === 1 || g.checked_in === true) nomesCheckin.add(n);
                    }
                  });
                  guestListsRestaurante.forEach(gl => {
                    const owner = (gl.owner_name || '').trim();
                    if (owner) {
                      const n = owner.toLowerCase();
                      nomesUnicos.add(n);
                      if (checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1) nomesCheckin.add(n);
                    }
                  });
                  convidadosPromoters.forEach(c => {
                    if (c.nome && c.nome.trim()) {
                      const n = c.nome.trim().toLowerCase();
                      nomesUnicos.add(n);
                      if (c.status_checkin === 'Check-in') nomesCheckin.add(n);
                    }
                  });
                  const camTotal = camarotes.reduce((s, c) => s + (c.total_convidados || 0), 0);
                  const camCheckin = camarotes.reduce((s, c) => s + (c.convidados_checkin || 0), 0);
                  const total = nomesUnicos.size + camTotal;
                  const checkins = nomesCheckin.size + camCheckin;
                  return total > 0 ? `${Math.round((checkins / total) * 100)}%` : '0%';
                })()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-4 border border-blue-500/50">
              <div className="text-sm text-gray-300 mb-1">Reservas</div>
              <div className="text-2xl font-bold text-white" style={{ fontVariantNumeric: 'normal' }}>
                {Number(reservasMetrics.checkins)}/{Number(reservasMetrics.total)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {reservasMetrics.numReservas} reserva{reservasMetrics.numReservas !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-4 border border-purple-500/50">
              <div className="text-sm text-gray-300 mb-1">Promoters</div>
              <div className="text-2xl font-bold text-white" style={{ fontVariantNumeric: 'normal' }}>
                {Number(promoterMetrics.checkins)}/{Number(promoterMetrics.total)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-4 border border-orange-500/50">
              <div className="text-sm text-gray-300 mb-1">Camarotes</div>
              <div className="text-2xl font-bold text-white" style={{ fontVariantNumeric: 'normal' }}>
                {(() => {
                  const checkins = Number(camarotes.reduce((sum, c) => sum + (c.convidados_checkin || 0), 0));
                  const total = Number(camarotes.reduce((sum, c) => sum + (c.total_convidados || 0), 0));
                  return `${checkins}/${total}`;
                })()}
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
              {searchTerm.trim() && resultadosCompletos.length > 0 && (
                <section className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-lg shadow-sm p-3 md:p-6 border border-blue-500/50">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h2 className="text-base md:text-xl font-bold text-white flex items-center gap-2">
                      <MdSearch size={18} className="md:w-6 md:h-6 text-blue-400" />
                      <span className="hidden md:inline">Resultados: "{searchTerm}" ({resultadosCompletos.length})</span>
                      <span className="md:hidden">Busca: {resultadosCompletos.length} resultado{resultadosCompletos.length !== 1 ? 's' : ''}</span>
                    </h2>
                  </div>
                  {/* Mobile/Tablet: Lista simples em linhas */}
                  <div className="md:hidden divide-y divide-white/10">
                    {resultadosBuscaUnificados.map(resultado => {
                      const isCheckedIn = resultado.status === 'CHECK-IN' || resultado.status === 'Check-in';
                      const isCheckedOut = resultado.status === 'CHECK-OUT' || resultado.status === 'Check-out';
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
                          {!isCheckedIn && !isCheckedOut && (
                            <button
                              onClick={() => {
                                if (resultado.tipo === 'reserva' && resultado.convidado) {
                                  handleConvidadoReservaCheckIn(resultado.convidado as ConvidadoReserva);
                                } else if (resultado.tipo === 'promoter' && resultado.convidado) {
                                  handleConvidadoPromoterCheckIn(resultado.convidado as ConvidadoPromoter);
                                } else if (resultado.tipo === 'restaurante') {
                                  // Verificar se é convidado de reserva ou reserva sem guest list
                                  if (resultado.convidado) {
                                    handleConvidadoReservaRestauranteCheckIn(resultado.convidado as ConvidadoReservaRestaurante);
                                  } else {
                                    // É uma reserva sem guest list - fazer check-in direto
                                    const reserva = reservasRestaurante.find(r => r.id === resultado.id);
                                    if (reserva) {
                                      handleReservaRestauranteCheckIn(reserva);
                                    }
                                  }
                                } else if (resultado.tipo === 'guest_list' && resultado.guestListId) {
                                  handleGuestCheckIn(resultado.guestListId, resultado.id, resultado.nome);
                                }
                              }}
                              className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors touch-manipulation font-medium flex-shrink-0"
                            >
                              Check-in
                            </button>
                          )}
                          {isCheckedIn && !isCheckedOut && resultado.tipo === 'guest_list' && resultado.guestListId && (
                            <button
                              onClick={() => {
                                handleGuestCheckOut(resultado.guestListId!, resultado.id, resultado.nome);
                              }}
                              className="px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors touch-manipulation font-medium flex-shrink-0"
                              title="Registrar saída do convidado"
                            >
                              Check-out
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
                      const isCheckedOut = resultado.status === 'CHECK-OUT' || resultado.status === 'Check-out';
                      const getBorderClass = () => {
                        if (isCheckedOut) return 'bg-gray-900/30 border-gray-500/50';
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
                          initial={isMobile ? false : { opacity: 0, y: 20 }}
                          animate={isMobile ? false : { opacity: 1, y: 0 }}
                          transition={isMobile ? undefined : { duration: 0.2 }}
                          className={`border rounded-lg p-3 ${getBorderClass()} ${isCheckedOut ? 'opacity-60' : ''}`}
                          style={{ touchAction: 'manipulation' }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-bold text-base truncate ${isCheckedOut ? 'text-gray-400 line-through' : 'text-white'}`}>
                                {resultado.nome}
                              </h3>
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
                            {isCheckedOut && (
                              <MdClose size={24} className="text-gray-400 flex-shrink-0 ml-2" />
                            )}
                            {isCheckedIn && !isCheckedOut && (
                              <MdCheckCircle size={24} className="text-green-400 flex-shrink-0 ml-2" />
                            )}
                          </div>

                          {!isCheckedIn && !isCheckedOut ? (
                            <button
                              onClick={() => {
                                if (resultado.tipo === 'reserva' && resultado.convidado) {
                                  handleConvidadoReservaCheckIn(resultado.convidado as ConvidadoReserva);
                                } else if (resultado.tipo === 'promoter' && resultado.convidado) {
                                  handleConvidadoPromoterCheckIn(resultado.convidado as ConvidadoPromoter);
                                } else if (resultado.tipo === 'restaurante') {
                                  // Verificar se é convidado de reserva ou reserva sem guest list
                                  if (resultado.convidado) {
                                    handleConvidadoReservaRestauranteCheckIn(resultado.convidado as ConvidadoReservaRestaurante);
                                  } else {
                                    // É uma reserva sem guest list - fazer check-in direto
                                    const reserva = reservasRestaurante.find(r => r.id === resultado.id);
                                    if (reserva) {
                                      handleReservaRestauranteCheckIn(reserva);
                                    }
                                  }
                                } else if (resultado.tipo === 'guest_list' && resultado.guestListId) {
                                  handleGuestCheckIn(resultado.guestListId, resultado.id, resultado.nome);
                                }
                              }}
                              className={`w-full ${getButtonClass()} text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm touch-manipulation`}
                            >
                              <MdCheckCircle size={16} />
                              Check-in
                            </button>
                          ) : isCheckedIn && !isCheckedOut && resultado.tipo === 'guest_list' && resultado.guestListId ? (
                            <div className="space-y-2">
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
                              <button
                                onClick={() => {
                                  handleGuestCheckOut(resultado.guestListId!, resultado.id, resultado.nome);
                                }}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm touch-manipulation"
                                title="Registrar saída do convidado"
                              >
                                <MdClose size={16} />
                                Check-out
                              </button>
                            </div>
                          ) : (
                            <div className="text-center space-y-1">
                              {isCheckedOut ? (
                                <>
                                  <div className="text-xs text-gray-400 font-medium">
                                    🚪 Saída
                                  </div>
                                  {/* Exibir horários de entrada e saída lado a lado */}
                                  {(resultado.data_checkin || resultado.data_checkout) && (
                                    <div className="text-xs text-gray-500 font-mono">
                                      {resultado.data_checkin && `E: ${new Date(resultado.data_checkin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                      {resultado.data_checkin && resultado.data_checkout && ' | '}
                                      {resultado.data_checkout && `S: ${new Date(resultado.data_checkout).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="text-xs text-green-400 font-medium">
                                    ✅ Presente
                                  </div>
                                  {/* Exibir horário de entrada quando presente */}
                                  {resultado.data_checkin && (
                                    <div className="text-xs text-gray-500 font-mono">
                                      E: {new Date(resultado.data_checkin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  )}
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
                                </>
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
              {searchTerm.trim() && resultadosCompletos.length === 0 && !loadingReservasAdicionais && (
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
                          initial={false}
                          animate={false}
                          style={{ touchAction: 'manipulation' }}
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
                        .filter(gl => {
                          // Se a reserva está concluída, verificar se há nova reserva para a mesma mesa
                          const isConcluida = gl.owner_checked_out === 1 || checkInStatus[gl.guest_list_id]?.ownerCheckedOut;
                          
                          if (isConcluida) {
                            // Verificar se há uma nova reserva (não concluída) para a mesma mesa no mesmo horário
                            const hasNovaReserva = sortedGuestListsRestaurante.some(otherGl => 
                              otherGl.guest_list_id !== gl.guest_list_id &&
                              otherGl.table_number === gl.table_number &&
                              otherGl.reservation_time === gl.reservation_time &&
                              otherGl.owner_checked_out !== 1 &&
                              !checkInStatus[otherGl.guest_list_id]?.ownerCheckedOut
                            );
                            
                            // Se há nova reserva, não mostrar a concluída
                            return !hasNovaReserva;
                          }
                          
                          return true;
                        })
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
                                      
                                      // Carregar convidados
                                      const guestsRes = await fetch(`${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/guests`, { 
                                        headers: { Authorization: `Bearer ${token}` } 
                                      });
                                      
                                      let guestsData: { guests: GuestItem[] } | null = null;
                                      if (guestsRes.ok) {
                                        guestsData = await guestsRes.json();
                                        
                                        if (guestsData && guestsData.guests) {
                                          // Ordenar convidados alfabeticamente por nome
                                          const sortedGuests = [...(guestsData.guests || [])].sort((a, b) => 
                                            (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
                                          );
                                          setGuestsByList(prev => ({ ...prev, [gl.guest_list_id]: sortedGuests }));
                                          // Atualizar totalGuests no checkInStatus quando guests forem carregados
                                          setCheckInStatus(prev => ({
                                            ...prev,
                                            [gl.guest_list_id]: {
                                              ...prev[gl.guest_list_id],
                                              totalGuests: sortedGuests.length
                                            }
                                          }));
                                        } else {
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
                                        // Se guests já foram carregados, usar contagem real, senão usar do checkin_status
                                        const currentGuests = guestsByList[gl.guest_list_id] || [];
                                        const totalGuestsToUse = currentGuests.length > 0 
                                          ? currentGuests.length 
                                          : (checkinData.checkin_status?.total_guests || 0);
                                        setCheckInStatus(prev => ({
                                          ...prev,
                                          [gl.guest_list_id]: {
                                            ownerCheckedIn: checkinData.checkin_status.owner_checked_in || false,
                                            guestsCheckedIn: checkinData.checkin_status.guests_checked_in || 0,
                                            totalGuests: totalGuestsToUse
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
                                      // Definir como array vazio em caso de erro para evitar loops
                                      setGuestsByList(prev => ({ ...prev, [gl.guest_list_id]: [] }));
                                    }
                                  }
                                }
                              }}
                              className={`w-full text-left px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between cursor-pointer ${
                                (checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1)
                                  ? 'bg-white/2 hover:bg-white/5 opacity-60'
                                  : 'bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-semibold text-sm md:text-base truncate ${
                                    (checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1)
                                      ? 'text-gray-400 line-through'
                                      : 'text-white'
                                  }`}>
                                    {gl.owner_name}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                                    gl.reservation_type === 'large' 
                                      ? 'bg-orange-100 text-orange-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    Reserva Normal
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs md:text-sm text-gray-300">
                                      {(() => {
                                        const dateStr = gl.reservation_date;
                                        if (!dateStr) return 'Data não informada';
                                        
                                        try {
                                          const datePart = dateStr.split('T')[0] || dateStr.split(' ')[0];
                                          if (datePart && datePart.length === 10) {
                                            const d = new Date(`${datePart}T12:00:00`);
                                            if (isNaN(d.getTime())) {
                                              return 'Data inválida';
                                            }
                                            return d.toLocaleDateString('pt-BR');
                                          }
                                          const d2 = new Date(dateStr);
                                          if (isNaN(d2.getTime())) {
                                            return 'Data inválida';
                                          }
                                          return d2.toLocaleDateString('pt-BR');
                                        } catch {
                                          return 'Data inválida';
                                        }
                                      })()}
                                      {gl.event_type ? ` • ${gl.event_type}` : ''} • {gl.reservation_time}
                                    </div>
                                    {/* Exibir observação abaixo da data */}
                                    {(() => {
                                      // Buscar observação da reserva (pode estar em notes ou admin_notes)
                                      const notes = (gl as any).notes || (gl as any).admin_notes || '';
                                      if (notes && notes.trim()) {
                                        // Pegar primeira linha ou até 100 caracteres
                                        const firstLine = notes.trim().split('\n')[0];
                                        const displayText = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
                                        return (
                                          <div className="mt-1.5 text-xs text-gray-400 italic break-words">
                                            📝 {displayText}
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    {/* Botão de Detalhes - apenas para aniversários */}
                                    {gl.event_type === 'aniversario' && (() => {
                                      // Tentar encontrar a reserva de aniversário de várias formas
                                      let birthdayReservation: BirthdayReservation | undefined = birthdayReservationsByReservationId[gl.reservation_id];
                                      
                                      // Se não encontrou pelo reservation_id, tentar buscar pela guest list
                                      if (!birthdayReservation) {
                                        const allBirthdayReservations = Object.values(birthdayReservationsByReservationId);
                                        birthdayReservation = allBirthdayReservations.find((br: any) => {
                                          const nameMatch = gl.owner_name && br.aniversariante_nome && (
                                            gl.owner_name.toLowerCase().includes(br.aniversariante_nome.toLowerCase()) ||
                                            br.aniversariante_nome.toLowerCase().includes(gl.owner_name.toLowerCase())
                                          );
                                          const brDate = br.data_aniversario ? br.data_aniversario.split('T')[0] : null;
                                          const glDate = gl.reservation_date ? gl.reservation_date.split('T')[0] : null;
                                          const dateMatch = brDate === glDate;
                                          const idMatch = br.restaurant_reservation_id && Number(br.restaurant_reservation_id) === gl.reservation_id;
                                          return idMatch || (nameMatch && dateMatch);
                                        }) as BirthdayReservation | undefined;
                                      }
                                      
                                      if (!birthdayReservation) {
                                        return null;
                                      }
                                      
                                      return (
                                        <div className="flex items-center gap-2 mb-1">
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setSelectedBirthdayReservation(birthdayReservation);
                                              setBirthdayModalOpen(true);
                                            }}
                                            className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-1"
                                          >
                                            <MdEvent size={14} />
                                            Detalhes
                                          </button>
                                        </div>
                                      );
                                    })()}
                                    <div
                                      className="rounded-full bg-white/10 px-2 md:px-3 py-1 text-xs md:text-sm font-semibold text-amber-200"
                                    >
                                      {(() => {
                                        // Verificar se há múltiplas mesas (separadas por vírgula)
                                        const tableNumberStr = String(gl.table_number || '');
                                        const hasMultipleTables = tableNumberStr.includes(',');
                                        
                                        if (hasMultipleTables) {
                                          const tablesArray = tableNumberStr.split(',').map(t => t.trim()).filter(t => t);
                                          return (
                                            <>
                                              Mesa{ tablesArray.length > 1 ? 's' : '' }: <span className="text-white">
                                                {tablesArray.map((t, idx) => (
                                                  <span key={idx}>
                                                    {idx > 0 && ', '}Mesa {t}
                                                  </span>
                                                ))}
                                              </span>
                                            </>
                                          );
                                        }
                                        
                                        return (
                                          <>
                                            Mesa: <span className="text-white">
                                              {(() => {
                                                // Função helper para mapear mesa -> área do Seu Justino
                                                const getSeuJustinoAreaName = (tableNumber?: string | number, areaName?: string): string => {
                                                  if (!tableNumber && !areaName) return areaName || '—';
                                                  
                                                  const tableNum = String(tableNumber || '').trim();
                                                  const seuJustinoSubareas = [
                                                    { key: 'lounge-aquario-spaten', label: 'Lounge Aquario Spaten', tableNumbers: ['210'] },
                                                    { key: 'lounge-aquario-tv', label: 'Lounge Aquario TV', tableNumbers: ['208'] },
                                                    { key: 'lounge-palco', label: 'Lounge Palco', tableNumbers: ['204','206'] },
                                                    { key: 'lounge-bar', label: 'Lounge Bar', tableNumbers: ['200','202'] },
                                                    { key: 'quintal-lateral-esquerdo', label: 'Quintal Lateral Esquerdo', tableNumbers: ['20','22','24','26','28','29'] },
                                                    { key: 'quintal-central-esquerdo', label: 'Quintal Central Esquerdo', tableNumbers: ['30','32','34','36','38','39'] },
                                                    { key: 'quintal-central-direito', label: 'Quintal Central Direito', tableNumbers: ['40','42','44','46','48'] },
                                                    { key: 'quintal-lateral-direito', label: 'Quintal Lateral Direito', tableNumbers: ['50','52','54','56','58','60','62','64'] },
                                                  ];
                                                  
                                                  if (tableNum) {
                                                    const tableNumbers = tableNum.includes(',') ? tableNum.split(',').map(t => t.trim()) : [tableNum];
                                                    for (const tn of tableNumbers) {
                                                      const subarea = seuJustinoSubareas.find(sub => sub.tableNumbers.includes(tn));
                                                      if (subarea) return subarea.label;
                                                    }
                                                  }
                                                  
                                                  if (areaName && !areaName.toLowerCase().includes('área coberta') && !areaName.toLowerCase().includes('área descoberta')) {
                                                    return areaName;
                                                  }
                                                  
                                                  return areaName || '—';
                                                };
                                                
                                                // Sempre mostrar número da mesa, não o nome da área
                                                return gl.table_number ? `Mesa ${gl.table_number}` : gl.area_name || '—';
                                              })()}
                                            </span>
                                          </>
                                        );
                                      })()}
                                    </div>
                                    {/* Valor Total da Reserva de Aniversário - acima da mensagem do brinde */}
                                    {gl.event_type === 'aniversario' && (() => {
                                      // Tentar encontrar a reserva de aniversário de várias formas
                                      let birthdayReservation: BirthdayReservation | undefined = birthdayReservationsByReservationId[gl.reservation_id];
                                      
                                      // Se não encontrou pelo reservation_id, tentar buscar pela guest list
                                      if (!birthdayReservation) {
                                        // Buscar diretamente nas reservas de aniversário já carregadas
                                        const allBirthdayReservations = Object.values(birthdayReservationsByReservationId);
                                        birthdayReservation = allBirthdayReservations.find((br: any) => {
                                          // Tentar encontrar por nome do dono da lista
                                          const nameMatch = gl.owner_name && br.aniversariante_nome && (
                                            gl.owner_name.toLowerCase().includes(br.aniversariante_nome.toLowerCase()) ||
                                            br.aniversariante_nome.toLowerCase().includes(gl.owner_name.toLowerCase())
                                          );
                                          
                                          // Tentar encontrar por data
                                          const brDate = br.data_aniversario ? br.data_aniversario.split('T')[0] : null;
                                          const glDate = gl.reservation_date ? gl.reservation_date.split('T')[0] : null;
                                          const dateMatch = brDate === glDate;
                                          
                                          // Tentar encontrar por restaurant_reservation_id
                                          const idMatch = br.restaurant_reservation_id && Number(br.restaurant_reservation_id) === gl.reservation_id;
                                          
                                          return idMatch || (nameMatch && dateMatch);
                                        }) as BirthdayReservation | undefined;
                                      }
                                      
                                      if (!birthdayReservation) {
                                        console.log('⚠️ [check-ins] Reserva de aniversário não encontrada para guest list:', {
                                          guestListId: gl.guest_list_id,
                                          reservationId: gl.reservation_id,
                                          ownerName: gl.owner_name,
                                          eventType: gl.event_type,
                                          disponiveis: Object.keys(birthdayReservationsByReservationId).length
                                        });
                                        return null;
                                      }
                                      
                                      const menuItems = menuItemsByBirthdayReservation[birthdayReservation.id] || { bebidas: [], comidas: [] };
                                      
                                      console.log('💰 [check-ins] Calculando valor total para reserva:', {
                                        birthdayReservationId: birthdayReservation.id,
                                        nome: birthdayReservation.aniversariante_nome,
                                        menuItemsBebidas: menuItems.bebidas.length,
                                        menuItemsComidas: menuItems.comidas.length,
                                        decoracao: birthdayReservation.decoracao_tipo
                                      });
                                      
                                      // Calcular valor total com preços reais do cardápio
                                      const decorationPrices: Record<string, number> = {
                                        'Decoração Pequena 1': 200.0,
                                        'Decoração Pequena 2': 220.0,
                                        'Decoração Media 3': 250.0,
                                        'Decoração Media 4': 270.0,
                                        'Decoração Grande 5': 300.0,
                                        'Decoração Grande 6': 320.0,
                                      };
                                      
                                      let total = 0;
                                      
                                      // Valor da decoração
                                      if (birthdayReservation.decoracao_tipo) {
                                        total += decorationPrices[birthdayReservation.decoracao_tipo] || 0;
                                      }
                                      
                                      // Valor das bebidas do bar (com preços reais do cardápio)
                                      menuItems.bebidas.forEach(item => {
                                        total += item.preco * item.quantidade;
                                      });

                                      // Valor das porções do bar (com preços reais do cardápio)
                                      menuItems.comidas.forEach(item => {
                                        total += item.preco * item.quantidade;
                                      });
                                      
                                      // Valor das bebidas especiais
                                      const bebidasEspeciaisMap: Record<string, { nome: string; preco: number }> = {
                                        'bebida_balde_budweiser': { nome: 'Balde Budweiser', preco: 50.0 },
                                        'bebida_balde_corona': { nome: 'Balde Corona', preco: 55.0 },
                                        'bebida_balde_heineken': { nome: 'Balde Heineken', preco: 60.0 },
                                        'bebida_combo_gin_142': { nome: 'Combo Gin 142', preco: 80.0 },
                                        'bebida_licor_rufus': { nome: 'Licor Rufus', preco: 45.0 },
                                      };
                                      
                                      Object.entries(bebidasEspeciaisMap).forEach(([campo, info]) => {
                                        const qtd = (birthdayReservation as any)[campo] || 0;
                                        if (qtd > 0) {
                                          total += info.preco * qtd;
                                        }
                                      });
                                      
                                      console.log('💰 [check-ins] Valor total calculado:', total);
                                      
                                      if (total > 0) {
                                        return (
                                          <div className="rounded-full bg-gradient-to-r from-orange-500/90 to-red-500/90 px-3 py-1.5 text-xs md:text-sm font-bold text-white shadow-lg" title="Valor total da reserva. Será adicionado à comanda no estabelecimento.">
                                            💰 Total: R$ {total.toFixed(2)}
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
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
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {!(checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1) && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleOwnerCheckIn(gl.guest_list_id, gl.owner_name, e);
                                        }}
                                        className="px-2 md:px-3 py-1 text-xs rounded-full transition-colors font-medium touch-manipulation bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300"
                                      >
                                        📋 Check-in Dono
                                      </button>
                                    )}
                                    {(checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1) && !(checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1) && (
                                      <div className="flex flex-col gap-1">
                                        <div className="flex gap-2">
                                          <button
                                            className="px-2 md:px-3 py-1 text-xs rounded-full transition-colors font-medium touch-manipulation bg-green-100 text-green-700 border border-green-300"
                                            disabled
                                          >
                                            ✅ Dono Presente
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleOwnerCheckOut(gl.guest_list_id, gl.owner_name, e);
                                            }}
                                            className="px-2 md:px-3 py-1 text-xs rounded-full transition-colors font-medium touch-manipulation bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300"
                                            title="Registrar saída do dono"
                                          >
                                            🚪 Check-out Dono
                                          </button>
                                        </div>
                                        {/* Exibir horário de entrada quando presente */}
                                        {(() => {
                                          const checkinTime = gl.owner_checkin_time || ownerCheckInTimeMap[gl.guest_list_id];
                                          if (checkinTime) {
                                            return (
                                              <span className="text-xs text-gray-400 font-mono px-2">
                                                E: {new Date(checkinTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    )}
                                    {(checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1) && (
                                      <div className="flex flex-col gap-1">
                                        <span className="px-2 md:px-3 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-300">
                                          ✅ Concluído
                                        </span>
                                        {/* Exibir horários de entrada e saída lado a lado */}
                                        {(() => {
                                          const checkinTime = gl.owner_checkin_time || ownerCheckInTimeMap[gl.guest_list_id];
                                          const checkoutTime = gl.owner_checkout_time || ownerCheckOutTimeMap[gl.guest_list_id];
                                          const formatTime = (timeStr: string | undefined) => {
                                            if (!timeStr) return '';
                                            return new Date(timeStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                          };
                                          
                                          if (checkinTime || checkoutTime) {
                                            return (
                                              <span className="text-xs text-gray-400 font-mono px-2">
                                                {checkinTime && `E: ${formatTime(checkinTime)}`}
                                                {checkinTime && checkoutTime && ' | '}
                                                {checkoutTime && `S: ${formatTime(checkoutTime)}`}
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Indicadores de Progresso e Brindes */}
                                  {(() => {
                                    const guestsCheckedIn = checkInStatus[gl.guest_list_id]?.guestsCheckedIn || 0;
                                    // CORREÇÃO: Usar contagem real de guests carregados, não total_guests
                                    const totalGuests = (guestsByList[gl.guest_list_id] || []).length || 0;
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
                                        Dono: {(checkInStatus[gl.guest_list_id]?.ownerCheckedIn || gl.owner_checked_in === 1)
                                          ? `✅ Presente${(gl.owner_checkin_time || ownerCheckInTimeMap[gl.guest_list_id]) ? ` ${new Date(gl.owner_checkin_time || ownerCheckInTimeMap[gl.guest_list_id]!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}`
                                          : '⏳ Aguardando'}
                                      </span>
                                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                                        Convidados: {checkInStatus[gl.guest_list_id]?.guestsCheckedIn || 0} / {(guestsByList[gl.guest_list_id] || []).length || 0}
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
                                            const isCheckedOut = g.checked_out === 1 || g.checked_out === true;
                                            const hasCheckoutTime = !!g.checkout_time;
                                            const hasCheckinTime = !!g.checkin_time;
                                            
                                            // Formatar horários de entrada e saída
                                            const formatTime = (timeStr: string | undefined) => {
                                              if (!timeStr) return '';
                                              return new Date(timeStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                            };
                                            
                                            const checkinTimeFormatted = hasCheckinTime ? formatTime(g.checkin_time) : '';
                                            const checkoutTimeFormatted = hasCheckoutTime ? formatTime(g.checkout_time) : '';
                                            
                                            return (
                                              <tr 
                                                key={g.id} 
                                                className={`hover:bg-white/10 ${
                                                  (checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1) || isCheckedOut
                                                    ? 'opacity-60'
                                                    : ''
                                                }`}
                                              >
                                                <td className={`px-4 py-2 text-sm ${
                                                  (checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1) || isCheckedOut
                                                    ? 'text-gray-400 line-through'
                                                    : 'text-white'
                                                }`}>
                                                  {g.name}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-300">{g.whatsapp || '-'}</td>
                                                <td className="px-4 py-2 text-sm">
                                                  {(() => {
                                                    // Verificar se o dono já fez check-out
                                                    const ownerCheckedOut = checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1;
                                                    
                                                    // Se o dono fez check-out ou o convidado fez check-out, mostrar como concluído
                                                    if (ownerCheckedOut || isCheckedOut) {
                                                      return (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300 whitespace-nowrap">
                                                            ✅ Concluído
                                                          </span>
                                                          {/* Exibir horários de entrada e saída lado a lado */}
                                                          {(hasCheckinTime || hasCheckoutTime) && (
                                                            <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
                                                              {hasCheckinTime && `E: ${checkinTimeFormatted}`}
                                                              {hasCheckinTime && hasCheckoutTime && ' | '}
                                                              {hasCheckoutTime && `S: ${checkoutTimeFormatted}`}
                                                            </span>
                                                          )}
                                                        </div>
                                                      );
                                                    }
                                                    
                                                    // Status normal quando dono não fez check-out
                                                    return (
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                                          isCheckedIn
                                                            ? 'bg-green-100 text-green-700 border border-green-300'
                                                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                                                        }`}>
                                                          {isCheckedIn ? '✅ Presente' : '⏳ Aguardando'}
                                                        </span>
                                                        {/* Exibir horário de entrada quando presente */}
                                                        {hasCheckinTime && (
                                                          <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
                                                            E: {checkinTimeFormatted}
                                                          </span>
                                                        )}
                                                        {isCheckedIn && g.entrada_tipo && (
                                                          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
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
                                                          </span>
                                                        )}
                                                      </div>
                                                    );
                                                  })()}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                  {(() => {
                                                    // Verificar se o dono já fez check-out - se sim, bloquear todos os botões
                                                    const ownerCheckedOut = checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1;
                                                    
                                                    // Se o dono fez check-out ou o convidado fez check-out, não mostrar botões
                                                    if (ownerCheckedOut || isCheckedOut) {
                                                      return null;
                                                    }
                                                    
                                                    return (
                                                      <div className="flex gap-2 justify-end">
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
                                                        {isCheckedIn && (
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.preventDefault();
                                                              e.stopPropagation();
                                                              handleGuestCheckOut(gl.guest_list_id, g.id, g.name);
                                                            }}
                                                            className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded border border-orange-300"
                                                            title="Registrar saída do convidado"
                                                          >
                                                            🚪 Check-out
                                                          </button>
                                                        )}
                                                      </div>
                                                    );
                                                  })()}
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
                                        const isCheckedOut = g.checked_out === 1 || g.checked_out === true;
                                        const hasCheckoutTime = !!g.checkout_time;
                                        const hasCheckinTime = !!g.checkin_time;
                                        
                                        // Formatar horários de entrada e saída
                                        const formatTime = (timeStr: string | undefined) => {
                                          if (!timeStr) return '';
                                          return new Date(timeStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                        };
                                        
                                        const checkinTimeFormatted = hasCheckinTime ? formatTime(g.checkin_time) : '';
                                        const checkoutTimeFormatted = hasCheckoutTime ? formatTime(g.checkout_time) : '';
                                        
                                        return (
                                          <div 
                                            key={g.id} 
                                            className={`flex items-center justify-between gap-2 px-3 py-2 ${
                                              (() => {
                                                const ownerCheckedOut = checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1;
                                                return ownerCheckedOut || isCheckedOut 
                                                  ? 'opacity-60 bg-gray-900/10' 
                                                  : isCheckedIn 
                                                  ? 'bg-green-900/10' 
                                                  : 'hover:bg-white/5';
                                              })()
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              {(() => {
                                                const ownerCheckedOut = checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1;
                                                if (ownerCheckedOut || isCheckedOut) {
                                                  return <MdClose size={18} className="text-gray-400 flex-shrink-0" />;
                                                } else if (isCheckedIn) {
                                                  return <MdCheckCircle size={18} className="text-green-400 flex-shrink-0" />;
                                                } else {
                                                  return <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex-shrink-0" />;
                                                }
                                              })()}
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className={`font-medium text-sm truncate ${
                                                    (() => {
                                                      const ownerCheckedOut = checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1;
                                                      return ownerCheckedOut || isCheckedOut ? 'text-gray-400 line-through' : 'text-white';
                                                    })()
                                                  }`}>
                                                    {g.name}
                                                  </span>
                                                  {(() => {
                                                    const ownerCheckedOut = checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1;
                                                    if (ownerCheckedOut || isCheckedOut) {
                                                      return (
                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500/30 text-gray-200">
                                                          ✅ Concluído
                                                        </span>
                                                      );
                                                    } else if (g.entrada_tipo && isCheckedIn) {
                                                      return (
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                          g.entrada_tipo === 'VIP'
                                                            ? 'bg-green-500/30 text-green-200'
                                                            : g.entrada_tipo === 'SECO'
                                                            ? 'bg-blue-500/30 text-blue-200'
                                                            : 'bg-purple-500/30 text-purple-200'
                                                        }`}>
                                                          {g.entrada_tipo}
                                                        </span>
                                                      );
                                                    }
                                                    return null;
                                                  })()}
                                                </div>
                                                {/* Exibir horários de entrada e saída lado a lado */}
                                                {(hasCheckinTime || hasCheckoutTime) && (
                                                  <div className="text-xs text-gray-400 font-mono mt-0.5">
                                                    {hasCheckinTime && `E: ${checkinTimeFormatted}`}
                                                    {hasCheckinTime && hasCheckoutTime && ' | '}
                                                    {hasCheckoutTime && `S: ${checkoutTimeFormatted}`}
                                                  </div>
                                                )}
                                                {g.whatsapp && (
                                                  <div className="text-xs text-gray-400 truncate mt-0.5">
                                                    {g.whatsapp}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            {(() => {
                                              // Verificar se o dono já fez check-out - se sim, bloquear todos os botões
                                              const ownerCheckedOut = checkInStatus[gl.guest_list_id]?.ownerCheckedOut || gl.owner_checked_out === 1;
                                              
                                              // Se o dono fez check-out ou o convidado fez check-out, não mostrar botões
                                              if (ownerCheckedOut || isCheckedOut) {
                                                return null;
                                              }
                                              
                                              return (
                                                <div className="flex gap-2">
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
                                                  {isCheckedIn && (
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleGuestCheckOut(gl.guest_list_id, g.id, g.name);
                                                      }}
                                                      className="px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg touch-manipulation font-medium flex-shrink-0"
                                                      title="Registrar saída do convidado"
                                                    >
                                                      Check-out
                                                    </button>
                                                  )}
                                                </div>
                                              );
                                            })()}
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
                            initial={isMobile ? false : { opacity: 0, y: 20 }}
                            animate={isMobile ? false : { opacity: 1, y: 0 }}
                            transition={isMobile ? undefined : { duration: 0.2 }}
                            style={{ touchAction: 'manipulation' }}
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
                          }}
                          className="w-full pl-9 md:pl-10 pr-9 md:pr-10 py-2.5 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                        />
                        {promoterGuestsSearch && (
                          <button
                            onClick={() => {
                              setPromoterGuestsSearch('');
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleConvidadoPromoterCheckIn(convidado);
                                }}
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
                            initial={isMobile ? false : { opacity: 0, y: 20 }}
                            animate={isMobile ? false : { opacity: 1, y: 0 }}
                            transition={isMobile ? undefined : { duration: 0.2 }}
                            style={{ touchAction: 'manipulation' }}
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleConvidadoPromoterCheckIn(convidado);
                                }}
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
                            initial={false}
                            animate={false}
                            style={{ touchAction: 'manipulation' }}
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleConvidadoPromoterCheckIn(convidado);
                                }}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 touch-manipulation"
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
                        initial={isMobile ? false : { opacity: 0, y: 20 }}
                        animate={isMobile ? false : { opacity: 1, y: 0 }}
                        transition={isMobile ? undefined : { duration: 0.2 }}
                        style={{ touchAction: 'manipulation' }}
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
                            onClick={(e) => handleCamaroteCheckIn(camarote, e)}
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
                          initial={false}
                          animate={false}
                          style={{ touchAction: 'manipulation' }}
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

        {/* Modal de Detalhes do Aniversário */}
        <BirthdayDetailsModal
          reservation={selectedBirthdayReservation}
          isOpen={birthdayModalOpen}
          onClose={() => {
            setBirthdayModalOpen(false);
            setSelectedBirthdayReservation(null);
          }}
        />

        {/* Modal de Planilha */}
        {planilhaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-[95vw] lg:max-w-6xl max-h-[95vh] flex flex-col border border-gray-700">
              {/* Header do Modal */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <MdDescription size={20} className="sm:w-6 sm:h-6" />
                  <span className="hidden sm:inline">Planilha de Reservas - Áreas e Mesas</span>
                  <span className="sm:hidden">Planilha</span>
                </h2>
                <button
                  onClick={() => setPlanilhaModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <MdClose size={20} className="sm:w-6 sm:h-6 text-gray-400" />
                </button>
              </div>

              {/* Conteúdo da Planilha */}
              <div className="flex-1 overflow-auto p-2 sm:p-4 bg-white">
                {planilhaLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    <p className="ml-3 text-gray-700">Carregando reservas...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Filtros superiores (globais) */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 sm:gap-4 mb-4">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
                        <div className="flex-1 sm:flex-none">
                          <label className="block text-xs sm:text-sm text-gray-600 mb-1 font-medium">Data</label>
                          <input
                            type="date"
                            value={sheetFilters.date || ''}
                            onChange={(e) => setSheetFilters(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs sm:text-sm text-gray-600 mb-1 font-medium">Buscar</label>
                          <input
                            type="text"
                            placeholder="Nome, telefone, evento..."
                            value={sheetFilters.search || ''}
                            onChange={(e) => setSheetFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            const dataEvento = evento?.data_evento?.split('T')[0] || evento?.data_evento || '';
                            setSheetFilters({ date: dataEvento });
                          }}
                          className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                        >
                          Resetar
                        </button>
                        <button
                          type="button"
                          onClick={handleExportPlanilhaExcel}
                          className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-1.5"
                        >
                          <MdDownload size={16} />
                          Baixar Excel
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const establishmentName = (evento?.establishment_name || '').toLowerCase();
                      const isSeuJustinoPlanilha = (establishmentName.includes('seu justino') && !establishmentName.includes('pracinha')) || evento?.establishment_id === 1;
                      const isPracinhaJustinoPlanilha = establishmentName.includes('pracinha') && establishmentName.includes('seu justino');

                      // Highline: mesma fórmula — subáreas com tableNumbers; sections Deck, Bar, Rooftop
                      const highlineSubareas = [
                        { key: 'deck-frente', area_id: 2, label: 'Área Deck - Frente', tableNumbers: ['05','06','07','08'] },
                        { key: 'deck-esquerdo', area_id: 2, label: 'Área Deck - Esquerdo', tableNumbers: ['01','02','03','04'] },
                        { key: 'deck-direito', area_id: 2, label: 'Área Deck - Direito', tableNumbers: ['09','10','11','12'] },
                        { key: 'bar', area_id: 2, label: 'Área Bar', tableNumbers: ['15','16','17'] },
                        { key: 'roof-direito', area_id: 5, label: 'Área Rooftop - Direito', tableNumbers: ['50','51','52','53','54','55'] },
                        { key: 'roof-bistro', area_id: 5, label: 'Área Rooftop - Bistrô', tableNumbers: ['70','71','72','73'] },
                        { key: 'roof-centro', area_id: 5, label: 'Área Rooftop - Centro', tableNumbers: ['44','45','46','47'] },
                        { key: 'roof-esquerdo', area_id: 5, label: 'Área Rooftop - Esquerdo', tableNumbers: ['60','61','62','63','64','65'] },
                        { key: 'roof-vista', area_id: 5, label: 'Área Rooftop - Vista', tableNumbers: ['40','41','42'] },
                      ];

                      // Seu Justino: mesma fórmula do Highline — subáreas + sections Lounge, Quintal (sem "other")
                      const seuJustinoSubareas = [
                        { key: 'lounge-aquario-spaten', area_id: 1, label: 'Lounge Aquario Spaten', tableNumbers: ['210'] },
                        { key: 'lounge-aquario-tv', area_id: 1, label: 'Lounge Aquario TV', tableNumbers: ['208'] },
                        { key: 'lounge-palco', area_id: 1, label: 'Lounge Palco', tableNumbers: ['204','206'] },
                        { key: 'lounge-bar', area_id: 1, label: 'Lounges Bar', tableNumbers: ['200','202'] },
                        { key: 'quintal-lateral-esquerdo', area_id: 2, label: 'Quintal Lateral Esquerdo', tableNumbers: ['20','22','24','26','28','29'] },
                        { key: 'quintal-central-esquerdo', area_id: 2, label: 'Quintal Central Esquerdo', tableNumbers: ['30','32','34','36','38','39'] },
                        { key: 'quintal-central-direito', area_id: 2, label: 'Quintal Central Direito', tableNumbers: ['40','42','44','46','48'] },
                        { key: 'quintal-lateral-direito', area_id: 2, label: 'Quintal Lateral Direito', tableNumbers: ['50','52','54','56','58','60','62','64'] },
                      ];

                      const subareas = (isSeuJustinoPlanilha || isPracinhaJustinoPlanilha) ? seuJustinoSubareas : highlineSubareas;

                      // Funções auxiliares
                      const formatTime = (t?: string) => {
                        if (!t || t.trim() === '') return '';
                        try {
                          return t.slice(0, 5);
                        } catch (error) {
                          return '';
                        }
                      };
                      
                      const matchesFilters = (r: Reservation) => {
                        if (sheetFilters.date) {
                          let d = '';
                          if (r.reservation_date) {
                            try {
                              const dateStr = String(r.reservation_date).trim();
                              if (dateStr && dateStr !== 'null' && dateStr !== 'undefined') {
                                let date;
                                if (dateStr.includes('T')) {
                                  date = new Date(dateStr);
                                } else {
                                  date = new Date(dateStr + 'T12:00:00');
                                }
                                if (!isNaN(date.getTime())) {
                                  d = date.toISOString().split('T')[0];
                                }
                              }
                            } catch (error) {
                              console.error('Error in filter date conversion:', r.reservation_date, error);
                            }
                          }
                          if (d !== sheetFilters.date) return false;
                        }
                        if (sheetFilters.search) {
                          const q = sheetFilters.search.toLowerCase();
                          const hay = `${r.client_name || ''} ${r.client_phone || ''} ${(r as any).event_name || ''}`.toLowerCase();
                          if (!hay.includes(q)) return false;
                        }
                        if (sheetFilters.name && !(`${r.client_name || ''}`.toLowerCase().includes(sheetFilters.name.toLowerCase()))) return false;
                        if (sheetFilters.phone && !(`${r.client_phone || ''}`.toLowerCase().includes(sheetFilters.phone.toLowerCase()))) return false;
                        if (sheetFilters.event && !(`${(r as any).event_name || ''}`.toLowerCase().includes(sheetFilters.event.toLowerCase()))) return false;
                        if (sheetFilters.table && !(`${(r as any).table_number || ''}`.toString().toLowerCase().includes(sheetFilters.table.toLowerCase()))) return false;
                        if (sheetFilters.status && !(r.status || '').toLowerCase().includes(sheetFilters.status.toLowerCase())) return false;
                        return true;
                      };

                      const getCategoryFromMesa = (mesa: { area_id: number; area_name: string; table_number: string }): string => {
                        const tableNum = mesa.table_number.trim();
                        const subarea = subareas.find((sub: { tableNumbers: string[] }) => sub.tableNumbers.includes(tableNum));
                        if (subarea) {
                          const k = (subarea as { key: string }).key;
                          if (isSeuJustinoPlanilha || isPracinhaJustinoPlanilha) {
                            if (k.startsWith('lounge')) return 'lounge';
                            if (k.startsWith('quintal')) return 'quintal';
                            return mesa.area_id === 1 ? 'lounge' : 'quintal';
                          }
                          if (k.startsWith('deck-')) return 'deck';
                          if (k === 'bar') return 'bar';
                          if (k.startsWith('roof-')) return 'rooftop';
                        }
                        if (isSeuJustinoPlanilha || isPracinhaJustinoPlanilha) {
                          if (['200','202','204','206','208','210'].includes(tableNum)) return 'lounge';
                          if (['20','22','24','26','28','29','30','32','34','36','38','39','40','42','44','46','48','50','52','54','56','58','60','62','64'].includes(tableNum)) return 'quintal';
                          return mesa.area_id === 1 ? 'lounge' : 'quintal';
                        }
                        if (['40','41','42','44','45','46','47','60','61','62','63','64','65','50','51','52','53','54','55','56','70','71','72','73'].includes(tableNum)) return 'rooftop';
                        if (['01','02','03','04','05','06','07','08','09','10','11','12'].includes(tableNum)) return 'deck';
                        if (['15','16','17'].includes(tableNum)) return 'bar';
                        if (mesa.area_id === 5) return 'rooftop';
                        if (mesa.area_id === 2) return 'deck';
                        return 'other';
                      };

                      // Agrupar áreas do banco em categorias principais: Deck, Bar Central, Rooftop
                      const areaSectionsMap = new Map<string, Array<{ area_id: number; area_name: string; table_number: string }>>();
                      
                      // Processar todas as áreas do mapa de mesas e agrupar por categoria
                      todasMesasAreas.forEach((mesas, areaKey) => {
                        mesas.forEach(mesa => {
                          const category = getCategoryFromMesa(mesa);
                          
                          // Adicionar mesas à categoria correspondente
                          if (!areaSectionsMap.has(category)) {
                            areaSectionsMap.set(category, []);
                          }
                          areaSectionsMap.get(category)!.push(mesa);
                        });
                      });

                      const areaSections: Array<{ key: string; title: string; area_ids: number[]; area_names: string[] }> = (isSeuJustinoPlanilha || isPracinhaJustinoPlanilha)
                        ? [
                            { key: 'lounge', title: 'Lounge', area_ids: [], area_names: [] },
                            { key: 'quintal', title: 'Quintal', area_ids: [], area_names: [] },
                          ]
                        : [
                            { key: 'deck', title: 'Deck', area_ids: [], area_names: [] },
                            { key: 'bar', title: 'Bar Central', area_ids: [], area_names: [] },
                            { key: 'rooftop', title: 'Rooftop', area_ids: [], area_names: [] },
                          ];

                      const getAreaKeyFromReservation = (r: Reservation): string => {
                        const tableNum = String((r as any).table_number ?? '').trim();
                        const subarea = subareas.find((sub: { tableNumbers: string[] }) => sub.tableNumbers.includes(tableNum));
                        if (subarea) {
                          const k = (subarea as { key: string }).key;
                          if (isSeuJustinoPlanilha || isPracinhaJustinoPlanilha) {
                            if (k.startsWith('lounge')) return 'lounge';
                            if (k.startsWith('quintal')) return 'quintal';
                            return (r as any).area_id === 1 ? 'lounge' : 'quintal';
                          }
                          if (k.startsWith('deck-')) return 'deck';
                          if (k === 'bar') return 'bar';
                          if (k.startsWith('roof-')) return 'rooftop';
                        }
                        if (isSeuJustinoPlanilha || isPracinhaJustinoPlanilha) {
                          if (['200','202','204','206','208','210'].includes(tableNum)) return 'lounge';
                          if (['20','22','24','26','28','29','30','32','34','36','38','39','40','42','44','46','48','50','52','54','56','58','60','62','64'].includes(tableNum)) return 'quintal';
                          const an = (r as any).area_name?.toLowerCase() || '';
                          // Se for Seu Justino ou Pracinha, tentar mapear pela mesa primeiro
                          if ((isSeuJustinoPlanilha || isPracinhaJustinoPlanilha) && (r as any).table_number) {
                            const areaName = getSeuJustinoAreaName((r as any).table_number, (r as any).area_name, (r as any).area_id);
                            if (areaName.toLowerCase().includes('lounge')) return 'lounge';
                            if (areaName.toLowerCase().includes('quintal')) return 'quintal';
                          }
                          if (an.includes('lounge') || an.includes('bar')) return 'lounge';
                          if (an.includes('quintal') || an.includes('descoberta')) return 'quintal';
                          return (r as any).area_id === 1 ? 'lounge' : 'quintal';
                        }
                        if (['40','41','42','44','45','46','47','60','61','62','63','64','65','50','51','52','53','54','55','56','70','71','72','73'].includes(tableNum)) return 'rooftop';
                        if (['01','02','03','04','05','06','07','08','09','10','11','12'].includes(tableNum)) return 'deck';
                        if (['15','16','17'].includes(tableNum)) return 'bar';
                        const an = (r as any).area_name?.toLowerCase() || '';
                        if (an.includes('roof') || an.includes('rooftop') || an.includes('terraço')) return 'rooftop';
                        if (an.includes('deck')) return 'deck';
                        if (an.includes('bar') || an.includes('central')) return 'bar';
                        return 'deck';
                      };

                      // Preencher area_ids e area_names para cada categoria
                      areaSections.forEach(section => {
                        const mesasCategoria = areaSectionsMap.get(section.key) || [];
                        const uniqueAreaIds = Array.from(new Set(mesasCategoria.map(m => m.area_id)));
                        const uniqueAreaNames = Array.from(new Set(mesasCategoria.map(m => m.area_name)));
                        section.area_ids = uniqueAreaIds;
                        section.area_names = uniqueAreaNames;
                      });

                      // Mostrar apenas seções que têm mesas OU que têm reservas do dia
                      const reservasPorCategoria = new Map<string, number>();
                      planilhaReservas.forEach(r => {
                        const categoria = getAreaKeyFromReservation(r);
                        reservasPorCategoria.set(categoria, (reservasPorCategoria.get(categoria) || 0) + 1);
                      });
                      
                      // Filtrar: mostrar seção se tiver mesas OU se tiver reservas
                      const areaSectionsFiltered = areaSections.filter(s => 
                        s.area_ids.length > 0 || (reservasPorCategoria.get(s.key) || 0) > 0
                      );

                      const getAreaKeyFromAreaNameLocal = (areaName: string): string | null => {
                        const name = areaName.toLowerCase();
                        if (name.includes('roof') || name.includes('rooftop')) return 'rooftop';
                        if (name.includes('deck')) return 'deck';
                        if (name.includes('bar')) return 'bar';
                        if (name.includes('balada')) return 'balada';
                        return null;
                      };

                      const displayTableLabel = (tableNum?: string | number, areaKey?: string) => {
                        const raw = String(tableNum || '').trim();
                        const n = raw.padStart(2, '0');
                        if (isSeuJustinoPlanilha || isPracinhaJustinoPlanilha) {
                          if (areaKey === 'lounge') return raw ? `Lounge ${raw}` : '';
                          if (areaKey === 'quintal') return raw ? `Mesa ${raw}` : '';
                          return raw ? `Mesa ${raw}` : '';
                        }
                        if (areaKey === 'deck') {
                          if (['01','02','03','04'].includes(n)) return `Lounge ${parseInt(n,10)}`;
                          if (['05','06','07','08'].includes(n)) return `Lounge ${parseInt(n,10)}`;
                          if (['09','10','11','12'].includes(n)) return `Mesa ${n}`;
                        }
                        if (areaKey === 'bar') {
                          if (['15','16','17'].includes(n)) return `Mesa ${n}`;
                          if (['11','12','13','14'].includes(n)) return `Bistrô ESPERA ${n}`;
                        }
                        if (areaKey === 'rooftop') {
                          if (['40','41','42'].includes(n)) return `Lounge ${n}`;
                          if (['44','45','46','47'].includes(n)) return `Lounge Central ${n}`;
                          if (['60','61','62','63','64','65'].includes(n)) return `Bangalô ${n}`;
                          if (['50','51','52','53','54','55','56'].includes(n)) return `Mesa ${n}`;
                          if (['70','71','72','73'].includes(n)) return `Bistrô ${n}`;
                        }
                        return tableNum ? `Mesa ${n}` : '';
                      };

                      const SectionTable = ({ sectionKey, title, area_ids, area_names }: { sectionKey: string; title: string; area_ids: number[]; area_names: string[] }) => {
                        const tableNumbersPermitidos = new Set<string>();
                        subareas.forEach((subarea: { key: string; tableNumbers: string[] }) => {
                          if (isSeuJustinoPlanilha || isPracinhaJustinoPlanilha) {
                            if (sectionKey === 'lounge' && subarea.key.startsWith('lounge')) {
                              subarea.tableNumbers.forEach(tn => tableNumbersPermitidos.add(tn));
                            } else if (sectionKey === 'quintal' && subarea.key.startsWith('quintal')) {
                              subarea.tableNumbers.forEach(tn => tableNumbersPermitidos.add(tn));
                            }
                          } else {
                            if (sectionKey === 'deck' && subarea.key.startsWith('deck-')) {
                              subarea.tableNumbers.forEach(tn => tableNumbersPermitidos.add(tn));
                            } else if (sectionKey === 'bar' && subarea.key === 'bar') {
                              subarea.tableNumbers.forEach(tn => tableNumbersPermitidos.add(tn));
                            } else if (sectionKey === 'rooftop' && subarea.key.startsWith('roof-')) {
                              subarea.tableNumbers.forEach(tn => tableNumbersPermitidos.add(tn));
                            }
                          }
                        });
                        
                        // Buscar TODAS as mesas desta categoria (filtrando pelos números corretos)
                        const mesasArea: Array<{ area_id: number; area_name: string; table_number: string }> = [];
                        
                        // Coletar apenas as mesas que pertencem a esta categoria (baseado no número da mesa)
                        todasMesasAreas.forEach((mesas, areaKey) => {
                          mesas.forEach(mesa => {
                            const tableNum = mesa.table_number.trim();
                            // Incluir APENAS se o número da mesa estiver na lista permitida desta categoria
                            if (tableNumbersPermitidos.has(tableNum)) {
                              // Evitar duplicatas
                              if (!mesasArea.find(m => m.area_id === mesa.area_id && m.table_number === mesa.table_number)) {
                                mesasArea.push(mesa);
                              }
                            }
                          });
                        });
                        
                        // Reservas filtradas para esta seção (filtradas por categoria)
                        const reservasFiltradas = planilhaReservas
                          .filter(r => matchesFilters(r))
                          .filter(r => getAreaKeyFromReservation(r) === sectionKey) // Filtrar pela categoria (deck, bar, rooftop)
                          .sort((a,b) => (a.reservation_time || '').localeCompare(b.reservation_time || ''));

                        // Mapear reservas por número da mesa; permitir múltiplas reservas na mesma mesa
                        const reservasPorMesa = new Map<string, Reservation[]>();
                        reservasFiltradas.forEach(r => {
                          const tableNumStr = String((r as any).table_number ?? '').trim();
                          const add = (key: string) => {
                            if (!key) return;
                            const arr = reservasPorMesa.get(key) || [];
                            arr.push(r);
                            reservasPorMesa.set(key, arr);
                          };
                          if (tableNumStr.includes(',')) {
                            tableNumStr.split(',').map(t => t.trim()).filter(Boolean).forEach(add);
                          } else {
                            add(tableNumStr);
                          }
                        });

                        const rowsWithEmpty: Array<{ reservation?: Reservation; table_number: string; is_empty: boolean }> = [];
                        const tablesSeen = new Set<string>();
                        mesasArea.forEach(mesa => {
                          const tableNum = mesa.table_number.trim();
                          tablesSeen.add(tableNum);
                          const list = reservasPorMesa.get(tableNum) || [];
                          const valid = list.filter(r => matchesFilters(r));
                          if (valid.length > 0) {
                            valid.forEach(reserva => {
                              rowsWithEmpty.push({ reservation: reserva, table_number: tableNum, is_empty: false });
                            });
                          } else {
                            rowsWithEmpty.push({ reservation: undefined, table_number: tableNum, is_empty: true });
                          }
                        });
                        reservasPorMesa.forEach((list, tableNum) => {
                          if (tablesSeen.has(tableNum)) return;
                          const valid = list.filter(r => matchesFilters(r));
                          if (valid.length === 0) return;
                          valid.forEach(reserva => {
                            rowsWithEmpty.push({ reservation: reserva, table_number: tableNum, is_empty: false });
                          });
                          tablesSeen.add(tableNum);
                        });
                        tableNumbersPermitidos.forEach(tn => {
                          if (tablesSeen.has(tn)) return;
                          rowsWithEmpty.push({ reservation: undefined, table_number: tn, is_empty: true });
                        });

                        // Ordenar: por número da mesa (numérico quando possível)
                        rowsWithEmpty.sort((a, b) => {
                          const numA = parseInt(a.table_number) || 0;
                          const numB = parseInt(b.table_number) || 0;
                          if (numA !== 0 && numB !== 0) {
                            return numA - numB;
                          }
                          // Se não for numérico, ordenar como string
                          return a.table_number.localeCompare(b.table_number);
                        });

                        return (
                          <div>
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                              <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                  <span className="text-gray-600">Disponível</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                  <span className="text-gray-600">Reservada</span>
                                </div>
                              </div>
                            </div>
                            <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
                              <table className="min-w-full table-fixed border-collapse">
                                <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                                  <tr className="text-[11px] uppercase text-gray-700 font-bold">
                                    <th className="w-10 border border-gray-300 px-2 py-2 text-left">#</th>
                                    <th className="border border-gray-300 px-2 py-2 text-left">Data de Entrada</th>
                                    <th className="border border-gray-300 px-2 py-2 text-left hidden sm:table-cell">Evento</th>
                                    <th className="border border-gray-300 px-2 py-2 text-left">Nome / Status</th>
                                    <th className="border border-gray-300 px-2 py-2 text-left font-bold">Mesa</th>
                                    <th className="border border-gray-300 px-2 py-2 text-left hidden md:table-cell">Telefone</th>
                                    <th className="border border-gray-300 px-2 py-2 text-left hidden lg:table-cell">Observação</th>
                                    <th className="border border-gray-300 px-2 py-2 text-left hidden xl:table-cell">Limite por mesa</th>
                                    <th className="border border-gray-300 px-2 py-2 text-left">Pessoas</th>
                                    <th className="border border-gray-300 px-2 py-2 text-left">Status</th>
                                  </tr>
                                  <tr className="bg-gray-50 text-[12px]">
                                    <th className="w-10 border border-gray-300 px-2 py-1 text-gray-400 font-normal">&nbsp;</th>
                                    <th className="border border-gray-300 px-2 py-1 text-gray-600">
                                      <input type="date" value={sheetFilters.date || ''} onChange={(e)=>setSheetFilters(p=>({...p, date:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-1" />
                                    </th>
                                    <th className="border border-gray-300 px-2 py-1 hidden sm:table-cell">
                                      <input placeholder="Filtrar evento" value={sheetFilters.event || ''} onChange={(e)=>setSheetFilters(p=>({...p, event:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                    </th>
                                    <th className="border border-gray-300 px-2 py-1">
                                      <input placeholder="Filtrar nome" value={sheetFilters.name || ''} onChange={(e)=>setSheetFilters(p=>({...p, name:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                    </th>
                                    <th className="border border-gray-300 px-2 py-1">
                                      <input placeholder="Filtrar mesa" value={sheetFilters.table || ''} onChange={(e)=>setSheetFilters(p=>({...p, table:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                    </th>
                                    <th className="border border-gray-300 px-2 py-1 hidden md:table-cell">
                                      <input placeholder="Filtrar telefone" value={sheetFilters.phone || ''} onChange={(e)=>setSheetFilters(p=>({...p, phone:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                    </th>
                                    <th className="border border-gray-300 px-2 py-1 hidden lg:table-cell">
                                      <input placeholder="Filtrar observação" value={sheetFilters.search || ''} onChange={(e)=>setSheetFilters(p=>({...p, search:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                    </th>
                                    <th className="border border-gray-300 px-2 py-1 text-gray-400 font-normal hidden xl:table-cell">&nbsp;</th>
                                    <th className="border border-gray-300 px-2 py-1 text-gray-400 font-normal">&nbsp;</th>
                                    <th className="border border-gray-300 px-2 py-1">
                                      <input placeholder="status" value={sheetFilters.status || ''} onChange={(e)=>setSheetFilters(p=>({...p, status:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rowsWithEmpty.map((row, idx) => {
                                    const r = row.reservation;
                                    const isEmpty = row.is_empty;
                                    
                                    // Criar key única: combinar ID da reserva com número da mesa para evitar duplicatas
                                    const uniqueKey = r 
                                      ? `reservation-${r.id}-table-${row.table_number}-${sectionKey}` 
                                      : `empty-table-${row.table_number}-${sectionKey}-${idx}`;
                                    
                                    return (
                                      <tr 
                                        key={uniqueKey} 
                                        className={`${
                                          isEmpty 
                                            ? 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500' 
                                            : 'bg-white hover:bg-yellow-50 border-l-4 border-l-blue-500'
                                        } transition-colors`}
                                      >
                                        <td className="border border-gray-300 px-2 py-2 text-[12px] text-gray-500">{idx + 1}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-700 whitespace-nowrap">
                                          {isEmpty ? (
                                            <div className="flex items-center gap-1">
                                              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                                              <span>{sheetFilters.date ? formatDate(sheetFilters.date) : '-'}</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1">
                                              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                                              <span>{formatDate(r!.reservation_date, sheetFilters.date) + ' ' + formatTime(r!.reservation_time)}</span>
                                            </div>
                                          )}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-700 hidden sm:table-cell">
                                          {isEmpty ? (
                                            <span className="text-gray-400 italic">-</span>
                                          ) : (
                                            (r as any).event_name || '-'
                                          )}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2 text-sm font-medium">
                                          {isEmpty ? (
                                            <span className="text-green-700 font-bold text-base flex items-center gap-1">
                                              <span className="text-lg">✨</span>
                                              <span>DISPONÍVEL</span>
                                            </span>
                                          ) : (
                                            <span className="text-gray-800">{r!.client_name}</span>
                                          )}
                                        </td>
                                        <td className={`border border-gray-300 px-2 py-2 text-base font-bold ${
                                          isEmpty 
                                            ? 'text-green-700 bg-green-100' 
                                            : 'text-blue-700 bg-blue-50'
                                        } text-center`}>
                                          {displayTableLabel(row.table_number, sectionKey)}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-700 whitespace-nowrap hidden md:table-cell">
                                          {isEmpty ? (
                                            <span className="text-gray-400">-</span>
                                          ) : (
                                            r!.client_phone || '-'
                                          )}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-700 hidden lg:table-cell">
                                          {isEmpty ? (
                                            <span className="text-gray-400">-</span>
                                          ) : (
                                            r!.notes || '-'
                                          )}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-700 text-center hidden xl:table-cell">
                                          -
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2 text-sm text-gray-700 text-center font-medium">
                                          {isEmpty ? (
                                            <span className="text-gray-400">-</span>
                                          ) : (
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">{r!.number_of_people}</span>
                                          )}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2 text-sm whitespace-nowrap">
                                          {isEmpty ? (
                                            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-500 text-white border-2 border-green-600 shadow-md flex items-center justify-center gap-1.5 min-w-[100px]">
                                              <span className="text-base">✓</span>
                                              <span>DISPONÍVEL</span>
                                            </span>
                                          ) : (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${((r!.status as any) === 'confirmed' || (r!.status as any) === 'CONFIRMADA') ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'}`}>
                                              {((r!.status as any) === 'confirmed' || (r!.status as any) === 'CONFIRMADA') ? 'Confirmado' : ((r!.status as any) as string) || 'Pendente'}
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {rowsWithEmpty.length === 0 && (
                                    <tr>
                                      <td colSpan={10} className="px-3 py-6 text-sm text-gray-500 text-center border border-gray-300 bg-gray-50">
                                        <div className="flex flex-col items-center gap-2">
                                          <span>📋 Sem reservas para os filtros selecionados.</span>
                                          <span className="text-xs text-gray-400">Tente ajustar os filtros ou verificar outra data.</span>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            {rowsWithEmpty.length > 0 && (
                              <p className="text-xs text-gray-500 mt-2">
                                {(isSeuJustinoPlanilha || isPracinhaJustinoPlanilha)
                                  ? (sectionKey === 'lounge' ? 'Mesas: Lounge Bar 200–202, Lounge Palco 204–206, Aquário TV 208, Aquário Spaten 210' : 'Mesas: Quintal Lateral Esq. 20–29, Central Esq. 30–39, Central Dir. 40–48, Lateral Dir. 50–64')
                                  : (sectionKey === 'deck' ? 'Mesas: Lounge 1–8, Mesa 09–12' : sectionKey === 'bar' ? 'Mesas: Bistrô 15–17' : 'Mesas: Lounge 40–42, Lounge Central 44–47, Bangalô 60–65, Mesa 50–56, Bistrô 70–73')
                                }
                                {' '}({rowsWithEmpty.length} {rowsWithEmpty.length === 1 ? 'mesa' : 'mesas'})
                              </p>
                            )}
                          </div>
                        );
                      };

                      // Calcular resumo do dia - APENAS reservas do dia filtrado (ignorar outros filtros para o total)
                      // Filtrar reservas do dia e remover duplicatas (uma reserva pode aparecer em múltiplas mesas)
                      const reservasDoDia = sheetFilters.date 
                        ? planilhaReservas.filter(r => {
                            if (!r.reservation_date) return false;
                            try {
                              const dateStr = String(r.reservation_date).trim();
                              if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return false;
                              let date;
                              if (dateStr.includes('T')) {
                                date = new Date(dateStr);
                              } else {
                                date = new Date(dateStr + 'T12:00:00');
                              }
                              if (isNaN(date.getTime())) return false;
                              const d = date.toISOString().split('T')[0];
                              return d === sheetFilters.date;
                            } catch {
                              return false;
                            }
                          })
                        : [];
                      
                      // Remover duplicatas usando Set com IDs únicos (uma reserva com múltiplas mesas conta apenas uma vez)
                      const reservasUnicas = Array.from(new Map(reservasDoDia.map(r => [r.id, r])).values());
                      const totalReservations = reservasUnicas.length;
                      // Garantir que number_of_people seja convertido para número (pode vir como string)
                      const totalPeople = reservasUnicas.reduce((sum, r) => {
                        const peopleCount = typeof r.number_of_people === 'number' 
                          ? r.number_of_people 
                          : parseInt(String(r.number_of_people || '0'), 10) || 0;
                        return sum + peopleCount;
                      }, 0);

                      return (
                        <div className="space-y-6">
                          {/* Resumo do Dia */}
                          {sheetFilters.date && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4 sm:p-6 shadow-md">
                              <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                                <span className="text-lg sm:text-xl">📊</span>
                                <span className="hidden sm:inline">Resumo do Dia - </span>
                                <span className="sm:hidden">Dia - </span>
                                {(() => {
                                  const date = new Date(sheetFilters.date + 'T12:00:00');
                                  return date.toLocaleDateString('pt-BR', { 
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  });
                                })()}
                              </h3>
                              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-yellow-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Reservas</p>
                                      <p className="text-2xl sm:text-4xl font-bold text-yellow-600 mt-1 sm:mt-2">{totalReservations}</p>
                                    </div>
                                    <div className="bg-yellow-100 p-2 sm:p-3 rounded-full hidden sm:block">
                                      <MdRestaurant className="text-yellow-600 text-xl sm:text-3xl" />
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-orange-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Pessoas</p>
                                      <p className="text-2xl sm:text-4xl font-bold text-orange-600 mt-1 sm:mt-2">{totalPeople}</p>
                                    </div>
                                    <div className="bg-orange-100 p-2 sm:p-3 rounded-full hidden sm:block">
                                      <MdGroups className="text-orange-600 text-xl sm:text-3xl" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {totalReservations > 0 && (
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-yellow-200">
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    <span className="font-semibold">Média:</span> {(totalPeople / totalReservations).toFixed(1)} pessoas/reserva
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Resumo Geral (quando não há filtro de data) */}
                          {!sheetFilters.date && totalReservations > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                              <p className="text-sm text-blue-800">
                                <span className="font-semibold">💡 Dica:</span> Selecione uma data acima para ver o resumo detalhado do dia.
                                <span className="ml-2">Atualmente mostrando {totalReservations} reserva(s) com {totalPeople} pessoa(s) no total.</span>
                              </p>
                            </div>
                          )}

                          <div className="space-y-10">
                            {areaSectionsFiltered.map(s => (
                              <SectionTable 
                                key={s.key} 
                                sectionKey={s.key} 
                                title={s.title} 
                                area_ids={s.area_ids}
                                area_names={s.area_names}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Footer do Modal */}
              <div className="p-4 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => setPlanilhaModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Toast Container para notificações não-bloqueantes */}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          style={{ touchAction: 'manipulation' }}
        />
        
        {/* Histórico de Reservas Concluídas */}
        {historicoReservasConcluidas.length > 0 && (
          <section className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-4 md:p-6 border border-white/20 mt-6">
            <div className="mb-4">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <MdAccessTime size={20} className="md:w-6 md:h-6 text-blue-400" />
                <span>Histórico de Reservas Concluídas ({historicoReservasConcluidas.length})</span>
              </h2>
              <p className="text-xs md:text-sm text-gray-400 mt-1 ml-1 md:ml-8">
                Reservas que completaram o fluxo completo de check-in e check-out no dia.
              </p>
            </div>
            
            <div className="space-y-3">
              {historicoReservasConcluidas
                .sort((a, b) => {
                  // Ordenar por horário de check-out (mais recente primeiro)
                  const timeA = new Date(a.checkout_time).getTime();
                  const timeB = new Date(b.checkout_time).getTime();
                  return timeB - timeA;
                })
                .map((reserva) => {
                  const formatTime = (timeStr: string) => {
                    if (!timeStr) return '—';
                    return new Date(timeStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  };
                  
                  return (
                    <div
                      key={reserva.guest_list_id}
                      className="bg-white/5 border border-white/20 rounded-lg p-4 opacity-70"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm md:text-base line-through text-gray-400">
                              {reserva.owner_name}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                              ✅ Concluído
                            </span>
                            {reserva.table_number && (
                              <span className="text-xs text-gray-400">
                                Mesa: {reserva.table_number}
                              </span>
                            )}
                            {reserva.area_name && (
                              <span className="text-xs text-gray-400">
                                {reserva.area_name}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <span className="font-mono">
                                E: {formatTime(reserva.checkin_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono">
                                S: {formatTime(reserva.checkout_time)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Lista de convidados que também completaram o fluxo */}
                      {reserva.guests.filter(g => g.checkin_time && g.checkout_time).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-gray-400 mb-2">Convidados que completaram o fluxo:</p>
                          <div className="space-y-1">
                            {reserva.guests
                              .filter(g => g.checkin_time && g.checkout_time)
                              .map((guest) => (
                                <div key={guest.id} className="text-xs text-gray-400 flex items-center gap-2">
                                  <span className="line-through">{guest.name}</span>
                                  <span className="font-mono">
                                    E: {formatTime(guest.checkin_time || '')} | S: {formatTime(guest.checkout_time || '')}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        )}
      </div>
  );
}

