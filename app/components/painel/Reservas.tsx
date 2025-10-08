// components/painel/Reservas.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { MdPeople, MdPhone, MdEmail, MdCalendarToday, MdAccessTime, MdClose, MdSchedule, MdCancel } from "react-icons/md";
import { FaUserPlus, FaEdit, FaTimesCircle, FaPlusCircle, FaGavel, FaSave } from "react-icons/fa";

// --- Interfaces ---
interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface Camarote {
  id: number;
  nome_camarote: string;
  capacidade_maxima: number;
  status: 'disponivel' | 'bloqueado';
  regras_especificas?: string;
  reserva_camarote_id?: number;
  nome_cliente?: string;
  entradas_unisex_free?: number;
  entradas_masculino_free?: number;
  entradas_feminino_free?: number;
  valor_camarote?: number;
  valor_consumacao?: number;
  valor_pago?: number;
  valor_sinal?: number;
  status_reserva?: 'pre-reservado' | 'reservado' | 'confirmado' | 'aguardando-aprovacao' | 'aguardando-cancelamento' | 'disponivel' | 'bloqueado';
  data_reserva?: string; // Data da reserva
  data_expiracao?: string; // Data de expiração da reserva
}

interface Guest {
  nome: string;
  email?: string;
}

interface ReservationFormState {
  status_reserva: string;
  tag: string;
  hora_reserva: string;
  nome_cliente: string;
  telefone: string;
  enviar_sms: boolean;
  cpf_cnpj: string;
  email: string;
  data_nascimento: string;
  data_reserva: string; // Data da reserva
  data_expiracao: string; // Data de expiração
  maximo_pessoas: number;
  entradas_unisex_free: number;
  entradas_masculino_free: number;
  entradas_feminino_free: number;
  pulseiras: number;
  valor_camarote: number;
  valor_consumacao: number;
  valor_sinal: number;
  valor_pago: number;
  prazo_sinal_dias: number;
  solicitado_por: string;
  observacao: string;
  lista_convidados: Guest[];
}

// --- Dados Mockados (Estrutura Fixa) ---
const fixedCamarotes: { [key: number]: Camarote[] } = {
    7: [ // High Line (ID 7) - 6 camarotes
        { id: 101, nome_camarote: "Highline-C1", capacidade_maxima: 10, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 102, nome_camarote: "Highline-C2", capacidade_maxima: 12, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 103, nome_camarote: "Highline-C3", capacidade_maxima: 8, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 104, nome_camarote: "Highline-C4", capacidade_maxima: 15, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 105, nome_camarote: "Highline-C5", capacidade_maxima: 20, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 106, nome_camarote: "Highline-C6", capacidade_maxima: 25, status: 'disponivel', regras_especificas: "Regra padrão" },
    ],
    1: [ // Seu Justino (ID 1) - 4 camarotes
        { id: 201, nome_camarote: "Justino-C1", capacidade_maxima: 10, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 202, nome_camarote: "Justino-C2", capacidade_maxima: 12, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 203, nome_camarote: "Justino-C3", capacidade_maxima: 8, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 204, nome_camarote: "Justino-C4", capacidade_maxima: 15, status: 'disponivel', regras_especificas: "Regra padrão" },
    ],
    4: [ // Oh Fregues (ID 4) - 5 camarotes
        { id: 401, nome_camarote: "Fregues-C1", capacidade_maxima: 10, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 402, nome_camarote: "Fregues-C2", capacidade_maxima: 12, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 403, nome_camarote: "Fregues-C3", capacidade_maxima: 8, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 404, nome_camarote: "Fregues-C4", capacidade_maxima: 15, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 405, nome_camarote: "Fregues-C5", capacidade_maxima: 20, status: 'disponivel', regras_especificas: "Regra padrão" },
    ],
    8: [ // Pracinha do Seu Justino (ID 8) - 2 camarotes
        { id: 801, nome_camarote: "Pracinha-C1", capacidade_maxima: 10, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 802, nome_camarote: "Pracinha-C2", capacidade_maxima: 12, status: 'disponivel', regras_especificas: "Regra padrão" },
    ],
    5: [ // Reserva Rooftop (ID 5) - 4 camarotes
        { id: 501, nome_camarote: "Reserva-C1", capacidade_maxima: 12, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 502, nome_camarote: "Reserva-C2", capacidade_maxima: 15, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 503, nome_camarote: "Reserva-C3", capacidade_maxima: 18, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 504, nome_camarote: "Reserva-C4", capacidade_maxima: 20, status: 'disponivel', regras_especificas: "Regra padrão" },
    ],
};

const getFixedCamarotesByEstablishmentId = (id: number): Camarote[] => {
    return fixedCamarotes[id] || [];
};

// --- Funções Utilitárias ---
const isReservationExpired = (dataExpiracao?: string): boolean => {
  if (!dataExpiracao) return false;
  const hoje = new Date();
  const expiracao = new Date(dataExpiracao);
  return hoje > expiracao;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const addDaysToDate = (date: string, days: number): string => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

// Função utilitária para formatar valores monetários de forma segura
const formatCurrency = (value: any): string => {
  const numValue = Number(value);
  return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
};

// --- Componente Principal ---
export default function ReservasCamarote({ establishment }: { establishment: Establishment }) {
  const [camarotes, setCamarotes] = useState<Camarote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCamarote, setSelectedCamarote] = useState<Camarote | null>(null);
  const [showSidebar, setShowSidebar] = useState<'reserve' | 'edit' | null>(null);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [reservationData, setReservationData] = useState<Partial<ReservationFormState>>({});
  const [rulesData, setRulesData] = useState<{ capacidade_maxima?: number; regras_especificas?: string }>({});
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = useState('');

  const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com';

  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    console.log('Token encontrado:', token ? 'Sim' : 'Não');
    return token;
  };
  
  // --- Verificação Automática de Expiração ---
  useEffect(() => {
    const checkExpiredReservations = () => {
      setCamarotes(prevCamarotes => 
        prevCamarotes.map(camarote => {
          if (camarote.data_expiracao && isReservationExpired(camarote.data_expiracao)) {
            // Reserva expirada - liberar camarote
            return {
              ...camarote,
              status: 'disponivel',
              status_reserva: 'disponivel',
              reserva_camarote_id: undefined,
              nome_cliente: undefined,
              data_reserva: undefined,
              data_expiracao: undefined
            };
          }
          return camarote;
        })
      );
    };

    // Verificar a cada minuto
    const interval = setInterval(checkExpiredReservations, 60000);
    checkExpiredReservations(); // Verificar imediatamente

    return () => clearInterval(interval);
  }, []);

  // --- Funções de API e Ações ---
  const fetchReservas = useCallback(async () => {
    setLoading(true);
    const token = getAuthToken();
    const fixedList = getFixedCamarotesByEstablishmentId(establishment.id);

    if (!token) {
        console.error("Token de autenticação não encontrado.");
        setCamarotes(fixedList);
        setLoading(false);
        return;
    }

    try {
      console.log('🔍 Buscando camarotes do estabelecimento:', establishment.id);
      console.log('🔍 URL da API:', `${API_BASE_URL}/api/reservas/camarotes/${establishment.id}`);
      console.log('🔍 Token:', token ? 'Token presente' : 'Token ausente');
      
      const response = await fetch(`${API_BASE_URL}/api/reservas/camarotes/${establishment.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Falha ao carregar camarotes da API:', response.status, errorText);
        console.log('🔄 Usando lista fixa como fallback');
        setCamarotes(fixedList);
        return;
      }

      const apiCamarotes = await response.json();
      console.log('✅ Camarotes carregados da API:', apiCamarotes);
      
      // Debug: verificar tipos de dados
      if (apiCamarotes.length > 0) {
        console.log('🔍 Debug - Tipos de dados do primeiro camarote:');
        const primeiroCamarote = apiCamarotes[0];
        console.log('  - valor_pago:', primeiroCamarote.valor_pago, 'tipo:', typeof primeiroCamarote.valor_pago);
        console.log('  - valor_camarote:', primeiroCamarote.valor_camarote, 'tipo:', typeof primeiroCamarote.valor_camarote);
        console.log('  - valor_consumacao:', primeiroCamarote.valor_consumacao, 'tipo:', typeof primeiroCamarote.valor_consumacao);
        console.log('  - capacidade_maxima:', primeiroCamarote.capacidade_maxima, 'tipo:', typeof primeiroCamarote.capacidade_maxima);
      }
      
      if (apiCamarotes.length === 0) {
        console.log('⚠️ Nenhum camarote encontrado na API, usando lista fixa.');
        setCamarotes(fixedList);
      } else {
        // Usar dados reais da API
        setCamarotes(apiCamarotes);
      }

    } catch (error) {
      console.error("❌ Erro ao carregar camarotes:", error);
      setCamarotes(fixedList);
    } finally {
      setLoading(false);
    }
  }, [establishment.id]);

  useEffect(() => {
    fetchReservas();
  }, [establishment.id, fetchReservas]);

  const handleActionClick = async (camarote: Camarote, action: 'reserve' | 'edit') => {
    setSelectedCamarote(camarote);
    setShowSidebar(action);

    if (action === 'reserve') {
      const hoje = new Date().toISOString().split('T')[0];
      const expiracao = addDaysToDate(hoje, 1); // Expira no dia seguinte
      
      setReservationData({
        status_reserva: 'reservado',
        data_reserva: hoje,
        data_expiracao: expiracao,
        maximo_pessoas: camarote.capacidade_maxima,
        entradas_unisex_free: 0,
        entradas_masculino_free: 0,
        entradas_feminino_free: 0,
        valor_camarote: 0,
        valor_consumacao: 0,
        valor_sinal: 0,
        valor_pago: 0,
        prazo_sinal_dias: 0,
        enviar_sms: false,
        pulseiras: 0,
        lista_convidados: [],
      });
      setGuests([]);
    } else if (action === 'edit' && camarote.reserva_camarote_id) {
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/reservas/camarote/${camarote.reserva_camarote_id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        setReservationData({
            ...data,
            hora_reserva: data.hora_reserva ? data.hora_reserva.substring(0, 5) : '',
            data_nascimento: data.data_nascimento ? data.data_nascimento.split('T')[0] : '',
        });
        setGuests(data.convidados || []);
      } catch (error) {
        console.error("Falha ao buscar detalhes da reserva", error);
      }
    }
  };

  const handleReservationAction = async (action: 'postpone' | 'cancel') => {
    if (!selectedCamarote || !selectedCamarote.reserva_camarote_id) return;
    
    const token = getAuthToken();
    if (!token) {
      alert("Acesso negado. Faça login novamente.");
      return;
    }

    try {
      let newStatus = '';
      let newDataExpiracao = '';

      if (action === 'postpone') {
        newStatus = 'reservado';
        newDataExpiracao = addDaysToDate(new Date().toISOString().split('T')[0], 1);
      } else if (action === 'cancel') {
        newStatus = 'disponivel';
        newDataExpiracao = '';
      }

      const response = await fetch(`${API_BASE_URL}/api/reservas/camarote/${selectedCamarote.reserva_camarote_id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_reserva: newStatus,
          data_expiracao: newDataExpiracao
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar reserva.');
      }

      alert(`Reserva ${action === 'postpone' ? 'adiada' : 'cancelada'} com sucesso!`);
      setShowActionModal(false);
      fetchReservas();
    } catch (error) {
      console.error(`Erro ao ${action === 'postpone' ? 'adiar' : 'cancelar'} reserva:`, error);
      alert(`Erro ao ${action === 'postpone' ? 'adiar' : 'cancelar'} reserva.`);
    }
  };
  
  const handleEditRulesClick = (camarote: Camarote) => {
      setSelectedCamarote(camarote);
      setRulesData({
          capacidade_maxima: camarote.capacidade_maxima,
          regras_especificas: camarote.regras_especificas || ''
      });
      setShowRulesModal(true);
  };
  
  const handleRulesSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedCamarote) return;
      const token = getAuthToken();
      if (!token) {
          alert("Acesso negado. Faça login novamente.");
          return;
      }
      console.log("Enviando atualização de regras para o camarote ID:", selectedCamarote.id, "com os dados:", rulesData);
      try {
          const response = await fetch(`${API_BASE_URL}/api/camarotes/${selectedCamarote.id}`, {
              method: 'PUT',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(rulesData),
          });

          if (!response.ok) throw new Error('Falha ao atualizar as regras do camarote.');
          
          alert('Regras do camarote atualizadas com sucesso!');
          setShowRulesModal(false);
          fetchReservas();
      } catch (error) {
          console.error("Erro ao atualizar regras:", error);
          alert('Erro ao atualizar as regras. (Verifique o console para detalhes)');
      }
  };

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamarote) return;
    const token = getAuthToken();
    if (!token) {
        alert("Acesso negado. Faça login novamente.");
        return;
    }

    // Limpar e formatar dados antes de enviar
   const cleanPayload = {
    id_camarote: selectedCamarote.id,
    id_evento: null,
    lista_convidados: guests,
    status_reserva: 'reservado',
    nome_cliente: reservationData.nome_cliente || '',
    telefone: reservationData.telefone || '',
    cpf_cnpj: reservationData.cpf_cnpj || '',
    email: reservationData.email || '',
    data_nascimento: reservationData.data_nascimento || null,
    data_reserva: reservationData.data_reserva || new Date().toISOString().split('T')[0],
    maximo_pessoas: reservationData.maximo_pessoas || selectedCamarote.capacidade_maxima,
    entradas_unisex_free: reservationData.entradas_unisex_free || 0,
    entradas_masculino_free: reservationData.entradas_masculino_free || 0,
    entradas_feminino_free: reservationData.entradas_feminino_free || 0,
    valor_camarote: reservationData.valor_camarote || 0,
    valor_consumacao: reservationData.valor_consumacao || 0,
    valor_pago: reservationData.valor_pago || 0,
    valor_sinal: reservationData.valor_sinal || 0,
    prazo_sinal_dias: reservationData.prazo_sinal_dias || 0,
    solicitado_por: reservationData.solicitado_por || '',
    observacao: reservationData.observacao || '',
    tag: reservationData.tag || '',
    hora_reserva: reservationData.hora_reserva || null,
};

    const payload = cleanPayload;
    
    const url = showSidebar === 'edit'
      ? `${API_BASE_URL}/api/reservas/camarote/${selectedCamarote.reserva_camarote_id}`
      : `${API_BASE_URL}/api/reservas/camarote`;
      
    const method = showSidebar === 'edit' ? 'PUT' : 'POST';

    try {
      console.log('🔧 === INÍCIO DA ATUALIZAÇÃO ===');
      console.log('📤 Payload sendo enviado:', JSON.stringify(payload, null, 2));
      console.log('🔗 URL:', url);
      console.log('📡 Method:', method);
      console.log('🔑 Token:', token ? 'Token presente' : 'Token ausente');
      
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
          const errorData = await response.text();
          console.error('❌ Erro na resposta:', response.status, errorData);
          throw new Error(errorData || `Falha na operação de reserva. Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Resposta de sucesso:', result);
      
      alert(`Reserva ${showSidebar === 'edit' ? 'atualizada' : 'criada'} com sucesso!`);
      console.log('🔄 Fechando sidebar e recarregando dados...');
      setShowSidebar(null);
      
      // Aguardar um pouco antes de recarregar para garantir que a atualização foi processada
      setTimeout(() => {
        console.log('🔄 Recarregando dados após atualização...');
        fetchReservas();
      }, 1000);
    } catch (error) {
      console.error(`Erro ao ${method === 'POST' ? 'criar' : 'atualizar'} reserva:`, error);
      
      // Fallback temporário: simular sucesso localmente
      if (method === 'POST') {
        console.log('Aplicando fallback local...');
        const mockReservation: Camarote = {
          ...selectedCamarote,
          reserva_camarote_id: Date.now(), // ID temporário
          nome_cliente: payload.nome_cliente,
          status_reserva: 'reservado' as const,
          data_reserva: new Date().toISOString().split('T')[0],
          data_expiracao: addDaysToDate(new Date().toISOString().split('T')[0], 1),
          valor_pago: payload.valor_pago,
        };
        
        setCamarotes(prev => 
          prev.map(c => 
            c.id === selectedCamarote.id ? mockReservation : c
          )
        );
        
        alert('Reserva criada localmente (API temporariamente indisponível)!');
        setShowSidebar(null);
        return;
      }
      
      alert(`Erro: ${error instanceof Error ? error.message : 'Ocorreu um problema.'}`);
    }
  };

  const handleAddGuest = async () => {
    if (!selectedCamarote || !selectedCamarote.reserva_camarote_id || newGuestName.trim() === '') return;
    const token = getAuthToken();
    if (!token) {
        alert("Acesso negado.");
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reservas/camarote/${selectedCamarote.reserva_camarote_id}/convidado`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newGuestName }),
      });
      if (!response.ok) throw new Error('Falha ao adicionar convidado.');
      setGuests([...guests, { nome: newGuestName }]);
      setNewGuestName('');
    } catch (error) {
      console.error("Erro ao adicionar convidado:", error);
      alert('Erro ao adicionar convidado.');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-100 text-green-800 border-green-200';
      case 'pre-reservado': case 'reservado': case 'aguardando-aprovacao': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aguardando-cancelamento': case 'bloqueado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      
      let finalValue: any = value;
      if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked;
      } else if (['number', 'range'].includes(type) || e.target.dataset.type === 'number') {
        finalValue = value === '' ? 0 : parseFloat(value);
      }
      
      setReservationData(prev => ({ ...prev, [name]: finalValue }));
  };

  const isCamaroteAvailable = (camarote: Camarote): boolean => {
    return camarote.status === 'disponivel' && !camarote.reserva_camarote_id;
  };

  const isReservationActive = (camarote: Camarote): boolean => {
    return Boolean(camarote.reserva_camarote_id) && camarote.status_reserva === 'reservado' && 
           (!camarote.data_expiracao || !isReservationExpired(camarote.data_expiracao));
  };

  // --- Renderização ---
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Coluna Principal - Lista de Camarotes */}
      <div className={showSidebar ? "lg:w-1/2" : "w-full"}>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Reservas de Camarotes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {camarotes.map((camarote) => (
            <div key={camarote.id} className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between ${
              !isCamaroteAvailable(camarote) ? 'opacity-75' : ''
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">{camarote.nome_camarote}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(camarote.status_reserva)}`}>
                    {camarote.status_reserva ? camarote.status_reserva.replace(/-/g, ' ') : camarote.status === 'disponivel' ? 'Disponível' : 'Bloqueado'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Capacidade Máxima: {camarote.capacidade_maxima} pessoas</p>

                {camarote.reserva_camarote_id && (
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2"><MdPeople className="text-gray-400" /> {camarote.nome_cliente}</p>
                    <p className="flex items-center gap-2">Valor Pago: R$ {formatCurrency(camarote.valor_pago)}</p>
<p className="flex items-center gap-2 font-semibold text-green-600">
  Valor Total: R$ {formatCurrency((camarote.valor_sinal || 0) + (camarote.valor_pago || 0))}
</p>
                    {camarote.data_reserva && (
                      <p className="flex items-center gap-2"><MdCalendarToday className="text-gray-400" /> 
                        Reservado em: {formatDate(camarote.data_reserva)}
                      </p>
                    )}
                    {camarote.data_expiracao && (
                      <p className="flex items-center gap-2"><MdAccessTime className="text-gray-400" /> 
                        Expira em: {formatDate(camarote.data_expiracao)}
                        {isReservationExpired(camarote.data_expiracao) && (
                          <span className="text-red-500 font-medium"> (EXPIRADO)</span>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {isCamaroteAvailable(camarote) && (
                  <button onClick={() => handleActionClick(camarote, 'reserve')} className="btn-action bg-yellow-500 hover:bg-yellow-600">
                    <FaPlusCircle /> Reservar
                  </button>
                )}
                {isReservationActive(camarote) && (
                  <>
                    <button onClick={() => handleActionClick(camarote, 'edit')} className="btn-action bg-blue-500 hover:bg-blue-600">
                      <FaEdit /> Editar Reserva
                    </button>
                    <button onClick={() => {
                      setSelectedCamarote(camarote);
                      setShowActionModal(true);
                    }} className="btn-action bg-orange-500 hover:bg-orange-600">
                      <MdSchedule /> Ações
                    </button>
                  </>
                )}
                <button onClick={() => handleEditRulesClick(camarote)} className="btn-action bg-purple-500 hover:bg-purple-600">
                  <FaGavel /> Editar Regras
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Lateral - Formulários e Lista de Convidados */}
      {showSidebar && selectedCamarote && (
        <div className="lg:w-1/2 bg-white p-6 rounded-xl shadow-lg animate-slide-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {showSidebar === 'reserve' ? `Reservar ${selectedCamarote.nome_camarote}` : `Editar Reserva`}
              </h3>
              <button onClick={() => setShowSidebar(null)} className="text-gray-500 hover:text-red-600"><MdClose size={24} /></button>
            </div>
          
            <div className="flex flex-col xl:flex-row gap-6">
                {/* Formulário de Edição */}
                <form onSubmit={handleReservationSubmit} className="space-y-4 flex-1">
                    {/* Status e Hora */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Status da Reserva</label>
                            <select name="status_reserva" value={reservationData.status_reserva || ''} onChange={handleFormChange} className="form-input">
                                <option value="disponivel">Disponível</option>
                                <option value="reservado">Reservado</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="pre-reservado">Pré-reservado</option>
                                <option value="aguardando-aprovacao">Aguardando Aprovação</option>
                                <option value="aguardando-cancelamento">Aguardando Cancelamento</option>
                                <option value="bloqueado">Bloqueado</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Hora da Reserva (Opcional)</label>
                            <input type="time" name="hora_reserva" value={reservationData.hora_reserva || ''} onChange={handleFormChange} className="form-input" />
                        </div>
                    </div>
                    {/* Data da Reserva e Expiração */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Data da Reserva</label>
                            <input type="date" name="data_reserva" value={reservationData.data_reserva || ''} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div>
                            <label className="form-label">Data de Expiração</label>
                            <input type="date" name="data_expiracao" value={reservationData.data_expiracao || ''} onChange={handleFormChange} className="form-input" />
                        </div>
                    </div>
                    {/* Nome e Telefone */}
                     <div>
                        <label className="form-label">Nome</label>
                        <input type="text" name="nome_cliente" required value={reservationData.nome_cliente || ''} onChange={handleFormChange} className="form-input" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Telefone</label>
                            <input type="tel" name="telefone" value={reservationData.telefone || ''} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label">Enviar SMS</label>
                           <select name="enviar_sms" value={String(reservationData.enviar_sms === true ? 'true' : 'false')} onChange={handleFormChange} className="form-input">
                                <option value="true">Sim</option>
                                <option value="false">Não</option>
                            </select>
                        </div>
                    </div>
                    {/* Documento e Nascimento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">CPF/CNPJ</label>
                            <input type="text" name="cpf_cnpj" value={reservationData.cpf_cnpj || ''} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div>
                            <label className="form-label">Data de Nascimento</label>
                            <input type="date" name="data_nascimento" value={reservationData.data_nascimento || ''} onChange={handleFormChange} className="form-input" />
                        </div>
                    </div>
                     {/* Pessoas e Entradas */}
                    <div>
                        <label className="form-label">Máximo de Pessoas</label>
                        <input type="number" data-type="number" name="maximo_pessoas" value={reservationData.maximo_pessoas || ''} onChange={handleFormChange} className="form-input" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="form-label">Free Unisex</label>
                            <input type="number" data-type="number" name="entradas_unisex_free" value={reservationData.entradas_unisex_free || 0} onChange={handleFormChange} className="form-input" />
                        </div>
                         <div>
                            <label className="form-label">Free Masc</label>
                            <input type="number" data-type="number" name="entradas_masculino_free" value={reservationData.entradas_masculino_free || 0} onChange={handleFormChange} className="form-input" />
                        </div>
                         <div>
                            <label className="form-label">Free Fem</label>
                            <input type="number" data-type="number" name="entradas_feminino_free" value={reservationData.entradas_feminino_free || 0} onChange={handleFormChange} className="form-input" />
                        </div>
                         <div>
                            <label className="form-label">Pulseiras</label>
                            <input type="number" data-type="number" name="pulseiras" value={reservationData.pulseiras || 0} onChange={handleFormChange} className="form-input" />
                        </div>
                    </div>
                    {/* Valores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Valor Camarote (R$)</label>
                            <input type="number" data-type="number" step="0.01" name="valor_camarote" value={reservationData.valor_camarote || 0} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div>
                            <label className="form-label">Valor Consumação (R$)</label>
                            <input type="number" data-type="number" step="0.01" name="valor_consumacao" value={reservationData.valor_consumacao || 0} onChange={handleFormChange} className="form-input" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                            <label className="form-label">Valor do Sinal (R$)</label>
                            <input type="number" data-type="number" step="0.01" name="valor_sinal" value={reservationData.valor_sinal || 0} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div>
                            <label className="form-label">Valor Pago (R$)</label>
                            <input type="number" data-type="number" step="0.01" name="valor_pago" value={reservationData.valor_pago || 0} onChange={handleFormChange} className="form-input" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Prazo Pagto. Sinal (dias)</label>
                            <input type="number" data-type="number" name="prazo_sinal_dias" value={reservationData.prazo_sinal_dias || 0} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div>
                            <label className="form-label text-green-600 font-semibold">Valor Total (R$)</label>
                            <div className="form-input bg-green-50 border-green-200 text-green-700 font-bold text-lg">
                              R$ {(Number(reservationData.valor_sinal || 0) + Number(reservationData.valor_pago || 0)).toFixed(2)}
                            </div>
                        </div>
                    </div>
                     {/* Outros Campos */}
                     <div>
                        <label className="form-label">Solicitado por</label>
                        <input type="text" name="solicitado_por" value={reservationData.solicitado_por || ''} onChange={handleFormChange} className="form-input" />
                    </div>
                    <div>
                        <label className="form-label">Observação</label>
                        <textarea name="observacao" rows={3} value={reservationData.observacao || ''} onChange={handleFormChange} className="form-input"></textarea>
                    </div>
                    {/* Botões */}
                    <div className="flex gap-2 pt-4">
                        <button type="submit" className="btn-action bg-green-600 hover:bg-green-700 w-full">
                          <FaSave /> Salvar Alterações
                        </button>
                        <button type="button" onClick={() => setShowSidebar(null)} className="btn-action bg-gray-400 hover:bg-gray-500">
                          Cancelar
                        </button>
                    </div>
                </form>

                {/* Lista de Convidados (Aparece apenas na edição) */}
                {showSidebar === 'edit' && (
                    <div className="space-y-4 xl:w-2/5">
                        <h4 className="text-lg font-bold text-gray-800">Lista de Convidados ({guests.length})</h4>
                        <div className="bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
                            {guests.length > 0 ? (
                                <ul className="space-y-2">
                                {guests.map((guest, index) => (
                                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                                    <FaUserPlus className="text-gray-400" /> {guest.nome}
                                    </li>
                                ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">Nenhum convidado na lista.</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Nome do Convidado" value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)} className="form-input flex-1" />
                            <button onClick={handleAddGuest} className="btn-action bg-blue-500 hover:bg-blue-600"><FaPlusCircle/></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Modal para Editar Regras do Camarote */}
      {showRulesModal && selectedCamarote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Editar Regras - {selectedCamarote.nome_camarote}</h3>
                  <form onSubmit={handleRulesSubmit} className="space-y-4">
                      <div>
                          <label className="form-label">Capacidade Máxima de Pessoas</label>
                          <input 
                              type="number"
                              value={rulesData.capacidade_maxima || ''}
                              onChange={(e) => setRulesData({...rulesData, capacidade_maxima: parseInt(e.target.value)})}
                              className="form-input"
                          />
                      </div>
                      <div>
                          <label className="form-label">Observações / Regras Específicas</label>
                          <textarea 
                              rows={4}
                              value={rulesData.regras_especificas || ''}
                              onChange={(e) => setRulesData({...rulesData, regras_especificas: e.target.value})}
                              className="form-input"
                              placeholder="Ex: Consumação mínima obrigatória, não é permitido entrar com bebidas, etc."
                          />
                      </div>
                      <div className="flex justify-end gap-4 pt-4">
                          <button type="button" onClick={() => setShowRulesModal(false)} className="btn-action bg-gray-400 hover:bg-gray-500">Cancelar</button>
                          <button type="submit" className="btn-action bg-purple-600 hover:bg-purple-700"><FaSave/> Salvar Regras</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Modal para Ações de Reserva (Adiar/Cancelar) */}
      {showActionModal && selectedCamarote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Ações da Reserva</h3>
                  <p className="text-gray-600 mb-6">
                    Camarote: <strong>{selectedCamarote.nome_camarote}</strong><br/>
                    Cliente: <strong>{selectedCamarote.nome_cliente}</strong>
                  </p>
                  
                  <div className="space-y-4">
                      <button 
                          onClick={() => handleReservationAction('postpone')}
                          className="w-full btn-action bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2"
                      >
                          <MdSchedule /> Adiar Reserva (1 dia)
                      </button>
                      
                      <button 
                          onClick={() => handleReservationAction('cancel')}
                          className="w-full btn-action bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2"
                      >
                          <MdCancel /> Cancelar Reserva
                      </button>
                  </div>
                  
                  <div className="flex justify-end pt-6">
                      <button 
                          onClick={() => setShowActionModal(false)} 
                          className="btn-action bg-gray-400 hover:bg-gray-500"
                      >
                          Fechar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}