"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatBrlFromCents, superadminFetch } from "@/app/utils/superadminApi";

type BillingClient = {
  organizationId: number;
  name: string;
  slug: string;
  status: string;
  subscriptionStatus: string | null;
  planName: string | null;
  monthlyAmountCents: number;
  paidThisMonthCents: number;
  paymentCountThisMonth: number;
  openInvoicesCents: number;
  openInvoicesCount: number;
  collectionStatus: "paid" | "partial" | "pending" | "no_billing";
};

type BillingSummary = {
  month: string;
  periodStart: string;
  periodEnd: string;
  totals: {
    expectedMrrCents: number;
    collectedCents: number;
    openCents: number;
    pendingClients: number;
    pastDueClients: number;
  };
  clients: BillingClient[];
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Em dia",
  partial: "Parcial",
  pending: "Pendente",
  no_billing: "Sem valor",
};

const STATUS_CLASS: Record<string, string> = {
  paid: "text-emerald-400",
  partial: "text-amber-400",
  pending: "text-red-400",
  no_billing: "text-slate-500",
};

function defaultMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function SuperadminBillingPage() {
  const [month, setMonth] = useState(defaultMonth);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    superadminFetch<BillingSummary>(`/billing/summary?month=${month}`)
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!summary) return [];
    if (filter === "pending") {
      return summary.clients.filter(
        (c) => c.collectionStatus === "pending" || c.collectionStatus === "partial",
      );
    }
    if (filter === "paid") {
      return summary.clients.filter((c) => c.collectionStatus === "paid");
    }
    return summary.clients;
  }, [summary, filter]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Faturamento manual</h2>
        <p className="text-slate-400">
          Resumo por cliente no mês — compare mensalidade esperada vs. pagamentos registrados.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Mês de referência</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Filtrar clientes</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendentes / parciais</option>
            <option value="paid">Em dia</option>
          </select>
        </label>
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {loading && <p className="text-slate-400">Carregando…</p>}

      {summary && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 p-4">
              <p className="text-sm text-slate-400">MRR esperado</p>
              <p className="text-xl font-semibold text-amber-300">
                {formatBrlFromCents(summary.totals.expectedMrrCents)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 p-4">
              <p className="text-sm text-slate-400">Recebido no mês</p>
              <p className="text-xl font-semibold text-emerald-400">
                {formatBrlFromCents(summary.totals.collectedCents)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 p-4">
              <p className="text-sm text-slate-400">Faturas em aberto</p>
              <p className="text-xl font-semibold">
                {formatBrlFromCents(summary.totals.openCents)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 p-4">
              <p className="text-sm text-slate-400">Clientes pendentes</p>
              <p className="text-xl font-semibold text-amber-300">
                {summary.totals.pendingClients}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-900 text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Mensalidade</th>
                  <th className="px-4 py-3">Recebido</th>
                  <th className="px-4 py-3">Em aberto</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.organizationId} className="border-t border-slate-800">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-slate-400">{c.planName || "—"}</td>
                    <td className="px-4 py-3">{formatBrlFromCents(c.monthlyAmountCents)}</td>
                    <td className="px-4 py-3">
                      {formatBrlFromCents(c.paidThisMonthCents)}
                      {c.paymentCountThisMonth > 0 && (
                        <span className="ml-1 text-xs text-slate-500">
                          ({c.paymentCountThisMonth} pgto.)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {formatBrlFromCents(c.openInvoicesCents)}
                      {c.openInvoicesCount > 0 && (
                        <span className="ml-1 text-xs text-slate-500">
                          ({c.openInvoicesCount})
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${STATUS_CLASS[c.collectionStatus]}`}>
                      {STATUS_LABEL[c.collectionStatus]}
                      {c.subscriptionStatus === "past_due" && (
                        <span className="ml-1 text-xs text-red-400">past_due</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/superadmin/organizations/${c.organizationId}`}
                        className="text-amber-400 hover:underline"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Nenhum cliente neste filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500">
            Período: {summary.periodStart} a {summary.periodEnd}. Pagamentos registrados no
            intervalo (campo paid_at).
          </p>
        </>
      )}
    </div>
  );
}
