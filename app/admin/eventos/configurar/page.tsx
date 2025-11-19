"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MdArrowBack,
  MdEvent,
  MdToggleOn,
  MdToggleOff,
  MdRefresh,
  MdFilterList,
  MdBusiness,
  MdCalendarToday,
  MdRepeat
} from 'react-icons/md';

interface Evento {
  evento_id: number;
  nome: string;
  data_evento: string | null;
  horario_funcionamento: string;
  tipo_evento: 'unico' | 'semanal';
  dia_da_semana: number | null;
  usado_para_listas: boolean;
  casa_do_evento: string;
  establishment_id: number;
}

interface Establishment {
  id: number;
  name: string;
}

export default function ConfigurarEventosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [filteredEventos, setFilteredEventos] = useState<Evento[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<number | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    fetchEstablishments();
    fetchEventos();
  }, []);

  useEffect(() => {
    filterEventos();
  }, [selectedEstablishment, tipoFilter, statusFilter, eventos]);

  const fetchEstablishments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/places`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const estabs = Array.isArray(data) ? data : data.data || [];
        setEstablishments(estabs.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estabelecimentos:', error);
    }
  };

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/v1/eventos/todos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar eventos');
      }

      const data = await response.json();
      if (data.success) {
        setEventos(data.eventos);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar eventos:', error);
      alert('Erro ao carregar eventos. Verifique se o backend está rodando e as tabelas foram criadas.');
    } finally {
      setLoading(false);
    }
  };

  const filterEventos = () => {
    let filtered = [...eventos];

    if (selectedEstablishment) {
      filtered = filtered.filter(e => e.establishment_id === selectedEstablishment);
    }

    if (tipoFilter) {
      filtered = filtered.filter(e => e.tipo_evento === tipoFilter);
    }

    if (statusFilter === 'habilitado') {
      filtered = filtered.filter(e => e.usado_para_listas);
    } else if (statusFilter === 'desabilitado') {
      filtered = filtered.filter(e => !e.usado_para_listas);
    }

    setFilteredEventos(filtered);
  };

  const toggleEventoParaListas = async (eventoId: number, habilitar: boolean) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/v1/eventos/${eventoId}/habilitar-listas`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ habilitar }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar evento');
      }

      // Atualizar lista local
      setEventos(prev => prev.map(e => 
        e.evento_id === eventoId ? { ...e, usado_para_listas: habilitar } : e
      ));

      alert(`Evento ${habilitar ? 'habilitado' : 'desabilitado'} com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      alert('Erro ao atualizar evento. Tente novamente.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      // Adiciona T12:00:00 para evitar problemas de timezone
      const dateWithTime = dateString.includes('T') || dateString.includes(' ') 
        ? dateString 
        : dateString + 'T12:00:00';
      const date = new Date(dateWithTime);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Erro ao formatar data:', dateString, error);
      return 'Data inválida';
    }
  };

  const getDiaSemanaTexto = (dia: number) => {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[dia] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/admin/eventos/dashboard')}
            className="flex items-center gap-2 text-white hover:text-orange-100 mb-4 transition-colors"
          >
            <MdArrowBack size={20} />
            Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MdEvent size={36} />
            Configurar Eventos
          </h1>
          <p className="mt-2 text-orange-100">
            Habilite ou desabilite eventos para usar o sistema de listas e promoters
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro de Estabelecimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdBusiness className="inline mr-2" />
                Estabelecimento
              </label>
              <select
                value={selectedEstablishment || ''}
                onChange={(e) => setSelectedEstablishment(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdFilterList className="inline mr-2" />
                Tipo de Evento
              </label>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="unico">Único</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>

            {/* Filtro de Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status no Sistema de Listas
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="habilitado">Habilitado</option>
                <option value="desabilitado">Desabilitado</option>
              </select>
            </div>
          </div>

          {/* Ações em Massa */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredEventos.length} eventos encontrados
            </p>
            <button
              onClick={fetchEventos}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <MdRefresh size={20} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Lista de Eventos */}
        <div className="space-y-4">
          {filteredEventos.map((evento, index) => (
            <motion.div
              key={evento.evento_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Info do Evento */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{evento.nome}</h3>
                    {evento.tipo_evento === 'semanal' ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium flex items-center gap-1">
                        <MdRepeat size={14} />
                        Semanal
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex items-center gap-1">
                        <MdCalendarToday size={14} />
                        Único
                      </span>
                    )}
                    {evento.usado_para_listas && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                        ✓ Listas Habilitadas
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {evento.tipo_evento === 'semanal' && evento.dia_da_semana !== null ? (
                      <p>
                        📅 Toda {getDiaSemanaTexto(evento.dia_da_semana)} às {evento.horario_funcionamento}
                      </p>
                    ) : (
                      <p>
                        📅 {formatDate(evento.data_evento)} às {evento.horario_funcionamento}
                      </p>
                    )}
                    <p>📍 {evento.casa_do_evento}</p>
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => toggleEventoParaListas(evento.evento_id, !evento.usado_para_listas)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      evento.usado_para_listas
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {evento.usado_para_listas ? (
                      <>
                        <MdToggleOn size={24} />
                        <span className="text-sm font-medium">Habilitado</span>
                      </>
                    ) : (
                      <>
                        <MdToggleOff size={24} />
                        <span className="text-sm font-medium">Desabilitado</span>
                      </>
                    )}
                  </button>

                  {evento.usado_para_listas && (
                    <button
                      onClick={() => router.push(`/admin/eventos/listas?evento_id=${evento.evento_id}`)}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Ver Listas →
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {filteredEventos.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <MdEvent size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum evento encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                Ajuste os filtros ou crie novos eventos no sistema
              </p>
              <button
                onClick={() => router.push('/admin/events')}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Ir para Gerenciar Eventos
              </button>
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">ℹ️ Como funciona?</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>1.</strong> Habilite eventos para usar o sistema de listas clicando no botão &quot;Desabilitado&quot;
            </p>
            <p>
              <strong>2.</strong> Eventos habilitados aparecerão no dashboard e poderão ter listas de promoters
            </p>
            <p>
              <strong>3.</strong> Eventos únicos são pontuais (data específica)
            </p>
            <p>
              <strong>4.</strong> Eventos semanais são recorrentes (toda semana no mesmo dia)
            </p>
            <p>
              <strong>5.</strong> Cada estabelecimento tem seus próprios eventos e listas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}








