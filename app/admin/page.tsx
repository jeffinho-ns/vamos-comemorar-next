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


  if (loading) return <p>Carregando dados do Dashboard...</p>;
  if (error) return <p className="text-red-500">{error}</p>;


  return (
    <div className="p-6 bg-gray-50 min-h-screen"> {/* Adicionado p-6 e bg-gray-50 para padding e cor de fundo */}
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Visão Geral do Evento</h1>

      {/* Cartões de Métricas Principais (ajustados para layout Tailwind) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-gray-500 text-sm">Usuários Totais</p>
            <p className="text-3xl font-bold text-indigo-700 mt-1">{dashboardData.users}</p>
          </div>
          <MdPerson size={48} className="text-indigo-400 opacity-60" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-gray-500 text-sm">Locais / Bares</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{dashboardData.places}</p>
          </div>
          <MdPlace size={48} className="text-blue-400 opacity-60" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-gray-500 text-sm">Reservas Totais</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{dashboardData.reservation}</p>
          </div>
          <MdShoppingCart size={48} className="text-green-400 opacity-60" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-gray-500 text-sm">Pontos Acumulados</p>
            <p className="text-3xl font-bold text-yellow-700 mt-1">{dashboardData.points}</p>
          </div>
          <MdNumbers size={48} className="text-yellow-400 opacity-60" />
        </div>
      </div>

      {/* Cartões de Status de Reservas (separa os totais de reservas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-gray-500 text-sm">Reservas Aprovadas</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{dashboardData.totalApprovedReserves}</p>
          </div>
          <MdCheckCircle size={48} className="text-green-400 opacity-60" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-gray-500 text-sm">Reservas Reprovadas</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{dashboardData.totalRejectedReserves}</p>
          </div>
          <MdCancel size={48} className="text-red-400 opacity-60" />
        </div>
      </div>

      {/* Gráficos e Relatórios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras: Reservas por Mês */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Reservas por Mês</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dashboardData.reservesByMonth}
              margin={{
                top: 20, right: 30, left: 20, bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Aprovadas" fill="#4CAF50" name="Aprovadas" />
              <Bar dataKey="Reprovadas" fill="#F44336" name="Reprovadas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pizza: Distribuição de Status de Reservas */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Status de Reservas</h2>
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
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Área para mais relatórios ou tabelas se desejar */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Outros Relatórios (Exemplo)</h2>
        <p className="text-gray-600">
          Esta área pode ser usada para exibir tabelas de dados, listas de eventos próximos,
          ou quaisquer outras informações relevantes para o seu dashboard.
        </p>
      </div>
    </div>
  );
}