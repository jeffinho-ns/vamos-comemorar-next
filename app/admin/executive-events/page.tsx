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
  MdQrCode,
  MdOpenInNew
} from 'react-icons/md';
import { useEstablishments } from '@/app/hooks/useEstablishments';
import { ExecutiveEvent } from '@/app/types/executiveEvents';
import ExecutiveEventModal from '@/app/components/ExecutiveEventModal';

export default function ExecutiveEventsPage() {
  const { establishments, loading: establishmentsLoading, fetchEstablishments } = useEstablishments();
  const [events, setEvents] = useState<ExecutiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ExecutiveEvent | null>(null);
  const [selectedEstablishment, setSelectedEstablishment] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    fetchEstablishments();
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedEstablishment]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }

      let url = `${API_URL}/api/executive-events?`;
      if (selectedEstablishment) {
        url += `establishment_id=${selectedEstablishment}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao buscar eventos');
      }

      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Erro ao buscar eventos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEdit = (event: ExecutiveEvent) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_URL}/api/executive-events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao excluir evento');
      }

      alert('Evento excluído com sucesso!');
      fetchEvents();
    } catch (err) {
      console.error('❌ Erro ao excluir evento:', err);
      alert(err instanceof Error ? err.message : 'Erro ao excluir evento');
    }
  };

  const handleToggleActive = async (event: ExecutiveEvent) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_URL}/api/executive-events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: !event.is_active
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao atualizar status');
      }

      fetchEvents();
    } catch (err) {
      console.error('❌ Erro ao atualizar status:', err);
      alert(err instanceof Error ? err.message : 'Erro ao atualizar status');
    }
  };

  const handleGenerateQR = (slug: string) => {
    const publicUrl = `${window.location.origin}/eventos/${slug}`;
    // Usar biblioteca de QR Code ou abrir em nova aba
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`, '_blank');
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'Data não informada';
    }
    try {
      const date = dateString.includes('T') 
        ? new Date(dateString) 
        : new Date(dateString + 'T12:00:00');
      
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
          <p className="mt-4 text-gray-400 text-lg">Carregando eventos executivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Executive Event Menus</h1>
          <p className="text-gray-400 text-lg">Gerencie cardápios temporários para eventos corporativos</p>
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
              >
                <option value="">Todos</option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-end gap-3 md:col-span-2">
              <button
                onClick={fetchEvents}
                className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <MdRefresh className="text-xl" />
              </button>
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2"
              >
                <MdAdd size={20} /> Novo Evento
              </button>
            </div>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Lista de Eventos */}
        <div className="space-y-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/20 hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {event.name}
                    </h3>
                    {event.is_active ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                        Inativo
                      </span>
                    )}
                  </div>
                  
                  {event.establishment_name && (
                    <p className="text-sm text-gray-600 mb-1">
                      <MdBusiness className="inline mr-1" />
                      {event.establishment_name}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <MdCalendarToday className="inline mr-1" />
                    {formatDate(event.event_date)}
                  </p>

                  {event.items_count !== undefined && (
                    <p className="text-sm text-gray-500">
                      {event.items_count} item(ns) no cardápio
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/eventos/${event.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                    title="Ver Público"
                  >
                    <MdOpenInNew size={20} />
                  </a>
                  <button
                    onClick={() => handleGenerateQR(event.slug)}
                    className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg transition-colors"
                    title="Gerar QR Code"
                  >
                    <MdQrCode size={20} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(event)}
                    className={`p-2 rounded-lg transition-colors ${
                      event.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={event.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {event.is_active ? <MdToggleOn size={24} /> : <MdToggleOff size={24} />}
                  </button>
                  <button
                    onClick={() => handleEdit(event)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <MdEdit size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {events.length === 0 && !loading && (
            <div className="text-center py-12 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/20">
              <MdEvent size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum evento encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                {selectedEstablishment
                  ? 'Ajuste os filtros ou crie novos eventos'
                  : 'Crie o primeiro evento executivo clicando no botão acima'}
              </p>
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2 mx-auto"
              >
                <MdAdd size={20} /> Criar Evento Executivo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <ExecutiveEventModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEvent(null);
        }}
        onSave={fetchEvents}
        event={editingEvent}
        establishments={establishments}
      />
    </div>
  );
}

