"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { superadminFetch } from "@/app/utils/superadminApi";

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

const PERM_FIELDS: { key: string; label: string }[] = [
  { key: "can_manage_reservations", label: "Gerenciar reservas" },
  { key: "can_create_edit_reservations", label: "Criar/editar reservas e lista de espera" },
  { key: "can_manage_checkins", label: "Gerenciar check-ins" },
  { key: "can_view_reports", label: "Ver relatórios" },
  { key: "can_view_cardapio", label: "Ver cardápio" },
  { key: "can_create_cardapio", label: "Criar cardápio" },
  { key: "can_edit_cardapio", label: "Editar cardápio" },
  { key: "can_delete_cardapio", label: "Excluir cardápio" },
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
  can_manage_reservations?: boolean;
  can_create_edit_reservations?: boolean;
  can_manage_checkins?: boolean;
  can_view_reports?: boolean;
  can_view_cardapio?: boolean;
  can_create_cardapio?: boolean;
  can_edit_cardapio?: boolean;
  can_delete_cardapio?: boolean;
};

const EMPTY_PERMS: Record<string, boolean> = Object.fromEntries(
  PERM_FIELDS.map((f) => [f.key, false]),
);

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

function cardapioOnlyPerms(): Record<string, boolean> {
  return {
    ...EMPTY_PERMS,
    can_view_cardapio: true,
    can_create_cardapio: true,
    can_edit_cardapio: true,
  };
}

function fullOpsPerms(): Record<string, boolean> {
  return {
    ...EMPTY_PERMS,
    can_manage_reservations: true,
    can_create_edit_reservations: true,
    can_manage_checkins: true,
    can_view_reports: true,
    can_view_cardapio: true,
    can_create_cardapio: true,
    can_edit_cardapio: true,
    can_delete_cardapio: true,
  };
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
    perms: { ...EMPTY_PERMS },
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

  const savePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permForm.userEmail.trim() || !permForm.canonicalEstablishmentId) {
      onError("Informe o e-mail do usuário e o estabelecimento.");
      return;
    }
    setSavingPerm(true);
    onError(null);
    try {
      await superadminFetch(`/organizations/${orgId}/establishment-permissions`, {
        method: "POST",
        body: JSON.stringify({
          userEmail: permForm.userEmail.trim(),
          canonicalEstablishmentId: Number(permForm.canonicalEstablishmentId),
          ...permForm.perms,
          is_active: permForm.is_active,
        }),
      });
      onSuccess("Permissões salvas para o usuário.");
      setPermForm({
        userEmail: "",
        canonicalEstablishmentId: "",
        perms: { ...EMPTY_PERMS },
        is_active: true,
      });
      loadPermissions();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao salvar permissões");
    } finally {
      setSavingPerm(false);
    }
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

  const activePermLabels = (p: EstablishmentPermission) =>
    PERM_FIELDS.filter((f) => p[f.key as keyof EstablishmentPermission] === true).map(
      (f) => f.label,
    );

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
          Atribua ou remova o que cada usuário pode fazer em cada casa — sem sair do Super Admin.
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
              onChange={(e) =>
                setPermForm((p) => ({ ...p, canonicalEstablishmentId: e.target.value }))
              }
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
              onClick={() => setPermForm((p) => ({ ...p, perms: cardapioOnlyPerms() }))}
            >
              Preset: só cardápio
            </button>
            <button
              type="button"
              className="text-amber-400 hover:underline"
              onClick={() => setPermForm((p) => ({ ...p, perms: fullOpsPerms() }))}
            >
              Preset: operação completa
            </button>
            <button
              type="button"
              className="text-slate-400 hover:underline"
              onClick={() => setPermForm((p) => ({ ...p, perms: { ...EMPTY_PERMS } }))}
            >
              Limpar
            </button>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PERM_FIELDS.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={!!permForm.perms[f.key]}
                  onChange={(e) =>
                    setPermForm((p) => ({
                      ...p,
                      perms: { ...p.perms, [f.key]: e.target.checked },
                    }))
                  }
                />
                {f.label}
              </label>
            ))}
          </div>
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
                    {activePermLabels(p).length
                      ? activePermLabels(p).join(" · ")
                      : "Sem permissões marcadas"}
                  </p>
                  <span
                    className={`text-xs ${p.is_active ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {p.is_active ? "ativo" : "inativo"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removePermission(p.id)}
                  className="rounded border border-red-900 px-2 py-1 text-xs text-red-300 hover:bg-red-950"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
