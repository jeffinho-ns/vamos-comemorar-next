"use client";

import { useState, useEffect } from "react";
import { MdShoppingCart, MdAttachMoney, MdTrendingUp, MdTrendingDown, MdCalendarToday, MdReceipt } from "react-icons/md";

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface VendasOnlineProps {
  establishment: Establishment;
}

interface OnlineSale {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  customerName: string;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: string;
}

export default function VendasOnline({ establishment }: VendasOnlineProps) {
  const [sales, setSales] = useState<OnlineSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      try {
        // Dados simulados
        const mockSales: Record<number, OnlineSale[]> = {
          1: [
            {
              id: 1,
              productName: "Combo Happy Hour",
              quantity: 2,
              unitPrice: 45.00,
              totalPrice: 90.00,
              date: "2024-02-15",
              customerName: "João Silva",
              status: 'completed',
              paymentMethod: 'Cartão de Crédito'
            },
            {
              id: 2,
              productName: "Ingresso Evento Especial",
              quantity: 1,
              unitPrice: 80.00,
              totalPrice: 80.00,
              date: "2024-02-16",
              customerName: "Maria Santos",
              status: 'pending',
              paymentMethod: 'PIX'
            }
          ],
          2: [
            {
              id: 3,
              productName: "Pacote Corporativo",
              quantity: 5,
              unitPrice: 120.00,
              totalPrice: 600.00,
              date: "2024-02-17",
              customerName: "Empresa ABC",
              status: 'completed',
              paymentMethod: 'Transferência'
            }
          ],
          3: [
            {
              id: 4,
              productName: "Combo Casamento",
              quantity: 1,
              unitPrice: 500.00,
              totalPrice: 500.00,
              date: "2024-02-18",
              customerName: "Fernanda e Roberto",
              status: 'completed',
              paymentMethod: 'Cartão de Débito'
            }
          ],
          4: [
            {
              id: 5,
              productName: "Ingresso Individual",
              quantity: 3,
              unitPrice: 30.00,
              totalPrice: 90.00,
              date: "2024-02-19",
              customerName: "Ricardo Alves",
              status: 'pending',
              paymentMethod: 'PIX'
            }
          ]
        };

        setSales(mockSales[establishment.id] || []);
      } catch (error) {
        console.error("Erro ao carregar vendas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [establishment.id]);

  const filteredSales = sales.filter(sale => {
    if (filter === 'all') return true;
    return sale.status === filter;
  });

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const completedSales = sales.filter(sale => sale.status === 'completed').length;
  const pendingSales = sales.filter(sale => sale.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Receita Total</p>
              <p className="text-3xl font-bold text-green-800">
                R$ {totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <MdAttachMoney className="text-white text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Vendas Concluídas</p>
              <p className="text-3xl font-bold text-blue-800">{completedSales}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <MdShoppingCart className="text-white text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Vendas Pendentes</p>
              <p className="text-3xl font-bold text-yellow-800">{pendingSales}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <MdReceipt className="text-white text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas ({sales.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Concluídas ({completedSales})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pendentes ({pendingSales})
        </button>
      </div>

      {/* Lista de Vendas */}
      <div className="space-y-4">
        {filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma venda encontrada</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Não há vendas online para este estabelecimento.'
                : `Não há vendas com status "${filter}".`
              }
            </p>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div key={sale.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {sale.productName}
                      </h3>
                      <p className="text-gray-600">{sale.customerName}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${
                      sale.status === 'completed' 
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : sale.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {sale.status === 'completed' ? 'Concluída' : sale.status === 'pending' ? 'Pendente' : 'Cancelada'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MdCalendarToday className="text-gray-400" />
                      <span className="text-gray-700">
                        {new Date(sale.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdShoppingCart className="text-gray-400" />
                      <span className="text-gray-700">{sale.quantity} unidades</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdReceipt className="text-gray-400" />
                      <span className="text-gray-700">{sale.paymentMethod}</span>
                    </div>
                  </div>
                </div>
                
                <div className="lg:text-right">
                  <div className="text-sm text-gray-600 mb-1">
                    R$ {sale.unitPrice.toFixed(2)} cada
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    R$ {sale.totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  Ver Detalhes
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                  Confirmar Pagamento
                </button>
                <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">
                  Reenviar Recibo
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 