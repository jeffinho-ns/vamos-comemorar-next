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
  MdCancel,
  MdEvent,
  MdElectricBolt
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa'; // <-- 1. IMPORTAÇÃO ADICIONADA
import { useUserPermissions } from '@/app/hooks/useUserPermissions';

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
  
  // Estado para múltiplas mesas (apenas admin)
  const { isAdmin } = useUserPermissions();
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [allowMultipleTables, setAllowMultipleTables] = useState(false);

  // 2. ESTADOS PARA OS CONTROLES DE NOTIFICAÇÃO ADICIONADOS
  const [sendEmailConfirmation, setSendEmailConfirmation] = useState(true);
  const [sendWhatsAppConfirmation, setSendWhatsAppConfirmation] = useState(true);
  
  // NOVO: Estado para tipo de evento (para reservas grandes)
  const [eventType, setEventType] = useState<'aniversario' | 'despedida' | 'outros' | 'lista_sexta' | ''>('');
  
  // Estados para vinculação de evento
  const [eventosDisponiveis, setEventosDisponiveis] = useState<any[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<string>('');
  
  // Estado para bloquear toda a área (apenas admin)
  const [blocksEntireArea, setBlocksEntireArea] = useState(false);
  
  // Estado para armazenar áreas bloqueadas para a data selecionada
  const [blockedAreas, setBlockedAreas] = useState<Set<number>>(new Set());

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

  // Subáreas específicas do Seu Justino (mapeadas para area_id base 1 ou 2)
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
  const isPracinha = establishment && (
    (establishment.name || '').toLowerCase().includes('pracinha')
  );

  const getMaxBirthdate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  };

  // Janelas de horário para Seu Justino e Pracinha do Seu Justino
  const getSeuJustinoTimeWindows = (dateStr: string) => {
    if (!dateStr) return [] as Array<{ start: string; end: string; label: string }>;
    const date = new Date(dateStr + 'T00:00:00');
    const weekday = date.getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
    const windows: Array<{ start: string; end: string; label: string }> = [];

    // Terça a Quinta (2, 3, 4): 18:00 às 01:00 (próximo dia)
    if (weekday >= 2 && weekday <= 4) {
      windows.push({ start: '18:00', end: '01:00', label: 'Terça a Quinta: 18:00–01:00' });
    }
    // Sexta e Sábado (5, 6): 18:00 às 03:30 (próximo dia)
    else if (weekday === 5 || weekday === 6) {
      windows.push({ start: '18:00', end: '03:30', label: 'Sexta e Sábado: 18:00–03:30' });
    }
    // Domingo (0): 12:00 às 21:00
    else if (weekday === 0) {
      windows.push({ start: '12:00', end: '21:00', label: 'Domingo: 12:00–21:00' });
    }

    return windows;
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
      
      // Se o horário de fim é menor que o de início, significa que cruza a meia-noite
      if (endMin < startMin) {
        // Horário válido se estiver após o início OU antes do fim (no próximo dia)
        return value >= startMin || value <= endMin;
      } else {
        // Horário normal (dentro do mesmo dia)
        return value >= startMin && value <= endMin;
      }
    });
  };

  // Função para determinar o giro de uma reserva (apenas para Seu Justino)
  const getGiroFromTime = (timeStr: string): '1º Giro' | '2º Giro' | null => {
    if (!isSeuJustino || !timeStr) return null;
    const [hours] = timeStr.split(':').map(Number);
    // 1º Giro: horário de início anterior às 20:00
    if (hours < 20) return '1º Giro';
    // 2º Giro: horário de início 20:00 ou posterior
    if (hours >= 20) return '2º Giro';
    return null;
  };

  // 3. USEEFFECT ATUALIZADO PARA CONTROLAR O PADRÃO DOS CHECKBOXES
  useEffect(() => {
    if (isOpen) {
      if (reservation) { // Modo de Edição
        // Verificar se table_number contém múltiplas mesas (separadas por vírgula)
        const tableNumberStr = String(reservation.table_number || '');
        const hasMultipleTables = tableNumberStr.includes(',');
        
        // Formatar data de nascimento se existir (formato pode ser YYYY-MM-DD ou ISO string)
        let formattedBirthDate = '';
        if (reservation.data_nascimento_cliente) {
          const birthDate = new Date(reservation.data_nascimento_cliente);
          if (!isNaN(birthDate.getTime())) {
            formattedBirthDate = birthDate.toISOString().split('T')[0];
          } else if (String(reservation.data_nascimento_cliente).match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedBirthDate = reservation.data_nascimento_cliente;
          }
        }
        
        // Formatar data da reserva se existir
        let formattedReservationDate = '';
        if (reservation.reservation_date) {
          const resDate = new Date(reservation.reservation_date);
          if (!isNaN(resDate.getTime())) {
            formattedReservationDate = resDate.toISOString().split('T')[0];
          } else if (String(reservation.reservation_date).match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedReservationDate = reservation.reservation_date;
          }
        }
        
        setFormData({
          client_name: reservation.client_name || '',
          client_phone: reservation.client_phone || '',
          client_email: reservation.client_email || '',
          data_nascimento_cliente: formattedBirthDate,
          reservation_date: formattedReservationDate || reservation.reservation_date || '',
          reservation_time: reservation.reservation_time || '',
          number_of_people: reservation.number_of_people || 1,
          area_id: reservation.area_id ? String(reservation.area_id) : '',
          table_number: hasMultipleTables ? '' : tableNumberStr, // Se múltiplas, limpar campo único
          status: reservation.status || 'NOVA',
          origin: reservation.origin || 'PESSOAL',
          notes: reservation.notes || ''
        });
        
        // Carregar blocks_entire_area se existir
        setBlocksEntireArea(reservation.blocks_entire_area === true || reservation.blocks_entire_area === 1);
        
        // Se tem múltiplas mesas, parsear e habilitar modo múltiplo
        if (hasMultipleTables && isAdmin) {
          const tablesArray = tableNumberStr.split(',').map(t => t.trim()).filter(t => t);
          setSelectedTables(tablesArray);
          setAllowMultipleTables(true);
        } else {
          setSelectedTables([]);
          setAllowMultipleTables(false);
        }
        
        // Desliga as notificações por padrão ao editar
        setSendEmailConfirmation(false);
        setSendWhatsAppConfirmation(false);
        
        // Se for Seu Justino ou Highline, tentar encontrar a subárea baseada na primeira mesa
        if (reservation.table_number && (isSeuJustino || isHighline)) {
          const tableNum = hasMultipleTables 
            ? tableNumberStr.split(',')[0].trim() 
            : String(reservation.table_number);
          const subareas = isSeuJustino ? seuJustinoSubareas : highlineSubareas;
          const foundSubarea = subareas.find(sub => sub.tableNumbers.includes(tableNum));
          if (foundSubarea) {
            setSelectedSubareaKey(foundSubarea.key);
          }
        }

        // Reserva Grande: carregar event_type da lista de convidados para exibir no select
        if (reservation.id && (reservation.number_of_people || 0) >= 4) {
          (async () => {
            try {
              const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
              const res = await fetch(`${API_URL}/api/restaurant-reservations/${reservation.id}/guest-list`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });
              if (res.ok) {
                const data = await res.json();
                const et = data.guest_list?.event_type;
                if (et === 'aniversario' || et === 'despedida' || et === 'outros' || et === 'lista_sexta') {
                  setEventType(et);
                } else {
                  setEventType('');
                }
              } else {
                setEventType('');
              }
            } catch {
              setEventType('');
            }
          })();
        } else {
          setEventType('');
        }
      } else { // Modo de Criação
        setEventType('');
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
        // Resetar bloqueio de área
        setBlocksEntireArea(false);
        setSelectedSubareaKey('');
      }
      setSelectedTables([]);
      setAllowMultipleTables(false);
      setErrors({});
    }
  }, [isOpen, reservation, selectedDate, selectedTime, isSeuJustino, isHighline]);

  useEffect(() => {
    const loadTables = async () => {
      if (!formData.area_id || !formData.reservation_date) {
        setTables([]);
        return;
      }
      try {
        const estIdForTables = establishment?.id ? Number(establishment.id) : null;
        const res = await fetch(
          `${API_URL}/api/restaurant-tables/${formData.area_id}/availability?date=${formData.reservation_date}${estIdForTables ? `&establishment_id=${estIdForTables}` : ''}`
        );
        if (res.ok) {
          const data = await res.json();
          let fetched: RestaurantTable[] = Array.isArray(data.tables) ? data.tables : [];

          // REGRA "2º GIRO" (SÁBADO 15:00–21:00) — Seu Justino (1) e Pracinha (8)
          // Neste período, o salão fica bloqueado: todas as mesas devem aparecer indisponíveis
          // e a reserva deve seguir como "Espera Antecipada (Bistrô)".
          const isSecondGiroSaturday = (() => {
            const estId = establishment?.id ? Number(establishment.id) : null;
            if (estId !== 1 && estId !== 8) return false;
            if (!formData.reservation_date || !formData.reservation_time) return false;
            const d = new Date(`${formData.reservation_date}T00:00:00`);
            if (d.getDay() !== 6) return false; // sábado
            const t = String(formData.reservation_time).slice(0, 5);
            const [h, m] = t.split(':').map(Number);
            if (Number.isNaN(h)) return false;
            const minutes = h * 60 + (Number.isNaN(m) ? 0 : m);
            return minutes >= 15 * 60 && minutes < 21 * 60;
          })();

          // IMPORTANTE (Justino/Pracinha):
          // O endpoint /restaurant-tables/:areaId/availability marca `is_reserved` para o DIA TODO
          // (se existir qualquer reserva na mesa no dia). Para Justino/Pracinha, precisamos
          // sempre calcular por SOBREPOSIÇÃO DE HORÁRIO no frontend. Então:
          // - Se ainda NÃO há horário selecionado, exibir TODAS como disponíveis (is_reserved=false)
          // - Quando houver horário, recalculamos abaixo por overlap.
          if ((isSeuJustino || isPracinha) && (!formData.reservation_time || String(formData.reservation_time).trim() === '')) {
            fetched = fetched.map(t => ({ ...t, is_reserved: false }));
          }
          
          // A. LÓGICA DE TRAVAMENTO "GIRO ÚNICO" NO DECK (EXCLUSIVO HIGHLINE)
          // Se for Highline e área Deck (area_id = 2), aplicar travamento de mesas
          if (isHighline && Number(formData.area_id) === 2) {
            // Buscar todas as reservas confirmadas da data para o Deck (area_id = 2)
            // Isso garante que qualquer mesa com reserva em qualquer horário apareça como reservada
            try {
              const reservationsRes = await fetch(
                `${API_URL}/api/restaurant-reservations?reservation_date=${formData.reservation_date}&area_id=${formData.area_id}&status=CONFIRMADA${establishment?.id ? `&establishment_id=${establishment.id}` : ''}`
              );
              if (reservationsRes.ok) {
                const reservationsData = await reservationsRes.json();
                const confirmedReservations = Array.isArray(reservationsData.reservations) 
                  ? reservationsData.reservations 
                  : [];
                
                // Criar um Set com os números das mesas que têm reserva confirmada em qualquer horário
                const reservedTableNumbers = new Set<string>();
                confirmedReservations.forEach((reservation: any) => {
                  if (reservation.table_number) {
                    // Mesas podem ser múltiplas (separadas por vírgula)
                    const tables = String(reservation.table_number).split(',');
                    tables.forEach((table: string) => {
                      reservedTableNumbers.add(table.trim());
                    });
                  }
                });
                
                // Marcar todas as mesas com reserva confirmada como is_reserved: true
                fetched = fetched.map(table => ({
                  ...table,
                  is_reserved: reservedTableNumbers.has(String(table.table_number)) || table.is_reserved
                }));
              }
            } catch (err) {
              console.error('Erro ao buscar reservas confirmadas para travamento:', err);
              // Em caso de erro, manter a lógica original por segurança
            }
          }
          
          if (isHighline && selectedSubareaKey) {
            const sub = highlineSubareas.find(s => s.key === selectedSubareaKey);
            if (sub) {
              fetched = fetched.filter(t => sub.tableNumbers.includes(String(t.table_number)));
            }
          }
          // Se for Seu Justino e houver subárea selecionada, filtra pelas mesas da subárea
          if (isSeuJustino && selectedSubareaKey) {
            const sub = seuJustinoSubareas.find(s => s.key === selectedSubareaKey);
            if (sub) {
              fetched = fetched.filter(t => sub.tableNumbers.includes(String(t.table_number)));
              // Se não houver mesas da API, cria mesas virtuais baseadas na subárea
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
          }
          
          // Verificar disponibilidade de mesas para Seu Justino e Pracinha (considerando horário)
          if ((isSeuJustino || isPracinha) && formData.reservation_time && formData.reservation_date && formData.area_id) {
            try {
              const reservationsRes = await fetch(
                `${API_URL}/api/restaurant-reservations?reservation_date=${formData.reservation_date}&area_id=${formData.area_id}${establishment?.id ? `&establishment_id=${establishment.id}` : ''}`
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
                
                // Função auxiliar para verificar sobreposição de horários
                const hasTimeOverlap = (time1: string, time2: string) => {
                  const [h1, m1] = time1.split(':').map(Number);
                  const [h2, m2] = time2.split(':').map(Number);
                  const minutes1 = h1 * 60 + (isNaN(m1) ? 0 : m1);
                  const minutes2 = h2 * 60 + (isNaN(m2) ? 0 : m2);
                  const diff = Math.abs(minutes1 - minutes2);
                  return diff < 120; // 2 horas em minutos
                };
                
                const reservedTableNumbers = new Set<string>();
                activeReservations.forEach((reservation: any) => {
                  if (reservation.table_number && reservation.reservation_time) {
                    const reservationTime = String(reservation.reservation_time).substring(0, 5);
                    const selectedTime = String(formData.reservation_time).substring(0, 5);
                    
                    if (hasTimeOverlap(reservationTime, selectedTime)) {
                      const tables = String(reservation.table_number).split(',');
                      tables.forEach((table: string) => {
                        reservedTableNumbers.add(table.trim());
                      });
                    }
                  }
                });
                
                // IMPORTANTE: Para Seu Justino/Pracinha, a disponibilidade é por SOBREPOSIÇÃO DE HORÁRIO.
                // Não podemos "herdar" `table.is_reserved` do endpoint de availability, pois ele bloqueia o dia todo.
                fetched = fetched.map(table => ({
                  ...table,
                  is_reserved: reservedTableNumbers.has(String(table.table_number))
                }));
              }
            } catch (err) {
              console.error('Erro ao verificar disponibilidade:', err);
            }
          }

          // Aplicar travamento total do 2º giro (Sábado 15–21) para Justino/Pracinha
          if (isSecondGiroSaturday) {
            fetched = fetched.map(t => ({ ...t, is_reserved: true }));
            // Garantir que não fique nenhuma mesa selecionada
            if (formData.table_number) handleInputChange('table_number', '');
            if (selectedTables.length) setSelectedTables([]);
          }
          
          setTables(fetched);
        } else {
          // Se a API falhar mas houver subárea selecionada (Seu Justino ou Highline), criar mesas virtuais
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
              // 2º giro: marcar tudo indisponível mesmo nas mesas virtuais
              const estId = establishment?.id ? Number(establishment.id) : null;
              const d = formData.reservation_date ? new Date(`${formData.reservation_date}T00:00:00`) : null;
              const t = String(formData.reservation_time || '').slice(0, 5);
              const [hh, mm] = t.split(':').map(Number);
              const minutes = (Number.isNaN(hh) ? 0 : hh * 60) + (Number.isNaN(mm) ? 0 : mm);
              const isSecondGiro = (estId === 1 || estId === 8) && d && d.getDay() === 6 && minutes >= 15 * 60 && minutes < 21 * 60;
              setTables(isSecondGiro ? virtualTables.map(v => ({ ...v, is_reserved: true })) : virtualTables);
            } else {
              setTables([]);
            }
          } else {
            setTables([]);
          }
        }
      } catch (e) {
        console.error('Erro ao carregar mesas (admin):', e);
        // Em caso de erro, se houver subárea selecionada, criar mesas virtuais
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
    };
    loadTables();
  }, [formData.area_id, formData.reservation_date, selectedSubareaKey, isHighline, isSeuJustino, establishment?.id]);

  // Buscar áreas bloqueadas para a data selecionada
  useEffect(() => {
    const loadBlockedAreas = async () => {
      if (!formData.reservation_date) {
        setBlockedAreas(new Set());
        return;
      }
      
      // Garantir que a data está no formato correto (YYYY-MM-DD)
      const selectedDate = formData.reservation_date;
      if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        setBlockedAreas(new Set());
        return;
      }
      
      try {
        const res = await fetch(
          `${API_URL}/api/restaurant-reservations?reservation_date=${selectedDate}&include_cancelled=false`
        );
        if (res.ok) {
          const data = await res.json();
          const reservations = Array.isArray(data.reservations) ? data.reservations : [];
          
          // Filtrar reservas que bloqueiam toda a área E que são para a data específica
          const blockedAreaIds = new Set<number>();
          reservations.forEach((reservation: any) => {
            // Verificar se a reserva bloqueia toda a área
            if (reservation.blocks_entire_area === true || reservation.blocks_entire_area === 1) {
              // Verificar se a data da reserva corresponde à data selecionada
              let reservationDate = '';
              if (reservation.reservation_date) {
                if (typeof reservation.reservation_date === 'string') {
                  // Se já está no formato YYYY-MM-DD, usar diretamente
                  if (/^\d{4}-\d{2}-\d{2}$/.test(reservation.reservation_date)) {
                    reservationDate = reservation.reservation_date;
                  } else {
                    // Se for uma data ISO, converter para YYYY-MM-DD
                    const date = new Date(reservation.reservation_date);
                    if (!isNaN(date.getTime())) {
                      reservationDate = date.toISOString().split('T')[0];
                    }
                  }
                }
              }
              
              // Só adicionar se a data da reserva corresponder à data selecionada
              if (reservationDate === selectedDate && reservation.area_id) {
                blockedAreaIds.add(Number(reservation.area_id));
              }
            }
          });
          
          setBlockedAreas(blockedAreaIds);
        } else {
          setBlockedAreas(new Set());
        }
      } catch (e) {
        console.error('Erro ao carregar áreas bloqueadas:', e);
        setBlockedAreas(new Set());
      }
    };
    loadBlockedAreas();
  }, [formData.reservation_date]);

  // Buscar eventos disponíveis para a data selecionada
  useEffect(() => {
    const loadEventos = async () => {
      if (!establishment?.id || !formData.reservation_date) {
        setEventosDisponiveis([]);
        return;
      }
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(
          `${API_URL}/api/v1/eventos?establishment_id=${establishment.id}&data_evento=${formData.reservation_date}&tipo_evento=unico`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setEventosDisponiveis(data.eventos || []);
        } else {
          setEventosDisponiveis([]);
        }
      } catch (e) {
        console.error('Erro ao carregar eventos:', e);
        setEventosDisponiveis([]);
      }
    };
    loadEventos();
  }, [establishment?.id, formData.reservation_date]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    // 18+ (apenas se fornecido)
    if (formData.data_nascimento_cliente) {
      const bd = new Date(formData.data_nascimento_cliente + 'T00:00:00');
      const today = new Date();
      const eighteen = new Date(today);
      eighteen.setFullYear(today.getFullYear() - 18);
      if (bd > eighteen) {
        newErrors.data_nascimento_cliente = 'Somente maiores de 18 anos podem reservar.';
      }
    }


    if (!formData.client_name || !formData.client_name.trim()) {
      newErrors.client_name = 'Nome do cliente é obrigatório';
    }
    if (!formData.reservation_date) {
      newErrors.reservation_date = 'Data da reserva é obrigatória';
    }
    if (!formData.reservation_time) {
      newErrors.reservation_time = 'Horário da reserva é obrigatório';
    }
    
    // Validação de horário para Highline (apenas para não-admins)
    if (isHighline && formData.reservation_time && formData.reservation_date && !isAdmin) {
      const windows = getHighlineTimeWindows(formData.reservation_date, selectedSubareaKey);
      if (windows.length > 0 && !isTimeWithinWindows(formData.reservation_time, windows)) {
        newErrors.reservation_time = 'Horário fora do funcionamento. Consulte os horários disponíveis abaixo.';
      }
    }
    
    // Validação de horário para Seu Justino e Pracinha do Seu Justino (apenas para não-admins)
    if ((isSeuJustino || isPracinha) && formData.reservation_time && formData.reservation_date && !isAdmin) {
      const windows = getSeuJustinoTimeWindows(formData.reservation_date);
      if (windows.length > 0 && !isTimeWithinWindows(formData.reservation_time, windows)) {
        newErrors.reservation_time = 'Horário fora do funcionamento. Consulte os horários disponíveis abaixo.';
      }
    }
    
    // Validação específica para Highline e Seu Justino (precisam de subárea)
    if (isHighline || isSeuJustino) {
      if (!selectedSubareaKey) {
        newErrors.area_id = 'Selecione uma área';
      } else {
        // Garantir que o area_id está definido baseado na subárea
        const subareas = isHighline ? highlineSubareas : seuJustinoSubareas;
        const sub = subareas.find(s => s.key === selectedSubareaKey);
        if (sub) {
          // Atualizar o area_id no formData baseado na subárea selecionada
          if (!formData.area_id || formData.area_id !== String(sub.area_id)) {
            handleInputChange('area_id', String(sub.area_id));
          }
        }
      }
    } else {
      // Para outros estabelecimentos, validar area_id normalmente
      if (!formData.area_id) {
        newErrors.area_id = 'Área é obrigatória';
      }
    }
    if (formData.number_of_people < 1) {
      newErrors.number_of_people = 'Número de pessoas deve ser maior que 0';
    }
    const isLargeReservation = formData.number_of_people >= 4;
    const hasOptions = tables && tables.length > 0;
    const hasCompatible = tables.some(t => !t.is_reserved && t.capacity >= formData.number_of_people);

    // 2º giro (Sábado 15–21) para Justino/Pracinha: NÃO exigir mesa (vai para espera antecipada/bistrô)
    const isSecondGiroSaturday = (() => {
      const estId = establishment?.id ? Number(establishment.id) : null;
      if (estId !== 1 && estId !== 8) return false;
      if (!formData.reservation_date || !formData.reservation_time) return false;
      const d = new Date(`${formData.reservation_date}T00:00:00`);
      if (d.getDay() !== 6) return false;
      const t = String(formData.reservation_time).slice(0, 5);
      const [h, m] = t.split(':').map(Number);
      const minutes = (Number.isNaN(h) ? 0 : h * 60) + (Number.isNaN(m) ? 0 : m);
      return minutes >= 15 * 60 && minutes < 21 * 60;
    })();
    
    // Se múltiplas mesas estão habilitadas, validar se pelo menos uma foi selecionada
    if (allowMultipleTables && isAdmin) {
      if (!isSecondGiroSaturday && selectedTables.length === 0 && hasOptions && hasCompatible) {
        newErrors.table_number = 'Selecione pelo menos uma mesa disponível';
      }
    } else if (!isSecondGiroSaturday && !isLargeReservation && hasOptions && hasCompatible && !formData.table_number && selectedTables.length === 0) {
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

    // Processar mesas: se múltiplas mesas foram selecionadas, concatenar
    let finalTableNumber: string | undefined = formData.table_number?.trim() || undefined;
    let finalNotes = formData.notes;
    
    if (allowMultipleTables && isAdmin && selectedTables.length > 0) {
      // Concatenar mesas selecionadas sem espaços após vírgula (ex: "1,2" em vez de "1, 2")
      finalTableNumber = selectedTables.join(',');
      
      // Adicionar observação automática sobre múltiplas mesas
      const mesaText = selectedTables.length === 1 ? 'mesa' : 'mesas';
      const observacaoMesas = `${selectedTables.length} ${mesaText} reservadas para esta reserva (${selectedTables.join(', ')})`;
      
      if (finalNotes && finalNotes.trim()) {
        finalNotes = `${observacaoMesas}\n\n${finalNotes}`;
      } else {
        finalNotes = observacaoMesas;
      }
    }
    
    // Verificar se o horário está fora da janela disponível e adicionar observação automática (apenas para admins)
    if (isAdmin && formData.reservation_time && formData.reservation_date) {
      let isOutsideWindow = false;
      
      if (isHighline) {
        const windows = getHighlineTimeWindows(formData.reservation_date, selectedSubareaKey);
        if (windows.length > 0 && !isTimeWithinWindows(formData.reservation_time, windows)) {
          isOutsideWindow = true;
        }
      } else if (isSeuJustino || isPracinha) {
        const windows = getSeuJustinoTimeWindows(formData.reservation_date);
        if (windows.length > 0 && !isTimeWithinWindows(formData.reservation_time, windows)) {
          isOutsideWindow = true;
        }
      }
      
      if (isOutsideWindow) {
        const observacaoForaHorario = 'ADMIN autoriza que a reserva foi feita fora do horário das reservas disponíveis.';
        
        if (finalNotes && finalNotes.trim()) {
          // Verificar se a observação já não foi adicionada (para evitar duplicação)
          if (!finalNotes.includes(observacaoForaHorario)) {
            finalNotes = `${observacaoForaHorario}\n\n${finalNotes}`;
          }
        } else {
          finalNotes = observacaoForaHorario;
        }
      }
    }

    // Se não há mesa selecionada e não é obrigatório, enviar undefined
    if (!finalTableNumber || finalTableNumber.trim() === '') {
      finalTableNumber = undefined;
    }

    // Garantir que number_of_people seja um número válido
    const number_of_people = Number(formData.number_of_people) || 1;
    
    // Garantir que o horário esteja no formato HH:mm:ss
    let reservation_time = formData.reservation_time;
    if (reservation_time && reservation_time.split(':').length === 2) {
      reservation_time = `${reservation_time}:00`;
    }

    // Para Highline e Seu Justino, garantir que uma subárea foi selecionada e area_id está definido
    let finalAreaId = formData.area_id;
    
    if (isHighline || isSeuJustino) {
      if (!selectedSubareaKey) {
        throw new Error('Selecione uma área para criar a reserva');
      }
      
      const subareas = isHighline ? highlineSubareas : seuJustinoSubareas;
      const sub = subareas.find(s => s.key === selectedSubareaKey);
      
      if (!sub) {
        throw new Error('Subárea selecionada não encontrada');
      }
      
      // Usar o area_id da subárea selecionada
      finalAreaId = String(sub.area_id);
    }
    
    // Garantir que area_id seja um número válido (obrigatório para a API)
    if (!finalAreaId || finalAreaId === '' || finalAreaId === '0') {
      throw new Error('Área é obrigatória para criar a reserva');
    }
    const area_id = Number(finalAreaId);
    
    // Validação de mesa ocupada para Seu Justino e Pracinha
    if ((isSeuJustino || isPracinha) && finalTableNumber && formData.reservation_time && formData.reservation_date) {
      try {
        const reservationsRes = await fetch(
          `${API_URL}/api/restaurant-reservations?reservation_date=${formData.reservation_date}&area_id=${area_id}${establishment?.id ? `&establishment_id=${establishment.id}` : ''}`
        );
        if (reservationsRes.ok) {
          const reservationsData = await reservationsRes.json();
          const allReservations = Array.isArray(reservationsData.reservations) 
            ? reservationsData.reservations 
            : [];
          
          const activeReservations = allReservations.filter((reservation: any) => {
            const status = String(reservation.status || '').toUpperCase();
            return status !== 'CANCELADA' && 
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
          
          const selectedTime = String(formData.reservation_time).substring(0, 5);
          const tableNumbers = finalTableNumber.split(',').map(t => t.trim());
          
          const isTableOccupied = tableNumbers.some(tableNum => {
            return activeReservations.some((reservation: any) => {
              if (!reservation.table_number || !reservation.reservation_time) return false;
              const reservationTables = String(reservation.table_number).split(',').map(t => t.trim());
              const reservationTime = String(reservation.reservation_time).substring(0, 5);
              return reservationTables.includes(tableNum) && hasTimeOverlap(reservationTime, selectedTime);
            });
          });
          
          if (isTableOccupied) {
            const shouldAddToWaitlist = confirm(
              `⚠️ A mesa ${finalTableNumber} já está reservada para este horário.\n\n` +
              `Deseja adicionar este cliente à Lista de Espera?`
            );
            if (shouldAddToWaitlist) {
              // Fechar modal de reserva e abrir modal de lista de espera
              setLoading(false);
              onClose();
              // Disparar evento ou callback para abrir lista de espera
              // Por enquanto, apenas alerta
              alert('Por favor, adicione o cliente à Lista de Espera através da aba "Lista de Espera".');
              return;
            } else {
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Erro ao verificar disponibilidade:', err);
      }
    }
    
    if (isNaN(area_id) || area_id <= 0) {
      throw new Error('Área inválida. Selecione uma área válida.');
    }
    
    // Garantir que establishment_id seja sempre enviado (obrigatório para a API)
    if (!establishment?.id) {
      throw new Error('Estabelecimento é obrigatório para criar a reserva');
    }
    const establishment_id = Number(establishment.id);

    // Validar todos os campos obrigatórios antes de criar o payload
    const client_name = formData.client_name?.trim() || '';
    console.log('🔍 [ReservationModal] Validando client_name:', {
      original: formData.client_name,
      trimmed: client_name,
      isEmpty: !client_name || client_name === '',
      formData: formData
    });
    
    if (!client_name || client_name === '') {
      console.error('❌ [ReservationModal] client_name está vazio ou ausente');
      throw new Error('Nome do cliente é obrigatório');
    }
    
    if (!formData.reservation_date) {
      throw new Error('Data da reserva é obrigatória');
    }
    
    if (!reservation_time) {
      throw new Error('Horário da reserva é obrigatório');
    }
    
    if (!number_of_people || number_of_people < 1) {
      throw new Error('Número de pessoas deve ser maior que 0');
    }

    // REGRA DE SÁBADO: Verificar se é sábado entre 15h-21h para Seu Justino ou Pracinha
    const isSeuJustinoId = establishment_id === 1;
    const isPracinhaId = establishment_id === 8;
    let isEsperaAntecipadaModal = false;
    let finalTableNumberModal: string | undefined = finalTableNumber;
    let finalNotesModal = finalNotes;
    
    if ((isSeuJustinoId || isPracinhaId) && formData.reservation_date && reservation_time) {
      const reservationDate = new Date(`${formData.reservation_date}T00:00:00`);
      const dayOfWeek = reservationDate.getDay(); // Domingo = 0, Sábado = 6
      const [hours, minutes] = reservation_time.split(':').map(Number);
      const reservationHour = hours + (isNaN(minutes) ? 0 : minutes / 60);
      
      // Sábado (6) entre 15h e 21h
      if (dayOfWeek === 6 && reservationHour >= 15 && reservationHour < 21) {
        isEsperaAntecipadaModal = true;
        // Adicionar nota se não existir
        if (!finalNotesModal || !finalNotesModal.includes('ESPERA ANTECIPADA')) {
          finalNotesModal = (finalNotesModal ? finalNotesModal + ' | ' : '') + 'ESPERA ANTECIPADA (Bistrô)';
        }
        // Não atribuir mesa para espera antecipada (não desconta da contagem)
        finalTableNumberModal = undefined;
      }
    }

    const payload: any = {
      client_name: client_name,
      client_phone: formData.client_phone?.trim() || null,
      client_email: formData.client_email?.trim() || null,
      data_nascimento_cliente: formData.data_nascimento_cliente || null,
      reservation_date: formData.reservation_date,
      reservation_time: reservation_time,
      number_of_people: number_of_people,
      area_id: area_id,
      table_number: finalTableNumberModal || undefined,
      status: formData.status || 'NOVA',
      origin: 'PESSOAL', // Sempre 'PESSOAL' para reservas criadas por admin (permite mesas virtuais)
      notes: finalNotesModal || null,
      created_by: 1, // ID do usuário admin padrão
      establishment_id: establishment_id,
      evento_id: eventoSelecionado || null,
      send_email: sendEmailConfirmation,
      send_whatsapp: sendWhatsAppConfirmation,
      blocks_entire_area: blocksEntireArea && isAdmin, // Apenas admin pode bloquear área completa
      espera_antecipada: isEsperaAntecipadaModal,
      // Para espera antecipada, registrar como bistrô (fila)
      has_bistro_table: isEsperaAntecipadaModal
    };

    // Área exibida ao cliente (email, etc.): subárea (ex. Lounge Aquário TV) ou nome da área
    let areaDisplayName: string | null = null;
    if (isHighline || isSeuJustino) {
      if (selectedSubareaKey) {
        const sub = isHighline
          ? highlineSubareas.find(s => s.key === selectedSubareaKey)
          : seuJustinoSubareas.find(s => s.key === selectedSubareaKey);
        if (sub?.label) areaDisplayName = sub.label;
      }
    } else if (areas.length && formData.area_id) {
      const ar = areas.find((a: { id: number }) => Number(a.id) === Number(formData.area_id));
      if (ar && (ar as { name?: string }).name) areaDisplayName = (ar as { name: string }).name;
    }
    if (areaDisplayName) payload.area_display_name = areaDisplayName;
    
    // Remover campos undefined para evitar problemas na serialização JSON
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    // Log do payload para debug
    console.log('📤 Payload sendo enviado:', JSON.stringify(payload, null, 2));
    console.log('📤 Detalhes do payload:', {
      table_number: payload.table_number,
      hasMultipleTables: allowMultipleTables && isAdmin && selectedTables.length > 0,
      selectedTables: selectedTables,
      area_id: payload.area_id,
      establishment_id: payload.establishment_id
    });

    // Adicionar event_type para Reserva Grande (prioridade: seleção do usuário > regras automáticas > outros)
    if (formData.number_of_people >= 4) {
      if (eventType) {
        payload.event_type = eventType;
      } else if (!reservation) {
        // Só aplicar regras automáticas ao criar; ao editar, não enviar = preservar valor atual
        const reservationDate = new Date(`${formData.reservation_date}T00:00:00`);
        const dayOfWeek = reservationDate.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
        const isHighLine = establishment?.id === 1;
        if (isWeekend && isHighLine) {
          payload.event_type = 'aniversario';
        } else if (dayOfWeek === 5) {
          payload.event_type = 'lista_sexta';
        } else {
          payload.event_type = 'outros';
        }
      }
    }

    try {
      console.log('🔍 [ReservationModal] Validação final antes de enviar:', {
        client_name: payload.client_name,
        client_name_length: payload.client_name?.length,
        client_name_type: typeof payload.client_name,
        client_name_valid: !!payload.client_name && payload.client_name.trim() !== '',
        reservation_date: payload.reservation_date,
        reservation_time: payload.reservation_time,
        number_of_people: payload.number_of_people,
        area_id: payload.area_id,
        area_id_type: typeof payload.area_id,
        establishment_id: payload.establishment_id,
        establishment_id_type: typeof payload.establishment_id,
        table_number: payload.table_number,
        origin: payload.origin
      });
      
      console.log('📤 [ReservationModal] Payload completo sendo enviado para onSave:', JSON.stringify(payload, null, 2));
      
      // Validação final crítica antes de chamar onSave
      if (!payload.client_name || typeof payload.client_name !== 'string' || payload.client_name.trim() === '') {
        console.error('❌ [ReservationModal] ERRO CRÍTICO: client_name inválido no payload final:', payload);
        throw new Error('Nome do cliente é obrigatório e não pode estar vazio.');
      }
      
      // Verificar se mesa está ocupada no mesmo giro (apenas para Seu Justino aos sábados)
      if (isSeuJustino && finalTableNumber && formData.reservation_date && reservation_time) {
        const reservationDate = new Date(formData.reservation_date);
        const isSaturday = reservationDate.getDay() === 6; // 6 = Sábado
        
        if (isSaturday) {
          try {
            // Buscar reservas existentes para a mesma mesa, data e verificar giro
            const checkReservationsResponse = await fetch(
              `${API_URL}/api/restaurant-reservations?reservation_date=${formData.reservation_date}&table_number=${finalTableNumber}&status=CONFIRMADA${establishment?.id ? `&establishment_id=${establishment.id}` : ''}`
            );
            
            if (checkReservationsResponse.ok) {
              const checkData = await checkReservationsResponse.json();
              const existingReservations = Array.isArray(checkData.reservations) ? checkData.reservations : [];
              
              // Verificar se há reserva no mesmo giro
              const giro = getGiroFromTime(reservation_time);
              const hasConflict = existingReservations.some((r: any) => {
                if (r.status === 'CANCELADA' || r.status === 'canceled' || r.status === 'completed') return false;
                const rGiro = getGiroFromTime(r.reservation_time || '');
                return giro && rGiro && giro === rGiro;
              });
              
              if (hasConflict) {
                const addToWaitlist = confirm(
                  `⚠️ A Mesa ${finalTableNumber} já está ocupada no ${giro} (${formData.reservation_date}).\n\n` +
                  `Deseja adicionar este cliente à Lista de Espera?`
                );
                
                if (addToWaitlist) {
                  // Fechar modal de reserva e retornar um sinal para abrir lista de espera
                  onClose();
                  // Lançar um evento customizado ou retornar um código especial
                  // Por enquanto, apenas fechar e deixar o admin adicionar manualmente
                  alert('Por favor, adicione o cliente à Lista de Espera através da aba "Lista de Espera".');
                  return;
                } else {
                  // Usuário escolheu continuar mesmo assim (admin pode forçar)
                  console.log('Admin escolheu continuar mesmo com conflito de giro');
                }
              }
            }
          } catch (checkError) {
            console.error('Erro ao verificar conflitos de giro:', checkError);
            // Continuar mesmo se houver erro na verificação
          }
        }
      }
      
      await onSave(payload);
      onClose();
    } catch (error: any) {
      console.error('❌ Erro ao salvar reserva:', error);
      console.error('❌ Mensagem de erro:', error?.message);
      console.error('❌ Stack:', error?.stack);
      // Mostrar erro para o usuário
      alert(`Erro ao salvar reserva: ${error?.message || 'Erro desconhecido'}`);
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

  // C. FUNÇÃO DE LIBERAÇÃO MANUAL (APENAS ADMIN, EXCLUSIVO HIGHLINE DECK)
  const handleForceReleaseTable = async (tableNumber: string) => {
    // Validação de segurança: apenas admin, Highline e Deck (area_id = 2)
    if (!isAdmin || !isHighline || Number(formData.area_id) !== 2) {
      alert('Operação não permitida.');
      return;
    }

    // Confirmação do usuário
    const confirmed = confirm('Deseja liberar esta mesa manualmente para venda imediata?');
    if (!confirmed) {
      return;
    }

    if (!formData.reservation_date || !tableNumber) {
      alert('Data ou número da mesa não informado.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(
        `${API_URL}/api/restaurant-tables/${tableNumber}/force-available?date=${formData.reservation_date}&area_id=${formData.area_id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );

      if (res.ok) {
        // Recarregar mesas após liberação
        const loadTablesRes = await fetch(
          `${API_URL}/api/restaurant-tables/${formData.area_id}/availability?date=${formData.reservation_date}`
        );
        if (loadTablesRes.ok) {
          const data = await loadTablesRes.json();
          let fetched: RestaurantTable[] = Array.isArray(data.tables) ? data.tables : [];
          
          // Reaplicar travamento de mesas
          if (isHighline && Number(formData.area_id) === 2) {
            try {
              const reservationsRes = await fetch(
                `${API_URL}/api/restaurant-reservations?reservation_date=${formData.reservation_date}&area_id=${formData.area_id}&status=CONFIRMADA${establishment?.id ? `&establishment_id=${establishment.id}` : ''}`
              );
              if (reservationsRes.ok) {
                const reservationsData = await reservationsRes.json();
                const confirmedReservations = Array.isArray(reservationsData.reservations) 
                  ? reservationsData.reservations 
                  : [];
                
                const reservedTableNumbers = new Set<string>();
                confirmedReservations.forEach((reservation: any) => {
                  if (reservation.table_number) {
                    const tables = String(reservation.table_number).split(',');
                    tables.forEach((table: string) => {
                      reservedTableNumbers.add(table.trim());
                    });
                  }
                });
                
                fetched = fetched.map(table => ({
                  ...table,
                  is_reserved: reservedTableNumbers.has(String(table.table_number)) || table.is_reserved
                }));
              }
            } catch (err) {
              console.error('Erro ao buscar reservas confirmadas:', err);
            }
          }
          
          if (isHighline && selectedSubareaKey) {
            const sub = highlineSubareas.find(s => s.key === selectedSubareaKey);
            if (sub) {
              fetched = fetched.filter(t => sub.tableNumbers.includes(String(t.table_number)));
            }
          }
          
          setTables(fetched);
        }
        
        alert('Mesa liberada com sucesso!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao liberar mesa');
      }
    } catch (error: any) {
      console.error('Erro ao liberar mesa:', error);
      alert(`Erro ao liberar mesa: ${error.message || 'Erro desconhecido'}`);
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
                  
                  {formData.number_of_people >= 4 && (
                    <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-800">
                        <MdPeople className="text-orange-600" />
                        <span className="text-sm font-medium">
                          {(() => {
                            if (formData.reservation_date && establishment?.id === 1) {
                              const reservationDate = new Date(`${formData.reservation_date}T00:00:00`);
                              const dayOfWeek = reservationDate.getDay();
                              const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
                              if (isWeekend) {
                                return "🎂 Aniversário Detectado - Lista de Convidados";
                              }
                            }
                            return "Reserva Grande - Lista de Convidados";
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-orange-700 mt-1 mb-3">
                        ✅ Uma lista de convidados será gerada automaticamente para compartilhamento.<br/>
                        📍 Você pode selecionar uma mesa específica ou deixar em branco.<br/>
                        🔗 O cliente receberá um link para convidar seus amigos.
                      </p>
                      
                      {/* Seletor de tipo de evento */}
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-orange-800 mb-1">
                          Tipo de Evento (Opcional)
                        </label>
                        <select
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value as 'aniversario' | 'despedida' | 'outros' | 'lista_sexta' | '')}
                          className="w-full px-2 py-1 text-sm bg-white border border-orange-300 rounded text-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Selecione (opcional)</option>
                          <option value="aniversario">Aniversário</option>
                          <option value="despedida">Despedida</option>
                          <option value="lista_sexta">Lista Sexta</option>
                          <option value="outros">Outros</option>
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
                              {isAdmin && (
                                <div className="mt-2 text-amber-300 font-medium">
                                  ⚠️ Admin: Você pode criar reservas fora do horário disponível.
                                </div>
                              )}
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
                            {isAdmin && (
                              <div className="mt-2 text-amber-300 font-medium">
                                ⚠️ Admin: Você pode criar reservas fora do horário disponível.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {(isSeuJustino || isPracinha) && formData.reservation_date && (
                    <div className="mt-2 text-xs text-gray-300">
                      {(() => {
                        const windows = getSeuJustinoTimeWindows(formData.reservation_date);
                        if (windows.length === 0) {
                          return (
                            <div className="p-2 bg-red-900/20 border border-red-600/40 rounded">
                              Reservas fechadas para este dia.
                              {isAdmin && (
                                <div className="mt-2 text-amber-300 font-medium">
                                  ⚠️ Admin: Você pode criar reservas fora do horário disponível.
                                </div>
                              )}
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
                            {isAdmin && (
                              <div className="mt-2 text-amber-300 font-medium">
                                ⚠️ Admin: Você pode criar reservas fora do horário disponível.
                              </div>
                            )}
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
                    value={(isHighline || isSeuJustino) ? selectedSubareaKey : formData.area_id}
                    onChange={(e) => {
                      if (isHighline || isSeuJustino) {
                        const key = e.target.value;
                        setSelectedSubareaKey(key);
                        const sub = isHighline 
                          ? highlineSubareas.find(s => s.key === key)
                          : seuJustinoSubareas.find(s => s.key === key);
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
                      ? highlineSubareas
                          .filter(s => !blockedAreas.has(s.area_id))
                          .map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))
                      : isSeuJustino
                      ? seuJustinoSubareas
                          .filter(s => !blockedAreas.has(s.area_id))
                          .map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))
                      : areas
                          .filter(area => !blockedAreas.has(area.id))
                          .map((area) => (
                            <option key={area.id} value={area.id}>
                              {area.name}
                            </option>
                          ))}
                  </select>
                  {errors.area_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.area_id}</p>
                  )}
                  {blockedAreas.size > 0 && (
                    <p className="text-xs text-amber-400 mt-1">
                      ⚠️ Algumas áreas estão bloqueadas para esta data e não estão disponíveis para reserva.
                    </p>
                  )}
                </div>

                {/* Restaurant Table - Admin pode escolher mesa mesmo em reservas grandes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdTableBar className="inline mr-2" />
                    Mesa {formData.number_of_people >= 4 && <span className="text-orange-400">(Opcional para Reserva Grande)</span>}
                  </label>
                  
                  {/* Checkbox para permitir múltiplas mesas (apenas admin) */}
                  {isAdmin && (formData.area_id || selectedSubareaKey || tables.length > 0 || reservation?.table_number) && (
                    <div className="mb-2">
                      <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-sm">
                        <input
                          type="checkbox"
                          checked={allowMultipleTables}
                          onChange={(e) => {
                            setAllowMultipleTables(e.target.checked);
                            if (!e.target.checked) {
                              setSelectedTables([]);
                              handleInputChange('table_number', '');
                            }
                          }}
                          className="w-4 h-4 bg-gray-600 border-gray-500 rounded text-orange-500 focus:ring-orange-600"
                        />
                        <span>Reservar múltiplas mesas (apenas admin)</span>
                      </label>
                      {reservation?.table_number && reservation.table_number.includes(',') && (
                        <p className="text-xs text-blue-400 mt-1">
                          Mesas atualmente selecionadas: {reservation.table_number}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {allowMultipleTables && isAdmin ? (
                    // Seleção múltipla de mesas (apenas admin)
                    <div className="space-y-2">
                      <div className="max-h-48 overflow-y-auto border border-gray-600 rounded-lg bg-gray-800 p-2">
                        {(() => {
                          let availableTables: RestaurantTable[] = [];
                          
                          if ((isSeuJustino || isHighline) && selectedSubareaKey && tables.length === 0) {
                            const sub = isSeuJustino 
                              ? seuJustinoSubareas.find(s => s.key === selectedSubareaKey)
                              : highlineSubareas.find(s => s.key === selectedSubareaKey);
                            if (sub) {
                              availableTables = sub.tableNumbers.map((tableNum, index) => ({
                                id: index + 1,
                                area_id: sub.area_id,
                                table_number: tableNum,
                                capacity: isSeuJustino && (sub as any).capacity ? (sub as any).capacity : 4,
                                is_reserved: false
                              }));
                            }
                          } else {
                            availableTables = tables.filter(t => {
                              if (formData.number_of_people >= 4) {
                                return !t.is_reserved;
                              }
                              return !t.is_reserved && t.capacity >= formData.number_of_people;
                            });
                          }
                          
                          return availableTables.map(t => (
                            <label key={t.id} className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTables.includes(t.table_number)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTables([...selectedTables, t.table_number]);
                                  } else {
                                    setSelectedTables(selectedTables.filter(tn => tn !== t.table_number));
                                  }
                                }}
                                className="w-4 h-4 bg-gray-600 border-gray-500 rounded text-orange-500 focus:ring-orange-600"
                              />
                              <span className="text-white text-sm">
                                Mesa {t.table_number} • {t.capacity} lugares{t.table_type ? ` • ${t.table_type}` : ''}
                              </span>
                            </label>
                          ));
                        })()}
                      </div>
                      {selectedTables.length > 0 && (
                        <div className="mt-2 p-2 bg-green-900/20 border border-green-600/40 rounded">
                          <p className="text-xs text-green-400 font-medium mb-1">
                            ✓ {selectedTables.length} mesa{selectedTables.length > 1 ? 's' : ''} selecionada{selectedTables.length > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-green-300">
                            Mesas: {selectedTables.join(', ')}
                          </p>
                        </div>
                      )}
                      {!allowMultipleTables && reservation?.table_number && reservation.table_number.includes(',') && (
                        <div className="mt-2 p-2 bg-blue-900/20 border border-blue-600/40 rounded">
                          <p className="text-xs text-blue-400 font-medium mb-1">
                            ℹ️ Esta reserva possui múltiplas mesas
                          </p>
                          <p className="text-xs text-blue-300">
                            Mesas: {reservation.table_number}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Marque "Reservar múltiplas mesas" para editar a seleção
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (tables.length > 0 || (isSeuJustino && selectedSubareaKey) || (isHighline && selectedSubareaKey)) ? (
                    <>
                      <select
                        value={formData.table_number}
                        onChange={(e) => handleInputChange('table_number', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          errors.table_number ? 'border-red-500' : 'border-gray-600'
                        }`}
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
                                  Mesa {tableNum} • {isSeuJustino && (sub as any).capacity ? `${(sub as any).capacity} lugares` : '4 lugares'}
                                </option>
                              ));
                            }
                          }
                          // Caso contrário, usar mesas da API
                          // Para Seu Justino e Pracinha, mostrar todas as mesas mas indicar disponibilidade
                          if ((isSeuJustino || isPracinha) && formData.reservation_time) {
                            return tables
                              .filter(t => {
                                // Para reservas grandes (4+), mostra todas as mesas
                                if (formData.number_of_people >= 4) {
                                  return true; // Mostrar todas, mas marcar ocupadas
                                }
                                return t.capacity >= formData.number_of_people;
                              })
                              .map(t => (
                                <option 
                                  key={t.id} 
                                  value={t.table_number}
                                  disabled={t.is_reserved}
                                  style={{ color: t.is_reserved ? '#ef4444' : '#ffffff' }}
                                >
                                  Mesa {t.table_number} • {t.capacity} lugares {t.is_reserved ? '🔴 (Indisponível)' : '🟢 (Disponível)'}
                                </option>
                              ));
                          }
                          
                          return tables
                            .filter(t => {
                              // Para reservas grandes (4+), mostra todas as mesas não reservadas
                              // Para reservas normais, filtra por capacidade
                              if (formData.number_of_people >= 4) {
                                return !t.is_reserved;
                              }
                              return !t.is_reserved && t.capacity >= formData.number_of_people;
                            })
                            .map(t => (
                              <option key={t.id} value={t.table_number}>
                                Mesa {t.table_number} • {t.capacity} lugares{t.table_type ? ` • ${t.table_type}` : ''}
                              </option>
                            ));
                        })()}
                      </select>
                      
                      {/* Indicador de disponibilidade para Seu Justino e Pracinha */}
                      {(isSeuJustino || isPracinha) && formData.table_number && formData.reservation_time && (() => {
                        const selectedTable = tables.find(t => String(t.table_number) === formData.table_number);
                        if (selectedTable?.is_reserved) {
                          return (
                            <div className="mt-2 p-3 bg-red-900/20 border-2 border-red-600/50 rounded-lg">
                              <p className="text-sm text-red-400 font-semibold mb-1">
                                ⚠️ Mesa {formData.table_number} indisponível neste horário
                              </p>
                              <p className="text-xs text-red-300">
                                Esta mesa já está reservada para este horário. Por favor, adicione o cliente à Lista de Espera.
                              </p>
                            </div>
                          );
                        } else if (selectedTable) {
                          return (
                            <p className="mt-2 text-xs text-green-400">
                              ✅ Mesa {formData.table_number} disponível para este horário
                            </p>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* B. BOTÃO DE LIBERAÇÃO MANUAL (APENAS ADMIN, EXCLUSIVO HIGHLINE DECK) */}
                      {isAdmin && isHighline && Number(formData.area_id) === 2 && tables.some(t => t.is_reserved) && (
                        <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-600/40 rounded">
                          <p className="text-xs text-yellow-400 font-medium mb-2">
                            ⚡ Liberação Manual de Mesas (Deck - Highline)
                          </p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {tables
                              .filter(t => t.is_reserved)
                              .map(t => (
                                <div key={t.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                                  <span className="text-white text-sm">
                                    Mesa {t.table_number} • {t.capacity} lugares
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleForceReleaseTable(t.table_number)}
                                    className="flex items-center gap-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                                    title="Liberar mesa manualmente"
                                  >
                                    <MdElectricBolt size={14} />
                                    Liberar
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      {reservation?.table_number && reservation.table_number.includes(',') && !allowMultipleTables && (
                        <div className="mt-2 p-2 bg-blue-900/20 border border-blue-600/40 rounded">
                          <p className="text-xs text-blue-400 font-medium mb-1">
                            ℹ️ Esta reserva possui múltiplas mesas
                          </p>
                          <p className="text-xs text-blue-300">
                            Mesas: {reservation.table_number}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Marque "Reservar múltiplas mesas" acima para editar a seleção
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={formData.table_number}
                        onChange={(e) => handleInputChange('table_number', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Ex: Mesa 5 (opcional para reserva grande)"
                      />
                      {reservation?.table_number && reservation.table_number.includes(',') && !allowMultipleTables && (
                        <div className="mt-2 p-2 bg-blue-900/20 border border-blue-600/40 rounded">
                          <p className="text-xs text-blue-400 font-medium mb-1">
                            ℹ️ Esta reserva possui múltiplas mesas
                          </p>
                          <p className="text-xs text-blue-300">
                            Mesas: {reservation.table_number}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Marque "Reservar múltiplas mesas" acima para editar a seleção
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {errors.table_number && (
                    <p className="text-red-500 text-sm mt-1">{errors.table_number}</p>
                  )}
                  
                  {formData.number_of_people >= 4 && !allowMultipleTables && !reservation?.table_number?.includes(',') && (
                    <p className="text-xs text-gray-400 mt-1">
                      💡 Para reservas grandes, você pode selecionar uma mesa principal ou deixar em branco
                    </p>
                  )}
                </div>
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
              
              {/* Vincular a Evento */}
              {eventosDisponiveis.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MdEvent className="inline mr-2" />
                    Vincular a Evento
                  </label>
                  <select
                    value={eventoSelecionado}
                    onChange={(e) => setEventoSelecionado(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Não vincular a nenhum evento</option>
                    {eventosDisponiveis.map((evento) => (
                      <option key={evento.evento_id} value={evento.evento_id}>
                        {evento.nome} - {new Date(evento.data_evento + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    💡 Vincule esta reserva a um evento do estabelecimento na mesma data
                  </p>
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Observações adicionais sobre a reserva..."
                />
              </div>

              {/* Opção para bloquear toda a área (apenas admin) */}
              {isAdmin && formData.area_id && formData.reservation_date && (
                <div className="p-4 bg-red-900/20 border-2 border-red-600/50 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blocksEntireArea}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          // Confirmar ação importante
                          if (!confirm('⚠️ ATENÇÃO: Esta opção bloqueará TODAS as mesas da área selecionada para esta data.\n\nNenhuma outra reserva poderá ser criada na mesma área e data.\n\nDeseja continuar?')) {
                            return;
                          }
                        }
                        setBlocksEntireArea(checked);
                      }}
                      className="mt-1 w-5 h-5 bg-gray-600 border-gray-500 rounded text-red-500 focus:ring-red-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MdTableBar className="text-red-400" size={20} />
                        <span className="text-sm font-semibold text-red-300">
                          Bloquear Toda a Área para Esta Data
                        </span>
                      </div>
                      <p className="text-xs text-red-200">
                        Quando marcado, esta reserva ocupará <strong>todas as mesas</strong> da área selecionada para o dia {formData.reservation_date}. 
                        Nenhuma outra reserva poderá ser criada na mesma área e data, independente da mesa.
                      </p>
                      {blocksEntireArea && (
                        <div className="mt-2 p-2 bg-red-800/30 border border-red-500/50 rounded">
                          <p className="text-xs text-red-100 font-medium">
                            ⚠️ Área será completamente bloqueada para esta data
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              )}

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