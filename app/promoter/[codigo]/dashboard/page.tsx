"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MdArrowBack,
  MdCheckCircle,
  MdCloudUpload,
  MdContentCopy,
  MdDownload,
  MdEvent,
  MdPeople,
  MdPerson,
  MdSearch,
  MdWhatsapp,
  MdWarning,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";

import { useUserPermissions } from "../../../hooks/useUserPermissions";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL ||
  "https://vamos-comemorar-api.onrender.com";

interface Promoter {
  id: number;
  nome: string;
  apelido?: string;
  email?: string;
  whatsapp?: string;
  foto_url?: string;
  instagram?: string;
  observacoes?: string;
  establishment_name?: string;
  user_id?: number | null;
  stats?: {
    total_convidados: number;
    total_confirmados: number;
  };
}

interface Evento {
  relacionamento_id: number;
  evento_id: number;
  nome_do_evento: string;
  data_evento: string | null;
  hora_do_evento: string;
  tipo_evento: string;
  establishment_name?: string;
  establishment_id?: number;
  status?: string;
  funcao?: string;
  observacoes?: string | null;
}

interface Convidado {
  id: number;
  nome: string;
  status: string;
  evento_nome?: string;
  evento_data?: string;
  whatsapp?: string;
  criado_em?: string;
}

export default function PromoterDashboardPage() {
  const params = useParams<{ codigo: string }>();
  const router = useRouter();
  const {
    isLoading: permissionsLoading,
    isPromoter,
    userEmail,
    userId,
  } = useUserPermissions();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoter, setPromoter] = useState<Promoter | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Convidado[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvento, setSelectedEvento] = useState<string>("todos");
  const [bulkInput, setBulkInput] = useState("");
  const [bulkEventoId, setBulkEventoId] = useState<string>("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<{
    added: number;
    skipped: number;
    errors: string[];
  }>({ added: 0, skipped: 0, errors: [] });
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [singleGuest, setSingleGuest] = useState<{ nome: string; whatsapp: string; evento: string }>({
    nome: "",
    whatsapp: "",
    evento: "",
  });
  const [addingSingleGuest, setAddingSingleGuest] = useState(false);
  const [isGuestsListOpen, setIsGuestsListOpen] = useState(true);
  
  // Estados para brindes de promoters
  interface PromoterGift {
    id: number;
    descricao: string;
    checkins_necessarios: number;
    checkins_count: number;
    status: string;
    liberado_em: string;
    gift_rule_id?: number;
    tipo_brinde?: 'porcentagem' | 'valor' | 'beneficio';
  }
  const [promoterGifts, setPromoterGifts] = useState<{ [eventoId: number]: PromoterGift[] }>({});
  const [promoterGiftRules, setPromoterGiftRules] = useState<{ [eventoId: number]: any[] }>({});

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/promoter/${params.codigo}`
      : "";

  const parsedBulkEntries = useMemo(() => {
    if (!bulkInput.trim()) return [];

    return bulkInput
      .split(/[\n,;]+/)
      .map((rawLine) => {
        const line = rawLine.trim();
        if (!line) return null;

        const match = line.match(/^(.*?)[\s\-|,;]+(\+?[0-9()\s-]{8,})$/);
        if (match) {
          const nome = match[1].trim();
          const rawWhatsapp = match[2].trim();
          if (!nome) return null;
          const digits = rawWhatsapp.replace(/\D/g, "");
          const whatsapp = digits.length >= 8 ? digits : "";
          return {
            nome,
            whatsapp,
            rawWhatsapp,
          };
        }

        return {
          nome: line,
          whatsapp: "",
          rawWhatsapp: "",
        };
      })
      .filter(
        (entry): entry is { nome: string; whatsapp: string; rawWhatsapp: string } =>
          Boolean(entry && entry.nome),
      );
  }, [bulkInput]);

  const loadPromoterData = useCallback(async () => {
    if (!params?.codigo) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/promoter/${params.codigo}`);
      if (!response.ok) {
        throw new Error("Promoter não encontrado.");
      }
      const data = await response.json();
      setPromoter(data.promoter);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [params?.codigo]);

  const loadEventos = useCallback(async () => {
    if (!params?.codigo) return;
    try {
      const promoterResponse = await fetch(
        `${API_URL}/api/promoter/${params.codigo}`,
      );

      if (!promoterResponse.ok) return;

      const promoterData = await promoterResponse.json();
      const promoterId = promoterData?.promoter?.id;

      if (!promoterId) return;

      const eventosResponse = await fetch(
        `${API_URL}/api/promoter-eventos/promoter/${promoterId}?status=ativo`,
      );

      if (eventosResponse.ok) {
        const data = await eventosResponse.json();
        const eventosFormatados: Evento[] = (data.eventos || []).map(
          (evento: any) => ({
            relacionamento_id: evento.relacionamento_id,
            evento_id: evento.evento_id,
            nome_do_evento: evento.nome_do_evento,
            data_evento: evento.data_evento || null,
            hora_do_evento: evento.hora_do_evento,
            tipo_evento: evento.tipo_evento,
            establishment_name: evento.establishment_name,
            establishment_id: evento.establishment_id,
            status: evento.status,
            funcao: evento.funcao,
            observacoes: evento.observacoes,
          }),
        );

        setEventos(eventosFormatados);
      }
    } catch (err) {
      console.error("Erro ao carregar eventos do promoter:", err);
    }
  }, [params?.codigo]);

  const loadConvidados = useCallback(async () => {
    if (!params?.codigo) return;
    try {
      const response = await fetch(
        `${API_URL}/api/promoter/${params.codigo}/convidados`,
      );
      if (response.ok) {
        const data = await response.json();
        setConvidados(data.convidados || []);
      }
    } catch (err) {
      console.error("Erro ao carregar convidados do promoter:", err);
    }
  }, [params?.codigo]);

  // Função para carregar brindes e regras de brindes para um evento específico
  const loadPromoterGifts = useCallback(async (promoterId: number, eventoId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('Token não encontrado, não será possível carregar brindes');
        return;
      }

      // Buscar brindes liberados, regras e check-ins
      const giftsResponse = await fetch(
        `${API_URL}/api/gift-rules/promoter/${promoterId}/evento/${eventoId}/gifts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (giftsResponse.ok) {
        const giftsData = await giftsResponse.json();
        setPromoterGifts(prev => ({
          ...prev,
          [eventoId]: giftsData.gifts || []
        }));
        setPromoterGiftRules(prev => ({
          ...prev,
          [eventoId]: giftsData.rules || []
        }));
        setCheckinsPorEvento(prev => ({
          ...prev,
          [eventoId]: giftsData.checkins_count || 0
        }));
      }
    } catch (err) {
      console.error("Erro ao carregar brindes do promoter:", err);
    }
  }, [API_URL]);
  
  // Estado para armazenar check-ins por evento (chave: evento_id|data_evento)
  const [checkinsPorEvento, setCheckinsPorEvento] = useState<Record<string, number>>({});
  
  // Carregar check-ins reais do promoter (endpoint público - não precisa de token)
  const loadCheckins = useCallback(async () => {
    if (!params?.codigo) return;
    try {
      const response = await fetch(`${API_URL}/api/promoter/${params.codigo}/checkins`);
      if (response.ok) {
        const data = await response.json();
        const porChave = data.checkins_por_evento || {};
        // Também popular a partir do array eventos (fallback para garantir todas as chaves)
        const merged: Record<string, number> = { ...porChave };
        (data.eventos || []).forEach((ev: { evento_id: number; data_evento?: string; checkins?: number }) => {
          const chave = `${ev.evento_id}|${(ev.data_evento || "").trim()}`;
          if (ev.checkins !== undefined && ev.checkins !== null) {
            merged[chave] = Number(ev.checkins);
          }
        });
        setCheckinsPorEvento(merged);
      }
    } catch (err) {
      console.error("Erro ao carregar check-ins:", err);
    }
  }, [params?.codigo]);

  // Carregar brindes e check-ins quando eventos/promoter mudarem
  useEffect(() => {
    if (params?.codigo) {
      loadCheckins();
    }
  }, [params?.codigo, loadCheckins, eventos.length, promoter?.id]);

  useEffect(() => {
    if (eventos.length > 0 && promoter?.id) {
      eventos.forEach(evento => {
        if (evento.evento_id) {
          loadPromoterGifts(promoter.id, evento.evento_id);
        }
      });
    }
  }, [eventos, promoter?.id, loadPromoterGifts]);

  // Atualizar check-ins a cada 30 segundos para manter contagem em tempo real
  useEffect(() => {
    const interval = setInterval(loadCheckins, 30000);
    return () => clearInterval(interval);
  }, [loadCheckins]);

  // Eventos reais do promoter (prioridade para tipo unico; se vazio, usa todos)
  const eventosUnicosReais = useMemo(() => {
    const unicos = eventos.filter(
      (e) => e.tipo_evento === "unico" || e.tipo_evento === null || e.tipo_evento === undefined
    );
    return unicos.length > 0 ? unicos : eventos;
  }, [eventos]);

  // Chave única para cada evento: evento_id|data_evento (normalizado YYYY-MM-DD)
  const getEventoChave = (ev: Evento) => {
    let data = (ev.data_evento || "").toString().trim();
    if (data && data.includes("T")) data = data.split("T")[0];
    if (data && data.includes("/")) {
      const [d, m, y] = data.split("/");
      if (d && m && y) data = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return `${ev.evento_id}|${data}`;
  };

  // Função para obter dados de brindes por evento
  const getPromoterGiftsForEvent = useMemo(() => {
    return (ev: Evento) => {
      const chave = getEventoChave(ev);
      const checkinsCount = checkinsPorEvento[chave] ?? checkinsPorEvento[String(ev.evento_id)] ?? 0;
      const liberados = promoterGifts[ev.evento_id] || [];
      const regras = promoterGiftRules[ev.evento_id] || [];
      
      // Separar regras em liberadas e em progresso
      const regrasLiberadas = regras.filter(r => r.liberado === true);
      const regrasEmProgresso = regras.filter(r => !r.liberado);
      
      return { checkinsCount, liberados, emProgresso: regrasEmProgresso, regras };
    };
  }, [checkinsPorEvento, promoterGifts, promoterGiftRules]);

  // Função auxiliar para identificar tipo de brinde
  const identifyGiftType = (descricao: string): 'porcentagem' | 'valor' | 'beneficio' => {
    const descLower = descricao.toLowerCase();
    // Se contém % ou "porcentagem" ou "comissão"
    if (descLower.includes('%') || descLower.includes('porcentagem') || descLower.includes('comissão')) {
      return 'porcentagem';
    }
    // Se contém R$ ou "reais" ou valores monetários
    if (descLower.includes('r$') || descLower.includes('reais') || /\d+[\s]*(reais|rs?)/i.test(descLower)) {
      return 'valor';
    }
    // Caso contrário, é benefício (VIP, camarote, combo, etc)
    return 'beneficio';
  };

  // Evento selecionado (para obter nome e dados) - definido antes de eventoAtual
  const eventoSelecionado = useMemo(() => {
    if (selectedEvento === "todos") return null;
    return eventos.find((e) => getEventoChave(e) === selectedEvento);
  }, [selectedEvento, eventos]);

  // Obter dados do evento selecionado (ou primeiro evento)
  const eventoAtual = useMemo(() => {
    if (selectedEvento === 'todos' && eventosUnicosReais.length > 0) {
      return eventosUnicosReais[0];
    }
    const sel = eventos.find((e) => getEventoChave(e) === selectedEvento);
    return sel || eventosUnicosReais[0];
  }, [selectedEvento, eventos, eventosUnicosReais]);

  const giftsData = useMemo(() => {
    if (!eventoAtual) return { checkinsCount: 0, liberados: [], emProgresso: [], regras: [] };
    return getPromoterGiftsForEvent(eventoAtual);
  }, [eventoAtual, getPromoterGiftsForEvent]);
  
  // Separar brindes por tipo (usando regras ao invés de liberados)
  const brindesPorcentagemValor = useMemo(() => {
    const todos = [...giftsData.regras];
    return todos.filter(b => {
      const tipo = identifyGiftType(b.descricao);
      return tipo === 'porcentagem' || tipo === 'valor';
    });
  }, [giftsData]);

  const brindesBeneficios = useMemo(() => {
    const todos = [...giftsData.regras];
    return todos.filter(b => identifyGiftType(b.descricao) === 'beneficio');
  }, [giftsData]);
  
  useEffect(() => {
    loadPromoterData();
    loadEventos();
    loadConvidados();
  }, [loadPromoterData, loadEventos, loadConvidados]);

  // Resetar seleção se o evento selecionado não existir mais
  useEffect(() => {
    if (selectedEvento !== "todos" && eventosUnicosReais.length > 0) {
      const existe = eventosUnicosReais.some((e) => getEventoChave(e) === selectedEvento);
      if (!existe) setSelectedEvento("todos");
    }
  }, [selectedEvento, eventosUnicosReais]);

  useEffect(() => {
    let guests = [...convidados];

    if (selectedEvento !== "todos" && eventoSelecionado?.nome_do_evento) {
      const nomeEvento = eventoSelecionado.nome_do_evento.toLowerCase();
      guests = guests.filter(
        (guest) => (guest.evento_nome || "").toLowerCase() === nomeEvento,
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      guests = guests.filter(
        (guest) =>
          guest.nome.toLowerCase().includes(term) ||
          (guest.evento_nome || "").toLowerCase().includes(term) ||
          (guest.whatsapp || "").toLowerCase().includes(term),
      );
    }

    setFilteredGuests(guests);
  }, [convidados, searchTerm, selectedEvento, eventoSelecionado]);

  const handleAddSingleGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleGuest.nome.trim()) return;

    setAddingSingleGuest(true);
    try {
      const response = await fetch(
        `${API_URL}/api/promoter/${params.codigo}/convidado`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: singleGuest.nome.trim(),
            whatsapp: singleGuest.whatsapp.trim(),
            evento_id: singleGuest.evento || null,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error || "Não foi possível adicionar o convidado.",
        );
      }

      setSingleGuest({ nome: "", whatsapp: "", evento: "" });
      await loadConvidados();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro ao adicionar convidado.");
    } finally {
      setAddingSingleGuest(false);
    }
  };

  const handleBulkImport = async () => {
    if (parsedBulkEntries.length === 0) return;
    setBulkLoading(true);
    setBulkError(null);
    const errors: string[] = [];
    let added = 0;
    let skipped = 0;

    for (const entry of parsedBulkEntries) {
      const nome = entry.nome;

      if (!nome.trim()) {
        skipped += 1;
        errors.push("Linha ignorada: nome não informado.");
        continue;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/promoter/${params.codigo}/convidado`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nome,
              whatsapp: "",
              evento_id: bulkEventoId || null,
            }),
          },
        );

        if (response.ok) {
          added += 1;
        } else {
          skipped += 1;
          const data = await response.json().catch(() => null);
          errors.push(data?.error || `Falha ao adicionar ${nome}.`);
        }
      } catch (err) {
        skipped += 1;
        errors.push(`Erro inesperado ao adicionar ${nome}.`);
      }
    }

    setBulkFeedback({ added, skipped, errors });
    if (errors.length > 0) {
      setBulkError(
        `${errors.length} convidado(s) não puderam ser importados. Veja detalhes abaixo.`,
      );
    } else {
      setBulkError(null);
      setBulkInput("");
    }

    setBulkLoading(false);
    await loadConvidados();
  };

  const exportGuests = () => {
    if (filteredGuests.length === 0) return;
    const headers = ["Nome", "Status", "Evento", "WhatsApp"];
    const rows = filteredGuests.map((guest) => [
      guest.nome,
      guest.status,
      guest.evento_nome || "-",
      guest.whatsapp || "-",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `convidados-promoter-${params.codigo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Check-ins reais do evento selecionado
  const checkinsNoEventoSelecionado = useMemo(() => {
    if (selectedEvento === "todos") {
      return Object.values(checkinsPorEvento).reduce((sum, n) => sum + n, 0);
    }
    let count = checkinsPorEvento[selectedEvento];
    if (count !== undefined && count !== null) return count;
    // Fallback: buscar por evento_id se a chave exata não bater
    const [eventoId] = selectedEvento.split("|");
    const chaveAlternativa = Object.keys(checkinsPorEvento).find((k) => k.startsWith(`${eventoId}|`));
    return chaveAlternativa ? checkinsPorEvento[chaveAlternativa] : 0;
  }, [selectedEvento, checkinsPorEvento]);

  // Convidados no evento selecionado (para calcular % comparecimento)
  const convidadosNoEventoSelecionado = useMemo(() => {
    if (selectedEvento === "todos") return convidados.length;
    if (!eventoSelecionado?.nome_do_evento) return 0;
    const nomeEvento = (eventoSelecionado.nome_do_evento || "").toLowerCase();
    return convidados.filter(
      (g) => (g.evento_nome || "").toLowerCase() === nomeEvento
    ).length;
  }, [selectedEvento, convidados, eventoSelecionado]);

  const convidadosPorEvento = useMemo(() => {
    const mapa = new Map<string, number>();
    convidados.forEach((guest) => {
      const nomeEvento = guest.evento_nome || "Sem evento";
      mapa.set(nomeEvento, (mapa.get(nomeEvento) || 0) + 1);
    });
    return Array.from(mapa.entries()).map(([nome, total]) => ({
      nome,
      total,
    }));
  }, [convidados]);

  const taxaComparecimento =
    convidadosNoEventoSelecionado > 0
      ? Math.round((checkinsNoEventoSelecionado / convidadosNoEventoSelecionado) * 100)
      : 0;

  const canAccessDashboard = useMemo(() => {
    if (permissionsLoading) return false;
    if (!promoter) return false;
    if (!isPromoter) return false;

    // Se temos o ID do usuário logado e o vínculo user_id do promoter, compare-os
    if (userId && promoter.user_id) {
      if (Number(userId) === Number(promoter.user_id)) {
        return true;
      }
    }

    // Caso não exista vínculo direto, permita se o e-mail corresponder
    if (userEmail && promoter.email) {
      if (promoter.email.toLowerCase() === userEmail.toLowerCase()) {
        return true;
      }
    }

    return false;
  }, [permissionsLoading, promoter, isPromoter, userId, userEmail]);

  if (permissionsLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Carregando painel do promoter...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        {error}
      </div>
    );
  }

  if (!promoter || !canAccessDashboard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-6">
        <div className="max-w-md w-full bg-white/10 backdrop-blur rounded-3xl p-8 text-center">
          <MdWarning className="mx-auto text-5xl text-amber-400 mb-4" />
          <h1 className="text-2xl font-semibold mb-2">
            Acesso restrito a promoters
          </h1>
          <p className="text-sm text-slate-200 mb-6">
            Efetue login com uma conta de promoter autorizada para visualizar e gerenciar
            sua lista de convidados.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
          >
            <MdArrowBack /> Ir para login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-10">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <p className="text-sm text-purple-200 mb-1">
              Painel exclusivo para promoters
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">
              Olá, {promoter.apelido || promoter.nome} 👋
            </h1>
            <p className="text-slate-300 mt-2">
              Acompanhe o desempenho da sua lista, confirme presenças e importe novos
              convidados com agilidade.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 min-w-[240px]">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-200 font-semibold">
              Seu link público
            </p>
            <p className="text-sm mt-2 break-all text-white/90">{shareLink}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(shareLink)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-purple-500/20 hover:bg-purple-500/30 transition"
              >
                <MdContentCopy /> Copiar
              </button>
              {promoter.whatsapp && (
                <a
                  href={`https://wa.me/${promoter.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                    "Confira minha lista VIP: " + shareLink,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-green-500/20 hover:bg-green-500/30 transition"
                >
                  <MdWhatsapp /> Enviar
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Seletor de evento para estatísticas e check-ins - apenas eventos reais atrelados ao promoter */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-sm text-white/70">Mostrar dados de:</span>
          <select
            value={selectedEvento}
            onChange={(e) => setSelectedEvento(e.target.value)}
            className="rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-[200px]"
          >
            <option value="todos">Todos os eventos</option>
            {eventosUnicosReais.map((ev) => {
              const chave = getEventoChave(ev);
              const dataFormatada = ev.data_evento
                ? new Date(ev.data_evento + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                : "";
              return (
                <option key={chave} value={chave}>
                  {ev.nome_do_evento || "Evento"} {dataFormatada ? `(${dataFormatada})` : ""}
                </option>
              );
            })}
          </select>
          <button
            onClick={() => loadCheckins()}
            className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
            title="Atualizar contagem de check-ins"
          >
            Atualizar check-ins
          </button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-200">
              Convidados totais
            </p>
            <p className="text-3xl font-bold mt-2">{selectedEvento === "todos" ? convidados.length : convidadosNoEventoSelecionado}</p>
            <p className="text-xs text-white/60 mt-1">
              {selectedEvento === "todos" ? "Total da sua lista." : "Neste evento."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-200">
              Check-ins
            </p>
            <p className="text-3xl font-bold mt-2 text-emerald-300">
              {checkinsNoEventoSelecionado}
            </p>
            <p className="text-xs text-white/60 mt-1">
              {selectedEvento === "todos" ? "Total de entradas nos eventos." : "Presentes no evento selecionado."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-200">
              Eventos atrelados
            </p>
            <p className="text-3xl font-bold mt-2">{eventosUnicosReais.length}</p>
            <p className="text-xs text-white/60 mt-1">
              Eventos reais que você está vinculado.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-200">
              Comparecimento
            </p>
            <p className="text-3xl font-bold mt-2">
              {convidadosNoEventoSelecionado > 0 ? `${taxaComparecimento}%` : "—"}
            </p>
            <p className="text-xs text-white/60 mt-1">
              Taxa de comparecimento {selectedEvento === "todos" ? "geral." : "no evento."}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
                <div>
                  <p className="text-sm text-white/60">Adicionar convidado manualmente</p>
                  <h2 className="text-2xl font-semibold mt-1">Entrada rápida</h2>
                </div>
                <button
                  onClick={() => setBulkInput((prev) => prev)}
                  className="hidden"
                  aria-hidden
                />
              </div>

              <form onSubmit={handleAddSingleGuest} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-purple-200">
                    Nome completo
                  </label>
                  <div className="mt-2 relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-purple-300">
                      <MdPerson />
                    </span>
                    <input
                      type="text"
                      value={singleGuest.nome}
                      onChange={(e) =>
                        setSingleGuest((prev) => ({ ...prev, nome: e.target.value }))
                      }
                      className="w-full rounded-2xl bg-white/10 border border-white/10 pl-10 pr-3 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="Nome do convidado"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.18em] text-purple-200">
                    WhatsApp (opcional)
                  </label>
                  <div className="mt-2 relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-green-300">
                      <MdWhatsapp />
                    </span>
                    <input
                      type="tel"
                      value={singleGuest.whatsapp}
                      onChange={(e) =>
                        setSingleGuest((prev) => ({ ...prev, whatsapp: e.target.value }))
                      }
                      className="w-full rounded-2xl bg-white/10 border border-white/10 pl-10 pr-3 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="text-xs uppercase tracking-[0.18em] text-purple-200">
                      Evento (opcional)
                    </label>
                    <select
                      value={singleGuest.evento}
                      onChange={(e) =>
                        setSingleGuest((prev) => ({ ...prev, evento: e.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl bg-white border border-white/10 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">— Selecionar evento —</option>
                      {eventos.map((evento) => (
                        <option
                          key={evento.relacionamento_id}
                          value={evento.evento_id}
                        >
                          {evento.nome_do_evento} •{" "}
                          {evento.data_evento
                            ? new Date(
                                (evento.data_evento || "").includes("T")
                                  ? evento.data_evento || ""
                                  : `${evento.data_evento}T12:00:00`,
                              ).toLocaleDateString("pt-BR")
                            : "Data a definir"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={addingSingleGuest}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-purple-500 hover:bg-purple-600 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <MdCheckCircle />
                    {addingSingleGuest ? "Adicionando..." : "Adicionar convidado"}
                  </button>
                </div>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              {/* Título e Botões */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Convidados cadastrados</h2>
                  <p className="text-sm text-white/60">
                    Filtre por evento ou pesquise por nome, WhatsApp ou status.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={exportGuests}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-sm font-semibold"
                  >
                    <MdDownload /> Exportar CSV
                  </button>
                </div>
              </div>

              {/* Seção de Importar convidados em lote */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-[0.18em] text-purple-200 mb-2">
                  Importar convidados em lote
                </label>
                <div className="mb-3">
                  <select
                    value={bulkEventoId}
                    onChange={(e) => setBulkEventoId(e.target.value)}
                    className="w-full rounded-2xl bg-slate-900/40 border border-white/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                  >
                    <option value="">Atribuir a um evento (opcional)</option>
                    {eventos.map((evento) => (
                      <option key={evento.evento_id} value={String(evento.evento_id)}>
                        {evento.nome_do_evento} •{" "}
                        {new Date(
                          (evento.data_evento || "").includes("T")
                            ? evento.data_evento || ""
                            : evento.data_evento
                            ? `${evento.data_evento}T12:00:00`
                            : "",
                        ).toLocaleDateString("pt-BR")}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-white/40">
                    Se preferir, deixe em branco e atribua o evento mais tarde.
                  </p>
                </div>
                <div className="flex gap-3">
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    rows={6}
                    placeholder="Cole nomes separados por linha, vírgula ou ponto e vírgula..."
                    className="flex-1 rounded-2xl bg-white border border-white/10 px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleBulkImport}
                      disabled={parsedBulkEntries.length === 0 || bulkLoading}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-purple-500 hover:bg-purple-600 transition text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <MdCloudUpload />
                      {bulkLoading ? "Importando..." : "Importar"}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-2">
                  {parsedBulkEntries.length > 0
                    ? `${parsedBulkEntries.length} convidado(s) serão importados.`
                    : "Nenhum nome detectado ainda."}
                </p>
                {bulkError && (
                  <div className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
                    {bulkError}
                    {bulkFeedback.errors.length > 0 && (
                      <details className="mt-2 text-amber-100/80">
                        <summary className="cursor-pointer">Ver detalhes</summary>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {bulkFeedback.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
                {(bulkFeedback.added > 0 || bulkFeedback.skipped > 0) && (
                  <div className="mt-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100 space-y-1">
                    <div>✅ Adicionados: {bulkFeedback.added}</div>
                    {bulkFeedback.skipped > 0 && (
                      <div>⚠️ Não adicionados: {bulkFeedback.skipped}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Lista de Convidados com Dropdown */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex flex-col gap-4 mb-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsGuestsListOpen(!isGuestsListOpen)}
                      className="flex items-center gap-2 text-lg font-semibold hover:text-purple-300 transition-colors"
                    >
                      <span>Lista de Convidados ({filteredGuests.length})</span>
                      {isGuestsListOpen ? (
                        <MdExpandLess className="text-2xl text-white/60" />
                      ) : (
                        <MdExpandMore className="text-2xl text-white/60" />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-xl">
                      <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Pesquisar convidado por nome, WhatsApp ou evento..."
                        className="w-full rounded-2xl bg-white/10 border border-white/10 pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                    <select
                      value={selectedEvento}
                      onChange={(e) => setSelectedEvento(e.target.value)}
                      className="rounded-2xl bg-white/10 border border-white/10 px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="todos">Todos os convidados</option>
                      {eventosUnicosReais.map((ev) => {
                        const chave = getEventoChave(ev);
                        const totalEv = convidadosPorEvento.find((e) => (e.nome || "").toLowerCase() === (ev.nome_do_evento || "").toLowerCase())?.total ?? 0;
                        const dataFormatada = ev.data_evento
                          ? new Date(ev.data_evento + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                          : "";
                        return (
                          <option key={chave} value={chave}>
                            {ev.nome_do_evento || "Evento"} {dataFormatada ? `(${dataFormatada})` : ""} — {totalEv} convidados
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {isGuestsListOpen && (
                  <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2">
                    {filteredGuests.map((guest) => (
                      <div
                        key={guest.id}
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div>
                          <p className="text-base font-semibold">{guest.nome}</p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
                            {guest.evento_nome && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                                <MdEvent /> {guest.evento_nome}
                              </span>
                            )}
                            {guest.whatsapp && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1">
                                <MdWhatsapp /> {guest.whatsapp}
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                                guest.status === "confirmado"
                                  ? "bg-emerald-500/20 text-emerald-200"
                                  : "bg-amber-500/20 text-amber-200"
                              }`}
                            >
                              {guest.status === "confirmado" ? "Confirmado" : "Pendente"}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-white/50">
                          {guest.criado_em
                            ? new Date(guest.criado_em).toLocaleString("pt-BR")
                            : ""}
                        </div>
                      </div>
                    ))}

                    {filteredGuests.length === 0 && (
                      <div className="text-center py-16 border border-dashed border-white/20 rounded-3xl">
                        <MdPeople className="mx-auto text-5xl text-white/20 mb-4" />
                        <p className="text-white/60">
                          Nenhum convidado encontrado com os filtros atuais.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <aside className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Eventos associados</h3>
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                {eventos.length === 0 && (
                  <p className="text-sm text-white/60">
                    Nenhum evento futuro configurado para este promoter.
                  </p>
                )}
                {eventos.map((evento) => (
                  <div
                    key={evento.relacionamento_id}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
                  >
                    <p className="font-semibold text-white">
                      {evento.nome_do_evento}
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      {evento.data_evento
                        ? `${new Date(
                            (evento.data_evento || "").includes("T")
                              ? evento.data_evento || ""
                              : `${evento.data_evento}T12:00:00`,
                          ).toLocaleDateString("pt-BR")} às ${
                            evento.hora_do_evento
                          }`
                        : `Horário: ${evento.hora_do_evento}`}
                    </p>
                    {evento.establishment_name && (
                      <p className="text-xs text-purple-200 mt-1">
                        {evento.establishment_name}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide">
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-1 text-purple-200">
                        {evento.tipo_evento === "semanal"
                          ? "Evento semanal"
                          : evento.tipo_evento}
                      </span>
                      {evento.funcao && (
                        <span className="inline-flex rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">
                          Função: {evento.funcao}
                        </span>
                      )}
                      {evento.status && (
                        <span
                          className={`inline-flex rounded-full px-2 py-1 ${
                            evento.status === "ativo"
                              ? "bg-emerald-500/20 text-emerald-200"
                              : "bg-amber-500/20 text-amber-200"
                          }`}
                        >
                          Status: {evento.status}
                        </span>
                      )}
                    </div>
                    {evento.observacoes && (
                      <p className="mt-3 text-xs text-white/60 border-t border-white/10 pt-2">
                        {evento.observacoes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4"
            >
              <h3 className="text-lg font-semibold">Brindes e Comissões</h3>
              {eventoAtual ? (
                <div className="space-y-4">
                  <div className="text-sm text-white/70">
                    <p className="font-semibold text-white mb-2">
                      Evento: {eventoAtual.nome_do_evento}
                    </p>
                    <p className="mb-3">
                      Check-ins realizados: <span className="font-bold text-purple-300">{giftsData.checkinsCount}</span>
                    </p>
                  </div>
                  
                  {brindesPorcentagemValor.length > 0 ? (
                    <div className="space-y-3">
                      {brindesPorcentagemValor.map((brinde, idx) => {
                        const isLiberado = brinde.liberado === true;
                        const progresso = brinde.progresso || (isLiberado ? 100 : (giftsData.checkinsCount / brinde.checkins_necessarios) * 100);
                        const faltam = brinde.faltam || Math.max(0, brinde.checkins_necessarios - giftsData.checkinsCount);
                        
                        return (
                          <div
                            key={brinde.id || idx}
                            className={`rounded-lg p-3 border-2 ${
                              isLiberado
                                ? 'border-green-500/50 bg-green-500/10'
                                : 'border-white/20 bg-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-white text-sm">{brinde.descricao}</span>
                              {isLiberado && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                                  ✅ Liberado
                                </span>
                              )}
                            </div>
                            {!isLiberado && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-white/60">
                                  <span>Progresso: {giftsData.checkinsCount} / {brinde.checkins_necessarios}</span>
                                  <span>{Math.round(progresso)}%</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2">
                                  <div
                                    className="bg-purple-500 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, progresso)}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-purple-300">
                                  Faltam {faltam} check-ins
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">
                      Nenhum brinde de porcentagem ou valor configurado para este evento.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/60">
                  Selecione um evento para ver seus brindes e comissões.
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-700/40 to-purple-500/30 p-6"
            >
              <h3 className="text-lg font-semibold mb-3">Benefícios e Brindes</h3>
              {eventoAtual ? (
                brindesBeneficios.length > 0 ? (
                  <div className="space-y-3">
                    {brindesBeneficios.map((brinde, idx) => {
                      const isLiberado = brinde.liberado === true;
                      const progresso = brinde.progresso || (isLiberado ? 100 : (giftsData.checkinsCount / brinde.checkins_necessarios) * 100);
                      const faltam = brinde.faltam || Math.max(0, brinde.checkins_necessarios - giftsData.checkinsCount);
                      
                      return (
                        <div
                          key={brinde.id || idx}
                          className={`rounded-lg p-3 border-2 ${
                            isLiberado
                              ? 'border-yellow-500/50 bg-yellow-500/10'
                              : 'border-white/20 bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white text-sm">🎁 {brinde.descricao}</span>
                            {isLiberado && (
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                                ✅ Disponível
                              </span>
                            )}
                          </div>
                          {!isLiberado && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-white/80">
                                <span>{giftsData.checkinsCount} / {brinde.checkins_necessarios} check-ins</span>
                                <span>{Math.round(progresso)}%</span>
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                  className="bg-yellow-400 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, progresso)}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-yellow-200">
                                Faltam {faltam} check-ins
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-white/80">
                    Nenhum benefício ou brinde configurado para este evento.
                  </p>
                )
              ) : (
                <ul className="space-y-2 text-sm text-white/80">
                  <li>• Selecione um evento para ver seus benefícios disponíveis.</li>
                  <li>• Os brindes são liberados automaticamente ao atingir o número de check-ins necessário.</li>
                </ul>
              )}
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  );
}

