"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MdCheckCircle,
  MdPending,
  MdPerson,
  MdRestaurant,
  MdPhone,
  MdAccessTime,
  MdSearch,
  MdClose,
  MdRefresh,
  MdGroups,
  MdTableBar,
  MdStar,
  MdEmail,
  MdDescription,
  MdArrowBack,
} from 'react-icons/md';
import { WithPermission } from '../../components/WithPermission/WithPermission';
import { useEstablishmentPermissions } from '@/app/hooks/useEstablishmentPermissions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.agilizaiapp.com.br';

// Tipos
interface EventoLista {
  evento_id: number;
  nome: string;
  data_evento: string | null; // null quando semanal
  dia_da_semana?: number | null;
  tipo_evento: 'unico' | 'semanal';
  establishment_id: number;
  establishment_name: string;
  horario_funcionamento?: string | null;
}

export default function CheckInsGeralPage() {
  const router = useRouter();
  const establishmentPermissions = useEstablishmentPermissions();

  // Detectar se é tablet e redirecionar
  useEffect(() => {
    const isTablet = () => {
      // Verificar largura da tela (tablets geralmente têm entre 600px e 1024px)
      const width = window.innerWidth;
      const isTabletWidth = width >= 600 && width <= 1024;
      
      // Verificar user agent para tablets
      const userAgent = navigator.userAgent.toLowerCase();
      const isTabletUA = /ipad|android(?!.*mobile)|tablet/.test(userAgent);
      
      // Verificar se tem touch e não é mobile pequeno
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isNotSmallMobile = width >= 600;
      
      return (isTabletWidth || isTabletUA) && hasTouch && isNotSmallMobile;
    };

    if (isTablet()) {
      router.replace('/admin/checkins/tablet');
    }
  }, [router]);

  // Estados
  const [loading, setLoading] = useState(false);
  const [estabelecimentos, setEstabelecimentos] = useState<{ id: number; nome: string }[]>([]);
  const [eventos, setEventos] = useState<EventoLista[]>([]);
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<number | null>(null);
  
  // Usar ref para evitar chamadas múltiplas
  const hasLoadedRef = useRef(false);

  // Normalizador de nomes para deduplicação (remove acentos, espaços extras e corrige typos conhecidos)
  const normalize = (name: string): string => {
    if (!name) return '';
    const fixed = name.replace(/Jutino/gi, 'Justino');
    return fixed
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Carrega eventos e estabelece a lista de estabelecimentos com prioridade do id dos eventos
  const carregarTudo = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` } as any;

      // Busca eventos primeiro
      const evRes = await fetch(`${API_URL}/api/v1/eventos`, { headers });
      if (!evRes.ok) throw new Error('Falha ao buscar eventos');
      const evData = await evRes.json();
      const listaEventos: EventoLista[] = (evData.eventos || []).map((e: any) => ({
        evento_id: e.evento_id,
        nome: e.nome,
        data_evento: e.data_evento || null,
        dia_da_semana: e.dia_da_semana ?? null,
        tipo_evento: e.tipo_evento,
        establishment_id: Number(e.establishment_id) || Number(e.id_place) || 0, // Garantir que seja número
        establishment_name: e.establishment_name || e.casa_do_evento || 'Estabelecimento',
        horario_funcionamento: e.horario_funcionamento || e.hora_do_evento || null
      }));
      
      console.log(`📋 [CHECKINS] Eventos carregados: ${listaEventos.length}`);
      listaEventos.forEach(e => {
        console.log(`   📅 Evento: "${e.nome}" - Establishment ID: ${e.establishment_id} (tipo: ${typeof e.establishment_id}), Nome: "${e.establishment_name}"`);
      });
      
      setEventos(listaEventos);

      // Monta mapa nome->id (dos eventos) para garantir que seleção use o id correto
      const eventoNomeToId = new Map<string, number>();
      for (const ev of listaEventos) {
        const key = normalize(ev.establishment_name);
        if (!eventoNomeToId.has(key)) eventoNomeToId.set(key, ev.establishment_id);
      }

      // Busca estabelecimentos de ambas as fontes
      const [barsRes, placesRes] = await Promise.all([
        fetch(`${API_URL}/api/bars`, { headers }),
        fetch(`${API_URL}/api/places`, { headers })
      ]);

      let bars: any[] = [];
      if (barsRes.ok) {
        const barsData = await barsRes.json();
        if (Array.isArray(barsData)) bars = barsData;
      }

      let places: any[] = [];
      if (placesRes.ok) {
        const placesData = await placesRes.json();
        if (Array.isArray(placesData)) places = placesData;
        else if (placesData?.data && Array.isArray(placesData.data)) places = placesData.data;
      }

      const merged = new Map<string, { id: number; nome: string }>();
      const addItem = (id: number, nome: string, source: string) => {
        const key = normalize(nome);
        if (!key) return;
        // Usar uma chave única que inclui o ID para evitar conflitos
        // Mesmo se os nomes normalizados forem iguais, IDs diferentes devem ser mantidos
        const uniqueKey = `${key}_${id}`;
        if (!merged.has(uniqueKey)) {
          merged.set(uniqueKey, { id: Number(id), nome: nome.replace(/Jutino/gi, 'Justino') });
          console.log(`📍 [ESTAB] Adicionando: ${nome} (ID: ${id}, source: ${source}, key: ${uniqueKey})`);
        } else {
          console.log(`⚠️ [ESTAB] Estabelecimento já existe (mesmo nome normalizado e ID): ${nome} (ID: ${id})`);
        }
      };

      bars.forEach(b => addItem(Number(b.id), b.name, 'bars'));
      places.forEach(p => addItem(Number(p.id), p.name, 'places'));

      // Remover duplicatas por ID (manter o primeiro encontrado, priorizar places sobre bars)
      const uniqueById = new Map<number, { id: number; nome: string }>();
      Array.from(merged.values()).forEach(est => {
        if (!uniqueById.has(est.id)) {
          uniqueById.set(est.id, est);
        }
      });
      
      // Ordena
      const lista = Array.from(uniqueById.values()).sort((a, b) => a.nome.localeCompare(b.nome));
      
      console.log(`📋 [CHECKINS] Total de estabelecimentos antes do filtro: ${lista.length}`, 
        lista.map(e => ({ id: e.id, nome: e.nome }))
      );
      
      // Filtrar estabelecimentos baseado nas permissões do usuário
      const filteredLista = establishmentPermissions.getFilteredEstablishments(lista);
      
      console.log(`📋 [CHECKINS] Total de estabelecimentos após filtro: ${filteredLista.length}`, 
        filteredLista.map(e => ({ id: e.id, nome: e.nome }))
      );
      
      setEstabelecimentos(filteredLista);
      
      // Sempre selecionar automaticamente se houver apenas um estabelecimento disponível
      // Mas apenas se ainda não foi selecionado para evitar loops
      if (filteredLista.length === 1 && estabelecimentoSelecionado !== filteredLista[0].id) {
        const defaultId = filteredLista[0].id;
        setEstabelecimentoSelecionado(defaultId);
        console.log(`✅ [CHECKINS] Estabelecimento único selecionado automaticamente: ${defaultId} - ${filteredLista[0].nome}`);
      } else if (establishmentPermissions.isRestrictedToSingleEstablishment() && filteredLista.length > 0) {
        // Se está restrito a um único estabelecimento, usar o ID das permissões
        const defaultId = establishmentPermissions.getDefaultEstablishmentId();
        console.log(`🔍 [CHECKINS] Usuário restrito detectado. Default ID das permissões: ${defaultId}, Estabelecimentos filtrados:`, filteredLista.map(e => ({ id: e.id, nome: e.nome })));
        
        if (defaultId) {
          // Verificar se o ID das permissões está na lista filtrada
          const estabelecimentoCorreto = filteredLista.find(est => est.id === defaultId);
          if (estabelecimentoCorreto) {
            if (estabelecimentoSelecionado !== defaultId) {
              setEstabelecimentoSelecionado(defaultId);
              console.log(`✅ [CHECKINS] Estabelecimento selecionado via permissões: ${defaultId} - ${estabelecimentoCorreto.nome}`);
            } else {
              console.log(`✅ [CHECKINS] Estabelecimento já estava selecionado: ${defaultId} - ${estabelecimentoCorreto.nome}`);
            }
          } else {
            console.warn(`⚠️ [CHECKINS] ID das permissões (${defaultId}) não encontrado na lista filtrada. Usando primeiro da lista.`);
            if (filteredLista.length > 0 && estabelecimentoSelecionado !== filteredLista[0].id) {
              setEstabelecimentoSelecionado(filteredLista[0].id);
              console.log(`✅ [CHECKINS] Estabelecimento selecionado (fallback): ${filteredLista[0].id} - ${filteredLista[0].nome}`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [establishmentPermissions.getFilteredEstablishments, establishmentPermissions.isRestrictedToSingleEstablishment, establishmentPermissions.getDefaultEstablishmentId]);

  useEffect(() => {
    // Aguardar o hook carregar as permissões antes de carregar estabelecimentos
    // Executar apenas uma vez quando as permissões estiverem carregadas
    if (!establishmentPermissions.isLoading && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      carregarTudo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishmentPermissions.isLoading]);

  // Efeito adicional para garantir seleção quando estabelecimentos forem carregados
  useEffect(() => {
    if (!establishmentPermissions.isLoading && estabelecimentos.length > 0 && !estabelecimentoSelecionado) {
      const isRestricted = establishmentPermissions.isRestrictedToSingleEstablishment();
      const hasOnlyOne = estabelecimentos.length === 1;
      
      console.log(`🔍 [CHECKINS] useEffect seleção - isRestricted: ${isRestricted}, hasOnlyOne: ${hasOnlyOne}, estabelecimentos disponíveis:`, estabelecimentos.map(e => ({ id: e.id, nome: e.nome })));
      
      // Selecionar automaticamente se estiver restrito ou houver apenas um estabelecimento
      if (isRestricted || hasOnlyOne) {
        const defaultId = establishmentPermissions.getDefaultEstablishmentId() || estabelecimentos[0]?.id;
        console.log(`🔍 [CHECKINS] Default ID das permissões: ${establishmentPermissions.getDefaultEstablishmentId()}, usando: ${defaultId}`);
        
        if (defaultId) {
          // Verificar se o ID está na lista de estabelecimentos
          const estabelecimentoEncontrado = estabelecimentos.find(e => e.id === defaultId);
          if (estabelecimentoEncontrado) {
            setEstabelecimentoSelecionado(defaultId);
            console.log(`✅ [CHECKINS] Estabelecimento selecionado automaticamente via useEffect: ${defaultId} - ${estabelecimentoEncontrado.nome}`);
            console.log(`📋 [CHECKINS] Total de eventos carregados para filtrar: ${eventos.length}`);
          } else {
            // Se o ID não estiver na lista, usar o primeiro disponível
            if (estabelecimentos.length > 0) {
              const primeiroId = estabelecimentos[0].id;
              setEstabelecimentoSelecionado(primeiroId);
              console.log(`⚠️ [CHECKINS] ID ${defaultId} não encontrado na lista. Usando primeiro disponível: ${primeiroId} - ${estabelecimentos[0].nome}`);
            }
          }
        }
      }
    }
  }, [establishmentPermissions.isLoading, estabelecimentos.length, estabelecimentoSelecionado, establishmentPermissions.isRestrictedToSingleEstablishment, establishmentPermissions.getDefaultEstablishmentId, eventos.length]);

  // Recarregar eventos quando o estabelecimento selecionado mudar
  // Não recarregar tudo, apenas garantir que os eventos sejam filtrados corretamente
  // Os eventos já foram carregados em carregarTudo(), só precisam ser filtrados

  // Seleção robusta: por id OU por nome normalizado (cobre casos com id_place incorreto/NULL)
  const selectedEstablishmentName = estabelecimentoSelecionado
    ? (estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome || '')
    : '';
  
  const eventosDoEstabelecimento = eventos.filter(e => {
    if (!estabelecimentoSelecionado) {
      console.log(`🚫 [CHECKINS] Evento ${e.nome} filtrado: estabelecimento não selecionado`);
      return false;
    }
    
    // Comparação por ID (converter para número para garantir)
    const eventoId = Number(e.establishment_id);
    const selecionadoId = Number(estabelecimentoSelecionado);
    const idMatch = eventoId === selecionadoId;
    
    // Comparação por nome (apenas exata, não partial)
    const eventoNome = normalize(e.establishment_name || '');
    const selecionadoNome = normalize(selectedEstablishmentName || '');
    const nameMatch = eventoNome === selecionadoNome && eventoNome !== '';
    
    // Apenas incluir se ID match OU nome match exato (não partial)
    const shouldInclude = idMatch || nameMatch;
    
    if (shouldInclude) {
      console.log(`✅ [CHECKINS] Evento "${e.nome}" incluído para estabelecimento ${selecionadoId} (${selectedEstablishmentName}) - ID match: ${idMatch}, Name match: ${nameMatch}`);
      console.log(`   📍 Evento establishment_id: ${eventoId}, establishment_name: "${e.establishment_name}"`);
    } else {
      console.log(`🚫 [CHECKINS] Evento "${e.nome}" filtrado:`);
      console.log(`   📍 Evento - ID: ${eventoId}, nome: "${e.establishment_name}"`);
      console.log(`   📍 Selecionado - ID: ${selecionadoId}, nome: "${selectedEstablishmentName}"`);
    }
    
    return shouldInclude;
  });
  
  console.log(`📊 [CHECKINS] Estatísticas Finais:`);
  console.log(`   - Total de eventos carregados da API: ${eventos.length}`);
  console.log(`   - Estabelecimento selecionado: ID ${estabelecimentoSelecionado} (${selectedEstablishmentName})`);
  console.log(`   - Estabelecimentos disponíveis:`, estabelecimentos.map(e => ({ id: e.id, nome: e.nome })));
  console.log(`   - Eventos filtrados para este estabelecimento: ${eventosDoEstabelecimento.length}`);
  if (eventosDoEstabelecimento.length > 0) {
    console.log(`   ✅ Eventos encontrados:`, eventosDoEstabelecimento.map(e => ({
      nome: e.nome,
      establishment_id: e.establishment_id,
      establishment_name: e.establishment_name
    })));
  } else if (estabelecimentoSelecionado) {
    console.warn(`   ⚠️ NENHUM evento encontrado para o estabelecimento ID ${estabelecimentoSelecionado} (${selectedEstablishmentName})`);
    console.log(`   📋 Verificando todos os eventos carregados:`, eventos.map(e => ({
      nome: e.nome,
      establishment_id: e.establishment_id,
      establishment_name: e.establishment_name
    })));
  }

  const gruposPorDia = (() => {
    const grupos: { [chave: string]: EventoLista[] } = {};
    for (const ev of eventosDoEstabelecimento) {
      const chave = ev.tipo_evento === 'unico'
        ? new Date(`${ev.data_evento as string}T12:00:00`).toLocaleDateString('pt-BR')
        : `Semanal - ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][Number(ev.dia_da_semana ?? 0)]}`;
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(ev);
    }
    // ordenar itens de cada grupo por data/dia
    Object.keys(grupos).forEach(k => {
      grupos[k].sort((a, b) => {
        if (a.tipo_evento === 'unico' && b.tipo_evento === 'unico') {
          return new Date(`${a.data_evento as string}T12:00:00`).getTime() - new Date(`${b.data_evento as string}T12:00:00`).getTime();
        }
        return (Number(a.dia_da_semana ?? 0)) - (Number(b.dia_da_semana ?? 0));
      });
    });
    return grupos;
  })();

  return (
    <WithPermission allowedRoles={["admin", "gerente", "hostess", "promoter", "recepção"]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <MdArrowBack size={24} />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <MdCheckCircle size={36} />
                  Check-ins por Estabelecimento
                </h1>
                <p className="mt-2 text-blue-100">Selecione um estabelecimento e escolha o evento</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro de Estabelecimento */}
        <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Ocultar o seletor se houver apenas um estabelecimento ou se estiver restrito */}
              {(establishmentPermissions.isRestrictedToSingleEstablishment() || estabelecimentos.length === 1) && estabelecimentos.length > 0 ? (
                <div className="w-full md:w-1/2">
                  <label className="block text-sm text-gray-300 mb-2">Estabelecimento</label>
                  <div className="w-full bg-white/10 border border-white/20 rounded-lg text-white px-3 py-3">
                    <span className="font-semibold">
                      {estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome || estabelecimentos[0]?.nome || 'Carregando...'}
                    </span>
                  </div>
                </div>
              ) : estabelecimentos.length > 1 ? (
                <div className="w-full md:w-1/2">
                  <label className="block text-sm text-gray-300 mb-2">Estabelecimento</label>
                  <select
                    className="w-full bg-white/10 border border-white/20 rounded-lg text-white px-3 py-3"
                    value={estabelecimentoSelecionado ?? ''}
                    onChange={(e) => setEstabelecimentoSelecionado(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="" className="text-black">Selecione...</option>
                    {estabelecimentos.map(est => (
                      <option key={est.id} value={est.id} className="text-black">{est.nome}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => router.push('/admin/checkins/tablet')}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold text-sm sm:text-base"
                >
                  <MdTableBar size={20} />
                  <span className="hidden sm:inline">Modo Tablet</span>
                  <span className="sm:hidden">Tablet</span>
                </button>
                <button
                  onClick={carregarTudo}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold text-sm sm:text-base"
                >
                  <MdRefresh className={loading ? 'animate-spin' : ''} size={20} />
                  Atualizar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de eventos por dia */}
        <div className="max-w-7xl mx-auto p-4">
          {loading && (
            <div className="text-center py-12">
              <MdRefresh className="animate-spin inline-block text-blue-600" size={48} />
              <p className="mt-4 text-gray-300">Carregando dados...</p>
            </div>
          )}

          {!loading && estabelecimentoSelecionado === null && (
            <div className="text-center py-12">
              <MdSearch size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400 text-lg">Selecione um estabelecimento para ver os eventos</p>
            </div>
          )}

          {!loading && estabelecimentoSelecionado !== null && Object.keys(gruposPorDia).length === 0 && (
            <div className="text-center py-12 text-gray-400">Nenhum evento encontrado para o estabelecimento selecionado.</div>
          )}

          {!loading && estabelecimentoSelecionado !== null && Object.keys(gruposPorDia).length > 0 && (
            <div className="space-y-8">
              {Object.entries(gruposPorDia).map(([dia, lista]) => (
                <div key={dia}>
                  <h2 className="text-white text-xl font-semibold mb-3">{dia}</h2>
                  <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/10">
                    {lista.map(ev => (
                      <button
                        key={ev.evento_id}
                        onClick={() => router.push(`/admin/eventos/${ev.evento_id}/check-ins`)}
                        className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-white font-medium">{ev.nome}</div>
                          <div className="text-sm text-gray-400">
                            {ev.tipo_evento === 'unico' 
                              ? `${new Date(`${ev.data_evento as string}T12:00:00`).toLocaleDateString('pt-BR')} ${ev.horario_funcionamento ? `• ${ev.horario_funcionamento}` : ''}`
                              : 'Evento semanal'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WithPermission>
  );
}










