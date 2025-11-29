"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MdRestaurant, 
  MdCalendarToday, 
  MdAccessTime, 
  MdPeople, 
  MdPhone, 
  MdEmail, 
  MdLocationOn,
  MdCheck,
  MdArrowBack,
  MdEvent
} from 'react-icons/md';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateBR } from '@/lib/dateUtils';
import Link from 'next/link';

// Configuração da API
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
  phone?: string;
  email?: string;
}

interface RestaurantArea {
  id: number;
  name: string;
  capacity_lunch: number;
  capacity_dinner: number;
}

interface RestaurantTable {
  id: number;
  area_id: number;
  table_number: string;
  capacity: number;
  table_type?: string;
  description?: string;
  is_active?: number;
  is_reserved?: boolean;
}

interface OperationalDetail {
  id: number;
  establishment_id: number | null;
  establishment_name?: string | null;
  event_date: string;
  artistic_attraction?: string | null;
  show_schedule?: string | null;
  ticket_prices?: string | null;
  promotions?: string | null;
  visual_reference_url?: string | null;
}

interface PromoterEvent {
  id: number;
  nome: string;
  data: string | null;
  hora: string | null;
  imagem_url?: string | null;
  local_nome?: string | null;
  local_endereco?: string | null;
}

// 🎂 FUNÇÃO PARA DETECTAR E CRIAR LISTA DE CONVIDADOS PARA ANIVERSÁRIOS E RESERVAS GRANDES
const detectAndCreateBirthdayGuestList = async (reservationId: number, payload: any): Promise<boolean> => {
  try {
    // NOVA REGRA: Reservas de aniversário OU reservas grandes criam lista automaticamente
    // Critérios para reserva de aniversário:
    // 1. Nos dois dias de funcionamento (sexta ou sábado)
    // 2. Estabelecimento HighLine (ID 1)
    // 3. Qualquer quantidade de pessoas (para garantir benefícios)
    
    // Critérios para reserva grande:
    // 1. Acima de 3 pessoas (4+)
    // 2. Qualquer estabelecimento
    // 3. Qualquer dia da semana
    
    const reservationDate = new Date(`${payload.reservation_date}T00:00:00`);
    const dayOfWeek = reservationDate.getDay(); // Domingo = 0, Sexta = 5, Sábado = 6
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Sexta ou Sábado
    const isHighLine = payload.establishment_id === 1;
    const isLargeGroup = payload.number_of_people >= 4;
    
    // Criar lista para aniversário (HighLine + fim de semana) OU reserva grande (4+ pessoas)
    if ((isWeekend && isHighLine) || isLargeGroup) {
      const eventType = isWeekend && isHighLine ? 'aniversario' : 'despedida';
      console.log(`🎂 Detectada ${eventType}! Criando lista de convidados automaticamente...`);
      
      const guestListData = {
        owner_name: payload.client_name,
        reservation_date: payload.reservation_date,
        event_type: eventType,
        reservation_type: 'restaurant',
        establishment_id: payload.establishment_id,
        quantidade_convidados: payload.number_of_people
      };

      const response = await fetch(`${API_URL}/api/restaurant-reservations/${reservationId}/add-guest-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guestListData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Lista de convidados criada automaticamente para ${eventType}:`, result);
        return true;
      } else {
        console.warn(`⚠️ Falha ao criar lista de convidados para ${eventType}`);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao criar lista de convidados:', error);
    return false;
  }
};

// Dados estáticos removidos - agora carregados da API

export default function ReservationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [areas, setAreas] = useState<RestaurantArea[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedSubareaKey, setSelectedSubareaKey] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [establishmentsLoading, setEstablishmentsLoading] = useState(true);
  const [step, setStep] = useState<'establishment' | 'form' | 'confirmation'>('establishment');
  const [reservationData, setReservationData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_birthdate: '',
    reservation_date: '',
    reservation_time: '',
    number_of_people: 2,
    area_id: '',
    table_number: '',
    notes: ''
  });
  const [eventType, setEventType] = useState<'aniversario' | 'despedida' | ''>('');
  const [guestListLink, setGuestListLink] = useState<string | null>(null);
  const [birthdayGuestListCreated, setBirthdayGuestListCreated] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [operationalDetails, setOperationalDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Record<string, OperationalDetail[]>>({});
  const [upcomingEventsLoading, setUpcomingEventsLoading] = useState<boolean>(true);
  const [upcomingEventsError, setUpcomingEventsError] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [promoterEvents, setPromoterEvents] = useState<PromoterEvent[]>([]);
  const [promoterEventsLoading, setPromoterEventsLoading] = useState(false);
  const [promoterEventsError, setPromoterEventsError] = useState<string | null>(null);
  const [establishmentEvents, setEstablishmentEvents] = useState<any[]>([]);
  const [establishmentEventsLoading, setEstablishmentEventsLoading] = useState(false);
  const [establishmentPromoterCode, setEstablishmentPromoterCode] = useState<string | null>(null);

  // Carregar estabelecimentos da API
  useEffect(() => {
    const fetchEstablishments = async () => {
      setEstablishmentsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/places`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const formattedEstablishments: Establishment[] = data.map((place: any) => {
              const name = place.name || "Sem nome";
              const lower = (name || '').toLowerCase();
              const isHighlineName = lower.includes('high');
              const isReservaRooftop = lower.includes('reserva rooftop') || lower.includes('rooftop');
              const isSeuJustino = lower.includes('seu justino');
              const isPracinha = lower.includes('pracinha');
              let fallbackPhone = "(11) 99999-9999";
              if (isHighlineName) fallbackPhone = "(11) 3032-2934";
              else if (isReservaRooftop) fallbackPhone = "(11) 4280-3345";
              else if (isSeuJustino) fallbackPhone = "(11) 5200-3650";
              else if (isPracinha) fallbackPhone = "(11) 2305-0938";
              return {
                id: place.id,
                name,
                logo: place.logo ? `https://vamos-comemorar-api.onrender.com/uploads/${place.logo}` : "/images/default-logo.png",
                address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado",
                phone: place.phone || fallbackPhone,
                email: place.email || "contato@estabelecimento.com.br"
              };
            });
            setEstablishments(formattedEstablishments);
          } else if (data.data && Array.isArray(data.data)) {
            const formattedEstablishments: Establishment[] = data.data.map((place: any) => {
              const name = place.name || "Sem nome";
              const lower = (name || '').toLowerCase();
              const isHighlineName = lower.includes('high');
              const isReservaRooftop = lower.includes('reserva rooftop') || lower.includes('rooftop');
              const isSeuJustino = lower.includes('seu justino');
              const isPracinha = lower.includes('pracinha');
              let fallbackPhone = "(11) 99999-9999";
              if (isHighlineName) fallbackPhone = "(11) 3032-2934";
              else if (isReservaRooftop) fallbackPhone = "(11) 4280-3345";
              else if (isSeuJustino) fallbackPhone = "(11) 5200-3650";
              else if (isPracinha) fallbackPhone = "(11) 2305-0938";
              return {
                id: place.id,
                name,
                logo: place.logo ? `https://vamos-comemorar-api.onrender.com/uploads/${place.logo}` : "/images/default-logo.png",
                address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado",
                phone: place.phone || fallbackPhone,
                email: place.email || "contato@estabelecimento.com.br"
              };
            });
            setEstablishments(formattedEstablishments);
          }
        } else {
          // Fallback com dados estáticos
          setEstablishments([
            {
              id: 7,
              name: "High Line",
              logo: "https://vamos-comemorar-api.onrender.com/uploads/1730836360230.png",
              address: "Rua Girassol, 144 - Vila Madalena",
              phone: "(11) 3032-2934",
              email: "reservas@highlinebar.com.br"
            },
            {
              id: 1,
              name: "Seu Justino",
              logo: "https://vamos-comemorar-api.onrender.com/uploads/1729923901750.webp",
              address: "Rua Harmonia, 77 - Vila Madalena",
              phone: "(11) 99999-8888",
              email: "contato@seujustino.com.br"
            },
            {
              id: 4,
              name: "Oh Freguês",
              logo: "https://vamos-comemorar-api.onrender.com/uploads/1730172121902.png",
              address: "Largo da Matriz de Nossa Senhora do Ó, 145 - Freguesia do Ó",
              phone: "(11) 99999-7777",
              email: "contato@ohfregues.com.br"
            },
            {
              id: 8,
              name: "Pracinha do Seu Justino",
              logo: "https://vamos-comemorar-api.onrender.com/uploads/1730836754093.png",
              address: "Rua Harmonia, 117 - Sumarezinho",
              phone: "(11) 99999-6666",
              email: "contato@pracinha.com.br"
            },
            {
              id: 9,
              name: "Reserva Rooftop",
              logo: "/images/default-logo.png",
              address: "Endereço do Reserva Rooftop",
              phone: "(11) 99999-5555",
              email: "contato@reservarooftop.com.br"
            }
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar estabelecimentos:', error);
        // Fallback com dados estáticos em caso de erro
        setEstablishments([
          {
            id: 7,
            name: "High Line",
            logo: "https://vamos-comemorar-api.onrender.com/uploads/1730836360230.png",
            address: "Rua Girassol, 144 - Vila Madalena",
            phone: "(11) 3032-2934",
            email: "reservas@highlinebar.com.br"
          },
          {
            id: 1,
            name: "Seu Justino",
            logo: "https://vamos-comemorar-api.onrender.com/uploads/1729923901750.webp",
            address: "Rua Harmonia, 77 - Vila Madalena",
            phone: "(11) 99999-8888",
            email: "contato@seujustino.com.br"
          },
          {
            id: 4,
            name: "Oh Freguês",
            logo: "https://vamos-comemorar-api.onrender.com/uploads/1730172121902.png",
            address: "Largo da Matriz de Nossa Senhora do Ó, 145 - Freguesia do Ó",
            phone: "(11) 99999-7777",
            email: "contato@ohfregues.com.br"
          },
          {
            id: 8,
            name: "Pracinha do Seu Justino",
            logo: "https://vamos-comemorar-api.onrender.com/uploads/1730836754093.png",
            address: "Rua Harmonia, 117 - Sumarezinho",
            phone: "(11) 99999-6666",
            email: "contato@pracinha.com.br"
          },
          {
            id: 9,
            name: "Reserva Rooftop",
            logo: "/images/default-logo.png",
            address: "Endereço do Reserva Rooftop",
            phone: "(11) 99999-5555",
            email: "contato@reservarooftop.com.br"
          }
        ]);
      } finally {
        setEstablishmentsLoading(false);
      }
    };

    fetchEstablishments();
  }, []);

  // Detectar estabelecimento na URL
  useEffect(() => {
    if (establishments.length === 0) return;
    
    const establishmentParam = searchParams.get('establishment');
    if (establishmentParam) {
      const establishment = establishments.find(
        est => est.name.toLowerCase().includes(establishmentParam.toLowerCase()) ||
               establishmentParam.toLowerCase().includes(est.name.toLowerCase())
      );
      if (establishment) {
        setSelectedEstablishment(establishment);
        loadAreas(establishment.id);
        setStep('form');
      }
    }
  }, [searchParams, establishments]);

  const loadAreas = async (establishmentId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/restaurant-areas`);
      if (response.ok) {
        const data = await response.json();
        setAreas(data.areas || []);
      } else {
        // Fallback para áreas mock
        setAreas([
          { id: 1, name: 'Área Coberta', capacity_lunch: 0, capacity_dinner: 300 },
          { id: 2, name: 'Área Descoberta', capacity_lunch: 0, capacity_dinner: 110 }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      setAreas([
        { id: 1, name: 'Área Coberta', capacity_lunch: 0, capacity_dinner: 300 },
        { id: 2, name: 'Área Descoberta', capacity_lunch: 0, capacity_dinner: 110 }
      ]);
    }
  };

  // Subáreas específicas do Highline (mapeadas para area_id base 2 ou 5)
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

  // Subáreas específicas do Seu Justino (mapeadas para area_id base 1 ou 2)
  const seuJustinoSubareas = [
    { key: 'lounge-bar', area_id: 1, label: 'Lounge Bar', tableNumbers: ['200','202'] },
    { key: 'lounge-palco', area_id: 1, label: 'Lounge Palco', tableNumbers: ['204','206'] },
    { key: 'lounge-aquario-tv', area_id: 1, label: 'Lounge Aquário TV', tableNumbers: ['208'] },
    { key: 'lounge-aquario-spaten', area_id: 1, label: 'Lounge Aquário Spaten', tableNumbers: ['210'] },
    { key: 'quintal-lateral-esquerdo', area_id: 2, label: 'Quintal Lateral Esquerdo', tableNumbers: ['20','22','24','26','28','29'] },
    { key: 'quintal-central-esquerdo', area_id: 2, label: 'Quintal Central Esquerdo', tableNumbers: ['30','32','34','36','38','39'] },
    { key: 'quintal-central-direito', area_id: 2, label: 'Quintal Central Direito', tableNumbers: ['40','42','44','46','48'] },
    { key: 'quintal-lateral-direito', area_id: 2, label: 'Quintal Lateral Direito', tableNumbers: ['50','52','54','56','58','60','62','64'] },
  ];

  const isHighline = selectedEstablishment && (
    (selectedEstablishment.name || '').toLowerCase().includes('high')
  );

  const isSeuJustino = selectedEstablishment && (
    (selectedEstablishment.name || '').toLowerCase().includes('seu justino') && 
    !(selectedEstablishment.name || '').toLowerCase().includes('pracinha')
  );

  // Janelas de horário para o Highline (Sexta e Sábado)
  const getHighlineTimeWindows = (dateStr: string, subareaKey?: string) => {
    if (!dateStr) return [] as Array<{ start: string; end: string; label: string }>;
    const date = new Date(dateStr + 'T00:00:00');
    const weekday = date.getDay(); // 0=Dom, 5=Sex, 6=Sáb
    const windows: Array<{ start: string; end: string; label: string }> = [];
    const isRooftop = subareaKey ? subareaKey.startsWith('roof') : false;
    const isDeckOrBar = subareaKey ? (subareaKey.startsWith('deck') || subareaKey === 'bar') : false;

    if (weekday === 5) {
      // Sexta-feira (qualquer área)
      windows.push({ start: '18:00', end: '21:00', label: 'Sexta-feira: 18:00–21:00' });
    } else if (weekday === 6) {
      // Sábado: rooftop 14–17, deck/bar 14–20
      if (isRooftop) {
        windows.push({ start: '14:00', end: '17:00', label: 'Sábado Rooftop: 14:00–17:00' });
      } else if (isDeckOrBar) {
        windows.push({ start: '14:00', end: '20:00', label: 'Sábado Deck: 14:00–20:00' });
      } else {
        // Sem subárea definida ainda: mostrar ambas como informação
        windows.push({ start: '14:00', end: '17:00', label: 'Sábado Rooftop: 14:00–17:00' });
        windows.push({ start: '14:00', end: '20:00', label: 'Sábado Deck: 14:00–20:00' });
      }
    }
    return windows;
  };

  const isTimeWithinWindows = (timeStr: string, windows: Array<{ start: string; end: string }>) => {
    if (!timeStr || windows.length === 0) return false;
    const [h, m] = timeStr.split(':').map(Number);
    const value = h * 60 + (isNaN(m) ? 0 : m);
    return windows.some(w => {
      const [sh, sm] = w.start.split(':').map(Number);
      const [eh, em] = w.end.split(':').map(Number);
      const startMin = sh * 60 + (isNaN(sm) ? 0 : sm);
      const endMin = eh * 60 + (isNaN(em) ? 0 : em);
      return value >= startMin && value <= endMin;
    });
  };

  // Carrega mesas disponíveis quando área e data forem selecionadas
  useEffect(() => {
    const loadTables = async () => {
      const areaId = reservationData.area_id;
      const date = reservationData.reservation_date;
      if (!areaId || !date) {
        setTables([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/restaurant-tables/${areaId}/availability?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          let fetched: RestaurantTable[] = Array.isArray(data.tables) ? data.tables : [];
          // Se for Highline e houver subárea selecionada, filtra pelas mesas da subárea
          if (isHighline && selectedSubareaKey) {
            const sub = highlineSubareas.find(s => s.key === selectedSubareaKey);
            if (sub) {
              fetched = fetched.filter(t => sub.tableNumbers.includes(String(t.table_number)));
            }
          }
          // Se for Seu Justino e houver subárea selecionada, filtra pelas mesas da subárea
          if (isSeuJustino && selectedSubareaKey) {
            const sub = seuJustinoSubareas.find(s => s.key === selectedSubareaKey);
            if (sub) {
              fetched = fetched.filter(t => sub.tableNumbers.includes(String(t.table_number)));
            }
          }
          setTables(fetched);
        } else {
          setTables([]);
        }
      } catch (e) {
        console.error('Erro ao carregar mesas:', e);
        setTables([]);
      }
    };
    loadTables();
  }, [reservationData.area_id, reservationData.reservation_date, selectedSubareaKey, isHighline, isSeuJustino]);

  // Buscar detalhes operacionais quando a data for selecionada
  useEffect(() => {
    const fetchOperationalDetails = async () => {
      if (!reservationData.reservation_date) {
        setOperationalDetails(null);
        return;
      }

      setLoadingDetails(true);
      try {
        // Formatar data para YYYY-MM-DD
        const dateFormatted = reservationData.reservation_date;
        const response = await fetch(`/api/operational-details/date/${dateFormatted}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setOperationalDetails(data.data);
          } else {
            setOperationalDetails(null);
          }
        } else {
          // Se não encontrar, simplesmente não exibe o card (não é erro crítico)
          setOperationalDetails(null);
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes operacionais:', error);
        setOperationalDetails(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchOperationalDetails();
  }, [reservationData.reservation_date]);

  useEffect(() => {
    if (!isHighline) {
      setPromoterEvents([]);
      setPromoterEventsError(null);
      setPromoterEventsLoading(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const loadPromoterEvents = async () => {
      setPromoterEventsLoading(true);
      setPromoterEventsError(null);
      try {
        const response = await fetch(`${API_URL}/api/promoter/highlinepromo/eventos`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Não foi possível carregar os eventos do promoter.');
        }
        const payload = await response.json();
        const events = Array.isArray(payload?.eventos) ? payload.eventos : [];
        if (!isActive) return;
        setPromoterEvents(events);
      } catch (error) {
        if (!isActive && controller.signal.aborted) return;
        console.error('Erro ao carregar eventos do promoter highlinepromo:', error);
        if (isActive) {
          setPromoterEvents([]);
          setPromoterEventsError('Não foi possível carregar os eventos disponíveis.');
        }
      } finally {
        if (isActive) {
          setPromoterEventsLoading(false);
        }
      }
    };

    loadPromoterEvents();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isHighline]);

  useEffect(() => {
    const loadUpcomingEvents = async () => {
      setUpcomingEventsLoading(true);
      setUpcomingEventsError(null);
      try {
        const response = await fetch('/api/operational-details/upcoming?days=30');
        if (!response.ok) {
          throw new Error(`Erro ao buscar eventos: ${response.status}`);
        }
        const result = await response.json();
        if (result?.success && result?.data) {
          const normalized: Record<string, OperationalDetail[]> = {};
          Object.entries(result.data).forEach(([key, list]) => {
            if (Array.isArray(list)) {
              normalized[key] = [...list].sort((a, b) =>
                (a.event_date || '').localeCompare(b.event_date || '')
              );
            }
          });
          setUpcomingEvents(normalized);
        } else {
          setUpcomingEvents({});
          setUpcomingEventsError('Não foi possível carregar os próximos eventos.');
        }
      } catch (error) {
        console.error('Erro ao carregar próximos eventos:', error);
        setUpcomingEvents({});
        setUpcomingEventsError('Não foi possível carregar os próximos eventos.');
      } finally {
        setUpcomingEventsLoading(false);
      }
    };

    loadUpcomingEvents();
  }, []);

  // Buscar eventos do estabelecimento e código do promoter
  const loadEstablishmentEvents = async (establishmentId: number) => {
    setEstablishmentEventsLoading(true);
    setEstablishmentEvents([]);
    setEstablishmentPromoterCode(null);
    
    try {
      // Buscar eventos da API
      const eventsResponse = await fetch(`${API_URL}/api/events?tipo=unico`);
      if (eventsResponse.ok) {
        const allEvents = await eventsResponse.json();
        // Filtrar eventos do estabelecimento selecionado
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filteredEvents = allEvents
          .filter((event: any) => {
            // Verificar se o evento pertence ao estabelecimento
            const matchesEstablishment = event.id_place === establishmentId || 
                                        (event.casa_do_evento && 
                                         event.casa_do_evento.toLowerCase().includes(selectedEstablishment?.name.toLowerCase() || ''));
            
            if (matchesEstablishment && event.tipoEvento === 'unico') {
              // Apenas eventos futuros ou sem data
              if (!event.data_do_evento) return true;
              const eventDate = new Date(event.data_do_evento);
              eventDate.setHours(0, 0, 0, 0);
              return eventDate >= today;
            }
            return false;
          })
          .sort((a: any, b: any) => {
            if (!a.data_do_evento && !b.data_do_evento) return 0;
            if (!a.data_do_evento) return 1;
            if (!b.data_do_evento) return -1;
            return new Date(a.data_do_evento).getTime() - new Date(b.data_do_evento).getTime();
          })
          .slice(0, 6);
        
        setEstablishmentEvents(filteredEvents);
      }
      
      // Mapeamento conhecido de estabelecimentos para códigos de promoter
      const establishmentPromoterMap: Record<number, string> = {
        7: 'highlinepromo', // High Line
        // Adicionar outros estabelecimentos conforme necessário
      };
      
      if (establishmentPromoterMap[establishmentId]) {
        setEstablishmentPromoterCode(establishmentPromoterMap[establishmentId]);
      }
    } catch (error) {
      console.error('Erro ao buscar eventos do estabelecimento:', error);
    } finally {
      setEstablishmentEventsLoading(false);
    }
  };

  const handleEstablishmentSelect = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
    loadAreas(establishment.id);
    setSelectedSubareaKey('');
    setReservationData((prev) => ({
      ...prev,
      area_id: '',
      reservation_time: '',
      table_number: '',
    }));
    setStep('form');
    // Buscar eventos e promoter do estabelecimento
    loadEstablishmentEvents(establishment.id);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!reservationData.client_name.trim()) {
      newErrors.client_name = 'Nome é obrigatório';
    }

    if (!reservationData.client_phone.trim()) {
      newErrors.client_phone = 'Telefone é obrigatório';
    }

    // Validação 18+
    if (!reservationData.client_birthdate) {
      newErrors.client_birthdate = 'Data de nascimento é obrigatória';
    } else {
      const bd = new Date(reservationData.client_birthdate + 'T00:00:00');
      const today = new Date();
      const eighteen = new Date(today);
      eighteen.setFullYear(today.getFullYear() - 18);
      if (bd > eighteen) {
        newErrors.client_birthdate = 'Para reservar, é obrigatório ser maior de 18 anos.';
      }
    }

    if (!reservationData.reservation_date) {
      newErrors.reservation_date = 'Data é obrigatória';
    }

    if (!reservationData.reservation_time) {
      newErrors.reservation_time = 'Horário é obrigatório';
    }

    if (
      reservationData.reservation_time &&
      availableTimeSlots.length > 0 &&
      !availableTimeSlots.includes(reservationData.reservation_time)
    ) {
      newErrors.reservation_time = 'Escolha um horário disponível na lista.';
    }

    // Regra de horário de funcionamento do Highline
    if (isHighline) {
      const windows = getHighlineTimeWindows(reservationData.reservation_date, selectedSubareaKey);
      const hasWindows = windows.length > 0;
      if (!hasWindows) {
        newErrors.reservation_time = 'Reservas fechadas para o dia selecionado no Highline.';
      } else if (reservationData.reservation_time && !isTimeWithinWindows(reservationData.reservation_time, windows)) {
        newErrors.reservation_time = 'Horário fora do funcionamento. Consulte os horários disponíveis abaixo.';
      }
    }

    if (!reservationData.area_id) {
      newErrors.area_id = 'Área é obrigatória';
    }

    if (reservationData.number_of_people < 1) {
      newErrors.number_of_people = 'Número de pessoas deve ser maior que 0';
    }

    // Removido: cliente não escolhe mesa; admin define a mesa

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) {
    return;
  }

  setLoading(true);

  // 1. Unifica a preparação do payload para TODAS as reservas
  const payload: any = {
    ...reservationData,
    establishment_id: selectedEstablishment?.id,
    
    // Converte os campos para número, como o backend provavelmente espera
    number_of_people: Number(reservationData.number_of_people),
    area_id: Number(reservationData.area_id),
    
    // Campos de status padrão
    status: 'NOVA',
    origin: 'SITE',

    // Renomeia o campo de data de nascimento para o padrão do backend
    data_nascimento_cliente: reservationData.client_birthdate || null,
    
    // Flags para envio de notificações (sempre true para reservas do site)
    send_email: true,
    send_whatsapp: true,
  };
  
  // 2. CORREÇÃO CRÍTICA: Garante que o horário esteja no formato HH:mm:ss
  if (payload.reservation_time && payload.reservation_time.split(':').length === 2) {
    payload.reservation_time = `${payload.reservation_time}:00`;
  }

  // 3. Remove chaves que só existem no frontend para evitar dados sujos
  delete payload.client_birthdate;
  if (!payload.table_number) {
    delete payload.table_number;
  }

  // 4. Lógica para reservas grandes (11+ pessoas vão para large-reservations, 4-10 vão para restaurant-reservations)
  const isLargeGroup = payload.number_of_people >= 11; // CORRIGIDO: apenas 11+ pessoas vão para large-reservations
  const isMediumGroup = payload.number_of_people >= 4 && payload.number_of_people < 11; // 4-10 pessoas
  
  if (isLargeGroup || isMediumGroup) {
    const reservationDate = new Date(`${reservationData.reservation_date}T00:00:00`);
    const dayOfWeek = reservationDate.getDay(); // Domingo = 0, Sexta = 5, Sábado = 6
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Sexta ou Sábado
    const isHighLine = payload.establishment_id === 1;

    // Detectar automaticamente o tipo de evento
    if (isWeekend && isHighLine) {
      // Aniversário no HighLine (sexta/sábado)
      payload.event_type = 'aniversario';
    } else if (dayOfWeek === 5) {
      // Sexta-feira para reservas grandes
      payload.event_type = 'lista_sexta';
    } else if (dayOfWeek === 6 && eventType) {
      // Sábado com tipo selecionado pelo usuário
      payload.event_type = eventType;
    } else {
      // Reserva grande em outros dias
      payload.event_type = 'despedida';
    }
  }

  // Log para depuração: verifique o que está sendo enviado
  console.log('📦 Payload final sendo enviado para a API:', JSON.stringify(payload, null, 2));

  try {
    // 5. Determina o endpoint correto
    // CORRIGIDO: apenas reservas com 11+ pessoas vão para large-reservations
    const endpoint = isLargeGroup
      ? `${API_URL}/api/large-reservations`
      : `${API_URL}/api/restaurant-reservations`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Reserva criada com sucesso:', result);
      
      // 🎂 NOVA FUNCIONALIDADE: Detectar reserva de aniversário e criar lista automaticamente
      const reservationId = result.reservation?.id || result.id;
      const isBirthdayReservation = await detectAndCreateBirthdayGuestList(reservationId, payload);
      setBirthdayGuestListCreated(isBirthdayReservation);
      
      // Armazena o ID e o link da lista de convidados (se houver)
      setReservationId(reservationId || 'N/A');
      setGuestListLink(result.guest_list_link || null);
      
      setStep('confirmation');
    } else {
      // Tratamento de erro melhorado
      const errorText = await response.text();
      console.error('❌ Erro bruto do servidor:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        alert(`Erro ao fazer reserva: ${errorData.message || errorData.error || JSON.stringify(errorData)}`);
      } catch {
        alert(`Ocorreu um erro inesperado no servidor. Detalhes: ${errorText}`);
      }
    }
  } catch (error) {
    console.error('Erro de rede ou na requisição:', error);
    alert('Erro ao fazer reserva. Verifique sua conexão e tente novamente.');
  } finally {
    setLoading(false);
  }
};


  const handleInputChange = (field: string, value: any) => {
    setReservationData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 dias no futuro
    return maxDate.toISOString().split('T')[0];
  };
  const getMaxBirthdate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  };

  const createSlotsFromWindow = (start: string, end: string) => {
    const slots: string[] = [];
    if (!start || !end) return slots;

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    if (isNaN(startHour) || isNaN(endHour)) return slots;

    const startTotal = startHour * 60 + (isNaN(startMinute) ? 0 : startMinute);
    const endTotal = endHour * 60 + (isNaN(endMinute) ? 0 : endMinute);

    for (let current = startTotal; current <= endTotal; current += 30) {
      const hour = Math.floor(current / 60);
      const minute = current % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }

    return slots;
  };

  const getDefaultTimeWindows = (dateStr: string) => {
    if (!dateStr) return [] as Array<{ start: string; end: string; label?: string }>;
    const date = new Date(`${dateStr}T00:00:00`);
    const weekday = date.getDay();

    if (weekday === 6) {
      return [{ start: '14:00', end: '23:00', label: 'Sábado - Horário estendido' }];
    }

    if (weekday === 5) {
      return [{ start: '18:00', end: '23:30', label: 'Sexta-feira - Noite' }];
    }

    return [{ start: '18:00', end: '22:30', label: 'Horário padrão' }];
  };

  const computeAvailableTimeSlots = () => {
    if (!reservationData.reservation_date) return [] as string[];

    if (isHighline) {
      const windows = getHighlineTimeWindows(reservationData.reservation_date, selectedSubareaKey);
      if (!selectedSubareaKey && windows.length > 1) {
        return [];
      }
      return windows.flatMap((window) => createSlotsFromWindow(window.start, window.end));
    }

    const windows = getDefaultTimeWindows(reservationData.reservation_date);
    return windows.flatMap((window) => createSlotsFromWindow(window.start, window.end));
  };

  const formatEventDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).replace('.', '');
  };

  const formatPromoterEventDate = (dateStr?: string | null, timeStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '';

    const formattedDate = date
      .toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })
      .replace(/\.$/, '')
      .replace('.', '');

    if (!timeStr) return formattedDate;

    const [hour, minute] = timeStr.split(':');
    if (!hour) return formattedDate;
    const timeDisplay = `${hour.padStart(2, '0')}:${(minute || '00').padStart(2, '0')}`;

    return `${formattedDate} • ${timeDisplay}`;
  };

  const uniquePromoterEvents = useMemo(() => {
    if (!promoterEvents || promoterEvents.length === 0) return [];
    const map = new Map<number, PromoterEvent>();
    promoterEvents.forEach((event) => {
      if (!event || !event.id || !event.imagem_url) return;
      if (!map.has(event.id)) {
        map.set(event.id, event);
      }
    });
    return Array.from(map.values());
  }, [promoterEvents]);

  useEffect(() => {
    if (!reservationData.reservation_date) {
      setAvailableTimeSlots([]);
      return;
    }

    if (!reservationData.area_id && !(isHighline && selectedSubareaKey)) {
      setAvailableTimeSlots([]);
      return;
    }

    const slots = computeAvailableTimeSlots();
    setAvailableTimeSlots(slots);

    if (
      reservationData.reservation_time &&
      slots.length > 0 &&
      !slots.includes(reservationData.reservation_time)
    ) {
      setReservationData((prev) => ({
        ...prev,
        reservation_time: '',
      }));
    }
  }, [
    reservationData.reservation_date,
    reservationData.area_id,
    selectedSubareaKey,
    isHighline,
    selectedEstablishment,
  ]);

  const establishmentsMap = useMemo(() => {
    const map = new Map<string, Establishment>();
    establishments.forEach((est) => {
      map.set(String(est.id), est);
    });
    return map;
  }, [establishments]);

  const upcomingEventsByEstablishment = useMemo(() => {
    const eventsList = Object.entries(upcomingEvents)
      .map(([key, events]) => {
        const establishment = establishmentsMap.get(key);
        if (!establishment || !events || events.length === 0) {
          return null;
        }
        return {
          establishment,
          events,
        };
      })
      .filter((item): item is { establishment: Establishment; events: OperationalDetail[] } => Boolean(item))
      .sort((a, b) =>
        (a.events[0]?.event_date || '').localeCompare(b.events[0]?.event_date || '')
      );
    
    // Se há um estabelecimento selecionado, filtrar apenas os eventos desse estabelecimento
    // Caso contrário, mostrar todos os eventos
    if (selectedEstablishment) {
      const filtered = eventsList.filter(item => {
        // Comparar tanto por ID quanto por nome (para garantir compatibilidade)
        const matchesId = item.establishment.id === selectedEstablishment.id;
        const matchesName = item.establishment.name.toLowerCase().includes(selectedEstablishment.name.toLowerCase()) ||
                           selectedEstablishment.name.toLowerCase().includes(item.establishment.name.toLowerCase());
        return matchesId || matchesName;
      });
      console.log('🔍 Eventos filtrados para estabelecimento selecionado:', {
        selectedEstablishment: selectedEstablishment.name,
        selectedId: selectedEstablishment.id,
        totalEvents: eventsList.length,
        filteredEvents: filtered.length,
        filtered: filtered.map(f => ({ name: f.establishment.name, id: f.establishment.id, eventsCount: f.events.length }))
      });
      return filtered;
    }
    
    return eventsList;
  }, [upcomingEvents, establishmentsMap, selectedEstablishment]);

  const selectedEstablishmentEvents = useMemo(() => {
    if (!selectedEstablishment) return [] as OperationalDetail[];
    const key = String(selectedEstablishment.id);
    const events = upcomingEvents[key] || [];
    return events.slice(0, 4);
  }, [selectedEstablishment, upcomingEvents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Faça sua Reserva
          </h1>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg px-2">
            Escolha seu estabelecimento preferido e garante sua mesa
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
              step === 'establishment' ? 'bg-orange-500 text-white' : 
              step === 'form' || step === 'confirmation' ? 'bg-green-500 text-white' : 
              'bg-gray-600 text-gray-300'
            }`}>
              <MdRestaurant size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div className={`w-8 sm:w-16 h-1 ${
              step === 'form' || step === 'confirmation' ? 'bg-green-500' : 'bg-gray-600'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
              step === 'form' ? 'bg-orange-500 text-white' : 
              step === 'confirmation' ? 'bg-green-500 text-white' : 
              'bg-gray-600 text-gray-300'
            }`}>
              <MdCalendarToday size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div className={`w-8 sm:w-16 h-1 ${
              step === 'confirmation' ? 'bg-green-500' : 'bg-gray-600'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
              step === 'confirmation' ? 'bg-orange-500 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              <MdCheck size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>

        {/* Step 1: Establishment Selection */}
        {step === 'establishment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-4 sm:p-6 md:p-8"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
              Escolha seu Estabelecimento
            </h2>
            
            {establishmentsLoading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-gray-600 text-sm sm:text-base">Carregando estabelecimentos...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {establishments.map((establishment) => (
                <motion.button
                  key={establishment.id}
                  onClick={() => handleEstablishmentSelect(establishment)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 sm:p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-300 hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <img
                        src={establishment.logo}
                        alt={establishment.name}
                        className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                        {establishment.name}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
                        {establishment.address}
                      </p>
                    </div>
                  </div>
                  {establishment.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MdPhone size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{establishment.phone}</span>
                    </div>
                  )}
                </motion.button>
                ))}
              </div>
            )}
            
            {!establishmentsLoading && (
              <div className="mt-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center mb-4">
                  Próximos eventos em destaque
                </h3>

                {upcomingEventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-gray-500 text-sm">Carregando eventos...</p>
                    </div>
                  </div>
                ) : upcomingEventsError ? (
                  <p className="text-center text-sm text-red-500">{upcomingEventsError}</p>
                ) : upcomingEventsByEstablishment.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">
                    Nenhum evento futuro disponível no momento. Fique de olho na nossa agenda!
                  </p>
                ) : (
                  <div className="space-y-6">
                    {upcomingEventsByEstablishment.map(({ establishment, events }) => (
                      <div
                        key={establishment.id}
                        className="rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/40 shadow-xl p-4 sm:p-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                          <div>
                            <p className="text-xs uppercase tracking-widest text-orange-300/80">Próximos eventos</p>
                            <h4 className="text-xl font-semibold text-white">{establishment.name}</h4>
                            <p className="text-gray-300 text-sm">{establishment.address}</p>
                          </div>
                          <button
                            onClick={() => handleEstablishmentSelect(establishment)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors shadow-md"
                          >
                            Reservar nesta casa
                          </button>
                        </div>

                        <div className="overflow-x-auto pb-2">
                          <div className="flex gap-4 min-w-full">
                            {events.slice(0, 4).map((event, index) => (
                              <div
                                key={`${event.id ?? event.event_date}-${index}`}
                                className="min-w-[220px] rounded-2xl border border-gray-700/60 bg-white/5 backdrop-blur-sm p-4 text-white shadow-lg hover:border-orange-400/70 transition-colors"
                              >
                                <div className="h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-700 mb-3 relative">
                                  {event.visual_reference_url ? (
                                    <img
                                      src={event.visual_reference_url}
                                      alt={event.artistic_attraction || 'Evento'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-orange-200 text-sm px-3 text-center">
                                      Em breve imagem deste evento
                                    </div>
                                  )}
                                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full text-xs font-semibold">
                                    {formatEventDate(event.event_date)}
                                  </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                  {event.artistic_attraction && (
                                    <p className="font-semibold text-white leading-snug">
                                      {event.artistic_attraction}
                                    </p>
                                  )}
                                  {event.show_schedule && (
                                    <p className="text-xs text-gray-300 whitespace-pre-line">
                                      {event.show_schedule}
                                    </p>
                                  )}
                                  {event.ticket_prices && (
                                    <p className="text-xs text-orange-200 whitespace-pre-line">
                                      {event.ticket_prices}
                                    </p>
                                  )}
                                  {event.promotions && (
                                    <p className="text-xs text-green-200 whitespace-pre-line">
                                      {event.promotions}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Reservation Form */}
        {step === 'form' && selectedEstablishment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-4 sm:p-6 md:p-8"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <button
                onClick={() => setStep('establishment')}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <MdArrowBack size={20} className="sm:w-6 sm:h-6" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                  Dados da Reserva
                </h2>
                <p className="text-gray-600 text-sm sm:text-base truncate">
                  {selectedEstablishment.name}
                </p>
              </div>
            </div>

            {/* Seção de eventos disponíveis - Mostrar para todos os estabelecimentos */}
            {establishmentEventsLoading ? (
              <div className="mb-6 flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-500 text-sm">Carregando eventos...</p>
                </div>
              </div>
            ) : establishmentEvents.length > 0 && (
              <div className="mb-6 rounded-2xl bg-gradient-to-br from-orange-50 via-white to-orange-50/30 border border-orange-200/50 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      Eventos disponíveis nesta casa
                    </h3>
                    <p className="text-sm text-gray-600">
                      Não quer reservar mesa? Coloque seu nome na lista do promoter!
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {establishmentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      {event.imagem_do_evento_url && (
                        <div className="relative h-32 overflow-hidden">
                          <img
                            src={event.imagem_do_evento_url}
                            alt={event.nome_do_evento}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 mb-2">
                          <MdEvent size={16} />
                          <span>
                            {event.data_do_evento 
                              ? new Date(event.data_do_evento).toLocaleDateString('pt-BR', { 
                                  day: '2-digit', 
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : 'Data a definir'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                          {event.nome_do_evento}
                        </h4>
                        {event.hora_do_evento && (
                          <p className="text-xs text-gray-600 mb-3">
                            {event.hora_do_evento}
                          </p>
                        )}
                        {establishmentPromoterCode ? (
                          <Link
                            href={`/promoter/${establishmentPromoterCode}${event.id ? `?evento=${event.id}` : ''}`}
                            className="inline-flex items-center justify-center w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 transition-colors"
                          >
                            Entrar na lista
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center justify-center w-full rounded-lg bg-gray-300 text-gray-500 text-sm font-semibold px-4 py-2 cursor-not-allowed"
                          >
                            Lista não disponível
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isHighline && (
              <div className="mb-10 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-tr from-slate-900 via-indigo-900 to-slate-900 p-1">
                <div className="rounded-[26px] bg-slate-950/70 p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-3 flex-1 max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-400">
                        Highline Promo
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                        Só quer entrar? Coloque seu nome na lista do promoter.
                      </h3>
                      <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                        Para quem prefere vivenciar a noite do High Line sem reservar mesa, a lista do promoter garante entrada em horários alternativos e com a experiência de balada completa.
                      </p>
                    </div>
                    <Link
                      href="/promoter/highlinepromo"
                      className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:-translate-y-0.5 hover:bg-orange-600 whitespace-nowrap flex-shrink-0"
                    >
                      Ir para a lista do promoter
                    </Link>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
                        Eventos em destaque
                      </h4>
                      <Link
                        href="/promoter/highlinepromo"
                        className="text-xs font-semibold text-orange-300 hover:text-orange-200 transition"
                      >
                        Ver programação completa →
                      </Link>
                    </div>

                    {promoterEventsLoading && (
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                        Carregando eventos do promoter...
                      </div>
                    )}

                    {promoterEventsError && !promoterEventsLoading && (
                      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                        {promoterEventsError}
                      </div>
                    )}

                    {!promoterEventsLoading && !promoterEventsError && uniquePromoterEvents.length === 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                        Nenhum evento com imagem disponível no momento. Volte em breve para conferir as novidades do High Line Promo.
                      </div>
                    )}

                    {!promoterEventsLoading && uniquePromoterEvents.length > 0 && (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {uniquePromoterEvents.slice(0, 6).map((event) => (
                          <div
                            key={event.id}
                            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                          >
                            {event.imagem_url && (
                              <>
                                <img
                                  src={event.imagem_url}
                                  alt={event.nome}
                                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/20" />
                              </>
                            )}
                            <div className="relative z-10 flex h-full flex-col justify-between p-5">
                              <div className="space-y-3">
                                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80 backdrop-blur">
                                  {formatPromoterEventDate(event.data, event.hora)}
                                </span>
                                <h5 className="text-lg font-bold text-white leading-snug">
                                  {event.nome}
                                </h5>
                                {event.local_nome && (
                                  <p className="text-xs font-medium text-white/70">
                                    {event.local_nome}
                                  </p>
                                )}
                              </div>
                              <div className="mt-5 flex">
                                <Link
                                  href="/promoter/highlinepromo"
                                  className="inline-flex items-center justify-center rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/25"
                                >
                                  Entrar na lista
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedEstablishmentEvents.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Eventos próximos nesta casa</h3>
                  <span className="text-xs uppercase tracking-widest text-orange-500">
                    Atualizamos diariamente
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedEstablishmentEvents.map((event, index) => (
                    <div
                      key={`${event.id ?? event.event_date}-selected-${index}`}
                      className="rounded-xl border border-gray-200 bg-gradient-to-br from-orange-50 via-white to-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                          <MdEvent />
                          <span>{formatEventDate(event.event_date)}</span>
                        </div>
                        {event.show_schedule && (
                          <span className="text-xs text-gray-500">{event.show_schedule}</span>
                        )}
                      </div>
                      {event.artistic_attraction && (
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          {event.artistic_attraction}
                        </p>
                      )}
                      {event.ticket_prices && (
                        <p className="text-xs text-gray-600 mt-2 whitespace-pre-line">
                          {event.ticket_prices}
                        </p>
                      )}
                      {event.promotions && (
                        <p className="text-xs text-green-600 mt-2 whitespace-pre-line">
                          {event.promotions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={reservationData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base ${
                      errors.client_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Seu nome completo"
                  />
                  {errors.client_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={reservationData.client_phone}
                    onChange={(e) => handleInputChange('client_phone', e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base ${
                      errors.client_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.client_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.client_phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={reservationData.client_email}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="seu@email.com"
                  />
                </div>

                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Nascimento
                        </label>
                            <input
                              type="date"
                              value={reservationData.client_birthdate}
                              onChange={(e) => handleInputChange('client_birthdate', e.target.value)}
                              max={getMaxBirthdate()}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                            />
                          {errors.client_birthdate && (
                            <p className="text-red-500 text-sm mt-1">{errors.client_birthdate}</p>
                          )}
                          {!errors.client_birthdate && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-gray-500 text-xs">Para reservar, é obrigatório ser maior de 18 anos.</p>
                              <button
                                type="button"
                                onClick={() => setShowAgeModal(true)}
                                className="text-orange-600 hover:text-orange-800 text-xs underline font-medium"
                              >
                                Saiba mais
                              </button>
                            </div>
                          )}
                  </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Pessoas *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={reservationData.number_of_people}
                    onChange={(e) => handleInputChange('number_of_people', parseInt(e.target.value || '0'))}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base ${
                      errors.number_of_people ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.number_of_people && (
                    <p className="text-red-500 text-sm mt-1">{errors.number_of_people}</p>
                  )}
                  
                  {/* Indicador de reserva grande */}
                  {reservationData.number_of_people >= 4 && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-400 rounded-lg shadow-lg">
                      <div className="flex items-center gap-2 text-orange-900">
                        <MdPeople className="text-orange-600 text-lg" />
                        <span className="text-sm font-bold">⚠️ RESERVA GRANDE</span>
                      </div>
                      <p className="text-sm text-orange-800 mt-2 font-medium">
                        Para grupos acima de 10 pessoas, você pode escolher apenas a área. 
                        O admin selecionará as mesas específicas.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reservation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Reserva *
                  </label>
                    <input
                      type="date"
                      min={getMinDate()}
                      max={getMaxDate()}
                      value={reservationData.reservation_date}
                      onChange={(e) => {
                        handleInputChange('reservation_date', e.target.value);
                        handleInputChange('table_number', ''); // Adicione esta linha
                        handleInputChange('reservation_time', '');
                      }}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base ${
                        errors.reservation_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  {errors.reservation_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.reservation_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Área Preferida *
                  </label>
                  <select
                    value={(isHighline || isSeuJustino) ? selectedSubareaKey : reservationData.area_id}
                    onChange={(e) => {
                      if (isHighline || isSeuJustino) {
                        const key = e.target.value;
                        setSelectedSubareaKey(key);
                        const sub = isHighline 
                          ? highlineSubareas.find(s => s.key === key)
                          : seuJustinoSubareas.find(s => s.key === key);
                        handleInputChange('area_id', sub ? String(sub.area_id) : '');
                        handleInputChange('table_number', '');
                        handleInputChange('reservation_time', '');
                      } else {
                        handleInputChange('area_id', e.target.value);
                        handleInputChange('table_number', '');
                        handleInputChange('reservation_time', '');
                      }
                    }}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base ${
                      errors.area_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione uma área</option>
                    {isHighline
                      ? highlineSubareas.map((s) => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))
                      : isSeuJustino
                      ? seuJustinoSubareas.map((s) => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))
                      : areas.map((area) => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                  </select>
                  {errors.area_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.area_id}</p>
                  )}
                  {(isHighline || isSeuJustino) && selectedSubareaKey && tables.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {tables.map(t => (
                        <div key={t.id} className="px-2 py-1 rounded border bg-blue-50 text-blue-700 border-blue-200">
                          Mesa {t.table_number} • {t.capacity}p
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário *
                  </label>
                  <select
                    value={reservationData.reservation_time}
                    onChange={(e) => handleInputChange('reservation_time', e.target.value)}
                    disabled={availableTimeSlots.length === 0}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base ${
                      errors.reservation_time ? 'border-red-500' : 'border-gray-300'
                    } ${availableTimeSlots.length === 0 ? 'bg-gray-100 text-gray-500' : ''}`}
                  >
                    <option value="">
                      {availableTimeSlots.length === 0
                        ? 'Selecione a área e a data para ver os horários'
                        : 'Selecione um horário disponível'}
                    </option>
                    {availableTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {errors.reservation_time && (
                    <p className="text-red-500 text-sm mt-1">{errors.reservation_time}</p>
                  )}
                  {isHighline && reservationData.reservation_date && (
                    <div className="mt-2 text-xs text-gray-600">
                      {(() => {
                        const windows = getHighlineTimeWindows(reservationData.reservation_date, selectedSubareaKey);
                        if (windows.length === 0) {
                          return (
                            <div className="p-4 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-400 rounded-lg shadow-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <MdAccessTime className="text-red-600 text-lg" />
                                <span className="font-bold text-red-900">❌ RESERVAS FECHADAS</span>
                              </div>
                              <p className="text-sm text-red-800 font-medium">
                                Reservas fechadas para este dia no Highline. Disponível apenas Sexta e Sábado.
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div className="p-4 bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-400 rounded-lg shadow-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <MdAccessTime className="text-amber-600 text-lg" />
                              <span className="font-bold text-amber-900">🕐 HORÁRIOS DISPONÍVEIS:</span>
                            </div>
                            <ul className="list-disc pl-5 text-amber-800 font-medium">
                              {windows.map((w, i) => (
                                <li key={i} className="text-sm">{w.label}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Card de Detalhes Operacionais */}
              {operationalDetails && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 sm:p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <MdEvent className="text-purple-600 text-xl" />
                    <h3 className="text-lg font-bold text-purple-900">
                      Evento Especial - {new Date(operationalDetails.event_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </h3>
                  </div>

                  {operationalDetails.visual_reference_url && (
                    <div className="mb-4">
                      <img
                        src={operationalDetails.visual_reference_url}
                        alt="Arte do evento"
                        className="w-full rounded-lg shadow-md max-h-64 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {operationalDetails.artistic_attraction && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-purple-800 mb-1">🎭 Atrativos Artísticos:</p>
                      <p className="text-sm text-purple-900 whitespace-pre-line">{operationalDetails.artistic_attraction}</p>
                      {operationalDetails.show_schedule && (
                        <p className="text-xs text-purple-700 mt-1 whitespace-pre-line">{operationalDetails.show_schedule}</p>
                      )}
                    </div>
                  )}

                  {operationalDetails.ticket_prices && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-purple-800 mb-1">💰 Preços:</p>
                      <p className="text-sm text-purple-900 whitespace-pre-line">{operationalDetails.ticket_prices}</p>
                    </div>
                  )}

                  {operationalDetails.promotions && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-purple-800 mb-1">🎁 Promoções e Brindes:</p>
                      <p className="text-sm text-purple-900 whitespace-pre-line">{operationalDetails.promotions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Lógica condicional sexta/sábado para reservas grandes */}
              {reservationData.number_of_people >= 4 && reservationData.reservation_date && (
                (() => {
                  const d = new Date(reservationData.reservation_date + 'T00:00:00');
                  const weekday = d.getDay(); // 5=sexta, 6=sábado
                  if (weekday === 5) {
                    return (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="text-emerald-800 text-sm">
                          Sexta-feira: opção de criar lista de convidados disponível. O link será exibido após confirmar.
                        </div>
                      </div>
                    );
                  }
                  if (weekday === 6) {
                    return (
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <label className="block text-sm font-medium text-indigo-900 mb-2">Tipo de evento (sábado)</label>
                        <div className="flex items-center gap-6 text-sm text-indigo-900">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="event_type"
                              checked={eventType === 'aniversario'}
                              onChange={() => setEventType('aniversario')}
                            />
                            Aniversário
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="event_type"
                              checked={eventType === 'despedida'}
                              onChange={() => setEventType('despedida')}
                            />
                            Despedida
                          </label>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              {/* Removido: seleção de mesa pelo cliente */}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={reservationData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Alguma observação especial? (ex: aniversário, mesa próxima à janela, etc.)"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center sm:justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <MdCheck size={18} className="sm:w-5 sm:h-5" />
                      <span>Confirmar Reserva</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirmation' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-4 sm:p-6 md:p-8 text-center"
  >
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
      <MdCheck size={32} className="sm:w-10 sm:h-10 text-green-600" />
    </div>

    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
      Reserva Confirmada!
    </h2>

    <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-2">
      Sua reserva foi realizada com sucesso. Você receberá uma confirmação por telefone ou email.
    </p>

    {/* 🎂 MENSAGEM ESPECIAL PARA ANIVERSÁRIOS E RESERVAS GRANDES */}
    {birthdayGuestListCreated && (
      <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg">
        <div className="flex items-center justify-center mb-2">
          <span className="text-2xl mr-2">🎂</span>
          <h3 className="text-pink-800 font-bold text-lg">Lista de Convidados Criada!</h3>
        </div>
        <p className="text-pink-700 text-sm mb-3">
          Como você fez uma reserva especial (aniversário no HighLine ou grupo grande), 
          criamos automaticamente uma lista de convidados para você ter direito aos benefícios!
        </p>
        <div className="bg-white/70 rounded-lg p-3 text-xs text-pink-600">
          <strong>Benefícios incluídos:</strong> Desconto especial, decoração da mesa, 
          parabéns personalizado e muito mais!
        </div>
      </div>
    )}

    <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 text-left">
      <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Detalhes da Reserva:</h3>
      <div className="space-y-2 text-xs sm:text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Estabelecimento:</span>
          <span className="font-medium">{selectedEstablishment?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Data:</span>
          <span className="font-medium">
            {reservationData.reservation_date ? formatDateBR(reservationData.reservation_date) : 'Data não informada'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Horário:</span>
          <span className="font-medium">{reservationData.reservation_time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Pessoas:</span>
          <span className="font-medium">{reservationData.number_of_people}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Área:</span>
          <span className="font-medium">
            {isHighline 
              ? highlineSubareas.find(s => s.area_id.toString() === reservationData.area_id)?.label
              : isSeuJustino
              ? seuJustinoSubareas.find(s => s.area_id.toString() === reservationData.area_id)?.label
              : areas.find(a => a.id.toString() === reservationData.area_id)?.name
            }
          </span>
        </div>
        {reservationId && (
          <div className="flex justify-between">
            <span className="text-gray-600">Código:</span>
            <span className="font-medium font-mono">{reservationId}</span>
          </div>
        )}
      </div>
    </div>

    {/* Alertas Importantes na Confirmação */}
    <div className="space-y-4 mb-6">
      {/* Alerta de Idade */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🚫</span>
          <span className="font-bold text-red-900">RESTRIÇÃO DE IDADE</span>
        </div>
        <p className="text-sm text-red-800 font-medium">
          Não aceitamos menores de 18 anos. Documento de identidade obrigatório.
        </p>
      </div>

      {/* Alerta de Horários (se for Highline) */}
      {isHighline && reservationData.reservation_date && (
        (() => {
          const windows = getHighlineTimeWindows(reservationData.reservation_date, selectedSubareaKey);
          if (windows.length > 0) {
            return (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🕐</span>
                  <span className="font-bold text-amber-900">HORÁRIOS DE FUNCIONAMENTO</span>
                </div>
                <ul className="text-sm text-amber-800 font-medium">
                  {windows.map((w, i) => (
                    <li key={i}>• {w.label}</li>
                  ))}
                </ul>
              </div>
            );
          }
          return null;
        })()
      )}

      {/* Alerta de Reserva Grande */}
      {reservationData.number_of_people >= 4 && (
        <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-400 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚠️</span>
            <span className="font-bold text-orange-900">RESERVA GRANDE</span>
          </div>
          <p className="text-sm text-orange-800 font-medium">
            Para grupos acima de 10 pessoas, você pode escolher apenas a área. 
            O admin selecionará as mesas específicas.
          </p>
        </div>
      )}

      {/* Informações de Contato */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📞</span>
          <span className="font-bold text-green-900">INFORMAÇÕES DE CONTATO</span>
        </div>
        <p className="text-sm text-green-800 font-medium">
          Para mais informações, entre em contato pelo WhatsApp (11) 3032-2937 Highline
        </p>
      </div>
    </div>

    {guestListLink && (
      <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-left">
        <div className="text-emerald-900 font-semibold mb-2">Lista de Convidados</div>
        <p className="text-emerald-800 text-sm mb-3">Seu link foi gerado. Compartilhe com seus convidados.</p>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input readOnly value={guestListLink} className="flex-1 px-3 py-2 border rounded" />
          <button
            onClick={() => navigator.clipboard.writeText(guestListLink)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
          >Copiar Link</button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent('Você está na minha lista de convidados: ' + guestListLink)}`}
            target="_blank"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-center"
          >Compartilhar no WhatsApp</a>
        </div>
      </div>
    )}

    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
      <button
        onClick={() => {
          setStep('establishment');
          setSelectedEstablishment(null);
          // Resetar o estado para a forma inicial completa
          setReservationData({
            client_name: '',
            client_phone: '',
            client_email: '',
            client_birthdate: '', // ✅ Corrigido
            reservation_date: '',
            reservation_time: '',
            number_of_people: 2,
            area_id: '',
            table_number: '',
            notes: '',
          });
        }}
        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm sm:text-base"
      >
        Nova Reserva
      </button>
      <button
        onClick={() => router.push('/')}
        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm sm:text-base"
      >
        Voltar ao Início
      </button>
    </div>
  </motion.div>
        )}

        {/* Modal de Restrição de Idade */}
        {showAgeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚫</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Restrição de Idade
                </h3>
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-gray-700 font-medium">
                    <strong>Não aceitamos menores de 18 anos</strong> em nossos estabelecimentos.
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Esta é uma política de segurança e responsabilidade social. 
                    Todos os clientes devem apresentar documento de identidade válido.
                  </p>
                </div>
                <button
                  onClick={() => setShowAgeModal(false)}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}