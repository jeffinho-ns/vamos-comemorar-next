"use client";

import { useState, useEffect, useCallback } from "react";
import { MdRestaurant, MdPeople, MdSchedule, MdBarChart, MdSettings, MdAdd, MdSearch, MdChair, MdPhone, MdClose, MdCall, MdTimer, MdLocationOn } from "react-icons/md";
import { motion } from "framer-motion";
import ReservationCalendar from "../../components/ReservationCalendar";
import ReservationModal from "../../components/ReservationModal";
import WalkInModal from "../../components/WalkInModal";
import WaitlistModal from "../../components/WaitlistModal";
import { Reservation } from "@/app/types/reservation";

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
  client_name: string;
  client_phone?: string;
  client_email?: string;
  number_of_people: number;
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

type TabType = 'reservations' | 'walk-ins' | 'waitlist' | 'reports' | 'settings';

export default function RestaurantReservationsPage() {
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('reservations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'http://localhost:3001';
  const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';
  const PLACEHOLDER_IMAGE_URL = '/images/default-logo.png';

  const getValidImageUrl = (filename: string): string => {
    if (!filename || filename.trim() === '' || filename.startsWith('blob:')) {
      return PLACEHOLDER_IMAGE_URL;
    }
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    return `${BASE_IMAGE_URL}${filename}`;
  };

  const fetchEstablishments = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      // Primeiro tenta buscar da tabela bars
      let response = await fetch(`${API_URL}/api/bars`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data;
      if (response.ok) {
        data = await response.json();
        console.log("Dados recebidos da API (bars):", data);
        
        if (Array.isArray(data)) {
          const formattedEstablishments: Establishment[] = data.map((bar: any) => ({
            id: bar.id,
            name: bar.name || "Sem nome",
            logo: getValidImageUrl(bar.logoUrl || bar.logo || ''),
            address: bar.address || "Endereço não informado"
          }));
          setEstablishments(formattedEstablishments);
          return;
        }
      }

      // Se não conseguir da tabela bars, tenta da tabela places
      response = await fetch(`${API_URL}/api/places`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar estabelecimentos");

      data = await response.json();
      console.log("Dados recebidos da API (places):", data);
      
      if (Array.isArray(data)) {
        const formattedEstablishments: Establishment[] = data.map((place: any) => ({
          id: place.id,
          name: place.name || "Sem nome",
          logo: getValidImageUrl(place.logo || ''),
          address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado"
        }));
        setEstablishments(formattedEstablishments);
      } else if (data.data && Array.isArray(data.data)) {
        // Se os dados vêm em um objeto com propriedade data
        const formattedEstablishments: Establishment[] = data.data.map((place: any) => ({
          id: place.id,
          name: place.name || "Sem nome",
          logo: getValidImageUrl(place.logo || ''),
          address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado"
        }));
        setEstablishments(formattedEstablishments);
      } else {
        setError("Dados de estabelecimentos inválidos.");
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
          logo: getValidImageUrl("1730836360230.png"),
          address: "Rua Girassol, 144 - Vila Madalena"
        },
        {
          id: 1,
          name: "Seu Justino",
          logo: getValidImageUrl("1729923901750.webp"),
          address: "Rua Harmonia, 77 - Vila Madalena"
        },
        {
          id: 4,
          name: "Oh Freguês",
          logo: getValidImageUrl("1730172121902.png"),
          address: "Largo da Matriz de Nossa Senhora do Ó, 145 - Freguesia do Ó"
        },
        {
          id: 8,
          name: "Pracinha do Seu Justino",
          logo: getValidImageUrl("1730836754093.png"),
          address: "Rua Harmonia, 117 - Sumarezinho"
        },
        {
          id: 9,
          name: "Reserva Rooftop",
          logo: getValidImageUrl("rooftop-logo.png"),
          address: "Endereço do Reserva Rooftop"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);
  
  // Estados para Reservas
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  
  // Estados para Walk-ins
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [areas, setAreas] = useState<RestaurantArea[]>([]);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [editingWalkIn, setEditingWalkIn] = useState<WalkIn | null>(null);
  
  // Estados para Waitlist
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [editingWaitlistEntry, setEditingWaitlistEntry] = useState<WaitlistEntry | null>(null);

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
      const areasResponse = await fetch('/api/restaurant-areas');
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
    // Carregar dados específicos do estabelecimento
    loadEstablishmentData();
  };

  const loadEstablishmentData = async () => {
    if (!selectedEstablishment) return;
    
    try {
      // Carregar áreas da API
      const areasResponse = await fetch('/api/restaurant-areas');
      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        setAreas(areasData.areas || []);
      } else {
        console.error('Erro ao carregar áreas:', areasResponse.statusText);
        // Fallback para dados mock se a API falhar
        setAreas([
          { id: 1, name: 'Área Coberta', capacity_lunch: 0, capacity_dinner: 300 },
          { id: 2, name: 'Área Descoberta', capacity_lunch: 0, capacity_dinner: 110 }
        ]);
      }

      // Carregar reservas da API
      const reservationsResponse = await fetch(`http://localhost:3001/api/restaurant-reservations?establishment_id=${selectedEstablishment.id}`);
      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json();
        console.log('✅ Reservas carregadas da API:', reservationsData.reservations?.length || 0);
        setReservations(reservationsData.reservations || []);
      } else {
        console.error('❌ Erro ao carregar reservas:', reservationsResponse.statusText);
        // Fallback para dados mock apenas se não conseguir conectar
        setReservations([]);
      }

      // Carregar walk-ins da API
      const walkInsResponse = await fetch('/api/walk-ins');
      if (walkInsResponse.ok) {
        const walkInsData = await walkInsResponse.json();
        setWalkIns(walkInsData.walkIns || []);
      } else {
        console.error('Erro ao carregar walk-ins:', walkInsResponse.statusText);
        setWalkIns([]);
      }

      // Carregar waitlist da API
      const waitlistResponse = await fetch('/api/waitlist');
      if (waitlistResponse.ok) {
        const waitlistData = await waitlistResponse.json();
        setWaitlist(waitlistData.waitlist || []);
      } else {
        console.error('Erro ao carregar waitlist:', waitlistResponse.statusText);
        setWaitlist([]);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do estabelecimento:', error);
      // Em caso de erro, usar dados mock
      setAreas([
        { id: 1, name: 'Área Coberta', capacity_lunch: 0, capacity_dinner: 300 },
        { id: 2, name: 'Área Descoberta', capacity_lunch: 0, capacity_dinner: 110 }
      ]);
      setReservations([]);
      setWalkIns([]);
      setWaitlist([]);
    }
  };

  // Handlers para Reservas
  const handleDateSelect = (date: Date, dateReservations: Reservation[]) => {
    setSelectedDate(date);
  };

  const handleAddReservation = async (date: Date) => {
    setSelectedDate(date);
    setEditingReservation(null);
    
    // Carregar áreas se ainda não foram carregadas
    await loadAreas();
    
    setShowModal(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setShowModal(true);
  };

  const handleDeleteReservation = (reservation: Reservation) => {
    if (confirm(`Tem certeza que deseja excluir a reserva de ${reservation.client_name}?`)) {
      setReservations(prev => prev.filter(r => r.id !== reservation.id));
    }
  };

  const handleStatusChange = (reservation: Reservation, newStatus: string) => {
    setReservations(prev => 
      prev.map(r => 
        r.id === reservation.id ? { ...r, status: newStatus as any } : r
      )
    );
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

  const handleCallCustomer = (entry: WaitlistEntry) => {
    setWaitlist(prev => 
      prev.map(w => 
        w.id === entry.id ? { ...w, status: 'CHAMADO' as any } : w
      )
    );
  };

  const tabs = [
    { id: 'reservations', label: 'Reservas', icon: MdRestaurant },
    { id: 'walk-ins', label: 'Passantes', icon: MdPeople },
    { id: 'waitlist', label: 'Lista de Espera', icon: MdSchedule },
    { id: 'reports', label: 'Relatórios', icon: MdBarChart },
    { id: 'settings', label: 'Configurações', icon: MdSettings }
  ];

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.client_phone?.includes(searchTerm) ||
                         reservation.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className="max-w-7xl mx-auto p-8">
        {/* Header da página */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Admin / Sistema de Reservas
          </h2>
          <h1 className="text-4xl font-bold text-white mt-2">Sistema de Reservas do Restaurante</h1>
          <p className="text-gray-400 text-lg mt-2">Gerencie reservas, passantes e lista de espera de forma integrada</p>
        </div>

        {/* Seleção de Estabelecimento */}
        {!selectedEstablishment ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Selecione o Estabelecimento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {establishments.map((establishment) => (
                <button
                  key={establishment.id}
                  onClick={() => handleEstablishmentSelect(establishment)}
                  className="p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg border-gray-200 bg-white hover:border-gray-300"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <img
                        src={establishment.logo}
                        alt={establishment.name}
                        className="w-12 h-12 object-contain"
                      />
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
        ) : (
          <>
            {/* Estabelecimento Selecionado */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <img
                      src={selectedEstablishment.logo}
                      alt={selectedEstablishment.name}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedEstablishment.name}
                    </h2>
                    <p className="text-gray-600">{selectedEstablishment.address}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEstablishment(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose size={24} />
                </button>
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
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
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
                          onClick={() => setViewMode('list')}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            viewMode === 'list'
                              ? 'bg-white text-gray-800 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Lista
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Buscar reservas..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          // Carregar áreas se ainda não foram carregadas
                          await loadAreas();
                          setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
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
                        onDateSelect={handleDateSelect}
                        onAddReservation={handleAddReservation}
                        onEditReservation={handleEditReservation}
                        onDeleteReservation={handleDeleteReservation}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  )}

                  {/* Lista de Reservas */}
                  {viewMode === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredReservations.map((reservation) => (
                        <motion.div
                          key={reservation.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-800">{reservation.client_name}</h4>
                              <p className="text-sm text-gray-500">{reservation.reservation_date} às {reservation.reservation_time}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {reservation.status === 'confirmed' ? 'Confirmada' :
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
                              <span>{reservation.area_name}</span>
                            </div>
                            {reservation.client_phone && (
                              <div className="flex items-center gap-2">
                                <MdPhone className="text-gray-400" />
                                <span>{reservation.client_phone}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <div className="flex gap-2 mt-3">
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <span className="text-orange-600 font-bold text-sm">{entry.position}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{entry.client_name}</h4>
                              <p className="text-sm text-gray-500">
                                {entry.number_of_people} pessoas • Preferência: {entry.preferred_time || 'Qualquer horário'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              <MdTimer className="inline mr-1" />
                              ~{entry.estimated_wait_time}min
                            </span>
                            <button
                              onClick={() => handleCallCustomer(entry)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
                            >
                              <MdCall />
                              Chamar
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
        )}

        {/* Modais */}
        {showModal && (
          <ReservationModal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setEditingReservation(null);
            }}
            onSave={async (reservationData) => {
              try {
                const response = await fetch('http://localhost:3001/api/restaurant-reservations', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    ...reservationData,
                    establishment_id: selectedEstablishment?.id,
                    created_by: 1, // ID do usuário admin padrão
                    status: 'NOVA',
                    origin: 'ADMIN'
                  }),
                });

                if (response.ok) {
                  const newReservation = await response.json();
                  setReservations(prev => [...prev, newReservation.reservation]);
                  console.log('✅ Reserva salva com sucesso:', newReservation);
                  alert('Reserva criada com sucesso!');
                } else {
                  const errorData = await response.json();
                  console.error('❌ Erro ao salvar reserva:', errorData);
                  alert('Erro ao salvar reserva: ' + (errorData.error || 'Erro desconhecido'));
                }
              } catch (error) {
                console.error('❌ Erro ao salvar reserva:', error);
                alert('Erro ao salvar reserva. Tente novamente.');
              }
              setShowModal(false);
              setEditingReservation(null);
            }}
            reservation={editingReservation}
            selectedDate={selectedDate}
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
                const response = await fetch('/api/walk-ins', {
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
                const response = await fetch('/api/waitlist', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    ...entryData,
                    establishment_id: selectedEstablishment?.id
                  }),
                });

                if (response.ok) {
                  const newEntry = await response.json();
                  setWaitlist(prev => [...prev, newEntry.waitlistEntry]);
                  console.log('Entrada na lista salva com sucesso:', newEntry);
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
            entry={editingWaitlistEntry}
          />
        )}
      </div>
    </div>
  );
}