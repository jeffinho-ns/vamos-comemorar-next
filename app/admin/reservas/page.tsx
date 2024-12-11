"use client";

import { MdAdd, MdRefresh, MdCheck, MdClose } from "react-icons/md";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

interface Reserve {
  id: number;
  name: string;
  email: string;
  brinde: string;
  casa_da_reserva: string;
  casa_do_evento: string;
  data_da_reserva: string;
  data_do_evento: string;
  foto_perfil: string;
  hora_do_evento: string;
  imagem_do_evento: string;
  local_do_evento: string;
  mesas: string;
  nome_do_evento: string;
  quantidade_pessoas: number;
  status: string;
  telefone: string;
}

export default function Reserves() {
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL_LOCAL ||
    "http://localhost:3000";

  const fetchReserves = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`${API_URL}/api/reservas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar reservas");

      const data = await response.json();

      if (Array.isArray(data)) {
        setReserves(data);
      } else {
        setError("Dados inválidos.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      console.error("Erro ao buscar reservas:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchReserves();
    const intervalId = setInterval(() => {
      fetchReserves();
    }, 60000);
    return () => clearInterval(intervalId);
  }, [fetchReserves]);

  const approveReserve = async (id: number) => {
    try {
      const response = await fetch(
        `${API_URL}/api/reservas/update-status/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "Aprovado" }),
        }
      );

      if (!response.ok) throw new Error("Erro ao aprovar a reserva.");

      console.log("Reserva aprovada com sucesso!");
    } catch (error) {
      console.error("Erro ao aprovar a reserva:", error);
    }
  };

  const rejectReserve = async (id: number) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`${API_URL}/api/reservas/${id}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Erro ao reprovar a reserva.");

      setReserves((prevReserves) =>
        prevReserves.map((reserve) =>
          reserve.id === id ? { ...reserve, status: "Reprovado" } : reserve
        )
      );
    } catch (error) {
      console.error("Erro ao reprovar a reserva:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };


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
              <th className="px-6 py-3 font-semibold">Foto</th>
              <th className="px-6 py-3 font-semibold">Nome</th>
              <th className="px-6 py-3 font-semibold">Data da Reserva</th>
              <th className="px-6 py-3 font-semibold">Convidados</th>
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
<td className="px-6 py-4">
  <Image
    src={`${API_URL}/uploads/${reserve.foto_perfil}`}
    alt={`Foto de ${reserve.name}`}
    width={48} // Ajuste o tamanho conforme necessário
    height={48}
    className="rounded-full object-cover"
  />
</td>
                  <td className="px-6 py-4">{reserve.name}</td>
                  <td className="px-6 py-4">{new Date(reserve.data_da_reserva).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{reserve.quantidade_pessoas}</td>
                  <td className="px-6 py-4">{reserve.casa_do_evento}</td>
                  <td className="px-6 py-4">{reserve.mesas}</td>
                  <td className="px-6 py-4">{reserve.status}</td>
                  <td className="px-6 py-4">{new Date(reserve.data_do_evento).toLocaleDateString()}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    {reserve.status === "Aguardando" && (
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

      <div className="mt-6 flex justify-center">
        <button className="p-2 border rounded-md mr-2">Anterior</button>
        <button className="p-2 border rounded-md">Próximo</button>
      </div>
    </div>
  );
}
