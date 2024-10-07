"use client";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState } from "react";
import Profile from "../../components/profile/profile";
import AddUser from "../../components/AddUser/AddUser";
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  type?: string;
}

export default function Users() {
  const [data, setData] = useState<User[]>([]);
  const [filterBy, setFilterBy] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editProfileIsOpen, setEditProfileIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState("usuario");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const router = useRouter();

  // Função para abrir o modal de adicionar usuário
  const openAddUserModal = () => {
    setModalIsOpen(true);
  };

  // Função para abrir o modal de edição de usuário
  const openEditProfileModal = (user: User) => {
    setSelectedUser(user);
    setEditProfileIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setEditProfileIsOpen(false);
    setSelectedUser(null);
  };

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    let url = '';

    if (userType === 'usuario') {
      url = `https://api.vamoscomemorar.com.br/users?page=${page}&perPage=${perPage}&type=users&search=`;
    } else if (userType === 'cliente') {
      url = `https://api.vamoscomemorar.com.br/users?page=${page}&perPage=${perPage}&type=clients&search=`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar dados');

      const data = await response.json();

      if (Array.isArray(data.data)) {
        setData(data.data);
        setTotalPages(Math.ceil(data.total / perPage));
      } else {
        setError('Dados inválidos.');
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

  useEffect(() => {
    fetchData();
  }, [userType, page]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const filteredData = data.filter((item) => {
    return (
      item.name.toLowerCase().includes(filterBy.toLowerCase()) ||
      item.email.toLowerCase().includes(filterBy.toLowerCase())
    );
  });

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("Tem certeza que deseja excluir este item?");
    if (confirmDelete) {
      const token = localStorage.getItem('authToken');
      try {
        const response = await fetch(`https://api.vamoscomemorar.com.br/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Erro ao excluir usuário');

        fetchData();
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Erro desconhecido');
        }
        console.error('Erro ao excluir usuário:', error);
      }
    }
  };

  // Função para adicionar um usuário
  const handleAddUser = async (newUser: Omit<User, 'id' | 'created_at' | 'status'>) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://api.vamoscomemorar.com.br/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) throw new Error('Erro ao adicionar usuário');

      // Atualize a lista de usuários após adicionar
      fetchData();
      closeModal(); // Fechar o modal após adicionar
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro desconhecido');
      }
      console.error('Erro ao adicionar usuário:', error);
    }
  };

  return (
    <div className="w-full p-6 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Usuários e Clientes</h2>

      <div className="flex items-center mb-6">
        <button onClick={fetchData} className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full mr-4">
          <MdRefresh className="text-xl" />
        </button>
        <button onClick={openAddUserModal} className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full">
          <MdAdd className="text-xl" />
        </button>
        <AddUser 
          isOpen={modalIsOpen} 
          onRequestClose={closeModal} 
          addUser={handleAddUser} // Passando a função para AddUser
        />
        <Profile 
          isOpen={editProfileIsOpen} 
          onRequestClose={() => setEditProfileIsOpen(false)} 
          addUser={handleAddUser} 
          user={selectedUser} 
          userType={selectedUser?.type} 
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
              filteredData.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4">{item.email}</td>
                  <td className="px-6 py-4">{item.phone}</td>
                  <td className="px-6 py-4">{item.status}</td>
                  <td className="px-6 py-4">{item.created_at}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button onClick={() => openEditProfileModal(item)} title="Editar">
                      <MdEdit className="text-blue-500 hover:text-blue-700" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} title="Excluir">
                      <MdDelete className="text-red-500 hover:text-red-700" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-4">Nenhum usuário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="p-2 bg-gray-300 rounded-md disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 bg-gray-300 rounded-md disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
