"use client";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState, useCallback, useMemo } from "react";
import Enterprise from "../../components/enterprise/enterprise";
import { useRouter } from "next/navigation";
import { Establishment } from "../../types/Establishment";

// Definindo os tipos
interface Company {
  id: string; // Tipo do id: string ou number dependendo de como você trata
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  logo?: string;
  cnpj: string;
  site?: string;
  emailFinanceiro?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
}

// Função para mapear Company para Establishment
const mapCompanyToEstablishment = (company: Company): Establishment => ({
  id: company.id.toString(), // Convertendo o id para string
  cnpj: "", // Preencha conforme necessário ou deixe vazio
  nome: company.name,
  telefone: company.phone || "",
  email: company.email,
  status: company.status,
  logo: company.logo || "",
});

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filterBy, setFilterBy] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Establishment | null>(null);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  const openModal = (company: Company | null = null) => {
    if (company) {
      setSelectedCompany(mapCompanyToEstablishment(company));
    } else {
      setSelectedCompany(null);
    }
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedCompany(null);
  };

  const initialEnterpriseState = useMemo(
    () => ({
      id: "0", // Garantindo que o id seja uma string
      cnpj: "",
      nome: "",
      telefone: "",
      email: "",
      status: "",
      logo: "",
    }),
    []
  );

  // Memoriza a função fetchCompanies
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`${API_URL}/api/places`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar empresas");

      const data = await response.json();

      if (Array.isArray(data.data)) {
        setCompanies(data.data);
      } else {
        setError("Dados de empresas inválidos.");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Erro desconhecido");
      }
      console.error("Erro ao buscar empresas:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDelete = async (companyId: string) => {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta empresa?");
    if (confirmDelete) {
      try {
        await fetch(`/api/enterprises/${companyId}`, {
          method: "DELETE",
        });

        setCompanies(companies.filter((company) => company.id.toString() !== companyId));
        alert("Empresa excluída com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir a empresa:", error);
        alert("Ocorreu um erro ao tentar excluir a empresa.");
      }
    }
  };

  const filteredCompanies = companies.filter((company) => {
    return (
      company.name.toLowerCase().includes(filterBy.toLowerCase()) ||
      company.email.toLowerCase().includes(filterBy.toLowerCase())
    );
  });

  return (
    <div className="w-full p-6 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Empresas</h2>

      <div className="flex items-center mb-6">
        <button
          onClick={fetchCompanies}
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
        <Enterprise isOpen={modalIsOpen} onRequestClose={closeModal} company={selectedCompany} />
      </div>

      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="w-2/3 p-3 rounded-md shadow-sm border-gray-300 focus:ring focus:ring-blue-200"
          placeholder="Nome ou E-mail"
        />
      </div>

      {loading && <p>Carregando empresas...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-left table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Nome</th>
              <th className="px-6 py-3 font-semibold">E-mail</th>
              <th className="px-6 py-3 font-semibold">Telefone</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Criado em</th>
              <th className="px-6 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <tr key={company.id} className="border-t">
                  <td className="px-6 py-4">{company.name}</td>
                  <td className="px-6 py-4">{company.email}</td>
                  <td className="px-6 py-4">{company.phone}</td>
                  <td className="px-6 py-4">{company.status}</td>
                  <td className="px-6 py-4">{company.created_at}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button onClick={() => openModal(company)} title="Editar">
                      <MdEdit className="text-blue-500 hover:text-blue-700" />
                    </button>
                    <button onClick={() => handleDelete(company.id.toString())} title="Excluir">
                      <MdDelete className="text-red-500 hover:text-red-700" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Nenhuma empresa encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
