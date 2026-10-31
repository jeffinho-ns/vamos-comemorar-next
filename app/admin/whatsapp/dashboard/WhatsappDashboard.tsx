"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FunilBarras } from "./FunilBarras";
import { MapaCalor } from "./MapaCalor";
import { OperacaoPainel } from "./OperacaoPainel";
import { dataCurta, fmt1, fmtHoras, fmtInt, fmtPct, fmtVar, ultimaJanela } from "./format";
import type { CasaOpcao, WhatsappDashboardSummary } from "./tipos";

type Props = {
  summary: WhatsappDashboardSummary | null;
  loading: boolean;
  startDate: string;
  endDate: string;
  onStartDate: (value: string) => void;
  onEndDate: (value: string) => void;
  establishmentId: number | "";
  casas: CasaOpcao[];
  onEstablishmentId: (value: number | "") => void;
  onAtualizar: () => void;
};

function Kpi({
  titulo,
  valor,
  nota,
}: {
  titulo: string;
  valor: string;
  nota?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{valor}</p>
      {nota ? <p className="mt-1 text-[11px] text-slate-500">{nota}</p> : null}
    </div>
  );
}

export function WhatsappDashboard({
  summary,
  loading,
  startDate,
  endDate,
  onStartDate,
  onEndDate,
  establishmentId,
  casas,
  onEstablishmentId,
  onAtualizar,
}: Props) {
  const [aba, setAba] = useState<"vendas" | "operacao">("vendas");
  const kpis = summary?.kpis;
  const funil = summary?.funil ?? [];
  const origens = summary?.origens ?? [];
  const temas = summary?.temas ?? [];
  const maxTema = Math.max(1, ...temas.map((t) => t.n));
  const ia = summary?.ia;
  const status = summary?.statusReservas;
  const serie = useMemo(
    () => (summary?.serie ?? []).map((p) => ({ ...p, label: dataCurta(p.date) })),
    [summary?.serie],
  );
  const taxaConversao = kpis?.conversas ? ((summary?.reservations_whatsapp ?? 0) / kpis.conversas) * 100 : 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Dashboard do atendimento</h2>
          <p className="text-xs text-slate-500">
            Conversas do WhatsApp e reservas do Agilizaiapp no mesmo período.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={establishmentId === "" ? "" : String(establishmentId)}
            onChange={(e) => onEstablishmentId(e.target.value ? Number(e.target.value) : "")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todas as casas</option>
            {casas.map((casa) => (
              <option key={casa.id} value={casa.id}>{casa.name}</option>
            ))}
          </select>
          <button type="button" className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs hover:bg-slate-50" onClick={() => { const j = ultimaJanela(7); onStartDate(j.inicio); onEndDate(j.fim); }}>
            7 dias
          </button>
          <button type="button" className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs hover:bg-slate-50" onClick={() => { const j = ultimaJanela(30); onStartDate(j.inicio); onEndDate(j.fim); }}>
            30 dias
          </button>
          <input type="date" value={startDate} onChange={(e) => onStartDate(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          <input type="date" value={endDate} onChange={(e) => onEndDate(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          <button
            type="button"
            onClick={onAtualizar}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Seções do dashboard" className="flex gap-1 border-b border-slate-200">
        {([
          { id: "vendas" as const, label: "Vendas" },
          { id: "operacao" as const, label: "Operação" },
        ]).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={aba === item.id}
            onClick={() => setAba(item.id)}
            className={`px-4 py-2 text-sm ${
              aba === item.id
                ? "border-b-2 border-amber-600 font-semibold text-slate-900"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {aba === "operacao" ? <OperacaoPainel summary={summary} /> : (
      <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi titulo="Reservas geradas" valor={fmtInt(kpis?.reservas)} nota={fmtVar(kpis?.variacaoReservasPct)} />
        <Kpi titulo="Pessoas por reserva" valor={fmt1(kpis?.pessoasPorReserva)} nota={`${fmtInt(kpis?.pessoas)} pessoas no período`} />
        <Kpi titulo="Tempo até a reserva" valor={fmtHoras(kpis?.tempoConversaoHoras)} nota="da 1ª mensagem no WhatsApp até gravar a reserva" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Funil de IA</h3>
          <p className="mb-4 text-[11px] text-slate-500">Do primeiro contato à reserva confirmada e ao comparecimento.</p>
          <FunilBarras passos={funil} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Reservas fechadas pela IA</h3>
          <p className="text-2xl font-semibold tabular-nums text-amber-700">{fmtInt(ia?.reservas)}</p>
          <p className="mt-1 text-[11px] text-slate-500">sem handoff para atendente no momento da reserva</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] text-slate-500">Capturadas</p>
              <p className="text-lg font-semibold tabular-nums">{fmtInt(ia?.capturadas)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] text-slate-500">Handoff humano</p>
              <p className="text-lg font-semibold tabular-nums">{fmtInt(ia?.handoff)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Origem das reservas</h3>
            <p className="text-[11px] text-slate-500">Todas as reservas do Agilizaiapp no período, por canal.</p>
          </div>
          <p className="text-xs text-slate-500">{fmtInt(kpis?.reservas)} no total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="pb-2 pr-4">Canal</th>
                <th className="pb-2 pr-4">Reservas</th>
                <th className="pb-2 pr-4">Pessoas</th>
                <th className="pb-2">Participação</th>
              </tr>
            </thead>
            <tbody>
              {origens.length ? origens.map((linha) => (
                <tr key={linha.origem || linha.label} className="border-t border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-800">{linha.label}</td>
                  <td className="py-2 pr-4 tabular-nums">{fmtInt(linha.reservas)}</td>
                  <td className="py-2 pr-4 tabular-nums">{fmtInt(linha.pessoas)}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.max(4, linha.pct)}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-slate-500">{fmtPct(linha.pct)}</span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="py-3 text-sm text-slate-500">Ainda sem reservas neste período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Resultados por origem</h3>
          <p className="mb-3 text-[11px] text-slate-500">Volume de pessoas em cada canal.</p>
          <div className="flex h-10 overflow-hidden rounded-full bg-slate-100">
            {origens.map((linha, i) => (
              <div
                key={linha.label}
                title={`${linha.label}: ${fmtInt(linha.pessoas)} pessoas`}
                className={i % 2 === 0 ? "bg-amber-500" : "bg-slate-700"}
                style={{ width: `${Math.max(linha.pct, 0)}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
            {origens.slice(0, 6).map((linha, i) => (
              <span key={linha.label} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${i % 2 === 0 ? "bg-amber-500" : "bg-slate-700"}`} />
                {linha.label} · {fmtInt(linha.pessoas)} pax
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Taxa de conversão da IA</h3>
          <p className="text-[11px] text-slate-500">reservas WhatsApp ÷ conversas iniciadas</p>
          <div className="mt-3 flex items-center gap-4">
            <div
              className="h-24 w-24 shrink-0 rounded-full"
              style={{
                background: `conic-gradient(#d97706 ${Math.min(100, taxaConversao)}%, #e2e8f0 0)`,
              }}
            />
            <div>
              <p className="text-2xl font-semibold tabular-nums text-slate-900">{fmtPct(taxaConversao)}</p>
              <p className="text-[11px] text-slate-500">{fmtInt(summary?.reservations_whatsapp)} de {fmtInt(kpis?.conversas)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi titulo="Conversas" valor={fmtInt(kpis?.conversas)} nota={fmtVar(kpis?.variacaoConversasPct)} />
        <Kpi titulo="Confirmadas" valor={fmtInt(status?.confirmadas)} />
        <Kpi titulo="Compareceram" valor={fmtInt(status?.compareceram)} />
        <Kpi titulo="Canceladas / no-show" valor={`${fmtInt(status?.canceladas)} / ${fmtInt(status?.noshow)}`} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">O que os clientes mais falam</h3>
        <p className="mb-3 text-[11px] text-slate-500">Intenção detectada nas mensagens recebidas.</p>
        <div className="space-y-2">
          {temas.length ? temas.map((tema) => (
            <div key={tema.tema} className="grid grid-cols-[8rem_minmax(0,1fr)_3rem] items-center gap-2">
              <p className="truncate text-xs text-slate-600">{tema.tema}</p>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.max(6, (tema.n / maxTema) * 100)}%` }} />
              </div>
              <p className="text-right text-xs tabular-nums text-slate-700">{fmtInt(tema.n)}</p>
            </div>
          )) : <p className="text-sm text-slate-500">Ainda sem temas neste período.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Quando as reservas acontecem</h3>
        <p className="mb-3 text-[11px] text-slate-500">Dia da semana × hora em que a reserva foi gravada.</p>
        <MapaCalor heatmap={summary?.heatmap ?? []} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Evolução de conversas e reservas</h3>
        <div className="mt-2 h-56">
          {serie.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="conversas" name="Conversas" stroke="#0f172a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="reservas" name="Reservas" stroke="#d97706" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">Sem série ainda neste período.</p>
          )}
        </div>
      </div>
      </>
      )}
    </section>
  );
}
