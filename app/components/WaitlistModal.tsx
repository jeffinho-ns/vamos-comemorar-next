"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdClose,
  MdPerson,
  MdPhone,
  MdEmail,
  MdPeople,
  MdAccessTime,
  MdNote,
  MdSave,
  MdCancel,
  MdLocationOn,
  MdTableBar,
  MdCalendarToday
} from 'react-icons/md';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (waitlistEntry: any) => void;
  entry?: any;
  defaultDate?: string;
  areas?: Array<{ id: number; name: string }>;
  establishment?: { id: number; name: string } | null;
  onCreateReservation?: (reservationData: any) => Promise<void>; // Nova prop para criar reserva quando mesa estiver disponível
  waitlistEntries?: Array<{ has_bistro_table?: boolean; establishment_id?: number }>; // Entradas da lista de espera para contagem de mesas bistrô
}

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

export default function WaitlistModal({ 
  isOpen, 
  onClose, 
  onSave, 
  entry,
  defaultDate,
  areas = [],
  establishment = null,
  onCreateReservation,
  waitlistEntries = []
}: WaitlistModalProps) {
  const [formData, setFormData] = useState({
    preferred_date: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    number_of_people: 1,
    preferred_time: '',
    preferred_area_id: '',
    preferred_table_number: '',
    status: 'AGUARDANDO',
    notes: '',
    has_bistro_table: false
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedSubareaKey, setSelectedSubareaKey] = useState<string>('');

  // Subáreas do Highline
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

  // Subáreas específicas do Seu Justino
  const seuJustinoSubareas = [
    { key: 'lounge-aquario-spaten', area_id: 1, label: 'Lounge Aquario Spaten', tableNumbers: ['210'], capacity: 8 },
    { key: 'lounge-aquario-tv', area_id: 1, label: 'Lounge Aquario TV', tableNumbers: ['208'], capacity: 10 },
    { key: 'lounge-palco', area_id: 1, label: 'Lounge Palco', tableNumbers: ['204','206'], capacity: 6 },
    { key: 'lounge-bar', area_id: 1, label: 'Lounge Bar', tableNumbers: ['200','202'], capacity: 6 },
    { key: 'quintal-lateral-esquerdo', area_id: 2, label: 'Quintal Lateral Esquerdo', tableNumbers: ['20','22','24','26','28','29'], capacity: 6 },
    { key: 'quintal-central-esquerdo', area_id: 2, label: 'Quintal Central Esquerdo', tableNumbers: ['30','32','34','36','38','39'], capacity: 4 },
    { key: 'quintal-central-direito', area_id: 2, label: 'Quintal Central Direito', tableNumbers: ['40','42','44','46','48'], capacity: 4 },
    { key: 'quintal-lateral-direito', area_id: 2, label: 'Quintal Lateral Direito', tableNumbers: ['50','52','54','56','58','60','62','64'], capacity: 6 },
  ];

  const isHighline = establishment && ((establishment.name || '').toLowerCase().includes('high'));
  const isSeuJustino = establishment && (
    (establishment.name || '').toLowerCase().includes('seu justino') && 
    !(establishment.name || '').toLowerCase().includes('pracinha')
  );
  const isPracinha = establishment && (establishment.name || '').toLowerCase().includes('pracinha');
  
  // Contar mesas bistrô ocupadas na lista de espera
  const bistroTableCount = waitlistEntries.filter(entry => 
    entry.has_bistro_table === true && 
    entry.establishment_id === establishment?.id
  ).length;
  
  const maxBistroTables = isSeuJustino ? 40 : isPracinha ? 20 : 0;

  // Função helper para mapear mesa -> área do Seu Justino (para exibição)
  const getSeuJustinoAreaName = (tableNumber?: string | number, areaName?: string, areaId?: number): string => {
    if (!isSeuJustino) return areaName || '';
    if (!tableNumber && !areaName && !areaId) return areaName || '';
    
    const tableNum = String(tableNumber || '').trim();
    
    if (tableNum) {
      const tableNumbers = tableNum.includes(',') ? tableNum.split(',').map(t => t.trim()) : [tableNum];
      for (const tn of tableNumbers) {
        const subarea = seuJustinoSubareas.find(sub => sub.tableNumbers.includes(tn));
        if (subarea) {
          return subarea.label;
        }
      }
    }
    
    if (areaName && !areaName.toLowerCase().includes('área coberta') && !areaName.toLowerCase().includes('área descoberta')) {
      return areaName;
    }
    
    return areaName || '';
  };

  useEffect(() => {
    if (isOpen) {
      if (entry) {
        // Modo de edição - carregar dados existentes
        const preferredAreaId = entry.preferred_area_id ? String(entry.preferred_area_id) : '';
        setFormData({
          preferred_date: entry.preferred_date || '',
          client_name: entry.client_name || '',
          client_phone: entry.client_phone || '',
          client_email: entry.client_email || '',
          number_of_people: entry.number_of_people || 1,
          preferred_time: entry.preferred_time || '',
          preferred_area_id: preferredAreaId,
          preferred_table_number: entry.preferred_table_number || '',
          status: entry.status || 'AGUARDANDO',
          notes: entry.notes || '',
          has_bistro_table: entry.has_bistro_table || false
        });

        // Se for Seu Justino ou Highline, tentar encontrar a subárea baseada na mesa ou área
        if ((isSeuJustino || isHighline) && entry.preferred_area_id) {
          if (entry.preferred_table_number) {
            const tableNum = String(entry.preferred_table_number).trim();
            const subareas = isSeuJustino ? seuJustinoSubareas : highlineSubareas;
            const foundSubarea = subareas.find(sub => sub.tableNumbers.includes(tableNum));
            if (foundSubarea) {
              setSelectedSubareaKey(foundSubarea.key);
            }
          } else if (entry.preferred_area_id) {
            // Se não tiver mesa mas tiver área, tentar encontrar subárea pela área
            const subareas = isSeuJustino ? seuJustinoSubareas : highlineSubareas;
            const foundSubarea = subareas.find(sub => sub.area_id === Number(entry.preferred_area_id));
            if (foundSubarea) {
              setSelectedSubareaKey(foundSubarea.key);
            }
          }
        }
      } else {
        // Modo de criação
        setFormData({
          preferred_date: defaultDate || '',
          client_name: '',
          client_phone: '',
          client_email: '',
          number_of_people: 1,
          preferred_time: '',
          preferred_area_id: '',
          preferred_table_number: '',
          status: 'AGUARDANDO',
          notes: '',
          has_bistro_table: false
        });
        setSelectedSubareaKey('');
      }
      setTables([]);
      setErrors({});
    }
  }, [isOpen, entry, defaultDate, isSeuJustino, isHighline]);

  // Carregar mesas (TODAS - disponíveis e indisponíveis)
  useEffect(() => {
    const loadTables = async () => {
      if (!formData.preferred_area_id || !formData.preferred_date) {
        setTables([]);
        return;
      }
      try {
        // Buscar TODAS as mesas da área (não filtrar por disponibilidade)
        const res = await fetch(`${API_URL}/api/restaurant-tables/${formData.preferred_area_id}/availability?date=${formData.preferred_date}`);
        if (res.ok) {
          const data = await res.json();
          let fetched: RestaurantTable[] = Array.isArray(data.tables) ? data.tables : [];
          
          // Se for Seu Justino ou Highline e houver subárea selecionada, filtrar pelas mesas da subárea
          if (isSeuJustino && selectedSubareaKey) {
            const sub = seuJustinoSubareas.find(s => s.key === selectedSubareaKey);
            if (sub) {
              fetched = fetched.filter(t => sub.tableNumbers.includes(String(t.table_number)));
              // Se não houver mesas da API, criar mesas virtuais
              if (fetched.length === 0 && sub.tableNumbers.length > 0) {
                fetched = sub.tableNumbers.map((tableNum, index) => ({
                  id: index + 1,
                  area_id: sub.area_id,
                  table_number: tableNum,
                  capacity: sub.capacity || 4,
                  is_reserved: false
                }));
              }
            }
          } else if (isHighline && selectedSubareaKey) {
            const sub = highlineSubareas.find(s => s.key === selectedSubareaKey);
            if (sub) {
              fetched = fetched.filter(t => sub.tableNumbers.includes(String(t.table_number)));
            }
          }

          // Verificar disponibilidade no horário específico (se informado)
          // Buscar TODAS as reservas (não apenas CONFIRMADA) para considerar reservas criadas pelo calendário
          if (formData.preferred_time || formData.preferred_date) {
            try {
              // Buscar todas as reservas do dia na área, excluindo apenas canceladas e finalizadas
              const reservationsRes = await fetch(
                `${API_URL}/api/restaurant-reservations?reservation_date=${formData.preferred_date}&area_id=${formData.preferred_area_id}${establishment?.id ? `&establishment_id=${establishment.id}` : ''}`
              );
              if (reservationsRes.ok) {
                const reservationsData = await reservationsRes.json();
                const allReservations = Array.isArray(reservationsData.reservations) 
                  ? reservationsData.reservations 
                  : [];
                
                // Filtrar apenas reservas que ocupam a mesa (excluir canceladas e finalizadas)
                const activeReservations = allReservations.filter((reservation: any) => {
                  const status = String(reservation.status || '').toUpperCase();
                  return status !== 'CANCELADA' && 
                         status !== 'CANCELED' && 
                         status !== 'COMPLETED' &&
                         status !== 'FINALIZADA';
                });
                
                // Verificar quais mesas estão reservadas no horário específico
                // Considera sobreposição de horários (reservas duram aproximadamente 2 horas)
                const reservedTableNumbers = new Set<string>();
                
                // Função auxiliar para verificar sobreposição de horários
                const hasTimeOverlap = (time1: string, time2: string) => {
                  const [h1, m1] = time1.split(':').map(Number);
                  const [h2, m2] = time2.split(':').map(Number);
                  const minutes1 = h1 * 60 + (isNaN(m1) ? 0 : m1);
                  const minutes2 = h2 * 60 + (isNaN(m2) ? 0 : m2);
                  const diff = Math.abs(minutes1 - minutes2);
                  return diff < 120; // 2 horas em minutos
                };
                
                activeReservations.forEach((reservation: any) => {
                  if (reservation.table_number) {
                    // Se não tiver horário preferido, considerar todas as reservas do dia
                    if (!formData.preferred_time) {
                      // Sem horário: considerar todas as mesas reservadas como indisponíveis
                      const tables = String(reservation.table_number).split(',');
                      tables.forEach((table: string) => {
                        reservedTableNumbers.add(table.trim());
                      });
                    } else if (reservation.reservation_time) {
                      // Comparar horários considerando sobreposição (2 horas)
                      const reservationTime = String(reservation.reservation_time).substring(0, 5);
                      const preferredTime = String(formData.preferred_time).substring(0, 5);
                      
                      // Se houver sobreposição de horários, considerar ocupada
                      if (hasTimeOverlap(reservationTime, preferredTime)) {
                        const tables = String(reservation.table_number).split(',');
                        tables.forEach((table: string) => {
                          reservedTableNumbers.add(table.trim());
                        });
                      }
                    }
                  }
                });
                
                // Marcar mesas como reservadas se estiverem ocupadas no horário
                fetched = fetched.map(table => ({
                  ...table,
                  is_reserved: reservedTableNumbers.has(String(table.table_number)) || table.is_reserved
                }));
              }
            } catch (err) {
              console.error('Erro ao verificar disponibilidade:', err);
            }
          }
          
          setTables(fetched);
        } else {
          // Se a API falhar mas houver subárea selecionada, criar mesas virtuais
          if (isSeuJustino && selectedSubareaKey) {
            const sub = seuJustinoSubareas.find(s => s.key === selectedSubareaKey);
            if (sub && sub.tableNumbers.length > 0) {
              const virtualTables: RestaurantTable[] = sub.tableNumbers.map((tableNum, index) => ({
                id: index + 1,
                area_id: sub.area_id,
                table_number: tableNum,
                capacity: sub.capacity || 4,
                is_reserved: false
              }));
              setTables(virtualTables);
            } else {
              setTables([]);
            }
          } else if (isHighline && selectedSubareaKey) {
            const sub = highlineSubareas.find(s => s.key === selectedSubareaKey);
            if (sub && sub.tableNumbers.length > 0) {
              const virtualTables: RestaurantTable[] = sub.tableNumbers.map((tableNum, index) => ({
                id: index + 1,
                area_id: sub.area_id,
                table_number: tableNum,
                capacity: 4,
                is_reserved: false
              }));
              setTables(virtualTables);
            } else {
              setTables([]);
            }
          } else {
            setTables([]);
          }
        }
      } catch (e) {
        console.error('Erro ao carregar mesas:', e);
        setTables([]);
      }
    };
    loadTables();
  }, [formData.preferred_area_id, formData.preferred_date, formData.preferred_time, selectedSubareaKey, isHighline, isSeuJustino, establishment?.id]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Nome do cliente é obrigatório';
    }

    if (!formData.preferred_date) {
      newErrors.preferred_date = 'Data preferida é obrigatória';
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
      // Verificar se mesa está disponível no horário selecionado
      const selectedTable = tables.find(t => String(t.table_number) === formData.preferred_table_number);
      const isTableAvailable = selectedTable && !selectedTable.is_reserved && formData.preferred_time && formData.preferred_area_id;

      if (isTableAvailable && onCreateReservation && formData.preferred_area_id && formData.preferred_table_number && formData.preferred_time) {
        // Mesa disponível → criar RESERVA NORMAL
        // Garantir formato correto do horário (HH:MM)
        let formattedTime = formData.preferred_time;
        if (formattedTime && formattedTime.includes(':')) {
          const parts = formattedTime.split(':');
          if (parts.length === 2) {
            // Formato HH:MM (sem segundos)
            formattedTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
          }
        }
        
        const reservationData = {
          client_name: formData.client_name,
          client_phone: formData.client_phone || null,
          client_email: formData.client_email || null,
          reservation_date: formData.preferred_date,
          reservation_time: formattedTime,
          number_of_people: formData.number_of_people,
          area_id: Number(formData.preferred_area_id),
          table_number: formData.preferred_table_number,
          status: 'CONFIRMADA',
          origin: 'PESSOAL', // Mudado de 'LISTA_ESPERA' para 'PESSOAL' para evitar validações restritivas
          notes: formData.notes || null,
          establishment_id: establishment?.id,
          created_by: 1,
          has_bistro_table: formData.has_bistro_table || false
        };

        await onCreateReservation(reservationData);
        alert('✅ Mesa disponível! Reserva criada com sucesso.');
        onClose();
      } else {
        // Mesa indisponível, sem mesa selecionada, sem horário ou sem área → criar LISTA DE ESPERA
        await onSave({
          ...formData,
          preferred_area_id: formData.preferred_area_id ? Number(formData.preferred_area_id) : null,
        });
        if (formData.preferred_table_number && formData.preferred_time && !isTableAvailable) {
          alert('⚠️ Mesa indisponível no horário selecionado. Cliente adicionado à Lista de Espera.');
        }
        onClose();
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert(`Erro ao processar: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Se mudar área ou data, limpar mesa selecionada
    if (field === 'preferred_area_id' || field === 'preferred_date' || field === 'preferred_time') {
      setFormData(prev => ({ ...prev, preferred_table_number: '' }));
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
            {/* Header com Badge de Lista de Espera */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-yellow-900/30 to-yellow-800/20">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">
                    {entry ? 'Editar Lista de Espera' : 'Nova Lista de Espera'}
                  </h2>
                  <span className="px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
                    LISTA DE ESPERA
                  </span>
                </div>
                {establishment && (
                  <p className="text-sm text-gray-400 mt-1">{establishment.name}</p>
                )}
                {entry && (
                  <div className="mt-2 text-xs text-gray-300 space-y-1">
                    {entry.preferred_area_id && (
                      <div className="flex items-center gap-2">
                        <MdLocationOn size={14} />
                        <span>Área: {(() => {
                          const area = areas.find(a => a.id === entry.preferred_area_id);
                          return area ? getSeuJustinoAreaName(entry.preferred_table_number, area.name, entry.preferred_area_id) : '—';
                        })()}</span>
                      </div>
                    )}
                    {entry.preferred_table_number && (
                      <div className="flex items-center gap-2">
                        <MdTableBar size={14} />
                        <span>Mesa: {entry.preferred_table_number}</span>
                      </div>
                    )}
                    {entry.preferred_date && (
                      <div className="flex items-center gap-2">
                        <MdCalendarToday size={14} />
                        <span>Data: {new Date(entry.preferred_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
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
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
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
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      errors.number_of_people ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.number_of_people && (
                    <p className="text-red-500 text-sm mt-1">{errors.number_of_people}</p>
                  )}
                </div>
              </div>

              {/* Waitlist Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdCalendarToday className="inline mr-2" />
                    Data Preferida *
                  </label>
                  <input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => handleInputChange('preferred_date', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      errors.preferred_date ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.preferred_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.preferred_date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdAccessTime className="inline mr-2" />
                    Horário Preferido
                  </label>
                  <input
                    type="time"
                    value={formData.preferred_time}
                    onChange={(e) => handleInputChange('preferred_time', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="text-xs text-yellow-400 mt-1">
                    💡 Se selecionar mesa disponível, será criada uma reserva normal
                  </p>
                </div>

                {/* Área - igual ao ReservationModal */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdLocationOn className="inline mr-2" />
                    Área
                  </label>
                  <select
                    value={(isHighline || isSeuJustino) ? selectedSubareaKey : formData.preferred_area_id}
                    onChange={(e) => {
                      if (isHighline || isSeuJustino) {
                        const key = e.target.value;
                        setSelectedSubareaKey(key);
                        const sub = isHighline 
                          ? highlineSubareas.find(s => s.key === key)
                          : seuJustinoSubareas.find(s => s.key === key);
                        handleInputChange('preferred_area_id', sub ? String(sub.area_id) : '');
                        handleInputChange('preferred_table_number', '');
                      } else {
                        handleInputChange('preferred_area_id', e.target.value);
                        handleInputChange('preferred_table_number', '');
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Selecione uma área (opcional)</option>
                    {isHighline
                      ? highlineSubareas.map(s => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))
                      : isSeuJustino
                      ? seuJustinoSubareas.map(s => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))
                      : areas.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Mesa - mostrar todas (disponíveis e indisponíveis) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdTableBar className="inline mr-2" />
                    Mesa
                  </label>
                  {tables.length > 0 || (isSeuJustino && selectedSubareaKey) || (isHighline && selectedSubareaKey) ? (
                    <select
                      value={formData.preferred_table_number}
                      onChange={(e) => handleInputChange('preferred_table_number', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">Selecione uma mesa (opcional)</option>
                      {(() => {
                        // Se for Seu Justino ou Highline com subárea selecionada, mas não houver mesas da API, usar mesas da subárea
                        if ((isSeuJustino || isHighline) && selectedSubareaKey && tables.length === 0) {
                          const sub = isSeuJustino 
                            ? seuJustinoSubareas.find(s => s.key === selectedSubareaKey)
                            : highlineSubareas.find(s => s.key === selectedSubareaKey);
                          if (sub) {
                            return sub.tableNumbers.map((tableNum) => (
                              <option key={tableNum} value={tableNum}>
                                Mesa {tableNum}
                              </option>
                            ));
                          }
                        }
                        // Caso contrário, usar mesas da API (TODAS - disponíveis e indisponíveis)
                        return tables.map(t => (
                          <option 
                            key={t.id} 
                            value={t.table_number}
                            className={t.is_reserved ? 'text-red-400' : 'text-white'}
                          >
                            Mesa {t.table_number} • {t.capacity} lugares {t.is_reserved ? '🔴 (Indisponível)' : '🟢 (Disponível)'}
                          </option>
                        ));
                      })()}
                    </select>
                  ) : formData.preferred_area_id ? (
                    <input
                      type="text"
                      value={formData.preferred_table_number}
                      onChange={(e) => handleInputChange('preferred_table_number', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Ex: Mesa 10"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData.preferred_table_number}
                      onChange={(e) => handleInputChange('preferred_table_number', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Selecione uma área primeiro"
                      disabled
                    />
                  )}
                  {formData.preferred_table_number && formData.preferred_time && (
                    <p className="text-xs mt-1 text-yellow-400">
                      {(() => {
                        const selectedTable = tables.find(t => String(t.table_number) === formData.preferred_table_number);
                        if (selectedTable?.is_reserved) {
                          return '⚠️ Mesa indisponível neste horário → será adicionado à Lista de Espera';
                        } else if (selectedTable) {
                          return '✅ Mesa disponível → será criada uma Reserva Normal';
                        }
                        return '';
                      })()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="AGUARDANDO">Aguardando</option>
                    <option value="CHAMADO">Chamado</option>
                    <option value="ATENDIDO">Atendido</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Campo Mesa Bistrô (apenas para Seu Justino e Pracinha) */}
              {(isSeuJustino || isPracinha) && (
                <div className="p-4 bg-purple-900/20 border-2 border-purple-600/50 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_bistro_table}
                      onChange={(e) => handleInputChange('has_bistro_table', e.target.checked)}
                      className="mt-1 w-5 h-5 bg-gray-600 border-gray-500 rounded text-purple-500 focus:ring-purple-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MdTableBar className="text-purple-400" size={20} />
                        <span className="text-sm font-semibold text-purple-300">
                          Cliente já está ocupando uma Mesa Bistrô
                        </span>
                      </div>
                      <p className="text-xs text-purple-200">
                        {isSeuJustino 
                          ? `Limite de 40 Mesas Bistrô para o Seu Justino. (${bistroTableCount}/${maxBistroTables} ocupadas)`
                          : `Limite de 20 Mesas Bistrô para o Pracinha do Seu Justino. (${bistroTableCount}/${maxBistroTables} ocupadas)`}
                      </p>
                      {bistroTableCount >= maxBistroTables && (
                        <p className="text-xs text-red-400 font-semibold mt-1">
                          ⚠️ Limite de mesas bistrô atingido!
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              )}

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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Observações adicionais..."
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
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
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
