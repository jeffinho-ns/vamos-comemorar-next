"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FiSave } from "react-icons/fi";
import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../../components/footer/footer";
import { useRouter } from "next/navigation";
import logoBlue from "@/app/assets/logo-agilizai-h.png";
import { uploadImage as uploadImageToFirebase } from "@/app/services/uploadService";
import { useAppContext } from "@/app/context/AppContext";

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
  const { user, isLoading, refetchAll } = useAppContext();
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;
    const baseUrl = `${API_URL}`;
    const fotoUrl = user.foto_perfil
      ? (typeof user.foto_perfil === "string" && user.foto_perfil.startsWith("http")
          ? user.foto_perfil
          : `${baseUrl}${String(user.foto_perfil).startsWith("/") ? user.foto_perfil : `/uploads/${user.foto_perfil}`}`)
      : "";
    setUserInfo({
      nome: String(user.name || ""),
      localizacao: "BR (Brasil - SP)",
      endereco: String(user.endereco || ""),
      telefone: String(user.telefone || "(11) 9 4350-1097"),
      foto_perfil: fotoUrl,
      senha: "",
    });
  }, [user]);

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
    if (!token) {
      setMessage("Token não encontrado. Faça login novamente.");
      return;
    }

    const payload: Record<string, any> = {};

    // Adiciona os dados ao payload se estiverem modificados
    if (user) {
        if (userInfo.nome && userInfo.nome !== String(user.name || "")) {
            payload.name = userInfo.nome;
        }
        if (userInfo.telefone && userInfo.telefone !== String(user.telefone || "")) {
            payload.telefone = userInfo.telefone;
        }
        if (userInfo.senha && userInfo.senha !== "") {
            payload.password = userInfo.senha;
        }
    }

    // Se houver foto nova, faz upload no Firebase e envia a URL pública
    if (file) {
      try {
        const url = await uploadImageToFirebase(file, "users/profile");
        payload.foto_perfil = url;
      } catch (err) {
        setMessage(`Erro ao enviar a imagem: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
        return;
      }
    }

    // Verifica se há algo para atualizar
    if (Object.keys(payload).length === 0) {
        setMessage("Nenhum campo para atualizar.");
        return;
    }

    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

        const updateResponse = await fetch(`${API_URL}/api/users/me`, {
            method: "PUT", // Altera para PUT já que estamos atualizando dados e imagem
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (updateResponse.ok) {
            await refetchAll();
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


  if (isLoading) {
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
        <Footer logo={logoBlue} />
      </div>
    </>
  );
};

export default PerfilMobile;
