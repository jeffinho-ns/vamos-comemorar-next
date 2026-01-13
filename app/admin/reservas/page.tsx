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

        // Buscar check-ins e calcular receita real
        const reservationsWithRevenue = await Promise.all(
          reservations.map(async (r: BirthdayReservation) => {
            try {
              // Buscar convidados com check-in para esta reserva
              const token = localStorage.getItem("authToken");
              const checkinsResponse = await fetch(
                `${API_URL}/api/reservas/${r.id}/convidados`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              
              let revenue = 0;
              if (checkinsResponse.ok) {
                const convidados = await checkinsResponse.json();
                const checkedIn = Array.isArray(convidados) 
                  ? convidados.filter((c: any) => c.status === 'CHECK-IN' && c.entrada_valor)
                  : [];
                
                revenue = checkedIn.reduce((sum: number, c: any) => {
                  if (!c.entrada_valor) return sum;
                  const valor = typeof c.entrada_valor === 'number' 
                    ? c.entrada_valor 
                    : parseFloat(String(c.entrada_valor).replace(/[^\d.,]/g, '').replace(',', '.'));
                  return sum + (isNaN(valor) ? 0 : Math.max(0, valor));
                }, 0);
              }
              
              return { ...r, totalRevenue: revenue };
            } catch (error) {
              console.error(`Erro ao calcular receita para reserva ${r.id}:`, error);
              return { ...r, totalRevenue: 0 };
            }
          })
        );

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
          <div className="mb-4 flex gap-2">
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
