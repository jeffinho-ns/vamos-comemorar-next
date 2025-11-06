"use client";

import { useState, useEffect, useCallback } from 'react';
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

  // Estados
  const [loading, setLoading] = useState(false);
  const [estabelecimentos, setEstabelecimentos] = useState<{ id: number; nome: string }[]>([]);
  const [eventos, setEventos] = useState<EventoLista[]>([]);
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<number | null>(null);

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
        establishment_id: e.establishment_id,
        establishment_name: e.establishment_name || e.casa_do_evento || 'Estabelecimento',
        horario_funcionamento: e.horario_funcionamento || e.hora_do_evento || null
      }));
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
      const addItem = (id: number, nome: string) => {
        const key = normalize(nome);
        if (!key) return;
        const eventId = eventoNomeToId.get(key);
        const finalId = eventId ?? id;
        if (!merged.has(key)) merged.set(key, { id: Number(finalId), nome: nome.replace(/Jutino/gi, 'Justino') });
      };

      bars.forEach(b => addItem(Number(b.id), b.name));
      places.forEach(p => addItem(Number(p.id), p.name));

      // Ordena
      const lista = Array.from(merged.values()).sort((a, b) => a.nome.localeCompare(b.nome));
      setEstabelecimentos(lista);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  // Seleção robusta: por id OU por nome normalizado (cobre casos com id_place incorreto/NULL)
  const selectedEstablishmentName = estabelecimentoSelecionado
    ? (estabelecimentos.find(est => est.id === estabelecimentoSelecionado)?.nome || '')
    : '';
  const eventosDoEstabelecimento = eventos.filter(e => {
    if (!estabelecimentoSelecionado) return false;
    const idMatch = e.establishment_id === estabelecimentoSelecionado;
    const nameMatch = normalize(e.establishment_name) === normalize(selectedEstablishmentName);
    return idMatch || nameMatch;
  });

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
    <WithPermission allowedRoles={["admin", "gerente", "hostess", "promoter"]}>
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
              <button
                onClick={carregarTudo}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold"
              >
                <MdRefresh className={loading ? 'animate-spin' : ''} size={20} />
                Atualizar
              </button>
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



