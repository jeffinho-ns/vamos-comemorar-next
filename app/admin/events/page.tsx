"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MdAdd, MdCalendarViewMonth, MdList, MdCalendarToday, MdLocationOn, MdAccessTime, MdPeople, MdEvent, MdTableBar, MdStar, MdPerson, MdMusicNote, MdAttachMoney, MdInfo, MdCheckCircle } from "react-icons/md";

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

type ViewMode = 'list' | 'calendar';

const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';

export default function Eventos() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<string>("");

  const fetchEvents = async () => {
    const token = localStorage.getItem("authToken");
  
    try {
      const res = await fetch("https://vamos-comemorar-api.onrender.com/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
  
      // Para cada evento, buscar os convidados, promoters e outras informações
      const eventsWithDetails = await Promise.all(
        data.map(async (event: Event) => {
          try {
            // Buscar convidados
            const convidadosRes = await fetch(
              `https://vamos-comemorar-api.onrender.com/api/convidados/${event.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const convidados = await convidadosRes.json();
            
            // Buscar promoters/DJs do evento
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
  
      setEvents(eventsWithDetails);
    } catch (err) {
      console.error("Erro ao buscar eventos", err);
    }
  };
  

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.nome_do_evento.toLowerCase().includes(search.toLowerCase());
    const matchesDate = !selectedDate || (() => {
      if (!event.data_do_evento) return false; // Eventos sem data não aparecem quando há filtro de data
      try {
        const eventDate = event.data_do_evento.includes('T') || event.data_do_evento.includes(' ')
          ? event.data_do_evento
          : event.data_do_evento + 'T12:00:00';
        const eventDateObj = new Date(eventDate);
        const selectedDateObj = new Date(selectedDate + 'T12:00:00');
        return eventDateObj.toDateString() === selectedDateObj.toDateString();
      } catch {
        return false;
      }
    })();
    return matchesSearch && matchesDate;
  });

  // Agrupar eventos por data para o calendário
  const eventsByDate = filteredEvents.reduce((acc, event) => {
    // Pular eventos sem data (eventos semanais)
    if (!event.data_do_evento) {
      return acc;
    }
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Eventos</h1>
          <p className="text-gray-400 text-lg">Visualize e gerencie todos os eventos do sistema</p>
        </div>

        {/* Top bar */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 text-sm font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 w-full md:w-auto flex items-center justify-center gap-2">
              <MdAdd size={20} /> Novo evento
            </button>
            <div className="flex items-center border border-gray-200/30 rounded-xl overflow-hidden w-full md:w-[400px] bg-white/95 backdrop-blur-sm shadow-lg">
              <input
                type="text"
                className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
                placeholder="Pesquisar por eventos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 px-4 text-gray-900 text-sm font-semibold">🔍</button>
            </div>
          </div>

          {/* View mode toggle and date filter */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MdList size={20} /> Lista
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  viewMode === 'calendar'
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MdCalendarViewMonth size={20} /> Calendário
              </button>
            </div>

            {viewMode === 'calendar' && (
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg">
                <MdCalendarToday className="text-gray-600" size={20} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 text-sm outline-none bg-transparent border border-gray-200 rounded-lg"
                  placeholder="Filtrar por data"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate("")}
                    className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Event views */}
        {viewMode === 'list' ? (
          /* List View */
          <div className="space-y-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-200/20 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-4">
                  <div className="text-base text-gray-700 mb-3 md:mb-0">
                    <span className="font-bold text-lg text-gray-800">
                      {(() => {
                        if (!event.data_do_evento) {
                          return 'Evento semanal';
                        }
                        try {
                          const dateWithTime = event.data_do_evento.includes('T') || event.data_do_evento.includes(' ')
                            ? event.data_do_evento
                            : event.data_do_evento + 'T12:00:00';
                          const date = new Date(dateWithTime);
                          return date.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          });
                        } catch (error) {
                          console.error('Erro ao formatar data:', event.data_do_evento, error);
                          return 'Data inválida';
                        }
                      })()}
                      {event.data_do_evento && " às "}
                      {event.hora_do_evento}
                    </span>{" "}
                    -{" "}
                    <span className="text-yellow-600 hover:text-yellow-700 cursor-pointer font-bold text-lg">
                      {event.nome_do_evento}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1 md:mt-0 flex items-center gap-2">
                    📍 {event.casa_do_evento}
                  </div>
                </div>

                {/* Operational Details */}
                <div className="mb-4 space-y-2">
                  {/* Mesas */}
                  {event.mesas && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 p-2 rounded-lg">
                      <MdTableBar className="text-blue-600" size={16} />
                      <span><strong>{event.mesas}</strong> mesas</span>
                      {event.valor_da_mesa && (() => {
                        const valorMesa = typeof event.valor_da_mesa === 'number' 
                          ? event.valor_da_mesa 
                          : parseFloat(String(event.valor_da_mesa));
                        if (!isNaN(valorMesa)) {
                          return <span className="text-gray-600">• R$ {valorMesa.toFixed(2)}/mesa</span>;
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {/* Promoters/DJs */}
                  {event.promoters && event.promoters.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-purple-50 p-2 rounded-lg">
                      <MdMusicNote className="text-purple-600" size={16} />
                      <span><strong>Promoters/DJs:</strong> </span>
                      <div className="flex flex-wrap gap-1">
                        {event.promoters.slice(0, 4).map((promoter, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              promoter.funcao === 'PRINCIPAL'
                                ? 'bg-purple-600 text-white font-semibold'
                                : 'bg-purple-200 text-purple-800'
                            }`}
                          >
                            {promoter.promoter_apelido || promoter.promoter_nome}
                            {promoter.funcao === 'PRINCIPAL' && ' ⭐'}
                          </span>
                        ))}
                        {event.promoters.length > 4 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            +{event.promoters.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Brinde */}
                  {event.brinde && (
                    <div className="flex items-start gap-2 text-sm text-gray-700 bg-green-50 p-2 rounded-lg">
                      <MdStar className="text-green-600 mt-0.5" size={16} />
                      <div>
                        <span className="font-semibold text-green-800">Brinde: </span>
                        <span>{event.brinde}</span>
                      </div>
                    </div>
                  )}

                  {/* Convidados */}
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                    <MdPeople className="text-gray-500" size={16} />
                    <span>
                      <span className="font-semibold">Convidados:</span> {event.total_convidados_checkin || event.convidados_presentes || 0}/{event.total_convidados_cadastrados || event.total_convidados || 0}
                    </span>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {event.tipo_evento && (
                    <span className={`text-white text-sm font-semibold px-3 py-2 rounded-xl ${
                      event.tipo_evento === 'semanal' 
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                        : 'bg-gradient-to-r from-green-500 to-green-600'
                    }`}>
                      {event.tipo_evento === 'semanal' ? 'Evento Semanal' : 'Evento Único'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href={`/admin/eventos/${event.id}`}>
                    <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2">
                      <MdCheckCircle size={16} />
                      Gerenciar Evento
                    </button>
                  </Link>
                  <Link href={`/admin/eventos/${event.id}/check-ins`}>
                    <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2">
                      <MdPeople size={16} />
                      Check-ins
                    </button>
                  </Link>
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">📅</div>
                <p className="text-gray-500 text-lg">Nenhum evento encontrado.</p>
              </div>
            )}
          </div>
        ) : (
          /* Calendar View */
          <div className="space-y-8">
            {Object.keys(eventsByDate).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">📅</div>
                <p className="text-gray-500 text-lg">Nenhum evento encontrado para a data selecionada.</p>
              </div>
            ) : (
              Object.entries(eventsByDate)
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([dateKey, dateEvents]) => (
                  <div key={dateKey} className="space-y-4">
                    {/* Date Header */}
                    <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
                      <div className="flex items-center gap-3">
                        <MdCalendarToday className="text-yellow-500" size={24} />
                        <div>
                          <h2 className="text-xl font-bold text-white">
                            {dateEvents[0]?.data_do_evento ? (
                              <>
                                {getDayName(dateEvents[0].data_do_evento)} - {formatDate(dateEvents[0].data_do_evento)}
                              </>
                            ) : (
                              'Eventos sem data'
                            )}
                          </h2>
                          <p className="text-gray-300 text-sm">
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
                          className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden border border-gray-200/20 hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
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
                                        title={promoter.promoter_whatsapp || promoter.promoter_telefone || promoter.promoter_email}
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
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
