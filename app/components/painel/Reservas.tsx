// components/painel/Reservas.tsx

"use client";

import { useState, useEffect } from "react";
import { MdPeople, MdPhone, MdEmail, MdCalendarToday, MdAccessTime, MdClose } from "react-icons/md";
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
  regras_especificas?: string; // Campo para regras individuais do camarote
  reserva_camarote_id?: number;
  nome_cliente?: string;
  entradas_unisex_free?: number;
  entradas_masculino_free?: number;
  entradas_feminino_free?: number;
  valor_camarote?: number;
  valor_consumacao?: number;
  valor_pago?: number;
  status_reserva?: 'pre-reservado' | 'reservado' | 'confirmado' | 'aguardando-aprovacao' | 'aguardando-cancelamento' | 'disponivel' | 'bloqueado';
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
  maximo_pessoas: number;
  entradas_unisex_free: number;
  entradas_masculino_free: number;
  entradas_feminino_free: number;
  pulseiras: number; // Adicionado conforme sua lista
  valor_camarote: number;
  valor_consumacao: number;
  valor_sinal: number;
  valor_pago: number; // Adicionado para consistência
  prazo_sinal_dias: number;
  solicitado_por: string;
  observacao: string;
  lista_convidados: Guest[];
}

// --- Dados Mockados (Estrutura Fixa) ---
const fixedCamarotes: { [key: number]: Camarote[] } = {
    1: [ // High Line (ID 1) - 6 camarotes
        { id: 101, nome_camarote: "Highline-C1", capacidade_maxima: 10, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 102, nome_camarote: "Highline-C2", capacidade_maxima: 12, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 103, nome_camarote: "Highline-C3", capacidade_maxima: 8, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 104, nome_camarote: "Highline-C4", capacidade_maxima: 15, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 105, nome_camarote: "Highline-C5", capacidade_maxima: 20, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 106, nome_camarote: "Highline-C6", capacidade_maxima: 25, status: 'disponivel', regras_especificas: "Regra padrão" },
    ],
    2: [ // Seu Justino (ID 2) - 4 camarotes
        { id: 201, nome_camarote: "Justino-C1", capacidade_maxima: 10, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 202, nome_camarote: "Justino-C2", capacidade_maxima: 12, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 203, nome_camarote: "Justino-C3", capacidade_maxima: 8, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 204, nome_camarote: "Justino-C4", capacidade_maxima: 15, status: 'disponivel', regras_especificas: "Regra padrão" },
    ],
    3: [ // Oh Fregues (ID 4) - 5 camarotes
        { id: 401, nome_camarote: "Fregues-C1", capacidade_maxima: 10, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 402, nome_camarote: "Fregues-C2", capacidade_maxima: 12, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 403, nome_camarote: "Fregues-C3", capacidade_maxima: 8, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 404, nome_camarote: "Fregues-C4", capacidade_maxima: 15, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 405, nome_camarote: "Fregues-C5", capacidade_maxima: 20, status: 'disponivel', regras_especificas: "Regra padrão" },
    ],
    4: [ // Pracinha do Seu Justino (ID 3) - 2 camarotes
        { id: 801, nome_camarote: "Pracinha-C1", capacidade_maxima: 10, status: 'disponivel', regras_especificas: "Regra padrão" },
        { id: 802, nome_camarote: "Pracinha-C2", capacidade_maxima: 12, status: 'disponivel', regras_especificas: "Regra padrão" },
    ],
};

const getFixedCamarotesByEstablishmentId = (id: number): Camarote[] => {
    return fixedCamarotes[id] || [];
};

// --- Componente Principal ---
export default function ReservasCamarote({ establishment }: { establishment: Establishment }) {
  const [camarotes, setCamarotes] = useState<Camarote[]>(getFixedCamarotesByEstablishmentId(establishment.id));
  const [loading, setLoading] = useState(false);
  const [selectedCamarote, setSelectedCamarote] = useState<Camarote | null>(null);
  const [showSidebar, setShowSidebar] = useState<'reserve' | 'edit' | null>(null);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [reservationData, setReservationData] = useState<Partial<ReservationFormState>>({});
  const [rulesData, setRulesData] = useState<{ capacidade_maxima?: number; regras_especificas?: string }>({});
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = useState('');

  const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com';

  const getAuthToken = () => localStorage.getItem('authToken');
  
  // --- Funções de API e Ações ---

  const fetchReservas = async () => {
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
      const response = await fetch(`${API_BASE_URL}/api/reservas/camarotes/${establishment.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('Falha ao carregar reservas da API, exibindo lista fixa.');
        setCamarotes(fixedList);
        return;
      }

      const apiReservations = await response.json();
      const updatedCamarotes = fixedList.map(fixed => {
          const apiData = apiReservations.find((apiC: any) => apiC.nome_camarote === fixed.nome_camarote);
          return apiData ? { ...fixed, ...apiData } : fixed;
      });
      setCamarotes(updatedCamarotes);

    } catch (error) {
      console.error("Erro ao carregar reservas:", error);
      setCamarotes(fixedList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCamarotes(getFixedCamarotesByEstablishmentId(establishment.id));
    fetchReservas();
  }, [establishment.id]);

  const handleActionClick = async (camarote: Camarote, action: 'reserve' | 'edit') => {
    setSelectedCamarote(camarote);
    setShowSidebar(action);

    if (action === 'reserve') {
      setReservationData({
        status_reserva: 'pre-reservado',
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
            hora_reserva: data.hora_reserva ? data.hora_reserva.substring(0, 5) : '', // Formata HH:MM
            data_nascimento: data.data_nascimento ? data.data_nascimento.split('T')[0] : '', // Formata YYYY-MM-DD
        });
        setGuests(data.convidados || []);
      } catch (error) {
        console.error("Falha ao buscar detalhes da reserva", error);
      }
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
      // **LÓGICA DE SUBMISSÃO DAS REGRAS**
      // Substitua a URL e a lógica abaixo pela sua chamada de API real para ATUALIZAR UM CAMAROTE
      try {
          // Exemplo: PUT /api/camarotes/{camaroteId}
          const response = await fetch(`${API_BASE_URL}/api/camarotes/${selectedCamarote.id}`, { // URL HIPOTÉTICA
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
          fetchReservas(); // Re-sincroniza os dados
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

    const payload = {
        ...reservationData,
        id_camarote: selectedCamarote.id,
        id_estabelecimento: establishment.id,
        lista_convidados: guests,
    };
    
    const url = showSidebar === 'edit'
      ? `${API_BASE_URL}/api/reservas/camarote/${selectedCamarote.reserva_camarote_id}`
      : `${API_BASE_URL}/api/reservas/camarote`;
      
    const method = showSidebar === 'edit' ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Falha na operação de reserva.`);
      }
      alert(`Reserva ${showSidebar === 'edit' ? 'atualizada' : 'criada'} com sucesso!`);
      setShowSidebar(null);
      fetchReservas();
    } catch (error) {
      console.error(`Erro ao ${method === 'POST' ? 'criar' : 'atualizar'} reserva:`, error);
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
        finalValue = value === '' ? '' : parseFloat(value);
      }
      
      setReservationData(prev => ({ ...prev, [name]: finalValue }));
  };


  // --- Renderização ---
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Coluna Principal - Lista de Camarotes */}
      <div className={showSidebar ? "lg:w-1/2" : "w-full"}>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Reservas de Camarotes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {camarotes.map((camarote) => (
            <div key={camarote.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
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
                    <p className="flex items-center gap-2">Valor Pago: R$ {camarote.valor_pago?.toFixed(2) || '0.00'}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {camarote.status === 'disponivel' && !camarote.reserva_camarote_id && (
                  <button onClick={() => handleActionClick(camarote, 'reserve')} className="btn-action bg-yellow-500 hover:bg-yellow-600"><FaPlusCircle /> Reservar</button>
                )}
                {camarote.reserva_camarote_id && (
                  <button onClick={() => handleActionClick(camarote, 'edit')} className="btn-action bg-blue-500 hover:bg-blue-600"><FaEdit /> Editar Reserva</button>
                )}
                <button onClick={() => handleEditRulesClick(camarote)} className="btn-action bg-purple-500 hover:bg-purple-600"><FaGavel /> Editar Regras</button>
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
                           <select name="enviar_sms" value={String(reservationData.enviar_sms || 'false')} onChange={handleFormChange} className="form-input">
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
                            <label className="form-label">Prazo Pagto. Sinal (dias)</label>
                            <input type="number" data-type="number" name="prazo_sinal_dias" value={reservationData.prazo_sinal_dias || 0} onChange={handleFormChange} className="form-input" />
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
                        <button type="submit" className="btn-action bg-green-600 hover:bg-green-700 w-full"><FaSave /> Salvar Alterações</button>
                        <button type="button" onClick={() => setShowSidebar(null)} className="btn-action bg-gray-400 hover:bg-gray-500">Cancelar</button>
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
    </div>
  );
}