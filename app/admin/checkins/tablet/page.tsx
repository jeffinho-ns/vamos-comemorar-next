"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MdSearch, MdPerson, MdTableBar, MdCardGiftcard, MdCheckCircle, MdPending, MdStore, MdEvent, MdCake, MdGroups, MdAttachMoney } from 'react-icons/md';
import { WithPermission } from '../../../components/WithPermission/WithPermission';
import { useEstablishmentPermissions } from '@/app/hooks/useEstablishmentPermissions';
import EntradaStatusModal, { EntradaTipo } from '../../../components/EntradaStatusModal';
import { BirthdayReservation } from '../../../services/birthdayService';

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
  checkedOut?: boolean;
  checkoutTime?: string;
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
    blocks_entire_area?: boolean; // Indica se esta reserva bloqueia toda a área
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
  
  // Estado para reservas adicionais buscadas diretamente da API
  const [reservasAdicionaisAPI, setReservasAdicionaisAPI] = useState<Array<{
    id: number;
    client_name: string;
    reservation_date: string;
    reservation_time: string;
    number_of_people: number;
    table_number?: string;
    area_name?: string;
    checked_in: boolean;
    checkin_time?: string;
    checked_out?: boolean;
    checkout_time?: string;
    status?: string;
    origin?: string;
    blocks_entire_area?: boolean;
  }>>([]);
  const [loadingReservasAdicionais, setLoadingReservasAdicionais] = useState(false);

  // Estados para modal de check-in
  const [entradaModalOpen, setEntradaModalOpen] = useState(false);
  const [convidadoParaCheckIn, setConvidadoParaCheckIn] = useState<{ tipo: 'guest' | 'owner' | 'promoter_guest'; id?: number; guestId?: number; guestListId?: number; reservationId?: number; nome: string } | null>(null);
  
  // Estados para reservas de aniversário e itens do menu
  const [birthdayReservationsByReservationId, setBirthdayReservationsByReservationId] = useState<Record<number, BirthdayReservation>>({});
  const [menuItemsByBirthdayReservation, setMenuItemsByBirthdayReservation] = useState<Record<number, { bebidas: any[], comidas: any[] }>>({});

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

  // Função para carregar itens do cardápio para reservas de aniversário
  const loadMenuItemsForBirthdayReservations = useCallback(async (
    birthdayReservationsMap: Record<number, BirthdayReservation>,
    establishmentId: number
  ) => {
    try {
      const API_URL_LOCAL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';
      const API_BASE_URL = `${API_URL_LOCAL}/api/cardapio`;
      
      // Buscar o estabelecimento (place) para pegar o nome/slug
      const placesResponse = await fetch(`${API_URL_LOCAL}/api/places`);
      let establishmentName = '';
      let establishmentSlug = '';
      
      if (placesResponse.ok) {
        const placesData = await placesResponse.json();
        const places = Array.isArray(placesData) ? placesData : (placesData.data || []);
        const place = places.find((p: any) => Number(p.id) === Number(establishmentId));
        if (place) {
          establishmentName = place.name || '';
          establishmentSlug = place.slug || '';
        }
      }

      if (!establishmentName) {
        return;
      }

      // Buscar bars, categories e items do cardápio
      const [barsResponse, categoriesResponse, itemsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/bars`),
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/items`)
      ]);

      if (!barsResponse.ok || !categoriesResponse.ok || !itemsResponse.ok) {
        return;
      }

      const [bars, categories, items] = await Promise.all([
        barsResponse.json(),
        categoriesResponse.json(),
        itemsResponse.json()
      ]);

      // Normalizar nomes para comparação
      const normalizeName = (name: string) => {
        return name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/[^a-z0-9\s]/g, '');
      };
      
      const simplifyName = (name: string) => {
        return normalizeName(name)
          .replace(/\s+/g, '')
          .replace(/[^a-z0-9]/g, '');
      };
      
      // Buscar bar por slug, ID ou nome
      let bar = null;
      if (establishmentSlug) {
        bar = bars.find((b: any) => b.slug === establishmentSlug);
      }
      if (!bar) {
        bar = bars.find((b: any) => Number(b.id) === Number(establishmentId));
      }
      if (!bar) {
        const normalizedEstablishmentName = normalizeName(establishmentName);
        const simplifiedEstablishmentName = simplifyName(establishmentName);
        bar = bars.find((b: any) => {
          const normalizedBarName = normalizeName(b.name);
          const simplifiedBarName = simplifyName(b.name);
          return normalizedBarName === normalizedEstablishmentName || 
                 simplifiedBarName === simplifiedEstablishmentName;
        });
      }

      if (!bar) {
        return;
      }

      // Processar selos dos itens
      const processedItems = items.map((item: any) => {
        let seals = [];
        if (item.seals) {
          if (Array.isArray(item.seals)) {
            seals = item.seals;
          } else if (typeof item.seals === 'string') {
            try {
              seals = JSON.parse(item.seals);
              if (!Array.isArray(seals)) seals = [];
            } catch (e) {
              seals = [];
            }
          }
        }
        return { ...item, seals };
      });

      // Filtrar itens do bar
      const normalizedBarId = String(bar.id);
      const barItemsFiltered = processedItems.filter((item: any) => {
        const matchesBar = String(item.barId) === normalizedBarId;
        const isVisible = item.visible === undefined || item.visible === null || item.visible === 1 || item.visible === true;
        return matchesBar && isVisible;
      });

      const customSeals = bar.custom_seals || [];

      // Filtrar categorias
      const beverageCategories = categories.filter((cat: any) => {
        const categoryName = normalizeName(cat.name || '');
        return categoryName === 'drinks' || 
               categoryName === 'carta de vinho' ||
               categoryName === 'bebidas' ||
               categoryName.includes('drink') || 
               categoryName.includes('vinho') ||
               categoryName.includes('bebida');
      }).map((cat: any) => String(cat.id));

      const foodCategories = categories.filter((cat: any) => {
        const categoryName = normalizeName(cat.name || '');
        return categoryName === 'menu' || categoryName.includes('menu');
      }).map((cat: any) => String(cat.id));

      // Filtrar itens com selo B-day
      const beveragesWithBday = barItemsFiltered.filter((item: any) => {
        const hasBeverageCategory = beverageCategories.includes(String(item.categoryId));
        if (!hasBeverageCategory) return false;
        if (!item.seals || !Array.isArray(item.seals) || item.seals.length === 0) return false;
        return item.seals.some((sealId: string) => {
          if (!sealId || typeof sealId !== 'string') return false;
          const normalizedSeal = simplifyName(sealId);
          if (normalizedSeal.includes('b-day') || normalizedSeal.includes('bday') || normalizedSeal.includes('birthday')) {
            return true;
          }
          const customSeal = customSeals.find((cs: any) => cs.id === sealId);
          if (customSeal) {
            const customSealName = simplifyName(customSeal.name || '');
            if (customSealName.includes('b-day') || customSealName.includes('bday') || customSealName.includes('birthday')) {
              return true;
            }
          }
          return false;
        });
      });

      const foodsWithBday = barItemsFiltered.filter((item: any) => {
        const hasFoodCategory = foodCategories.includes(String(item.categoryId));
        if (!hasFoodCategory) return false;
        if (!item.seals || !Array.isArray(item.seals) || item.seals.length === 0) return false;
        return item.seals.some((sealId: string) => {
          if (!sealId || typeof sealId !== 'string') return false;
          const normalizedSeal = simplifyName(sealId);
          if (normalizedSeal.includes('b-day') || normalizedSeal.includes('bday') || normalizedSeal.includes('birthday')) {
            return true;
          }
          const customSeal = customSeals.find((cs: any) => cs.id === sealId);
          if (customSeal) {
            const customSealName = simplifyName(customSeal.name || '');
            if (customSealName.includes('b-day') || customSealName.includes('bday') || customSealName.includes('birthday')) {
              return true;
            }
          }
          return false;
        });
      });

      // Mapear itens selecionados para cada reserva de aniversário
      const menuItemsMap: Record<number, { bebidas: any[], comidas: any[] }> = {};
      
      Object.values(birthdayReservationsMap).forEach((br) => {
        const bebidasSelecionadas = [];
        const comidasSelecionadas = [];

        // Mapear bebidas
        for (let i = 1; i <= 10; i++) {
          const quantidade = (br as any)[`item_bar_bebida_${i}`] as number;
          if (quantidade && quantidade > 0) {
            const itemIndex = i - 1;
            if (itemIndex < beveragesWithBday.length) {
              const item = beveragesWithBday[itemIndex];
              bebidasSelecionadas.push({
                nome: item.name || `Bebida ${i}`,
                quantidade,
                preco: parseFloat(item.price) || 0,
              });
            }
          }
        }

        // Mapear comidas
        for (let i = 1; i <= 10; i++) {
          const quantidade = (br as any)[`item_bar_comida_${i}`] as number;
          if (quantidade && quantidade > 0) {
            const itemIndex = i - 1;
            if (itemIndex < foodsWithBday.length) {
              const item = foodsWithBday[itemIndex];
              comidasSelecionadas.push({
                nome: item.name || `Porção ${i}`,
                quantidade,
                preco: parseFloat(item.price) || 0,
              });
            }
          }
        }

        menuItemsMap[br.id] = { bebidas: bebidasSelecionadas, comidas: comidasSelecionadas };
      });

      setMenuItemsByBirthdayReservation(menuItemsMap);
    } catch (error) {
      console.error('Erro ao carregar itens do cardápio:', error);
    }
  }, []);

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
        
        // Buscar reservas de aniversário relacionadas às guest lists com event_type='aniversario'
        const aniversarioGuestLists = guestLists.filter((gl: any) => gl.event_type === 'aniversario');
        if (aniversarioGuestLists.length > 0 && estabelecimentoSelecionado) {
          try {
            const birthdayResResponse = await fetch(`${API_URL}/api/birthday-reservations?establishment_id=${estabelecimentoSelecionado}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (birthdayResResponse.ok) {
              const birthdayData = await birthdayResResponse.json();
              const birthdayReservations = Array.isArray(birthdayData) ? birthdayData : (birthdayData.data || []);
              
              const birthdayReservationsMap: Record<number, BirthdayReservation> = {};
              
              // Mapear reservas de aniversário pelo restaurant_reservation_id e também por nome/date como fallback
              birthdayReservations.forEach((br: any) => {
                // Primeiro tenta mapear pelo restaurant_reservation_id
                if (br.restaurant_reservation_id) {
                  const resId = Number(br.restaurant_reservation_id);
                  birthdayReservationsMap[resId] = br;
                }
                
                // Fallback: tentar encontrar pela guest list usando nome e data
                aniversarioGuestLists.forEach((gl: any) => {
                  if (!birthdayReservationsMap[gl.reservation_id]) {
                    const brDate = br.data_aniversario ? br.data_aniversario.split('T')[0] : null;
                    const glDate = gl.reservation_date ? gl.reservation_date.split('T')[0] : null;
                    const nameMatch = gl.owner_name && br.aniversariante_nome && (
                      gl.owner_name.toLowerCase().includes(br.aniversariante_nome.toLowerCase()) ||
                      br.aniversariante_nome.toLowerCase().includes(gl.owner_name.toLowerCase())
                    );
                    
                    if ((nameMatch && brDate === glDate) || 
                        (br.restaurant_reservation_id && Number(br.restaurant_reservation_id) === gl.reservation_id)) {
                      birthdayReservationsMap[gl.reservation_id] = br;
                    }
                  }
                });
              });
              
              setBirthdayReservationsByReservationId(birthdayReservationsMap);
              
              // Carregar itens do cardápio
              if (Object.keys(birthdayReservationsMap).length > 0) {
                loadMenuItemsForBirthdayReservations(birthdayReservationsMap, estabelecimentoSelecionado);
              }
            }
          } catch (error) {
            console.error('Erro ao buscar reservas de aniversário:', error);
          }
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados. Tente novamente.');
      } finally {
        setLoadingData(false);
      }
    };

    carregarTodosDados();
  }, [estabelecimentoSelecionado, eventoSelecionado, loadMenuItemsForBirthdayReservations]);

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

  // Função para obter a subárea correta baseada no número da mesa (Seu Justino)
  const getSeuJustinoSubareaName = useCallback((tableNumber?: string | number): string | null => {
    if (!tableNumber) return null;
    const n = String(tableNumber).trim();
    // Suporta múltiplas mesas separadas por vírgula
    const tableNumbers = n.includes(',') ? n.split(',').map(t => t.trim()) : [n];
    
    // Mapeamento de mesas para áreas do Seu Justino
    const seuJustinoSubareas = [
      { key: 'lounge-aquario-spaten', area_id: 1, label: 'Lounge Aquario Spaten', tableNumbers: ['210'] },
      { key: 'lounge-aquario-tv', area_id: 1, label: 'Lounge Aquario TV', tableNumbers: ['208'] },
      { key: 'lounge-palco', area_id: 1, label: 'Lounge Palco', tableNumbers: ['204','206'] },
      { key: 'lounge-bar', area_id: 1, label: 'Lounge Bar', tableNumbers: ['200','202'] },
      { key: 'quintal-lateral-esquerdo', area_id: 2, label: 'Quintal Lateral Esquerdo', tableNumbers: ['20','22','24','26','28','29'] },
      { key: 'quintal-central-esquerdo', area_id: 2, label: 'Quintal Central Esquerdo', tableNumbers: ['30','32','34','36','38','39'] },
      { key: 'quintal-central-direito', area_id: 2, label: 'Quintal Central Direito', tableNumbers: ['40','42','44','46','48'] },
      { key: 'quintal-lateral-direito', area_id: 2, label: 'Quintal Lateral Direito', tableNumbers: ['50','52','54','56','58','60','62','64'] },
    ];
    
    for (const tn of tableNumbers) {
      const subarea = seuJustinoSubareas.find(sub => sub.tableNumbers.includes(tn));
      if (subarea) {
        return subarea.label;
      }
    }
    
    return null;
  }, []);

  // Função para obter a subárea correta baseada no número da mesa (Highline)
  const getHighlineSubareaName = useCallback((tableNumber?: string | number): string | null => {
    if (!tableNumber) return null;
    const n = String(tableNumber).padStart(2, '0');
    
    const subareaMap: Record<string, string> = {
      '05': 'Área Deck - Frente',
      '06': 'Área Deck - Frente',
      '07': 'Área Deck - Frente',
      '08': 'Área Deck - Frente',
      '01': 'Área Deck - Esquerdo',
      '02': 'Área Deck - Esquerdo',
      '03': 'Área Deck - Esquerdo',
      '04': 'Área Deck - Esquerdo',
      '09': 'Área Deck - Direito',
      '10': 'Área Deck - Direito',
      '11': 'Área Deck - Direito',
      '12': 'Área Deck - Direito',
      '15': 'Área Bar',
      '16': 'Área Bar',
      '17': 'Área Bar',
      '50': 'Área Rooftop - Direito',
      '51': 'Área Rooftop - Direito',
      '52': 'Área Rooftop - Direito',
      '53': 'Área Rooftop - Direito',
      '54': 'Área Rooftop - Direito',
      '55': 'Área Rooftop - Direito',
      '70': 'Área Rooftop - Bistrô',
      '71': 'Área Rooftop - Bistrô',
      '72': 'Área Rooftop - Bistrô',
      '73': 'Área Rooftop - Bistrô',
      '44': 'Área Rooftop - Centro',
      '45': 'Área Rooftop - Centro',
      '46': 'Área Rooftop - Centro',
      '47': 'Área Rooftop - Centro',
      '60': 'Área Rooftop - Esquerdo',
      '61': 'Área Rooftop - Esquerdo',
      '62': 'Área Rooftop - Esquerdo',
      '63': 'Área Rooftop - Esquerdo',
      '64': 'Área Rooftop - Esquerdo',
      '65': 'Área Rooftop - Esquerdo',
      '40': 'Área Rooftop - Vista',
      '41': 'Área Rooftop - Vista',
      '42': 'Área Rooftop - Vista'
    };
    
    return subareaMap[n] || null;
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

        // Buscar área correta: primeiro tenta mapear pela mesa, depois busca na reserva oficial
        let areaName = null;
        
          // Detectar se é Seu Justino
          const isSeuJustinoTablet = estabelecimentoSelecionado && (
            estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome?.toLowerCase().includes('seu justino') &&
            !estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome?.toLowerCase().includes('pracinha')
          );
          
          // 1. Tentar obter subárea pelo número da mesa (mais preciso)
          if (gl.table_number) {
            const subareaName = isSeuJustinoTablet 
              ? getSeuJustinoSubareaName(gl.table_number)
              : getHighlineSubareaName(gl.table_number);
            if (subareaName) {
              areaName = subareaName;
            }
          }
          
          // 2. Se não encontrou pela mesa, buscar na reserva de restaurante relacionada
          if (!areaName && gl.reservation_id) {
            const relatedReservation = loadedData.reservations.find((r: any) => {
              const reservationId = r.id || r.reservation_id;
              return Number(reservationId) === Number(gl.reservation_id);
            });
            
            if (relatedReservation?.area_name) {
              // Se a área da reserva é uma área principal (Rooftop, Deck, etc), tentar mapear pela mesa
              if (gl.table_number) {
                const subareaName = isSeuJustinoTablet 
                  ? getSeuJustinoSubareaName(gl.table_number)
                  : getHighlineSubareaName(gl.table_number);
                if (subareaName) {
                  areaName = subareaName;
                } else {
                  // Se não encontrou pela mesa, usar função helper para mapear área correta
                  areaName = isSeuJustinoTablet
                    ? getSeuJustinoSubareaName(gl.table_number) || relatedReservation.area_name
                    : relatedReservation.area_name;
                }
              } else {
                areaName = relatedReservation.area_name;
              }
            }
          }
          
          // 3. Fallback: usar área da guest list apenas se não encontrou em nenhum lugar
          if (!areaName) {
            // Se for Seu Justino e tiver mesa, tentar mapear
            if (isSeuJustinoTablet && gl.table_number) {
              areaName = getSeuJustinoSubareaName(gl.table_number) || gl.area_name || null;
            } else {
              areaName = gl.area_name || null;
            }
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
            area: areaName,
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
          // Buscar área correta: primeiro tenta mapear pela mesa, depois busca na reserva oficial
          let areaName = null;
          
          // Detectar se é Seu Justino
          const isSeuJustinoTablet = estabelecimentoSelecionado && (
            estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome?.toLowerCase().includes('seu justino') &&
            !estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome?.toLowerCase().includes('pracinha')
          );
          
          // 1. Tentar obter subárea pelo número da mesa (mais preciso)
          if (gl.table_number) {
            const subareaName = isSeuJustinoTablet 
              ? getSeuJustinoSubareaName(gl.table_number)
              : getHighlineSubareaName(gl.table_number);
            if (subareaName) {
              areaName = subareaName;
            }
          }
          
          // 2. Se não encontrou pela mesa, buscar na reserva de restaurante relacionada
          if (!areaName && gl.reservation_id) {
            const relatedReservation = loadedData.reservations.find((r: any) => {
              const reservationId = r.id || r.reservation_id;
              return Number(reservationId) === Number(gl.reservation_id);
            });
            
            if (relatedReservation?.area_name) {
              // Se a área da reserva é uma área principal (Rooftop, Deck, etc), tentar mapear pela mesa
              if (gl.table_number) {
                const subareaName = isSeuJustinoTablet 
                  ? getSeuJustinoSubareaName(gl.table_number)
                  : getHighlineSubareaName(gl.table_number);
                if (subareaName) {
                  areaName = subareaName;
                } else {
                  // Se não encontrou pela mesa, usar função helper para mapear área correta
                  areaName = isSeuJustinoTablet
                    ? getSeuJustinoSubareaName(gl.table_number) || relatedReservation.area_name
                    : relatedReservation.area_name;
                }
              } else {
                areaName = relatedReservation.area_name;
              }
            }
          }
          
          // 3. Fallback: usar área da guest list apenas se não encontrou em nenhum lugar
          if (!areaName) {
            // Se for Seu Justino e tiver mesa, tentar mapear
            if (isSeuJustinoTablet && gl.table_number) {
              areaName = getSeuJustinoSubareaName(gl.table_number) || gl.area_name || null;
            } else {
              areaName = gl.area_name || null;
            }
          }

          results.push({
            type: 'guest',
            name: guest.name,
            id: guest.id,
            guestId: guest.id,
            guestListId: guestListId,
            reservationId: gl.reservation_id,
            ownerName: gl.owner_name, // Nome do dono da reserva
            checkedIn: guest.checked_in === true || guest.checked_in === 1,
            checkedOut: guest.checked_out === true || guest.checked_out === 1,
            checkoutTime: guest.checkout_time,
            reservation: {
              id: gl.reservation_id,
              date: gl.reservation_date,
              time: gl.reservation_time,
              table: gl.table_number?.toString(),
              area: areaName,
              totalGuests: gl.total_guests || 0,
              checkedInGuests: gl.guests_checked_in || 0,
              eventType: gl.event_type || 'outros'
            },
            giftInfo: { remainingCheckins: 0, hasGift: false },
          });
        }
      }
    }

    // Buscar em reservas de restaurante sem guest list (reservas simples)
    // Verificar reservas que têm guest_list_id null ou undefined
    for (const reservation of loadedData.reservations) {
      // Verificar se esta reserva não tem guest list associada
      // guest_list_id será null/undefined para reservas sem guest list
      const hasGuestList = reservation.guest_list_id != null || 
        loadedData.guestLists.some((gl: any) => 
          (gl.reservation_id && Number(gl.reservation_id) === Number(reservation.id)) ||
          (gl.reservation_id && Number(gl.reservation_id) === Number(reservation.reservation_id))
        );
      
      if (!hasGuestList) {
        // Buscar nome em múltiplos campos possíveis
        const clientName = (reservation.client_name || reservation.responsavel || reservation.owner_name || '').toLowerCase();
        const origin = (reservation.origin || reservation.origem || '').toLowerCase();
        
        // Debug: log para verificar se está encontrando a reserva
        if (clientName.includes('luis') || clientName.includes('felipe') || clientName.includes('martins')) {
          console.log('🔍 [TABLET] Reserva encontrada:', {
            id: reservation.id,
            reservation_id: reservation.reservation_id,
            client_name: reservation.client_name,
            responsavel: reservation.responsavel,
            guest_list_id: reservation.guest_list_id,
            clientName,
            searchLower,
            match: clientName.includes(searchLower)
          });
        }
        
        if (clientName.includes(searchLower) || origin.includes(searchLower)) {
          // Detectar se é Seu Justino
          const isSeuJustinoTablet = estabelecimentoSelecionado && (
            estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome?.toLowerCase().includes('seu justino') &&
            !estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome?.toLowerCase().includes('pracinha')
          );
          
          // Buscar área correta
          let areaName = null;
          if (reservation.table_number) {
            const subareaName = isSeuJustinoTablet 
              ? getSeuJustinoSubareaName(reservation.table_number)
              : getHighlineSubareaName(reservation.table_number);
            if (subareaName) {
              areaName = subareaName;
            }
          }
          if (!areaName && reservation.area_name) {
            // Se for Seu Justino e tiver mesa, tentar mapear
            if (isSeuJustinoTablet && reservation.table_number) {
              areaName = getSeuJustinoSubareaName(reservation.table_number) || reservation.area_name;
            } else {
              areaName = reservation.area_name;
            }
          }

          results.push({
            type: 'owner',
            name: reservation.client_name || reservation.responsavel || 'Sem nome',
            reservationId: reservation.id || reservation.reservation_id,
            checkedIn: reservation.checked_in === true || reservation.checked_in === 1,
            checkedOut: reservation.checked_out === true || reservation.checked_out === 1,
            checkoutTime: reservation.checkout_time,
            reservation: {
              id: reservation.id || reservation.reservation_id,
              date: reservation.reservation_date,
              time: reservation.reservation_time,
              table: reservation.table_number?.toString(),
              area: areaName,
              totalGuests: reservation.number_of_people || 0,
              checkedInGuests: reservation.convidados_checkin || 0,
              eventType: 'outros'
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

    // Adicionar reservas da API se disponíveis
    if (reservasAdicionaisAPI.length > 0 && term.trim().length >= 2) {
      const searchLower = term.toLowerCase().trim();
      
      reservasAdicionaisAPI.forEach(r => {
        const nomeCompleto = (r.client_name || '').toLowerCase();
        const origem = (r.origin || '').toLowerCase();
        
        if (nomeCompleto.includes(searchLower) || origem.includes(searchLower)) {
          // Verificar se já não está nos resultados
          const jaExiste = results.some(res => 
            res.type === 'owner' && res.reservationId === r.id
          );
          
          if (!jaExiste) {
            // Detectar se é Seu Justino
            const isSeuJustinoTablet = estabelecimentoSelecionado && (
              estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome?.toLowerCase().includes('seu justino') &&
              !estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome?.toLowerCase().includes('pracinha')
            );
            
            // Buscar área correta
            let areaName = null;
            if (r.table_number) {
              const subareaName = isSeuJustinoTablet 
                ? getSeuJustinoSubareaName(r.table_number)
                : getHighlineSubareaName(r.table_number);
              if (subareaName) {
                areaName = subareaName;
              }
            }
            if (!areaName && r.area_name) {
              // Se for Seu Justino e tiver mesa, tentar mapear
              if (isSeuJustinoTablet && r.table_number) {
                areaName = getSeuJustinoSubareaName(r.table_number) || r.area_name;
              } else {
                areaName = r.area_name;
              }
            }

            results.push({
              type: 'owner',
              name: r.client_name || 'Sem nome',
              reservationId: r.id,
            checkedIn: Boolean(r.checked_in),
            checkedOut: Boolean((r as any).checked_out),
            checkoutTime: (r as any).checkout_time,
              reservation: {
                id: r.id,
                date: r.reservation_date,
                time: r.reservation_time,
                table: r.table_number?.toString(),
                area: areaName ?? undefined,
                totalGuests: r.number_of_people || 0,
                checkedInGuests: 0,
                eventType: 'outros',
                blocks_entire_area: r.blocks_entire_area === true || (typeof r.blocks_entire_area === 'number' && r.blocks_entire_area === 1)
              },
              giftInfo: { remainingCheckins: 0, hasGift: false },
            });
          }
        }
      });
    }

    setResults(results);
  }, [loadedData, getHighlineSubareaName, getSeuJustinoSubareaName, reservasAdicionaisAPI, estabelecimentoSelecionado, estabelecimentos]);

  // Ref para evitar múltiplas buscas simultâneas
  const buscandoReservasAdicionaisRef = useRef(false);

  // Buscar reservas adicionais diretamente da API quando houver busca
  useEffect(() => {
    if (!searchTerm.trim() || !estabelecimentoSelecionado || !eventoSelecionado) {
      setReservasAdicionaisAPI([]);
      return;
    }

    // Evitar múltiplas buscas simultâneas
    if (buscandoReservasAdicionaisRef.current) {
      return;
    }

    const buscarReservasAdicionais = async () => {
      buscandoReservasAdicionaisRef.current = true;
      setLoadingReservasAdicionais(true);
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Buscar evento para pegar a data
        const eventoRes = await fetch(`${API_URL}/api/v1/eventos/${eventoSelecionado}`, { headers });
        if (!eventoRes.ok) {
          setReservasAdicionaisAPI([]);
          return;
        }
        const eventoData = await eventoRes.json();
        const evento = eventoData.evento || eventoData;
        const dataEvento = evento.data_evento?.split('T')[0] || evento.data_evento;
        
        if (!dataEvento) {
          setReservasAdicionaisAPI([]);
          return;
        }

        const url = `${API_URL}/api/restaurant-reservations?establishment_id=${estabelecimentoSelecionado}&date=${dataEvento}`;
        
        const response = await fetch(url, { headers });
        if (response.ok) {
          const data = await response.json();
          const todasReservas = data.reservations || [];
          
          // Filtrar apenas reservas sem guest list (verificar se não têm guest_list associada)
          // E que não estão já em loadedData.reservations
          const idsJaIncluidos = new Set(loadedData.reservations.map((r: any) => r.id || r.reservation_id));
          const reservasSemGuestList = todasReservas.filter((r: any) => {
            // Verificar se não está já incluída
            if (idsJaIncluidos.has(r.id)) return false;
            
            // Verificar se não tem guest list (verificar se não está em guestLists)
            const temGuestList = loadedData.guestLists.some((gl: any) => 
              (gl.reservation_id && Number(gl.reservation_id) === Number(r.id))
            );
            return !temGuestList;
          });

          setReservasAdicionaisAPI(reservasSemGuestList);
          
          if (reservasSemGuestList.length > 0) {
            console.log(`✅ [TABLET API] ${reservasSemGuestList.length} reservas adicionais encontradas sem guest list`);
            // Debug específico para Luis Felipe Martins
            const luisFelipe = reservasSemGuestList.find((r: any) => 
              (r.client_name && r.client_name.toLowerCase().includes('luis')) ||
              (r.client_name && r.client_name.toLowerCase().includes('felipe')) ||
              (r.client_name && r.client_name.toLowerCase().includes('martins'))
            );
            if (luisFelipe) {
              console.log('🎯 [TABLET API] Reserva Luis Felipe Martins encontrada:', {
                id: luisFelipe.id,
                client_name: luisFelipe.client_name,
                data: luisFelipe.reservation_date
              });
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar reservas adicionais no tablet:', error);
        setReservasAdicionaisAPI([]);
      } finally {
        setLoadingReservasAdicionais(false);
        buscandoReservasAdicionaisRef.current = false;
      }
    };

    // Debounce da busca API
    const timeoutId = setTimeout(buscarReservasAdicionais, 500);
    return () => {
      clearTimeout(timeoutId);
      buscandoReservasAdicionaisRef.current = false;
    };
  }, [searchTerm, estabelecimentoSelecionado, eventoSelecionado, loadedData.reservations.length, loadedData.guestLists.length]);


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
      setEntradaModalOpen(true);
    } else if (result.type === 'owner') {
      // Verificar se é owner de guest list ou reserva sem guest list
      if (result.guestListId) {
        // É owner de guest list
        setConvidadoParaCheckIn({
          tipo: 'owner',
          guestListId: result.guestListId,
          reservationId: result.reservationId,
          nome: result.name
        });
        setEntradaModalOpen(true);
      } else if (result.reservationId) {
        // É reserva sem guest list - fazer check-in direto
        handleReservaSemGuestListCheckIn(result.reservationId, result.name);
      }
    } else if (result.type === 'promoter_guest' && result.id) {
      setConvidadoParaCheckIn({
        tipo: 'promoter_guest',
        id: result.id,
        nome: result.name
      });
      setEntradaModalOpen(true);
    }
  };

  // Handler para check-in de reserva sem guest list
  const handleReservaSemGuestListCheckIn = async (reservationId: number, nome: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/restaurant-reservations/${reservationId}/checkin`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        alert(`✅ Check-in de ${nome} confirmado!`);
        // Atualizar estado local
        setLoadedData(prev => ({
          ...prev,
          reservations: prev.reservations.map((r: any) => 
            (r.id === reservationId || r.reservation_id === reservationId)
              ? { ...r, checked_in: true, checkin_time: new Date().toISOString() }
              : r
          )
        }));
        // Atualizar resultados
        setResults(prev => prev.map(r => 
          (r.type === 'owner' && r.reservationId === reservationId)
            ? { ...r, checkedIn: true }
            : r
        ));
      } else {
        const errorData = await response.json();
        alert('❌ Erro ao fazer check-in: ' + (errorData?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro no check-in:', error);
      alert('❌ Erro ao fazer check-in');
    }
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

  // Função para fazer check-out de um convidado
  const handleGuestCheckOut = async (guestId: number, guestName: string) => {
    if (!confirm(`Confirmar check-out de ${guestName}?`)) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/admin/guests/${guestId}/checkout`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Check-out de ${guestName} confirmado!`);
        
        // Atualizar estado local
        setLoadedData(prev => {
          const updatedGuests = { ...prev.guests };
          for (const guestListId in updatedGuests) {
            updatedGuests[guestListId] = updatedGuests[guestListId].map((g: any) =>
              g.id === guestId
                ? { ...g, checked_in: false, checked_out: true, checkout_time: data.guest?.checkout_time || new Date().toISOString() }
                : g
            );
          }
          return { ...prev, guests: updatedGuests };
        });
        
        // Atualizar resultados
        setResults(prev => prev.map(r =>
          (r.type === 'guest' && r.guestId === guestId)
            ? { ...r, checkedIn: false, checkedOut: true, checkoutTime: data.guest?.checkout_time }
            : r
        ));
      } else {
        const errorData = await response.json();
        alert('❌ Erro ao fazer check-out: ' + (errorData?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro no check-out:', error);
      alert('❌ Erro ao fazer check-out');
    }
  };

  // Função para fazer check-out do dono
  const handleOwnerCheckOut = async (guestListId: number, ownerName: string) => {
    if (!confirm(`Confirmar check-out de ${ownerName}?`)) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/admin/guest-lists/${guestListId}/owner-checkout`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Check-out de ${ownerName} confirmado!`);
        
        // Atualizar estado local
        setLoadedData(prev => ({
          ...prev,
          guestLists: prev.guestLists.map(gl =>
            (gl.guest_list_id || gl.id) === guestListId
              ? { ...gl, owner_checked_in: 0, owner_checked_out: 1, owner_checkout_time: data.guestList?.owner_checkout_time || new Date().toISOString() }
              : gl
          )
        }));
        
        // Atualizar resultados
        setResults(prev => prev.map(r =>
          (r.type === 'owner' && r.guestListId === guestListId)
            ? { ...r, checkedIn: false, checkedOut: true, checkoutTime: data.guestList?.owner_checkout_time }
            : r
        ));
      } else {
        const errorData = await response.json();
        alert('❌ Erro ao fazer check-out: ' + (errorData?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro no check-out:', error);
      alert('❌ Erro ao fazer check-out');
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
              disabled={establishmentPermissions.isRestrictedToSingleEstablishment()}
            >
              {establishmentPermissions.isRestrictedToSingleEstablishment() ? (
                estabelecimentos.map(est => (
                  <option key={est.id} value={est.id} className="text-gray-900">{est.nome}</option>
                ))
              ) : (
                <>
                  <option value="" className="text-gray-900">Selecione um estabelecimento</option>
                  {estabelecimentos.map(est => (
                    <option key={est.id} value={est.id} className="text-gray-900">{est.nome}</option>
                  ))}
                </>
              )}
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
                            result.checkedOut
                              ? 'bg-gray-500/20'
                              : result.checkedIn 
                              ? 'bg-green-500/20' 
                              : isOwner 
                                ? 'bg-purple-500/20' 
                                : 'bg-blue-500/20'
                          }`}>
                            {result.type === 'promoter' || result.type === 'promoter_guest' ? (
                              <MdEvent className={result.checkedOut ? 'text-gray-400' : result.checkedIn ? 'text-green-400' : 'text-blue-400'} size={24} />
                            ) : (
                              <MdPerson className={result.checkedOut ? 'text-gray-400' : result.checkedIn ? 'text-green-400' : isOwner ? 'text-purple-400' : 'text-blue-400'} size={24} />
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
                                    <>
                                      <span className="px-2 sm:px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1 flex-shrink-0">
                                        <MdPerson size={14} />
                                        DONO DA RESERVA
                                      </span>
                                      {/* Valor Total da Reserva de Aniversário */}
                                      {result.reservation?.eventType === 'aniversario' && result.reservationId && (() => {
                                        // Tentar encontrar a reserva de aniversário
                                        let birthdayReservation: BirthdayReservation | undefined = birthdayReservationsByReservationId[result.reservationId];
                                        
                                        // Se não encontrou pelo reservation_id, tentar buscar pela guest list
                                        if (!birthdayReservation) {
                                          const allBirthdayReservations = Object.values(birthdayReservationsByReservationId);
                                          birthdayReservation = allBirthdayReservations.find((br: any) => {
                                            const nameMatch = result.name && br.aniversariante_nome && (
                                              result.name.toLowerCase().includes(br.aniversariante_nome.toLowerCase()) ||
                                              br.aniversariante_nome.toLowerCase().includes(result.name.toLowerCase())
                                            );
                                            const brDate = br.data_aniversario ? br.data_aniversario.split('T')[0] : null;
                                            const resDate = result.reservation?.date ? result.reservation.date.split('T')[0] : null;
                                            const dateMatch = brDate === resDate;
                                            const idMatch = br.restaurant_reservation_id && Number(br.restaurant_reservation_id) === result.reservationId;
                                            return idMatch || (nameMatch && dateMatch);
                                          }) as BirthdayReservation | undefined;
                                        }
                                        
                                        if (!birthdayReservation) {
                                          return null;
                                        }
                                        
                                        const menuItems = menuItemsByBirthdayReservation[birthdayReservation.id] || { bebidas: [], comidas: [] };
                                        
                                        // Calcular valor total com preços reais do cardápio
                                        const decorationPrices: Record<string, number> = {
                                          'Decoração Pequena 1': 200.0,
                                          'Decoração Pequena 2': 220.0,
                                          'Decoração Media 3': 250.0,
                                          'Decoração Media 4': 270.0,
                                          'Decoração Grande 5': 300.0,
                                          'Decoração Grande 6': 320.0,
                                        };
                                        
                                        let total = 0;
                                        
                                        // Valor da decoração
                                        if (birthdayReservation.decoracao_tipo) {
                                          total += decorationPrices[birthdayReservation.decoracao_tipo] || 0;
                                        }
                                        
                                        // Valor das bebidas do bar (com preços reais do cardápio)
                                        menuItems.bebidas.forEach(item => {
                                          total += item.preco * item.quantidade;
                                        });

                                        // Valor das porções do bar (com preços reais do cardápio)
                                        menuItems.comidas.forEach(item => {
                                          total += item.preco * item.quantidade;
                                        });
                                        
                                        // Valor das bebidas especiais
                                        const bebidasEspeciaisMap: Record<string, { nome: string; preco: number }> = {
                                          'bebida_balde_budweiser': { nome: 'Balde Budweiser', preco: 50.0 },
                                          'bebida_balde_corona': { nome: 'Balde Corona', preco: 55.0 },
                                          'bebida_balde_heineken': { nome: 'Balde Heineken', preco: 60.0 },
                                          'bebida_combo_gin_142': { nome: 'Combo Gin 142', preco: 80.0 },
                                          'bebida_licor_rufus': { nome: 'Licor Rufus', preco: 45.0 },
                                        };
                                        
                                        Object.entries(bebidasEspeciaisMap).forEach(([campo, info]) => {
                                          const qtd = (birthdayReservation as any)[campo] || 0;
                                          if (qtd > 0) {
                                            total += info.preco * qtd;
                                          }
                                        });
                                        
                                        if (total > 0) {
                                          return (
                                            <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-orange-500/90 to-red-500/90 text-white rounded-full text-xs sm:text-sm font-bold flex items-center gap-1 flex-shrink-0 shadow-lg" title="Valor total da reserva. Será adicionado à comanda no estabelecimento.">
                                              <MdAttachMoney size={14} />
                                              Total: R$ {total.toFixed(2)}
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </>
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
                              
                              <div className="flex-shrink-0 flex flex-col gap-2">
                                {!result.checkedIn && !result.checkedOut && (result.type === 'guest' || result.type === 'owner' || result.type === 'promoter_guest') && (
                                  <button
                                    onClick={() => handleCheckInClick(result)}
                                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg font-semibold text-sm sm:text-base"
                                  >
                                    <MdCheckCircle size={18} />
                                    Check-in
                                  </button>
                                )}
                                {result.checkedIn && !result.checkedOut && (result.type === 'guest' || result.type === 'owner') && (
                                  <>
                                    <span className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-green-500/20 text-green-300 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm sm:text-base">
                                      <MdCheckCircle size={18} />
                                      Check-in realizado
                                    </span>
                                    <button
                                      onClick={() => {
                                        if (result.type === 'guest' && result.guestId) {
                                          handleGuestCheckOut(result.guestId, result.name);
                                        } else if (result.type === 'owner' && result.guestListId) {
                                          handleOwnerCheckOut(result.guestListId, result.name);
                                        }
                                      }}
                                      className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg font-semibold text-sm sm:text-base"
                                      title="Registrar saída"
                                    >
                                      🚪 Check-out
                                    </button>
                                  </>
                                )}
                                {result.checkedOut && (
                                  <span className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-500/20 text-gray-300 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm sm:text-base">
                                    🚪 Saída registrada
                                    {result.checkoutTime && (
                                      <span className="text-xs text-gray-400">
                                        {new Date(result.checkoutTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </span>
                                )}
                                {result.checkedIn && result.type === 'promoter_guest' && (
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
                                    {result.reservation?.blocks_entire_area && (
                                      <div className="col-span-2">
                                        <div className="p-3 sm:p-4 bg-red-900/40 border-2 border-red-500/70 rounded-lg">
                                          <div className="flex items-center gap-2 mb-1">
                                            <MdTableBar className="text-red-400" size={20} />
                                            <strong className="text-red-200 text-sm sm:text-base">⚠️ ÁREA COMPLETAMENTE BLOQUEADA</strong>
                                          </div>
                                          <p className="text-red-200 text-xs sm:text-sm">
                                            Esta reserva está ocupando <strong>todas as mesas</strong> da área <strong>{result.reservation.area || 'Rooftop'}</strong> para este dia.
                                          </p>
                                        </div>
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
