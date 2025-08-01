"use client";

import { useState, useEffect } from "react";
import { MdSecurity, MdPeople, MdEvent, MdSettings, MdAdd, MdEdit, MdDelete } from "react-icons/md";

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface PermissoesLimitesProps {
  establishment: Establishment;
}

interface Permission {
  id: number;
  role: string;
  description: string;
  permissions: string[];
  maxGuests: number;
  maxEvents: number;
  status: 'active' | 'inactive';
}

export default function PermissoesLimites({ establishment }: PermissoesLimitesProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const mockPermissions: Record<number, Permission[]> = {
          1: [
            {
              id: 1,
              role: "Admin",
              description: "Acesso total ao sistema",
              permissions: ["Criar eventos", "Gerenciar convidados", "Ver relatórios", "Configurações"],
              maxGuests: 1000,
              maxEvents: 50,
              status: 'active'
            },
            {
              id: 2,
              role: "Gerente",
              description: "Gerenciamento de eventos e convidados",
              permissions: ["Criar eventos", "Gerenciar convidados", "Ver relatórios"],
              maxGuests: 500,
              maxEvents: 25,
              status: 'active'
            }
          ],
          2: [
            {
              id: 3,
              role: "Promoter",
              description: "Adicionar convidados às listas",
              permissions: ["Adicionar convidados", "Ver listas"],
              maxGuests: 100,
              maxEvents: 10,
              status: 'active'
            }
          ],
          3: [
            {
              id: 4,
              role: "Supervisor",
              description: "Supervisão de eventos",
              permissions: ["Ver eventos", "Gerenciar convidados", "Ver relatórios"],
              maxGuests: 300,
              maxEvents: 15,
              status: 'active'
            }
          ],
          4: [
            {
              id: 5,
              role: "Operador",
              description: "Operações básicas",
              permissions: ["Ver eventos", "Adicionar convidados"],
              maxGuests: 50,
              maxEvents: 5,
              status: 'active'
            }
          ]
        };

        setPermissions(mockPermissions[establishment.id] || []);
      } catch (error) {
        console.error("Erro ao carregar permissões:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
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
        <h3 className="text-lg font-semibold text-gray-800">Permissões e Limites</h3>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition-colors">
          <MdAdd />
          Nova Permissão
        </button>
      </div>

      <div className="space-y-4">
        {permissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma permissão encontrada</h3>
            <p className="text-gray-500">
              Não há permissões configuradas para este estabelecimento.
            </p>
          </div>
        ) : (
          permissions.map((permission) => (
            <div key={permission.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {permission.role}
                      </h3>
                      <p className="text-gray-600">{permission.description}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${
                      permission.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      <MdSecurity className="text-blue-500" />
                      {permission.status === 'active' ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <MdPeople className="text-blue-500" />
                      <span className="text-gray-700">Máx. {permission.maxGuests} convidados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MdEvent className="text-green-500" />
                      <span className="text-gray-700">Máx. {permission.maxEvents} eventos</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Permissões:</h4>
                    <div className="flex flex-wrap gap-2">
                      {permission.permissions.map((perm, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  Ver Detalhes
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                  Atribuir Usuários
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