"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose, MdPerson, MdPhone, MdEmail, MdAccessTime, MdPeople, MdLocationOn, MdNote } from "react-icons/md";

interface Reservation {
  id: number;
  customer_name: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  area_name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

interface ReservationsDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
}

export default function ReservationsDayModal({
  isOpen,
  onClose,
  date,
  reservations,
  onReservationClick
}: ReservationsDayModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Reservas para {formatDate(date)}
                </h2>
                <p className="text-gray-600 mt-1">
                  {reservations.length} reserva{reservations.length !== 1 ? 's' : ''} encontrada{reservations.length !== 1 ? 's' : ''}
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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {reservations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Nenhuma reserva encontrada
                  </h3>
                  <p className="text-gray-500">
                    Não há reservas para este dia.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reservations.map((reservation) => (
                    <motion.div
                      key={reservation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onReservationClick(reservation)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <MdPerson className="text-blue-600 text-sm" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{reservation.customer_name}</h4>
                            <p className="text-sm text-gray-500">{reservation.reservation_time}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MdPeople className="text-gray-400" />
                          <span>{reservation.party_size} pessoa{reservation.party_size !== 1 ? 's' : ''}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MdLocationOn className="text-gray-400" />
                          <span>{reservation.area_name}</span>
                        </div>

                        {reservation.phone && (
                          <div className="flex items-center gap-2">
                            <MdPhone className="text-gray-400" />
                            <span>{reservation.phone}</span>
                          </div>
                        )}

                        {reservation.email && (
                          <div className="flex items-center gap-2">
                            <MdEmail className="text-gray-400" />
                            <span className="truncate">{reservation.email}</span>
                          </div>
                        )}

                        {reservation.notes && (
                          <div className="flex items-start gap-2">
                            <MdNote className="text-gray-400 mt-0.5" />
                            <span className="text-xs text-gray-500 line-clamp-2">{reservation.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-blue-600 font-medium">
                          Clique para ver detalhes completos
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
