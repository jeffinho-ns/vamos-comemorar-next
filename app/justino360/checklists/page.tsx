"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Justino360Shell } from "../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { j360Fetch } from "../../lib/justino360/api";

type Template = {
  id: number;
  name: string;
  sector_name?: string;
  shift_type: string;
  items_count: number;
};

type Run = {
  id: number;
  template_name: string;
  status: string;
  answered_items: number;
  total_items: number;
};

export default function StaffChecklistsPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [templates, setTemplates] = useState<Template[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    j360Fetch<Template[]>("/checklist-templates").then((r) => {
      if (r.success && r.data) setTemplates(r.data);
    });
    j360Fetch<Run[]>("/checklist-runs").then((r) => {
      if (r.success && r.data) setRuns(r.data);
    });
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  async function startRun(templateId: number) {
    const res = await j360Fetch<{ id: number }>("/checklist-runs", {
      method: "POST",
      body: JSON.stringify({ template_id: templateId }),
    });
    if (!res.success || !res.data) {
      setMsg(res.message || "Falha ao iniciar");
      return;
    }
    setMsg("Checklist iniciado.");
    load();
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso</p>
      </div>
    );
  }

  return (
    <Justino360Shell mode="staff" title="Checklists">
      {msg && <p className="mb-4 text-sm text-amber-300">{msg}</p>}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-medium">Templates</h2>
          <ul className="space-y-3">
            {templates.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
              >
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-gray-400">
                    {t.sector_name} · {t.shift_type} · {t.items_count} itens
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startRun(t.id)}
                  className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-gray-900"
                >
                  Iniciar
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-medium">Execuções de hoje</h2>
          <ul className="space-y-3">
            {runs.map((r) => (
              <li key={r.id} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.template_name}</p>
                    <p className="text-sm text-gray-400">
                      {r.answered_items}/{r.total_items} · {r.status}
                    </p>
                  </div>
                  <Link
                    href={`/justino360/checklists/${r.id}`}
                    className="text-sm text-amber-400 hover:underline"
                  >
                    Abrir
                  </Link>
                </div>
              </li>
            ))}
            {runs.length === 0 && (
              <p className="text-sm text-gray-400">Nenhuma execução hoje.</p>
            )}
          </ul>
        </section>
      </div>
    </Justino360Shell>
  );
}
