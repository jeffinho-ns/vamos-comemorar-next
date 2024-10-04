"use client";
import { MdAdd, MdRefresh } from "react-icons/md";
import { useEffect, useState } from "react";
import Profile from "../../components/profile/profile";

// Atualização da definição do tipo User
interface User {
  nome: string;
  email: string;
  telefone: string;
  status: string;
  createAt: string; // ou Date, se preferir
  cpf: string; // Incluindo a propriedade cpf
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filterBy, setFilterBy] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users/router.ts');
        if (!response.ok) throw new Error('Erro ao buscar usuários');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };
    fetchUsers();
  }, []);

  const addUser = async (user: User) => {
    try {
      console.log('Adicionando usuário:', user);
      const response = await fetch('/api/users/router.ts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });
      if (!response.ok) throw new Error('Erro ao adicionar usuário');
      const newUser = await response.json();
      setUsers((prevUsers) => [...prevUsers, newUser]);
      closeModal(); // Fecha o modal após o envio
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
    }
  };

  const filteredUsers = users.filter((user) => {
    return (
      user.nome.toLowerCase().includes(filterBy.toLowerCase()) ||
      user.email.toLowerCase().includes(filterBy.toLowerCase()) ||
      user.cpf.includes(filterBy) // Agora cpf está definido
    );
  });

  return (
    <div className="w-full p-6 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Usuários</h2>

      <div className="flex items-center mb-6">
        <button className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full mr-4">
          <MdRefresh className="text-xl" />
        </button>
        <button onClick={openModal} className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full">
          <MdAdd className="text-xl" />
        </button>
        <Profile isOpen={modalIsOpen} onRequestClose={closeModal} addUser={addUser} />
      </div>

      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="w-2/3 p-3 rounded-md shadow-sm border-gray-300 focus:ring focus:ring-blue-200"
          placeholder="Nome, E-mail ou CPF (Apenas Números)"
        />
        <select className="w-1/3 p-3 rounded-md shadow-sm border-gray-300">
          <option value="usuarios">Usuários</option>
        </select>
      </div>

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
            {filteredUsers.map((user, index) => (
              <tr key={index} className="border-t">
                <td className="px-6 py-4">{user.nome}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.telefone}</td>
                <td className="px-6 py-4">{user.status}</td>
                <td className="px-6 py-4">{user.createAt}</td>
                <td className="px-6 py-4 flex space-x-2">
                  <button className="text-blue-500">✏️</button>
                  <button className="text-red-500">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6">
        <div className="text-gray-600">
          <span>Mostrando 1 a 10 de {filteredUsers.length} usuários</span>
        </div>
        <div className="flex space-x-2">
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded-md">◀</button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md">1</button>
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded-md">▶</button>
        </div>
        <select className="p-2 border border-gray-300 rounded-md">
          <option>10</option>
          <option>20</option>
        </select>
      </div>
    </div>
  );
}
