"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdRefresh,
  MdSearch,
  MdBusiness,
  MdPerson,
  MdLock,
  MdLockOpen,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdCancel,
  MdHistory,
  MdFilterList
} from 'react-icons/md';

interface Permission {
  id: number;
  user_id: number;
  user_email: string;
  user_name?: string;
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
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Establishment {
  id: number;
  name: string;
}

export default function PermissionsAdminPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstablishment, setFilterEstablishment] = useState<number | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [filterEstablishment, filterActive]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPermissions(),
        fetchUsers(),
        fetchEstablishments()
      ]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Token de autenticação não encontrado');
        return;
      }

      let url = `${API_URL}/api/establishment-permissions?`;
      const params = new URLSearchParams();
      
      if (filterEstablishment) {
        params.append('establishment_id', filterEstablishment.toString());
      }
      
      if (filterActive !== null) {
        params.append('is_active', filterActive.toString());
      }

      url += params.toString();

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar permissões');
      }

      const data = await response.json();
      if (data.success) {
        setPermissions(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar permissões:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar permissões');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  };

  const fetchEstablishments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/places`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEstablishments(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar estabelecimentos:', err);
    }
  };

  const handleAdd = () => {
    setEditingPermission(null);
    setShowModal(true);
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta permissão?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/establishment-permissions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao remover permissão');
      }

      alert('Permissão removida com sucesso!');
      fetchPermissions();
    } catch (err) {
      console.error('Erro ao remover permissão:', err);
      alert(err instanceof Error ? err.message : 'Erro ao remover permissão');
    }
  };

  const handleSave = async (permissionData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const url = editingPermission
        ? `${API_URL}/api/establishment-permissions/${editingPermission.id}`
        : `${API_URL}/api/establishment-permissions`;
      
      const method = editingPermission ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(permissionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao salvar permissão');
      }

      alert(editingPermission ? 'Permissão atualizada com sucesso!' : 'Permissão criada com sucesso!');
      setShowModal(false);
      setEditingPermission(null);
      fetchPermissions();
    } catch (err) {
      console.error('Erro ao salvar permissão:', err);
      alert(err instanceof Error ? err.message : 'Erro ao salvar permissão');
    }
  };

  const filteredPermissions = permissions.filter(perm => {
    const matchesSearch = !searchTerm || 
      perm.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.establishment_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading && permissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 text-lg">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gerenciamento de Permissões</h1>
          <p className="text-gray-400 text-lg">Configure permissões de usuários por estabelecimento</p>
        </div>

        {/* Filtros e Ações */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-gray-200/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Busca */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdSearch className="inline mr-2" />
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Email, nome ou estabelecimento..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* Filtro de Estabelecimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdBusiness className="inline mr-2" />
                Estabelecimento
              </label>
              <select
                value={filterEstablishment || ''}
                onChange={(e) => setFilterEstablishment(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdFilterList className="inline mr-2" />
                Status
              </label>
              <select
                value={filterActive === null ? '' : filterActive.toString()}
                onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPermissions}
              className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <MdRefresh className="text-xl" />
            </button>
            <button
              onClick={() => setShowAuditLogs(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2"
            >
              <MdHistory size={20} /> Logs de Auditoria
            </button>
            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2"
            >
              <MdAdd size={20} /> Nova Permissão
            </button>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Lista de Permissões */}
        <div className="space-y-4">
          {filteredPermissions.map((permission, index) => (
            <motion.div
              key={permission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/20 hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {permission.user_name || permission.user_email}
                    </h3>
                    {permission.is_active ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex items-center gap-1">
                        <MdCheckCircle size={14} /> Ativo
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium flex items-center gap-1">
                        <MdCancel size={14} /> Inativo
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">
                    <MdPerson className="inline mr-1" />
                    {permission.user_email}
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <MdBusiness className="inline mr-1" />
                    {permission.establishment_name || `Estabelecimento ID: ${permission.establishment_id}`}
                  </p>

                  {/* Grid de Permissões */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      {permission.can_edit_os ? (
                        <MdLockOpen className="text-green-600" size={18} />
                      ) : (
                        <MdLock className="text-gray-400" size={18} />
                      )}
                      <span className="text-xs text-gray-700">Editar OS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {permission.can_edit_operational_detail ? (
                        <MdLockOpen className="text-green-600" size={18} />
                      ) : (
                        <MdLock className="text-gray-400" size={18} />
                      )}
                      <span className="text-xs text-gray-700">Editar Detalhe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {permission.can_view_os ? (
                        <MdVisibility className="text-green-600" size={18} />
                      ) : (
                        <MdVisibilityOff className="text-gray-400" size={18} />
                      )}
                      <span className="text-xs text-gray-700">Ver OS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {permission.can_download_os ? (
                        <MdCheckCircle className="text-green-600" size={18} />
                      ) : (
                        <MdCancel className="text-gray-400" size={18} />
                      )}
                      <span className="text-xs text-gray-700">Baixar OS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {permission.can_create_os ? (
                        <MdLockOpen className="text-green-600" size={18} />
                      ) : (
                        <MdLock className="text-gray-400" size={18} />
                      )}
                      <span className="text-xs text-gray-700">Criar OS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {permission.can_create_operational_detail ? (
                        <MdLockOpen className="text-green-600" size={18} />
                      ) : (
                        <MdLock className="text-gray-400" size={18} />
                      )}
                      <span className="text-xs text-gray-700">Criar Detalhe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {permission.can_manage_reservations ? (
                        <MdCheckCircle className="text-green-600" size={18} />
                      ) : (
                        <MdCancel className="text-gray-400" size={18} />
                      )}
                      <span className="text-xs text-gray-700">Gerenciar Reservas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {permission.can_manage_checkins ? (
                        <MdCheckCircle className="text-green-600" size={18} />
                      ) : (
                        <MdCancel className="text-gray-400" size={18} />
                      )}
                      <span className="text-xs text-gray-700">Gerenciar Check-ins</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(permission)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <MdEdit size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(permission.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredPermissions.length === 0 && !loading && (
            <div className="text-center py-12 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/20">
              <MdLock size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhuma permissão encontrada
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterEstablishment || filterActive !== null
                  ? 'Ajuste os filtros ou crie novas permissões'
                  : 'Crie a primeira permissão clicando no botão acima'}
              </p>
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2 mx-auto"
              >
                <MdAdd size={20} /> Criar Permissão
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <PermissionModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingPermission(null);
          }}
          onSave={handleSave}
          permission={editingPermission}
          users={users}
          establishments={establishments}
        />
      )}

      {/* Modal de Logs de Auditoria */}
      {showAuditLogs && (
        <AuditLogsModal
          isOpen={showAuditLogs}
          onClose={() => setShowAuditLogs(false)}
        />
      )}
    </div>
  );
}

// Componente Modal de Permissão (simplificado - você pode expandir)
function PermissionModal({ isOpen, onClose, onSave, permission, users, establishments }: any) {
  const [formData, setFormData] = useState({
    user_id: permission?.user_id || '',
    user_email: permission?.user_email || '',
    establishment_id: permission?.establishment_id || '',
    can_edit_os: permission?.can_edit_os || false,
    can_edit_operational_detail: permission?.can_edit_operational_detail || false,
    can_view_os: permission?.can_view_os !== undefined ? permission.can_view_os : true,
    can_download_os: permission?.can_download_os !== undefined ? permission.can_download_os : true,
    can_view_operational_detail: permission?.can_view_operational_detail !== undefined ? permission.can_view_operational_detail : true,
    can_create_os: permission?.can_create_os || false,
    can_create_operational_detail: permission?.can_create_operational_detail || false,
    can_manage_reservations: permission?.can_manage_reservations || false,
    can_manage_checkins: permission?.can_manage_checkins || false,
    can_view_reports: permission?.can_view_reports || false,
    is_active: permission?.is_active !== undefined ? permission.is_active : true,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {permission ? 'Editar Permissão' : 'Nova Permissão'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuário</label>
              <select
                value={formData.user_id}
                onChange={(e) => {
                  const userId = parseInt(e.target.value);
                  const user = users.find((u: any) => u.id === userId);
                  setFormData({
                    ...formData,
                    user_id: userId,
                    user_email: user?.email || '',
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Selecione um usuário</option>
                {users.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estabelecimento</label>
              <select
                value={formData.establishment_id}
                onChange={(e) => setFormData({ ...formData, establishment_id: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Selecione um estabelecimento</option>
                {establishments.map((est: any) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkboxes de Permissões */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {[
                { key: 'can_edit_os', label: 'Editar OS' },
                { key: 'can_edit_operational_detail', label: 'Editar Detalhe Operacional' },
                { key: 'can_view_os', label: 'Visualizar OS' },
                { key: 'can_download_os', label: 'Baixar OS' },
                { key: 'can_view_operational_detail', label: 'Visualizar Detalhe Operacional' },
                { key: 'can_create_os', label: 'Criar OS' },
                { key: 'can_create_operational_detail', label: 'Criar Detalhe Operacional' },
                { key: 'can_manage_reservations', label: 'Gerenciar Reservas' },
                { key: 'can_manage_checkins', label: 'Gerenciar Check-ins' },
                { key: 'can_view_reports', label: 'Visualizar Relatórios' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                />
                <span className="text-sm text-gray-700">Ativo</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg font-semibold transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente Modal de Logs de Auditoria (simplificado)
function AuditLogsModal({ isOpen, onClose }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';
      
      const response = await fetch(`${API_URL}/api/establishment-permissions/audit-logs?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{log.action_type}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Usuário:</strong> {log.user_email} → <strong>Alvo:</strong> {log.target_user_email}
                  </p>
                  {log.establishment_name && (
                    <p className="text-sm text-gray-600">
                      <strong>Estabelecimento:</strong> {log.establishment_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

