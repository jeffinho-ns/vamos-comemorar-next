"use client";

import { useState, useEffect } from "react";
import { MdEvent, MdPeople, MdAttachMoney, MdTrendingUp, MdTrendingDown, MdCalendarToday } from "react-icons/md";

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface ResumoEventosProps {
  establishment: Establishment;
}

interface EventStats {
  totalEvents: number;
  activeEvents: number;
  totalGuests: number;
  confirmedGuests: number;
  totalRevenue: number;
  monthlyGrowth: number;
  upcomingEvents: number;
}

export default function ResumoEventos({ establishment }: ResumoEventosProps) {
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalGuests: 0,
    confirmedGuests: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    upcomingEvents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados da API
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Aqui você faria a chamada real para a API
        // const response = await fetch(`/api/establishments/${establishment.id}/stats`);
        // const data = await response.json();
        
        // Dados simulados baseados no estabelecimento
        const mockData: Record<number, EventStats> = {
          1: { // High Line
            totalEvents: 24,
            activeEvents: 3,
            totalGuests: 1250,
            confirmedGuests: 890,
            totalRevenue: 45600,
            monthlyGrowth: 12.5,
            upcomingEvents: 5
          },
          2: { // Seu Justino
            totalEvents: 18,
            activeEvents: 2,
            totalGuests: 980,
            confirmedGuests: 720,
            totalRevenue: 32400,
            monthlyGrowth: 8.3,
            upcomingEvents: 3
          },
          3: { // Oh Freguês
            totalEvents: 31,
            activeEvents: 4,
            totalGuests: 2100,
            confirmedGuests: 1650,
            totalRevenue: 67800,
            monthlyGrowth: 15.7,
            upcomingEvents: 7
          },
          4: { // Pracinha
            totalEvents: 12,
            activeEvents: 1,
            totalGuests: 650,
            confirmedGuests: 480,
            totalRevenue: 18900,
            monthlyGrowth: 5.2,
            upcomingEvents: 2
          }
        };

        setStats(mockData[establishment.id] || {
          totalEvents: 0,
          activeEvents: 0,
          totalGuests: 0,
          confirmedGuests: 0,
          totalRevenue: 0,
          monthlyGrowth: 0,
          upcomingEvents: 0
        });
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [establishment.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Eventos */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total de Eventos</p>
              <p className="text-3xl font-bold text-blue-800">{stats.totalEvents}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <MdEvent className="text-white text-2xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <MdTrendingUp className="text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+{stats.monthlyGrowth}%</span>
            <span className="text-gray-500 ml-1">este mês</span>
          </div>
        </div>

        {/* Eventos Ativos */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Eventos Ativos</p>
              <p className="text-3xl font-bold text-green-800">{stats.activeEvents}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <MdCalendarToday className="text-white text-2xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">{stats.upcomingEvents}</span>
            <span className="text-gray-500 ml-1">próximos eventos</span>
          </div>
        </div>

        {/* Total de Convidados */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Total de Convidados</p>
              <p className="text-3xl font-bold text-purple-800">{stats.totalGuests}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <MdPeople className="text-white text-2xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-purple-600 font-medium">{stats.confirmedGuests}</span>
            <span className="text-gray-500 ml-1">confirmados</span>
          </div>
        </div>

        {/* Receita Total */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Receita Total</p>
              <p className="text-3xl font-bold text-yellow-800">
                R$ {(stats.totalRevenue / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <MdAttachMoney className="text-white text-2xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <MdTrendingUp className="text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+{stats.monthlyGrowth}%</span>
            <span className="text-gray-500 ml-1">este mês</span>
          </div>
        </div>
      </div>

      {/* Gráfico de Performance */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance dos Últimos 30 Dias</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">{stats.activeEvents}</div>
            <div className="text-sm text-gray-600">Eventos Realizados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">{stats.confirmedGuests}</div>
            <div className="text-sm text-gray-600">Convidados Confirmados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              R$ {(stats.totalRevenue / 1000).toFixed(1)}k
            </div>
            <div className="text-sm text-gray-600">Receita Gerada</div>
          </div>
        </div>
      </div>

      {/* Próximos Eventos */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Próximos Eventos</h3>
        <div className="space-y-4">
          {Array.from({ length: Math.min(stats.upcomingEvents, 3) }, (_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <MdEvent className="text-yellow-600 text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Evento {i + 1} - {establishment.name}</p>
                  <p className="text-sm text-gray-600">Data a ser definida</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">Em breve</p>
                <p className="text-xs text-gray-500">Detalhes em breve</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 