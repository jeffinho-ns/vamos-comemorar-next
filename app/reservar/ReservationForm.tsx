"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MdRestaurant, 
  MdCalendarToday, 
  MdAccessTime, 
  MdPeople, 
  MdPhone, 
  MdEmail, 
  MdLocationOn,
  MdCheck,
  MdArrowBack
} from 'react-icons/md';
import { useRouter, useSearchParams } from 'next/navigation';

// Configuração da API
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
  phone?: string;
  email?: string;
}

interface RestaurantArea {
  id: number;
  name: string;
  capacity_lunch: number;
  capacity_dinner: number;
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

// Dados estáticos removidos - agora carregados da API

export default function ReservationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [areas, setAreas] = useState<RestaurantArea[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedSubareaKey, setSelectedSubareaKey] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [establishmentsLoading, setEstablishmentsLoading] = useState(true);
  const [step, setStep] = useState<'establishment' | 'form' | 'confirmation'>('establishment');
  const [reservationData, setReservationData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_birthdate: '',
    reservation_date: '',
    reservation_time: '',
    number_of_people: 2,
    area_id: '',
    table_number: '',
    notes: ''
  });
  const [eventType, setEventType] = useState<'aniversario' | 'despedida' | ''>('');
  const [guestListLink, setGuestListLink] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reservationId, setReservationId] = useState<string | null>(null);

  // Carregar estabelecimentos da API
  useEffect(() => {
    const fetchEstablishments = async () => {
      setEstablishmentsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/places`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const formattedEstablishments: Establishment[] = data.map((place: any) => {
              const name = place.name || "Sem nome";
              const lower = (name || '').toLowerCase();
              const isHighlineName = lower.includes('high');
              const isReservaRooftop = lower.includes('reserva rooftop') || lower.includes('rooftop');
              const isSeuJustino = lower.includes('seu justino');
              const isPracinha = lower.includes('pracinha');
              let fallbackPhone = "(11) 99999-9999";
              if (isHighlineName) fallbackPhone = "(11) 3032-2934";
              else if (isReservaRooftop) fallbackPhone = "(11) 4280-3345";
              else if (isSeuJustino) fallbackPhone = "(11) 5200-3650";
              else if (isPracinha) fallbackPhone = "(11) 2305-0938";
              return {
                id: place.id,
                name,
                logo: place.logo ? `https://vamos-comemorar-api.onrender.com/uploads/${place.logo}` : "/images/default-logo.png",
                address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado",
                phone: place.phone || fallbackPhone,
                email: place.email || "contato@estabelecimento.com.br"
              };
            });
            setEstablishments(formattedEstablishments);
          } else if (data.data && Array.isArray(data.data)) {
            const formattedEstablishments: Establishment[] = data.data.map((place: any) => {
              const name = place.name || "Sem nome";
              const lower = (name || '').toLowerCase();
              const isHighlineName = lower.includes('high');
              const isReservaRooftop = lower.includes('reserva rooftop') || lower.includes('rooftop');
              const isSeuJustino = lower.includes('seu justino');
              const isPracinha = lower.includes('pracinha');
              let fallbackPhone = "(11) 99999-9999";
              if (isHighlineName) fallbackPhone = "(11) 3032-2934";
              else if (isReservaRooftop) fallbackPhone = "(11) 4280-3345";
              else if (isSeuJustino) fallbackPhone = "(11) 5200-3650";
              else if (isPracinha) fallbackPhone = "(11) 2305-0938";
              return {
                id: place.id,
                name,
                logo: place.logo ? `https://vamos-comemorar-api.onrender.com/uploads/${place.logo}` : "/images/default-logo.png",
                address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado",
                phone: place.phone || fallbackPhone,
                email: place.email || "contato@estabelecimento.com.br"
              };
            });
            setEstablishments(formattedEstablishments);
          }
        } else {
          // Fallback com dados estáticos
          setEstablishments([
            {
              id: 7,
              name: "High Line",
              logo: "https://vamos-comemorar-api.onrender.com/uploads/1730836360230.png",
              address: "Rua Girassol, 144 - Vila Madalena",
              phone: "(11) 3032-2934",
              email: "reservas@highlinebar.com.br"
            },
            {
              id: 1,
              name: "Seu Justino",
              logo: "https://vamos-comemorar-api.onrender.com/uploads/1729923901750.webp",
              address: "Rua Harmonia, 77 - Vila Madalena",
              phone: "(11) 99999-8888",
              email: "contato@seujustino.com.br"
            },
            {
              id: 4,
              name: "Oh Freguês",
              logo: "https://vamos-comemorar-api.onrender.com/uploads/1730172121902.png",
              address: "Largo da Matriz de Nossa Senhora do Ó, 145 - Freguesia do Ó",
              phone: "(11) 99999-7777",
              email: "contato@ohfregues.com.br"
            },
            {
              id: 8,
              name: "Pracinha do Seu Justino",
              logo: "https://vamos-comemorar-api.onrender.com/uploads/1730836754093.png",
              address: "Rua Harmonia, 117 - Sumarezinho",
              phone: "(11) 99999-6666",
              email: "contato@pracinha.com.br"
            },
            {
              id: 9,
              name: "Reserva Rooftop",
              logo: "/images/default-logo.png",
              address: "Endereço do Reserva Rooftop",
              phone: "(11) 99999-5555",
              email: "contato@reservarooftop.com.br"
            }
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar estabelecimentos:', error);
        // Fallback com dados estáticos em caso de erro
        setEstablishments([
          {
            id: 7,
            name: "High Line",
            logo: "https://vamos-comemorar-api.onrender.com/uploads/1730836360230.png",
            address: "Rua Girassol, 144 - Vila Madalena",
            phone: "(11) 3032-2934",
            email: "reservas@highlinebar.com.br"
          },
          {
            id: 1,
            name: "Seu Justino",
            logo: "https://vamos-comemorar-api.onrender.com/uploads/1729923901750.webp",
            address: "Rua Harmonia, 77 - Vila Madalena",
            phone: "(11) 99999-8888",
            email: "contato@seujustino.com.br"
          },
          {
            id: 4,
            name: "Oh Freguês",
            logo: "https://vamos-comemorar-api.onrender.com/uploads/1730172121902.png",
            address: "Largo da Matriz de Nossa Senhora do Ó, 145 - Freguesia do Ó",
            phone: "(11) 99999-7777",
            email: "contato@ohfregues.com.br"
          },
          {
            id: 8,
            name: "Pracinha do Seu Justino",
            logo: "https://vamos-comemorar-api.onrender.com/uploads/1730836754093.png",
            address: "Rua Harmonia, 117 - Sumarezinho",
            phone: "(11) 99999-6666",
            email: "contato@pracinha.com.br"
          },
          {
            id: 9,
            name: "Reserva Rooftop",
            logo: "/images/default-logo.png",
            address: "Endereço do Reserva Rooftop",
            phone: "(11) 99999-5555",
            email: "contato@reservarooftop.com.br"
          }
        ]);
      } finally {
        setEstablishmentsLoading(false);
      }
    };

    fetchEstablishments();
  }, []);

  // Detectar estabelecimento na URL
  useEffect(() => {
    if (establishments.length === 0) return;
    
    const establishmentParam = searchParams.get('establishment');
    if (establishmentParam) {
      const establishment = establishments.find(
        est => est.name.toLowerCase().includes(establishmentParam.toLowerCase()) ||
               establishmentParam.toLowerCase().includes(est.name.toLowerCase())
      );
      if (establishment) {
        setSelectedEstablishment(establishment);
        loadAreas(establishment.id);
        setStep('form');
      }
    }
  }, [searchParams, establishments]);

  const loadAreas = async (establishmentId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/restaurant-areas`);
      if (response.ok) {
        const data = await response.json();
        setAreas(data.areas || []);
      } else {
        // Fallback para áreas mock
        setAreas([
          { id: 1, name: 'Área Coberta', capacity_lunch: 0, capacity_dinner: 300 },
          { id: 2, name: 'Área Descoberta', capacity_lunch: 0, capacity_dinner: 110 }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      setAreas([
        { id: 1, name: 'Área Coberta', capacity_lunch: 0, capacity_dinner: 300 },
        { id: 2, name: 'Área Descoberta', capacity_lunch: 0, capacity_dinner: 110 }
      ]);
    }
  };

  // Subáreas específicas do Highline (mapeadas para area_id base 2 ou 5)
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

  const isHighline = selectedEstablishment && (
    (selectedEstablishment.name || '').toLowerCase().includes('high')
  );

  // Janelas de horário para o Highline (Sexta e Sábado)
  const getHighlineTimeWindows = (dateStr: string, subareaKey?: string) => {
    if (!dateStr) return [] as Array<{ start: string; end: string; label: string }>;
    const date = new Date(dateStr + 'T00:00:00');
    const weekday = date.getDay(); // 0=Dom, 5=Sex, 6=Sáb
    const windows: Array<{ start: string; end: string; label: string }> = [];
    const isRooftop = subareaKey ? subareaKey.startsWith('roof') : false;
    const isDeckOrBar = subareaKey ? (subareaKey.startsWith('deck') || subareaKey === 'bar') : false;

    if (weekday === 5) {
      // Sexta-feira (qualquer área)
      windows.push({ start: '18:00', end: '21:00', label: 'Sexta-feira: 18:00–21:00' });
    } else if (weekday === 6) {
      // Sábado: rooftop 14–17, deck/bar 14–20
      if (isRooftop) {
        windows.push({ start: '14:00', end: '17:00', label: 'Sábado Rooftop: 14:00–17:00' });
      } else if (isDeckOrBar) {
        windows.push({ start: '14:00', end: '20:00', label: 'Sábado Deck: 14:00–20:00' });
      } else {
        // Sem subárea definida ainda: mostrar ambas como informação
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

  // Carrega mesas disponíveis quando área e data forem selecionadas
  useEffect(() => {
    const loadTables = async () => {
      const areaId = reservationData.area_id;
      const date = reservationData.reservation_date;
      if (!areaId || !date) {
        setTables([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/restaurant-tables/${areaId}/availability?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          let fetched: RestaurantTable[] = Array.isArray(data.tables) ? data.tables : [];
          // Se for Highline e houver subárea selecionada, filtra pelas mesas da subárea
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
        console.error('Erro ao carregar mesas:', e);
        setTables([]);
      }
    };
    loadTables();
  }, [reservationData.area_id, reservationData.reservation_date, selectedSubareaKey]);

  const handleEstablishmentSelect = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
    loadAreas(establishment.id);
    setStep('form');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!reservationData.client_name.trim()) {
      newErrors.client_name = 'Nome é obrigatório';
    }

    if (!reservationData.client_phone.trim()) {
      newErrors.client_phone = 'Telefone é obrigatório';
    }

    // Validação 18+
    if (!reservationData.client_birthdate) {
      newErrors.client_birthdate = 'Data de nascimento é obrigatória';
    } else {
      const bd = new Date(reservationData.client_birthdate + 'T00:00:00');
      const today = new Date();
      const eighteen = new Date(today);
      eighteen.setFullYear(today.getFullYear() - 18);
      if (bd > eighteen) {
        newErrors.client_birthdate = 'Para reservar, é obrigatório ser maior de 18 anos.';
      }
    }

    if (!reservationData.reservation_date) {
      newErrors.reservation_date = 'Data é obrigatória';
    }

    if (!reservationData.reservation_time) {
      newErrors.reservation_time = 'Horário é obrigatório';
    }

    // Regra de horário de funcionamento do Highline
    if (isHighline) {
      const windows = getHighlineTimeWindows(reservationData.reservation_date, selectedSubareaKey);
      const hasWindows = windows.length > 0;
      if (!hasWindows) {
        newErrors.reservation_time = 'Reservas fechadas para o dia selecionado no Highline.';
      } else if (reservationData.reservation_time && !isTimeWithinWindows(reservationData.reservation_time, windows)) {
        newErrors.reservation_time = 'Horário fora do funcionamento. Consulte os horários disponíveis abaixo.';
      }
    }

    if (!reservationData.area_id) {
      newErrors.area_id = 'Área é obrigatória';
    }

    if (reservationData.number_of_people < 1) {
      newErrors.number_of_people = 'Número de pessoas deve ser maior que 0';
    }

    // Removido: cliente não escolhe mesa; admin define a mesa

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // 1. Prepara o payload para envio, começando com os dados do formulário
    const payload: any = {
      ...reservationData,
      
      // 2. Renomeia o campo da data de nascimento para corresponder ao back-end
      data_nascimento_cliente: reservationData.client_birthdate || null,
      
      // 3. Adiciona/formata os outros campos necessários
      establishment_id: selectedEstablishment?.id,
      status: 'NOVA',
      origin: 'SITE',
      number_of_people: Number(reservationData.number_of_people),
      area_id: Number(reservationData.area_id),
    };

    // 4. CORREÇÃO CRÍTICA: Garante que o horário esteja no formato HH:mm:ss que o banco de dados espera
    if (payload.reservation_time && payload.reservation_time.split(':').length === 2) {
      payload.reservation_time = `${payload.reservation_time}:00`;
    }

    // 5. Remove a chave original do front-end para não ser enviada em duplicidade
    delete payload.client_birthdate;

    // Garante que o número da mesa seja uma string ou seja removido
    if (!payload.table_number) {
      delete payload.table_number;
    } else {
      payload.table_number = String(payload.table_number);
    }

    // Etapa de depuração: exibe o payload final no console antes de enviar
    console.log('📦 Payload final sendo enviado para a API:', JSON.stringify(payload, null, 2));

    try {
      // Decidir endpoint conforme o tamanho do grupo
      const isLarge = Number(payload.number_of_people) >= 11;
      // Se sábado e reserva grande, enviar event_type selecionado
      if (isLarge && reservationData.reservation_date) {
        const d = new Date(reservationData.reservation_date + 'T00:00:00');
        const weekday = d.getDay();
        if (weekday === 6) {
          payload.event_type = eventType || null;
        }
      }

      const endpoint = isLarge ? `${API_URL}/api/large-reservations` : `${API_URL}/api/restaurant-reservations`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Reserva criada com sucesso:', result);
        setReservationId(result.reservation?.id || '12345');
        if (result.guest_list_link) {
          setGuestListLink(result.guest_list_link);
        } else {
          setGuestListLink(null);
        }
        setStep('confirmation');
      } else {
        const errorText = await response.text();
        console.error('❌ Erro bruto do servidor:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          alert('Erro ao fazer reserva: ' + (errorData.error || JSON.stringify(errorData)));
        } catch (parseError) {
          alert('Ocorreu um erro inesperado no servidor. Detalhes: ' + errorText);
        }
      }
    } catch (error) {
      console.error('Erro de rede ou na requisição:', error);
      alert('Erro ao fazer reserva. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (field: string, value: any) => {
    setReservationData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 dias no futuro
    return maxDate.toISOString().split('T')[0];
  };
  const getMaxBirthdate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Faça sua Reserva
          </h1>
          <p className="text-gray-300 text-lg">
            Escolha seu estabelecimento preferido e garante sua mesa
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step === 'establishment' ? 'bg-orange-500 text-white' : 
              step === 'form' || step === 'confirmation' ? 'bg-green-500 text-white' : 
              'bg-gray-600 text-gray-300'
            }`}>
              <MdRestaurant size={20} />
            </div>
            <div className={`w-16 h-1 ${
              step === 'form' || step === 'confirmation' ? 'bg-green-500' : 'bg-gray-600'
            }`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step === 'form' ? 'bg-orange-500 text-white' : 
              step === 'confirmation' ? 'bg-green-500 text-white' : 
              'bg-gray-600 text-gray-300'
            }`}>
              <MdCalendarToday size={20} />
            </div>
            <div className={`w-16 h-1 ${
              step === 'confirmation' ? 'bg-green-500' : 'bg-gray-600'
            }`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step === 'confirmation' ? 'bg-orange-500 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              <MdCheck size={20} />
            </div>
          </div>
        </div>

        {/* Step 1: Establishment Selection */}
        {step === 'establishment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Escolha seu Estabelecimento
            </h2>
            
            {establishmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando estabelecimentos...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {establishments.map((establishment) => (
                <motion.button
                  key={establishment.id}
                  onClick={() => handleEstablishmentSelect(establishment)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-300 hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <img
                        src={establishment.logo}
                        alt={establishment.name}
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {establishment.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {establishment.address}
                      </p>
                    </div>
                  </div>
                  {establishment.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MdPhone size={16} />
                      <span className="text-sm">{establishment.phone}</span>
                    </div>
                  )}
                </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Reservation Form */}
        {step === 'form' && selectedEstablishment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setStep('establishment')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdArrowBack size={24} />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Dados da Reserva
                </h2>
                <p className="text-gray-600">
                  {selectedEstablishment.name}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={reservationData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.client_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Seu nome completo"
                  />
                  {errors.client_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={reservationData.client_phone}
                    onChange={(e) => handleInputChange('client_phone', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.client_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.client_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.client_phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={reservationData.client_email}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>

                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Nascimento
                        </label>
                            <input
                              type="date"
                              value={reservationData.client_birthdate}
                              onChange={(e) => handleInputChange('client_birthdate', e.target.value)}
                              max={getMaxBirthdate()}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          {errors.client_birthdate && (
                            <p className="text-red-500 text-sm mt-1">{errors.client_birthdate}</p>
                          )}
                          {!errors.client_birthdate && (
                            <p className="text-gray-500 text-xs mt-1">Para reservar, é obrigatório ser maior de 18 anos.</p>
                          )}
                  </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Pessoas *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={reservationData.number_of_people}
                    onChange={(e) => handleInputChange('number_of_people', parseInt(e.target.value || '0'))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.number_of_people ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.number_of_people && (
                    <p className="text-red-500 text-sm mt-1">{errors.number_of_people}</p>
                  )}
                  
                  {/* Indicador de reserva grande */}
                  {reservationData.number_of_people >= 11 && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-800">
                        <MdPeople className="text-orange-600" />
                        <span className="text-sm font-medium">Reserva Grande</span>
                      </div>
                      <p className="text-xs text-orange-700 mt-1">
                        Para grupos acima de 10 pessoas, você pode escolher apenas a área. 
                        O admin selecionará as mesas específicas.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reservation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Reserva *
                  </label>
                    <input
                      type="date"
                      min={getMinDate()}
                      max={getMaxDate()}
                      value={reservationData.reservation_date}
                      onChange={(e) => {
                        handleInputChange('reservation_date', e.target.value);
                        handleInputChange('table_number', ''); // Adicione esta linha
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.reservation_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  {errors.reservation_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.reservation_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário *
                  </label>
                {(() => {
                  // Calcula min/max quando há exatamente uma janela aplicável
                  let minAttr: string | undefined;
                  let maxAttr: string | undefined;
                  let helperWindows: Array<{ start: string; end: string; label: string }> = [];
                  if (isHighline && reservationData.reservation_date) {
                    helperWindows = getHighlineTimeWindows(reservationData.reservation_date, selectedSubareaKey);
                    if (helperWindows.length === 1) {
                      minAttr = helperWindows[0].start;
                      maxAttr = helperWindows[0].end;
                    }
                  }
                  return (
                    <input
                      type="time"
                      min={minAttr}
                      max={maxAttr}
                      value={reservationData.reservation_time}
                      onChange={(e) => handleInputChange('reservation_time', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.reservation_time ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  );
                })()}
                  {errors.reservation_time && (
                    <p className="text-red-500 text-sm mt-1">{errors.reservation_time}</p>
                  )}
                {isHighline && reservationData.reservation_date && (
                  <div className="mt-2 text-xs text-gray-600">
                    {(() => {
                      const windows = getHighlineTimeWindows(reservationData.reservation_date, selectedSubareaKey);
                      if (windows.length === 0) {
                        return (
                          <div className="p-2 bg-red-50 border border-red-200 rounded">
                            Reservas fechadas para este dia no Highline. Disponível apenas Sexta e Sábado.
                          </div>
                        );
                      }
                      return (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                          <div className="font-medium text-amber-800">Horários disponíveis:</div>
                          <ul className="list-disc pl-5 text-amber-800">
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
              </div>

              {/* Lógica condicional sexta/sábado para reservas grandes */}
              {reservationData.number_of_people >= 11 && reservationData.reservation_date && (
                (() => {
                  const d = new Date(reservationData.reservation_date + 'T00:00:00');
                  const weekday = d.getDay(); // 5=sexta, 6=sábado
                  if (weekday === 5) {
                    return (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="text-emerald-800 text-sm">
                          Sexta-feira: opção de criar lista de convidados disponível. O link será exibido após confirmar.
                        </div>
                      </div>
                    );
                  }
                  if (weekday === 6) {
                    return (
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <label className="block text-sm font-medium text-indigo-900 mb-2">Tipo de evento (sábado)</label>
                        <div className="flex items-center gap-6 text-sm text-indigo-900">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="event_type"
                              checked={eventType === 'aniversario'}
                              onChange={() => setEventType('aniversario')}
                            />
                            Aniversário
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="event_type"
                              checked={eventType === 'despedida'}
                              onChange={() => setEventType('despedida')}
                            />
                            Despedida
                          </label>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              {/* Area Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área Preferida *
                </label>
                <select
                  value={isHighline ? selectedSubareaKey : reservationData.area_id}
                  onChange={(e) => {
                    if (isHighline) {
                      const key = e.target.value;
                      setSelectedSubareaKey(key);
                      const sub = highlineSubareas.find(s => s.key === key);
                      handleInputChange('area_id', sub ? String(sub.area_id) : '');
                      // limpar mesa ao trocar subárea
                      handleInputChange('table_number', '');
                    } else {
                      handleInputChange('area_id', e.target.value);
                      handleInputChange('table_number', '');
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.area_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione uma área</option>
                  {isHighline
                    ? highlineSubareas.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))
                    : areas.map((area) => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                </select>
                {errors.area_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.area_id}</p>
                )}
                {/* Listagem de mesas da subárea (somente Highline) */}
                {isHighline && selectedSubareaKey && tables.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {tables.map(t => (
                      <div key={t.id} className={`px-2 py-1 rounded border ${t.is_reserved ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        Mesa {t.table_number} • {t.capacity}p {t.is_reserved ? '(reservada)' : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Removido: seleção de mesa pelo cliente */}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={reservationData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Alguma observação especial? (ex: aniversário, mesa próxima à janela, etc.)"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <MdCheck size={20} />
                      Confirmar Reserva
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirmation' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-8 text-center"
  >
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <MdCheck size={40} className="text-green-600" />
    </div>

    <h2 className="text-3xl font-bold text-gray-800 mb-4">
      Reserva Confirmada!
    </h2>

    <p className="text-gray-600 mb-6">
      Sua reserva foi realizada com sucesso. Você receberá uma confirmação por telefone ou email.
    </p>

    <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
      <h3 className="font-semibold text-gray-800 mb-4">Detalhes da Reserva:</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Estabelecimento:</span>
          <span className="font-medium">{selectedEstablishment?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Data:</span>
          <span className="font-medium">
            {new Date(reservationData.reservation_date).toLocaleDateString('pt-BR')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Horário:</span>
          <span className="font-medium">{reservationData.reservation_time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Pessoas:</span>
          <span className="font-medium">{reservationData.number_of_people}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Área:</span>
          <span className="font-medium">
            {areas.find(a => a.id.toString() === reservationData.area_id)?.name}
          </span>
        </div>
        {reservationId && (
          <div className="flex justify-between">
            <span className="text-gray-600">Código:</span>
            <span className="font-medium font-mono">{reservationId}</span>
          </div>
        )}
      </div>
    </div>

    {guestListLink && (
      <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-left">
        <div className="text-emerald-900 font-semibold mb-2">Lista de Convidados</div>
        <p className="text-emerald-800 text-sm mb-3">Seu link foi gerado. Compartilhe com seus convidados.</p>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input readOnly value={guestListLink} className="flex-1 px-3 py-2 border rounded" />
          <button
            onClick={() => navigator.clipboard.writeText(guestListLink)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
          >Copiar Link</button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent('Você está na minha lista de convidados: ' + guestListLink)}`}
            target="_blank"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-center"
          >Compartilhar no WhatsApp</a>
        </div>
      </div>
    )}

    <div className="flex gap-4 justify-center">
      <button
        onClick={() => {
          setStep('establishment');
          setSelectedEstablishment(null);
          // Resetar o estado para a forma inicial completa
          setReservationData({
            client_name: '',
            client_phone: '',
            client_email: '',
            client_birthdate: '', // ✅ Corrigido
            reservation_date: '',
            reservation_time: '',
            number_of_people: 2,
            area_id: '',
            table_number: '',
            notes: '',
          });
        }}
        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
      >
        Nova Reserva
      </button>
      <button
        onClick={() => router.push('/')}
        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
      >
        Voltar ao Início
      </button>
    </div>
  </motion.div>
)}
</div>

</div>
);
}