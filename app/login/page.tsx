"use client";

import Banner from "@/app/components/banner/banner";
import Image from "next/image";
import imgBanner from "@/app/assets/banner01.webp";
import Form from "@/app/components/form/form";
import logoWhite from "@/app/assets/logo_white.png";
import Link from "next/link";
import Input from "../components/input/input";
import Button from "../components/button/button";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useMemo, useState } from "react";
import "./styles.scss";

export default function Login() {
  const [show, setShow] = useState<boolean>(false);
  const [emailCpf, setEmailCpf] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);

  const validInputs = useMemo(() => {
    // memorization para validação dos campos de email / cpf e senha
  }, []);

  const handleLogin = () => {};

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
              <Input
                placeholder="Email / CPF"
                type="text"
                id="cpf"
                className="cpf"
                onChange={setEmailCpf}
                value={emailCpf}
              />
              <Input
                placeholder="Senha"
                type="password"
                id="password"
                className="password"
                onChange={setPassword}
                value={password}
              />
              {show && <MdVisibility onClick={() => setShow(true)} />}
              {!show && <MdVisibilityOff onClick={() => setShow(false)} />}
              <small>0 / 15</small>
              <Link href="#" onClick={() => setOpenModal(true)}>
                ESQUECEU SUA SENHA?
              </Link>
            </div>

            <Button type="submit" className="btn-login" onClick={handleLogin}>
              ENTRAR
            </Button>
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
