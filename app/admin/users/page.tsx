"use client";
import { useEffect, useState } from "react";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import Profile from "../../components/profile/profile";
import AddUser from "../../components/AddUser/AddUser";

// Tipos para usuários e API
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
  cpf: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  foto_perfil?: string;
  password: string;
};

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
  cpf: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  password: string;
};

// Tipo para novo usuário
type NewUser = Omit<APIUser, "id" | "status"> & {
  status: string;
  password: string;
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    const url = `${API_URL}/api/users?page=${page}&perPage=${perPage}&type=${userType}&search=${filterBy}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar dados");

      const responseData: APIUser[] = await response.json();
      const formattedData: User[] = responseData.map((user: APIUser) => ({
        ...user,
        id: Number(user.id),
        created_at: new Date().toISOString(),
        telefone: user.telefone || "",
        sexo: user.sexo || "",
        data_nascimento: user.data_nascimento || "",
        cep: user.cep || "",
        cpf: user.cpf || "",
        endereco: user.endereco || "",
        numero: user.numero || "",
        bairro: user.bairro || "",
        cidade: user.cidade || "",
        estado: user.estado || "",
        complemento: user.complemento || "",
        foto_perfil: user.foto_perfil || "",
      }));

      setData(formattedData);
      setTotalPages(Math.ceil(responseData.length / perPage));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData, userType, page, filterBy]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch(`${API_URL}/api/users/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Erro ao excluir usuário");
        fetchData();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Erro desconhecido");
      }
    }
  };

  const handleUserSelection = (user: User) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  const handleAddUser = async (newUser: NewUser) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) throw new Error("Erro ao adicionar usuário");
      fetchData();
      closeModal();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  const openEditProfileModal = (user: APIUser) => {
    const fullUser: User = {
      ...user,
      id: Number(user.id),
      created_at: new Date().toISOString(),
      foto_perfil: user.foto_perfil || "",
    };
    setSelectedUser(fullUser);
    setIsProfileModalOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setIsProfileModalOpen(false);
    setSelectedUser(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
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
        />
        <Profile
          isOpen={isProfileModalOpen}
          onRequestClose={() => setIsProfileModalOpen(false)}
          user={selectedUser}
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
          className="p-3 rounded-md border-gray-300 shadow-sm focus:ring focus:ring-blue-500"
        >
          <option value="usuario">Usuário</option>
          <option value="cliente">Cliente</option>
        </select>
      </div>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">{user.telefone || "N/A"}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button onClick={() => handleUserSelection(user)} className="text-blue-600 hover:text-blue-900">
                  <MdEdit />
                </button>
                <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 ml-4">
                  <MdDelete />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between mt-6">
        <button
          disabled={page <= 1}
          onClick={() => handlePageChange(page - 1)}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
        >
          Anterior
        </button>
        <p className="text-gray-600">Página {page} de {totalPages}</p>
        <button
          disabled={page >= totalPages}
          onClick={() => handlePageChange(page + 1)}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
