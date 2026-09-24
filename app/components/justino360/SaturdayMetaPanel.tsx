"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { j360Fetch } from "../../lib/justino360/api";

type Sale = {
  id: number;
  position: number;
  waiter_name: string;
  waiter_code: string | null;
  amount: number;
  bonus_total?: number;
  bonus_ranking?: number;
  bonus_individual?: number;
  hit_individual?: boolean;
};

type Day = {
  service_date: string;
  people_expected: number | null;
  ticket_expected: number | null;
  revenue_goal: number | null;
  people_real: number | null;
  revenue_real: number | null;
  waiters_scheduled: number | null;
  sales: Sale[];
  bonus: {
    tier: { label: string; trigger: number } | null;
    cost: { ranking: number; individual: number; raffle: number; leadership: number; full_total: number };
    leadership: { gerente: number; chefe_fila: number };
    raffle: { per_sector: number; pot: number };
    winners: Sale[];
  };
};

type Rank = {
  rank: number;
  waiter_name: string;
  total: number;
  appearances: number;
  average: number;
  best_position: number | null;
  wins: number;
};

const CARD = "rounded-3xl border border-white/10 bg-[#121214] p-5 shadow-lg";
const FIELD = "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500";
const GOLD = "w-full rounded-full bg-[#e2b657] px-4 py-3 text-sm font-bold tracking-wide text-black disabled:opacity-40";

function brl(value: number | null | undefined) {
  return (Number(value) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isoDate(value: string) {
  return String(value).slice(0, 10);
}

export function SaturdayMetaPanel({ canManage }: { canManage: boolean }) {
  const [date, setDate] = useState("");
  const [day, setDay] = useState<Day | null>(null);
  const [ranking, setRanking] = useState<Rank[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [people, setPeople] = useState("");
  const [revenue, setRevenue] = useState("");
  const [goal, setGoal] = useState("80000");
  const [ticket, setTicket] = useState("");
  const [waiter, setWaiter] = useState("");
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [rankTab, setRankTab] = useState<"hoje" | "geral">("hoje");

  const loadRanking = useCallback(async () => {
    const res = await j360Fetch<Rank[]>("/saturday/ranking");
    if (res.success && res.data) setRanking(res.data);
  }, []);

  const loadDay = useCallback(async (serviceDate: string) => {
    if (!serviceDate) return;
    const res = await j360Fetch<Day>(`/saturday/${serviceDate}`);
    if (!res.success || !res.data) {
      setDay(null);
      return;
    }
    setDay(res.data);
    setPeople(res.data.people_real == null ? "" : String(res.data.people_real));
    setRevenue(res.data.revenue_real == null ? "" : String(res.data.revenue_real));
    setGoal(res.data.revenue_goal == null ? "80000" : String(res.data.revenue_goal));
    setTicket(res.data.ticket_expected == null ? "" : String(res.data.ticket_expected));
  }, []);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  async function saveDay(event: FormEvent) {
    event.preventDefault();
    if (!date) return;
    const res = await j360Fetch<Day>(`/saturday/${date}`, {
      method: "PUT",
      body: JSON.stringify({
        people_real: people === "" ? null : Number(people),
        revenue_real: revenue === "" ? null : Number(revenue),
        revenue_goal: goal === "" ? null : Number(goal),
        ticket_expected: ticket === "" ? null : Number(ticket),
      }),
    });
    setMessage(res.success ? "Sábado salvo." : res.message || "Não foi possível salvar.");
    if (res.success && res.data) setDay(res.data);
  }

  async function addSale(event: FormEvent) {
    event.preventDefault();
    if (!date) return;
    const res = await j360Fetch<Day>(`/saturday/${date}/sales`, {
      method: "POST",
      body: JSON.stringify({ waiter_name: waiter, waiter_code: code, amount: Number(amount) }),
    });
    setMessage(res.success ? "Venda lançada." : res.message || "Não foi possível lançar.");
    if (res.success && res.data) {
      setDay(res.data);
      setWaiter("");
      setCode("");
      setAmount("");
      loadRanking();
    }
  }

  const ticketReal =
    day?.people_real && day.revenue_real ? Number(day.revenue_real) / Number(day.people_real) : null;
  const rows = day?.bonus?.winners || day?.sales || [];
  const salesTotal = rows.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const goalValue = Number(day?.revenue_goal || goal || 0);
  const realValue = Number(day?.revenue_real || 0);
  const hitRate = goalValue > 0 && realValue > 0 ? Math.round((realValue / goalValue) * 100) : null;
  const winner = rows[0];
  const rankRows = rankTab === "hoje"
    ? rows.slice(0, 8).map((sale) => ({
        key: sale.id,
        place: sale.position,
        name: sale.waiter_name,
        amount: sale.amount,
        hint: sale.bonus_total ? `bônus ${brl(sale.bonus_total)}` : "",
      }))
    : ranking.slice(0, 8).map((row) => ({
        key: row.rank,
        place: row.rank,
        name: row.waiter_name,
        amount: row.total,
        hint: `${row.wins} vitória${row.wins === 1 ? "" : "s"}`,
      }));

  return (
    <div className="space-y-4 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e2b657]">
        Performance 360 · Seu Justino
      </p>
      {message && <p className="text-sm text-[#e2b657]">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={saveDay} className={CARD}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Planejamento diário</h2>
              <p className="text-xs text-zinc-500">{date ? isoDate(date) : "Escolha o sábado"}</p>
            </div>
          </div>
          <label className="mb-3 block text-xs uppercase tracking-wide text-zinc-500">
            Data
            <input type="date" required value={date} onChange={(event) => { setDate(event.target.value); loadDay(event.target.value); }} className={`${FIELD} mt-1`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              Pessoas
              <input value={people} onChange={(event) => setPeople(event.target.value)} className={`${FIELD} mt-1`} />
            </label>
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              Ticket esperado
              <input value={ticket} onChange={(event) => setTicket(event.target.value)} className={`${FIELD} mt-1`} />
            </label>
          </div>
          <p className="mt-4 text-xs uppercase tracking-wide text-zinc-500">Meta do dia</p>
          <p className="text-3xl font-semibold text-[#e2b657]">{brl(Number(goal) || 0)}</p>
          <input value={goal} onChange={(event) => setGoal(event.target.value)} className={`${FIELD} mt-2`} />
          <button type="submit" disabled={!canManage} className={`${GOLD} mt-5`}>
            Salvar planejamento
          </button>
        </form>

        <form onSubmit={saveDay} className={CARD}>
          <h2 className="text-lg font-semibold">Fechamento do dia</h2>
          <p className="text-xs text-zinc-500">{date ? isoDate(date) : "Sábado"}</p>
          <p className="mt-4 text-xs uppercase tracking-wide text-zinc-500">Resultado real</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-zinc-500">Pessoas</p>
              <p className="text-2xl font-semibold">{people || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Ticket médio</p>
              <p className="text-2xl font-semibold">{ticketReal == null ? "—" : brl(ticketReal)}</p>
            </div>
          </div>
          <p className="mt-4 text-xs uppercase tracking-wide text-zinc-500">Faturamento real</p>
          <input value={revenue} onChange={(event) => setRevenue(event.target.value)} className={`${FIELD} mt-1 text-lg`} placeholder="0,00" />
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500">Meta</p>
              <p>{brl(goalValue)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Realizado</p>
              <p>{brl(realValue)}</p>
            </div>
          </div>
          <p className={`mt-4 text-4xl font-semibold ${hitRate != null && hitRate >= 100 ? "text-emerald-400" : "text-white"}`}>
            {hitRate == null ? "—" : `${hitRate}%`}
          </p>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {day?.bonus.tier ? day.bonus.tier.label : "Meta ainda não batida"}
          </p>
          <button type="submit" disabled={!canManage} className={`${GOLD} mt-5`}>
            Salvar fechamento
          </button>
        </form>

        <section className={CARD}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Vendas dos garçons</h2>
            <span className="text-xs text-zinc-500">{date ? isoDate(date) : ""}</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1fr_auto] bg-black/40 px-3 py-2 text-xs uppercase tracking-wide text-zinc-500">
              <span>Garçom</span>
              <span>Venda</span>
            </div>
            {rows.length === 0 && <p className="px-3 py-4 text-sm text-zinc-500">Nenhuma venda neste sábado.</p>}
            {rows.map((sale) => (
              <div key={sale.id} className="grid grid-cols-[1fr_auto] border-t border-white/5 px-3 py-2 text-sm">
                <span>{sale.position}. {sale.waiter_name}</span>
                <span className="font-medium text-[#e2b657]">{brl(sale.amount)}</span>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_auto] border-t border-white/10 px-3 py-2 text-sm font-semibold">
              <span>Total do dia</span>
              <span>{brl(day?.revenue_real || salesTotal)}</span>
            </div>
          </div>
          <form onSubmit={addSale} className="mt-4 grid gap-2">
            <input placeholder="Nome do garçom" value={waiter} onChange={(event) => setWaiter(event.target.value)} className={FIELD} />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Código" value={code} onChange={(event) => setCode(event.target.value)} className={FIELD} />
              <input placeholder="Valor da venda" value={amount} onChange={(event) => setAmount(event.target.value)} className={FIELD} />
            </div>
            <button type="submit" disabled={!canManage || !date} className={GOLD}>
              Adicionar venda
            </button>
          </form>
        </section>

        <section className={CARD}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Ranking geral</h2>
            <div className="flex rounded-full bg-black/40 p-1 text-xs">
              {(["hoje", "geral"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRankTab(tab)}
                  className={`rounded-full px-3 py-1 capitalize ${rankTab === tab ? "bg-[#e2b657] text-black" : "text-zinc-400"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <ol className="space-y-3">
            {rankRows.map((row) => (
              <li key={row.key} className="flex items-center gap-3">
                <span className="w-6 text-sm font-semibold text-[#e2b657]">{row.place}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xs">
                  {row.name.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1 truncate">{row.name}</span>
                <span className="text-right">
                  <span className="block font-semibold text-[#e2b657]">{brl(row.amount)}</span>
                  {row.hint && <span className="block text-[11px] text-zinc-500">{row.hint}</span>}
                </span>
              </li>
            ))}
            {rankRows.length === 0 && <li className="text-sm text-zinc-500">Ainda não há vendas lançadas.</li>}
          </ol>
        </section>

        <section className={`${CARD} bg-[radial-gradient(circle_at_top,_rgba(226,182,87,0.16),_transparent_45%)]`}>
          <h2 className="text-lg font-semibold">Ganhadores do dia</h2>
          {winner ? (
            <div className="mt-4 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[#e2b657]">Maior venda</p>
              <p className="mt-2 text-2xl font-semibold">{winner.waiter_name}</p>
              <p className="text-3xl font-semibold text-[#e2b657]">{brl(winner.amount)}</p>
              <p className="mt-1 text-sm text-zinc-400">
                Prêmio {brl(winner.bonus_total || 0)}
                {winner.hit_individual ? " · bateu a meta de R$ 8 mil" : ""}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Lance as vendas para ver quem ganhou o sábado.</p>
          )}
          {day?.bonus.tier && (
            <p className="mt-4 text-center text-xs text-zinc-400">
              Gerente {brl(day.bonus.leadership.gerente)} · chefe de fila {brl(day.bonus.leadership.chefe_fila)}
              {day.bonus.raffle.per_sector > 0 ? ` · ${day.bonus.raffle.per_sector} sorteios por setor` : ""}
            </p>
          )}
        </section>

        <section className={CARD}>
          <h2 className="text-lg font-semibold">Dashboard da liderança</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] uppercase text-zinc-500">Meta</p>
              <p className="mt-1 text-sm font-semibold">{brl(goalValue)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-zinc-500">Resultado</p>
              <p className="mt-1 text-sm font-semibold">{brl(realValue)}</p>
            </div>
            <div>
              <p className={`mt-4 text-lg font-semibold ${hitRate != null && hitRate >= 100 ? "text-emerald-400" : "text-[#e2b657]"}`}>
                {hitRate == null ? "—" : `${hitRate}%`}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-zinc-400">
            Custo do bônus {day ? brl(day.bonus.cost.full_total) : brl(0)}. Top 5, meta individual, sorteios e liderança entram quando o degrau é atingido.
          </p>
        </section>
      </div>
    </div>
  );
}
