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
            const formattedEstablishments: Establishment[] = data.map((place: any) => ({
              id: place.id,
              name: place.name || "Sem nome",
              logo: place.logo ? `https://vamos-comemorar-api.onrender.com/uploads/${place.logo}` : "/images/default-logo.png",
              address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado",
              phone: place.phone || "(11) 99999-9999",
              email: place.email || "contato@estabelecimento.com.br"
            }));
            setEstablishments(formattedEstablishments);
          } else if (data.data && Array.isArray(data.data)) {
            const formattedEstablishments: Establishment[] = data.data.map((place: any) => ({
              id: place.id,
              name: place.name || "Sem nome",
              logo: place.logo ? `https://vamos-comemorar-api.onrender.com/uploads/${place.logo}` : "/images/default-logo.png",
              address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado",
              phone: place.phone || "(11) 99999-9999",
              email: place.email || "contato@estabelecimento.com.br"
            }));
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
              phone: "(11) 99999-9999",
              email: "contato@highline.com.br"
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
            phone: "(11) 99999-9999",
            email: "contato@highline.com.br"
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

    if (!reservationData.reservation_date) {
      newErrors.reservation_date = 'Data é obrigatória';
    }

    if (!reservationData.reservation_time) {
      newErrors.reservation_time = 'Horário é obrigatório';
    }

    if (!reservationData.area_id) {
      newErrors.area_id = 'Área é obrigatória';
    }

    if (reservationData.number_of_people < 1) {
      newErrors.number_of_people = 'Número de pessoas deve ser maior que 0';
    }

    // Se existem mesas para a área e data, solicitar seleção de mesa (exceto para reservas grandes)
    const isLargeReservation = reservationData.number_of_people >= 11;
    const hasTableOptions = tables && tables.length > 0;
    const hasAvailableTable = tables.some(t => !t.is_reserved && t.capacity >= reservationData.number_of_people);
    if (!isLargeReservation && hasTableOptions && hasAvailableTable && !(reservationData as any).table_number) {
      newErrors.table_number = 'Selecione uma mesa disponível';
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
      const response = await fetch(`${API_URL}/api/restaurant-reservations`, {
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
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />
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
                  <input
                    type="time"
                    value={reservationData.reservation_time}
                    onChange={(e) => handleInputChange('reservation_time', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.reservation_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.reservation_time && (
                    <p className="text-red-500 text-sm mt-1">{errors.reservation_time}</p>
                  )}
                </div>
              </div>

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

              {/* Table Selection (aparece quando há mesas para a área/data e não é reserva grande) */}
              {tables.length > 0 && reservationData.number_of_people < 11 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mesa (opções disponíveis para a data)
                  </label>
                  <select
                    value={(reservationData as any).table_number || ''}
                    onChange={(e) => handleInputChange('table_number', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.table_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione uma mesa</option>
                    {tables
                      .filter(t => !t.is_reserved && t.capacity >= reservationData.number_of_people)
                      .map(t => (
                        <option key={t.id} value={t.table_number}>
                          Mesa {t.table_number} • {t.capacity} lugares{t.table_type ? ` • ${t.table_type}` : ''}
                        </option>
                      ))}
                  </select>
                  {errors.table_number && (
                    <p className="text-red-500 text-sm mt-1">{errors.table_number}</p>
                  )}
                  {tables.some(t => t.is_reserved) && (
                    <p className="text-xs text-gray-500 mt-1">Mesas já reservadas não aparecem na lista.</p>
                  )}
                </div>
              )}

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

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setStep('establishment');
                  setSelectedEstablishment(null);
                  // CORREÇÃO: Resetar o estado para a forma inicial completa
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