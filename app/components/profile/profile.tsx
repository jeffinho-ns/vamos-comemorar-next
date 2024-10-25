import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import styles from "./profile.module.scss";
import Image from "next/image";

interface Profile {
  foto_perfil: string;
  name: string;
  email: string;
  telefone: string;
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
  password: string; // Se necessário, dependendo da lógica de atualização
  id: number;
  status: string;
  created_at?: string;
}

interface ProfileProps {
  isOpen: boolean;
  onRequestClose: () => void;
  addUser: (user: Profile) => void;
  user: Profile | null;
  userType?: string;
}

const Profile = ({ isOpen, onRequestClose, addUser, user }: ProfileProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (isOpen && user) {
      setProfile({
        ...user,
        foto_perfil: user.foto_perfil ? `http://localhost:5000/uploads/${user.foto_perfil}` : "",
        password: "", // Inicie como vazio para permitir a troca
      });
    }
  }, [isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (profile) {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
    }
  };

  const validateForm = (): boolean => {
    setErrorMessage(""); // Limpar mensagem de erro
    if (!profile?.name || !profile?.email || !profile?.telefone) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !profile) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      setErrorMessage("Token não encontrado. Faça login novamente.");
      return;
    }

    try {
      let imageUrl = profile.foto_perfil;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const response = await fetch(`http://localhost:5000/api/uploads`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Erro ao enviar a imagem');
        }

        const data = await response.json();
        imageUrl = data.imageUrl;
      }

      const dataToSend = {
        ...profile,
        foto_perfil: imageUrl,
        password: profile.password || undefined, // Enviar a nova senha se estiver definida
      };

      const url = `http://localhost:5000/api/users/${profile.id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend), // Garante que todos os dados são enviados
      });

      if (!response.ok) {
        console.error("Erro ao salvar usuário:", response.statusText);
        setErrorMessage("Erro ao salvar o usuário.");
        return;
      }

      const savedProfile = await response.json();
      addUser(savedProfile);
      onRequestClose();
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      setErrorMessage("Ocorreu um erro ao atualizar o perfil. Tente novamente.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
    >
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <div className={styles.profilePicContainer}>
            <label htmlFor="fotoInput" className={styles.profilePic}>
              <input
                type="file"
                id="fotoInput"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {profile?.foto_perfil ? (
                <Image
                  src={profile.foto_perfil}
                  alt="Foto de perfil"
                  className="rounded-full w-full h-full object-cover"
                  width={64}
                  height={64}
                />
              ) : (
                <span className="text-gray-500">Adicionar foto</span>
              )}
            </label>
          </div>
        </div>
        {errorMessage && <div className={styles.error}>{errorMessage}</div>}
        <form className={styles.profileForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <input
              type="text"
              name="name"
              placeholder="Nome e sobrenome"
              value={profile?.name || ""}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={profile?.email || ""}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="telefone"
              placeholder="(99) 9 9999-9999"
              value={profile?.telefone || ""}
              onChange={handleChange}
              required
            />
            <select
              name="sexo"
              value={profile?.sexo || ""}
              onChange={handleChange}
            >
              <option value="">Selecione Sexo</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
            <input
              type="date"
              name="data_nascimento"
              value={profile?.data_nascimento || ""}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="text"
              name="cpf"
              placeholder="999.999.999-99"
              value={profile?.cpf || ""}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="text"
              name="cep"
              placeholder="00000-000"
              value={profile?.cep || ""}
              onChange={handleChange}
            />
            <input
              type="text"
              name="endereco"
              placeholder="Endereço"
              value={profile?.endereco || ""}
              onChange={handleChange}
            />
            <input
              type="text"
              name="numero"
              placeholder="Número"
              value={profile?.numero || ""}
              onChange={handleChange}
            />
            <input
              type="text"
              name="bairro"
              placeholder="Bairro"
              value={profile?.bairro || ""}
              onChange={handleChange}
            />
            <input
              type="text"
              name="cidade"
              placeholder="Cidade"
              value={profile?.cidade || ""}
              onChange={handleChange}
            />
            <input
              type="text"
              name="estado"
              placeholder="Estado"
              value={profile?.estado || ""}
              onChange={handleChange}
            />
            <input
              type="text"
              name="complemento"
              placeholder="Complemento"
              value={profile?.complemento || ""}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="password" // Campo de senha
              name="password"
              placeholder="Nova Senha"
              value={profile?.password || ""} // Para capturar a nova senha
              onChange={handleChange}
            />
          </div>
          <button type="submit">Salvar Alterações</button>
        </form>
      </div>
    </Modal>
  );
};

export default Profile;
