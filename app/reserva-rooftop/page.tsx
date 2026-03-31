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

import Modal from "../components/ui/Modal";

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

const ReservaRooftopPage = () => {
  const [showDescription, setShowDescription] = useState(true);
  const [expandedImage, setExpandedImage] = useState<StaticImageData | null>(
    null,
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  const toggleContent = (content: string) => {
    setShowDescription(content === "sobre");
  };

  const openImage = (img: StaticImageData) => setExpandedImage(img);
  const closeImage = () => setExpandedImage(null);

  const getValidImageUrl = (imageUrl?: string | null): string => {
    if (!imageUrl || typeof imageUrl !== "string") {
      return "/placeholder-cardapio.svg";
    }

    const trimmed = imageUrl.trim();
    if (
      trimmed === "" ||
      trimmed === "null" ||
      trimmed === "undefined" ||
      trimmed === "NULL"
    ) {
      return "/placeholder-cardapio.svg";
    }

    if (trimmed.startsWith("https://res.cloudinary.com")) {
      return trimmed;
    }

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      try {
        const url = new URL(trimmed);
        if (
          url.hostname.includes("grupoideiaum.com.br") ||
          url.pathname.includes("/cardapio-agilizaiapp/")
        ) {
          const pathParts = url.pathname.split("/");
          const filename = pathParts[pathParts.length - 1];
          if (filename && filename !== "") {
            return `https://res.cloudinary.com/drjovtmuw/image/upload/v1764862686/cardapio-agilizaiapp/${filename}`;
          }
        }
        return trimmed;
      } catch (e) {
        console.warn("Erro ao parsear URL:", trimmed, e);
      }
    }

    const cleanFilename = trimmed.startsWith("/") ? trimmed.substring(1) : trimmed;
    const parts = cleanFilename.split("/");
    const lastSegment = parts[parts.length - 1]?.trim();

    if (
      lastSegment &&
      lastSegment !== "" &&
      lastSegment !== "null" &&
      lastSegment !== "undefined"
    ) {
      return `https://res.cloudinary.com/drjovtmuw/image/upload/v1764862686/cardapio-agilizaiapp/${lastSegment}`;
    }

    return "/placeholder-cardapio.svg";
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoadingMenu(true);
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_LOCAL ||
          "https://vamos-comemorar-api.onrender.com";
        const API_BASE_URL = `${API_URL}/api/cardapio`;

        const barsResponse = await fetch(`${API_BASE_URL}/bars`);
        if (!barsResponse.ok)
          throw new Error("Erro ao carregar estabelecimentos");

        const bars = await barsResponse.json();
        const bar = bars.find(
          (b: any) =>
            b.slug === "reservaroftop" ||
            b.slug === "reserva-rooftop" ||
            b.slug === "reserva_rooftop",
        );

        if (!bar) {
          console.warn(
            "Bar não encontrado pelo slug (reservaroftop/reserva-rooftop)",
          );
          return;
        }

        const [categoriesResponse, itemsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/categories`),
          fetch(`${API_BASE_URL}/items`),
        ]);

        if (!categoriesResponse.ok || !itemsResponse.ok) {
          throw new Error("Erro ao carregar dados do cardápio");
        }

        const items = await itemsResponse.json();

        const normalizedBarId = String(bar.id);
        const barItems = items.filter((item: any) => {
          const matchesBar = String(item.barId) === normalizedBarId;
          const isVisible =
            item.visible === undefined ||
            item.visible === null ||
            item.visible === 1 ||
            item.visible === true;
          return matchesBar && isVisible;
        });

        const itemsWithFixedUrls = barItems.slice(0, 6).map((item: any) => {
          const imageUrl = item.imageUrl || item.imageurl || null;
          return {
            id: item.id,
            name: item.name,
            description: item.description || "",
            price: item.price || 0,
            category: item.category || "",
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

      <div className="relative h-[500px] overflow-hidden">
        <Image
          src={imgBanner}
          alt="Reserva Rooftop"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-800/70 to-gray-900/70"></div>

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

      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/20">
        <div className="container mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-800">
                Reserva Rooftop
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MdLocationOn className="text-yellow-500 text-xl" />
                <span className="text-lg">
                  Em frente ao portão 2 - Rua Marc Chagal, Parque, Jardim das
                  Perdizes, São Paulo - SP
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MdStar className="text-yellow-500" />
                  <span>4.8 (1.9k avaliações)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MdAccessTime className="text-blue-500" />
                  <span>Aberto até 02:00</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/20">
                <Image
                  src={logoNew}
                  alt="Reserva Rooftop Logo"
                  width={200}
                  height={200}
                  className="rounded-xl"
                />
              </div>
            </div>

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

          <div className="text-center mt-8">
            <Link href="/reservar/reserva-rooftop">
              <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                🎉 Fazer Reserva
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
        <div className="container mx-auto px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Sobre o Reserva Rooftop
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            <div>
              <p className="text-gray-700 text-lg leading-relaxed">
                No Reserva Rooftop, combinamos gastronomia e uma atmosfera
                sofisticada com vista privilegiada, criando o cenário perfeito
                para comemorações, encontros e experiências inesquecíveis.
              </p>
            </div>
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
                  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
                  tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
                  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
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
                {[
                  newImg1,
                  newImg2,
                  newImg3,
                  newImg4,
                  gastro1,
                  gastro2,
                  gastro3,
                  gastro4,
                  bebida1,
                  bebida2,
                  bebida3,
                  bebida4,
                ].map((img, index) => (
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
                barId={3}
                logo={logoImage.src}
                location="Jardim das Perdizes, São Paulo - SP"
                establishmentName="Reserva Rooftop"
              />
            </div>
          </div>
        </div>
      )}

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
                    {item.imageUrl &&
                    item.imageUrl !== "/placeholder-cardapio.svg" ? (
                      <div className="relative h-48 w-full">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={(e) => {
                            console.error(
                              "Erro ao carregar imagem:",
                              item.imageUrl,
                            );
                            e.currentTarget.src = "/placeholder-cardapio.svg";
                          }}
                          unoptimized={item.imageUrl.startsWith(
                            "https://res.cloudinary.com",
                          )}
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
                        <Link href="/cardapio/reserva-rooftop">
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

      <Footer logo={logoImage} />
    </>
  );
};

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

export default ReservaRooftopPage;
