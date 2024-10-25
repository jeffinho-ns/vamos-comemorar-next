// profile.js

import React, { useState } from "react";
import Modal from "react-modal";
import styles from "./profile.module.scss";
import Image from "next/image";

interface ProfileProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ isOpen, onRequestClose }) => {
  const [profile, setProfile] = useState<{
    nome: string;
    email: string;
    telefone: string;
    sexo: string;
    nascimento: string;
    cpf: string;
    endereco: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    complemento: string;
    foto: string | null; // Pode ser string ou null
  }>({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, foto: reader.result as string }); // Cast para string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(profile);
    // Processar o envio do formulário
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
                onChange={(e) => handleFotoChange(e)}
                style={{ display: 'none' }}
              />
              {profile.foto ? (
                <Image src={profile.foto} alt="Foto de perfil" className={styles.profilePicImage} />
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
            />
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={profile.email}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="text"
              name="telefone"
              placeholder="Telefone"
              value={profile.telefone}
              onChange={handleChange}
            />
            <input
              type="text"
              name="sexo"
              placeholder="Sexo"
              value={profile.sexo}
              onChange={handleChange}
            />
            <input
              type="date"
              name="nascimento"
              placeholder="Nascimento"
              value={profile.nascimento}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="text"
              name="cpf"
              placeholder="CPF"
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
            <button type="submit" className={styles.updateButton}>
              Atualizar
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default Profile;
