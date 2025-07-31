"use client";
import { useEffect, useState } from "react";
import { MdAccountCircle, MdEmail, MdCalendarToday, MdCheckCircle, MdCancel } from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

export default function DetailsTab() {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não disponível";
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return "Data inválida";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl">
          <MdAccountCircle className="text-white text-xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Detalhes da Conta</h2>
      </div>

      <div className="grid gap-6">
        {/* Informações Básicas */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdAccountCircle className="text-blue-600" />
            Informações Básicas
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

        {/* Status da Conta */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            {user?.ativo ? (
              <MdCheckCircle className="text-green-600" />
            ) : (
              <MdCancel className="text-red-600" />
            )}
            Status da Conta
          </h3>
          <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
            <span className="text-gray-600 font-medium">Status atual</span>
            <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
              user?.ativo 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {user?.ativo ? "✅ Ativo" : "❌ Inativo"}
            </span>
          </div>
        </div>

        {/* Informações de Criação */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdCalendarToday className="text-purple-600" />
            Informações de Criação
          </h3>
          <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
            <span className="text-gray-600 font-medium">Data de criação</span>
            <span className="text-gray-800 font-semibold">
              {formatDate(user?.created_at)}
            </span>
          </div>
        </div>

        {/* Resumo da Conta */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            📊 Resumo da Conta
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {user?.ativo ? "✅" : "❌"}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
            <div className="bg-white/80 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                📅
              </div>
              <div className="text-sm text-gray-600">Membro desde</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
