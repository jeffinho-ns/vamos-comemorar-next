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
  onSuccess?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

export default function LinkReservationToEventModal({
  isOpen,
  onClose,
  reservationId,
  establishmentId,
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
  }, [isOpen, establishmentId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_URL}/api/v1/eventos?establishment_id=${establishmentId}&data_inicio=${new Date().toISOString().split('T')[0]}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas eventos futuros ou semanais
        const futureEvents = (data.eventos || []).filter((event: Event) => {
          if (event.tipo_evento === 'semanal') return true;
          if (!event.data_evento) return false;
          const eventDate = new Date(event.data_evento);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return eventDate >= today;
        });
        setEvents(futureEvents);
      } else {
        console.error('Erro ao carregar eventos');
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
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
                  Selecione um evento futuro para vincular esta reserva e copiar automaticamente a lista de convidados
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
                      <p className="text-gray-600">
                        {searchTerm ? 'Nenhum evento encontrado com esse termo' : 'Nenhum evento futuro disponível para este estabelecimento'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredEvents.map((event) => (
                        <div
                          key={event.evento_id}
                          onClick={() => setSelectedEventId(event.evento_id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedEventId === event.evento_id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-800 text-lg">{event.nome}</h3>
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
                      ))}
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

