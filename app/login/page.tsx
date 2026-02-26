"use client";

import Image from "next/image";
import logoWhite from "../../app/assets/logo-agilizai-h.png";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdVisibility, MdVisibilityOff, MdHelp } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import Link from "next/link";

export default function Login() {
  const [show, setShow] = useState(false);
  const [emailCpf, setEmailCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const validInputs = useMemo(() => {
    return emailCpf.length > 0 && password.length > 0;
  }, [emailCpf, password]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  // Carregar credenciais salvas quando o componente montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmailCpf = localStorage.getItem("rememberedEmailCpf");
      const savedPassword = localStorage.getItem("rememberedPassword");
      const savedRememberMe = localStorage.getItem("rememberMe") === "true";
      
      if (savedEmailCpf && savedPassword && savedRememberMe) {
        setEmailCpf(savedEmailCpf);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    }
  }, []);

  // Salvar ou remover credenciais quando o checkbox mudar
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (checked) {
      if (emailCpf && password) {
        localStorage.setItem("rememberedEmailCpf", emailCpf);
        localStorage.setItem("rememberedPassword", password);
        localStorage.setItem("rememberMe", "true");
      }
    } else {
      localStorage.removeItem("rememberedEmailCpf");
      localStorage.removeItem("rememberedPassword");
      localStorage.removeItem("rememberMe");
    }
  };

  // Salvar credenciais quando o login for bem-sucedido e o checkbox estiver marcado
  const saveCredentialsIfRemembered = () => {
    if (rememberMe && emailCpf && password) {
      localStorage.setItem("rememberedEmailCpf", emailCpf);
      localStorage.setItem("rememberedPassword", password);
      localStorage.setItem("rememberMe", "true");
    }
  };

  // Handler para tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && validInputs && !loginLoading) {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    if (!validInputs) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access: emailCpf,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.userId) {
        // Salvar credenciais se "lembrar-me" estiver marcado
        saveCredentialsIfRemembered();
        
        // Armazena no localStorage
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("role", data.role);
        if (data.nome) {
          localStorage.setItem("userName", data.nome);
        }
        // Salvar email do usuário logado
        if (emailCpf && emailCpf.includes('@')) {
          localStorage.setItem("userEmail", emailCpf);
        }
        if (data.promoterId) {
          localStorage.setItem("promoterId", data.promoterId);
        } else {
          localStorage.removeItem("promoterId");
        }
        if (data.promoterCodigo) {
          localStorage.setItem("promoterCodigo", data.promoterCodigo);
        } else {
          localStorage.removeItem("promoterCodigo");
        }
      
        // Armazena nos cookies para o middleware ter acesso
        document.cookie = `authToken=${data.token}; path=/`;
        document.cookie = `role=${data.role}; path=/`;
        if (data.promoterCodigo) {
          document.cookie = `promoterCodigo=${encodeURIComponent(data.promoterCodigo)}; path=/`;
        } else {
          document.cookie = `promoterCodigo=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      
        // Redirecionamento inteligente com base no email ou role
        // Emails que devem ir direto para /admin
        const adminEmails = [
          'analista@reserva.com',
          'analista@seujustino.com',
          'analista@pracinha.com',
          'analista.mkt03@ideiaum.com.br',
          'gerente@highlinebar.com.br',
          'regianebrunno@gmail.com',
          'franciely.mendes@ideiaum.com.br',
          'recepcao@seujustino.com.br',
          'recepcao@pracinhadoseujustino.com.br',
          'caixasjm@seujustino.com.br',
          'gerente.sjm@seujustino.com.br',
          'subgerente.sjm@seujustino.com.br'
        ];
        
        const userEmail = emailCpf.toLowerCase().trim();
        
        if (adminEmails.includes(userEmail)) {
          router.push('/admin');
          return;
        }
        
        // Redirecionamento padrão com base no role
        switch (data.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'gerente':
            // Gerentes também vão para /admin (não existe /gerente)
            router.push('/admin');
            break;
          case 'recepção':
            router.push('/admin');
            break;
          case 'promoter':
          case 'promoter-list':
            if (data.promoterCodigo) {
              router.push(`/promoter/${data.promoterCodigo}/dashboard`);
            } else {
              router.push('/promoter');
            }
            break;
          case 'cliente':
            router.push('/cliente');
            break;
          default:
            router.push('/');
        }
      } else {
        setError(data.message || "Credenciais inválidas.");
      }
    } catch (error) {
      setError("Erro ao tentar fazer login. Tente novamente.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-6">
        <div className="flex justify-center">
          <Link href="/">
            <Image src={logoWhite} alt="Logo" className="h-16 w-auto" />
          </Link>
        </div>

        {/* Documentation Link */}
        <div className="text-center">
          <Link 
            href="/documentacao" 
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
          >
            <MdHelp size={16} />
            <span>📚 Acessar Documentação</span>
          </Link>
        </div>

        {openModal && (
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            Modal de recuperação de senha
          </div>
        )}

        <form 
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (validInputs && !loginLoading) {
              handleLogin();
            }
          }}
        >
          <input
            type="text"
            placeholder="Email / CPF"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={emailCpf}
            onChange={(e) => {
              setEmailCpf(e.target.value);
              // Atualizar credenciais salvas se lembrar-me estiver marcado
              if (rememberMe && password) {
                localStorage.setItem("rememberedEmailCpf", e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
          />

          <div className="relative">
            <input
              type={show ? "text" : "password"}
              placeholder="Senha"
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Atualizar credenciais salvas se lembrar-me estiver marcado
                if (rememberMe && emailCpf) {
                  localStorage.setItem("rememberedPassword", e.target.value);
                }
              }}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute top-3 right-3 text-gray-600"
            >
              {show ? <MdVisibility size={20} /> : <MdVisibilityOff size={20} />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
  <label className="flex items-center gap-2 cursor-pointer">
    <div className="relative">
      <input
        type="checkbox"
        className="sr-only peer"
        id="rememberMe"
        checked={rememberMe}
        onChange={(e) => handleRememberMeChange(e.target.checked)}
      />
      <div className={`w-10 h-5 rounded-full transition-colors ${
        rememberMe ? "bg-blue-600" : "bg-gray-300"
      }`}></div>
      <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform ${
        rememberMe ? "translate-x-5" : ""
      }`}></div>
    </div>
    <span className="text-gray-700 select-none">Lembrar-me</span>
  </label>

  <button
    type="button"
    className="text-blue-600 underline"
    onClick={() => setOpenModal(true)}
  >
    Esqueceu sua senha?
  </button>
</div>

          <button
            type="submit"
            className={`w-full py-3 rounded-lg text-white font-bold ${
              validInputs
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={loginLoading || !validInputs}
          >
            {loginLoading ? "Entrando..." : "Entrar"}
          </button>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </form>

        <div className="space-y-2">
          <button
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg p-3 hover:bg-gray-100"
            onClick={() => alert("Login com Google ainda não implementado")}
          >
            <FcGoogle size={22} /> Entrar com Google
          </button>
          <button
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg p-3 hover:bg-gray-100"
            onClick={() => alert("Login com Facebook ainda não implementado")}
          >
            <FaFacebook size={22} color="#1877F2" /> Entrar com Facebook
          </button>
        </div>

        <div className="text-center text-sm pt-4">
          <p>
            Ainda não tem uma conta?{" "}
            <Link href="/register" className="text-blue-600 underline">
              Cadastrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
