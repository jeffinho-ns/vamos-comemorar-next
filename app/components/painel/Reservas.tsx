"use client";

import { useState, useEffect } from "react";
import { MdEvent, MdPeople, MdPhone, MdEmail, MdCalendarToday, MdAccessTime, MdCheckCircle, MdPending, MdCancel } from "react-icons/md";

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface ReservasProps {
  establishment: Establishment;
}

interface Reservation {
  id: number;
  eventName: string;
  clientName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  totalValue: number;
}

export default function Reservas({ establishment }: ReservasProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        // Dados simulados baseados no estabelecimento
        const mockReservations: Record<number, Reservation[]> = {
          1: [ // High Line
            {
              id: 1,
              eventName: "Festa de Aniversário",
              clientName: "João Silva",
              phone: "(11) 99999-9999",
              email: "joao@email.com",
              date: "2024-02-15",
              time: "20:00",
              guests: 25,
              status: 'confirmed',
              totalValue: 1250
            },
            {
              id: 2,
              eventName: "Happy Hour Corporativo",
              clientName: "Maria Santos",
              phone: "(11) 88888-8888",
              email: "maria@empresa.com",
              date: "2024-02-20",
              time: "19:00",
              guests: 15,
              status: 'pending',
              totalValue: 750
            },
            {
              id: 3,
              eventName: "Encontro de Amigos",
              clientName: "Pedro Costa",
              phone: "(11) 77777-7777",
              email: "pedro@email.com",
              date: "2024-02-18",
              time: "21:00",
              guests: 8,
              status: 'confirmed',
              totalValue: 400
            }
          ],
          2: [ // Seu Justino
            {
              id: 4,
              eventName: "Comemoração de Formatura",
              clientName: "Ana Oliveira",
              phone: "(11) 66666-6666",
              email: "ana@email.com",
              date: "2024-02-22",
              time: "20:30",
              guests: 30,
              status: 'confirmed',
              totalValue: 1500
            },
            {
              id: 5,
              eventName: "Reunião Familiar",
              clientName: "Carlos Lima",
              phone: "(11) 55555-5555",
              email: "carlos@email.com",
              date: "2024-02-25",
              time: "19:30",
              guests: 12,
              status: 'pending',
              totalValue: 600
            }
          ],
          3: [ // Oh Freguês
            {
              id: 6,
              eventName: "Festa de Casamento",
              clientName: "Fernanda e Roberto",
              phone: "(11) 44444-4444",
              email: "fernanda@email.com",
              date: "2024-03-01",
              time: "18:00",
              guests: 50,
              status: 'confirmed',
              totalValue: 2500
            },
            {
              id: 7,
              eventName: "Evento Corporativo",
              clientName: "Empresa XYZ",
              phone: "(11) 33333-3333",
              email: "contato@xyz.com",
              date: "2024-02-28",
              time: "20:00",
              guests: 20,
              status: 'confirmed',
              totalValue: 1000
            },
            {
              id: 8,
              eventName: "Aniversário Infantil",
              clientName: "Lucia Mendes",
              phone: "(11) 22222-2222",
              email: "lucia@email.com",
              date: "2024-02-26",
              time: "16:00",
              guests: 35,
              status: 'pending',
              totalValue: 1750
            }
          ],
          4: [ // Pracinha
            {
              id: 9,
              eventName: "Encontro de Negócios",
              clientName: "Ricardo Alves",
              phone: "(11) 11111-1111",
              email: "ricardo@email.com",
              date: "2024-02-24",
              time: "19:00",
              guests: 10,
              status: 'confirmed',
              totalValue: 500
            }
          ]
        };

        setReservations(mockReservations[establishment.id] || []);
      } catch (error) {
        console.error("Erro ao carregar reservas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [establishment.id]);

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true;
    return reservation.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <MdCheckCircle className="text-green-500" />;
      case 'pending':
        return <MdPending className="text-yellow-500" />;
      case 'cancelled':
        return <MdCancel className="text-red-500" />;
      default:
        return <MdPending className="text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas ({reservations.length})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'confirmed'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Confirmadas ({reservations.filter(r => r.status === 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pendentes ({reservations.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'cancelled'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Canceladas ({reservations.filter(r => r.status === 'cancelled').length})
        </button>
      </div>

      {/* Lista de Reservas */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma reserva encontrada</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Não há reservas para este estabelecimento.'
                : `Não há reservas com status "${getStatusText(filter)}".`
              }
            </p>
          </div>
        ) : (
          filteredReservations.map((reservation) => (
            <div key={reservation.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {reservation.eventName}
                      </h3>
                      <p className="text-gray-600">{reservation.clientName}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(reservation.status)}`}>
                      {getStatusIcon(reservation.status)}
                      {getStatusText(reservation.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MdPhone className="text-gray-400" />
                      <span className="text-gray-700">{reservation.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdEmail className="text-gray-400" />
                      <span className="text-gray-700">{reservation.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdCalendarToday className="text-gray-400" />
                      <span className="text-gray-700">
                        {new Date(reservation.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdAccessTime className="text-gray-400" />
                      <span className="text-gray-700">{reservation.time}</span>
                    </div>
                  </div>
                </div>
                
                <div className="lg:text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <MdPeople className="text-gray-400" />
                    <span className="text-gray-700">{reservation.guests} convidados</span>
                  </div>
                  <div className="text-lg font-bold text-yellow-600">
                    R$ {reservation.totalValue.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  Ver Detalhes
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                  Confirmar
                </button>
                <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">
                  Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 