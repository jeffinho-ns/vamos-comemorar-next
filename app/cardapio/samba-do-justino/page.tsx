"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdRestaurant,
  MdLocalBar,
  MdLocalDrink,
  MdFastfood,
  MdLocalCafe,
  MdCalendarToday,
  MdLocationOn,
  MdAccessTime,
  MdMusicNote,
  MdClose,
} from "react-icons/md";
import { useGoogleAnalytics } from "../../hooks/useGoogleAnalytics";

// Não há necessidade de importar um arquivo CSS separado se você usar Tailwind.
// import './styles.scss';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  isPopular?: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  items: MenuItem[];
}

const menuData: MenuCategory[] = [
  {
    id: "doses",
    name: "DOSES",
    icon: <MdLocalBar className="w-6 h-6" />,
    color: "from-blue-600 to-blue-800",
    items: [
      { id: "1", name: "GIN 142", price: 32.0, category: "doses" },
      { id: "2", name: "GIN BEEFEATER", price: 38.0, category: "doses" },
      { id: "3", name: "VODKA ABSOLUT", price: 36.0, category: "doses" },
      { id: "4", name: "WHISKY CHIVAS", price: 42.0, category: "doses" },
      { id: "5", name: "RUFUS", price: 28.0, category: "doses" },
    ],
  },
  {
    id: "drinks",
    name: "DRINKS",
    icon: <MdLocalDrink className="w-6 h-6" />,
    color: "from-purple-600 to-purple-800",
    items: [
      { id: "6", name: "GIN TÔNICA 142", price: 38.0, category: "drinks" },
      {
        id: "7",
        name: "GIN TÔNICA BEEFEATER",
        price: 45.0,
        category: "drinks",
      },
      { id: "8", name: "GIN TROPICAL 142", price: 45.0, category: "drinks" },
      {
        id: "9",
        name: "GIN TROPICAL BEEFEATER",
        price: 50.0,
        category: "drinks",
      },
      { id: "10", name: "GIN MELANCITA 142", price: 45.0, category: "drinks" },
      {
        id: "11",
        name: "GIN MELANCITA BEEFEATER",
        price: 50.0,
        category: "drinks",
      },
      {
        id: "12",
        name: "VODKA+ENERGÉTICO TUVALU",
        price: 45.0,
        category: "drinks",
      },
      {
        id: "13",
        name: "VODKA+ENERGÉTICO ABSOLUT",
        price: 50.0,
        category: "drinks",
      },
    ],
  },
  {
    id: "garrafa",
    name: "GARRAFA",
    icon: <MdLocalBar className="w-6 h-6" />,
    color: "from-indigo-600 to-indigo-800",
    items: [
      { id: "14", name: "RUFUS", price: 320.0, category: "garrafa" },
      { id: "15", name: "GIN 142", price: 500.0, category: "garrafa" },
      { id: "16", name: "GIN BEEFEATER", price: 550.0, category: "garrafa" },
      { id: "17", name: "VODKA ABSOLUT", price: 550.0, category: "garrafa" },
      { id: "18", name: "WHISKY CHIVAS", price: 600.0, category: "garrafa" },
    ],
  },
  {
    id: "soft",
    name: "SOFT",
    icon: <MdLocalCafe className="w-6 h-6" />,
    color: "from-green-600 to-green-800",
    items: [
      { id: "19", name: "ÁGUA (COM/SEM GÁS)", price: 10.0, category: "soft" },
      {
        id: "20",
        name: "REFRIGERANTE (PEPSI E GUARANÁ)",
        price: 12.0,
        category: "soft",
      },
      {
        id: "21",
        name: "RED BULL (REGULAR, TROPICAL, SUGAR FREE)",
        price: 25.0,
        category: "soft",
      },
      { id: "22", name: "ÁGUA DE COCO", price: 21.0, category: "soft" },
    ],
  },
  {
    id: "comidas",
    name: "COMIDAS",
    icon: <MdFastfood className="w-6 h-6" />,
    color: "from-orange-600 to-orange-800",
    items: [
      { id: "23", name: "FRITAS JUSTINO", price: 40.9, category: "comidas" },
      {
        id: "24",
        name: "ISCA DE FRANGO CROCANTE",
        price: 52.9,
        category: "comidas",
      },
      { id: "25", name: "PASTEL MISTO", price: 48.9, category: "comidas" },
      { id: "26", name: "COXINHA", price: 46.9, category: "comidas" },
      { id: "27", name: "JUSTA BURGUER", price: 52.9, category: "comidas" },
      { id: "28", name: "MUU BURGUER", price: 48.9, category: "comidas" },
      { id: "29", name: "CARNE (ESPETINHO)", price: 16.9, category: "comidas" },
      {
        id: "30",
        name: "QUEIJO COALHO (ESPETINHO)",
        price: 16.9,
        category: "comidas",
      },
    ],
  },
  {
    id: "cervejas",
    name: "CERVEJAS",
    icon: <MdLocalDrink className="w-6 h-6" />,
    color: "from-amber-600 to-amber-800",
    items: [
      { id: "31", name: "SPATEN", price: 21.0, category: "cervejas" },
      { id: "32", name: "CORONA ZERO", price: 21.0, category: "cervejas" },
    ],
  },
  {
    id: "combos",
    name: "COMBOS",
    icon: <MdRestaurant className="w-6 h-6" />,
    color: "from-red-600 to-red-800",
    items: [
      {
        id: "33",
        name: "GIN 142 + 6 ENERGÉTICOS",
        price: 575.0,
        category: "combos",
      },
      {
        id: "34",
        name: "ABSOLUT + 6 ENERGÉTICOS",
        price: 675.0,
        category: "combos",
      },
      {
        id: "35",
        name: "CHIVAS + 6 ENERGÉTICOS",
        price: 715.0,
        category: "combos",
      },
    ],
  },
];

const openBarItems = [
  "ÁGUA",
  "ÁGUA DE COCO",
  "REFRIGERANTE",
  "RED BULL",
  "SPATEN",
  "CORONA ZERO",
  "VODKA ABSOLUT",
  "VODKA TUVALU",
  "GIN 142",
  "GIN BEEFEATER",
  "WHISKY JAMESON",
  "RUFUS LICOR",
];

export default function SambaDoJustinoPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("doses");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { trackPageView, trackClick } = useGoogleAnalytics();

  const banners = [
    {
      src: "/banne-agilizai-mobile.jpg",
      href: "/decoracao-aniversario",
      alt: "Decoração de Aniversário - Agilizai",
    },
  ];

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    trackPageView("Samba do Justino - Cardápio", "/cardapio/samba-do-justino");
  }, [trackPageView]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const MenuItemCard = ({ item }: { item: MenuItem }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 menu-item-card"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-900 text-lg leading-tight">
          {item.name}
        </h3>
        <span className="font-bold text-2xl text-blue-600 price-tag">
          {formatPrice(item.price)}
        </span>
      </div>
      {item.description && (
        <p className="text-gray-600 text-sm">{item.description}</p>
      )}
    </motion.div>
  );

  const CategoryTab = ({ category }: { category: MenuCategory }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setSelectedCategory(category.id)}
      className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 category-tab ${
        selectedCategory === category.id
          ? `bg-gradient-to-br ${category.color} text-white shadow-lg active`
          : "bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <div className="mb-2">{category.icon}</div>
      <span className="text-xs font-semibold text-center">{category.name}</span>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header com Logo e Banners */}
      <div className="relative overflow-hidden bg-white shadow-lg">
        {/* Banners Rotativos com Logo Overlay */}
        <div className="relative h-56 md:h-96 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.a
              key={banners[currentBannerIndex].src}
              href={banners[currentBannerIndex].href}
              target={
                banners[currentBannerIndex].href.startsWith("http")
                  ? "_blank"
                  : "_self"
              }
              rel={
                banners[currentBannerIndex].href.startsWith("http")
                  ? "noopener noreferrer"
                  : ""
              }
              className="block w-full h-full relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => {
                trackClick(
                  `banner-header-${currentBannerIndex + 1}`,
                  "/cardapio/samba-do-justino",
                  "banner_click",
                );
              }}
            >
              <img
                src={banners[currentBannerIndex].src}
                alt={banners[currentBannerIndex].alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

              {/* Logo no canto esquerdo */}
              <div className="absolute top-4 left-4 z-10">
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSidebarOpen(true);
                    trackClick(
                      "logo-click",
                      "/cardapio/samba-do-justino",
                      "sidebar_open",
                    );
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-lg hover:bg-white transition-all duration-300"
                >
                  <img
                    src="/samba-do-justino.png"
                    alt="Samba do Justino Logo"
                    className="h-10 w-auto object-contain drop-shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1">
                    <MdMusicNote className="w-4 h-4 text-yellow-500 animate-bounce drop-shadow-lg" />
                  </div>
                </motion.button>
              </div>

              {/* Indicadores de banner */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {banners.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentBannerIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </motion.a>
          </AnimatePresence>
        </div>
      </div>

      {/* Sidebar com Informações do Evento */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white z-50 shadow-2xl"
            >
              {/* Header do Sidebar */}
              <div className="flex justify-between items-center p-6 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <img
                    src="/samba-do-justino.png"
                    alt="Samba do Justino Logo"
                    className="h-10 w-auto object-contain"
                  />
                  <div>
                    <h2 className="text-xl font-bold">Samba do Justino</h2>
                    <p className="text-blue-200 text-sm">Cardápio Especial</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>

              {/* Conteúdo do Sidebar */}
              <div className="p-6 space-y-6">
                {/* Informações do Evento */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-yellow-300 mb-4">
                    Informações do Evento
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                      <MdCalendarToday className="w-5 h-5 text-yellow-300" />
                      <div>
                        <p className="font-semibold">Data</p>
                        <p className="text-blue-200">30 de Agosto</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                      <MdLocationOn className="w-5 h-5 text-yellow-300" />
                      <div>
                        <p className="font-semibold">Local</p>
                        <p className="text-blue-200">Mirante</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                      <MdAccessTime className="w-5 h-5 text-yellow-300" />
                      <div>
                        <p className="font-semibold">Horário</p>
                        <p className="text-blue-200">21h às 02h</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div className="bg-white/10 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-yellow-300">
                    Sobre o Evento
                  </h4>
                  <p className="text-blue-200 leading-relaxed">
                    Uma noite especial com samba, drinks e muita animação! Venha
                    celebrar conosco essa experiência única. 🎵✨
                  </p>
                </div>

                {/* Open Bar Preview */}
                <div className="bg-green-600/20 p-4 rounded-lg border border-green-400/30">
                  <h4 className="font-semibold mb-2 text-green-300">
                    Open Bar Incluso
                  </h4>
                  <p className="text-green-200 text-sm">
                    Bebidas selecionadas inclusas no pacote do evento
                  </p>
                </div>

                {/* Patrocinadores */}
                <div>
                  <h4 className="font-semibold mb-3 text-yellow-300">
                    Patrocinadores
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "TUVALU",
                      "142 GIN",
                      "RUFUS CARAMEL",
                      "ABSOLUT",
                      "BEEFEATER",
                    ].map((sponsor) => (
                      <span
                        key={sponsor}
                        className="bg-white/10 px-3 py-1 rounded-full text-sm text-blue-200"
                      >
                        {sponsor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Open Bar Section */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-6 text-white shadow-2xl relative"
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 text-yellow-300">
              OPEN BAR
            </h2>
            <p className="text-green-100">Bebidas inclusas no pacote</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {openBarItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/30 transition-all duration-300"
              >
                <span className="text-sm font-medium">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Menu Categories */}
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Cardápio Completo
        </h2>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {menuData.map((category) => (
            <CategoryTab key={category.id} category={category} />
          ))}
        </div>

        {/* Menu Items */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {menuData
              .find((cat) => cat.id === selectedCategory)
              ?.items.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white px-4 py-8 mt-8">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Patrocinadores</h3>
          <div className="flex flex-wrap justify-center gap-6 text-gray-400">
            <span className="text-sm">TUVALU</span>
            <span className="text-sm">142 GIN</span>
            <span className="text-sm">RUFUS CARAMEL</span>
            <span className="text-sm">ABSOLUT</span>
            <span className="text-sm">BEEFEATER</span>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            © 2024 Samba do Justino - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
