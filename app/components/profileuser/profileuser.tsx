import React, { useState, useEffect } from "react";
import styles from "./profileuser.module.scss";
import Image from "next/image";

const ProfileUser = ({ addUser, user }) => {
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

    useEffect(() => {
        if (user) {
            setProfile({
                ...user,
                foto_perfil: user.foto_perfil ? `http://localhost:5000/uploads/${user.foto_perfil}` : "", // Adicionando um valor padrão
                status: user.status === "Ativado" ? "Ativado" : "Desativado",
                password: user.password || "", // Limpa a senha ao abrir
            });
        } else {
            setProfile((prevProfile) => ({
                ...prevProfile,
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
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prevProfile) => ({
            ...prevProfile,
            [name]: value,
        }));
    };

    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file); // Armazena o arquivo
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile((prevProfile) => ({
                    ...prevProfile,
                    foto_perfil: reader.result,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSend = {
            foto_perfil: profile.foto_perfil,
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
            password: profile.password, // Adicionado para incluir a senha
        };

        const formData = new FormData();
        formData.append('image', selectedFile);
         // selectedFile deve conter o arquivo de imagem

        try {
          const response = await fetch('http://localhost:5000/api/upload', {
              method: 'POST',
              body: formData,
          });

          const data = await response.json();

          if (response.ok) {
              console.log('Imagem enviada com sucesso:', data.imageUrl);
              // Usa a URL da imagem recebida para salvar no perfil
              setProfile({ ...profile, foto_perfil: `http://localhost:5000/uploads/${data.imageUrl}` });
          } else {
              console.error('Erro ao enviar a imagem:', data.error);
          }
      } catch (error) {
          console.error('Erro ao enviar a requisição:', error);
      }

        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                console.error("Token não encontrado. Faça login novamente.");
                return;
            }

            const url = `http://localhost:5000/api/users/${profile.id}`;
            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                const savedProfile = await response.json();
                addUser(savedProfile);
            } else {
                console.error("Erro ao salvar usuário:", response.statusText);
            }
        } catch (error) {
            console.error("Erro ao enviar dados:", error);
        }
    };
    const token = localStorage.getItem("authToken");
console.log("Token:", token);



  return (
    <div className={styles.profileContent}>
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
              <Image
                src={profile.foto_perfil}
                alt="Foto de perfil"
                className={styles.profilePicImage}
              />
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
            name="name"
            placeholder="Nome e sobrenome"
            value={profile.name}
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
            name="data_nascimento"
            placeholder="Nascimento"
            value={profile.data_nascimento}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formRow}>
          <input
            type="text"
            name="cpf"
            placeholder="CPF"
            value={profile.cpf} // Certifique-se de que `cpf` existe no objeto `user`
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
            type="password" // Campo de senha
            name="password"
            placeholder="Nova Senha"
            value={profile.password} // Para capturar a nova senha
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
  );
};

export default ProfileUser;
