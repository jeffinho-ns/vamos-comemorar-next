import React, { useState, useEffect } from "react";
import styles from "./profileuser.module.scss";
import Image from "next/image";

// Definindo a interface para as props
interface ProfileUserProps {
    addUser: (user: any) => void; // Substitua 'any' por um tipo mais específico se possível
    user: {
        foto_perfil: string;
        name: string;
        email: string;
        telefone: string;
        sexo: string;
        data_nascimento: string;
        cep: string;
        cpf: string;
        endereco: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        complemento: string;
        password?: string; // Adicione o '?' se a propriedade não for obrigatória
        id: string;
        status: string;
    } | null; // user pode ser nulo se não houver usuário
}

const ProfileUser: React.FC<ProfileUserProps> = ({ addUser, user }) => {
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

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

    useEffect(() => {
        if (user) {
            setProfile({
                ...user,
                foto_perfil: user.foto_perfil ? `${API_URL}/uploads/${user.foto_perfil}` : "",
                status: user.status === "Ativado" ? "Ativado" : "Desativado",
                password: "", // Limpa a senha ao abrir
            });
        } else {
            resetProfile();
        }
    }, [user, API_URL]);

    const resetProfile = () => {
        setProfile({
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
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile((prevProfile) => ({
            ...prevProfile,
            [name]: value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; // Adiciona verificação
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile((prevProfile) => ({
                    ...prevProfile,
                    foto_perfil: reader.result as string,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        if (!token) {
            console.error("Token não encontrado. Faça login novamente.");
            return;
        }

        const formData = new FormData();
        formData.append('image', selectedFile!); // O `!` indica que o valor não é nulo
        formData.append('data', JSON.stringify({
            ...profile,
            password: profile.password,
        }));

        try {
            const uploadResponse = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            const uploadData = await uploadResponse.json();

            if (uploadResponse.ok) {
                console.log('Imagem enviada com sucesso:', uploadData.imageUrl);
                setProfile((prevProfile) => ({
                    ...prevProfile,
                    foto_perfil: `${API_URL}/uploads/${uploadData.imageUrl}`
                }));
            } else {
                console.error('Erro ao enviar a imagem:', uploadData.error);
                return; // Não continua se a imagem não for enviada
            }

            const url = `${API_URL}/api/users/${profile.id}`;
            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...profile,
                    foto_perfil: uploadData.imageUrl
                }),
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
                                width={200} 
                                height={200} 
                                layout="responsive" 
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
                        type="password"
                        name="password"
                        placeholder="Nova Senha"
                        value={profile.password}
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
