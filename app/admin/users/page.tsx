"use client";

import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState } from "react";
import Profile from "../../components/profile/profile";
import AddUser from "../../components/AddUser/AddUser";

// Tipo para os usuários no estado
export type User = {
  id: number; // Deve ser number
  name: string;
  email: string;
  telefone: string;
  created_at: string;
  status: string;
  type: string;
};

// Tipo para a API
export type APIUser = {
  id: number; // Mude para number para ser consistente com User
  name: string;
  email: string;
  telefone: string;
  created_at: string;
  status: string;
  type: string;
};

type ProfileUser = {
  id: number; // Ajuste aqui de acordo com o que precisa
  name: string;
  email: string;
  telefone: string;
  created_at: string;
  status: string;
  type: string;
};

// Tipo para novo usuário
type NewUser = Omit<APIUser, "id" | "created_at" | "status"> & {
  type: string; // ou o tipo correto que você deseja
};

export type ProfileProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  addUser: (newUser: NewUser) => Promise<void>;
  user: User | null; // Isso está correto
  userType: string;
};

export default function Users() {
  const [data, setData] = useState<User[]>([]);
  const [filterBy, setFilterBy] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState("usuario");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditProfileModalOpen, setEditProfileIsOpen] = useState(false); // Adicionado

  // Função para buscar dados da API
  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    const url = `http://localhost:5000/api/users?page=${page}&perPage=${perPage}&type=${userType}&search=`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar dados');

      const data = await response.json();
      // Mapeie para garantir que o id seja sempre um número
      const formattedData = data.map((user: APIUser) => ({
        ...user,
        id: Number(user.id),
      }));

      setData(formattedData);
      setTotalPages(Math.ceil(data.length / perPage));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userType, page]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(filterBy.toLowerCase()) ||
    item.email.toLowerCase().includes(filterBy.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      const token = localStorage.getItem('authToken');
      try {
        const response = await fetch(`http://localhost:5000/api/users/${id}`, {
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

  const handleAddUser = async (newUser: NewUser): Promise<void> => {
    if (!newUser.type) {
      console.error('O tipo do usuário é obrigatório');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
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
    setSelectedUser({ ...user, id: Number(user.id) }); // Assegura que o id é um número
    setEditProfileIsOpen(true);
    setIsProfileModalOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setEditProfileIsOpen(false); // Fecha o modal de edição de perfil
    setIsProfileModalOpen(false);
    setSelectedUser(null);
  };

  const isValidUser = (user: any): user is User => {
    return (
      user &&
      typeof user.id === 'number' &&
      typeof user.name === 'string' &&
      typeof user.email === 'string' &&
      typeof user.telefone === 'string' &&
      typeof user.created_at === 'string' &&
      typeof user.status === 'string' &&
      typeof user.type === 'string'
    );
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
  addUser={(newUser: NewUser) => handleAddUser({ ...newUser, type: selectedUser?.type || "defaultType" })}// Adiciona o campo type
  user={selectedUser}
  userType={selectedUser?.type} 
  isModal={true}
/>
<Profile
  isOpen={isProfileModalOpen}
  onRequestClose={() => setIsProfileModalOpen(false)}
  addUser={(newUser: NewUser) => handleAddUser({ ...newUser, type: selectedUser?.type || "defaultType" })}
  user={isValidUser(selectedUser) ? selectedUser : null} // Correto
  userType={selectedUser?.type || "defaultType"}
/>
      </div>

      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="w-2/3 p-3 rounded-md shadow-sm border-gray-300 focus:ring focus:ring-blue-200"
          placeholder="Nome ou E-mail"
        />
        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          className="w-1/3 p-3 rounded-md shadow-sm border-gray-300 focus:ring focus:ring-blue-200"
        >
          <option value="usuario">Usuário</option>
          <option value="cliente">Cliente</option>
        </select>
      </div>

      {loading && <p>Carregando dados...</p>}
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
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4">{item.email}</td>
                  <td className="px-6 py-4">{item.telefone}</td>
                  <td className="px-6 py-4">{item.status}</td>
                  <td className="px-6 py-4">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => openEditProfileModal(item)} className="text-blue-600 hover:text-blue-800">
                      <MdEdit />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 ml-2">
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">Nenhum usuário encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-between mt-4">
        <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="bg-gray-200 px-4 py-2 rounded-md">Anterior</button>
        <span>Página {page} de {totalPages}</span>
        <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="bg-gray-200 px-4 py-2 rounded-md">Próximo</button>
      </div>
    </div>
  );
}
