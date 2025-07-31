"use client";
import { useEffect, useState } from "react";
import Image from 'next/image';
import { MdPerson, MdPhone, MdLocationOn, MdPhotoCamera, MdEdit } from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

export default function ProfileTab() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token || !API_URL) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl">
          <MdPerson className="text-white text-xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Meus Dados</h2>
      </div>

      <div className="grid gap-6">
        {/* Foto de Perfil */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdPhotoCamera className="text-purple-600" />
            Foto de Perfil
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative">
              {user?.foto_perfil ? (
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-gray-200 shadow-lg">
                  <Image
                    src={`${API_URL}/uploads/${user.foto_perfil}`}
                    alt="Foto de perfil"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-4 border-gray-200 shadow-lg">
                  <MdPerson className="text-white text-3xl" />
                </div>
              )}
              <button className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110">
                <MdEdit size={16} />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-gray-600 text-sm mb-2">
                {user?.foto_perfil ? "Sua foto de perfil está atualizada" : "Nenhuma foto de perfil enviada"}
              </p>
              <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
                {user?.foto_perfil ? "Alterar Foto" : "Enviar Foto"}
              </button>
            </div>
          </div>
        </div>

        {/* Informações Pessoais */}
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

        {/* Informações de Contato */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdPhone className="text-green-600" />
            Informações de Contato
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
              <span className="text-gray-600 font-medium">Telefone</span>
              <span className="text-gray-800 font-semibold">{user?.telefone || "Não informado"}</span>
            </div>
          </div>
        </div>

        {/* Endereço */}
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

        {/* Resumo do Perfil */}
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
                {user?.foto_perfil ? "✅" : "❌"}
              </div>
              <div className="text-sm text-gray-600">Foto</div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Disponíveis</h3>
          <div className="flex flex-wrap gap-3">
            <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
              ✏️ Editar Perfil
            </button>
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
              📸 Alterar Foto
            </button>
            <button className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
              🔒 Alterar Senha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
