"use client";

import { useState, useEffect } from "react";
import { MdAssessment, MdTrendingUp, MdTrendingDown, MdCalendarToday, MdPeople, MdAttachMoney } from "react-icons/md";

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface RelatorioProps {
  establishment: Establishment;
}

interface ReportData {
  totalEvents: number;
  totalGuests: number;
  totalRevenue: number;
  averageGuestsPerEvent: number;
  averageRevenuePerEvent: number;
  monthlyGrowth: number;
  topEvents: Array<{
    name: string;
    guests: number;
    revenue: number;
    date: string;
  }>;
}

export default function Relatorio({ establishment }: RelatorioProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const mockData: Record<number, ReportData> = {
          1: {
            totalEvents: 24,
            totalGuests: 1250,
            totalRevenue: 45600,
            averageGuestsPerEvent: 52,
            averageRevenuePerEvent: 1900,
            monthlyGrowth: 12.5,
            topEvents: [
              { name: "Festa de Aniversário", guests: 80, revenue: 3200, date: "2024-02-15" },
              { name: "Happy Hour Corporativo", guests: 45, revenue: 1800, date: "2024-02-20" },
              { name: "Encontro de Amigos", guests: 35, revenue: 1400, date: "2024-02-18" }
            ]
          },
          2: {
            totalEvents: 18,
            totalGuests: 980,
            totalRevenue: 32400,
            averageGuestsPerEvent: 54,
            averageRevenuePerEvent: 1800,
            monthlyGrowth: 8.3,
            topEvents: [
              { name: "Comemoração de Formatura", guests: 120, revenue: 4800, date: "2024-02-22" },
              { name: "Reunião Familiar", guests: 60, revenue: 2400, date: "2024-02-25" }
            ]
          },
          3: {
            totalEvents: 31,
            totalGuests: 2100,
            totalRevenue: 67800,
            averageGuestsPerEvent: 68,
            averageRevenuePerEvent: 2187,
            monthlyGrowth: 15.7,
            topEvents: [
              { name: "Festa de Casamento", guests: 150, revenue: 7500, date: "2024-03-01" },
              { name: "Evento Corporativo", guests: 80, revenue: 3200, date: "2024-02-28" },
              { name: "Aniversário Infantil", guests: 100, revenue: 2500, date: "2024-02-26" }
            ]
          },
          4: {
            totalEvents: 12,
            totalGuests: 650,
            totalRevenue: 18900,
            averageGuestsPerEvent: 54,
            averageRevenuePerEvent: 1575,
            monthlyGrowth: 5.2,
            topEvents: [
              { name: "Encontro de Negócios", guests: 40, revenue: 1200, date: "2024-02-24" }
            ]
          }
        };

        setReportData(mockData[establishment.id] || null);
      } catch (error) {
        console.error("Erro ao carregar relatório:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [establishment.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum dado encontrado</h3>
        <p className="text-gray-500">
          Não há dados de relatório para este estabelecimento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total de Eventos</p>
              <p className="text-3xl font-bold text-blue-800">{reportData.totalEvents}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <MdCalendarToday className="text-white text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total de Convidados</p>
              <p className="text-3xl font-bold text-green-800">{reportData.totalGuests}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <MdPeople className="text-white text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Receita Total</p>
              <p className="text-3xl font-bold text-yellow-800">
                R$ {(reportData.totalRevenue / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <MdAttachMoney className="text-white text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Crescimento Mensal</p>
              <p className="text-3xl font-bold text-purple-800">+{reportData.monthlyGrowth}%</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <MdTrendingUp className="text-white text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Métricas por Evento</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Média de Convidados:</span>
              <span className="font-semibold text-gray-800">{reportData.averageGuestsPerEvent}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Média de Receita:</span>
              <span className="font-semibold text-gray-800">R$ {reportData.averageRevenuePerEvent.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Taxa de Ocupação:</span>
              <span className="font-semibold text-gray-800">85%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Eventos Realizados:</span>
              <span className="font-semibold text-green-600">{reportData.totalEvents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Taxa de Sucesso:</span>
              <span className="font-semibold text-green-600">92%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Satisfação:</span>
              <span className="font-semibold text-yellow-600">4.8/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Eventos */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Eventos</h3>
        <div className="space-y-4">
          {reportData.topEvents.map((event, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-sm">{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{event.name}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(event.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">{event.guests} convidados</p>
                <p className="text-sm text-green-600">R$ {event.revenue.toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <button className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
          Exportar PDF
        </button>
        <button className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors">
          Exportar Excel
        </button>
        <button className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors">
          Compartilhar
        </button>
      </div>
    </div>
  );
} 