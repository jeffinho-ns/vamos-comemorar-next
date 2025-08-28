'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdRestaurant, MdLocalBar, MdLocalDrink, MdFastfood, MdLocalCafe, MdStar, MdCalendarToday, MdLocationOn, MdAccessTime, MdMusicNote } from 'react-icons/md';
import './styles.scss';

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
  const [showOpenBar, setShowOpenBar] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
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
        <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>
        <span className="font-bold text-2xl text-blue-600 price-tag">{formatPrice(item.price)}</span>
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
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <div className="mb-2">{category.icon}</div>
      <span className="text-xs font-semibold text-center">{category.name}</span>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 samba-justino-page">
      {/* Header */}
      <div className="relative overflow-hidden event-header">
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
          <div className="relative z-10 px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-2 event-title relative">
                SAMBA DO JUSTINO
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-blue-100 mb-4">
                <div className="flex items-center gap-1">
                  <MdCalendarToday className="w-4 h-4" />
                  <span>30 de Agosto</span>
                </div>
                <div className="flex items-center gap-1">
                  <MdLocationOn className="w-4 h-4" />
                  <span>Mirante</span>
                </div>
              </div>
              <p className="text-blue-100 text-lg max-w-md mx-auto">
                Uma noite especial com samba, drinks e muita animação! 🎵
              </p>
            </motion.div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl"></div>
          
          {/* Floating particles */}
          <div className="floating-particles">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
          </div>
        </div>
      </div>

      {/* Open Bar Section */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-6 text-white shadow-2xl open-bar-section relative"
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 text-yellow-300 samba-vibes">OPEN BAR</h2>
            <p className="text-green-100">Bebidas inclusas no pacote</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 open-bar-items">
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Cardápio Completo</h2>
        
        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-3 mb-6 category-tabs">
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
              .find(cat => cat.id === selectedCategory)
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
