"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdAssessment,
  MdDateRange,
  MdBusiness,
  MdEvent,
  MdCheckCircle,
  MdPeople,
  MdWarning,
  MdTrendingUp,
  MdPieChart,
  MdBarChart,
  MdTableChart,
  MdShowChart,
  MdDownload,
  MdRefresh,
  MdFilterList,
  MdInsights,
  MdStar,
  MdSchedule,
  MdSearch,
} from "react-icons/md";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.agilizaiapp.com.br";

interface Estabelecimento {
  id: number;
  nome: string;
}

interface Evento {
  id: number;
  nome_do_evento: string;
  data_do_evento: string;
  tipo_evento?: string;
}

interface RelatorioEvento {
  tipo: "evento";
  evento: { id: number; nome_do_evento: string; data_do_evento: string };
  resumo: {
    total_pessoas_na_lista: number;
    total_checkins: number;
    taxa_checkin_pct: number;
    total_listas: number;
  };
  por_promoter: Array<{
    promoter_nome: string;
    total_na_lista: number;
    total_checkins: number;
    taxa_checkin_pct: number;
  }>;
  duplicidades: Array<{
    lista: string;
    promoter: string;
    duplicados: Array<{ nome: string; quantidade: number }>;
  }>;
  vip_noite_toda: Array<{ nome: string; promoter: string; data_checkin: string }>;
  horarios_entrada: Array<{
    nome: string;
    promoter: string;
    horario: string;
    tipo_entrada: string;
  }>;
}

interface RelatorioPeriodo {
  tipo: "periodo";
  establishment_id: number;
  periodo: { inicio: string; fim: string };
  resumo: {
    total_checkins: number;
    total_eventos: number;
    dias_periodo: number;
    dias_com_checkin: number;
    dias_com_evento: number;
    media_checkins_por_dia: number;
    media_checkins_por_dia_com_evento: number;
    media_checkins_por_evento: number;
    total_promoters: number;
    total_guests: number;
    total_mesa: number;
    total_large: number;
  };
  por_dia: Array<{
    data: string;
    total_checkins: number;
    checkins_promoters: number;
    checkins_guests: number;
    checkins_mesa: number;
    checkins_large: number;
    eventos: number;
    nomes_eventos: string[];
  }>;
  por_mes: Array<{ mes: string; total: number; dias: number; eventos: number }>;
  analise_estabilidade: {
    dias_com_evento_sem_checkin: number;
    indicador_travamento: string;
  };
  possiveis_anomalias: Array<{
    data: string;
    data_formatada: string;
    eventos: number;
    nomes: string[];
  }>;
  consistencia_validacao: {
    nomes_duplicados_mesmo_dia: number;
    avaliacao: string;
  };
}

type Relatorio = RelatorioEvento | RelatorioPeriodo;

const CORES_CHART = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
];

export default function RelatoriosGeradorPage() {
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [tipoRelatorio, setTipoRelatorio] = useState<"periodo" | "evento">("periodo");
  const [establishmentId, setEstablishmentId] = useState<string>("");
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().slice(0, 10));
  const [eventoId, setEventoId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingEstab, setLoadingEstab] = useState(true);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secoes, setSecoes] = useState({
    resumo: true,
    graficos: true,
    promoters: true,
    duplicidades: true,
    vip: true,
    horarios: true,
    estabilidade: true,
    anomalias: true,
    consistencia: true,
  });

  const getToken = useCallback(() => {
    if (typeof document === "undefined") return "";
    const cookies = document.cookie.split(";");
    const auth = cookies.find((c) => c.trim().startsWith("authToken="));
    if (auth) return auth.split("=")[1]?.trim() || "";
    return localStorage.getItem("authToken") || "";
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/relatorios/estabelecimentos`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.estabelecimentos?.length) {
          setEstabelecimentos(data.estabelecimentos);
          if (!establishmentId && data.estabelecimentos[0])
            setEstablishmentId(String(data.estabelecimentos[0].id));
        }
      })
      .catch((e) => setError("Erro ao carregar estabelecimentos"))
      .finally(() => setLoadingEstab(false));
  }, [getToken]);

  useEffect(() => {
    if (!establishmentId || !dataInicio || !dataFim) {
      setEventos([]);
      return;
    }
    const params = new URLSearchParams({
      establishment_id: establishmentId,
      data_inicio: dataInicio,
      data_fim: dataFim,
    });
    fetch(`${API_URL}/api/relatorios/eventos?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEventos(data.eventos || []);
        else setEventos([]);
      })
      .catch(() => setEventos([]));
  }, [establishmentId, dataInicio, dataFim, getToken]);

  const gerar = async () => {
    setLoading(true);
    setError(null);
    setRelatorio(null);
    try {
      const body: Record<string, unknown> = {
        tipo: tipoRelatorio,
        establishment_id: establishmentId || 7,
        data_inicio: dataInicio,
        data_fim: dataFim,
      };
      if (tipoRelatorio === "evento" && eventoId) body.evento_id = parseInt(eventoId, 10);
      const res = await fetch(`${API_URL}/api/relatorios/gerar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erro ao gerar relatório");
      setRelatorio(data.relatorio);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const exportarJSON = () => {
    if (!relatorio) return;
    const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${relatorio.tipo}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtData = (s: string) =>
    s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : s;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com ilustração */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-indigo-500/20 rounded-2xl">
              <MdAssessment className="w-12 h-12 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Gerador de Relatórios
              </h1>
              <p className="text-slate-400 mt-1">
                Crie relatórios personalizados de check-ins, promoters e desempenho
              </p>
            </div>
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <MdFilterList className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-semibold">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tipo de Relatório</label>
              <select
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value as "periodo" | "evento")}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="periodo">Consolidado (Período)</option>
                <option value="evento">Evento Específico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <MdBusiness className="inline w-4 h-4 mr-1" /> Estabelecimento
              </label>
              <select
                value={establishmentId}
                onChange={(e) => setEstablishmentId(e.target.value)}
                disabled={loadingEstab}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione</option>
                {estabelecimentos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <MdDateRange className="inline w-4 h-4 mr-1" /> Data Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <MdDateRange className="inline w-4 h-4 mr-1" /> Data Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <AnimatePresence>
            {tipoRelatorio === "evento" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <label className="block text-sm text-slate-400 mb-2">
                  <MdEvent className="inline w-4 h-4 mr-1" /> Evento
                </label>
                <select
                  value={eventoId}
                  onChange={(e) => setEventoId(e.target.value)}
                  className="w-full md:max-w-md px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione um evento</option>
                  {eventos.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.nome_do_evento} ({fmtData(ev.data_do_evento)})
                    </option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Seções */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-3">Seções a incluir no relatório:</p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(secoes).map(([key, val]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition"
                >
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) =>
                      setSecoes((s) => ({ ...s, [key]: e.target.checked }))
                    }
                    className="rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="capitalize">{key.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={gerar}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium transition disabled:opacity-50"
            >
              {loading ? (
                <MdRefresh className="w-5 h-5 animate-spin" />
              ) : (
                <MdSearch className="w-5 h-5" />
              )}
              {loading ? "Gerando..." : "Gerar Relatório"}
            </button>
            {relatorio && (
              <button
                onClick={exportarJSON}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition"
              >
                <MdDownload className="w-5 h-5" />
                Exportar JSON
              </button>
            )}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2"
          >
            <MdWarning className="w-5 h-5 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Resultado */}
        <AnimatePresence>
          {relatorio && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {relatorio.tipo === "evento" && (
                <RelatorioEventoView data={relatorio} secoes={secoes} fmtData={fmtData} />
              )}
              {relatorio.tipo === "periodo" && (
                <RelatorioPeriodoView data={relatorio} secoes={secoes} fmtData={fmtData} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!relatorio && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex p-6 bg-slate-800/60 rounded-3xl mb-4">
              <MdInsights className="w-24 h-24 text-slate-600" />
            </div>
            <p className="text-slate-500 text-lg">
              Selecione os filtros e clique em &quot;Gerar Relatório&quot; para ver os resultados
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function RelatorioEventoView({
  data,
  secoes,
  fmtData,
}: {
  data: RelatorioEvento;
  secoes: Record<string, boolean>;
  fmtData: (s: string) => string;
}) {
  const { evento, resumo, por_promoter, duplicidades, vip_noite_toda, horarios_entrada } =
    data;

  return (
    <>
      {secoes.resumo && (
        <SectionCard titulo="Resumo" icone={MdAssessment}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricaCard
              label="Total na lista"
              valor={resumo.total_pessoas_na_lista}
              icone={MdPeople}
            />
            <MetricaCard
              label="Check-ins"
              valor={resumo.total_checkins}
              icone={MdCheckCircle}
            />
            <MetricaCard
              label="Taxa de check-in"
              valor={`${resumo.taxa_checkin_pct}%`}
              icone={MdTrendingUp}
            />
            <MetricaCard
              label="Listas"
              valor={resumo.total_listas}
              icone={MdEvent}
            />
          </div>
          <p className="mt-4 text-slate-400">
            <strong>{evento?.nome_do_evento}</strong> — {fmtData(evento?.data_do_evento)}
          </p>
        </SectionCard>
      )}

      {secoes.graficos && por_promoter?.length > 0 && (
        <SectionCard titulo="Por promoter" icone={MdBarChart}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={por_promoter}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="promoter_nome" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="total_checkins" fill="#6366f1" name="Check-ins" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_na_lista" fill="#8b5cf6" name="Na lista" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {secoes.promoters && por_promoter?.length > 0 && (
        <SectionCard titulo="Desempenho por promoter" icone={MdPeople}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-4">Promoter</th>
                  <th className="text-right py-3 px-4">Na lista</th>
                  <th className="text-right py-3 px-4">Check-ins</th>
                  <th className="text-right py-3 px-4">Taxa %</th>
                </tr>
              </thead>
              <tbody>
                {por_promoter.map((p, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="py-3 px-4">{p.promoter_nome}</td>
                    <td className="text-right py-3 px-4">{p.total_na_lista}</td>
                    <td className="text-right py-3 px-4">{p.total_checkins}</td>
                    <td className="text-right py-3 px-4 font-medium">{p.taxa_checkin_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {secoes.duplicidades && duplicidades?.length > 0 && (
        <SectionCard titulo="Duplicidades" icone={MdWarning}>
          <div className="space-y-4">
            {duplicidades.map((d, i) => (
              <div
                key={i}
                className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
              >
                <p className="font-medium text-amber-400">
                  {d.lista} — {d.promoter}
                </p>
                <ul className="mt-2 text-slate-300 text-sm">
                  {d.duplicados.map((dup, j) => (
                    <li key={j}>
                      • {dup.nome} (x{dup.quantidade})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {secoes.vip && vip_noite_toda?.length > 0 && (
        <SectionCard titulo="VIP noite toda" icone={MdStar}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-4">Nome</th>
                  <th className="text-left py-3 px-4">Promoter</th>
                  <th className="text-left py-3 px-4">Check-in</th>
                </tr>
              </thead>
              <tbody>
                {vip_noite_toda.map((v, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="py-3 px-4">{v.nome}</td>
                    <td className="py-3 px-4">{v.promoter}</td>
                    <td className="py-3 px-4">{v.data_checkin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {secoes.horarios && horarios_entrada?.length > 0 && (
        <SectionCard titulo="Horários de entrada" icone={MdSchedule}>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600 sticky top-0 bg-slate-800">
                  <th className="text-left py-3 px-4">Nome</th>
                  <th className="text-left py-3 px-4">Horário</th>
                  <th className="text-left py-3 px-4">Promoter</th>
                  <th className="text-left py-3 px-4">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {horarios_entrada.map((h, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="py-2 px-4">{h.nome}</td>
                    <td className="py-2 px-4 font-mono">{h.horario}</td>
                    <td className="py-2 px-4">{h.promoter}</td>
                    <td className="py-2 px-4">{h.tipo_entrada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </>
  );
}

function RelatorioPeriodoView({
  data,
  secoes,
  fmtData,
}: {
  data: RelatorioPeriodo;
  secoes: Record<string, boolean>;
  fmtData: (s: string) => string;
}) {
  const {
    resumo,
    por_dia,
    por_mes,
    analise_estabilidade,
    possiveis_anomalias,
    consistencia_validacao,
  } = data;

  const chartDia = por_dia?.map((d) => ({
    data: fmtData(d.data).slice(0, 5),
    total: d.total_checkins,
    promoters: d.checkins_promoters,
    guests: d.checkins_guests,
    mesa: d.checkins_mesa,
    large: d.checkins_large,
  })) || [];

  const pieData = resumo
    ? [
        { name: "Promoters", value: resumo.total_promoters || 0, color: CORES_CHART[0] },
        { name: "Guests", value: resumo.total_guests || 0, color: CORES_CHART[1] },
        { name: "Mesa", value: resumo.total_mesa || 0, color: CORES_CHART[2] },
        { name: "Large", value: resumo.total_large || 0, color: CORES_CHART[3] },
      ].filter((x) => x.value > 0)
    : [];

  return (
    <>
      {secoes.resumo && (
        <SectionCard titulo="Resumo do período" icone={MdAssessment}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <MetricaCard label="Total check-ins" valor={resumo.total_checkins} icone={MdCheckCircle} />
            <MetricaCard label="Total eventos" valor={resumo.total_eventos} icone={MdEvent} />
            <MetricaCard
              label="Média/dia"
              valor={resumo.media_checkins_por_dia}
              icone={MdTrendingUp}
            />
            <MetricaCard
              label="Média/evento"
              valor={resumo.media_checkins_por_evento}
              icone={MdAssessment}
            />
            <MetricaCard
              label="Dias com check-in"
              valor={resumo.dias_com_checkin}
              icone={MdDateRange}
            />
            <MetricaCard
              label="Promoters"
              valor={resumo.total_promoters}
              icone={MdPeople}
            />
          </div>
        </SectionCard>
      )}

      {secoes.graficos && chartDia.length > 0 && (
        <SectionCard titulo="Check-ins por dia" icone={MdBarChart}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="data" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                />
                <Legend />
                <Bar dataKey="total" fill="#6366f1" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="promoters" fill="#8b5cf6" name="Promoters" radius={[4, 4, 0, 0]} />
                <Bar dataKey="guests" fill="#ec4899" name="Guests" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mesa" fill="#f97316" name="Mesa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="large" fill="#22c55e" name="Large" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {secoes.graficos && por_mes?.length > 0 && (
        <SectionCard titulo="Check-ins por mês" icone={MdShowChart}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={por_mes.map((m) => ({
                  mes: m.mes,
                  total: m.total,
                  eventos: m.eventos,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#6366f1" name="Check-ins" strokeWidth={2} />
                <Line type="monotone" dataKey="eventos" stroke="#22c55e" name="Eventos" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {secoes.graficos && pieData.length > 0 && (
        <SectionCard titulo="Distribuição por tipo" icone={MdPieChart}>
          <div className="h-80 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {secoes.estabilidade && (
        <SectionCard titulo="Estabilidade" icone={MdTrendingUp}>
          <div className="p-4 bg-slate-800/50 rounded-xl">
            <p className="text-slate-300">
              {analise_estabilidade?.indicador_travamento || "N/A"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Dias com evento e sem check-in: {analise_estabilidade?.dias_com_evento_sem_checkin ?? 0}
            </p>
          </div>
        </SectionCard>
      )}

      {secoes.anomalias && possiveis_anomalias?.length > 0 && (
        <SectionCard titulo="Possíveis anomalias" icone={MdWarning}>
          <div className="space-y-3">
            {possiveis_anomalias.map((a, i) => (
              <div
                key={i}
                className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
              >
                <p className="font-medium text-amber-400">
                  {a.data_formatada} — {a.eventos} evento(s)
                </p>
                {a.nomes?.length > 0 && (
                  <p className="text-sm text-slate-400 mt-1">
                    {a.nomes.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {secoes.consistencia && (
        <SectionCard titulo="Consistência de validação" icone={MdCheckCircle}>
          <div className="p-4 bg-slate-800/50 rounded-xl">
            <p className="text-slate-300">
              {consistencia_validacao?.avaliacao || "N/A"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Nomes duplicados mesmo dia: {consistencia_validacao?.nomes_duplicados_mesmo_dia ?? 0}
            </p>
          </div>
        </SectionCard>
      )}

      {secoes.graficos && por_dia?.length > 0 && (
        <SectionCard titulo="Tabela detalhada por dia" icone={MdTableChart}>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-right py-3 px-4">Promoters</th>
                  <th className="text-right py-3 px-4">Guests</th>
                  <th className="text-right py-3 px-4">Mesa</th>
                  <th className="text-right py-3 px-4">Large</th>
                  <th className="text-right py-3 px-4">Eventos</th>
                </tr>
              </thead>
              <tbody>
                {por_dia.map((d, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="py-2 px-4">{fmtData(d.data)}</td>
                    <td className="text-right py-2 px-4">{d.total_checkins}</td>
                    <td className="text-right py-2 px-4">{d.checkins_promoters}</td>
                    <td className="text-right py-2 px-4">{d.checkins_guests}</td>
                    <td className="text-right py-2 px-4">{d.checkins_mesa}</td>
                    <td className="text-right py-2 px-4">{d.checkins_large}</td>
                    <td className="text-right py-2 px-4">{d.eventos || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </>
  );
}

function SectionCard({
  titulo,
  icone: Icon,
  children,
}: {
  titulo: string;
  icone: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold">{titulo}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function MetricaCard({
  label,
  valor,
  icone: Icon,
}: {
  label: string;
  valor: number | string;
  icone: React.ElementType;
}) {
  return (
    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="text-2xl font-bold text-white">{valor}</p>
    </div>
  );
}
