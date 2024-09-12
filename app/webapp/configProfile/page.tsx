"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiEdit3 } from "react-icons/fi";
import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../components/footer/footer";

import "./profile.module.scss";

export default function PerfilMobile() {
  // Estado para armazenar as informações do usuário
  const [userInfo, setUserInfo] = useState({
    nome: "Jefferson Lima",
    localizacao: "BR (Brasil - SP)",
    endereco: "Rua Catanduvas do Sul",
    telefone: "(11) 9 4350-1097",
  });

  // Estado para controlar o modo de edição
  const [isEditing, setIsEditing] = useState({
    nome: false,
    localizacao: false,
    endereco: false,
    telefone: false,
  });

  // Refs para os campos de entrada
  const nomeRef = useRef(null);
  const localizacaoRef = useRef(null);
  const enderecoRef = useRef(null);
  const telefoneRef = useRef(null);

  // Função para lidar com a mudança de informações do usuário
  const handleChange = (field, value) => {
    setUserInfo({
      ...userInfo,
      [field]: value,
    });
  };

  // Função para focar no campo de input quando o modo de edição é ativado
  useEffect(() => {
    if (isEditing.nome) nomeRef.current.focus();
    if (isEditing.localizacao) localizacaoRef.current.focus();
    if (isEditing.endereco) enderecoRef.current.focus();
    if (isEditing.telefone) telefoneRef.current.focus();
  }, [isEditing]);

  // Função para salvar as alterações
  const saveChanges = () => {
    setIsEditing({
      nome: false,
      localizacao: false,
      endereco: false,
      telefone: false,
    });
    // Aqui você poderia salvar as informações em uma API ou no localStorage, se necessário.
    console.log("Informações salvas:", userInfo);
  };

  return (
    <>
      <Header />
      <div className="profile-container-mobile">
        <div className="flex flex-col items-center bg-white h-auto py-8 overflow-hidden">
          <h6 className="text-base font-semibold self-start mt-4 pl-4">Configurações</h6>
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-2">
              <span className="text-gray-500">Adicionar foto</span>
            </div>
          </div>

          <div className="w-full max-w-sm flex-grow flex flex-col px-4">

            {/* Campo Nome */}
            <div className="flex items-center py-4 border-b border-gray-200">
              <span className="text-lg font-semibold w-1/3">Nome:</span>
              {isEditing.nome ? (
                <input
                  ref={nomeRef} // Adiciona a referência ao input
                  type="text"
                  className="text-lg w-2/3"
                  value={userInfo.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                />
              ) : (
                <span className="text-lg flex-grow w-2/3">{userInfo.nome}</span>
              )}
              <button
                onClick={() =>
                  setIsEditing((prevState) => ({
                    ...prevState,
                    nome: !isEditing.nome,
                  }))
                }
              >
                <FiEdit3 className="text-teal-500 text-xl ml-4" />
              </button>
            </div>

            {/* Campo Localização */}
            <div className="flex items-center py-4 border-b border-gray-200">
              <span className="text-lg font-semibold w-1/3">Localização:</span>
              {isEditing.localizacao ? (
                <input
                  ref={localizacaoRef} // Adiciona a referência ao input
                  type="text"
                  className="text-lg w-2/3"
                  value={userInfo.localizacao}
                  onChange={(e) => handleChange("localizacao", e.target.value)}
                />
              ) : (
                <span className="text-lg flex-grow w-2/3">{userInfo.localizacao}</span>
              )}
              <button
                onClick={() =>
                  setIsEditing((prevState) => ({
                    ...prevState,
                    localizacao: !isEditing.localizacao,
                  }))
                }
              >
                <FiEdit3 className="text-teal-500 text-xl ml-4" />
              </button>
            </div>

            {/* Campo Endereço */}
            <div className="flex items-center py-4 border-b border-gray-200">
              <span className="text-lg font-semibold w-1/3">Endereço:</span>
              {isEditing.endereco ? (
                <input
                  ref={enderecoRef} // Adiciona a referência ao input
                  type="text"
                  className="text-lg w-2/3"
                  value={userInfo.endereco}
                  onChange={(e) => handleChange("endereco", e.target.value)}
                />
              ) : (
                <span className="text-lg flex-grow w-2/3">{userInfo.endereco}</span>
              )}
              <button
                onClick={() =>
                  setIsEditing((prevState) => ({
                    ...prevState,
                    endereco: !isEditing.endereco,
                  }))
                }
              >
                <FiEdit3 className="text-teal-500 text-xl ml-4" />
              </button>
            </div>

            {/* Campo Telefone */}
            <div className="flex items-center py-4 border-b border-gray-200">
              <span className="text-lg font-semibold w-1/3">Telefone:</span>
              {isEditing.telefone ? (
                <input
                  ref={telefoneRef} // Adiciona a referência ao input
                  type="text"
                  className="text-lg w-2/3"
                  value={userInfo.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                />
              ) : (
                <span className="text-lg flex-grow w-2/3">{userInfo.telefone}</span>
              )}
              <button
                onClick={() =>
                  setIsEditing((prevState) => ({
                    ...prevState,
                    telefone: !isEditing.telefone,
                  }))
                }
              >
                <FiEdit3 className="text-teal-500 text-xl ml-4" />
              </button>
            </div>

            <button
              className="w-full bg-teal-500 text-white py-5 rounded-full mt-8 flex items-center justify-center"
              onClick={saveChanges}
            >
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
