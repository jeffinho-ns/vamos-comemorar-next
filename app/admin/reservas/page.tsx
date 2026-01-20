"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import SafeImage from "../../components/SafeImage";
import {
  MdRefresh,
  MdFilterList,
  MdCalendarToday,
  MdLocationOn,
  MdPeople,
  MdAttachMoney,
  MdCake,
  MdRestaurant,
  MdTrendingUp,
  MdCheckCircle,
  MdSchedule,
  MdEvent,
  MdSearch,
  MdExpandMore,
  MdExpandLess,
  MdPrint,
  MdDateRange,
  MdTrendingDown,
} from "react-icons/md";
import { FaBirthdayCake, FaGlassCheers, FaUtensils } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';

interface Establishment {
  id: number;
  name: string;
  logo?: string;
}

interface BirthdayReservation {
  id: number;
  aniversariante_nome: string;
  data_aniversario: string;
  reservation_time?: string;
  quantidade_convidados: number;
  id_casa_evento: number;
  place_name?: string;
  decoracao_tipo?: string;
  status?: string;
  created_at: string;
  whatsapp?: string;
  email?: string;
  confirmedGuestsCount?: number;
  totalRevenue?: number;
}

interface RestaurantReservation {
  id: number;
  client_name: string;
  reservation_date: string;
  reservation_time: string;
  number_of_people: number;
  establishment_id?: number;
  area_id?: number;
  area_name?: string;
  status: string;
  checked_in?: boolean;
  checkin_time?: string;
  created_at: string;
  client_phone?: string;
  client_email?: string;
  totalRevenue?: number;
}

interface ReservationGroup {
  establishment: Establishment;
  birthdayReservations: BirthdayReservation[];
  restaurantReservations: RestaurantReservation[];
  totalRevenue: number;
  totalGuests: number;
  upcomingCount: number;
}

interface Stats {
  totalReservations: number;
  totalRevenue: number;
  totalGuests: number;
  birthdayCount: number;
  restaurantCount: number;
  upcomingToday: number;
  upcomingWeek: number;
}

interface EventRevenue {
  evento_id: number;
  nome: string;
  data_evento: string;
  establishment_id: number;
  establishment_name: string;
  totalCheckIns: number;
  totalRevenue: number;
  revenueByType: {
    seco: number;
    consuma: number;
    vip: number;
  };
}

interface PeriodFilter {
  type: "today" | "week" | "month" | "custom" | "all";
  startDate?: string;
  endDate?: string;
}

interface RevenueByPeriod {
  day: number;
  week: number;
  month: number;
  total: number;
}

export default function ReservesPage() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [birthdayReservations, setBirthdayReservations] = useState<BirthdayReservation[]>([]);
  const [restaurantReservations, setRestaurantReservations] = useState<RestaurantReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEstablishment, setSelectedEstablishment] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedEstablishments, setExpandedEstablishments] = useState<Set<number>>(new Set());
  const [showStats, setShowStats] = useState(true);
  const [viewMode, setViewMode] = useState<"all" | "upcoming" | "today">("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({ type: "all" });
  const [eventRevenues, setEventRevenues] = useState<EventRevenue[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [revenueByPeriod, setRevenueByPeriod] = useState<Record<number, RevenueByPeriod>>({});
  const [showEventRevenues, setShowEventRevenues] = useState<Record<number, boolean>>({});

  // Carregar estabelecimentos
  const loadEstablishments = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/places`);
      if (response.ok) {
        const data = await response.json();
        const places = Array.isArray(data) ? data : (data.data || []);
        setEstablishments(places.map((p: any) => {
          // Formatar URL do logo corretamente
          let logoUrl = null;
          if (p.logo) {
            if (p.logo.startsWith('http://') || p.logo.startsWith('https://')) {
              logoUrl = p.logo;
            } else {
              logoUrl = `${API_URL}/uploads/${p.logo}`;
            }
          }
          
          return {
            id: Number(p.id) || 0,
            name: p.name || 'Sem nome',
            logo: logoUrl,
          };
        }).filter((e: Establishment) => e.id > 0));
      }
    } catch (error) {
      console.error("Erro ao carregar estabelecimentos:", error);
    }
  }, []);

  // Carregar reservas de aniversário
  const loadBirthdayReservations = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const url = selectedEstablishment
        ? `${API_URL}/api/birthday-reservations?establishment_id=${selectedEstablishment}`
        : `${API_URL}/api/birthday-reservations`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        let reservations = Array.isArray(data) ? data : [];

        // Filtrar por data se selecionada
        if (selectedDate) {
          reservations = reservations.filter((r: BirthdayReservation) => {
            const reservationDate = new Date(r.data_aniversario).toISOString().split('T')[0];
            return reservationDate === selectedDate;
          });
        }

        // Filtrar por termo de busca
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          reservations = reservations.filter((r: BirthdayReservation) =>
            r.aniversariante_nome?.toLowerCase().includes(term) ||
            r.place_name?.toLowerCase().includes(term) ||
            r.whatsapp?.includes(term) ||
            r.email?.toLowerCase().includes(term)
          );
        }

        // Receita das reservas de aniversário é calculada através dos eventos
        // Não buscar individualmente para evitar 404s - os valores vêm dos eventos
        const reservationsWithRevenue = reservations.map((r: BirthdayReservation) => ({
          ...r,
          totalRevenue: 0 // Receita será calculada através dos eventos, não individualmente
        }));

        setBirthdayReservations(reservationsWithRevenue);
      }
    } catch (error) {
      console.error("Erro ao carregar reservas de aniversário:", error);
    }
  }, [selectedEstablishment, selectedDate, searchTerm]);

  // Carregar reservas de restaurante
  const loadRestaurantReservations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (selectedEstablishment) params.append("establishment_id", selectedEstablishment.toString());

      const url = `/api/restaurant-reservations${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        let reservations = data.reservations || data || [];

        // Filtrar por termo de busca
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          reservations = reservations.filter((r: RestaurantReservation) =>
            r.client_name?.toLowerCase().includes(term) ||
            r.client_phone?.includes(term) ||
            r.client_email?.toLowerCase().includes(term) ||
            r.area_name?.toLowerCase().includes(term)
          );
        }

        // Calcular receita baseada em check-ins reais
        const reservationsWithRevenue = reservations.map((r: RestaurantReservation) => {
          // Por enquanto, não calcular receita estimada para reservas de restaurante
          // A receita real deve vir dos check-ins dos guests
          return { ...r, totalRevenue: 0 };
        });

        setRestaurantReservations(reservationsWithRevenue);
      }
    } catch (error) {
      console.error("Erro ao carregar reservas de restaurante:", error);
    }
  }, [selectedEstablishment, selectedDate, searchTerm]);

  // Carregar faturamento dos eventos por estabelecimento
  const loadEventRevenues = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Buscar todos os eventos passados e futuros por estabelecimento
      const eventsByEstablishment: Record<number, EventRevenue[]> = {};
      const revenueByPeriodData: Record<number, RevenueByPeriod> = {};

      for (const establishment of establishments) {
        if (!establishment.id) continue;

        try {
          // Buscar TODOS os eventos do estabelecimento (passados e futuros)
          // Não aplicar filtro de data aqui, queremos todos os eventos
          const eventsRes = await fetch(
            `${API_URL}/api/v1/eventos?establishment_id=${establishment.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          console.log(`🔍 Buscando eventos do estabelecimento ${establishment.name} (ID: ${establishment.id})`);

          if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            const eventos = Array.isArray(eventsData.eventos) ? eventsData.eventos : [];
            
            console.log(`✅ Encontrados ${eventos.length} eventos para ${establishment.name}`);

            // Processar cada evento para obter faturamento
            const establishmentRevenues: EventRevenue[] = [];

            for (const evento of eventos) {
              try {
                // Buscar check-ins consolidados do evento
                // Buscar TODOS os eventos, passados e futuros, para calcular receita completa
                console.log(`🔍 Buscando check-ins para evento ${evento.evento_id}: ${evento.nome} (${evento.data_evento || 'sem data'})`);
                const checkinsRes = await fetch(
                  `${API_URL}/api/v1/eventos/${evento.evento_id}/checkins`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                if (checkinsRes.ok) {
                  console.log(`📊 Processando evento: ${evento.nome} (${evento.data_evento || 'sem data'})`);
                  const checkinsData = await checkinsRes.json();
                  const dados = checkinsData.dados || {};
                  const estatisticas = checkinsData.estatisticas || {};
                  
                  console.log(`✅ Evento ${evento.nome} - Dados recebidos:`, {
                    convidadosReservas: dados.convidadosReservas?.length || 0,
                    convidadosReservasRestaurante: dados.convidadosReservasRestaurante?.length || 0,
                    guestListsRestaurante: dados.guestListsRestaurante?.length || 0,
                    convidadosPromoters: dados.convidadosPromoters?.length || 0,
                  });

                  // Helper para converter entrada_valor para número
                  const toNumber = (value: any): number => {
                    if (typeof value === 'number') return Math.max(0, value);
                    if (!value) return 0;
                    const str = String(value).replace(/[^\d.,]/g, '').replace(',', '.');
                    const parsed = parseFloat(str);
                    return isNaN(parsed) ? 0 : Math.max(0, parsed);
                  };

                  // Calcular faturamento baseado nos check-ins
                  let totalRevenue = 0;
                  const revenueByType = { seco: 0, consuma: 0, vip: 0 };

                  // Calcular de convidados de reservas
                  const convidadosReservas = dados.convidadosReservas || [];
                  convidadosReservas.forEach((c: any) => {
                    if (c.status === 'CHECK-IN' && c.entrada_valor) {
                      const valor = toNumber(c.entrada_valor);
                      totalRevenue += valor;
                      if (c.entrada_tipo === 'SECO') revenueByType.seco += valor;
                      else if (c.entrada_tipo === 'CONSUMA') revenueByType.consuma += valor;
                    }
                  });

                  // Calcular de convidados de restaurante
                  const convidadosReservasRestaurante = dados.convidadosReservasRestaurante || [];
                  convidadosReservasRestaurante.forEach((c: any) => {
                    const isCheckedIn = c.status_checkin === 1 || c.status_checkin === true || c.status_checkin === 'Check-in' || c.checked_in === 1 || c.checked_in === true;
                    if (isCheckedIn && c.entrada_valor) {
                      const valor = toNumber(c.entrada_valor);
                      totalRevenue += valor;
                      if (c.entrada_tipo === 'SECO' || c.entrada_tipo === 'seco') revenueByType.seco += valor;
                      else if (c.entrada_tipo === 'CONSUMA' || c.entrada_tipo === 'consuma') revenueByType.consuma += valor;
                    }
                  });

                  // Calcular de convidados de promoters
                  const convidadosPromoters = dados.convidadosPromoters || [];
                  convidadosPromoters.forEach((c: any) => {
                    if ((c.status_checkin === 'Check-in' || c.status_checkin === 'CHECK-IN') && c.entrada_valor) {
                      const valor = toNumber(c.entrada_valor);
                      totalRevenue += valor;
                      if (c.entrada_tipo === 'SECO') revenueByType.seco += valor;
                      else if (c.entrada_tipo === 'CONSUMA') revenueByType.consuma += valor;
                    }
                  });

                  // Calcular de guest lists de restaurante
                  // Precisamos buscar os guests individualmente de cada guest list
                  const guestListsRestaurante = dados.guestListsRestaurante || [];
                  let totalGuestsRevenue = 0;
                  let guestsProcessed = 0;
                  let guestsWithRevenue = 0;
                  
                  // Tentar buscar guests da resposta ou fazer requisições adicionais
                  for (const gl of guestListsRestaurante) {
                    try {
                      // Tentar buscar guests desta guest list
                      const guestsRes = await fetch(
                        `${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/guests`,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );

                      if (guestsRes.ok) {
                        const guestsData = await guestsRes.json();
                        const guests = Array.isArray(guestsData.guests) ? guestsData.guests : [];
                        guestsProcessed += guests.length;
                        
                        guests.forEach((g: any) => {
                          const isCheckedIn = g.checked_in === 1 || g.checked_in === true || g.checked_in === 'Check-in';
                          if (isCheckedIn && g.entrada_valor) {
                            const valor = toNumber(g.entrada_valor);
                            totalRevenue += valor;
                            totalGuestsRevenue += valor;
                            guestsWithRevenue++;
                            if (g.entrada_tipo === 'SECO' || g.entrada_tipo === 'seco') revenueByType.seco += valor;
                            else if (g.entrada_tipo === 'CONSUMA' || g.entrada_tipo === 'consuma') revenueByType.consuma += valor;
                            else if (g.entrada_tipo === 'VIP' || g.entrada_tipo === 'vip') revenueByType.vip += valor;
                          }
                        });
                      } else {
                        console.warn(`⚠️ Erro ao buscar guests da guest list ${gl.guest_list_id}: ${guestsRes.status} ${guestsRes.statusText}`);
                      }
                    } catch (err) {
                      console.warn(`Erro ao buscar guests da guest list ${gl.guest_list_id}:`, err);
                    }
                  }
                  
                  if (guestListsRestaurante.length > 0) {
                    console.log(`  💰 Guest Lists: ${guestListsRestaurante.length} listas, ${guestsProcessed} guests processados, ${guestsWithRevenue} com receita (R$ ${totalGuestsRevenue.toFixed(2)})`);
                  }

                  const totalCheckIns = estatisticas.checkinGeral || 0;

                  // Debug log para verificar o cálculo
                  const checkedInRestaurante = convidadosReservasRestaurante.filter((c: any) => {
                    const isCheckedIn = c.status_checkin === 1 || c.status_checkin === true || c.status_checkin === 'Check-in' || c.checked_in === 1 || c.checked_in === true;
                    return isCheckedIn && c.entrada_valor;
                  });
                  const convidadosRestauranteRevenue = checkedInRestaurante.reduce((sum: number, c: any) => sum + toNumber(c.entrada_valor), 0);
                  
                  console.log(`📊 [${evento.nome}] Faturamento calculado:`, {
                    totalRevenue,
                    revenueByType,
                    totalCheckIns,
                    data_evento: evento.data_evento,
                    convidadosReservas: convidadosReservas.length,
                    convidadosReservasRestaurante: convidadosReservasRestaurante.length,
                    checkedInRestaurante: checkedInRestaurante.length,
                    convidadosRestauranteRevenue,
                    guestsWithRevenue,
                    totalGuestsRevenue,
                    convidadosPromoters: convidadosPromoters.length,
                    guestListsRestaurante: guestListsRestaurante.length,
                  });

                  establishmentRevenues.push({
                    evento_id: evento.evento_id,
                    nome: evento.nome || 'Sem nome',
                    data_evento: evento.data_evento || '',
                    establishment_id: establishment.id,
                    establishment_name: establishment.name,
                    totalCheckIns,
                    totalRevenue,
                    revenueByType,
                  });
                }
              } catch (err) {
                console.error(`Erro ao buscar check-ins do evento ${evento.evento_id}:`, err);
              }
            }

            eventsByEstablishment[establishment.id] = establishmentRevenues;

            // Calcular faturamento por período
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const weekAgo = new Date(todayDate);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const monthAgo = new Date(todayDate);
            monthAgo.setMonth(monthAgo.getMonth() - 1);

            let revenueDay = 0;
            let revenueWeek = 0;
            let revenueMonth = 0;
            let revenueTotal = 0;

            establishmentRevenues.forEach((er) => {
              revenueTotal += er.totalRevenue;
              
              if (er.data_evento) {
                const eventDate = new Date(er.data_evento);
                eventDate.setHours(0, 0, 0, 0);

                if (eventDate.getTime() === todayDate.getTime()) {
                  revenueDay += er.totalRevenue;
                }

                if (eventDate >= weekAgo) {
                  revenueWeek += er.totalRevenue;
                }

                if (eventDate >= monthAgo) {
                  revenueMonth += er.totalRevenue;
                }
              }
            });

            revenueByPeriodData[establishment.id] = {
              day: revenueDay,
              week: revenueWeek,
              month: revenueMonth,
              total: revenueTotal,
            };
          }
        } catch (err) {
          console.error(`Erro ao buscar eventos do estabelecimento ${establishment.id}:`, err);
        }
      }

      // Flatten eventsByEstablishment para array
      const allEventRevenues: EventRevenue[] = [];
      Object.values(eventsByEstablishment).forEach((revenues) => {
        allEventRevenues.push(...revenues);
      });

      setEventRevenues(allEventRevenues);
      setRevenueByPeriod(revenueByPeriodData);
    } catch (error) {
      console.error("Erro ao carregar faturamento dos eventos:", error);
    } finally {
      setLoadingEvents(false);
    }
  }, [establishments]);

  // Carregar todos os dados
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadEstablishments(),
        loadBirthdayReservations(),
        loadRestaurantReservations(),
      ]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [loadEstablishments, loadBirthdayReservations, loadRestaurantReservations]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (establishments.length > 0) {
      console.log('🔄 Carregando faturamento dos eventos...');
      loadEventRevenues();
    }
  }, [establishments, loadEventRevenues]);

  // Recarregar eventos quando o filtro de período mudar
  useEffect(() => {
    // Não precisa recarregar, apenas filtrar os eventos já carregados
    console.log('📅 Filtro de período alterado:', periodFilter);
  }, [periodFilter]);

  // Filtrar reservas por modo de visualização
  const filteredReservations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let filteredBirthday = [...birthdayReservations];
    let filteredRestaurant = [...restaurantReservations];
    
    if (viewMode === "today") {
      filteredBirthday = filteredBirthday.filter((r) => {
        const date = new Date(r.data_aniversario);
        return date.toDateString() === today.toDateString();
      });
      filteredRestaurant = filteredRestaurant.filter((r) => {
        const date = new Date(r.reservation_date);
        return date.toDateString() === today.toDateString();
      });
    } else if (viewMode === "upcoming") {
      filteredBirthday = filteredBirthday.filter((r) => {
        const date = new Date(r.data_aniversario);
        return date >= today;
      });
      filteredRestaurant = filteredRestaurant.filter((r) => {
        const date = new Date(r.reservation_date);
        return date >= today;
      });
    }
    
    return { birthday: filteredBirthday, restaurant: filteredRestaurant };
  }, [birthdayReservations, restaurantReservations, viewMode]);

  // Agrupar reservas por estabelecimento
  const groupedReservations = useMemo(() => {
    const groups: Map<number, ReservationGroup> = new Map();

    // Inicializar grupos com estabelecimentos
    establishments.forEach((est) => {
      groups.set(est.id, {
        establishment: est,
        birthdayReservations: [],
        restaurantReservations: [],
        totalRevenue: 0,
        totalGuests: 0,
        upcomingCount: 0,
      });
    });

    // Adicionar reservas de aniversário
    filteredReservations.birthday.forEach((reservation) => {
      const estId = Number(reservation.id_casa_evento) || 0;
      if (estId > 0 && groups.has(estId)) {
        const group = groups.get(estId)!;
        group.birthdayReservations.push(reservation);
        const revenue = Number(reservation.totalRevenue) || 0;
        const guests = Number(reservation.quantidade_convidados) || 0;
        group.totalRevenue += isNaN(revenue) ? 0 : revenue;
        group.totalGuests += isNaN(guests) ? 0 : guests;
        
        // Verificar se é próxima (hoje ou futuro)
        try {
          const reservationDate = new Date(reservation.data_aniversario);
          if (!isNaN(reservationDate.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (reservationDate >= today) {
              group.upcomingCount++;
            }
          }
        } catch (e) {
          // Ignorar erros de data
        }
      }
    });

    // Adicionar reservas de restaurante
    filteredReservations.restaurant.forEach((reservation) => {
      const estId = Number(reservation.establishment_id) || 0;
      if (estId > 0 && groups.has(estId)) {
        const group = groups.get(estId)!;
        group.restaurantReservations.push(reservation);
        const revenue = Number(reservation.totalRevenue) || 0;
        const guests = Number(reservation.number_of_people) || 0;
        group.totalRevenue += isNaN(revenue) ? 0 : revenue;
        group.totalGuests += isNaN(guests) ? 0 : guests;
        
        // Verificar se é próxima
        try {
          const reservationDate = new Date(reservation.reservation_date);
          if (!isNaN(reservationDate.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (reservationDate >= today) {
              group.upcomingCount++;
            }
          }
        } catch (e) {
          // Ignorar erros de data
        }
      }
    });

    // Filtrar apenas grupos com reservas
    return Array.from(groups.values()).filter(
      (group) =>
        group.birthdayReservations.length > 0 || group.restaurantReservations.length > 0
    );
  }, [establishments, filteredReservations]);

  // Calcular estatísticas gerais
  const stats: Stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const upcomingToday = [
      ...birthdayReservations.filter((r) => {
        const date = new Date(r.data_aniversario);
        return date.toDateString() === today.toDateString();
      }),
      ...restaurantReservations.filter((r) => {
        const date = new Date(r.reservation_date);
        return date.toDateString() === today.toDateString();
      }),
    ].length;

    const upcomingWeek = [
      ...birthdayReservations.filter((r) => {
        const date = new Date(r.data_aniversario);
        return date >= today && date <= weekFromNow;
      }),
      ...restaurantReservations.filter((r) => {
        const date = new Date(r.reservation_date);
        return date >= today && date <= weekFromNow;
      }),
    ].length;

    const totalRevenue = groupedReservations.reduce((sum, g) => {
      const revenue = Number(g.totalRevenue) || 0;
      return sum + (isNaN(revenue) ? 0 : revenue);
    }, 0);
    
    const totalGuests = groupedReservations.reduce((sum, g) => {
      const guests = Number(g.totalGuests) || 0;
      return sum + (isNaN(guests) ? 0 : guests);
    }, 0);

    return {
      totalReservations: birthdayReservations.length + restaurantReservations.length,
      totalRevenue: Math.max(0, totalRevenue),
      totalGuests: Math.max(0, totalGuests),
      birthdayCount: birthdayReservations.length,
      restaurantCount: restaurantReservations.length,
      upcomingToday: Math.max(0, upcomingToday),
      upcomingWeek: Math.max(0, upcomingWeek),
    };
  }, [birthdayReservations, restaurantReservations, groupedReservations]);

  const toggleEstablishment = (id: number) => {
    const newExpanded = new Set(expandedEstablishments);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEstablishments(newExpanded);
  };

  const formatCurrency = (value: number) => {
    const numValue = Number(value) || 0;
    if (isNaN(numValue) || numValue < 0) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    return timeString.substring(0, 5); // HH:MM
  };

  // Função para imprimir relatório
  const printReport = (establishmentId?: number, period?: "day" | "week" | "month" | "all" | "custom") => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir o relatório');
      return;
    }

    const today = new Date();
    let periodText = "Todos os Períodos";
    if (period === "day") {
      periodText = "Hoje";
    } else if (period === "week") {
      periodText = "Esta Semana";
    } else if (period === "month") {
      periodText = "Este Mês";
    } else if (period === "custom" && periodFilter.startDate && periodFilter.endDate) {
      periodText = `${formatDate(periodFilter.startDate)} - ${formatDate(periodFilter.endDate)}`;
    }

    let filteredEventRevenues = eventRevenues;
    if (establishmentId) {
      filteredEventRevenues = eventRevenues.filter(er => er.establishment_id === establishmentId);
    }

    // Filtrar por período se necessário
    if (period && period !== "all") {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      let startDate: Date;
      let endDate: Date | null = null;

      if (period === "day") {
        startDate = new Date(todayDate);
        endDate = new Date(todayDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === "week") {
        startDate = new Date(todayDate);
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === "month") {
        startDate = new Date(todayDate);
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (period === "custom" && periodFilter.startDate && periodFilter.endDate) {
        startDate = new Date(periodFilter.startDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(periodFilter.endDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(todayDate);
      }

      filteredEventRevenues = filteredEventRevenues.filter(er => {
        if (!er.data_evento) return false;
        const eventDate = new Date(er.data_evento);
        eventDate.setHours(0, 0, 0, 0);
        const isAfterStart = eventDate >= startDate;
        const isBeforeEnd = endDate ? eventDate <= endDate : true;
        return isAfterStart && isBeforeEnd;
      });
    }

    // Agrupar por estabelecimento
    const revenuesByEst: Record<number, EventRevenue[]> = {};
    filteredEventRevenues.forEach(er => {
      if (!revenuesByEst[er.establishment_id]) {
        revenuesByEst[er.establishment_id] = [];
      }
      revenuesByEst[er.establishment_id].push(er);
    });

    // Calcular totais
    const totalRevenue = filteredEventRevenues.reduce((sum, er) => sum + er.totalRevenue, 0);
    const totalCheckIns = filteredEventRevenues.reduce((sum, er) => sum + er.totalCheckIns, 0);

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Faturamento - ${periodText}</title>
        <style>
          @media print {
            @page { margin: 2cm; }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
          }
          h1 { 
            color: #f97316; 
            border-bottom: 3px solid #f97316; 
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          h2 {
            color: #555;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 2px solid #ddd;
            padding-bottom: 5px;
          }
          .header {
            margin-bottom: 30px;
          }
          .totals {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .totals h3 {
            margin-top: 0;
            color: #f97316;
          }
          .totals-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 15px;
          }
          .total-item {
            padding: 15px;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #f97316;
          }
          .total-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .total-value {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
          }
          .establishment {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .establishment-header {
            background: #f97316;
            color: white;
            padding: 15px;
            border-radius: 6px 6px 0 0;
            font-size: 18px;
            font-weight: bold;
          }
          .event-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .event-table th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
            font-weight: bold;
          }
          .event-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .event-table tr:hover {
            background: #f9fafb;
          }
          .revenue {
            color: #10b981;
            font-weight: bold;
          }
          .checkins {
            color: #3b82f6;
            font-weight: bold;
          }
          .period-badge {
            display: inline-block;
            background: #eff6ff;
            color: #1e40af;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Faturamento por Estabelecimento</h1>
          <p><strong>Período:</strong> ${periodText} <span class="period-badge">${today.toLocaleDateString('pt-BR')}</span></p>
        </div>

        <div class="totals">
          <h3>Resumo Geral</h3>
          <div class="totals-grid">
            <div class="total-item">
              <div class="total-label">Total Faturado</div>
              <div class="total-value">${formatCurrency(totalRevenue)}</div>
            </div>
            <div class="total-item">
              <div class="total-label">Total de Check-ins</div>
              <div class="total-value">${totalCheckIns}</div>
            </div>
          </div>
        </div>
    `;

    // Adicionar dados por estabelecimento
    Object.entries(revenuesByEst).forEach(([estId, events]) => {
      const establishment = establishments.find(e => e.id === Number(estId));
      if (!establishment) return;

      const estTotalRevenue = events.reduce((sum, e) => sum + e.totalRevenue, 0);
      const estTotalCheckIns = events.reduce((sum, e) => sum + e.totalCheckIns, 0);

      htmlContent += `
        <div class="establishment">
          <div class="establishment-header">
            ${establishment.name}
          </div>
          <div style="padding: 15px; background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 6px 6px;">
            <p><strong>Total do Estabelecimento:</strong> <span class="revenue">${formatCurrency(estTotalRevenue)}</span> • <span class="checkins">${estTotalCheckIns} check-ins</span></p>
            
            <table class="event-table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Data</th>
                  <th>Check-ins</th>
                  <th>SECO</th>
                  <th>CONSUMA</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
      `;

      events.forEach(event => {
        htmlContent += `
          <tr>
            <td>${event.nome}</td>
            <td>${event.data_evento ? formatDate(event.data_evento) : 'N/A'}</td>
            <td class="checkins">${event.totalCheckIns}</td>
            <td>${formatCurrency(event.revenueByType.seco)}</td>
            <td>${formatCurrency(event.revenueByType.consuma)}</td>
            <td class="revenue">${formatCurrency(event.totalRevenue)}</td>
          </tr>
        `;
      });

      htmlContent += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    htmlContent += `
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando reservas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Visão Geral de Reservas</h1>
          <p className="text-gray-400 text-lg">
            Gerencie todas as reservas de aniversário e restaurante em um só lugar
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode("all")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === "all"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setViewMode("upcoming")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === "upcoming"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              Próximas
            </button>
            <button
              onClick={() => setViewMode("today")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === "today"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              Hoje
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MdDateRange className="inline mr-2" size={20} />
              Filtro por Período
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPeriodFilter({ type: "all" })}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  periodFilter.type === "all"
                    ? "bg-green-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                Todos os Períodos
              </button>
              <button
                onClick={() => setPeriodFilter({ type: "today" })}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  periodFilter.type === "today"
                    ? "bg-green-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setPeriodFilter({ type: "week" })}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  periodFilter.type === "week"
                    ? "bg-green-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                Esta Semana
              </button>
              <button
                onClick={() => setPeriodFilter({ type: "month" })}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  periodFilter.type === "month"
                    ? "bg-green-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                Este Mês
              </button>
              <button
                onClick={() => setPeriodFilter({ type: "custom" })}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  periodFilter.type === "custom"
                    ? "bg-green-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                Personalizado
              </button>
            </div>
            {periodFilter.type === "custom" && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={periodFilter.startDate || ""}
                    onChange={(e) => setPeriodFilter({ ...periodFilter, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={periodFilter.endDate || ""}
                    onChange={(e) => setPeriodFilter({ ...periodFilter, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nome, telefone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <select
                value={selectedEstablishment || ""}
                onChange={(e) => setSelectedEstablishment(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">Todos os estabelecimentos</option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadAllData}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors font-semibold"
              >
                <MdRefresh size={20} />
                Atualizar
              </button>
              <button
                onClick={() => {
                  setSelectedDate("");
                  setSelectedEstablishment(null);
                  setSearchTerm("");
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-semibold"
              >
                <MdFilterList size={20} />
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 border border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <MdEvent className="text-blue-200" size={24} />
                <span className="text-blue-200 text-sm font-semibold">Total</span>
              </div>
              <p className="text-3xl font-bold">{stats.totalReservations}</p>
              <p className="text-blue-200 text-sm">Reservas</p>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 border border-green-500">
              <div className="flex items-center justify-between mb-2">
                <MdAttachMoney className="text-green-200" size={24} />
                <span className="text-green-200 text-sm font-semibold">Receita</span>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-green-200 text-sm">Total estimado</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 border border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <MdPeople className="text-purple-200" size={24} />
                <span className="text-purple-200 text-sm font-semibold">Convidados</span>
              </div>
              <p className="text-3xl font-bold">{stats.totalGuests}</p>
              <p className="text-purple-200 text-sm">Total de pessoas</p>
            </div>

            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 border border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <MdSchedule className="text-orange-200" size={24} />
                <span className="text-orange-200 text-sm font-semibold">Próximas</span>
              </div>
              <p className="text-3xl font-bold">{stats.upcomingWeek}</p>
              <p className="text-orange-200 text-sm">Esta semana</p>
            </div>
          </div>
        )}

        {/* Resumo por tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <FaBirthdayCake className="text-pink-500" size={24} />
              <h3 className="text-xl font-bold">Reservas de Aniversário</h3>
            </div>
            <p className="text-3xl font-bold text-pink-400 mb-2">{stats.birthdayCount}</p>
            <p className="text-gray-400 text-sm">Com decoração e painel</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <MdRestaurant className="text-blue-500" size={24} />
              <h3 className="text-xl font-bold">Reservas de Mesa</h3>
            </div>
            <p className="text-3xl font-bold text-blue-400 mb-2">{stats.restaurantCount}</p>
            <p className="text-gray-400 text-sm">Reservas normais</p>
          </div>
        </div>

        {/* Faturamento por Período */}
        {establishments.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MdAttachMoney className="text-green-500" size={28} />
                Faturamento por Período
              </h2>
              <button
                onClick={() => printReport(undefined, "all")}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold"
              >
                <MdPrint size={20} />
                Imprimir Relatório Completo
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {establishments.map((est) => {
                const periodData = revenueByPeriod[est.id] || { day: 0, week: 0, month: 0, total: 0 };
                return (
                  <div key={est.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                      {est.logo ? (
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <SafeImage
                            src={est.logo}
                            alt={est.name}
                            fill
                            sizes="40px"
                            className="rounded-lg object-cover"
                            unoptimized={true}
                          />
                        </div>
                      ) : (
                        <MdLocationOn className="text-gray-400" size={24} />
                      )}
                      <h3 className="text-lg font-bold">{est.name}</h3>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Hoje</span>
                        <span className="text-green-400 font-semibold">{formatCurrency(periodData.day)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Esta Semana</span>
                        <span className="text-green-400 font-semibold">{formatCurrency(periodData.week)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Este Mês</span>
                        <span className="text-green-400 font-semibold">{formatCurrency(periodData.month)}</span>
                      </div>
                      <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                        <span className="text-gray-300 font-semibold">Total</span>
                        <span className="text-green-300 font-bold text-lg">{formatCurrency(periodData.total)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => printReport(est.id, "day")}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-xs font-semibold"
                        title="Imprimir relatório de hoje"
                      >
                        <MdPrint size={14} className="inline mr-1" />
                        Hoje
                      </button>
                      <button
                        onClick={() => printReport(est.id, "week")}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-xs font-semibold"
                        title="Imprimir relatório da semana"
                      >
                        <MdPrint size={14} className="inline mr-1" />
                        Semana
                      </button>
                      <button
                        onClick={() => printReport(est.id, "month")}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-xs font-semibold"
                        title="Imprimir relatório do mês"
                      >
                        <MdPrint size={14} className="inline mr-1" />
                        Mês
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Faturamento dos Eventos por Estabelecimento */}
        {establishments.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MdEvent className="text-orange-500" size={28} />
                Faturamento dos Eventos
              </h2>
              {loadingEvents && (
                <span className="text-gray-400 text-sm">Carregando eventos...</span>
              )}
            </div>
            <div className="space-y-4">
              {establishments.map((est) => {
                // Filtrar eventos por período se necessário
                let estEvents = eventRevenues.filter(er => er.establishment_id === est.id);
                
                if (periodFilter.type && periodFilter.type !== "all") {
                  const todayDate = new Date();
                  todayDate.setHours(0, 0, 0, 0);
                  let startDate: Date;
                  let endDate: Date | null = null;

                  if (periodFilter.type === "today") {
                    startDate = new Date(todayDate);
                    endDate = new Date(todayDate);
                    endDate.setHours(23, 59, 59, 999);
                  } else if (periodFilter.type === "week") {
                    startDate = new Date(todayDate);
                    startDate.setDate(startDate.getDate() - 7);
                  } else if (periodFilter.type === "month") {
                    startDate = new Date(todayDate);
                    startDate.setMonth(startDate.getMonth() - 1);
                  } else if (periodFilter.type === "custom" && periodFilter.startDate && periodFilter.endDate) {
                    startDate = new Date(periodFilter.startDate);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(periodFilter.endDate);
                    endDate.setHours(23, 59, 59, 999);
                  } else {
                    startDate = new Date(0); // Todos os eventos
                  }

                  estEvents = estEvents.filter(er => {
                    if (!er.data_evento) return false;
                    const eventDate = new Date(er.data_evento);
                    eventDate.setHours(0, 0, 0, 0);
                    const isAfterStart = eventDate >= startDate;
                    const isBeforeEnd = endDate ? eventDate <= endDate : true;
                    return isAfterStart && isBeforeEnd;
                  });
                }
                const estTotalRevenue = estEvents.reduce((sum, e) => sum + e.totalRevenue, 0);
                const estTotalCheckIns = estEvents.reduce((sum, e) => sum + e.totalCheckIns, 0);
                const isExpanded = showEventRevenues[est.id];

                if (estEvents.length === 0) return null;

                return (
                  <div key={est.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
                    <button
                      onClick={() => setShowEventRevenues(prev => ({ ...prev, [est.id]: !prev[est.id] }))}
                      className="w-full p-6 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {est.logo ? (
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <SafeImage
                              src={est.logo}
                              alt={est.name}
                              fill
                              sizes="48px"
                              className="rounded-lg object-cover"
                              unoptimized={true}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 flex-shrink-0 bg-slate-700 rounded-lg flex items-center justify-center">
                            <MdLocationOn className="text-gray-400" size={24} />
                          </div>
                        )}
                        <div className="text-left">
                          <h3 className="text-xl font-bold">{est.name}</h3>
                          <p className="text-gray-400 text-sm">
                            {estEvents.length} evento{estEvents.length !== 1 ? "s" : ""} • {estTotalCheckIns} check-ins
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-400">
                            {formatCurrency(estTotalRevenue)}
                          </p>
                          <p className="text-gray-400 text-sm">Total faturado</p>
                        </div>
                        {isExpanded ? (
                          <MdExpandLess size={24} className="text-gray-400" />
                        ) : (
                          <MdExpandMore size={24} className="text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-700 p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <button
                            onClick={() => printReport(est.id, "day")}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold"
                          >
                            <MdPrint size={20} />
                            Imprimir Relatório - Hoje
                          </button>
                          <button
                            onClick={() => printReport(est.id, "week")}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold"
                          >
                            <MdPrint size={20} />
                            Imprimir Relatório - Semana
                          </button>
                          <button
                            onClick={() => printReport(est.id, "month")}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold"
                          >
                            <MdPrint size={20} />
                            Imprimir Relatório - Mês
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-slate-700">
                                <th className="text-left py-3 px-4 text-gray-300">Evento</th>
                                <th className="text-left py-3 px-4 text-gray-300">Data</th>
                                <th className="text-right py-3 px-4 text-gray-300">Check-ins</th>
                                <th className="text-right py-3 px-4 text-gray-300">SECO</th>
                                <th className="text-right py-3 px-4 text-gray-300">CONSUMA</th>
                                <th className="text-right py-3 px-4 text-gray-300">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {estEvents.map((event) => (
                                <tr key={event.evento_id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                  <td className="py-3 px-4">
                                    <Link
                                      href={`/admin/eventos/${event.evento_id}/check-ins`}
                                      className="text-white hover:text-orange-400 transition-colors font-medium"
                                    >
                                      {event.nome}
                                    </Link>
                                  </td>
                                  <td className="py-3 px-4 text-gray-400">
                                    {event.data_evento ? formatDate(event.data_evento) : 'N/A'}
                                  </td>
                                  <td className="py-3 px-4 text-right text-blue-400 font-semibold">
                                    {event.totalCheckIns}
                                  </td>
                                  <td className="py-3 px-4 text-right text-green-400">
                                    {formatCurrency(event.revenueByType.seco)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-green-400">
                                    {formatCurrency(event.revenueByType.consuma)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-green-300 font-bold">
                                    {formatCurrency(event.totalRevenue)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-slate-600 bg-slate-700/30">
                                <td colSpan={2} className="py-3 px-4 font-bold text-white">Total</td>
                                <td className="py-3 px-4 text-right font-bold text-blue-400">{estTotalCheckIns}</td>
                                <td className="py-3 px-4 text-right font-bold text-green-400">
                                  {formatCurrency(estEvents.reduce((sum, e) => sum + e.revenueByType.seco, 0))}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-green-400">
                                  {formatCurrency(estEvents.reduce((sum, e) => sum + e.revenueByType.consuma, 0))}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-green-300 text-lg">
                                  {formatCurrency(estTotalRevenue)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista por estabelecimento */}
        <div className="space-y-4">
          {groupedReservations.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 text-center border border-slate-700">
              <p className="text-gray-400 text-lg">Nenhuma reserva encontrada</p>
            </div>
          ) : (
            groupedReservations.map((group) => {
              const isExpanded = expandedEstablishments.has(group.establishment.id);
              const totalReservations = group.birthdayReservations.length + group.restaurantReservations.length;

              return (
                <div
                  key={group.establishment.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden"
                >
                  {/* Header do estabelecimento */}
                  <button
                    onClick={() => toggleEstablishment(group.establishment.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {group.establishment.logo ? (
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <SafeImage
                            src={group.establishment.logo}
                            alt={group.establishment.name}
                            fill
                            sizes="48px"
                            className="rounded-lg object-cover"
                            unoptimized={true}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 flex-shrink-0 bg-slate-700 rounded-lg flex items-center justify-center">
                          <MdLocationOn className="text-gray-400" size={24} />
                        </div>
                      )}
                      <div className="text-left">
                        <h3 className="text-xl font-bold">{group.establishment.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {totalReservations} reserva{totalReservations !== 1 ? "s" : ""} • {Math.max(0, Number(group.totalGuests) || 0)} convidados
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">
                          {formatCurrency(Math.max(0, Number(group.totalRevenue) || 0))}
                        </p>
                        <p className="text-gray-400 text-sm">Receita estimada</p>
                      </div>
                      {isExpanded ? (
                        <MdExpandLess size={24} className="text-gray-400" />
                      ) : (
                        <MdExpandMore size={24} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Conteúdo expandido */}
                  {isExpanded && (
                    <div className="border-t border-slate-700 p-6 space-y-6">
                      {/* Reservas de Aniversário */}
                      {group.birthdayReservations.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <FaBirthdayCake className="text-pink-500" size={20} />
                            <h4 className="text-lg font-semibold">
                              Aniversários ({group.birthdayReservations.length})
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.birthdayReservations.map((reservation) => (
                              <Link
                                key={reservation.id}
                                href={`/admin/reservas/${reservation.id}?type=birthday`}
                                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-pink-500 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-semibold text-white">
                                      {reservation.aniversariante_nome}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      {formatDate(reservation.data_aniversario)}
                                      {reservation.reservation_time && ` • ${formatTime(reservation.reservation_time)}`}
                                    </p>
                                  </div>
                                  {reservation.decoracao_tipo && (
                                    <span className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded">
                                      {reservation.decoracao_tipo}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <MdPeople size={16} />
                                    <span>
                                      {Math.max(0, Number(reservation.confirmedGuestsCount) || 0)} / {Math.max(0, Number(reservation.quantidade_convidados) || 0)}
                                    </span>
                                  </div>
                                  {(() => {
                                    const revenue = Number(reservation.totalRevenue) || 0;
                                    return revenue > 0 ? (
                                      <span className="text-green-400 font-semibold text-sm">
                                        {formatCurrency(revenue)}
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reservas de Restaurante */}
                      {group.restaurantReservations.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <MdRestaurant className="text-blue-500" size={20} />
                            <h4 className="text-lg font-semibold">
                              Mesas ({group.restaurantReservations.length})
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.restaurantReservations.map((reservation) => (
                              <Link
                                key={reservation.id}
                                href={`/admin/reservas/${reservation.id}?type=restaurant`}
                                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-blue-500 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-semibold text-white">
                                      {reservation.client_name}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      {formatDate(reservation.reservation_date)} • {formatTime(reservation.reservation_time)}
                                    </p>
                                    {reservation.area_name && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {reservation.area_name}
                                      </p>
                                    )}
                                  </div>
                                  {reservation.checked_in && (
                                    <MdCheckCircle className="text-green-500" size={20} />
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <MdPeople size={16} />
                                    <span>{reservation.number_of_people} pessoas</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-1 text-xs rounded ${
                                        reservation.status === "CONFIRMADA"
                                          ? "bg-green-500/20 text-green-300"
                                          : reservation.status === "CANCELADA"
                                          ? "bg-red-500/20 text-red-300"
                                          : "bg-yellow-500/20 text-yellow-300"
                                      }`}
                                    >
                                      {reservation.status}
                                    </span>
                                    {(() => {
                                      const revenue = Number(reservation.totalRevenue) || 0;
                                      return revenue > 0 ? (
                                        <span className="text-green-400 font-semibold text-sm">
                                          {formatCurrency(revenue)}
                                        </span>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
