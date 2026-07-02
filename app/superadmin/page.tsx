"use client";

import { useEffect, useState } from "react";
import { formatBrlFromCents, superadminFetch } from "../utils/superadminApi";

type DashboardMetrics = {
  mrrCents: number;
  mrrFormatted: string;
  organizationsCount: number;
  activeSubscriptions: number;
  invoicesPending: number;
  invoicesOverdue: number;
  revenueThisMonthFormatted: string;
};

export default function SuperadminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    superadminFetch<DashboardMetrics>("/dashboard")
      .then(setMetrics)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <p className="text-red-400">Erro ao carregar dashboard: {error}</p>
    );
  }

  if (!metrics) {
    return <p className="text-slate-400">Carregando métricas…</p>;
  }

  const cards = [
    { label: "MRR", value: metrics.mrrFormatted },
    { label: "Organizações", value: String(metrics.organizationsCount) },
    { label: "Assinaturas ativas", value: String(metrics.activeSubscriptions) },
    { label: "Faturas pendentes", value: String(metrics.invoicesPending) },
    { label: "Inadimplentes", value: String(metrics.invoicesOverdue) },
    {
      label: "Receita no mês",
      value: metrics.revenueThisMonthFormatted,
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Dashboard financeiro</h2>
      <p className="text-slate-400 mb-8">
        Visão global do SaaS — cobrança manual (PIX/boleto) com registro no
        sistema.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <p className="text-sm text-slate-400">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold text-amber-300">
              {c.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-xs text-slate-500">
        MRR calculado a partir de planos com assinatura active/trialing (
        {formatBrlFromCents(metrics.mrrCents)}).
      </p>
    </div>
  );
}
