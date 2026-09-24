"use client";

import { DraftSale, FIELD, GOLD, brl, parseCount, parseMoney } from "./saturdayEntry";

export function SaturdaySalesSheet({
  rows,
  individualGoal,
  canManage,
  onChange,
  onAdd,
  onRemove,
  onSave,
}: {
  rows: DraftSale[];
  individualGoal: number;
  canManage: boolean;
  onChange: (key: string, patch: Partial<DraftSale>) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
  onSave: () => void;
}) {
  const sales = rows.reduce((sum, row) => sum + (parseMoney(row.amount) || 0), 0);
  const fees = rows.reduce((sum, row) => sum + (parseMoney(row.fee) || 0), 0);
  const people = rows.reduce((sum, row) => sum + (parseCount(row.people) || 0), 0);
  const billed = sales + fees;
  const individual = individualGoal;

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Total label="Vendas" value={brl(sales)} tone="text-[#e2b657]" />
        <Total label="Taxa" value={brl(fees)} />
        <Total label="Faturamento" value={brl(billed)} tone="text-emerald-400" />
        <Total label="Pessoas" value={String(people)} />
      </div>
      <p className="text-sm text-zinc-400">
        Digite como na planilha: nome, código do caixa, venda e, se tiver, a taxa e as pessoas.
      </p>
      {rows.map((row, index) => {
        const amount = parseMoney(row.amount) || 0;
        const fee = parseMoney(row.fee) || 0;
        const count = parseCount(row.people);
        const ticket = count ? amount / count : null;
        const dayShare = sales > 0 ? Math.round((amount / sales) * 1000) / 10 : 0;
        const metaShare = individual > 0 ? Math.round((amount / individual) * 1000) / 10 : 0;
        return (
          <article key={row.key} className="rounded-3xl border border-white/10 bg-[#121214] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#e2b657]">{index + 1}º lançamento</p>
              <button type="button" onClick={() => onRemove(row.key)} className="min-h-11 px-2 text-sm text-zinc-400">
                Remover
              </button>
            </div>
            <label className="block text-xs uppercase tracking-wide text-zinc-500">
              Garçom
              <input value={row.name} onChange={(event) => onChange(row.key, { name: event.target.value })} className={FIELD} placeholder="Nome" autoCapitalize="words" />
            </label>
            <label className="mt-3 block text-xs uppercase tracking-wide text-zinc-500">
              Código
              <input value={row.code} onChange={(event) => onChange(row.key, { code: event.target.value })} className={FIELD} placeholder="Código do caixa" autoCapitalize="none" />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs uppercase tracking-wide text-zinc-500">
                Venda (R$)
                <input inputMode="decimal" value={row.amount} onChange={(event) => onChange(row.key, { amount: event.target.value })} className={FIELD} placeholder="0,00" />
              </label>
              <label className="text-xs uppercase tracking-wide text-zinc-500">
                Taxa (R$)
                <input inputMode="decimal" value={row.fee} onChange={(event) => onChange(row.key, { fee: event.target.value })} className={FIELD} placeholder="0,00" />
              </label>
            </div>
            <label className="mt-3 block text-xs uppercase tracking-wide text-zinc-500">
              Pessoas
              <input inputMode="numeric" value={row.people} onChange={(event) => onChange(row.key, { people: event.target.value })} className={FIELD} placeholder="0" />
            </label>
            <p className="mt-3 text-sm text-zinc-400">
              Com taxa {brl(amount + fee)}
              {ticket != null ? ` · ticket ${brl(ticket)}` : ""}
              {` · ${dayShare.toLocaleString("pt-BR")}% do dia`}
              {individual > 0 ? ` · ${metaShare.toLocaleString("pt-BR")}% da meta` : ""}
            </p>
          </article>
        );
      })}
      <button type="button" onClick={onAdd} className="min-h-12 w-full rounded-full border border-[#e2b657]/50 text-base font-semibold text-[#e2b657]">
        Adicionar garçom
      </button>
      <button type="button" disabled={!canManage} onClick={onSave} className={GOLD}>
        Salvar lançamentos
      </button>
    </section>
  );
}

function Total({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121214] p-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
