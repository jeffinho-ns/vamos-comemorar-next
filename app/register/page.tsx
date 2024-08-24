"use client";

import Banner from "@/app/components/banner/banner";
import Image from "next/image";
import imgBanner from "@/app/assets/banner01.webp";
import Form from "@/app/components/form/form";
import logoWhite from "@/app/assets/logo_white.png";
import Link from "next/link";
import Input from "../components/input/input";
import Button from "../components/button/button";
import Select from "../components/select/select";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useMemo, useState } from "react";
import "./styles.scss";

export default function Register() {
  const [show, setShow] = useState<boolean>(false);
  const [cpf, setCpf] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [confirmEmail, setConfirmEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);

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

  const handleRegister = () => {
    if (validInputs) {
      console.log("Registro efetuado com sucesso");
    } else {
      console.log("Preencha todos os campos corretamente");
    }
  };

  return (
    <div className="container">
      {openModal && <div>Aqui vai o modal de troca de senha</div>}
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
                <Input
                  placeholder="CPF"
                  type="text"
                  id="cpf"
                  className="cpf"
                  onChange={(e) => setCpf(e.target.value)}
                  value={cpf}
                />
                <Input
                  placeholder="Nome e sobrenome"
                  type="text"
                  id="full-name"
                  className="full-name"
                  onChange={(e) => setFullName(e.target.value)}
                  value={fullName}
                />
                <Select
                  value={year}
                  id="year"
                  className="year"
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option>Selecione o ano</option>
                
                </Select>
              </div>
              <div className="column">
                <Input
                  placeholder="E-mail"
                  type="text"
                  id="email"
                  className="email"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
                <Input
                  placeholder="Confirme seu e-mail"
                  type="text"
                  id="confirm-email"
                  className="confirm-email"
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  value={confirmEmail}
                />
                <Input
                  placeholder="Senha"
                  type={show ? "text" : "password"}
                  id="password"
                  className="password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />
                <Input
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
                <small>0 / 15</small>
              </div>
            </div>

            <div className="terms-container">
              <Input
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

            <Link
              href="#"
              onClick={() => setOpenModal(true)}
              className="forgot-password"
            >
              ESQUECEU SUA SENHA?
            </Link>

            <Button
              type="button"
              className="btn-register"
              onClick={handleRegister}
            >
              CADASTRAR
            </Button>
            <div className="title">
              <p className="account-text">
                Já possui uma conta?{" "}
                <Link href="/login" className="account-link">
                  Criar conta
                </Link>
              </p>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
