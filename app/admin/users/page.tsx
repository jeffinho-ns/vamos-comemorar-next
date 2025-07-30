"use client";

import { useEffect, useState, useCallback } from "react";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import Profile from "../../components/profile/profile"; // Certifique-se de que o caminho está correto
import AddUser from "../../components/AddUser/AddUser"; // Certifique-se de que o caminho está correto
import { User, APIUser, NewUser } from '../../types/types'; // Importe as interfaces

export default function Users() {
  const [data, setData] = useState<User[]>([]);
  const [filterBy, setFilterBy] = useState<string>("");
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false); // Para AddUser
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false); // Para Profile (edição)
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("usuario");
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(10); // Valor fixo
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Certifique-se de que NEXT_PUBLIC_API_URL esteja configurado em seu .env
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null); // Limpar erros anteriores
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token de autenticação não encontrado. Faça login novamente.");
      setLoading(false);
      return;
    }

    // Adapte a URL se sua API usar parâmetros diferentes para paginação/filtros
    const url = `${API_URL}/api/users?page=${page}&perPage=${perPage}&type=${userType}&search=${filterBy}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao buscar usuários.' }));
        throw new Error(errorData.message || "Erro ao buscar dados");
      }

      // Sua API deve retornar um objeto com os dados e informações de paginação
      // Ex: { users: APIUser[], totalItems: number, totalPages: number, currentPage: number }
      const responseBody = await response.json();
      const apiUsers: APIUser[] = responseBody.users || responseBody; // Ajuste conforme a estrutura da sua API

      const formattedData: User[] = apiUsers.map((user: APIUser) => ({
        ...user,
        id: Number(user.id),
        created_at: user.created_at || new Date().toISOString(), // Use o da API ou um fallback
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
        foto_perfil_url: user.foto_perfil_url || "", // Garanta que a URL da foto esteja aqui
      }));

      setData(formattedData);
      // Use o totalPages ou totalItems retornado pela API para paginação correta
      setTotalPages(responseBody.totalPages || Math.ceil((responseBody.totalItems || apiUsers.length) / perPage));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar dados.");
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, userType, filterBy, API_URL]); // Adicione API_URL como dependência

  useEffect(() => {
    fetchData();
  }, [userType, page, filterBy, fetchData]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Token de autenticação não encontrado.");
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/users/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || "Erro ao excluir usuário");
        }
        alert("Usuário excluído com sucesso!");
        fetchData(); // Refetch para atualizar a lista
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido ao excluir.");
        console.error("Erro ao excluir usuário:", err);
      }
    }
  };

  // Esta função é para abrir o modal de EDIÇÃO
  const openEditProfileModal = (user: User) => {
    setSelectedUser(user); // user já deve ser do tipo User com todos os campos
    setIsProfileModalOpen(true);
  };

  // Esta função é para ADICIONAR um novo usuário (usada pelo componente AddUser)
  const handleAddUser = async (newUser: NewUser) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token de autenticação não encontrado.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || "Erro ao adicionar usuário");
      }
      alert("Usuário adicionado com sucesso!");
      fetchData(); // Refetch para atualizar a lista
      closeModal(); // Fecha o modal AddUser
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao adicionar.");
      console.error("Erro ao adicionar usuário:", err);
    }
  };

  // Esta função será chamada pelo componente Profile após uma edição bem-sucedida
  const handleUpdateUser = (updatedUser: User) => {
    // Você pode atualizar o estado `data` diretamente aqui para evitar um refetch completo
    // ou simplesmente refazer a busca para garantir os dados mais recentes.
    // Para simplificar, vamos refazer a busca.
    alert("Usuário atualizado com sucesso!");
    fetchData(); // Refetch para atualizar a lista
    closeModal(); // Fecha o modal Profile
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setIsProfileModalOpen(false);
    setSelectedUser(null); // Limpar usuário selecionado ao fechar modais
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Data inválida"; // Verifica se a data é válida
      return new Intl.DateTimeFormat("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    } catch (e) {
      return "Formato de data inválido";
    }
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
        {/* Modal para ADICIONAR usuário */}
        <AddUser
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          addUser={handleAddUser}
          // Para adicionar, não passamos um usuário existente
          user={null}
          userType={userType} // Pode passar o tipo padrão de usuário selecionado no filtro
          isModal={true}
        />
        {/* Modal para EDITAR perfil do usuário */}
        <Profile
          isOpen={isProfileModalOpen}
          onRequestClose={closeModal}
          onSaveUser={handleUpdateUser} // <-- Usamos a nova função aqui para edição
          user={selectedUser} // Passa o usuário selecionado para edição
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
          onChange={(e) => { setPage(1); setUserType(e.target.value); }} // Resetar página ao mudar tipo
          className="p-3 rounded-md border-gray-300 shadow-sm focus:ring focus:ring-blue-500"
        >
          <option value="usuario">Usuário</option>
          <option value="cliente">Cliente</option>
          {/* Adicione outras opções se seu backend suportar */}
        </select>
      </div>

      {loading && <p className="text-gray-600">Carregando usuários...</p>}
      {error && <p className="text-red-500 font-semibold">{error}</p>}

      {!loading && !error && data.length === 0 && (
        <p className="text-gray-500">Nenhum usuário encontrado com os critérios de busca.</p>
      )}

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
                <button onClick={() => openEditProfileModal(user)} className="text-blue-500 hover:text-blue-700 p-1">
                  <MdEdit size={20} />
                </button>
                <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 p-1">
                  <MdDelete size={20} />
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
          className="text-sm text-gray-600 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          Página anterior
        </button>
        <span className="text-sm text-gray-700">
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="text-sm text-gray-600 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          Próxima página
        </button>
      </div>
    </div>
  );
}