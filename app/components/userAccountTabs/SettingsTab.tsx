"use client";
import { useAppContext } from "@/app/context/AppContext";
import { MdLanguage, MdNotifications, MdDarkMode, MdLightMode, MdSettings } from "react-icons/md";

export default function SettingsTab() {
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
          <MdSettings className="text-white text-xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
      </div>

      <div className="grid gap-6">
        {/* Configuração de Idioma */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <MdLanguage className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Idioma</h3>
              <p className="text-gray-600 text-sm">Escolha o idioma da interface</p>
            </div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-4">
            <span className="text-gray-700 font-medium">Português (padrão)</span>
          </div>
        </div>

        {/* Configuração de Notificações */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <MdNotifications className="text-green-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Notificações</h3>
              <p className="text-gray-600 text-sm">Gerencie suas notificações</p>
            </div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-4">
            <span className="text-green-700 font-medium">✅ Ativadas</span>
          </div>
        </div>

        {/* Configuração de Tema */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/20 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              {user?.dark_mode ? (
                <MdDarkMode className="text-purple-600 text-xl" />
              ) : (
                <MdLightMode className="text-purple-600 text-xl" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Tema</h3>
              <p className="text-gray-600 text-sm">Escolha entre tema claro ou escuro</p>
            </div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-4">
            <span className={`font-medium ${user?.dark_mode ? 'text-purple-700' : 'text-yellow-700'}`}>
              {user?.dark_mode ? "🌙 Modo Escuro Ativo" : "☀️ Modo Claro Ativo"}
            </span>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200/50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 Dica</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            As configurações são salvas automaticamente. Para alterar o idioma ou tema, 
            entre em contato com o suporte técnico.
          </p>
        </div>
      </div>
    </div>
  );
}
