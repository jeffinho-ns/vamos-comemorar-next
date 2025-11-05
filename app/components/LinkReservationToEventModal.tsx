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
      const today = new Date().toISOString().split('T')[0];
      
      // Se temos data da reserva, buscar eventos daquela data e próximos
      // Caso contrário, buscar todos os eventos futuros
      let url = `${API_URL}/api/v1/eventos?establishment_id=${establishmentId}`;
      
      if (reservationDate) {
        // Buscar eventos da data da reserva e próximos (até 30 dias)
        const reservationDateObj = new Date(reservationDate);
        const endDate = new Date(reservationDateObj);
        endDate.setDate(endDate.getDate() + 30);
        const endDateStr = endDate.toISOString().split('T')[0];
        
        url += `&data_inicio=${reservationDate}&data_fim=${endDateStr}`;
        console.log('🔍 Buscando eventos para a data da reserva:', reservationDate, 'até', endDateStr);
      } else {
        // Buscar eventos futuros (a partir de hoje)
        url += `&data_inicio=${today}`;
      }
      
      url += `&limit=100`;
      
      console.log('📡 URL da API:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Resposta da API:', data);
        console.log('📋 Total de eventos recebidos:', data.eventos?.length || 0);
        
        if (!data.eventos || data.eventos.length === 0) {
          console.warn('⚠️ Nenhum evento retornado da API');
          setEvents([]);
          return;
        }
        
        // Filtrar e ordenar eventos
        const filteredEvents = (data.eventos || []).filter((event: Event) => {
          // Eventos semanais sempre aparecem
          if (event.tipo_evento === 'semanal') {
            return true;
          }
          
          // Se não tem data, não mostrar
          if (!event.data_evento) {
            return false;
          }
          
          // Verificar se a data é da reserva ou futura
          try {
            const eventDate = new Date(event.data_evento + 'T00:00:00');
            const compareDate = reservationDate 
              ? new Date(reservationDate + 'T00:00:00')
              : new Date();
            compareDate.setHours(0, 0, 0, 0);
            eventDate.setHours(0, 0, 0, 0);
            
            // Se temos data da reserva, mostrar eventos da data ou futuros
            // Caso contrário, mostrar apenas eventos futuros
            return eventDate >= compareDate;
          } catch (error) {
            console.error('Erro ao processar data do evento:', error);
            return false;
          }
        });
        
        // Ordenar eventos: primeiro da data da reserva, depois por data crescente
        filteredEvents.sort((a: Event, b: Event) => {
          // Se temos data da reserva, priorizar eventos daquela data
          if (reservationDate) {
            if (a.data_evento === reservationDate && b.data_evento !== reservationDate) return -1;
            if (a.data_evento !== reservationDate && b.data_evento === reservationDate) return 1;
          }
          
          // Ordenar por data (mais próximos primeiro)
          if (a.tipo_evento === 'semanal' && b.tipo_evento !== 'semanal') return -1;
          if (a.tipo_evento !== 'semanal' && b.tipo_evento === 'semanal') return 1;
          
          if (a.data_evento && b.data_evento) {
            return new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime();
          }
          
          return 0;
        });
        
        console.log('✅ Eventos filtrados e ordenados:', filteredEvents.length);
        console.log('📅 Eventos:', filteredEvents.map((e: Event) => ({
          id: e.evento_id,
          nome: e.nome,
          data: e.data_evento,
          tipo: e.tipo_evento
        })));
        
        setEvents(filteredEvents);
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

      if (response.ok) {
        const data = await response.json();
        alert('✅ Reserva vinculada ao evento com sucesso! A lista de convidados foi copiada automaticamente.');
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        const error = await response.json();
        alert(`❌ Erro ao vincular reserva: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao vincular reserva:', error);
      alert('❌ Erro ao vincular reserva ao evento');
    } finally {
      setLinking(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Evento semanal';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
                  Selecione um evento {reservationDate ? `para ${new Date(reservationDate).toLocaleDateString('pt-BR')} ou próximos` : 'futuro'} para vincular esta reserva e copiar automaticamente a lista de convidados
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
                        {searchTerm ? 'Nenhum evento encontrado com esse termo' : 'Nenhum evento futuro disponível para este estabelecimento'}
                      </p>
                      {!loading && !searchTerm && (
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>
                            Verifique se existem eventos cadastrados para este estabelecimento (ID: {establishmentId})
                          </p>
                          {reservationDate && (
                            <p>
                              Data da reserva: <strong>{new Date(reservationDate).toLocaleDateString('pt-BR')}</strong>
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Dica: Verifique o console do navegador (F12) para ver os logs de debug
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredEvents.map((event) => {
                        const isReservationDate = reservationDate && event.data_evento === reservationDate;
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
                                
                                {event.tipo_evento === 'semanal' && (
                                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                    Evento Semanal
                                  </span>
                                )}
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

