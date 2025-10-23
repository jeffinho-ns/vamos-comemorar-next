"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdPerson,
  MdEvent,
  MdAdd,
  MdClose,
  MdSave,
  MdSearch,
  MdFilterList,
  MdCalendarToday,
  MdLocationOn,
  MdPeople,
  MdCheckCircle,
  MdCancel,
  MdEdit,
  MdDelete,
  MdInfo,
  MdWarning,
  MdRefresh
} from 'react-icons/md';

interface Promoter {
  promoter_id: number;
  nome: string;
  apelido?: string;
  email: string;
  telefone?: string;
  whatsapp?: string;
  foto_url?: string;
  instagram?: string;
  codigo_identificador?: string;
  link_convite?: string;
  status: 'Ativo' | 'Inativo';
}

interface Evento {
  id?: number;
  evento_id?: number;
  nome_do_evento: string;
  tipo_evento: 'unico' | 'semanal';
  data_do_evento?: string;
  dia_da_semana?: number;
  hora_do_evento: string;
  local_do_evento?: string;
  establishment_name?: string;
}

interface PromoterEvento {
  relacionamento_id: number;
  promoter_id: number;
  evento_id: number;
  data_evento: string;
  status: 'ativo' | 'inativo' | 'cancelado';
  funcao: 'responsavel' | 'co-promoter' | 'backup';
  observacoes?: string;
  promoter_nome: string;
  promoter_apelido?: string;
  promoter_foto?: string;
  promoter_instagram?: string;
}

interface PromoterEventosModalProps {
  evento: Evento;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function PromoterEventosModal({ evento, isOpen, onClose, onSave }: PromoterEventosModalProps) {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [promotersEvento, setPromotersEvento] = useState<PromoterEvento[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedData, setSelectedData] = useState('');
  const [funcao, setFuncao] = useState<'responsavel' | 'co-promoter' | 'backup'>('responsavel');
  const [observacoes, setObservacoes] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    if (isOpen && evento) {
      fetchPromoters();
      fetchPromotersEvento();
      generateDateOptions();
    }
  }, [isOpen, evento]);

  const fetchPromoters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/v1/promoters/advanced`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPromoters(data.promoters.filter((p: Promoter) => p.status === 'Ativo'));
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar promoters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotersEvento = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const eventoId = evento.id || evento.evento_id;
      
      const response = await fetch(`${API_URL}/api/promoter-eventos/${eventoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPromotersEvento(data.promoters);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar promoters do evento:', error);
    }
  };

  const generateDateOptions = () => {
    if (evento.tipo_evento === 'unico' && evento.data_do_evento) {
      setSelectedData(evento.data_do_evento);
    }
  };

  const handleAddPromoter = async () => {
    console.log('🔍 Validando dados antes do envio:', {
      selectedPromoter: selectedPromoter,
      selectedData: selectedData,
      funcao: funcao,
      evento: evento
    });

    if (!selectedPromoter) {
      alert('Selecione um promoter');
      return;
    }

    if (!selectedData) {
      alert('Selecione uma data para o evento');
      return;
    }

    if (!evento || (!evento.id && !evento.evento_id)) {
      alert('Erro: Evento não encontrado');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const eventoId = evento.id || evento.evento_id;
      
      const requestData = {
        promoter_id: parseInt(selectedPromoter.promoter_id),
        evento_id: parseInt(eventoId),
        data_evento: selectedData,
        funcao,
        observacoes: observacoes || null
      };
      
      console.log('📤 Enviando dados:', requestData);
      console.log('📤 Tipos dos dados:', {
        promoter_id: typeof requestData.promoter_id,
        evento_id: typeof requestData.evento_id,
        data_evento: typeof requestData.data_evento,
        funcao: typeof requestData.funcao
      });
      
      const response = await fetch(`${API_URL}/api/promoter-eventos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📥 Resposta recebida:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dados salvos:', data);
        if (data.success) {
          await fetchPromotersEvento();
          setShowAddModal(false);
          setSelectedPromoter(null);
          setObservacoes('');
          onSave();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na resposta:', errorData);
        alert(`Erro ao adicionar promoter: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar promoter:', error);
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
    }
  };

  const handleRemovePromoter = async (relacionamentoId: number) => {
    if (!confirm('Tem certeza que deseja remover este promoter do evento?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/promoter-eventos/${relacionamentoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchPromotersEvento();
        onSave();
      }
    } catch (error) {
      console.error('❌ Erro ao remover promoter:', error);
    }
  };

  const filteredPromoters = promoters.filter(promoter => 
    !promotersEvento.some(pe => pe.promoter_id === promoter.promoter_id) &&
    (promoter.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
     promoter.apelido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     promoter.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getFuncaoColor = (funcao: string) => {
    switch (funcao) {
      case 'responsavel': return 'bg-blue-100 text-blue-800';
      case 'co-promoter': return 'bg-green-100 text-green-800';
      case 'backup': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFuncaoIcon = (funcao: string) => {
    switch (funcao) {
      case 'responsavel': return <MdCheckCircle className="text-blue-600" />;
      case 'co-promoter': return <MdPeople className="text-green-600" />;
      case 'backup': return <MdInfo className="text-gray-600" />;
      default: return <MdInfo className="text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <MdEvent className="text-3xl" />
                  Promoters do Evento
                </h2>
                <p className="text-purple-100 mt-2">
                  {evento.nome_do_evento} • {evento.tipo_evento === 'unico' ? 'Evento Único' : 'Evento Semanal'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Evento Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <MdCalendarToday className="text-purple-600 text-xl" />
                  <div>
                    <p className="text-sm text-gray-600">Data</p>
                    <p className="font-semibold">
                      {evento.tipo_evento === 'unico' 
                        ? evento.data_do_evento 
                        : `Semanal (${evento.dia_da_semana === 1 ? 'Dom' : evento.dia_da_semana === 2 ? 'Seg' : evento.dia_da_semana === 3 ? 'Ter' : evento.dia_da_semana === 4 ? 'Qua' : evento.dia_da_semana === 5 ? 'Qui' : evento.dia_da_semana === 6 ? 'Sex' : 'Sáb'})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MdLocationOn className="text-purple-600 text-xl" />
                  <div>
                    <p className="text-sm text-gray-600">Local</p>
                    <p className="font-semibold">{evento.establishment_name || evento.local_do_evento}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MdPeople className="text-purple-600 text-xl" />
                  <div>
                    <p className="text-sm text-gray-600">Promoters</p>
                    <p className="font-semibold">{promotersEvento.length} vinculado(s)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Promoters Vinculados */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Promoters Vinculados</h3>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <MdAdd size={20} />
                  Adicionar Promoter
                </button>
              </div>

              {promotersEvento.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MdPeople size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Nenhum promoter vinculado a este evento</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promotersEvento.map((pe) => (
                    <div key={pe.relacionamento_id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {pe.promoter_foto ? (
                            <img
                              src={pe.promoter_foto}
                              alt={pe.promoter_nome}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                              <MdPerson className="text-purple-600 text-xl" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-800">{pe.promoter_nome}</h4>
                            {pe.promoter_apelido && (
                              <p className="text-sm text-gray-600">@{pe.promoter_apelido}</p>
                            )}
                            <p className="text-sm text-gray-500">{pe.data_evento}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFuncaoColor(pe.funcao)}`}>
                            {getFuncaoIcon(pe.funcao)}
                            <span className="ml-1">{pe.funcao}</span>
                          </span>
                          <button
                            onClick={() => handleRemovePromoter(pe.relacionamento_id)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Remover promoter"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </div>
                      {pe.observacoes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                          <MdInfo className="inline mr-1" size={14} />
                          {pe.observacoes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Adicionar Promoter */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Adicionar Promoter</h3>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <MdClose size={24} />
                    </button>
                  </div>

                  {/* Data do Evento */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data do Evento
                    </label>
                    <input
                      type="date"
                      value={selectedData}
                      onChange={(e) => setSelectedData(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Função */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Função
                    </label>
                    <select
                      value={funcao}
                      onChange={(e) => setFuncao(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="responsavel">Responsável</option>
                      <option value="co-promoter">Co-Promoter</option>
                      <option value="backup">Backup</option>
                    </select>
                  </div>

                  {/* Buscar Promoter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar Promoter
                    </label>
                    <div className="relative">
                      <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Digite o nome, apelido ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Lista de Promoters */}
                  <div className="mb-4 max-h-60 overflow-y-auto">
                    {filteredPromoters.map((promoter) => (
                      <div
                        key={promoter.promoter_id}
                        onClick={() => setSelectedPromoter(promoter)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPromoter?.promoter_id === promoter.promoter_id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {promoter.foto_url ? (
                            <img
                              src={promoter.foto_url}
                              alt={promoter.nome}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <MdPerson className="text-purple-600" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium">{promoter.nome}</h4>
                            {promoter.apelido && (
                              <p className="text-sm text-gray-600">@{promoter.apelido}</p>
                            )}
                            <p className="text-sm text-gray-500">{promoter.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Observações */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Observações sobre este promoter neste evento..."
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddPromoter}
                      disabled={!selectedPromoter || !selectedData}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Adicionar Promoter
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}