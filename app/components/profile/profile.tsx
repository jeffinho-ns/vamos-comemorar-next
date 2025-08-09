import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import styles from "./profile.module.scss";
import Image from "next/image";
import { User, APIUser } from '../../types/types';

interface ProfileProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onSaveUser: (user: User) => void;
  user: User | null;
  addUser?: (user: User) => void;
   userType?: string;
  
}

const Profile = ({ isOpen, onRequestClose, onSaveUser, user, addUser }: ProfileProps) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL; // Garantindo que API_URL está disponível

  useEffect(() => {
    if (isOpen && user) {
      let finalFotoPerfilUrl = "";

      // Prioriza foto_perfil_url se a API já a fornecer completa
      if (user.foto_perfil_url) {
        finalFotoPerfilUrl = user.foto_perfil_url;
      }
      // Se não, e se tiver foto_perfil (que pode ser só o nome do arquivo), constrói a URL
      else if (user.foto_perfil && API_URL) {
        // Assume que 'uploads' é o diretório de imagens no seu backend
        finalFotoPerfilUrl = `${API_URL}/uploads/${user.foto_perfil}`;
      }

      setProfile({
        ...user,
        foto_perfil: finalFotoPerfilUrl, // Agora contém a URL absoluta para exibição
        status: user.status === "Ativado" ? "Ativado" : "Desativado",
        password: "",
      });
      setSelectedFile(null); // Limpar arquivo selecionado ao abrir novo user
      setErrorMessage(""); // Limpar mensagem de erro
    } else if (!isOpen) {
      setProfile(null);
      setSelectedFile(null);
      setErrorMessage("");
    }
  }, [isOpen, user, API_URL]); // Adicionar API_URL como dependência

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
      // Cria uma URL temporária para pré-visualizar a imagem selecionada
      setProfile((prev) => (prev ? { ...prev, foto_perfil: URL.createObjectURL(file) } : null));
    }
  };

  const validateForm = (): boolean => {
    setErrorMessage("");
    if (!profile?.name || !profile?.email || !profile?.telefone) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios: Nome, E-mail e Telefone.");
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

    const formData = new FormData();
    Object.entries(profile).forEach(([key, value]) => {
      // Exclua foto_perfil_url e foto_perfil ao enviar
      // Pois 'foto_perfil' agora contém a URL temporária ou absoluta para exibição
      // e o 'foto_perfil_url' é um campo de retorno da API, não de envio.
      if (value !== undefined && key !== "foto_perfil_url" && key !== "foto_perfil" && key !== "id" && key !== "created_at") {
        formData.append(key, value as string);
      }
    });

    // Apenas adicione o arquivo se um novo foi selecionado
    if (selectedFile) {
      formData.append("foto_perfil", selectedFile);
    }
    // Se nenhum novo arquivo foi selecionado, e o usuário já tinha uma foto
    // e essa foto não era uma URL temporária (blob:), significa que a foto existente deve ser mantida.
    // O backend precisa saber disso, mas geralmente não é enviando o `foto_perfil` ou `foto_perfil_url` novamente.
    // Se o seu backend espera um campo para "manter foto antiga", você precisaria adicionar aqui.
    // Caso contrário, não fazer nada é o correto para "manter foto".

    try {
      const url = `${API_URL}/api/users/${profile.id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Não defina 'Content-Type': 'application/json' ao usar FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error("Erro ao salvar usuário:", errorData);
        setErrorMessage(`Erro ao salvar o usuário: ${errorData.message || 'Erro desconhecido.'}`);
        return;
      }

      const savedProfile: APIUser = await response.json(); // API deve retornar o user atualizado
      onSaveUser({
        ...profile, // Mantém os dados locais preenchidos (incluindo campos que não voltam na resposta)
        ...savedProfile, // Sobrescreve com os dados mais recentes da API (incluindo foto_perfil_url)
        // Garante que foto_perfil para exibição esteja atualizada, preferindo a da API
        foto_perfil: savedProfile.foto_perfil_url || (savedProfile.foto_perfil && `${API_URL}/uploads/${savedProfile.foto_perfil}`) || profile.foto_perfil
      });
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
      ariaHideApp={false}
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
              {profile?.foto_perfil ? ( // Aqui, profile.foto_perfil já deve ser a URL absoluta
                <Image
                  src={profile.foto_perfil}
                  alt="Foto de perfil"
                  className="rounded-full w-full h-full object-cover"
                  width={64}
                  height={64}
                  unoptimized // Use se a URL é externa e você não quer otimização do Next.js
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
            <input type="text" name="name" placeholder="Nome e sobrenome" value={profile?.name || ""} onChange={handleChange} required />
            <input type="email" name="email" placeholder="E-mail" value={profile?.email || ""} onChange={handleChange} required />
            <input type="text" name="telefone" placeholder="(99) 9 9999-9999" value={profile?.telefone || ""} onChange={handleChange} required />
            <select name="sexo" value={profile?.sexo || ""} onChange={handleChange}>
              <option value="">Selecione Sexo</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
            <input type="date" name="data_nascimento" value={profile?.data_nascimento || ""} onChange={handleChange} />
          </div>
          <div className={styles.formRow}>
            <input type="text" name="cpf" placeholder="999.999.999-99" value={profile?.cpf || ""} onChange={handleChange} />
          </div>
          <div className={styles.formRow}>
            <input type="text" name="cep" placeholder="00000-000" value={profile?.cep || ""} onChange={handleChange} />
            <input type="text" name="endereco" placeholder="Endereço" value={profile?.endereco || ""} onChange={handleChange} />
            <input type="text" name="numero" placeholder="Número" value={profile?.numero || ""} onChange={handleChange} />
            <input type="text" name="bairro" placeholder="Bairro" value={profile?.bairro || ""} onChange={handleChange} />
            <input type="text" name="cidade" placeholder="Cidade" value={profile?.cidade || ""} onChange={handleChange} />
            <input type="text" name="estado" placeholder="Estado" value={profile?.estado || ""} onChange={handleChange} />
            <input type="text" name="complemento" placeholder="Complemento" value={profile?.complemento || ""} onChange={handleChange} />
          </div>
          <div className={styles.formRow}>
            <input type="password" name="password" placeholder="Nova Senha" value={profile?.password || ""} onChange={handleChange} />
          </div>
          <button type="submit">Salvar Alterações</button>
        </form>
      </div>
          </Modal>
  );
};

export default Profile;