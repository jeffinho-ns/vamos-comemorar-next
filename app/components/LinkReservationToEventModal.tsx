"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MdClose, 
  MdEvent,
  MdCalendarToday,
  MdAccessTime,
  MdLocationOn,
  MdCheckCircle,
  MdSearch
} from "react-icons/md";

interface Event {
  evento_id: number;
  nome: string;
  data_evento: string;
  horario_funcionamento?: string;
  establishment_name: string;
  establishment_id?: number;
  tipo_evento: 'unico' | 'semanal';
}

interface LinkReservationToEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: number;
  establishmentId: number;
  reservationDate?: string; // Data da reserva no formato YYYY-MM-DD
  onSuccess?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

export default function LinkReservationToEventModal({
  isOpen,
  onClose,
  reservationId,
  establishmentId,
  reservationDate,
  onSuccess
}: LinkReservationToEventModalProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && establishmentId) {
      loadEvents();
    }
  }, [isOpen, establishmentId, reservationDate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Normalizar data da reserva para comparação
      const normalizedReservationDate = reservationDate ? reservationDate.split('T')[0].split(' ')[0] : null;
      
      // Buscar eventos usando o endpoint /api/events
      // Filtrar apenas eventos únicos
      const url = `${API_URL}/api/events?tipo=unico`;
      
      console.log('📡 Buscando eventos únicos via /api/events:', establishmentId);
      console.log('📡 Data da reserva:', normalizedReservationDate);
      console.log('📡 URL da API:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Resposta da API /api/events:', data);
        console.log('📋 Total de eventos recebidos:', Array.isArray(data) ? data.length : 0);
        
        if (!Array.isArray(data) || data.length === 0) {
          console.warn('⚠️ Nenhum evento retornado da API');
          setEvents([]);
          return;
        }
        
        // Log detalhado de todos os eventos recebidos
        console.log('📊 Todos os eventos recebidos da API:', data.map((e: any) => ({
          id: e.id,
          nome: e.nome_do_evento,
          data_do_evento: e.data_do_evento,
          tipoEvento: e.tipoEvento,
          tipo_evento: e.tipo_evento,
          tipoevento: e.tipoevento, // Formato alternativo que pode vir da API
          id_place: e.id_place,
          id_place_type: typeof e.id_place,
          establishment_id_buscado: establishmentId,
          establishment_id_buscado_type: typeof establishmentId,
          todas_as_propriedades: Object.keys(e)
        })));
        
        // Filtrar eventos por estabelecimento e data
        const eventosFiltrados = data.filter((event: any) => {
          // Normalizar IDs para comparação (pode vir como string ou number)
          const eventPlaceId = event.id_place !== null && event.id_place !== undefined 
            ? Number(event.id_place) 
            : null;
          const reservationPlaceId = Number(establishmentId);
          
          // Verificar se é do estabelecimento correto
          // Se o evento tem id_place, deve ser igual ao establishmentId da reserva
          // Se o evento não tem id_place (null), vamos incluir para o usuário decidir
          if (eventPlaceId !== null && eventPlaceId !== reservationPlaceId) {
            console.log(`❌ Evento ${event.id} filtrado: id_place (${eventPlaceId}) !== establishmentId (${reservationPlaceId})`);
            return false;
          }
          
          // Verificar se é evento único
          // A API pode retornar em diferentes formatos: tipoEvento, tipo_evento, ou tipoevento
          const tipoEvento = event.tipoEvento || event.tipo_evento || event.tipoevento;
          const tipoEventoLower = tipoEvento ? String(tipoEvento).toLowerCase() : null;
          if (!tipoEventoLower || tipoEventoLower !== 'unico') {
            console.log(`❌ Evento ${event.id} filtrado: tipoEvento (${event.tipoEvento}) / tipo_evento (${event.tipo_evento}) / tipoevento (${event.tipoevento}) !== 'unico'`);
            return false;
          }
          
          // Verificar se tem data
          if (!event.data_do_evento) {
            console.log(`❌ Evento ${event.id} filtrado: sem data_do_evento`);
            return false;
          }
          
          // Normalizar data do evento
          const eventDate = event.data_do_evento ? event.data_do_evento.split('T')[0].split(' ')[0] : null;
          if (!eventDate) {
            console.log(`❌ Evento ${event.id} filtrado: data normalizada vazia`);
            return false;
          }
          
          // Se temos data da reserva, mostrar eventos da mesma data OU futuros
          if (normalizedReservationDate) {
            const isSameDate = eventDate === normalizedReservationDate;
            const isFutureDate = eventDate > normalizedReservationDate;
            const shouldInclude = isSameDate || isFutureDate;
            
            if (!shouldInclude) {
              console.log(`❌ Evento ${event.id} filtrado: data do evento (${eventDate}) < data da reserva (${normalizedReservationDate})`);
            } else {
              console.log(`✅ Evento ${event.id} incluído: data do evento (${eventDate}) ${isSameDate ? '===' : '>'} data da reserva (${normalizedReservationDate})`);
            }
            
            return shouldInclude;
          }
          
          // Caso contrário, mostrar apenas eventos futuros (incluindo hoje)
          const today = new Date().toISOString().split('T')[0];
          const isFutureOrToday = eventDate >= today;
          
          if (!isFutureOrToday) {
            console.log(`❌ Evento ${event.id} filtrado: data do evento (${eventDate}) < hoje (${today})`);
          }
          
          return isFutureOrToday;
        });
        
        console.log('📋 Eventos filtrados por estabelecimento e data:', eventosFiltrados.length);
        console.log('📋 Detalhes dos eventos filtrados:', eventosFiltrados.map((e: any) => ({
          id: e.id,
          nome: e.nome_do_evento,
          data: e.data_do_evento,
          tipo: e.tipoEvento || e.tipo_evento,
          establishment_id: e.id_place
        })));
        
        // Ordenar eventos: primeiro da data da reserva (se houver), depois por data crescente (mais próximos primeiro)
        eventosFiltrados.sort((a: any, b: any) => {
          // Normalizar datas dos eventos
          const aDate = a.data_do_evento ? a.data_do_evento.split('T')[0].split(' ')[0] : '';
          const bDate = b.data_do_evento ? b.data_do_evento.split('T')[0].split(' ')[0] : '';
          
          // Se temos data da reserva, priorizar eventos daquela data
          if (normalizedReservationDate) {
            if (aDate === normalizedReservationDate && bDate !== normalizedReservationDate) return -1;
            if (aDate !== normalizedReservationDate && bDate === normalizedReservationDate) return 1;
          }
          
          // Ordenar por data (mais próximos primeiro)
          if (aDate && bDate) {
            return aDate.localeCompare(bDate);
          }
          
          return 0;
        });
        
        // Buscar nome do estabelecimento uma única vez
        let establishmentName = `Estabelecimento ${establishmentId}`;
        try {
          const placesRes = await fetch(`${API_URL}/api/places`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (placesRes.ok) {
            const places = await placesRes.json();
            const placesList = Array.isArray(places) ? places : (places.data || []);
            const place = placesList.find((p: any) => p.id === Number(establishmentId));
            if (place && place.name) {
              establishmentName = place.name;
            }
          }
        } catch (err) {
          console.warn('Não foi possível buscar nome do estabelecimento:', err);
        }
        
        // Mapear eventos para o formato esperado
        const eventosMapeados: Event[] = eventosFiltrados.map((e: any) => ({
          evento_id: e.id,
          nome: e.nome_do_evento,
          data_evento: e.data_do_evento,
          horario_funcionamento: e.hora_do_evento,
          establishment_name: establishmentName,
          establishment_id: e.id_place ? Number(e.id_place) : undefined,
          tipo_evento: 'unico' as const
        }));
        
        console.log('✅ Eventos únicos filtrados e ordenados:', eventosMapeados.length);
        console.log('📅 Eventos encontrados:', eventosMapeados.map((e: Event) => ({
          id: e.evento_id,
          nome: e.nome,
          data: e.data_evento,
          data_normalizada: e.data_evento ? e.data_evento.split('T')[0].split(' ')[0] : null,
          tipo: e.tipo_evento,
          estabelecimento: e.establishment_name,
          establishment_id: e.establishment_id
        })));
        console.log('📊 Resumo da busca:', {
          establishment_id_buscado: establishmentId,
          data_reserva_original: reservationDate,
          data_reserva_normalizada: normalizedReservationDate,
          total_eventos_api: data.length,
          eventos_unicos_filtrados: eventosMapeados.length,
          eventos_na_data_reserva: normalizedReservationDate 
            ? eventosMapeados.filter((e: Event) => {
                const eventDate = e.data_evento ? e.data_evento.split('T')[0].split(' ')[0] : null;
                return eventDate === normalizedReservationDate;
              }).length
            : 0
        });
        
        setEvents(eventosMapeados);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao carregar eventos:', response.status, errorText);
        alert(`Erro ao carregar eventos (${response.status}). Verifique o console para mais detalhes.`);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar eventos:', error);
      alert('Erro ao carregar eventos. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkToEvent = async () => {
    if (!selectedEventId) return;

    setLinking(true);
    try {
      const token = localStorage.getItem('authToken');
      
      console.log('🔗 Vinculando reserva ao evento:', {
        reservationId,
        eventoId: selectedEventId,
        establishmentId,
        url: `${API_URL}/api/restaurant-reservations/${reservationId}/link-to-event`
      });
      
      // Verificar se o evento selecionado pertence ao mesmo estabelecimento
      const selectedEvent = events.find(e => e.evento_id === selectedEventId);
      if (selectedEvent) {
        const eventoEstId = Number(selectedEvent.establishment_id);
        const reservaEstId = Number(establishmentId);
        
        console.log('📋 Evento selecionado:', {
          evento_id: selectedEvent.evento_id,
          nome: selectedEvent.nome,
          establishment_id: selectedEvent.establishment_id,
          establishment_id_number: eventoEstId,
          reserva_establishment_id: establishmentId,
          reserva_establishment_id_number: reservaEstId,
          tipos: {
            evento: typeof selectedEvent.establishment_id,
            reserva: typeof establishmentId
          },
          mesmo_estabelecimento: eventoEstId === reservaEstId,
          mesmo_estabelecimento_strict: selectedEvent.establishment_id === establishmentId
        });
        
        if (eventoEstId !== reservaEstId) {
          console.warn('⚠️ ATENÇÃO: O evento selecionado pode não pertencer ao mesmo estabelecimento da reserva!');
          console.warn('Evento establishment_id:', eventoEstId, 'Reserva establishment_id:', reservaEstId);
        }
      }
      
      const response = await fetch(
        `${API_URL}/api/restaurant-reservations/${reservationId}/link-to-event`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ evento_id: selectedEventId })
        }
      );

      const responseData = await response.json().catch(() => ({}));
      
      console.log('📡 Resposta da API:', {
        status: response.status,
        data: responseData,
        error: responseData.error,
        success: responseData.success
      });
      
      // Log detalhado do erro
      if (!response.ok) {
        console.error('❌ Detalhes do erro:', JSON.stringify(responseData, null, 2));
      }

      if (response.ok) {
        const message = responseData.message || 'Reserva vinculada ao evento com sucesso! A lista de convidados foi copiada automaticamente.';
        alert(`✅ ${message}`);
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        // Tratamento específico para diferentes tipos de erro
        let errorMessage = 'Erro desconhecido ao vincular reserva';
        
        if (response.status === 400) {
          // Mensagem mais específica baseada no erro retornado
          const errorText = responseData.error || '';
          
          if (errorText.includes('lista de convidados')) {
            errorMessage = '⚠️ Esta reserva não possui uma lista de convidados.\n\nPor favor, adicione uma lista de convidados primeiro através do botão "Lista de Convidados" nos detalhes da reserva, e depois tente vincular ao evento novamente.';
          } else if (errorText.includes('estabelecimento')) {
            errorMessage = `⚠️ ${errorText}\n\nO evento selecionado não pertence ao mesmo estabelecimento da reserva. Por favor, selecione um evento do mesmo estabelecimento.`;
          } else if (errorText.includes('evento_id')) {
            errorMessage = `⚠️ ${errorText}\n\nO ID do evento não foi enviado corretamente.`;
          } else {
            errorMessage = errorText || 'Erro na requisição. Verifique se a reserva possui uma lista de convidados e se o evento pertence ao mesmo estabelecimento.';
          }
        } else if (response.status === 404) {
          errorMessage = responseData.error || 'Reserva ou evento não encontrado.';
        } else {
          errorMessage = responseData.error || `Erro ao vincular reserva (${response.status})`;
        }
        
        console.error('❌ Erro ao vincular reserva:', {
          status: response.status,
          error: responseData
        });
        
        alert(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Erro ao vincular reserva:', error);
      alert('❌ Erro ao vincular reserva ao evento. Verifique sua conexão e tente novamente.');
    } finally {
      setLinking(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Evento semanal';
    try {
      // Adiciona T12:00:00 para evitar problemas de timezone
      const dateWithTime = dateString.includes('T') || dateString.includes(' ')
        ? dateString
        : dateString + 'T12:00:00';
      const date = new Date(dateWithTime);
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', dateString, error);
      return dateString;
    }
  };

  const filteredEvents = events.filter(event => 
    event.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.establishment_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <MdEvent className="text-blue-600" />
                  Vincular Reserva a um Evento
                </h2>
                <p className="text-gray-600 mt-1">
                  Selecione um evento único {reservationDate ? (() => {
                    try {
                      const normalizedDate = reservationDate.split('T')[0].split(' ')[0];
                      const dateObj = new Date(normalizedDate + 'T12:00:00');
                      return `para ${dateObj.toLocaleDateString('pt-BR')} ou próximos`;
                    } catch {
                      return 'futuro';
                    }
                  })() : 'futuro'} para vincular esta reserva e copiar automaticamente a lista de convidados
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Buscar evento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Events List */}
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <MdEvent className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600 mb-2">
                        {searchTerm ? 'Nenhum evento encontrado com esse termo' : 'Nenhum evento único disponível para este estabelecimento'}
                      </p>
                      {!loading && !searchTerm && (
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>
                            Verifique se existem eventos únicos cadastrados para este estabelecimento (ID: {establishmentId})
                          </p>
                          {reservationDate && (
                            <p>
                              Data da reserva: <strong>{(() => {
                                try {
                                  const normalizedDate = reservationDate.split('T')[0].split(' ')[0];
                                  const dateObj = new Date(normalizedDate + 'T12:00:00');
                                  return dateObj.toLocaleDateString('pt-BR');
                                } catch {
                                  return reservationDate;
                                }
                              })()}</strong>
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            <strong>Nota:</strong> Apenas eventos únicos são exibidos. Eventos semanais não aparecem nesta lista.
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Dica: Verifique o console do navegador (F12) para ver os logs de debug
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredEvents.map((event) => {
                        // Normalizar datas para comparação (ignorar timezone)
                        const normalizedReservationDate = reservationDate ? reservationDate.split('T')[0].split(' ')[0] : null;
                        const normalizedEventDate = event.data_evento ? event.data_evento.split('T')[0].split(' ')[0] : null;
                        const isReservationDate = normalizedReservationDate && normalizedEventDate && normalizedEventDate === normalizedReservationDate;
                        return (
                        <div
                          key={event.evento_id}
                          onClick={() => setSelectedEventId(event.evento_id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedEventId === event.evento_id
                              ? 'border-blue-500 bg-blue-50'
                              : isReservationDate
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-800 text-lg">{event.nome}</h3>
                                {isReservationDate && (
                                  <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                                    Data da Reserva
                                  </span>
                                )}
                                {selectedEventId === event.evento_id && (
                                  <MdCheckCircle className="text-blue-600" size={20} />
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <MdCalendarToday size={16} />
                                  <span>{formatDate(event.data_evento)}</span>
                                </div>
                                
                                {event.horario_funcionamento && (
                                  <div className="flex items-center gap-2">
                                    <MdAccessTime size={16} />
                                    <span>{event.horario_funcionamento}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2">
                                  <MdLocationOn size={16} />
                                  <span>{event.establishment_name}</span>
                                </div>
                                
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                disabled={linking}
              >
                Cancelar
              </button>
              <button
                onClick={handleLinkToEvent}
                disabled={!selectedEventId || linking}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {linking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Vinculando...
                  </>
                ) : (
                  <>
                    <MdCheckCircle />
                    Vincular ao Evento
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

