"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { superadminFetch } from "@/app/utils/superadminApi";
import { applyImpersonationSession } from "@/app/utils/impersonation";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type OrgRow = { id: number; name: string };

export default function SuperadminImpersonatePage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);

  useEffect(() => {
    superadminFetch<OrgRow[]>("/organizations")
      .then(setOrgs)
      .catch((e) => setError(e.message));
  }, []);

  const searchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (organizationId) qs.set("organizationId", organizationId);
    if (search.trim()) qs.set("search", search.trim());
    superadminFetch<UserRow[]>(`/impersonate/users?${qs}`)
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [organizationId, search]);

  useEffect(() => {
    searchUsers();
  }, [searchUsers]);

  const start = async (userId: number) => {
    if (!confirm("Entrar como este usuário? A ação será registrada na auditoria.")) return;
    setStartingId(userId);
    setError(null);
    try {
      const data = await superadminFetch<{
        token: string;
        user: UserRow;
        impersonator: { id: number; name: string; email: string };
      }>(`/impersonate/${userId}`, { method: "POST" });
      applyImpersonationSession(data);
      router.push("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao impersonar");
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Impersonate (modo suporte)</h2>
        <p className="text-slate-400">
          Acesse o painel como um usuário do cliente para reproduzir problemas. Cada sessão é
          registrada em <code className="text-amber-300">action_logs</code> com início e fim.
        </p>
      </div>

      <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
        Ao impersonar, um banner fixo aparece no topo. Use &quot;Encerrar impersonate&quot; para
        voltar ao super admin.
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Organização</span>
          <select
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 min-w-[200px]"
          >
            <option value="">Todas</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm flex-1 min-w-[200px]">
          <span className="mb-1 block text-slate-400">Buscar nome ou e-mail</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ex: analista@"
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={searchUsers}
          className="self-end rounded border border-slate-600 px-4 py-2 text-sm"
        >
          Atualizar
        </button>
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {loading && <p className="text-slate-400">Buscando usuários…</p>}

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800">
                <td className="px-4 py-3">{u.name || "—"}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 text-slate-400">{u.role}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={startingId === u.id}
                    onClick={() => start(u.id)}
                    className="rounded bg-amber-600 px-3 py-1 text-xs disabled:opacity-50"
                  >
                    {startingId === u.id ? "Abrindo…" : "Entrar como"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
