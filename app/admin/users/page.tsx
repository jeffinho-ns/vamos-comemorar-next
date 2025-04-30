"use client";

import { useEffect, useState, useCallback } from "react";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import Profile from "../../components/profile/profile";
import AddUser from "../../components/AddUser/AddUser";
import { User, APIUser, NewUser } from '../../types/types';

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    const url = `https://vamos-comemorar-api.onrender.com/api/users?page=${page}&perPage=${perPage}&type=${userType}&search=${filterBy}`;

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
  }, [page, perPage, userType, filterBy]);

  useEffect(() => {
    fetchData();
  }, [userType, page, filterBy, fetchData]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch(`https://vamos-comemorar-api.onrender.com/api/users/${id}`, {
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

  const openEditProfileModal = (user: APIUser) => {
    const fullUser: User = {
      ...user,
      id: Number(user.id),
      created_at: user.created_at || new Date().toISOString(),
      foto_perfil: user.foto_perfil || "",
    };
    setSelectedUser(fullUser);
    setIsProfileModalOpen(true);
  };

  const handleAddUser = async (newUser: NewUser) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`https://vamos-comemorar-api.onrender.com/api/users`, {
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
    <div className="min-h-screen bg-[#f4f7fb] px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <button onClick={fetchData} className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-full">
          <MdRefresh className="text-xl" />
        </button>
        <button onClick={() => setModalIsOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md">
          <MdAdd className="inline-block mr-1" /> Novo usuário
        </button>
        <AddUser
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          addUser={handleAddUser}
          user={selectedUser}
          userType={selectedUser?.type}
          isModal={true}
        />
        <Profile
          isOpen={isProfileModalOpen}
          onRequestClose={closeModal}
          addUser={handleAddUser}
                    user={
            selectedUser
              ? {
                  ...selectedUser,
                  foto_perfil: selectedUser.foto_perfil || '',
                  telefone: selectedUser.telefone || '',
                  sexo: selectedUser.sexo || '', // Adiciona valor padrão para sexo
                }
              : null
          }
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <input
          type="text"
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="flex-1 p-3 rounded-md shadow-sm border-gray-300 focus:ring focus:ring-blue-500"
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((user) => (
          <div key={user.id} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-700">{user.name}</h4>
                <p className="text-xs text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-500">Telefone: {user.telefone || 'N/A'}</p>
                <p className="text-xs text-gray-400 mt-1">Criado em: {formatDate(user.created_at || '')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEditProfileModal(user)} className="text-blue-500 hover:text-blue-700">
                  <MdEdit />
                </button>
                <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700">
                  <MdDelete />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="text-sm text-gray-600 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
        >
          Página anterior
        </button>
        <span className="text-sm text-gray-700">
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="text-sm text-gray-600 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
        >
          Próxima página
        </button>
      </div>
    </div>
  );
}