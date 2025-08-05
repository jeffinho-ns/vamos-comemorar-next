"use client";

import { useState, useEffect } from "react";
import { MdList, MdPeople, MdEvent, MdAdd, MdEdit, MdDelete, MdSettings } from "react-icons/md";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface GuestList {
  id: number;
  eventName: string;
  totalGuests: number;
  confirmedGuests: number;
  pendingGuests: number;
  date: string;
  status: 'active' | 'closed' | 'draft';
  // Novas propriedades adicionadas
  allowInsert: boolean;
  allowConvert: boolean;
  value: number;
  consumption: number;
}

interface ListasProps {
  establishment: Establishment;
}

// Dados mockados para simular a busca de listas de convidados
const mockLists: Record<number, GuestList[]> = {
  1: [
    {
      id: 1,
      eventName: "Lista Deroma (VIP)",
      totalGuests: 100,
      confirmedGuests: 35,
      pendingGuests: 65,
      date: "2024-02-15",
      status: 'active',
      allowInsert: true,
      allowConvert: true,
      value: 0,
      consumption: 0,
    },
    {
      id: 2,
      eventName: "Lista Especial Aniversário",
      totalGuests: 200,
      confirmedGuests: 150,
      pendingGuests: 50,
      date: "2024-02-20",
      status: 'active',
      allowInsert: true,
      allowConvert: true,
      value: 40,
      consumption: 120,
    },
    {
      id: 3,
      eventName: "Lista Sábado",
      totalGuests: 500,
      confirmedGuests: 420,
      pendingGuests: 80,
      date: "2024-02-22",
      status: 'active',
      allowInsert: false,
      allowConvert: true,
      value: 50,
      consumption: 150,
    }
  ],
  2: [],
};

// Dados mockados para simular outros eventos para importação de configurações
const mockEvents = [
  { id: 101, name: "Sunset Party 2024" },
  { id: 102, name: "Réveillon Highline 2023" },
  { id: 103, name: "Festa de Lançamento" },
];

export default function Listas({ establishment }: ListasProps) {
  const [lists, setLists] = useState<GuestList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState(false);
  const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
  const [isNameInsertionModalOpen, setIsNameInsertionModalOpen] = useState(false);

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);
      try {
        setLists(mockLists[establishment.id] || []);
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, [establishment.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  const openGeneralSettings = () => {
    setIsGeneralSettingsOpen(true);
  };

  const closeGeneralSettings = () => {
    setIsGeneralSettingsOpen(false);
  };

  const openAddListModal = () => {
    setIsAddListModalOpen(true);
  };

  const closeAddListModal = () => {
    setIsAddListModalOpen(false);
  };

  const openNameInsertionModal = () => {
    setIsNameInsertionModalOpen(true);
  };

  const closeNameInsertionModal = () => {
    setIsNameInsertionModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header com configurações gerais e adicionar lista */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800">Listas de Convidados</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
            onClick={openGeneralSettings}
          >
            <MdSettings />
            Configurações Gerais
          </button>
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition-colors"
            onClick={openAddListModal}
          >
            <MdAdd />
            Nova Lista
          </button>
        </div>
      </div>

      {/* Lista de eventos */}
      <div className="space-y-4">
        {lists.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma lista encontrada</h3>
            <p className="text-gray-500">
              Não há listas de convidados para este estabelecimento.
            </p>
          </div>
        ) : (
          lists.map((list) => (
            <div key={list.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {list.eventName}
                      </h3>
                      <p className="text-gray-600">
                        {new Date(list.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${
                      list.status === 'active'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : list.status === 'closed'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {list.status === 'active' ? 'Ativa' : list.status === 'closed' ? 'Fechada' : 'Rascunho'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <MdPeople className="text-blue-500" />
                      <span className="text-gray-700">{list.totalGuests} total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdEvent className="text-green-500" />
                      <span className="text-gray-700">{list.confirmedGuests} confirmados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdList className="text-yellow-500" />
                      <span className="text-gray-700">{list.pendingGuests} pendentes</span>
                    </div>
                  </div>
                </div>

                <div className="lg:text-right mt-4 lg:mt-0">
                  <div className="text-sm text-gray-600 mb-2">
                    Progresso: {Math.round((list.confirmedGuests / list.totalGuests) * 100)}%
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(list.confirmedGuests / list.totalGuests) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  Ver Convidados
                </button>
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                  onClick={openNameInsertionModal}
                >
                  Adicionar Convidados
                </button>
                <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">
                  <MdEdit className="inline mr-1" />
                  Editar
                </button>
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                  <MdDelete className="inline mr-1" />
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {isGeneralSettingsOpen && (
        <GeneralSettingsModal onClose={closeGeneralSettings} />
      )}
      {isAddListModalOpen && (
        <AddListModal onClose={closeAddListModal} />
      )}
      {isNameInsertionModalOpen && (
        <NameInsertionModal onClose={closeNameInsertionModal} lists={lists} />
      )}
    </div>
  );
}

// General Settings Modal
function GeneralSettingsModal({ onClose }: { onClose: () => void }) {
  const [needCPF, setNeedCPF] = useState(false);
  const [allowPublicInsert, setAllowPublicInsert] = useState(false);
  const [allowCashierInsert, setAllowCashierInsert] = useState(false);
  const [requirePaymentInfo, setRequirePaymentInfo] = useState(false);
  const [doubleCheck, setDoubleCheck] = useState(false);
  const [totalCapacity, setTotalCapacity] = useState<number | undefined>(undefined);
  const [systemLimitDate, setSystemLimitDate] = useState<Date | null>(null);
  const [publicLimitDate, setPublicLimitDate] = useState<Date | null>(null);
  const [conversionLimitDate, setConversionLimitDate] = useState<Date | null>(null);
  const [internalNotes, setInternalNotes] = useState("");

  const handleImportConfig = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`Importando configurações do evento ID: ${e.target.value}`);
    // Lógica para importar configurações de outro evento
  };

  const handleSave = () => {
    // Lógica para salvar as configurações
    console.log("Salvando configurações gerais...", {
      needCPF, allowPublicInsert, allowCashierInsert, requirePaymentInfo, doubleCheck,
      totalCapacity, systemLimitDate, publicLimitDate, conversionLimitDate, internalNotes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3 text-left">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Configurações Gerais</h3>
          <div className="mt-2 px-7 py-3 space-y-4">
            {/* Importar configurações */}
            <div>
              <label htmlFor="importConfig" className="block text-sm font-medium text-gray-700">
                Importar configurações de outro evento:
              </label>
              <select id="importConfig" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" onChange={handleImportConfig}>
                <option value="">Selecione um evento</option>
                {mockEvents.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>

            {/* Capacidade total */}
            <div>
              <label htmlFor="totalCapacity" className="block text-sm font-medium text-gray-700">
                Capacidade total de nomes inseridos nesse evento:
              </label>
              <input
                type="number"
                id="totalCapacity"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={totalCapacity || ''}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
              />
            </div>

            {/* Ações rápidas */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-800 mb-2">Ações rápidas e utilitários:</h4>
              <div className="flex flex-wrap gap-2">
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm">
                  Adicionar Novo Produto
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm">
                  Gerenciar Comissões
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm">
                  Imprimir Voucher de Teste
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm">
                  Gerenciar BlackList
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm">
                  Automatizações
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm">
                  Enviar E-mail
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm">
                  Formulário Personalizado
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm">
                  Adicionar Nomes Pós Evento
                </button>
              </div>
            </div>

            {/* Regras e permissões gerais */}
            <div className="space-y-2 border-t pt-4">
              <label className="block text-sm font-medium text-gray-700">Regras e permissões gerais:</label>
              <div className="flex items-center">
                <input type="checkbox" id="needCPF" className="form-checkbox h-5 w-5 text-indigo-600" checked={needCPF} onChange={(e) => setNeedCPF(e.target.checked)} />
                <label htmlFor="needCPF" className="ml-2 text-gray-900">Precisa CPF?</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="allowPublicInsert" className="form-checkbox h-5 w-5 text-indigo-600" checked={allowPublicInsert} onChange={(e) => setAllowPublicInsert(e.target.checked)} />
                <label htmlFor="allowPublicInsert" className="ml-2 text-gray-900">Ativar botão de inserir nomes no site público</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="allowCashierInsert" className="form-checkbox h-5 w-5 text-indigo-600" checked={allowCashierInsert} onChange={(e) => setAllowCashierInsert(e.target.checked)} />
                <label htmlFor="allowCashierInsert" className="ml-2 text-gray-900">Permitir que Caixa insira nomes na busca</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="requirePaymentInfo" className="form-checkbox h-5 w-5 text-indigo-600" checked={requirePaymentInfo} onChange={(e) => setRequirePaymentInfo(e.target.checked)} />
                <label htmlFor="requirePaymentInfo" className="ml-2 text-gray-900">Exigir que caixas informem forma de pagamento ao converter nomes</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="doubleCheck" className="form-checkbox h-5 w-5 text-indigo-600" checked={doubleCheck} onChange={(e) => setDoubleCheck(e.target.checked)} />
                <label htmlFor="doubleCheck" className="ml-2 text-gray-900">Este evento possui double check?</label>
              </div>
            </div>

            {/* Datas limite */}
            <div className="space-y-2 border-t pt-4">
              <label className="block text-sm font-medium text-gray-700">Datas limite de inserção e conversão:</label>
              <div>
                <label htmlFor="systemLimitDate" className="block text-sm font-medium text-gray-700">Sistema (Backend/Admin):</label>
                <input type="datetime-local" id="systemLimitDate" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={systemLimitDate ? format(systemLimitDate, "yyyy-MM-dd'T'HH:mm") : ""} onChange={(e) => setSystemLimitDate(e.target.value ? parseISO(e.target.value) : null)} />
              </div>
              <div>
                <label htmlFor="publicLimitDate" className="block text-sm font-medium text-gray-700">Site Público (Formulário):</label>
                <input type="datetime-local" id="publicLimitDate" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={publicLimitDate ? format(publicLimitDate, "yyyy-MM-dd'T'HH:mm") : ""} onChange={(e) => setPublicLimitDate(e.target.value ? parseISO(e.target.value) : null)} />
              </div>
              <div>
                <label htmlFor="conversionLimitDate" className="block text-sm font-medium text-gray-700">Conversão (Check-in):</label>
                <input type="datetime-local" id="conversionLimitDate" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={conversionLimitDate ? format(conversionLimitDate, "yyyy-MM-dd'T'HH:mm") : ""} onChange={(e) => setConversionLimitDate(e.target.value ? parseISO(e.target.value) : null)} />
              </div>
            </div>

            {/* Observações */}
            <div className="border-t pt-4">
              <label htmlFor="internalNotes" className="block text-sm font-medium text-gray-700">Observações:</label>
              <textarea id="internalNotes" rows={3} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)}></textarea>
            </div>
          </div>
          <div className="items-center px-4 py-3">
            <button
              className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
              onClick={handleSave}
            >
              Salvar
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 mt-2"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add List Modal
function AddListModal({ onClose }: { onClose: () => void }) {
  const [listName, setListName] = useState("");
  const [allowInsert, setAllowInsert] = useState(true);
  const [allowConvert, setAllowConvert] = useState(true);
  const [value, setValue] = useState<number | undefined>(undefined);
  const [consumption, setConsumption] = useState<number | undefined>(undefined);
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  const handleSave = () => {
    console.log("Adicionando nova lista...", {
      listName, allowInsert, allowConvert, value, consumption, capacity, startTime, endTime
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3 text-left">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Adicionar Nova Lista</h3>
          <div className="mt-2 px-7 py-3 space-y-4">
            <div>
              <label htmlFor="listName" className="block text-sm font-medium text-gray-700">Nome da Lista:</label>
              <input type="text" id="listName" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={listName} onChange={(e) => setListName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Permissões:</label>
              <div className="flex items-center">
                <input type="checkbox" id="allowInsert" className="form-checkbox h-5 w-5 text-indigo-600" checked={allowInsert} onChange={(e) => setAllowInsert(e.target.checked)} />
                <label htmlFor="allowInsert" className="ml-2 text-gray-900">Permite Inserir Nomes?</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="allowConvert" className="form-checkbox h-5 w-5 text-indigo-600" checked={allowConvert} onChange={(e) => setAllowConvert(e.target.checked)} />
                <label htmlFor="allowConvert" className="ml-2 text-gray-900">Permite Converter Nomes?</label>
              </div>
            </div>

            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700">Valor:</label>
              <input type="number" id="value" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={value || ''} onChange={(e) => setValue(Number(e.target.value))} />
            </div>

            <div>
              <label htmlFor="consumption" className="block text-sm font-medium text-gray-700">Consumo:</label>
              <input type="number" id="consumption" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={consumption || ''} onChange={(e) => setConsumption(Number(e.target.value))} />
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacidade de Nomes:</label>
              <input type="number" id="capacity" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={capacity || ''} onChange={(e) => setCapacity(Number(e.target.value))} />
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Horário de Início:</label>
              <input type="time" id="startTime" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">Horário de Fim:</label>
              <input type="time" id="endTime" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="items-center px-4 py-3">
            <button
              className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
              onClick={handleSave}
            >
              Adicionar Lista
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 mt-2"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Name Insertion Modal
function NameInsertionModal({ onClose, lists }: { onClose: () => void, lists: GuestList[] }) {
  const [selectedList, setSelectedList] = useState<number | ''>('');
  const [guestNames, setGuestNames] = useState('');
  const [insertedBy, setInsertedBy] = useState('');
  const [observation, setObservation] = useState('');
  const [guestListDetails, setGuestListDetails] = useState<GuestList | null>(null);

  useEffect(() => {
    if (selectedList) {
      setGuestListDetails(lists.find(list => list.id === selectedList) || null);
    } else {
      setGuestListDetails(null);
    }
  }, [selectedList, lists]);

  const handleInsertNames = () => {
    console.log('--- Inserindo Nomes ---');
    console.log('Lista selecionada:', guestListDetails?.eventName);
    console.log('Inserido por:', insertedBy);
    console.log('Observação:', observation);

    const names = guestNames.split('\n').filter(name => name.trim() !== '');
    const processedNames = names.flatMap(line => {
      const match = line.match(/(.*)\[(\d+)\]$/);
      if (match) {
        const name = match[1].trim();
        const companions = parseInt(match[2], 10);
        return [{ name, companions }];
      } else {
        return [{ name: line.trim(), companions: 0 }];
      }
    });

    console.log('Nomes processados:', processedNames);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3 text-left">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Inserção de Nomes</h3>
          <div className="mt-2 px-7 py-3 space-y-4">
            <div>
              <label htmlFor="lista" className="block text-sm font-medium text-gray-700">
                Selecione a Lista:
              </label>
              <select
                id="lista"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={selectedList}
                onChange={(e) => setSelectedList(Number(e.target.value) || '')}
              >
                <option value="">Selecione...</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.eventName}
                  </option>
                ))}
              </select>
            </div>
            {guestListDetails && (
              <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700">
                <p><strong>Horários:</strong> até às 22h - VIP / 22h-00:30 - R${guestListDetails.value} seco ou R${guestListDetails.consumption} consome</p>
                <p><strong>Capacidade:</strong> {guestListDetails.confirmedGuests}/{guestListDetails.totalGuests} inseridos</p>
              </div>
            )}

            <div>
              <label htmlFor="nomes" className="block text-sm font-medium text-gray-700">
                Nomes (um por linha):
              </label>
              <textarea
                id="nomes"
                rows={5}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={guestNames}
                onChange={(e) => setGuestNames(e.target.value)}
              />
            </div>
            <div className="bg-blue-100 p-3 rounded-md text-sm text-blue-800">
              <p className="font-semibold">Regras e Ajuda:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Insira um nome por linha.</li>
                <li>Para acompanhantes, use `[número]` no final do nome. Ex: `João da Silva [2]`</li>
                <li>Telefones/emails/CPFs podem ser adicionados na mesma linha.</li>
              </ul>
            </div>

            <div>
              <label htmlFor="inseridoPor" className="block text-sm font-medium text-gray-700">
                Inserido Por:
              </label>
              <input
                type="text"
                id="inseridoPor"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={insertedBy}
                onChange={(e) => setInsertedBy(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="observacao" className="block text-sm font-medium text-gray-700">
                Observação:
              </label>
              <textarea
                id="observacao"
                rows={2}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>
          </div>
          <div className="items-center px-4 py-3">
            <button
              className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
              onClick={handleInsertNames}
            >
              Inserir Nomes
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 mt-2"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}