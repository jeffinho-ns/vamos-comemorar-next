"use client";
import { MdAdd, MdRefresh, MdCheck, MdClose } from "react-icons/md";
import { useEffect, useState } from "react";

interface Reserve {
  id: number;
  type: string; // Tipo online
  date: string; // Data da reserva
  guests: number; // Número de convidados
  user: string; // Usuário
  local: string; // Local
  table: string; // Mesa
  status: string; // Status
  created_at: string; // Criado em
}

export default function Reserves() {
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReserves = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('https://api.vamoscomemorar.com.br/reserves?page=1&perPage=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) throw new Error('Erro ao buscar reservas');
      
      const data = await response.json();
  
      if (Array.isArray(data.data)) {
        setReserves(data.data); 
      } else {
        setError('Dados inválidos.');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro desconhecido');
      }
      console.error('Erro ao buscar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveReserve = async (id: number) => {
    // Lógica para aprovar a reserva
    console.log(`Aprovar reserva com ID: ${id}`);
    // Chamada à API para aprovar a reserva pode ser adicionada aqui
  };

  const rejectReserve = async (id: number) => {
    // Lógica para reprovar a reserva
    console.log(`Reprovar reserva com ID: ${id}`);
    // Chamada à API para reprovar a reserva pode ser adicionada aqui
  };

  useEffect(() => {
    fetchReserves();
  }, []);

  return (
    <div className="w-full p-6 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Reservas</h2>

      <div className="flex items-center mb-6">
        <button onClick={fetchReserves} className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full mr-4">
          <MdRefresh className="text-xl" />
        </button>
        <button className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full">
          <MdAdd className="text-xl" />
        </button>
      </div>

      {loading && <p>Carregando reservas...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-left table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Tipo</th>
              <th className="px-6 py-3 font-semibold">Data da Reserva</th>
              <th className="px-6 py-3 font-semibold">Convidados</th>
              <th className="px-6 py-3 font-semibold">Usuário</th>
              <th className="px-6 py-3 font-semibold">Local</th>
              <th className="px-6 py-3 font-semibold">Mesa</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Criado em</th>
              <th className="px-6 py-3 font-semibold">Ação</th>
            </tr>
          </thead>
          <tbody>
            {reserves.length > 0 ? (
              reserves.map((reserve) => (
                <tr key={reserve.id} className="border-t">
                  <td className="px-6 py-4">{reserve.type}</td>
                  <td className="px-6 py-4">{new Date(reserve.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{reserve.guests}</td>
                  <td className="px-6 py-4">{reserve.user}</td>
                  <td className="px-6 py-4">{reserve.local}</td>
                  <td className="px-6 py-4">{reserve.table}</td>
                  <td className="px-6 py-4">{reserve.status}</td>
                  <td className="px-6 py-4">{new Date(reserve.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    {reserve.status === "aguardando" && (
                      <>
                        <button title="Aprovar" onClick={() => approveReserve(reserve.id)}>
                          <MdCheck className="text-green-500 hover:text-green-700" />
                        </button>
                        <button title="Reprovar" onClick={() => rejectReserve(reserve.id)}>
                          <MdClose className="text-red-500 hover:text-red-700" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center">Nenhuma reserva encontrada</td>
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
