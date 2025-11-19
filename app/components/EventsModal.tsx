"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MdClose, 
  MdCalendarToday, 
  MdLocationOn, 
  MdAccessTime, 
  MdPeople, 
  MdEvent, 
  MdTableBar, 
  MdStar, 
  MdMusicNote, 
  MdAttachMoney, 
  MdInfo, 
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight
} from "react-icons/md";

interface Promoter {
  promoter_id: number;
  promoter_nome: string;
  promoter_apelido?: string;
  promoter_email?: string;
  promoter_telefone?: string;
  promoter_whatsapp?: string;
  funcao: 'PRINCIPAL' | 'AUXILIAR';
  status: string;
}

interface Event {
  id: number;
  nome_do_evento: string;
  casa_do_evento: string;
  data_do_evento: string | null;
  hora_do_evento: string;
  local_do_evento?: string;
  categoria?: string;
  descricao?: string;
  brinde?: string;
  observacao?: string;
  valor_da_entrada?: number | string;
  mesas?: number | string;
  valor_da_mesa?: number | string;
  numero_de_convidados?: number;
  imagem_do_evento?: string;
  imagem_do_evento_url?: string;
  convidados_presentes?: number;
  total_convidados?: number;
  total_convidados_checkin?: number;
  total_convidados_cadastrados?: number;
  tipo_evento?: 'unico' | 'semanal';
  promoters?: Promoter[];
}

const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';

interface EventsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventsModal({ isOpen, onClose }: EventsModalProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      setCurrentMonth(new Date());
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
  
    try {
      const res = await fetch("https://vamos-comemorar-api.onrender.com/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
  
      const eventsWithDetails = await Promise.all(
        data.map(async (event: Event) => {
          try {
            const convidadosRes = await fetch(
              `https://vamos-comemorar-api.onrender.com/api/convidados/${event.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const convidados = await convidadosRes.json();
            
            let promoters: Promoter[] = [];
            try {
              const promotersRes = await fetch(
                `https://vamos-comemorar-api.onrender.com/api/promoter-eventos/${event.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (promotersRes.ok) {
                const promotersData = await promotersRes.json();
                promoters = promotersData.promoters || promotersData || [];
              }
            } catch (err) {
              console.error("Erro ao buscar promoters para o evento", event.id, err);
            }
            
            return {
              ...event,
              total_convidados: convidados.length,
              promoters: promoters,
            };
          } catch (err) {
            console.error("Erro ao buscar dados para o evento", event.id, err);
            return { ...event, total_convidados: 0, promoters: [] };
          }
        })
      );
  
      // Filtrar eventos do mês atual e futuros
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureEvents = eventsWithDetails.filter((event) => {
        if (!event.data_do_evento) return false; // Eventos semanais sem data
        
        try {
          const eventDate = event.data_do_evento.includes('T') || event.data_do_evento.includes(' ')
            ? event.data_do_evento
            : event.data_do_evento + 'T12:00:00';
          const eventDateObj = new Date(eventDate);
          eventDateObj.setHours(0, 0, 0, 0);
          return eventDateObj >= today;
        } catch {
          return false;
        }
      });
  
      setEvents(futureEvents);
    } catch (err) {
      console.error("Erro ao buscar eventos", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar eventos do mês atual e próximos
  const getFilteredEventsByMonth = () => {
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const nextMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    
    return events.filter((event) => {
      if (!event.data_do_evento) return false;
      
      try {
        const eventDate = event.data_do_evento.includes('T') || event.data_do_evento.includes(' ')
          ? event.data_do_evento
          : event.data_do_evento + 'T12:00:00';
        const eventDateObj = new Date(eventDate);
        eventDateObj.setHours(0, 0, 0, 0);
        
        // Incluir eventos do mês atual e próximos
        return eventDateObj >= currentMonthStart;
      } catch {
        return false;
      }
    });
  };

  // Agrupar eventos por data
  const eventsByDate = getFilteredEventsByMonth().reduce((acc, event) => {
    if (!event.data_do_evento) return acc;
    
    try {
      const eventDate = event.data_do_evento.includes('T') || event.data_do_evento.includes(' ')
        ? event.data_do_evento
        : event.data_do_evento + 'T12:00:00';
      const date = new Date(eventDate);
      const dateKey = date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
    } catch (error) {
      console.error('Erro ao processar data do evento:', event.data_do_evento, error);
    }
    return acc;
  }, {} as Record<string, Event[]>);

  const getImageUrl = (event: Event): string => {
    if (event.imagem_do_evento_url) {
      return event.imagem_do_evento_url;
    }
    if (event.imagem_do_evento) {
      return `${BASE_IMAGE_URL}${event.imagem_do_evento}`;
    }
    return 'https://placehold.co/400x300?text=Sem+Imagem';
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Data não informada';
    try {
      const dateWithTime = dateString.includes('T') || dateString.includes(' ')
        ? dateString
        : dateString + 'T12:00:00';
      const date = new Date(dateWithTime);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString || 'Data não informada';
    }
  };

  const getDayName = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const dateWithTime = dateString.includes('T') || dateString.includes(' ')
        ? dateString
        : dateString + 'T12:00:00';
      const date = new Date(dateWithTime);
      const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      return days[date.getDay()];
    } catch {
      return '';
    }
  };

  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Eventos Futuros
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Visualize eventos do mês atual e próximos
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Calendar Navigation */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeMonth('prev')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <MdChevronLeft size={24} />
              </button>
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {getMonthName(currentMonth)}
              </h3>
              <button
                onClick={() => changeMonth('next')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <MdChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
              </div>
            ) : Object.keys(eventsByDate).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">📅</div>
                <p className="text-gray-500 text-lg">Nenhum evento encontrado para este período.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(eventsByDate)
                  .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                  .map(([dateKey, dateEvents]) => (
                    <div key={dateKey} className="space-y-4">
                      {/* Date Header */}
                      <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
                        <div className="flex items-center gap-3">
                          <MdCalendarToday className="text-yellow-500" size={24} />
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">
                              {dateEvents[0]?.data_do_evento ? (
                                <>
                                  {getDayName(dateEvents[0].data_do_evento)} - {formatDate(dateEvents[0].data_do_evento)}
                                </>
                              ) : (
                                'Eventos sem data'
                              )}
                            </h2>
                            <p className="text-gray-600 text-sm">
                              {dateEvents.length} {dateEvents.length === 1 ? 'evento' : 'eventos'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Event Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dateEvents.map((event) => (
                          <div
                            key={event.id}
                            className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
                          >
                            {/* Event Image */}
                            <div className="relative w-full h-48 bg-gray-200">
                              <Image
                                src={getImageUrl(event)}
                                alt={event.nome_do_evento}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              {event.categoria && (
                                <div className="absolute top-3 right-3 bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                                  {event.categoria}
                                </div>
                              )}
                            </div>

                            {/* Event Info */}
                            <div className="p-5 space-y-4">
                              {/* Event Title */}
                              <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-1 line-clamp-2">
                                  {event.nome_do_evento}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-600 text-sm">
                                  <MdEvent className="text-yellow-600" size={16} />
                                  <span>{event.casa_do_evento}</span>
                                </div>
                              </div>

                              {/* Date and Time */}
                              <div className="flex items-center gap-2 text-gray-700 bg-gray-50 rounded-lg p-2">
                                <MdAccessTime className="text-gray-500" size={18} />
                                <div>
                                  <span className="text-xs text-gray-600">Horário:</span>
                                  <span className="font-semibold block">{event.hora_do_evento}</span>
                                </div>
                              </div>

                              {/* Location */}
                              {event.local_do_evento && (
                                <div className="flex items-start gap-2 text-gray-700">
                                  <MdLocationOn className="text-gray-500 mt-0.5" size={18} />
                                  <span className="text-sm">{event.local_do_evento}</span>
                                </div>
                              )}

                              {/* Description */}
                              {event.descricao && (
                                <div className="bg-gray-50 rounded-lg p-2">
                                  <p className="text-gray-600 text-sm line-clamp-3">
                                    {event.descricao}
                                  </p>
                                </div>
                              )}

                              {/* Observações */}
                              {event.observacao && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                                  <div className="flex items-start gap-2">
                                    <MdInfo className="text-amber-600 mt-0.5" size={18} />
                                    <div className="flex-1">
                                      <span className="text-xs font-semibold text-amber-800">Observações:</span>
                                      <p className="text-sm text-gray-700 mt-1">{event.observacao}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Operational Info */}
                              <div className="space-y-2">
                                {/* Mesas */}
                                {event.mesas && (
                                  <div className="flex items-center gap-2 text-gray-700 bg-blue-50 rounded-lg p-2">
                                    <MdTableBar className="text-blue-600" size={18} />
                                    <span className="text-sm">
                                      <span className="font-semibold">{event.mesas}</span> mesas
                                      {event.valor_da_mesa && (() => {
                                        const valorMesa = typeof event.valor_da_mesa === 'number' 
                                          ? event.valor_da_mesa 
                                          : parseFloat(String(event.valor_da_mesa));
                                        if (!isNaN(valorMesa)) {
                                          return <span className="text-gray-600"> • R$ {valorMesa.toFixed(2)}/mesa</span>;
                                        }
                                        return null;
                                      })()}
                                    </span>
                                  </div>
                                )}

                                {/* Promoters/DJs */}
                                {event.promoters && event.promoters.length > 0 && (
                                  <div className="bg-purple-50 rounded-lg p-2">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MdMusicNote className="text-purple-600" size={18} />
                                      <span className="text-sm font-semibold text-gray-800">
                                        Promoters/DJs ({event.promoters.length})
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {event.promoters.slice(0, 3).map((promoter, idx) => (
                                        <span
                                          key={idx}
                                          className={`text-xs px-2 py-1 rounded-full ${
                                            promoter.funcao === 'PRINCIPAL'
                                              ? 'bg-purple-600 text-white font-semibold'
                                              : 'bg-purple-200 text-purple-800'
                                          }`}
                                        >
                                          {promoter.promoter_apelido || promoter.promoter_nome}
                                          {promoter.funcao === 'PRINCIPAL' && ' ⭐'}
                                        </span>
                                      ))}
                                      {event.promoters.length > 3 && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                          +{event.promoters.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Brinde */}
                                {event.brinde && (
                                  <div className="flex items-start gap-2 text-gray-700 bg-green-50 rounded-lg p-2">
                                    <MdStar className="text-green-600 mt-0.5" size={18} />
                                    <div className="flex-1">
                                      <span className="text-xs font-semibold text-green-800">Brinde:</span>
                                      <p className="text-sm text-gray-700">{event.brinde}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Guests Info */}
                                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 rounded-lg p-2">
                                  <MdPeople className="text-gray-500" size={18} />
                                  <span className="text-sm font-semibold">
                                    {event.total_convidados_checkin || event.convidados_presentes || 0} / {event.total_convidados_cadastrados || event.total_convidados || 0} convidados
                                  </span>
                                </div>

                                {/* Price */}
                                {event.valor_da_entrada && (() => {
                                  const valor = typeof event.valor_da_entrada === 'number' 
                                    ? event.valor_da_entrada 
                                    : parseFloat(String(event.valor_da_entrada));
                                  if (isNaN(valor)) return null;
                                  return (
                                    <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded-lg p-2 border border-yellow-500/20">
                                      <div className="flex items-center gap-2">
                                        <MdAttachMoney className="text-yellow-600" size={18} />
                                        <div>
                                          <span className="text-xs text-gray-600">Entrada:</span>
                                          <span className="text-yellow-700 font-bold text-lg block">
                                            R$ {valor.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap gap-2 pt-2">
                                <Link href={`/admin/eventos/${event.id}`} className="flex-1">
                                  <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2">
                                    <MdCheckCircle size={16} />
                                    Gerenciar
                                  </button>
                                </Link>
                                <Link href={`/admin/eventos/${event.id}/check-ins`} className="flex-1">
                                  <button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2">
                                    <MdPeople size={16} />
                                    Check-ins
                                  </button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


