"use client";

import { useState, useEffect, useCallback } from "react";
import { MdDashboard, MdEvent, MdBookOnline, MdShoppingCart, MdList, MdStar, MdSecurity, MdAssessment, MdSettings } from "react-icons/md";

// Componentes do painel (serão criados em seguida)
import ResumoEventos from "../../components/painel/ResumoEventos";
import Reservas from "../../components/painel/Reservas";
import VendasOnline from "../../components/painel/VendasOnline";
import Listas from "../../components/painel/Listas";
import ListasEspeciais from "../../components/painel/ListasEspeciais";
import PermissoesLimites from "../../components/painel/PermissoesLimites";
import Relatorio from "../../components/painel/Relatorio";
import Ajustes from "../../components/painel/Ajustes";

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

// Removido array estático - agora será carregado da API

const menuItems = [
  { id: "resumo", label: "Resumo de Eventos", icon: MdDashboard, component: ResumoEventos },
  { id: "reservas", label: "Reservas", icon: MdEvent, component: Reservas },
  { id: "vendas", label: "Vendas Online", icon: MdShoppingCart, component: VendasOnline },
  { id: "listas", label: "Listas", icon: MdList, component: Listas },
  { id: "listas-especiais", label: "Listas Especiais", icon: MdStar, component: ListasEspeciais },
  { id: "permissoes", label: "Permissões e Limites", icon: MdSecurity, component: PermissoesLimites },
  { id: "relatorio", label: "Relatório", icon: MdAssessment, component: Relatorio },
  { id: "ajustes", label: "Ajustes", icon: MdSettings, component: Ajustes }
];

export default function PainelEventos() {
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [activeMenu, setActiveMenu] = useState<string>("resumo");
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  const fetchEstablishments = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`${API_URL}/api/bars`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar estabelecimentos");

      const data = await response.json();
      
      if (Array.isArray(data)) {
        const formattedEstablishments: Establishment[] = data.map((bar: any) => ({
          id: bar.id,
          name: bar.name,
          logo: bar.logoUrl || "/assets/default-logo.png",
          address: bar.address || "Endereço não informado"
        }));
        setEstablishments(formattedEstablishments);
      } else {
        setError("Dados de estabelecimentos inválidos.");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Erro desconhecido");
      }
      console.error("Erro ao buscar estabelecimentos:", error);
      
      // Fallback com dados estáticos incluindo Reserva Rooftop
      setEstablishments([
        {
          id: 7,
          name: "High Line",
          logo: "/assets/highline/highlinelogo.png",
          address: "Rua Girassol, 144 - Vila Madalena"
        },
        {
          id: 1,
          name: "Seu Justino",
          logo: "/assets/justino/justinologo.png",
          address: "Rua Azevedo Soares, 940 - Tatuapé"
        },
        {
          id: 4,
          name: "Oh Freguês",
          logo: "/assets/ohfregues/logoOhfregues.png",
          address: "Largo da Matriz de Nossa Senhora do Ó, 145 - Freguesia do Ó"
        },
        {
          id: 8,
          name: "Pracinha do Seu Justino",
          logo: "/assets/pracinha/logo-pracinha.png",
          address: "Rua das Flores, 123 - Centro"
        },
        {
          id: 5,
          name: "Reserva Rooftop",
          logo: "/assets/reserva-rooftop/logo-reserva-rooftop.png",
          address: "Em frente ao portão 2 - Rua Marc Chagal, Parque - Jardim das Perdizes"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  const handleEstablishmentSelect = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
    setActiveMenu("resumo"); // Volta para o resumo quando troca de estabelecimento
  };

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(menuId);
  };

  const ActiveComponent = menuItems.find(item => item.id === activeMenu)?.component || ResumoEventos;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando estabelecimentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Erro ao carregar estabelecimentos</p>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={fetchEstablishments}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        
        {/* Header da página */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Admin / Painel de Eventos
          </h2>
          <h1 className="text-4xl font-bold text-white mt-2">Painel de Eventos</h1>
          <p className="text-gray-400 text-lg mt-2">Gerencie seus eventos e estabelecimentos</p>
        </div>

        {/* Seleção de Estabelecimento */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Selecione o Estabelecimento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {establishments.map((establishment) => (
              <button
                key={establishment.id}
                onClick={() => handleEstablishmentSelect(establishment)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                  selectedEstablishment?.id === establishment.id
                    ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-600">
                      {establishment.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{establishment.name}</h3>
                  <p className="text-sm text-gray-500">{establishment.address}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Indicador do Estabelecimento Selecionado */}
        {selectedEstablishment && (
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold">{selectedEstablishment.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedEstablishment.name}</h3>
                  <p className="text-yellow-100">{selectedEstablishment.address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-yellow-100">Estabelecimento Ativo</p>
                <p className="text-lg font-semibold">Painel de Controle</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu do Painel */}
        {selectedEstablishment && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Painel Menu</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                      activeMenu === item.id
                        ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <IconComponent 
                        className={`text-2xl mx-auto mb-2 ${
                          activeMenu === item.id ? 'text-yellow-600' : 'text-gray-500'
                        }`} 
                      />
                      <p className={`text-sm font-medium ${
                        activeMenu === item.id ? 'text-yellow-700' : 'text-gray-700'
                      }`}>
                        {item.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Área de Conteúdo */}
        {selectedEstablishment && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {menuItems.find(item => item.id === activeMenu)?.label}
              </h3>
              <p className="text-gray-600">
                Estabelecimento: {selectedEstablishment.name}
              </p>
            </div>
            
            <div className="border-t border-gray-200/30 pt-6">
              <ActiveComponent establishment={selectedEstablishment} />
            </div>
          </div>
        )}

        {/* Mensagem quando nenhum estabelecimento está selecionado */}
        {!selectedEstablishment && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Selecione um Estabelecimento
            </h3>
            <p className="text-gray-500">
              Escolha um estabelecimento acima para acessar o painel de controle
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 