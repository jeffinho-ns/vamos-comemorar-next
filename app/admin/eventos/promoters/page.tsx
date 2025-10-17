"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdCheckCircle,
  MdList,
  MdSearch,
  MdFilterList,
  MdArrowBack
} from 'react-icons/md';

interface Promoter {
  promoter_id: number;
  nome: string;
  email: string;
  telefone: string;
  status: string;
  total_listas: number;
  total_convidados: number;
  total_checkins: number;
}

export default function PromotersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [filteredPromoters, setFilteredPromoters] = useState<Promoter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    fetchPromoters();
  }, []);

  useEffect(() => {
    filterPromoters();
  }, [searchTerm, statusFilter, promoters]);

  const fetchPromoters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/v1/promoters?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar promoters');
      }

      const data = await response.json();
      if (data.success) {
        setPromoters(data.promoters);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar promoters:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPromoters = () => {
    let filtered = [...promoters];

    // Filtro por nome ou email
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredPromoters(filtered);
  };

  const getStatusColor = (status: string) => {
    return status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando promoters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/admin/eventos/dashboard')}
            className="flex items-center gap-2 text-white hover:text-purple-100 mb-4 transition-colors"
          >
            <MdArrowBack size={20} />
            Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MdPerson size={36} />
            Promoters
          </h1>
          <p className="mt-2 text-purple-100">
            Gerenciamento de promoters e suas estatísticas
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdSearch className="inline mr-2" />
                Buscar Promoter
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome ou email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdFilterList className="inline mr-2" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Promoters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromoters.map((promoter, index) => (
            <motion.div
              key={promoter.promoter_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header Card */}
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
                  <MdPerson size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(promoter.status)}`}>
                  {promoter.status}
                </span>
              </div>

              {/* Nome */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{promoter.nome}</h3>

              {/* Contatos */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MdEmail size={16} />
                  <span className="truncate">{promoter.email}</span>
                </div>
                {promoter.telefone && (
                  <div className="flex items-center gap-2">
                    <MdPhone size={16} />
                    <span>{promoter.telefone}</span>
                  </div>
                )}
              </div>

              {/* Estatísticas */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <MdList size={16} />
                    Listas
                  </span>
                  <span className="text-lg font-bold text-gray-900">{promoter.total_listas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <MdPerson size={16} />
                    Convidados
                  </span>
                  <span className="text-lg font-bold text-gray-900">{promoter.total_convidados}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <MdCheckCircle size={16} />
                    Check-ins
                  </span>
                  <span className="text-lg font-bold text-green-600">{promoter.total_checkins}</span>
                </div>
              </div>

              {/* Taxa de Conversão */}
              {promoter.total_convidados > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Taxa de Check-in:</span>
                    <span className="font-bold text-purple-600">
                      {Math.round((promoter.total_checkins / promoter.total_convidados) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.round((promoter.total_checkins / promoter.total_convidados) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPromoters.length === 0 && (
          <div className="text-center py-12">
            <MdPerson size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhum promoter encontrado
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter
                ? 'Tente ajustar os filtros de busca'
                : 'Nenhum promoter cadastrado no sistema'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



