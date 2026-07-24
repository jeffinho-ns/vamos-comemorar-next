"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatBrlFromCents, superadminFetch } from "@/app/utils/superadminApi";
import { applyImpersonationSession } from "@/app/utils/impersonation";
import UserAccessPanel from "./UserAccessPanel";
import EstablishmentsPanel from "./EstablishmentsPanel";
import BillingPanel, { type InvoiceRow } from "./BillingPanel";
import {
  MODULE_LABELS,
  type EstablishmentPermission,
  type EstablishmentRow,
  type MembershipRow,
  type ModuleCatalogItem,
  type OrgUser,
} from "./types";

type OrgDetail = {
  organization: Record<string, unknown>;
  establishments: EstablishmentRow[];
  modules: Array<{ key: string; name: string; is_enabled: boolean }>;
  moduleCatalog?: ModuleCatalogItem[];
  invoices: InvoiceRow[];
  billingEvents: Array<Record<string, unknown>>;
};

const TABS = [
  { id: "users", label: "Usuários e acessos" },
  { id: "establishments", label: "Estabelecimentos" },
  { id: "billing", label: "Cobrança" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SuperadminOrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [tab, setTab] = useState<TabId>("users");
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [permissions, setPermissions] = useState<EstablishmentPermission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null);
  const [suspendLoading, setSuspendLoading] = useState(false);

  const load = useCallback(() => {
    if (!Number.isFinite(id)) return;
    superadminFetch<OrgDetail>(`/organizations/${id}`)
      .then(setDetail)
      .catch((e) => setError(e.message));
    superadminFetch<OrgUser[]>(`/organizations/${id}/users`)
      .then(setOrgUsers)
      .catch(() => setOrgUsers([]));
    superadminFetch<MembershipRow[]>(`/organizations/${id}/memberships`)
      .then(setMemberships)
      .catch(() => setMemberships([]));
    superadminFetch<EstablishmentPermission[]>(
      `/organizations/${id}/establishment-permissions`,
    )
      .then(setPermissions)
      .catch(() => setPermissions([]));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const toggleModule = async (moduleKey: string, isEnabled: boolean) => {
    setError(null);
    try {
      await superadminFetch(`/organizations/${id}/modules/${moduleKey}`, {
        method: "PUT",
        body: JSON.stringify({ is_enabled: !isEnabled }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar módulo");
    }
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

  const toggleSuspension = async (suspend: boolean) => {
    const confirmed = suspend
      ? confirm(
          "Suspender esta organização? Todos os usuários dela perderão acesso ao sistema até a reativação.",
        )
      : confirm("Reativar esta organização?");
    if (!confirmed) return;
    setError(null);
    setSuspendLoading(true);
    try {
      await superadminFetch(
        `/organizations/${id}/${suspend ? "suspend" : "reactivate"}`,
        { method: "POST" },
      );
      setSuccessMessage(
        suspend
          ? "Organização suspensa. Os usuários não conseguem mais fazer login."
          : "Organização reativada com sucesso.",
      );
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar organização");
    } finally {
      setSuspendLoading(false);
    }
  };

  if (!detail) return <p className="text-slate-400">Carregando…</p>;

  const org = detail.organization;
  const currentMonthly = Number(org.monthly_amount_cents ?? org.price_cents ?? 0);
  const moduleCatalog: ModuleCatalogItem[] =
    detail.moduleCatalog && detail.moduleCatalog.length > 0
      ? detail.moduleCatalog
      : detail.modules.map((m) => ({ key: m.key, name: m.name }));
  const openInvoices = detail.invoices.filter(
    (inv) => Math.max(Number(inv.amount_cents) - Number(inv.paid_cents || 0), 0) > 0,
  ).length;
  const activeEstablishments = detail.establishments.filter(
    (e) => (e.status || "active") !== "archived",
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/superadmin/organizations"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Organizações
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold">{String(org.name)}</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs ${
              String(org.status) === "active"
                ? "bg-emerald-900/50 text-emerald-300"
                : "bg-red-950/60 text-red-300"
            }`}
          >
            {String(org.status)}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs ${
              org.saas_enabled
                ? "bg-amber-950/60 text-amber-300"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            SaaS {org.saas_enabled ? "ativado" : "desativado"}
          </span>
          {String(org.status) !== "suspended" ? (
            <button
              type="button"
              onClick={() => toggleSuspension(true)}
              disabled={suspendLoading}
              className="rounded border border-red-800 px-3 py-1 text-xs text-red-300 hover:bg-red-950 disabled:opacity-50"
            >
              {suspendLoading ? "Suspendendo…" : "Suspender organização"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => toggleSuspension(false)}
              disabled={suspendLoading}
              className="rounded border border-emerald-800 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
            >
              {suspendLoading ? "Reativando…" : "Reativar organização"}
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {String(org.slug)} · {orgUsers.length}{" "}
          {orgUsers.length === 1 ? "usuário" : "usuários"} ·{" "}
          {activeEstablishments.length}{" "}
          {activeEstablishments.length === 1 ? "estabelecimento" : "estabelecimentos"}{" "}
          · mensalidade {formatBrlFromCents(currentMonthly)}
          {openInvoices > 0
            ? ` · ${openInvoices} ${openInvoices === 1 ? "fatura em aberto" : "faturas em aberto"}`
            : ""}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Módulos do plano:
          </span>
          {detail.modules.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => toggleModule(m.key, m.is_enabled)}
              title={
                m.is_enabled
                  ? "Clique para desativar na organização"
                  : "Clique para ativar na organização"
              }
              className={`rounded-full px-3 py-1 text-xs ${
                m.is_enabled
                  ? "bg-emerald-900/50 text-emerald-300"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {MODULE_LABELS[m.key] || m.name || m.key}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
          {successMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-1 border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border border-b-0 border-slate-800 bg-slate-900/60 text-amber-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <UserAccessPanel
          orgId={id}
          orgUsers={orgUsers}
          memberships={memberships}
          permissions={permissions}
          establishments={activeEstablishments}
          impersonatingId={impersonatingId}
          onImpersonate={impersonateUser}
          onReload={load}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}

      {tab === "establishments" && (
        <EstablishmentsPanel
          orgId={id}
          establishments={detail.establishments}
          moduleCatalog={moduleCatalog}
          permissions={permissions}
          onReload={load}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}

      {tab === "billing" && (
        <BillingPanel
          key={`billing-${currentMonthly}`}
          orgId={id}
          organizationName={String(org.name)}
          currentMonthlyCents={currentMonthly}
          invoices={detail.invoices}
          billingEvents={detail.billingEvents}
          onReload={load}
          onError={setError}
        />
      )}
    </div>
  );
}
