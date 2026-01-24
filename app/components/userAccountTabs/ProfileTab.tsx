"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { MdPerson, MdPhone, MdLocationOn, MdPhotoCamera, MdEdit, MdClose } from "react-icons/md";
import { uploadImage as uploadImageToFirebase } from "@/app/services/uploadService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;
const DEFAULT_AVATAR_URL = "https://via.placeholder.com/150";

const getProfileImageUrl = (
  fotoPerfil?: string | null,
  fotoPerfilUrl?: string | null
): string => {
  if (
    fotoPerfilUrl &&
    (fotoPerfilUrl.startsWith("http://") || fotoPerfilUrl.startsWith("https://"))
  ) {
    return fotoPerfilUrl;
  }
  if (
    fotoPerfil &&
    (fotoPerfil.startsWith("http://") || fotoPerfil.startsWith("https://"))
  ) {
    return fotoPerfil;
  }
  if (fotoPerfil && fotoPerfil.startsWith("blob:")) {
    return fotoPerfil;
  }
  return DEFAULT_AVATAR_URL;
};

export default function ProfileTab() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modal, setModal] = useState<"edit" | "password" | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    telefone: "",
    endereco: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setEditForm({
          name: data.name || "",
          email: data.email || "",
          telefone: data.telefone || "",
          endereco: data.endereco || "",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchUser();
  }, [fetchUser]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleEditProfile = () => {
    setEditForm({
      name: user?.name || "",
      email: user?.email || "",
      telefone: user?.telefone || "",
      endereco: user?.endereco || "",
    });
    setModal("edit");
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !API_URL) {
      showMessage("error", "Sessão expirada. Faça login novamente.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (editForm.name && editForm.name !== user?.name) payload.name = editForm.name;
      if (editForm.email && editForm.email !== user?.email) payload.email = editForm.email;
      if (editForm.telefone !== undefined && editForm.telefone !== user?.telefone)
        payload.telefone = editForm.telefone;
      if (editForm.endereco !== undefined && editForm.endereco !== user?.endereco)
        payload.endereco = editForm.endereco;

      if (Object.keys(payload).length === 0) {
        showMessage("error", "Nenhum campo foi alterado.");
        setSaving(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMessage("error", data.message || data.error || "Erro ao atualizar perfil.");
        setSaving(false);
        return;
      }
      showMessage("success", "Perfil atualizado com sucesso!");
      setModal(null);
      await fetchUser();
    } catch (e) {
      showMessage("error", "Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const triggerPhotoInput = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !API_URL) return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      showMessage("error", "Sessão expirada. Faça login novamente.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const url = await uploadImageToFirebase(file, "users/profile");
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ foto_perfil: url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMessage("error", data.message || data.error || "Erro ao alterar foto.");
        setUploadingPhoto(false);
        return;
      }
      showMessage("success", "Foto alterada com sucesso!");
      await fetchUser();
    } catch (err) {
      showMessage(
        "error",
        err instanceof Error ? err.message : "Erro ao enviar a foto. Tente novamente."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAlterarFoto = () => fileInputRef.current?.click();

  const handlePassword = () => {
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setModal("password");
  };

  const handleSavePassword = async () => {
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      showMessage("error", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage("error", "As senhas não coincidem.");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token || !API_URL) {
      showMessage("error", "Sessão expirada. Faça login novamente.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: passwordForm.newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMessage("error", data.message || data.error || "Erro ao alterar senha.");
        setSaving(false);
        return;
      }
      showMessage("success", "Senha alterada com sucesso!");
      setModal(null);
    } catch (e) {
      showMessage("error", "Erro ao alterar senha. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    );
  }

  const imageUrl = getProfileImageUrl(user?.foto_perfil, user?.foto_perfil_url);
  const hasImage =
    imageUrl !== DEFAULT_AVATAR_URL && (user?.foto_perfil || user?.foto_perfil_url);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl">
          <MdPerson className="text-white text-xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Meus Dados</h2>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

      <div className="grid gap-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdPhotoCamera className="text-purple-600" />
            Foto de Perfil
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative">
              {hasImage ? (
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-gray-200 shadow-lg">
                  <Image
                    src={imageUrl}
                    alt="Foto de perfil"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized={imageUrl.startsWith("blob:")}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-4 border-gray-200 shadow-lg">
                  <MdPerson className="text-white text-3xl" />
                </div>
              )}
              <button
                type="button"
                onClick={triggerPhotoInput}
                disabled={uploadingPhoto}
                className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 disabled:opacity-60"
              >
                <MdEdit size={16} />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-gray-600 text-sm mb-2">
                {hasImage
                  ? "Sua foto de perfil está atualizada"
                  : "Nenhuma foto de perfil enviada"}
              </p>
              <button
                type="button"
                onClick={triggerPhotoInput}
                disabled={uploadingPhoto}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-60"
              >
                {uploadingPhoto ? "Enviando..." : hasImage ? "Alterar Foto" : "Enviar Foto"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdPerson className="text-blue-600" />
            Informações Pessoais
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
              <span className="text-gray-600 font-medium">Nome completo</span>
              <span className="text-gray-800 font-semibold">{user?.name || "Não informado"}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
              <span className="text-gray-600 font-medium">Email</span>
              <span className="text-gray-800 font-semibold">{user?.email || "Não informado"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdPhone className="text-green-600" />
            Informações de Contato
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
              <span className="text-gray-600 font-medium">Telefone</span>
              <span className="text-gray-800 font-semibold">
                {user?.telefone || "Não informado"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdLocationOn className="text-red-600" />
            Endereço
          </h3>
          <div className="p-4 bg-gray-50/80 rounded-xl">
            <span className="text-gray-800 font-medium">
              {user?.endereco || "Endereço não informado"}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📊 Resumo do Perfil
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {user?.name ? "✅" : "❌"}
              </div>
              <div className="text-sm text-gray-600">Nome</div>
            </div>
            <div className="bg-white/80 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {user?.telefone ? "✅" : "❌"}
              </div>
              <div className="text-sm text-gray-600">Telefone</div>
            </div>
            <div className="bg-white/80 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {hasImage ? "✅" : "❌"}
              </div>
              <div className="text-sm text-gray-600">Foto</div>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Disponíveis</h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleEditProfile}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
            >
              ✏️ Editar Perfil
            </button>
            <button
              type="button"
              onClick={handleAlterarFoto}
              disabled={uploadingPhoto}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-60"
            >
              📸 Alterar Foto
            </button>
            <button
              type="button"
              onClick={handlePassword}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
            >
              🔒 Alterar Senha
            </button>
          </div>
        </div>
      </div>

      {/* Modal Editar Perfil */}
      {modal === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Editar Perfil</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <MdClose size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={editForm.telefone}
                  onChange={(e) => setEditForm((p) => ({ ...p, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={editForm.endereco}
                  onChange={(e) => setEditForm((p) => ({ ...p, endereco: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-semibold rounded-xl hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alterar Senha */}
      {modal === "password" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Alterar Senha</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <MdClose size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova senha
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar nova senha
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  placeholder="Repita a senha"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePassword}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl hover:from-gray-600 hover:to-gray-700 disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Alterar senha"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
