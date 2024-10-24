import React, { useState } from "react";
import Modal from "react-modal";

// Defina a interface NewUser com 'type' obrigatório
interface NewUser {
  name: string;
  email: string;
  telefone: string;
  type: string; // Agora é obrigatório
  foto_perfil: string;
}

// Defina a interface User
interface User {
  id: number; // ou string, dependendo da sua implementação
  name: string;
  email: string;
  telefone?: string; // Faça este campo opcional, se desejado
}

// Defina as propriedades do componente
interface AddUserProps {
  isOpen: boolean;
  onRequestClose: () => void;
  addUser: (newUser: NewUser) => Promise<void>;
  user: User | null;
  userType?: string; // Continue a manter como opcional
  isModal: boolean;
}

const AddUser: React.FC<AddUserProps> = ({
  isOpen,
  onRequestClose,
  addUser,
  user,
  userType, // userType é opcional
  isModal,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [type, setType] = useState("user"); // Definido um valor padrão
  const [foto_perfil, setFotoPerfil] = useState(""); // Definido um valor padrão
  const [error, setError] = useState<string | null>(null); // Estado para gerenciar erros

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Limpar erro anterior

    try {
      // Garantir que 'type' sempre tenha um valor definido
      const newUser: NewUser = { name, email, telefone, type: type || "user", foto_perfil };
      await addUser(newUser);
      onRequestClose(); // Fechar modal após a adição do usuário
    } catch (err) {
      setError("Ocorreu um erro ao adicionar o usuário. Tente novamente."); // Mensagem de erro
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <h2>Adicionar Usuário</h2>
      {error && <p style={{ color: "red" }}>{error}</p>} {/* Exibir erro, se houver */}
      <form onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
          required
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          required
        />
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="Telefone"
          required
        />
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Tipo"
          required
        />
        <input
          value={foto_perfil}
          onChange={(e) => setFotoPerfil(e.target.value)}
          placeholder="Foto de Perfil"
          required
        />
        <button type="submit">Adicionar</button>
      </form>
      <button onClick={onRequestClose}>Fechar</button>
    </Modal>
  );
};

export default AddUser;
