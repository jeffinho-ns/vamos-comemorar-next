"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MdGroup, MdRefresh } from "react-icons/md";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import { readSuperAdminFromCookie } from "@/app/utils/superAdminAccess";
import {
  FACTORY_ROLE_OPTIONS,
  orgTeamFetch,
  type OrgEstablishment,
  type OrgMembership,
  type OrgRole,
} from "@/app/utils/orgTeamApi";
import Gate from "@/app/components/Gate";

export default function EquipePage() {
  const router = useRouter();
  const { entitlements, loading: entLoading } = useEntitlements();
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [establishments, setEstablishments] = useState<OrgEstablishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("recepcao");
  const [memberEstId, setMemberEstId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = readSuperAdminFromCookie();
  const canManage =
    isSuperAdmin ||
    entitlements.allowAll ||
    entitlements.isAccountAdmin === true;

  useEffect(() => {
    if (entLoading) return;
    if (!canManage) {
      router.replace("/acesso-negado");
    }
  }, [entLoading, canManage, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, r, e] = await Promise.all([
        orgTeamFetch<OrgMembership[]>("/memberships"),
        orgTeamFetch<OrgRole[]>("/roles"),
        orgTeamFetch<OrgEstablishment[]>("/establishments"),
      ]);
      setMemberships(m);
      setRoles(r.length ? r : FACTORY_ROLE_OPTIONS.map((o) => ({ id: 0, key: o.key, name: o.label })));
      setEstablishments(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar equipe");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) void load();
  }, [canManage, load]);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await orgTeamFetch("/memberships", {
        method: "POST",
        body: JSON.stringify({
          userEmail: memberEmail.trim(),
          roleKey: memberRole,
          establishmentId: memberEstId ? Number(memberEstId) : null,
        }),
      });
      setMemberEmail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar membro");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m: OrgMembership) => {
    setError(null);
    try {
      await orgTeamFetch(`/memberships/${m.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !m.is_active }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar membro");
    }
  };

  const changeRole = async (m: OrgMembership, roleKey: string) => {
    setError(null);
    try {
      await orgTeamFetch(`/memberships/${m.id}`, {
        method: "PATCH",
        body: JSON.stringify({ roleKey }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar role");
    }
  };

  if (entLoading || !canManage) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
        Carregando…
      </div>
    );
  }

  const roleOptions =
    roles.length > 0
      ? roles
      : FACTORY_ROLE_OPTIONS.map((o) => ({ id: 0, key: o.key, name: o.label }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MdGroup className="h-8 w-8 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
            <p className="text-sm text-gray-500">
              Convide usuários e atribua roles SaaS da sua organização.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          <MdRefresh /> Atualizar
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Gate permission="reservas:update">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Adicionar membro</h2>
          <form onSubmit={addMember} className="flex flex-wrap gap-3">
            <input
              type="email"
              required
              placeholder="E-mail do usuário (já cadastrado)"
              className="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={memberEmail}
              onChange={(ev) => setMemberEmail(ev.target.value)}
            />
            <select
              value={memberRole}
              onChange={(ev) => setMemberRole(ev.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {roleOptions.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              value={memberEstId}
              onChange={(ev) => setMemberEstId(ev.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              title="Escopo do estabelecimento (vazio = org inteira)"
            >
              <option value="">Org inteira</option>
              {establishments.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Atribuir role"}
            </button>
          </form>
          <p className="mt-2 text-xs text-gray-500">
            O usuário precisa existir no sistema (cadastro prévio). Para criar conta nova, use
            convite manual ou superadmin.
          </p>
        </section>
      </Gate>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Membros ({memberships.length})
        </h2>
        {loading ? (
          <p className="text-sm text-gray-500">Carregando membros…</p>
        ) : memberships.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum membership cadastrado.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {memberships.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{m.user_name || m.user_email}</p>
                  <p className="text-sm text-gray-500">
                    {m.user_email}
                    {m.establishment_name ? ` · ${m.establishment_name}` : " · org inteira"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Gate permission="reservas:update">
                    <select
                      value={m.role_key}
                      onChange={(ev) => void changeRole(m, ev.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                      disabled={!m.is_active}
                    >
                      {roleOptions.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void toggleActive(m)}
                      className={`rounded px-3 py-1 text-xs font-medium ${
                        m.is_active
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {m.is_active ? "Ativo" : "Inativo"}
                    </button>
                  </Gate>
                  {!m.is_active && (
                    <span className="text-xs text-gray-400">inativo</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
