import React, { useState } from "react";
import Modal from "react-modal";
import { NewUser, User } from "../../types/types";

// Defina as propriedades do componente
interface AddUserProps {
  isOpen: boolean;
  onRequestClose: () => void;
  addUser: (newUser: NewUser) => Promise<void>;
  user: User | null;
  userType?: string;
  isModal: boolean;
}

const AddUser: React.FC<AddUserProps> = ({
  isOpen,
  onRequestClose,
  addUser,
  user,
  userType,
  isModal,
}) => {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [type, setType] = useState(user?.type || "user");
  const [foto_perfil, setFotoPerfil] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(user?.foto_perfil || "");
  const [data_nascimento, setDataNascimento] = useState(user?.data_nascimento || "");
  const [cpf, setCpf] = useState(user?.cpf || "");
  const [numero, setNumero] = useState(user?.numero || "");
  const [cep, setCep] = useState(user?.cep || "");
  const [endereco, setEndereco] = useState(user?.endereco || "");
  const [bairro, setBairro] = useState(user?.bairro || "");
  const [cidade, setCidade] = useState(user?.cidade || "");
  const [estado, setEstado] = useState(user?.estado || "");
  const [complemento, setComplemento] = useState(user?.complemento || "");
  const [password, setPassword] = useState(user?.password || "");
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoPerfil(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const newUser: NewUser = {
        name,
        email,
        telefone,
        type,
        foto_perfil: fotoPreview || "",
        data_nascimento,
        cpf,
        cep,
        endereco,
        numero,
        bairro,
        cidade,
        estado,
        complemento,
        password,
      };
      await addUser(newUser);
      onRequestClose();
    } catch (err) {
      setError("Ocorreu um erro ao adicionar o usuário. Tente novamente.");
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} className="flex justify-center items-center p-4">
      <div className="bg-white p-6 max-w-2xl w-full rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-center mb-6">Adicionar Usuário</h2>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        
        {/* Seção da imagem e botão de envio */}
        <div className="flex flex-col items-center mb-6">
          {fotoPreview && (
            <img
              src={fotoPreview}
              alt="Pré-visualização"
              className="w-24 h-24 rounded-full object-cover border mb-4"
            />
          )}
          <input
            type="file"
            onChange={handleImageChange}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
          <button type="submit" onClick={handleSubmit} className="mt-4 py-2 px-6 bg-blue-500 text-white rounded hover:bg-blue-600">
            Adicionar
          </button>
        </div>

        {/* Formulário em duas colunas */}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome"
            required
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            required
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Tipo"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={data_nascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            placeholder="Data de Nascimento"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="CPF"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            placeholder="CEP"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Endereço"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            placeholder="Estado"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Número"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            placeholder="Bairro"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            value={complemento}
            onChange={(e) => setComplemento(e.target.value)}
            placeholder="Complemento"
            className="p-2 border border-gray-300 rounded col-span-2"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="p-2 border border-gray-300 rounded col-span-2"
          />
        </form>

        {/* Botão Fechar */}
        <button onClick={onRequestClose} className="mt-6 w-full py-2 bg-gray-300 rounded hover:bg-gray-400">
          Fechar
        </button>
      </div>
    </Modal>
  );
};

export default AddUser;
