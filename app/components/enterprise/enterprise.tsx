import React, { useState, useEffect, useMemo } from "react";
import Modal from "react-modal";
import { Establishment } from "../../types/Establishment";

interface Company {
  id?: number;
  cnpj: string;
  nome: string;
  telefone: string;
  site?: string;
  email: string;
  emailFinanceiro?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  status?: string;
}



interface EnterpriseProps {
  isOpen: boolean;
  onRequestClose: () => void;
  company: Establishment | null; // A propriedade 'company' pode ser um objeto do tipo 'Establishment' ou null
}

const Enterprise: React.FC<EnterpriseProps> = ({ isOpen, onRequestClose, company }) => {
  const initialEnterpriseState = useMemo<Establishment>(() => ({
    cnpj: "",
    nome: "",
    telefone: "",
    site: "",
    email: "",
    emailFinanceiro: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    complemento: "",
    cidade: "",
    estado: "",
    status: "Analisando",
  }), []);

  const [enterprise, setEnterprise] = useState<Establishment>(initialEnterpriseState);
  const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  useEffect(() => {
    if (company) {
      setEnterprise({
        ...company,
        status: company.status || "Analisando", // Use o status da company se estiver definido
      });
    } else {
      setEnterprise(initialEnterpriseState); // Reinicia o estado se não houver company
    }
  },  [company, initialEnterpriseState]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEnterprise((prevEnterprise) => ({
      ...prevEnterprise,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cria um novo objeto com os campos necessários
    const dataToSend: Establishment = {
      ...enterprise,
    };

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Token não encontrado. Faça login novamente.');
        return;
      }

      let url = `${API_URL}/companies`;
      let response;

      if (company && company.id) {
        // Atualiza a empresa existente
        response = await fetch(`${url}/${company.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSend),
        });
      } else {
        // Adiciona uma nova empresa
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
        const savedEnterprise = await response.json();
        console.log(company ? "Empresa atualizada:" : "Empresa adicionada:", savedEnterprise);
        onRequestClose(); // Fecha o modal após o envio
      } else {
        console.error("Erro ao salvar empresa:", response.statusText);
      }
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
    }
  };


  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="bg-white rounded-lg max-w-3xl mx-auto p-6 shadow-lg transition-all duration-300"
      overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Dados do Estabelecimento</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-left text-gray-700">CNPJ:</label>
              <input
                type="text"
                name="cnpj"
                placeholder="CNPJ"
                value={enterprise.cnpj}
                onChange={handleChange}
                required
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">Nome:</label>
              <input
                type="text"
                name="nome"
                placeholder="Nome"
                value={enterprise.nome}
                onChange={handleChange}
                required
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">Telefone:</label>
              <input
                type="text"
                name="telefone"
                placeholder="Telefone"
                value={enterprise.telefone}
                onChange={handleChange}
                required
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">Site:</label>
              <input
                type="text"
                name="site"
                placeholder="Site"
                value={enterprise.site}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">E-mail:</label>
              <input
                type="email"
                name="email"
                placeholder="E-mail"
                value={enterprise.email}
                onChange={handleChange}
                required
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">E-mail Financeiro:</label>
              <input
                type="email"
                name="emailFinanceiro"
                placeholder="E-mail Financeiro"
                value={enterprise.emailFinanceiro}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">CEP:</label>
              <input
                type="text"
                name="cep"
                placeholder="CEP"
                value={enterprise.cep}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">Endereço:</label>
              <input
                type="text"
                name="endereco"
                placeholder="Endereço"
                value={enterprise.endereco}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">Número:</label>
              <input
                type="text"
                name="numero"
                placeholder="Número"
                value={enterprise.numero}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">Bairro:</label>
              <input
                type="text"
                name="bairro"
                placeholder="Bairro"
                value={enterprise.bairro}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">Complemento:</label>
              <input
                type="text"
                name="complemento"
                placeholder="Complemento"
                value={enterprise.complemento}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">Cidade:</label>
              <input
                type="text"
                name="cidade"
                placeholder="Cidade"
                value={enterprise.cidade}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-left text-gray-700">Estado:</label>
              <input
                type="text"
                name="estado"
                placeholder="Estado"
                value={enterprise.estado}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-400"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
          >
            {company ? "Atualizar Empresa" : "Adicionar Empresa"}
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default Enterprise;
