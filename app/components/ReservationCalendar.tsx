"use client";

import { useState, useEffect, useCallback } from "react";
import { MdChevronLeft, MdChevronRight, MdAdd, MdEvent, MdRestaurant, MdPeople } from "react-icons/md";
import ReservationsDayModal from "./ReservationsDayModal";
import ReservationDetailsModal from "./ReservationDetailsModal";
import { getReservationStatusColor } from "@/app/utils/reservationStatus";

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
   totalPeople: number;
   totalGuests: number;
}

interface DayBlockInfo {
  hasFullBlock: boolean;
  hasPartialBlock: boolean;
  reason?: string;
}

interface ReservationCalendarProps {
  establishment: Establishment;
  reservations: Reservation[];
  onDateSelect: (date: Date, reservations: Reservation[]) => void;
  onAddReservation: (date: Date) => void;
  onEditReservation?: (reservation: Reservation) => void;
  onDeleteReservation?: (reservation: Reservation) => void;
  onStatusChange?: (reservation: Reservation, newStatus: string) => void;
  onAddGuestList?: (reservation: Reservation) => void;
  birthdayReservations?: BirthdayReservation[];
  dayBlocks?: Record<string, DayBlockInfo>;
  onDayBlockClick?: (date: Date) => void;
  dayGuestTotalsByDate?: Record<string, number>;
}

export default function ReservationCalendar({ 
  establishment,
  reservations,
  onDateSelect, 
  onAddReservation,
  onEditReservation,
  onDeleteReservation,
  onStatusChange,
  onAddGuestList,
  birthdayReservations = [],
  dayBlocks,
  onDayBlockClick,
  dayGuestTotalsByDate,
}: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());// Setembro de 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedDayReservations, setSelectedDayReservations] = useState<Reservation[]>([]);
  const isReservaRooftop = (establishment?.name || '').toLowerCase().includes('reserva rooftop');

  // Total de mesas / slots de reserva por estabelecimento
  // Highline = 36 mesas, Seu Justino = 29 mesas, Reserva Rooftop = 60 reservas/dia
  const getTotalTablesForEstablishment = () => {
    const name = (establishment?.name || '').toLowerCase();
    if (name.includes('high line') || name.includes('highline')) return 36;
    if (name.includes('seu justino') && !name.includes('pracinha')) return 29;
    if (name.includes('reserva rooftop')) return 60;
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

    // Para reservas com Mesa Bistrô, usar cor diferenciada (roxo/violeta)
    const hasBistroTable = reservation.has_bistro_table === true;
    
    // Para reservas de camarote (origin CAMAROTE), usar cor diferenciada (indigo/azul escuro)
    const isCamaroteReservation = reservation.origin === 'CAMAROTE';
    
    // Para reservas grandes, usar cor diferenciada
    const isLargeReservation = reservation.number_of_people > 15 || reservation.origin === 'CLIENTE' && reservation.number_of_people >= 16;
    
    const cls = hasBistroTable
      ? 'bg-purple-200 text-purple-900 border-purple-400 font-semibold' // Cor especial para Mesa Bistrô
      : isCamaroteReservation
      ? 'bg-indigo-200 text-indigo-900 border-indigo-400 font-semibold' // Cor especial para reserva de camarote
      : isLargeReservation
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200' // Cor especial para reservas grandes
      : cap === 2
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
        {isCamaroteReservation ? (
          <span className={`px-1 py-0.5 rounded border ${cls}`}>
            🏠 Camarote {reservation.table_number || ''}{reservation.number_of_people ? ` • ${reservation.number_of_people}p` : ''}
          </span>
        ) : reservation.table_number ? (
          <span className={`px-1 py-0.5 rounded border ${cls}`}>
            {hasBistroTable ? '🍽️ ' : ''}Mesa {reservation.table_number}{cap ? ` • ${cap}p` : ''}
          </span>
        ) : isLargeReservation ? (
          <span className={`px-1 py-0.5 rounded border ${cls}`}>
            Grande • {reservation.number_of_people}p
          </span>
        ) : null}
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
        availableTables: 0,
        totalPeople: 0,
        totalGuests: 0,
      });
    }
    
    return days;
  }, []);

  // Processar reservas para o mês atual
  const loadReservationsForMonth = useCallback((date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      console.log('📅 Processando dados para:', { year, month });
      console.log('📅 Total de reservas recebidas:', reservations.length);
      console.log('🎂 Reservas de aniversário disponíveis:', birthdayReservations.length);

      // Atualizar dias do calendário com as reservas
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
        
        // IMPORTANTE: Contar apenas reservas ATIVAS para calcular mesas disponíveis
        // Reservas canceladas, finalizadas ou com status inativo NÃO devem bloquear mesas
        const activeStatuses = ['confirmed', 'seated', 'checked-in', 'CONFIRMED', 'SEATED', 'CHECKED-IN'];
        const activeReservations = dayReservations.filter(reservation => {
          const status = (reservation.status || '').toLowerCase();
          return activeStatuses.includes(status);
        });
        
        // Debug: Log para o dia 28/02/2025 no Seu Justino
        if (dayString === '2025-02-28' && establishment?.name?.toLowerCase().includes('seu justino')) {
          console.log(`🔍 [DEBUG 28/02] Total reservas: ${dayReservations.length}, Ativas: ${activeReservations.length}`);
          dayReservations.forEach(r => {
            console.log(`  - ID ${r.id}: ${r.client_name} | Status: ${r.status} | Mesa: ${r.table_number || 'N/A'}`);
          });
        }
        
        // Calcular disponibilidade:
        // - Para Reserva Rooftop: cada reserva ativa consome 1 slot (de 60 por dia)
        // - Para os demais: manter lógica baseada em mesas ocupadas
        let availableTables = totalTables;

        if (isReservaRooftop) {
          const activeCount = activeReservations.length;
          availableTables = Math.max(0, totalTables - activeCount);
        } else {
          // No Seu Justino e outros, cada reserva pode ocupar uma ou mais mesas
          // Contar reservas ativas únicas por mesa
          const occupiedTables = new Set<string>();
          activeReservations.forEach(reservation => {
            if (reservation.table_number) {
              const tables = String(reservation.table_number).split(',').map(t => t.trim()).filter(t => t);
              tables.forEach(table => occupiedTables.add(table));
            } else {
              // Se não tem mesa específica, conta como 1 mesa ocupada
              occupiedTables.add(`reservation_${reservation.id}`);
            }
          });
          
          availableTables = Math.max(0, totalTables - occupiedTables.size);
        }

        const totalPeople = dayReservations.reduce(
          (sum, reservation) =>
            sum + (Number(reservation.number_of_people ?? 0) || 0),
          0,
        );

        const totalGuests =
          (dayGuestTotalsByDate && dayGuestTotalsByDate[dayString]) || 0;
        
        return {
          ...day,
          reservations: dayReservations,
          birthdayReservations: dayBirthdayReservations,
          totalReservations: dayReservations.length + dayBirthdayReservations.length,
          availableTables,
          totalPeople,
          totalGuests,
        };
      });

      setCalendarDays(updatedDays);
    } catch (error) {
      console.error("❌ Erro ao processar reservas:", error);
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
  }, [generateCalendarDays, reservations, birthdayReservations]);

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

  const getStatusColor = (status: string, notes?: string) => {
    // Verificar se é espera antecipada primeiro
    if (notes && notes.includes('ESPERA ANTECIPADA')) {
      return 'bg-orange-100 text-orange-800';
    }
    return getReservationStatusColor(status, { isReservaRooftop });
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDayBlockInfo = (date: Date): DayBlockInfo | null => {
    if (!dayBlocks) return null;
    const key = date.toISOString().split('T')[0];
    return dayBlocks[key] || null;
  };

  return (
    <>
      <div className="relative bg-white border-0 rounded-none shadow-none w-full max-w-[100vw] overflow-x-hidden sm:rounded-xl sm:border sm:border-gray-200 sm:shadow-lg">
      {/* Header do Calendário */}
      <div className="p-3 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">{establishment.name}</p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
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
          <div
            key={day}
            className="p-2 sm:p-3 text-center text-[10px] sm:text-sm font-medium text-gray-500 bg-gray-50"
          >
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
              min-h-[92px] sm:min-h-[120px] p-1.5 sm:p-2 border-r border-b border-gray-200 cursor-pointer transition-colors
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
              {(() => {
                const block = getDayBlockInfo(day.date);
                if (!block) return null;
                const label = block.hasFullBlock ? 'BLOQUEADO' : 'CAP. REDUZIDA';
                const title =
                  block.reason || (block.hasFullBlock ? 'Dia bloqueado' : 'Capacidade reduzida');
                const classes =
                  block.hasFullBlock
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-orange-100 text-orange-700 border border-orange-300';
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDayBlockClick) onDayBlockClick(day.date);
                    }}
                    className={`ml-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${classes}`}
                    title={title}
                  >
                    {label}
                  </button>
                );
              })()}
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
                  <div className="hidden sm:flex items-center gap-1 text-xs">
                    <MdEvent className="text-blue-500" />
                    <span className="text-blue-600 font-medium">
                      {day.totalReservations} reserva{day.totalReservations !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {day.totalPeople > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <MdPeople className="text-amber-500" />
                    <span className="text-amber-600">
                      {day.totalPeople}
                    </span>
                  </div>
                )}

                {day.totalGuests > 0 && (
                  <div className="hidden sm:flex items-center gap-1 text-xs">
                    <MdPeople className="text-purple-500" />
                    <span className="text-purple-600">
                      {day.totalGuests} convidado{day.totalGuests !== 1 ? 's' : ''} nas listas
                    </span>
                  </div>
                )}
                
                {day.availableTables > 0 && (
                  <div className="hidden sm:flex items-center gap-1 text-xs">
                    <MdRestaurant className="text-green-500" />
                    <span className="text-green-600">
                      {day.availableTables}{' '}
                      {isReservaRooftop
                        ? `reserva${day.availableTables !== 1 ? 's' : ''} disponível${day.availableTables !== 1 ? 'is' : ''}`
                        : `mesa${day.availableTables !== 1 ? 's' : ''} disponível${day.availableTables !== 1 ? 'is' : ''}`}
                    </span>
                  </div>
                )}

                {/* Lista de Reservas (máximo 2 visíveis) - apenas em telas maiores */}
                <div className="hidden sm:space-y-1">
                  {day.reservations.slice(0, 2).map((reservation) => {
                    const isEsperaAntecipada =
                      reservation.notes &&
                      reservation.notes.includes("ESPERA ANTECIPADA");
                    return (
                      <div
                        key={reservation.id}
                        className={`text-xs p-1 rounded ${getStatusColor(
                          reservation.status,
                          reservation.notes,
                        )}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReservationClick(reservation);
                        }}
                      >
                        <div className="font-medium truncate">
                          {isEsperaAntecipada && <span className="mr-1">⏳</span>}
                          {reservation.client_name}
                        </div>
                        <ReservationBadge reservation={reservation} />
                        {isEsperaAntecipada && (
                          <div className="text-xs font-bold text-orange-700 mt-1">
                            ESPERA ANTECIPADA
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Indicadores de Aniversário */}
                {day.birthdayReservations.length > 0 && (
                  <div className="mt-1">
                    <div className="text-xs p-1 rounded bg-pink-200 text-pink-800 font-bold">
                      🎂 {day.birthdayReservations.length} aniversário(s)
                    </div>
                  </div>
                )}
                
                {/* Em mobile não mostramos o “+X mais”; em telas maiores pode ser útil,
                    mas por enquanto vamos remover para manter apenas os números exatos. */}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>

      {/* Modal de Reservas do Dia */}
      {selectedDate && (
        <ReservationsDayModal
          isOpen={showDayModal}
          onClose={handleCloseDayModal}
          date={selectedDate}
          reservations={selectedDayReservations}
          isReservaRooftop={isReservaRooftop}
          onReservationClick={handleReservationClick}
        />
      )}

      {/* Modal de Detalhes da Reserva */}
      <ReservationDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        reservation={selectedReservation}
        isReservaRooftop={isReservaRooftop}
        onEdit={onEditReservation ? handleEditReservation : undefined}
        onDelete={onDeleteReservation ? handleDeleteReservation : undefined}
        onStatusChange={onStatusChange ? handleStatusChange : undefined}
        onAddGuestList={onAddGuestList}
      />
    </>
  );
}
