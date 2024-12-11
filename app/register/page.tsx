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

export default function Register() {
  const [show, setShow] = useState<boolean>(false);
  const [cpf, setCpf] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [confirmEmail, setConfirmEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  const validInputs = useMemo(() => {
    return (
      cpf.trim() !== "" &&
      fullName.trim() !== "" &&
      year.trim() !== "" &&
      email.trim() !== "" &&
      email === confirmEmail &&
      password.trim() !== "" &&
      password === confirmPassword
    );
  }, [cpf, fullName, year, email, confirmEmail, password, confirmPassword]);

  const handleRegister = async () => {
    if (!validInputs) {
      setError("Preencha todos os campos corretamente");
      return;
    }

    setLoading(true);
    setError(null);

    const requestData = {
      name: fullName,
      email,
      password,
      cpf, 
      year, 
    };

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

      const response = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const responseData = await response.json();
        setError(responseData.message || "Erro ao registrar. Tente novamente.");
        setLoading(false);
        return;
      }

      setSuccess(true); // Registro realizado com sucesso

      // Exibir mensagem por 3 segundos e redirecionar para a página de login
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      setError("Erro ao registrar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {success && <div className="success-message">Registro realizado com sucesso! Redirecionando para a página de login...</div>}
      {error && <div className="error-message">{error}</div>}
      <Banner id="banner-container" className="banner-container">
        <Image src={imgBanner} alt="Logo banner" style={{ width: "100%" }} />
      </Banner>

      <div className="register">
        <div className="form-container">
          <Link href="/">
            <Image
              src={logoWhite}
              alt="Logo"
              style={{ margin: "0 auto", padding: "1rem" }}
            />
          </Link>

          <Form id="form-register" className="form-register">
            <div className="input-container">
              <div className="column">
                <input
                  placeholder="CPF"
                  type="text"
                  id="cpf"
                  className="cpf"
                  onChange={(e) => setCpf(e.target.value)}
                  value={cpf}
                />
                <input
                  placeholder="Nome e sobrenome"
                  type="text"
                  id="full-name"
                  className="full-name"
                  onChange={(e) => setFullName(e.target.value)}
                  value={fullName}
                />
                <select
                  value={year}
                  id="year"
                  className="year"
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option>Selecione o ano</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
              <div className="column">
                <input
                  placeholder="E-mail"
                  type="text"
                  id="email"
                  className="email"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
                <input
                  placeholder="Confirme seu e-mail"
                  type="text"
                  id="confirm-email"
                  className="confirm-email"
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  value={confirmEmail}
                />
                <input
                  placeholder="Senha"
                  type={show ? "text" : "password"}
                  id="password"
                  className="password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />
                <input
                  placeholder="Confirme sua senha"
                  type={show ? "text" : "password"}
                  id="confirm-password"
                  className="confirm-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
                />
                {show ? (
                  <MdVisibility onClick={() => setShow(false)} />
                ) : (
                  <MdVisibilityOff onClick={() => setShow(true)} />
                )}
              </div>
            </div>

            <div className="terms-container">
              <input
                id="use-terms"
                className="use-terms"
                type="checkbox"
                onChange={() => {}}
              />
              <label htmlFor="use-terms">
                Eu li e aceito os{" "}
                <Link
                  href="https://d1vz4qvol0e6u8.cloudfront.net/docs/TERMOS_DE_USO.pdf"
                  target="_blank"
                >
                  Termos de Uso
                </Link>
              </label>
            </div>

            <Button type="button" className="btn-register" onClick={handleRegister} disabled={loading}>
              {loading ? "Cadastrando..." : "CADASTRAR"}
            </Button>
            <div className="title">
              <p className="account-text">
                Já possui uma conta?{" "}
                <Link href="/login" className="account-link">
                  ENTRAR
                </Link>
              </p>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
