"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation'; // Hook para pegar a URL atual
import './responsive.css';
import {
  MdMenu,
  MdDashboard,
  MdPerson,
  MdFactory,
  MdQrCodeScanner,
  MdTableBar,
  MdPlace,
  MdTimer,
  MdEditCalendar,
  MdCardGiftcard,
  MdEvent,
  MdBusiness,
  MdRestaurant,
} from "react-icons/md";
import logBrand from "../assets/logo-agilizai-h.png"; // Verifique o caminho
import UserMenu from "../components/UserMenu/UserMenu"; // Verifique o caminho

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname(); // Hook do Next.js para pegar a rota ativa

  useEffect(() => {
    // Buscar o role do usuário dos cookies
    const getRoleFromCookies = () => {
      const cookies = document.cookie.split(';');
      const roleCookie = cookies.find(cookie => cookie.trim().startsWith('role='));
      if (roleCookie) {
        const role = roleCookie.split('=')[1];
        setUserRole(role);
      }
      setIsLoading(false);
    };

    getRoleFromCookies();
  }, []);

  // A lista de links da sua navegação baseada no role
  const getNavLinks = () => {
    if (userRole === 'promoter') {
      // Promoter pode acessar algumas funcionalidades além do cardápio
      return [
        { href: "/admin/cardapio", label: "Cardápio", icon: MdRestaurant },
        { href: "/admin/events", label: "Eventos", icon: MdEvent },
        { href: "/admin/reservas", label: "Reservas", icon: MdEditCalendar },
        { href: "/admin/restaurant-reservations", label: "Sistema de Reservas", icon: MdRestaurant },
        { href: "/admin/qrcode", label: "Scanner QR Code", icon: MdQrCodeScanner },
      ];
    } else if (userRole === 'admin') {
      // Administrador pode ver tudo
      return [
        { href: "/admin", label: "Dashboard", icon: MdDashboard },
        { href: "/admin/qrcode", label: "Scanner QR Code", icon: MdQrCodeScanner },
        { href: "/admin/users", label: "Usuários", icon: MdPerson },
        { href: "/admin/events", label: "Eventos", icon: MdEvent },
        { href: "/admin/painel-eventos", label: "Painel de Eventos", icon: MdBusiness },
        { href: "/admin/reservas", label: "Reservas", icon: MdEditCalendar },
        { href: "/admin/restaurant-reservations", label: "Sistema de Reservas", icon: MdRestaurant },
        { href: "/admin/enterprise", label: "Empresa", icon: MdFactory },
        { href: "/admin/places", label: "Locais", icon: MdPlace },
        { href: "/admin/tables", label: "Mesas", icon: MdTableBar },
        { href: "/admin/gifts", label: "Brindes", icon: MdCardGiftcard },
        { href: "/admin/workdays", label: "Funcionamento", icon: MdTimer },
        { href: "/admin/cardapio", label: "Cardápio", icon: MdRestaurant },
        { href: "/admin/commodities", label: "Commodities", icon: MdFactory },
      ];
    }
    
    // Para outros roles, retorna array vazio
    return [];
  };

  const navLinks = getNavLinks();

  const getActiveLabel = () => {
    const activeLink = navLinks.find(link => pathname.startsWith(link.href));
    if (userRole === 'promoter') {
      return "Cardápio - Promoter";
    }
    return activeLink ? activeLink.label : "Admin";
  };

  // Se não há links disponíveis para o usuário, redireciona para acesso negado
  if (!isLoading && navLinks.length === 0) {
    window.location.href = '/acesso-negado';
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`admin-sidebar bg-gray-800/95 backdrop-blur-sm text-white w-64 transform ${
          sidebarOpen ? "translate-x-0 open" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 fixed lg:relative z-50 border-r border-gray-700/50 h-full`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-gray-700/50">
          <div className="bg-white/10 p-2 rounded-xl">
            <Image src={logBrand} alt="Logo" width={32} height={32} className="rounded-lg" />
          </div>
          <span className="text-lg font-bold hidden lg:inline text-white">
            {userRole === 'promoter' ? 'Painel Promoter' : 'Painel Admin'}
          </span>
        </div>
        
        {/* Indicador de Role */}
        <div className="px-6 py-3 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              userRole === 'admin' ? 'bg-blue-500' : 
              userRole === 'promoter' ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
            <span className="text-sm text-gray-300 capitalize">{userRole}</span>
          </div>
        </div>

        <nav className="mt-6 space-y-2 p-4">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
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
                <Icon size={20} className={`${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-white'}`} />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mensagem para Promoters */}
        {userRole === 'promoter' && (
          <div className="p-4 mx-4 mt-4 bg-green-900/20 border border-green-700/30 rounded-lg">
            <p className="text-green-300 text-xs text-center">
              Você tem acesso ao gerenciamento do cardápio, eventos, reservas e QR code do seu estabelecimento.
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
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 admin-title">{getActiveLabel()}</h1>
          </div>
          <UserMenu />
        </header>

        {/* O conteúdo da página ativa é renderizado aqui */}
        <main className="flex-1 overflow-auto">
            {children}
        </main>
      </div>
    </div>
  );
}