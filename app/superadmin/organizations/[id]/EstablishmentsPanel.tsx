"use client";

import Link from "next/link";
import { useState } from "react";
import { superadminFetch } from "@/app/utils/superadminApi";
import {
  MODULE_LABELS,
  type EstablishmentPermission,
  type EstablishmentRow,
  type EstablishmentUsageSummary,
  type ModuleCatalogItem,
} from "./types";

export const ESTABLISHMENT_PROFILES = [
  { value: "generic", label: "Genérico" },
  { value: "pracinha", label: "Pracinha" },
  { value: "highline", label: "HighLine" },
  { value: "rooftop", label: "Rooftop" },
  { value: "oh_fregues", label: "Oh Freguês" },
  { value: "seu_justino", label: "Seu Justino" },
  { value: "sitio_ilha", label: "Sítio Ilha" },
];

type EstablishmentModule = { key: string; name: string; is_enabled: boolean };

function slugifyEstablishmentName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Props = {
  orgId: number;
  establishments: EstablishmentRow[];
  moduleCatalog: ModuleCatalogItem[];
  permissions: EstablishmentPermission[];
  onReload: () => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
};

export default function EstablishmentsPanel({
  orgId,
  establishments,
  moduleCatalog,
  permissions,
  onReload,
  onError,
  onSuccess,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [estForm, setEstForm] = useState({
    name: "",
    slug: "",
    profile: "generic",
    enabledModules: [] as string[],
  });

  const [expandedEstId, setExpandedEstId] = useState<number | null>(null);
  const [estModules, setEstModules] = useState<EstablishmentModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const [editingEstId, setEditingEstId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", profile: "generic" });
  const [savingEdit, setSavingEdit] = useState(false);

  const [archiveTarget, setArchiveTarget] = useState<EstablishmentRow | null>(null);
  const [archiveUsage, setArchiveUsage] = useState<EstablishmentUsageSummary | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [archiveConfirmText, setArchiveConfirmText] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const catalogKeys = moduleCatalog.map((m) => m.key);

  const activeEstablishments = establishments.filter(
    (e) => (e.status || "active") !== "archived",
  );
  const archivedEstablishments = establishments.filter(
    (e) => (e.status || "active") === "archived",
  );

  const usersOfEstablishment = (estId: number) =>
    permissions.filter(
      (p) =>
        Number(p.canonical_establishment_id) === estId && p.is_active !== false,
    );

  const loadEstModules = async (estId: number) => {
    setLoadingModules(true);
    try {
      const rows = await superadminFetch<EstablishmentModule[]>(
        `/establishments/${estId}/modules`,
      );
      setEstModules(rows);
    } catch {
      setEstModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  const toggleExpanded = async (estId: number) => {
    if (expandedEstId === estId) {
      setExpandedEstId(null);
      return;
    }
    setExpandedEstId(estId);
    await loadEstModules(estId);
  };

  const toggleEstModule = async (
    estId: number,
    moduleKey: string,
    isEnabled: boolean,
  ) => {
    onError(null);
    try {
      await superadminFetch(`/establishments/${estId}/modules/${moduleKey}`, {
        method: "PUT",
        body: JSON.stringify({ is_enabled: !isEnabled }),
      });
      if (expandedEstId === estId) await loadEstModules(estId);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao atualizar módulo");
    }
  };

  const openAddForm = () => {
    setShowAdd(true);
    setEstForm({
      name: "",
      slug: "",
      profile: "generic",
      enabledModules: [...catalogKeys],
    });
    setSlugTouched(false);
  };

  const addEstablishment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estForm.name.trim()) return;
    if (!estForm.enabledModules.length) {
      onError("Selecione ao menos um módulo para o estabelecimento.");
      return;
    }
    setAdding(true);
    onError(null);
    onSuccess(null);
    try {
      const result = await superadminFetch<{
        name: string;
        legacyPlaceId: number;
        legacyBarId: number;
      }>(`/organizations/${orgId}/establishments`, {
        method: "POST",
        body: JSON.stringify({
          name: estForm.name.trim(),
          slug: estForm.slug.trim() || slugifyEstablishmentName(estForm.name),
          profile: estForm.profile,
          enabledModules: estForm.enabledModules,
        }),
      });
      onSuccess(
        `"${result.name}" criado (place ${result.legacyPlaceId}). Configure os usuários na aba "Usuários e acessos".`,
      );
      setShowAdd(false);
      onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao criar estabelecimento");
    } finally {
      setAdding(false);
    }
  };

  const toggleCreateModule = (key: string) => {
    setEstForm((prev) => {
      const has = prev.enabledModules.includes(key);
      return {
        ...prev,
        enabledModules: has
          ? prev.enabledModules.filter((k) => k !== key)
          : [...prev.enabledModules, key],
      };
    });
  };

  const openEditForm = (est: EstablishmentRow) => {
    if (editingEstId === est.id) {
      setEditingEstId(null);
      return;
    }
    setEditingEstId(est.id);
    setEditForm({ name: est.name, profile: "generic" });
  };

  const saveEdit = async (est: EstablishmentRow, e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    setSavingEdit(true);
    onError(null);
    onSuccess(null);
    try {
      const result = await superadminFetch<{ name: string }>(
        `/organizations/${orgId}/establishments/${est.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: editForm.name.trim(),
            profile: editForm.profile,
          }),
        },
      );
      onSuccess(`"${result.name}" atualizado com sucesso.`);
      setEditingEstId(null);
      onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao atualizar estabelecimento");
    } finally {
      setSavingEdit(false);
    }
  };

  const openArchiveFlow = async (est: EstablishmentRow) => {
    setArchiveTarget(est);
    setArchiveUsage(null);
    setArchiveConfirmText("");
    setLoadingUsage(true);
    onError(null);
    try {
      const summary = await superadminFetch<EstablishmentUsageSummary>(
        `/organizations/${orgId}/establishments/${est.id}/usage`,
      );
      setArchiveUsage(summary);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao carregar impacto da exclusão");
      setArchiveTarget(null);
    } finally {
      setLoadingUsage(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    onError(null);
    try {
      const result = await superadminFetch<{
        name: string;
        deactivatedMemberships: number;
        deactivatedPermissions: number;
      }>(`/organizations/${orgId}/establishments/${archiveTarget.id}/archive`, {
        method: "POST",
      });
      onSuccess(
        `"${result.name}" arquivado. ${result.deactivatedPermissions} acessos de usuários foram desativados. Você pode restaurar quando quiser.`,
      );
      setArchiveTarget(null);
      setArchiveUsage(null);
      onReload();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao arquivar estabelecimento");
    } finally {
      setArchiving(false);
    }
  };

  const restoreEstablishment = async (est: EstablishmentRow) => {
    if (!confirm(`Restaurar "${est.name}"? Os acessos desativados no arquivamento voltam a valer.`)) {
      return;
    }
    setRestoringId(est.id);
    onError(null);
    try {
      const result = await superadminFetch<{
        name: string;
        restoredMemberships: number;
        restoredPermissions: number;
      }>(`/organizations/${orgId}/establishments/${est.id}/restore`, {
        method: "POST",
      });
      onSuccess(
        `"${result.name}" restaurado. ${result.restoredPermissions} acessos de usuários foram reativados.`,
      );
      onReload();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao restaurar estabelecimento");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Estabelecimentos</h3>
          <p className="text-sm text-slate-400">
            As casas da organização, seus módulos e regras de operação.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (showAdd ? setShowAdd(false) : openAddForm())}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          {showAdd ? "Cancelar" : "Adicionar estabelecimento"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={addEstablishment}
          className="mb-4 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">Nome</label>
            <input
              required
              placeholder="Ex: Apê do Pracinha"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={estForm.name}
              onChange={(e) => {
                const name = e.target.value;
                setEstForm((prev) => ({
                  ...prev,
                  name,
                  slug: slugTouched ? prev.slug : slugifyEstablishmentName(name),
                }));
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Slug</label>
            <input
              required
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={estForm.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setEstForm((prev) => ({ ...prev, slug: e.target.value }));
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Perfil operacional
            </label>
            <select
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={estForm.profile}
              onChange={(e) =>
                setEstForm((prev) => ({ ...prev, profile: e.target.value }))
              }
            >
              {ESTABLISHMENT_PROFILES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <p className="mb-2 text-xs font-medium text-slate-400">
              Funcionalidades deste estabelecimento (marque quantas quiser)
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {moduleCatalog.map((m) => {
                const on = estForm.enabledModules.includes(m.key);
                return (
                  <label
                    key={m.key}
                    className="flex items-center gap-2 rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleCreateModule(m.key)}
                    />
                    {MODULE_LABELS[m.key] || m.name || m.key}
                  </label>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs text-amber-400 hover:underline"
                onClick={() =>
                  setEstForm((p) => ({ ...p, enabledModules: [...catalogKeys] }))
                }
              >
                Marcar todos
              </button>
              <button
                type="button"
                className="text-xs text-slate-400 hover:underline"
                onClick={() =>
                  setEstForm((p) => ({ ...p, enabledModules: ["cardapio"] }))
                }
              >
                Só cardápio
              </button>
              <button
                type="button"
                className="text-xs text-slate-400 hover:underline"
                onClick={() => setEstForm((p) => ({ ...p, enabledModules: [] }))}
              >
                Limpar
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="md:col-span-2 rounded-lg bg-emerald-600 py-2 text-sm font-medium disabled:opacity-50"
          >
            {adding ? "Criando…" : "Criar estabelecimento"}
          </button>
        </form>
      )}

      {activeEstablishments.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum estabelecimento ativo.</p>
      ) : (
        <ul className="space-y-2 text-sm text-slate-300">
          {activeEstablishments.map((e) => {
            const estUsers = usersOfEstablishment(e.id);
            return (
              <li
                key={e.id}
                className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-100">{e.name}</p>
                    <p className="text-xs text-slate-500">
                      place {e.legacy_place_id ?? "—"} · bar {e.legacy_bar_id ?? "—"} ·{" "}
                      {estUsers.length}{" "}
                      {estUsers.length === 1
                        ? "usuário com acesso"
                        : "usuários com acesso"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(e.id)}
                      className="rounded bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600"
                    >
                      {expandedEstId === e.id ? "Ocultar módulos" : "Módulos"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditForm(e)}
                      className="rounded bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600"
                    >
                      {editingEstId === e.id ? "Fechar edição" : "Renomear"}
                    </button>
                    <Link
                      href={`/superadmin/organizations/${orgId}/establishments/${e.id}`}
                      className="rounded bg-amber-700/80 px-3 py-1 text-xs font-medium text-amber-100 hover:bg-amber-600"
                    >
                      Editar regras
                    </Link>
                    <button
                      type="button"
                      onClick={() => openArchiveFlow(e)}
                      className="rounded border border-red-900 px-3 py-1 text-xs text-red-300 hover:bg-red-950"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                {editingEstId === e.id && (
                  <form
                    onSubmit={(ev) => saveEdit(e, ev)}
                    className="mt-3 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4 md:grid-cols-2"
                  >
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Nome</label>
                      <input
                        required
                        className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        value={editForm.name}
                        onChange={(ev) =>
                          setEditForm((prev) => ({ ...prev, name: ev.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">
                        Perfil operacional (selecionar troca o perfil atual)
                      </label>
                      <select
                        className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        value={editForm.profile}
                        onChange={(ev) =>
                          setEditForm((prev) => ({ ...prev, profile: ev.target.value }))
                        }
                      >
                        {ESTABLISHMENT_PROFILES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 md:col-span-2">
                      <button
                        type="submit"
                        disabled={savingEdit}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
                      >
                        {savingEdit ? "Salvando…" : "Salvar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingEstId(null)}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
                {expandedEstId === e.id && (
                  <div className="mt-3 border-t border-slate-800 pt-3">
                    {loadingModules ? (
                      <p className="text-xs text-slate-500">Carregando módulos…</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {estModules.map((m) => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => toggleEstModule(e.id, m.key, m.is_enabled)}
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
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {archiveTarget && (
        <div className="mt-4 rounded-lg border border-red-900/70 bg-red-950/20 p-4">
          <h4 className="text-base font-semibold text-red-200">
            Excluir &quot;{archiveTarget.name}&quot;
          </h4>
          <p className="mt-1 text-sm text-slate-300">
            A exclusão é <strong>segura e reversível</strong>: o estabelecimento é
            arquivado, sai do site e dos painéis, e os acessos dos usuários a ele são
            desativados. Nenhuma reserva, conversa ou item de cardápio é apagado — você
            pode restaurar tudo depois.
          </p>

          {loadingUsage ? (
            <p className="mt-3 text-sm text-slate-400">Calculando impacto…</p>
          ) : archiveUsage ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                {
                  label: "Usuários com acesso",
                  value: archiveUsage.usage.usersWithAccess,
                },
                {
                  label: "Memberships ativos",
                  value: archiveUsage.usage.activeMemberships,
                },
                { label: "Reservas", value: archiveUsage.usage.reservations },
                {
                  label: "Conversas WhatsApp",
                  value: archiveUsage.usage.whatsappConversations,
                },
                { label: "Itens de cardápio", value: archiveUsage.usage.menuItems },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded border border-slate-800 bg-slate-950/60 p-2 text-center"
                >
                  <p className="text-lg font-bold text-slate-100">{item.value}</p>
                  <p className="text-[11px] text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4">
            <label className="mb-1 block text-xs text-slate-400">
              Para confirmar, digite o nome do estabelecimento:{" "}
              <strong className="text-slate-200">{archiveTarget.name}</strong>
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                placeholder={archiveTarget.name}
                value={archiveConfirmText}
                onChange={(e) => setArchiveConfirmText(e.target.value)}
              />
              <button
                type="button"
                disabled={
                  archiving ||
                  loadingUsage ||
                  archiveConfirmText.trim().toLowerCase() !==
                    archiveTarget.name.trim().toLowerCase()
                }
                onClick={confirmArchive}
                className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {archiving ? "Excluindo…" : "Excluir estabelecimento"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setArchiveTarget(null);
                  setArchiveUsage(null);
                }}
                className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {archivedEstablishments.length > 0 && (
        <div className="mt-4 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            {showArchived ? "▾" : "▸"} Arquivados ({archivedEstablishments.length})
          </button>
          {showArchived && (
            <ul className="mt-2 space-y-2 text-sm">
              {archivedEstablishments.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/70 bg-slate-950/30 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-400">{e.name}</p>
                    <p className="text-xs text-slate-600">
                      place {e.legacy_place_id ?? "—"} · bar {e.legacy_bar_id ?? "—"} ·
                      arquivado
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={restoringId === e.id}
                    onClick={() => restoreEstablishment(e)}
                    className="rounded border border-emerald-800 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
                  >
                    {restoringId === e.id ? "Restaurando…" : "Restaurar"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
