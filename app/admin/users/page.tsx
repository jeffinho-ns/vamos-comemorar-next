"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MdAdd,
  MdRefresh,
  MdEdit,
  MdDelete,
  MdSearch,
  MdClose,
} from "react-icons/md";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL ||
  "https://vamos-comemorar-api.onrender.com";

type Role = "admin" | "gerente" | "atendente" | "usuario" | "cliente" | "promoter";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  telefone?: string;
  foto_perfil?: string;
}

interface Establishment {
  id: number;
  name: string;
}

interface PermissionRow {
  id: number;
  user_id: number;
  user_email: string;
  establishment_id: number;
  establishment_name?: string;
  can_edit_os: boolean;
  can_edit_operational_detail: boolean;
  can_view_os: boolean;
  can_download_os: boolean;
  can_view_operational_detail: boolean;
  can_create_os: boolean;
  can_create_operational_detail: boolean;
  can_manage_reservations: boolean;
  can_manage_checkins: boolean;
  can_view_reports: boolean;
  is_active: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  gerente: "Gerente",
  atendente: "Atendente",
  usuario: "Usuário",
  cliente: "Cliente",
  promoter: "Promoter",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState<"all" | "app" | "admin">("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API_URL}/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar usuários");
    }
  }, [search]);

  const fetchPermissions = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/establishment-permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setPermissions(json.data || []);
    } catch {
      setPermissions([]);
    }
  }, []);

  const fetchEstablishments = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/places`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setEstablishments(Array.isArray(data) ? data : data.data || []);
    } catch {
      setEstablishments([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchUsers(), fetchPermissions(), fetchEstablishments()]);
    setLoading(false);
  }, [fetchUsers, fetchPermissions, fetchEstablishments]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const permissionsByUser = permissions.reduce<Record<number, PermissionRow[]>>(
    (acc, p) => {
      if (!acc[p.user_id]) acc[p.user_id] = [];
      acc[p.user_id].push(p);
      return acc;
    },
    {}
  );

  const hasAdminAccess = (user: UserRow) => {
    const role = (user.role || "").toLowerCase();
    if (["admin", "gerente", "atendente"].includes(role)) return true;
    return (permissionsByUser[user.id]?.length ?? 0) > 0;
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search.trim() ||
      u.name?.toLowerCase().includes(search.trim().toLowerCase()) ||
      u.email?.toLowerCase().includes(search.trim().toLowerCase());
    if (!matchSearch) return false;
    if (originFilter === "admin") return hasAdminAccess(u);
    if (originFilter === "app") return !hasAdminAccess(u);
    return true;
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      alert("Usuário excluído com sucesso!");
      loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  const openEdit = (user: UserRow) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Usuários</h1>
          <p className="text-gray-400 text-lg">
            Visualize todos os usuários, cadastre novos por estabelecimento e edite dados e permissões.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail"
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200/30 bg-white/95 text-gray-800 w-64 focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as "all" | "app" | "admin")}
              className="px-4 py-2 rounded-xl border border-gray-200/30 bg-white/95 text-gray-800 focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all">Todos</option>
              <option value="app">Cadastrados pelo App (Agilizia)</option>
              <option value="admin">Acesso Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAll}
              className="p-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              <MdRefresh size={20} />
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold transition-colors"
            >
              <MdAdd size={20} /> Novo usuário
            </button>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-gray-700 font-semibold">Nome</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">E-mail</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Origem</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Role</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Gerente / Atendente</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold">Estabelecimento(s)</th>
                  <th className="px-4 py-3 text-gray-700 font-semibold w-28">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
                {filteredUsers.map((user) => {
                  const perms = permissionsByUser[user.id] || [];
                  const role = (user.role || "usuario").toLowerCase();
                  const isGerenteOuAtendente = role === "gerente" || role === "atendente";
                  const estabNames = perms
                    .filter((p) => p.is_active)
                    .map((p) => p.establishment_name || `#${p.establishment_id}`)
                    .join(", ") || "—";
                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                      <td className="px-4 py-3 text-gray-800 font-medium">{user.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            hasAdminAccess(user)
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {hasAdminAccess(user) ? "Admin" : "App (Agilizia)"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-medium">
                          {ROLE_LABELS[role] || user.role || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {role === "cliente" ? "Sim" : "Não"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {isGerenteOuAtendente ? (
                          <span className="text-green-700 font-medium">
                            {ROLE_LABELS[role]}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate" title={estabNames}>
                        {estabNames}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <MdDelete size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {createModalOpen && (
        <CreateUserModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            loadAll();
          }}
          establishments={establishments}
          apiUrl={API_URL}
        />
      )}

      {editModalOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          permissions={permissionsByUser[selectedUser.id] || []}
          establishments={establishments}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setEditModalOpen(false);
            setSelectedUser(null);
            loadAll();
          }}
          apiUrl={API_URL}
        />
      )}
    </div>
  );
}

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
  establishments: Establishment[];
  apiUrl: string;
}

function CreateUserModal({ onClose, onSuccess, establishments, apiUrl }: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [role, setRole] = useState<Role>("usuario");
  const [establishmentIds, setEstablishmentIds] = useState<number[]>([]);
  const [perms, setPerms] = useState({
    can_manage_reservations: true,
    can_manage_checkins: true,
    can_view_reports: true,
    can_view_os: true,
    can_download_os: true,
    can_view_operational_detail: true,
    can_edit_os: false,
    can_edit_operational_detail: false,
    can_create_os: false,
    can_create_operational_detail: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEstablishment = (id: number) => {
    setEstablishmentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token não encontrado. Faça login novamente.");
      setLoading(false);
      return;
    }
    try {
      const resUser = await fetch(`${apiUrl}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          password,
          telefone: telefone || undefined,
          role,
        }),
      });
      if (!resUser.ok) {
        const err = await resUser.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Erro ao criar usuário");
      }
      const userData = await resUser.json();
      const userId = userData.userId ?? userData.id;
      if (!userId) throw new Error("Resposta da API sem ID do usuário");

      for (const estabId of establishmentIds) {
        await fetch(`${apiUrl}/api/establishment-permissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: userId,
            user_email: email,
            establishment_id: estabId,
            ...perms,
            is_active: true,
          }),
        });
      }

      alert("Usuário criado com sucesso!");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const rolesForCreate: Role[] = ["usuario", "admin", "gerente", "atendente", "cliente"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Novo usuário</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <MdClose size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de usuário (role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            >
              {rolesForCreate.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Promoters são cadastrados na página de Promoters.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estabelecimento(s)</label>
            <div className="flex flex-wrap gap-2">
              {establishments.map((est) => (
                <label key={est.id} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={establishmentIds.includes(est.id)}
                    onChange={() => toggleEstablishment(est.id)}
                  />
                  <span className="text-sm text-gray-800">{est.name}</span>
                </label>
              ))}
              {establishments.length === 0 && (
                <span className="text-sm text-gray-500">Nenhum estabelecimento carregado.</span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissões do menu (por estabelecimento)</label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { key: "can_manage_reservations", label: "Gerenciar reservas" },
                { key: "can_manage_checkins", label: "Gerenciar check-ins" },
                { key: "can_view_reports", label: "Ver relatórios" },
                { key: "can_view_os", label: "Ver OS" },
                { key: "can_download_os", label: "Baixar OS" },
                { key: "can_view_operational_detail", label: "Ver detalhes operacionais" },
                { key: "can_edit_os", label: "Editar OS" },
                { key: "can_edit_operational_detail", label: "Editar detalhes operacionais" },
                { key: "can_create_os", label: "Criar OS" },
                { key: "can_create_operational_detail", label: "Criar detalhes operacionais" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={perms[key as keyof typeof perms]}
                    onChange={(e) =>
                      setPerms((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditUserModalProps {
  user: UserRow;
  permissions: PermissionRow[];
  establishments: Establishment[];
  onClose: () => void;
  onSuccess: () => void;
  apiUrl: string;
}

function EditUserModal({
  user,
  permissions,
  establishments,
  onClose,
  onSuccess,
  apiUrl,
}: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [telefone, setTelefone] = useState(user.telefone || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>((user.role as Role) || "usuario");
  const [establishmentIds, setEstablishmentIds] = useState<number[]>(
    permissions.map((p) => p.establishment_id).filter((id, i, a) => a.indexOf(id) === i)
  );
  const [perms, setPerms] = useState(() => {
    const first = permissions[0];
    return first
      ? {
          can_manage_reservations: first.can_manage_reservations,
          can_manage_checkins: first.can_manage_checkins,
          can_view_reports: first.can_view_reports,
          can_view_os: first.can_view_os,
          can_download_os: first.can_download_os,
          can_view_operational_detail: first.can_view_operational_detail,
          can_edit_os: first.can_edit_os,
          can_edit_operational_detail: first.can_edit_operational_detail,
          can_create_os: first.can_create_os,
          can_create_operational_detail: first.can_create_operational_detail,
        }
      : {
          can_manage_reservations: true,
          can_manage_checkins: true,
          can_view_reports: true,
          can_view_os: true,
          can_download_os: true,
          can_view_operational_detail: true,
          can_edit_os: false,
          can_edit_operational_detail: false,
          can_create_os: false,
          can_create_operational_detail: false,
        };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEstablishment = (id: number) => {
    setEstablishmentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token não encontrado.");
      setLoading(false);
      return;
    }
    try {
      const body: Record<string, unknown> = {
        name,
        email,
        telefone: telefone || undefined,
        role,
      };
      if (password.trim()) body.password = password.trim();

      const resUser = await fetch(`${apiUrl}/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!resUser.ok) {
        const err = await resUser.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao atualizar usuário");
      }

      const existingEstabIds = permissions.map((p) => p.establishment_id);
      const toAdd = establishmentIds.filter((id) => !existingEstabIds.includes(id));
      const toRemove = permissions.filter((p) => !establishmentIds.includes(p.establishment_id));

      for (const perm of toRemove) {
        await fetch(`${apiUrl}/api/establishment-permissions/${perm.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      for (const estabId of toAdd) {
        await fetch(`${apiUrl}/api/establishment-permissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            user_email: email,
            establishment_id: estabId,
            ...perms,
            is_active: true,
          }),
        });
      }
      const toUpdate = permissions.filter((p) => establishmentIds.includes(p.establishment_id));
      for (const perm of toUpdate) {
        await fetch(`${apiUrl}/api/establishment-permissions/${perm.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...perms, is_active: true }),
        });
      }

      alert("Usuário atualizado com sucesso!");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar");
    } finally {
      setLoading(false);
    }
  };

  const allRoles: Role[] = ["admin", "gerente", "atendente", "usuario", "cliente", "promoter"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Editar usuário</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <MdClose size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha (deixe em branco para manter)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de usuário (role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            >
              {allRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estabelecimento(s)</label>
            <div className="flex flex-wrap gap-2">
              {establishments.map((est) => (
                <label key={est.id} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={establishmentIds.includes(est.id)}
                    onChange={() => toggleEstablishment(est.id)}
                  />
                  <span className="text-sm text-gray-800">{est.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissões do menu</label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { key: "can_manage_reservations", label: "Gerenciar reservas" },
                { key: "can_manage_checkins", label: "Gerenciar check-ins" },
                { key: "can_view_reports", label: "Ver relatórios" },
                { key: "can_view_os", label: "Ver OS" },
                { key: "can_download_os", label: "Baixar OS" },
                { key: "can_view_operational_detail", label: "Ver detalhes operacionais" },
                { key: "can_edit_os", label: "Editar OS" },
                { key: "can_edit_operational_detail", label: "Editar detalhes operacionais" },
                { key: "can_create_os", label: "Criar OS" },
                { key: "can_create_operational_detail", label: "Criar detalhes operacionais" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={perms[key as keyof typeof perms]}
                    onChange={(e) =>
                      setPerms((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
