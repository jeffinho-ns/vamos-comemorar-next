"use client";

import { useMemo, useState } from "react";
import { superadminFetch } from "@/app/utils/superadminApi";
import {
  activePermissionLabels,
  additiveAtendimentoFlags,
  additiveCardapioFlags,
  additiveReservasFlags,
  emptyEstablishmentPermissions,
  fullOperationPermissions,
  mergePermissionFlags,
  permissionFlagsFromRow,
  type EstablishmentPermissionFlags,
} from "@/app/config/establishmentPermissionCatalog";
import PermissionFieldsEditor from "./PermissionFieldsEditor";
import {
  SAAS_ROLE_OPTIONS,
  type EstablishmentPermission,
  type EstablishmentRow,
  type MembershipRow,
  type OrgUser,
} from "./types";

type UserCard = {
  key: string;
  userId: number | null;
  name: string;
  email: string;
  legacyRole: string | null;
  memberships: MembershipRow[];
  permissions: EstablishmentPermission[];
};

type Props = {
  orgId: number;
  orgUsers: OrgUser[];
  memberships: MembershipRow[];
  permissions: EstablishmentPermission[];
  establishments: EstablishmentRow[];
  impersonatingId: number | null;
  onImpersonate: (userId: number) => void;
  onReload: () => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export default function UserAccessPanel({
  orgId,
  orgUsers,
  memberships,
  permissions,
  establishments,
  impersonatingId,
  onImpersonate,
  onReload,
  onError,
  onSuccess,
}: Props) {
  const [search, setSearch] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showAddUser, setShowAddUser] = useState(false);
  const [addForm, setAddForm] = useState({
    email: "",
    roleKey: "recepcao",
    establishmentId: "",
  });

  const [roleForm, setRoleForm] = useState({
    roleKey: "recepcao",
    establishmentId: "",
  });

  const [permEditor, setPermEditor] = useState<{
    userKey: string;
    userEmail: string;
    establishmentId: string;
    perms: EstablishmentPermissionFlags;
    isActive: boolean;
    existingPermId: number | null;
  } | null>(null);

  const cards = useMemo<UserCard[]>(() => {
    const map = new Map<string, UserCard>();
    const ensure = (email: string, name?: string | null): UserCard => {
      const key = normalizeEmail(email);
      let card = map.get(key);
      if (!card) {
        card = {
          key,
          userId: null,
          name: name || email,
          email,
          legacyRole: null,
          memberships: [],
          permissions: [],
        };
        map.set(key, card);
      }
      if (name && (!card.name || card.name === card.email)) card.name = name;
      return card;
    };
    for (const u of orgUsers) {
      const card = ensure(u.email, u.name);
      card.userId = u.id;
      card.legacyRole = u.role;
    }
    for (const m of memberships) {
      ensure(m.user_email, m.user_name).memberships.push(m);
    }
    for (const p of permissions) {
      const card = ensure(p.user_email, p.user_name);
      card.permissions.push(p);
      if (card.userId === null) card.userId = p.user_id;
    }
    const list = Array.from(map.values());
    list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return list;
  }, [orgUsers, memberships, permissions]);

  const filteredCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cards;
    return cards.filter(
      (c) =>
        c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term),
    );
  }, [cards, search]);

  const runAction = async (fn: () => Promise<void>) => {
    setSaving(true);
    onError(null);
    try {
      await fn();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const addMembership = (email: string, roleKey: string, establishmentId: string) =>
    runAction(async () => {
      await superadminFetch(`/organizations/${orgId}/memberships`, {
        method: "POST",
        body: JSON.stringify({
          userEmail: email.trim(),
          roleKey,
          establishmentId: establishmentId ? Number(establishmentId) : undefined,
        }),
      });
      onSuccess(`Role atribuído para ${email.trim()}.`);
      onReload();
    });

  const toggleMembership = (m: MembershipRow) => {
    if (
      m.is_active &&
      !confirm("Desativar este acesso? O usuário perde as permissões deste role.")
    ) {
      return;
    }
    return runAction(async () => {
      await superadminFetch(`/organizations/${orgId}/memberships/${m.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !m.is_active }),
      });
      onSuccess(m.is_active ? "Acesso desativado." : "Acesso reativado.");
      onReload();
    });
  };

  const submitAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.email.trim()) return;
    await addMembership(addForm.email, addForm.roleKey, addForm.establishmentId);
    setAddForm({ email: "", roleKey: "recepcao", establishmentId: "" });
    setShowAddUser(false);
  };

  const savePermPayload = (
    payload: Record<string, unknown>,
    successMessage: string,
  ) =>
    runAction(async () => {
      await superadminFetch(`/organizations/${orgId}/establishment-permissions`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onSuccess(successMessage);
      onReload();
    });

  const grantAdditive = (
    card: UserCard,
    establishmentId: number,
    patch: Partial<EstablishmentPermissionFlags>,
    label: string,
  ) =>
    savePermPayload(
      {
        userEmail: card.email,
        canonicalEstablishmentId: establishmentId,
        merge: true,
        is_active: true,
        ...patch,
      },
      `${label} adicionado para ${card.email}.`,
    );

  const removePermission = async (permId: number) => {
    if (!confirm("Remover acesso deste usuário a este estabelecimento?")) return;
    await runAction(async () => {
      await superadminFetch(
        `/organizations/${orgId}/establishment-permissions/${permId}`,
        { method: "DELETE" },
      );
      onSuccess("Acesso removido.");
      onReload();
    });
  };

  const openPermEditor = (
    card: UserCard,
    existing: EstablishmentPermission | null,
    establishmentId?: number,
  ) => {
    setPermEditor({
      userKey: card.key,
      userEmail: card.email,
      establishmentId: existing
        ? String(existing.canonical_establishment_id)
        : establishmentId
          ? String(establishmentId)
          : "",
      perms: existing
        ? permissionFlagsFromRow(existing)
        : emptyEstablishmentPermissions(),
      isActive: existing ? existing.is_active !== false : true,
      existingPermId: existing ? existing.id : null,
    });
  };

  const changeEditorEstablishment = (card: UserCard, establishmentId: string) => {
    const existing =
      card.permissions.find(
        (p) => Number(p.canonical_establishment_id) === Number(establishmentId),
      ) ?? null;
    setPermEditor((prev) =>
      prev
        ? {
            ...prev,
            establishmentId,
            perms: existing
              ? permissionFlagsFromRow(existing)
              : emptyEstablishmentPermissions(),
            isActive: existing ? existing.is_active !== false : true,
            existingPermId: existing ? existing.id : null,
          }
        : prev,
    );
  };

  const submitPermEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permEditor || !permEditor.establishmentId) {
      onError("Selecione o estabelecimento.");
      return;
    }
    await savePermPayload(
      {
        userEmail: permEditor.userEmail,
        canonicalEstablishmentId: Number(permEditor.establishmentId),
        ...permEditor.perms,
        is_active: permEditor.isActive,
      },
      `Permissões salvas para ${permEditor.userEmail}.`,
    );
    setPermEditor(null);
  };

  const toggleExpanded = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
    setPermEditor(null);
    setRoleForm({ roleKey: "recepcao", establishmentId: "" });
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Usuários e acessos</h3>
          <p className="text-sm text-slate-400">
            Tudo de cada usuário em um lugar: roles SaaS, permissões por casa e suporte.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Buscar por nome ou e-mail…"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowAddUser((v) => !v)}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            {showAddUser ? "Cancelar" : "Adicionar usuário"}
          </button>
        </div>
      </div>

      {showAddUser && (
        <form
          onSubmit={submitAddUser}
          className="mb-4 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">
              E-mail do usuário (precisa já ter cadastro)
            </label>
            <input
              type="email"
              required
              placeholder="usuario@email.com"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={addForm.email}
              onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Role SaaS</label>
            <select
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={addForm.roleKey}
              onChange={(e) => setAddForm((p) => ({ ...p, roleKey: e.target.value }))}
            >
              {SAAS_ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Escopo</label>
            <select
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={addForm.establishmentId}
              onChange={(e) =>
                setAddForm((p) => ({ ...p, establishmentId: e.target.value }))
              }
            >
              <option value="">Toda a organização</option>
              {establishments.map((est) => (
                <option key={est.id} value={String(est.id)}>
                  {est.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50 sm:col-span-2 lg:col-span-4"
          >
            {saving ? "Adicionando…" : "Adicionar à organização"}
          </button>
        </form>
      )}

      {filteredCards.length === 0 ? (
        <p className="text-sm text-slate-500">
          {cards.length === 0
            ? "Nenhum usuário vinculado a esta organização ainda."
            : "Nenhum usuário encontrado para a busca."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredCards.map((card) => {
            const expanded = expandedKey === card.key;
            const activeMemberships = card.memberships.filter((m) => m.is_active);
            return (
              <li
                key={card.key}
                className="rounded-lg border border-slate-800 bg-slate-950/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-100">{card.name}</p>
                    <p className="text-xs text-slate-500">
                      {card.email}
                      {card.legacyRole ? ` · perfil ${card.legacyRole}` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {activeMemberships.map((m) => (
                        <span
                          key={`m-${m.id}`}
                          className="rounded-full bg-amber-950/60 px-2 py-0.5 text-[11px] text-amber-300"
                        >
                          {m.role_name || m.role_key}
                          {m.establishment_name ? ` · ${m.establishment_name}` : " · org inteira"}
                        </span>
                      ))}
                      {card.permissions
                        .filter((p) => p.is_active !== false)
                        .map((p) => (
                          <span
                            key={`p-${p.id}`}
                            className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300"
                          >
                            {p.establishment_name}
                          </span>
                        ))}
                      {activeMemberships.length === 0 &&
                        card.permissions.length === 0 && (
                          <span className="rounded-full bg-red-950/60 px-2 py-0.5 text-[11px] text-red-300">
                            sem acesso configurado
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {card.userId !== null && (
                      <button
                        type="button"
                        disabled={impersonatingId === card.userId}
                        onClick={() => onImpersonate(card.userId as number)}
                        className="rounded border border-amber-800 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-950 disabled:opacity-50"
                      >
                        {impersonatingId === card.userId ? "Abrindo…" : "Entrar como"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(card.key)}
                      className="rounded bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600"
                    >
                      {expanded ? "Fechar" : "Gerenciar acesso"}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="space-y-4 border-t border-slate-800 px-4 py-4">
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-200">
                        Roles SaaS
                      </p>
                      {card.memberships.length === 0 ? (
                        <p className="mb-2 text-xs text-slate-500">
                          Nenhum role SaaS atribuído.
                        </p>
                      ) : (
                        <ul className="mb-2 space-y-1 text-xs text-slate-300">
                          {card.memberships.map((m) => (
                            <li
                              key={m.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 px-2 py-1.5"
                            >
                              <span>
                                {m.role_name || m.role_key} ·{" "}
                                {m.establishment_name || "org inteira"}
                              </span>
                              <span className="flex items-center gap-2">
                                <span
                                  className={
                                    m.is_active ? "text-emerald-400" : "text-slate-500"
                                  }
                                >
                                  {m.is_active ? "ativo" : "inativo"}
                                </span>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => toggleMembership(m)}
                                  className={
                                    m.is_active
                                      ? "rounded border border-red-900 px-2 py-1 text-red-300 hover:bg-red-950 disabled:opacity-50"
                                      : "rounded border border-emerald-800 px-2 py-1 text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
                                  }
                                >
                                  {m.is_active ? "Desativar" : "Reativar"}
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                          value={roleForm.roleKey}
                          onChange={(e) =>
                            setRoleForm((p) => ({ ...p, roleKey: e.target.value }))
                          }
                        >
                          {SAAS_ROLE_OPTIONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <select
                          className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                          value={roleForm.establishmentId}
                          onChange={(e) =>
                            setRoleForm((p) => ({
                              ...p,
                              establishmentId: e.target.value,
                            }))
                          }
                        >
                          <option value="">Toda a organização</option>
                          {establishments.map((est) => (
                            <option key={est.id} value={String(est.id)}>
                              {est.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            addMembership(
                              card.email,
                              roleForm.roleKey,
                              roleForm.establishmentId,
                            )
                          }
                          className="rounded bg-amber-600 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                        >
                          Atribuir role
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-200">
                          Permissões por estabelecimento
                        </p>
                        <button
                          type="button"
                          onClick={() => openPermEditor(card, null)}
                          className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          + Dar acesso a outra casa
                        </button>
                      </div>
                      {card.permissions.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          Nenhuma permissão por estabelecimento ainda.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {card.permissions.map((p) => {
                            const labels = activePermissionLabels(p);
                            return (
                              <li
                                key={p.id}
                                className="rounded border border-slate-800 px-3 py-2 text-xs"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-200">
                                      {p.establishment_name}
                                      <span
                                        className={`ml-2 text-[11px] ${
                                          p.is_active !== false
                                            ? "text-emerald-400"
                                            : "text-red-400"
                                        }`}
                                      >
                                        {p.is_active !== false ? "ativo" : "inativo"}
                                      </span>
                                    </p>
                                    <p className="mt-1 text-slate-400">
                                      {labels.length
                                        ? labels.join(" · ")
                                        : "Sem permissões marcadas"}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() =>
                                        grantAdditive(
                                          card,
                                          p.canonical_establishment_id,
                                          additiveAtendimentoFlags(),
                                          "Atendimento",
                                        )
                                      }
                                      className="rounded border border-emerald-800 px-2 py-1 text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
                                    >
                                      + Atendimento
                                    </button>
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() =>
                                        grantAdditive(
                                          card,
                                          p.canonical_establishment_id,
                                          additiveReservasFlags(),
                                          "Reservas",
                                        )
                                      }
                                      className="rounded border border-emerald-800 px-2 py-1 text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
                                    >
                                      + Reservas
                                    </button>
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() =>
                                        grantAdditive(
                                          card,
                                          p.canonical_establishment_id,
                                          additiveCardapioFlags(),
                                          "Cardápio",
                                        )
                                      }
                                      className="rounded border border-emerald-800 px-2 py-1 text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
                                    >
                                      + Cardápio
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openPermEditor(card, p)}
                                      className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removePermission(p.id)}
                                      className="rounded border border-red-900 px-2 py-1 text-red-300 hover:bg-red-950"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {permEditor && permEditor.userKey === card.key && (
                        <form
                          onSubmit={submitPermEditor}
                          className="mt-3 space-y-3 rounded-lg border border-amber-900/60 bg-slate-950/60 p-3"
                        >
                          <div className="flex flex-wrap items-end gap-3">
                            <div>
                              <label className="mb-1 block text-xs text-slate-400">
                                Estabelecimento
                              </label>
                              <select
                                required
                                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                                value={permEditor.establishmentId}
                                onChange={(e) =>
                                  changeEditorEstablishment(card, e.target.value)
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
                            <div className="flex flex-wrap gap-2 text-xs">
                              <button
                                type="button"
                                className="text-amber-400 hover:underline"
                                onClick={() =>
                                  setPermEditor((p) =>
                                    p ? { ...p, perms: fullOperationPermissions() } : p,
                                  )
                                }
                              >
                                Marcar tudo
                              </button>
                              <button
                                type="button"
                                className="text-emerald-400 hover:underline"
                                onClick={() =>
                                  setPermEditor((p) =>
                                    p
                                      ? {
                                          ...p,
                                          perms: mergePermissionFlags(
                                            p.perms,
                                            additiveAtendimentoFlags(),
                                          ),
                                        }
                                      : p,
                                  )
                                }
                              >
                                + Atendimento
                              </button>
                              <button
                                type="button"
                                className="text-emerald-400 hover:underline"
                                onClick={() =>
                                  setPermEditor((p) =>
                                    p
                                      ? {
                                          ...p,
                                          perms: mergePermissionFlags(
                                            p.perms,
                                            additiveReservasFlags(),
                                          ),
                                        }
                                      : p,
                                  )
                                }
                              >
                                + Reservas
                              </button>
                              <button
                                type="button"
                                className="text-emerald-400 hover:underline"
                                onClick={() =>
                                  setPermEditor((p) =>
                                    p
                                      ? {
                                          ...p,
                                          perms: mergePermissionFlags(
                                            p.perms,
                                            additiveCardapioFlags(),
                                          ),
                                        }
                                      : p,
                                  )
                                }
                              >
                                + Cardápio
                              </button>
                              <button
                                type="button"
                                className="text-slate-400 hover:underline"
                                onClick={() =>
                                  setPermEditor((p) =>
                                    p
                                      ? { ...p, perms: emptyEstablishmentPermissions() }
                                      : p,
                                  )
                                }
                              >
                                Limpar
                              </button>
                            </div>
                          </div>
                          <PermissionFieldsEditor
                            value={permEditor.perms}
                            onChange={(perms) =>
                              setPermEditor((p) => (p ? { ...p, perms } : p))
                            }
                          />
                          <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input
                              type="checkbox"
                              checked={permEditor.isActive}
                              onChange={(e) =>
                                setPermEditor((p) =>
                                  p ? { ...p, isActive: e.target.checked } : p,
                                )
                              }
                            />
                            Acesso ativo
                          </label>
                          <p className="text-xs text-slate-500">
                            Salvar substitui as permissões deste usuário nesta casa
                            pelo que está marcado acima.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="submit"
                              disabled={saving}
                              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
                            >
                              {saving ? "Salvando…" : "Salvar permissões"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPermEditor(null)}
                              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
