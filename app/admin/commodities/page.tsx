"use client";

import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState, useCallback } from "react";
import PlaceModal from "../../components/places/placeModal";
import EditPlaceModal from "../../components/editPlace/editPlaceModal";
import { Business, Place } from "./types";
import Image from "next/image";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL_NETWORK ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL;




// Função de conversão
const convertBusinessToPlace = (business: Business): Place => ({
  id: business.id,
  cnpj: business.cnpj || "",
  name: business.name || "Sem nome",
  telefone: business.telefone || "Não informado",
  email: business.email || "Não informado",
  logo: business.logo || "default-logo.png",
});

export default function Businesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filterBy, setFilterBy] = useState<string>("");
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Place | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Função para buscar negócios
  const fetchBusinesses = useCallback(async (): Promise<void> => {
    if (!token) {
      console.error("Token não disponível.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/places`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar negócios");

      const data = await response.json();
      if (Array.isArray(data.data)) {
        setBusinesses(data.data);
      } else {
        throw new Error("Dados de negócios inválidos.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      console.error("Erro ao buscar negócios:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Função para abrir o modal de edição
  const openEditModal = (business: Business): void => {
    const place = convertBusinessToPlace(business);
    setSelectedBusiness(place);
    setEditModalIsOpen(true);
  };

  // Funções para abrir e fechar modais
  const openModal = (): void => {
    setSelectedBusiness(null);
    setModalIsOpen(true);
  };

  const closeModal = (): void => {
    setModalIsOpen(false);
    setSelectedBusiness(null);
  };

  const closeEditModal = (): void => {
    setEditModalIsOpen(false);
    setSelectedBusiness(null);
  };

  // Buscar token armazenado
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    setToken(storedToken);
  }, []);

  // Buscar negócios quando o token estiver disponível
  useEffect(() => {
    if (token) {
      fetchBusinesses();
    }
  }, [token, fetchBusinesses]);

  // Filtrar negócios pelo nome ou e-mail
  const filteredBusinesses = businesses.filter((business) => {
    const lowerFilter = filterBy.toLowerCase();
    return (
      (business.name && business.name.toLowerCase().includes(lowerFilter)) ||
      (business.email && business.email.toLowerCase().includes(lowerFilter))
    );
  });

  return (
    <div className="w-full p-6 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Negócios</h2>

      <div className="flex items-center mb-6">
        <button
          onClick={fetchBusinesses}
          className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full mr-4"
        >
          <MdRefresh className="text-xl" />
        </button>
        <button
          onClick={openModal}
          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full"
        >
          <MdAdd className="text-xl" />
        </button>
      </div>

      <PlaceModal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        addPlace={() => {}}
        place={selectedBusiness}
      />

      <EditPlaceModal
        isOpen={editModalIsOpen}
        onRequestClose={closeEditModal}
        currentPlace={selectedBusiness}
        updatePlace={() => {}}
      />

      <input
        type="text"
        value={filterBy}
        onChange={(e) => setFilterBy(e.target.value)}
        className="w-2/3 p-3 mb-6 rounded-md shadow-sm border-gray-300 focus:ring focus:ring-blue-200"
        placeholder="Nome ou E-mail"
      />

      {loading && <p>Carregando negócios...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <table className="min-w-full bg-white shadow-lg rounded-lg">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-6 py-3">Logo</th>
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3">E-mail</th>
            <th className="px-6 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredBusinesses.map((business) => (
            <tr key={business.id} className="border-t">
              <td className="px-6 py-4">
                <Image
                  src={
                    business.logo?.startsWith("http")
                      ? business.logo
                      : `${API_URL}/uploads/${business.logo || "default-logo.png"}`
                  }
                  alt={business.name || "Logo"}
                  width={48}
                  height={48}
                />
              </td>
              <td className="px-6 py-4">{business.name || "Sem nome"}</td>
              <td className="px-6 py-4">{business.email || "Sem e-mail"}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => openEditModal(business)}
                  title="Editar"
                >
                  <MdEdit className="text-blue-500 hover:text-blue-700" />
                </button>
                <button
                  onClick={() => {}}
                  title="Excluir"
                >
                  <MdDelete className="text-red-500 hover:text-red-700" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
