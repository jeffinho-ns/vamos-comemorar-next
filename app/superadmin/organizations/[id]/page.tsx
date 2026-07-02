"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatBrlFromCents, superadminFetch } from "@/app/utils/superadminApi";

type OrgDetail = {
  organization: Record<string, unknown>;
  establishments: Array<Record<string, unknown>>;
  modules: Array<{ key: string; name: string; is_enabled: boolean }>;
  invoices: Array<Record<string, unknown>>;
  billingEvents: Array<Record<string, unknown>>;
};

export default function SuperadminOrganizationDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState("0");

  const load = useCallback(() => {
    if (!Number.isFinite(id)) return;
    superadminFetch<OrgDetail>(`/organizations/${id}`)
      .then(setDetail)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleModule = async (moduleKey: string, isEnabled: boolean) => {
    await superadminFetch(`/organizations/${id}/modules/${moduleKey}`, {
      method: "PUT",
      body: JSON.stringify({ is_enabled: !isEnabled }),
    });
    load();
  };

  const createInvoice = async () => {
    const amountCents = Math.round(parseFloat(invoiceAmount.replace(",", ".")) * 100);
    await superadminFetch(`/organizations/${id}/invoices`, {
      method: "POST",
      body: JSON.stringify({
        amountCents,
        dueDate: new Date().toISOString().slice(0, 10),
      }),
    });
    load();
  };

  const payInvoice = async (invoiceId: number, amountCents: number) => {
    await superadminFetch(`/invoices/${invoiceId}/payments`, {
      method: "POST",
      body: JSON.stringify({ amountCents, method: "manual" }),
    });
    load();
  };

  const markPastDue = async () => {
    await superadminFetch(`/organizations/${id}/past-due`, { method: "POST" });
    load();
  };

  if (error) return <p className="text-red-400">{error}</p>;
  if (!detail) return <p className="text-slate-400">Carregando…</p>;

  const org = detail.organization;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/superadmin/organizations" className="text-sm text-slate-400 hover:text-white">
          ← Organizações
        </Link>
        <h2 className="mt-2 text-2xl font-bold">{String(org.name)}</h2>
        <p className="text-slate-400">
          {String(org.slug)} · {String(org.status)} · SaaS{" "}
          {org.saas_enabled ? "on" : "off"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={markPastDue}
            className="rounded border border-red-800 px-3 py-1 text-sm text-red-300"
          >
            Marcar inadimplente (past_due)
          </button>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Módulos</h3>
        <div className="flex flex-wrap gap-2">
          {detail.modules.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => toggleModule(m.key, m.is_enabled)}
              className={`rounded-full px-3 py-1 text-sm ${
                m.is_enabled
                  ? "bg-emerald-900/50 text-emerald-300"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {m.key}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Estabelecimentos</h3>
        <ul className="text-sm text-slate-300 space-y-1">
          {detail.establishments.map((e) => (
            <li key={String(e.id)}>
              {String(e.name)} (place {String(e.legacy_place_id ?? "—")})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Faturas</h3>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Valor R$"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-1"
            value={invoiceAmount}
            onChange={(e) => setInvoiceAmount(e.target.value)}
          />
          <button
            type="button"
            onClick={createInvoice}
            className="rounded bg-amber-600 px-3 py-1 text-sm"
          >
            Gerar fatura
          </button>
        </div>
        <div className="space-y-2">
          {detail.invoices.map((inv) => {
            const invId = Number(inv.id);
            const amount = Number(inv.amount_cents);
            const paid = Number(inv.paid_cents || 0);
            return (
              <div
                key={invId}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 p-3 text-sm"
              >
                <div>
                  <span className="font-medium">#{invId}</span>{" "}
                  {formatBrlFromCents(amount)} —{" "}
                  <span className="text-slate-400">{String(inv.status)}</span>
                  {paid > 0 && (
                    <span className="text-emerald-400">
                      {" "}
                      (pago {formatBrlFromCents(paid)})
                    </span>
                  )}
                </div>
                {String(inv.status) !== "paid" && (
                  <button
                    type="button"
                    onClick={() => payInvoice(invId, amount - paid)}
                    className="rounded bg-emerald-700 px-2 py-1 text-xs"
                  >
                    Registrar pagamento manual
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Eventos de billing</h3>
        <ul className="max-h-48 overflow-y-auto text-xs text-slate-500 space-y-1">
          {detail.billingEvents.map((ev) => (
            <li key={String(ev.id)}>
              {String(ev.created_at)} — {String(ev.event_type)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
