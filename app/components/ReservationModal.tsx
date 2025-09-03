"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdClose,
  MdPerson,
  MdPhone,
  MdEmail,
  MdCalendarToday,
  MdAccessTime,
  MdPeople,
  MdLocationOn,
  MdTableBar,
  MdNote,
  MdSave,
  MdCancel
} from 'react-icons/md';

interface RestaurantArea {
  id: number;
  name: string;
  capacity_lunch: number;
  capacity_dinner: number;
}

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: any) => void;
  reservation?: any;
  selectedDate?: Date | null;
  establishment?: Establishment | null;
  areas?: RestaurantArea[];
}

export default function ReservationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  reservation, 
  selectedDate,
  establishment,
  areas = []
}: ReservationModalProps) {
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    reservation_date: '',
    reservation_time: '',
    number_of_people: 1,
    area_id: '',
    table_number: '',
    status: 'NOVA',
    origin: 'PESSOAL',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (reservation) {
        setFormData({
          client_name: reservation.client_name || '',
          client_phone: reservation.client_phone || '',
          client_email: reservation.client_email || '',
          reservation_date: reservation.reservation_date || '',
          reservation_time: reservation.reservation_time || '',
          number_of_people: reservation.number_of_people || 1,
          area_id: reservation.area_id || '',
          table_number: reservation.table_number || '',
          status: reservation.status || 'NOVA',
          origin: reservation.origin || 'PESSOAL',
          notes: reservation.notes || ''
        });
      } else {
        // Reset form for new reservation
        setFormData({
          client_name: '',
          client_phone: '',
          client_email: '',
          reservation_date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          reservation_time: '',
          number_of_people: 1,
          area_id: '',
          table_number: '',
          status: 'NOVA',
          origin: 'PESSOAL',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, reservation, selectedDate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Nome do cliente é obrigatório';
    }

    if (!formData.reservation_date) {
      newErrors.reservation_date = 'Data da reserva é obrigatória';
    }

    if (!formData.reservation_time) {
      newErrors.reservation_time = 'Horário da reserva é obrigatório';
    }

    if (!formData.area_id) {
      newErrors.area_id = 'Área é obrigatória';
    }

    if (formData.number_of_people < 1) {
      newErrors.number_of_people = 'Número de pessoas deve ser maior que 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar reserva:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
            className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-xl font-bold">
                  {reservation ? 'Editar Reserva' : 'Nova Reserva'}
                </h2>
                {establishment && (
                  <p className="text-sm text-gray-400 mt-1">{establishment.name}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdPerson className="inline mr-2" />
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.client_name ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Nome completo do cliente"
                  />
                  {errors.client_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdPhone className="inline mr-2" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => handleInputChange('client_phone', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdEmail className="inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="cliente@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdPeople className="inline mr-2" />
                    Número de Pessoas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.number_of_people}
                    onChange={(e) => handleInputChange('number_of_people', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.number_of_people ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.number_of_people && (
                    <p className="text-red-500 text-sm mt-1">{errors.number_of_people}</p>
                  )}
                </div>
              </div>

              {/* Reservation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdCalendarToday className="inline mr-2" />
                    Data da Reserva *
                  </label>
                  <input
                    type="date"
                    value={formData.reservation_date}
                    onChange={(e) => handleInputChange('reservation_date', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.reservation_date ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.reservation_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.reservation_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdAccessTime className="inline mr-2" />
                    Horário *
                  </label>
                  <input
                    type="time"
                    value={formData.reservation_time}
                    onChange={(e) => handleInputChange('reservation_time', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.reservation_time ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.reservation_time && (
                    <p className="text-red-500 text-sm mt-1">{errors.reservation_time}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdLocationOn className="inline mr-2" />
                    Área *
                  </label>
                  <select
                    value={formData.area_id}
                    onChange={(e) => handleInputChange('area_id', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.area_id ? 'border-red-500' : 'border-gray-600'
                    }`}
                  >
                    <option value="">Selecione uma área</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  {errors.area_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.area_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdTableBar className="inline mr-2" />
                    Mesa
                  </label>
                  <input
                    type="text"
                    value={formData.table_number}
                    onChange={(e) => handleInputChange('table_number', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: Mesa 5, Balcão 2"
                  />
                </div>
              </div>

              {/* Status and Origin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="NOVA">Nova</option>
                    <option value="CONFIRMADA">Confirmada</option>
                    <option value="CANCELADA">Cancelada</option>
                    <option value="CONCLUIDA">Concluída</option>
                    <option value="NO_SHOW">No Show</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Origem
                  </label>
                  <select
                    value={formData.origin}
                    onChange={(e) => handleInputChange('origin', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="WIDGET">Widget</option>
                    <option value="TELEFONE">Telefone</option>
                    <option value="PESSOAL">Pessoal</option>
                    <option value="SITE">Site</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MdNote className="inline mr-2" />
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Observações adicionais sobre a reserva..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <MdCancel size={20} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <MdSave size={20} />
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
