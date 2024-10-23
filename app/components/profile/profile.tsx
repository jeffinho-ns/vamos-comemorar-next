import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import styles from "./profile.module.scss";



interface User {
  id: string; // ou o tipo correto
  name: string;
  email: string;
  telefone: string;
  foto_perfil?: string;
  sexo?: string;
  data_nascimento?: string;
  // Adicione outros campos que você utiliza
}

interface NewUser {
  name: string;
  email: string;
  telefone: string; // Adicione outros campos conforme necessário
}

interface ProfileProps {
  isOpen: boolean;
  onRequestClose: () => void;
  addUser: (newUser: NewUser) => Promise<void>;
  user?: User | null; // Agora o tipo User está definido
  userType?: string; // Aqui você permite que seja string ou undefined
}

const Profile = ({ isOpen, onRequestClose, addUser, user, userType }: ProfileProps) => {
  const [profile, setProfile] = useState({
    foto_perfil: "",
    name: "",
    email: "",
    telefone: "",
    sexo: "",
    data_nascimento: "",
    cep: "",
    cpf: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: "",
    password: "",
    id: "",
    status: "Ativado",
  });

  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setProfile(user ? { ...user, status: user.status === "Ativado" ? "Ativado" : "Desativado", password: "" } : {
        foto_perfil: "",
        name: "",
        email: "",
        telefone: "",
        sexo: "",
        data_nascimento: "",
        cep: "",
        cpf: "",
        endereco: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        complemento: "",
        password: "",
        id: "",
        status: "Ativado",
      });
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({ ...prevProfile, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
    }
  };

  const validateForm = () => {
    if (!profile.name || !profile.email || !profile.telefone) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const today = new Date();
    const birthDate = new Date(profile.data_nascimento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      alert("Você deve ter mais de 18 anos.");
      return;
    }

    try {
      let imageUrl = profile.foto_perfil;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        const response = await fetch(`${API_URL}/api/upload`, {
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
        foto_perfil: imageUrl,
        name: profile.name,
        email: profile.email,
        telefone: profile.telefone,
        sexo: profile.sexo,
        data_nascimento: profile.data_nascimento,
        cep: profile.cep,
        endereco: profile.endereco,
        numero: profile.numero,
        bairro: profile.bairro,
        cidade: profile.cidade,
        estado: profile.estado,
        complemento: profile.complemento,
        cpf: profile.cpf,
        password: profile.password,
      };

      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("Token não encontrado. Faça login novamente.");
        return;
      }

      const url = `${API_URL}/api/users/${profile.id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar usuário: " + response.statusText);
      }

      const savedProfile = await response.json();
      addUser(savedProfile);
      onRequestClose();
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      alert("Ocorreu um erro ao atualizar o perfil. Tente novamente.");
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
              {profile.foto_perfil ? (
                <img 
                  src={profile.foto_perfil.startsWith("http") 
                    ? profile.foto_perfil 
                    : `${IMG_URL}/${profile.foto_perfil}`} 
                  alt="Foto de perfil" 
                  className="rounded-full w-full h-full object-cover" 
                />
              ) : (
                <span className="text-gray-500">Adicionar foto</span>
              )}
            </label>
          </div>
        </div>
        <form className={styles.profileForm} onSubmit={handleSubmit}>
          {/* Campos do formulário */}
          <div className={styles.formRow}>
            <input
              type="text"
              name="name"
              placeholder="Nome e sobrenome"
              value={profile.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={profile.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="telefone"
              placeholder="(99) 9 9999-9999"
              value={profile.telefone}
              onChange={handleChange}
              required
            />
            <select
              name="sexo"
              value={profile.sexo}
              onChange={handleChange}
            >
              <option value="">Selecione Sexo</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
            <input
              type="date"
              name="data_nascimento"
              value={profile.data_nascimento}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="text"
              name="cpf"
              placeholder="999.999.999-99"
              value={profile.cpf}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="text"
              name="endereco"
              placeholder="End."
              value={profile.endereco}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="text"
              name="numero"
              placeholder="Número"
              value={profile.numero}
              onChange={handleChange}
            />
            <input
              type="text"
              name="bairro"
              placeholder="Bairro"
              value={profile.bairro}
              onChange={handleChange}
            />
            <input
              type="text"
              name="cidade"
              placeholder="Cidade"
              value={profile.cidade}
              onChange={handleChange}
            />
            <input
              type="text"
              name="estado"
              placeholder="Estado"
              value={profile.estado}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="text"
              name="complemento"
              placeholder="Complemento"
              value={profile.complemento}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="text"
              name="cep"
              placeholder="CEP"
              value={profile.cep}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="password"
              name="password"
              placeholder="Senha (deixe em branco para manter a atual)"
              value={profile.password}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <button type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default Profile;
