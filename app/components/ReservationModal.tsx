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
import { FaWhatsapp } from 'react-icons/fa'; // <-- 1. IMPORTAÇÃO ADICIONADA

// Configuração da API
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';

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
  selectedTime?: string | null;
  establishment?: Establishment | null;
  areas?: RestaurantArea[];
}

export default function ReservationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  reservation, 
  selectedDate,
  selectedTime,
  establishment,
  areas = []
}: ReservationModalProps) {
  interface RestaurantTable {
    id: number;
    area_id: number;
    table_number: string;
    capacity: number;
    table_type?: string;
    description?: string;
    is_active?: number;
    is_reserved?: boolean;
  }

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    data_nascimento_cliente: '',
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
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedSubareaKey, setSelectedSubareaKey] = useState<string>('');

  // 2. ESTADOS PARA OS CONTROLES DE NOTIFICAÇÃO ADICIONADOS
  const [sendEmailConfirmation, setSendEmailConfirmation] = useState(true);
  const [sendWhatsAppConfirmation, setSendWhatsAppConfirmation] = useState(true);
  
  // NOVO: Estado para tipo de evento (para reservas grandes)
  const [eventType, setEventType] = useState<'aniversario' | 'despedida' | ''>('');

  const highlineSubareas = [
    { key: 'deck-frente', area_id: 2, label: 'Área Deck - Frente', tableNumbers: ['05','06','07','08'] },
    { key: 'deck-esquerdo', area_id: 2, label: 'Área Deck - Esquerdo', tableNumbers: ['01','02','03','04'] },
    { key: 'deck-direito', area_id: 2, label: 'Área Deck - Direito', tableNumbers: ['09','10','11','12'] },
    { key: 'bar', area_id: 2, label: 'Área Bar', tableNumbers: ['15','16','17'] },
    { key: 'roof-direito', area_id: 5, label: 'Área Rooftop - Direito', tableNumbers: ['50','51','52','53','54','55'] },
    { key: 'roof-bistro', area_id: 5, label: 'Área Rooftop - Bistrô', tableNumbers: ['70','71','72','73'] },
    { key: 'roof-centro', area_id: 5, label: 'Área Rooftop - Centro', tableNumbers: ['44','45','46','47'] },
    { key: 'roof-esquerdo', area_id: 5, label: 'Área Rooftop - Esquerdo', tableNumbers: ['60','61','62','63','64','65'] },
    { key: 'roof-vista', area_id: 5, label: 'Área Rooftop - Vista', tableNumbers: ['40','41','42'] },
  ];

  const isHighline = establishment && ((establishment.name || '').toLowerCase().includes('high'));

  const getMaxBirthdate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  };

  // Janelas de horário para o Highline (Sexta e Sábado)
  const getHighlineTimeWindows = (dateStr: string, subareaKey?: string) => {
    if (!dateStr) return [] as Array<{ start: string; end: string; label: string }>;
    const date = new Date(dateStr + 'T00:00:00');
    const weekday = date.getDay(); // 0=Dom, 5=Sex, 6=Sáb
    const windows: Array<{ start: string; end: string; label: string }> = [];
    const isRooftop = subareaKey ? subareaKey.startsWith('roof') : false;
    const isDeckOrBar = subareaKey ? (subareaKey.startsWith('deck') || subareaKey === 'bar') : false;

    if (weekday === 5) {
      windows.push({ start: '18:00', end: '21:00', label: 'Sexta-feira: 18:00–21:00' });
    } else if (weekday === 6) {
      if (isRooftop) {
        windows.push({ start: '14:00', end: '17:00', label: 'Sábado Rooftop: 14:00–17:00' });
      } else if (isDeckOrBar) {
        windows.push({ start: '14:00', end: '20:00', label: 'Sábado Deck: 14:00–20:00' });
      } else {
        windows.push({ start: '14:00', end: '17:00', label: 'Sábado Rooftop: 14:00–17:00' });
        windows.push({ start: '14:00', end: '20:00', label: 'Sábado Deck: 14:00–20:00' });
      }
    }
    return windows;
  };

  const isTimeWithinWindows = (timeStr: string, windows: Array<{ start: string; end: string }>) => {
    if (!timeStr || windows.length === 0) return false;
    const [h, m] = timeStr.split(':').map(Number);
    const value = h * 60 + (isNaN(m) ? 0 : m);
    return windows.some(w => {
      const [sh, sm] = w.start.split(':').map(Number);
      const [eh, em] = w.end.split(':').map(Number);
      const startMin = sh * 60 + (isNaN(sm) ? 0 : sm);
      const endMin = eh * 60 + (isNaN(em) ? 0 : em);
      return value >= startMin && value <= endMin;
    });
  };

  // 3. USEEFFECT ATUALIZADO PARA CONTROLAR O PADRÃO DOS CHECKBOXES
  useEffect(() => {
    if (isOpen) {
      if (reservation) { // Modo de Edição
        setFormData({
          client_name: reservation.client_name || '',
          client_phone: reservation.client_phone || '',
          client_email: reservation.client_email || '',
          data_nascimento_cliente: reservation.data_nascimento_cliente || '',
          reservation_date: reservation.reservation_date || '',
          reservation_time: reservation.reservation_time || '',
          number_of_people: reservation.number_of_people || 1,
          area_id: reservation.area_id || '',
          table_number: reservation.table_number || '',
          status: reservation.status || 'NOVA',
          origin: reservation.origin || 'PESSOAL',
          notes: reservation.notes || ''
        });
        // Desliga as notificações por padrão ao editar
        setSendEmailConfirmation(false);
        setSendWhatsAppConfirmation(false);
      } else { // Modo de Criação
        setFormData({
          client_name: '',
          client_phone: '',
          client_email: '',
          data_nascimento_cliente: '',
          reservation_date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          reservation_time: selectedTime || '',
          number_of_people: 1,
          area_id: '',
          table_number: '',
          status: 'NOVA',
          origin: 'PESSOAL',
          notes: ''
        });
        // Liga as notificações por padrão ao criar
        setSendEmailConfirmation(true);
        setSendWhatsAppConfirmation(true);
      }
      setErrors({});
    }
  }, [isOpen, reservation, selectedDate, selectedTime]);

  useEffect(() => {
    const loadTables = async () => {
      if (!formData.area_id || !formData.reservation_date) {
        setTables([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/restaurant-tables/${formData.area_id}/availability?date=${formData.reservation_date}`);
        if (res.ok) {
          const data = await res.json();
          let fetched: RestaurantTable[] = Array.isArray(data.tables) ? data.tables : [];
          if (isHighline && selectedSubareaKey) {
            const sub = highlineSubareas.find(s => s.key === selectedSubareaKey);
            if (sub) {
              fetched = fetched.filter(t => sub.tableNumbers.includes(String(t.table_number)));
            }
          }
          setTables(fetched);
        } else {
          setTables([]);
        }
      } catch (e) {
        console.error('Erro ao carregar mesas (admin):', e);
        setTables([]);
      }
    };
    loadTables();
  }, [formData.area_id, formData.reservation_date, selectedSubareaKey, isHighline]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    // 18+
    if (!formData.data_nascimento_cliente) {
      newErrors.data_nascimento_cliente = 'Data de nascimento é obrigatória';
    } else {
      const bd = new Date(formData.data_nascimento_cliente + 'T00:00:00');
      const today = new Date();
      const eighteen = new Date(today);
      eighteen.setFullYear(today.getFullYear() - 18);
      if (bd > eighteen) {
        newErrors.data_nascimento_cliente = 'Somente maiores de 18 anos podem reservar.';
      }
    }


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
    const isLargeReservation = formData.number_of_people >= 11;
    const hasOptions = tables && tables.length > 0;
    const hasCompatible = tables.some(t => !t.is_reserved && t.capacity >= formData.number_of_people);
    if (!isLargeReservation && hasOptions && hasCompatible && !formData.table_number) {
      newErrors.table_number = 'Selecione uma mesa disponível';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 4. HANDLESUBMIT ATUALIZADO PARA ENVIAR O PAYLOAD COMPLETO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      establishment_id: establishment?.id,
      send_email: sendEmailConfirmation,
      send_whatsapp: sendWhatsAppConfirmation,
    };

    // Adicionar event_type se for reserva grande
    if (formData.number_of_people >= 11 && eventType) {
      payload.event_type = eventType;
    }

    try {
      await onSave(payload);
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

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Name */}
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

                {/* Client Phone */}
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

                {/* Client Email */}
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
                
                {/* Client Birthdate */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdCalendarToday className="inline mr-2" />
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.data_nascimento_cliente}
                    onChange={(e) => handleInputChange('data_nascimento_cliente', e.target.value)}
                    max={getMaxBirthdate()}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {errors.data_nascimento_cliente && (
                    <p className="text-red-500 text-sm mt-1">{errors.data_nascimento_cliente}</p>
                  )}
                </div>

                {/* Number of People */}
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
                  
                  {formData.number_of_people >= 11 && (
                    <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-800">
                        <MdPeople className="text-orange-600" />
                        <span className="text-sm font-medium">Reserva Grande - Lista de Convidados</span>
                      </div>
                      <p className="text-xs text-orange-700 mt-1 mb-3">
                        Para grupos acima de 10 pessoas, uma lista de convidados será gerada automaticamente.
                        O cliente poderá compartilhar um link para que os amigos se cadastrem.
                      </p>
                      
                      {/* Seletor de tipo de evento */}
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-orange-800 mb-1">
                          Tipo de Evento (Opcional)
                        </label>
                        <select
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value as 'aniversario' | 'despedida' | '')}
                          className="w-full px-2 py-1 text-sm bg-white border border-orange-300 rounded text-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Selecione (opcional)</option>
                          <option value="aniversario">Aniversário</option>
                          <option value="despedida">Despedida</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reservation Date */}
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

                {/* Reservation Time */}
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
                  {isHighline && formData.reservation_date && (
                    <div className="mt-2 text-xs text-gray-300">
                      {(() => {
                        const windows = getHighlineTimeWindows(formData.reservation_date, selectedSubareaKey);
                        if (windows.length === 0) {
                          return (
                            <div className="p-2 bg-red-900/20 border border-red-600/40 rounded">
                              Reservas fechadas para este dia no Highline. Disponível apenas Sexta e Sábado.
                            </div>
                          );
                        }
                        return (
                          <div className="p-2 bg-amber-900/20 border border-amber-600/40 rounded">
                            <div className="font-medium text-amber-300">Horários disponíveis:</div>
                            <ul className="list-disc pl-5">
                              {windows.map((w, i) => (
                                <li key={i}>{w.label}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Restaurant Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdLocationOn className="inline mr-2" />
                    Área *
                  </label>
                  <select
                    value={isHighline ? selectedSubareaKey : formData.area_id}
                    onChange={(e) => {
                      if (isHighline) {
                        const key = e.target.value;
                        setSelectedSubareaKey(key);
                        const sub = highlineSubareas.find(s => s.key === key);
                        handleInputChange('area_id', sub ? String(sub.area_id) : '');
                        handleInputChange('table_number', '');
                      } else {
                        handleInputChange('area_id', e.target.value);
                        handleInputChange('table_number', '');
                      }
                    }}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.area_id ? 'border-red-500' : 'border-gray-600'
                    }`}
                  >
                    <option value="">Selecione uma área</option>
                    {isHighline
                      ? highlineSubareas.map(s => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))
                      : areas.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                  </select>
                  {errors.area_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.area_id}</p>
                  )}
                </div>

                {/* Restaurant Table */}
                {formData.number_of_people < 11 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <MdTableBar className="inline mr-2" />
                      Mesa
                    </label>
                    {tables.length > 0 ? (
                      <select
                        value={formData.table_number}
                        onChange={(e) => handleInputChange('table_number', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          errors.table_number ? 'border-red-500' : 'border-gray-600'
                        }`}
                      >
                        <option value="">Selecione uma mesa</option>
                        {tables
                          .filter(t => !t.is_reserved && t.capacity >= formData.number_of_people)
                          .map(t => (
                            <option key={t.id} value={t.table_number}>
                              Mesa {t.table_number} • {t.capacity} lugares{t.table_type ? ` • ${t.table_type}` : ''}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.table_number}
                        onChange={(e) => handleInputChange('table_number', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Ex: Mesa 5"
                      />
                    )}
                    {errors.table_number && (
                      <p className="text-red-500 text-sm mt-1">{errors.table_number}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
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

                {/* Origin */}
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

              {/* 5. CHECKBOXES DE NOTIFICAÇÃO ADICIONADOS AO FORMULÁRIO */}
              <div className="pt-4 border-t border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Notificar Cliente sobre a Reserva?
                </label>
                <div className="flex items-center space-x-6">
                  <label htmlFor="sendEmail" className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      id="sendEmail"
                      type="checkbox"
                      checked={sendEmailConfirmation}
                      onChange={(e) => setSendEmailConfirmation(e.target.checked)}
                      className="w-5 h-5 bg-gray-600 border-gray-500 rounded text-orange-500 focus:ring-orange-600"
                    />
                    <MdEmail className="inline" size={20} />
                    <span>Enviar Email</span>
                  </label>
                  <label htmlFor="sendWhatsApp" className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      id="sendWhatsApp"
                      type="checkbox"
                      checked={sendWhatsAppConfirmation}
                      onChange={(e) => setSendWhatsAppConfirmation(e.target.checked)}
                      className="w-5 h-5 bg-gray-600 border-gray-500 rounded text-orange-500 focus:ring-orange-600"
                    />
                    <FaWhatsapp className="inline" size={20} />
                    <span>Enviar WhatsApp</span>
                  </label>
                </div>
              </div>

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