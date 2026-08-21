"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";
import type {
  ChecklistRunSummary,
  ChecklistTemplate,
} from "../../../lib/justino360/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminChecklistsPage() {
  const router = useRouter();
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [runs, setRuns] = useState<ChecklistRunSummary[]>([]);
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [tpl, run] = await Promise.all([
      j360Fetch<ChecklistTemplate[]>("/checklist-templates"),
      j360Fetch<ChecklistRunSummary[]>(`/checklist-runs?date=${date}`),
    ]);
    if (!tpl.success || !run.success) {
      setError(tpl.message || run.message || "Não foi possível carregar os checklists.");
    } else {
      setError(null);
    }
    if (tpl.data) setTemplates(tpl.data);
    if (run.data) setRuns(run.data);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function startRun(templateId: number) {
    setBusy("Iniciando checklist…");
    const res = await j360Fetch<{ id: number }>("/checklist-runs", {
      method: "POST",
      body: JSON.stringify({ template_id: templateId, run_date: date }),
    });
    setBusy(null);
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível iniciar o checklist.");
      return;
    }
    router.push(`/justino360/checklists/${res.data.id}`);
  }

  // Execução já existente na data escolhida: abrir em vez de criar outra.
  const runByTemplateName = new Map(runs.map((r) => [r.template_name, r]));

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Checklists e inspeções">
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200" role="alert">
            {error}
          </div>
        )}
        {busy && <p className="mb-4 text-sm text-amber-300">{busy}</p>}

        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="run-date" className="mb-1 block text-xs text-gray-400">
              Data das execuções
            </label>
            <input
              id="run-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || today())}
              className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando…</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-lg font-medium">Modelos</h2>
              <ul className="space-y-3">
                {templates.map((t) => {
                  const existing = runByTemplateName.get(t.name);
                  return (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{t.name}</p>
                        <p className="text-sm text-gray-400">
                          {t.sector_name || "Geral"} · {t.shift_type} · {t.items_count} itens
                        </p>
                        {existing && (
                          <p className="text-xs text-emerald-300">Já iniciado nesta data</p>
                        )}
                      </div>
                      {existing ? (
                        <Link
                          href={`/justino360/checklists/${existing.id}`}
                          className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:bg-white/20"
                        >
                          Abrir
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startRun(t.id)}
                          disabled={Boolean(busy)}
                          className="shrink-0 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-gray-900 transition hover:bg-amber-400 disabled:opacity-50"
                        >
                          Iniciar
                        </button>
                      )}
                    </li>
                  );
                })}
                {templates.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhum modelo cadastrado.</p>
                )}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium">Execuções</h2>
              <ul className="space-y-3">
                {runs.map((r) => {
                  const progress =
                    r.total_items > 0
                      ? Math.round((r.answered_items / r.total_items) * 100)
                      : 0;
                  return (
                    <li key={r.id} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{r.template_name}</p>
                          <p className="text-sm text-gray-400">
                            {r.sector_name || "Geral"} · {r.answered_items}/{r.total_items} itens
                            {r.nao_ok_count ? ` · ${r.nao_ok_count} não OK` : ""}
                          </p>
                        </div>
                        <Link
                          href={`/justino360/checklists/${r.id}`}
                          className="shrink-0 text-sm text-amber-400 hover:underline"
                        >
                          Abrir
                        </Link>
                      </div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${
                            r.status === "concluido" ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
                {runs.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhuma execução nesta data.</p>
                )}
              </ul>
            </section>
          </div>
        )}
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
