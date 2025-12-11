"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Header from "./components/header/header";
import Footer from "./components/footer/footer";
// Importar logos diretamente da pasta assets para carregamento rápido
import logoWhite from "@/app/assets/logo-agilizai-h.png";
import logoBlue from "@/app/assets/logo-agilizai-h.png";
import {
  MdRestaurant,
  MdQrCodeScanner,
  MdCheckCircle,
  MdEvent,
  MdPeople,
  MdMenuBook,
  MdDashboard,
  MdPhotoLibrary,
  MdLocalOffer,
  MdSecurity,
  MdSpeed,
  MdTrendingUp,
  MdArrowForward,
  MdStar,
  MdLocationOn,
  MdPhone,
  MdEmail,
} from "react-icons/md";
import bannerBackground from "@/app/assets/banner01.webp";
import iconAg from "@/app/assets/icone-ag.png";

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
}

interface GalleryImage {
  filename: string;
  url?: string;
  sourceType: string;
}

export default function Home() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL_LOCAL ||
    "https://vamos-comemorar-api.onrender.com";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar estabelecimentos
        const placesResponse = await fetch(`${API_URL}/api/places`);
        if (placesResponse.ok) {
          const placesData = await placesResponse.json();
          const places = Array.isArray(placesData)
            ? placesData
            : placesData.data || [];

          const formattedPlaces: Establishment[] = places
            .slice(0, 6)
            .map((place: any) => ({
              id: place.id,
              name: place.name || "Sem nome",
              logo: place.logo
                ? `${API_URL}/uploads/${place.logo}`
                : "/images/default-logo.png",
              address: place.street
                ? `${place.street}, ${place.number || ""}`.trim()
                : "Endereço não informado",
              phone: place.phone || "(11) 99999-9999",
              email: place.email || "contato@estabelecimento.com.br",
            }));

          setEstablishments(formattedPlaces);
        }

        // Buscar imagens da galeria
        try {
          const galleryResponse = await fetch(
            `${API_URL}/api/cardapio/gallery/images`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (galleryResponse.ok) {
            const galleryData = await galleryResponse.json();
            console.log('📸 Galeria de imagens recebida:', galleryData);
            
            // Verificar diferentes formatos de resposta
            const images = galleryData.images || galleryData.data || [];
            
            if (Array.isArray(images) && images.length > 0) {
              // Pegar apenas imagens com URL válida ou filename e limitar a 12
              const validImages = images
                .filter((img: GalleryImage) => {
                  const hasUrl = img.url && (img.url.startsWith('http') || img.url.startsWith('/'));
                  const hasFilename = img.filename && img.filename.trim() !== '';
                  return hasUrl || hasFilename;
                })
                .slice(0, 12);
              
              console.log(`✅ ${validImages.length} imagens válidas encontradas na galeria`);
              setGalleryImages(validImages);
            } else {
              console.log('⚠️ Galeria retornou sem imagens ou array vazio');
            }
          } else {
            console.warn(`⚠️ Erro ao buscar galeria: ${galleryResponse.status} - ${galleryResponse.statusText}`);
          }
        } catch (galleryError) {
          console.error("❌ Erro ao buscar galeria de imagens:", galleryError);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL]);

  const features = [
    {
      icon: MdRestaurant,
      title: "Sistema de Reservas",
      description:
        "Gestão completa de reservas normais e grandes grupos. Controle de mesas, áreas e horários em tempo real.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: MdMenuBook,
      title: "Cardápio Digital",
      description:
        "Cardápio interativo com QR Code. Atualização em tempo real, categorias, subcategorias e gestão de itens.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: MdQrCodeScanner,
      title: "Check-in Inteligente",
      description:
        "Sistema de check-in via QR Code com validação de geolocalização. Controle de entrada rápido e seguro.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: MdPeople,
      title: "Listas de Convidados",
      description:
        "Gestão completa de listas de convidados. Compartilhamento via link, QR Code e controle de presença.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: MdEvent,
      title: "Gestão de Eventos",
      description:
        "Criação e gestão de eventos únicos ou semanais. Integração com promoters e controle operacional completo.",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: MdDashboard,
      title: "Painel Administrativo",
      description:
        "Dashboard completo com métricas, relatórios, logs e controle total do estabelecimento.",
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: MdPhotoLibrary,
      title: "Galeria de Imagens",
      description:
        "Sistema centralizado de galeria de imagens. Upload, organização e reutilização de fotos.",
      color: "from-pink-500 to-rose-500",
    },
    {
      icon: MdLocalOffer,
      title: "Sistema de Brindes",
      description:
        "Gestão de brindes e benefícios. Controle de estoque e distribuição automática.",
      color: "from-teal-500 to-cyan-500",
    },
  ];

  const benefits = [
    {
      icon: MdSpeed,
      title: "Performance",
      description: "Sistema otimizado para alta performance e escalabilidade",
    },
    {
      icon: MdSecurity,
      title: "Segurança",
      description: "Autenticação robusta e controle de permissões por perfil",
    },
    {
      icon: MdTrendingUp,
      title: "Crescimento",
      description:
        "Ferramentas para aumentar a receita e melhorar a experiência",
    },
  ];

  const getImageUrl = (image: GalleryImage) => {
    // Se já tem URL completa, retornar
    if (image.url && (image.url.startsWith('http://') || image.url.startsWith('https://'))) {
      return image.url;
    }
    // Se tem URL relativa, construir caminho completo
    if (image.url && image.url.startsWith('/')) {
      return `${API_URL}${image.url}`;
    }
    // Se tem filename, construir URL do upload
    if (image.filename) {
      // Se filename já é uma URL completa, retornar
      if (image.filename.startsWith('http://') || image.filename.startsWith('https://')) {
        return image.filename;
      }
      // Se filename começa com /, adicionar API_URL
      if (image.filename.startsWith('/')) {
        return `${API_URL}${image.filename}`;
      }
      // Caso contrário, construir URL padrão de uploads
      return `${API_URL}/uploads/${image.filename}`;
    }
    return "/images/default-logo.png";
  };

  // Função para mapear nome do estabelecimento para sua rota
  const getEstablishmentRoute = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("justino")) return "/justino";
    if (lowerName.includes("high") || lowerName.includes("highline"))
      return "/highline";
    if (
      lowerName.includes("freguês") ||
      lowerName.includes("fregues") ||
      lowerName.includes("oh")
    )
      return "/ohfregues";
    if (lowerName.includes("pracinha")) return "/pracinha";
    // Fallback para reservar se não encontrar
    return "/reservar";
  };

  return (
    <>
      {/* Passando a imagem estática 'logoWhite' como prop para o Header. 
         Isso permite que o componente Next.js Image use o objeto estático e o atributo 'priority' 
         para carregar instantaneamente o logo. */}
      <Header logo={logoWhite} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 z-0">
          <Image
            src={bannerBackground}
            alt="Background"
            fill
            className="object-cover opacity-30"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20 text-center w-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8 flex justify-center"
          >
            <Image
              src={iconAg}
              alt="Logo"
              width={200}
              height={200}
              className="mx-auto mb-8 drop-shadow-2xl"
              priority
            />
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Sistema Completo de Gestão
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              para Estabelecimentos
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Transforme a gestão do seu estabelecimento com uma plataforma
            completa que integra reservas, cardápio digital, check-in, eventos e
            muito mais.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/reservar">
              <button className="px-10 py-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center gap-3">
                <MdRestaurant size={28} />
                Fazer Reserva
              </button>
            </Link>
            <Link href="/documentacao">
              <button className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 border-2 border-white/30 backdrop-blur-sm flex items-center gap-3">
                <MdDashboard size={28} />
                Ver Funcionalidades
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Funcionalidades Principais */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Funcionalidades <span className="text-orange-500">Completas</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Uma plataforma completa com todas as ferramentas que você precisa
              para gerenciar seu estabelecimento
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 mx-auto`}
                >
                  <feature.icon className="text-white text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria de Imagens */}
      {galleryImages.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Galeria de <span className="text-orange-500">Imagens</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Veja alguns momentos e ambientes dos nossos estabelecimentos
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                >
                  <Image
                    src={getImageUrl(image)}
                    alt={`Galeria ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Estabelecimentos */}
      {establishments.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Nossos <span className="text-orange-500">Estabelecimentos</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Conheça os estabelecimentos que já utilizam nossa plataforma
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {establishments.map((establishment, index) => (
                <motion.div
                  key={establishment.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="relative h-48 bg-gradient-to-r from-orange-500 to-red-500">
                    <Image
                      src={establishment.logo}
                      alt={establishment.name}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {establishment.name}
                    </h3>
                    <div className="space-y-2 mb-6">
                      <p className="text-gray-600 flex items-center gap-2">
                        <MdLocationOn className="text-orange-500" />
                        {establishment.address}
                      </p>
                      <p className="text-gray-600 flex items-center gap-2">
                        <MdPhone className="text-orange-500" />
                        {establishment.phone}
                      </p>
                      <p className="text-gray-600 flex items-center gap-2">
                        <MdEmail className="text-orange-500" />
                        {establishment.email}
                      </p>
                    </div>
                    <Link href={getEstablishmentRoute(establishment.name)}>
                      <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2">
                        Conhecer Estabelecimento
                        <MdArrowForward />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefícios */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Por que escolher nossa{" "}
              <span className="text-orange-400">plataforma?</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Tecnologia de ponta para transformar a gestão do seu
              estabelecimento
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center p-8 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="text-white text-4xl" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-gray-400 text-lg">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pronto para transformar seu estabelecimento?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Entre em contato conosco e descubra como nossa plataforma pode
              revolucionar a gestão do seu negócio
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/reservar">
                <button className="px-10 py-5 bg-white text-orange-600 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center gap-3 mx-auto">
                  Começar Agora
                  <MdArrowForward size={24} />
                </button>
              </Link>
              <Link href="/contato">
                <button className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 border-2 border-white/30 backdrop-blur-sm flex items-center gap-3 mx-auto">
                  Falar com Especialista
                  <MdPhone size={24} />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Passando a imagem estática 'logoBlue' como prop para o Footer. 
         Assumimos que o Footer.tsx foi modificado para receber essa prop. */}
      <Footer logo={logoBlue} />
    </>
  );
}
