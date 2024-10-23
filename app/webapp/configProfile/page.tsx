"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FiSave } from "react-icons/fi";
import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../components/footer/footer";
import { useRouter } from "next/navigation";

export default function PerfilMobile() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState({
    nome: false,
    endereco: false,
    telefone: false,
  });
  const [userInfo, setUserInfo] = useState({
    nome: "",
    localizacao: "BR (Brasil - SP)",
    endereco: "",
    telefone: "(11) 9 4350-1097",
    foto_perfil: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null); // Estado para armazenar o arquivo da imagem

  useEffect(() => {
    const token = localStorage.getItem("authToken");
  
    if (!token) {
      router.push("/login");
    } else {
      fetchUserData(token);
    }
  }, []);

  const fetchUserData = async (token) => {
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
          ? `${baseUrl}${userData.foto_perfil.startsWith("/") ? userData.foto_perfil : `/${userData.foto_perfil}`}`
          : "";
        setUserInfo({
          nome: userData.name,
          localizacao: "BR (Brasil - SP)",
          endereco: userData.endereco,
          telefone: userData.telefone || "(11) 9 4350-1097",
          foto_perfil: fotoUrl,
        });
        setUser(userData);
      } else {
        console.error("Erro ao buscar dados do usuário:", response.status, await response.text());
        router.push("/login");
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (field) => {
    setIsEditing((prev) => ({ ...prev, [field]: true }));
  };

  const handleInputChange = (field, value) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserInfo((prev) => ({ ...prev, foto_perfil: reader.result })); // Exibir a imagem selecionada
    };
    if (selectedFile) {
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSaveClick = async (field) => {
    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append(field, userInfo[field]);

    if (file) {
      formData.append("foto_perfil", file);
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: field === "foto_perfil" ? "PUT" : "PATCH", // Use PUT para a foto e PATCH para outros campos
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const updatedData = await response.json();
        setUser(updatedData);
        setMessage("Dados salvos com sucesso!");
        setIsEditing((prev) => ({ ...prev, [field]: false })); // Fecha o modo de edição para o campo salvo
        setFile(null); // Limpar arquivo após salvar
      } else {
        const errorData = await response.json();
        setMessage(`Erro ao salvar os dados: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      setMessage(`Erro ao fazer a requisição: ${error.message}`);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
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
              {userInfo.foto_perfil ? (
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
                onClick={(e) => {
                  e.target.value = null; // Permitir seleção da mesma imagem
                }}
                aria-label="Selecionar imagem do perfil"
              />
            </label>
            {file && (
              <button onClick={() => handleSaveClick("foto_perfil")} aria-label="Salvar imagem do perfil">
                <FiSave className="text-teal-500 text-xl ml-4" />
              </button>
            )}
          </div>

          <div className="w-full max-w-sm flex-grow flex flex-col px-4">
            {["nome", "endereco", "telefone"].map((field) => (
              <div className="flex items-center py-4 border-b border-gray-200" key={field}>
                <span className="text-lg font-semibold w-1/3 capitalize">{field}:</span>
                {isEditing[field] ? (
                  <>
                    <input
                      type="text"
                      className="text-lg flex-grow w-2/3 border border-gray-300 rounded-md p-2"
                      value={userInfo[field]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      aria-label={`Editar ${field}`}
                    />
                    <button onClick={() => handleSaveClick(field)} aria-label={`Salvar ${field}`}>
                      <FiSave className="text-teal-500 text-xl ml-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-lg flex-grow w-2/3">{userInfo[field]}</span>
                    <button onClick={() => handleEditClick(field)} aria-label={`Editar ${field}`}>
                      <FiSave className="text-teal-500 text-xl ml-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
