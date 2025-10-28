"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdCheckCircle,
  MdPending,
  MdPerson,
  MdRestaurant,
  MdEvent,
  MdPhone,
  MdAccessTime,
  MdCalendarToday,
  MdSearch,
  MdClose,
  MdRefresh,
  MdGroups,
  MdTableBar,
  MdStar,
} from 'react-icons/md';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.agilizaiapp.com.br';

interface Establishment {
  id: number;
  name: string;
  logo: string;
}

interface ReservationOwner {
  id: number;
  type: 'reservation' | 'large_reservation';
  client_name: string;
  reservation_date: string;
  reservation_time: string;
  number_of_people: number;
  event_type?: string;
  table_number?: string;
  area_name?: string;
  checked_in: boolean;
  checkin_time?: string;
}

interface GuestListGuest {
  id: number;
  guest_list_id: number;
  owner_name: string;
  name: string;
  whatsapp?: string;
  checked_in: boolean;
  checkin_time?: string;
  reservation_date: string;
  reservation_time?: string;
  event_type?: string;
}

interface PromoterData {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  event_name: string;
  event_date: string;
  checked_in: boolean;
  checkin_time?: string;
}

interface PromoterGuestData {
  id: number;
  lista_convidado_id: number;
  promoter_name: string;
  event_name: string;
  event_date: string;
  nome_convidado: string;
  telefone_convidado?: string;
  status_checkin: 'Pendente' | 'Check-in' | 'No-Show';
  data_checkin?: string;
  is_vip: boolean;
}

export default function CheckinsPage() {
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Dados
  const [reservationOwners, setReservationOwners] = useState<ReservationOwner[]>([]);
  const [guestListGuests, setGuestListGuests] = useState<GuestListGuest[]>([]);
  const [promoters, setPromoters] = useState<PromoterData[]>([]);
  const [promoterGuests, setPromoterGuests] = useState<PromoterGuestData[]>([]);

  // Estatísticas
  const [stats, setStats] = useState({
    totalReservations: 0,
    checkedInReservations: 0,
    totalGuests: 0,
    checkedInGuests: 0,
    totalPromoters: 0,
    checkedInPromoters: 0,
    totalPromoterGuests: 0,
    checkedInPromoterGuests: 0,
  });

  // Carregar estabelecimentos
  useEffect(() => {
    const fetchEstablishments = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/api/establishments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setEstablishments(data.establishments || []);
          if (data.establishments && data.establishments.length > 0) {
            setSelectedEstablishment(data.establishments[0]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar estabelecimentos:', error);
      }
    };

    fetchEstablishments();
  }, []);

  // Carregar dados quando mudar estabelecimento, data ou hora
  useEffect(() => {
    if (selectedEstablishment) {
      loadCheckInData();
    }
  }, [selectedEstablishment, selectedDate]);

  const loadCheckInData = async () => {
    if (!selectedEstablishment) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Carregar reservas normais e grandes
      const [normalRes, largeRes] = await Promise.all([
        fetch(`${API_URL}/api/restaurant-reservations?establishment_id=${selectedEstablishment.id}&date=${selectedDate}`, { headers }),
        fetch(`${API_URL}/api/large-reservations?establishment_id=${selectedEstablishment.id}&date=${selectedDate}`, { headers })
      ]);

      const normalData = normalRes.ok ? await normalRes.json() : { reservations: [] };
      const largeData = largeRes.ok ? await largeRes.json() : { reservations: [] };

      const allReservations: ReservationOwner[] = [
        ...(normalData.reservations || []).map((r: any) => ({
          id: r.id,
          type: 'reservation' as const,
          client_name: r.client_name,
          reservation_date: r.reservation_date,
          reservation_time: r.reservation_time,
          number_of_people: r.number_of_people,
          table_number: r.table_number,
          area_name: r.area_name,
          checked_in: r.checked_in || false,
          checkin_time: r.checkin_time,
        })),
        ...(largeData.reservations || []).map((r: any) => ({
          id: r.id,
          type: 'large_reservation' as const,
          client_name: r.client_name,
          reservation_date: r.reservation_date,
          reservation_time: r.reservation_time,
          number_of_people: r.number_of_people,
          event_type: r.event_type,
          checked_in: r.checked_in || false,
          checkin_time: r.checkin_time,
        }))
      ];

      setReservationOwners(allReservations);

      // 2. Carregar convidados das listas de reservas (do mês selecionado)
      const monthStr = selectedDate.slice(0, 7);
      const allGuests: GuestListGuest[] = [];
      
      const guestListsRes = await fetch(
        `${API_URL}/api/admin/guest-lists?month=${monthStr}&establishment_id=${selectedEstablishment.id}`,
        { headers }
      );

      if (guestListsRes.ok) {
        const guestListsData = await guestListsRes.json();

        // Para cada lista, carregar os convidados
        for (const gl of guestListsData.guestLists || []) {
          // Filtrar pela data selecionada
          const listDate = gl.reservation_date?.split('T')[0];
          if (listDate === selectedDate) {
            const guestsRes = await fetch(
              `${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/guests`,
              { headers }
            );
            if (guestsRes.ok) {
              const guestsData = await guestsRes.json();
              const guests = (guestsData.guests || []).map((g: any) => ({
                id: g.id,
                guest_list_id: gl.guest_list_id,
                owner_name: gl.owner_name,
                name: g.name,
                whatsapp: g.whatsapp,
                checked_in: g.checked_in || false,
                checkin_time: g.checkin_time,
                reservation_date: gl.reservation_date,
                event_type: gl.event_type,
              }));
              allGuests.push(...guests);
            }
          }
        }
        setGuestListGuests(allGuests);
      }

      // 3. Carregar promoters e seus convidados de eventos
      const allPromoters: PromoterData[] = [];
      const allPromoterGuests: PromoterGuestData[] = [];
      
      const eventsRes = await fetch(`${API_URL}/api/v1/eventos?date=${selectedDate}`, { headers });
      
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();

        for (const event of eventsData.eventos || []) {
          // Verificar se o evento é do estabelecimento selecionado
          if (event.estabelecimento_id === selectedEstablishment.id) {
            const eventDate = event.data_evento?.split('T')[0];
            if (eventDate === selectedDate) {
              // Carregar promoters do evento
              const promotersRes = await fetch(
                `${API_URL}/api/v1/eventos/${event.evento_id}/promoters`,
                { headers }
              );
              
              if (promotersRes.ok) {
                const promotersData = await promotersRes.json();
                for (const promoter of promotersData.promoters || []) {
                  allPromoters.push({
                    id: promoter.promoter_id,
                    user_id: promoter.user_id,
                    name: promoter.nome_promoter,
                    phone: promoter.telefone || '',
                    event_name: event.nome_evento,
                    event_date: event.data_evento,
                    checked_in: false, // TODO: Implementar no backend
                    checkin_time: undefined,
                  });

                  // Carregar convidados do promoter
                  const listasRes = await fetch(
                    `${API_URL}/api/v1/eventos/${event.evento_id}/promoter/${promoter.promoter_id}/listas`,
                    { headers }
                  );

                  if (listasRes.ok) {
                    const listasData = await listasRes.json();
                    for (const lista of listasData.listas || []) {
                      if (lista.convidados) {
                        for (const convidado of lista.convidados) {
                          allPromoterGuests.push({
                            id: convidado.lista_convidado_id,
                            lista_convidado_id: convidado.lista_convidado_id,
                            promoter_name: promoter.nome_promoter,
                            event_name: event.nome_evento,
                            event_date: event.data_evento,
                            nome_convidado: convidado.nome_convidado,
                            telefone_convidado: convidado.telefone_convidado,
                            status_checkin: convidado.status_checkin,
                            data_checkin: convidado.data_checkin,
                            is_vip: convidado.is_vip,
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        setPromoters(allPromoters);
        setPromoterGuests(allPromoterGuests);
      }

      // Calcular estatísticas
      const checkedInReservations = allReservations.filter((r: ReservationOwner) => r.checked_in).length;
      const checkedInGuests = allGuests.filter((g: GuestListGuest) => g.checked_in).length;
      const checkedInPromoters = allPromoters.filter((p: PromoterData) => p.checked_in).length;
      const checkedInPromoterGuests = allPromoterGuests.filter((g: PromoterGuestData) => g.status_checkin === 'Check-in').length;

      setStats({
        totalReservations: allReservations.length,
        checkedInReservations,
        totalGuests: allGuests.length,
        checkedInGuests,
        totalPromoters: allPromoters.length,
        checkedInPromoters,
        totalPromoterGuests: allPromoterGuests.length,
        checkedInPromoterGuests,
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funções de check-in
  const handleReservationCheckIn = async (reservation: ReservationOwner) => {
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = reservation.type === 'reservation' 
        ? `${API_URL}/api/restaurant-reservations/${reservation.id}/checkin`
        : `${API_URL}/api/large-reservations/${reservation.id}/checkin`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setReservationOwners(prev => prev.map(r => 
          r.id === reservation.id && r.type === reservation.type
            ? { ...r, checked_in: true, checkin_time: new Date().toISOString() }
            : r
        ));
        alert(`✅ Check-in de ${reservation.client_name} confirmado!`);
        loadCheckInData(); // Recarregar dados
      } else {
        alert('❌ Erro ao fazer check-in');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao fazer check-in');
    }
  };

  const handleGuestCheckIn = async (guest: GuestListGuest) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/guests/${guest.id}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setGuestListGuests(prev => prev.map(g => 
          g.id === guest.id
            ? { ...g, checked_in: true, checkin_time: new Date().toISOString() }
            : g
        ));
        alert(`✅ Check-in de ${guest.name} confirmado!`);
        loadCheckInData();
      } else {
        alert('❌ Erro ao fazer check-in');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao fazer check-in');
    }
  };

  const handlePromoterGuestCheckIn = async (guest: PromoterGuestData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/v1/eventos/checkin/${guest.lista_convidado_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status_checkin: 'Check-in' })
      });

      if (response.ok) {
        setPromoterGuests(prev => prev.map(g => 
          g.lista_convidado_id === guest.lista_convidado_id
            ? { ...g, status_checkin: 'Check-in', data_checkin: new Date().toISOString() }
            : g
        ));
        alert(`✅ Check-in de ${guest.nome_convidado} confirmado!`);
        loadCheckInData();
      } else {
        alert('❌ Erro ao fazer check-in');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao fazer check-in');
    }
  };

  // Filtrar por horário
  const filterByTime = (time: string) => {
    if (selectedTime === 'todos') return true;
    
    const hour = parseInt(time?.split(':')[0] || '0');
    
    switch (selectedTime) {
      case 'almoco':
        return hour >= 11 && hour < 15;
      case 'tarde':
        return hour >= 15 && hour < 18;
      case 'jantar':
        return hour >= 18 && hour < 22;
      case 'noite':
        return hour >= 22 || hour < 6;
      default:
        return true;
    }
  };

  // Filtrar por busca
  const filterBySearch = (text: string) => {
    if (!searchTerm.trim()) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Filtrar dados
  const filteredReservations = reservationOwners
    .filter(r => filterByTime(r.reservation_time))
    .filter(r => filterBySearch(r.client_name) || filterBySearch(r.table_number || ''));

  const filteredGuests = guestListGuests
    .filter(g => filterByTime(g.reservation_time || ''))
    .filter(g => filterBySearch(g.name) || filterBySearch(g.owner_name) || filterBySearch(g.whatsapp || ''));

  const filteredPromoters = promoters
    .filter(p => filterBySearch(p.name) || filterBySearch(p.phone) || filterBySearch(p.event_name));

  const filteredPromoterGuests = promoterGuests
    .filter(g => filterBySearch(g.nome_convidado) || filterBySearch(g.promoter_name) || filterBySearch(g.telefone_convidado || ''));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MdCheckCircle size={36} />
            Check-ins na Entrada
          </h1>
          <p className="mt-2 text-green-100">
            Sistema simplificado para check-in de reservas, convidados e promoters
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Estabelecimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MdRestaurant className="inline mr-1" />
                Estabelecimento
              </label>
              <select
                value={selectedEstablishment?.id || ''}
                onChange={(e) => {
                  const est = establishments.find(est => est.id === parseInt(e.target.value));
                  setSelectedEstablishment(est || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {establishments.map(est => (
                  <option key={est.id} value={est.id}>{est.name}</option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MdCalendarToday className="inline mr-1" />
                Data
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Horário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MdAccessTime className="inline mr-1" />
                Período
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="almoco">Almoço (11h-15h)</option>
                <option value="tarde">Tarde (15h-18h)</option>
                <option value="jantar">Jantar (18h-22h)</option>
                <option value="noite">Noite (22h+)</option>
              </select>
            </div>

            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MdSearch className="inline mr-1" />
                Buscar
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nome, telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <MdClose size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Botão recarregar */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={loadCheckInData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <MdRefresh className={loading ? 'animate-spin' : ''} size={20} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">Reservas</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.checkedInReservations}/{stats.totalReservations}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-1">Convidados (Reservas)</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.checkedInGuests}/{stats.totalGuests}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <div className="text-sm text-gray-600 mb-1">Promoters</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.checkedInPromoters}/{stats.totalPromoters}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-1">Convidados (Promoters)</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.checkedInPromoterGuests}/{stats.totalPromoterGuests}
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <MdRefresh className="animate-spin inline-block text-green-600" size={48} />
            <p className="mt-4 text-gray-600">Carregando dados...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Reservas de Mesas */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MdTableBar size={24} className="text-blue-600" />
                Reservas de Mesas ({filteredReservations.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReservations.map(reservation => (
                  <motion.div
                    key={`${reservation.type}-${reservation.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 ${
                      reservation.checked_in
                        ? 'bg-green-50 border-green-300'
                        : 'bg-white border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{reservation.client_name}</h3>
                        <div className="text-sm text-gray-600 space-y-1 mt-1">
                          <div className="flex items-center gap-1">
                            <MdAccessTime size={14} />
                            {reservation.reservation_time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MdPerson size={14} />
                            {reservation.number_of_people} pessoas
                          </div>
                          {reservation.table_number && (
                            <div className="flex items-center gap-1">
                              <MdTableBar size={14} />
                              Mesa {reservation.table_number}
                            </div>
                          )}
                          {reservation.event_type && (
                            <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded inline-block mt-1">
                              {reservation.event_type}
                            </div>
                          )}
                        </div>
                      </div>
                      {reservation.checked_in && (
                        <MdCheckCircle size={32} className="text-green-600" />
                      )}
                    </div>

                    {!reservation.checked_in ? (
                      <button
                        onClick={() => handleReservationCheckIn(reservation)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <MdCheckCircle size={20} />
                        Fazer Check-in
                      </button>
                    ) : (
                      <div className="text-center text-sm text-green-700 font-medium">
                        ✅ Check-in feito às {new Date(reservation.checkin_time!).toLocaleTimeString('pt-BR')}
                      </div>
                    )}
                  </motion.div>
                ))}
                {filteredReservations.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    Nenhuma reserva encontrada
                  </div>
                )}
              </div>
            </section>

            {/* Convidados de Reservas */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MdGroups size={24} className="text-purple-600" />
                Convidados de Reservas ({filteredGuests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGuests.map(guest => (
                  <motion.div
                    key={guest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 ${
                      guest.checked_in
                        ? 'bg-green-50 border-green-300'
                        : 'bg-white border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800">{guest.name}</h3>
                        <div className="text-sm text-gray-600 space-y-1 mt-1">
                          <div>Lista de: {guest.owner_name}</div>
                          {guest.whatsapp && (
                            <div className="flex items-center gap-1">
                              <MdPhone size={14} />
                              {guest.whatsapp}
                            </div>
                          )}
                          {guest.event_type && (
                            <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded inline-block mt-1">
                              {guest.event_type}
                            </div>
                          )}
                        </div>
                      </div>
                      {guest.checked_in && (
                        <MdCheckCircle size={32} className="text-green-600" />
                      )}
                    </div>

                    {!guest.checked_in ? (
                      <button
                        onClick={() => handleGuestCheckIn(guest)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <MdCheckCircle size={20} />
                        Fazer Check-in
                      </button>
                    ) : (
                      <div className="text-center text-sm text-green-700 font-medium">
                        ✅ Check-in feito às {new Date(guest.checkin_time!).toLocaleTimeString('pt-BR')}
                      </div>
                    )}
                  </motion.div>
                ))}
                {filteredGuests.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    Nenhum convidado encontrado
                  </div>
                )}
              </div>
            </section>

            {/* Promoters */}
            {filteredPromoters.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MdStar size={24} className="text-orange-600" />
                  Promoters ({filteredPromoters.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPromoters.map(promoter => (
                    <motion.div
                      key={promoter.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 bg-orange-50 border-orange-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{promoter.name}</h3>
                          <div className="text-sm text-gray-600 space-y-1 mt-1">
                            <div className="flex items-center gap-1">
                              <MdEvent size={14} />
                              {promoter.event_name}
                            </div>
                            {promoter.phone && (
                              <div className="flex items-center gap-1">
                                <MdPhone size={14} />
                                {promoter.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <MdStar size={32} className="text-orange-500" />
                      </div>
                      <div className="text-center text-sm text-orange-700 font-medium">
                        Promoter do evento
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Convidados de Promoters */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MdEvent size={24} className="text-green-600" />
                Convidados de Promoters ({filteredPromoterGuests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPromoterGuests.map(guest => (
                  <motion.div
                    key={guest.lista_convidado_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 ${
                      guest.status_checkin === 'Check-in'
                        ? 'bg-green-50 border-green-300'
                        : guest.status_checkin === 'No-Show'
                        ? 'bg-red-50 border-red-300'
                        : 'bg-white border-gray-300 hover:border-green-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-gray-800">{guest.nome_convidado}</h3>
                          {guest.is_vip && (
                            <MdStar size={20} className="text-yellow-500" title="VIP" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 mt-1">
                          <div>Promoter: {guest.promoter_name}</div>
                          <div className="text-xs text-gray-500">{guest.event_name}</div>
                          {guest.telefone_convidado && (
                            <div className="flex items-center gap-1">
                              <MdPhone size={14} />
                              {guest.telefone_convidado}
                            </div>
                          )}
                        </div>
                      </div>
                      {guest.status_checkin === 'Check-in' && (
                        <MdCheckCircle size={32} className="text-green-600" />
                      )}
                    </div>

                    {guest.status_checkin === 'Pendente' ? (
                      <button
                        onClick={() => handlePromoterGuestCheckIn(guest)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <MdCheckCircle size={20} />
                        Fazer Check-in
                      </button>
                    ) : guest.status_checkin === 'Check-in' ? (
                      <div className="text-center text-sm text-green-700 font-medium">
                        ✅ Check-in feito às {new Date(guest.data_checkin!).toLocaleTimeString('pt-BR')}
                      </div>
                    ) : (
                      <div className="text-center text-sm text-red-700 font-medium">
                        ❌ No-Show
                      </div>
                    )}
                  </motion.div>
                ))}
                {filteredPromoterGuests.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    Nenhum convidado de promoter encontrado
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

