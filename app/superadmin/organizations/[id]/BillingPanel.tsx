"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatBrlFromCents, superadminFetch } from "@/app/utils/superadminApi";

type PaymentRow = {
  id: number;
  amount_cents: number;
  paid_at: string | null;
  method: string | null;
  receipt_url: string | null;
  created_at: string;
};

export type InvoiceRow = {
  id: number;
  amount_cents: number;
  paid_cents: number;
  status: string;
  due_date: string | null;
  payments: PaymentRow[];
};

function toInputMoney(cents: number | null | undefined): string {
  return ((Number(cents || 0) || 0) / 100).toFixed(2).replace(".", ",");
}

function parseMoneyToCents(value: string): number {
  const parsed = Math.round(parseFloat(value.replace(",", ".") || "0") * 100);
  return Number.isFinite(parsed) ? parsed : 0;
}

type Props = {
  orgId: number;
  organizationName: string;
  currentMonthlyCents: number;
  invoices: InvoiceRow[];
  billingEvents: Array<Record<string, unknown>>;
  onReload: () => void;
  onError: (msg: string | null) => void;
};

export default function BillingPanel({
  orgId,
  organizationName,
  currentMonthlyCents,
  invoices,
  billingEvents,
  onReload,
  onError,
}: Props) {
  const router = useRouter();
  const [monthlyAmount, setMonthlyAmount] = useState(
    toInputMoney(currentMonthlyCents),
  );
  const [savingMonthly, setSavingMonthly] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState("0,00");
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const deleteConfirmed =
    deleteConfirmText.trim().toLowerCase() ===
    organizationName.trim().toLowerCase();

  const deleteOrganization = async () => {
    if (!deleteConfirmed) return;
    setDeleting(true);
    onError(null);
    try {
      await superadminFetch(`/organizations/${orgId}`, { method: "DELETE" });
      router.push("/superadmin/organizations");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao excluir organização");
      setDeleting(false);
    }
  };

  const saveMonthlyAmount = async () => {
    setSavingMonthly(true);
    onError(null);
    try {
      await superadminFetch(`/organizations/${orgId}/subscription`, {
        method: "PATCH",
        body: JSON.stringify({
          monthlyAmountCents: parseMoneyToCents(monthlyAmount),
        }),
      });
      onReload();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao salvar mensalidade");
    } finally {
      setSavingMonthly(false);
    }
  };

  const createInvoice = async () => {
    onError(null);
    try {
      await superadminFetch(`/organizations/${orgId}/invoices`, {
        method: "POST",
        body: JSON.stringify({
          amountCents: parseMoneyToCents(invoiceAmount),
          dueDate: new Date().toISOString().slice(0, 10),
        }),
      });
      onReload();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao gerar fatura");
    }
  };

  const payInvoice = async (invoiceId: number, amountCents: number) => {
    setPayingInvoiceId(invoiceId);
    onError(null);
    try {
      await superadminFetch(`/invoices/${invoiceId}/payments`, {
        method: "POST",
        body: JSON.stringify({ amountCents, method: "manual" }),
      });
      onReload();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao registrar pagamento");
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const markPastDue = async () => {
    if (!confirm("Marcar esta organização como inadimplente (past_due)?")) return;
    onError(null);
    try {
      await superadminFetch(`/organizations/${orgId}/past-due`, { method: "POST" });
      onReload();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao marcar inadimplência");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Mensalidade</h3>
            <p className="text-sm text-slate-400">
              Valor que conta para sua receita mensal. Atual:{" "}
              {formatBrlFromCents(currentMonthlyCents)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/superadmin/billing"
              className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-amber-700"
            >
              Ver no faturamento
            </Link>
            <button
              type="button"
              onClick={markPastDue}
              className="rounded border border-red-800 px-3 py-2 text-sm text-red-300 hover:bg-red-950"
            >
              Marcar inadimplente
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Ex: 1490,00"
          />
          <button
            type="button"
            onClick={saveMonthlyAmount}
            disabled={savingMonthly}
            className="rounded bg-amber-600 px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {savingMonthly ? "Salvando…" : "Salvar mensalidade"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-3 text-lg font-semibold">Faturas</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Valor da fatura (R$)"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
            value={invoiceAmount}
            onChange={(e) => setInvoiceAmount(e.target.value)}
          />
          <button
            type="button"
            onClick={createInvoice}
            className="rounded bg-amber-600 px-3 py-2 text-sm"
          >
            Gerar fatura
          </button>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma fatura ainda.</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => {
              const amount = Number(inv.amount_cents);
              const paid = Number(inv.paid_cents || 0);
              const remaining = Math.max(amount - paid, 0);
              return (
                <div key={inv.id} className="rounded border border-slate-800 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        Fatura #{inv.id} · {formatBrlFromCents(amount)}
                      </p>
                      <p className="text-slate-400">
                        Status: {inv.status} · Pago: {formatBrlFromCents(paid)} ·
                        Aberto: {formatBrlFromCents(remaining)}
                      </p>
                    </div>
                    {remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => payInvoice(Number(inv.id), remaining)}
                        disabled={payingInvoiceId === Number(inv.id)}
                        className="rounded bg-emerald-700 px-3 py-1 text-xs disabled:opacity-50"
                      >
                        {payingInvoiceId === Number(inv.id)
                          ? "Registrando…"
                          : `Registrar pagamento de ${formatBrlFromCents(remaining)}`}
                      </button>
                    )}
                  </div>
                  {Array.isArray(inv.payments) && inv.payments.length > 0 && (
                    <div className="mt-3 rounded bg-slate-950/60 p-3">
                      <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                        Histórico de pagamentos
                      </p>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {inv.payments.map((pay) => (
                          <li key={pay.id}>
                            {pay.paid_at || pay.created_at} · {pay.method || "manual"} ·{" "}
                            {formatBrlFromCents(Number(pay.amount_cents))}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-3 text-lg font-semibold">Eventos de billing</h3>
        {billingEvents.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum evento registrado.</p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-500">
            {billingEvents.map((ev) => (
              <li key={String(ev.id)}>
                {String(ev.created_at)} — {String(ev.event_type)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-red-900/70 bg-red-950/20 p-4">
        <h3 className="text-lg font-semibold text-red-200">Excluir organização</h3>
        <p className="mt-1 text-sm text-slate-300">
          A exclusão é <strong>segura</strong>: todos os estabelecimentos são
          arquivados, todos os usuários perdem acesso e a assinatura é cancelada.
          O histórico (reservas, faturas, pagamentos) é preservado.
        </p>
        <div className="mt-4">
          <label className="mb-1 block text-xs text-slate-400">
            Para confirmar, digite o nome da organização:{" "}
            <strong className="text-slate-200">{organizationName}</strong>
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder={organizationName}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            <button
              type="button"
              disabled={deleting || !deleteConfirmed}
              onClick={deleteOrganization}
              className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {deleting ? "Excluindo…" : "Excluir organização"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
