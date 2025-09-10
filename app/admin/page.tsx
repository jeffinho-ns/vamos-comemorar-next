// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { MdPerson, MdPlace, MdShoppingCart, MdNumbers, MdEvent, MdCheckCircle, MdCancel } from "react-icons/md";
import type { PieLabelRenderProps } from 'recharts';
// Importe os componentes de gráfico do recharts
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Importe o seu 'infos' existente.
// Se 'infos' não contém os dados para os gráficos, você precisará buscá-los de uma API aqui.
import { infos } from "../repository/filterData"; // Ajuste o caminho se necessário

// Defina as cores para o gráfico de pizza
const PIE_COLORS = ['#4CAF50', '#FFC107', '#F44336']; // Verde, Amarelo, Vermelho para os status

export default function Dashboard() {
  // Use um estado para os dados do dashboard, que pode ser inicializado com 'infos'
  // ou com dados buscados de uma API.
  const [dashboardData, setDashboardData] = useState({
    users: infos.users || 0,
    places: infos.places || 0,
    reservation: infos.reservation || 0,
    points: infos.points || 0, // Supondo que 'points' exista em infos

    // Dados para os gráficos (inicialize com valores padrão ou de mock se infos não tiver)
    totalApprovedReserves: infos.totalApprovedReserves || 0,
    totalRejectedReserves: infos.totalRejectedReserves || 0,
    reservesByMonth: infos.reservesByMonth || [],
    reservesStatusDistribution: infos.reservesStatusDistribution || [],
  });
  const [loading, setLoading] = useState(false); // Defina como true se for buscar dados de API
  const [error, setError] = useState<string | null>(null);

  // Exemplo de como você buscaria dados reais da API para o dashboard completo
  // Este useEffect sobrescreveria os dados iniciais de 'infos'
  // useEffect(() => {
  //   const fetchDashboardDataFromApi = async () => {
  //     setLoading(true);
  //     const token = localStorage.getItem('authToken');
  //     const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;
  //     if (!API_URL) {
  //       setError("URL da API não configurada.");
  //       setLoading(false);
  //       return;
  //     }
  //     try {
  //       const response = await fetch(`${API_URL}/api/dashboard-summary`, { // Exemplo de endpoint no backend
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //         },
  //       });
  //       if (!response.ok) {
  //         throw new Error(`Falha ao buscar dados do dashboard: ${response.statusText}`);
  //       }
  //       const data = await response.json();
  //       setDashboardData(data); // A API deve retornar um objeto com todos os campos necessários (users, places, totalApprovedReserves, reservesByMonth, etc.)
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard.');
  //       console.error("Erro no dashboard:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchDashboardDataFromApi();
  // }, []);


  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Carregando dados do Dashboard...</div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-red-400 text-xl">{error}</div>
    </div>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Visão Geral do Evento</h1>
          <p className="text-gray-400 text-sm sm:text-base lg:text-lg">Dashboard administrativo com métricas e relatórios</p>
        </div>

        {/* Cartões de Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 admin-grid-4">
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/20 flex items-center justify-between hover:transform hover:scale-105 transition-all duration-200">
            <div>
              <p className="text-gray-600 text-sm font-medium">Usuários Totais</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{dashboardData.users}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl">
              <MdPerson size={32} className="text-white" />
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/20 flex items-center justify-between hover:transform hover:scale-105 transition-all duration-200">
            <div>
              <p className="text-gray-600 text-sm font-medium">Locais / Bares</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{dashboardData.places}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
              <MdPlace size={32} className="text-white" />
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/20 flex items-center justify-between hover:transform hover:scale-105 transition-all duration-200">
            <div>
              <p className="text-gray-600 text-sm font-medium">Reservas Totais</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{dashboardData.reservation}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
              <MdShoppingCart size={32} className="text-white" />
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/20 flex items-center justify-between hover:transform hover:scale-105 transition-all duration-200">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pontos Acumulados</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{dashboardData.points}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-xl">
              <MdNumbers size={32} className="text-white" />
            </div>
          </div>
        </div>

        {/* Cartões de Status de Reservas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 admin-grid-3">
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/20 flex items-center justify-between hover:transform hover:scale-105 transition-all duration-200">
            <div>
              <p className="text-gray-600 text-sm font-medium">Reservas Aprovadas</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{dashboardData.totalApprovedReserves}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
              <MdCheckCircle size={32} className="text-white" />
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/20 flex items-center justify-between hover:transform hover:scale-105 transition-all duration-200">
            <div>
              <p className="text-gray-600 text-sm font-medium">Reservas Reprovadas</p>
              <p className="text-3xl font-bold text-red-700 mt-2">{dashboardData.totalRejectedReserves}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
              <MdCancel size={32} className="text-white" />
            </div>
          </div>
        </div>

        {/* Gráficos e Relatórios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Gráfico de Barras: Reservas por Mês */}
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/20">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Reservas por Mês</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dashboardData.reservesByMonth}
                margin={{
                  top: 20, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="Aprovadas" fill="#4CAF50" name="Aprovadas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Reprovadas" fill="#F44336" name="Reprovadas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Pizza: Distribuição de Status de Reservas */}
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/20">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Status de Reservas</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.reservesStatusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={(props: PieLabelRenderProps) => {
                    const percent = props.percent || 0;
                    return `${props.name} (${(percent * 100).toFixed(0)}%)`;
                  }}
                >
                  {dashboardData.reservesStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Área para mais relatórios ou tabelas */}
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/20 mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Outros Relatórios</h2>
          <p className="text-gray-600">
            Esta área pode ser usada para exibir tabelas de dados, listas de eventos próximos,
            ou quaisquer outras informações relevantes para o seu dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}