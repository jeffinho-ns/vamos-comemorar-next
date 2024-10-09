"use client";
import { MdAdd, MdRefresh, MdEdit, MdDelete, MdTableChart } from "react-icons/md";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

interface WorkDay {
  id: number;
  online: string;  // URL ou nome do ícone de status
  date: string;  // Data do evento
  place: string;  // Nome do local
  gifts: boolean;  // Se há brindes
  tables: boolean;  // Se há mesas
  type: string;  // Tipo do evento (normal, etc.)
}

export default function WorkDay() {
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkDays = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('https://api.vamoscomemorar.com.br/working_days?page=1&perPage=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) throw new Error('Erro ao buscar dias de funcionamento');
      
      const data = await response.json();
  
      if (Array.isArray(data.data)) {
        setWorkDays(data.data); 
      } else {
        setError('Dados inválidos.');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro desconhecido');
      }
      console.error('Erro ao buscar dias de funcionamento:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkDays();
  }, []);

  return (
    <div className="w-full p-6 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Dias de Funcionamento</h2>

      <div className="flex items-center mb-6">
        <button onClick={fetchWorkDays} className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full mr-4">
          <MdRefresh className="text-xl" />
        </button>
        <button className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full">
          <MdAdd className="text-xl" />
        </button>
      </div>

      {loading && <p>Carregando dias de funcionamento...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-left table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold">On.</th>
              <th className="px-6 py-3 font-semibold">Dia</th>
              <th className="px-6 py-3 font-semibold">Local</th>
              <th className="px-6 py-3 font-semibold">Brindes</th>
              <th className="px-6 py-3 font-semibold">Mesas</th>
              <th className="px-6 py-3 font-semibold">Tipo</th>
              <th className="px-6 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {workDays.length > 0 ? (
              workDays.map((day) => (
                <tr key={day.id} className="border-t">
                  <td className="px-6 py-4">
                    {day.online ? <img src={day.online} alt="Status" className="w-6 h-6" /> : '—'}
                  </td>
                  <td className="px-6 py-4">{new Date(day.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{day.place}</td>
                  <td className="px-6 py-4">{day.gifts ? '✔️' : '—'}</td>
                  <td className="px-6 py-4">{day.tables ? '✔️' : '—'}</td>

                  <td className="px-6 py-4">{day.type}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button title="Editar">
                      <MdEdit className="text-blue-500 hover:text-blue-700" />
                    </button>
                    <button title="Excluir">
                      <MdDelete className="text-red-500 hover:text-red-700" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">Nenhum dia de funcionamento encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação - se houver */}
      <div className="mt-6 flex justify-center">
        <button className="p-2 border rounded-md mr-2">Anterior</button>
        <button className="p-2 border rounded-md">Próximo</button>
      </div>
    </div>
  );
}
