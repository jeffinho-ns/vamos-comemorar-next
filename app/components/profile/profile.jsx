import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import styles from "./profile.module.scss";



const Profile = ({ isOpen, onRequestClose, addUser, user, userType }) => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    id: "",
    phone: "",
    cpf: "",
    status: "Ativado",
    nascimento: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: "",
    foto: "",
  });

  // Preenche o estado com os dados do usuário quando o modal abrir
  useEffect(() => {
    if (isOpen && user) {
      setProfile({
        ...user,
        status: user.status === "Ativado" ? "Ativado" : "Desativado",
      });
    } else if (isOpen) {
      // Se o modal abrir sem um usuário, limpa o formulário
      setProfile({
        name: "",
        email: "",
        id: "",
        phone: "",
        cpf: "",
        status: "Ativado",
        nascimento: "",
        endereco: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        complemento: "",
        foto: "",
      });
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_width = 500; // Define a largura máxima
          const scaleSize = max_width / img.width;
          canvas.width = max_width;
          canvas.height = img.height * scaleSize;
  
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
          // Converte a imagem de volta para base64
          const resizedImage = canvas.toDataURL('image/jpeg', 0.8); // Ajuste a qualidade (0.8 é 80%)
          setProfile((prevProfile) => ({ ...prevProfile, foto: resizedImage }));
        };
      };
      reader.readAsDataURL(file);
    }
  };
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Cria um novo objeto com apenas os campos que o servidor precisa (nome, email, telefone)
    const dataToSend = {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
    };
  
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Token não encontrado. Faça login novamente.');
        return;
      }
  
      // Verifica o tipo de usuário (cliente ou usuário) para definir a URL correta
      let url = `https://api.vamoscomemorar.com.br/users`;
      if (userType === 'cliente') {
        url = `https://api.vamoscomemorar.com.br/clients`;
      }
  
      let response;
      if (user) {
        // Atualiza o usuário existente
        response = await fetch(`${url}/${profile.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSend),
        });
      } else {
        // Adiciona um novo usuário
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSend),
        });
      }
  
      if (response.ok) {
        const savedProfile = await response.json();
        console.log(user ? "Usuário atualizado:" : "Usuário adicionado:", savedProfile);
        addUser(savedProfile); // Adiciona o usuário ao estado pai, se necessário
        onRequestClose(); // Fecha o modal após o envio
      } else {
        console.error("Erro ao salvar usuário:", response.statusText);
      }
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
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
                onChange={handleFotoChange}
                style={{ display: "none" }}
              />
              {profile.foto ? (
                <img src={profile.foto} alt="Foto de perfil" className={styles.profilePicImage} />
              ) : (
                "Adicionar foto"
              )}
            </label>
          </div>
        </div>
        <form className={styles.profileForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <input
              type="text"
              name="id"
              placeholder="Seu código"
              value={profile.id}
              onChange={handleChange}
              required={!user} // Torna o campo obrigatório apenas se for adicionar um novo usuário
            />
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
              name="phone"
              placeholder="Telefone"
              value={profile.phone}
              onChange={handleChange}
              required
            />
            <select
              name="status"
              value={profile.status}
              onChange={handleChange}
              required
            >
              <option value="">Status</option>
              <option value="Ativado">Ativado</option>
              <option value="Desativado">Desativado</option>
            </select>
            <input
              type="date"
              name="nascimento"
              value={profile.nascimento}
              onChange={handleChange}
              required
            />
            <input
            
              type="text"
              name="cpf"
              placeholder="CPF"
              value={profile.cpf}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="endereco"
              placeholder="Endereço"
              value={profile.endereco}
              onChange={handleChange}
              required
            />
            {/* Continue com os outros campos conforme necessário */}
          </div>

          <button type="submit" className={styles.submitBtn}>
            {user ? "Atualizar" : "Adicionar"}
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default Profile;
