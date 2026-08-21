"use client";

import { useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { ChecklistIaPanel } from "../../../components/justino360/ia/ChecklistIaPanel";
import { InsightsIaPanel } from "../../../components/justino360/ia/InsightsIaPanel";
import { PopIaPanel } from "../../../components/justino360/ia/PopIaPanel";
import { SummaryIaPanel } from "../../../components/justino360/ia/SummaryIaPanel";
import type { IaStatus } from "../../../components/justino360/ia/iaMeta";
import { iaFetch } from "../../../components/justino360/ia/useIaAction";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";
import type { J360Sector } from "../../../lib/justino360/types";

const TABS = [
  { key: "checklist", label: "Checklist" },
  { key: "pop", label: "POP" },
  { key: "resumo", label: "Resumo de ata" },
  { key: "recorrencia", label: "Recorrência" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminIaPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [tab, setTab] = useState<TabKey>("checklist");
  const [status, setStatus] = useState<IaStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [sectors, setSectors] = useState<J360Sector[]>([]);

  useEffect(() => {
    if (!allowed) return;
    iaFetch<IaStatus>("/ai/status").then((res) => {
      if (res.success && res.data) setStatus(res.data);
      else setStatusError(res.message || "Não foi possível checar o estado da IA.");
    });
    j360Fetch<J360Sector[]>("/sectors").then((res) => {
      if (res.success && res.data) setSectors(res.data);
    });
  }, [allowed]);

  // Enquanto o status não chega, a IA é tratada como disponível: um servidor com
  // chave configurada não deve piscar aviso de indisponível no primeiro render.
  const aiEnabled = status?.ai_enabled !== false;
  const canManage = status?.can_manage === true;

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="IA operacional">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Ferramentas de IA"
            className="flex flex-wrap gap-2 rounded-xl bg-white/5 p-1 ring-1 ring-white/10"
          >
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                id={`ia-tab-${item.key}`}
                aria-selected={tab === item.key}
                aria-controls={`ia-panel-${item.key}`}
                onClick={() => setTab(item.key)}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  tab === item.key
                    ? "bg-amber-500 font-medium text-gray-900"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {status && (
            <p className="text-xs text-gray-500">
              {status.ai_enabled ? `Modelo ${status.model}` : "IA generativa desligada"}
              {status.can_manage ? "" : " · sem permissão de gestão"}
            </p>
          )}
        </div>

        {statusError && (
          <p role="alert" className="mb-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-200">
            {statusError}
          </p>
        )}

        {!canManage && status && (
          <p className="mb-4 rounded-lg bg-white/5 px-4 py-3 text-sm text-gray-300 ring-1 ring-white/10">
            Você pode acompanhar as análises, mas gerar rascunhos e aplicar templates exige
            permissão de gestão do Justino360.
          </p>
        )}

        <div
          role="tabpanel"
          id={`ia-panel-${tab}`}
          aria-labelledby={`ia-tab-${tab}`}
          tabIndex={-1}
        >
          {tab === "checklist" && (
            <ChecklistIaPanel aiEnabled={aiEnabled} canManage={canManage} sectors={sectors} />
          )}
          {tab === "pop" && <PopIaPanel aiEnabled={aiEnabled} canManage={canManage} />}
          {tab === "resumo" && <SummaryIaPanel aiEnabled={aiEnabled} sectors={sectors} />}
          {tab === "recorrencia" && <InsightsIaPanel canManage={canManage} />}
        </div>

        <p className="mt-8 text-xs text-gray-500">
          Rascunhos de IA são sugestões baseadas na operação do Seu Justino. Revise antes de
          publicar: o que a equipe executa é o que você aplicar.
        </p>
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
