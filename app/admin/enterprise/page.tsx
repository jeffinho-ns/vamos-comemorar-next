"use client";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState, useCallback, useMemo } from "react";
import Enterprise from "../../components/enterprise/enterprise";
import { useRouter } from "next/navigation";
import { Establishment } from "../../types/Establishment";
import { WithPermission } from "../../components/WithPermission/WithPermission";

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
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Carregando empresas...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-red-400 text-xl">{error}</div>
    </div>
  );

  return (
    <WithPermission allowedRoles={["admin", "gerente", "promoter"]}>
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Empresas</h1>
          <p className="text-gray-400 text-lg">Visualize e gerencie todas as empresas do sistema</p>
        </div>

        <div className="flex items-center mb-8 gap-4">
          <button
            onClick={fetchCompanies}
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
          <Enterprise isOpen={modalIsOpen} onRequestClose={closeModal} company={selectedCompany} />
        </div>

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
                  <th className="px-6 py-4 font-bold text-gray-800">Nome</th>
                  <th className="px-6 py-4 font-bold text-gray-800">E-mail</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Telefone</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Criado em</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-800">{company.name}</td>
                      <td className="px-6 py-4 text-gray-600">{company.email}</td>
                      <td className="px-6 py-4 text-gray-600">{company.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${
                          company.status === 'ATIVA' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {company.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{company.created_at}</td>
                      <td className="px-6 py-4 flex space-x-3">
                        <button 
                          onClick={() => openModal(company)} 
                          title="Editar"
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button 
                          onClick={() => handleDelete(company.id.toString())} 
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
                      <div className="text-gray-400 text-lg mb-2">🏢</div>
                      <p className="text-gray-500 text-lg">Nenhuma empresa encontrada</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </WithPermission>
  );
}
