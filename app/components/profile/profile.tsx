import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import styles from "./profile.module.scss";
import Image from "next/image";
import { User, APIUser } from '../../types/types';

// ✨ Adicione a URL base para as imagens, como fizemos nos outros componentes
const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';
const DEFAULT_AVATAR_URL = 'https://via.placeholder.com/150';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ✨ Helper para montar a URL da imagem
  const getProfileImageUrl = (filename?: string | null): string => {
    if (filename && !filename.startsWith('blob:') && !filename.startsWith('http')) {
        return `${BASE_IMAGE_URL}${filename}`;
    }
    return filename || DEFAULT_AVATAR_URL;
  };

  useEffect(() => {
    if (isOpen && user) {
        // ✨ Ao abrir o modal, preenche o estado 'profile' com a URL completa para exibição
        setProfile({
            ...user,
            foto_perfil: getProfileImageUrl(user.foto_perfil),
            status: user.status === "Ativado" ? "Ativado" : "Desativado",
            password: "",
        });
        setSelectedFile(null);
        setErrorMessage("");
    } else if (!isOpen) {
        setProfile(null);
        setSelectedFile(null);
        setErrorMessage("");
    }
  }, [isOpen, user, API_URL]);

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
        // Cria uma URL temporária para pré-visualizar a imagem
        const tempUrl = URL.createObjectURL(file);
        setProfile((prev) => (prev ? { ...prev, foto_perfil: tempUrl } : null));
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

  // ✨ Função para fazer o upload da imagem separadamente
  const uploadImage = async (file: File): Promise<string | null> => {
    const token = localStorage.getItem("authToken");
    if (!token || !API_URL) return null;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${API_URL}/api/images/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Erro no upload da imagem:", errorData);
            setErrorMessage(`Erro no upload da imagem: ${errorData.error || 'Erro desconhecido.'}`);
            return null;
        }

        const result = await response.json();
        return result.filename;
    } catch (error) {
        console.error("Erro ao enviar imagem:", error);
        setErrorMessage("Ocorreu um erro de conexão ao enviar a imagem.");
        return null;
    }
  };

  // ✨ Lógica principal de submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !profile) return;
    setIsLoading(true);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setErrorMessage("Token não encontrado. Faça login novamente.");
      setIsLoading(false);
      return;
    }

    let fotoPerfilFilename: string | null = null;
    // 1. Faz o upload da foto se um novo arquivo foi selecionado
    if (selectedFile) {
        fotoPerfilFilename = await uploadImage(selectedFile);
        if (!fotoPerfilFilename) {
            setIsLoading(false);
            return;
        }
    }

    // 2. Monta o objeto de dados para enviar para a API de usuários
    const profileData: Record<string, any> = {
        name: profile.name,
        email: profile.email,
        telefone: profile.telefone,
        sexo: profile.sexo,
        data_nascimento: profile.data_nascimento,
        cpf: profile.cpf,
        cep: profile.cep,
        endereco: profile.endereco,
        numero: profile.numero,
        bairro: profile.bairro,
        cidade: profile.cidade,
        estado: profile.estado,
        complemento: profile.complemento,
        password: profile.password
    };

    // 3. Adiciona o nome do arquivo da foto se o upload foi bem-sucedido
    if (fotoPerfilFilename) {
        profileData.foto_perfil = fotoPerfilFilename;
    } else if (profile.foto_perfil && !profile.foto_perfil.startsWith('blob:')) {
        // Se a foto não foi alterada, mas já existia, garante que o nome do arquivo original seja enviado.
        // Extrai o nome do arquivo da URL completa.
        const originalFilename = profile.foto_perfil.split('/').pop();
        if(originalFilename) {
          profileData.foto_perfil = originalFilename;
        }
    } else {
        // Se a foto foi removida ou nunca existiu, envia null.
        profileData.foto_perfil = null;
    }
    
    // 4. Faz a requisição PUT para atualizar o perfil
    try {
        const url = `${API_URL}/api/users/${profile.id}`;
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error("Erro ao salvar usuário:", errorData);
            setErrorMessage(`Erro ao salvar o usuário: ${errorData.message || 'Erro desconhecido.'}`);
            setIsLoading(false);
            return;
        }

        const savedProfile: APIUser = await response.json();
        // A API de usuários atualiza o user e retorna os dados atualizados.
        onSaveUser({
            ...profile,
            ...savedProfile,
            foto_perfil: getProfileImageUrl(savedProfile.foto_perfil),
        });
        onRequestClose();

    } catch (error) {
        console.error("Erro ao enviar dados:", error);
        setErrorMessage("Ocorreu um erro ao atualizar o perfil. Tente novamente.");
    } finally {
        setIsLoading(false);
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
              {/* ✨ Usa a URL completa ou o fallback */}
              <Image
                src={profile?.foto_perfil || DEFAULT_AVATAR_URL}
                alt="Foto de perfil"
                className="rounded-full w-full h-full object-cover"
                width={64}
                height={64}
                unoptimized
              />
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
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default Profile;