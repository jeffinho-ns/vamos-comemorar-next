"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MdRestaurant, MdPeople, MdSchedule, MdBarChart, MdSettings, MdAdd, MdSearch, MdChair, MdPhone, MdClose, MdCall, MdTimer, MdLocationOn, MdPerson } from "react-icons/md";
import { motion } from "framer-motion";
import ReservationCalendar from "../../components/ReservationCalendar";
import WeeklyCalendar from "../../components/WeeklyCalendar";
import ReservationModal from "../../components/ReservationModal";
import WalkInModal from "../../components/WalkInModal";
import WaitlistModal from "../../components/WaitlistModal";
import AddGuestListToReservationModal from "../../components/AddGuestListToReservationModal";
import { Reservation } from "@/app/types/reservation";
import { BirthdayService, BirthdayReservation } from "../../services/birthdayService";
import { useEstablishmentPermissions } from '@/app/hooks/useEstablishmentPermissions';

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}


interface WalkIn {
  id: number;
  client_name: string;
  client_phone?: string;
  number_of_people: number;
  arrival_time: string;
  area_id?: number;
  table_number?: string;
  status: 'ATIVO' | 'FINALIZADO' | 'CANCELADO';
  notes?: string;
  area?: {
    id: number;
    name: string;
  };
}

interface WaitlistEntry {
  id: number;
  establishment_id?: number;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  number_of_people: number;
  preferred_date?: string;
  preferred_time?: string;
  status: 'AGUARDANDO' | 'CHAMADO' | 'ATENDIDO' | 'CANCELADO';
  position: number;
  estimated_wait_time?: number;
  created_at: string;
}


interface RestaurantArea {
  id: number;
  name: string;
  capacity_lunch: number;
  capacity_dinner: number;
}

// Removido array estático - agora será carregado da API

type TabType = 'reservations' | 'walk-ins' | 'waitlist' | 'guest-lists' | 'reports' | 'settings';

export default function RestaurantReservationsPage() {
  const establishmentPermissions = useEstablishmentPermissions();
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [allEstablishments, setAllEstablishments] = useState<Establishment[]>([]); // Lista completa (antes do filtro)
  const [establishments, setEstablishments] = useState<Establishment[]>([]); // Lista filtrada
  const [activeTab, setActiveTab] = useState<TabType>('reservations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs para evitar loops infinitos
  const hasFilteredRef = useRef(false);
  const hasSelectedRef = useRef(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';

  const fetchEstablishments = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      // Usar sempre a tabela places para manter consistência com o cliente
      const response = await fetch(`${API_URL}/api/places`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar estabelecimentos");

      const data = await response.json();
      console.log("Dados recebidos da API (places):", data);
      
      let formattedEstablishments: Establishment[] = [];
      
      if (Array.isArray(data)) {
        formattedEstablishments = data.map((place: any) => ({
          id: place.id,
          name: place.name || "Sem nome",
          logo: place.logo || '',
          address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado"
        }));
      } else if (data.data && Array.isArray(data.data)) {
        // Se os dados vêm em um objeto com propriedade data
        formattedEstablishments = data.data.map((place: any) => ({
          id: place.id,
          name: place.name || "Sem nome",
          logo: place.logo || '',
          address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado"
        }));
      } else {
        setError("Dados de estabelecimentos inválidos.");
      }
      
      // Armazenar lista completa
      setAllEstablishments(formattedEstablishments);
      
      // Filtrar estabelecimentos baseado nas permissões do usuário
      // IMPORTANTE: Só filtrar se as permissões já foram carregadas
      let filteredEstablishments: Establishment[] = [];
      if (!establishmentPermissions.isLoading) {
        filteredEstablishments = establishmentPermissions.getFilteredEstablishments(formattedEstablishments);
        console.log(`📋 [RESTAURANT RESERVATIONS] Estabelecimentos filtrados: ${filteredEstablishments.length} de ${formattedEstablishments.length}`, filteredEstablishments.map(e => ({ id: e.id, name: e.name })));
        setEstablishments(filteredEstablishments);
      } else {
        // Se as permissões ainda não foram carregadas, usar todos temporariamente (será filtrado depois)
        filteredEstablishments = formattedEstablishments;
        setEstablishments(filteredEstablishments);
        console.log(`⚠️ [RESTAURANT RESERVATIONS] Permissões ainda não carregadas, usando todos os estabelecimentos temporariamente`);
      }
      
      // Selecionar automaticamente se houver apenas um estabelecimento ou se estiver restrito
      // Mas apenas se as permissões já foram carregadas e ainda não foi selecionado
      if (!establishmentPermissions.isLoading && !hasSelectedRef.current) {
        if (filteredEstablishments.length === 1) {
          // Sempre selecionar se há apenas um disponível
          const estabelecimentoUnico = filteredEstablishments[0];
          setSelectedEstablishment(estabelecimentoUnico);
          hasSelectedRef.current = true;
          console.log(`✅ [RESTAURANT RESERVATIONS] Estabelecimento único selecionado automaticamente: ${estabelecimentoUnico.id} - ${estabelecimentoUnico.name}`);
        } else if (establishmentPermissions.isRestrictedToSingleEstablishment() && filteredEstablishments.length > 0) {
          const defaultId = establishmentPermissions.getDefaultEstablishmentId();
          console.log(`🔍 [RESTAURANT RESERVATIONS] Usuário restrito detectado. Default ID: ${defaultId}, Estabelecimentos disponíveis:`, filteredEstablishments.map(e => ({ id: e.id, name: e.name })));
          
          if (defaultId) {
            const defaultEst = filteredEstablishments.find(est => est.id === defaultId);
            if (defaultEst) {
              setSelectedEstablishment(defaultEst);
              hasSelectedRef.current = true;
              console.log(`✅ [RESTAURANT RESERVATIONS] Estabelecimento selecionado via permissões: ${defaultId} - ${defaultEst.name}`);
            } else {
              console.warn(`⚠️ [RESTAURANT RESERVATIONS] ID ${defaultId} não encontrado na lista filtrada. Usando primeiro disponível.`);
              if (filteredEstablishments.length > 0) {
                setSelectedEstablishment(filteredEstablishments[0]);
                hasSelectedRef.current = true;
                console.log(`✅ [RESTAURANT RESERVATIONS] Estabelecimento selecionado (fallback): ${filteredEstablishments[0].id} - ${filteredEstablishments[0].name}`);
              }
            }
          } else if (filteredEstablishments.length > 0) {
            // Fallback: selecionar o primeiro se não houver defaultId
            setSelectedEstablishment(filteredEstablishments[0]);
            hasSelectedRef.current = true;
            console.log(`✅ [RESTAURANT RESERVATIONS] Estabelecimento selecionado (fallback sem defaultId): ${filteredEstablishments[0].id} - ${filteredEstablishments[0].name}`);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Erro desconhecido");
      }
      console.error("Erro ao buscar estabelecimentos:", error);
      
      // Fallback com dados estáticos incluindo Reserva Rooftop
      setEstablishments([
        {
          id: 7,
          name: "High Line",
          logo: "",
          address: "Rua Girassol, 144 - Vila Madalena"
        },
        {
          id: 1,
          name: "Seu Justino",
          logo: "",
          address: "Rua Harmonia, 77 - Vila Madalena"
        },
        {
          id: 4,
          name: "Oh Freguês",
          logo: "",
          address: "Largo da Matriz de Nossa Senhora do Ó, 145 - Freguesia do Ó"
        },
        {
          id: 8,
          name: "Pracinha do Seu Justino",
          logo: "",
          address: "Rua Harmonia, 117 - Sumarezinho"
        },
        {
          id: 9,
          name: "Reserva Rooftop",
          logo: "",
          address: "Endereço do Reserva Rooftop"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Ref para evitar múltiplas chamadas
  const hasFetchedRef = useRef(false);
  
  useEffect(() => {
    // Aguardar o hook carregar as permissões antes de buscar estabelecimentos
    if (!establishmentPermissions.isLoading && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchEstablishments();
    }
  }, [establishmentPermissions.isLoading]);

  // Efeito adicional para refiltrar estabelecimentos quando permissões forem carregadas
  useEffect(() => {
    // Só executar uma vez quando as permissões carregarem e houver estabelecimentos
    if (!establishmentPermissions.isLoading && allEstablishments.length > 0 && !hasFilteredRef.current) {
      // Refiltrar estabelecimentos agora que as permissões estão carregadas
      const filteredEstabs = establishmentPermissions.getFilteredEstablishments(allEstablishments);
      console.log(`🔄 [RESTAURANT RESERVATIONS] Refiltrando estabelecimentos após permissões carregarem: ${filteredEstabs.length} de ${allEstablishments.length}`, filteredEstabs.map(e => ({ id: e.id, name: e.name })));
      
      // Atualizar lista de estabelecimentos filtrados
      setEstablishments(filteredEstabs);
      hasFilteredRef.current = true;
      
      // Selecionar automaticamente se ainda não houver seleção
      if (!selectedEstablishment && !hasSelectedRef.current) {
        const isRestricted = establishmentPermissions.isRestrictedToSingleEstablishment();
        const hasOnlyOne = filteredEstabs.length === 1;
        
        console.log(`🔍 [RESTAURANT RESERVATIONS] useEffect seleção - isRestricted: ${isRestricted}, hasOnlyOne: ${hasOnlyOne}`);
        
        if (isRestricted || hasOnlyOne) {
          const defaultId = establishmentPermissions.getDefaultEstablishmentId();
          console.log(`🔍 [RESTAURANT RESERVATIONS] Default ID das permissões: ${defaultId}`);
          
          if (defaultId) {
            const estabelecimentoEncontrado = filteredEstabs.find(e => e.id === defaultId);
            if (estabelecimentoEncontrado) {
              setSelectedEstablishment(estabelecimentoEncontrado);
              hasSelectedRef.current = true;
              console.log(`✅ [RESTAURANT RESERVATIONS] Estabelecimento selecionado via useEffect: ${defaultId} - ${estabelecimentoEncontrado.name}`);
            } else if (hasOnlyOne && filteredEstabs.length > 0) {
              setSelectedEstablishment(filteredEstabs[0]);
              hasSelectedRef.current = true;
              console.log(`✅ [RESTAURANT RESERVATIONS] Estabelecimento selecionado (único disponível): ${filteredEstabs[0].id} - ${filteredEstabs[0].name}`);
            }
          } else if (hasOnlyOne && filteredEstabs.length > 0) {
            setSelectedEstablishment(filteredEstabs[0]);
            hasSelectedRef.current = true;
            console.log(`✅ [RESTAURANT RESERVATIONS] Estabelecimento selecionado (único disponível, fallback): ${filteredEstabs[0].id} - ${filteredEstabs[0].name}`);
          }
        }
      }
    }
  }, [establishmentPermissions.isLoading, allEstablishments.length]);
  
  // Estados para Reservas
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [birthdayReservations, setBirthdayReservations] = useState<BirthdayReservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'weekly' | 'sheet'>('calendar');
  const [sheetFilters, setSheetFilters] = useState<{ date?: string; search?: string; name?: string; phone?: string; event?: string; table?: string; status?: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [giroFilter, setGiroFilter] = useState<'all' | '1º Giro' | '2º Giro'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  // Estados para Modal de Lista de Convidados
  const [showAddGuestListModal, setShowAddGuestListModal] = useState(false);
  const [selectedReservationForGuestList, setSelectedReservationForGuestList] = useState<Reservation | null>(null);
  
  // Estados para Walk-ins
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [areas, setAreas] = useState<RestaurantArea[]>([]);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [editingWalkIn, setEditingWalkIn] = useState<WalkIn | null>(null);
  
  // Estados para Waitlist
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [editingWaitlistEntry, setEditingWaitlistEntry] = useState<WaitlistEntry | null>(null);

  // Estados para Guest Lists (Admin)
  type GuestListItem = {
    guest_list_id: number;
    owner_name: string;
    reservation_date: string;
    event_type: string | null;
    reservation_type: 'large' | 'restaurant';
    is_valid: 0 | 1;
    created_by_name: string;
    shareable_link_token: string;
    owner_checked_in?: boolean;
    owner_checkin_time?: string;
    owner_checked_out?: boolean;
    owner_checkout_time?: string;
  };
  type GuestItem = { id: number; name: string; whatsapp?: string; checked_in?: boolean; checkin_time?: string; checked_out?: boolean; checkout_time?: string };
  const [guestLists, setGuestLists] = useState<GuestListItem[]>([]);
  const [expandedGuestListId, setExpandedGuestListId] = useState<number | null>(null);
  const [guestsByList, setGuestsByList] = useState<Record<number, GuestItem[]>>({});
  const [guestForm, setGuestForm] = useState<{ listId?: number; name: string; whatsapp: string; editingGuestId?: number | null }>({ name: '', whatsapp: '', editingGuestId: null });
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [createListForm, setCreateListForm] = useState<{ client_name: string; reservation_date: string; event_type: string; establishment_id?: number }>({ client_name: '', reservation_date: '', event_type: '' });
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedDay, setSelectedDay] = useState<string>(''); // YYYY-MM-DD para filtrar por dia
  const [ownerSearchTerm, setOwnerSearchTerm] = useState<string>(''); // Termo de busca pelo nome do dono
  
  // Estados para check-in
  const [checkInStatus, setCheckInStatus] = useState<Record<number, { ownerCheckedIn: boolean; ownerCheckedOut?: boolean; guestsCheckedIn: number; totalGuests: number }>>({});
  
  // Ref para rastrear o último mês carregado e evitar loops
  const lastLoadedMonthRef = useRef<string>('');
  const lastLoadedEstablishmentRef = useRef<number | null>(null);

  // DECLARAÇÃO DA FUNÇÃO loadGuestLists (movida para cima dos useEffects)
  const loadGuestLists = useCallback(async () => {
    // Se nenhum estabelecimento estiver selecionado, não faz nada.
    if (!selectedEstablishment) {
      setGuestLists([]);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      // Adiciona o establishment_id na chamada da API
      const url = `${API_URL}/api/admin/guest-lists?month=${selectedMonth}&establishment_id=${selectedEstablishment.id}`;
      
      console.log('🔍 [loadGuestLists] Buscando listas para mês:', selectedMonth, '| Estabelecimento:', selectedEstablishment.name);
      console.log('🔍 URL completa:', url);

      const glRes = await fetch(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (glRes.ok) {
        const glData = await glRes.json();
        console.log(`✅ [loadGuestLists] ${glData.guestLists?.length || 0} listas encontradas para ${selectedMonth}`);
        setGuestLists(glData.guestLists || []);
      } else {
        console.error('❌ Erro ao carregar guest lists, status:', glRes.status);
        setGuestLists([]);
      }
    } catch (e) {
      console.error('❌ Erro de rede ao carregar guest lists:', e);
      setGuestLists([]);
    }
  }, [selectedEstablishment, selectedMonth, API_URL]);

  // Recarregar guest lists quando mudar o mês selecionado ou estabelecimento
  useEffect(() => {
    const shouldLoad = selectedEstablishment && selectedMonth && 
      (lastLoadedMonthRef.current !== selectedMonth || 
       lastLoadedEstablishmentRef.current !== selectedEstablishment.id);
    
    if (shouldLoad) {
      console.log('🔄 [useEffect] Carregando listas - Mês:', selectedMonth, '| Estabelecimento:', selectedEstablishment?.name);
      lastLoadedMonthRef.current = selectedMonth;
      lastLoadedEstablishmentRef.current = selectedEstablishment.id;
      loadGuestLists();
    }
  }, [selectedMonth, selectedEstablishment, loadGuestLists]);

  // Carregar guest lists quando entrar na aba
  useEffect(() => {
    console.log('🔄 [useEffect activeTab] Aba mudou para:', activeTab);
    if (activeTab === 'guest-lists' && selectedEstablishment) {
      // Força recarregar quando entra na aba
      lastLoadedMonthRef.current = '';
      loadGuestLists();
    }
  }, [activeTab, selectedEstablishment, loadGuestLists]);

  const loadAreas = async () => {
    if (areas.length > 0) return; // Já carregadas
    
    // Dados mock sempre disponíveis
    const mockAreas = [
      { id: 1, name: 'Área Coberta', capacity_lunch: 50, capacity_dinner: 40, description: 'Área interna com ar condicionado' },
      { id: 2, name: 'Área Descoberta', capacity_lunch: 30, capacity_dinner: 25, description: 'Área externa com vista para o jardim' },
      { id: 3, name: 'Área VIP', capacity_lunch: 20, capacity_dinner: 15, description: 'Área exclusiva com serviço diferenciado' },
      { id: 4, name: 'Balcão', capacity_lunch: 15, capacity_dinner: 12, description: 'Área do balcão para refeições rápidas' },
      { id: 5, name: 'Terraço', capacity_lunch: 25, capacity_dinner: 20, description: 'Área no terraço com vista panorâmica' }
    ];
    
    try {
      const areasResponse = await fetch(`${API_URL}/api/restaurant-areas`);
      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        if (areasData.success && areasData.areas && areasData.areas.length > 0) {
          setAreas(areasData.areas);
          console.log('✅ Áreas carregadas da API:', areasData.areas.length);
        } else {
          console.log('⚠️ API retornou dados vazios, usando dados mock');
          setAreas(mockAreas);
        }
      } else {
        console.log('⚠️ API retornou erro, usando dados mock');
        setAreas(mockAreas);
      }
    } catch (error) {
      console.log('⚠️ Erro ao conectar com API, usando dados mock:', error instanceof Error ? error.message : 'Erro desconhecido');
      setAreas(mockAreas);
    }
  };

  const handleEstablishmentSelect = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
    // Os dados serão carregados automaticamente pelo useEffect
  };

  const loadEstablishmentData = useCallback(async () => {
    if (!selectedEstablishment) {
      console.warn(`⚠️ [RESTAURANT RESERVATIONS] loadEstablishmentData chamado mas nenhum estabelecimento selecionado`);
      return;
    }
    
    console.log(`🔄 [RESTAURANT RESERVATIONS] loadEstablishmentData iniciado para: ${selectedEstablishment.id} - ${selectedEstablishment.name}`);
    
    // ### INÍCIO DA CORREÇÃO ###
    // Pega o token de autenticação no início da função
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      console.error(`❌ [RESTAURANT RESERVATIONS] Token de autenticação não encontrado`);
      return;
    }

    // Cria um objeto de cabeçalhos para ser reutilizado em todas as chamadas
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    // ### FIM DA CORREÇÃO ###

    try {
      // 1. Carregar Áreas (com autenticação)
      const areasResponse = await fetch(`${API_URL}/api/restaurant-areas`, { headers: authHeaders });
      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        setAreas(areasData.areas || []);
      } else {
        console.error('Erro ao carregar áreas:', areasResponse.statusText);
        setAreas([]); // Fallback
      }

      // 2. Carregar TODOS os tipos de reservas (com autenticação)
      try {
        console.log('🔍 Buscando TODOS os tipos de reservas para o estabelecimento:', selectedEstablishment.id);
  
        const normalReservationsPromise = fetch(`${API_URL}/api/restaurant-reservations?establishment_id=${selectedEstablishment.id}`, { headers: authHeaders })
          .then(res => res.ok ? res.json() : { reservations: [] });
  
        const largeReservationsPromise = fetch(`${API_URL}/api/large-reservations?establishment_id=${selectedEstablishment.id}`, { headers: authHeaders })
          .then(res => res.ok ? res.json() : { reservations: [] });
  
        const [normalData, largeData] = await Promise.all([
          normalReservationsPromise,
          largeReservationsPromise
        ]);
  
        const allReservations = [
          ...(normalData.reservations || []),
          ...(largeData.reservations || [])
        ];
  
        console.log(`✅ Total de reservas carregadas: ${allReservations.length} (Normais: ${normalData.reservations?.length || 0}, Grandes: ${largeData.reservations?.length || 0})`);
        setReservations(allReservations);
  
      } catch (e) {
        console.error('❌ Erro ao carregar um ou mais tipos de reservas:', e);
        setReservations([]);
      }

      // 3. Carregar Walk-ins (com autenticação)
      const walkInsResponse = await fetch(`${API_URL}/api/walk-ins`, { headers: authHeaders });
      if (walkInsResponse.ok) {
        const walkInsData = await walkInsResponse.json();
        setWalkIns(walkInsData.walkIns || []);
      } else {
        console.error('Erro ao carregar walk-ins:', walkInsResponse.statusText);
        setWalkIns([]);
      }

      // 4. Carregar Waitlist (por estabelecimento — cada um tem sua própria fila)
      const waitlistUrl = new URL(`${API_URL}/api/waitlist`);
      waitlistUrl.searchParams.set('establishment_id', String(selectedEstablishment.id));
      const waitlistResponse = await fetch(waitlistUrl.toString(), { headers: authHeaders });
      if (waitlistResponse.ok) {
        const waitlistData = await waitlistResponse.json();
        setWaitlist(waitlistData.waitlist || []);
      } else {
        console.error('Erro ao carregar waitlist:', waitlistResponse.statusText);
        setWaitlist([]);
      }

      // 5. Guest Lists são carregadas separadamente pelo useEffect que monitora selectedMonth
      // Removido daqui para evitar conflitos com o filtro de mês

      // 6. Carregar Reservas de Aniversário
      try {
        console.log('🎂 Carregando reservas de aniversário para o estabelecimento:', selectedEstablishment.id);
        // Assumindo que BirthdayService internamente já lida com o token. Se não, a chamada precisa ser ajustada também.
        const birthdayData = await BirthdayService.getBirthdayReservationsByEstablishment(selectedEstablishment.id);
        setBirthdayReservations(birthdayData);
      } catch (error) {
        console.error('❌ Erro ao carregar reservas de aniversário:', error);
        setBirthdayReservations([]);
      }

    } catch (error) {
      console.error('Erro geral ao carregar dados do estabelecimento:', error);
      setReservations([]);
      setWalkIns([]);
      setWaitlist([]);
    }
  }, [selectedEstablishment, API_URL]);

  // Carregar dados imediatamente quando um estabelecimento é selecionado
  useEffect(() => {
    if (selectedEstablishment) {
      if (loadEstablishmentData) {
        console.log(`🔄 [RESTAURANT RESERVATIONS] Estabelecimento selecionado detectado: ${selectedEstablishment.id} - ${selectedEstablishment.name}`);
        console.log(`🔄 [RESTAURANT RESERVATIONS] Iniciando carregamento de dados...`);
        loadEstablishmentData();
      } else {
        console.warn(`⚠️ [RESTAURANT RESERVATIONS] Estabelecimento selecionado mas loadEstablishmentData ainda não está disponível. Aguardando...`);
      }
    }
  }, [selectedEstablishment, loadEstablishmentData]);
  
  // Efeito adicional para garantir carregamento quando loadEstablishmentData for criado
  useEffect(() => {
    if (selectedEstablishment && loadEstablishmentData && !loading) {
      console.log(`🔄 [RESTAURANT RESERVATIONS] loadEstablishmentData disponível, verificando se precisa carregar dados...`);
      // Verificar se já há dados carregados (se não houver, carregar)
      if (reservations.length === 0 && walkIns.length === 0 && waitlist.length === 0) {
        console.log(`🔄 [RESTAURANT RESERVATIONS] Nenhum dado carregado ainda, iniciando carregamento...`);
        loadEstablishmentData();
      }
    }
  }, [loadEstablishmentData, loading]);

  // Atualizar dados em tempo real
  useEffect(() => {
    if (selectedEstablishment) {
      const interval = setInterval(() => {
        loadEstablishmentData();
      }, 30000); // Atualizar a cada 30 segundos

      return () => clearInterval(interval);
    }
    return undefined;
  }, [selectedEstablishment, loadEstablishmentData]);

  // Handlers para Reservas
  const handleDateSelect = (date: Date, dateReservations: Reservation[]) => {
    setSelectedDate(date);
  };

  const handleAddReservation = async (date: Date) => {
    setSelectedDate(date);
    setEditingReservation(null);
    await loadAreas();
    // Só checa capacidade aqui (sem hora). Trava por lista de espera é feita no submit, com dia+hora.
    const canMakeReservation = await checkCapacityAndWaitlist(date);
    if (!canMakeReservation) {
      handleAddWaitlistEntry();
      return;
    }
    setShowModal(true);
  };

  // Verifica capacidade e, se time for informado, trava só para aquele dia+hora (lista de espera por estabelecimento)
  const checkCapacityAndWaitlist = async (
    date: Date,
    newReservationPeople?: number,
    reservationTime?: string
  ): Promise<boolean> => {
    try {
      const totalCapacity = areas.reduce((sum, area) => sum + area.capacity_dinner, 0);
      const dateString = date.toISOString().split('T')[0];
      const activeReservations = reservations.filter(reservation => {
        const reservationDate = (() => {
          if (!reservation.reservation_date) return '';
          try {
            const dateStr = String(reservation.reservation_date).trim();
            if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return '';
            const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
          } catch {
            return '';
          }
        })();
        return reservationDate === dateString &&
          (reservation.status === 'confirmed' || reservation.status === 'checked-in');
      });
      const totalPeopleReserved = activeReservations.reduce((sum, r) => sum + r.number_of_people, 0);
      const totalWithNew = totalPeopleReserved + (newReservationPeople || 0);

      // Trava por waitlist apenas para o mesmo estabelecimento + mesmo dia + mesma hora
      let hasWaitlistEntries = false;
      if (reservationTime && String(reservationTime).trim()) {
        const t = String(reservationTime).trim();
        const hhmm = t.length >= 5 ? t.substring(0, 5) : t;
        hasWaitlistEntries = waitlist.some(entry => {
          if (entry.status !== 'AGUARDANDO') return false;
          const eid = entry.establishment_id;
          const matchEst = eid != null && Number(eid) === Number(selectedEstablishment?.id);
          if (!matchEst) return false;
          if (entry.preferred_date !== dateString) return false;
          const pt = (entry.preferred_time || '').trim();
          if (!pt) return false;
          const ptHhmm = pt.length >= 5 ? pt.substring(0, 5) : pt;
          return ptHhmm === hhmm || pt === t || pt === hhmm || pt === (hhmm + ':00');
        });
      }

      if (hasWaitlistEntries || totalWithNew > totalCapacity) {
        const msg = hasWaitlistEntries
          ? 'Há clientes na lista de espera para este dia e horário. Utilize a lista de espera ou escolha outro horário.'
          : `Capacidade insuficiente. Restam ${totalCapacity - totalPeopleReserved} lugares.`;
        alert(msg);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erro ao verificar capacidade:', error);
      return true;
    }
  };

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setShowModal(true);
  };

  const handleDeleteReservation = async (reservation: Reservation) => {
    if (confirm(`Tem certeza que deseja cancelar e excluir completamente a reserva de ${reservation.client_name}? Isso liberará a mesa e o dia da reserva.`)) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/api/restaurant-reservations/${reservation.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (response.ok) {
          // Remover do estado local
          setReservations(prev => prev.filter(r => r.id !== reservation.id));
          alert(`Reserva de ${reservation.client_name} cancelada e excluída com sucesso!`);
          console.log('✅ Reserva excluída com sucesso:', reservation.id);
          
          // Recarregar dados para garantir sincronização
          await loadEstablishmentData();
        } else {
          const errorData = await response.json();
          console.error('❌ Erro ao excluir reserva:', errorData);
          alert('Erro ao excluir reserva: ' + (errorData.error || 'Erro desconhecido'));
        }
      } catch (error) {
        console.error('❌ Erro ao excluir reserva:', error);
        alert('Erro ao excluir reserva. Tente novamente.');
      }
    }
  };

  const handleStatusChange = async (reservation: Reservation, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/api/restaurant-reservations/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setReservations(prev => 
          prev.map(r => 
            r.id === reservation.id ? { ...r, status: newStatus as any } : r
          )
        );
      } else {
        const errorData = await response.json();
        console.error('Erro ao atualizar status da reserva:', errorData);
        alert('Erro ao atualizar status da reserva: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao atualizar status da reserva:', error);
      alert('Erro ao atualizar status da reserva. Tente novamente.');
    }
  };


  // Função para fazer check-in de uma reserva
  const handleCheckIn = async (reservation: Reservation) => {
    try {
      const response = await fetch(`${API_URL}/api/restaurant-reservations/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'checked-in',
          check_in_time: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setReservations(prev => 
          prev.map(r => 
            r.id === reservation.id ? { ...r, status: 'checked-in' as any } : r
          )
        );
        alert(`Check-in realizado para ${reservation.client_name}!`);
      } else {
        const errorData = await response.json();
        console.error('Erro ao fazer check-in:', errorData);
        alert('Erro ao fazer check-in: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao fazer check-in:', error);
      alert('Erro ao fazer check-in. Tente novamente.');
    }
  };

  // Função para fazer check-out de uma reserva
  const handleCheckOut = async (reservation: Reservation) => {
    try {
      const response = await fetch(`${API_URL}/api/restaurant-reservations/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          check_out_time: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setReservations(prev => 
          prev.map(r => 
            r.id === reservation.id ? { ...r, status: 'completed' as any } : r
          )
        );
        
        // Após check-out, verificar lista de espera e mostrar popup de confirmação
        await releaseTableAndCheckWaitlistWithConfirmation(reservation);
      } else {
        const errorData = await response.json();
        console.error('Erro ao fazer check-out:', errorData);
        alert('Erro ao fazer check-out: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao fazer check-out:', error);
      alert('Erro ao fazer check-out. Tente novamente.');
    }
  };

  // Função para verificar se há reservas de aniversário em uma data específica
  const getBirthdayReservationsForDate = (date: Date): BirthdayReservation[] => {
    const dateString = date.toISOString().split('T')[0];
    return birthdayReservations.filter(birthday => {
      const birthdayDate = new Date(birthday.data_aniversario).toISOString().split('T')[0];
      return birthdayDate === dateString;
    });
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') return 'Data não informada';
    try {
      const date = new Date(dateString + 'T12:00:00');
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Função para formatar hora
  const formatTime = (timeString?: string) => {
    if (!timeString || timeString.trim() === '') return '';
    try {
      return timeString.slice(0, 5);
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return '';
    }
  };

  // Função para calcular tempo de espera estimado
  const calculateWaitTime = (createdAt: string): number => {
    const now = new Date();
    const entryTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - entryTime.getTime()) / (1000 * 60));
    return Math.max(0, diffInMinutes);
  };

  // Função auxiliar para detectar se é Seu Justino
  const isSeuJustino = selectedEstablishment && (
    (selectedEstablishment.name || '').toLowerCase().includes('seu justino') && 
    !(selectedEstablishment.name || '').toLowerCase().includes('pracinha')
  );

  // Função helper para mapear mesa -> área do Seu Justino
  const getSeuJustinoAreaName = useCallback((tableNumber?: string | number, areaName?: string, areaId?: number): string => {
    if (!isSeuJustino) return areaName || '';
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
  }, [isSeuJustino]);

  // Função para determinar o giro de uma reserva (apenas para Seu Justino aos sábados)
  const getGiroFromTime = (timeStr: string): '1º Giro' | '2º Giro' | null => {
    if (!isSeuJustino || !timeStr) return null;
    const [hours] = timeStr.split(':').map(Number);
    if (hours >= 12 && hours < 15) return '1º Giro';
    if (hours >= 20 && hours < 23) return '2º Giro';
    return null;
  };

  // Função para verificar se duas reservas estão no mesmo giro
  const isSameGiro = (time1: string, time2: string): boolean => {
    const giro1 = getGiroFromTime(time1);
    const giro2 = getGiroFromTime(time2);
    if (!giro1 || !giro2) return false;
    return giro1 === giro2;
  };

  // Função para verificar se uma mesa está ocupada no mesmo giro
  const isTableOccupiedInSameGiro = (tableNumber: string, reservationDate: string, reservationTime: string): boolean => {
    if (!isSeuJustino) return false;
    const giro = getGiroFromTime(reservationTime);
    if (!giro) return false;

    return reservations.some(r => {
      const rStatus = String(r.status || '').toUpperCase();
      if (rStatus === 'CANCELADA' || rStatus === 'CANCELED' || rStatus === 'COMPLETED') return false;
      if (r.table_number !== tableNumber) return false;
      
      // Verificar se é a mesma data
      const rDate = new Date(r.reservation_date).toISOString().split('T')[0];
      const targetDate = new Date(reservationDate).toISOString().split('T')[0];
      if (rDate !== targetDate) return false;

      // Verificar se está no mesmo giro
      return isSameGiro(r.reservation_time || '', reservationTime);
    });
  };

  // Handlers para Walk-ins
  const handleAddWalkIn = () => {
    setEditingWalkIn(null);
    setShowWalkInModal(true);
  };

  const handleEditWalkIn = (walkIn: WalkIn) => {
    setEditingWalkIn(walkIn);
    setShowWalkInModal(true);
  };

  const handleDeleteWalkIn = (walkIn: WalkIn) => {
    if (confirm(`Tem certeza que deseja excluir o walk-in de ${walkIn.client_name}?`)) {
      setWalkIns(prev => prev.filter(w => w.id !== walkIn.id));
    }
  };

  // Handlers para Waitlist
  const handleAddWaitlistEntry = () => {
    setEditingWaitlistEntry(null);
    setShowWaitlistModal(true);
  };

  const handleEditWaitlistEntry = (entry: WaitlistEntry) => {
    setEditingWaitlistEntry(entry);
    setShowWaitlistModal(true);
  };

  const handleDeleteWaitlistEntry = (entry: WaitlistEntry) => {
    if (confirm(`Tem certeza que deseja excluir ${entry.client_name} da lista de espera?`)) {
      setWaitlist(prev => prev.filter(w => w.id !== entry.id));
    }
  };

  // Funções para check-in
  const handleOwnerCheckIn = async (guestListId: number, ownerName: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Buscar o reservation_id da guest list diretamente dos dados já carregados
      const guestList = guestLists.find(gl => gl.guest_list_id === guestListId);
      if (!guestList) {
        alert('❌ Erro: Lista não encontrada');
        return;
      }

      // Usar o reservation_id da guest list (assumindo que existe)
      const response = await fetch(`${API_URL}/api/restaurant-reservations/${guestListId}/checkin-owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ owner_name: ownerName })
      });

      if (response.ok) {
        setCheckInStatus(prev => ({
          ...prev,
          [guestListId]: {
            ...prev[guestListId],
            ownerCheckedIn: true
          }
        }));
        alert(`✅ Check-in do dono da lista (${ownerName}) confirmado!`);
      } else {
        const errorData = await response.json();
        alert('❌ Erro ao fazer check-in do dono da lista: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro no check-in do dono:', error);
      alert('❌ Erro ao fazer check-in do dono da lista');
    }
  };

  const handleOwnerCheckOut = async (guestListId: number, ownerName: string) => {
    try {
      if (!confirm(`Confirmar check-out de ${ownerName}?`)) return;

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/guest-lists/${guestListId}/owner-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCheckInStatus(prev => ({
          ...prev,
          [guestListId]: {
            ...prev[guestListId],
            ownerCheckedIn: false,
            ownerCheckedOut: true
          }
        }));

        // Após check-out, verificar lista de espera e liberar mesa automaticamente
        const guestList = guestLists.find(gl => gl.guest_list_id === guestListId);
        if (guestList) {
          await releaseTableAndCheckWaitlistWithConfirmation(guestList as any);
        }

        alert(`✅ Check-out de ${ownerName} confirmado! Mesa liberada para outros clientes.`);
        // Recarregar dados para garantir sincronização
        await loadEstablishmentData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert('❌ Erro ao fazer check-out do dono: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro no check-out do dono:', error);
      alert('❌ Erro ao fazer check-out do dono');
    }
  };

  const handleGuestCheckIn = async (guestListId: number, guestId: number, guestName: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/guests/${guestId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Atualizar o estado local imediatamente
        setGuestsByList(prev => ({
          ...prev,
          [guestListId]: (prev[guestListId] || []).map(guest => 
            guest.id === guestId 
              ? { ...guest, checked_in: true, checkin_time: new Date().toISOString() }
              : guest
          )
        }));

        // Atualizar contador de check-ins
        setCheckInStatus(prev => ({
          ...prev,
          [guestListId]: {
            ...prev[guestListId],
            guestsCheckedIn: (prev[guestListId]?.guestsCheckedIn || 0) + 1
          }
        }));

        alert(`✅ Check-in de ${guestName} confirmado!`);
      } else {
        const errorData = await response.json();
        alert('❌ Erro ao fazer check-in do convidado: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro no check-in do convidado:', error);
      alert('❌ Erro ao fazer check-in do convidado');
    }
  };

  // Função para fazer check-out de um convidado
  const handleGuestCheckOut = async (guestListId: number, guestId: number, guestName: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/guests/${guestId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Atualizar o estado local imediatamente
        setGuestsByList(prev => ({
          ...prev,
          [guestListId]: (prev[guestListId] || []).map(guest => 
            guest.id === guestId 
              ? { 
                  ...guest, 
                  checked_in: false, 
                  checked_out: true, 
                  checkout_time: data.guest?.checkout_time || new Date().toISOString() 
                }
              : guest
          )
        }));

        // Atualizar contador de check-ins (diminuir)
        setCheckInStatus(prev => ({
          ...prev,
          [guestListId]: {
            ...prev[guestListId],
            guestsCheckedIn: Math.max(0, (prev[guestListId]?.guestsCheckedIn || 1) - 1)
          }
        }));

        // Recarregar dados para garantir sincronização
        await loadEstablishmentData();
        
        alert(`✅ Check-out de ${guestName} confirmado!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert('❌ Erro ao fazer check-out do convidado: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro no check-out do convidado:', error);
      alert('❌ Erro ao fazer check-out do convidado');
    }
  };

  const handleCallCustomer = (entry: WaitlistEntry) => {
    setWaitlist(prev => 
      prev.map(w => 
        w.id === entry.id ? { ...w, status: 'CHAMADO' as any } : w
      )
    );
  };

  // Função para liberar mesa e verificar lista de espera
  const releaseTableAndCheckWaitlist = async (reservation?: Reservation) => {
    try {
      const dateString = (() => {
        if (reservation?.reservation_date) {
          try {
            const dateStr = String(reservation.reservation_date).trim();
            if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return '';
            const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
          } catch {
            return '';
          }
        }
        if (selectedDate) return selectedDate.toISOString().split('T')[0];
        return new Date().toISOString().split('T')[0];
      })();
      const reservationTime = reservation?.reservation_time || '';

      // Lista de espera por estabelecimento: só este estab, mesmo dia+hora
      const t = String(reservationTime).trim();
      const hhmm = t.length >= 5 ? t.substring(0, 5) : t;
      const waitingEntries = waitlist.filter(entry => {
        if (entry.status !== 'AGUARDANDO') return false;
        if (entry.establishment_id == null || Number(entry.establishment_id) !== Number(selectedEstablishment?.id)) return false;
        if (entry.preferred_date !== dateString) return false;
        const pt = (entry.preferred_time || '').trim();
        if (!pt) return false;
        const ptHhmm = pt.length >= 5 ? pt.substring(0, 5) : pt;
        return ptHhmm === hhmm || pt === t || pt === hhmm || pt === (hhmm + ':00');
      });
      
      if (waitingEntries.length > 0) {
        // Encontrar a entrada mais antiga (menor position)
        const oldestEntry = waitingEntries.reduce((oldest, current) => 
          current.position < oldest.position ? current : oldest
        );
        
        // Atualizar status para CHAMADO
        const response = await fetch(`${API_URL}/api/waitlist/${oldestEntry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'CHAMADO'
          }),
        });

        if (response.ok) {
          setWaitlist(prev => 
            prev.map(w => 
              w.id === oldestEntry.id ? { ...w, status: 'CHAMADO' as any } : w
            )
          );
          
          // Exibir notificação para o admin
          alert(`Mesa disponível! Chamar cliente da fila: ${oldestEntry.client_name} (${oldestEntry.number_of_people} pessoas)`);
        } else {
          console.error('Erro ao atualizar status da lista de espera');
        }
      } else {
        console.log('Lista de espera vazia - mesa disponível para novas reservas');
      }
    } catch (error) {
      console.error('Erro ao verificar lista de espera:', error);
    }
  };

  // Nova função aprimorada para liberar mesa com popup de confirmação e conversão automática
  const releaseTableAndCheckWaitlistWithConfirmation = async (reservation: Reservation) => {
    try {
      const tableNumber = (reservation as any).table_number || '';
      const dateString = (() => {
        if (reservation?.reservation_date) {
          try {
            const dateStr = String(reservation.reservation_date).trim();
            if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return '';
            const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
          } catch {
            return '';
          }
        }
        if (selectedDate) return selectedDate.toISOString().split('T')[0];
        return new Date().toISOString().split('T')[0];
      })();
      const reservationTime = reservation?.reservation_time || '';

      // Buscar clientes na lista de espera (mesmo estabelecimento, mesma data, horário compatível ou sem horário específico)
      const waitingEntries = waitlist.filter(entry => {
        if (entry.status !== 'AGUARDANDO') return false;
        if (entry.establishment_id == null || Number(entry.establishment_id) !== Number(selectedEstablishment?.id)) return false;
        if (entry.preferred_date !== dateString) return false;
        
        // Se tiver horário preferido, verificar se está no mesmo giro (para Seu Justino) ou horário compatível
        if (entry.preferred_time) {
          if (isSeuJustino) {
            // Para Seu Justino, verificar se está no mesmo giro
            return isSameGiro(entry.preferred_time, reservationTime);
          } else {
            // Para outros estabelecimentos, verificar se o horário é próximo (dentro de 1 hora)
            const entryTime = entry.preferred_time.split(':').map(Number);
            const resTime = reservationTime.split(':').map(Number);
            const entryMinutes = entryTime[0] * 60 + entryTime[1];
            const resMinutes = resTime[0] * 60 + resTime[1];
            return Math.abs(entryMinutes - resMinutes) <= 60;
          }
        }
        // Se não tiver horário preferido, considerar compatível
        return true;
      });

      if (waitingEntries.length > 0) {
        // Encontrar a entrada mais antiga (menor position)
        const oldestEntry = waitingEntries.reduce((oldest, current) => 
          current.position < oldest.position ? current : oldest
        );
        
        // Mostrar popup de confirmação
        const confirmed = confirm(
          `Mesa ${tableNumber} disponível.\n\n` +
          `Deseja alocar o próximo cliente da lista (${oldestEntry.client_name}) nesta mesa?\n\n` +
          `Cliente: ${oldestEntry.client_name}\n` +
          `Pessoas: ${oldestEntry.number_of_people}\n` +
          `Horário preferido: ${oldestEntry.preferred_time || 'Qualquer horário'}`
        );

        if (confirmed) {
          // Converter entrada da lista de espera em reserva ativa
          try {
            const token = localStorage.getItem('authToken');
            const reservationPayload = {
              client_name: oldestEntry.client_name,
              client_phone: oldestEntry.client_phone || null,
              client_email: oldestEntry.client_email || null,
              reservation_date: dateString,
              reservation_time: oldestEntry.preferred_time || reservationTime,
              number_of_people: oldestEntry.number_of_people,
              area_id: (oldestEntry as any).preferred_area_id || reservation.area_id,
              table_number: tableNumber,
              status: 'CONFIRMADA',
              origin: 'LISTA_ESPERA',
              notes: `Convertido da lista de espera (ID: ${oldestEntry.id})`,
              establishment_id: selectedEstablishment?.id,
              created_by: 1
            };

            const createReservationResponse = await fetch(`${API_URL}/api/restaurant-reservations`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(reservationPayload)
            });

            if (createReservationResponse.ok) {
              const newReservation = await createReservationResponse.json();
              
              // Atualizar status da lista de espera para ATENDIDO
              const updateWaitlistResponse = await fetch(`${API_URL}/api/waitlist/${oldestEntry.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                  status: 'ATENDIDO'
                }),
              });

              if (updateWaitlistResponse.ok) {
                // Atualizar estados locais
                setWaitlist(prev => 
                  prev.map(w => 
                    w.id === oldestEntry.id ? { ...w, status: 'ATENDIDO' as any } : w
                  )
                );
                
                // Recarregar reservas para incluir a nova
                await loadEstablishmentData();
                
                alert(`✅ Cliente ${oldestEntry.client_name} alocado na Mesa ${tableNumber} com sucesso!`);
              } else {
                console.error('Erro ao atualizar status da lista de espera');
                alert(`⚠️ Reserva criada, mas houve erro ao atualizar a lista de espera.`);
              }
            } else {
              const errorData = await createReservationResponse.json().catch(() => ({}));
              throw new Error(errorData.error || 'Erro ao criar reserva');
            }
          } catch (error: any) {
            console.error('Erro ao converter lista de espera em reserva:', error);
            alert(`Erro ao alocar cliente: ${error?.message || 'Erro desconhecido'}`);
          }
        }
      } else {
        console.log('Lista de espera vazia - mesa disponível para novas reservas');
      }
    } catch (error) {
      console.error('Erro ao verificar lista de espera:', error);
    }
  };

  // Função para alocar cliente da lista de espera em uma mesa específica
  const handleAllocateWaitlistToTable = async (entry: WaitlistEntry, tableNumber: string, areaId?: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const dateString = entry.preferred_date || new Date().toISOString().split('T')[0];
      const reservationTime = entry.preferred_time || '12:00:00';

      const reservationPayload = {
        client_name: entry.client_name,
        client_phone: entry.client_phone || null,
        client_email: entry.client_email || null,
        reservation_date: dateString,
        reservation_time: reservationTime,
        number_of_people: entry.number_of_people,
        area_id: areaId || (entry as any).preferred_area_id || 1,
        table_number: tableNumber,
        status: 'CONFIRMADA',
        origin: 'LISTA_ESPERA',
        notes: `Alocado da lista de espera (ID: ${entry.id})`,
        establishment_id: selectedEstablishment?.id,
        created_by: 1
      };

      const createReservationResponse = await fetch(`${API_URL}/api/restaurant-reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(reservationPayload)
      });

      if (createReservationResponse.ok) {
        // Atualizar status da lista de espera para ATENDIDO
        const updateWaitlistResponse = await fetch(`${API_URL}/api/waitlist/${entry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            status: 'ATENDIDO'
          }),
        });

        if (updateWaitlistResponse.ok) {
          setWaitlist(prev => 
            prev.map(w => 
              w.id === entry.id ? { ...w, status: 'ATENDIDO' as any } : w
            )
          );
          
          await loadEstablishmentData();
          alert(`✅ Cliente ${entry.client_name} alocado na Mesa ${tableNumber} com sucesso!`);
        } else {
          alert(`⚠️ Reserva criada, mas houve erro ao atualizar a lista de espera.`);
        }
      } else {
        const errorData = await createReservationResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao criar reserva');
      }
    } catch (error: any) {
      console.error('Erro ao alocar cliente da lista de espera:', error);
      alert(`Erro ao alocar cliente: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const tabs = [
    { id: 'reservations', label: 'Reservas', icon: MdRestaurant },
    { id: 'walk-ins', label: 'Passantes', icon: MdPeople },
    { id: 'waitlist', label: 'Lista de Espera', icon: MdSchedule },
    { id: 'guest-lists', label: 'Lista de Convidados', icon: MdPeople },
    { id: 'reports', label: 'Relatórios', icon: MdBarChart },
    { id: 'settings', label: 'Configurações', icon: MdSettings }
  ];

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.client_phone?.includes(searchTerm) ||
                         reservation.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por giro (apenas para Seu Justino aos sábados)
    if (isSeuJustino && giroFilter !== 'all') {
      const reservationDate = new Date(reservation.reservation_date);
      const isSaturday = reservationDate.getDay() === 6; // 6 = Sábado
      
      if (isSaturday) {
        const giro = getGiroFromTime(reservation.reservation_time || '');
        if (giro !== giroFilter) return false;
      } else {
        // Se não for sábado, não aplicar filtro de giro (só existe giro aos sábados)
        // Não precisa fazer nada aqui, pois giro será null e não vai filtrar
      }
    }
    
    return matchesSearch;
  });

  const activeWalkIns = walkIns.filter(walkIn => walkIn.status === 'ATIVO');
  const activeWaitlist = waitlist.filter(entry => entry.status === 'AGUARDANDO');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando estabelecimentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Erro ao carregar estabelecimentos</p>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={fetchEstablishments}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header da página */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Admin / Sistema de Reservas
          </h2>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-2">Sistema de Reservas do Restaurante</h1>
          <p className="text-gray-400 text-sm sm:text-base lg:text-lg mt-2">Gerencie reservas, passantes e lista de espera de forma integrada</p>
        </div>

        {/* Seleção de Estabelecimento */}
        {!selectedEstablishment && !loading && !establishmentPermissions.isRestrictedToSingleEstablishment() && establishments.length > 1 ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Selecione o Estabelecimento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 admin-grid-4">
              {establishmentPermissions.getFilteredEstablishments(establishments).map((establishment) => (
                <button
                  key={establishment.id}
                  onClick={() => handleEstablishmentSelect(establishment)}
                  className="p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg border-gray-200 bg-white hover:border-gray-300"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center relative">
                      <span className="text-2xl font-bold text-gray-600">
                        {establishment.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {establishment.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {establishment.address}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : selectedEstablishment ? (
          <>
            {/* Estabelecimento Selecionado */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-600">
                      {selectedEstablishment.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedEstablishment.name}
                    </h2>
                    <p className="text-gray-600">{selectedEstablishment.address}</p>
                  </div>
                </div>
                {/* Só mostrar botão de fechar se não estiver restrito a um único estabelecimento */}
                {!establishmentPermissions.isRestrictedToSingleEstablishment() && establishments.length > 1 && (
                  <button
                    onClick={() => setSelectedEstablishment(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MdClose size={24} />
                  </button>
                )}
              </div>
            </div>

            {/* Navegação por Abas */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 mb-8">
              <div className="flex border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-yellow-600 border-b-2 border-yellow-600 bg-yellow-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={20} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conteúdo das Abas */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-6">

              {/* Aba de Reservas */}
              {activeTab === 'reservations' && (
                <div>
                  {/* Controles da Aba Reservas */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('calendar')}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            viewMode === 'calendar'
                              ? 'bg-white text-gray-800 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Calendário
                        </button>
                        <button
                          onClick={() => setViewMode('weekly')}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            viewMode === 'weekly'
                              ? 'bg-white text-gray-800 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Semanal
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            viewMode === 'list'
                              ? 'bg-white text-gray-800 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Lista
                        </button>
                        <button
                          onClick={() => setViewMode('sheet')}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            viewMode === 'sheet'
                              ? 'bg-white text-gray-800 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Planilha
                        </button>
                      </div>
                      
                      {/* Filtros de Giro (apenas para Seu Justino) */}
                      {isSeuJustino && (
                        <div className="flex bg-orange-100 rounded-lg p-1 border border-orange-300">
                          <button
                            onClick={() => setGiroFilter('all')}
                            className={`px-4 py-2 rounded-md transition-colors text-sm ${
                              giroFilter === 'all'
                                ? 'bg-orange-500 text-white shadow-sm font-medium'
                                : 'text-orange-700 hover:text-orange-900'
                            }`}
                          >
                            Todos os Giros
                          </button>
                          <button
                            onClick={() => setGiroFilter('1º Giro')}
                            className={`px-4 py-2 rounded-md transition-colors text-sm ${
                              giroFilter === '1º Giro'
                                ? 'bg-orange-500 text-white shadow-sm font-medium'
                                : 'text-orange-700 hover:text-orange-900'
                            }`}
                          >
                            1º Giro (12h-15h)
                          </button>
                          <button
                            onClick={() => setGiroFilter('2º Giro')}
                            className={`px-4 py-2 rounded-md transition-colors text-sm ${
                              giroFilter === '2º Giro'
                                ? 'bg-orange-500 text-white shadow-sm font-medium'
                                : 'text-orange-700 hover:text-orange-900'
                            }`}
                          >
                            2º Giro (20h-23h)
                          </button>
                        </div>
                      )}
                      
                      {/* Indicador de Ocupação */}
                      {selectedDate && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="flex items-center gap-2">
                            <MdBarChart className="text-blue-600" size={20} />
                            <div className="text-sm">
                              <span className="text-blue-800 font-medium">Ocupação:</span>
                              <span className="text-blue-600 ml-1">
                                {(() => {
                                  const totalCapacity = areas.reduce((sum, area) => sum + area.capacity_dinner, 0);
                                  const dateString = selectedDate.toISOString().split('T')[0];
                                  const activeReservations = reservations.filter(reservation => {
                                    const reservationDate = (() => {
          if (!reservation.reservation_date) return '';
          try {
            const dateStr = String(reservation.reservation_date).trim();
            if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return '';
            
            let date;
            if (dateStr.includes('T')) {
              date = new Date(dateStr);
            } else {
              date = new Date(dateStr + 'T12:00:00');
            }
            
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
          } catch (error) {
            console.error('Error converting reservation date:', reservation.reservation_date, error);
            return '';
          }
        })();
                                    return reservationDate === dateString && 
                                           (reservation.status === 'confirmed' || reservation.status === 'checked-in');
                                  });
                                  const totalPeopleReserved = activeReservations.reduce((sum, reservation) => 
                                    sum + reservation.number_of_people, 0
                                  );
                                  const occupancyPercentage = totalCapacity > 0 ? Math.round((totalPeopleReserved / totalCapacity) * 100) : 0;
                                  return `${totalPeopleReserved}/${totalCapacity} (${occupancyPercentage}%)`;
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                      <div className="relative w-full sm:w-auto">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Buscar reservas..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent w-full"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          // Carregar áreas se ainda não foram carregadas
                          await loadAreas();
                          setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors w-full sm:w-auto justify-center"
                      >
                        <MdAdd />
                        Nova Reserva
                      </button>
                    </div>
                  </div>

                  {/* Visualização do Calendário */}
                  {viewMode === 'calendar' && (
                    <div className="mb-8">
                      <ReservationCalendar
                        establishment={selectedEstablishment}
                        reservations={reservations}
                        onDateSelect={handleDateSelect}
                        onAddReservation={handleAddReservation}
                        onEditReservation={handleEditReservation}
                        onDeleteReservation={handleDeleteReservation}
                        onStatusChange={handleStatusChange}
                        onAddGuestList={(reservation) => {
                          setSelectedReservationForGuestList(reservation);
                          setShowAddGuestListModal(true);
                        }}
                        birthdayReservations={birthdayReservations}
                      />
                    </div>
                  )}

                  {/* Visualização Semanal */}
                  {viewMode === 'weekly' && (
                    <div className="mb-8">
                      <WeeklyCalendar
                        reservations={reservations}
                        establishment={selectedEstablishment}
                        onAddReservation={async (date, time) => {
                          setSelectedDate(date);
                          setSelectedTime(time);
                          setEditingReservation(null);
                          await loadAreas();
                          // Com horário: checa capacidade + trava por lista de espera só neste dia+hora
                          const canMakeReservation = await checkCapacityAndWaitlist(date, undefined, time ?? undefined);
                          if (!canMakeReservation) {
                            handleAddWaitlistEntry();
                            return;
                          }
                          setShowModal(true);
                        }}
                        onEditReservation={handleEditReservation}
                        onDeleteReservation={handleDeleteReservation}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  )}

                  {/* Lista de Reservas */}
                  {viewMode === 'list' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredReservations.map((reservation) => (
                        <motion.div
                          key={reservation.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {reservation.notes && reservation.notes.includes('🎂') && (
                                  <span className="text-xl flex-shrink-0">🎂</span>
                                )}
                                <h4 className="font-semibold text-gray-800 truncate">{reservation.client_name}</h4>
                              </div>
                              <p className="text-sm text-gray-500">{reservation.reservation_date} às {reservation.reservation_time}</p>
                              {reservation.notes && reservation.notes.includes('🎂') && (
                                <p className="text-xs text-pink-600 font-medium mt-1">Reserva de Aniversário</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                              reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              reservation.status === 'checked-in' ? 'bg-blue-100 text-blue-800' :
                              reservation.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {reservation.status === 'confirmed' ? 'Confirmada' :
                               reservation.status === 'checked-in' ? 'Check-in' :
                               reservation.status === 'completed' ? 'Finalizada' :
                               reservation.status === 'pending' ? 'Pendente' : 'Cancelada'}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MdPeople className="text-gray-400" />
                              <span>{reservation.number_of_people} pessoas</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MdRestaurant className="text-gray-400" />
                              <span>{getSeuJustinoAreaName(reservation.table_number, reservation.area_name, reservation.area_id)}</span>
                            </div>
                            {reservation.client_phone && (
                              <div className="flex items-center gap-2">
                                <MdPhone className="text-gray-400" />
                                <span>{reservation.client_phone}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            {reservation.status === 'confirmed' && (
                              <button
                                onClick={() => handleCheckIn(reservation)}
                                className="flex-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
                              >
                                Check-in
                              </button>
                            )}
                            {reservation.status === 'checked-in' && (
                              <button
                                onClick={() => handleCheckOut(reservation)}
                                className="flex-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded transition-colors"
                              >
                                Check-out
                              </button>
                            )}
                            <button
                              onClick={() => handleEditReservation(reservation)}
                              className="flex-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteReservation(reservation)}
                              className="flex-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                            >
                              Excluir
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Planilha (estilo Excel) */}
                  {viewMode === 'sheet' && (
                    <div className="space-y-8">
                      {/* Filtros superiores (globais) */}
                      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Data</label>
                            <input
                              type="date"
                              value={sheetFilters.date || ''}
                              onChange={(e) => setSheetFilters(prev => ({ ...prev, date: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm text-gray-600 mb-1">Buscar</label>
                            <input
                              type="text"
                              placeholder="Nome, telefone, evento..."
                              value={sheetFilters.search || ''}
                              onChange={(e) => setSheetFilters(prev => ({ ...prev, search: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSheetFilters({})}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                          >
                            Limpar Filtros
                          </button>
                          <button
                            onClick={async () => {
                              await loadAreas();
                              setShowModal(true);
                            }}
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                          >
                            <MdAdd className="inline mr-1" /> Nova Reserva
                          </button>
                        </div>
                      </div>

                      {(() => {
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

                        const areaSections: Array<{ key: string; title: string; tableWhitelist?: string[] }> = [
                          { key: 'deck', title: 'Deck', tableWhitelist: ['01','02','03','04','05','06','07','08','09','10','11','12'] },
                          { key: 'bar', title: 'Bar Central', tableWhitelist: ['11','12','13','14'] },
                          { key: 'balada', title: 'Balada' },
                          { key: 'rooftop', title: 'Rooftop', tableWhitelist: ['40','41','42','44','45','46','47','60','61','62','63','64','65','50','51','52','53','54','55','56','70','71','72','73'] },
                        ];

                        const getAreaKeyFromReservation = (r: Reservation): string => {
                          const tableNum = String((r as any).table_number || '').padStart(2,'0');
                          const areaName = (r as any).area_name?.toLowerCase() || '';
                          if (['40','41','42','44','45','46','47','60','61','62','63','64','65','50','51','52','53','54','55','56','70','71','72','73'].includes(tableNum) || areaName.includes('roof')) return 'rooftop';
                          if (['01','02','03','04','05','06','07','08','09','10','11','12'].includes(tableNum) || areaName.includes('deck')) return 'deck';
                          if (['11','12','13','14'].includes(tableNum) || areaName.includes('bar')) return 'bar';
                          if (areaName.includes('balada')) return 'balada';
                          return 'deck';
                        };

                        const displayTableLabel = (tableNum?: string | number, areaKey?: string) => {
                          const n = String(tableNum || '').padStart(2,'0');
                          if (areaKey === 'deck') {
                            if (['01','02','03','04'].includes(n)) return `Lounge ${parseInt(n,10)}`;
                            if (['05','06','07','08'].includes(n)) return `Lounge ${parseInt(n,10)}`;
                            if (['09','10','11','12'].includes(n)) return `Mesa ${n}`;
                          }
                          if (areaKey === 'bar') {
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

                        const openEdit = (res?: Reservation) => {
                          setEditingReservation(res || null);
                          setShowModal(true);
                        };

                        const SectionTable = ({ sectionKey, title, whitelist }: { sectionKey: string; title: string; whitelist?: string[] }) => {
                          const rows = filteredReservations
                            .filter(r => matchesFilters(r))
                            .filter(r => getAreaKeyFromReservation(r) === sectionKey)
                            .sort((a,b) => a.reservation_time.localeCompare(b.reservation_time));

                          return (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
                              <div className="overflow-x-auto border border-gray-300 rounded-lg">
                                <table className="min-w-full table-fixed border-collapse">
                                  <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr className="text-[11px] uppercase text-gray-600">
                                      <th className="w-10 border border-gray-300 px-2 py-1 text-left">#</th>
                                      <th className="border border-gray-300 px-2 py-1 text-left">Data de Entrada</th>
                                      <th className="border border-gray-300 px-2 py-1 text-left">Evento</th>
                                      <th className="border border-gray-300 px-2 py-1 text-left">Nome</th>
                                      <th className="border border-gray-300 px-2 py-1 text-left">Mesas</th>
                                      <th className="border border-gray-300 px-2 py-1 text-left">Telefone</th>
                                      <th className="border border-gray-300 px-2 py-1 text-left">Observação</th>
                                      <th className="border border-gray-300 px-2 py-1 text-left">Limite por mesa</th>
                                      <th className="border border-gray-300 px-2 py-1 text-left">Nº pessoas</th>
                                      <th className="border border-gray-300 px-2 py-1 text-left">Presença</th>
                                    </tr>
                                    <tr className="bg-white text-[12px]">
                                      <th className="w-10 border border-gray-300 px-2 py-1 text-gray-400 font-normal">&nbsp;</th>
                                      <th className="border border-gray-300 px-2 py-1 text-gray-600">
                                        <input type="date" value={sheetFilters.date || ''} onChange={(e)=>setSheetFilters(p=>({...p, date:e.target.value}))} className="w-full text-xs border-gray-200 rounded" />
                                      </th>
                                      <th className="border border-gray-300 px-2 py-1">
                                        <input placeholder="Filtrar evento" value={sheetFilters.event || ''} onChange={(e)=>setSheetFilters(p=>({...p, event:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                      </th>
                                      <th className="border border-gray-300 px-2 py-1">
                                        <input placeholder="Filtrar nome" value={sheetFilters.name || ''} onChange={(e)=>setSheetFilters(p=>({...p, name:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                      </th>
                                      <th className="border border-gray-300 px-2 py-1">
                                        <input placeholder="Filtrar mesa" value={sheetFilters.table || ''} onChange={(e)=>setSheetFilters(p=>({...p, table:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                      </th>
                                      <th className="border border-gray-300 px-2 py-1">
                                        <input placeholder="Filtrar telefone" value={sheetFilters.phone || ''} onChange={(e)=>setSheetFilters(p=>({...p, phone:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                      </th>
                                      <th className="border border-gray-300 px-2 py-1">
                                        <input placeholder="Filtrar observação" value={sheetFilters.search || ''} onChange={(e)=>setSheetFilters(p=>({...p, search:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                      </th>
                                      <th className="border border-gray-300 px-2 py-1 text-gray-400 font-normal">&nbsp;</th>
                                      <th className="border border-gray-300 px-2 py-1 text-gray-400 font-normal">&nbsp;</th>
                                      <th className="border border-gray-300 px-2 py-1">
                                        <input placeholder="status" value={sheetFilters.status || ''} onChange={(e)=>setSheetFilters(p=>({...p, status:e.target.value}))} className="w-full text-xs border-gray-200 rounded px-1 py-0.5" />
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((r, idx) => (
                                      <tr key={r.id} className="hover:bg-yellow-50">
                                        <td className="border border-gray-300 px-2 py-1 text-[12px] text-gray-500">{idx + 1}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-sm text-gray-700 whitespace-nowrap">
                                          {formatDate(r.reservation_date)} {formatTime(r.reservation_time)}
                                          <button onClick={() => openEdit(r)} className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">+</button>
                                        </td>
                                        <td className="border border-gray-300 px-2 py-1 text-sm text-gray-700">
                                          {(r as any).event_name || '-'}
                                          <button onClick={() => openEdit(r)} className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">+</button>
                                        </td>
                                        <td className="border border-gray-300 px-2 py-1 text-sm text-gray-700">
                                          {r.client_name}
                                          <button onClick={() => openEdit(r)} className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">+</button>
                                        </td>
                                        <td className="border border-gray-300 px-2 py-1 text-sm text-gray-700">
                                          {displayTableLabel((r as any).table_number, sectionKey)}
                                          <button onClick={() => openEdit(r)} className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">+</button>
                                        </td>
                                        <td className="border border-gray-300 px-2 py-1 text-sm text-gray-700 whitespace-nowrap">
                                          {r.client_phone || '-'}
                                          <button onClick={() => openEdit(r)} className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">+</button>
                                        </td>
                                        <td className="border border-gray-300 px-2 py-1 text-sm text-gray-700">
                                          {r.notes || '-'}
                                          <button onClick={() => openEdit(r)} className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">+</button>
                                        </td>
                                        <td className="border border-gray-300 px-2 py-1 text-sm text-gray-700 text-center">
                                          {/* Limite por mesa: inferir pela capacidade da mesa se disponível no backend; placeholder '-' */}
                                          -
                                          <button onClick={() => openEdit(r)} className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">+</button>
                                        </td>
                                        <td className="border border-gray-300 px-2 py-1 text-sm text-gray-700 text-center">
                                          {r.number_of_people}
                                          <button onClick={() => openEdit(r)} className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">+</button>
                                        </td>
                                        <td className="border border-gray-300 px-2 py-1 text-sm whitespace-nowrap">
                                          <button
                                            onClick={() => handleStatusChange(r, r.status === 'confirmed' ? 'pending' : 'confirmed')}
                                            className={`px-2 py-1 rounded text-xs font-medium ${r.status === 'confirmed' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}
                                          >
                                            {r.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                    {rows.length === 0 && (
                                      <tr>
                                        <td colSpan={10} className="px-3 py-6 text-sm text-gray-500 text-center border border-gray-300">Sem reservas para os filtros selecionados.</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                              {/* Ajuda de mesas por seção */}
                              {whitelist && whitelist.length > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Mesas: {sectionKey === 'deck' && 'Lounge 1–8, Mesa 09–12'}
                                  {sectionKey === 'bar' && ' Bistrô ESPERA 11–14'}
                                  {sectionKey === 'rooftop' && ' Lounge 40–42, Lounge Central 44–47, Bangalô 60–65, Mesa 50–56, Bistrô 70–73'}
                                </p>
                              )}
                            </div>
                          );
                        };

                        // Calcular resumo do dia
                        const allFilteredRows = filteredReservations.filter(r => matchesFilters(r));
                        const totalReservations = allFilteredRows.length;
                        const totalPeople = allFilteredRows.reduce((sum, r) => sum + (r.number_of_people || 0), 0);

                        return (
                          <div className="space-y-6">
                            {/* Resumo do Dia */}
                            {sheetFilters.date && (
                              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-6 shadow-md">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                  📊 Resumo do Dia - {new Date(sheetFilters.date + 'T12:00:00').toLocaleDateString('pt-BR', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm text-gray-600 font-medium">Total de Reservas</p>
                                        <p className="text-4xl font-bold text-yellow-600 mt-2">{totalReservations}</p>
                                      </div>
                                      <div className="bg-yellow-100 p-3 rounded-full">
                                        <MdRestaurant className="text-yellow-600 text-3xl" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm text-gray-600 font-medium">Total de Pessoas</p>
                                        <p className="text-4xl font-bold text-orange-600 mt-2">{totalPeople}</p>
                                      </div>
                                      <div className="bg-orange-100 p-3 rounded-full">
                                        <MdPeople className="text-orange-600 text-3xl" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {totalReservations > 0 && (
                                  <div className="mt-4 pt-4 border-t border-yellow-200">
                                    <p className="text-sm text-gray-600">
                                      <span className="font-semibold">Média de pessoas por reserva:</span> {(totalPeople / totalReservations).toFixed(1)}
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
                              {areaSections.map(s => (
                                <SectionTable key={s.key} sectionKey={s.key} title={s.title} whitelist={s.tableWhitelist} />
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Seção de Reservas de Aniversário */}
                  {viewMode === 'list' && birthdayReservations.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">🎂 Reservas de Aniversário</h3>
                        <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded-full">
                          {birthdayReservations.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {birthdayReservations.map((birthday) => (
                          <motion.div
                            key={birthday.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                  🎂 {birthday.aniversariante_nome}
                                </h4>
                                <p className="text-sm text-gray-500">{formatDate(birthday.data_aniversario)}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                birthday.status === 'confirmado' ? 'bg-green-100 text-green-800' :
                                birthday.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {birthday.status}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <MdPeople className="text-gray-400" />
                                <span>{birthday.quantidade_convidados} convidados</span>
                              </div>
                              {birthday.decoracao_tipo && (
                                <div className="flex items-center gap-2">
                                  <MdRestaurant className="text-gray-400" />
                                  <span>{birthday.decoracao_tipo}</span>
                                </div>
                              )}
                              {birthday.whatsapp && (
                                <div className="flex items-center gap-2">
                                  <MdPhone className="text-gray-400" />
                                  <span>{birthday.whatsapp}</span>
                                </div>
                              )}
                              {birthday.email && (
                                <div className="flex items-center gap-2">
                                  <MdPhone className="text-gray-400" />
                                  <span>{birthday.email}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 pt-3 border-t border-pink-200">
                              <p className="text-xs text-pink-600">
                                Cliente: {birthday.user_name || 'N/A'}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Aba de Lista de Convidados */}
      {activeTab === 'guest-lists' && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Lista de Convidados</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Filtro de mês */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setSelectedDay(''); // Limpa o filtro de dia ao mudar o mês
                  }}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              {/* Filtro de dia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia</label>
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => {
                    setSelectedDay(e.target.value);
                    // Se selecionar um dia, atualiza o mês para corresponder
                    if (e.target.value) {
                      const monthFromDay = e.target.value.slice(0, 7);
                      if (monthFromDay !== selectedMonth) {
                        setSelectedMonth(monthFromDay);
                      }
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              {/* Botão para limpar filtro de dia */}
              {selectedDay && (
                <button
                  onClick={() => setSelectedDay('')}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors self-end text-sm"
                  title="Limpar filtro de dia"
                >
                  Limpar Dia
                </button>
              )}
              
              {/* Campo de busca pelo nome do dono */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por dono</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Nome do dono da lista"
                      value={ownerSearchTerm}
                      onChange={(e) => setOwnerSearchTerm(e.target.value)}
                      className="pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-64"
                    />
                    {ownerSearchTerm && (
                      <button
                        onClick={() => setOwnerSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Limpar busca"
                      >
                        <MdClose size={18} />
                      </button>
                    )}
                  </div>
                  {ownerSearchTerm && (
                    <button
                      onClick={async () => {
                        const filteredLists = guestLists.filter((gl) => {
                          const searchLower = ownerSearchTerm.toLowerCase().trim();
                          const ownerNameLower = (gl.owner_name || '').toLowerCase();
                          return ownerNameLower.includes(searchLower);
                        });
                        
                        if (filteredLists.length === 0) {
                          alert('Nenhuma lista encontrada com esse nome.');
                          return;
                        }
                        
                        const confirmMessage = filteredLists.length === 1
                          ? `Tem certeza que deseja excluir a lista de convidados de "${filteredLists[0].owner_name}"? Esta ação não pode ser desfeita.`
                          : `Tem certeza que deseja excluir ${filteredLists.length} lista(s) encontrada(s) para "${ownerSearchTerm}"? Esta ação não pode ser desfeita.`;
                        
                        if (!confirm(confirmMessage)) return;
                        
                        try {
                          const token = localStorage.getItem('authToken');
                          const encodedOwnerName = encodeURIComponent(ownerSearchTerm.trim());
                          const res = await fetch(`${API_URL}/api/admin/guest-lists/by-owner/${encodedOwnerName}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          
                          if (res.ok) {
                            const result = await res.json();
                            alert(`✅ ${result.message || 'Lista(s) excluída(s) com sucesso!'}`);
                            setOwnerSearchTerm('');
                            await loadGuestLists();
                          } else {
                            const errorData = await res.json().catch(() => ({}));
                            alert(`❌ Erro ao excluir lista: ${errorData.error || 'Erro desconhecido'}`);
                          }
                        } catch (error) {
                          console.error('❌ Erro ao excluir lista:', error);
                          alert('❌ Erro ao excluir lista. Tente novamente.');
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      title="Excluir lista(s) encontrada(s)"
                    >
                      <MdClose size={18} />
                      Excluir
                    </button>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowCreateListModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors self-end"
              >
                <MdAdd />
                Criar Lista
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {guestLists
              .filter((gl) => {
                // Filtro por dia
                if (selectedDay) {
                  if (gl.reservation_date) {
                    // Extrai apenas a parte da data (YYYY-MM-DD) sem criar objeto Date
                    const reservationDate = gl.reservation_date.split('T')[0].split(' ')[0];
                    if (reservationDate !== selectedDay) return false;
                  } else {
                    return false;
                  }
                }
                
                // Filtro por nome do dono
                if (ownerSearchTerm.trim()) {
                  const searchLower = ownerSearchTerm.toLowerCase().trim();
                  const ownerNameLower = (gl.owner_name || '').toLowerCase();
                  if (!ownerNameLower.includes(searchLower)) return false;
                }
                
                return true;
              })
              .map((gl) => {
              // Monta a URL completa do link compartilhável
              const listUrl = `https://agilizaiapp.com.br/lista/${gl.shareable_link_token}`;

              return (
                <div key={gl.guest_list_id} className={`border rounded-lg ${checkInStatus[gl.guest_list_id]?.ownerCheckedOut ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}>
                  <div
                    onClick={async () => {
                      setExpandedGuestListId(expandedGuestListId === gl.guest_list_id ? null : gl.guest_list_id);
                      if (!guestsByList[gl.guest_list_id]) {
                        try {
                          const token = localStorage.getItem('authToken');
                          
                          // Carregar convidados com status de check-in
                          const guestsRes = await fetch(`${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/guests`, { 
                            headers: { Authorization: `Bearer ${token}` } 
                          });
                          
                          let guestsData: { guests: GuestItem[] } | null = null;
                          if (guestsRes.ok) {
                            guestsData = await guestsRes.json();
                            setGuestsByList(prev => ({ ...prev, [gl.guest_list_id]: guestsData?.guests || [] }));
                          } else {
                            const errorText = await guestsRes.text();
                            console.error(`❌ Erro ao carregar convidados (${guestsRes.status}):`, errorText);
                            // Definir como array vazio para evitar tentativas infinitas
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
                            // Fallback: usar dados da lista principal
                            const guestsCheckedIn = guestsData ? guestsData.guests.filter((g: GuestItem) => g.checked_in).length : 0;
                            setCheckInStatus(prev => ({
                              ...prev,
                              [gl.guest_list_id]: {
                                ownerCheckedIn: gl.owner_checked_in || false,
                                guestsCheckedIn: guestsCheckedIn,
                                totalGuests: guestsData ? guestsData.guests.length : 0
                              }
                            }));
                          }
                        } catch (e) { console.error(e); }
                      }
                    }}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${checkInStatus[gl.guest_list_id]?.ownerCheckedOut ? 'text-gray-600' : 'text-gray-800'}`}>{gl.owner_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          gl.reservation_type === 'large'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {gl.reservation_type === 'large' ? 'Reserva Grande' : 'Reserva Normal'}
                        </span>
                        {checkInStatus[gl.guest_list_id]?.ownerCheckedOut && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            ✅ FINALIZADO
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {gl.reservation_date ? new Date(gl.reservation_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data não informada'} {gl.event_type ? `• ${gl.event_type}` : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        Criado por: {gl.created_by_name}
                      </div>
                      
                      {/* Check-in/Check-out do dono da lista */}
                      <div className="mt-2 flex items-center gap-2">
                        {!checkInStatus[gl.guest_list_id]?.ownerCheckedIn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOwnerCheckIn(gl.guest_list_id, gl.owner_name);
                            }}
                            className="px-3 py-1 text-xs rounded-full transition-colors font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300"
                          >
                            📋 Check-in Dono
                          </button>
                        )}
                        {checkInStatus[gl.guest_list_id]?.ownerCheckedIn && !checkInStatus[gl.guest_list_id]?.ownerCheckedOut && (
                          <>
                            <button
                              className="px-3 py-1 text-xs rounded-full transition-colors font-medium bg-green-100 text-green-700 border border-green-300"
                              disabled
                            >
                              ✅ Dono Presente
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOwnerCheckOut(gl.guest_list_id, gl.owner_name);
                              }}
                              className="px-3 py-1 text-xs rounded-full transition-colors font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300"
                              title="Registrar saída do dono"
                            >
                              🚪 Check-out Dono
                            </button>
                          </>
                        )}
                        {checkInStatus[gl.guest_list_id]?.ownerCheckedOut && (
                          <button
                            className="px-3 py-1 text-xs rounded-full transition-colors font-medium bg-gray-100 text-gray-700 border border-gray-300"
                            disabled
                            title={`Check-out realizado - Mesa liberada`}
                          >
                            🚪 Finalizado
                          </button>
                        )}
                      </div>
                      
                      {/* INÍCIO DA ALTERAÇÃO: Exibição do Link */}
                      <div className="mt-2 flex items-center gap-2">
                        <a
                          href={listUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} // Evita que o clique no link expanda/recolha o item
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Acessar Link da Lista
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Evita que o clique no botão expanda/recolha
                            navigator.clipboard.writeText(listUrl);
                            alert('Link copiado para a área de transferência!');
                          }}
                          className="text-xs text-gray-500 hover:text-gray-800"
                        >
                          (Copiar)
                        </button>
                      </div>

                      {/* Informações de Check-in/Check-out */}
                      {(checkInStatus[gl.guest_list_id]?.ownerCheckedIn || checkInStatus[gl.guest_list_id]?.ownerCheckedOut) && (
                        <div className="mt-2 space-y-1">
                          {checkInStatus[gl.guest_list_id]?.ownerCheckedIn && (
                            <div className="text-xs text-green-600">
                              ✅ Entrada: {gl.owner_checkin_time ? new Date(gl.owner_checkin_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Horário não registrado'}
                            </div>
                          )}
                          {checkInStatus[gl.guest_list_id]?.ownerCheckedOut && (
                            <div className="text-xs text-gray-600">
                              🚪 Saída: {(() => {
                                const checkoutTime = gl.owner_checkout_time || (checkInStatus[gl.guest_list_id] as any)?.ownerCheckoutTime;
                                return checkoutTime ? new Date(checkoutTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Horário não registrado';
                              })()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* FIM DA ALTERAÇÃO */}

                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${gl.is_valid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{gl.is_valid ? 'Ativo' : 'Expirado'}</span>
                      {/* Botão de excluir apenas para usuários autorizados e listas expiradas */}
                      {!gl.is_valid && (() => {
                        const userEmail = localStorage.getItem('userEmail');
                        const canDelete = userEmail === 'jeffinho_ns@hotmail.com' || userEmail === 'teste@teste';
                        return canDelete ? (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(`Tem certeza que deseja excluir a lista de convidados de ${gl.owner_name}? Esta ação não pode ser desfeita.`)) return;
                              
                              try {
                                const token = localStorage.getItem('authToken');
                                const res = await fetch(`${API_URL}/api/admin/guest-lists/${gl.guest_list_id}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                
                                if (res.ok) {
                                  alert('✅ Lista excluída com sucesso!');
                                  await loadGuestLists();
                                } else {
                                  const errorData = await res.json().catch(() => ({}));
                                  alert(`❌ Erro ao excluir lista: ${errorData.error || 'Erro desconhecido'}`);
                                }
                              } catch (error) {
                                console.error('❌ Erro ao excluir lista:', error);
                                alert('❌ Erro ao excluir lista. Tente novamente.');
                              }
                            }}
                            className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                            title="Excluir lista (apenas para usuários autorizados)"
                          >
                            🗑️ Excluir
                          </button>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {expandedGuestListId === gl.guest_list_id && (
                    <div className="p-4 space-y-3">
                      {/* Form adicionar/editar */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        {guestForm.editingGuestId && guestForm.listId === gl.guest_list_id && (
                          <p className="text-sm text-blue-700 mb-2 font-medium">
                            ✏️ Editando convidado
                          </p>
                        )}
                        <div className="flex flex-col md:flex-row gap-2">
                          <input
                            placeholder="Nome do convidado"
                            value={guestForm.listId === gl.guest_list_id ? guestForm.name : ''}
                            onChange={(e) => setGuestForm(prev => ({ ...prev, listId: gl.guest_list_id, name: e.target.value }))}
                            className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            placeholder="WhatsApp (opcional)"
                            value={guestForm.listId === gl.guest_list_id ? guestForm.whatsapp : ''}
                            onChange={(e) => setGuestForm(prev => ({ ...prev, listId: gl.guest_list_id, whatsapp: e.target.value }))}
                            className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              if (!guestForm.name.trim()) {
                                alert('Por favor, preencha o nome do convidado');
                                return;
                              }
                              
                              const token = localStorage.getItem('authToken');
                              if (guestForm.editingGuestId) {
                                const res = await fetch(`${API_URL}/api/admin/guests/${guestForm.editingGuestId}`, {
                                  method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ name: guestForm.name, whatsapp: guestForm.whatsapp })
                                });
                                if (res.ok) {
                                  setGuestsByList(prev => ({
                                    ...prev,
                                    [gl.guest_list_id]: (prev[gl.guest_list_id] || []).map(g => g.id === guestForm.editingGuestId ? { ...g, name: guestForm.name, whatsapp: guestForm.whatsapp } : g)
                                  }));
                                  setGuestForm({ listId: gl.guest_list_id, name: '', whatsapp: '', editingGuestId: null });
                                  alert('✅ Convidado editado com sucesso!');
                                } else {
                                  alert('❌ Erro ao editar convidado');
                                }
                              } else {
                                const res = await fetch(`${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/guests`, {
                                  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ name: guestForm.name, whatsapp: guestForm.whatsapp })
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setGuestsByList(prev => ({
                                    ...prev,
                                    [gl.guest_list_id]: [ ...(prev[gl.guest_list_id] || []), data.guest ]
                                  }));
                                  setGuestForm({ listId: gl.guest_list_id, name: '', whatsapp: '', editingGuestId: null });
                                  alert('✅ Convidado adicionado com sucesso!');
                                } else {
                                  alert('❌ Erro ao adicionar convidado');
                                }
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded whitespace-nowrap"
                          >{guestForm.listId === gl.guest_list_id && guestForm.editingGuestId ? 'Salvar' : 'Adicionar'}</button>
                          
                          {guestForm.editingGuestId && guestForm.listId === gl.guest_list_id && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setGuestForm({ listId: gl.guest_list_id, name: '', whatsapp: '', editingGuestId: null });
                              }}
                              className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded whitespace-nowrap"
                            >Cancelar</button>
                          )}
                        </div>
                      </div>

                      {/* Lista de convidados */}
                      <div className="border rounded">
                        {/* Resumo de presença */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Resumo de Presença:</span>
                            <div className="flex gap-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                checkInStatus[gl.guest_list_id]?.ownerCheckedIn
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                Dono: {checkInStatus[gl.guest_list_id]?.ownerCheckedIn ? '✅ Presente' : '⏳ Aguardando'}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                                Convidados: {checkInStatus[gl.guest_list_id]?.guestsCheckedIn || 0} / {(guestsByList[gl.guest_list_id] || []).length}
                              </span>
                            </div>
                          </div>
                        </div>

                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-2"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(guestsByList[gl.guest_list_id] || []).map((g) => (
                              <tr key={g.id}>
                                <td className="px-4 py-2 text-sm text-gray-800">{g.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{g.whatsapp || '-'}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    g.checked_out
                                      ? 'bg-gray-100 text-gray-600 border border-gray-300'
                                      : g.checked_in
                                      ? 'bg-green-100 text-green-700 border border-green-300'
                                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                                  }`}>
                                    {g.checked_out ? '🚪 Saída' : g.checked_in ? '✅ Presente' : '⏳ Aguardando'}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <div className="flex gap-2 justify-end">
                                    {!g.checked_in && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleGuestCheckIn(gl.guest_list_id, g.id, g.name);
                                        }}
                                        className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded border border-green-300"
                                      >
                                        📋 Check-in
                                      </button>
                                    )}
                                    {g.checked_in && !g.checked_out && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (confirm(`Confirmar check-out de ${g.name}?`)) {
                                            handleGuestCheckOut(gl.guest_list_id, g.id, g.name);
                                          }
                                        }}
                                        className="px-3 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded border border-orange-300"
                                        title="Registrar saída do convidado"
                                      >
                                        🚪 Check-out
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setGuestForm({ listId: gl.guest_list_id, name: g.name, whatsapp: g.whatsapp || '', editingGuestId: g.id });
                                      }}
                                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                                    >Editar</button>
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!confirm('Deseja realmente excluir este convidado?')) return;
                                        const token = localStorage.getItem('authToken');
                                        const res = await fetch(`${API_URL}/api/admin/guests/${g.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                        if (res.ok) {
                                          setGuestsByList(prev => ({
                                            ...prev,
                                            [gl.guest_list_id]: (prev[gl.guest_list_id] || []).filter(x => x.id !== g.id)
                                          }));
                                        }
                                      }}
                                      className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                                    >Excluir</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {(!guestsByList[gl.guest_list_id] || guestsByList[gl.guest_list_id].length === 0) && (
                              <tr>
                                <td className="px-4 py-4 text-sm text-gray-500" colSpan={3}>Sem convidados cadastrados.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {guestLists.filter((gl) => {
              // Filtro por dia
              if (selectedDay) {
                if (gl.reservation_date) {
                  const reservationDate = gl.reservation_date.split('T')[0].split(' ')[0];
                  if (reservationDate !== selectedDay) return false;
                } else {
                  return false;
                }
              }
              
              // Filtro por nome do dono
              if (ownerSearchTerm.trim()) {
                const searchLower = ownerSearchTerm.toLowerCase().trim();
                const ownerNameLower = (gl.owner_name || '').toLowerCase();
                if (!ownerNameLower.includes(searchLower)) return false;
              }
              
              return true;
            }).length === 0 && (
              <div className="text-center py-8">
                <div className="text-sm text-gray-600">
                  {ownerSearchTerm.trim()
                    ? `Nenhuma lista de convidados encontrada para "${ownerSearchTerm}".`
                    : selectedDay 
                    ? `Nenhuma lista de convidados encontrada para ${new Date(selectedDay).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`
                    : `Nenhuma lista de convidados encontrada para ${new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.`
                  }
                </div>
              </div>
            )}

            {/* Relatório de Presença por Dia */}
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                📊 Relatório de Presença
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Resumo Geral */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-blue-800 mb-2">Total de Listas</h5>
                  <div className="text-2xl font-bold text-blue-900">
                    {guestLists.filter((gl) => {
                      // Filtro por dia
                      if (selectedDay) {
                        if (gl.reservation_date) {
                          const reservationDate = gl.reservation_date.split('T')[0].split(' ')[0];
                          if (reservationDate !== selectedDay) return false;
                        } else {
                          return false;
                        }
                      }
                      
                      // Filtro por nome do dono
                      if (ownerSearchTerm.trim()) {
                        const searchLower = ownerSearchTerm.toLowerCase().trim();
                        const ownerNameLower = (gl.owner_name || '').toLowerCase();
                        if (!ownerNameLower.includes(searchLower)) return false;
                      }
                      
                      return true;
                    }).length}
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    {ownerSearchTerm.trim() 
                      ? 'com filtro aplicado' 
                      : selectedDay 
                      ? 'para o dia selecionado' 
                      : 'no mês atual'}
                  </p>
                </div>

                {/* Donos Presentes */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="font-medium text-green-800 mb-2">Donos Presentes</h5>
                  <div className="text-2xl font-bold text-green-900">
                    {Object.values(checkInStatus).filter(status => status.ownerCheckedIn).length}
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {Object.values(checkInStatus).length > 0 
                      ? `${Math.round((Object.values(checkInStatus).filter(status => status.ownerCheckedIn).length / Object.values(checkInStatus).length) * 100)}% de presença`
                      : 'Nenhuma lista carregada'
                    }
                  </p>
                </div>

                {/* Convidados Presentes */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h5 className="font-medium text-purple-800 mb-2">Convidados Presentes</h5>
                  <div className="text-2xl font-bold text-purple-900">
                    {Object.values(checkInStatus).reduce((total, status) => total + (status.guestsCheckedIn || 0), 0)}
                  </div>
                  <p className="text-sm text-purple-600 mt-1">
                    de {Object.values(checkInStatus).reduce((total, status) => total + (status.totalGuests || 0), 0)} convidados
                  </p>
                </div>
              </div>

              {/* Estimativa de Lucro */}
              <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h5 className="font-medium text-yellow-800 mb-2">💰 Estimativa de Movimentação</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-yellow-700">
                      <strong>Pessoas no estabelecimento:</strong> {Object.values(checkInStatus).reduce((total, status) => total + (status.ownerCheckedIn ? 1 : 0) + (status.guestsCheckedIn || 0), 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-yellow-700">
                      <strong>Listas com presença confirmada:</strong> {Object.values(checkInStatus).filter(status => status.ownerCheckedIn || (status.guestsCheckedIn || 0) > 0).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
              {/* Aba de Walk-ins */}
              {activeTab === 'walk-ins' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Passantes Ativos ({activeWalkIns.length})
                    </h3>
                    <button
                      onClick={handleAddWalkIn}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <MdAdd />
                      Novo Passante
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {activeWalkIns.map((walkIn) => (
                      <motion.div
                        key={walkIn.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800">{walkIn.client_name}</h4>
                            <p className="text-sm text-gray-500">Chegou às {walkIn.arrival_time}</p>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {walkIn.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MdPeople className="text-gray-400" />
                            <span>{walkIn.number_of_people} pessoas</span>
                          </div>
                          {walkIn.area && (
                            <div className="flex items-center gap-2">
                              <MdLocationOn className="text-gray-400" />
                              <span>{walkIn.area.name}</span>
                            </div>
                          )}
                          {walkIn.table_number && (
                            <div className="flex items-center gap-2">
                              <MdChair className="text-gray-400" />
                              <span>{walkIn.table_number}</span>
                            </div>
                          )}
                          {walkIn.client_phone && (
                            <div className="flex items-center gap-2">
                              <MdPhone className="text-gray-400" />
                              <span>{walkIn.client_phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 mt-3">
                          <button
                            onClick={() => handleEditWalkIn(walkIn)}
                            className="flex-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteWalkIn(walkIn)}
                            className="flex-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                          >
                            Finalizar
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aba de Lista de Espera */}
              {activeTab === 'waitlist' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Lista de Espera ({activeWaitlist.length})
                    </h3>
                    <button
                      onClick={handleAddWaitlistEntry}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                    >
                      <MdAdd />
                      Adicionar à Lista
                    </button>
                  </div>

                  <div className="space-y-4">
                    {activeWaitlist.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <span className="text-orange-600 font-bold text-sm">{entry.position}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{entry.client_name}</h4>
                              <p className="text-sm text-gray-500">
                                {entry.number_of_people} pessoas • Data: {entry.preferred_date ? formatDate(entry.preferred_date) : 'Data não informada'} • Preferência: {entry.preferred_time || 'Qualquer horário'}
                              </p>
                              <p className="text-xs text-gray-400">
                                Entrou na fila: {new Date(entry.created_at).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-gray-600">
                              <MdTimer className="inline mr-1" />
                              {calculateWaitTime(entry.created_at)}min
                            </span>
                            <button
                              onClick={() => handleCallCustomer(entry)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
                            >
                              <MdCall />
                              Chamar
                            </button>
                            <button
                              onClick={async () => {
                                const tableNumber = prompt(`Alocar ${entry.client_name} em qual mesa?\n\nDigite o número da mesa:`);
                                if (tableNumber && tableNumber.trim()) {
                                  const areaId = prompt(`Qual a área da mesa ${tableNumber}?\n\nDigite o ID da área (ou deixe em branco para usar a área padrão):`);
                                  await handleAllocateWaitlistToTable(entry, tableNumber.trim(), areaId ? parseInt(areaId) : undefined);
                                }
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded transition-colors"
                              title="Alocar cliente em uma mesa específica"
                            >
                              <MdChair />
                              Alocar em Mesa
                            </button>
                            <button
                              onClick={() => handleEditWaitlistEntry(entry)}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteWaitlistEntry(entry)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aba de Relatórios */}
              {activeTab === 'reports' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Relatórios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Total de Reservas</p>
                          <p className="text-3xl font-bold">{reservations.length}</p>
                        </div>
                        <MdRestaurant size={32} className="text-blue-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Passantes Ativos</p>
                          <p className="text-3xl font-bold">{activeWalkIns.length}</p>
                        </div>
                        <MdPeople size={32} className="text-green-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100">Na Lista de Espera</p>
                          <p className="text-3xl font-bold">{activeWaitlist.length}</p>
                        </div>
                        <MdSchedule size={32} className="text-orange-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Taxa de Ocupação</p>
                          <p className="text-3xl font-bold">85%</p>
                        </div>
                        <MdBarChart size={32} className="text-purple-200" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aba de Configurações */}
              {activeTab === 'settings' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Configurações</h3>
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Áreas do Restaurante</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {areas.map((area) => (
                          <div key={area.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            <h5 className="font-semibold text-gray-800">{area.name}</h5>
                            <p className="text-sm text-gray-600">
                              Capacidade: {area.capacity_dinner} pessoas
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Link para gerenciar regras de brindes */}
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-gray-800 mb-2">🎁 Regras de Brindes</h4>
                          <p className="text-sm text-gray-600">
                            Gerencie todas as regras de brindes em uma página dedicada
                          </p>
                        </div>
                        <a
                          href="/admin/gifts"
                          className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md font-semibold"
                        >
                          <MdSettings size={20} />
                          Gerenciar Regras de Brindes
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Configurações Gerais</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Tempo médio de espera</span>
                          <span className="text-gray-600">30 minutos</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Notificações por email</span>
                          <span className="text-green-600">Ativado</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Reservas automáticas</span>
                          <span className="text-green-600">Ativado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* Modais */}
        {showModal && (
          <ReservationModal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setEditingReservation(null);
              setSelectedTime(null);
            }}
            onSave={async (reservationData) => {
              try {
                // Verificar se está editando uma reserva existente ou criando uma nova
                const isEditing = editingReservation?.id;
                const url = isEditing 
                  ? `${API_URL}/api/restaurant-reservations/${editingReservation.id}`
                  : `${API_URL}/api/restaurant-reservations`;
                const method = isEditing ? 'PUT' : 'POST';

                // Validar campos obrigatórios antes de criar o requestBody
                // Validar client_name de forma mais robusta
                const client_name = reservationData.client_name?.trim() || '';
                if (!client_name || client_name === '') {
                  throw new Error('Nome do cliente é obrigatório');
                }
                
                if (!reservationData.reservation_date) {
                  throw new Error('Data da reserva é obrigatória');
                }
                if (!reservationData.reservation_time) {
                  throw new Error('Horário da reserva é obrigatório');
                }
                
                // Validar area_id de forma mais robusta
                const areaIdValue = reservationData.area_id;
                if (!areaIdValue || areaIdValue === '' || areaIdValue === '0') {
                  throw new Error('Área é obrigatória. Selecione uma área válida.');
                }
                const area_id = Number(areaIdValue);
                if (isNaN(area_id) || area_id <= 0) {
                  throw new Error('Área inválida. Selecione uma área válida.');
                }
                
                if (!selectedEstablishment?.id) {
                  throw new Error('Estabelecimento é obrigatório');
                }
                const establishment_id = Number(selectedEstablishment.id);
                if (isNaN(establishment_id) || establishment_id <= 0) {
                  throw new Error('Estabelecimento inválido.');
                }

                // Validar e formatar o horário
                let reservation_time = reservationData.reservation_time;
                if (!reservation_time || reservation_time.trim() === '') {
                  throw new Error('Horário da reserva é obrigatório');
                }
                
                // Garantir que o horário esteja no formato HH:mm:ss
                reservation_time = reservation_time.trim();
                if (reservation_time.split(':').length === 2) {
                  reservation_time = `${reservation_time}:00`;
                }
                
                // Validar formato do horário
                const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
                if (!timeRegex.test(reservation_time)) {
                  throw new Error(`Formato de horário inválido: ${reservation_time}. Use HH:mm ou HH:mm:ss`);
                }
                
                // Validar formato da data
                if (!reservationData.reservation_date || !/^\d{4}-\d{2}-\d{2}$/.test(reservationData.reservation_date)) {
                  throw new Error(`Formato de data inválido: ${reservationData.reservation_date}. Use YYYY-MM-DD`);
                }

                // Nova reserva: checar capacidade e lista de espera para este dia+hora (trava só esse slot)
                if (!isEditing) {
                  const resDate = new Date(reservationData.reservation_date + 'T12:00:00');
                  const ok = await checkCapacityAndWaitlist(
                    resDate,
                    Number(reservationData.number_of_people) || 1,
                    reservation_time
                  );
                  if (!ok) return;
                }

                const requestBody: Record<string, unknown> = {
                  client_name: client_name,
                  client_phone: reservationData.client_phone?.trim() || null,
                  client_email: reservationData.client_email?.trim() || null,
                  data_nascimento_cliente: reservationData.data_nascimento_cliente || null,
                  reservation_date: reservationData.reservation_date,
                  reservation_time: reservation_time,
                  number_of_people: Number(reservationData.number_of_people) || 1,
                  area_id: area_id,
                  table_number: reservationData.table_number || null,
                  status: isEditing ? reservationData.status || editingReservation.status : 'NOVA',
                  origin: 'PESSOAL', // Sempre 'PESSOAL' para reservas criadas por admin (permite mesas virtuais)
                  notes: reservationData.notes || null,
                  created_by: 1, // ID do usuário admin padrão
                  establishment_id: establishment_id,
                  evento_id: reservationData.evento_id || null,
                  send_email: reservationData.send_email !== undefined ? reservationData.send_email : true,
                  send_whatsapp: reservationData.send_whatsapp !== undefined ? reservationData.send_whatsapp : true,
                  blocks_entire_area: reservationData.blocks_entire_area || false,
                };
                const adn = reservationData.area_display_name != null ? String(reservationData.area_display_name).trim() : '';
                if (adn !== '') requestBody.area_display_name = adn;
                const nPeople = Number(reservationData.number_of_people) || 0;
                if (nPeople >= 4) {
                  const et = reservationData.event_type != null ? String(reservationData.event_type).trim() : '';
                  if (isEditing) {
                    if (et !== '') requestBody.event_type = reservationData.event_type;
                  } else {
                    requestBody.event_type = et !== '' ? reservationData.event_type : 'outros';
                  }
                }
                
                // Remover campos undefined
                Object.keys(requestBody).forEach(key => {
                  if (requestBody[key as keyof typeof requestBody] === undefined) {
                    delete requestBody[key as keyof typeof requestBody];
                  }
                });

                console.log('📤 [restaurant-reservations] Enviando requisição:', {
                  method,
                  url,
                  body: requestBody,
                  table_number: requestBody.table_number,
                  hasMultipleTables: String(requestBody.table_number || '').includes(',')
                });
                console.log('🔍 Validação dos campos obrigatórios:', {
                  client_name: !!requestBody.client_name && String(requestBody.client_name || '').trim() !== '',
                  reservation_date: !!requestBody.reservation_date,
                  reservation_time: !!requestBody.reservation_time,
                  area_id: requestBody.area_id,
                  area_id_type: typeof requestBody.area_id,
                  area_id_valid: !!requestBody.area_id && !isNaN(Number(requestBody.area_id)) && Number(requestBody.area_id) > 0,
                  establishment_id: requestBody.establishment_id,
                  establishment_id_type: typeof requestBody.establishment_id,
                  establishment_id_valid: !!requestBody.establishment_id && !isNaN(Number(requestBody.establishment_id)) && Number(requestBody.establishment_id) > 0,
                  number_of_people: requestBody.number_of_people,
                  number_of_people_valid: !!requestBody.number_of_people && Number(requestBody.number_of_people) > 0
                });
                
                // Validação final antes de enviar
                // Validação crítica do client_name
                if (!requestBody.client_name || typeof requestBody.client_name !== 'string' || String(requestBody.client_name).trim() === '') {
                  console.error('❌ [restaurant-reservations] client_name inválido ou ausente:', {
                    client_name: requestBody.client_name,
                    type: typeof requestBody.client_name,
                    reservationData: reservationData
                  });
                  throw new Error('Nome do cliente é obrigatório e não pode estar vazio.');
                }
                
                if (!requestBody.area_id || isNaN(Number(requestBody.area_id)) || Number(requestBody.area_id) <= 0) {
                  console.error('❌ [restaurant-reservations] area_id inválido:', requestBody.area_id);
                  throw new Error(`Área inválida: ${requestBody.area_id}. Selecione uma área válida.`);
                }
                if (!requestBody.establishment_id || isNaN(Number(requestBody.establishment_id)) || Number(requestBody.establishment_id) <= 0) {
                  console.error('❌ [restaurant-reservations] establishment_id inválido:', requestBody.establishment_id);
                  throw new Error(`Estabelecimento inválido: ${requestBody.establishment_id}.`);
                }

                // Log final do payload antes de enviar
                console.log('📤 [restaurant-reservations] Payload final antes de enviar:', {
                  client_name: requestBody.client_name,
                  client_name_length: requestBody.client_name?.length,
                  client_name_type: typeof requestBody.client_name,
                  reservation_date: requestBody.reservation_date,
                  reservation_time: requestBody.reservation_time,
                  area_id: requestBody.area_id,
                  establishment_id: requestBody.establishment_id,
                  number_of_people: requestBody.number_of_people,
                  full_payload: JSON.stringify(requestBody, null, 2)
                });

                const response = await fetch(url, {
                  method: method,
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                  },
                  body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('❌ [restaurant-reservations] Erro na resposta:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText,
                    requestBody: requestBody
                  });
                  let errorData;
                  try {
                    errorData = JSON.parse(errorText);
                  } catch (e) {
                    errorData = { error: errorText };
                  }
                  
                  // Exibir mensagem de erro mais detalhada
                  const errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
                  console.error('❌ [restaurant-reservations] Mensagem de erro da API:', errorMessage);
                  alert(`Erro ao salvar reserva:\n\n${errorMessage}\n\nVerifique o console (F12) para mais detalhes.`);
                  setShowModal(false);
                  setEditingReservation(null);
                  return; // Sair da função sem fechar o modal novamente
                }

                // Se chegou aqui, a resposta foi OK
                const result = await response.json();
                
                if (isEditing) {
                  // Atualizar reserva existente
                  setReservations(prev => 
                    prev.map(r => 
                      r.id === editingReservation.id ? result.reservation : r
                    )
                  );
                  alert('Reserva atualizada com sucesso!');
                  console.log('✅ Reserva atualizada com sucesso:', result);
                } else {
                  // Adicionar nova reserva
                  setReservations(prev => [...prev, result.reservation]);
                  console.log('✅ Reserva salva com sucesso:', result);
                  
                  // Se foi gerada uma lista de convidados, mostrar o link
                  if (result.guest_list_link) {
                    const copyToClipboard = () => {
                      navigator.clipboard.writeText(result.guest_list_link);
                    };
                    
                    if (window.confirm(
                      `✅ Reserva criada com sucesso!\n\n` +
                      `🎉 Lista de convidados gerada!\n\n` +
                      `Link: ${result.guest_list_link}\n\n` +
                      `Clique em OK para copiar o link para a área de transferência.`
                    )) {
                      copyToClipboard();
                      alert('Link copiado! Você pode enviar este link para o cliente.');
                    }
                    
                    // Recarregar lista de convidados
                    await loadGuestLists();
                  } else {
                    alert('Reserva criada com sucesso!');
                  }
                }
                
                setShowModal(false);
                setEditingReservation(null);
              } catch (error: any) {
                console.error('❌ Erro ao salvar reserva:', error);
                console.error('❌ Stack trace:', error?.stack);
                const errorMessage = error?.message || 'Erro desconhecido ao salvar reserva.';
                alert(`Erro ao salvar reserva:\n\n${errorMessage}\n\nVerifique o console (F12) para mais detalhes.`);
                // Não fechar o modal em caso de erro para que o usuário possa corrigir
              }
              setShowModal(false);
              setEditingReservation(null);
            }}
            reservation={editingReservation}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            establishment={selectedEstablishment}
            areas={areas}
          />
        )}

        {showWalkInModal && (
          <WalkInModal
            isOpen={showWalkInModal}
            onClose={() => {
              setShowWalkInModal(false);
              setEditingWalkIn(null);
            }}
            onSave={async (walkInData) => {
              try {
                const response = await fetch(`${API_URL}/api/walk-ins`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    ...walkInData,
                    establishment_id: selectedEstablishment?.id
                  }),
                });

                if (response.ok) {
                  const newWalkIn = await response.json();
                  setWalkIns(prev => [...prev, newWalkIn.walkIn]);
                  console.log('Walk-in salvo com sucesso:', newWalkIn);
                } else {
                  const errorData = await response.json();
                  console.error('Erro ao salvar walk-in:', errorData);
                  alert('Erro ao salvar walk-in: ' + (errorData.error || 'Erro desconhecido'));
                }
              } catch (error) {
                console.error('Erro ao salvar walk-in:', error);
                alert('Erro ao salvar walk-in. Tente novamente.');
              }
              setShowWalkInModal(false);
              setEditingWalkIn(null);
            }}
            walkIn={editingWalkIn}
            areas={areas}
          />
        )}

        {showWaitlistModal && (
          <WaitlistModal
            isOpen={showWaitlistModal}
            onClose={() => {
              setShowWaitlistModal(false);
              setEditingWaitlistEntry(null);
            }}
            onSave={async (entryData) => {
              try {
                const token = localStorage.getItem('authToken');
                const preferredDate = entryData.preferred_date || (selectedDate ? selectedDate.toISOString().split('T')[0] : undefined);
                const isEditing = editingWaitlistEntry?.id;
                const url = isEditing 
                  ? `${API_URL}/api/waitlist/${editingWaitlistEntry.id}`
                  : `${API_URL}/api/waitlist`;
                const method = isEditing ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                  method,
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify({
                    ...entryData,
                    preferred_date: preferredDate,
                    establishment_id: selectedEstablishment?.id
                  }),
                });

                if (response.ok) {
                  const result = await response.json();
                  if (isEditing) {
                    setWaitlist(prev => prev.map(w => w.id === editingWaitlistEntry.id ? result.waitlistEntry : w));
                    console.log('Entrada na lista atualizada com sucesso:', result);
                  } else {
                    setWaitlist(prev => [...prev, result.waitlistEntry]);
                    console.log('Entrada na lista salva com sucesso:', result);
                  }
                  // Recarregar dados do estabelecimento (inclui lista de espera)
                  await loadEstablishmentData();
                } else {
                  const errorData = await response.json();
                  console.error('Erro ao salvar entrada na lista:', errorData);
                  alert('Erro ao salvar entrada na lista: ' + (errorData.error || 'Erro desconhecido'));
                }
              } catch (error) {
                console.error('Erro ao salvar entrada na lista:', error);
                alert('Erro ao salvar entrada na lista. Tente novamente.');
              }
              setShowWaitlistModal(false);
              setEditingWaitlistEntry(null);
            }}
            onCreateReservation={async (reservationData) => {
              try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_URL}/api/restaurant-reservations`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify(reservationData),
                });

                if (response.ok) {
                  const newReservation = await response.json();
                  console.log('Reserva criada com sucesso:', newReservation);
                  await loadEstablishmentData(); // Recarregar reservas
                } else {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Erro ao criar reserva');
                }
              } catch (error: any) {
                console.error('Erro ao criar reserva:', error);
                throw error;
              }
            }}
            entry={editingWaitlistEntry}
            defaultDate={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
            areas={areas}
            establishment={selectedEstablishment}
          />
        )}

        {/* Modal para criar lista de convidados */}
        {showCreateListModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Criar Lista de Convidados</h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!createListForm.client_name || !createListForm.reservation_date) return;
                
                // Validar se há estabelecimento selecionado
                if (!selectedEstablishment) {
                  alert('Por favor, selecione um estabelecimento primeiro');
                  return;
                }
                
                try {
                  const token = localStorage.getItem('authToken');
                  
                  // Incluir establishment_id no payload
                  const payload = {
                    ...createListForm,
                    establishment_id: selectedEstablishment.id
                  };
                  
                  console.log('📤 Enviando dados para criar lista:', payload);
                  
                  const res = await fetch(`${API_URL}/api/admin/guest-lists/create`, {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json', 
                      Authorization: `Bearer ${token}` 
                    },
                    body: JSON.stringify(payload)
                  });
                  
                  if (res.ok) {
                    const data = await res.json();
                    alert(`Lista criada com sucesso!\n\nLink: ${data.guestList.guest_list_link}`);
                    setShowCreateListModal(false);
                    setCreateListForm({ client_name: '', reservation_date: '', event_type: '' });
                    // Recarregar lista
                    await loadGuestLists();
                  } else {
                    const errorData = await res.json();
                    const errorMessage = errorData.error || errorData.details || 'Erro desconhecido';
                    const errorDetails = errorData.code || errorData.constraint ? 
                      ` (Código: ${errorData.code || 'N/A'}, Constraint: ${errorData.constraint || 'N/A'})` : '';
                    alert(`Erro: ${errorMessage}${errorDetails}`);
                    console.error('❌ Erro completo da API:', errorData);
                  }
                } catch (e) {
                  alert('Erro ao criar lista');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    value={createListForm.client_name}
                    onChange={(e) => setCreateListForm(prev => ({ ...prev, client_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nome completo do cliente"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data do Evento</label>
                  <input
                    type="date"
                    value={createListForm.reservation_date}
                    onChange={(e) => setCreateListForm(prev => ({ ...prev, reservation_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento (opcional)</label>
                  <select
                    value={createListForm.event_type}
                    onChange={(e) => setCreateListForm(prev => ({ ...prev, event_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecionar tipo</option>
                    <option value="aniversario">Aniversário</option>
                    <option value="despedida">Despedida</option>
                    <option value="lista_sexta">Lista Sexta</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateListModal(false);
                      setCreateListForm({ client_name: '', reservation_date: '', event_type: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    Criar Lista
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para Adicionar Lista de Convidados a uma Reserva */}
        {showAddGuestListModal && selectedReservationForGuestList && (
          <AddGuestListToReservationModal
            isOpen={showAddGuestListModal}
            onClose={() => {
              setShowAddGuestListModal(false);
              setSelectedReservationForGuestList(null);
            }}
            reservationId={selectedReservationForGuestList.id}
            clientName={selectedReservationForGuestList.client_name}
            onSuccess={async () => {
              console.log('✅ Lista de convidados adicionada com sucesso!');
              // Recarregar lista de convidados
              await loadGuestLists();
            }}
          />
        )}

      </div>
    </div>
  );
}