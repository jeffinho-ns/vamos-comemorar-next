import React, { useState } from "react";
import Modal from "react-modal";
import styles from "./enterprise.module.scss";

const Enterprise = ({ isOpen, onRequestClose, addUser }) => {
  const [enterprise, setEnterprise] = useState({
    cnpj: "",
    id: "",
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
    status: "Ativado"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEnterprise((prevEnterprise) => ({
      ...prevEnterprise,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      cnpj: "52.891.095/0001-84",
      id: enterprise.id,
      nome: enterprise.nome,
      telefone: enterprise.telefone,
      site: enterprise.site,
      email: enterprise.email,
      emailFinanceiro: enterprise.emailFinanceiro,
      cep: enterprise.cep,
      endereco: enterprise.endereco,
      numero: enterprise.numero,
      bairro: enterprise.bairro,
      complemento: enterprise.complemento,
      cidade: enterprise.cidade,
      estado: enterprise.estado,
      status: enterprise.status,
    };

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("Token não encontrado. Faça login novamente.");
        return;
      }

      const response = await fetch("https://api.vamoscomemorar.com.br/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ID-Empresa": enterprise.idEmpresa,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const savedEnterprise = await response.json();
        console.log("Estabelecimento adicionado:", savedEnterprise);
        onRequestClose(); // Fecha o modal após o envio
      } else {
        console.error("Erro ao adicionar estabelecimento:", response.statusText);
      }
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
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
        <h2>Dados do Estabelecimento</h2>
        <form className={styles.enterpriseForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label>CNPJ:</label>
            <input
              type="text"
              name="cnpj"
              placeholder="CNPJ"
              value={enterprise.cnpj}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="ID"
              placeholder="ID"
              value={enterprise.id}
              onChange={handleChange}
              required
            />
            <label>Nome:</label>
            <input
              type="text"
              name="nome"
              placeholder="Nome"
              value={enterprise.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formRow}>
            <label>Telefone:</label>
            <input
              type="text"
              name="telefone"
              placeholder="Telefone"
              value={enterprise.telefone}
              onChange={handleChange}
              required
            />
            <label>Site:</label>
            <input
              type="text"
              name="site"
              placeholder="Site"
              value={enterprise.site}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formRow}>
            <label>E-mail:</label>
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={enterprise.email}
              onChange={handleChange}
              required
            />
            <label>E-mail Financeiro:</label>
            <input
              type="email"
              name="emailFinanceiro"
              placeholder="E-mail Financeiro"
              value={enterprise.emailFinanceiro}
              onChange={handleChange}
            />
          </div>

          <h3>Endereço</h3>
          <div className={styles.formRow}>
            <label>CEP:</label>
            <input
              type="text"
              name="cep"
              placeholder="CEP"
              value={enterprise.cep}
              onChange={handleChange}
              required
            />
            <label>Endereço:</label>
            <input
              type="text"
              name="endereco"
              placeholder="Endereço"
              value={enterprise.endereco}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formRow}>
            <label>Número:</label>
            <input
              type="text"
              name="numero"
              placeholder="Número"
              value={enterprise.numero}
              onChange={handleChange}
              required
            />
            <label>Bairro:</label>
            <input
              type="text"
              name="bairro"
              placeholder="Bairro"
              value={enterprise.bairro}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formRow}>
            <label>Complemento:</label>
            <input
              type="text"
              name="complemento"
              placeholder="Complemento"
              value={enterprise.complemento}
              onChange={handleChange}
            />
            <label>Cidade:</label>
            <input
              type="text"
              name="cidade"
              placeholder="Cidade"
              value={enterprise.cidade}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formRow}>
            <label>Estado:</label>
            <input
              type="text"
              name="estado"
              placeholder="Estado"
              value={enterprise.estado}
              onChange={handleChange}
              required
            />
          </div>

          <h3>Administrativo</h3>
          <div className={styles.formRow}>
            <label>Status:</label>
            <select
              name="status"
              value={enterprise.status}
              onChange={handleChange}
              required
            >
              <option value="Ativado">Ativado</option>
              <option value="Desativado">Desativado</option>
            </select>
          </div>

          <div className={styles.buttonRow}>
            <button type="submit" className={styles.saveButton}>
              Salvar
            </button>
            <button
              type="button"
              className={styles.clearButton}
              onClick={() =>
                setEnterprise({
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
                  status: "Ativado",
                })
              }
            >
              Limpar
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default Enterprise;
