"use client";
import { useAppContext } from "@/app/context/AppContext";
import { MdEmail, MdPhone, MdSupport, MdAccessTime, MdLocationOn } from "react-icons/md";

export default function ContactTab() {
  const { user, isLoading: loading } = useAppContext();

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
          <MdSupport className="text-white text-xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Contato e Suporte</h2>
      </div>

      <div className="grid gap-6">
        {/* Informações de Contato */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdEmail className="text-blue-600" />
            Informações de Contato
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
              <span className="text-gray-600 font-medium">Email cadastrado</span>
              <span className="text-gray-800 font-semibold">{user?.email || "Não informado"}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
              <span className="text-gray-600 font-medium">WhatsApp</span>
              <span className="text-gray-800 font-semibold">(11) 99999-9999</span>
            </div>
          </div>
        </div>

        {/* Suporte Técnico */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdSupport className="text-green-600" />
            Suporte Técnico
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
              <span className="text-gray-600 font-medium">Email de suporte</span>
              <span className="text-gray-800 font-semibold">suporte@empresa.com</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
              <span className="text-gray-600 font-medium">Telefone de suporte</span>
              <span className="text-gray-800 font-semibold">(11) 88888-8888</span>
            </div>
          </div>
        </div>

        {/* Horário de Atendimento */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MdAccessTime className="text-purple-600" />
            Horário de Atendimento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50/80 rounded-xl text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">🕘</div>
              <div className="text-sm text-gray-600">Segunda a Sexta</div>
              <div className="font-semibold text-gray-800">9h às 18h</div>
            </div>
            <div className="p-4 bg-gray-50/80 rounded-xl text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">🕙</div>
              <div className="text-sm text-gray-600">Sábado</div>
              <div className="font-semibold text-gray-800">9h às 12h</div>
            </div>
          </div>
        </div>

        {/* Canais de Atendimento */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📞 Canais de Atendimento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-200 cursor-pointer">
              <div className="text-3xl mb-2">📧</div>
              <div className="text-sm font-semibold text-gray-800">Email</div>
              <div className="text-xs text-gray-600">Resposta em 24h</div>
            </div>
            <div className="bg-white/80 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-200 cursor-pointer">
              <div className="text-3xl mb-2">💬</div>
              <div className="text-sm font-semibold text-gray-800">WhatsApp</div>
              <div className="text-xs text-gray-600">Resposta imediata</div>
            </div>
            <div className="bg-white/80 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-200 cursor-pointer">
              <div className="text-3xl mb-2">📞</div>
              <div className="text-sm font-semibold text-gray-800">Telefone</div>
              <div className="text-xs text-gray-600">Atendimento direto</div>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            💡 Informações Importantes
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              Para dúvidas técnicas, utilize o email de suporte para melhor acompanhamento.
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              WhatsApp é ideal para questões urgentes e respostas rápidas.
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              Telefone disponível apenas em horário comercial.
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              Todos os atendimentos são registrados para melhor acompanhamento.
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h3>
          <div className="flex flex-wrap gap-3">
            <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
              💬 Abrir WhatsApp
            </button>
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
              📧 Enviar Email
            </button>
            <button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
              📞 Ligar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
