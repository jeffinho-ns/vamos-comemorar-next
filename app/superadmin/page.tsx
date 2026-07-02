"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type BillingClient = {
  organizationId: number;
  name: string;
  collectionStatus: string;
  monthlyAmountCents: number;
  paidThisMonthCents: number;
  subscriptionStatus: string | null;
};

type BillingSummary = {
  month: string;
  totals: {
    expectedMrrCents: number;
    collectedCents: number;
    pendingClients: number;
    pastDueClients: number;
  };
  clients: BillingClient[];
};

type OrgRow = {
  id: number;
  name: string;
  status: string;
  subscription_status: string | null;
};

const QUICK_LINKS = [
  { href: "/superadmin/organizations", label: "Nova organização", desc: "Provisionar cliente" },
  { href: "/superadmin/billing", label: "Faturamento do mês", desc: "Receita por cliente" },
  { href: "/superadmin/training", label: "Materiais", desc: "Links e tutoriais" },
  { href: "/superadmin/impersonate", label: "Modo suporte", desc: "Entrar como usuário" },
];

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function SuperadminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const month = currentMonth();
    Promise.all([
      superadminFetch<DashboardMetrics>("/dashboard"),
      superadminFetch<BillingSummary>(`/billing/summary?month=${month}`),
      superadminFetch<OrgRow[]>("/organizations"),
    ])
      .then(([m, s, o]) => {
        setMetrics(m);
        setSummary(s);
        setOrgs(o);
      })
      .catch((e) => setError(e.message));
  }, []);

  const alerts = useMemo(() => {
    if (!summary || !metrics) return [];
    const items: { tone: "red" | "amber" | "emerald"; text: string; href?: string }[] = [];
    if (summary.totals.pastDueClients > 0) {
      items.push({
        tone: "red",
        text: `${summary.totals.pastDueClients} cliente(s) com assinatura past_due`,
        href: "/superadmin/billing",
      });
    }
    if (summary.totals.pendingClients > 0) {
      items.push({
        tone: "amber",
        text: `${summary.totals.pendingClients} cliente(s) sem recebimento completo no mês`,
        href: "/superadmin/billing",
      });
    }
    if (metrics.invoicesPending > 0) {
      items.push({
        tone: "amber",
        text: `${metrics.invoicesPending} fatura(s) em aberto no sistema`,
        href: "/superadmin/organizations",
      });
    }
    if (items.length === 0) {
      items.push({ tone: "emerald", text: "Nenhum alerta crítico no momento." });
    }
    return items;
  }, [summary, metrics]);

  if (error) {
    return <p className="text-red-400">Erro ao carregar dashboard: {error}</p>;
  }

  if (!metrics || !summary) {
    return <p className="text-slate-400">Carregando métricas…</p>;
  }

  const cards = [
    { label: "MRR esperado", value: metrics.mrrFormatted },
    { label: "Recebido no mês", value: formatBrlFromCents(summary.totals.collectedCents) },
    { label: "Organizações", value: String(metrics.organizationsCount) },
    { label: "Assinaturas ativas", value: String(metrics.activeSubscriptions) },
    { label: "Faturas pendentes", value: String(metrics.invoicesPending) },
    { label: "Inadimplentes", value: String(metrics.invoicesOverdue) },
  ];

  const toneClass = {
    red: "border-red-900/60 bg-red-950/40 text-red-200",
    amber: "border-amber-900/60 bg-amber-950/40 text-amber-200",
    emerald: "border-emerald-900/60 bg-emerald-950/40 text-emerald-200",
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold">Central de administração</h2>
        <p className="mt-1 text-slate-400">
          Visão global do SaaS — cobrança manual com registro no sistema (sem gateway).
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_LINKS.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-amber-700/50"
          >
            <p className="font-medium text-amber-300">{q.label}</p>
            <p className="text-sm text-slate-400">{q.desc}</p>
          </Link>
        ))}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Alertas
        </h3>
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`rounded-lg border px-4 py-3 text-sm ${toneClass[a.tone]}`}
            >
              {a.href ? (
                <Link href={a.href} className="underline-offset-2 hover:underline">
                  {a.text}
                </Link>
              ) : (
                a.text
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <p className="text-sm text-slate-400">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold text-amber-300">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Receita por cliente ({summary.month})</h3>
            <Link href="/superadmin/billing" className="text-sm text-amber-400 hover:underline">
              Ver tudo
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-slate-400">
                <tr>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Mensal</th>
                  <th className="px-3 py-2">Recebido</th>
                </tr>
              </thead>
              <tbody>
                {summary.clients.slice(0, 6).map((c) => (
                  <tr key={c.organizationId} className="border-t border-slate-800">
                    <td className="px-3 py-2">
                      <Link
                        href={`/superadmin/organizations/${c.organizationId}`}
                        className="hover:text-amber-300"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{formatBrlFromCents(c.monthlyAmountCents)}</td>
                    <td className="px-3 py-2">{formatBrlFromCents(c.paidThisMonthCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Organizações recentes</h3>
            <Link href="/superadmin/organizations" className="text-sm text-amber-400 hover:underline">
              Gerenciar
            </Link>
          </div>
          <ul className="space-y-2">
            {orgs.slice(0, 8).map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-sm"
              >
                <Link href={`/superadmin/organizations/${o.id}`} className="hover:text-amber-300">
                  {o.name}
                </Link>
                <span className="text-xs text-slate-500">
                  {o.subscription_status || o.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
