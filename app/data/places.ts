import img01 from "@/app/assets/justino/capa-justino.png";
import img02 from "@/app/assets/oh-fregues.jpg";
import img03 from "@/app/assets/highline/capa-highline.jpeg";
import img04 from "@/app/assets/pracinha/capa-pracinha.jpg";
import img05 from "@/app/assets/highline/capa-highline.jpeg";

const places = [
    {
      image: img01,
      title: "Seu Justino Tatuapé",
      address: "Rua Azevedo Soares, 940",
      distance: "11.5km",
      rating: "4.6 (1.8K)",
      description: "O Justino é um bar aconchegante, referência de agito, drinks e ótimos petiscos.",
      link: "/justino",
      state: "sp",
      date:'2025-02-23'
    },
    {
      image: img02,
      title: "Oh Fregues",
      address: "Largo da Matriz de Nossa Senhora do Ó, 145",
      distance: "8.2km",
      rating: "4.7 (3.2K)",
      description: "O Oh Fregues é um ponto de encontro clássico, com um ambiente descontraído e drinks exclusivos.",
      link: "/ohfregues",
      state: "sp",
      date:'2025-02-24'
    },
    {
      image: img03,
      title: "High Line Bar",
      address: "Rua Girassol, 144 - Vila Madalena",
      distance: "5.9km",
      rating: "4.8 (2.5K)",
      description: "Um lugar perfeito para relaxar e curtir boa musica ao vivo.",
      link: "/highline",
      state: "rj",
      date:'2025-02-25'
    },
    {
      image: img04,
      title: "Pracinha",
      address: "Rua das Flores, 123 - Centro",
      distance: "3.1km",
      rating: "4.9 (4.1K)",
      description: "A Pracinha é um espaço único que combina tradição e modernidade com excelente gastronomia.",
      link: "/pracinha",
      state: "sp",
      date:'2025-02-26'
    },
    {
        image: img01,
        title: "Seu Justino Centro",
        address: "Rua das Palmeiras, 456",
        distance: "2.8km",
        rating: "4.5 (1.5K)",
        description: "Uma filial do Justino no centro da cidade, mantendo a mesma qualidade e ambiente.",
        link: "/justino",
        state: "rj",
        date: '2025-02-27'
    },
    {
        image: img02,
        title: "Oh Fregues Express",
        address: "Av. Paulista, 789",
        distance: "1.2km",
        rating: "4.6 (2.1K)",
        description: "Versão express do Oh Fregues, ideal para happy hours rápidos e eficientes.",
        link: "/ohfregues",
        state: "rj",
        date: '2025-02-28'
    },
    {
        image: img05,
        title: "Reserva Rooftop",
        address: "Em frente ao portão 2 - Rua Marc Chagal, Parque - Jardim das Perdizes",
        distance: "4.2km",
        rating: "4.8 (1.9K)",
        description: "Gastronomia, música e vista em Jardim das Perdizes — almoço e jantar com giros.",
        link: "/reserva-rooftop",
        state: "sp",
        date: '2025-02-29'
    },
    {
        image: img05,
        title: "Reserva Pinheiros",
        address: "Pinheiros, São Paulo - SP",
        distance: "3.8km",
        rating: "4.8 (1.9K)",
        description: "Deck ao ar livre e Salão com mesas, sofás e bar — restaurante Reserva em Pinheiros.",
        link: "/reserva-pinheiros",
        state: "sp",
        date: '2025-03-01'
    }
  ];
  
  export default places;