"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { TrainingAssignPanel } from "../../../components/justino360/TrainingAssignPanel";
import { TrainingForm } from "../../../components/justino360/TrainingForm";
import {
  J360TeamMember,
  J360TrainingDetail,
  TRAINING_STATUSES,
  TRAINING_STATUS_LABEL,
  TrainingPayload,
  roleLabel,
  validityHint,
} from "../../../components/justino360/trainingMeta";
import { IRI_DOCUMENT_ROLES } from "../../../components/rhIdeia/documentMeta";
import { IRI_FIELD, RhIdeiaShell } from "../../../components/rhIdeia/RhIdeiaShell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { iriFetch, iriUpload } from "../../../lib/rhIdeia/api";
import type { IriTraining } from "../../../lib/rhIdeia/types";

type Scope = "active" | "archived" | "all";

export default function RhIdeiaAdminTreinamentosPage() {
  const { canAccessRhIdeia, canManageRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || canManageRhIdeia || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<IriTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [search, setSearch] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [status, setStatus] = useState("");
  const [scope, setScope] = useState<Scope>("active");

  const [editing, setEditing] = useState<IriTraining | null>(null);
  const [detail, setDetail] = useState<J360TrainingDetail | null>(null);
  const [team, setTeam] = useState<J360TeamMember[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ scope });
    if (roleKey) params.set("role_key", roleKey);
    if (status) params.set("status", status);
    if (search.trim()) params.set("q", search.trim());
    iriFetch<IriTraining[]>(`/trainings?${params.toString()}`)
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
        else setFeedback({ tone: "error", text: res.message || "Falha ao carregar treinamentos." });
      })
      .finally(() => setLoading(false));
  }, [roleKey, scope, search, status]);

  useEffect(() => {
    if (!allowed) return;
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [allowed, load, search]);

  const refreshPanel = useCallback(async (trainingId: number) => {
    const [detailRes, teamRes] = await Promise.all([
      iriFetch<J360TrainingDetail>(`/trainings/${trainingId}`),
      iriFetch<J360TeamMember[]>(`/trainings/team?training_id=${trainingId}`),
    ]);
    if (detailRes.success && detailRes.data) setDetail(detailRes.data);
    else setFeedback({ tone: "error", text: detailRes.message || "Falha ao carregar o curso." });
    if (teamRes.success && teamRes.data) setTeam(teamRes.data);
  }, []);

  async function handleSubmit(payload: TrainingPayload, id: number | null) {
    const body = { ...payload, scope: "organization" };
    const res = id
      ? await iriFetch<IriTraining>(`/trainings/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        })
      : await iriFetch<IriTraining>("/trainings", {
          method: "POST",
          body: JSON.stringify(body),
        });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao salvar treinamento." });
      return false;
    }
    setFeedback({ tone: "ok", text: id ? "Treinamento atualizado." : "Treinamento criado." });
    setEditing(null);
    load();
    if (id && detail?.id === id) await refreshPanel(id);
    return true;
  }

  async function toggleActive(training: IriTraining) {
    const res = await iriFetch<IriTraining>(`/trainings/${training.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !training.is_active }),
    });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao atualizar treinamento." });
      return;
    }
    setFeedback({
      tone: "ok",
      text: training.is_active ? "Treinamento arquivado." : "Treinamento reativado.",
    });
    load();
  }

  async function handleAssign(userIds: number[], dueAt: string | null, reassign: boolean) {
    if (!detail) return false;
    const res = await iriFetch(`/trainings/${detail.id}/assign`, {
      method: "POST",
      body: JSON.stringify({ user_ids: userIds, due_at: dueAt, reassign }),
    });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao atribuir treinamento." });
      return false;
    }
    setFeedback({ tone: "ok", text: `Treinamento atribuído para ${userIds.length} pessoa(s).` });
    await refreshPanel(detail.id);
    load();
    return true;
  }

  async function completeFor(userId: number) {
    if (!detail) return;
    const res = await iriFetch(`/trainings/${detail.id}/complete`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, result: "presencial" }),
    });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao registrar conclusão." });
      return;
    }
    setFeedback({ tone: "ok", text: "Conclusão registrada." });
    await refreshPanel(detail.id);
    load();
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <RhIdeiaShell mode="admin" title="Treinamentos">
        {feedback && (
          <p
            role="status"
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              feedback.tone === "ok"
                ? "bg-emerald-500/15 text-emerald-200"
                : "bg-red-500/15 text-red-200"
            }`}
          >
            {feedback.text}
          </p>
        )}

        <TrainingForm
          editing={editing}
          onCancelEdit={() => setEditing(null)}
          onSubmit={handleSubmit}
          uploadFn={iriUpload}
          trainingRoles={IRI_DOCUMENT_ROLES}
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className={`${IRI_FIELD} min-w-[200px] flex-1`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou descrição"
            aria-label="Buscar treinamentos"
          />
          <select
            className={IRI_FIELD}
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
            aria-label="Filtrar por função"
          >
            <option value="">Todas as funções</option>
            {IRI_DOCUMENT_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <select
            className={IRI_FIELD}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filtrar por situação das atribuições"
          >
            <option value="">Qualquer situação</option>
            {TRAINING_STATUSES.map((value) => (
              <option key={value} value={value}>
                Com {TRAINING_STATUS_LABEL[value].toLowerCase()}
              </option>
            ))}
          </select>
          <select
            className={IRI_FIELD}
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            aria-label="Filtrar por situação do curso"
          >
            <option value="active">Ativos</option>
            <option value="archived">Arquivados</option>
            <option value="all">Todos</option>
          </select>
        </div>

        {detail && (
          <TrainingAssignPanel
            training={detail}
            team={team}
            onAssign={handleAssign}
            onCompleteFor={completeFor}
            onClose={() => {
              setDetail(null);
              setTeam([]);
            }}
          />
        )}

        <ul className="space-y-3">
          {items.map((training) => (
            <li
              key={training.id}
              className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[200px] flex-1">
                  <p className="font-medium">
                    {training.title}
                    {training.is_mandatory && (
                      <span className="ml-2 rounded-md bg-teal-500/20 px-2 py-0.5 text-xs text-teal-200">
                        obrigatório
                      </span>
                    )}
                    {!training.is_active && (
                      <span className="ml-2 rounded-md bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                        arquivado
                      </span>
                    )}
                  </p>
                  {training.description && (
                    <p className="mt-1 text-sm text-slate-400">{training.description}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {roleLabel(training.role_key)} · {validityHint(training.validity_days)}
                    {training.content_url && (
                      <>
                        {" · "}
                        <a
                          href={training.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:underline"
                        >
                          material
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => refreshPanel(training.id)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    Atribuir / progresso
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(training);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(training)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    {training.is_active ? "Arquivar" : "Reativar"}
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${training.completion_rate ?? 0}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {training.completed_count ?? 0}/{training.assigned_count ?? 0} concluídos ·{" "}
                  {training.completion_rate ?? 0}%
                  {(training.pending_count ?? 0) > 0 && ` · ${training.pending_count} pendente(s)`}
                  {(training.expired_count ?? 0) > 0 && (
                    <span className="text-red-300"> · {training.expired_count} vencido(s)</span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {!loading && items.length === 0 && (
          <p className="text-sm text-slate-400">Nenhum treinamento encontrado com esses filtros.</p>
        )}
        {loading && <p className="text-sm text-slate-400">Carregando treinamentos…</p>}
      </RhIdeiaShell>
    </AdminSaasGuard>
  );
}
