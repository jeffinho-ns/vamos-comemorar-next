"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MdPeople,
  MdPerson,
  MdEmail,
  MdPhone,
  MdWork,
  MdArrowBack,
  MdSearch,
  MdFilterList
} from 'react-icons/md';

interface Hostess {
  hostess_id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  funcao: string;
  status: string;
  establishment_name: string | null;
  foto_url: string | null;
}

export default function HostessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hostess, setHostess] = useState<Hostess[]>([]);
  const [filteredHostess, setFilteredHostess] = useState<Hostess[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    fetchHostess();
  }, []);

  useEffect(() => {
    filterHostess();
  }, [searchTerm, statusFilter, hostess]);

  const fetchHostess = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/v1/eventos/hostess`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar hostess');
      }

      const data = await response.json();
      if (data.success) {
        setHostess(data.hostess);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar hostess:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHostess = () => {
    let filtered = [...hostess];

    // Filtro por nome
    if (searchTerm) {
      filtered = filtered.filter((h) =>
        h.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter) {
      filtered = filtered.filter((h) => h.status === statusFilter);
    }

    setFilteredHostess(filtered);
  };

  const getStatusColor = (status: string) => {
    return status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getFuncaoColor = (funcao: string) => {
    switch (funcao) {
      case 'Gerente de Porta':
        return 'bg-purple-100 text-purple-800';
      case 'Coordenador':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando equipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/admin/eventos/dashboard')}
            className="flex items-center gap-2 text-white hover:text-blue-100 mb-4 transition-colors"
          >
            <MdArrowBack size={20} />
            Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MdPeople size={36} />
            Equipe de Hostess
          </h1>
          <p className="mt-2 text-blue-100">
            Gerenciamento da equipe de atendimento e portaria
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdSearch className="inline mr-2" />
                Buscar Pessoa
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hostess Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHostess.map((pessoa, index) => (
            <motion.div
              key={pessoa.hostess_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Avatar/Photo */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-24 flex items-center justify-center">
                {pessoa.foto_url ? (
                  <img
                    src={pessoa.foto_url}
                    alt={pessoa.nome}
                    className="w-20 h-20 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-white bg-blue-300 flex items-center justify-center">
                    <MdPerson size={40} className="text-blue-700" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Status e Função */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pessoa.status)}`}>
                    {pessoa.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFuncaoColor(pessoa.funcao)}`}>
                    {pessoa.funcao}
                  </span>
                </div>

                {/* Nome */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{pessoa.nome}</h3>

                {/* Contatos */}
                <div className="space-y-2 text-sm text-gray-600">
                  {pessoa.email && (
                    <div className="flex items-center gap-2">
                      <MdEmail size={16} className="text-blue-500" />
                      <span className="truncate">{pessoa.email}</span>
                    </div>
                  )}
                  {pessoa.telefone && (
                    <div className="flex items-center gap-2">
                      <MdPhone size={16} className="text-blue-500" />
                      <span>{pessoa.telefone}</span>
                    </div>
                  )}
                  {pessoa.establishment_name && (
                    <div className="flex items-center gap-2">
                      <MdWork size={16} className="text-blue-500" />
                      <span>{pessoa.establishment_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredHostess.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <MdPeople size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhuma pessoa encontrada
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter
                ? 'Tente ajustar os filtros de busca'
                : 'Nenhuma pessoa cadastrada na equipe'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

