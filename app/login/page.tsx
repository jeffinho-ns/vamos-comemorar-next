"use client";

import Banner from "@/app/components/banner/banner";
import Image from "next/image";
import imgBanner from "@/app/assets/banner01.webp";
import Form from "@/app/components/form/form";
import logoWhite from "@/app/assets/logo_white.png";
import Link from "next/link";
import Button from "../components/button/button";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useMemo, useState } from "react";
import "./styles.scss";
import { useRouter } from "next/navigation";

export default function Login() {
  const [show, setShow] = useState<boolean>(false);
  const [emailCpf, setEmailCpf] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const validInputs = useMemo(() => {
    return emailCpf.length > 0 && password.length > 0;
  }, [emailCpf, password]);

  const handleLogin = async () => {
    if (!validInputs) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const API_URL =
  process.env.NEXT_PUBLIC_API_URL

      const response = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access: emailCpf,
          password: password,
        }),
      });

      const data = await response.json();
      console.log(data); // Verificar a resposta da API

      if (response.ok) {
        // Verifique se a API retorna o token e o userId
        if (data.token && data.userId) {
          localStorage.setItem("authToken", data.token); // Armazenando o token
          localStorage.setItem("userId", data.userId); // Armazenando o userId
          router.push("/"); // Redireciona após o login bem-sucedido
        } else {
          setError("Erro ao obter token ou ID do usuário.");
        }
      } else {
        // Se a resposta não for ok, exibe uma mensagem de erro
        setError(data.message || "Credenciais inválidas.");
      }
    } catch (error) {
      setError("Erro ao tentar fazer login. Tente novamente.");
      console.error("Erro:", error);
    }
  };

  return (
    <div className="container">
      {openModal && <div>Aqui vai o modal de troca de senha</div>}
      <Banner id="banner-container" className="banner-container">
        <Image src={imgBanner} alt="Logo banner" style={{ width: "100%" }} />
      </Banner>

      <div className="login">
        <div className="form-container">
          <Link href="/">
            <Image
              src={logoWhite}
              alt="Logo"
              style={{ margin: "0 auto", padding: "1rem" }}
            />
          </Link>
          <Form id="form-login" className="form-login">
            <div className="input-container">
              <input
                placeholder="Email / CPF"
                type="text"
                id="cpf"
                className="cpf"
                onChange={(e) => setEmailCpf(e.target.value)}
                value={emailCpf}
              />
              <input
                placeholder="Senha"
                type={show ? "text" : "password"}
                id="password"
                className="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
              />
              {show ? (
                <MdVisibility onClick={() => setShow(false)} />
              ) : (
                <MdVisibilityOff onClick={() => setShow(true)} />
              )}
              <small>0 / 15</small>
              <Link href="#" onClick={() => setOpenModal(true)}>
                ESQUECEU SUA SENHA?
              </Link>
            </div>

            <Button type="button" className="btn-login" onClick={handleLogin}>
              ENTRAR
            </Button>

            {error && <p className="error-message">{error}</p>}

            <div className="title">
              <p>
                Ainda não tem uma conta? <Link href="/register">Cadastrar</Link>
              </p>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
