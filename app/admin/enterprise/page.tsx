"use client";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState } from "react";
import Enterprise from "../../components/enterprise/enterprise";
import { useRouter } from 'next/navigation'; // Importando o router
import { useMemo } from 'react';

// Atualização da definição do tipo Company
interface Company {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  logo?: string; // Caso queira adicionar logo no futuro
}

export default function Companies() { // Mudando o nome da função para Companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filterBy, setFilterBy] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const router = useRouter(); // Instância do router

  const openModal = (company: any = null) => {
    setSelectedCompany(company); // Define a empresa ou null no estado
    setModalIsOpen(true); // Abre o modal
  };

  const initialEnterpriseState = useMemo(() => ({
    id: 0,
    name: '',
    email: '',
    phone: '',
    status: '',
    created_at: '',
    logo: ''
  }), []);
  
  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedCompany(null); // Reseta a empresa selecionada ao fechar o modal
  };

  // Função para buscar as empresas da API da Vamos Comemorar
  const fetchCompanies = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch('http://localhost:5000/places', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) throw new Error('Erro ao buscar empresas');
      
      const data = await response.json();
  
      // Verifica se 'data' é um array de empresas
      if (Array.isArray(data.data)) {
        setCompanies(data.data); // Ajuste para `data.data` com empresas
      } else {
        setError('Dados de empresas inválidos.');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro desconhecido');
      }
      console.error('Erro ao buscar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (companyId: string) => {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta empresa?");
    
    if (confirmDelete) {
      try {
        // Chamada para deletar a empresa da API
        await fetch(`/api/enterprises/${companyId}`, {
          method: 'DELETE',
        });
  
        // Atualize a lista de empresas removendo a empresa deletada
        setCompanies(companies.filter((company: any) => company.id !== companyId));
        
        alert('Empresa excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir a empresa:', error);
        alert('Ocorreu um erro ao tentar excluir a empresa.');
      }
    }
  };
  
  
  useEffect(() => {
    fetchCompanies();
  }, [initialEnterpriseState]);

  // Função para adicionar um novo usuário
  const addUser = (newUser: any) => {
    // Lógica para adicionar um novo usuário
    console.log('Novo usuário adicionado:', newUser);
    // Aqui você pode implementar a lógica para adicionar o novo usuário à lista de empresas, se necessário.
  };

  // Filtrar as empresas conforme o input
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
        <button onClick={fetchCompanies} className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full mr-4">
          <MdRefresh className="text-xl" />
        </button>
        <button onClick={() => openModal()} className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full">
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
              filteredCompanies.map((company, index) => (
                <tr key={index} className="border-t">
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
                <td colSpan={6} className="px-6 py-4 text-center">Nenhuma empresa encontrada</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
