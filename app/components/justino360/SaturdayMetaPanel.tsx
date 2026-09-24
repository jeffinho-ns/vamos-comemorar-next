"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { j360Fetch } from "../../lib/justino360/api";
import { SaturdaySalesSheet } from "./SaturdaySalesSheet";
import {
  CARD,
  DraftSale,
  FIELD,
  GOLD,
  blankSale,
  brl,
  moneyText,
  parseCount,
  parseMoney,
  upcomingSaturday,
} from "./saturdayEntry";

type Sale = {
  id: number;
  position: number;
  waiter_name: string;
  waiter_code: string | null;
  amount: number;
  service_fee?: number;
  people_count?: number | null;
  bonus_total?: number;
  hit_individual?: boolean;
};

type Day = {
  service_date: string;
  reservations_confirmed: number | null;
  walkin_expected: number | null;
  people_expected: number | null;
  ticket_expected: number | null;
  revenue_goal: number | null;
  people_real: number | null;
  revenue_real: number | null;
  waiters_scheduled: number | null;
  sales: Sale[];
  bonus: {
    tier: { label: string } | null;
    cost: { full_total: number };
    leadership: { gerente: number; chefe_fila: number };
    raffle: { per_sector: number };
    winners: Sale[];
  };
};

type HistoryDay = {
  service_date: string;
  people_expected: number | null;
  revenue_goal: number | null;
  revenue_real: number | null;
};

type Rank = { rank: number; waiter_name: string; total: number; wins: number };

const STEPS = [
  { id: "planejar", label: "Planejar" },
  { id: "lancar", label: "Lançar" },
  { id: "fechar", label: "Fechar" },
  { id: "resultado", label: "Resultado" },
] as const;

type Step = (typeof STEPS)[number]["id"];

function draftsFrom(sales: Sale[]): DraftSale[] {
  if (!sales.length) return [blankSale()];
  return sales.map((sale) => ({
    key: String(sale.id),
    name: sale.waiter_name,
    code: sale.waiter_code || "",
    amount: moneyText(sale.amount),
    fee: sale.service_fee ? moneyText(sale.service_fee) : "",
    people: sale.people_count == null ? "" : String(sale.people_count),
  }));
}

export function SaturdayMetaPanel({ canManage }: { canManage: boolean }) {
  const [step, setStep] = useState<Step>("planejar");
  const [date, setDate] = useState(upcomingSaturday);
  const [day, setDay] = useState<Day | null>(null);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [ranking, setRanking] = useState<Rank[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [reservations, setReservations] = useState("");
  const [walkin, setWalkin] = useState("");
  const [ticket, setTicket] = useState("145");
  const [waiters, setWaiters] = useState("");
  const [peopleReal, setPeopleReal] = useState("");
  const [revenueReal, setRevenueReal] = useState("");
  const [rows, setRows] = useState<DraftSale[]>([blankSale()]);

  const applyDay = useCallback((next: Day) => {
    setDay(next);
    setReservations(next.reservations_confirmed == null ? "" : String(next.reservations_confirmed));
    setWalkin(next.walkin_expected == null ? "" : String(next.walkin_expected));
    setTicket(next.ticket_expected == null ? "145" : String(next.ticket_expected));
    setWaiters(next.waiters_scheduled == null ? "" : String(next.waiters_scheduled));
    setPeopleReal(next.people_real == null ? "" : String(next.people_real));
    setRevenueReal(next.revenue_real == null ? "" : moneyText(next.revenue_real));
    setRows(draftsFrom(next.sales || []));
  }, []);

  const loadDay = useCallback(async (serviceDate: string) => {
    const res = await j360Fetch<Day>(`/saturday/${serviceDate}`);
    if (!res.success || !res.data) {
      setDay(null);
      setReservations("");
      setWalkin("");
      setTicket("145");
      setWaiters("");
      setPeopleReal("");
      setRevenueReal("");
      setRows([blankSale()]);
      return;
    }
    applyDay(res.data);
  }, [applyDay]);

  useEffect(() => {
    j360Fetch<HistoryDay[]>("/saturday").then((res) => {
      if (res.success && res.data) setHistory(res.data);
    });
    j360Fetch<Rank[]>("/saturday/ranking").then((res) => {
      if (res.success && res.data) setRanking(res.data);
    });
    loadDay(date);
  }, [date, loadDay]);

  const peopleExpected = (parseCount(reservations) || 0) + (parseCount(walkin) || 0);
  const ticketValue = parseMoney(ticket) || 0;
  const waiterCount = parseCount(waiters) || 0;
  const goal = peopleExpected > 0 && ticketValue > 0 ? Math.round(peopleExpected * ticketValue * 100) / 100 : Number(day?.revenue_goal || 0);
  const individual = waiterCount > 0 && goal > 0 ? goal / waiterCount : 0;

  async function savePlan(event: FormEvent) {
    event.preventDefault();
    const res = await j360Fetch<Day>(`/saturday/${date}`, {
      method: "PUT",
      body: JSON.stringify({
        reservations_confirmed: parseCount(reservations),
        walkin_expected: parseCount(walkin),
        people_expected: peopleExpected || null,
        ticket_expected: ticketValue || null,
        waiters_scheduled: waiterCount || null,
        revenue_goal: goal || null,
        people_real: parseCount(peopleReal),
        revenue_real: parseMoney(revenueReal),
      }),
    });
    setMessage(res.success ? "Meta do sábado salva." : res.message || "Não foi possível salvar.");
    if (res.success && res.data) applyDay(res.data);
  }

  async function saveSheet() {
    const sales = rows
      .filter((row) => row.name.trim())
      .map((row) => ({
        waiter_name: row.name.trim(),
        waiter_code: row.code.trim(),
        amount: parseMoney(row.amount),
        service_fee: parseMoney(row.fee) || 0,
        people_count: parseCount(row.people),
      }));
    const invalid = sales.find((sale) => sale.amount == null);
    if (invalid) {
      setMessage(`Informe a venda de ${invalid.waiter_name}. Use vírgula, como 12.099,60.`);
      return;
    }
    const res = await j360Fetch<Day>(`/saturday/${date}/sales`, {
      method: "PUT",
      body: JSON.stringify({ sales }),
    });
    setMessage(res.success ? "Lançamentos salvos." : res.message || "Não foi possível salvar.");
    if (res.success && res.data) {
      applyDay(res.data);
      const rank = await j360Fetch<Rank[]>("/saturday/ranking");
      if (rank.success && rank.data) setRanking(rank.data);
    }
  }

  async function saveClose(event: FormEvent) {
    event.preventDefault();
    const res = await j360Fetch<Day>(`/saturday/${date}`, {
      method: "PUT",
      body: JSON.stringify({
        reservations_confirmed: parseCount(reservations),
        walkin_expected: parseCount(walkin),
        people_expected: peopleExpected || null,
        ticket_expected: ticketValue || null,
        waiters_scheduled: waiterCount || null,
        revenue_goal: goal || null,
        people_real: parseCount(peopleReal),
        revenue_real: parseMoney(revenueReal),
      }),
    });
    setMessage(res.success ? "Fechamento salvo." : res.message || "Não foi possível salvar.");
    if (res.success && res.data) applyDay(res.data);
  }

  const realValue = parseMoney(revenueReal) || 0;
  const hitRate = goal > 0 && realValue > 0 ? Math.round((realValue / goal) * 1000) / 10 : null;
  const gap = realValue - goal;
  const winners = day?.bonus?.winners || day?.sales || [];

  return (
    <div className="space-y-4 pb-8 text-white">
      <p className="text-sm text-zinc-300">
        O sábado começa aqui. Primeiro a meta, depois a venda de cada garçom, e no fim o faturamento real.
      </p>
      {message && <p className="rounded-2xl bg-[#e2b657]/15 px-4 py-3 text-sm text-[#e2b657]">{message}</p>}
      {!canManage && (
        <p className="text-sm text-zinc-400">Você pode consultar. Quem gerencia a casa é quem salva os números.</p>
      )}
      <label className="block text-xs uppercase tracking-wide text-zinc-500">
        Sábado
        <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className={FIELD} />
      </label>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STEPS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStep(item.id)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${step === item.id ? "bg-[#e2b657] text-black" : "bg-white/5 text-zinc-300"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {step === "planejar" && (
        <form onSubmit={savePlan} className={`${CARD} space-y-3`}>
          <h2 className="text-xl font-semibold">Planejamento diário</h2>
          <p className="text-sm text-zinc-400">Meta = (reservas confirmadas + walk-in previsto) × ticket esperado.</p>
          <CountField label="Reservas confirmadas" value={reservations} onChange={setReservations} />
          <CountField label="Walk-in previsto" value={walkin} onChange={setWalkin} />
          <label className="block text-xs uppercase tracking-wide text-zinc-500">
            Ticket esperado
            <input inputMode="decimal" value={ticket} onChange={(event) => setTicket(event.target.value)} className={FIELD} />
          </label>
          <div className="flex gap-2">
            {["130", "145"].map((preset) => (
              <button key={preset} type="button" onClick={() => setTicket(preset)} className="min-h-11 flex-1 rounded-full bg-white/5 text-sm">
                R$ {preset}
              </button>
            ))}
          </div>
          <CountField label="Garçons escalados" value={waiters} onChange={setWaiters} />
          <div className="grid grid-cols-2 gap-2">
            <Preview label="Pessoas previstas" value={String(peopleExpected || "—")} />
            <Preview label="Meta individual" value={individual ? brl(individual) : "—"} />
          </div>
          <Preview label="Meta da casa" value={goal ? brl(goal) : "—"} gold />
          <button type="submit" disabled={!canManage} className={GOLD}>Gerar e salvar meta</button>
          {history.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-semibold">Últimos sábados</p>
              {history.slice(0, 6).map((item) => (
                <button
                  key={item.service_date}
                  type="button"
                  onClick={() => setDate(String(item.service_date).slice(0, 10))}
                  className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-black/30 px-3 text-left text-sm"
                >
                  <span>{String(item.service_date).slice(0, 10).split("-").reverse().join("/")}</span>
                  <span className="text-[#e2b657]">{brl(Number(item.revenue_real || item.revenue_goal || 0))}</span>
                </button>
              ))}
            </div>
          )}
        </form>
      )}

      {step === "lancar" && (
        <SaturdaySalesSheet
          rows={rows}
          individualGoal={individual}
          canManage={canManage}
          onChange={(key, patch) => setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))}
          onAdd={() => setRows((current) => [...current, blankSale()])}
          onRemove={(key) => setRows((current) => current.filter((row) => row.key !== key))}
          onSave={saveSheet}
        />
      )}

      {step === "fechar" && (
        <form onSubmit={saveClose} className={`${CARD} space-y-3`}>
          <h2 className="text-xl font-semibold">Fechamento do dia</h2>
          <CountField label="Pessoas reais" value={peopleReal} onChange={setPeopleReal} />
          <label className="block text-xs uppercase tracking-wide text-zinc-500">
            Faturamento real
            <input inputMode="decimal" value={revenueReal} onChange={(event) => setRevenueReal(event.target.value)} className={FIELD} placeholder="0,00" />
          </label>
          <Preview label="Meta" value={brl(goal)} />
          <Preview label="Realizado" value={brl(realValue)} gold />
          <Preview label="Diferença" value={brl(gap)} />
          <p className={`text-4xl font-semibold ${hitRate != null && hitRate >= 100 ? "text-emerald-400" : "text-[#e2b657]"}`}>
            {hitRate == null ? "—" : `${hitRate.toLocaleString("pt-BR")}%`}
          </p>
          <p className="text-sm text-zinc-400">{day?.bonus?.tier?.label || "Meta ainda não batida"}</p>
          <button type="submit" disabled={!canManage} className={GOLD}>Salvar fechamento</button>
        </form>
      )}

      {step === "resultado" && (
        <div className="space-y-3">
          <section className={CARD}>
            <h2 className="text-lg font-semibold">Ranking de hoje</h2>
            <ol className="mt-3 space-y-3">
              {winners.slice(0, 8).map((sale) => (
                <li key={sale.id} className="flex items-center gap-3">
                  <span className="w-6 font-semibold text-[#e2b657]">{sale.position}</span>
                  <span className="min-w-0 flex-1 truncate">{sale.waiter_name}</span>
                  <span className="text-right text-sm">
                    <span className="block font-semibold text-[#e2b657]">{brl(sale.amount)}</span>
                    {sale.bonus_total ? <span className="text-zinc-500">bônus {brl(sale.bonus_total)}</span> : null}
                  </span>
                </li>
              ))}
              {winners.length === 0 && <li className="text-sm text-zinc-500">Salve os lançamentos para ver o ranking.</li>}
            </ol>
          </section>
          <section className={CARD}>
            <h2 className="text-lg font-semibold">Ranking geral</h2>
            <ol className="mt-3 space-y-3">
              {ranking.slice(0, 8).map((row) => (
                <li key={row.rank} className="flex items-center gap-3 text-sm">
                  <span className="w-6 text-[#e2b657]">{row.rank}</span>
                  <span className="min-w-0 flex-1 truncate">{row.waiter_name}</span>
                  <span className="text-[#e2b657]">{brl(row.total)}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className={CARD}>
            <h2 className="text-lg font-semibold">Ganhadores</h2>
            {winners[0] ? (
              <div className="mt-3 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-[#e2b657]">Maior venda</p>
                <p className="mt-2 text-2xl font-semibold">{winners[0].waiter_name}</p>
                <p className="text-3xl font-semibold text-[#e2b657]">{brl(winners[0].amount)}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">O primeiro lugar aparece depois do lançamento.</p>
            )}
            {day?.bonus?.tier && (
              <p className="mt-4 text-center text-sm text-zinc-400">
                Custo do bônus {brl(day.bonus.cost.full_total)}. Gerente {brl(day.bonus.leadership.gerente)}.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function CountField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs uppercase tracking-wide text-zinc-500">
      {label}
      <input inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} className={FIELD} placeholder="0" />
    </label>
  );
}

function Preview({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${gold ? "text-[#e2b657]" : "text-white"}`}>{value}</p>
    </div>
  );
}
