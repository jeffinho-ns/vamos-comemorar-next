"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBrlFromCents, superadminFetch } from "../../utils/superadminApi";
import { MODULE_LABELS } from "./[id]/types";

type OrgRow = {
  id: number;
  slug: string;
  name: string;
  status: string;
  saas_enabled: boolean;
  plan_key: string | null;
  plan_name: string | null;
  plan_price_cents: number | null;
  monthly_amount_cents: number | null;
  subscription_status: string | null;
  establishments_count: number;
  open_invoices: number;
};

export default function SuperadminOrganizationsPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    planKey: "full",
    adminEmail: "",
    adminName: "",
    establishmentName: "",
    monthlyAmount: "0",
    enabledModules: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    superadminFetch<OrgRow[]>("/organizations")
      .then(setOrgs)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!form.enabledModules.length) {
        setError("Selecione ao menos um módulo desta empresa.");
        setSaving(false);
        return;
      }
      const parsed = Math.round(
        parseFloat(form.monthlyAmount.replace(",", ".") || "0") * 100,
      );
      await superadminFetch("/organizations", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          planKey: form.planKey,
          adminEmail: form.adminEmail || undefined,
          adminName: form.adminName || undefined,
          establishmentName: form.establishmentName || undefined,
          monthlyAmountCents: Number.isFinite(parsed) ? parsed : undefined,
          enabledModules: form.enabledModules,
        }),
      });
      setShowForm(false);
      setForm({
        name: "",
        slug: "",
        planKey: "full",
        adminEmail: "",
        adminName: "",
        establishmentName: "",
        monthlyAmount: "0",
        enabledModules: [],
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Organizações</h2>
          <p className="text-slate-400 text-sm">
            Clientes do SaaS com mensalidade manual para medir sua receita real.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          {showForm ? "Cancelar" : "Nova organização"}
        </button>
      </div>

      {error && <p className="mb-4 text-red-400">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 grid gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-2"
        >
          <input
            required
            placeholder="Nome (ex: Bar Exemplo)"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            placeholder="Slug (ex: bar-exemplo)"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <input
            placeholder="E-mail do admin inicial"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.adminEmail}
            onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
          />
          <input
            placeholder="Nome do estabelecimento (opcional)"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.establishmentName}
            onChange={(e) =>
              setForm({ ...form, establishmentName: e.target.value })
            }
          />
          <input
            placeholder="Mensalidade (R$)"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.monthlyAmount}
            onChange={(e) => setForm({ ...form, monthlyAmount: e.target.value })}
          />
          <div className="md:col-span-2 rounded border border-slate-800 bg-slate-950/60 p-3">
            <p className="mb-2 text-sm text-slate-300">
              Módulos desta empresa (separados da organização já existente)
            </p>
            <p className="mb-3 text-xs text-slate-500">
              Marque só o que essa empresa vai usar. Sem isso, o login dela
              herda o plano completo (todas as funções).
            </p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(MODULE_LABELS).map(([key, label]) => {
                const on = form.enabledModules.includes(key);
                return (
                  <label
                    key={key}
                    className="inline-flex items-center gap-2 text-sm text-slate-200"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          enabledModules: on
                            ? prev.enabledModules.filter((m) => m !== key)
                            : [...prev.enabledModules, key],
                        }))
                      }
                    />
                    {label}
                  </label>
                );
              })}
            </div>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                className="text-xs text-amber-400 hover:underline"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    enabledModules: Object.keys(MODULE_LABELS),
                  }))
                }
              >
                Marcar todos
              </button>
              <button
                type="button"
                className="text-xs text-slate-400 hover:underline"
                onClick={() =>
                  setForm((prev) => ({ ...prev, enabledModules: ["cardapio"] }))
                }
              >
                Só cardápio
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="md:col-span-2 rounded-lg bg-emerald-600 py-2 font-medium disabled:opacity-50"
          >
            {saving ? "Provisionando…" : "Provisionar organização"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Plano</th>
              <th className="p-3">Mensalidade</th>
              <th className="p-3">Status</th>
              <th className="p-3">Casas</th>
              <th className="p-3">Faturas abertas</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                <td className="p-3">
                  <Link
                    href={`/superadmin/organizations/${o.id}`}
                    className="font-medium text-amber-300 hover:underline"
                  >
                    {o.name}
                  </Link>
                  <p className="text-xs text-slate-500">{o.slug}</p>
                </td>
                <td className="p-3">
                  {o.plan_name || "—"}
                  {o.plan_price_cents != null && (
                    <span className="text-slate-500">
                      {" "}
                      ({formatBrlFromCents(o.plan_price_cents)})
                    </span>
                  )}
                </td>
                <td className="p-3 text-emerald-300">
                  {formatBrlFromCents(
                    o.monthly_amount_cents ?? o.plan_price_cents ?? 0,
                  )}
                </td>
                <td className="p-3">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs">
                    {o.subscription_status || o.status}
                  </span>
                </td>
                <td className="p-3">{o.establishments_count}</td>
                <td className="p-3">{o.open_invoices}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
