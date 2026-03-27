"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileUser from "../components/profileuser/profileuser";
import Banner from "../components/banner/banner";
import Header from "../components/header/header";
import Image, { StaticImageData } from "next/image";
import imgBanner from "@/app/assets/banner01.webp";
import Footer from "../components/footer/footer";
import logoBanner from "@/app/assets/commemoration.png";
import logoBlue from "@/app/assets/logo-agilizai-h.png";
import "react-multi-carousel/lib/styles.css";
import { useAppContext } from "../context/AppContext";

// Defina uma interface para os props do componente Card
interface CardProps {
  image: StaticImageData;
  title: string;
  address: string;
  distance: string;
  rating: string;
  description: string;
  link: string;
}

export default function ProfilePage() {
  const { user, isLoading: loading } = useAppContext();
  const router = useRouter();
  const profileUserData = user
    ? {
        foto_perfil: String(user.foto_perfil || ""),
        name: String(user.name || ""),
        email: String(user.email || ""),
        telefone: String(user.telefone || ""),
        sexo: "",
        data_nascimento: "",
        cep: "",
        cpf: String(user.cpf || ""),
        endereco: String(user.endereco || ""),
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        complemento: "",
        id: String(user.id || ""),
        status: "Ativado",
      }
    : null;

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Função addUser que será passada como prop para o ProfileUser
  const addUser = (_newUser: any) => undefined;

  // Função para monitorar o tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        router.push("/webapp");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [router]);

  return (
    <>
      <Header />
      <Banner
        id="banner"
        className="banner background-gradient relative flex items-center justify-center h-[400px] overflow-hidden"
      >
        <div className="overlay background-gradient absolute h-full top-0 right-0 bottom-0 left-0 bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80"></div>
        <div className="title-banner absolute flex flex-col items-center md:text-center z-10 px-6">
          <div className="mb-6">
            <Image src={logoBanner} alt="Logo banner" width={120} height={120} className="filter brightness-0 invert" />
          </div>
          <h1 className="text-3xl md:text-4xl text-white font-bold mb-4">Minha Conta</h1>
          <p className="text-gray-200 text-lg max-w-2xl">
            Gerencie suas informações pessoais e visualize suas reservas
          </p>
        </div>
        <Image
          src={imgBanner}
          alt="Imagem do banner"
          className="Image-banner object-cover w-full h-full"
          width={400} 
          height={400} 
          priority
        />
      </Banner>
      
      <div className="flex justify-center w-screen relative -mt-20 md:-mt-16 px-4 z-20">
        {loading ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20 p-8 min-w-[300px]">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              <span className="ml-3 text-gray-600">Carregando...</span>
            </div>
          </div>
        ) : (
          <ProfileUser user={profileUserData} addUser={addUser} />
        )}
      </div>
      
      <main className="container mx-auto px-8 py-16 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Bem-vindo de volta!</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Aqui você pode gerenciar todas as suas informações e visualizar suas reservas ativas
          </p>
        </div>
      </main>
      
      <Footer logo={logoBlue} />
    </>
  );
}
