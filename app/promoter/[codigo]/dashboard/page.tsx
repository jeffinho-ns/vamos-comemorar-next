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

  useEffect(() => {
    loadPromoterData();
    loadEventos();
    loadConvidados();
  }, [loadPromoterData, loadEventos, loadConvidados]);

  useEffect(() => {
    let guests = [...convidados];

    if (selectedEvento !== "todos") {
      guests = guests.filter(
        (guest) =>
          (guest.evento_nome || "").toLowerCase() ===
          selectedEvento.toLowerCase(),
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
  }, [convidados, searchTerm, selectedEvento]);

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
              whatsapp: entry.whatsapp || undefined,
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

  const convidadosConfirmados = useMemo(
    () => convidados.filter((guest) => guest.status === "confirmado").length,
    [convidados],
  );

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

  const conversaoPercentual =
    convidados.length > 0
      ? Math.round((convidadosConfirmados / convidados.length) * 100)
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

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-200">
              Convidados totais
            </p>
            <p className="text-3xl font-bold mt-2">{convidados.length}</p>
            <p className="text-xs text-white/60 mt-1">
              Atualizado em tempo real a cada novo cadastro.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-200">
              Confirmados
            </p>
            <p className="text-3xl font-bold mt-2 text-emerald-300">
              {convidadosConfirmados}
            </p>
            <p className="text-xs text-white/60 mt-1">
              {conversaoPercentual}% de confirmação geral.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-200">
              Próximos eventos
            </p>
            <p className="text-3xl font-bold mt-2">{eventos.length}</p>
            <p className="text-xs text-white/60 mt-1">
              Eventos ativos associados à sua lista.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-200">
              Desempenho
            </p>
            <p className="text-3xl font-bold mt-2">
              {convidados.length > 0 ? `${conversaoPercentual}%` : "—"}
            </p>
            <p className="text-xs text-white/60 mt-1">
              Taxa de confirmação geral da lista.
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
                  <button
                    onClick={handleBulkImport}
                    disabled={parsedBulkEntries.length === 0 || bulkLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500 hover:bg-purple-600 transition text-sm font-semibold disabled:opacity-60"
                  >
                    <MdCloudUpload />
                    {bulkLoading ? "Importando..." : "Importar em lote"}
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-xl">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar convidado por nome, WhatsApp ou evento..."
                    className="w-full rounded-2xl bg-white/10 border border-white/10 pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <select
                  value={selectedEvento}
                  onChange={(e) => setSelectedEvento(e.target.value)}
                  className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="todos">Todos os eventos</option>
                  {convidadosPorEvento.map((evento) => (
                    <option key={evento.nome} value={evento.nome}>
                      {evento.nome} ({evento.total})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3">
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

              <div className="mt-8">
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
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  rows={6}
                  placeholder="Cole nomes separados por linha, vírgula ou ponto e vírgula..."
                  className="w-full rounded-2xl bg-white border border-white/10 px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
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
              <h3 className="text-lg font-semibold">Insights rápidos</h3>
              <div className="space-y-3 text-sm text-white/70">
                <p>
                  • Tenha sempre alguns nomes extras: o sistema aceita importação em
                  massa sem limite de convidados.
                </p>
                <p>
                  • Atualize o status dos convidados no evento para garantir check-ins
                  mais rápidos na portaria.
                </p>
                <p>
                  • Use o link público para captar convidados e acompanhe as conversões
                  aqui no painel.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-700/40 to-purple-500/30 p-6"
            >
              <h3 className="text-lg font-semibold mb-3">Ajuda rápida</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li>• Dúvidas sobre o painel? Procure o gerente responsável.</li>
                <li>
                  • Precisa de acesso ao evento? Certifique-se de estar vinculado pela
                  equipe.
                </li>
                <li>
                  • Atualize sua foto e observações enviando ao suporte para manter sua
                  página pública atraente.
                </li>
              </ul>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  );
}

