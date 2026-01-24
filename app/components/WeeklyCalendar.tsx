"use client";

import { useState, useMemo } from "react";
import { MdChevronLeft, MdChevronRight, MdAdd, MdEdit, MdDelete, MdPeople, MdPhone, MdRestaurant, MdTimer, MdSchedule, MdBarChart, MdVisibility, MdVisibilityOff } from "react-icons/md";
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
  table_number?: string;
  establishment_id?: number;
}

interface WeeklyCalendarProps {
  reservations: Reservation[];
  onAddReservation: (date: Date, time: string) => void;
  onEditReservation: (reservation: Reservation) => void;
  onDeleteReservation: (reservation: Reservation) => void;
  onStatusChange: (reservation: Reservation, newStatus: string) => void;
  establishment?: { id?: number; name?: string; logo?: string; address?: string } | null;
}

interface TimeSlot {
  time: string;
  reservations: Reservation[];
  totalPeople: number;
}

interface DayData {
  date: Date;
  dayName: string;
  dayNumber: string;
  monthName: string;
  timeSlots: TimeSlot[];
  totalReservations: number;
  totalPeople: number;
}

const TIME_SLOTS = [
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", 
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
];

const DAYS_OF_WEEK = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
];

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default function WeeklyCalendar({
  reservations,
  onAddReservation,
  onEditReservation,
  onDeleteReservation,
  onStatusChange,
  establishment
}: WeeklyCalendarProps) {
  // Função helper para mapear mesa -> área do Seu Justino
  const getSeuJustinoAreaName = (tableNumber?: string | number, areaName?: string, areaId?: number): string => {
    const isSeuJustino = establishment && (
      (establishment.name || '').toLowerCase().includes('seu justino') && 
      !(establishment.name || '').toLowerCase().includes('pracinha')
    );
    
    if (!isSeuJustino) return areaName || '';
    if (!tableNumber && !areaName && !areaId) return areaName || '';
    
    const tableNum = String(tableNumber || '').trim();
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
    
    if (areaName && (areaName.toLowerCase().includes('coberta') || areaName.toLowerCase().includes('descoberta'))) {
      if (areaId === 1 && tableNum) {
        const tableNumbers = tableNum.includes(',') ? tableNum.split(',').map(t => t.trim()) : [tableNum];
        for (const tn of tableNumbers) {
          const subarea = seuJustinoSubareas.find(sub => sub.tableNumbers.includes(tn) && sub.area_id === 1);
          if (subarea) return subarea.label;
        }
      } else if (areaId === 2 && tableNum) {
        const tableNumbers = tableNum.includes(',') ? tableNum.split(',').map(t => t.trim()) : [tableNum];
        for (const tn of tableNumbers) {
          const subarea = seuJustinoSubareas.find(sub => sub.tableNumbers.includes(tn) && sub.area_id === 2);
          if (subarea) return subarea.label;
        }
      }
    }
    
    return areaName || '';
  };
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'detailed'>('grid');
  const [showEmptySlots, setShowEmptySlots] = useState(true);

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


  // Ir para semana de 10 de setembro de 2025
  const goToSeptember10Week = () => {
    const september10Date = new Date('2025-09-10');
    setCurrentWeek(september10Date);
    console.log('🎯 Navegando para semana de 10 de setembro de 2025');
  };

  // Função auxiliar para normalizar datas
  const normalizeDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      
      // Se a data já está no formato YYYY-MM-DD, retorna como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // Caso contrário, converte para o formato correto
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Data inválida:', dateString);
        return '';
      }
      
      // Usar UTC para evitar problemas de timezone
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      
      const normalizedDate = `${year}-${month}-${day}`;
      
      return normalizedDate;
    } catch (error) {
      console.error('Erro ao normalizar data:', dateString, error);
      return '';
    }
  };

  // Função auxiliar para normalizar horários
  const normalizeTime = (timeString: string): string => {
    try {
      if (!timeString) return '';
      
      // Se o horário já está no formato HH:MM, retorna como está
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      
      // Se está no formato HH:MM:SS, remove os segundos
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
        const normalizedTime = timeString.substring(0, 5);
        return normalizedTime;
      }
      
      // Se está no formato H:MM, adiciona zero à esquerda
      if (/^\d{1}:\d{2}$/.test(timeString)) {
        const normalizedTime = '0' + timeString;
        return normalizedTime;
      }
      
      // Caso contrário, tenta converter
      const time = new Date(`2000-01-01T${timeString}`);
      if (isNaN(time.getTime())) {
        console.error('Horário inválido:', timeString);
        return '';
      }
      
      const normalizedTime = time.toTimeString().substring(0, 5);
      return normalizedTime;
    } catch (error) {
      console.error('Erro ao normalizar horário:', timeString, error);
      return '';
    }
  };

  // Processar dados da semana
  const weekData = useMemo(() => {
    const weekStart = getWeekStart(currentWeek);
    const weekEnd = getWeekEnd(currentWeek);
    
    console.log('📅 Processando semana:', {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalReservations: reservations.length
    });
    
    
    const days: DayData[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      const dayName = DAYS_OF_WEEK[i];
      const dayNumber = date.getDate().toString().padStart(2, '0');
      const monthName = MONTHS[date.getMonth()];
      
      // Filtrar reservas para este dia
      const dayString = date.toISOString().split('T')[0];
      
      const dayReservations = reservations.filter(reservation => {
        try {
          const normalizedReservationDate = normalizeDate(reservation.reservation_date);
          return normalizedReservationDate === dayString;
        } catch (error) {
          console.error('Erro ao processar data da reserva:', reservation.reservation_date, error);
          return false;
        }
      });
      
      // Agrupar reservas por horário
      const timeSlots: TimeSlot[] = TIME_SLOTS.map(time => {
        const slotReservations = dayReservations.filter(reservation => {
          const normalizedReservationTime = normalizeTime(reservation.reservation_time);
          return normalizedReservationTime === time;
        });
        const totalPeople = slotReservations.reduce((sum, res) => sum + res.number_of_people, 0);
        
        return {
          time,
          reservations: slotReservations,
          totalPeople
        };
      });
      
      const totalReservations = dayReservations.length;
      const totalPeople = dayReservations.reduce((sum, res) => sum + res.number_of_people, 0);
      
      days.push({
        date,
        dayName,
        dayNumber,
        monthName,
        timeSlots,
        totalReservations,
        totalPeople
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


  // Calcular estatísticas da semana
  const weekStats = useMemo(() => {
    const totalReservations = weekData.reduce((sum, day) => sum + day.totalReservations, 0);
    const totalPeople = weekData.reduce((sum, day) => sum + day.totalPeople, 0);
    const averagePerDay = weekData.length > 0 ? Math.round(totalReservations / weekData.length) : 0;
    
    return {
      totalReservations,
      totalPeople,
      averagePerDay
    };
  }, [weekData]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Debug Info - Apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 p-3 border-b border-blue-200">
          <div className="text-sm text-blue-700">
            <p><strong>Total de reservas carregadas:</strong> {reservations.length}</p>
            <p><strong>Reservas da semana atual:</strong> {weekStats.totalReservations}</p>
            <p><strong>Semana exibida:</strong> {weekData[0]?.dayNumber} {weekData[0]?.monthName} - {weekData[6]?.dayNumber} {weekData[6]?.monthName} {weekData[6]?.date.getFullYear()}</p>
          </div>
        </div>
      )}

      {/* Header da semana */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
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
              onClick={goToSeptember10Week}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              10 Set
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
              {weekData[0]?.dayNumber} {weekData[0]?.monthName} - {weekData[6]?.dayNumber} {weekData[6]?.monthName} {weekData[6]?.date.getFullYear()}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MdRestaurant size={16} />
                <span>{weekStats.totalReservations} reservas</span>
              </div>
              <div className="flex items-center gap-1">
                <MdPeople size={16} />
                <span>{weekStats.totalPeople} pessoas</span>
              </div>
              <div className="flex items-center gap-1">
                <MdBarChart size={16} />
                <span>Média: {weekStats.averagePerDay}/dia</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'detailed' : 'grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <MdSchedule size={16} />
              {viewMode === 'grid' ? 'Grade' : 'Detalhado'}
            </button>
            <button
              onClick={() => setShowEmptySlots(!showEmptySlots)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                showEmptySlots 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showEmptySlots ? <MdVisibility size={16} /> : <MdVisibilityOff size={16} />}
              {showEmptySlots ? 'Ocultar Vazios' : 'Mostrar Vazios'}
            </button>
          </div>
        </div>
      </div>

      {/* Visualização em Grade */}
      {viewMode === 'grid' && (
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
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
                  <div className={`text-xs ${
                    isToday(day.date) 
                      ? 'text-blue-600' 
                      : isPastDate(day.date)
                      ? 'text-gray-400'
                      : 'text-gray-500'
                  }`}>
                    {day.totalReservations} res.
                  </div>
                </div>
              ))}
            </div>

            {/* Slots de horário */}
            {TIME_SLOTS.map((time, timeIndex) => {
              const hasReservations = weekData.some(day => day.timeSlots[timeIndex]?.reservations.length > 0);
              
              if (!showEmptySlots && !hasReservations) return null;
              
              return (
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
                            className={`p-2 rounded-lg border-2 text-xs cursor-pointer hover:shadow-lg transition-all duration-200 ${
                              reservation.notes && reservation.notes.includes('🎂') 
                                ? 'bg-gradient-to-r from-pink-50 to-yellow-50 border-pink-300 hover:border-pink-400' 
                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-400'
                            }`}
                            onClick={() => onEditReservation(reservation)}
                          >
                            {/* Cabeçalho da reserva */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                {reservation.notes && reservation.notes.includes('🎂') && (
                                  <span className="text-lg flex-shrink-0">🎂</span>
                                )}
                                <span className="font-bold text-gray-800 truncate text-xs">
                                  {reservation.client_name}
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${getStatusColor(reservation.status)}`}>
                                {getStatusText(reservation.status)}
                              </span>
                            </div>
                            
                            {/* Informações da reserva */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-gray-600">
                                <MdPeople size={12} className="text-blue-500" />
                                <span className="font-medium">{reservation.number_of_people}p</span>
                              </div>
                              
                              <div className="flex items-center gap-1 text-gray-600">
                                <MdRestaurant size={12} className="text-green-500" />
                                <span className="truncate font-medium">{getSeuJustinoAreaName((reservation as any).table_number, reservation.area_name, (reservation as any).area_id)}</span>
                              </div>
                              
                              {reservation.table_number && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <MdRestaurant size={12} className="text-orange-500" />
                                  <span className="truncate font-medium">Mesa {reservation.table_number}</span>
                                </div>
                              )}
                              
                              {reservation.client_phone && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <MdPhone size={12} className="text-purple-500" />
                                  <span className="truncate font-medium">{reservation.client_phone}</span>
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
                                className="flex-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors font-medium"
                              >
                                <MdEdit size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteReservation(reservation);
                                }}
                                className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors font-medium"
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
              );
            })}
          </div>
        </div>
      )}

      {/* Visualização Detalhada */}
      {viewMode === 'detailed' && (
        <div className="p-6">
          <div className="space-y-6">
            {weekData.map((day, dayIndex) => (
              <div key={dayIndex} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isToday(day.date) 
                        ? 'bg-blue-500 text-white' 
                        : isPastDate(day.date)
                        ? 'bg-gray-400 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      <div className="text-center">
                        <div className="text-sm font-bold">{day.dayNumber}</div>
                        <div className="text-xs">{day.monthName}</div>
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        isToday(day.date) 
                          ? 'text-blue-800' 
                          : isPastDate(day.date)
                          ? 'text-gray-500'
                          : 'text-gray-800'
                      }`}>
                        {day.dayName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {day.totalReservations} reservas • {day.totalPeople} pessoas
                      </p>
                    </div>
                  </div>
                  
                  {!isPastDate(day.date) && (
                    <button
                      onClick={() => onAddReservation(day.date, '19:00')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                    >
                      <MdAdd size={16} />
                      Nova Reserva
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {day.timeSlots
                    .filter(slot => showEmptySlots || slot.reservations.length > 0)
                    .map((slot, slotIndex) => (
                    <div key={slotIndex} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">{slot.time}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {slot.reservations.length} res.
                          </span>
                          <span className="text-sm text-gray-600">
                            {slot.totalPeople} p.
                          </span>
                        </div>
                      </div>
                      
                      {slot.reservations.length === 0 ? (
                        <div className="text-center py-4 text-gray-400">
                          <MdRestaurant size={24} className="mx-auto mb-2" />
                          <p className="text-sm">Nenhuma reserva</p>
                          {!isPastDate(day.date) && (
                            <button
                              onClick={() => onAddReservation(day.date, slot.time)}
                              className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
                            >
                              Adicionar reserva
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {slot.reservations.map((reservation) => (
                            <motion.div
                              key={reservation.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer"
                              onClick={() => onEditReservation(reservation)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-800">
                                  {reservation.client_name}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                                  {getStatusText(reservation.status)}
                                </span>
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <MdPeople size={14} />
                                  <span>{reservation.number_of_people} pessoas</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <MdRestaurant size={14} />
                                  <span>{getSeuJustinoAreaName((reservation as any).table_number, reservation.area_name, (reservation as any).area_id)}</span>
                                </div>
                                
                                {reservation.table_number && (
                                  <div className="flex items-center gap-2">
                                    <MdRestaurant size={14} />
                                    <span>Mesa {reservation.table_number}</span>
                                  </div>
                                )}
                                
                                {reservation.client_phone && (
                                  <div className="flex items-center gap-2">
                                    <MdPhone size={14} />
                                    <span>{reservation.client_phone}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-1 mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditReservation(reservation);
                                  }}
                                  className="flex-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteReservation(reservation);
                                  }}
                                  className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                                >
                                  Excluir
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
