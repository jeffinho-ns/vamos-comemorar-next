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

  return (
    <div className="w-full p-6 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Presentes</h2>

      <div className="flex items-center mb-6">
        <button
          onClick={fetchGifts}
          className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full mr-4"
        >
          <MdRefresh className="text-xl" />
        </button>
        <button
          onClick={() => openModal()}
          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full"
        >
          <MdAdd className="text-xl" />
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="w-2/3 p-3 rounded-md shadow-sm border-gray-300 focus:ring focus:ring-blue-200"
          placeholder="Nome ou Empresa"
        />
      </div>

      {loading && <p>Carregando presentes...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-left table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Ícone</th>
              <th className="px-6 py-3 font-semibold">Empresa</th>
              <th className="px-6 py-3 font-semibold">Nome</th>
              <th className="px-6 py-3 font-semibold">Convidados</th>
              <th className="px-6 py-3 font-semibold">Criado em</th>
              <th className="px-6 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredGifts.length > 0 ? (
              filteredGifts.map((gift) => (
                <tr key={gift.id} className="border-t">
                  <td className="px-6 py-4">
                    {gift.icon ? (
                      <Image
                        src={gift.icon}
                        alt="Ícone"
                        className="w-8 h-8"
                      />
                    ) : (
                      "Sem ícone"
                    )}
                  </td>
                  <td className="px-6 py-4">{gift.company_id}</td>
                  <td className="px-6 py-4">{gift.name}</td>
                  <td className="px-6 py-4">{gift.necessary_guests}</td>
                  <td className="px-6 py-4">
                    {new Date(gift.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button onClick={() => openModal(gift)} title="Editar">
                      <MdEdit className="text-blue-500 hover:text-blue-700" />
                    </button>
                    <button onClick={() => handleDelete(gift.id)} title="Excluir">
                      <MdDelete className="text-red-500 hover:text-red-700" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Nenhum presente encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
