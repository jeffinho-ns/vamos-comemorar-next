"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Justino360Shell } from "../components/justino360/Justino360Shell";
import { useSaasAccess } from "../hooks/useSaasAccess";
import { j360Fetch } from "../lib/justino360/api";
import {
  PRIORITY_LABEL,
  TASK_NEXT_STATUSES,
  TASK_STATUS_LABEL,
  formatDateTime,
  priorityClass,
} from "../lib/justino360/labels";
import type { J360HomeData, TaskStatus } from "../lib/justino360/types";

function Section({
  title,
  href,
  hint,
  children,
}: {
  title: string;
  href?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">{title}</h2>
          {hint && <p className="text-xs text-gray-500">{hint}</p>}
        </div>
        {href && (
          <Link href={href} className="text-sm text-amber-400 hover:underline">
            Ver todos
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Summary({ label, value, tone }: { label: string; value: number; tone?: "alert" }) {
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          tone === "alert" && value > 0 ? "text-red-300" : "text-amber-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function Justino360StaffHomePage() {
  const router = useRouter();
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [data, setData] = useState<J360HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await j360Fetch<J360HomeData>("/home");
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível carregar o seu dia.");
    } else {
      setError(null);
      setData(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  async function startRun(templateId: number) {
    setBusy("Iniciando checklist…");
    const res = await j360Fetch<{ id: number }>("/checklist-runs", {
      method: "POST",
      body: JSON.stringify({ template_id: templateId }),
    });
    setBusy(null);
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível iniciar o checklist.");
      return;
    }
    router.push(`/justino360/checklists/${res.data.id}`);
  }

  async function setTaskStatus(taskId: number, status: TaskStatus) {
    setBusy("Atualizando tarefa…");
    const res = await j360Fetch(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (!res.success) {
      setError(res.message || "Não foi possível atualizar a tarefa.");
      return;
    }
    await load();
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso ao Justino360.</p>
      </div>
    );
  }

  const tarefasAtrasadas = data?.tarefas.filter((t) => t.is_overdue).length ?? 0;

  return (
    <Justino360Shell mode="staff" title="Meu dia na operação">
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200" role="alert">
          {error}
        </div>
      )}
      {busy && <p className="mb-4 text-sm text-amber-300">{busy}</p>}

      {loading && !data ? (
        <p className="text-gray-400">Carregando…</p>
      ) : data ? (
        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Summary label="Minhas tarefas" value={data.tarefas.length} />
            <Summary label="Tarefas atrasadas" value={tarefasAtrasadas} tone="alert" />
            <Summary
              label="Checklists a iniciar"
              value={data.checklists_disponiveis.length}
            />
            <Summary label="Ocorrências abertas" value={data.ocorrencias.length} tone="alert" />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section
              title="Checklists de hoje"
              href="/justino360/checklists"
              hint="Abertura, fechamento e inspeções do dia"
            >
              <ul className="space-y-2">
                {data.checklists.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 border-b border-white/5 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/justino360/checklists/${c.id}`}
                        className="font-medium text-amber-300 hover:underline"
                      >
                        {c.template_name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {c.sector_name || "Geral"} · {c.answered_items}/{c.total_items} itens
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ring-1 ${
                        c.status === "concluido"
                          ? "bg-emerald-500/20 text-emerald-200 ring-emerald-500/40"
                          : "bg-amber-500/20 text-amber-200 ring-amber-500/40"
                      }`}
                    >
                      {c.status === "concluido" ? "Concluído" : "Em andamento"}
                    </span>
                  </li>
                ))}
                {data.checklists.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhum checklist iniciado hoje.</p>
                )}
              </ul>

              {data.checklists_disponiveis.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">
                    Ainda não iniciados
                  </p>
                  <ul className="space-y-2">
                    {data.checklists_disponiveis.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-gray-500">
                            {t.sector_name || "Geral"} · {t.shift_type} · {t.items_count} itens
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startRun(t.id)}
                          disabled={Boolean(busy)}
                          className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-gray-900 transition hover:bg-amber-400 disabled:opacity-50"
                        >
                          Iniciar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>

            <Section title="Minhas tarefas" href="/justino360/tarefas">
              <ul className="space-y-3">
                {data.tarefas.map((t) => (
                  <li key={t.id} className="rounded-lg bg-black/20 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{t.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${priorityClass(t.priority)}`}
                      >
                        {PRIORITY_LABEL[t.priority] || t.priority}
                      </span>
                      {t.is_overdue && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] text-red-200 ring-1 ring-red-500/40">
                          Atrasada
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {t.sector_name || "Geral"} · {TASK_STATUS_LABEL[t.status] || t.status}
                      {t.due_at ? ` · até ${formatDateTime(t.due_at)}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(TASK_NEXT_STATUSES[t.status] || [])
                        .filter((s) => s !== "validada")
                        .map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setTaskStatus(t.id, s)}
                            disabled={Boolean(busy)}
                            className="rounded bg-white/10 px-2 py-1 text-[11px] text-gray-100 transition hover:bg-white/20 disabled:opacity-50"
                          >
                            {TASK_STATUS_LABEL[s]}
                          </button>
                        ))}
                    </div>
                  </li>
                ))}
                {data.tarefas.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhuma tarefa aberta para você.</p>
                )}
              </ul>
            </Section>

            <Section
              title="Pendências da operação"
              href="/justino360/ocorrencias"
              hint="Ocorrências abertas suas ou de prioridade alta"
            >
              <ul className="space-y-2">
                {data.ocorrencias.map((i) => (
                  <li key={i.id} className="border-b border-white/5 py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{i.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${priorityClass(i.priority)}`}
                      >
                        {PRIORITY_LABEL[i.priority] || i.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {i.sector_name || "Geral"} · {formatDateTime(i.created_at)}
                    </p>
                  </li>
                ))}
                {data.ocorrencias.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhuma pendência aberta. Operação limpa.</p>
                )}
              </ul>
            </Section>

            <Section title="Treinamentos e comunicados" href="/justino360/comunicados">
              <ul className="space-y-2">
                {data.treinamentos.map((t) => (
                  <li key={`tr-${t.id}`} className="border-b border-white/5 py-2 text-sm">
                    <span className="font-medium">{t.title}</span>
                    <span className="ml-2 text-gray-500">treinamento · {t.status}</span>
                  </li>
                ))}
                {data.comunicados.map((c) => (
                  <li key={`co-${c.id}`} className="border-b border-white/5 py-2 text-sm">
                    <span className="font-medium">{c.title}</span>
                    <span className="ml-2 text-gray-500">
                      {c.acked_at
                        ? "ciência ok"
                        : c.requires_ack
                          ? "aguardando ciência"
                          : "comunicado"}
                    </span>
                  </li>
                ))}
                {data.treinamentos.length === 0 && data.comunicados.length === 0 && (
                  <p className="text-sm text-gray-400">Nada pendente por aqui.</p>
                )}
              </ul>
            </Section>
          </div>

          {data.agenda.length > 0 && (
            <Section title="Próximos 7 dias" href="/justino360/agenda">
              <ul className="space-y-2">
                {data.agenda.map((e) => (
                  <li key={e.id} className="border-b border-white/5 py-2 text-sm">
                    <span className="font-medium">{e.title}</span>
                    <span className="ml-2 text-gray-500">
                      {e.event_type} · {formatDateTime(e.starts_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      ) : null}
    </Justino360Shell>
  );
}
