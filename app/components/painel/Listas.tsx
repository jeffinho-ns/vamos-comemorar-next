"use client";

import { useState, useEffect } from "react";
import { MdList, MdPeople, MdEvent, MdAdd, MdEdit, MdDelete } from "react-icons/md";

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface ListasProps {
  establishment: Establishment;
}

interface GuestList {
  id: number;
  eventName: string;
  totalGuests: number;
  confirmedGuests: number;
  pendingGuests: number;
  date: string;
  status: 'active' | 'closed' | 'draft';
}

export default function Listas({ establishment }: ListasProps) {
  const [lists, setLists] = useState<GuestList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);
      try {
        // Dados simulados
        const mockLists: Record<number, GuestList[]> = {
          1: [
            {
              id: 1,
              eventName: "Festa de Aniversário",
              totalGuests: 50,
              confirmedGuests: 35,
              pendingGuests: 15,
              date: "2024-02-15",
              status: 'active'
            },
            {
              id: 2,
              eventName: "Happy Hour Corporativo",
              totalGuests: 30,
              confirmedGuests: 25,
              pendingGuests: 5,
              date: "2024-02-20",
              status: 'active'
            }
          ],
          2: [
            {
              id: 3,
              eventName: "Comemoração de Formatura",
              totalGuests: 80,
              confirmedGuests: 60,
              pendingGuests: 20,
              date: "2024-02-22",
              status: 'active'
            }
          ],
          3: [
            {
              id: 4,
              eventName: "Festa de Casamento",
              totalGuests: 120,
              confirmedGuests: 95,
              pendingGuests: 25,
              date: "2024-03-01",
              status: 'active'
            }
          ],
          4: [
            {
              id: 5,
              eventName: "Encontro de Negócios",
              totalGuests: 20,
              confirmedGuests: 15,
              pendingGuests: 5,
              date: "2024-02-24",
              status: 'active'
            }
          ]
        };

        setLists(mockLists[establishment.id] || []);
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
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
      {/* Header com botão de adicionar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Listas de Convidados</h3>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition-colors">
          <MdAdd />
          Nova Lista
        </button>
      </div>

      {/* Lista de eventos */}
      <div className="space-y-4">
        {lists.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma lista encontrada</h3>
            <p className="text-gray-500">
              Não há listas de convidados para este estabelecimento.
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
                        {list.eventName}
                      </h3>
                      <p className="text-gray-600">
                        {new Date(list.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${
                      list.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : list.status === 'closed'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {list.status === 'active' ? 'Ativa' : list.status === 'closed' ? 'Fechada' : 'Rascunho'}
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
                      <MdList className="text-yellow-500" />
                      <span className="text-gray-700">{list.pendingGuests} pendentes</span>
                    </div>
                  </div>
                </div>
                
                <div className="lg:text-right">
                  <div className="text-sm text-gray-600 mb-2">
                    Progresso: {Math.round((list.confirmedGuests / list.totalGuests) * 100)}%
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
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