"use client";
import { useEffect, useState } from "react";
import { MdBusiness, MdLocationOn, MdDescription } from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

export default function CompanyTab() {
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

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return "Não informado";
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    // Aplica máscara: XX.XXX.XXX/XXXX-XX
    return cleanCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl">
          <MdBusiness className="text-white text-xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Dados da Empresa</h2>
      </div>

      <div className="grid gap-6">
        {/* Informações da Empresa */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdBusiness className="text-blue-600" />
            Informações da Empresa
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
              <span className="text-gray-600 font-medium">Nome da empresa</span>
              <span className="text-gray-800 font-semibold">{user?.empresa || "Não informado"}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
              <span className="text-gray-600 font-medium">CNPJ</span>
              <span className="text-gray-800 font-semibold font-mono">
                {formatCNPJ(user?.cnpj)}
              </span>
            </div>
          </div>
        </div>

        {/* Endereço da Empresa */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdLocationOn className="text-green-600" />
            Endereço da Empresa
          </h3>
          <div className="p-4 bg-gray-50/80 rounded-xl">
            <span className="text-gray-800 font-medium">
              {user?.endereco_empresa || "Endereço não informado"}
            </span>
          </div>
        </div>

        {/* Status da Empresa */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdDescription className="text-purple-600" />
            Status da Empresa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50/80 rounded-xl text-center">
              <div className="text-2xl mb-2">
                {user?.empresa ? "🏢" : "❌"}
              </div>
              <div className="text-sm text-gray-600">Empresa</div>
              <div className="font-semibold text-gray-800">
                {user?.empresa ? "Cadastrada" : "Não cadastrada"}
              </div>
            </div>
            <div className="p-4 bg-gray-50/80 rounded-xl text-center">
              <div className="text-2xl mb-2">
                {user?.cnpj ? "📄" : "❌"}
              </div>
              <div className="text-sm text-gray-600">CNPJ</div>
              <div className="font-semibold text-gray-800">
                {user?.cnpj ? "Informado" : "Não informado"}
              </div>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            💼 Informações Adicionais
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              • Para atualizar os dados da empresa, entre em contato com o suporte técnico.
            </p>
            <p>
              • O CNPJ é necessário para emissão de notas fiscais e relatórios.
            </p>
            <p>
              • Dados empresariais são mantidos em conformidade com a LGPD.
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Disponíveis</h3>
          <div className="flex flex-wrap gap-3">
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
              📞 Solicitar Atualização
            </button>
            <button className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
              📋 Ver Documentos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
