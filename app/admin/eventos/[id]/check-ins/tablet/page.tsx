"use client";

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MdSearch, MdPerson, MdCardGiftcard, MdEvent, MdCheckCircle } from 'react-icons/md';
import { WithPermission } from '../../../../../components/WithPermission/WithPermission';
import { io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.agilizaiapp.com.br';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://vamos-comemorar-api.onrender.com';

interface SearchResult {
  type: 'guest' | 'owner' | 'promoter' | 'promoter_guest';
  name: string;
  id?: number;
  guestId?: number;
  guestListId?: number;
  reservationId?: number;
  promoterId?: number;
  checkedIn?: boolean;
  reservation?: {
    id: number;
    date: string;
    time: string;
    table?: string;
    area?: string;
    totalGuests: number;
    checkedInGuests: number;
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
  promoters: any[];
  promoterGuests: { [promoterId: number]: any[] };
  gifts: { [guestListId: number]: any };
}

export default function EventoTabletCheckInsPage() {
  const params = useParams();
  const eventoId = params?.id?.toString() ?? '';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedData, setLoadedData] = useState<LoadedData>({
    guestLists: [],
    guests: {},
    promoters: [],
    promoterGuests: {},
    gifts: {}
  });

  // Carregar todos os dados quando o componente montar ou eventoId mudar
  useEffect(() => {
    if (!eventoId) return;

    const carregarTodosDados = async () => {
      setLoadingData(true);
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Buscar check-ins consolidados do evento
        const checkinsRes = await fetch(`${API_URL}/api/v1/eventos/${eventoId}/checkins-consolidados`, { headers });
        if (!checkinsRes.ok) throw new Error('Erro ao carregar dados');

        const checkinsData = await checkinsRes.json();
        
        const guestLists = checkinsData.restaurant_guest_lists || [];
        const guests: { [key: number]: any[] } = {};
        const gifts: { [key: number]: any } = {};

        // Carregar guests e gifts de cada guest list
        for (const gl of guestLists) {
          try {
            // Carregar guests
            const guestsRes = await fetch(`${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/guests`, { headers });
            if (guestsRes.ok) {
              const guestsData = await guestsRes.json();
              guests[gl.guest_list_id] = guestsData.guests || [];
            }

            // Carregar gifts
            const giftRes = await fetch(`${API_URL}/api/gift-rules/guest-list/${gl.guest_list_id}/gifts`, { headers });
            if (giftRes.ok) {
              const giftData = await giftRes.json();
              gifts[gl.guest_list_id] = giftData;
            }
          } catch (e) {
            console.error(`Erro ao carregar dados da guest list ${gl.guest_list_id}:`, e);
          }
        }

        // Carregar promoters e seus convidados
        const promoters = checkinsData.promoters || [];
        const promoterGuests: { [key: number]: any[] } = {};

        for (const promoter of promoters) {
          try {
            const listasRes = await fetch(`${API_URL}/api/v1/eventos/${eventoId}/promoter/${promoter.id}/listas`, { headers });
            if (listasRes.ok) {
              const listasData = await listasRes.json();
              const allGuests: any[] = [];
              (listasData.listas || []).forEach((lista: any) => {
                if (lista.convidados) {
                  allGuests.push(...lista.convidados);
                }
              });
              promoterGuests[promoter.id] = allGuests;
            }
          } catch (e) {
            console.error(`Erro ao carregar convidados do promoter ${promoter.id}:`, e);
          }
        }

        setLoadedData({
          guestLists,
          guests,
          promoters,
          promoterGuests,
          gifts
        });
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados. Tente novamente.');
      } finally {
        setLoadingData(false);
      }
    };

    carregarTodosDados();
  }, [eventoId]);

  // Socket.IO: atualização em tempo real quando check-in é feito via /admin/qrcode
  const guestListIdsKey = (loadedData.guestLists || []).map((g: any) => g.guest_list_id ?? g.id).filter(Boolean).sort().join(',');
  useEffect(() => {
    const lists = loadedData.guestLists || [];
    if (!lists.length || !guestListIdsKey) return;
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    lists.forEach((gl: { guest_list_id?: number; id?: number }) => {
      const id = gl.guest_list_id ?? gl.id;
      if (id != null) socket.emit('join_guest_list', id);
    });
    const onConvidadoCheckin = (data: { convidadoId?: number; nome?: string; guest_list_id?: number }) => {
      const listId = data.guest_list_id;
      const convidadoId = data.convidadoId;
      if (listId == null || convidadoId == null) return;
      const now = new Date().toISOString();
      setLoadedData((prev) => {
        const guests = (prev.guests || {}) as { [k: number]: any[] };
        const list = guests[listId] || [];
        const nextGuests = { ...guests, [listId]: list.map((g: any) => (g.id === convidadoId ? { ...g, checked_in: true, checkin_time: now } : g)) };
        const nextLists = (prev.guestLists || []).map((gl: any) =>
          (gl.guest_list_id ?? gl.id) === listId ? { ...gl, guests_checked_in: (gl.guests_checked_in || 0) + 1 } : gl
        );
        return { ...prev, guests: nextGuests, guestLists: nextLists };
      });
    };
    socket.on('convidado_checkin', onConvidadoCheckin);
    return () => {
      socket.off('convidado_checkin', onConvidadoCheckin);
      socket.disconnect();
    };
  }, [guestListIdsKey]);

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
      const ownerName = gl.owner_name?.toLowerCase() || '';
      if (ownerName.includes(searchLower)) {
        const giftData = loadedData.gifts[gl.guest_list_id];
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
          guestListId: gl.guest_list_id,
          checkedIn: gl.owner_checked_in === 1,
          reservation: {
            id: gl.reservation_id,
            date: gl.reservation_date,
            time: gl.reservation_time,
            table: gl.table_number?.toString(),
            area: gl.area_name,
            totalGuests: gl.total_guests || 0,
            checkedInGuests: gl.guests_checked_in || 0,
          },
          giftInfo,
        });
      }

      // Buscar guests desta lista
      const guests = loadedData.guests[gl.guest_list_id] || [];
      for (const guest of guests) {
        const guestName = guest.name?.toLowerCase() || '';
        if (guestName.includes(searchLower)) {
          const giftData = loadedData.gifts[gl.guest_list_id];
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
            type: 'guest',
            name: guest.name,
            id: guest.id,
            guestId: guest.id,
            guestListId: gl.guest_list_id,
            reservationId: gl.reservation_id,
            checkedIn: guest.checked_in === true || guest.checked_in === 1,
            reservation: {
              id: gl.reservation_id,
              date: gl.reservation_date,
              time: gl.reservation_time,
              table: gl.table_number?.toString(),
              area: gl.area_name,
              totalGuests: gl.total_guests || 0,
              checkedInGuests: gl.guests_checked_in || 0,
            },
            giftInfo,
          });
        }
      }
    }

    // Buscar em promoters
    for (const promoter of loadedData.promoters) {
      const promoterName = promoter.nome?.toLowerCase() || '';
      if (promoterName.includes(searchLower)) {
        results.push({
          type: 'promoter',
          name: promoter.nome,
          promoterId: promoter.id,
          promoterInfo: {
            id: promoter.id,
            name: promoter.nome,
            totalCheckins: promoter.convidados_checkin || 0,
          },
        });
      }

      // Buscar convidados do promoter
      const promoterGuests = loadedData.promoterGuests[promoter.id] || [];
      for (const guest of promoterGuests) {
        const guestName = guest.nome?.toLowerCase() || '';
        if (guestName.includes(searchLower)) {
          results.push({
            type: 'promoter_guest',
            name: guest.nome,
            id: guest.lista_convidado_id,
            promoterId: promoter.id,
            checkedIn: guest.status_checkin === 'Check-in',
            promoterInfo: {
              id: promoter.id,
              name: promoter.nome,
              totalCheckins: promoter.convidados_checkin || 0,
            },
          });
        }
      }
    }

    setResults(results);
  }, [loadedData]);

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    handleSearch(value);
  };

  // Função de check-in
  const handleCheckIn = async (result: SearchResult) => {
    if (!result.id && result.type !== 'owner') {
      alert('Erro: ID não encontrado');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let response;

      if (result.type === 'guest' && result.guestId) {
        // Check-in de convidado de guest list
        response = await fetch(`${API_URL}/api/admin/guests/${result.guestId}/checkin`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            entrada_tipo: 'GRATIS',
            entrada_valor: 0
          })
        });
      } else if (result.type === 'owner' && result.guestListId) {
        // Check-in do dono da lista
        response = await fetch(`${API_URL}/api/restaurant-reservations/${result.reservationId}/checkin-owner`, {
          method: 'POST',
          headers
        });
      } else if (result.type === 'promoter_guest' && result.id && eventoId) {
        // Check-in de convidado de promoter
        response = await fetch(`${API_URL}/api/v1/eventos/checkin/${result.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            status_checkin: 'Check-in',
            entrada_tipo: 'GRATIS',
            entrada_valor: 0
          })
        });
      } else {
        alert('Tipo de check-in não suportado');
        return;
      }

      if (response?.ok) {
        // Atualizar dados locais
        if (result.type === 'guest' && result.guestId && result.guestListId) {
          setLoadedData(prev => ({
            ...prev,
            guests: {
              ...prev.guests,
              [result.guestListId!]: (prev.guests[result.guestListId!] || []).map(g =>
                g.id === result.guestId ? { ...g, checked_in: true, checkin_time: new Date().toISOString() } : g
              )
            }
          }));
        } else if (result.type === 'owner' && result.guestListId) {
          setLoadedData(prev => ({
            ...prev,
            guestLists: prev.guestLists.map(gl =>
              gl.guest_list_id === result.guestListId
                ? { ...gl, owner_checked_in: 1, owner_checkin_time: new Date().toISOString() }
                : gl
            )
          }));
        } else if (result.type === 'promoter_guest' && result.id) {
          setLoadedData(prev => ({
            ...prev,
            promoterGuests: {
              ...prev.promoterGuests,
              [result.promoterId!]: (prev.promoterGuests[result.promoterId!] || []).map(g =>
                g.lista_convidado_id === result.id ? { ...g, status_checkin: 'Check-in' } : g
              )
            }
          }));
        }

        // Atualizar resultados
        setResults(prev => prev.map(r =>
          r === result ? { ...r, checkedIn: true } : r
        ));

        alert(`✅ Check-in de ${result.name} confirmado!`);
      } else {
        const errorData = await response?.json();
        alert('❌ Erro ao fazer check-in: ' + (errorData?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro no check-in:', error);
      alert('❌ Erro ao fazer check-in');
    }
  };

  return (
    <WithPermission allowedRoles={["admin", "gerente", "hostess", "promoter"]}>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {loadingData && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Carregando dados do evento...</p>
            </div>
          )}

          {!loadingData && eventoId && (
            <>
              {/* Barra de busca */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center gap-4">
                  <MdSearch className="text-gray-400" size={28} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Digite o nome do convidado, dono da reserva, promoter ou convidado do promoter..."
                    className="flex-1 text-lg px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {/* Resultados */}
              {results.length > 0 && (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                        result.checkedIn ? 'border-green-500' : 'border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${
                          result.checkedIn ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {result.type === 'promoter' || result.type === 'promoter_guest' ? (
                            <MdEvent className={result.checkedIn ? 'text-green-600' : 'text-blue-600'} size={24} />
                          ) : (
                            <MdPerson className={result.checkedIn ? 'text-green-600' : 'text-blue-600'} size={24} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{result.name}</h3>
                            {!result.checkedIn && (result.type === 'guest' || result.type === 'owner' || result.type === 'promoter_guest') && (
                              <button
                                onClick={() => handleCheckIn(result)}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                              >
                                <MdCheckCircle size={20} />
                                Check-in
                              </button>
                            )}
                            {result.checkedIn && (
                              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                                <MdCheckCircle size={20} />
                                Check-in realizado
                              </span>
                            )}
                          </div>
                          
                          {result.type === 'guest' && (
                            <div className="space-y-2 text-gray-600">
                              <p><strong>Convidado da reserva:</strong> {result.reservation?.date} às {result.reservation?.time}</p>
                              {result.reservation?.table && (
                                <p><strong>Mesa:</strong> {result.reservation.table} {result.reservation.area && `(${result.reservation.area})`}</p>
                              )}
                              <p><strong>Reserva ID:</strong> {result.reservation?.id}</p>
                            </div>
                          )}

                          {result.type === 'owner' && (
                            <div className="space-y-2">
                              <div className="text-gray-600">
                                <p><strong>Dono da reserva</strong></p>
                                <p>Data: {result.reservation?.date} às {result.reservation?.time}</p>
                                {result.reservation?.table && (
                                  <p><strong>Mesa:</strong> {result.reservation.table} {result.reservation.area && `(${result.reservation.area})`}</p>
                                )}
                                <p>Total de convidados: {result.reservation?.totalGuests}</p>
                                <p>Check-ins realizados: {result.reservation?.checkedInGuests}</p>
                              </div>
                              
                              {result.giftInfo?.hasGift && (
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MdCardGiftcard className="text-yellow-600" size={20} />
                                    <strong className="text-yellow-800">Brinde Disponível</strong>
                                  </div>
                                  <p className="text-yellow-700">
                                    <strong>Brinde:</strong> {result.giftInfo.giftDescription}
                                  </p>
                                  <p className="text-yellow-700">
                                    <strong>Check-ins faltantes:</strong> {result.giftInfo.remainingCheckins}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {result.type === 'promoter' && (
                            <div className="space-y-2 text-gray-600">
                              <p><strong>Promoter</strong></p>
                              <p>Total de check-ins: {result.promoterInfo?.totalCheckins}</p>
                            </div>
                          )}

                          {result.type === 'promoter_guest' && (
                            <div className="space-y-2 text-gray-600">
                              <p><strong>Convidado do Promoter:</strong> {result.promoterInfo?.name}</p>
                              <p>Total de check-ins do promoter: {result.promoterInfo?.totalCheckins}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm.length >= 2 && results.length === 0 && (
                <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                  <MdSearch size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Nenhum resultado encontrado para "{searchTerm}"</p>
                </div>
              )}

              {searchTerm.length < 2 && (
                <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                  <MdSearch size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Digite pelo menos 2 caracteres para buscar</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </WithPermission>
  );
}
