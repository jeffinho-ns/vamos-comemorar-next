"use client";

import { useState, useEffect, useCallback } from "react";
import { MdChevronLeft, MdChevronRight, MdAdd, MdEvent, MdRestaurant } from "react-icons/md";
import ReservationsDayModal from "./ReservationsDayModal";
import ReservationDetailsModal from "./ReservationDetailsModal";

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

import { Reservation } from '@/app/types/reservation';
import { BirthdayReservation } from '@/app/services/birthdayService';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  reservations: Reservation[];
  birthdayReservations: BirthdayReservation[];
  totalReservations: number;
  availableTables: number;
}

interface ReservationCalendarProps {
  establishment: Establishment;
  onDateSelect: (date: Date, reservations: Reservation[]) => void;
  onAddReservation: (date: Date) => void;
  onEditReservation?: (reservation: Reservation) => void;
  onDeleteReservation?: (reservation: Reservation) => void;
  onStatusChange?: (reservation: Reservation, newStatus: string) => void;
  birthdayReservations?: BirthdayReservation[];
}

export default function ReservationCalendar({ 
  establishment, 
  onDateSelect, 
  onAddReservation,
  onEditReservation,
  onDeleteReservation,
  onStatusChange,
  birthdayReservations = []
}: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());// Setembro de 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedDayReservations, setSelectedDayReservations] = useState<Reservation[]>([]);

  // Total de mesas por estabelecimento (Highline = 36)
  const getTotalTablesForEstablishment = () => {
    const name = (establishment?.name || '').toLowerCase();
    if (name.includes('high line') || name.includes('highline')) return 36;
    return 10;
  };

  function ReservationBadge({ reservation }: { reservation: any }) {
    const n = String(reservation.table_number || '');
    let cap: number | undefined;
    if (['50','51','52','53','54','55','70','71','72','73'].includes(n)) cap = 2;
    else if (['15','16','17'].includes(n)) cap = 3;
    else if (['44','45','46','47','09','10','11','12'].includes(n)) cap = 6;
    else if (['40','41','42','01','02','03','04'].includes(n)) cap = 8;
    else if (['60','61','62','63','64','65'].includes(n)) cap = 10;

    const cls = cap === 2
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : cap === 3
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : cap === 6
      ? 'bg-orange-100 text-orange-800 border-orange-200'
      : cap === 8
      ? 'bg-teal-100 text-teal-800 border-teal-200'
      : cap === 10
      ? 'bg-red-100 text-red-800 border-red-200'
      : 'bg-gray-900/10 text-gray-900 border-gray-900/20';

    return (
      <div className="flex items-center gap-1 text-[10px] opacity-80">
        <span>{reservation.reservation_time}</span>
        {reservation.table_number && (
          <span className={`px-1 py-0.5 rounded border ${cls}`}>
            Mesa {reservation.table_number}{cap ? ` • ${cap}p` : ''}
          </span>
        )}
      </div>
    );
  }
  // Gerar dias do calendário
  const generateCalendarDays = useCallback((date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);
      
      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: currentDay.toDateString() === today.toDateString(),
        reservations: [],
        birthdayReservations: [],
        totalReservations: 0,
        availableTables: 0
      });
    }
    
    return days;
  }, []);

  // Carregar reservas para o mês atual
    const loadReservationsForMonth = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      console.log('📅 Carregando dados para:', { year, month });
      console.log('🎂 Reservas de aniversário disponíveis:', birthdayReservations.length);

      // Buscar reservas reais da API
      const response = await fetch(`https://vamos-comemorar-api.onrender.com/api/restaurant-reservations?establishment_id=${establishment.id}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar reservas');
      }

      const data = await response.json();
      const reservations: Reservation[] = data.reservations || [];
      
      console.log('📅 Reservas carregadas para o calendário:', reservations.length);

      // Atualizar dias do calendário com as reservas reais
      const totalTables = getTotalTablesForEstablishment();
      const updatedDays = generateCalendarDays(date).map(day => {
        const dayString = day.date.toISOString().split('T')[0];
        const dayReservations = reservations.filter(
          reservation => {
            const reservationDate = new Date(reservation.reservation_date).toISOString().split('T')[0];
            return reservationDate === dayString;
          }
        );
        
        // Filtrar reservas de aniversário para este dia
        const dayBirthdayReservations = birthdayReservations.filter(
          birthday => {
            const birthdayDate = new Date(birthday.data_aniversario).toISOString().split('T')[0];
            return birthdayDate === dayString;
          }
        );

        // TESTE: Adicionar aniversário hardcoded para o dia 15
        if (dayString === '2025-09-15') {
          dayBirthdayReservations.push({
            id: 999,
            user_id: 1,
            aniversariante_nome: 'TESTE HARDCODED',
            data_aniversario: '2025-09-15T07:00:00.000Z',
            quantidade_convidados: 10,
            nomes_convidados: [],
            id_casa_evento: 1,
            place_name: 'Teste',
            user_name: 'Teste',
            decoracao_tipo: 'Teste',
            painel_personalizado: false,
            painel_tema: '',
            painel_frase: '',
            painel_estoque_imagem_url: '',
            status: 'pendente',
            created_at: '2025-09-04T07:00:00.000Z',
            updated_at: '2025-09-04T07:00:00.000Z'
          } as BirthdayReservation);
        }
        
        // Debug: log para dias com aniversários
        if (dayBirthdayReservations.length > 0) {
          console.log('🎂 Dia com aniversários:', dayString, dayBirthdayReservations.length, 'aniversários');
        }
        
        const availableTables = Math.max(0, totalTables - dayReservations.length);
        return {
          ...day,
          reservations: dayReservations,
          birthdayReservations: dayBirthdayReservations,
          totalReservations: dayReservations.length + dayBirthdayReservations.length,
          availableTables
        };
      });

      setCalendarDays(updatedDays);
    } catch (error) {
      console.error("❌ Erro ao carregar reservas:", error);
      // Em caso de erro, usar dados vazios
      const totalTables = getTotalTablesForEstablishment();
      const updatedDays = generateCalendarDays(date).map(day => ({
        ...day,
        reservations: [],
        birthdayReservations: [],
        totalReservations: 0,
        availableTables: totalTables
      }));
      setCalendarDays(updatedDays);
    } finally {
      setLoading(false);
    }
  }, [generateCalendarDays, establishment.id, birthdayReservations]);

  useEffect(() => {
    loadReservationsForMonth(currentDate);
  }, [currentDate, loadReservationsForMonth]);

  // Recarregar quando as reservas de aniversário mudarem
  useEffect(() => {
    if (birthdayReservations.length > 0) {
      console.log('🎂 Reservas de aniversário mudaram, recarregando calendário...');
      loadReservationsForMonth(currentDate);
    }
  }, [birthdayReservations, currentDate, loadReservationsForMonth]);

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    setSelectedDayReservations(day.reservations);
    
    if (day.reservations.length > 0) {
      setShowDayModal(true);
    } else {
      onDateSelect(day.date, day.reservations);
    }
  };

  const handleAddReservationClick = (day: CalendarDay) => {
    onAddReservation(day.date);
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailsModal(true);
    setShowDayModal(false);
  };

  const handleCloseDayModal = () => {
    setShowDayModal(false);
    setSelectedDayReservations([]);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedReservation(null);
  };

  const handleEditReservation = (reservation: Reservation) => {
    if (onEditReservation) {
      onEditReservation(reservation);
    }
    setShowDetailsModal(false);
    setSelectedReservation(null);
  };

  const handleDeleteReservation = (reservation: Reservation) => {
    if (onDeleteReservation) {
      onDeleteReservation(reservation);
    }
    setShowDetailsModal(false);
    setSelectedReservation(null);
  };

  const handleStatusChange = (reservation: Reservation, newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(reservation, newStatus);
    }
    // Atualizar o estado local
    setCalendarDays(prevDays => 
      prevDays.map(day => ({
        ...day,
        reservations: day.reservations.map(res => 
          res.id === reservation.id ? { ...res, status: newStatus as any } : res
        )
      }))
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <>
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header do Calendário */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <p className="text-gray-600">{establishment.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MdChevronLeft className="text-2xl text-gray-600" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MdChevronRight className="text-2xl text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* Grid do Calendário */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              min-h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer transition-colors
              ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'}
              ${day.isToday ? 'bg-yellow-50 border-yellow-200' : ''}
              ${selectedDate?.toDateString() === day.date.toDateString() ? 'bg-blue-50 border-blue-200' : ''}
            `}
            onClick={() => handleDateClick(day)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-medium ${
                day.isToday ? 'text-yellow-600' : 
                day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {day.date.getDate()}
              </span>
              {day.isCurrentMonth && day.availableTables > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddReservationClick(day);
                  }}
                  className="p-1 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                  title="Adicionar Reserva"
                >
                  <MdAdd className="text-xs" />
                </button>
              )}
            </div>

            {/* Informações do Dia */}
            {day.isCurrentMonth && (
              <div className="space-y-1">
                {day.totalReservations > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <MdEvent className="text-blue-500" />
                    <span className="text-blue-600 font-medium">
                      {day.totalReservations} reserva{day.totalReservations !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                {day.availableTables > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <MdRestaurant className="text-green-500" />
                    <span className="text-green-600">
                      {day.availableTables} mesa{day.availableTables !== 1 ? 's' : ''} disponível{day.availableTables !== 1 ? 'is' : ''}
                    </span>
                  </div>
                )}

                {/* Lista de Reservas (máximo 2 visíveis) */}
                {day.reservations.slice(0, 2).map((reservation) => (
                  <div
                    key={reservation.id}
                    className={`text-xs p-1 rounded ${getStatusColor(reservation.status)}`}
                  >
                    <div className="font-medium truncate">{reservation.client_name}</div>
                    <ReservationBadge reservation={reservation} />
                  </div>
                ))}
                
                {/* Indicadores de Aniversário */}
                {day.birthdayReservations.length > 0 && (
                  <div className="mt-1">
                    <div className="text-xs p-1 rounded bg-pink-200 text-pink-800 font-bold">
                      🎂 {day.birthdayReservations.length} aniversário(s)
                    </div>
                  </div>
                )}
                
                {day.reservations.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{day.reservations.length - 2} mais
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

             {/* Loading Overlay */}
       {loading && (
         <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
         </div>
       )}
     </div>

     {/* Modal de Reservas do Dia */}
     {selectedDate && (
       <ReservationsDayModal
         isOpen={showDayModal}
         onClose={handleCloseDayModal}
         date={selectedDate}
         reservations={selectedDayReservations}
         onReservationClick={handleReservationClick}
       />
     )}

     {/* Modal de Detalhes da Reserva */}
     <ReservationDetailsModal
       isOpen={showDetailsModal}
       onClose={handleCloseDetailsModal}
       reservation={selectedReservation}
       onEdit={onEditReservation ? handleEditReservation : undefined}
       onDelete={onDeleteReservation ? handleDeleteReservation : undefined}
       onStatusChange={onStatusChange ? handleStatusChange : undefined}
     />
   </>
   );
 }
