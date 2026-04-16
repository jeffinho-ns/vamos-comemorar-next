"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MdAdd, MdPeople, MdPerson, MdEdit, MdDelete, MdSettings, MdCheckCircle, MdClose } from "react-icons/md";

interface Establishment {
  id: number;
  name: string;
}

interface GiftRule {
  id: number;
  establishment_id: number;
  evento_id: number | null;
  promoter_id: number | null; // Adicionado para suportar regras específicas por promoter
  descricao: string;
  checkins_necessarios: number;
  status: 'ATIVA' | 'INATIVA';
  tipo_beneficiario: 'ANIVERSARIO' | 'PROMOTER';
  /** Limite de VIP Noite Tuda Masculino (0 = sem limite). Fallback seguro se API não retornar. */
  vip_m_limit?: number;
  /** Limite de VIP Noite Tuda Feminino (0 = sem limite). Fallback seguro se API não retornar. */
  vip_f_limit?: number;
  /** Valor de entrada (R$) para convidados da lista do promoter no check-in. 0 = sem valor (ex.: VIP noite toda). */
  valor_entrada?: number;
  /** Configuração opcional de entrada por horário para check-in de convidados de promoter. */
  entrada_config?: PromoterEntradaConfig | null;
  created_at?: string;
  updated_at?: string;
}

interface Promoter {
  promoter_id: number;
  nome: string;
  apelido?: string;
  email?: string;
}

interface CouvertConfig {
  inicio: string;
  fim: string;
  valor: number;
}

interface EntradaFaixaConfig {
  inicio: string;
  fim: string;
  seco: number;
  consuma: number;
}

interface PromoterEntradaConfig {
  couvert: CouvertConfig;
  faixa_1: EntradaFaixaConfig;
  faixa_2: EntradaFaixaConfig;
}

const createDefaultPromoterEntradaConfig = (): PromoterEntradaConfig => ({
  couvert: { inicio: '', fim: '', valor: 0 },
  faixa_1: { inicio: '', fim: '', seco: 0, consuma: 0 },
  faixa_2: { inicio: '', fim: '', seco: 0, consuma: 0 },
});

const normalizePromoterEntradaConfig = (raw: any): PromoterEntradaConfig => ({
  couvert: {
    inicio: typeof raw?.couvert?.inicio === 'string' ? raw.couvert.inicio : '',
    fim: typeof raw?.couvert?.fim === 'string' ? raw.couvert.fim : '',
    valor: typeof raw?.couvert?.valor === 'number' ? raw.couvert.valor : (parseFloat(String(raw?.couvert?.valor || 0)) || 0),
  },
  faixa_1: {
    inicio: typeof raw?.faixa_1?.inicio === 'string' ? raw.faixa_1.inicio : '',
    fim: typeof raw?.faixa_1?.fim === 'string' ? raw.faixa_1.fim : '',
    seco: typeof raw?.faixa_1?.seco === 'number' ? raw.faixa_1.seco : (parseFloat(String(raw?.faixa_1?.seco || 0)) || 0),
    consuma: typeof raw?.faixa_1?.consuma === 'number' ? raw.faixa_1.consuma : (parseFloat(String(raw?.faixa_1?.consuma || 0)) || 0),
  },
  faixa_2: {
    inicio: typeof raw?.faixa_2?.inicio === 'string' ? raw.faixa_2.inicio : '',
    fim: typeof raw?.faixa_2?.fim === 'string' ? raw.faixa_2.fim : '',
    seco: typeof raw?.faixa_2?.seco === 'number' ? raw.faixa_2.seco : (parseFloat(String(raw?.faixa_2?.seco || 0)) || 0),
    consuma: typeof raw?.faixa_2?.consuma === 'number' ? raw.faixa_2.consuma : (parseFloat(String(raw?.faixa_2?.consuma || 0)) || 0),
  },
});

const sanitizePromoterEntradaConfigForApi = (config: PromoterEntradaConfig) => {
  const normalizeTime = (value: string) => (value && value.trim() ? value.trim() : null);
  const normalizeMoney = (value: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const payload = {
    couvert: {
      inicio: normalizeTime(config.couvert.inicio),
      fim: normalizeTime(config.couvert.fim),
      valor: normalizeMoney(config.couvert.valor),
    },
    faixa_1: {
      inicio: normalizeTime(config.faixa_1.inicio),
      fim: normalizeTime(config.faixa_1.fim),
      seco: normalizeMoney(config.faixa_1.seco),
      consuma: normalizeMoney(config.faixa_1.consuma),
    },
    faixa_2: {
      inicio: normalizeTime(config.faixa_2.inicio),
      fim: normalizeTime(config.faixa_2.fim),
      seco: normalizeMoney(config.faixa_2.seco),
      consuma: normalizeMoney(config.faixa_2.consuma),
    },
  };

  const hasData = Object.values(payload).some((item) =>
    Object.values(item).some((value) => value !== null),
  );

  return hasData ? payload : null;
};

export default function GiftsAdminPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://api.agilizaiapp.com.br';

  // Estados
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const establishmentsRef = useRef<Establishment[]>([]);
  const establishmentsMapRef = useRef<Map<string | number, Establishment>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingRules, setLoadingRules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Regras de brindes
  const [giftRules, setGiftRules] = useState<GiftRule[]>([]);
  const [promoterGiftRules, setPromoterGiftRules] = useState<GiftRule[]>([]);
  
  // Modais
  const [showGiftRuleModal, setShowGiftRuleModal] = useState(false);
  const [showPromoterGiftRuleModal, setShowPromoterGiftRuleModal] = useState(false);
  const [editingGiftRule, setEditingGiftRule] = useState<GiftRule | null>(null);
  const [editingPromoterGiftRule, setEditingPromoterGiftRule] = useState<GiftRule | null>(null);
  
  // Formulários
  const [giftRuleForm, setGiftRuleForm] = useState<{ descricao: string; checkins_necessarios: number; status: 'ATIVA' | 'INATIVA' }>({
    descricao: '',
    checkins_necessarios: 5,
    status: 'ATIVA'
  });
  
  const [promoterGiftRuleForm, setPromoterGiftRuleForm] = useState<{
    descricao: string;
    checkins_necessarios: number;
    status: 'ATIVA' | 'INATIVA';
    promoter_id: number | null;
    vip_m_limit: number;
    vip_f_limit: number;
    valor_entrada: number;
    entrada_config: PromoterEntradaConfig;
  }>({
    descricao: '',
    checkins_necessarios: 5,
    status: 'ATIVA',
    promoter_id: null,
    vip_m_limit: 0,
    vip_f_limit: 0,
    valor_entrada: 0,
    entrada_config: createDefaultPromoterEntradaConfig(),
  });
  
  // Estados para promoters
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);

  // Carregar estabelecimentos
  const fetchEstablishments = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`${API_URL}/api/places`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar estabelecimentos");

      const data = await response.json();
      
      let formattedEstablishments: Establishment[] = [];
      
      if (Array.isArray(data)) {
        formattedEstablishments = data.map((place: any) => ({
          id: place.id || place.place_id, // Manter formato original da API
          name: place.name || place.place_name || 'Sem nome'
        }));
      } else if (data.data && Array.isArray(data.data)) {
        formattedEstablishments = data.data.map((place: any) => ({
          id: place.id || place.place_id, // Manter formato original da API
          name: place.name || place.place_name || 'Sem nome'
        }));
      }
      
      console.log('🏢 Estabelecimentos formatados:', formattedEstablishments);
      setEstablishments(formattedEstablishments);
      establishmentsRef.current = formattedEstablishments; // Atualizar ref também
      
      // Criar mapa de IDs para acesso rápido
      const newMap = new Map<string | number, Establishment>();
      formattedEstablishments.forEach(est => {
        newMap.set(est.id, est);
        newMap.set(String(est.id), est); // Também indexar como string
        newMap.set(Number(est.id), est); // E como número
      });
      establishmentsMapRef.current = newMap;
      console.log('🗺️ Mapa de estabelecimentos criado com', newMap.size, 'entradas');
      
      // Selecionar o primeiro estabelecimento automaticamente apenas se não houver nenhum selecionado
      setSelectedEstablishment(prev => {
        if (!prev && formattedEstablishments.length > 0) {
          console.log('🎯 Selecionando primeiro estabelecimento automaticamente:', formattedEstablishments[0]);
          return formattedEstablishments[0];
        }
        return prev;
      });
    } catch (error) {
      console.error("Erro ao buscar estabelecimentos:", error);
      setError("Erro ao carregar estabelecimentos. Tente recarregar a página.");
      setEstablishments([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Função para carregar regras de brindes para aniversários
  const loadGiftRules = useCallback(async (establishmentId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/gift-rules?establishment_id=${establishmentId}&tipo_beneficiario=ANIVERSARIO`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setGiftRules(data.rules || []);
      } else {
        console.error('Erro ao carregar regras de brindes');
        setGiftRules([]);
      }
    } catch (error) {
      console.error('Erro ao carregar regras de brindes:', error);
      setGiftRules([]);
    }
  }, [API_URL]);

  // Função para carregar promoters (filtrados por estabelecimento)
  const loadPromoters = useCallback(async (establishmentId?: number | null) => {
    // Só carrega se houver um estabelecimento selecionado
    if (!establishmentId) {
      setPromoters([]);
      return;
    }

    try {
      setLoadingPromoters(true);
      const token = localStorage.getItem('authToken');
      console.log('🔍 Carregando promoters para estabelecimento:', establishmentId);
      
      // Usar o endpoint /advanced que está funcionando na página de promoters
      const url = `${API_URL}/api/v1/promoters/advanced?establishment_id=${establishmentId}`;
      console.log('📡 URL da requisição:', url);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📥 Dados recebidos de promoters:', data);
        
        // O endpoint /advanced retorna { success: true, promoters: [...], total: ... }
        const promotersList = data.success && data.promoters 
          ? data.promoters 
          : (Array.isArray(data) ? data : []);
        
        const formattedPromoters = promotersList.map((p: any) => ({
          promoter_id: parseInt(p.promoter_id) || parseInt(p.id),
          nome: p.nome || p.name || 'Sem nome',
          apelido: p.apelido || null,
          email: p.email || null
        }));
        
        console.log('✅ Promoters formatados:', formattedPromoters.length, formattedPromoters);
        setPromoters(formattedPromoters);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao carregar promoters:', response.status, errorText);
        setPromoters([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar promoters:', error);
      setPromoters([]);
    } finally {
      setLoadingPromoters(false);
    }
  }, [API_URL]);

  // Função para carregar regras de brindes para promoters
  const loadPromoterGiftRules = useCallback(async (establishmentId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/gift-rules?establishment_id=${establishmentId}&tipo_beneficiario=PROMOTER`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const rules = (data.rules || []).map((r: GiftRule) => ({
          ...r,
          vip_m_limit: typeof r.vip_m_limit === 'number' ? r.vip_m_limit : 0,
          vip_f_limit: typeof r.vip_f_limit === 'number' ? r.vip_f_limit : 0,
          valor_entrada: typeof r.valor_entrada === 'number' ? r.valor_entrada : (parseFloat(String(r.valor_entrada || 0)) || 0),
          entrada_config: normalizePromoterEntradaConfig(r.entrada_config || {}),
        }));
        setPromoterGiftRules(rules);
      } else {
        console.error('Erro ao carregar regras de brindes para promoters');
        setPromoterGiftRules([]);
      }
    } catch (error) {
      console.error('Erro ao carregar regras de brindes para promoters:', error);
      setPromoterGiftRules([]);
    }
  }, [API_URL]);

  // Carregar dados quando o estabelecimento mudar
  useEffect(() => {
    if (selectedEstablishment) {
      console.log('🔄 Estabelecimento mudou, carregando regras e promoters para:', selectedEstablishment.name, selectedEstablishment.id);
      setLoadingRules(true);
      setGiftRules([]);
      setPromoterGiftRules([]);
      
      Promise.all([
        loadGiftRules(selectedEstablishment.id),
        loadPromoterGiftRules(selectedEstablishment.id),
        loadPromoters(selectedEstablishment.id) // Carregar promoters do estabelecimento selecionado
      ]).finally(() => {
        setLoadingRules(false);
      });
    } else {
      setGiftRules([]);
      setPromoterGiftRules([]);
      setPromoters([]); // Limpar promoters quando não houver estabelecimento selecionado
    }
  }, [selectedEstablishment?.id, loadGiftRules, loadPromoterGiftRules, loadPromoters]);

  // Manter ref e mapa sincronizados com o estado
  useEffect(() => {
    establishmentsRef.current = establishments;
    
    // Atualizar mapa também
    const newMap = new Map<string | number, Establishment>();
    establishments.forEach(est => {
      newMap.set(est.id, est);
      newMap.set(String(est.id), est);
      newMap.set(Number(est.id), est);
    });
    establishmentsMapRef.current = newMap;
  }, [establishments]);

  // Carregar estabelecimentos ao montar (promoters serão carregados quando um estabelecimento for selecionado)
  useEffect(() => {
    fetchEstablishments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gerenciar Regras de Brindes</h1>
          <p className="text-gray-600">
            Configure e gerencie todas as regras de brindes do sistema
          </p>
        </div>

        {/* Seletor de Estabelecimento */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border-2 border-gray-200">
          <label className="block text-lg font-semibold text-gray-800 mb-4">
            📍 Selecionar Estabelecimento *
          </label>
          {loading && establishments.length === 0 ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-3"></div>
              <p className="text-gray-600 font-medium">Carregando estabelecimentos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6 bg-red-50 rounded-lg border-2 border-red-200">
              <p className="text-red-600 font-semibold mb-2">❌ Erro ao carregar estabelecimentos</p>
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchEstablishments();
                }}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : establishments.length === 0 ? (
            <div className="text-center py-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <p className="text-yellow-800 font-semibold">⚠️ Nenhum estabelecimento encontrado</p>
              <p className="text-yellow-600 text-sm mt-2">Entre em contato com o administrador do sistema</p>
            </div>
          ) : (
            <select
              value={selectedEstablishment ? String(selectedEstablishment.id) : ''}
              onChange={async (e) => {
                const value = e.target.value;
                console.log('📝 Seleção de estabelecimento mudou:', value);
                console.log('📦 Estabelecimentos disponíveis:', establishments);
                console.log('📦 Total no array:', establishments.length);
                
                if (value === '') {
                  setSelectedEstablishment(null);
                  setGiftRules([]);
                  setPromoterGiftRules([]);
                  return;
                }
                
                // Buscar estabelecimento usando mapa direto (mais rápido e confiável)
                console.log('🔍 Buscando estabelecimento com valor:', value, '(tipo:', typeof value, ')');
                
                // Tentar encontrar no mapa primeiro (acesso O(1))
                let establishment = establishmentsMapRef.current.get(value) || 
                                   establishmentsMapRef.current.get(String(value)) || 
                                   establishmentsMapRef.current.get(Number(value));
                
                // Se não encontrou no mapa, tentar no array
                if (!establishment) {
                  const searchArray = establishments.length > 0 ? establishments : establishmentsRef.current;
                  console.log('📦 Mapa não encontrou, buscando no array com', searchArray.length, 'itens');
                  
                  establishment = searchArray.find(est => 
                    String(est.id) === String(value) || 
                    Number(est.id) === Number(value)
                  );
                }
                
                if (establishment) {
                  console.log('✅ Estabelecimento encontrado e selecionado:', establishment);
                  setSelectedEstablishment(establishment);
                } else {
                  console.error('❌ ERRO: Estabelecimento não encontrado!');
                  console.error('📝 Valor selecionado:', value);
                  console.error('📋 Estabelecimentos no mapa:', Array.from(establishmentsMapRef.current.keys()));
                  console.error('📋 Estabelecimentos no array:', establishments.map(e => String(e.id)));
                  alert(`Erro: Estabelecimento com ID ${value} não encontrado. Recarregue a página.`);
                }
              }}
              className="w-full md:w-1/2 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-800 font-medium text-lg bg-white hover:border-yellow-400 transition-colors"
            >
              <option value="">-- Selecione um estabelecimento --</option>
              {establishments.map((est) => (
                <option key={est.id} value={String(est.id)}>
                  {est.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {!selectedEstablishment ? (
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-12 text-center shadow-sm border-2 border-yellow-300">
            <MdSettings className="mx-auto mb-4 text-yellow-600" size={64} />
            <p className="text-xl font-semibold text-gray-800 mb-2">Selecione um estabelecimento</p>
            <p className="text-gray-600">Escolha um estabelecimento no seletor acima para gerenciar as regras de brindes</p>
          </div>
        ) : loadingRules ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border-2 border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium text-lg">Carregando regras de brindes para <strong>{selectedEstablishment.name}</strong>...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Seção 1: Regras de Brindes para Reservas de Aniversário */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-300 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 rounded-full p-3 shadow-md">
                    <MdPeople className="text-white" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">🎉 Regras para Reservas de Aniversário</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Regras que se aplicam aos donos de reservas de aniversário quando seus convidados fazem check-in
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingGiftRule(null);
                    setGiftRuleForm({ descricao: '', checkins_necessarios: 5, status: 'ATIVA' });
                    setShowGiftRuleModal(true);
                  }}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md font-semibold"
                >
                  <MdAdd size={24} />
                  Nova Regra
                </button>
              </div>
              
              {giftRules.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border-2 border-dashed border-green-200">
                  <MdSettings className="mx-auto mb-2 text-green-400" size={48} />
                  <p className="text-lg font-medium">Nenhuma regra configurada</p>
                  <p className="text-sm mt-1">Clique em "Nova Regra" para criar uma regra de brinde para reservas de aniversário</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {giftRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`bg-white rounded-lg p-5 border-l-4 ${
                        rule.status === 'ATIVA' ? 'border-l-green-500 border-green-200' : 'border-l-gray-400 border-gray-200'
                      } shadow-sm hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">{rule.descricao}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              rule.status === 'ATIVA'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {rule.status === 'ATIVA' ? '✓ Ativa' : '○ Inativa'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Liberar quando atingir <strong className="text-green-600">{rule.checkins_necessarios}</strong> check-in{rule.checkins_necessarios > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingGiftRule(rule);
                              setGiftRuleForm({
                                descricao: rule.descricao,
                                checkins_necessarios: rule.checkins_necessarios,
                                status: rule.status
                              });
                              setShowGiftRuleModal(true);
                            }}
                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2"
                          >
                            <MdEdit size={18} />
                            Editar
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Tem certeza que deseja ${rule.status === 'ATIVA' ? 'desativar' : 'ativar'} esta regra?`)) {
                                try {
                                  const token = localStorage.getItem('authToken');
                                  const response = await fetch(`${API_URL}/api/gift-rules/${rule.id}`, {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                      status: rule.status === 'ATIVA' ? 'INATIVA' : 'ATIVA'
                                    })
                                  });

                                  if (response.ok) {
                                    if (selectedEstablishment) {
                                      await loadGiftRules(selectedEstablishment.id);
                                    }
                                  } else {
                                    alert('Erro ao atualizar regra');
                                  }
                                } catch (error) {
                                  console.error('Erro:', error);
                                  alert('Erro ao atualizar regra');
                                }
                              }
                            }}
                            className={`px-4 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                              rule.status === 'ATIVA'
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            <MdCheckCircle size={18} />
                            {rule.status === 'ATIVA' ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Tem certeza que deseja deletar esta regra? Esta ação não pode ser desfeita.')) {
                                try {
                                  const token = localStorage.getItem('authToken');
                                  const response = await fetch(`${API_URL}/api/gift-rules/${rule.id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      Authorization: `Bearer ${token}`
                                    }
                                  });

                                  if (response.ok) {
                                    if (selectedEstablishment) {
                                      await loadGiftRules(selectedEstablishment.id);
                                    }
                                  } else {
                                    alert('Erro ao deletar regra');
                                  }
                                } catch (error) {
                                  console.error('Erro:', error);
                                  alert('Erro ao deletar regra');
                                }
                              }
                            }}
                            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center gap-2"
                          >
                            <MdDelete size={18} />
                            Deletar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Separador visual */}
            <div className="my-8 border-t-4 border-dashed border-gray-300"></div>

            {/* Seção 2: Regras de Brindes para Promoters */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-300 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-600 rounded-full p-3 shadow-md">
                    <MdPerson className="text-white" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">🎯 Regras para Promoters</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Regras que se aplicam aos promoters quando os convidados de suas listas fazem check-in nos eventos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingPromoterGiftRule(null);
                    setPromoterGiftRuleForm({
                      descricao: '',
                      checkins_necessarios: 5,
                      status: 'ATIVA',
                      promoter_id: null,
                      vip_m_limit: 0,
                      vip_f_limit: 0,
                      valor_entrada: 0,
                      entrada_config: createDefaultPromoterEntradaConfig(),
                    });
                    setShowPromoterGiftRuleModal(true);
                  }}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md font-semibold"
                >
                  <MdAdd size={24} />
                  Nova Regra
                </button>
              </div>
              
              {promoterGiftRules.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border-2 border-dashed border-purple-200">
                  <MdSettings className="mx-auto mb-2 text-purple-400" size={48} />
                  <p className="text-lg font-medium">Nenhuma regra configurada</p>
                  <p className="text-sm mt-1">Clique em "Nova Regra" para criar uma regra de brinde para promoters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {promoterGiftRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`bg-white rounded-lg p-5 border-l-4 ${
                        rule.status === 'ATIVA' ? 'border-l-purple-500 border-purple-200' : 'border-l-gray-400 border-gray-200'
                      } shadow-sm hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">{rule.descricao}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              rule.status === 'ATIVA'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {rule.status === 'ATIVA' ? '✓ Ativa' : '○ Inativa'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Liberar quando atingir <strong className="text-purple-600">{rule.checkins_necessarios}</strong> check-in{rule.checkins_necessarios > 1 ? 's' : ''}
                          </p>
                          {rule.promoter_id && (
                            <p className="text-xs text-purple-700 mt-1 font-medium">
                              📌 Regra específica para promoter: {promoters.find(p => p.promoter_id === rule.promoter_id)?.nome || `ID ${rule.promoter_id}`}
                            </p>
                          )}
                          {!rule.promoter_id && (
                            <p className="text-xs text-gray-500 mt-1">
                              🌐 Regra geral (aplica-se a todos os promoters)
                            </p>
                          )}
                          {((rule.vip_m_limit ?? 0) > 0 || (rule.vip_f_limit ?? 0) > 0) && (
                            <p className="text-xs text-purple-600 mt-1 font-medium">
                              🎟️ VIP Noite Tuda: M {rule.vip_m_limit ?? 0} / F {rule.vip_f_limit ?? 0}
                            </p>
                          )}
                          {((rule.valor_entrada ?? 0) > 0) && (
                            <p className="text-xs text-purple-700 mt-1 font-medium">
                              💵 Valor de entrada: R$ {Number(rule.valor_entrada).toFixed(2).replace('.', ',')}
                            </p>
                          )}
                          {rule.entrada_config && (
                            <div className="text-xs text-purple-700 mt-2 space-y-1">
                              {(rule.entrada_config.couvert?.valor ?? 0) > 0 && (
                                <p>
                                  🎼 Couvert: {rule.entrada_config.couvert.inicio || '--:--'} até {rule.entrada_config.couvert.fim || '--:--'} — R$ {Number(rule.entrada_config.couvert.valor || 0).toFixed(2).replace('.', ',')}
                                </p>
                              )}
                              {((rule.entrada_config.faixa_1?.seco ?? 0) > 0 || (rule.entrada_config.faixa_1?.consuma ?? 0) > 0) && (
                                <p>
                                  ⏰ Faixa 1: {rule.entrada_config.faixa_1.inicio || '--:--'} até {rule.entrada_config.faixa_1.fim || '--:--'} — SECO R$ {Number(rule.entrada_config.faixa_1.seco || 0).toFixed(2).replace('.', ',')} / CONSUMA R$ {Number(rule.entrada_config.faixa_1.consuma || 0).toFixed(2).replace('.', ',')}
                                </p>
                              )}
                              {((rule.entrada_config.faixa_2?.seco ?? 0) > 0 || (rule.entrada_config.faixa_2?.consuma ?? 0) > 0) && (
                                <p>
                                  🌙 Faixa 2: {rule.entrada_config.faixa_2.inicio || '--:--'} até {rule.entrada_config.faixa_2.fim || 'fim da noite'} — SECO R$ {Number(rule.entrada_config.faixa_2.seco || 0).toFixed(2).replace('.', ',')} / CONSUMA R$ {Number(rule.entrada_config.faixa_2.consuma || 0).toFixed(2).replace('.', ',')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingPromoterGiftRule(rule);
                              setPromoterGiftRuleForm({
                                descricao: rule.descricao,
                                checkins_necessarios: rule.checkins_necessarios,
                                status: rule.status,
                                promoter_id: rule.promoter_id || null,
                                vip_m_limit: typeof rule.vip_m_limit === 'number' ? rule.vip_m_limit : 0,
                                vip_f_limit: typeof rule.vip_f_limit === 'number' ? rule.vip_f_limit : 0,
                                valor_entrada: typeof rule.valor_entrada === 'number' ? rule.valor_entrada : (parseFloat(String(rule.valor_entrada || 0)) || 0),
                                entrada_config: normalizePromoterEntradaConfig(rule.entrada_config || {}),
                              });
                              setShowPromoterGiftRuleModal(true);
                            }}
                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2"
                          >
                            <MdEdit size={18} />
                            Editar
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Tem certeza que deseja ${rule.status === 'ATIVA' ? 'desativar' : 'ativar'} esta regra?`)) {
                                try {
                                  const token = localStorage.getItem('authToken');
                                  const response = await fetch(`${API_URL}/api/gift-rules/${rule.id}`, {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                      status: rule.status === 'ATIVA' ? 'INATIVA' : 'ATIVA'
                                    })
                                  });

                                  if (response.ok) {
                                    if (selectedEstablishment) {
                                      await loadPromoterGiftRules(selectedEstablishment.id);
                                    }
                                  } else {
                                    alert('Erro ao atualizar regra');
                                  }
                                } catch (error) {
                                  console.error('Erro:', error);
                                  alert('Erro ao atualizar regra');
                                }
                              }
                            }}
                            className={`px-4 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                              rule.status === 'ATIVA'
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            <MdCheckCircle size={18} />
                            {rule.status === 'ATIVA' ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Tem certeza que deseja deletar esta regra? Esta ação não pode ser desfeita.')) {
                                try {
                                  const token = localStorage.getItem('authToken');
                                  const response = await fetch(`${API_URL}/api/gift-rules/${rule.id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      Authorization: `Bearer ${token}`
                                    }
                                  });

                                  if (response.ok) {
                                    if (selectedEstablishment) {
                                      await loadPromoterGiftRules(selectedEstablishment.id);
                                    }
                                  } else {
                                    alert('Erro ao deletar regra');
                                  }
                                } catch (error) {
                                  console.error('Erro:', error);
                                  alert('Erro ao deletar regra');
                                }
                              }
                            }}
                            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center gap-2"
                          >
                            <MdDelete size={18} />
                            Deletar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal para Criar/Editar Regra de Brinde para Aniversário */}
        {showGiftRuleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingGiftRule ? 'Editar Regra de Brinde' : 'Nova Regra de Brinde para Aniversário'}
                </h3>
                <button
                  onClick={() => {
                    setShowGiftRuleModal(false);
                    setEditingGiftRule(null);
                    setGiftRuleForm({ descricao: '', checkins_necessarios: 5, status: 'ATIVA' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MdClose size={24} />
                </button>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!giftRuleForm.descricao || !giftRuleForm.checkins_necessarios) return;

                try {
                  const token = localStorage.getItem('authToken');
                  const url = editingGiftRule
                    ? `${API_URL}/api/gift-rules/${editingGiftRule.id}`
                    : `${API_URL}/api/gift-rules`;
                  const method = editingGiftRule ? 'PUT' : 'POST';

                  const response = await fetch(url, {
                    method,
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      ...giftRuleForm,
                      establishment_id: selectedEstablishment?.id,
                      tipo_beneficiario: 'ANIVERSARIO'
                    })
                  });

                  if (response.ok) {
                    if (selectedEstablishment) {
                      await loadGiftRules(selectedEstablishment.id);
                    }
                    setShowGiftRuleModal(false);
                    setEditingGiftRule(null);
                    setGiftRuleForm({ descricao: '', checkins_necessarios: 5, status: 'ATIVA' });
                  } else {
                    const errorData = await response.json();
                    alert('Erro: ' + (errorData.error || 'Erro desconhecido'));
                  }
                } catch (error) {
                  console.error('Erro ao salvar regra:', error);
                  alert('Erro ao salvar regra. Tente novamente.');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição do Brinde *
                  </label>
                  <input
                    type="text"
                    value={giftRuleForm.descricao}
                    onChange={(e) => setGiftRuleForm(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: 1 drink, 4 cervejas, 1 garrafa de licor..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Descreva claramente o brinde que será oferecido
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-ins Necessários *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={giftRuleForm.checkins_necessarios}
                    onChange={(e) => setGiftRuleForm(prev => ({ ...prev, checkins_necessarios: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantidade de check-ins necessários para liberar este brinde
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={giftRuleForm.status}
                    onChange={(e) => setGiftRuleForm(prev => ({ ...prev, status: e.target.value as 'ATIVA' | 'INATIVA' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="ATIVA">Ativa</option>
                    <option value="INATIVA">Inativa</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Regras inativas não serão verificadas automaticamente
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGiftRuleModal(false);
                      setEditingGiftRule(null);
                      setGiftRuleForm({ descricao: '', checkins_necessarios: 5, status: 'ATIVA' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    {editingGiftRule ? 'Salvar Alterações' : 'Criar Regra'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para Criar/Editar Regra de Brinde para Promoter */}
        {showPromoterGiftRuleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingPromoterGiftRule ? 'Editar Regra de Brinde' : 'Nova Regra de Brinde para Promoter'}
                </h3>
                <button
                  onClick={() => {
                    setShowPromoterGiftRuleModal(false);
                    setEditingPromoterGiftRule(null);
                    setPromoterGiftRuleForm({
                      descricao: '',
                      checkins_necessarios: 5,
                      status: 'ATIVA',
                      promoter_id: null,
                      vip_m_limit: 0,
                      vip_f_limit: 0,
                      valor_entrada: 0,
                      entrada_config: createDefaultPromoterEntradaConfig(),
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                <MdClose size={24} />
              </button>
            </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!promoterGiftRuleForm.descricao || !promoterGiftRuleForm.checkins_necessarios) return;

                try {
                  const token = localStorage.getItem('authToken');
                  const url = editingPromoterGiftRule
                    ? `${API_URL}/api/gift-rules/${editingPromoterGiftRule.id}`
                    : `${API_URL}/api/gift-rules`;
                  const method = editingPromoterGiftRule ? 'PUT' : 'POST';

                  const response = await fetch(url, {
                    method,
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      ...promoterGiftRuleForm,
                      establishment_id: selectedEstablishment?.id,
                      tipo_beneficiario: 'PROMOTER',
                      promoter_id: promoterGiftRuleForm.promoter_id || null,
                      vip_m_limit: Number(promoterGiftRuleForm.vip_m_limit) || 0,
                      vip_f_limit: Number(promoterGiftRuleForm.vip_f_limit) || 0,
                      valor_entrada: Number(promoterGiftRuleForm.valor_entrada) || 0,
                      entrada_config: sanitizePromoterEntradaConfigForApi(promoterGiftRuleForm.entrada_config),
                    })
                  });

                  if (response.ok) {
                    if (selectedEstablishment) {
                      await loadPromoterGiftRules(selectedEstablishment.id);
                    }
                    setShowPromoterGiftRuleModal(false);
                    setEditingPromoterGiftRule(null);
                    setPromoterGiftRuleForm({
                      descricao: '',
                      checkins_necessarios: 5,
                      status: 'ATIVA',
                      promoter_id: null,
                      vip_m_limit: 0,
                      vip_f_limit: 0,
                      valor_entrada: 0,
                      entrada_config: createDefaultPromoterEntradaConfig(),
                    });
                  } else {
                    const errorData = await response.json();
                    alert('Erro: ' + (errorData.error || 'Erro desconhecido'));
                  }
                } catch (error) {
                  console.error('Erro ao salvar regra:', error);
                  alert('Erro ao salvar regra. Tente novamente.');
                }
              }} className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                  <div className="space-y-4">
                    {/* Campo para selecionar promoter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Promoter (Opcional)
                      </label>
                      <select
                        value={promoterGiftRuleForm.promoter_id || ''}
                        onChange={(e) => setPromoterGiftRuleForm(prev => ({ 
                          ...prev, 
                          promoter_id: e.target.value === '' ? null : parseInt(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">-- Todos os Promoters (Regra Geral) --</option>
                        {loadingPromoters ? (
                          <option disabled>Carregando promoters...</option>
                        ) : (
                          promoters.map((promoter) => (
                            <option key={promoter.promoter_id} value={promoter.promoter_id}>
                              {promoter.nome} {promoter.apelido ? `(${promoter.apelido})` : ''}
                            </option>
                          ))
                        )}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Selecione um promoter específico ou deixe em branco para aplicar a todos os promoters do estabelecimento
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Limite VIP Masculino
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={promoterGiftRuleForm.vip_m_limit}
                          onChange={(e) => setPromoterGiftRuleForm(prev => ({ ...prev, vip_m_limit: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">0 = sem cota VIP M</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Limite VIP Feminino
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={promoterGiftRuleForm.vip_f_limit}
                          onChange={(e) => setPromoterGiftRuleForm(prev => ({ ...prev, vip_f_limit: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">0 = sem cota VIP F</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor de entrada (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={promoterGiftRuleForm.valor_entrada}
                        onChange={(e) => setPromoterGiftRuleForm(prev => ({ ...prev, valor_entrada: Math.max(0, parseFloat(e.target.value) || 0) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Valor que a recepção cobrará no check-in (lista promoter). 0 = sem valor (ex.: VIP noite toda).
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição do Brinde *
                      </label>
                      <input
                        type="text"
                        value={promoterGiftRuleForm.descricao}
                        onChange={(e) => setPromoterGiftRuleForm(prev => ({ ...prev, descricao: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Ex: 10% de comissão, 1 garrafa premium, acesso VIP..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Descreva claramente o brinde que será oferecido
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Check-ins Necessários *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={promoterGiftRuleForm.checkins_necessarios}
                          onChange={(e) => setPromoterGiftRuleForm(prev => ({ ...prev, checkins_necessarios: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Quantidade para liberar o brinde
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={promoterGiftRuleForm.status}
                          onChange={(e) => setPromoterGiftRuleForm(prev => ({ ...prev, status: e.target.value as 'ATIVA' | 'INATIVA' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="ATIVA">Ativa</option>
                          <option value="INATIVA">Inativa</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Regras inativas não são verificadas
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/40 space-y-3">
                  <h4 className="text-sm font-semibold text-purple-800">Configuração de Entrada por Horário (opcional)</h4>
                  <p className="text-xs text-purple-700">
                    Se não preencher os horários/valores abaixo, o check-in seguirá as regras normais já existentes.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="time"
                      value={promoterGiftRuleForm.entrada_config.couvert.inicio}
                      onChange={(e) => setPromoterGiftRuleForm(prev => ({
                        ...prev,
                        entrada_config: { ...prev.entrada_config, couvert: { ...prev.entrada_config.couvert, inicio: e.target.value } }
                      }))}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="time"
                      value={promoterGiftRuleForm.entrada_config.couvert.fim}
                      onChange={(e) => setPromoterGiftRuleForm(prev => ({
                        ...prev,
                        entrada_config: { ...prev.entrada_config, couvert: { ...prev.entrada_config.couvert, fim: e.target.value } }
                      }))}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={promoterGiftRuleForm.entrada_config.couvert.valor}
                      onChange={(e) => setPromoterGiftRuleForm(prev => ({
                        ...prev,
                        entrada_config: { ...prev.entrada_config, couvert: { ...prev.entrada_config.couvert, valor: Math.max(0, parseFloat(e.target.value) || 0) } }
                      }))}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Couvert"
                    />
                  </div>
                  <p className="text-xs text-gray-500 -mt-1">Couvert Artístico: início, fim e valor (R$).</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <input
                      type="time"
                      value={promoterGiftRuleForm.entrada_config.faixa_1.inicio}
                      onChange={(e) => setPromoterGiftRuleForm(prev => ({
                        ...prev,
                        entrada_config: { ...prev.entrada_config, faixa_1: { ...prev.entrada_config.faixa_1, inicio: e.target.value } }
                      }))}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="time"
                      value={promoterGiftRuleForm.entrada_config.faixa_1.fim}
                      onChange={(e) => setPromoterGiftRuleForm(prev => ({
                        ...prev,
                        entrada_config: { ...prev.entrada_config, faixa_1: { ...prev.entrada_config.faixa_1, fim: e.target.value } }
                      }))}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={promoterGiftRuleForm.entrada_config.faixa_1.seco}
                      onChange={(e) => setPromoterGiftRuleForm(prev => ({
                        ...prev,
                        entrada_config: { ...prev.entrada_config, faixa_1: { ...prev.entrada_config.faixa_1, seco: Math.max(0, parseFloat(e.target.value) || 0) } }
                      }))}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Seco"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={promoterGiftRuleForm.entrada_config.faixa_1.consuma}
                      onChange={(e) => setPromoterGiftRuleForm(prev => ({
                        ...prev,
                        entrada_config: { ...prev.entrada_config, faixa_1: { ...prev.entrada_config.faixa_1, consuma: Math.max(0, parseFloat(e.target.value) || 0) } }
                      }))}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Consuma"
                    />
                  </div>
                  <p className="text-xs text-gray-500 -mt-1">Faixa 1: início, fim, valor SECO e valor CONSUMA (R$).</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <input
                      type="time"
                      value={promoterGiftRuleForm.entrada_config.faixa_2.inicio}
                      onChange={(e) => setPromoterGiftRuleForm(prev => ({
                        ...prev,
                        entrada_config: { ...prev.entrada_config, faixa_2: { ...prev.entrada_config.faixa_2, inicio: e.target.value } }
                      }))}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="time"
                      value={promoterGiftRuleForm.entrada_config.faixa_2.fim}
                      onChange={(e) => setPromoterGiftRuleForm(prev => ({
                        ...prev,
                        entrada_config: { ...prev.entrada_config, faixa_2: { ...prev.entrada_config.faixa_2, fim: e.target.value } }
                      }))}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={promoterGiftRuleForm.entrada_config.faixa_2.seco}
                      onChange={(e) => setPromoterGiftRuleForm(prev => ({
                        ...prev,
                        entrada_config: { ...prev.entrada_config, faixa_2: { ...prev.entrada_config.faixa_2, seco: Math.max(0, parseFloat(e.target.value) || 0) } }
                      }))}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Seco"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={promoterGiftRuleForm.entrada_config.faixa_2.consuma}
                      onChange={(e) => setPromoterGiftRuleForm(prev => ({
                        ...prev,
                        entrada_config: { ...prev.entrada_config, faixa_2: { ...prev.entrada_config.faixa_2, consuma: Math.max(0, parseFloat(e.target.value) || 0) } }
                      }))}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Consuma"
                    />
                  </div>
                  <p className="text-xs text-gray-500 -mt-1">Faixa 2: início, fim (opcional para "após"), valor SECO e valor CONSUMA (R$).</p>
                </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPromoterGiftRuleModal(false);
                      setEditingPromoterGiftRule(null);
                      setPromoterGiftRuleForm({
                        descricao: '',
                        checkins_necessarios: 5,
                        status: 'ATIVA',
                        promoter_id: null,
                        vip_m_limit: 0,
                        vip_f_limit: 0,
                        valor_entrada: 0,
                        entrada_config: createDefaultPromoterEntradaConfig(),
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    {editingPromoterGiftRule ? 'Salvar Alterações' : 'Criar Regra'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
