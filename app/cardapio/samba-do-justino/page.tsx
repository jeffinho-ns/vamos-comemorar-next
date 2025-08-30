'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdRestaurant, MdLocalBar, MdLocalDrink, MdFastfood, MdLocalCafe, MdMusicNote } from 'react-icons/md';
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics';

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
    id: 'doses',
    name: 'DOSES',
    icon: <MdLocalBar className="w-6 h-6" />,
    color: 'from-blue-600 to-blue-800',
    items: [
      { id: '1', name: 'GIN 142', price: 32.00, category: 'doses' },
      { id: '2', name: 'GIN BEEFEATER', price: 38.00, category: 'doses' },
      { id: '3', name: 'VODKA ABSOLUT', price: 36.00, category: 'doses' },
      { id: '4', name: 'WHISKY CHIVAS', price: 42.00, category: 'doses' },
      { id: '5', name: 'RUFUS', price: 28.00, category: 'doses' },
    ]
  },
  {
    id: 'drinks',
    name: 'DRINKS',
    icon: <MdLocalDrink className="w-6 h-6" />,
    color: 'from-purple-600 to-purple-800',
    items: [
      { id: '6', name: 'GIN TÔNICA 142', price: 38.00, category: 'drinks' },
      { id: '7', name: 'GIN TÔNICA BEEFEATER', price: 45.00, category: 'drinks' },
      { id: '8', name: 'GIN TROPICAL 142', price: 45.00, category: 'drinks' },
      { id: '9', name: 'GIN TROPICAL BEEFEATER', price: 50.00, category: 'drinks' },
      { id: '10', name: 'GIN MELANCITA 142', price: 45.00, category: 'drinks' },
      { id: '11', name: 'GIN MELANCITA BEEFEATER', price: 50.00, category: 'drinks' },
      { id: '12', name: 'VODKA+ENERGÉTICO TUVALU', price: 45.00, category: 'drinks' },
      { id: '13', name: 'VODKA+ENERGÉTICO ABSOLUT', price: 50.00, category: 'drinks' },
    ]
  },
  {
    id: 'garrafa',
    name: 'GARRAFA',
    icon: <MdLocalBar className="w-6 h-6" />,
    color: 'from-indigo-600 to-indigo-800',
    items: [
      { id: '14', name: 'RUFUS', price: 320.00, category: 'garrafa' },
      { id: '15', name: 'GIN 142', price: 500.00, category: 'garrafa' },
      { id: '16', name: 'GIN BEEFEATER', price: 550.00, category: 'garrafa' },
      { id: '17', name: 'VODKA ABSOLUT', price: 550.00, category: 'garrafa' },
      { id: '18', name: 'WHISKY CHIVAS', price: 600.00, category: 'garrafa' },
    ]
  },
  {
    id: 'soft',
    name: 'SOFT',
    icon: <MdLocalCafe className="w-6 h-6" />,
    color: 'from-green-600 to-green-800',
    items: [
      { id: '19', name: 'ÁGUA (COM/SEM GÁS)', price: 10.00, category: 'soft' },
      { id: '20', name: 'REFRIGERANTE (PEPSI E GUARANÁ)', price: 12.00, category: 'soft' },
      { id: '21', name: 'RED BULL (REGULAR, TROPICAL, SUGAR FREE)', price: 25.00, category: 'soft' },
      { id: '22', name: 'ÁGUA DE COCO', price: 21.00, category: 'soft' },
    ]
  },
  {
    id: 'comidas',
    name: 'COMIDAS',
    icon: <MdFastfood className="w-6 h-6" />,
    color: 'from-orange-600 to-orange-800',
    items: [
      { id: '23', name: 'FRITAS JUSTINO', price: 40.90, category: 'comidas' },
      { id: '24', name: 'ISCA DE FRANGO CROCANTE', price: 52.90, category: 'comidas' },
      { id: '25', name: 'PASTEL MISTO', price: 48.90, category: 'comidas' },
      { id: '26', name: 'COXINHA', price: 46.90, category: 'comidas' },
      { id: '27', name: 'JUSTA BURGUER', price: 52.90, category: 'comidas' },
      { id: '28', name: 'MUU BURGUER', price: 48.90, category: 'comidas' },
      { id: '29', name: 'CARNE (ESPETINHO)', price: 16.90, category: 'comidas' },
      { id: '30', name: 'QUEIJO COALHO (ESPETINHO)', price: 16.90, category: 'comidas' },
    ]
  },
  {
    id: 'cervejas',
    name: 'CERVEJAS',
    icon: <MdLocalDrink className="w-6 h-6" />,
    color: 'from-amber-600 to-amber-800',
    items: [
      { id: '31', name: 'SPATEN', price: 21.00, category: 'cervejas' },
      { id: '32', name: 'CORONA ZERO', price: 21.00, category: 'cervejas' },
    ]
  },
  {
    id: 'combos',
    name: 'COMBOS',
    icon: <MdRestaurant className="w-6 h-6" />,
    color: 'from-red-600 to-red-800',
    items: [
      { id: '33', name: 'GIN 142 + 6 ENERGÉTICOS', price: 575.00, category: 'combos' },
      { id: '34', name: 'ABSOLUT + 6 ENERGÉTICOS', price: 675.00, category: 'combos' },
      { id: '35', name: 'CHIVAS + 6 ENERGÉTICOS', price: 715.00, category: 'combos' },
    ]
  }
];

const openBarItems = [
  'ÁGUA', 'ÁGUA DE COCO', 'REFRIGERANTE', 'RED BULL', 'SPATEN',
  'CORONA ZERO', 'VODKA ABSOLUT', 'VODKA TUVALU', 'GIN 142',
  'GIN BEEFEATER', 'WHISKY JAMESON', 'RUFUS LICOR'
];

export default function SambaDoJustinoPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('doses');
  const [openBarExpanded, setOpenBarExpanded] = useState(false);
  const { trackPageView, trackClick } = useGoogleAnalytics();

  const banners = [
    { src: '/banne-agilizai-mobile.jpg', href: '/decoracao-aniversario', alt: 'Decoração de Aniversário - Agilizai' },
    { src: '/banne-oniphotos-mobile.jpg', href: 'https://oniphotos.com/evento_selecionado/1756479190052x293658075261829100', alt: 'Oni Photos - Fotografia Profissional' },
  ];

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    trackPageView('Samba do Justino - Cardápio', '/cardapio/samba-do-justino');
  }, [trackPageView]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex(prevIndex => (prevIndex + 1) % 2);
    }, 5000);

    return () => clearInterval(timer);
  }, []);





  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const MenuItemCard = ({ item }: { item: MenuItem }) => (
    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 menu-item-card">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>
        <span className="font-bold text-2xl text-blue-600 price-tag">{formatPrice(item.price)}</span>
      </div>
      {item.description && (
        <p className="text-gray-600 text-sm">{item.description}</p>
      )}
    </div>
  );

  const CategoryTab = ({ category }: { category: MenuCategory }) => (
    <button
      onClick={() => setSelectedCategory(category.id)}
      className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 category-tab hover:scale-105 active:scale-95 ${
        selectedCategory === category.id
          ? `bg-gradient-to-br ${category.color} text-white shadow-lg active`
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <div className="mb-2">{category.icon}</div>
      <span className="text-xs font-semibold text-center">{category.name}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header com Logo e Banners */}
      <div className="relative overflow-hidden bg-white shadow-lg mb-2">
        {/* Banners Rotativos com Logo Overlay */}
        <div className="relative aspect-video overflow-visible">
                      <motion.a
              key={banners[currentBannerIndex].src}
              href={banners[currentBannerIndex].href}
              target={banners[currentBannerIndex].href.startsWith('http') ? '_blank' : '_self'}
              rel={banners[currentBannerIndex].href.startsWith('http') ? 'noopener noreferrer' : ''}
              className="block w-full relative overflow-visible cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              onClick={(e) => {
                e.preventDefault();
                // Delay para garantir que o click seja processado no iOS
                setTimeout(() => {
                  if (banners[currentBannerIndex].href.startsWith('http')) {
                    window.open(banners[currentBannerIndex].href, '_blank', 'noopener,noreferrer');
                  } else {
                    window.location.href = banners[currentBannerIndex].href;
                  }
                }, 100);
                trackClick(`banner-header-${currentBannerIndex + 1}`, '/cardapio/samba-do-justino', 'banner_click');
              }}
            >
              <img
                src={banners[currentBannerIndex].src}
                alt={banners[currentBannerIndex].alt}
                className="w-full h-auto object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
              
              {/* Logo no canto esquerdo */}
              <div className="absolute top-2 left-2 z-20">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-md hover:bg-white transition-all duration-300">
                  <img
                    src="/samba-do-justino.png"
                    alt="Samba do Justino Logo"
                    className="h-8 w-auto object-contain drop-shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1">
                    <MdMusicNote className="w-3 h-3 text-yellow-500 animate-bounce drop-shadow-lg" />
                  </div>
                </div>
              </div>
              

            </motion.a>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="px-4 py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Cardápio Completo</h2>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {menuData.map((category) => (
            <CategoryTab key={category.id} category={category} />
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          {menuData
            .find(cat => cat.id === selectedCategory)
            ?.items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
        </div>
      </div>

      {/* Open Bar Section - Retrátil */}
      <div className="px-4 py-4">
        <motion.button
          onClick={() => setOpenBarExpanded(!openBarExpanded)}
          className="w-full bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-6 text-white shadow-2xl relative hover:from-green-700 hover:to-green-800 transition-all duration-300"
        >
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold mb-2 text-yellow-300">OPEN BAR</h2>
            <p className="text-green-100">Bebidas inclusas no pacote</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-sm text-green-200">
                {openBarExpanded ? 'Clique para recolher' : 'Clique para expandir'}
              </span>
              <motion.div
                animate={{ rotate: openBarExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-yellow-300"
              >
                ▼
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {openBarExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-white/20">
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
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white px-4 py-6 mt-4">
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
            © 2025 Samba do Justino - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}