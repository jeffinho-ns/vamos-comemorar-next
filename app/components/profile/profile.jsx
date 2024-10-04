// profile.js

import React, { useState } from "react";
import Modal from "react-modal";
import styles from "./profile.module.scss";

const Profile = ({ isOpen, onRequestClose, addUser }) => {
  const [profile, setProfile] = useState({
    nome: "",
    email: "",
    telefone: "",
    sexo: "",
    nascimento: "",
    cpf: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: "",
    foto: null,
  });

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
        setProfile((prevProfile) => ({ ...prevProfile, foto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Enviar os dados do perfil para a API
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });

    if (response.ok) {
      const savedProfile = await response.json();
      console.log('Usuário adicionado:', savedProfile);
      onRequestClose(); // Fecha o modal após o envio
    } else {
      console.error('Erro ao adicionar usuário:', response.statusText);
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
                style={{ display: 'none' }}
              />
              {profile.foto ? (
                <img src={profile.foto} alt="Foto de perfil" className={styles.profilePicImage} />
              ) : (
                'Adicionar foto'
              )}
            </label>
          </div>
        </div>
        <form className={styles.profileForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <input
              type="text"
              name="nome"
              placeholder="Nome e sobrenome"
              value={profile.nome}
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
              placeholder="Telefone"
              value={profile.telefone}
              onChange={handleChange}
              required
            />
            <select
              name="sexo"
              value={profile.sexo}
              onChange={handleChange}
              required
            >
              <option value="">Sexo</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
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
            <input
              type="text"
              name="numero"
              placeholder="Número"
              value={profile.numero}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="bairro"
              placeholder="Bairro"
              value={profile.bairro}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="cidade"
              placeholder="Cidade"
              value={profile.cidade}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="estado"
              placeholder="Estado"
              value={profile.estado}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="complemento"
              placeholder="Complemento"
              value={profile.complemento}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className={styles.submitButton}>Salvar</button>
        </form>
      </div>
    </Modal>
  );
};

export default Profile;
