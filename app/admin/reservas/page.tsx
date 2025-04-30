"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MdAdd, MdCheck, MdClose, MdRefresh } from "react-icons/md";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

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

      setReserves((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "Aprovado" } : r
        )
      );
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

  // Paginação
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentReserves = reserves.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(reserves.length / itemsPerPage);

  const statusColors = {
    Aguardando: "bg-yellow-200 text-yellow-800",
    Aprovado: "bg-green-200 text-green-800",
    Reprovado: "bg-red-200 text-red-800",
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex gap-2">
          <button
            onClick={fetchReserves}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            <MdRefresh className="inline-block mr-1" /> Atualizar
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
            <MdAdd className="inline-block mr-1" /> Nova reserva
          </button>
        </div>
      </div>

      {loading && <p>Carregando reservas...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {currentReserves.map((reserve) => (
          <div
            key={reserve.id}
            className="bg-white border border-gray-200 shadow-sm rounded-lg p-4"
          >
            <div className="flex items-center gap-4">
              <Image
                src={`${API_URL}/uploads/${reserve.foto_perfil}`}
                alt={reserve.name}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">{reserve.name}</p>
                <p className="text-xs text-gray-500">{reserve.telefone}</p>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Evento:</span>{" "}
                {reserve.nome_do_evento}
              </p>
              <p>
                <span className="font-medium">Data:</span>{" "}
                {new Date(reserve.data_do_evento).toLocaleDateString()} às{" "}
                {reserve.hora_do_evento}
              </p>
              <p>
                <span className="font-medium">Local:</span>{" "}
                {reserve.casa_do_evento}
              </p>
              <p>
                <span className="font-medium">Convidados:</span>{" "}
                {reserve.quantidade_pessoas}
              </p>
              <p>
                <span className="font-medium">Mesa:</span> {reserve.mesas}
              </p>
            </div>

            <div className="mt-2">
              <span
                className={`inline-block px-2 py-1 text-xs rounded-md font-medium ${statusColors[reserve.status as keyof typeof statusColors] || "bg-gray-200 text-gray-700"}`}
              >
                {reserve.status}
              </span>
            </div>

            {reserve.status === "Aguardando" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => approveReserve(reserve.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm rounded-md flex items-center"
                >
                  <MdCheck className="mr-1" />
                  Aprovar
                </button>
                <button
                  onClick={() => rejectReserve(reserve.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded-md flex items-center"
                >
                  <MdClose className="mr-1" />
                  Reprovar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Paginação */}
      <div className="mt-8 flex justify-center gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-100"
        >
          Anterior
        </button>
        <span className="text-sm px-2 py-1 rounded-md bg-gray-100">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-100"
        >
          Próximo
        </button>
      </div>
    </div>
  );
}
