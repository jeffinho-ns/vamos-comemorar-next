"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Para redirecionar o usuário
import { motion } from "framer-motion";
import Banner from "./components/banner/banner";
import Header from "./components/header/header";
import Image from "next/image";
import imgBanner from "@/app/assets/banner01.webp";
import Form from "./components/form/form";
import Select from "./components/select/select";
import Input from "./components/input/input";
import Carousel from "react-multi-carousel";
import img01 from "@/app/assets/justino/capa-justino.png";
import img02 from "@/app/assets/oh-fregues.jpg";
import img03 from "@/app/assets/highline/capa-highline.jpeg";
import Footer from "./components/footer/footer";
import { MdLocationOn, MdRestaurant } from "react-icons/md";
import logoBanner from "@/app/assets/commemoration.png";
import { MdLocationPin, MdLocationCity, MdSearch } from "react-icons/md";
import Link from "next/link";
import "react-multi-carousel/lib/styles.css";

export default function Home() {
  const [showSecondCarousel, setShowSecondCarousel] = useState(false);
  const router = useRouter(); // Instancia para o redirecionamento

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

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 3000 },
      items: 5,
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  };

  const Card = ({ image, title, address, distance, rating, description, link }) => (
    <motion.div
      className="relative bg-white rounded-lg shadow-md overflow-hidden mx-4 mt-16 card-container"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative w-full h-48 -mt-16">
        <Image
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-md"
        />
        <Link href={link}>
          <button className="card-button">Reservar</button>
        </Link>
      </div>
      <div className="p-4 mt-8">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-gray-700 mb-2">{address}</p>
        <p className="text-gray-600 mb-2">{distance}</p>
        <div className="flex items-center mb-2">
          <div className="flex items-center mr-4">
            <MdLocationOn className="text-gray-600 mr-1" />
            <MdRestaurant className="text-gray-600 mr-1" />
            <span className="text-yellow-500 text-xl">★</span>
            <span className="ml-2 text-gray-800">{rating}</span>
          </div>
        </div>
        <p className="text-gray-700 text-sm">{description}</p>
      </div>
    </motion.div>
  );

  return (
    <>
      <Header />
      <Banner
        id="banner"
        className="banner background-gradient h-full relative flex items-center justify-center"
      >
        <div className="overlay background-gradient absolute h-4/5 top-0 right-0 bottom-0 left-0"></div>
        <div className="title-banner absolute flex flex-col items-center md:text-center">
          <Image src={logoBanner} alt="Logo banner" width={150} height={150} />
          <h1 className="text-3xl text-white text-center">
            Sua comemoração de um jeito que você nunca imaginou!
          </h1>
          <p className="text-lg text-white text-center">
            Reunimos os melhores estabelecimentos e benefícios para facilitar a
            sua comemoração, quanto mais convidados você levar, mais benefícios
            receberá.
          </p>
        </div>
        <Image
          src={imgBanner}
          alt="Imagem do banner"
          className="Image-banner object-cover h-full"
        />
      </Banner>
      <div className="flex justify-center w-screen relative bottom-32 bottom-1/4 md:bottom-20 px-4">
        <Form
          id="form-search"
          className="md:w-3/5 border-b-0 form-search bg-white px-6 py-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="flex items-center w-full my-2">
              <MdLocationPin className="text-gray-600 text-3xl" />
              <Select
                value=""
                id="estado"
                className="p-2 w-full state"
                onChange={() => {}}
              >
                <option>Selecione o estado</option>
                <option value="rio de janeiro">Rio de Janeiro</option>
                <option value="sao paulo">São Paulo</option>
              </Select>
            </div>
            <div className="flex items-center w-full">
              <MdLocationCity className="text-gray-600 text-3xl" />
              <Input
                type="date"
                value=""
                id="data"
                className="p-2 w-full data"
              />
            </div>
            <div className="flex items-center w-full relative">
              <MdSearch className="text-blue-600 text-3xl absolute text-gray-700 right-0" />
              <Input
                placeholder="Buscar por nome"
                type="text"
                value=""
                id="data"
                className="bg-gray-300 p-2 rounded-lg w-full border-blue-600 data"
              />
            </div>
          </div>
        </Form>
      </div>
      <main className="container pl-8 pr-5 bg-white pb-8">
        <Carousel responsive={responsive} className="grid">
          <Card
            image={img01}
            title="Seu Justino Tatuapé"
            address="Rua Azevedo Soares, 940"
            distance="11.5km"
            rating="4.9 (2.7K)"
            description="O Justino é um bar aconchegante, referência de agito, drinks e ótimos petiscos. A Casa possui área interna, com palco e pista, para receber DJs e shows ao vivo dos mais variados estilos musicais."
            link="/justino"
          />
          <Card
            image={img02}
            title="Oh Fregues"
            address="Largo da Matriz de Nossa Senhora do Ó, 145"
            distance="8.2km"
            rating="4.8 (1.2K)"
            description="O Oh Fregues é um ponto de encontro clássico, com um ambiente descontraído e drinks exclusivos. Venha conferir!"
            link="/ohfregues"
          />
          <Card
            image={img03}
            title="High Line Bar"
            address="Rua Girassol, 144 - Vila madalena"
            distance="5.9km"
            rating="4.7 (3.5K)"
            description="Um lugar perfeito para relaxar e curtir boa música ao vivo. High Line bar oferece uma experiência única."
            link="/highline"
          />
        </Carousel>
        {showSecondCarousel && (
          <Carousel responsive={responsive} className="grid mt-8">
            <Card
              image={img01}
              title="Cervejaria da Esquina"
              address="Rua das Flores, 789"
              distance="7.4km"
              rating="4.6 (900)"
              description="A Cervejaria da Esquina oferece uma variedade de cervejas artesanais em um ambiente acolhedor."
              link="/cervejaria-da-esquina"
            />
            <Card
              image={img01}
              title="Pub do João"
              address="Avenida Paulista, 1010"
              distance="9.1km"
              rating="4.9 (1.5K)"
              description="O Pub do João é conhecido por sua vasta seleção de cervejas importadas e uma atmosfera animada."
              link="/pub-do-joao"
            />
            <Card
              image={img01}
              title="Choperia da Vila"
              address="Rua das Acácias, 111"
              distance="6.8km"
              rating="4.5 (2.1K)"
              description="Na Choperia da Vila, você encontra os melhores chopes da região e uma culinária de dar água na boca."
              link="/choperia-da-vila"
            />
          </Carousel>
        )}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setShowSecondCarousel(true)}
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            Mostrar mais
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
