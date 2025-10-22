"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdCheckCircle,
  MdList,
  MdSearch,
  MdFilterList,
  MdArrowBack,
  MdAdd,
  MdEdit,
  MdSettings,
  MdTrendingUp,
  MdWarning,
  MdQrCode,
  MdLink,
  MdAttachMoney,
  MdPeople,
  MdEvent,
  MdBarChart,
  MdNotifications,
  MdClose,
  MdSave,
  MdCancel,
  MdVisibility,
  MdVisibilityOff,
  MdStar,
  MdStarBorder,
  MdBusiness,
  MdWhatsapp,
  MdInstagram,
  MdPhotoCamera,
  MdCategory,
  MdCode,
  MdSchedule,
  MdLocationOn,
  MdSecurity,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdInfo,
  MdRefresh
} from 'react-icons/md';

interface Promoter {
  promoter_id: number;
  nome: string;
  apelido?: string;
  email: string;
  telefone?: string;
  whatsapp?: string;
  codigo_identificador?: string;
  tipo_categoria: 'A' | 'B' | 'C' | 'VIP' | 'Standard';
  comissao_percentual: number;
  link_convite?: string;
  observacoes?: string;
  establishment_id?: number;
  establishment_name?: string;
  foto_url?: string;
  instagram?: string;
  data_cadastro?: string;
  status: 'Ativo' | 'Inativo';
  ativo: boolean;
  // Estatísticas
  total_listas: number;
  total_convidados: number;
  total_checkins: number;
  media_taxa_comparecimento: number;
  receita_total_gerada: number;
  total_alertas_nao_lidos: number;
  // Condições
  max_convidados_por_evento?: number;
  max_convidados_por_data?: number;
  quota_mesas?: number;
  quota_entradas?: number;
  entradas_gratuitas?: number;
  desconto_especial_percentual?: number;
  valor_minimo_consumo?: number;
  pode_reservar_mesas_vip?: boolean;
  pode_selecionar_areas?: boolean;
}

interface Establishment {
  id: number;
  name: string;
}

interface PromoterFormData {
  nome: string;
  apelido: string;
  email: string;
  telefone: string;
  whatsapp: string;
  codigo_identificador: string;
  tipo_categoria: 'A' | 'B' | 'C' | 'VIP' | 'Standard';
  comissao_percentual: number;
  link_convite: string;
  observacoes: string;
  establishment_id: number;
  foto_url: string;
  instagram: string;
  // Condições
  max_convidados_por_evento: number;
  max_convidados_por_data: number;
  quota_mesas: number;
  quota_entradas: number;
  entradas_gratuitas: number;
  desconto_especial_percentual: number;
  valor_minimo_consumo: number;
  pode_reservar_mesas_vip: boolean;
  pode_selecionar_areas: boolean;
}

export default function PromotersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [filteredPromoters, setFilteredPromoters] = useState<Promoter[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('');
  const [establishmentFilter, setEstablishmentFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modais e estados
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConditionsModal, setShowConditionsModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null);
  const [formData, setFormData] = useState<PromoterFormData>({
    nome: '',
    apelido: '',
    email: '',
    telefone: '',
    whatsapp: '',
    codigo_identificador: '',
    tipo_categoria: 'Standard',
    comissao_percentual: 0,
    link_convite: '',
    observacoes: '',
    establishment_id: 0,
    foto_url: '',
    instagram: '',
    max_convidados_por_evento: 30,
    max_convidados_por_data: 50,
    quota_mesas: 5,
    quota_entradas: 20,
    entradas_gratuitas: 5,
    desconto_especial_percentual: 10,
    valor_minimo_consumo: 50,
    pode_reservar_mesas_vip: false,
    pode_selecionar_areas: false
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    fetchPromoters();
    fetchEstablishments();
  }, []);

  useEffect(() => {
    filterAndSortPromoters();
  }, [searchTerm, statusFilter, categoriaFilter, establishmentFilter, sortBy, sortOrder, promoters]);

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
        setEstablishments(data.places || []);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estabelecimentos:', error);
    }
  };

  const filterAndSortPromoters = () => {
    let filtered = [...promoters];

    // Filtro por nome, apelido ou email
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.apelido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.codigo_identificador?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Filtro por categoria
    if (categoriaFilter) {
      filtered = filtered.filter((p) => p.tipo_categoria === categoriaFilter);
    }

    // Filtro por estabelecimento
    if (establishmentFilter) {
      filtered = filtered.filter((p) => p.establishment_id?.toString() === establishmentFilter);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'nome':
          aValue = a.nome.toLowerCase();
          bValue = b.nome.toLowerCase();
          break;
        case 'categoria':
          aValue = a.tipo_categoria;
          bValue = b.tipo_categoria;
          break;
        case 'convidados':
          aValue = a.total_convidados;
          bValue = b.total_convidados;
          break;
        case 'checkins':
          aValue = a.total_checkins;
          bValue = b.total_checkins;
          break;
        case 'receita':
          aValue = a.receita_total_gerada || 0;
          bValue = b.receita_total_gerada || 0;
          break;
        case 'performance':
          aValue = a.media_taxa_comparecimento || 0;
          bValue = b.media_taxa_comparecimento || 0;
          break;
        default:
          aValue = a.nome.toLowerCase();
          bValue = b.nome.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPromoters(filtered);
  };

  const getStatusColor = (status: string) => {
    return status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'VIP':
        return 'bg-purple-100 text-purple-800';
      case 'A':
        return 'bg-blue-100 text-blue-800';
      case 'B':
        return 'bg-green-100 text-green-800';
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'VIP':
        return <MdStar className="text-purple-600" />;
      case 'A':
        return <MdStar className="text-blue-600" />;
      case 'B':
        return <MdStar className="text-green-600" />;
      case 'C':
        return <MdStar className="text-yellow-600" />;
      default:
        return <MdStarBorder className="text-gray-600" />;
    }
  };

  const handleCreatePromoter = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/v1/promoters`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowCreateModal(false);
          resetForm();
          fetchPromoters();
        }
      }
    } catch (error) {
      console.error('❌ Erro ao criar promoter:', error);
    }
  };

  const handleEditPromoter = async () => {
    if (!selectedPromoter) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/v1/promoters/${selectedPromoter.promoter_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowEditModal(false);
        resetForm();
        fetchPromoters();
      }
    } catch (error) {
      console.error('❌ Erro ao editar promoter:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      apelido: '',
      email: '',
      telefone: '',
      whatsapp: '',
      codigo_identificador: '',
      tipo_categoria: 'Standard',
      comissao_percentual: 0,
      link_convite: '',
      observacoes: '',
      establishment_id: 0,
      foto_url: '',
      instagram: '',
      max_convidados_por_evento: 30,
      max_convidados_por_data: 50,
      quota_mesas: 5,
      quota_entradas: 20,
      entradas_gratuitas: 5,
      desconto_especial_percentual: 10,
      valor_minimo_consumo: 50,
      pode_reservar_mesas_vip: false,
      pode_selecionar_areas: false
    });
    setSelectedPromoter(null);
  };

  const openEditModal = (promoter: Promoter) => {
    setSelectedPromoter(promoter);
    setFormData({
      nome: promoter.nome,
      apelido: promoter.apelido || '',
      email: promoter.email,
      telefone: promoter.telefone || '',
      whatsapp: promoter.whatsapp || '',
      codigo_identificador: promoter.codigo_identificador || '',
      tipo_categoria: promoter.tipo_categoria,
      comissao_percentual: promoter.comissao_percentual,
      link_convite: promoter.link_convite || '',
      observacoes: promoter.observacoes || '',
      establishment_id: promoter.establishment_id || 0,
      foto_url: promoter.foto_url || '',
      instagram: promoter.instagram || '',
      max_convidados_por_evento: promoter.max_convidados_por_evento || 30,
      max_convidados_por_data: promoter.max_convidados_por_data || 50,
      quota_mesas: promoter.quota_mesas || 5,
      quota_entradas: promoter.quota_entradas || 20,
      entradas_gratuitas: promoter.entradas_gratuitas || 5,
      desconto_especial_percentual: promoter.desconto_especial_percentual || 10,
      valor_minimo_consumo: promoter.valor_minimo_consumo || 50,
      pode_reservar_mesas_vip: promoter.pode_reservar_mesas_vip || false,
      pode_selecionar_areas: promoter.pode_selecionar_areas || false
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (promoter: Promoter) => {
    setSelectedPromoter(promoter);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <MdPerson size={36} />
                Sistema Avançado de Promoters
              </h1>
              <p className="mt-2 text-purple-100">
                Gerenciamento completo de promoters com condições, permissões e performance
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2"
            >
              <MdAdd size={20} />
              Novo Promoter
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdSearch className="inline mr-2" />
                Buscar Promoter
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, apelido, email ou código..."
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

            {/* Categoria Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdCategory className="inline mr-2" />
                Categoria
              </label>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                <option value="VIP">VIP</option>
                <option value="A">Categoria A</option>
                <option value="B">Categoria B</option>
                <option value="C">Categoria C</option>
                <option value="Standard">Standard</option>
              </select>
            </div>

            {/* Establishment Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdBusiness className="inline mr-2" />
                Estabelecimento
              </label>
              <select
                value={establishmentFilter}
                onChange={(e) => setEstablishmentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id.toString()}>
                    {est.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdBarChart className="inline mr-2" />
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="nome">Nome</option>
                <option value="categoria">Categoria</option>
                <option value="convidados">Convidados</option>
                <option value="checkins">Check-ins</option>
                <option value="receita">Receita</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>

          {/* Sort Order */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortOrder === 'asc'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
            </button>
            <button
              onClick={fetchPromoters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <MdRefresh size={16} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Promoters</p>
                <p className="text-2xl font-bold text-gray-900">{promoters.length}</p>
              </div>
              <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
                <MdPerson size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promoters Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {promoters.filter(p => p.status === 'Ativo').length}
                </p>
              </div>
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <MdCheckCircle size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Convidados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {promoters.reduce((sum, p) => sum + p.total_convidados, 0)}
                </p>
              </div>
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                <MdPeople size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {promoters.reduce((sum, p) => sum + (p.receita_total_gerada || 0), 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <MdAttachMoney size={24} />
              </div>
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
                <div className="flex items-center gap-3">
                  {promoter.foto_url ? (
                    <img
                      src={promoter.foto_url}
                      alt={promoter.nome}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
                      <MdPerson size={24} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{promoter.nome}</h3>
                    {promoter.apelido && (
                      <p className="text-sm text-gray-600">"{promoter.apelido}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(promoter.tipo_categoria)}`}>
                    {getCategoriaIcon(promoter.tipo_categoria)}
                    <span className="ml-1">{promoter.tipo_categoria}</span>
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promoter.status)}`}>
                    {promoter.status}
                  </span>
                </div>
              </div>

              {/* Código e Estabelecimento */}
              <div className="mb-4 space-y-2">
                {promoter.codigo_identificador && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MdCode size={16} />
                    <span className="font-mono">{promoter.codigo_identificador}</span>
                  </div>
                )}
                {promoter.establishment_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MdBusiness size={16} />
                    <span>{promoter.establishment_name}</span>
                  </div>
                )}
              </div>

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
                {promoter.whatsapp && (
                  <div className="flex items-center gap-2">
                    <MdWhatsapp size={16} />
                    <span>{promoter.whatsapp}</span>
                  </div>
                )}
                {promoter.instagram && (
                  <div className="flex items-center gap-2">
                    <MdInstagram size={16} />
                    <span>@{promoter.instagram}</span>
                  </div>
                )}
              </div>

              {/* Estatísticas */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Convidados</p>
                    <p className="text-lg font-bold text-gray-900">{promoter.total_convidados}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Check-ins</p>
                    <p className="text-lg font-bold text-green-600">{promoter.total_checkins}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Performance</p>
                    <p className="text-lg font-bold text-purple-600">
                      {Math.round(promoter.media_taxa_comparecimento || 0)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Receita</p>
                    <p className="text-lg font-bold text-green-600">
                      R$ {(promoter.receita_total_gerada || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alertas */}
              {promoter.total_alertas_nao_lidos > 0 && (
                <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <MdWarning size={16} />
                    <span className="text-sm font-medium">
                      {promoter.total_alertas_nao_lidos} alerta(s) não lido(s)
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDetailsModal(promoter)}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Ver detalhes"
                  >
                    <MdVisibility size={18} />
                  </button>
                  <button
                    onClick={() => openEditModal(promoter)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPromoter(promoter);
                      setShowConditionsModal(true);
                    }}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Condições"
                  >
                    <MdSettings size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {promoter.link_convite && (
                    <button
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Link de convite"
                    >
                      <MdLink size={18} />
                    </button>
                  )}
                  <button
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="QR Code"
                  >
                    <MdQrCode size={18} />
                  </button>
                </div>
              </div>
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
              {searchTerm || statusFilter || categoriaFilter || establishmentFilter
                ? 'Tente ajustar os filtros de busca'
                : 'Nenhum promoter cadastrado no sistema'}
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Novo Promoter</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MdClose size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Nome completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apelido
                      </label>
                      <input
                        type="text"
                        value={formData.apelido}
                        onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Nome artístico ou apelido"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código Identificador
                      </label>
                      <input
                        type="text"
                        value={formData.codigo_identificador}
                        onChange={(e) => setFormData({ ...formData, codigo_identificador: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="PROMO123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoria
                      </label>
                      <select
                        value={formData.tipo_categoria}
                        onChange={(e) => setFormData({ ...formData, tipo_categoria: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="Standard">Standard</option>
                        <option value="C">Categoria C</option>
                        <option value="B">Categoria B</option>
                        <option value="A">Categoria A</option>
                        <option value="VIP">VIP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comissão (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.comissao_percentual}
                        onChange={(e) => setFormData({ ...formData, comissao_percentual: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estabelecimento
                      </label>
                      <select
                        value={formData.establishment_id}
                        onChange={(e) => setFormData({ ...formData, establishment_id: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value={0}>Selecione um estabelecimento</option>
                        {establishments.map((est) => (
                          <option key={est.id} value={est.id}>
                            {est.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Condições */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Condições e Limites</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máx. Convidados por Evento
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.max_convidados_por_evento}
                        onChange={(e) => setFormData({ ...formData, max_convidados_por_evento: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máx. Convidados por Data
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.max_convidados_por_data}
                        onChange={(e) => setFormData({ ...formData, max_convidados_por_data: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quota de Mesas
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.quota_mesas}
                        onChange={(e) => setFormData({ ...formData, quota_mesas: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quota de Entradas
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.quota_entradas}
                        onChange={(e) => setFormData({ ...formData, quota_entradas: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Entradas Gratuitas
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.entradas_gratuitas}
                        onChange={(e) => setFormData({ ...formData, entradas_gratuitas: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Desconto Especial (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.desconto_especial_percentual}
                        onChange={(e) => setFormData({ ...formData, desconto_especial_percentual: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor Mínimo Consumo (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.valor_minimo_consumo}
                        onChange={(e) => setFormData({ ...formData, valor_minimo_consumo: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="pode_reservar_mesas_vip"
                          checked={formData.pode_reservar_mesas_vip}
                          onChange={(e) => setFormData({ ...formData, pode_reservar_mesas_vip: e.target.checked })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="pode_reservar_mesas_vip" className="ml-2 text-sm text-gray-700">
                          Pode reservar mesas VIP
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="pode_selecionar_areas"
                          checked={formData.pode_selecionar_areas}
                          onChange={(e) => setFormData({ ...formData, pode_selecionar_areas: e.target.checked })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="pode_selecionar_areas" className="ml-2 text-sm text-gray-700">
                          Pode selecionar áreas específicas
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Observações sobre o promoter..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePromoter}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <MdSave size={18} />
                  Criar Promoter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal - Similar structure to Create Modal */}
      <AnimatePresence>
        {showEditModal && selectedPromoter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Editar Promoter</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MdClose size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Same form structure as Create Modal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
                    {/* Form fields same as create modal */}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Condições e Limites</h3>
                    {/* Form fields same as create modal */}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditPromoter}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <MdSave size={18} />
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedPromoter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Detalhes do Promoter</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MdClose size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Detailed information display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
                    {/* Display promoter information */}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                    {/* Display performance metrics */}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




