"use client";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState, useMemo } from "react";
import PlaceModal from "../../components/places/placeModal";
import EditPlaceModal from "../../components/editPlace/editPlaceModal";
import { Business, Place } from './types';
import Image from 'next/image';

interface Establishment {
  id?: number;
  cnpj: string;
  nome: string;
  telefone: string;
  site?: string;
  email: string;
  emailFinanceiro?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  status?: string;
}

const convertBusinessToEstablishment = (business: Business): Establishment => {
  return {
    id: business.id,
    cnpj: business.cnpj || "",
    nome: business.name || "",
    telefone: business.telefone || "",
    email: business.email || "",
  };
};

export default function Businesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filterBy, setFilterBy] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Place | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    if (!token) {
      console.error("Token não disponível.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/places', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar negócios');

      const data = await response.json();
      if (Array.isArray(data.data)) {
        setBusinesses(data.data);
      } else {
        setError('Dados de negócios inválidos.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      console.error('Erro ao buscar negócios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (businessId: string) => {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este negócio?");
    if (confirmDelete) {
      setLoading(true);
      try {
        await fetch(`http://localhost:5000/api/places/${businessId}`, {
          method: 'DELETE',
        });
        setBusinesses((prev) => prev.filter((business) => business.id !== Number(businessId)));
        alert('Negócio excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir o negócio:', error);
        alert('Ocorreu um erro ao tentar excluir o negócio.');
      } finally {
        setLoading(false);
      }
    }
  };

  const addPlace = (newPlace: Place) => {
    setBusinesses((prev) => {
      if (selectedBusiness) {
        return prev.map((b) => (b.id === newPlace.id ? newPlace : b));
      }
      return [...prev, newPlace];
    });
  };

  const openModal = (business: Place | null = null) => {
    setSelectedBusiness(business);
    setModalIsOpen(true);
  };

  const openEditModal = (business: Place) => {
    setSelectedBusiness(business);
    setEditModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedBusiness(null);
  };

  const closeEditModal = () => {
    setEditModalIsOpen(false);
    setSelectedBusiness(null);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (token) {
      fetchBusinesses();
    }
  }, [token, fetchBusinesses]);

  const initialEnterpriseState = useMemo(
    () => ({
      id: null,
      cnpj: "",
      nome: "",
      telefone: "",
      email: "",
    }),
    []
  );

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
        <button onClick={fetchBusinesses} className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full mr-4">
          <MdRefresh className="text-xl" />
        </button>
        <button onClick={() => openModal()} className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full">
          <MdAdd className="text-xl" />
        </button>
      </div>

      <PlaceModal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        addPlace={addPlace}
        place={selectedBusiness}
      />

      <EditPlaceModal
        isOpen={editModalIsOpen}
        onRequestClose={closeEditModal}
        currentPlace={selectedBusiness}
        updatePlace={addPlace}
      />

      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="w-2/3 p-3 rounded-md shadow-sm border-gray-300 focus:ring focus:ring-blue-200"
          placeholder="Nome ou E-mail"
        />
      </div>

      {loading && <p>Carregando negócios...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-left table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Logo</th>
              <th className="px-6 py-3 font-semibold">Nome</th>
              <th className="px-6 py-3 font-semibold">E-mail</th>
              <th className="px-6 py-3 font-semibold">Ranking</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business) => (
                <tr key={business.id} className="border-t">
                  <td className="px-6 py-4">
                    <Image src={business.logo} alt={business.name} width={48} height={48} className="object-cover rounded-full" />
                  </td>
                  <td className="px-6 py-4">{business.name}</td>
                  <td className="px-6 py-4">{business.email}</td>
                  <td className="px-6 py-4">{"★".repeat(business.ranking)}</td>
                  <td className="px-6 py-4">{business.status}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button onClick={() => openEditModal(business)} title="Editar">
                      <MdEdit className="text-blue-500 hover:text-blue-700" />
                    </button>
                    <button onClick={() => handleDelete(business.id.toString())} title="Excluir">
                      <MdDelete className="text-red-500 hover:text-red-700" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">Nenhum negócio encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
