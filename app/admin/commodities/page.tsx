"use client";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState } from "react";
import BusinessModal from "../../components/enterprise/enterprise"; // Renomeado o componente
import { useRouter } from 'next/navigation'; // Importando o router
import { Business } from './types'; // Importe o tipo renomeado
import Image from 'next/image'; // Importando o componente Image

// Interface para Establishment
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
    cnpj: business.cnpj || "", // Valor padrão
    nome: business.name || "", // Valor padrão
    telefone: business.telefone || "", // Valor padrão
    email: business.email || "", // Valor padrão
  };
};

export default function Businesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filterBy, setFilterBy] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null); // Renomeado para 'selectedBusiness'

  const openModal = (business: Business | null = null) => {
    setSelectedBusiness(business); // Define o negócio ou null no estado
    setModalIsOpen(true); // Abre o modal
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedBusiness(null); // Reseta o negócio selecionado ao fechar o modal
  };

  // Função para buscar os negócios da API da Vamos Comemorar
  const fetchBusinesses = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('https://api.vamoscomemorar.com.br/places?page=1&perPage=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar negócios');

      const data = await response.json();

      // Verifica se 'data' é um array de negócios
      if (Array.isArray(data.data)) {
        setBusinesses(data.data); // Ajuste para `data.data` com negócios
      } else {
        setError('Dados de negócios inválidos.');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro desconhecido');
      }
      console.error('Erro ao buscar negócios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (businessId: string) => {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este negócio?");

    if (confirmDelete) {
      try {
        // Chamada para deletar o negócio da API
        await fetch(`/api/businesses/${businessId}`, {
          method: 'DELETE',
        });

        // Atualize a lista de negócios removendo o deletado
        setBusinesses(businesses.filter((business) => business.id !== Number(businessId)));

        alert('Negócio excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir o negócio:', error);
        alert('Ocorreu um erro ao tentar excluir o negócio.');
      }
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Filtrar os negócios conforme o input
  const filteredBusinesses = businesses.filter((business) => {
    return (
      business.name.toLowerCase().includes(filterBy.toLowerCase()) || // Altere 'name' para 'nome'
      business.email.toLowerCase().includes(filterBy.toLowerCase())
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

      <BusinessModal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        company={selectedBusiness ? convertBusinessToEstablishment(selectedBusiness) : null} // Conversão aqui
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
                  <td className="px-6 py-4">{business.name}</td> {/* Alterar para 'nome' */}
                  <td className="px-6 py-4">{business.email}</td>
                  <td className="px-6 py-4">
                    {'★'.repeat(business.ranking)}
                  </td>
                  <td className="px-6 py-4">{business.status}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button onClick={() => openModal(business)} title="Editar">
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
                <td colSpan={6} className="px-6 py-4 text-center">Nenhum negócio encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
