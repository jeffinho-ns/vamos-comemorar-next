"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  MdClose, 
  MdPerson, 
  MdPhone, 
  MdEmail, 
  MdAccessTime, 
  MdPeople, 
  MdLocationOn, 
  MdNote,
  MdCalendarToday,
  MdEdit,
  MdDelete,
  MdCheckCircle,
  MdCancel
} from "react-icons/md";

import { Reservation } from '@/app/types/reservation';

interface ReservationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onEdit?: (reservation: Reservation) => void;
  onDelete?: (reservation: Reservation) => void;
  onStatusChange?: (reservation: Reservation, newStatus: string) => void;
}

export default function ReservationDetailsModal({
  isOpen,
  onClose,
  reservation,
  onEdit,
  onDelete,
  onStatusChange
}: ReservationDetailsModalProps) {
  if (!reservation) return null;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(reservation, newStatus);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Detalhes da Reserva
                </h2>
                <p className="text-gray-600 mt-1">
                  ID: #{reservation.id}
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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Status Badge */}
              <div className="mb-6">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(reservation.status)}`}>
                  {getStatusText(reservation.status)}
                </span>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MdPerson className="text-blue-600" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nome Completo
                    </label>
                    <p className="text-gray-800 font-medium">{reservation.client_name}</p>
                  </div>
                  
                  {reservation.client_phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Telefone
                      </label>
                      <p className="text-gray-800 flex items-center gap-2">
                        <MdPhone className="text-gray-400" />
                        {reservation.client_phone}
                      </p>
                    </div>
                  )}

                  {reservation.client_email && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Email
                      </label>
                      <p className="text-gray-800 flex items-center gap-2">
                        <MdEmail className="text-gray-400" />
                        {reservation.client_email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reservation Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MdCalendarToday className="text-green-600" />
                  Detalhes da Reserva
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Data
                    </label>
                    <p className="text-gray-800 flex items-center gap-2">
                      <MdCalendarToday className="text-gray-400" />
                      {formatDate(reservation.reservation_date)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Horário
                    </label>
                    <p className="text-gray-800 flex items-center gap-2">
                      <MdAccessTime className="text-gray-400" />
                      {formatTime(reservation.reservation_time)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Número de Pessoas
                    </label>
                    <p className="text-gray-800 flex items-center gap-2">
                      <MdPeople className="text-gray-400" />
                      {reservation.number_of_people} pessoa{reservation.number_of_people !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Área
                    </label>
                    <p className="text-gray-800 flex items-center gap-2">
                      <MdLocationOn className="text-gray-400" />
                      {reservation.area_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {reservation.notes && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MdNote className="text-purple-600" />
                    Observações
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {reservation.notes}
                  </p>
                </div>
              )}

              {/* Status Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Ações de Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {reservation.status !== 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange('confirmed')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <MdCheckCircle />
                      Confirmar
                    </button>
                  )}
                  
                  {reservation.status !== 'pending' && (
                    <button
                      onClick={() => handleStatusChange('pending')}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                    >
                      <MdAccessTime />
                      Marcar como Pendente
                    </button>
                  )}
                  
                  {reservation.status !== 'cancelled' && (
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <MdCancel />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between p-6 border-t border-gray-200">
              <div className="flex gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(reservation)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <MdEdit />
                    Editar
                  </button>
                )}
                
                {onDelete && (
                  <button
                    onClick={() => onDelete(reservation)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <MdDelete />
                    Excluir
                  </button>
                )}
              </div>
              
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




