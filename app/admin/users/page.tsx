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

type Role = "admin" | "gerente" | "atendente" | "usuario" | "cliente" | "promoter" | "recepcao";

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
  can_create_edit_reservations?: boolean;
  is_active: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  gerente: "Gerente",
  atendente: "Atendente",
  usuario: "Usuário",
  cliente: "Cliente",
  promoter: "Promoter",
  recepcao: "Recepcionista",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "establishments" | "clients" | "promoters">("all");
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
    if (["admin", "gerente", "atendente", "recepcao"].includes(role)) return true;
    return (permissionsByUser[user.id]?.length ?? 0) > 0;
  };
  const hasEstablishmentAccess = (user: UserRow) =>
    (permissionsByUser[user.id]?.some((p) => p.is_active) ?? false);

  const filteredUsers = users.filter((u) => {
    const term = search.trim().toLowerCase();
    const matchSearch =
      !term ||
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term);
    if (!matchSearch) return false;

    const role = (u.role || "").toLowerCase();
    const isClient = role === "cliente";
    const isPromoter = role === "promoter" || role === "promoter-list";

    if (viewMode === "clients") return isClient;
    if (viewMode === "promoters") return isPromoter;
    if (viewMode === "establishments") return hasEstablishmentAccess(u);
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
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white mb-2">Gestão de acessos</h1>
            <p className="text-gray-400 text-sm max-w-xl">
              Controle quem acessa cada parte do admin por estabelecimento, clientes do app e promoters.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/60 rounded-full p-1 border border-slate-700">
            {[
              { id: "all", label: "Todos" },
              { id: "establishments", label: "Estabelecimentos" },
              { id: "clients", label: "Clientes (App)" },
              { id: "promoters", label: "Promoters" },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id as typeof viewMode)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  viewMode === id
                    ? "bg-yellow-500 text-slate-900"
                    : "text-slate-300 hover:bg-slate-700/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail"
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-100 w-full text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAll}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors"
            >
              <MdRefresh size={18} />
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-sm font-semibold transition-colors shadow-sm"
            >
              <MdAdd size={18} /> Novo usuário
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredUsers.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-10 text-center text-slate-400 text-sm">
              Nenhum usuário encontrado com os filtros atuais.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const perms = (permissionsByUser[user.id] || []).filter((p) => p.is_active);
              const roleRaw = (user.role || "usuario").toLowerCase();
              const role = roleRaw === "recepção" ? "recepcao" : roleRaw;
              const isClient = role === "cliente";
              const isPromoter = role === "promoter" || role === "promoter-list";
              const isAdminOrManager = hasAdminAccess(user);

              const estabNames =
                perms.map((p) => p.establishment_name || `#${p.establishment_id}`).join(", ") || "Sem estabelecimentos";

              const hasReservations = perms.some(
                (p) => p.can_manage_reservations || p.can_create_edit_reservations !== false,
              );
              const hasCheckins = perms.some((p) => p.can_manage_checkins);
              const hasReports = perms.some((p) => p.can_view_reports);
              const hasOs =
                perms.some((p) => p.can_view_os || p.can_download_os || p.can_create_os || p.can_edit_os) ||
                perms.some((p) => p.can_view_operational_detail || p.can_create_operational_detail || p.can_edit_operational_detail);

              return (
                <div
                  key={user.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-medium text-slate-50 truncate">
                          {user.name || "Usuário sem nome"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user.email || "—"}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          isAdminOrManager
                            ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/40"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {ROLE_LABELS[role] || user.role || "Usuário"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {isClient && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                          Cliente (App)
                        </span>
                      )}
                      {isPromoter && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-200 text-[10px] border border-purple-500/40">
                          Promoter
                        </span>
                      )}
                      {isAdminOrManager && !isClient && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-200 text-[10px] border border-blue-500/40">
                          Acesso admin
                        </span>
                      )}
                    </div>

                    {perms.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[11px] text-slate-400 mb-1">Estabelecimentos</p>
                        <p className="text-xs text-slate-200 line-clamp-2" title={estabNames}>
                          {estabNames}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            hasReservations ? "bg-emerald-400" : "bg-slate-600"
                          }`}
                        />
                        <span>Reservas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            hasCheckins ? "bg-emerald-400" : "bg-slate-600"
                          }`}
                        />
                        <span>Check-ins</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            hasReports ? "bg-emerald-400" : "bg-slate-600"
                          }`}
                        />
                        <span>Relatórios</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            hasOs ? "bg-emerald-400" : "bg-slate-600"
                          }`}
                        />
                        <span>OS & Operação</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500">
                      ID #{user.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="px-2.5 py-1 rounded-lg text-xs text-blue-100 bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30"
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="px-2.5 py-1 rounded-lg text-xs text-red-100 bg-red-600/20 border border-red-500/40 hover:bg-red-600/30"
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
  const [permsByEstablishment, setPermsByEstablishment] = useState<Record<number, EstablishmentPerms>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEstablishment = (id: number) => {
    if (establishmentIds.includes(id)) {
      setEstablishmentIds((prev) => prev.filter((x) => x !== id));
    } else {
      setPermsByEstablishment((p) => ({
        ...p,
        [id]: p[id] ?? { ...DEFAULT_ESTAB_PERMS },
      }));
      setEstablishmentIds((prev) => [...prev, id]);
    }
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
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          telefone: telefone.trim() || undefined,
          role,
        }),
      });
      const textRes = await resUser.text();
      let userData: { userId?: number; id?: number; error?: string; message?: string } = {};
      try {
        userData = textRes ? JSON.parse(textRes) : {};
      } catch {
        userData = { error: textRes || resUser.statusText };
      }
      if (!resUser.ok) {
        throw new Error(userData.error || userData.message || textRes || resUser.statusText || "Erro ao criar usuário");
      }
      const userId = userData.userId ?? userData.id;
      if (!userId) throw new Error("Resposta da API sem ID do usuário");

      for (const estabId of establishmentIds) {
        const perms = permsByEstablishment[estabId] ?? DEFAULT_ESTAB_PERMS;
        const resPerm = await fetch(`${apiUrl}/api/establishment-permissions`, {
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
        if (!resPerm.ok) {
          const errPerm = await resPerm.text();
          let errObj: { error?: string } = {};
          try { errObj = errPerm ? JSON.parse(errPerm) : {}; } catch { errObj = { error: errPerm }; }
          throw new Error(errObj.error || "Erro ao salvar permissão do estabelecimento");
        }
      }

      alert("Usuário criado com sucesso!");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const rolesForCreate: Role[] = ["usuario", "admin", "gerente", "atendente", "recepcao", "cliente"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60">
      <div className="h-full w-full max-w-2xl bg-slate-900 text-slate-50 shadow-2xl border-l border-slate-800 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
          <div>
            <h2 className="text-xl font-semibold">Novo usuário</h2>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre o usuário, defina o cargo global e as permissões por estabelecimento.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            aria-label="Fechar"
          >
            <MdClose size={22} />
          </button>
        </div>

        <form
          id="create-user-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
        >
          {error && (
            <div className="p-3 bg-red-900/40 border border-red-500/60 rounded-lg text-red-100 text-sm">
              {error}
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Dados do usuário</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-50 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-50 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-50 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-50 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cargo global (role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-50 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {rolesForCreate.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Promoters continuam sendo cadastrados na tela específica de Promoters.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Estabelecimentos e permissões</h3>
            <p className="text-xs text-slate-400 mb-3">
              Selecione os estabelecimentos aos quais este usuário terá acesso e configure as permissões.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {establishments.map((est) => {
                const active = establishmentIds.includes(est.id);
                return (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => toggleEstablishment(est.id)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      active
                        ? "bg-yellow-500 text-slate-900 border-yellow-400"
                        : "bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    {est.name}
                  </button>
                );
              })}
              {establishments.length === 0 && (
                <span className="text-xs text-slate-500">Nenhum estabelecimento carregado.</span>
              )}
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {establishmentIds.map((id) => {
                const est = establishments.find((e) => e.id === id);
                const perms = permsByEstablishment[id] ?? DEFAULT_ESTAB_PERMS;
                return (
                  <div
                    key={id}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {est?.name || `Estabelecimento #${id}`}
                        </p>
                        <p className="text-xs text-slate-500">Permissões de acesso</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleEstablishment(id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remover acesso
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { key: "can_manage_reservations", label: "Gerenciar reservas" },
                        {
                          key: "can_create_edit_reservations",
                          label: "Criar/editar reservas e lista de espera",
                        },
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
                            checked={perms[key as keyof EstablishmentPerms]}
                            onChange={(e) =>
                              setPermsByEstablishment((prev) => ({
                                ...prev,
                                [id]: {
                                  ...(prev[id] ?? DEFAULT_ESTAB_PERMS),
                                  [key]: e.target.checked,
                                },
                              }))
                            }
                            className="w-3 h-3 rounded border-slate-600 bg-slate-900 text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className="text-slate-200">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              {establishmentIds.length === 0 && (
                <p className="text-xs text-slate-500">
                  Nenhum estabelecimento selecionado. Selecione acima para liberar o acesso.
                </p>
              )}
            </div>
          </section>
        </form>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-xl border border-slate-600 text-slate-100 text-sm hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="create-user-form"
            disabled={loading}
            className="flex-1 py-2 px-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar usuário"}
          </button>
        </div>
      </div>
    </div>
  );
}

type EstablishmentPerms = {
  can_manage_reservations: boolean;
  can_create_edit_reservations: boolean;
  can_manage_checkins: boolean;
  can_view_reports: boolean;
  can_view_os: boolean;
  can_download_os: boolean;
  can_view_operational_detail: boolean;
  can_edit_os: boolean;
  can_edit_operational_detail: boolean;
  can_create_os: boolean;
  can_create_operational_detail: boolean;
};

const DEFAULT_ESTAB_PERMS: EstablishmentPerms = {
  can_manage_reservations: true,
  can_create_edit_reservations: true,
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

function permFromRow(p: PermissionRow): EstablishmentPerms {
  return {
    can_manage_reservations: p.can_manage_reservations,
    can_create_edit_reservations: p.can_create_edit_reservations !== false,
    can_manage_checkins: p.can_manage_checkins,
    can_view_reports: p.can_view_reports,
    can_view_os: p.can_view_os,
    can_download_os: p.can_download_os,
    can_view_operational_detail: p.can_view_operational_detail,
    can_edit_os: p.can_edit_os,
    can_edit_operational_detail: p.can_edit_operational_detail,
    can_create_os: p.can_create_os,
    can_create_operational_detail: p.can_create_operational_detail,
  };
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
  const normalizeRole = (r: string | undefined): Role => {
    if (!r) return "usuario";
    const s = String(r).toLowerCase();
    if (s === "recepção" || s === "recepcao") return "recepcao";
    if (["admin", "gerente", "atendente", "usuario", "cliente", "promoter"].includes(s)) return s as Role;
    return "usuario";
  };
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [telefone, setTelefone] = useState(user.telefone || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(normalizeRole(user.role));
  const [establishmentIds, setEstablishmentIds] = useState<number[]>(
    () => permissions.map((p) => Number(p.establishment_id)).filter((id, i, a) => a.indexOf(id) === i)
  );
  const [permsByEstablishment, setPermsByEstablishment] = useState<Record<number, EstablishmentPerms>>(() => {
    const map: Record<number, EstablishmentPerms> = {};
    permissions.forEach((p) => {
      map[Number(p.establishment_id)] = permFromRow(p);
    });
    return map;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const perms = DEFAULT_ESTAB_PERMS;

  const toggleEstablishment = (id: number) => {
    if (establishmentIds.includes(id)) {
      setEstablishmentIds((prev) => prev.filter((x) => x !== id));
    } else {
      setPermsByEstablishment((p) => ({
        ...p,
        [id]: p[id] ?? { ...DEFAULT_ESTAB_PERMS },
      }));
      setEstablishmentIds((prev) => [...prev, id]);
    }
  };

  const setPermsForEstablishment = (estabId: number, key: keyof EstablishmentPerms, value: boolean) => {
    setPermsByEstablishment((prev) => ({
      ...prev,
      [estabId]: { ...(prev[estabId] ?? DEFAULT_ESTAB_PERMS), [key]: value },
    }));
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
        name: name.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim() || undefined,
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
        const text = await resUser.text();
        let err: { error?: string; message?: string } = {};
        try {
          err = text ? JSON.parse(text) : {};
        } catch {
          err = { error: text || resUser.statusText };
        }
        const msg = err.error || err.message || text || resUser.statusText || "Erro ao atualizar usuário";
        throw new Error(msg);
      }

      const existingEstabIds = permissions.map((p) => Number(p.establishment_id));
      const toAdd = establishmentIds.filter((id) => !existingEstabIds.includes(Number(id)));
      const toRemove = permissions.filter((p) => !establishmentIds.includes(Number(p.establishment_id)));
      const toUpdate = permissions.filter((p) => establishmentIds.includes(Number(p.establishment_id)));

      // Ordem segura: criar novas permissões primeiro, depois atualizar, por último remover (evita perda de acesso)
      for (const estabId of toAdd) {
        const permsForEstab = permsByEstablishment[estabId] ?? perms;
        const resPerm = await fetch(`${apiUrl}/api/establishment-permissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            user_email: email,
            establishment_id: estabId,
            ...permsForEstab,
            is_active: true,
          }),
        });
        if (!resPerm.ok) {
          const errBody = await resPerm.json().catch(() => ({}));
          throw new Error(errBody.error || errBody.message || "Erro ao salvar permissão");
        }
      }
      for (const perm of toUpdate) {
        const permsForEstab = permsByEstablishment[Number(perm.establishment_id)] ?? perms;
        const resUpdate = await fetch(`${apiUrl}/api/establishment-permissions/${perm.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...permsForEstab, is_active: true }),
        });
        if (!resUpdate.ok) {
          const errBody = await resUpdate.json().catch(() => ({}));
          throw new Error(errBody.error || errBody.message || "Erro ao atualizar permissão");
        }
      }
      for (const perm of toRemove) {
        await fetch(`${apiUrl}/api/establishment-permissions/${perm.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
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

  const allRoles: Role[] = ["admin", "gerente", "atendente", "recepcao", "usuario", "cliente", "promoter"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60">
      <div className="h-full w-full max-w-2xl bg-slate-900 text-slate-50 shadow-2xl border-l border-slate-800 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
          <div>
            <h2 className="text-xl font-semibold">Editar usuário</h2>
            <p className="text-xs text-slate-400 mt-1">
              Defina o cargo global e as permissões por estabelecimento.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            aria-label="Fechar"
          >
            <MdClose size={22} />
          </button>
        </div>

        <form
          id="edit-user-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
        >
          {error && (
            <div className="p-3 bg-red-900/40 border border-red-500/60 rounded-lg text-red-100 text-sm">
              {error}
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Dados gerais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-50 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-50 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nova senha (deixe em branco para manter)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-50 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-50 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cargo global (role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-50 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {allRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Estabelecimentos e permissões</h3>
            <p className="text-xs text-slate-400 mb-3">
              Selecione os estabelecimentos e, para cada um, defina as permissões granulares.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {establishments.map((est) => {
                const active = establishmentIds.includes(est.id);
                return (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => toggleEstablishment(est.id)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      active
                        ? "bg-yellow-500 text-slate-900 border-yellow-400"
                        : "bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    {est.name}
                  </button>
                );
              })}
              {establishments.length === 0 && (
                <span className="text-xs text-slate-500">Nenhum estabelecimento carregado.</span>
              )}
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {establishmentIds.map((id) => {
                const est = establishments.find((e) => e.id === id);
                const estPerms = permsByEstablishment[id] ?? DEFAULT_ESTAB_PERMS;
                return (
                  <div
                    key={id}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {est?.name || `Estabelecimento #${id}`}
                        </p>
                        <p className="text-xs text-slate-500">Permissões de acesso</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleEstablishment(id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remover acesso
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { key: "can_manage_reservations", label: "Gerenciar reservas" },
                        {
                          key: "can_create_edit_reservations",
                          label: "Criar/editar reservas e lista de espera",
                        },
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
                            checked={estPerms[key as keyof EstablishmentPerms]}
                            onChange={(e) =>
                              setPermsForEstablishment(id, key as keyof EstablishmentPerms, e.target.checked)
                            }
                            className="w-3 h-3 rounded border-slate-600 bg-slate-900 text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className="text-slate-200">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              {establishmentIds.length === 0 && (
                <p className="text-xs text-slate-500">
                  Nenhum estabelecimento selecionado. Selecione acima para liberar o acesso.
                </p>
              )}
            </div>
          </section>
        </form>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-xl border border-slate-600 text-slate-100 text-sm hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-user-form"
            disabled={loading}
            className="flex-1 py-2 px-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
