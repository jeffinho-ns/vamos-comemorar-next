"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MdSearch, MdPerson, MdTableBar, MdCardGiftcard, MdCheckCircle, MdPending, MdStore, MdEvent, MdCake, MdGroups } from 'react-icons/md';
import { WithPermission } from '../../../components/WithPermission/WithPermission';
import { useEstablishmentPermissions } from '@/app/hooks/useEstablishmentPermissions';
import EntradaStatusModal, { EntradaTipo } from '../../../components/EntradaStatusModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.agilizaiapp.com.br';

interface SearchResult {
  type: 'guest' | 'owner' | 'promoter' | 'promoter_guest';
  name: string;
  id?: number;
  guestId?: number;
  guestListId?: number;
  reservationId?: number;
  promoterId?: number;
  checkedIn?: boolean;
  ownerName?: string; // Nome do dono da reserva (para convidados)
  reservation?: {
    id: number;
    date: string;
    time: string;
    table?: string;
    area?: string;
    totalGuests: number;
    checkedInGuests: number;
    eventType?: string; // aniversario, despedida, etc
  };
  giftInfo?: {
    remainingCheckins: number;
    giftDescription?: string;
    hasGift: boolean;
  };
  promoterInfo?: {
    id: number;
    name: string;
    totalCheckins: number;
  };
}

interface LoadedData {
  guestLists: any[];
  guests: { [guestListId: number]: any[] };
  reservations: any[];
  promoters: any[];
  promoterGuests: { [promoterId: number]: any[] };
  gifts: { [guestListId: number]: any };
}

export default function TabletCheckInsPage() {
  const establishmentPermissions = useEstablishmentPermissions();
  
  const [estabelecimentos, setEstabelecimentos] = useState<{ id: number; nome: string }[]>([]);
  const [eventos, setEventos] = useState<{ evento_id: number; nome: string; data_evento?: string; establishment_id: number; establishment_name?: string }[]>([]);
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<number | null>(null);
  const [eventoSelecionado, setEventoSelecionado] = useState<number | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedData, setLoadedData] = useState<LoadedData>({
    guestLists: [],
    guests: {},
    reservations: [],
    promoters: [],
    promoterGuests: {},
    gifts: {}
  });

  // Estados para modal de check-in
  const [entradaModalOpen, setEntradaModalOpen] = useState(false);
  const [convidadoParaCheckIn, setConvidadoParaCheckIn] = useState<{ tipo: 'guest' | 'owner' | 'promoter_guest'; id?: number; guestId?: number; guestListId?: number; reservationId?: number; nome: string } | null>(null);

  // Flag para evitar múltiplas requisições simultâneas
  const loadingEstabelecimentosRef = useRef(false);
  const estabelecimentosLoadedRef = useRef(false);

  // Carregar estabelecimentos e eventos (apenas uma vez)
  useEffect(() => {
    // Aguardar o hook carregar as permissões antes de carregar estabelecimentos
    if (establishmentPermissions.isLoading) return;
    
    // Evitar carregar múltiplas vezes
    if (loadingEstabelecimentosRef.current || estabelecimentosLoadedRef.current) return;

    const carregarEstabelecimentos = async () => {
      loadingEstabelecimentosRef.current = true;
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Buscar eventos com tratamento de erro
        try {
          const evRes = await fetch(`${API_URL}/api/v1/eventos`, { headers });
          if (evRes.ok) {
            const evData = await evRes.json();
            const listaEventos = (evData.eventos || []).map((e: any) => ({
              evento_id: e.evento_id,
              nome: e.nome,
              data_evento: e.data_evento,
              establishment_id: e.establishment_id || e.id_place,
              establishment_name: e.establishment_name || e.casa_do_evento || ''
            }));
            setEventos(listaEventos);
          } else {
            console.error('Erro ao buscar eventos:', evRes.status, evRes.statusText);
          }
        } catch (evErr) {
          console.error('Erro na requisição de eventos:', evErr);
        }

        // Buscar estabelecimentos com tratamento de erro individual
        let bars: any[] = [];
        let places: any[] = [];

        try {
          const barsRes = await fetch(`${API_URL}/api/bars`, { headers });
          if (barsRes.ok) {
            const barsData = await barsRes.json();
            if (Array.isArray(barsData)) bars = barsData;
          } else {
            console.error('Erro ao buscar bars:', barsRes.status, barsRes.statusText);
          }
        } catch (barsErr) {
          console.error('Erro na requisição de bars:', barsErr);
        }

        try {
          const placesRes = await fetch(`${API_URL}/api/places`, { headers });
          if (placesRes.ok) {
            const placesData = await placesRes.json();
            if (Array.isArray(placesData)) places = placesData;
            else if (placesData?.data && Array.isArray(placesData.data)) places = placesData.data;
          } else {
            console.error('Erro ao buscar places:', placesRes.status, placesRes.statusText);
          }
        } catch (placesErr) {
          console.error('Erro na requisição de places:', placesErr);
        }

        // Normalizar nomes para evitar duplicatas (mesmo padrão da página normal)
        const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, '');
        
        const merged = new Map<string, { id: number; nome: string }>();
        const addItem = (id: number, nome: string, source: string) => {
          const key = normalize(nome);
          if (!key) return;
          // Usar sempre o ID original do estabelecimento
          const finalId = id;
          if (!merged.has(key)) {
            merged.set(key, { id: Number(finalId), nome: nome.replace(/Jutino/gi, 'Justino') });
            console.log(`📍 [TABLET] Adicionando: ${nome} (ID: ${finalId}, source: ${source})`);
          }
        };

        bars.forEach(b => addItem(Number(b.id), b.name, 'bars'));
        places.forEach(p => addItem(Number(p.id), p.name, 'places'));

        const lista = Array.from(merged.values()).sort((a, b) => a.nome.localeCompare(b.nome));
        
        console.log(`📋 [TABLET] Total de estabelecimentos antes do filtro: ${lista.length}`, 
          lista.map(e => ({ id: e.id, nome: e.nome }))
        );
        
        const filteredLista = establishmentPermissions.getFilteredEstablishments(lista);
        
        console.log(`📋 [TABLET] Total de estabelecimentos após filtro: ${filteredLista.length}`, 
          filteredLista.map(e => ({ id: e.id, nome: e.nome }))
        );
        
        setEstabelecimentos(filteredLista);
        estabelecimentosLoadedRef.current = true;

        // Auto-selecionar se restrito a um estabelecimento
        if (establishmentPermissions.isRestrictedToSingleEstablishment() && filteredLista.length > 0) {
          const defaultId = establishmentPermissions.getDefaultEstablishmentId();
          if (defaultId && !estabelecimentoSelecionado) {
            setEstabelecimentoSelecionado(defaultId);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar estabelecimentos:', err);
        estabelecimentosLoadedRef.current = true; // Marcar como carregado mesmo com erro para evitar loop
      } finally {
        loadingEstabelecimentosRef.current = false;
      }
    };

    carregarEstabelecimentos();
  }, [establishmentPermissions.isLoading, establishmentPermissions]);

  // Carregar todos os dados quando estabelecimento e evento forem selecionados
  useEffect(() => {
    if (!estabelecimentoSelecionado || !eventoSelecionado) {
      setLoadedData({
        guestLists: [],
        guests: {},
        reservations: [],
        promoters: [],
        promoterGuests: {},
        gifts: {}
      });
      return;
    }

    const carregarTodosDados = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Buscar check-ins consolidados do evento
        const checkinsRes = await fetch(`${API_URL}/api/v1/eventos/${eventoSelecionado}/checkins`, { headers });
        if (!checkinsRes.ok) {
          const errorText = await checkinsRes.text();
          console.error('Erro na resposta da API:', checkinsRes.status, errorText);
          throw new Error(`Erro ao carregar dados: ${checkinsRes.status}`);
        }

        const checkinsData = await checkinsRes.json();
        
        // A estrutura da resposta vem em checkinsData.dados
        const dados = checkinsData.dados || checkinsData;
        const guestLists = dados.guestListsRestaurante || dados.restaurant_guest_lists || [];
        const guests: { [key: number]: any[] } = {};
        const gifts: { [key: number]: any } = {};

        // Carregar guests e gifts de cada guest list
        for (const gl of guestLists) {
          try {
            const guestListId = gl.guest_list_id || gl.id;
            if (!guestListId) continue;

            // Carregar guests
            const guestsRes = await fetch(`${API_URL}/api/admin/guest-lists/${guestListId}/guests`, { headers });
            if (guestsRes.ok) {
              const guestsData = await guestsRes.json();
              guests[guestListId] = guestsData.guests || [];
            }

            // Carregar gifts
            const giftRes = await fetch(`${API_URL}/api/gift-rules/guest-list/${guestListId}/gifts`, { headers });
            if (giftRes.ok) {
              const giftData = await giftRes.json();
              gifts[guestListId] = giftData;
            }
          } catch (e) {
            console.error(`Erro ao carregar dados da guest list ${gl.guest_list_id || gl.id}:`, e);
          }
        }

        // Carregar promoters e seus convidados
        const promoters = dados.promoters || [];
        const promoterGuests: { [key: number]: any[] } = {};

        // Os convidados dos promoters já vêm em dados.convidadosPromoters
        const convidadosPromoters = dados.convidadosPromoters || [];
        console.log('Convidados de promoters carregados:', convidadosPromoters.length);
        console.log('Primeiros convidados:', convidadosPromoters.slice(0, 3));
        
        for (const promoter of promoters) {
          const promoterId = promoter.id || promoter.promoter_id;
          // Filtrar convidados deste promoter - verificar múltiplos campos
          promoterGuests[promoterId] = convidadosPromoters.filter((c: any) => {
            const cPromoterId = c.promoter_id || c.promoter_responsavel_id;
            return Number(cPromoterId) === Number(promoterId);
          });
          if (promoterGuests[promoterId].length > 0) {
            console.log(`Promoter ${promoterId} (${promoter.nome}): ${promoterGuests[promoterId].length} convidados`);
          }
        }
        
        // Também armazenar todos os convidados sem agrupar por promoter (para busca direta)
        console.log('Total de convidados de promoters:', convidadosPromoters.length);

        setLoadedData({
          guestLists,
          guests,
          reservations: dados.reservasRestaurante || dados.restaurant_reservations || [],
          promoters,
          promoterGuests,
          gifts
        });
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados. Tente novamente.');
      } finally {
        setLoadingData(false);
      }
    };

    carregarTodosDados();
  }, [estabelecimentoSelecionado, eventoSelecionado]);

  // Normalizador de nomes para comparação
  const normalize = useMemo(() => (name: string): string => {
    if (!name) return '';
    return name
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Filtrar eventos do estabelecimento selecionado (usando useMemo para evitar recálculos)
  const selectedEstablishmentName = useMemo(() => 
    estabelecimentoSelecionado
      ? (estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome || '')
      : ''
  , [estabelecimentoSelecionado, estabelecimentos]);

  const eventosDoEstabelecimento = useMemo(() => eventos.filter(e => {
    if (!estabelecimentoSelecionado) return false;
    const idMatch = Number(e.establishment_id) === Number(estabelecimentoSelecionado);
    const nameMatch = e.establishment_name && normalize(e.establishment_name) === normalize(selectedEstablishmentName);
    return idMatch || nameMatch;
  }), [eventos, estabelecimentoSelecionado, selectedEstablishmentName, normalize]);

  // Busca instantânea nos dados já carregados
  const handleSearch = useCallback((term: string) => {
    if (!term || term.trim().length < 2) {
      setResults([]);
      return;
    }

    const searchLower = term.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Buscar em guest lists (owners)
    for (const gl of loadedData.guestLists) {
      const guestListId = gl.guest_list_id || gl.id;
      const ownerName = gl.owner_name?.toLowerCase() || '';
      if (ownerName.includes(searchLower)) {
        const giftData = loadedData.gifts[guestListId];
        let giftInfo: { remainingCheckins: number; hasGift: boolean; giftDescription?: string } = { remainingCheckins: 0, hasGift: false };
        
        if (giftData?.rules?.[0]) {
          const activeRule = giftData.rules[0];
          const checkedIn = gl.guests_checked_in || 0;
          const needed = activeRule.checkins_necessarios || 0;
          giftInfo = {
            remainingCheckins: Math.max(0, needed - checkedIn),
            giftDescription: activeRule.descricao,
            hasGift: checkedIn >= needed,
          };
        }

        results.push({
          type: 'owner',
          name: gl.owner_name,
          reservationId: gl.reservation_id,
          guestListId: guestListId,
          checkedIn: gl.owner_checked_in === 1 || gl.owner_checked_in === true,
          reservation: {
            id: gl.reservation_id,
            date: gl.reservation_date,
            time: gl.reservation_time,
            table: gl.table_number?.toString(),
            area: gl.area_name,
            totalGuests: gl.total_guests || 0,
            checkedInGuests: gl.guests_checked_in || 0,
            eventType: gl.event_type || 'outros'
          },
          giftInfo,
        });
      }

      // Buscar guests desta lista
      const guests = loadedData.guests[guestListId] || [];
      for (const guest of guests) {
        const guestName = guest.name?.toLowerCase() || '';
        if (guestName.includes(searchLower)) {
          results.push({
            type: 'guest',
            name: guest.name,
            id: guest.id,
            guestId: guest.id,
            guestListId: guestListId,
            reservationId: gl.reservation_id,
            ownerName: gl.owner_name, // Nome do dono da reserva
            checkedIn: guest.checked_in === true || guest.checked_in === 1,
            reservation: {
              id: gl.reservation_id,
              date: gl.reservation_date,
              time: gl.reservation_time,
              table: gl.table_number?.toString(),
              area: gl.area_name,
              totalGuests: gl.total_guests || 0,
              checkedInGuests: gl.guests_checked_in || 0,
              eventType: gl.event_type || 'outros'
            },
            giftInfo: { remainingCheckins: 0, hasGift: false },
          });
        }
      }
    }

    // Buscar em promoters
    for (const promoter of loadedData.promoters) {
      const promoterId = promoter.id || promoter.promoter_id;
      const promoterName = promoter.nome?.toLowerCase() || '';
      if (promoterName.includes(searchLower)) {
        results.push({
          type: 'promoter',
          name: promoter.nome,
          promoterId: promoterId,
          promoterInfo: {
            id: promoterId,
            name: promoter.nome,
            totalCheckins: promoter.convidados_checkin || 0,
          },
        });
      }
    }

    // Buscar convidados de promoters - buscar em todos os convidados primeiro
    // Depois agrupar por promoter para mostrar informações corretas
    const allPromoterGuests: any[] = [];
    for (const promoterId in loadedData.promoterGuests) {
      allPromoterGuests.push(...loadedData.promoterGuests[promoterId]);
    }
    
    for (const guest of allPromoterGuests) {
      // O campo pode ser 'nome' ou 'nome_convidado'
      const guestName = (guest.nome || guest.nome_convidado || '').toLowerCase();
      if (guestName.includes(searchLower)) {
        const guestPromoterId = guest.promoter_id || guest.promoter_responsavel_id;
        // Encontrar o promoter correspondente
        const promoter = loadedData.promoters.find((p: any) => 
          (p.id || p.promoter_id) === Number(guestPromoterId)
        );
        
        // Buscar o nome do promoter de forma mais robusta
        let promoterName = 'Promoter não identificado';
        if (promoter) {
          promoterName = promoter.nome || promoter.name || 'Promoter não identificado';
        } else {
          // Tentar buscar o promoter novamente com diferentes campos
          const altPromoter = loadedData.promoters.find((p: any) => 
            Number(p.id) === Number(guestPromoterId) || 
            Number(p.promoter_id) === Number(guestPromoterId) ||
            String(p.id) === String(guestPromoterId) ||
            String(p.promoter_id) === String(guestPromoterId)
          );
          if (altPromoter) {
            promoterName = altPromoter.nome || altPromoter.name || 'Promoter não identificado';
          }
        }
        
        results.push({
          type: 'promoter_guest',
          name: guest.nome || guest.nome_convidado,
          id: guest.lista_convidado_id || guest.id,
          promoterId: Number(guestPromoterId),
          checkedIn: guest.status_checkin === 'Check-in' || guest.status_checkin === 'Check-in',
          promoterInfo: {
            id: Number(guestPromoterId),
            name: promoterName,
            totalCheckins: promoter?.convidados_checkin || 0,
          },
        });
      }
    }

    setResults(results);
  }, [loadedData]);

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    handleSearch(value);
  };

  // Abrir modal de check-in
  const handleCheckInClick = (result: SearchResult) => {
    if (result.type === 'guest' && result.guestId) {
      setConvidadoParaCheckIn({
        tipo: 'guest',
        guestId: result.guestId,
        guestListId: result.guestListId,
        nome: result.name
      });
    } else if (result.type === 'owner' && result.guestListId) {
      setConvidadoParaCheckIn({
        tipo: 'owner',
        guestListId: result.guestListId,
        reservationId: result.reservationId,
        nome: result.name
      });
    } else if (result.type === 'promoter_guest' && result.id) {
      setConvidadoParaCheckIn({
        tipo: 'promoter_guest',
        id: result.id,
        nome: result.name
      });
    }
    setEntradaModalOpen(true);
  };

  // Função que realmente faz o check-in após seleção do status
  const handleConfirmarCheckIn = async (tipo: EntradaTipo, valor: number) => {
    if (!convidadoParaCheckIn) return;

    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let response;

      if (convidadoParaCheckIn.tipo === 'guest' && convidadoParaCheckIn.guestId) {
        // Check-in de convidado de guest list
        response = await fetch(`${API_URL}/api/admin/guests/${convidadoParaCheckIn.guestId}/checkin`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            entrada_tipo: tipo,
            entrada_valor: valor
          })
        });
      } else if (convidadoParaCheckIn.tipo === 'owner' && convidadoParaCheckIn.guestListId) {
        // Check-in do dono da lista
        response = await fetch(`${API_URL}/api/restaurant-reservations/${convidadoParaCheckIn.reservationId}/checkin-owner`, {
          method: 'POST',
          headers
        });
      } else if (convidadoParaCheckIn.tipo === 'promoter_guest' && convidadoParaCheckIn.id && eventoSelecionado) {
        // Check-in de convidado de promoter
        response = await fetch(`${API_URL}/api/v1/eventos/checkin/${convidadoParaCheckIn.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            status_checkin: 'Check-in',
            entrada_tipo: tipo,
            entrada_valor: valor
          })
        });
      } else {
        alert('Tipo de check-in não suportado');
        return;
      }

      if (response?.ok) {
        const tipoTexto = tipo === 'VIP' ? 'VIP (grátis)' : tipo === 'SECO' ? `SECO (R$ ${valor.toFixed(2)})` : `CONSUMA (R$ ${valor.toFixed(2)})`;
        
        // Atualizar dados locais
        if (convidadoParaCheckIn.tipo === 'guest' && convidadoParaCheckIn.guestId && convidadoParaCheckIn.guestListId) {
          setLoadedData(prev => ({
            ...prev,
            guests: {
              ...prev.guests,
              [convidadoParaCheckIn.guestListId!]: (prev.guests[convidadoParaCheckIn.guestListId!] || []).map(g =>
                g.id === convidadoParaCheckIn.guestId ? { ...g, checked_in: true, checkin_time: new Date().toISOString(), entrada_tipo: tipo, entrada_valor: valor } : g
              )
            }
          }));
        } else if (convidadoParaCheckIn.tipo === 'owner' && convidadoParaCheckIn.guestListId) {
          setLoadedData(prev => ({
            ...prev,
            guestLists: prev.guestLists.map(gl =>
              (gl.guest_list_id || gl.id) === convidadoParaCheckIn.guestListId
                ? { ...gl, owner_checked_in: 1, owner_checkin_time: new Date().toISOString() }
                : gl
            )
          }));
        } else if (convidadoParaCheckIn.tipo === 'promoter_guest' && convidadoParaCheckIn.id) {
          // Atualizar promoter guests seria mais complexo, mas podemos recarregar
        }

        // Atualizar resultados
        setResults(prev => prev.map(r => {
          if (r.type === 'guest' && r.guestId === convidadoParaCheckIn.guestId) {
            return { ...r, checkedIn: true };
          } else if (r.type === 'owner' && r.guestListId === convidadoParaCheckIn.guestListId) {
            return { ...r, checkedIn: true };
          } else if (r.type === 'promoter_guest' && r.id === convidadoParaCheckIn.id) {
            return { ...r, checkedIn: true };
          }
          return r;
        }));

        alert(`✅ Check-in de ${convidadoParaCheckIn.nome} confirmado!\nStatus: ${tipoTexto}`);
        setEntradaModalOpen(false);
        setConvidadoParaCheckIn(null);
      } else {
        const errorData = await response?.json();
        alert('❌ Erro ao fazer check-in: ' + (errorData?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro no check-in:', error);
      alert('❌ Erro ao fazer check-in');
    }
  };

  const getEventTypeLabel = (eventType?: string) => {
    if (!eventType) return null;
    const types: { [key: string]: { label: string; icon: any; color: string } } = {
      'aniversario': { label: 'Aniversário', icon: MdCake, color: 'text-pink-600' },
      'despedida': { label: 'Despedida', icon: MdGroups, color: 'text-purple-600' },
      'lista_sexta': { label: 'Lista Sexta', icon: MdEvent, color: 'text-blue-600' }
    };
    return types[eventType.toLowerCase()] || null;
  };

  return (
    <WithPermission allowedRoles={["admin", "gerente", "hostess", "promoter", "recepção"]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-1 sm:px-4 py-2 sm:py-4">
        <div className="max-w-5xl mx-auto w-full">
          {/* Seletores */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MdStore className="text-blue-400" size={24} />
              <h2 className="text-base sm:text-lg font-semibold text-white">Selecione o Estabelecimento</h2>
            </div>
            <select
              value={estabelecimentoSelecionado || ''}
              onChange={(e) => {
                setEstabelecimentoSelecionado(Number(e.target.value) || null);
                setEventoSelecionado(null);
                setSearchTerm('');
                setResults([]);
              }}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg text-white transition-all"
            >
              <option value="" className="text-gray-900">Selecione um estabelecimento</option>
              {estabelecimentos.map(est => (
                <option key={est.id} value={est.id} className="text-gray-900">{est.nome}</option>
              ))}
            </select>

            {estabelecimentoSelecionado && (
              <>
                <div className="flex items-center gap-2 mt-4 mb-4">
                  <MdEvent className="text-blue-400" size={24} />
                  <h2 className="text-base sm:text-lg font-semibold text-white">Selecione o Evento</h2>
                </div>
                {eventosDoEstabelecimento.length === 0 ? (
                  <div className="p-4 bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg">
                    <p className="text-yellow-200">
                      Nenhum evento encontrado para este estabelecimento.
                    </p>
                  </div>
                ) : (
                  <select
                    value={eventoSelecionado || ''}
                    onChange={(e) => {
                      setEventoSelecionado(Number(e.target.value) || null);
                      setSearchTerm('');
                      setResults([]);
                    }}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg text-white transition-all"
                    disabled={!estabelecimentoSelecionado}
                  >
                    <option value="" className="text-gray-900">Selecione um evento</option>
                    {eventosDoEstabelecimento.map(ev => (
                      <option key={ev.evento_id} value={ev.evento_id} className="text-gray-900">
                        {ev.nome} {ev.data_evento ? `- ${new Date(ev.data_evento + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}

            {loadingData && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                <p className="mt-2 text-gray-300 font-medium">Carregando dados...</p>
              </div>
            )}
          </div>

          {/* Barra de busca - só aparece quando dados estão carregados */}
          {estabelecimentoSelecionado && eventoSelecionado && !loadingData && (
            <>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <MdSearch className="text-gray-400 flex-shrink-0" size={24} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Digite o nome do convidado, dono da reserva, promoter ou convidado do promoter..."
                    className="flex-1 text-base sm:text-lg px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="bg-red-900/30 border-2 border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Resultados */}
              {results.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  {results.map((result, index) => {
                    const eventTypeInfo = getEventTypeLabel(result.reservation?.eventType);
                    const isOwner = result.type === 'owner';
                    
                    return (
                      <div
                        key={index}
                        className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 transition-all hover:shadow-xl ${
                          result.checkedIn 
                            ? 'border-l-green-500 bg-green-900/20' 
                            : isOwner 
                              ? 'border-l-purple-500 bg-purple-900/20' 
                              : 'border-l-blue-500'
                        }`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className={`p-2 sm:p-4 rounded-full flex-shrink-0 ${
                            result.checkedIn 
                              ? 'bg-green-500/20' 
                              : isOwner 
                                ? 'bg-purple-500/20' 
                                : 'bg-blue-500/20'
                          }`}>
                            {result.type === 'promoter' || result.type === 'promoter_guest' ? (
                              <MdEvent className={result.checkedIn ? 'text-green-400' : 'text-blue-400'} size={24} />
                            ) : (
                              <MdPerson className={result.checkedIn ? 'text-green-400' : isOwner ? 'text-purple-400' : 'text-blue-400'} size={24} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                  <h3 className={`text-xl sm:text-2xl font-bold truncate ${
                                    isOwner ? 'text-purple-300' : 'text-white'
                                  }`}>
                                    {result.name}
                                  </h3>
                                  {isOwner && (
                                    <span className="px-2 sm:px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1 flex-shrink-0">
                                      <MdPerson size={14} />
                                      DONO DA RESERVA
                                    </span>
                                  )}
                                  {eventTypeInfo && (
                                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1 ${eventTypeInfo.color} bg-opacity-20 flex-shrink-0`}>
                                      <eventTypeInfo.icon size={14} />
                                      {eventTypeInfo.label}
                                    </span>
                                  )}
                                </div>
                                
                                {result.type === 'guest' && result.ownerName && (
                                  <p className="text-gray-300 mb-2 text-sm sm:text-base">
                                    <strong className="text-gray-200">Convidado de:</strong> {result.ownerName}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex-shrink-0">
                                {!result.checkedIn && (result.type === 'guest' || result.type === 'owner' || result.type === 'promoter_guest') && (
                                  <button
                                    onClick={() => handleCheckInClick(result)}
                                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg font-semibold text-sm sm:text-base"
                                  >
                                    <MdCheckCircle size={18} />
                                    Check-in
                                  </button>
                                )}
                                {result.checkedIn && (
                                  <span className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-green-500/20 text-green-300 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm sm:text-base">
                                    <MdCheckCircle size={18} />
                                    Check-in realizado
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {result.type === 'guest' && (
                              <div className="space-y-2 text-gray-300 bg-white/5 p-3 sm:p-4 rounded-lg">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs sm:text-sm text-gray-400">Data da Reserva</p>
                                    <p className="font-semibold text-sm sm:text-base text-white">
                                      {(() => {
                                        const dateStr = result.reservation?.date;
                                        if (!dateStr) return 'Data não informada';
                                        try {
                                          const datePart = dateStr.split('T')[0] || dateStr.split(' ')[0];
                                          if (datePart && datePart.length === 10) {
                                            const d = new Date(`${datePart}T12:00:00`);
                                            if (isNaN(d.getTime())) {
                                              return 'Data inválida';
                                            }
                                            return d.toLocaleDateString('pt-BR');
                                          }
                                          const d2 = new Date(dateStr);
                                          if (isNaN(d2.getTime())) {
                                            return 'Data inválida';
                                          }
                                          return d2.toLocaleDateString('pt-BR');
                                        } catch {
                                          return 'Data inválida';
                                        }
                                      })()} às {result.reservation?.time}
                                    </p>
                                  </div>
                                  {result.reservation?.table && (
                                    <div>
                                      <p className="text-xs sm:text-sm text-gray-400">Mesa</p>
                                      <p className="font-semibold flex items-center gap-1 text-sm sm:text-base text-amber-300 bg-amber-500/20 px-2 py-1 rounded-md">
                                        <MdTableBar size={16} className="text-amber-400" />
                                        <span className="font-bold">{result.reservation.table}</span> {result.reservation.area && <span className="text-amber-200">({result.reservation.area})</span>}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-400">Lista de Reserva</p>
                                  <p className="font-semibold text-sm sm:text-base">ID: {result.reservation?.id}</p>
                                </div>
                              </div>
                            )}

                            {result.type === 'owner' && (
                              <div className="space-y-3">
                                <div className="bg-white/5 p-3 sm:p-4 rounded-lg space-y-2">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs sm:text-sm text-gray-400">Data da Reserva</p>
                                      <p className="font-semibold text-sm sm:text-base text-white">
                                        {(() => {
                                          const dateStr = result.reservation?.date;
                                          if (!dateStr) return 'Data não informada';
                                          try {
                                            const datePart = dateStr.split('T')[0] || dateStr.split(' ')[0];
                                            if (datePart && datePart.length === 10) {
                                              const d = new Date(`${datePart}T12:00:00`);
                                              if (isNaN(d.getTime())) {
                                                return 'Data inválida';
                                              }
                                              return d.toLocaleDateString('pt-BR');
                                            }
                                            const d2 = new Date(dateStr);
                                            if (isNaN(d2.getTime())) {
                                              return 'Data inválida';
                                            }
                                            return d2.toLocaleDateString('pt-BR');
                                          } catch {
                                            return 'Data inválida';
                                          }
                                        })()} às {result.reservation?.time}
                                      </p>
                                    </div>
                                    {result.reservation?.table && (
                                      <div>
                                        <p className="text-xs sm:text-sm text-gray-400">Mesa</p>
                                        <p className="font-semibold flex items-center gap-1 text-sm sm:text-base text-amber-300 bg-amber-500/20 px-2 py-1 rounded-md">
                                          <MdTableBar size={16} className="text-amber-400" />
                                          <span className="font-bold">{result.reservation.table}</span> {result.reservation.area && <span className="text-amber-200">({result.reservation.area})</span>}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs sm:text-sm text-gray-400">Total de Convidados</p>
                                      <p className="font-semibold text-sm sm:text-base">{result.reservation?.totalGuests}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs sm:text-sm text-gray-400">Check-ins Realizados</p>
                                      <p className="font-semibold text-green-400 text-sm sm:text-base">{result.reservation?.checkedInGuests}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {result.giftInfo?.hasGift ? (
                                  <div className="p-3 sm:p-4 bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border-2 border-yellow-500/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MdCardGiftcard className="text-yellow-400" size={20} />
                                      <strong className="text-yellow-200 text-base sm:text-lg">🎁 Brinde Disponível!</strong>
                                    </div>
                                    <p className="text-yellow-200 font-semibold mb-1 text-sm sm:text-base">
                                      {result.giftInfo.giftDescription}
                                    </p>
                                  </div>
                                ) : result.giftInfo && result.giftInfo.remainingCheckins > 0 ? (
                                  <div className="p-3 sm:p-4 bg-blue-900/30 border-2 border-blue-500/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MdPending className="text-blue-400" size={20} />
                                      <strong className="text-blue-200 text-sm sm:text-base">Check-ins para Brinde</strong>
                                    </div>
                                    <p className="text-blue-200 font-semibold text-sm sm:text-base">
                                      Faltam <span className="text-xl sm:text-2xl text-blue-400">{result.giftInfo.remainingCheckins}</span> check-in(s) para ganhar o brinde
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            )}

                            {result.type === 'promoter' && (
                              <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                                <p className="text-gray-300 text-sm sm:text-base">
                                  <strong>Total de check-ins:</strong> <span className="text-green-400 font-semibold">{result.promoterInfo?.totalCheckins}</span>
                                </p>
                              </div>
                            )}

                            {result.type === 'promoter_guest' && (
                              <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                                <p className="text-gray-300 text-sm sm:text-base">
                                  <strong>Promoter:</strong> <span className="text-purple-300 font-semibold">{result.promoterInfo?.name || 'Promoter não identificado'}</span>
                                </p>
                                <p className="text-gray-300 mt-1 text-sm sm:text-base">
                                  <strong>Total de check-ins do promoter:</strong> <span className="text-green-400 font-semibold">{result.promoterInfo?.totalCheckins || 0}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {searchTerm.length >= 2 && results.length === 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6 sm:p-8 text-center text-gray-400">
                  <MdSearch size={40} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-base sm:text-lg">Nenhum resultado encontrado para "{searchTerm}"</p>
                </div>
              )}

              {searchTerm.length < 2 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-6 sm:p-8 text-center text-gray-400">
                  <MdSearch size={40} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-base sm:text-lg">Digite pelo menos 2 caracteres para buscar</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de Check-in */}
        {entradaModalOpen && convidadoParaCheckIn && (
          <EntradaStatusModal
            isOpen={entradaModalOpen}
            onClose={() => {
              setEntradaModalOpen(false);
              setConvidadoParaCheckIn(null);
            }}
            onConfirm={handleConfirmarCheckIn}
            nomeConvidado={convidadoParaCheckIn.nome}
            horaAtual={new Date()}
          />
        )}
      </div>
    </WithPermission>
  );
}
