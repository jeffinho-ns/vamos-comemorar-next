import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MdPerson, MdEmail, MdPhone, MdLocationOn, MdCalendarToday, MdEdit, MdSave, MdCameraAlt } from "react-icons/md";

// Definindo a interface para as props
interface ProfileUserProps {
    addUser: (user: any) => void;
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
        password?: string;
        id: string;
        status: string;
    } | null;
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
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

    useEffect(() => {
        if (user) {
            setProfile({
                ...user,
                foto_perfil: user.foto_perfil ? `${API_URL}/uploads/${user.foto_perfil}` : "",
                status: user.status === "Ativado" ? "Ativado" : "Desativado",
                password: "",
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
        const file = e.target.files?.[0];
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
        setIsLoading(true);
        
        const token = localStorage.getItem("authToken");
        if (!token) {
            console.error("Token não encontrado. Faça login novamente.");
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('image', selectedFile!);
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
                setIsLoading(false);
                return;
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
                setIsEditing(false);
            } else {
                console.error("Erro ao salvar usuário:", response.statusText);
            }
        } catch (error) {
            console.error("Erro ao enviar dados:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-8 max-w-4xl w-full">
            {/* Header Section */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Meu Perfil</h1>
                <p className="text-gray-600">Gerencie suas informações pessoais</p>
            </div>

            {/* Profile Picture Section */}
            <div className="flex justify-center mb-8">
                <div className="relative group">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 to-yellow-600 p-1">
                        <label htmlFor="fotoInput" className="cursor-pointer block w-full h-full">
                            <input
                                type="file"
                                id="fotoInput"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {profile.foto_perfil ? (
                                <Image
                                    src={profile.foto_perfil}
                                    alt="Foto de perfil"
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                                    <MdPerson className="text-4xl text-gray-400" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
                                <MdCameraAlt className="text-white text-2xl" />
                            </div>
                        </label>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center mb-8">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    profile.status === "Ativado" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                }`}>
                    {profile.status}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MdPerson className="text-blue-600" />
                        Informações Pessoais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="Digite seu nome completo"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">E-mail</label>
                            <div className="relative">
                                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Telefone</label>
                            <div className="relative">
                                <MdPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="telefone"
                                    value={profile.telefone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
                            <div className="relative">
                                <MdCalendarToday className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    name="data_nascimento"
                                    value={profile.data_nascimento}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Sexo</label>
                            <select
                                name="sexo"
                                value={profile.sexo}
                                onChange={(e) => handleChange(e as any)}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                            >
                                <option value="">Selecione</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">CPF</label>
                            <input
                                type="text"
                                name="cpf"
                                value={profile.cpf}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="000.000.000-00"
                            />
                        </div>
                    </div>
                </div>

                {/* Address Section */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-2xl">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MdLocationOn className="text-green-600" />
                        Endereço
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">CEP</label>
                            <input
                                type="text"
                                name="cep"
                                value={profile.cep}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="00000-000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Endereço</label>
                            <input
                                type="text"
                                name="endereco"
                                value={profile.endereco}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="Rua, Avenida, etc."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Número</label>
                            <input
                                type="text"
                                name="numero"
                                value={profile.numero}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="123"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Bairro</label>
                            <input
                                type="text"
                                name="bairro"
                                value={profile.bairro}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="Centro"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Cidade</label>
                            <input
                                type="text"
                                name="cidade"
                                value={profile.cidade}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="São Paulo"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Estado</label>
                            <select
                                name="estado"
                                value={profile.estado}
                                onChange={(e) => handleChange(e as any)}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                            >
                                <option value="">Selecione</option>
                                <option value="SP">São Paulo</option>
                                <option value="RJ">Rio de Janeiro</option>
                                <option value="MG">Minas Gerais</option>
                                <option value="RS">Rio Grande do Sul</option>
                                <option value="PR">Paraná</option>
                                <option value="SC">Santa Catarina</option>
                                <option value="BA">Bahia</option>
                                <option value="GO">Goiás</option>
                                <option value="PE">Pernambuco</option>
                                <option value="CE">Ceará</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-gray-700">Complemento</label>
                            <input
                                type="text"
                                name="complemento"
                                value={profile.complemento}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="Apartamento, bloco, etc."
                            />
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-2xl">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MdSave className="text-purple-600" />
                        Segurança
                    </h2>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nova Senha (deixe em branco para manter a atual)</label>
                        <input
                            type="password"
                            name="password"
                            value={profile.password}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                            placeholder="Digite sua nova senha"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 pt-6">
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
                        >
                            <MdEdit className="text-xl" />
                            Editar Perfil
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <MdSave className="text-xl" />
                                        Salvar Alterações
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ProfileUser;
