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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Carregando usuários...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-red-400 text-xl">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Usuários</h1>
          <p className="text-gray-400 text-lg">Visualize e gerencie todos os usuários do sistema</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex gap-3">
            <button 
              onClick={fetchData} 
              className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <MdRefresh className="text-xl" />
            </button>
            <button 
              onClick={() => setModalIsOpen(true)} 
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2"
            >
              <MdAdd size={20} /> Novo usuário
            </button>
          </div>
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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <input
            type="text"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="flex-1 p-4 rounded-xl shadow-lg border border-gray-200/30 bg-white/95 backdrop-blur-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
            placeholder="Buscar por nome ou e-mail"
          />
          <select
            value={userType}
            onChange={(e) => { setPage(1); setUserType(e.target.value); }} // Resetar página ao mudar tipo
            className="p-4 rounded-xl border border-gray-200/30 shadow-lg bg-white/95 backdrop-blur-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
          >
            <option value="usuario">Usuário</option>
            <option value="cliente">Cliente</option>
            {/* Adicione outras opções se seu backend suportar */}
          </select>
        </div>

        {!loading && !error && data.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">👥</div>
            <p className="text-gray-500 text-lg">Nenhum usuário encontrado com os critérios de busca.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((user) => (
            <div key={user.id} className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-200/20 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{user.name}</h4>
                  <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                  <p className="text-sm text-gray-500 mb-1">📞 {user.telefone || 'N/A'}</p>
                  <p className="text-xs text-gray-400 mt-3">Criado em: {formatDate(user.created_at || '')}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    onClick={() => openEditProfileModal(user)} 
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                  >
                    <MdEdit size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)} 
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm bg-white/95 backdrop-blur-sm hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 font-semibold"
          >
            Página anterior
          </button>
          <span className="text-sm text-gray-300 font-semibold">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm bg-white/95 backdrop-blur-sm hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 font-semibold"
          >
            Próxima página
          </button>
        </div>
      </div>
    </div>
  );
}