"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Hook para pegar a URL atual
import "./responsive.css";
import {
  MdMenu,
  MdDashboard,
  MdPerson,
  MdFactory,
  MdPhotoLibrary,
  MdQrCodeScanner,
  MdCheckCircle,
  MdTableBar,
  MdPlace,
  MdTimer,
  MdEditCalendar,
  MdCardGiftcard,
  MdEvent,
  MdBusiness,
  MdRestaurant,
  MdInfo,
  MdHistory,
  MdChat,
} from "react-icons/md";
import logBrand from "../assets/logo-agilizai-h.png"; // Verifique o caminho
import UserMenu from "../components/UserMenu/UserMenu"; // Verifique o caminho
import AdminPageViewLogger from "../components/AdminPageViewLogger";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { useAppContext } from "../context/AppContext";

// E-mail da analista com acesso restrito ao estabelecimento Pracinha do Seu Justino (menu próprio, não promoter)
const ANALISTA_EMAIL = "analista.mkt03@ideiaum.com.br";

// Super Admins: acesso extra (ex: Galeria, WhatsApp, Reservas globais) — alinhado ao middleware
const SUPER_ADMIN_EMAILS = new Set(["teste@teste", "jeffinho_ns@hotmail.com"]);

// Gerentes do Seu Justino que têm acesso ao Gerenciamento do Cardápio (apenas estabelecimento Seu Justino)
const GERENTES_SEU_JUSTINO_CARDAPIO = [
  "gerente.sjm@seujustino.com.br",
  "subgerente.sjm@seujustino.com.br",
  // Highline: analista com acesso ao Cardápio do Highline (controlado também por permissões por estabelecimento)
  "analista@highline.com",
];

// E-mails autorizados a acessar rooftop-fluxo (Reserva Rooftop) - recebem menu de recepção
const ROOFTOP_FLUXO_EMAILS = new Set([
  "recepcao@reservarooftop.com.br",
  "gerente.maitre@reservarooftop.com.br",
  "diego.gomes@reservarooftop.com.br",
  "vbs14@hotmail.com",
  "reservas@reservarooftop.com.br",
  "coordenadora.reservas@ideiaum.com.br",
  "analista.mkt02@ideiaum.com.br",
]);
const ROOFTOP_FLUXO_LINKS = [
  { href: "/admin", label: "Dashboard", icon: MdDashboard },
  { href: "/admin/checkins", label: "Check-ins", icon: MdCheckCircle },
  {
    href: "/admin/checkins/rooftop-fluxo",
    label: "Fluxo Rooftop",
    icon: MdCheckCircle,
  },
  {
    href: "/admin/restaurant-reservations",
    label: "Sistema de Reservas",
    icon: MdRestaurant,
  },
  {
    href: "/admin/detalhes-operacionais",
    label: "Detalhes Operacionais do Evento",
    icon: MdInfo,
  },
  { href: "/admin/qrcode", label: "Scanner QR Code", icon: MdQrCodeScanner },
  { href: "/admin/reservas", label: "Reservas", icon: MdEditCalendar },
];

// Usuários com acesso exclusivo ao módulo de Cardápio
const CARDAPIO_ONLY_EMAILS = new Set([
  "vinicius.gomes@ideiaum.com.br",
]);
const CARDAPIO_ONLY_LINKS = [
  { href: "/admin/cardapio", label: "Cardápio", icon: MdRestaurant },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname(); // Hook do Next.js para pegar a rota ativa
  const {
    canAccessCardapio,
    canViewActionLogs,
    isLoading: isLoadingPerms,
  } = useUserPermissions();
  const { role: userRole, userEmail, isLoading } = useAppContext();

  const isAnalista = userEmail === ANALISTA_EMAIL;
  const isSuperAdmin =
    !!userEmail && SUPER_ADMIN_EMAILS.has(userEmail.toLowerCase().trim());
  const isRooftopFluxoEmail =
    userEmail && ROOFTOP_FLUXO_EMAILS.has(userEmail.toLowerCase().trim());
  const isCardapioOnlyUser =
    userEmail && CARDAPIO_ONLY_EMAILS.has(userEmail.toLowerCase().trim());

  // A lista de links da sua navegação baseada no role e no perfil (analista vs promoter)
  const getNavLinks = () => {
    if (isCardapioOnlyUser) {
      return CARDAPIO_ONLY_LINKS;
    }

    // Reserva Rooftop: e-mails autorizados ao rooftop-fluxo (prioridade)
    if (isRooftopFluxoEmail) {
      return ROOFTOP_FLUXO_LINKS;
    }
    // Analista (ex: analista.mkt03) – perfil analista, acesso amplo ao estabelecimento Pracinha (não é promoter)
    if (isAnalista) {
      return [
        { href: "/admin", label: "Dashboard", icon: MdDashboard },
        {
          href: "/admin/restaurant-reservations",
          label: "Sistema de Reservas",
          icon: MdRestaurant,
        },
        {
          href: "/admin/eventos/dashboard",
          label: "Dashboard de Eventos",
          icon: MdEvent,
        },
        {
          href: "/admin/eventos/promoters",
          label: "Promoters",
          icon: MdPerson,
        },
        { href: "/admin/eventos/listas", label: "Listas", icon: MdEvent },
        {
          href: "/admin/painel-eventos",
          label: "Painel de Eventos",
          icon: MdBusiness,
        },
        { href: "/admin/checkins", label: "Check-ins", icon: MdCheckCircle },
        { href: "/admin/workdays", label: "Funcionamento", icon: MdTimer },
        { href: "/admin/cardapio", label: "Cardápio", icon: MdRestaurant },
        {
          href: "/admin/qrcode",
          label: "Scanner QR Code",
          icon: MdQrCodeScanner,
        },
        { href: "/admin/reservas", label: "Reservas", icon: MdEditCalendar },
        {
          href: "/admin/detalhes-operacionais",
          label: "Detalhes Operacionais do Evento",
          icon: MdInfo,
        },
        { href: "/admin/guia", label: "Guia Interno", icon: MdInfo },
      ];
    }
    if (userRole === "promoter" || userRole === "promoter-list") {
      // Promoter – acesso restrito ao cardápio, eventos, reservas, checkins do seu estabelecimento
      return [
        { href: "/admin/cardapio", label: "Cardápio", icon: MdRestaurant },
        { href: "/admin/eventos", label: "Eventos", icon: MdEvent },
        { href: "/admin/reservas", label: "Reservas", icon: MdEditCalendar },
        {
          href: "/admin/restaurant-reservations",
          label: "Sistema de Reservas",
          icon: MdRestaurant,
        },
        {
          href: "/admin/qrcode",
          label: "Scanner QR Code",
          icon: MdQrCodeScanner,
        },
        { href: "/admin/checkins", label: "Check-ins", icon: MdCheckCircle },
      ];
    } else if (
      userRole === "recepção" ||
      userRole === "recepcao" ||
      userRole === "atendente"
    ) {
      // Recepção/Atendente - acesso restrito aos estabelecimentos configurados (inclui Reserva Rooftop)
      const links = [
        { href: "/admin", label: "Dashboard", icon: MdDashboard },
        { href: "/admin/checkins", label: "Check-ins", icon: MdCheckCircle },
        {
          href: "/admin/restaurant-reservations",
          label: "Sistema de Reservas",
          icon: MdRestaurant,
        },
        {
          href: "/admin/detalhes-operacionais",
          label: "Detalhes Operacionais do Evento",
          icon: MdInfo,
        },
        { href: "/admin/guia", label: "Guia Interno", icon: MdInfo },
        {
          href: "/admin/qrcode",
          label: "Scanner QR Code",
          icon: MdQrCodeScanner,
        },
        { href: "/admin/reservas", label: "Reservas", icon: MdEditCalendar },
      ];
      if (canAccessCardapio) {
        links.splice(2, 0, {
          href: "/admin/cardapio",
          label: "Cardápio",
          icon: MdRestaurant,
        });
      }
      return links;
    } else if (userRole === "gerente") {
      // Gerente - acesso às páginas administrativas restritas aos seus estabelecimentos
      const baseLinks = [
        { href: "/admin", label: "Dashboard", icon: MdDashboard },
        {
          href: "/admin/restaurant-reservations",
          label: "Sistema de Reservas",
          icon: MdRestaurant,
        },
        {
          href: "/admin/detalhes-operacionais",
          label: "Detalhes Operacionais do Evento",
          icon: MdInfo,
        },
        {
          href: "/admin/painel-eventos",
          label: "Painel de Eventos",
          icon: MdBusiness,
        },
        {
          href: "/admin/eventos/dashboard",
          label: "Dashboard de Eventos",
          icon: MdEvent,
        },
        { href: "/admin/checkins", label: "Check-ins", icon: MdCheckCircle },
        {
          href: "/admin/qrcode",
          label: "Scanner QR Code",
          icon: MdQrCodeScanner,
        },
        { href: "/admin/reservas", label: "Reservas", icon: MdEditCalendar },
      ];
      // Apenas gerente.sjm e subgerente.sjm do Seu Justino têm acesso ao Gerenciamento do Cardápio
      const canAccessCardapioByEmail =
        GERENTES_SEU_JUSTINO_CARDAPIO.includes(userEmail);
      if (canAccessCardapioByEmail || canAccessCardapio) {
        return [
          ...baseLinks.slice(0, 2),
          { href: "/admin/cardapio", label: "Cardápio", icon: MdRestaurant },
          ...baseLinks.slice(2),
        ];
      }
      return baseLinks;
    } else if (userRole === "admin") {
      // Administrador pode ver tudo
      const links = [
        { href: "/admin", label: "Dashboard", icon: MdDashboard },
        {
          href: "/admin/qrcode",
          label: "Scanner QR Code",
          icon: MdQrCodeScanner,
        },
        { href: "/admin/checkins", label: "Check-ins", icon: MdCheckCircle },
        { href: "/admin/users", label: "Usuários", icon: MdPerson },
        { href: "/admin/eventos", label: "Eventos", icon: MdEvent },
        {
          href: "/admin/painel-eventos",
          label: "Painel de Eventos",
          icon: MdBusiness,
        },
        {
          href: "/admin/detalhes-operacionais",
          label: "Detalhes Operacionais do Evento",
          icon: MdInfo,
        },
        { href: "/admin/reservas", label: "Reservas", icon: MdEditCalendar },
        {
          href: "/admin/restaurant-reservations",
          label: "Sistema de Reservas",
          icon: MdRestaurant,
        },
        { href: "/admin/guia", label: "Guia Interno", icon: MdInfo },
        { href: "/admin/enterprise", label: "Empresa", icon: MdFactory },
        // { href: "/admin/places", label: "Locais", icon: MdPlace },
        // { href: "/admin/tables", label: "Mesas", icon: MdTableBar },
        { href: "/admin/gifts", label: "Brindes", icon: MdCardGiftcard },
        { href: "/admin/workdays", label: "Funcionamento", icon: MdTimer },
        { href: "/admin/cardapio", label: "Cardápio", icon: MdRestaurant },
        { href: "/admin/commodities", label: "Commodities", icon: MdFactory },
      ];

      // Super Admins: ver acesso à página de Galeria
      if (isSuperAdmin) {
        const guiaIndex = links.findIndex((l) => l.href === "/admin/guia");
        const insertAt = guiaIndex >= 0 ? guiaIndex + 1 : links.length;
        links.splice(insertAt, 0, {
          href: "/admin/galeria",
          label: "Galeria",
          icon: MdPhotoLibrary,
        });
      }

      return links;
    }

    // Para outros roles, retorna array vazio
    return [];
  };

  let navLinks = getNavLinks();
  // Quando está na página rooftop-fluxo, garantir links (evitar redirect para acesso-negado)
  if (
    navLinks.length === 0 &&
    pathname.startsWith("/admin/checkins/rooftop-fluxo")
  ) {
    navLinks = ROOFTOP_FLUXO_LINKS;
  }

  // /admin/reservas: apenas Super Admins
  if (!isSuperAdmin) {
    navLinks = navLinks.filter((l) => l.href !== "/admin/reservas");
  }

  // /admin/whatsapp: apenas Super Admins
  if (isSuperAdmin && !navLinks.some((l) => l.href === "/admin/whatsapp")) {
    const guiaIndex = navLinks.findIndex((l) => l.href === "/admin/guia");
    const insertAt = guiaIndex >= 0 ? guiaIndex + 1 : navLinks.length;
    navLinks.splice(insertAt, 0, {
      href: "/admin/whatsapp",
      label: "WhatsApp",
      icon: MdChat,
    });
  }

  if (
    isSuperAdmin &&
    canViewActionLogs &&
    !navLinks.some((l) => l.href === "/admin/logs")
  ) {
    navLinks = [
      ...navLinks,
      { href: "/admin/logs", label: "Logs de Ações", icon: MdHistory },
    ];
  }

  const getActiveLabel = () => {
    const activeLink = navLinks.find((link) => pathname.startsWith(link.href));
    if (isAnalista) {
      return "Admin - Analista";
    }
    if (userRole === "promoter" || userRole === "promoter-list") {
      return "Painel Promoter";
    }
    if (isCardapioOnlyUser) {
      return "Admin - Cardápio";
    }
    if (
      isRooftopFluxoEmail ||
      userRole === "recepção" ||
      userRole === "recepcao" ||
      userRole === "atendente"
    ) {
      return "Admin - Recepção";
    }
    if (userRole === "gerente") {
      return "Admin - Gerente";
    }
    return activeLink ? activeLink.label : "Admin";
  };

  // Se não há links disponíveis para o usuário, redireciona para acesso negado
  if (!isLoading && navLinks.length === 0) {
    window.location.href = "/acesso-negado";
    return null;
  }

  if (isLoading || isLoadingPerms) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar bg-gray-800/95 backdrop-blur-sm text-white w-60 sm:w-64 md:w-72 transform ${
          sidebarOpen ? "translate-x-0 open" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 fixed lg:relative z-50 border-r border-gray-700/50 h-full`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-gray-700/50">
          <div className="bg-white/10 p-2 rounded-xl">
            <Image
              src={logBrand}
              alt="Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </div>
          <span className="text-lg font-bold hidden lg:inline text-white">
            {isAnalista
              ? "Painel Analista"
              : userRole === "promoter" || userRole === "promoter-list"
                ? "Painel Promoter"
                : "Painel Admin"}
          </span>
        </div>

        {/* Indicador de Role */}
        <div className="px-6 py-3 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isAnalista
                  ? "bg-cyan-500"
                  : userRole === "admin"
                    ? "bg-blue-500"
                    : userRole === "promoter" || userRole === "promoter-list"
                      ? "bg-green-500"
                      : userRole === "gerente"
                        ? "bg-yellow-500"
                        : userRole === "recepção" ||
                            userRole === "recepcao" ||
                            userRole === "atendente"
                          ? "bg-purple-500"
                          : "bg-gray-500"
              }`}
            ></div>
            <span className="text-sm text-gray-300 capitalize">
              {isAnalista ? "Analista" : userRole}
            </span>
          </div>
        </div>

        <nav className="mt-6 space-y-2 p-4">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-semibold shadow-lg"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                <Icon
                  size={20}
                  className={`${isActive ? "text-gray-900" : "text-gray-400 group-hover:text-white"}`}
                />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mensagem para Analista (acesso ao estabelecimento Pracinha do Seu Justino) */}
        {isAnalista && (
          <div className="p-4 mx-4 mt-4 bg-cyan-900/20 border border-cyan-700/30 rounded-lg">
            <p className="text-cyan-300 text-xs text-center">
              Acesso Analista: reservas, eventos, listas, painel, check-ins,
              funcionamento, cardápio e QR code do estabelecimento Pracinha do
              Seu Justino.
            </p>
          </div>
        )}
        {/* Mensagem para Promoters */}
        {!isAnalista &&
          (userRole === "promoter" || userRole === "promoter-list") && (
            <div className="p-4 mx-4 mt-4 bg-green-900/20 border border-green-700/30 rounded-lg">
              <p className="text-green-300 text-xs text-center">
                Você tem acesso ao gerenciamento do cardápio, eventos, reservas
                e QR code do seu estabelecimento.
              </p>
            </div>
          )}
      </aside>

      {/* Main Content */}
      <div className="admin-main-content flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 shadow-lg border-b border-gray-200/20 z-40 admin-header">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MdMenu size={24} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 admin-title">
              {getActiveLabel()}
            </h1>
          </div>
          <UserMenu />
        </header>

        {/* O conteúdo da página ativa é renderizado aqui */}
        <main className="flex-1 overflow-y-auto sm:p-6 lg:p-8">
          {/* Page views admin: POST /api/action-logs (page_view_admin) em cada navegação */}
          <AdminPageViewLogger />
          {children}
        </main>
      </div>
    </div>
  );
}
