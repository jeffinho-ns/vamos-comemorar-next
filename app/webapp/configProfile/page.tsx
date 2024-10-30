"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FiSave } from "react-icons/fi";
import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../components/footer/footer";
import { useRouter } from "next/navigation";

type UserField = "nome" | "endereco" | "telefone";
type ProfileField = "nome" | "endereco" | "telefone" | "senha";

interface User {
  name: string;
  telefone: string;
  endereco?: string;
  foto_perfil?: string;
}

const PerfilMobile: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Novo estado para a URL da imagem
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState({
    nome: false,
    endereco: false,
    telefone: false,
    senha: false,
  });
  const [userInfo, setUserInfo] = useState({
    nome: "",
    localizacao: "BR (Brasil - SP)",
    endereco: "",
    telefone: "(11) 9 4350-1097",
    foto_perfil: "",
    senha: "",
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState("");

  const fetchUserData = useCallback(async (token: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const baseUrl = `${API_URL}`;
        const fotoUrl = userData.foto_perfil
          ? `${baseUrl}${userData.foto_perfil.startsWith("/") ? userData.foto_perfil : `/uploads/${userData.foto_perfil}`}`
          : "";
        setUserInfo({
          nome: userData.name,
          localizacao: "BR (Brasil - SP)",
          endereco: userData.endereco,
          telefone: userData.telefone || "(11) 9 4350-1097",
          foto_perfil: fotoUrl,
          senha: "",
        });
        setUser(userData);
        setIsAuthenticated(true);
      } else if (response.status === 401) {
        localStorage.removeItem("authToken");
        router.push("/login");
      } else {
        console.error("Erro ao buscar dados do usuário:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      localStorage.removeItem("authToken");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
    } else {
      fetchUserData(token);
    }
  }, [fetchUserData, router]);

  const handleEditClick = (field: UserField | "senha") => {
    setIsEditing((prev) => ({ ...prev, [field]: true }));
  };

  const handleInputChange = (field: UserField | "senha", value: string) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile)); // Cria a URL para visualização
    }
  };

  const handleSaveClick = async () => {
    const token = localStorage.getItem("authToken");

    const dataToUpdate: Record<string, any> = {};
    if (user) {
      if (userInfo.nome && userInfo.nome !== user.name) {
        dataToUpdate.name = userInfo.nome;
      }
      if (userInfo.telefone && userInfo.telefone !== user.telefone) {
        dataToUpdate.telefone = userInfo.telefone;
      }
      if (userInfo.senha && userInfo.senha !== "") {
        dataToUpdate.password = userInfo.senha;
      }
    }

    if (Object.keys(dataToUpdate).length === 0 && !file) {
      setMessage("Nenhum campo para atualizar.");
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;

      // Faz o upload da foto de perfil, se houver
      let fotoUrl: string | null = null;
      if (file) {
        const formData = new FormData();
        formData.append("foto_perfil", file);

        const uploadResponse = await fetch(`${API_URL}/uploads`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const responseData = await uploadResponse.json();
          fotoUrl = responseData.fotoUrl; // Obter a URL da foto retornada pelo servidor
          dataToUpdate.foto_perfil = fotoUrl; // Adiciona a URL à atualização
          setUserInfo((prev) => ({ ...prev, foto_perfil: fotoUrl })); // Atualiza o estado com a nova URL
        } else {
          const errorData = await uploadResponse.json();
          setMessage(`Erro ao salvar a imagem: ${errorData.error || uploadResponse.statusText}`);
          return;
        }
      }

      const updateResponse = await fetch(`${API_URL}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToUpdate),
      });

      if (updateResponse.ok) {
        const updatedData = await updateResponse.json();
        setUser(updatedData);
        setMessage("Dados salvos com sucesso!");
        setFile(null);
        setPreviewUrl(null); // Limpa a URL de visualização após salvar
        setIsEditing({ nome: false, endereco: false, telefone: false, senha: false });
      } else {
        const errorData = await updateResponse.json();
        setMessage(`Erro ao salvar os dados: ${errorData.error || updateResponse.statusText}`);
      }
    } catch (error) {
      console.error("Erro ao fazer a requisição:", error);
      const errorMessage = (error as Error).message || "Erro desconhecido";
      setMessage(`Erro ao fazer a requisição: ${errorMessage}`);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="flex flex-col min-h-[100vh]">
        <div className="flex-grow flex flex-col items-center bg-white py-8">
          <h6 className="text-base font-semibold self-start mt-4 pl-4">Configurações</h6>
          {message && <div className="text-green-600">{message}</div>}
          <div className="flex flex-col items-center mb-6">
            <label className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-2 cursor-pointer">
              {previewUrl ? ( // Usando a URL de visualização
                <Image
                  src={previewUrl}
                  alt="Perfil"
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                />
              ) : userInfo.foto_perfil ? (
                <Image
                  src={userInfo.foto_perfil}
                  alt="Perfil"
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-500">Adicionar foto</span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Selecionar imagem do perfil"
              />
            </label>
            {file && (
              <button onClick={handleSaveClick} aria-label="Salvar imagem do perfil">
                <FiSave className="text-teal-500 text-xl ml-4" />
              </button>
            )}
          </div>
          <div className="w-full max-w-sm flex-grow flex flex-col px-4">
            {(["nome", "endereco", "telefone", "senha"] as ProfileField[]).map((field) => (
              <div className="flex items-center mb-4" key={field}>
                <span className="text-gray-700 w-1/3">{field}</span>
                {isEditing[field] ? (
                  <>
                    <input
                      type="text"
                      value={userInfo[field]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className="border border-gray-300 p-1 rounded w-2/3"
                    />
                    <button onClick={() => handleSaveClick()} aria-label={`Salvar ${field}`}>
                      <FiSave className="text-teal-500 text-xl ml-2" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-lg w-2/3">{userInfo[field]}</span>
                    <button onClick={() => handleEditClick(field)} aria-label={`Editar ${field}`}>
                      <FiSave className="text-teal-500 text-xl ml-2" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default PerfilMobile;
