"use client";

import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import {
  MdLocationOn,
  MdInfoOutline,
  MdEvent,
  MdStar,
  MdAccessTime,
  MdPhone,
  MdArrowForward,
} from "react-icons/md";
import { FaBirthdayCake, FaPalette, FaGift } from "react-icons/fa";
import Footer from "../components/footer/footer";
import Header from "../components/header/header";
import imgBanner from "@/app/assets/highline/capa-highline.jpeg";
import "react-multi-carousel/lib/styles.css";
import Carousel from "react-multi-carousel";
import Programacao from "../components/programacao/programacao";
import Profile from "../components/profile/profile";
import styles from "./highline.module.scss";

// Imagens
import newImg1 from "@/app/assets/highline/ambiente-1.jpeg";
import newImg2 from "@/app/assets/highline/ambiente-2.jpeg";
import newImg3 from "@/app/assets/highline/ambiente-3.jpeg";
import newImg4 from "@/app/assets/highline/ambiente-4.jpeg";

import bebida1 from "@/app/assets/highline/bebida-1.jpeg";
import bebida2 from "@/app/assets/highline/bebida-2.jpeg";
import bebida3 from "@/app/assets/highline/bebida-3.jpeg";
import bebida4 from "@/app/assets/highline/bebida-4.jpeg";

import gastro1 from "@/app/assets/highline/gastronomia-1.jpeg";
import gastro2 from "@/app/assets/highline/gastronomia-2.jpeg";
import gastro3 from "@/app/assets/highline/gastronomia-3.jpeg";
import gastro4 from "@/app/assets/highline/gastronomia-4.jpeg";
import logoNew from "@/app/assets/highline/highlinelogo.png";
import logoImage from "@/app/assets/highline/highlinelogo.png";

import icon1 from "@/app/assets/icones/area.png";
import icon2 from "@/app/assets/icones/acessivel.png";
import icon3 from "@/app/assets/icones/estacionamento.png";
import icon4 from "@/app/assets/icones/18.png";
import icon5 from "@/app/assets/icones/mesa.png";

import Modal from "../components/ui/Modal";
import { redirect } from "next/navigation";

interface SectionProps {
  title: string;
  images: StaticImageData[];
  openImage: (img: StaticImageData) => void;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
}

const Highline = () => {
  const [showDescription, setShowDescription] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<StaticImageData | null>(
    null
  );
  const [user, setUser] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // useEffect(() => {
  //   const token = localStorage.getItem('authToken');
  //   if (!token) {
  //     redirect('/login');
  //   }
  // }, []);

  const toggleContent = (content: string) => {
    setShowDescription(content === "sobre");
  };

  const openModal = () => {
    localStorage.setItem("logo", logoNew.src);
    localStorage.setItem("localInfo", "Rua Girassol, 144 - Vila Madalena");
    setModalIsOpen(true);
  };

  const closeModal = () => setModalIsOpen(false);

  const openImage = (img: StaticImageData) => setExpandedImage(img);
  const closeImage = () => setExpandedImage(null);

  const addUser = (user: any) => {
    console.log("Usuário adicionado:", user);
    setUser(user);
  };

  const handleSaveUser = (user: any) => {
    console.log("Salvando usuário:", user);
  };

  // Função para corrigir URL da imagem
  const getValidImageUrl = (imageUrl?: string | null): string => {
    if (!imageUrl || typeof imageUrl !== 'string') {
      return '/placeholder-cardapio.svg';
    }

    const trimmed = imageUrl.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NULL') {
      return '/placeholder-cardapio.svg';
    }

    // Se já é uma URL completa do Cloudinary, retornar como está
    if (trimmed.startsWith('https://res.cloudinary.com')) {
      return trimmed;
    }

    // Se é uma URL antiga (grupoideiaum.com.br), extrair o filename e construir nova URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        // Se é do grupoideiaum ou contém cardapio-agilizaiapp, extrair filename
        if (url.hostname.includes('grupoideiaum.com.br') || url.pathname.includes('/cardapio-agilizaiapp/')) {
          const pathParts = url.pathname.split('/');
          const filename = pathParts[pathParts.length - 1];
          if (filename && filename !== '') {
            return `https://res.cloudinary.com/drjovtmuw/image/upload/v1764862686/cardapio-agilizaiapp/${filename}`;
          }
        }
        // Se é outra URL válida (ex: Unsplash), manter como está
        return trimmed;
      } catch (e) {
        // Se der erro ao parsear URL, tratar como filename
        console.warn("Erro ao parsear URL:", trimmed, e);
      }
    }

    // Se é apenas um filename (com ou sem barra inicial), construir URL completa
    const cleanFilename = trimmed.startsWith('/') ? trimmed.substring(1) : trimmed;
    // Remover qualquer caminho e pegar apenas o último segmento
    const parts = cleanFilename.split('/');
    const lastSegment = parts[parts.length - 1]?.trim();
    
    if (lastSegment && lastSegment !== '' && lastSegment !== 'null' && lastSegment !== 'undefined') {
      return `https://res.cloudinary.com/drjovtmuw/image/upload/v1764862686/cardapio-agilizaiapp/${lastSegment}`;
    }

    return '/placeholder-cardapio.svg';
  };

  // Buscar cardápio do estabelecimento - mesma lógica da página /cardapio/[slug]
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoadingMenu(true);
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_LOCAL ||
          "https://vamos-comemorar-api.onrender.com";
        const API_BASE_URL = `${API_URL}/api/cardapio`;
        
        // 1. Buscar o bar pelo slug
        const barsResponse = await fetch(`${API_BASE_URL}/bars`);
        if (!barsResponse.ok) throw new Error('Erro ao carregar estabelecimentos');
        
        const bars = await barsResponse.json();
        const bar = bars.find((b: any) => b.slug === 'highline');
        
        if (!bar) {
          console.warn('Bar não encontrado pelo slug highline');
          return;
        }

        // 2. Buscar todas as categorias e itens
        const [categoriesResponse, itemsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/categories`),
          fetch(`${API_BASE_URL}/items`)
        ]);

        if (!categoriesResponse.ok || !itemsResponse.ok) {
          throw new Error('Erro ao carregar dados do cardápio');
        }

        const [categories, items] = await Promise.all([
          categoriesResponse.json(),
          itemsResponse.json()
        ]);

        // 3. Filtrar itens pelo barId e apenas itens visíveis
        const normalizedBarId = String(bar.id);
        const barItems = items.filter((item: any) => {
          const matchesBar = String(item.barId) === normalizedBarId;
          const isVisible = item.visible === undefined || item.visible === null || item.visible === 1 || item.visible === true;
          return matchesBar && isVisible;
        });

        // 4. Pegar os primeiros 6 itens e corrigir URLs das imagens
        const itemsWithFixedUrls = barItems.slice(0, 6).map((item: any) => {
          const imageUrl = item.imageUrl || item.imageurl || null;
          return {
            id: item.id,
            name: item.name,
            description: item.description || '',
            price: item.price || 0,
            category: item.category || '',
            imageUrl: getValidImageUrl(imageUrl),
          };
        });
        
        setMenuItems(itemsWithFixedUrls);
      } catch (error) {
        console.error("Erro ao buscar cardápio:", error);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenu();
  }, []);

  return (
    <>
      <Header />

      {/* Banner Section */}
      <div className="relative h-[500px] overflow-hidden">
        <Image
          src={imgBanner}
          alt="High Line Bar"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-800/70 to-gray-900/70"></div>

        {/* Navigation Buttons */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex space-x-4">
            <button
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                showDescription
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 shadow-lg"
                  : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              }`}
              onClick={() => toggleContent("sobre")}
            >
              <MdInfoOutline className="text-xl" />
              <span>Sobre</span>
            </button>
            <button
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                !showDescription
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 shadow-lg"
                  : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              }`}
              onClick={() => toggleContent("eventos")}
            >
              <MdEvent className="text-xl" />
              <span>Eventos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bar Info Section */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/20">
        <div className="container mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left Column - Info */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-800">
                High Line Bar
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MdLocationOn className="text-yellow-500 text-xl" />
                <span className="text-lg">
                  Rua Girassol, 144 - Vila Madalena
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MdStar className="text-yellow-500" />
                  <span>4.8 (2.5k avaliações)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MdAccessTime className="text-blue-500" />
                  <span>Aberto até 02:00</span>
                </div>
              </div>
            </div>

            {/* Middle Column - Logo */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/20">
                <Image
                  src={logoNew}
                  alt="High Line Logo"
                  width={200}
                  height={200}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                <Image
                  src={icon1}
                  width={40}
                  height={40}
                  alt="Área aberta"
                  className="mx-auto mb-2"
                />
                <p className="text-sm font-semibold text-gray-800">
                  Área aberta
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl text-center">
                <Image
                  src={icon2}
                  width={40}
                  height={40}
                  alt="Acessível"
                  className="mx-auto mb-2"
                />
                <p className="text-sm font-semibold text-gray-800">Acessível</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl text-center">
                <Image
                  src={icon3}
                  width={40}
                  height={40}
                  alt="Estacionamento"
                  className="mx-auto mb-2"
                />
                <p className="text-sm font-semibold text-gray-800">
                  Estacionamento
                </p>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl text-center">
                <Image
                  src={icon4}
                  width={40}
                  height={40}
                  alt="+18"
                  className="mx-auto mb-2"
                />
                <p className="text-sm font-semibold text-gray-800">+18</p>
              </div>
            </div>
          </div>

          {/* Reserve Button */}
          <div className="text-center mt-8">
            <button
              onClick={openModal}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🎉 Fazer Reserva
            </button>
          </div>
        </div>
      </div>

      {/* Description Section - Duas colunas com carrossel */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
        <div className="container mx-auto px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Sobre o High Line Bar
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            {/* Coluna Esquerda - Texto */}
            <div>
              <p className="text-gray-700 text-lg leading-relaxed">
                O High Line Bar oferece uma experiência única de interação com o
                público, é um ponto de encontro moderno entre os jovens e adultos,
                um lugar perfeito para happy hour, aniversários ou eventos
                corporativos. A decoração e estilo seguem o modelo dos mais
                diversos hostels espalhados pelo mundo. São quatro ambientes:
                calçada, onde passa a sensação de estar em uma cidade de interior;
                piso térreo, que conta com uma decoração moderna; rooftop, área
                externa com uma linda vista que, aos fins de semana, conta com uma
                roda de samba para agitar as tardes; além da balada, para
                finalizar a noite com um ótimo clima de paquera.
              </p>
            </div>
            {/* Coluna Direita - Carrossel de Imagens */}
            <div className="relative">
              <Carousel
                additionalTransfrom={0}
                arrows
                autoPlaySpeed={3000}
                centerMode={false}
                className=""
                containerClass="container-with-dots"
                dotListClass=""
                draggable
                focusOnSelect={false}
                infinite
                itemClass=""
                keyBoardControl
                minimumTouchDrag={80}
                pauseOnHover
                renderArrowsWhenDisabled={false}
                renderButtonGroupOutside={false}
                renderDotsOutside={false}
                responsive={{
                  desktop: {
                    breakpoint: { max: 3000, min: 1024 },
                    items: 1,
                  },
                  tablet: {
                    breakpoint: { max: 1024, min: 464 },
                    items: 1,
                  },
                  mobile: {
                    breakpoint: { max: 464, min: 0 },
                    items: 1,
                  },
                }}
                rewind={false}
                rewindWithAnimation={false}
                rtl={false}
                shouldResetAutoplay
                showDots={true}
                sliderClass=""
                slidesToSlide={1}
                swipeable
              >
                {[newImg1, newImg2, newImg3, newImg4, gastro1, gastro2, gastro3, gastro4, bebida1, bebida2, bebida3, bebida4].map((img, index) => (
                  <div key={index} className="px-2">
                    <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
                      <Image
                        src={img}
                        alt={`Imagem ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                ))}
              </Carousel>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section - Aparece na frente com z-index alto */}
      {!showDescription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="relative min-h-screen bg-white py-16">
            <div className="container mx-auto px-8">
              <button
                onClick={() => toggleContent("sobre")}
                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors z-10"
              >
                ✕
              </button>
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Programação de Eventos
              </h2>
              <Programacao
                barId={1}
                logo={logoImage.src}
                location="Rua Girassol, 144 - Vila Madalena"
                establishmentName="High Line"
              />
            </div>
          </div>
        </div>
      )}

      {/* Gallery Sections */}
      {showDescription && (
        <div className="bg-white py-16">
          <div className="container mx-auto px-8 space-y-12">
            <Section
              title="Ambientes"
              images={[newImg1, newImg2, newImg3, newImg4]}
              openImage={openImage}
            />
            <Section
              title="Gastronomia"
              images={[gastro1, gastro2, gastro3, gastro4]}
              openImage={openImage}
            />
            <Section
              title="Bebidas"
              images={[bebida1, bebida2, bebida3, bebida4]}
              openImage={openImage}
            />
          </div>
        </div>
      )}

      {/* Cardápio Section */}
      {showDescription && (
        <div className="bg-gradient-to-br from-gray-50 to-white py-16">
          <div className="container mx-auto px-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Cardápio
            </h2>
            {loadingMenu ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando cardápio...</p>
              </div>
            ) : menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                  >
                    {item.imageUrl && item.imageUrl !== '/placeholder-cardapio.svg' ? (
                      <div className="relative h-48 w-full">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={(e) => {
                            console.error("Erro ao carregar imagem:", item.imageUrl);
                            e.currentTarget.src = '/placeholder-cardapio.svg';
                          }}
                          unoptimized={item.imageUrl.startsWith('https://res.cloudinary.com')}
                        />
                      </div>
                    ) : (
                      <div className="relative h-48 w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Sem imagem</span>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-yellow-600">
                          R$ {Number(item.price).toFixed(2).replace(".", ",")}
                        </span>
                        <Link href="/cardapio/highline">
                          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors">
                            Ver mais
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  Cardápio em breve. Em caso de dúvidas, entre em contato.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decore seu Aniversário Section */}
      {showDescription && (
        <div className="bg-gradient-to-br from-slate-900 via-orange-900/20 to-slate-900 py-16 relative overflow-hidden">
          {/* Efeito de fundo decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-8 relative z-10">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-6">
                <FaBirthdayCake className="text-5xl md:text-6xl text-orange-400" />
                <h2 className="text-4xl md:text-5xl font-bold text-white">
                  Decore seu{" "}
                  <span className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Aniversário
                  </span>
                </h2>
                <FaPalette className="text-5xl md:text-6xl text-orange-400" />
              </div>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-4">
                Comemore em grande estilo! Transforme sua festa em um momento
                mágico e inesquecível
              </p>
              <p className="text-lg text-orange-300 font-semibold">
                Escolha um de nossos bares e deixe a decoração por nossa conta! 🎉
              </p>
            </div>

            {/* Cards de Decoração */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
              {[
                {
                  name: "Decoração Pequena 1",
                  price: 200.0,
                  image: "/agilizai/kit-1.jpg",
                  description:
                    "Kit básico com painel, balões e acessórios para festas íntimas",
                  includes: ["Painel decorativo", "Balões coloridos", "Bandeja de doces"],
                },
                {
                  name: "Decoração Média 3",
                  price: 250.0,
                  image: "/agilizai/kit-3.jpg",
                  description: "Kit médio com mais elementos e decoração elaborada",
                  includes: ["Painel grande", "Balões em quantidade", "Bandejas decoradas"],
                },
                {
                  name: "Decoração Grande 5",
                  price: 300.0,
                  image: "/agilizai/kit-5.jpg",
                  description: "Kit grande para festas com muitos convidados",
                  includes: ["Painel grande", "Muitos balões", "Várias bandejas"],
                },
              ].map((option, index) => (
                <div
                  key={option.name}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 hover:border-orange-500 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/30 group"
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={option.image}
                      alt={option.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">
                      {option.name}
                    </h3>
                    <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                      {option.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                        <FaGift className="text-xs" />
                        Inclui:
                      </p>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {option.includes.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-2xl font-bold text-orange-400 mb-4">
                      R$ {option.price.toFixed(2).replace(".", ",")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Seção de Painéis do Estoque */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                  <FaGift className="text-orange-400" />
                  Escolha um painel do nosso estoque
                </h3>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  Temos diversos painéis disponíveis para tornar sua festa ainda
                  mais especial
                </p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
                {[
                  "/agilizai/painel-1.jpg",
                  "/agilizai/painel-2.jpg",
                  "/agilizai/painel-3.jpg",
                  "/agilizai/painel-4.jpg",
                  "/agilizai/painel-5.jpg",
                  "/agilizai/painel-6.jpg",
                  "/agilizai/painel-7.jpg",
                  "/agilizai/painel-8.jpg",
                  "/agilizai/painel-9.jpg",
                  "/agilizai/painel-10.jpg",
                ].map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-full cursor-pointer border-2 border-slate-600 hover:border-orange-500 transition-all duration-300 transform hover:scale-110 group"
                  >
                    <Image
                      src={image}
                      alt={`Painel ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 20vw, 20vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      unoptimized={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border-2 border-orange-500/50 rounded-2xl p-8 mb-8 max-w-3xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Pronto para comemorar em grande estilo? 🎊
                </h3>
                <p className="text-lg text-gray-300 mb-6">
                  Escolha sua decoração favorita e reserve seu aniversário em um
                  de nossos bares parceiros. Transforme sua festa em um momento
                  inesquecível!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/decoracao-aniversario">
                    <button className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center gap-3 mx-auto sm:mx-0">
                      <FaPalette size={24} />
                      Ver Todas as Opções
                      <MdArrowForward size={24} />
                    </button>
                  </Link>
                  <Link href="/reserva-aniversario">
                    <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 border-2 border-white/30 backdrop-blur-sm flex items-center gap-3 mx-auto sm:mx-0">
                      <FaBirthdayCake size={24} />
                      Fazer Minha Reserva
                      <MdArrowForward size={24} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Localização
          </h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.8531229789736!2d-46.70965078450384!3d-23.504566264570394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cef8c55b0f2e7b%3A0x6b9156a1e51233b3!2sLargo%20da%20Matriz%20de%20Nossa%20Senhora%20do%20%C3%93%2C%20145%20-%20Freguesia%20do%20%C3%93%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2002925-040!5e0!3m2!1sen!2sbr!4v1625157527756!5m2!1sen!2sbr"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              className="w-full"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="container mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Entre em Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
              <MdPhone className="text-3xl text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Telefone</h3>
              <p className="text-gray-300">(11) 99999-9999</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
              <MdLocationOn className="text-3xl text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Endereço</h3>
              <p className="text-gray-300">
                Rua Girassol, 144
                <br />
                Vila Madalena
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
              <MdAccessTime className="text-3xl text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Horário</h3>
              <p className="text-gray-300">
                Seg - Dom
                <br />
                18h às 02h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {expandedImage && (
        <Modal
          isOpen={!!expandedImage}
          onRequestClose={closeImage}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-4 max-w-4xl w-full mx-4"
          overlayClassName="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
        >
          <div className="relative">
            <button
              onClick={closeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-10"
            >
              ✕
            </button>
            <Image
              src={expandedImage}
              alt="Expanded"
              className="w-full h-auto rounded-xl"
              width={800}
              height={600}
            />
          </div>
        </Modal>
      )}

      {/* Profile Modal */}
      <Profile
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        addUser={addUser}
        user={user}
        userType={user?.type}
        onSaveUser={handleSaveUser}
      />

      <Footer logo={logoImage} />
    </>
  );
};

// Section Component - Galeria ajustada para ficar menor e mais bonita
const Section: React.FC<SectionProps> = ({ title, images, openImage }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-800 text-center">{title}</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
      {images.map((img, index) => (
        <div
          key={index}
          className="group cursor-pointer overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          onClick={() => openImage(img)}
        >
          <Image
            src={img}
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      ))}
    </div>
  </div>
);

export default Highline;
