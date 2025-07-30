"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MdAdd, MdCheck, MdClose, MdRefresh, MdPeople, MdCardGiftcard } from "react-icons/md"; // Importe novos ícones
import Link from "next/link"; // Importe Link para navegação

interface Reserve {
  id: number;
  name: string; // Nome do criador da reserva
  email: string;
  brinde: string; // Este campo parece ser o tipo_reserva da API
  casa_da_reserva?: string; // Pode vir como null da API
  casa_do_evento?: string; // Pode vir como null da API
  data_da_reserva?: string; // Pode vir como null da API
  data_do_evento?: string;
  foto_perfil?: string;
  hora_do_evento?: string;
  imagem_do_evento?: string;
  local_do_evento?: string;
  mesas?: string;
  nome_do_evento?: string;
  quantidade_convidados: number; // Renomeado para 'quantidade_convidados' para corresponder à API
  status: string;
  telefone?: string;
  confirmedGuestsCount: number; // <--- NOVO CAMPO
  brindeStatus?: string; // <--- NOVO CAMPO
  creatorName?: string; // Nome do criador da reserva, se a API retornar
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
        // Mapeie os dados para garantir que os novos campos estejam presentes
        const mappedData: Reserve[] = data.map((item: any) => ({
            id: item.id,
            name: item.name || item.creatorName || 'N/A', // Priorize creatorName, mas mantenha 'name' se for o caso
            email: item.email,
            brinde: item.brinde,
            casa_da_reserva: item.casa_da_reserva,
            casa_do_evento: item.casa_do_evento,
            data_da_reserva: item.data_da_reserva,
            data_do_evento: item.data_do_evento,
            foto_perfil: item.foto_perfil,
            hora_do_evento: item.hora_do_evento,
            imagem_do_evento: item.imagem_do_evento,
            local_do_evento: item.local_do_evento,
            mesas: item.mesas,
            nome_do_evento: item.nome_do_evento,
            quantidade_convidados: item.quantidade_convidados, // Corrigido aqui
            status: item.status,
            telefone: item.telefone,
            confirmedGuestsCount: item.confirmedGuestsCount ?? 0, // Mapeie o novo campo
            brindeStatus: item.brindeStatus, // Mapeie o novo campo
            creatorName: item.creatorName // Mantenha o creatorName original se quiser
        }));
        setReserves(mappedData);
      } else {
        setError("Dados inválidos. Esperado um array.");
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
      const token = localStorage.getItem("authToken"); // Adicionado token para PUT
      const response = await fetch(
        `${API_URL}/api/reservas/update-status/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Adicionado Authorization
          },
          body: JSON.stringify({ status: "ATIVA" }), // Mudei para ATIVA (conforme seu DB)
        }
      );

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao aprovar a reserva.");
      }

      // Após a aprovação, o brinde pode ter sido liberado. Re-fetch para atualizar.
      fetchReserves(); 

    } catch (error) {
      console.error("Erro ao aprovar a reserva:", error);
      alert(`Falha ao aprovar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao reprovar a reserva.");
      }

      setReserves((prevReserves) =>
        prevReserves.map((reserve) =>
          reserve.id === id ? { ...reserve, status: "CANCELADA" } : reserve // Mudei para CANCELADA (conforme seu DB)
        )
      );
    } catch (error) {
      console.error("Erro ao reprovar a reserva:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      alert(`Falha ao reprovar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  // Paginação
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentReserves = reserves.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(reserves.length / itemsPerPage);

  const statusColors: { [key: string]: string } = { // Definindo tipo explícito
    ATIVA: "bg-green-200 text-green-800",
    CANCELADA: "bg-red-200 text-red-800",
    PENDENTE: "bg-yellow-200 text-yellow-800",
    CONCLUIDA: "bg-blue-200 text-blue-800", // Adicionado conforme seu DB
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
          {/* Adicione um link para a tela de criação de reserva, se houver */}
          {/* <Link href="/admin/reservas/nova" passHref>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
              <MdAdd className="inline-block mr-1" /> Nova reserva
            </button>
          </Link> */}
        </div>
      </div>

      {loading && <p>Carregando reservas...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {currentReserves.map((reserve) => (
          <Link href={`/admin/reservas/${reserve.id}`} key={reserve.id} className="block"> {/* Adicionado Link para a página de detalhes */}
          {/* Indicador de presença (80% ou mais) */}
{reserve.quantidade_convidados > 0 && (
  <p className="text-sm mt-1">
    <span className="font-medium">Check-in:</span>{" "}
    {Math.round((reserve.confirmedGuestsCount / reserve.quantidade_convidados) * 100)}%
    {" "}
    {reserve.confirmedGuestsCount >= reserve.quantidade_convidados && (
      <span className="text-green-700 font-semibold ml-2">🎉 Todos chegaram!</span>
    )}
    {reserve.confirmedGuestsCount >= Math.ceil(0.8 * reserve.quantidade_convidados) &&
      reserve.confirmedGuestsCount < reserve.quantidade_convidados && (
        <span className="text-yellow-600 font-semibold ml-2">⚠️ 80% presentes</span>
    )}
  </p>
)}
            <div
              className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center gap-4">
                {reserve.foto_perfil ? (
                  <Image
                    src={`${API_URL}/uploads/${reserve.foto_perfil}`}
                    alt={reserve.name || 'Usuário'}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-lg font-semibold">
                    {reserve.name ? reserve.name.charAt(0) : 'U'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-800">{reserve.name}</p>
                  <p className="text-xs text-gray-500">{reserve.telefone || 'N/A'}</p>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Evento:</span>{" "}
                  {reserve.nome_do_evento || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Data:</span>{" "}
                  {reserve.data_do_evento ? new Date(reserve.data_do_evento).toLocaleDateString() : 'N/A'} às{" "}
                  {reserve.hora_do_evento || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Local:</span>{" "}
                  {reserve.casa_do_evento || 'N/A'}
                </p>
                {/* Contagem de Convidados Confirmados */}
                <p className="flex items-center">
                  <span className="font-medium">
                    <MdPeople className="inline-block mr-1" /> Convidados Confirmados:
                  </span>{" "}
                  <span className="font-bold text-gray-700">
                    {reserve.confirmedGuestsCount} / {reserve.quantidade_convidados}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Mesa:</span> {reserve.mesas || 'N/A'}
                </p>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-md font-medium ${statusColors[reserve.status as keyof typeof statusColors] || "bg-gray-200 text-gray-700"}`}
                >
                  {reserve.status}
                </span>
                {/* Notificação de Brinde Liberado */}
                {reserve.brindeStatus === 'LIBERADO' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">
                    <MdCardGiftcard className="mr-1" /> Brinde Liberado!
                  </span>
                )}
              </div>

              {reserve.status === "PENDENTE" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); approveReserve(reserve.id)}}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm rounded-md flex items-center"
                  >
                    <MdCheck className="mr-1" />
                    Aprovar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); rejectReserve(reserve.id)}}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded-md flex items-center"
                  >
                    <MdClose className="mr-1" />
                    Reprovar
                  </button>
                </div>
              )}
            </div>
          </Link>
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