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
    ATIVA: "bg-green-100 text-green-800 border-green-200",
    CANCELADA: "bg-red-100 text-red-800 border-red-200",
    PENDENTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CONCLUIDA: "bg-blue-100 text-blue-800 border-blue-200", // Adicionado conforme seu DB
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Carregando reservas...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-red-400 text-xl">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Reservas</h1>
          <p className="text-gray-400 text-lg">Visualize e gerencie todas as reservas do sistema</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex gap-3">
            <button
              onClick={fetchReserves}
              className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2"
            >
              <MdRefresh size={20} /> Atualizar
            </button>
            {/* Adicione um link para a tela de criação de reserva, se houver */}
            {/* <Link href="/admin/reservas/nova" passHref>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                <MdAdd className="inline-block mr-1" /> Nova reserva
              </button>
            </Link> */}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentReserves.map((reserve) => (
            <Link href={`/admin/reservas/${reserve.id}`} key={reserve.id} className="block">
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200/20 shadow-lg rounded-2xl p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <div className="flex items-center gap-4 mb-4">
                  {reserve.foto_perfil ? (
                    <Image
                      src={`https://grupoideiaum.com.br/cardapio-agilizaiapp/${reserve.foto_perfil}`}
                      alt={reserve.name || 'Usuário'}
                      width={56}
                      height={56}
                      className="rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xl font-bold">
                      {reserve.name ? reserve.name.charAt(0) : 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold text-gray-800">{reserve.name}</p>
                    <p className="text-sm text-gray-500">{reserve.telefone || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    <span className="font-semibold text-gray-700">Evento:</span>{" "}
                    {reserve.nome_do_evento || 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Data:</span>{" "}
                    {reserve.data_do_evento ? new Date(reserve.data_do_evento).toLocaleDateString() : 'N/A'} às{" "}
                    {reserve.hora_do_evento || 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Local:</span>{" "}
                    {reserve.casa_do_evento || 'N/A'}
                  </p>
                  {/* Contagem de Convidados Confirmados */}
                  <p className="flex items-center">
                    <span className="font-semibold text-gray-700">
                      <MdPeople className="inline-block mr-2" size={18} /> Convidados:
                    </span>{" "}
                    <span className="font-bold text-gray-800 ml-2">
                      {reserve.confirmedGuestsCount} / {reserve.quantidade_convidados}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Mesa:</span> {reserve.mesas || 'N/A'}
                  </p>
                </div>

                {/* Indicador de presença (80% ou mais) */}
                {reserve.quantidade_convidados > 0 && (
                  <div className="mt-4 p-3 bg-gray-50/80 rounded-xl">
                    <p className="text-sm font-medium text-gray-700">
                      Check-in: {Math.round((reserve.confirmedGuestsCount / reserve.quantidade_convidados) * 100)}%
                    </p>
                    {reserve.confirmedGuestsCount >= reserve.quantidade_convidados && (
                      <p className="text-green-700 font-semibold text-sm mt-1">🎉 Todos chegaram!</p>
                    )}
                    {reserve.confirmedGuestsCount >= Math.ceil(0.8 * reserve.quantidade_convidados) &&
                      reserve.confirmedGuestsCount < reserve.quantidade_convidados && (
                        <p className="text-yellow-600 font-semibold text-sm mt-1">⚠️ 80% presentes</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`inline-block px-3 py-2 text-sm rounded-full font-semibold border ${statusColors[reserve.status as keyof typeof statusColors] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                  >
                    {reserve.status}
                  </span>
                  {/* Notificação de Brinde Liberado */}
                  {reserve.brindeStatus === 'LIBERADO' && (
                    <span className="inline-flex items-center px-3 py-2 text-sm font-semibold bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full border border-yellow-300">
                      <MdCardGiftcard className="mr-2" size={16} /> Brinde Liberado!
                    </span>
                  )}
                </div>

                {reserve.status === "PENDENTE" && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); approveReserve(reserve.id)}}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 text-sm rounded-xl flex items-center gap-2 font-semibold transition-all duration-200 transform hover:scale-105"
                    >
                      <MdCheck size={16} />
                      Aprovar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); rejectReserve(reserve.id)}}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 text-sm rounded-xl flex items-center gap-2 font-semibold transition-all duration-200 transform hover:scale-105"
                    >
                      <MdClose size={16} />
                      Reprovar
                    </button>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Paginação */}
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm bg-white/95 backdrop-blur-sm hover:bg-gray-50 transition-all duration-200 font-semibold"
          >
            Anterior
          </button>
          <span className="text-sm px-6 py-3 rounded-xl bg-white/95 backdrop-blur-sm border border-gray-200 font-semibold">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm bg-white/95 backdrop-blur-sm hover:bg-gray-50 transition-all duration-200 font-semibold"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}