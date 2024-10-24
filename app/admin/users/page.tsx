"use client";

import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState } from "react";
import Profile from "../../components/profile/profile";
import AddUser from "../../components/AddUser/AddUser";

// Tipo para os usuários
export type User = {
  id: number;
  name: string;
  email: string;
  telefone?: string;
  created_at?: string;
  status: string;
  type?: string;
  sexo?: string;
  data_nascimento: string;
  cep: string;
      cpf: string; // Mesma lógica
      endereco: string; // Mesma lógica
      numero: string; // Mesma lógica
      bairro: string; // Mesma lógica
      cidade: string; // Mesma lógica
      estado: string; // Mesma lógica
      complemento: string; // Mesma lógica
  foto_perfil: string; // Campo opcional para a foto de perfil
  password: string;
};

// Tipo para a API
export type APIUser = {
  id: number;
  name: string;
  email: string;
  status: string;
  foto_perfil?: string;
  type?: string;
  telefone?: string;
  sexo?: string;
  data_nascimento: string;
  cpf: string; // Mesma lógica
  cep: string;
      endereco: string; // Mesma lógica
      numero: string; // Mesma lógica
      bairro: string; // Mesma lógica
      cidade: string; // Mesma lógica
      estado: string; // Mesma lógica
      complemento: string; // Mesma lógica
      password: string;
};

// Tipo para novo usuário
type NewUser = Omit<APIUser, "id" | "status"> & {
  name: string;
  email: string;
  telefone?: string;
  type?: string;
  foto_perfil: string;
};

export default function Users() {
  const [data, setData] = useState<User[]>([]);
  const [filterBy, setFilterBy] = useState<string>("");
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("usuario");
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Defina a URL da API aqui
  const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  // Função para buscar dados da API
  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    const url = `${API_URL}/api/users?page=${page}&perPage=${perPage}&type=${userType}&search=${filterBy}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar dados');

      const responseData: APIUser[] = await response.json(); // Tipando a resposta
      const formattedData: User[] = responseData.map((user: APIUser) => ({
        ...user,
        id: Number(user.id),
        created_at: new Date().toISOString(),
        telefone: user.telefone || '', // Definindo um valor padrão
        sexo: user.sexo || '', // Definindo um valor padrão
        data_nascimento: user.data_nascimento || '', // Definindo um valor padrão
        cep: user.cep || '',
        cpf: user.cpf || '', // Definindo um valor padrão
        endereco: user.endereco || '', // Definindo um valor padrão
        numero: user.numero || '', // Definindo um valor padrão
        bairro: user.bairro || '', // Definindo um valor padrão
        cidade: user.cidade || '', // Definindo um valor padrão
        estado: user.estado || '', // Definindo um valor padrão
        complemento: user.complemento || '', // Definindo um valor padrão
        foto_perfil: user.foto_perfil || '', // Ajustando para incluir foto_perfil
      }));

      setData(formattedData);
      setTotalPages(Math.ceil(responseData.length / perPage));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userType, page, filterBy]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const filteredData = filterBy
    ? data.filter(item =>
        item.name.toLowerCase().includes(filterBy.toLowerCase()) ||
        item.email.toLowerCase().includes(filterBy.toLowerCase())
      )
    : data;

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      const token = localStorage.getItem('authToken');
      try {
        const response = await fetch(`${API_URL}/api/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Erro ao excluir usuário');
        fetchData();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
        console.error('Erro ao excluir usuário:', error);
      }
    }
  };

  const handleUserSelection = (user: User) => {
    const fullUser: Profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      telefone: user.telefone ?? '', // Usando string vazia se telefone for undefined
      sexo: user.sexo || '', // Usando string vazia se sexo for undefined
      data_nascimento: user.data_nascimento || '',
      cep: user.cep || '',
      cpf: user.cpf || '',
      endereco: user.endereco || '',
      numero: user.numero || '',
      bairro: user.bairro || '',
      cidade: user.cidade || '',
      estado: user.estado || '',
      complemento: user.complemento || '',
      password: user.password || '',
      foto_perfil: user.foto_perfil || '',
      status: user.status || '',
    };
  
    setSelectedUser(fullUser);
    setIsProfileModalOpen(true);
  };

  const handleAddUser = async (newUser: NewUser) => {
    const user = {
      ...newUser,
      type: newUser.type ?? 'defaultType',
    };
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) throw new Error('Erro ao adicionar usuário');
      fetchData();
      closeModal();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      console.error('Erro ao adicionar usuário:', error);
    }
  };

  const openEditProfileModal = (user: APIUser) => {
    const fullUser: User = {
      ...user,
      id: Number(user.id),
      created_at: new Date().toISOString(),
      foto_perfil: user.foto_perfil || '',
    };
    setSelectedUser(fullUser);
    setIsProfileModalOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setIsProfileModalOpen(false);
    setSelectedUser(null);
  };

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  return (
    <div className="w-full p-6 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Usuários e Clientes</h2>

      <div className="flex items-center mb-6">
        <button onClick={fetchData} className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full mr-4">
          <MdRefresh className="text-xl" />
        </button>
        <button onClick={() => setModalIsOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full">
          <MdAdd className="text-xl" />
        </button>
        <AddUser
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          addUser={handleAddUser}
          user={selectedUser}
          userType={selectedUser?.type}
          isModal={true}
        />
        <Profile
          isOpen={isProfileModalOpen}
          onRequestClose={() => setIsProfileModalOpen(false)}
          addUser={(user: User | NewUser) => handleAddUser(user as NewUser)} // Fazendo cast
          user={selectedUser}
          userType={selectedUser?.type || "defaultType"}
        />
      </div>

      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="w-2/3 p-3 rounded-md shadow-sm border-gray-300 focus:ring focus:ring-blue-500"
          placeholder="Buscar por nome ou e-mail"
        />
        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          className="p-3 rounded-md shadow-sm border-gray-300 focus:ring focus:ring-blue-500"
        >
          <option value="usuario">Usuário</option>
          <option value="cliente">Cliente</option>
        </select>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-2">ID</th>
              <th className="border border-gray-300 p-2">Nome</th>
              <th className="border border-gray-300 p-2">E-mail</th>
              <th className="border border-gray-300 p-2">Telefone</th>
              <th className="border border-gray-300 p-2">Criado em</th>
              <th className="border border-gray-300 p-2">Status</th>
              <th className="border border-gray-300 p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(user => (
              <tr key={user.id}>
                <td className="border border-gray-300 p-2">{user.id}</td>
                <td className="border border-gray-300 p-2">{user.name}</td>
                <td className="border border-gray-300 p-2">{user.email}</td>
                <td className="border border-gray-300 p-2">{user.telefone || 'N/A'}</td>
                <td className="border border-gray-300 p-2">{formatDate(user.created_at || '')}</td>
                <td className="border border-gray-300 p-2">{user.status}</td>
                <td className="border border-gray-300 p-2">
                  <button onClick={() => openEditProfileModal(user)} className="mr-2 text-blue-500">
                    <MdEdit />
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-500">
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-between mt-4">
        <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="p-2 bg-gray-300 rounded">
          Anterior
        </button>
        <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="p-2 bg-gray-300 rounded">
          Próximo
        </button>
      </div>
    </div>
  );
}
