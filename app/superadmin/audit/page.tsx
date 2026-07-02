"use client";

import { useCallback, useEffect, useState } from "react";
import { superadminFetch } from "@/app/utils/superadminApi";

type AuditRow = {
  id: number;
  user_name: string;
  user_email: string;
  action_type: string;
  action_description: string;
  resource_type: string | null;
  resource_id: number | null;
  created_at: string;
  additional_data: Record<string, unknown> | null;
};

export default function SuperadminAuditPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [actionType, setActionType] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ limit: "100" });
    if (actionType) qs.set("actionType", actionType);
    superadminFetch<AuditRow[]>(`/audit-logs?${qs}`)
      .then(setLogs)
      .catch((e) => setError(e.message));
  }, [actionType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Auditoria</h2>
        <p className="text-slate-400">
          Registros recentes de ações — inclui impersonate, billing e operações do sistema.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">Todos os tipos</option>
          <option value="superadmin_impersonate_start">Impersonate — início</option>
          <option value="superadmin_impersonate_end">Impersonate — fim</option>
        </select>
        <button
          type="button"
          onClick={load}
          className="rounded border border-slate-600 px-4 py-2 text-sm"
        >
          Atualizar
        </button>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      <div className="space-y-2 max-h-[70vh] overflow-y-auto">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-amber-400">{log.action_type}</span>
              <span className="text-xs text-slate-500">
                {new Date(log.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1">{log.action_description}</p>
            <p className="text-xs text-slate-500">
              {log.user_name} ({log.user_email})
              {log.resource_type && ` · ${log.resource_type} #${log.resource_id}`}
            </p>
          </div>
        ))}
        {logs.length === 0 && !error && (
          <p className="text-slate-500">Nenhum registro encontrado.</p>
        )}
      </div>
    </div>
  );
}
