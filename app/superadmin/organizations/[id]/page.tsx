"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatBrlFromCents, superadminFetch } from "@/app/utils/superadminApi";
import { applyImpersonationSession } from "@/app/utils/impersonation";

type OrgUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type MembershipRow = {
  id: number;
  user_email: string;
  user_name: string;
  role_key: string;
  role_name: string;
  establishment_name: string | null;
  is_active: boolean;
};

type PaymentRow = {
  id: number;
  amount_cents: number;
  paid_at: string | null;
  method: string | null;
  receipt_url: string | null;
  created_at: string;
};

type InvoiceRow = {
  id: number;
  amount_cents: number;
  paid_cents: number;
  status: string;
  due_date: string | null;
  payments: PaymentRow[];
};

type OrgDetail = {
  organization: Record<string, unknown>;
  establishments: Array<Record<string, unknown>>;
  modules: Array<{ key: string; name: string; is_enabled: boolean }>;
  invoices: InvoiceRow[];
  billingEvents: Array<Record<string, unknown>>;
};

function toInputMoney(cents: number | null | undefined): string {
  return ((Number(cents || 0) || 0) / 100).toFixed(2).replace(".", ",");
}

function parseMoneyToCents(value: string): number {
  const parsed = Math.round(parseFloat(value.replace(",", ".") || "0") * 100);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function SuperadminOrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("recepcao");
  const [addingMember, setAddingMember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState("0,00");
  const [monthlyAmount, setMonthlyAmount] = useState("0,00");
  const [savingMonthly, setSavingMonthly] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!Number.isFinite(id)) return;
    superadminFetch<OrgDetail>(`/organizations/${id}`)
      .then((data) => {
        setDetail(data);
        setMonthlyAmount(toInputMoney(Number(data.organization.monthly_amount_cents)));
      })
      .catch((e) => setError(e.message));
    superadminFetch<OrgUser[]>(`/organizations/${id}/users`)
      .then(setOrgUsers)
      .catch(() => setOrgUsers([]));
    superadminFetch<MembershipRow[]>(`/organizations/${id}/memberships`)
      .then(setMemberships)
      .catch(() => setMemberships([]));
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

  const saveMonthlyAmount = async () => {
    setSavingMonthly(true);
    setError(null);
    try {
      await superadminFetch(`/organizations/${id}/subscription`, {
        method: "PATCH",
        body: JSON.stringify({ monthlyAmountCents: parseMoneyToCents(monthlyAmount) }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar mensalidade");
    } finally {
      setSavingMonthly(false);
    }
  };

  const createInvoice = async () => {
    await superadminFetch(`/organizations/${id}/invoices`, {
      method: "POST",
      body: JSON.stringify({
        amountCents: parseMoneyToCents(invoiceAmount),
        dueDate: new Date().toISOString().slice(0, 10),
      }),
    });
    load();
  };

  const payInvoice = async (invoiceId: number, amountCents: number) => {
    setPayingInvoiceId(invoiceId);
    setError(null);
    try {
      await superadminFetch(`/invoices/${invoiceId}/payments`, {
        method: "POST",
        body: JSON.stringify({ amountCents, method: "manual" }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao registrar pagamento");
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const markPastDue = async () => {
    await superadminFetch(`/organizations/${id}/past-due`, { method: "POST" });
    load();
  };

  const impersonateUser = async (userId: number) => {
    if (!confirm("Entrar como este usuário? Ação auditada.")) return;
    setImpersonatingId(userId);
    try {
      const data = await superadminFetch<{
        token: string;
        user: OrgUser;
        impersonator: { id: number; name: string; email: string };
      }>(`/impersonate/${userId}`, { method: "POST" });
      applyImpersonationSession(data);
      router.push("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao impersonar");
    } finally {
      setImpersonatingId(null);
    }
  };

  const addMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setAddingMember(true);
    setError(null);
    try {
      await superadminFetch(`/organizations/${id}/memberships`, {
        method: "POST",
        body: JSON.stringify({ userEmail: memberEmail.trim(), roleKey: memberRole }),
      });
      setMemberEmail("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar membro");
    } finally {
      setAddingMember(false);
    }
  };

  if (error) return <p className="text-red-400">{error}</p>;
  if (!detail) return <p className="text-slate-400">Carregando…</p>;

  const org = detail.organization;
  const currentMonthly = Number(org.monthly_amount_cents ?? org.price_cents ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/superadmin/organizations" className="text-sm text-slate-400 hover:text-white">
          ← Organizações
        </Link>
        <h2 className="mt-2 text-2xl font-bold">{String(org.name)}</h2>
        <p className="text-slate-400">
          {String(org.slug)} · {String(org.status)} · SaaS {org.saas_enabled ? "on" : "off"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/superadmin/billing`}
            className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-amber-700"
          >
            Ver no faturamento
          </Link>
          <button
            type="button"
            onClick={markPastDue}
            className="rounded border border-red-800 px-3 py-1 text-sm text-red-300"
          >
            Marcar inadimplente (past_due)
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-3 text-lg font-semibold">Usuários e suporte</h3>
        {orgUsers.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum usuário vinculado encontrado.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {orgUsers.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{u.name || u.email}</p>
                  <p className="text-slate-400">
                    {u.email} · {u.role}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={impersonatingId === u.id}
                  onClick={() => impersonateUser(u.id)}
                  className="rounded bg-amber-700 px-3 py-1 text-xs disabled:opacity-50"
                >
                  {impersonatingId === u.id ? "Abrindo…" : "Entrar como"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-3 text-lg font-semibold">Equipe (memberships SaaS)</h3>
        <form onSubmit={addMembership} className="mb-4 flex flex-wrap gap-2">
          <input
            type="email"
            required
            placeholder="E-mail do usuário existente"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
          />
          <select
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="account_admin">Account Admin</option>
            <option value="gerente_bar">Gerente do Bar</option>
            <option value="recepcao">Recepção</option>
            <option value="hostess">Hostess</option>
            <option value="promoter">Promoter</option>
          </select>
          <button
            type="submit"
            disabled={addingMember}
            className="rounded bg-amber-600 px-3 py-2 text-sm disabled:opacity-50"
          >
            {addingMember ? "Adicionando…" : "Atribuir role"}
          </button>
        </form>
        {memberships.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum membership cadastrado.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {memberships.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap justify-between gap-2 rounded border border-slate-800 px-3 py-2"
              >
                <span>
                  {m.user_name || m.user_email} · {m.role_name}
                  {m.establishment_name ? ` · ${m.establishment_name}` : " · org inteira"}
                </span>
                <span className={m.is_active ? "text-emerald-400" : "text-slate-500"}>
                  {m.is_active ? "ativo" : "inativo"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-3 text-lg font-semibold">Mensalidade da empresa</h3>
        <p className="mb-3 text-sm text-slate-400">
          Valor que conta para sua receita mensal. Atual: {formatBrlFromCents(currentMonthly)}.
        </p>
        <div className="flex flex-wrap gap-2">
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
        <ul className="space-y-2 text-sm text-slate-300">
          {detail.establishments.map((e) => (
            <li
              key={String(e.id)}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
            >
              <span>
                {String(e.name)} (place {String(e.legacy_place_id ?? "—")})
              </span>
              <Link
                href={`/superadmin/organizations/${id}/establishments/${String(e.id)}`}
                className="rounded bg-amber-700/80 px-3 py-1 text-xs font-medium text-amber-100 hover:bg-amber-600"
              >
                Editar regras
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
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
        <div className="space-y-3">
          {detail.invoices.map((inv) => {
            const amount = Number(inv.amount_cents);
            const paid = Number(inv.paid_cents || 0);
            const remaining = Math.max(amount - paid, 0);
            return (
              <div
                key={inv.id}
                className="rounded border border-slate-800 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      Fatura #{inv.id} · {formatBrlFromCents(amount)}
                    </p>
                    <p className="text-slate-400">
                      Status: {inv.status} · Pago: {formatBrlFromCents(paid)} · Aberto: {formatBrlFromCents(remaining)}
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
                          {pay.paid_at || pay.created_at} · {pay.method || "manual"} · {formatBrlFromCents(Number(pay.amount_cents))}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Eventos de billing</h3>
        <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-500">
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
