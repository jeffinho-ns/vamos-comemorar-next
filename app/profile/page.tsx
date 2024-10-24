"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation"; // Para redirecionar o usuário
import ProfileUser from "../components/profileuser/profileuser";
import Banner from "../components/banner/banner";
import Header from "../components/header/header";
import Image, { StaticImageData } from "next/image";
import imgBanner from "@/app/assets/banner01.webp";
import Footer from "../components/footer/footer";
import logoBanner from "@/app/assets/commemoration.png";
import "react-multi-carousel/lib/styles.css";


// Defina uma interface para os props do componente Card
interface CardProps {
  image: StaticImageData; // Tipo para imagens estáticas importadas
  title: string;
  address: string;
  distance: string;
  rating: string;
  description: string;
  link: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Para controle de carregamento
  const router = useRouter(); // Instância para o redirecionamento

  // Função para buscar os dados do usuário logado
  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("Token não encontrado. Faça login novamente.");
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("Dados do usuário:", userData);
        setUser(userData);
      } else {
        console.error("Erro ao buscar dados do usuário:", response.statusText);
      }
    } catch (error) {
      console.error("Erro ao fazer a requisição:", error);
    } finally {
      setLoading(false);
    }
  }, [router]); // Adicione router como dependência

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Função addUser que será passada como prop para o ProfileUser
  const addUser = (newUser: any) => {
    console.log("Usuário adicionado:", newUser);
    setUser(newUser);
  };

  // Função para monitorar o tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Redireciona para a página desejada em dispositivos móveis
        router.push("/webapp");
      }
    };

    handleResize(); // Verifica na montagem inicial

    // Adiciona o listener para o redimensionamento da janela
    window.addEventListener("resize", handleResize);

    // Remove o listener ao desmontar o componente
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [router]);

  return (
    <>
      <Header />
      <Banner
        id="banner"
        className="banner background-gradient relative flex items-center justify-center"
      >
        <div className="overlay background-gradient absolute h-4/5 top-0 right-0 bottom-0 left-0"></div>
        <div className="title-banner absolute flex flex-col items-center md:text-center">
          <Image src={logoBanner} alt="Logo banner" width={150} height={150} />
        </div>
        <Image
          src={imgBanner}
          alt="Imagem do banner"
          className="Image-banner object-cover"
        />
      </Banner>
      <div className="flex justify-center w-screen relative bottom-32 md:bottom-20 px-4">
        {loading ? (
          <p>Carregando...</p> // Indicador de carregamento
        ) : (
          <ProfileUser user={user} addUser={addUser} />
        )}
      </div>
      <main className="container pl-8 pr-5 bg-white pb-8"></main>
      <Footer />
    </>
  );
}
