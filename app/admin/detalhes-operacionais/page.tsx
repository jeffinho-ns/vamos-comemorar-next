"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdRefresh,
  MdBusiness,
  MdCalendarToday,
  MdToggleOn,
  MdToggleOff,
  MdEvent,
  MdInfo
} from 'react-icons/md';
import { useEstablishments } from '@/app/hooks/useEstablishments';
import { OperationalDetail } from '@/app/types/operationalDetail';
import OperationalDetailsModal from '@/app/components/OperationalDetailsModal';
import EventsModal from '@/app/components/EventsModal';
import ArtistOSList from '@/app/components/ArtistOSList';
import ArtistOSCreateModal from '@/app/components/ArtistOSCreateModal';
import { useEstablishmentPermissions } from '@/app/hooks/useEstablishmentPermissions';

export default function DetalhesOperacionaisPage() {
  const { establishments, loading: establishmentsLoading, fetchEstablishments } = useEstablishments();
  const establishmentPermissions = useEstablishmentPermissions();
  const [details, setDetails] = useState<OperationalDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showArtistOSCreateModal, setShowArtistOSCreateModal] = useState(false);
  const [editingDetail, setEditingDetail] = useState<OperationalDetail | null>(null);
  const [selectedEstablishment, setSelectedEstablishment] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    fetchEstablishments();
  }, []);

  useEffect(() => {
    // Se o usuário está restrito a um único estabelecimento, seleciona automaticamente
    if (!establishmentPermissions.isLoading && establishmentPermissions.isRestrictedToSingleEstablishment()) {
      const defaultId = establishmentPermissions.getDefaultEstablishmentId();
      if (defaultId && !selectedEstablishment && establishments.length > 0) {
        // Encontrar o estabelecimento correspondente
        const est = establishments.find(e => {
          const estId = typeof e.id === 'string' ? parseInt(e.id) : e.id;
          return estId === defaultId;
        });
        if (est) {
          const estId = typeof est.id === 'string' ? parseInt(est.id) : est.id;
          setSelectedEstablishment(estId);
        }
      }
    }
  }, [establishmentPermissions.isLoading, establishments.length]);

  useEffect(() => {
    fetchDetails();
  }, [selectedEstablishment, filterDate]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }

      let url = `${API_URL}/api/operational-details?`;
      const params = new URLSearchParams();
      
      if (selectedEstablishment) {
        params.append('establishment_id', selectedEstablishment.toString());
      }
      
      if (filterDate) {
        params.append('event_date', filterDate);
      }

      url += params.toString();

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao buscar detalhes operacionais');
      }

      const data = await response.json();
      // A API pode retornar { success: true, data: [...] } ou diretamente [...]
      if (data.success && data.data) {
        setDetails(data.data);
      } else if (Array.isArray(data)) {
        setDetails(data);
      } else if (data.data && Array.isArray(data.data)) {
        setDetails(data.data);
      } else {
        setDetails([]);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar detalhes operacionais:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar detalhes operacionais');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingDetail(null);
    setShowModal(true);
  };

  const handleEdit = (detail: OperationalDetail) => {
    setEditingDetail(detail);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este detalhe operacional?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_URL}/api/operational-details/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao excluir detalhe operacional');
      }

      alert('Detalhe operacional excluído com sucesso!');
      fetchDetails();
    } catch (err) {
      console.error('❌ Erro ao excluir detalhe operacional:', err);
      alert(err instanceof Error ? err.message : 'Erro ao excluir detalhe operacional');
    }
  };

  const handleToggleActive = async (detail: OperationalDetail) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_URL}/api/operational-details/${detail.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: !detail.is_active
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao atualizar status');
      }

      fetchDetails();
    } catch (err) {
      console.error('❌ Erro ao atualizar status:', err);
      alert(err instanceof Error ? err.message : 'Erro ao atualizar status');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingDetail(null);
  };

  const handleModalSave = () => {
    fetchDetails();
    handleModalClose();
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'Data não informada';
    }
    try {
      // Se já está no formato YYYY-MM-DD, adicionar hora
      const date = dateString.includes('T') 
        ? new Date(dateString) 
        : new Date(dateString + 'T12:00:00');
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateString);
      return dateString || 'Data inválida';
    }
  };

  if (establishmentsLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 text-lg">Carregando detalhes operacionais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Detalhes Operacionais do Evento</h1>
          <p className="text-gray-400 text-lg">Gerencie informações detalhadas por data para marketing e operação</p>
        </div>

        {/* Filtros e Ações */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-gray-200/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Filtro de Estabelecimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdBusiness className="inline mr-2" />
                Estabelecimento
              </label>
              <select
                value={selectedEstablishment || ''}
                onChange={(e) => setSelectedEstablishment(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                disabled={establishmentPermissions.isRestrictedToSingleEstablishment()}
              >
                {establishmentPermissions.isRestrictedToSingleEstablishment() ? (
                  establishmentPermissions.getFilteredEstablishments(establishments).map((est) => (
                    <option key={est.id} value={typeof est.id === 'string' ? parseInt(est.id) : est.id}>
                      {est.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="">Todos</option>
                    {establishmentPermissions.getFilteredEstablishments(establishments).map((est) => (
                      <option key={est.id} value={typeof est.id === 'string' ? parseInt(est.id) : est.id}>
                        {est.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Filtro de Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdCalendarToday className="inline mr-2" />
                Data do Evento
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex items-end gap-3">
              <button
                onClick={fetchDetails}
                className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <MdRefresh className="text-xl" />
              </button>
              <button
                onClick={() => setShowEventsModal(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2"
              >
                <MdEvent size={20} /> Ver Eventos
              </button>
              {establishmentPermissions.canCreateOperationalDetail() && (
                <button
                  onClick={handleAdd}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2"
                >
                  <MdAdd size={20} /> Novo Detalhe
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Seção de OS de Artista/Banda/DJ */}
        <div className="mb-8">
          <ArtistOSList
            details={details}
            onRefresh={fetchDetails}
            onAddNew={() => establishmentPermissions.canCreateOS() && setShowArtistOSCreateModal(true)}
            canEdit={establishmentPermissions.canEditOS()}
            canCreate={establishmentPermissions.canCreateOS()}
          />
        </div>

        {/* Lista de Detalhes */}
        <div className="space-y-4">
          {details.map((detail, index) => (
            <motion.div
              key={detail.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/20 hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {formatDate(detail.event_date)}
                    </h3>
                    {detail.is_active ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                        Inativo
                      </span>
                    )}
                  </div>
                  
                  {detail.establishment_name && (
                    <p className="text-sm text-gray-600 mb-1">
                      <MdBusiness className="inline mr-1" />
                      {detail.establishment_name}
                    </p>
                  )}
                  
                  {detail.artistic_attraction && (
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      🎭 {detail.artistic_attraction}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {establishmentPermissions.canEditOperationalDetail() && (
                    <>
                      <button
                        onClick={() => handleToggleActive(detail)}
                        className={`p-2 rounded-lg transition-colors ${
                          detail.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={detail.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {detail.is_active ? <MdToggleOn size={24} /> : <MdToggleOff size={24} />}
                      </button>
                      <button
                        onClick={() => handleEdit(detail)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <MdEdit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(detail.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <MdDelete size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Informações Resumidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                {detail.ticket_prices && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">💰 Preços</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{detail.ticket_prices}</p>
                  </div>
                )}
                {detail.promotions && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">🎁 Promoções</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{detail.promotions}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {details.length === 0 && !loading && (
            <div className="text-center py-12 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/20">
              <MdEvent size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum detalhe operacional encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                {selectedEstablishment || filterDate
                  ? 'Ajuste os filtros ou crie novos detalhes'
                  : 'Crie o primeiro detalhe operacional clicando no botão acima'}
              </p>
              {establishmentPermissions.canCreateOperationalDetail() && (
                <button
                  onClick={handleAdd}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2 mx-auto"
                >
                  <MdAdd size={20} /> Criar Detalhe Operacional
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50/50 border border-blue-200/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <MdInfo size={24} />
            Sobre os Detalhes Operacionais
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>• Atrativos Artísticos:</strong> Informações sobre bandas, DJs e atrações do dia
            </p>
            <p>
              <strong>• Preços:</strong> Valores de entrada e produtos para exibição no site de reservas
            </p>
            <p>
              <strong>• Promoções:</strong> Brindes e ofertas especiais do dia
            </p>
            <p>
              <strong>• Notas Administrativas:</strong> Informações internas para a equipe de marketing
            </p>
            <p>
              <strong>• Instruções Operacionais:</strong> Informações críticas para criação de Ordem de Serviço (OS)
            </p>
            <p>
              <strong>• Status Ativo:</strong> Detalhes ativos aparecem no formulário de reservas para os clientes
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <OperationalDetailsModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        detail={editingDetail}
        establishments={establishments}
      />

      {/* Events Modal */}
      <EventsModal
        isOpen={showEventsModal}
        onClose={() => setShowEventsModal(false)}
      />

      {/* Artist OS Create Modal */}
      <ArtistOSCreateModal
        isOpen={showArtistOSCreateModal}
        onClose={() => setShowArtistOSCreateModal(false)}
        onSave={async (data) => {
          const token = localStorage.getItem('authToken');
          if (!token) {
            throw new Error('Token de autenticação não encontrado');
          }

          try {
            // Limpar campos undefined/null desnecessários
            const cleanData: Record<string, any> = {};
            Object.entries(data).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                // Converter strings vazias para null em campos opcionais
                if (typeof value === 'string' && value.trim() === '' && 
                    !['artistic_attraction', 'ticket_prices', 'event_date'].includes(key)) {
                  cleanData[key] = null;
                } else {
                  cleanData[key] = value;
                }
              }
            });

            console.log('📤 Dados limpos para envio:', cleanData);

            const response = await fetch(`${API_URL}/api/operational-details`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(cleanData),
            });

            if (!response.ok) {
              const errorText = await response.text();
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { error: errorText || 'Erro desconhecido' };
              }
              console.error('❌ Erro da API:', errorData);
              throw new Error(errorData.error || `Erro ao criar OS: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ OS criada com sucesso:', result);
            fetchDetails();
          } catch (error) {
            console.error('❌ Erro ao salvar OS:', error);
            throw error;
          }
        }}
        establishments={establishments}
      />
    </div>
  );
}


