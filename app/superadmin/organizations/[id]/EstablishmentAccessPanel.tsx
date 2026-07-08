"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { superadminFetch } from "@/app/utils/superadminApi";
import {
  ESTABLISHMENT_PERMISSION_GROUPS,
  activePermissionLabels,
  additiveAtendimentoFlags,
  additiveCardapioFlags,
  additiveReservasFlags,
  atendimentoOnlyPermissions,
  cardapioOnlyPermissions,
  emptyEstablishmentPermissions,
  fullOperationPermissions,
  mergePermissionFlags,
  permissionFlagsFromRow,
  type EstablishmentPermissionFlags,
  type EstablishmentPermissionKey,
} from "@/app/config/establishmentPermissionCatalog";

const DEFAULT_MODULE_CATALOG: ModuleCatalogItem[] = [
  { key: "reservas", name: "Reservas" },
  { key: "checkin", name: "Check-in" },
  { key: "cardapio", name: "Cardápio" },
  { key: "whatsapp", name: "WhatsApp / IA" },
  { key: "eventos", name: "Eventos" },
  { key: "promoters", name: "Promoters" },
  { key: "relatorios", name: "Relatórios" },
];
export const MODULE_LABELS: Record<string, string> = Object.fromEntries(
  DEFAULT_MODULE_CATALOG.map((m) => [m.key, m.name]),
);

export const ESTABLISHMENT_PROFILES = [
  { value: "generic", label: "Genérico" },
  { value: "pracinha", label: "Pracinha" },
  { value: "highline", label: "HighLine" },
  { value: "rooftop", label: "Rooftop" },
  { value: "oh_fregues", label: "Oh Freguês" },
  { value: "seu_justino", label: "Seu Justino" },
  { value: "sitio_ilha", label: "Sítio Ilha" },
];

type ModuleCatalogItem = { key: string; name: string };
type EstablishmentRow = {
  id: number;
  name: string;
  legacy_place_id: number | null;
  legacy_bar_id: number | null;
};
type EstablishmentModule = { key: string; name: string; is_enabled: boolean };
type OrgUser = { id: number; name: string; email: string };
type EstablishmentPermission = {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  establishment_id: number;
  establishment_name: string;
  canonical_establishment_id: number;
  is_active: boolean;
} & Partial<Record<EstablishmentPermissionKey, boolean>>;

function slugifyEstablishmentName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function allModuleKeys(catalog: ModuleCatalogItem[]): string[] {
  return catalog.map((m) => m.key);
}

function PermissionFieldsEditor({
  value,
  onChange,
}: {
  value: EstablishmentPermissionFlags;
  onChange: (next: EstablishmentPermissionFlags) => void;
}) {
  return (
    <div className="md:col-span-2 space-y-4">
      {ESTABLISHMENT_PERMISSION_GROUPS.map((group) => (
        <div
          key={group.id}
          className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
        >
          <p className="mb-1 text-sm font-medium text-slate-200">{group.title}</p>
          {group.description && (
            <p className="mb-2 text-xs text-slate-500">{group.description}</p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {group.fields.map((field) => (
              <label
                key={field.key}
                className="flex items-start gap-2 text-xs text-slate-300"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!value[field.key]}
                  onChange={(e) =>
                    onChange({ ...value, [field.key]: e.target.checked })
                  }
                />
                <span>
                  {field.label}
                  {field.hint && (
                    <span className="mt-0.5 block text-[10px] text-slate-500">
                      {field.hint}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type Props = {
  orgId: number;
  establishments: EstablishmentRow[];
  moduleCatalog: ModuleCatalogItem[];
  orgUsers: OrgUser[];
  onReload: () => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
};

export default function EstablishmentAccessPanel({
  orgId,
  establishments,
  moduleCatalog,
  orgUsers,
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

  const [permissions, setPermissions] = useState<EstablishmentPermission[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerm, setSavingPerm] = useState(false);
  const [permForm, setPermForm] = useState({
    userEmail: "",
    canonicalEstablishmentId: "",
    perms: emptyEstablishmentPermissions(),
    is_active: true,
  });

  const catalogKeys = allModuleKeys(
    moduleCatalog.length > 0 ? moduleCatalog : DEFAULT_MODULE_CATALOG,
  );
  const catalogForUi =
    moduleCatalog.length > 0 ? moduleCatalog : DEFAULT_MODULE_CATALOG;

  const loadPermissions = useCallback(() => {
    if (!Number.isFinite(orgId)) return;
    setLoadingPerms(true);
    superadminFetch<EstablishmentPermission[]>(`/organizations/${orgId}/establishment-permissions`)
      .then(setPermissions)
      .catch(() => setPermissions([]))
      .finally(() => setLoadingPerms(false));
  }, [orgId]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions, establishments.length]);

  const loadEstModules = async (estId: number) => {
    setLoadingModules(true);
    try {
      const rows = await superadminFetch<EstablishmentModule[]>(`/establishments/${estId}/modules`);
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

  const toggleEstModule = async (estId: number, moduleKey: string, isEnabled: boolean) => {
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
        `"${result.name}" criado (place ${result.legacyPlaceId}). Configure usuários abaixo.`,
      );
      setShowAdd(false);
      onReload();
      loadPermissions();
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

  const findExistingPermission = useCallback(
    (userEmail: string, canonicalEstablishmentId: string) => {
      const email = userEmail.trim().toLowerCase();
      const estId = Number(canonicalEstablishmentId);
      if (!email || !Number.isFinite(estId) || estId <= 0) return null;
      return (
        permissions.find(
          (p) =>
            p.user_email.trim().toLowerCase() === email &&
            Number(p.canonical_establishment_id) === estId,
        ) ?? null
      );
    },
    [permissions],
  );

  const savePermissionPayload = async (
    payload: Record<string, unknown>,
    successMessage: string,
  ) => {
    setSavingPerm(true);
    onError(null);
    try {
      await superadminFetch(`/organizations/${orgId}/establishment-permissions`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onSuccess(successMessage);
      loadPermissions();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao salvar permissões");
    } finally {
      setSavingPerm(false);
    }
  };

  const savePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permForm.userEmail.trim() || !permForm.canonicalEstablishmentId) {
      onError("Informe o e-mail do usuário e o estabelecimento.");
      return;
    }
    const existing = findExistingPermission(
      permForm.userEmail,
      permForm.canonicalEstablishmentId,
    );
    if (
      existing &&
      !confirm(
        "Isso substitui todas as permissões deste usuário neste estabelecimento. Continuar?",
      )
    ) {
      return;
    }
    await savePermissionPayload(
      {
        userEmail: permForm.userEmail.trim(),
        canonicalEstablishmentId: Number(permForm.canonicalEstablishmentId),
        ...permForm.perms,
        is_active: permForm.is_active,
      },
      "Permissões salvas para o usuário.",
    );
    setPermForm({
      userEmail: "",
      canonicalEstablishmentId: "",
      perms: emptyEstablishmentPermissions(),
      is_active: true,
    });
  };

  const grantAdditivePermission = async (
    p: EstablishmentPermission,
    patch: Partial<EstablishmentPermissionFlags>,
    label: string,
  ) => {
    await savePermissionPayload(
      {
        userEmail: p.user_email,
        canonicalEstablishmentId: p.canonical_establishment_id,
        merge: true,
        is_active: true,
        ...patch,
      },
      `${label} adicionado para ${p.user_email}.`,
    );
  };

  const removePermission = async (permId: number) => {
    if (!confirm("Remover acesso deste usuário a este estabelecimento?")) return;
    onError(null);
    try {
      await superadminFetch(`/organizations/${orgId}/establishment-permissions/${permId}`, {
        method: "DELETE",
      });
      loadPermissions();
      onSuccess("Permissão removida.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao remover permissão");
    }
  };

  const loadPermissionIntoForm = (p: EstablishmentPermission) => {
    setPermForm({
      userEmail: p.user_email,
      canonicalEstablishmentId: String(p.canonical_establishment_id),
      perms: permissionFlagsFromRow(p),
      is_active: p.is_active !== false,
    });
    onSuccess(null);
    onError(null);
  };

  const activePermLabelsForRow = (p: EstablishmentPermission) =>
    activePermissionLabels(p);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Estabelecimentos</h3>
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
              <label className="mb-1 block text-xs text-slate-400">Perfil operacional</label>
              <select
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={estForm.profile}
                onChange={(e) => setEstForm((prev) => ({ ...prev, profile: e.target.value }))}
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
                {catalogForUi.map((m) => {
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

        <ul className="space-y-2 text-sm text-slate-300">
          {establishments.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {e.name}{" "}
                  <span className="text-slate-500">
                    (place {e.legacy_place_id ?? "—"} · bar {e.legacy_bar_id ?? "—"})
                  </span>
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(e.id)}
                    className="rounded bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600"
                  >
                    {expandedEstId === e.id ? "Ocultar módulos" : "Módulos"}
                  </button>
                  <Link
                    href={`/superadmin/organizations/${orgId}/establishments/${e.id}`}
                    className="rounded bg-amber-700/80 px-3 py-1 text-xs font-medium text-amber-100 hover:bg-amber-600"
                  >
                    Editar regras
                  </Link>
                </div>
              </div>
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
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-1 text-lg font-semibold">Usuários por estabelecimento</h3>
        <p className="mb-4 text-sm text-slate-400">
          Atribua ou remova o que cada usuário pode fazer em cada casa. Use{" "}
          <strong className="text-slate-300">+ Atendimento</strong> na lista para adicionar sem
          apagar o resto. O formulário abaixo <strong className="text-slate-300">substitui</strong>{" "}
          tudo — clique em Editar antes de salvar.
        </p>

        <form onSubmit={savePermission} className="mb-6 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">E-mail do usuário</label>
            <input
              required
              list="org-user-emails"
              placeholder="usuario@email.com"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={permForm.userEmail}
              onChange={(e) =>
                setPermForm((p) => ({ ...p, userEmail: e.target.value }))
              }
            />
            <datalist id="org-user-emails">
              {orgUsers.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name}
                </option>
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Estabelecimento</label>
            <select
              required
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={permForm.canonicalEstablishmentId}
              onChange={(e) => {
                const canonicalEstablishmentId = e.target.value;
                const existing = findExistingPermission(
                  permForm.userEmail,
                  canonicalEstablishmentId,
                );
                setPermForm((p) => ({
                  ...p,
                  canonicalEstablishmentId,
                  perms: existing
                    ? permissionFlagsFromRow(existing)
                    : p.canonicalEstablishmentId
                      ? emptyEstablishmentPermissions()
                      : p.perms,
                  is_active: existing ? existing.is_active !== false : p.is_active,
                }));
              }}
            >
              <option value="">Selecione…</option>
              {establishments.map((est) => (
                <option key={est.id} value={String(est.id)}>
                  {est.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              className="text-amber-400 hover:underline"
              onClick={() => {
                if (
                  !confirm(
                    "Substituir todas as permissões do formulário por acesso total?",
                  )
                ) {
                  return;
                }
                setPermForm((p) => ({ ...p, perms: fullOperationPermissions() }));
              }}
            >
              Substituir por: tudo liberado
            </button>
            <button
              type="button"
              className="text-amber-400 hover:underline"
              onClick={() => {
                if (
                  !confirm(
                    "Substituir todas as permissões do formulário pelo preset de atendimento?",
                  )
                ) {
                  return;
                }
                setPermForm((p) => ({ ...p, perms: atendimentoOnlyPermissions() }));
              }}
            >
              Substituir por: só atendimento
            </button>
            <button
              type="button"
              className="text-amber-400 hover:underline"
              onClick={() => {
                if (
                  !confirm(
                    "Substituir todas as permissões do formulário pelo preset de cardápio?",
                  )
                ) {
                  return;
                }
                setPermForm((p) => ({ ...p, perms: cardapioOnlyPermissions() }));
              }}
            >
              Substituir por: só cardápio
            </button>
            <button
              type="button"
              className="text-emerald-400 hover:underline"
              onClick={() =>
                setPermForm((p) => ({
                  ...p,
                  perms: mergePermissionFlags(p.perms, additiveAtendimentoFlags()),
                }))
              }
            >
              + Adicionar atendimento (no formulário)
            </button>
            <button
              type="button"
              className="text-emerald-400 hover:underline"
              onClick={() =>
                setPermForm((p) => ({
                  ...p,
                  perms: mergePermissionFlags(p.perms, additiveReservasFlags()),
                }))
              }
            >
              + Adicionar reservas (no formulário)
            </button>
            <button
              type="button"
              className="text-emerald-400 hover:underline"
              onClick={() =>
                setPermForm((p) => ({
                  ...p,
                  perms: mergePermissionFlags(p.perms, additiveCardapioFlags()),
                }))
              }
            >
              + Adicionar cardápio (no formulário)
            </button>
            <button
              type="button"
              className="text-slate-400 hover:underline"
              onClick={() =>
                setPermForm((p) => ({
                  ...p,
                  perms: emptyEstablishmentPermissions(),
                }))
              }
            >
              Limpar tudo
            </button>
          </div>
          <PermissionFieldsEditor
            value={permForm.perms}
            onChange={(perms) => setPermForm((p) => ({ ...p, perms }))}
          />
          <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={permForm.is_active}
              onChange={(e) =>
                setPermForm((p) => ({ ...p, is_active: e.target.checked }))
              }
            />
            Acesso ativo
          </label>
          <button
            type="submit"
            disabled={savingPerm}
            className="md:col-span-2 rounded-lg bg-emerald-600 py-2 text-sm font-medium disabled:opacity-50"
          >
            {savingPerm ? "Salvando…" : "Salvar permissões do usuário"}
          </button>
        </form>

        {loadingPerms ? (
          <p className="text-sm text-slate-500">Carregando permissões…</p>
        ) : permissions.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma permissão cadastrada ainda.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {permissions.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded border border-slate-800 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-slate-200">
                    {p.user_name || p.user_email} · {p.establishment_name}
                  </p>
                  <p className="text-xs text-slate-500">{p.user_email}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {activePermLabelsForRow(p).length
                      ? activePermLabelsForRow(p).join(" · ")
                      : "Sem permissões marcadas"}
                  </p>
                  <span
                    className={`text-xs ${p.is_active ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {p.is_active ? "ativo" : "inativo"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingPerm}
                    onClick={() =>
                      grantAdditivePermission(p, additiveAtendimentoFlags(), "Atendimento")
                    }
                    className="rounded border border-emerald-800 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
                  >
                    + Atendimento
                  </button>
                  <button
                    type="button"
                    disabled={savingPerm}
                    onClick={() =>
                      grantAdditivePermission(p, additiveReservasFlags(), "Reservas")
                    }
                    className="rounded border border-emerald-800 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
                  >
                    + Reservas
                  </button>
                  <button
                    type="button"
                    disabled={savingPerm}
                    onClick={() =>
                      grantAdditivePermission(p, additiveCardapioFlags(), "Cardápio")
                    }
                    className="rounded border border-emerald-800 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
                  >
                    + Cardápio
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPermissionIntoForm(p)}
                    className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => removePermission(p.id)}
                    className="rounded border border-red-900 px-2 py-1 text-xs text-red-300 hover:bg-red-950"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
