"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdLocationOn, MdTableBar, MdCheck } from 'react-icons/md';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';

interface AllocateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (areaId: number, tableNumber: string) => void;
  entry: {
    preferred_area_id?: number;
    preferred_table_number?: string;
    preferred_date?: string;
    preferred_time?: string;
    client_name: string;
  };
  areas: Array<{ id: number; name: string }>;
  establishment?: { id: number; name: string } | null;
}

interface RestaurantTable {
  id: number;
  area_id: number;
  table_number: string;
  capacity: number;
  is_reserved?: boolean;
}

export default function AllocateTableModal({
  isOpen,
  onClose,
  onConfirm,
  entry,
  areas = [],
  establishment = null
}: AllocateTableModalProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>('');
  const [selectedSubareaKey, setSelectedSubareaKey] = useState<string>('');
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(false);

  const isSeuJustino = establishment && (
    (establishment.name || '').toLowerCase().includes('seu justino') && 
    !(establishment.name || '').toLowerCase().includes('pracinha')
  );
  const isPracinha = establishment && (establishment.name || '').toLowerCase().includes('pracinha');

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

  useEffect(() => {
    if (isOpen && entry) {
      // Inicializar com valores da entrada (pré-selecionar área e mesa)
      const initialAreaId = entry.preferred_area_id ? String(entry.preferred_area_id) : '';
      const initialTableNumber = entry.preferred_table_number || '';
      
      // Se for Seu Justino, tentar encontrar a subárea baseada na mesa ou área
      if (isSeuJustino && entry.preferred_area_id) {
        let foundSubarea = null;
        
        if (entry.preferred_table_number) {
          const tableNum = String(entry.preferred_table_number).trim();
          foundSubarea = seuJustinoSubareas.find(sub => sub.tableNumbers.includes(tableNum));
        }
        
        // Se não encontrou pela mesa, tentar pela área
        if (!foundSubarea && entry.preferred_area_id) {
          foundSubarea = seuJustinoSubareas.find(sub => sub.area_id === Number(entry.preferred_area_id));
        }
        
        if (foundSubarea) {
          setSelectedSubareaKey(foundSubarea.key);
          setSelectedAreaId(String(foundSubarea.area_id));
        } else {
          setSelectedSubareaKey('');
          setSelectedAreaId(initialAreaId);
        }
      } else {
        setSelectedSubareaKey('');
        setSelectedAreaId(initialAreaId);
      }
      
      setSelectedTableNumber(initialTableNumber);
    } else if (!isOpen) {
      // Limpar ao fechar
      setSelectedAreaId('');
      setSelectedTableNumber('');
      setSelectedSubareaKey('');
      setTables([]);
    }
  }, [isOpen, entry, isSeuJustino]);

  useEffect(() => {
    const loadTables = async () => {
      if (!selectedAreaId || !entry.preferred_date) {
        setTables([]);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/restaurant-tables/${selectedAreaId}/availability?date=${entry.preferred_date}`);
        if (res.ok) {
          const data = await res.json();
          let fetched: RestaurantTable[] = Array.isArray(data.tables) ? data.tables : [];

          // Verificar disponibilidade no horário específico
          if (entry.preferred_time && (isSeuJustino || isPracinha)) {
            try {
              const reservationsRes = await fetch(
                `${API_URL}/api/restaurant-reservations?reservation_date=${entry.preferred_date}&area_id=${selectedAreaId}${establishment?.id ? `&establishment_id=${establishment.id}` : ''}`
              );
              if (reservationsRes.ok) {
                const reservationsData = await reservationsRes.json();
                const allReservations = Array.isArray(reservationsData.reservations) 
                  ? reservationsData.reservations 
                  : [];
                const establishmentId = establishment?.id ? Number(establishment.id) : null;
                const reservationsForEstablishment = establishmentId
                  ? allReservations.filter((reservation: any) => {
                      if (reservation.establishment_id == null) return true;
                      return Number(reservation.establishment_id) === establishmentId;
                    })
                  : allReservations;
                
                const activeReservations = reservationsForEstablishment.filter((reservation: any) => {
                  const status = String(reservation.status || '').toUpperCase();
                  return status !== 'CANCELADA' && 
                         status !== 'CANCELADO' &&
                         status !== 'CANCEL' &&
                         status !== 'CANCELED' && 
                         status !== 'COMPLETED' &&
                         status !== 'FINALIZADA';
                });
                
                const hasTimeOverlap = (time1: string, time2: string) => {
                  const [h1, m1] = time1.split(':').map(Number);
                  const [h2, m2] = time2.split(':').map(Number);
                  const minutes1 = h1 * 60 + (isNaN(m1) ? 0 : m1);
                  const minutes2 = h2 * 60 + (isNaN(m2) ? 0 : m2);
                  const diff = Math.abs(minutes1 - minutes2);
                  return diff < 120;
                };
                
                const reservedTableNumbers = new Set<string>();
                activeReservations.forEach((reservation: any) => {
                  if (reservation.table_number && reservation.reservation_time) {
                    const reservationTime = String(reservation.reservation_time).substring(0, 5);
                    const preferredTime = String(entry.preferred_time).substring(0, 5);
                    
                    if (hasTimeOverlap(reservationTime, preferredTime)) {
                      const tables = String(reservation.table_number).split(',');
                      tables.forEach((table: string) => {
                        reservedTableNumbers.add(table.trim());
                      });
                    }
                  }
                });
                
                fetched = fetched.map(table => {
                  const isReservedByOverlap = reservedTableNumbers.has(String(table.table_number));
                  const shouldIgnoreEndpointReserved = isSeuJustino || isPracinha;
                  return {
                    ...table,
                    is_reserved: shouldIgnoreEndpointReserved
                      ? isReservedByOverlap
                      : (isReservedByOverlap || table.is_reserved)
                  };
                });
              }
            } catch (err) {
              console.error('Erro ao verificar disponibilidade:', err);
            }
          }

          // Se for Seu Justino e não houver mesas da API, criar mesas virtuais
          if (isSeuJustino && fetched.length === 0) {
            const sub = seuJustinoSubareas.find(s => s.area_id === Number(selectedAreaId));
            if (sub) {
              fetched = sub.tableNumbers.map((tableNum, index) => ({
                id: index + 1,
                area_id: sub.area_id,
                table_number: tableNum,
                capacity: sub.capacity || 4,
                is_reserved: false
              }));
            }
          }

          setTables(fetched);
        } else {
          // Se a API falhar mas for Seu Justino, criar mesas virtuais
          if (isSeuJustino) {
            const sub = seuJustinoSubareas.find(s => s.area_id === Number(selectedAreaId));
            if (sub) {
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
  }, [selectedAreaId, entry.preferred_date, entry.preferred_time, isSeuJustino, isPracinha, establishment?.id]);

  const handleConfirm = async () => {
    if (!selectedAreaId || !selectedTableNumber) {
      alert('Por favor, selecione uma área e uma mesa.');
      return;
    }
    
    const selectedTable = tables.find(t => String(t.table_number) === selectedTableNumber);
    if (selectedTable?.is_reserved) {
      alert('⚠️ Esta mesa está indisponível para este horário. Por favor, selecione outra mesa.');
      return;
    }
    
    setLoading(true);
    try {
      await onConfirm(Number(selectedAreaId), selectedTableNumber);
      onClose();
    } catch (error) {
      console.error('Erro ao alocar mesa:', error);
      alert('Erro ao alocar mesa. Tente novamente.');
    } finally {
      setLoading(false);
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
            className="bg-gray-800 rounded-lg w-full max-w-md"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Alocar em Mesa</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <MdClose size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Área */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MdLocationOn className="inline mr-2" />
                  Área *
                </label>
                <select
                  value={isSeuJustino ? selectedSubareaKey : selectedAreaId}
                  onChange={(e) => {
                    if (isSeuJustino) {
                      const key = e.target.value;
                      setSelectedSubareaKey(key);
                      const sub = seuJustinoSubareas.find(s => s.key === key);
                      setSelectedAreaId(sub ? String(sub.area_id) : '');
                    } else {
                      setSelectedAreaId(e.target.value);
                    }
                    setSelectedTableNumber(''); // Limpar mesa ao mudar área
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecione uma área</option>
                  {isSeuJustino
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

              {/* Mesa */}
              {selectedAreaId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdTableBar className="inline mr-2" />
                    Mesa *
                  </label>
                  <select
                    value={selectedTableNumber}
                    onChange={(e) => setSelectedTableNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecione uma mesa</option>
                    {tables.map((table) => (
                      <option 
                        key={table.id} 
                        value={table.table_number}
                        disabled={table.is_reserved}
                        style={{ color: table.is_reserved ? '#ef4444' : '#ffffff' }}
                      >
                        Mesa {table.table_number} {table.is_reserved ? '🔴 (Indisponível)' : '🟢 (Disponível)'}
                      </option>
                    ))}
                  </select>
                  
                  {selectedTableNumber && (() => {
                    const selectedTable = tables.find(t => String(t.table_number) === selectedTableNumber);
                    if (selectedTable?.is_reserved) {
                      return (
                        <div className="mt-2 p-3 bg-red-900/20 border-2 border-red-600/50 rounded-lg">
                          <p className="text-sm text-red-400 font-semibold">
                            ⚠️ Mesa {selectedTableNumber} indisponível para este horário
                          </p>
                        </div>
                      );
                    } else if (selectedTable) {
                      return (
                        <p className="mt-2 text-xs text-green-400">
                          ✅ Mesa {selectedTableNumber} disponível
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Botão de Alocar */}
              <div className="flex justify-end pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!selectedAreaId || !selectedTableNumber || loading}
                  className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <MdCheck size={20} />
                  {loading ? 'Alocando...' : 'Alocar'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
