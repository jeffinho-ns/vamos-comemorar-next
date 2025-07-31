"use client";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Gift {
  id: number;
  icon: string; // URL ou nome do ícone
  company_id: string;
  name: string;
  necessary_guests: number;
  created_at: string; // Data de criação
}

export default function Gifts() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [filterBy, setFilterBy] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const router = useRouter();
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL_LOCAL;

  const openModal = (gift: Gift | null = null) => {
    setSelectedGift(gift);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedGift(null);
  };

  // Função para buscar os presentes da API
  const fetchGifts = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`${API_URL}/gifts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar presentes");

      const data = await response.json();

      if (Array.isArray(data.data)) {
        setGifts(data.data);
      } else {
        setError("Dados de presentes inválidos.");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Erro desconhecido");
      }
      console.error("Erro ao buscar presentes:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const handleDelete = async (giftId: number) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este presente?"
    );

    if (confirmDelete) {
      try {
        await fetch(`${API_URL}/api/gifts/${giftId}`, {
          method: "DELETE",
        });

        setGifts(gifts.filter((gift: Gift) => gift.id !== giftId));

        alert("Presente excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir o presente:", error);
        alert("Ocorreu um erro ao tentar excluir o presente.");
      }
    }
  };

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  const filteredGifts = gifts.filter((gift) => {
    return (
      gift.name.toLowerCase().includes(filterBy.toLowerCase()) ||
      gift.company_id.toLowerCase().includes(filterBy.toLowerCase())
    );
  });

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Carregando presentes...</div>
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
          <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Presentes</h1>
          <p className="text-gray-400 text-lg">Visualize e gerencie todos os presentes do sistema</p>
        </div>

        <div className="flex items-center mb-8 gap-4">
          <button
            onClick={fetchGifts}
            className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <MdRefresh className="text-xl" />
          </button>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 p-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <MdAdd className="text-xl" />
          </button>
        </div>

        <div className="mb-8">
          <input
            type="text"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="w-full md:w-2/3 p-4 rounded-xl shadow-lg border border-gray-200/30 bg-white/95 backdrop-blur-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
            placeholder="Buscar por nome ou empresa"
          />
        </div>

        <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden border border-gray-200/20">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-800">Ícone</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Empresa</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Nome</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Convidados</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Criado em</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGifts.length > 0 ? (
                  filteredGifts.map((gift) => (
                    <tr key={gift.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {gift.icon ? (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Image
                              src={gift.icon}
                              alt="Ícone"
                              width={32}
                              height={32}
                              className="rounded"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                            🎁
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{gift.company_id}</td>
                      <td className="px-6 py-4 text-gray-600">{gift.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                          {gift.necessary_guests} convidados
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(gift.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 flex space-x-3">
                        <button 
                          onClick={() => openModal(gift)} 
                          title="Editar"
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button 
                          onClick={() => handleDelete(gift.id)} 
                          title="Excluir"
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                        >
                          <MdDelete size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-400 text-lg mb-2">🎁</div>
                      <p className="text-gray-500 text-lg">Nenhum presente encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
