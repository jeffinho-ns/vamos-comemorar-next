"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdRestaurant,
  MdLocalBar,
  MdLocalDrink,
  MdLocalCafe,
  MdCalendarToday,
  MdLocationOn,
  MdAccessTime,
  MdClose,
} from "react-icons/md";
import { useGoogleAnalytics } from "../../hooks/useGoogleAnalytics";
import { getImageUrl } from "@/lib/imageConfig";

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
    id: "cervejas",
    name: "CERVEJA",
    icon: <MdLocalDrink className="w-6 h-6" />,
    color: "from-amber-600 to-amber-800",
    items: [
      { id: "c1", name: "CORONA", price: 21.0, category: "cervejas" },
      { id: "c2", name: "STELLA", price: 21.0, category: "cervejas" },
      { id: "c3", name: "BUD ZERO", price: 21.0, category: "cervejas" },
    ],
  },
  {
    id: "drinks",
    name: "DRINKS",
    icon: <MdLocalDrink className="w-6 h-6" />,
    color: "from-purple-600 to-purple-800",
    items: [
      { id: "d1", name: "APEROL SPRITZ", price: 43.0, category: "drinks" },
      { id: "d2", name: "GIN 142 TÔNICA", price: 38.0, category: "drinks" },
      { id: "d3", name: "GIN 142 + RED BULL", price: 45.0, category: "drinks" },
      {
        id: "d4",
        name: "GIN BEEFEATER + TÔNICA",
        price: 45.0,
        category: "drinks",
      },
      {
        id: "d5",
        name: "GIN BEEFEATER + RED BULL",
        price: 50.0,
        category: "drinks",
      },
      {
        id: "d6",
        name: "VODKA NACIONAL + RED BULL",
        price: 45.0,
        category: "drinks",
      },
      {
        id: "d7",
        name: "VODKA ABSOLUT + RED BULL",
        price: 50.0,
        category: "drinks",
      },
      {
        id: "d8",
        name: "VODKA BELVEDERE + RED BULL",
        price: 65.0,
        category: "drinks",
      },
      {
        id: "d9",
        name: "WHISKY CHIVAS + RED BULL",
        price: 65.0,
        category: "drinks",
      },
      { id: "d10", name: "XEQUE MATE", price: 30.0, category: "drinks" },
    ],
  },
  {
    id: "soft",
    name: "SOFT",
    icon: <MdLocalCafe className="w-6 h-6" />,
    color: "from-green-600 to-green-800",
    items: [
      { id: "s1", name: "ÁGUA", price: 11.0, category: "soft" },
      { id: "s2", name: "REFRIGERANTE", price: 12.0, category: "soft" },
      { id: "s3", name: "RED BULL", price: 25.0, category: "soft" },
      { id: "s4", name: "ÁGUA DE COCO", price: 19.0, category: "soft" },
    ],
  },
  {
    id: "combos",
    name: "COMBOS",
    icon: <MdRestaurant className="w-6 h-6" />,
    color: "from-red-600 to-red-800",
    items: [
      { id: "cb1", name: "GIN 142", price: 429.9, category: "combos" },
      { id: "cb2", name: "GIN BEEFEATER", price: 469.9, category: "combos" },
      { id: "cb3", name: "VODKA ABSOLUT", price: 449.9, category: "combos" },
      { id: "cb4", name: "VODKA BELVEDERE", price: 469.9, category: "combos" },
      { id: "cb5", name: "WHISKY CHIVAS", price: 529.9, category: "combos" },
    ],
  },
  {
    id: "doses",
    name: "DOSES",
    icon: <MdLocalBar className="w-6 h-6" />,
    color: "from-blue-600 to-blue-800",
    items: [
      { id: "do1", name: "GIN 142", price: 33.0, category: "doses" },
      { id: "do2", name: "GIN BEEFEATER", price: 38.0, category: "doses" },
      { id: "do3", name: "VODKA ABSOLUT", price: 36.0, category: "doses" },
      { id: "do4", name: "VODKA BELVEDERE", price: 42.0, category: "doses" },
      { id: "do5", name: "WHISKY CHIVAS", price: 42.0, category: "doses" },
    ],
  },
  {
    id: "garrafa",
    name: "GARRAFA",
    icon: <MdLocalBar className="w-6 h-6" />,
    color: "from-indigo-600 to-indigo-800",
    items: [
      { id: "g1", name: "GIN 142", price: 329.9, category: "garrafa" },
      { id: "g2", name: "GIN BEEFEATER", price: 349.9, category: "garrafa" },
      { id: "g3", name: "VODKA ABSOLUT", price: 349.9, category: "garrafa" },
      { id: "g4", name: "VODKA BELVEDERE", price: 369.9, category: "garrafa" },
      { id: "g5", name: "WHISKY CHIVAS", price: 369.9, category: "garrafa" },
    ],
  },
];

const PAGE_PATH = "/cardapio/galpao";

const sponsorTags = [
  "CORONA",
  "STELLA",
  "BUD",
  "142 GIN",
  "BEEFEATER",
  "ABSOLUT",
  "BELVEDERE",
  "CHIVAS",
  "RED BULL",
];

export default function GalpaoCardapioPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("cervejas");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { trackPageView, trackClick } = useGoogleAnalytics();

  const banners = [
    {
      src: getImageUrl("banne-agilizai-mobile.jpg"),
      href: "/decoracao-aniversario",
      alt: "Decoração de Aniversário - Agilizai",
    },
  ];

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    trackPageView("Galpão - Cardápio", PAGE_PATH);
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
      <div className="relative overflow-hidden bg-white shadow-lg">
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
                  PAGE_PATH,
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

              <div className="absolute top-4 left-4 z-10">
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSidebarOpen(true);
                    trackClick("logo-click", PAGE_PATH, "sidebar_open");
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg hover:bg-white transition-all duration-300 min-h-[3rem] flex items-center"
                >
                  <span className="font-bold text-lg text-gray-900 tracking-tight">
                    Galpão
                  </span>
                </motion.button>
              </div>

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

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white z-50 shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 px-3 flex items-center rounded-lg bg-white/10 font-bold text-lg">
                    Galpão
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Galpão</h2>
                    <p className="text-blue-200 text-sm">Cardápio</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-yellow-300 mb-4">
                    Informações
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                      <MdCalendarToday className="w-5 h-5 text-yellow-300" />
                      <div>
                        <p className="font-semibold">Programação</p>
                        <p className="text-blue-200">Consulte datas e eventos</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                      <MdLocationOn className="w-5 h-5 text-yellow-300" />
                      <div>
                        <p className="font-semibold">Local</p>
                        <p className="text-blue-200">Galpão</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                      <MdAccessTime className="w-5 h-5 text-yellow-300" />
                      <div>
                        <p className="font-semibold">Horário</p>
                        <p className="text-blue-200">Conforme evento</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-yellow-300">Sobre</h4>
                  <p className="text-blue-200 leading-relaxed">
                    Cardápio oficial do Galpão — bebidas e combos conforme
                    disponibilidade.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-yellow-300">
                    Marcas em destaque
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {sponsorTags.map((sponsor) => (
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

      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Cardápio completo
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {menuData.map((category) => (
            <CategoryTab key={category.id} category={category} />
          ))}
        </div>

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

      <div className="bg-gray-900 text-white px-4 py-8 mt-8">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Marcas em destaque</h3>
          <div className="flex flex-wrap justify-center gap-4 text-gray-400">
            {sponsorTags.map((t) => (
              <span key={t} className="text-sm">
                {t}
              </span>
            ))}
          </div>
          <p className="text-gray-500 text-sm mt-4">
            © {new Date().getFullYear()} Galpão — Vamos Comemorar
          </p>
        </div>
      </div>
    </div>
  );
}
