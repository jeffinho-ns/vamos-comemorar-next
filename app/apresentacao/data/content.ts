import type { IconType } from "react-icons";
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
  MdChat,
  MdSecurity,
  MdTimer,
  MdEditCalendar,
  MdBusiness,
  MdHistory,
  MdPhoneAndroid,
  MdTableBar,
  MdCelebration,
} from "react-icons/md";
import { FaBirthdayCake, FaWhatsapp } from "react-icons/fa";

export interface ModuleItem {
  id: string;
  icon: IconType;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  image: string;
  imageAlt: string;
  gradient: string;
  tag?: string;
  fit?: "cover" | "contain";
}

export interface EstablishmentItem {
  name: string;
  logo: string;
  cover: string;
  description: string;
}

export interface FlowStep {
  step: number;
  title: string;
  description: string;
  icon: IconType;
}

export interface ProfileItem {
  role: string;
  color: string;
  description: string;
  access: string[];
}

export const heroStats = [
  { value: "50+", label: "Estabelecimentos ativos" },
  { value: "10k+", label: "Reservas processadas" },
  { value: "100%", label: "Operação integrada" },
  { value: "24/7", label: "Plataforma online" },
];

export const valueProps = [
  {
    title: "Mais reservas, menos trabalho manual",
    description:
      "Automatize agendamentos, listas de convidados e check-ins. Sua equipe foca no atendimento, não em planilhas.",
  },
  {
    title: "Experiência premium para o cliente",
    description:
      "Cardápio digital, reservas online, listas compartilháveis e confirmações instantâneas pelo app e WhatsApp.",
  },
  {
    title: "Controle total da operação",
    description:
      "Dashboard em tempo real, permissões por perfil e relatórios para cada turno, evento e estabelecimento.",
  },
];

export const ecosystem = [
  {
    title: "App / WebApp Mobile",
    description:
      "Aplicativo móvel para descobrir eventos, reservar mesas, gerenciar perfil e acompanhar comemorações.",
    image: "/apresentacao/webapp-mobile.webp",
    badge: "Cliente final",
    fit: "contain" as const,
  },
  {
    title: "Portal Web",
    description:
      "Reservas online, cardápio digital, decoração de aniversário e páginas personalizadas por estabelecimento.",
    image: "/apresentacao/home.webp",
    badge: "Público geral",
    fit: "cover" as const,
  },
  {
    title: "Painel Admin",
    description:
      "Central de comando para gestores, promoters, recepção e equipe operacional do estabelecimento.",
    image: "/apresentacao/dashboard.webp",
    badge: "Gestão",
    fit: "cover" as const,
  },
];

export const establishments: EstablishmentItem[] = [
  {
    name: "Seu Justino",
    logo: "/images/logo-justino.png",
    cover: "/images/capa-justino.png",
    description: "Bar e restaurante — reservas, eventos e cardápio digital.",
  },
  {
    name: "Oh Freguês",
    logo: "/images/logo-fregues.png",
    cover: "/images/capa-ohfregues.jpg",
    description: "Experiência gastronômica com gestão completa de reservas.",
  },
  {
    name: "HighLine",
    logo: "/images/logo-highline.png",
    cover: "/images/capa-highline.jpeg",
    description: "Rooftop com fluxo operacional dedicado e check-in avançado.",
  },
  {
    name: "Pracinha do Seu Justino",
    logo: "/images/logo-pracinha.png",
    cover: "/images/capa-pracinha.jpg",
    description: "Eventos, promoters, listas e painel operacional integrado.",
  },
  {
    name: "Reserva Rooftop",
    logo: "/images/logo-highline.png",
    cover: "/images/capa-highline.jpeg",
    description: "Fluxo exclusivo de recepção, reservas e detalhes operacionais.",
  },
];

export const modules: ModuleItem[] = [
  {
    id: "reservas",
    icon: MdRestaurant,
    title: "Sistema de Reservas",
    subtitle: "Mesas, grupos e operações complexas",
    description:
      "Gestão completa de reservas normais, grandes grupos, passantes e lista de espera. Controle de mesas, áreas, horários e capacidade em tempo real.",
    highlights: [
      "Reservas normais e grandes grupos",
      "Passantes e lista de espera",
      "Mapa de mesas e áreas",
      "Relatórios por dia, semana e mês",
      "Fluxo dedicado Reserva Rooftop",
    ],
    image: "/apresentacao/reservas.webp",
    imageAlt: "Sistema de reservas de restaurante",
    gradient: "from-orange-500 to-red-500",
    tag: "Core",
  },
  {
    id: "cardapio",
    icon: MdMenuBook,
    title: "Cardápio Digital",
    subtitle: "QR Code e atualização em tempo real",
    description:
      "Cardápio interativo com categorias, subcategorias, fotos e preços. Acesso via QR Code na mesa ou link público por estabelecimento.",
    highlights: [
      "Estrutura hierárquica completa",
      "Upload e galeria de imagens",
      "Páginas por estabelecimento (/cardapio)",
      "Edição rápida pelo painel admin",
      "Placeholder inteligente para itens",
    ],
    image: "/apresentacao/cardapio.webp",
    imageAlt: "Cardápio digital interativo",
    gradient: "from-blue-500 to-cyan-500",
    tag: "Core",
  },
  {
    id: "checkins",
    icon: MdCheckCircle,
    title: "Check-ins na Entrada",
    subtitle: "Recepção rápida e organizada",
    description:
      "Página dedicada para a equipe de entrada: check-in de reservas, convidados de listas, promoters e estatísticas em tempo real por turno.",
    highlights: [
      "Filtros por data, período e busca",
      "Reservas, convidados e promoters",
      "Modo tablet para recepção",
      "Cards visuais por status",
      "Fluxo Rooftop personalizado",
    ],
    image: "/apresentacao/checkins.webp",
    imageAlt: "Painel de check-ins na entrada",
    gradient: "from-green-500 to-emerald-500",
    tag: "Operação",
  },
  {
    id: "qrcode",
    icon: MdQrCodeScanner,
    title: "Scanner QR Code",
    subtitle: "Validação segura com geolocalização",
    description:
      "Check-in via QR Code com validação de presença e geolocalização. Ideal para eventos, listas e controle de acesso na porta.",
    highlights: [
      "Leitura rápida pelo navegador",
      "Validação de localização",
      "Integração com listas e eventos",
      "Check-in individual por token",
      "Histórico de presença",
    ],
    image: "/apresentacao/qrcode.webp",
    imageAlt: "Scanner QR Code para check-in",
    gradient: "from-violet-500 to-purple-500",
    tag: "Operação",
  },
  {
    id: "eventos",
    icon: MdEvent,
    title: "Gestão de Eventos",
    subtitle: "Únicos, semanais e recorrentes",
    description:
      "Criação e gestão de eventos com integração a promoters, listas, check-ins, roles e painel operacional completo.",
    highlights: [
      "Eventos únicos ou semanais",
      "Dashboard de eventos",
      "Painel de eventos operacional",
      "Detalhes operacionais do evento",
      "Hostess e roles por evento",
    ],
    image: "/apresentacao/eventos-lista.webp",
    imageAlt: "Gestão de eventos",
    gradient: "from-yellow-500 to-orange-500",
    tag: "Eventos",
  },
  {
    id: "listas",
    icon: MdPeople,
    title: "Listas de Convidados",
    subtitle: "Compartilhamento e controle de presença",
    description:
      "Gestão de listas com link compartilhável, QR Code, convidados ilimitados e check-in individual na entrada.",
    highlights: [
      "Link público (/lista/[token])",
      "Convidados por reserva ou evento",
      "Check-in por convidado",
      "Integração com promoters",
      "Relatórios de presença",
    ],
    image: "/apresentacao/listas.webp",
    imageAlt: "Listas de convidados",
    gradient: "from-purple-500 to-pink-500",
    tag: "Eventos",
  },
  {
    id: "promoters",
    icon: MdBusiness,
    title: "Promoters",
    subtitle: "Portal dedicado por código",
    description:
      "Área exclusiva para promoters com dashboard, listas, eventos e controle do estabelecimento vinculado.",
    highlights: [
      "Portal /promoter/[codigo]",
      "Dashboard personalizado",
      "Gestão de listas e eventos",
      "Permissões por estabelecimento",
      "Integração com check-ins",
    ],
    image: "/apresentacao/promoters.webp",
    imageAlt: "Portal de promoters",
    gradient: "from-indigo-500 to-blue-500",
    tag: "Eventos",
  },
  {
    id: "dashboard",
    icon: MdDashboard,
    title: "Painel Administrativo",
    subtitle: "Métricas e visão 360°",
    description:
      "Dashboard completo com indicadores, gráficos, logs de ações e controle centralizado de todo o ecossistema.",
    highlights: [
      "Métricas em tempo real",
      "Logs de auditoria",
      "Gerador de relatórios",
      "Visão por estabelecimento",
      "Interface responsiva",
    ],
    image: "/apresentacao/dashboard.webp",
    imageAlt: "Dashboard administrativo",
    gradient: "from-slate-600 to-slate-800",
    tag: "Gestão",
  },
  {
    id: "whatsapp",
    icon: MdChat,
    title: "Atendimento WhatsApp + IA",
    subtitle: "Hub de atendimento inteligente",
    description:
      "Central de atendimento WhatsApp com treinamento de IA por estabelecimento. Respostas automáticas e handoff para humanos.",
    highlights: [
      "Atendimento multicanal",
      "IA treinada por estabelecimento",
      "Histórico de conversas",
      "Escopo por perfil de acesso",
      "Integração operacional",
    ],
    image: "/apresentacao/whatsapp.webp",
    imageAlt: "Atendimento WhatsApp com IA",
    gradient: "from-green-600 to-teal-500",
    tag: "Atendimento",
  },
  {
    id: "galeria",
    icon: MdPhotoLibrary,
    title: "Galeria de Imagens",
    subtitle: "Central de mídia reutilizável",
    description:
      "Upload, organização e reutilização de fotos em cardápio, eventos e materiais do estabelecimento.",
    highlights: [
      "Upload centralizado",
      "Reutilização em cardápio",
      "Organização por estabelecimento",
      "Integração Cloudinary",
      "Gestão de mídia visual",
    ],
    image: "/apresentacao/galeria.webp",
    imageAlt: "Galeria de imagens",
    gradient: "from-pink-500 to-rose-500",
    tag: "Conteúdo",
  },
  {
    id: "brindes",
    icon: MdLocalOffer,
    title: "Sistema de Brindes",
    subtitle: "Benefícios e distribuição",
    description:
      "Gestão de brindes, estoque e distribuição automática para campanhas e fidelização de clientes.",
    highlights: [
      "Controle de estoque",
      "Distribuição automática",
      "Campanhas promocionais",
      "Integração com eventos",
      "Relatórios de uso",
    ],
    image: "/apresentacao/brindes.webp",
    imageAlt: "Sistema de brindes",
    gradient: "from-teal-500 to-cyan-500",
    tag: "Marketing",
  },
  {
    id: "aniversario",
    icon: FaBirthdayCake,
    title: "Decoração de Aniversário",
    subtitle: "Reserva completa de festa",
    description:
      "Fluxo dedicado para reserva de decoração, painéis, bebidas, comidas e presentes — tudo integrado ao estabelecimento.",
    highlights: [
      "Kits de decoração (R$ 200–320)",
      "Formulário completo de reserva",
      "Painéis personalizados",
      "Página /decoracao-aniversario",
      "Integração com bares parceiros",
    ],
    image: "/apresentacao/aniversario.webp",
    imageAlt: "Decoração de aniversário",
    gradient: "from-orange-400 to-red-500",
    tag: "Experiência",
  },
  {
    id: "funcionamento",
    icon: MdTimer,
    title: "Horários de Funcionamento",
    subtitle: "Controle operacional",
    description:
      "Configure dias, turnos e horários de funcionamento para reservas e disponibilidade automática.",
    highlights: [
      "Dias da semana configuráveis",
      "Turnos (almoço, jantar, noite)",
      "Bloqueio de datas",
      "Sincronização com reservas",
      "Gestão por estabelecimento",
    ],
    image: "/apresentacao/funcionamento.webp",
    imageAlt: "Agenda e dias de funcionamento",
    gradient: "from-amber-500 to-orange-600",
    tag: "Operação",
  },
  {
    id: "permissoes",
    icon: MdSecurity,
    title: "Permissões e Segurança",
    subtitle: "Acesso por perfil e estabelecimento",
    description:
      "Matriz de permissões robusta: cada usuário vê apenas o que precisa — admin, gerente, promoter, recepção e analista.",
    highlights: [
      "Roles: admin, gerente, promoter, recepção",
      "Restrição por estabelecimento",
      "Super admin e analistas",
      "Logs de auditoria",
      "Middleware de proteção",
    ],
    image: "/apresentacao/permissoes.webp",
    imageAlt: "Permissões e segurança",
    gradient: "from-red-500 to-rose-600",
    tag: "Segurança",
  },
  {
    id: "webapp",
    icon: MdPhoneAndroid,
    title: "WebApp Mobile",
    subtitle: "Experiência app-like no navegador",
    description:
      "Versão web responsiva com navegação mobile, reservas, perfil e páginas por estabelecimento parceiro.",
    highlights: [
      "Interface mobile-first",
      "Reservas e minhas reservas",
      "Páginas por bar (Justino, Highline…)",
      "Perfil e configurações",
      "Confirmação de reservas",
    ],
    image: "/apresentacao/webapp-mobile.webp",
    imageAlt: "WebApp mobile",
    gradient: "from-blue-600 to-indigo-600",
    tag: "Cliente",
    fit: "contain",
  },
  {
    id: "commodities",
    icon: MdTableBar,
    title: "Commodities & Empresa",
    subtitle: "Gestão corporativa",
    description:
      "Módulos para commodities, dados da empresa e configurações avançadas para operação multi-unidade.",
    highlights: [
      "Cadastro de commodities",
      "Dados da empresa",
      "Multi-estabelecimento",
      "Configurações globais",
      "Gestão centralizada",
    ],
    image: "/apresentacao/commodities.webp",
    imageAlt: "Gestão de commodities",
    gradient: "from-gray-600 to-gray-800",
    tag: "Gestão",
  },
];

export const operationFlow: FlowStep[] = [
  {
    step: 1,
    title: "Cliente reserva",
    description: "Pelo app, site ou WhatsApp — data, horário e número de pessoas.",
    icon: MdEditCalendar,
  },
  {
    step: 2,
    title: "Lista de convidados",
    description: "Compartilha link ou QR Code. Convidados confirmam presença.",
    icon: MdPeople,
  },
  {
    step: 3,
    title: "Recepção preparada",
    description: "Equipe vê reservas do dia, turnos e detalhes operacionais.",
    icon: MdDashboard,
  },
  {
    step: 4,
    title: "Check-in na entrada",
    description: "Scanner QR ou painel de check-ins. Status em tempo real.",
    icon: MdQrCodeScanner,
  },
  {
    step: 5,
    title: "Experiência no salão",
    description: "Cardápio digital, atendimento e brindes integrados.",
    icon: MdRestaurant,
  },
  {
    step: 6,
    title: "Relatórios pós-evento",
    description: "Métricas, presença, exportação PDF e análise de performance.",
    icon: MdHistory,
  },
];

export const profiles: ProfileItem[] = [
  {
    role: "Administrador",
    color: "from-indigo-500 to-purple-600",
    description: "Acesso completo a todos os módulos, usuários e estabelecimentos.",
    access: ["Dashboard", "Usuários", "Eventos", "Brindes", "Commodities", "Logs", "Galeria"],
  },
  {
    role: "Gerente",
    color: "from-blue-500 to-cyan-500",
    description: "Gestão operacional do estabelecimento com foco em reservas e eventos.",
    access: ["Reservas", "Check-ins", "Eventos", "Painel de Eventos", "Atendimento"],
  },
  {
    role: "Promoter",
    color: "from-orange-500 to-red-500",
    description: "Portal dedicado para listas, eventos e cardápio do estabelecimento.",
    access: ["Cardápio", "Eventos", "Reservas", "Check-ins", "Scanner QR"],
  },
  {
    role: "Recepção",
    color: "from-green-500 to-emerald-500",
    description: "Foco em check-ins, scanner e operação do dia a dia na entrada.",
    access: ["Check-ins", "Scanner QR", "Reservas", "Detalhes Operacionais", "Guia Interno"],
  },
];

export const differentiators = [
  {
    icon: MdCelebration,
    title: "Feito para bares e restaurantes",
    text: "Desenvolvido com operadores reais: Seu Justino, Oh Freguês, HighLine, Pracinha e Reserva Rooftop.",
  },
  {
    icon: FaWhatsapp,
    title: "WhatsApp + IA integrados",
    text: "Atendimento automatizado treinado por estabelecimento, sem perder o toque humano.",
  },
  {
    icon: MdSecurity,
    title: "Segurança por design",
    text: "Cada perfil acessa apenas seu estabelecimento. Middleware, cookies e logs de auditoria.",
  },
  {
    icon: MdHistory,
    title: "Relatórios exportáveis",
    text: "PDF, Excel e impressão direta para reservas, check-ins e logs operacionais.",
  },
];

export const navSections = [
  { id: "visao", label: "Visão" },
  { id: "ecossistema", label: "Ecossistema" },
  { id: "parceiros", label: "Parceiros" },
  { id: "modulos", label: "Módulos" },
  { id: "operacao", label: "Operação" },
  { id: "perfis", label: "Perfis" },
  { id: "diferenciais", label: "Diferenciais" },
  { id: "contato", label: "Contato" },
];
