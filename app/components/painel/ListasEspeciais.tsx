"use client";

import { useState, useEffect } from "react";
import { MdStar, MdPeople, MdEvent, MdAdd, MdEdit, MdDelete } from "react-icons/md";

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface ListasEspeciaisProps {
  establishment: Establishment;
}

interface SpecialList {
  id: number;
  name: string;
  description: string;
  totalGuests: number;
  confirmedGuests: number;
  type: 'vip' | 'premium' | 'exclusive';
  date: string;
  status: 'active' | 'closed';
}

export default function ListasEspeciais({ establishment }: ListasEspeciaisProps) {
  const [lists, setLists] = useState<SpecialList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);
      try {
        const mockLists: Record<number, SpecialList[]> = {
          1: [
            {
              id: 1,
              name: "Lista VIP - High Line",
              description: "Convidados especiais com acesso exclusivo",
              totalGuests: 20,
              confirmedGuests: 15,
              type: 'vip',
              date: "2024-02-15",
              status: 'active'
            }
          ],
          2: [
            {
              id: 2,
              name: "Lista Premium - Seu Justino",
              description: "Clientes premium com benefícios especiais",
              totalGuests: 15,
              confirmedGuests: 12,
              type: 'premium',
              date: "2024-02-22",
              status: 'active'
            }
          ],
          3: [
            {
              id: 3,
              name: "Lista Exclusiva - Oh Freguês",
              description: "Convidados exclusivos para eventos especiais",
              totalGuests: 30,
              confirmedGuests: 25,
              type: 'exclusive',
              date: "2024-03-01",
              status: 'active'
            }
          ],
          4: [
            {
              id: 4,
              name: "Lista VIP - Pracinha",
              description: "Convidados VIP com tratamento especial",
              totalGuests: 10,
              confirmedGuests: 8,
              type: 'vip',
              date: "2024-02-24",
              status: 'active'
            }
          ]
        };

        setLists(mockLists[establishment.id] || []);
      } catch (error) {
        console.error("Erro ao carregar listas especiais:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Listas Especiais</h3>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition-colors">
          <MdAdd />
          Nova Lista Especial
        </button>
      </div>

      <div className="space-y-4">
        {lists.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma lista especial encontrada</h3>
            <p className="text-gray-500">
              Não há listas especiais para este estabelecimento.
            </p>
          </div>
        ) : (
          lists.map((list) => (
            <div key={list.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {list.name}
                      </h3>
                      <p className="text-gray-600">{list.description}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${
                      list.type === 'vip' 
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : list.type === 'premium'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      <MdStar className="text-yellow-500" />
                      {list.type === 'vip' ? 'VIP' : list.type === 'premium' ? 'Premium' : 'Exclusiva'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <MdPeople className="text-blue-500" />
                      <span className="text-gray-700">{list.totalGuests} total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdEvent className="text-green-500" />
                      <span className="text-gray-700">{list.confirmedGuests} confirmados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdStar className="text-yellow-500" />
                      <span className="text-gray-700">{list.type.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="lg:text-right">
                  <div className="text-sm text-gray-600 mb-2">
                    Progresso: {Math.round((list.confirmedGuests / list.totalGuests) * 100)}%
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(list.confirmedGuests / list.totalGuests) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  Ver Convidados
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                  Adicionar Convidados
                </button>
                <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">
                  <MdEdit className="inline mr-1" />
                  Editar
                </button>
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                  <MdDelete className="inline mr-1" />
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 