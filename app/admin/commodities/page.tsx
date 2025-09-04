'use client';

import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState, useCallback } from "react";
import PlaceModal from "../../components/places/placeModal";
import EditPlaceModal from "../../components/editPlace/editPlaceModal";
import { Business, Place } from "./types";
import Image from "next/image";
import Cookies from "js-cookie";
import { useEstablishments } from "../../hooks/useEstablishments";
//import { WithPermission } from "../../components/WithPermission/WithPermission";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'http://localhost:3001';

const convertBusinessToPlace = (business: Business): Place => ({
  id: business.id,
  cnpj: business.cnpj || "",
  name: business.name || "Sem nome",
  telefone: business.telefone || "Não informado",
  email: business.email || "Não informado",
  logo: business.logo || "default-logo.png",
});

export default function Businesses() {
  const { establishments, loading, error, fetchEstablishments, refetch } = useEstablishments();
  const [filterBy, setFilterBy] = useState<string>("");
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState<boolean>(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Place | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Converter establishments para o formato Business esperado
  const businesses: Business[] = establishments.map(est => ({
    id: est.id,
    name: est.name,
    email: est.email || "Não informado",
    telefone: est.phone || "Não informado",
    logo: est.logo || "default-logo.png",
    cnpj: est.cnpj || "",
    status: (est.status === "active" || est.status === "inactive") ? est.status : "active"
  }));

  const openEditModal = (business: Business): void => {
    const place = convertBusinessToPlace(business);
    setSelectedBusiness(place);
    setEditModalIsOpen(true);
  };

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

  useEffect(() => {
    const storedTokenLocal = localStorage.getItem("authToken");
    const storedTokenCookie = Cookies.get("authToken");
    const token = storedTokenLocal ?? storedTokenCookie ?? null;
    setToken(token);
  }, []);

  useEffect(() => {
    if (token) {
      fetchEstablishments();
    }
  }, [token, fetchEstablishments]);

  const filteredBusinesses = businesses.filter((business) => {
    const lowerFilter = filterBy.toLowerCase();
    return (
      (business.name && business.name.toLowerCase().includes(lowerFilter)) ||
      (business.email && business.email.toLowerCase().includes(lowerFilter))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    //<WithPermission allowedRoles={["Gerente"]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Negócios</h1>
            <p className="text-gray-400 text-lg">Visualize e gerencie todos os negócios do sistema</p>
          </div>

          <div className="flex items-center mb-8 gap-4">
            <button
              onClick={refetch}
              className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <MdRefresh className="text-xl" />
            </button>
            <button
              onClick={openModal}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 p-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
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

          <div className="mb-8">
            <input
              type="text"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full md:w-2/3 p-4 rounded-xl shadow-lg border border-gray-200/30 bg-white/95 backdrop-blur-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              placeholder="Buscar por nome ou e-mail"
            />
          </div>

          <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden border border-gray-200/20">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 font-bold text-gray-800">Logo</th>
                    <th className="px-6 py-4 font-bold text-gray-800">Nome</th>
                    <th className="px-6 py-4 font-bold text-gray-800">E-mail</th>
                    <th className="px-6 py-4 font-bold text-gray-800">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBusinesses.length > 0 ? (
                    filteredBusinesses.map((business) => (
                      <tr key={business.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            <Image
                              src={
                                business.logo?.startsWith("http")
                                  ? business.logo
                                  : `${API_URL}/uploads/${business.logo || "default-logo.png"}`
                              }
                              alt={business.name || "Logo"}
                              width={48}
                              height={48}
                              className="rounded-lg object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800">{business.name || "Sem nome"}</td>
                        <td className="px-6 py-4 text-gray-600">{business.email || "Sem e-mail"}</td>
                        <td className="px-6 py-4 flex space-x-3">
                          <button 
                            onClick={() => openEditModal(business)} 
                            title="Editar"
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                          >
                            <MdEdit size={20} />
                          </button>
                          <button 
                            onClick={() => {}} 
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
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="text-gray-400 text-lg mb-2">🏢</div>
                        <p className="text-gray-500 text-lg">Nenhum negócio encontrado</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
   // </WithPermission>
  );
}
