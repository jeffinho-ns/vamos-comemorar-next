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

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  reservations: Reservation[];
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
}

export default function ReservationCalendar({ 
  establishment, 
  onDateSelect, 
  onAddReservation,
  onEditReservation,
  onDeleteReservation,
  onStatusChange
}: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedDayReservations, setSelectedDayReservations] = useState<Reservation[]>([]);

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
      
      // Buscar reservas reais da API
      const response = await fetch(`http://localhost:3001/api/restaurant-reservations?establishment_id=${establishment.id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar reservas');
      }
      
      const data = await response.json();
      const reservations: Reservation[] = data.reservations || [];
      
      console.log('📅 Reservas carregadas para o calendário:', reservations.length);

      // Atualizar dias do calendário com as reservas reais
      const updatedDays = generateCalendarDays(date).map(day => {
        const dayString = day.date.toISOString().split('T')[0];
        const dayReservations = reservations.filter(
          reservation => {
            const reservationDate = new Date(reservation.reservation_date).toISOString().split('T')[0];
            return reservationDate === dayString;
          }
        );
        
        return {
          ...day,
          reservations: dayReservations,
          totalReservations: dayReservations.length,
          availableTables: Math.max(0, 10 - dayReservations.length) // Simular 10 mesas disponíveis
        };
      });

      setCalendarDays(updatedDays);
    } catch (error) {
      console.error("❌ Erro ao carregar reservas:", error);
      // Em caso de erro, usar dados vazios
      const updatedDays = generateCalendarDays(date).map(day => ({
        ...day,
        reservations: [],
        totalReservations: 0,
        availableTables: 10
      }));
      setCalendarDays(updatedDays);
    } finally {
      setLoading(false);
    }
  }, [generateCalendarDays, establishment.id]);

  useEffect(() => {
    loadReservationsForMonth(currentDate);
  }, [currentDate, loadReservationsForMonth]);

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
                    <div className="text-xs opacity-75">{reservation.reservation_time}</div>
                  </div>
                ))}
                
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
