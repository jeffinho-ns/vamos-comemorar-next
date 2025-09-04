"use client";

import { useState, useEffect, useCallback } from "react";
import { MdList, MdPeople, MdEvent, MdAdd, MdEdit, MdDelete, MdSettings, MdCheck, MdClose, MdAccessTime, MdImportExport, MdExpandMore, MdExpandLess } from "react-icons/md";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface EventConfig {
  id: number;
  eventId: number;
  totalCapacity: number | null;
  needCPF: boolean;
  allowPublicInsert: boolean;
  allowCashierInsert: boolean;
  requirePaymentInfo: boolean;
  doubleCheck: boolean;
  systemLimitDate: string | null;
  publicLimitDate: string | null;
  conversionLimitDate: string | null;
  observations: string | null;
}

interface ProductList {
  id: number;
  eventId: number;
  name: string;
  description: string;
  value: number;
  consumption: number;
  capacity: number;
  insertedCount: number;
  confirmedCount: number;
  startTime: string;
  endTime: string;
  allowInsert: boolean;
  allowConvert: boolean;
  status: 'active' | 'inactive';
}

interface Guest {
  id: number;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  companions: number;
  status: 'pending' | 'confirmed' | 'checked-in';
  insertedBy: string;
  observation: string | null;
  insertedAt: string;
}

interface ListasProps {
  establishment: Establishment;
}

export default function Listas({ establishment }: ListasProps) {
  const [loading, setLoading] = useState(true);
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState(false);
  const [isNameInsertionOpen, setIsNameInsertionOpen] = useState(false);
  const [isProductConfigOpen, setIsProductConfigOpen] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [guestNames, setGuestNames] = useState('');
  const [insertedBy, setInsertedBy] = useState('');
  const [observation, setObservation] = useState('');
  const [isGuestListModalOpen, setIsGuestListModalOpen] = useState(false);
  const [selectedListForGuests, setSelectedListForGuests] = useState<ProductList | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>('configuracoes');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar configurações do evento
      const configResponse = await fetch(`/api/events/${establishment.id}/config`);
      if (configResponse.ok) {
        const config = await configResponse.json();
        setEventConfig(config);
      }

      // Buscar listas de produtos
      const listsResponse = await fetch(`/api/events/${establishment.id}/products`);
      if (listsResponse.ok) {
        const lists = await listsResponse.json();
        setProductLists(lists);
        if (lists.length > 0) {
          setSelectedList(lists[0].id);
        }
      }

      // Buscar eventos disponíveis para importação
      const eventsResponse = await fetch('/api/events');
      if (eventsResponse.ok) {
        const events = await eventsResponse.json();
        setAvailableEvents(events);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [establishment.id]);

  useEffect(() => {
    fetchData();
  }, [establishment.id, fetchData]);

  const handleImportConfig = async (eventId: string) => {
    if (!eventId) return;
    
    try {
      const response = await fetch(`/api/events/${eventId}/config`);
      if (response.ok) {
        const importedConfig = await response.json();
        setEventConfig(importedConfig);
        // Salvar configuração importada
        await fetch(`/api/events/${establishment.id}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importedConfig)
        });
      }
    } catch (error) {
      console.error("Erro ao importar configurações:", error);
    }
  };

  const handleSaveConfig = async (config: EventConfig) => {
    try {
      const response = await fetch(`/api/events/${establishment.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (response.ok) {
        setEventConfig(config);
        setIsGeneralSettingsOpen(false);
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  const handleInsertNames = async (names: string[], listId: number, insertedBy: string, observation: string) => {
    try {
      const response = await fetch(`/api/events/${establishment.id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId,
          names,
          insertedBy,
          observation
        })
      });
      if (response.ok) {
        // Recarregar dados
        fetchData();
        setIsNameInsertionOpen(false);
      }
    } catch (error) {
      console.error("Erro ao inserir nomes:", error);
    }
  };

  const handleOpenGuestList = (list: ProductList) => {
    setSelectedListForGuests(list);
    setIsGuestListModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com configurações gerais */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800">Configurações Gerais</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition-colors"
            onClick={() => setIsGeneralSettingsOpen(true)}
          >
            <MdImportExport />
            Importar configurações de outro evento
          </button>
        </div>
      </div>

      {/* Acordeão de Configurações */}
      <div className="space-y-4">
        {/* Configurações Gerais */}
        <AccordionItem
          title="Configurações Gerais"
          isOpen={openAccordion === 'configuracoes'}
          onToggle={() => setOpenAccordion(openAccordion === 'configuracoes' ? null : 'configuracoes')}
        >
          <div className="space-y-4">
            {/* Capacidade total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidade total de nomes inseridos nesse evento:
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={eventConfig?.totalCapacity || ''}
                onChange={(e) => setEventConfig(prev => prev ? {...prev, totalCapacity: Number(e.target.value)} : null)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Este campo limita a quantidade máxima de nomes inseridos, independente do tipo de produto.
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="needCPF"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={eventConfig?.needCPF || false}
                  onChange={(e) => setEventConfig(prev => prev ? {...prev, needCPF: e.target.checked} : null)}
                />
                <label htmlFor="needCPF" className="ml-2 text-sm text-gray-700">Precisa CPF?</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowPublicInsert"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={eventConfig?.allowPublicInsert || false}
                  onChange={(e) => setEventConfig(prev => prev ? {...prev, allowPublicInsert: e.target.checked} : null)}
                />
                <label htmlFor="allowPublicInsert" className="ml-2 text-sm text-gray-700">
                  Ativar botão de inserir nomes na lista no site público do evento? ** Caso esteja desativado, o acesso é somente por link direto.
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowCashierInsert"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={eventConfig?.allowCashierInsert || false}
                  onChange={(e) => setEventConfig(prev => prev ? {...prev, allowCashierInsert: e.target.checked} : null)}
                />
                <label htmlFor="allowCashierInsert" className="ml-2 text-sm text-gray-700">
                  Permitir que Caixa insira nomes ao buscar?
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requirePaymentInfo"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={eventConfig?.requirePaymentInfo || false}
                  onChange={(e) => setEventConfig(prev => prev ? {...prev, requirePaymentInfo: e.target.checked} : null)}
                />
                <label htmlFor="requirePaymentInfo" className="ml-2 text-sm text-gray-700">
                  Exigir que caixas informem a forma de pagamento ao converter nomes?
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="doubleCheck"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={eventConfig?.doubleCheck || false}
                  onChange={(e) => setEventConfig(prev => prev ? {...prev, doubleCheck: e.target.checked} : null)}
                />
                <label htmlFor="doubleCheck" className="ml-2 text-sm text-gray-700">
                  Este evento possui double check? (dupla validação)
                </label>
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                Imprimir Voucher de Teste
              </button>
              <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                Gerenciar BlackList
              </button>
              <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                Automatizações
              </button>
              <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                Enviar E-mail
              </button>
              <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1">
                <MdCheck />
                Formulário Personalizado
              </button>
              <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                Adicionar Nomes Pós Evento
              </button>
            </div>
          </div>
        </AccordionItem>

        {/* Data limite para inserir nomes */}
        <AccordionItem
          title="Data limite para inserir nomes"
          isOpen={openAccordion === 'datas-insercao'}
          onToggle={() => setOpenAccordion(openAccordion === 'datas-insercao' ? null : 'datas-insercao')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Sistema</h5>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={eventConfig?.systemLimitDate ? format(parseISO(eventConfig.systemLimitDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setEventConfig(prev => prev ? {...prev, systemLimitDate: e.target.value} : null)}
                />
                <div className="relative">
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={eventConfig?.systemLimitDate ? format(parseISO(eventConfig.systemLimitDate), 'HH:mm') : ''}
                    onChange={(e) => setEventConfig(prev => prev ? {...prev, systemLimitDate: e.target.value} : null)}
                  />
                  <MdAccessTime className="absolute right-2 top-2.5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Site Público</h5>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={eventConfig?.publicLimitDate ? format(parseISO(eventConfig.publicLimitDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setEventConfig(prev => prev ? {...prev, publicLimitDate: e.target.value} : null)}
                />
                <div className="relative">
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={eventConfig?.publicLimitDate ? format(parseISO(eventConfig.publicLimitDate), 'HH:mm') : ''}
                    onChange={(e) => setEventConfig(prev => prev ? {...prev, publicLimitDate: e.target.value} : null)}
                  />
                  <MdAccessTime className="absolute right-2 top-2.5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Data limite para conversão */}
        <AccordionItem
          title="Data limite para conversão"
          isOpen={openAccordion === 'datas-conversao'}
          onToggle={() => setOpenAccordion(openAccordion === 'datas-conversao' ? null : 'datas-conversao')}
        >
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Sistema</h5>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={eventConfig?.conversionLimitDate ? format(parseISO(eventConfig.conversionLimitDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => setEventConfig(prev => prev ? {...prev, conversionLimitDate: e.target.value} : null)}
              />
              <div className="relative">
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={eventConfig?.conversionLimitDate ? format(parseISO(eventConfig.conversionLimitDate), 'HH:mm') : ''}
                  onChange={(e) => setEventConfig(prev => prev ? {...prev, conversionLimitDate: e.target.value} : null)}
                />
                <MdAccessTime className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Observações */}
        <AccordionItem
          title="Observações"
          isOpen={openAccordion === 'observacoes'}
          onToggle={() => setOpenAccordion(openAccordion === 'observacoes' ? null : 'observacoes')}
        >
          <div className="space-y-4">
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={eventConfig?.observations || ''}
              onChange={(e) => setEventConfig(prev => prev ? {...prev, observations: e.target.value} : null)}
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              onClick={() => eventConfig && handleSaveConfig(eventConfig)}
            >
              Salvar
            </button>
          </div>
        </AccordionItem>

        {/* Configurar Produtos */}
        <AccordionItem
          title="Configurar Produtos"
          isOpen={openAccordion === 'produtos'}
          onToggle={() => setOpenAccordion(openAccordion === 'produtos' ? null : 'produtos')}
        >
          <div>
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              onClick={() => setIsProductConfigOpen(true)}
            >
              Configurar Produtos
            </button>
          </div>
        </AccordionItem>
      </div>

      {/* Inserir Nomes */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Inserir Nomes</h4>
          <div className="flex gap-2">
            <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
              Consultar Nomes Inseridos
            </button>
            <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
              Importar Planilha XLS
            </button>
          </div>
        </div>

                 {/* Seleção de produto */}
         <div className="mb-4">
           <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o produto:</label>
           <div className="space-y-2">
             {productLists.map((list) => (
               <div
                 key={list.id}
                 className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                   selectedList === list.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                 }`}
                 onClick={() => setSelectedList(list.id)}
               >
                 <div className="flex justify-between items-start">
                   <div className="flex-1">
                     <h5 className="font-medium text-gray-800">{list.name}</h5>
                     <p className="text-sm text-gray-600">{list.description}</p>
                   </div>
                   <div className="text-right text-sm text-gray-600">
                     <div>R$ {list.value.toFixed(2)} / R$ {list.consumption.toFixed(2)}</div>
                     <div>{list.insertedCount}/{list.capacity}</div>
                   </div>
                   <button
                     className="ml-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                     onClick={(e) => {
                       e.stopPropagation();
                       handleOpenGuestList(list);
                     }}
                   >
                     Ver Nomes
                   </button>
                 </div>
               </div>
             ))}
           </div>
         </div>

                 {/* Área de inserção de nomes */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
             <label className="block text-sm font-medium text-gray-700 mb-2">Nomes</label>
             <textarea
               rows={10}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
               placeholder="Digite 1 nome por linha. Clique em 'Enviar Nomes' e aguarde a notificação VERDE de confirmação."
               value={guestNames}
               onChange={(e) => setGuestNames(e.target.value)}
             />
            <div className="mt-2 text-sm text-gray-600">
              <p>Atenção: Pontuações e numerais serão retirados dos nomes.</p>
              <p className="mt-1">
                NOVO Para inserir nomes com acompanhantes, escreva o número de acompanhantes ao lado do nome, dentro de colchetes. 
                Exemplo de um nome que levará mais 2 acompanhantes: Rodrigo Silva [2]
              </p>
              <div className="mt-2">
                <p className="font-medium">Exemplos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>João da Silva</li>
                  <li>João da Silva (48) 93843-9374</li>
                  <li>João da Silva joao.silva@yahoo.com.br 176.578.615-09</li>
                  <li>João da Silva 176.578.615-09</li>
                  <li>João da Silva joao.silva@yahoo.com.br</li>
                  <li>João da Silva 764830 joao.silva@yahoo.com.br</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
                         <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Inserido por</label>
               <select 
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={insertedBy}
                 onChange={(e) => setInsertedBy(e.target.value)}
               >
                 <option value="">Selecione quem está inserindo...</option>
                 <option value="Highline Bar SP - Highline">Highline Bar SP - Highline</option>
                 <option value="Seu Justino - Admin">Seu Justino - Admin</option>
                 <option value="Oh Freguês - Admin">Oh Freguês - Admin</option>
                 <option value="Pracinha do Seu Justino - Admin">Pracinha do Seu Justino - Admin</option>
                 <option value="Reserva Rooftop - Admin">Reserva Rooftop - Admin</option>
                 <option value="Sistema Automático">Sistema Automático</option>
                 <option value="Caixa - Presencial">Caixa - Presencial</option>
                 <option value="Promoter - Externo">Promoter - Externo</option>
               </select>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Observação (opcional)</label>
               <textarea
                 rows={4}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                 placeholder="Você pode atribuir uma observação importante aos nomes inseridos acima, e poderá visualizar consultando os nomes."
                 value={observation}
                 onChange={(e) => setObservation(e.target.value)}
               />
             </div>

                           <button
                className={`w-full px-4 py-2 rounded transition-colors ${
                  selectedList && insertedBy && guestNames.trim()
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (selectedList && insertedBy && guestNames.trim()) {
                    const names = guestNames.split('\n').filter(name => name.trim() !== '');
                    handleInsertNames(names, selectedList, insertedBy, observation);
                  }
                }}
                disabled={!selectedList || !insertedBy || !guestNames.trim()}
              >
                Enviar Nomes
              </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isGeneralSettingsOpen && (
        <GeneralSettingsModal
          onClose={() => setIsGeneralSettingsOpen(false)}
          config={eventConfig}
          onSave={handleSaveConfig}
          availableEvents={availableEvents}
          onImport={handleImportConfig}
        />
      )}

      {isNameInsertionOpen && (
        <NameInsertionModal
          onClose={() => setIsNameInsertionOpen(false)}
          lists={productLists}
          onInsert={handleInsertNames}
        />
      )}

             {isProductConfigOpen && (
         <ProductConfigModal
           onClose={() => setIsProductConfigOpen(false)}
           products={productLists}
           onSave={(products) => {
             setProductLists(products);
             setIsProductConfigOpen(false);
           }}
         />
       )}

       {isGuestListModalOpen && selectedListForGuests && (
         <GuestListModal
           onClose={() => {
             setIsGuestListModalOpen(false);
             setSelectedListForGuests(null);
           }}
           list={selectedListForGuests}
           eventId={establishment.id}
         />
       )}
     </div>
   );
 }

// Accordion Item Component
function AccordionItem({ 
  title, 
  children, 
  isOpen, 
  onToggle 
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
        {isOpen ? (
          <MdExpandLess className="text-gray-600 text-xl" />
        ) : (
          <MdExpandMore className="text-gray-600 text-xl" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

// Guest List Modal
function GuestListModal({ 
  onClose, 
  list, 
  eventId 
}: {
  onClose: () => void;
  list: ProductList;
  eventId: number;
}) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'checked-in'>('all');

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/guests?listId=${list.id}`);
      if (response.ok) {
        const data = await response.json();
        setGuests(data);
      }
    } catch (error) {
      console.error('Erro ao buscar convidados:', error);
    } finally {
      setLoading(false);
    }
  }, [list.id, eventId]);

  useEffect(() => {
    fetchGuests();
  }, [list.id, eventId, fetchGuests]);

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || guest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked-in': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'checked-in': return 'Check-in';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-32 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Convidados - {list.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Informações da lista */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Capacidade:</span> {list.capacity}
              </div>
              <div>
                <span className="font-medium">Inseridos:</span> {list.insertedCount}
              </div>
              <div>
                <span className="font-medium">Confirmados:</span> {list.confirmedCount}
              </div>
              <div>
                <span className="font-medium">Valor:</span> R$ {list.value.toFixed(2)} / R$ {list.consumption.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmado</option>
                <option value="checked-in">Check-in</option>
              </select>
            </div>
          </div>

          {/* Lista de convidados */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {filteredGuests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum convidado encontrado
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredGuests.map((guest) => (
                    <div key={guest.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{guest.name}</h4>
                            {guest.companions > 0 && (
                              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                +{guest.companions} acompanhantes
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {guest.email && <div>📧 {guest.email}</div>}
                            {guest.phone && <div>📞 {guest.phone}</div>}
                            {guest.document && <div>📄 {guest.document}</div>}
                            {guest.observation && <div>💬 {guest.observation}</div>}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Inserido por: {guest.insertedBy} • {new Date(guest.insertedAt).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(guest.status)}`}>
                            {getStatusText(guest.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Estatísticas */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">{filteredGuests.length}</div>
                <div className="text-gray-500">Total filtrado</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">
                  {filteredGuests.filter(g => g.status === 'pending').length}
                </div>
                <div className="text-gray-500">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-600">
                  {filteredGuests.filter(g => g.status === 'confirmed').length}
                </div>
                <div className="text-gray-500">Confirmados</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">
                  {filteredGuests.filter(g => g.status === 'checked-in').length}
                </div>
                <div className="text-gray-500">Check-in</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// General Settings Modal
function GeneralSettingsModal({ 
  onClose, 
  config, 
  onSave, 
  availableEvents, 
  onImport 
}: {
  onClose: () => void;
  config: EventConfig | null;
  onSave: (config: EventConfig) => void;
  availableEvents: any[];
  onImport: (eventId: string) => void;
}) {
  const [localConfig, setLocalConfig] = useState<EventConfig | null>(config);

  const handleSave = () => {
    if (localConfig) {
      onSave(localConfig);
    }
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
              <select 
                id="importConfig" 
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={(e) => onImport(e.target.value)}
              >
                <option value="">Selecione um evento</option>
                {availableEvents.map(event => (
                  <option key={event.id} value={event.id}>{event.nome_do_evento}</option>
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
                value={localConfig?.totalCapacity || ''}
                onChange={(e) => setLocalConfig(prev => prev ? {...prev, totalCapacity: Number(e.target.value)} : null)}
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="needCPF" 
                  className="form-checkbox h-5 w-5 text-indigo-600" 
                  checked={localConfig?.needCPF || false} 
                  onChange={(e) => setLocalConfig(prev => prev ? {...prev, needCPF: e.target.checked} : null)} 
                />
                <label htmlFor="needCPF" className="ml-2 text-gray-900">Precisa CPF?</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="allowPublicInsert" 
                  className="form-checkbox h-5 w-5 text-indigo-600" 
                  checked={localConfig?.allowPublicInsert || false} 
                  onChange={(e) => setLocalConfig(prev => prev ? {...prev, allowPublicInsert: e.target.checked} : null)} 
                />
                <label htmlFor="allowPublicInsert" className="ml-2 text-gray-900">Ativar botão de inserir nomes no site público</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="allowCashierInsert" 
                  className="form-checkbox h-5 w-5 text-indigo-600" 
                  checked={localConfig?.allowCashierInsert || false} 
                  onChange={(e) => setLocalConfig(prev => prev ? {...prev, allowCashierInsert: e.target.checked} : null)} 
                />
                <label htmlFor="allowCashierInsert" className="ml-2 text-gray-900">Permitir que Caixa insira nomes na busca</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="requirePaymentInfo" 
                  className="form-checkbox h-5 w-5 text-indigo-600" 
                  checked={localConfig?.requirePaymentInfo || false} 
                  onChange={(e) => setLocalConfig(prev => prev ? {...prev, requirePaymentInfo: e.target.checked} : null)} 
                />
                <label htmlFor="requirePaymentInfo" className="ml-2 text-gray-900">Exigir que caixas informem forma de pagamento ao converter nomes</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="doubleCheck" 
                  className="form-checkbox h-5 w-5 text-indigo-600" 
                  checked={localConfig?.doubleCheck || false} 
                  onChange={(e) => setLocalConfig(prev => prev ? {...prev, doubleCheck: e.target.checked} : null)} 
                />
                <label htmlFor="doubleCheck" className="ml-2 text-gray-900">Este evento possui double check?</label>
              </div>
            </div>

            {/* Datas limite */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Datas limite de inserção e conversão:</label>
              <div>
                <label htmlFor="systemLimitDate" className="block text-sm font-medium text-gray-700">Sistema (Backend/Admin):</label>
                <input 
                  type="datetime-local" 
                  id="systemLimitDate" 
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                  value={localConfig?.systemLimitDate ? format(parseISO(localConfig.systemLimitDate), "yyyy-MM-dd'T'HH:mm") : ""} 
                  onChange={(e) => setLocalConfig(prev => prev ? {...prev, systemLimitDate: e.target.value} : null)} 
                />
              </div>
              <div>
                <label htmlFor="publicLimitDate" className="block text-sm font-medium text-gray-700">Site Público (Formulário):</label>
                <input 
                  type="datetime-local" 
                  id="publicLimitDate" 
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                  value={localConfig?.publicLimitDate ? format(parseISO(localConfig.publicLimitDate), "yyyy-MM-dd'T'HH:mm") : ""} 
                  onChange={(e) => setLocalConfig(prev => prev ? {...prev, publicLimitDate: e.target.value} : null)} 
                />
              </div>
              <div>
                <label htmlFor="conversionLimitDate" className="block text-sm font-medium text-gray-700">Conversão (Check-in):</label>
                <input 
                  type="datetime-local" 
                  id="conversionLimitDate" 
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                  value={localConfig?.conversionLimitDate ? format(parseISO(localConfig.conversionLimitDate), "yyyy-MM-dd'T'HH:mm") : ""} 
                  onChange={(e) => setLocalConfig(prev => prev ? {...prev, conversionLimitDate: e.target.value} : null)} 
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label htmlFor="observations" className="block text-sm font-medium text-gray-700">Observações:</label>
              <textarea 
                id="observations" 
                rows={3} 
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                value={localConfig?.observations || ""} 
                onChange={(e) => setLocalConfig(prev => prev ? {...prev, observations: e.target.value} : null)} 
              />
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

// Name Insertion Modal
function NameInsertionModal({ 
  onClose, 
  lists, 
  onInsert 
}: {
  onClose: () => void;
  lists: ProductList[];
  onInsert: (names: string[], listId: number, insertedBy: string, observation: string) => void;
}) {
  const [selectedList, setSelectedList] = useState<number | ''>('');
  const [guestNames, setGuestNames] = useState('');
  const [insertedBy, setInsertedBy] = useState('');
  const [observation, setObservation] = useState('');

  const handleInsertNames = () => {
    if (!selectedList || !insertedBy) return;
    
    const names = guestNames.split('\n').filter(name => name.trim() !== '');
    onInsert(names, selectedList, insertedBy, observation);
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
                    {list.name}
                  </option>
                ))}
              </select>
            </div>

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

            <div>
              <label htmlFor="inseridoPor" className="block text-sm font-medium text-gray-700">
                Inserido Por:
              </label>
              <select
                id="inseridoPor"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={insertedBy}
                onChange={(e) => setInsertedBy(e.target.value)}
              >
                <option value="">Selecione quem está inserindo...</option>
                <option value="Highline Bar SP - Highline">Highline Bar SP - Highline</option>
                <option value="Seu Justino - Admin">Seu Justino - Admin</option>
                <option value="Oh Freguês - Admin">Oh Freguês - Admin</option>
                <option value="Pracinha do Seu Justino - Admin">Pracinha do Seu Justino - Admin</option>
                <option value="Reserva Rooftop - Admin">Reserva Rooftop - Admin</option>
                <option value="Sistema Automático">Sistema Automático</option>
                <option value="Caixa - Presencial">Caixa - Presencial</option>
                <option value="Promoter - Externo">Promoter - Externo</option>
              </select>
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
              className={`px-4 py-2 text-base font-medium rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${
                selectedList && insertedBy && guestNames.trim()
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleInsertNames}
              disabled={!selectedList || !insertedBy || !guestNames.trim()}
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

// Product Config Modal
function ProductConfigModal({ 
  onClose, 
  products, 
  onSave 
}: {
  onClose: () => void;
  products: ProductList[];
  onSave: (products: ProductList[]) => void;
}) {
  const [localProducts, setLocalProducts] = useState<ProductList[]>(products);

  const handleSave = () => {
    onSave(localProducts);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3 text-left">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Configurar Produtos</h3>
          <div className="mt-2 px-7 py-3 space-y-4">
            {localProducts.map((product, index) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">{product.name}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor</label>
                    <input
                      type="number"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={product.value}
                      onChange={(e) => {
                        const newProducts = [...localProducts];
                        newProducts[index].value = Number(e.target.value);
                        setLocalProducts(newProducts);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Consumo</label>
                    <input
                      type="number"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={product.consumption}
                      onChange={(e) => {
                        const newProducts = [...localProducts];
                        newProducts[index].consumption = Number(e.target.value);
                        setLocalProducts(newProducts);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacidade</label>
                    <input
                      type="number"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={product.capacity}
                      onChange={(e) => {
                        const newProducts = [...localProducts];
                        newProducts[index].capacity = Number(e.target.value);
                        setLocalProducts(newProducts);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={product.status}
                      onChange={(e) => {
                        const newProducts = [...localProducts];
                        newProducts[index].status = e.target.value as 'active' | 'inactive';
                        setLocalProducts(newProducts);
                      }}
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
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