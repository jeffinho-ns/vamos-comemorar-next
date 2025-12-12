"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
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

  // Carregar estabelecimentos e eventos (apenas uma vez)
  useEffect(() => {
    const carregarEstabelecimentos = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Buscar eventos
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
        }

        // Buscar estabelecimentos
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
        bars.forEach(b => merged.set(String(b.id), { id: Number(b.id), nome: b.name }));
        places.forEach(p => merged.set(String(p.id), { id: Number(p.id), nome: p.name }));

        const lista = Array.from(merged.values()).sort((a, b) => a.nome.localeCompare(b.nome));
        const filteredLista = establishmentPermissions.getFilteredEstablishments(lista);
        setEstabelecimentos(filteredLista);

        // Auto-selecionar se restrito a um estabelecimento
        if (establishmentPermissions.isRestrictedToSingleEstablishment() && filteredLista.length > 0) {
          const defaultId = establishmentPermissions.getDefaultEstablishmentId();
          if (defaultId) {
            setEstabelecimentoSelecionado(defaultId);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar estabelecimentos:', err);
      }
    };

    carregarEstabelecimentos();
  }, [establishmentPermissions]);

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
        
        results.push({
          type: 'promoter_guest',
          name: guest.nome || guest.nome_convidado,
          id: guest.lista_convidado_id || guest.id,
          promoterId: Number(guestPromoterId),
          checkedIn: guest.status_checkin === 'Check-in' || guest.status_checkin === 'Check-in',
          promoterInfo: {
            id: Number(guestPromoterId),
            name: promoter?.nome || 'Promoter',
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
    <WithPermission allowedRoles={["admin", "gerente", "hostess", "promoter"]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-5xl mx-auto">
          {/* Seletores */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MdStore className="text-blue-600" size={24} />
              <h2 className="text-lg font-semibold text-gray-800">Selecione o Estabelecimento</h2>
            </div>
            <select
              value={estabelecimentoSelecionado || ''}
              onChange={(e) => {
                setEstabelecimentoSelecionado(Number(e.target.value) || null);
                setEventoSelecionado(null);
                setSearchTerm('');
                setResults([]);
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all"
            >
              <option value="">Selecione um estabelecimento</option>
              {estabelecimentos.map(est => (
                <option key={est.id} value={est.id}>{est.nome}</option>
              ))}
            </select>

            {estabelecimentoSelecionado && (
              <>
                <div className="flex items-center gap-2 mt-4 mb-4">
                  <MdEvent className="text-blue-600" size={24} />
                  <h2 className="text-lg font-semibold text-gray-800">Selecione o Evento</h2>
                </div>
                {eventosDoEstabelecimento.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">
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
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all"
                    disabled={!estabelecimentoSelecionado}
                  >
                    <option value="">Selecione um evento</option>
                    {eventosDoEstabelecimento.map(ev => (
                      <option key={ev.evento_id} value={ev.evento_id}>
                        {ev.nome} {ev.data_evento ? `- ${new Date(ev.data_evento + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}

            {loadingData && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 font-medium">Carregando dados...</p>
              </div>
            )}
          </div>

          {/* Barra de busca - só aparece quando dados estão carregados */}
          {estabelecimentoSelecionado && eventoSelecionado && !loadingData && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-4">
                  <MdSearch className="text-gray-400" size={28} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Digite o nome do convidado, dono da reserva, promoter ou convidado do promoter..."
                    className="flex-1 text-lg px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Resultados */}
              {results.length > 0 && (
                <div className="space-y-4">
                  {results.map((result, index) => {
                    const eventTypeInfo = getEventTypeLabel(result.reservation?.eventType);
                    const isOwner = result.type === 'owner';
                    
                    return (
                      <div
                        key={index}
                        className={`bg-white rounded-xl shadow-lg p-6 border-l-4 transition-all hover:shadow-xl ${
                          result.checkedIn 
                            ? 'border-green-500 bg-green-50/30' 
                            : isOwner 
                              ? 'border-purple-500 bg-purple-50/30' 
                              : 'border-blue-500'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-4 rounded-full ${
                            result.checkedIn 
                              ? 'bg-green-100' 
                              : isOwner 
                                ? 'bg-purple-100' 
                                : 'bg-blue-100'
                          }`}>
                            {result.type === 'promoter' || result.type === 'promoter_guest' ? (
                              <MdEvent className={result.checkedIn ? 'text-green-600' : 'text-blue-600'} size={28} />
                            ) : (
                              <MdPerson className={result.checkedIn ? 'text-green-600' : isOwner ? 'text-purple-600' : 'text-blue-600'} size={28} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className={`text-2xl font-bold ${
                                    isOwner ? 'text-purple-800' : 'text-gray-800'
                                  }`}>
                                    {result.name}
                                  </h3>
                                  {isOwner && (
                                    <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-semibold flex items-center gap-1">
                                      <MdPerson size={16} />
                                      DONO DA RESERVA
                                    </span>
                                  )}
                                  {eventTypeInfo && (
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${eventTypeInfo.color} bg-opacity-20`}>
                                      <eventTypeInfo.icon size={16} />
                                      {eventTypeInfo.label}
                                    </span>
                                  )}
                                </div>
                                
                                {result.type === 'guest' && result.ownerName && (
                                  <p className="text-gray-600 mb-2">
                                    <strong className="text-gray-800">Convidado de:</strong> {result.ownerName}
                                  </p>
                                )}
                              </div>
                              
                              {!result.checkedIn && (result.type === 'guest' || result.type === 'owner' || result.type === 'promoter_guest') && (
                                <button
                                  onClick={() => handleCheckInClick(result)}
                                  className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-semibold"
                                >
                                  <MdCheckCircle size={20} />
                                  Check-in
                                </button>
                              )}
                              {result.checkedIn && (
                                <span className="px-5 py-2.5 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 font-semibold">
                                  <MdCheckCircle size={20} />
                                  Check-in realizado
                                </span>
                              )}
                            </div>
                            
                            {result.type === 'guest' && (
                              <div className="space-y-2 text-gray-700 bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-sm text-gray-500">Data da Reserva</p>
                                    <p className="font-semibold">{new Date(result.reservation?.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {result.reservation?.time}</p>
                                  </div>
                                  {result.reservation?.table && (
                                    <div>
                                      <p className="text-sm text-gray-500">Mesa</p>
                                      <p className="font-semibold flex items-center gap-1">
                                        <MdTableBar size={18} />
                                        {result.reservation.table} {result.reservation.area && `(${result.reservation.area})`}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Lista de Reserva</p>
                                  <p className="font-semibold">ID: {result.reservation?.id}</p>
                                </div>
                              </div>
                            )}

                            {result.type === 'owner' && (
                              <div className="space-y-3">
                                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-sm text-gray-500">Data da Reserva</p>
                                      <p className="font-semibold">{new Date(result.reservation?.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {result.reservation?.time}</p>
                                    </div>
                                    {result.reservation?.table && (
                                      <div>
                                        <p className="text-sm text-gray-500">Mesa</p>
                                        <p className="font-semibold flex items-center gap-1">
                                          <MdTableBar size={18} />
                                          {result.reservation.table} {result.reservation.area && `(${result.reservation.area})`}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-sm text-gray-500">Total de Convidados</p>
                                      <p className="font-semibold">{result.reservation?.totalGuests}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">Check-ins Realizados</p>
                                      <p className="font-semibold text-green-600">{result.reservation?.checkedInGuests}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {result.giftInfo?.hasGift ? (
                                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MdCardGiftcard className="text-yellow-600" size={24} />
                                      <strong className="text-yellow-900 text-lg">🎁 Brinde Disponível!</strong>
                                    </div>
                                    <p className="text-yellow-800 font-semibold mb-1">
                                      {result.giftInfo.giftDescription}
                                    </p>
                                  </div>
                                ) : result.giftInfo && result.giftInfo.remainingCheckins > 0 ? (
                                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MdPending className="text-blue-600" size={24} />
                                      <strong className="text-blue-900">Check-ins para Brinde</strong>
                                    </div>
                                    <p className="text-blue-800 font-semibold">
                                      Faltam <span className="text-2xl text-blue-600">{result.giftInfo.remainingCheckins}</span> check-in(s) para ganhar o brinde
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            )}

                            {result.type === 'promoter' && (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-600">
                                  <strong>Total de check-ins:</strong> <span className="text-green-600 font-semibold">{result.promoterInfo?.totalCheckins}</span>
                                </p>
                              </div>
                            )}

                            {result.type === 'promoter_guest' && (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-600">
                                  <strong>Promoter:</strong> {result.promoterInfo?.name}
                                </p>
                                <p className="text-gray-600 mt-1">
                                  <strong>Total de check-ins do promoter:</strong> {result.promoterInfo?.totalCheckins}
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
                <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
                  <MdSearch size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Nenhum resultado encontrado para "{searchTerm}"</p>
                </div>
              )}

              {searchTerm.length < 2 && (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
                  <MdSearch size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Digite pelo menos 2 caracteres para buscar</p>
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
