"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { superadminFetch } from "@/app/utils/superadminApi";

type ConfigForm = {
  profile: string;
  cardapioBarId: number | null;
  operationalAliases: number[];
  maxDaily: number | null;
  maxPartySize: number | null;
  areaNamePrefix: string;
  excludeAreaPrefix: string;
  dualShift: boolean;
  strictHours: boolean;
  tableBlocking: string;
  extendedGuestListWindow: boolean;
};

type ConfigDetail = {
  establishment: {
    id: number;
    organization_id: number;
    name: string;
    legacy_place_id: number | null;
    legacy_bar_id: number | null;
    operational_id: number | null;
  };
  config: Record<string, unknown>;
  form: ConfigForm;
  mergedPreview: Record<string, unknown>;
  profiles: string[];
};

const PROFILE_LABELS: Record<string, string> = {
  rooftop: "Rooftop",
  pracinha: "Pracinha",
  highline: "HighLine",
  oh_fregues: "Oh Freguês",
  seu_justino: "Seu Justino",
  sitio_ilha: "Sítio Ilha",
  generic: "Genérico",
};

function aliasesToInput(aliases: number[]): string {
  return (aliases || []).join(", ");
}

function parseAliasesInput(value: string): number[] {
  return [
    ...new Set(
      value
        .split(/[,;\s]+/)
        .map((p) => Number(p.trim()))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ];
}

export default function SuperadminEstablishmentConfigPage() {
  const params = useParams();
  const orgId = Number(params.id);
  const estId = Number(params.estId);

  const [detail, setDetail] = useState<ConfigDetail | null>(null);
  const [form, setForm] = useState<ConfigForm | null>(null);
  const [aliasesInput, setAliasesInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(estId)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await superadminFetch<ConfigDetail>(`/establishments/${estId}/config`);
      setDetail(data);
      setForm(data.form);
      setAliasesInput(aliasesToInput(data.form.operationalAliases));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar config");
    } finally {
      setLoading(false);
    }
  }, [estId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await superadminFetch<ConfigDetail>(`/establishments/${estId}/config`, {
        method: "PATCH",
        body: JSON.stringify({
          profile: form.profile,
          cardapioBarId: form.cardapioBarId,
          operationalAliases: parseAliasesInput(aliasesInput),
          maxDaily: form.maxDaily,
          maxPartySize: form.maxPartySize,
          areaNamePrefix: form.areaNamePrefix,
          excludeAreaPrefix: form.excludeAreaPrefix,
          dualShift: form.dualShift,
          strictHours: form.strictHours,
          tableBlocking: form.tableBlocking,
          extendedGuestListWindow: form.extendedGuestListWindow,
        }),
      });
      setDetail(data);
      setForm(data.form);
      setAliasesInput(aliasesToInput(data.form.operationalAliases));
      setSuccess("Regras salvas. Cache da API invalidado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400">Carregando regras…</p>;
  }

  if (!detail || !form) {
    return (
      <div>
        <p className="text-red-400">{error || "Estabelecimento não encontrado."}</p>
        <Link href={`/superadmin/organizations/${orgId}`} className="mt-4 inline-block text-amber-400">
          ← Voltar à organização
        </Link>
      </div>
    );
  }

  const est = detail.establishment;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/superadmin/organizations/${orgId}`}
          className="text-sm text-slate-400 hover:text-amber-300"
        >
          ← Organização
        </Link>
        <h2 className="mt-2 text-2xl font-bold">{est.name}</h2>
        <p className="text-sm text-slate-400">
          ID canônico {est.id} · place {est.legacy_place_id ?? "—"} · bar{" "}
          {est.legacy_bar_id ?? "—"} · operacional {est.operational_id ?? "—"}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-emerald-300 text-sm">
          {success}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-amber-200">Perfil e cardápio</h3>
          <p className="text-xs text-slate-500 mt-1">
            Substitui hardcodes de ID (Rooftop=9, Pracinha=8, etc.) em reservas, mesas e check-ins.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-400">Profile</span>
            <select
              value={form.profile}
              onChange={(e) => setForm({ ...form, profile: e.target.value })}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            >
              {(detail.profiles || Object.keys(PROFILE_LABELS)).map((p) => (
                <option key={p} value={p}>
                  {PROFILE_LABELS[p] || p}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Cardápio bar ID</span>
            <input
              type="number"
              min={1}
              value={form.cardapioBarId ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  cardapioBarId: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-400">IDs operacionais alias (vírgula)</span>
            <input
              type="text"
              value={aliasesInput}
              onChange={(e) => setAliasesInput(e.target.value)}
              placeholder="Ex: 5, 9 para Rooftop place+bar"
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-5">
        <h3 className="text-lg font-semibold text-amber-200">Reservas</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-400">Máx. reservas/dia</span>
            <input
              type="number"
              min={1}
              value={form.maxDaily ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxDaily: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Máx. pessoas por reserva</span>
            <input
              type="number"
              min={1}
              value={form.maxPartySize ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxPartySize: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-400">Prefixo de área (incluir)</span>
            <input
              type="text"
              value={form.areaNamePrefix}
              onChange={(e) => setForm({ ...form, areaNamePrefix: e.target.value })}
              placeholder="Ex: Reserva Rooftop - "
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-400">Prefixo de área (excluir)</span>
            <input
              type="text"
              value={form.excludeAreaPrefix}
              onChange={(e) => setForm({ ...form, excludeAreaPrefix: e.target.value })}
              placeholder="Ex: Reserva Rooftop - "
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Bloqueio de mesa</span>
            <select
              value={form.tableBlocking}
              onChange={(e) => setForm({ ...form, tableBlocking: e.target.value })}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <option value="none">Padrão do profile</option>
              <option value="overlap">Overlap (Justino/Pracinha)</option>
              <option value="full_day">Dia inteiro</option>
            </select>
          </label>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:flex-wrap">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.dualShift}
                onChange={(e) => setForm({ ...form, dualShift: e.target.checked })}
              />
              2º giro / dual shift
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.strictHours}
                onChange={(e) => setForm({ ...form, strictHours: e.target.checked })}
              />
              Horário rígido
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.extendedGuestListWindow}
                onChange={(e) =>
                  setForm({ ...form, extendedGuestListWindow: e.target.checked })
                }
              />
              Janela estendida guest list
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold hover:bg-amber-500 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar regras"}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          disabled={saving}
          className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          Recarregar
        </button>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-400">Preview merged (API)</h3>
        <pre className="overflow-x-auto text-xs text-emerald-200/90 font-mono whitespace-pre-wrap">
          {JSON.stringify(detail.mergedPreview, null, 2)}
        </pre>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-400">Config raw (JSONB)</h3>
        <pre className="overflow-x-auto text-xs text-slate-400 font-mono whitespace-pre-wrap">
          {JSON.stringify(detail.config, null, 2)}
        </pre>
      </section>
    </div>
  );
}
