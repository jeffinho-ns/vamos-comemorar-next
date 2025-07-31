"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Banner from "./components/banner/banner";
import Header from "./components/header/header";
import Image, { StaticImageData } from "next/image";
import imgBanner from "@/app/assets/banner01.webp";
import Form from "./components/form/form";
import Select from "./components/select/select";
import Input from "./components/input/input";
import Carousel from "react-multi-carousel";
import img01 from "@/app/assets/justino/capa-justino.png";
import img02 from "@/app/assets/oh-fregues.jpg";
import img03 from "@/app/assets/highline/capa-highline.jpeg";
import Footer from "./components/footer/footer";
import { MdLocationOn, MdRestaurant, MdSearch, MdLocationPin, MdLocationCity, MdStar } from "react-icons/md";
import logoBanner from "@/app/assets/commemoration.png";
import Link from "next/link";
import "react-multi-carousel/lib/styles.css";

import places from "@/app/data/places";
interface CardProps {
  image: StaticImageData;
  title: string;
  address: string;
  distance: string;
  rating: string;
  description: string;
  link: string;
  state: string;
  date: string;
}

export default function Home() {
  const [filteredPlaces, setFilteredPlaces] = useState<CardProps[]>(places);
  const [selectedState, setSelectedState] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const router = useRouter();
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        router.push("/webapp");
        router.refresh();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
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

  useEffect(() => {
    let updatedPlaces = places;
  
    if (selectedState) {
      updatedPlaces = updatedPlaces.filter(place => place.state === selectedState);
    }
  
    if (searchTerm) {
      updatedPlaces = updatedPlaces.filter(place => 
        place.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    if (selectedDate) {
      updatedPlaces = updatedPlaces.filter(place => place.date === selectedDate);
    }
  
    setFilteredPlaces(updatedPlaces);
  }, [selectedState, searchTerm, selectedDate]);
  
  const filterByState = (event: any) => {
    setSelectedState(event);
  };
  
  const filterPlacesByTitle = (event: any) => {
    setSearchTerm(event);
  };
  
  const filterPlacesByDate = (event: any) => {
    setSelectedDate(event);
  };

  const Card = ({ image, title, address, distance, rating, description, link }: CardProps) => (
    <motion.div
      className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden mx-4 mt-16 card-container border border-gray-200/20 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="relative w-full h-48 -mt-16">
        <Image
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover rounded-t-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-t-2xl"></div>
        <Link href={link}>
          <button className="absolute bottom-4 right-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
            Reservar
          </button>
        </Link>
      </div>
      <div className="p-6 mt-8">
        <h2 className="text-xl font-bold mb-3 text-gray-800">{title}</h2>
        <div className="space-y-2 mb-4">
          <p className="text-gray-600 flex items-center gap-2">
            <MdLocationOn className="text-yellow-500" />
            {address}
          </p>
          <p className="text-gray-500 text-sm">{distance}</p>
        </div>
        <div className="flex items-center mb-4">
          <div className="flex items-center gap-2">
            <MdRestaurant className="text-gray-400" />
            <MdStar className="text-yellow-500 text-xl" />
            <span className="text-gray-800 font-semibold ml-1">{rating}</span>
          </div>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );

  return (
    <>
      <Header />
      <Banner
        id="banner"
        className="banner background-gradient h-screen relative flex items-center justify-center overflow-hidden"
      >
        <div className="overlay background-gradient absolute h-full top-0 right-0 bottom-0 left-0 bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80"></div>
        <div className="title-banner absolute flex flex-col items-center md:text-center z-10 px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Image src={logoBanner} alt="Logo banner" width={180} height={180} className="mb-6" />
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-6xl text-white text-center font-bold mb-6 leading-tight"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Sua comemoração de um jeito que você nunca imaginou!
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-gray-200 text-center max-w-3xl leading-relaxed"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Reunimos os melhores estabelecimentos e benefícios para facilitar a
            sua comemoração, quanto mais convidados você levar, mais benefícios
            receberá.
          </motion.p>
        </div>
        <Image
          src={imgBanner}
          alt="Imagem do banner"
          className="Image-banner object-cover h-full w-full"
          priority
        />
      </Banner>
      
      <div className="flex justify-center w-screen relative -mt-32 md:-mt-20 px-4 z-20">
        <Form
          id="form-search"
          className="md:w-4/5 lg:w-3/5 border-0 form-search bg-white/95 backdrop-blur-sm px-8 py-6 rounded-2xl shadow-2xl border border-gray-200/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center w-full">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl mr-4">
                <MdLocationPin className="text-white text-xl" />
              </div>
              <Select
                value={selectedState}
                id="estado"
                className="p-3 w-full rounded-xl border border-gray-200/30 bg-white/80 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                onChange={filterByState}
              >
                <option>Selecione o estado</option>
                <option value="rj">Rio de Janeiro</option>
                <option value="sp">São Paulo</option>
              </Select>
            </div>
            <div className="flex items-center w-full">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl mr-4">
                <MdLocationCity className="text-white text-xl" />
              </div>
              <Input
                type="date"
                value={selectedDate}
                id="data"
                className="p-3 w-full rounded-xl border border-gray-200/30 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                onChange={(event:any) => filterPlacesByDate(event)}
              />
            </div>
            <div className="flex items-center w-full relative">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl mr-4">
                <MdSearch className="text-white text-xl" />
              </div>
              <Input
                placeholder="Buscar por nome"
                type="text"
                value={searchTerm}
                id="search"
                className="p-3 w-full rounded-xl border border-gray-200/30 bg-white/80 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                onChange={filterPlacesByTitle}
              />
            </div>
          </div>
        </Form>
      </div>
      
      <main className="container mx-auto px-8 py-16 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Estabelecimentos em Destaque</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Descubra os melhores lugares para suas comemorações com benefícios exclusivos
          </p>
        </div>
        
        <Carousel responsive={responsive} className="grid">
          {filteredPlaces.length > 0 ? filteredPlaces.map((place) => (
            <Card
              key={place.title}
              image={place.image}
              title={place.title}
              address={place.address}
              distance={place.distance}
              rating={place.rating}
              description={place.description}
              link={place.link}
              state={place.state}
              date={place.date}
            />
          )) : (
            <div className="col-span-full flex items-center justify-center py-16">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Nenhum estabelecimento encontrado</h3>
                <p className="text-gray-600">Tente ajustar os filtros de busca</p>
              </div>
            </div>
          )}
        </Carousel>
      </main>

      <Footer />
    </>
  );
}
