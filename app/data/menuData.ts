import { Bar, MenuCategory, MenuItem } from '../types/menu';

export const bars: Bar[] = [
  {
    id: '1',
    name: 'Seu Justino',
    slug: 'seujustino',
    description: 'Onde cada detalhe é pensado para proporcionar uma experiência inesquecível.',
    logoUrl: '/images/logo-justino.png',
    coverImageUrl: '/images/capa-justino.png',
    address: 'Rua Harmonia, 70 - Vila Madalena, São Paulo',
    rating: 4.5,
    reviewsCount: 1200,
    amenities: ['Wi-Fi', 'Acessível', 'Estacionamento', 'Fumódromo', 'Música ao vivo'],
    latitude: -23.5572069,
    longitude: -46.6895775
  },
  {
    id: '4',
    name: 'Oh Fregues',
    slug: 'ohfregues',
    description: 'Um lugar incrível para curtir com os amigos.',
    logoUrl: '/images/logo-fregues.png',
    coverImageUrl: '/images/capa-ohfregues.jpg',
    address: 'Rua das Flores, 123 - Centro, São Paulo',
    rating: 4.2,
    reviewsCount: 850,
    amenities: ['Samba ao vivo', 'Wi-Fi', 'Estacionamento'],
    latitude: -23.4974950,
    longitude: -46.7017800
  },
  {
    id: '7',
    name: 'High Line Bar',
    slug: 'highline',
    description: 'Um lugar perfeito para relaxar e curtir boa música ao vivo.',
    logoUrl: '/images/logo-highline.png',
    coverImageUrl: '/images/capa-highline.jpeg',
    address: 'Rua Girassol, 144 - Vila Madalena',
    rating: 4.8,
    reviewsCount: 2500,
    amenities: ['Pet Friendly', 'Cervejas Artesanais', 'Wi-Fi'],
    latitude: -23.5605,
    longitude: -46.6903979
  },
  {
    id: '8',
    name: 'Pracinha do Seu Justino',
    slug: 'pracinha',
    description: 'O melhor do samba e gastronomia em um só lugar.',
    logoUrl: '/images/logo-pracinha.png',
    coverImageUrl: '/images/capa-pracinha.jpg',
    address: 'Rua Harmonia, 144 - Vila Madalena, São Paulo',
    rating: 4.6,
    reviewsCount: 1500,
    amenities: ['Wi-Fi', 'Estacionamento', 'Música ao vivo', 'Terraço'],
    latitude: -23.5568850,
    longitude: -46.6897039
  },
  {
    id: '5',
    name: 'Reserva Rooftop',
    slug: 'reserva-rooftop',
    description: 'No Reserva Rooftop, fusionamos sabores excepcionais com uma trilha sonora envolvente, destacando ingredientes frescos e locais em cada experiência única.',
    logoUrl: '/images/logo-reserva-rooftop.png',
    coverImageUrl: '/images/capa-reserva-rooftop.jpg',
    address: 'Em frente ao portão 2 - Rua Marc Chagal, Parque - Jardim das Perdizes, São Paulo - SP',
    rating: 4.8,
    reviewsCount: 1923,
    amenities: ['Wi-Fi', 'Estacionamento', 'Música ao vivo', 'Rooftop', 'Vista Panorâmica'],
    latitude: -23.51824870,
    longitude: -46.67669430
  }
];

export const menuItems: MenuItem[] = [
  // Seu Justino - Lanches
  {
    id: '1',
    name: 'X-Burger Clássico',
    description: 'Hambúrguer artesanal com queijo, alface, tomate e molho especial',
    price: 25.90,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    categoryId: '1',
    barId: '1',
    category: 'Lanches',
    toppings: [
      { id: '1', name: 'Bacon', price: 3.50 },
      { id: '2', name: 'Queijo Extra', price: 2.00 }
    ],
    order: 1
  },
  {
    id: '2',
    name: 'X-Salada Premium',
    description: 'Hambúrguer com salada completa e molho da casa',
    price: 28.90,
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop',
    categoryId: '1',
    barId: '1',
    category: 'Lanches',
    toppings: [
      { id: '3', name: 'Bacon', price: 3.50 },
      { id: '4', name: 'Queijo Extra', price: 2.00 }
    ],
    order: 2
  },
  // Seu Justino - Acompanhamentos
  {
    id: '3',
    name: 'Batata Frita',
    description: 'Porção de batatas fritas crocantes',
    price: 12.90,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
    categoryId: '2',
    barId: '1',
    category: 'Acompanhamentos',
    toppings: [
      { id: '5', name: 'Queijo Ralado', price: 2.50 },
      { id: '6', name: 'Bacon', price: 3.00 }
    ],
    order: 1
  },
  {
    id: '4',
    name: 'Onion Rings',
    description: 'Anéis de cebola empanados e crocantes',
    price: 15.90,
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=300&fit=crop',
    categoryId: '2',
    barId: '1',
    category: 'Acompanhamentos',
    toppings: [
      { id: '7', name: 'Molho Extra', price: 2.00 }
    ],
    order: 2
  },
  // Pracinha - Pratos Principais
  {
    id: '5',
    name: 'Feijoada Completa',
    description: 'Feijoada tradicional com todos os acompanhamentos',
    price: 35.90,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
    categoryId: '3',
    barId: '8',
    category: 'Pratos Principais',
    toppings: [
      { id: '8', name: 'Farofa Extra', price: 2.00 },
      { id: '9', name: 'Couve Extra', price: 1.50 }
    ],
    order: 1
  },
  {
    id: '6',
    name: 'Picanha na Brasa',
    description: 'Picanha grelhada na brasa com arroz e feijão',
    price: 42.90,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
    categoryId: '3',
    barId: '8',
    category: 'Pratos Principais',
    toppings: [
      { id: '10', name: 'Farofa', price: 2.00 },
      { id: '11', name: 'Vinagrete', price: 1.50 }
    ],
    order: 2
  },
  // Oh Fregues - Drinks
  {
    id: '7',
    name: 'Caipirinha',
    description: 'Caipirinha tradicional com limão, açúcar e cachaça',
    price: 18.90,
    imageUrl: 'https://images.unsplash.com/photo-1579959947564-22c6c0c8c4b8?w=400&h=300&fit=crop',
    categoryId: '4',
    barId: '4',
    category: 'Drinks',
    toppings: [
      { id: '12', name: 'Frutas Extras', price: 2.00 },
      { id: '13', name: 'Gelo Extra', price: 1.00 }
    ],
    order: 1
  },
  {
    id: '8',
    name: 'Moscow Mule',
    description: 'Drink refrescante com vodka, gengibre e limão',
    price: 22.90,
    imageUrl: 'https://images.unsplash.com/photo-1579959947564-22c6c0c8c4b8?w=400&h=300&fit=crop',
    categoryId: '4',
    barId: '4',
    category: 'Drinks',
    toppings: [
      { id: '14', name: 'Gengibre Extra', price: 2.00 }
    ],
    order: 2
  },
  {
    id: '9',
    name: 'Gin Tônica',
    description: 'Gin premium com água tônica e limão',
    price: 24.90,
    imageUrl: 'https://images.unsplash.com/photo-1579959947564-22c6c0c8c4b8?w=400&h=300&fit=crop',
    categoryId: '4',
    barId: '4',
    category: 'Drinks',
    toppings: [
      { id: '15', name: 'Gin Extra', price: 5.00 }
    ],
    order: 3
  },
  // High Line - Cervejas
  {
    id: '10',
    name: 'Chopp Artesanal',
    description: 'Chopp gelado da casa',
    price: 8.90,
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
    categoryId: '5',
    barId: '7',
    category: 'Cervejas',
    toppings: [
      { id: '16', name: 'Chopp Extra', price: 6.00 }
    ],
    order: 1
  },
  {
    id: '11',
    name: 'Cerveja Heineken',
    description: 'Cerveja importada gelada',
    price: 12.90,
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
    categoryId: '5',
    barId: '7',
    category: 'Cervejas',
    toppings: [
      { id: '17', name: 'Cerveja Extra', price: 10.00 }
    ],
    order: 2
  },
  {
    id: '12',
    name: 'Cerveja Stella Artois',
    description: 'Cerveja belga premium',
    price: 14.90,
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
    categoryId: '5',
    barId: '7',
    category: 'Cervejas',
    toppings: [
      { id: '18', name: 'Cerveja Extra', price: 12.00 }
    ],
    order: 3
  }
];

export const getMenuCategories = (): MenuCategory[] => [
  {
    id: '1',
    name: 'Lanches',
    barId: '1',
    order: 1,
    items: menuItems.filter(item => item.categoryId === '1')
  },
  {
    id: '2',
    name: 'Acompanhamentos',
    barId: '1',
    order: 2,
    items: menuItems.filter(item => item.categoryId === '2')
  },
  {
    id: '3',
    name: 'Pratos Principais',
    barId: '8',
    order: 1,
    items: menuItems.filter(item => item.categoryId === '3')
  },
  {
    id: '4',
    name: 'Drinks',
    barId: '4',
    order: 1,
    items: menuItems.filter(item => item.categoryId === '4')
  },
  {
    id: '5',
    name: 'Cervejas',
    barId: '7',
    order: 1,
    items: menuItems.filter(item => item.categoryId === '5')
  }
];

export const getBarMenu = (barId: string): MenuItem[] => {
  return menuItems.filter(item => item.barId === barId);
};

export const getBarBySlug = (slug: string): Bar | undefined => {
  return bars.find(bar => bar.slug === slug);
};

export const getBarCategories = (barId: string): MenuCategory[] => {
  const barItems = menuItems.filter(item => item.barId === barId);
  const categories = new Map<string, MenuCategory>();
  
  barItems.forEach(item => {
    if (!categories.has(item.categoryId)) {
      categories.set(item.categoryId, {
        id: item.categoryId,
        name: item.category,
        barId: item.barId,
        order: item.order,
        items: []
      });
    }
    categories.get(item.categoryId)?.items.push(item);
  });
  
  return Array.from(categories.values()).sort((a, b) => a.order - b.order);
}; 