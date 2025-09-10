"use client";

import { useState, useMemo } from "react";
import { MdChevronLeft, MdChevronRight, MdAdd, MdEdit, MdDelete, MdPeople, MdPhone, MdRestaurant, MdTimer } from "react-icons/md";
import { motion } from "framer-motion";

interface Reservation {
  id: number;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  number_of_people: number;
  reservation_date: string;
  reservation_time: string;
  area_name: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'checked-in' | 'completed';
  notes?: string;
}

interface WeeklyCalendarProps {
  reservations: Reservation[];
  onAddReservation: (date: Date, time: string) => void;
  onEditReservation: (reservation: Reservation) => void;
  onDeleteReservation: (reservation: Reservation) => void;
  onStatusChange: (reservation: Reservation, newStatus: string) => void;
}

interface TimeSlot {
  time: string;
  reservations: Reservation[];
}

interface DayData {
  date: Date;
  dayName: string;
  dayNumber: number;
  timeSlots: TimeSlot[];
}

const TIME_SLOTS = [
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", 
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
];

const DAYS_OF_WEEK = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
];

export default function WeeklyCalendar({
  reservations,
  onAddReservation,
  onEditReservation,
  onDeleteReservation,
  onStatusChange
}: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Calcular início da semana (domingo)
  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  };

  // Calcular fim da semana (sábado)
  const getWeekEnd = (date: Date) => {
    const end = new Date(date);
    end.setDate(date.getDate() - date.getDay() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  // Navegar para semana anterior
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev);
      newWeek.setDate(prev.getDate() - 7);
      return newWeek;
    });
  };

  // Navegar para próxima semana
  const goToNextWeek = () => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev);
      newWeek.setDate(prev.getDate() + 7);
      return newWeek;
    });
  };

  // Ir para semana atual
  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Processar dados da semana
  const weekData = useMemo(() => {
    const weekStart = getWeekStart(currentWeek);
    const weekEnd = getWeekEnd(currentWeek);
    
    
    const days: DayData[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      const dayName = DAYS_OF_WEEK[i];
      const dayNumber = date.getDate();
      
      // Filtrar reservas para este dia (usando o mesmo método do calendário mensal)
      const dayString = date.toISOString().split('T')[0];
      const dayReservations = reservations.filter(reservation => {
        // Processar data da reserva (pode vir em formato ISO com timezone)
        let reservationDateStr;
        try {
          const reservationDate = new Date(reservation.reservation_date);
          // Usar toISOString() para garantir formato consistente
          reservationDateStr = reservationDate.toISOString().split('T')[0];
        } catch (error) {
          console.error('Erro ao processar data da reserva:', reservation.reservation_date, error);
          return false;
        }
        
        const isMatch = reservationDateStr === dayString;
        return isMatch;
      });
      
      // Agrupar reservas por horário
      const timeSlots: TimeSlot[] = TIME_SLOTS.map(time => ({
        time,
        reservations: dayReservations.filter(reservation => 
          reservation.reservation_time === time
        )
      }));
      
      days.push({
        date,
        dayName,
        dayNumber,
        timeSlots
      });
    }
    
    return days;
  }, [currentWeek, reservations]);

  // Obter cor do status
  const getStatusColor = (status: 'confirmed' | 'pending' | 'cancelled' | 'checked-in' | 'completed') => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'checked-in':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obter texto do status
  const getStatusText = (status: 'confirmed' | 'pending' | 'cancelled' | 'checked-in' | 'completed') => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'checked-in':
        return 'Check-in';
      case 'completed':
        return 'Finalizada';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Verificar se é hoje
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Verificar se é data passada
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header da semana */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <MdChevronLeft size={20} className="text-gray-600" />
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Hoje
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <MdChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800">
              {weekData[0]?.date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit' 
              })} - {weekData[6]?.date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit',
                year: 'numeric'
              })}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total de reservas: {weekData.reduce((sum, day) => 
                sum + day.timeSlots.reduce((daySum, slot) => daySum + slot.reservations.length, 0), 0
              )}
            </p>
          </div>
          <div className="w-24"></div> {/* Espaçador para centralizar o título */}
        </div>
      </div>

      {/* Grid da semana */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-3 bg-gray-50 border-r border-gray-200">
              <div className="text-sm font-medium text-gray-600">Horário</div>
            </div>
            {weekData.map((day, index) => (
              <div
                key={index}
                className={`p-3 text-center border-r border-gray-200 ${
                  isToday(day.date) 
                    ? 'bg-blue-50' 
                    : isPastDate(day.date)
                    ? 'bg-gray-50'
                    : 'bg-white'
                }`}
              >
                <div className={`text-sm font-medium ${
                  isToday(day.date) 
                    ? 'text-blue-800' 
                    : isPastDate(day.date)
                    ? 'text-gray-500'
                    : 'text-gray-800'
                }`}>
                  {day.dayName}
                </div>
                <div className={`text-lg font-bold ${
                  isToday(day.date) 
                    ? 'text-blue-900' 
                    : isPastDate(day.date)
                    ? 'text-gray-400'
                    : 'text-gray-900'
                }`}>
                  {day.dayNumber}
                </div>
              </div>
            ))}
          </div>

          {/* Slots de horário */}
          {TIME_SLOTS.map((time, timeIndex) => (
            <div key={time} className="grid grid-cols-8 border-b border-gray-100">
              {/* Coluna de horário */}
              <div className="p-3 bg-gray-50 border-r border-gray-200">
                <div className="text-sm font-medium text-gray-600">{time}</div>
              </div>
              
              {/* Colunas dos dias */}
              {weekData.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`relative p-2 border-r border-gray-100 min-h-[120px] ${
                    isToday(day.date) 
                      ? 'bg-blue-50/30' 
                      : isPastDate(day.date)
                      ? 'bg-gray-50'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Indicador de reservas */}
                  {day.timeSlots[timeIndex]?.reservations.length > 0 && (
                    <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {day.timeSlots[timeIndex].reservations.length}
                    </div>
                  )}
                  
                  {/* Botão para adicionar reserva */}
                  {!isPastDate(day.date) && day.timeSlots[timeIndex]?.reservations.length === 0 && (
                    <button
                      onClick={() => onAddReservation(day.date, time)}
                      className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors group"
                    >
                      <MdAdd size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                  
                  {/* Reservas para este horário */}
                  <div className="space-y-1">
                    {day.timeSlots[timeIndex]?.reservations.map((reservation) => (
                      <motion.div
                        key={reservation.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-2 rounded-lg border text-xs cursor-pointer hover:shadow-sm transition-shadow bg-white"
                        onClick={() => onEditReservation(reservation)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800 truncate">
                            {reservation.client_name}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                            {getStatusText(reservation.status)}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MdPeople size={12} />
                            <span>{reservation.number_of_people}p</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-gray-600">
                            <MdRestaurant size={12} />
                            <span className="truncate">{reservation.area_name}</span>
                          </div>
                          
                          {reservation.client_phone && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <MdPhone size={12} />
                              <span className="truncate">{reservation.client_phone}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditReservation(reservation);
                            }}
                            className="flex-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                          >
                            <MdEdit size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteReservation(reservation);
                            }}
                            className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                          >
                            <MdDelete size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
