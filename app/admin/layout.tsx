"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation'; // Hook para pegar a URL atual
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
} from "react-icons/md";
import logBrand from "../assets/logo-agilizai-h.png"; // Verifique o caminho
import UserMenu from "../components/UserMenu/UserMenu"; // Verifique o caminho

// A lista de links da sua navegação
const navLinks = [
  { href: "/admin", label: "Dashboard", icon: MdDashboard },
  { href: "/admin/qrcode", label: "Scanner QR Code", icon: MdQrCodeScanner },
  { href: "/admin/users", label: "Usuários", icon: MdPerson },
  { href: "/admin/events", label: "Eventos", icon: MdEvent },
  { href: "/admin/painel-eventos", label: "Painel de Eventos", icon: MdBusiness },
  { href: "/admin/reservas", label: "Reservas", icon: MdEditCalendar },
  { href: "/admin/enterprise", label: "Empresa", icon: MdFactory },
  { href: "/admin/places", label: "Locais", icon: MdPlace },
  { href: "/admin/tables", label: "Mesas", icon: MdTableBar },
  { href: "/admin/gifts", label: "Brindes", icon: MdCardGiftcard },
  { href: "/admin/workdays", label: "Funcionamento", icon: MdTimer },
  // Adicione outras rotas aqui conforme necessário
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname(); // Hook do Next.js para pegar a rota ativa

  // A lógica de fetchData foi removida daqui.
  // Cada página (ex: app/admin/page.tsx) será responsável por buscar seus próprios dados.

  const getActiveLabel = () => {
    const activeLink = navLinks.find(link => pathname.startsWith(link.href));
    return activeLink ? activeLink.label : "Admin";
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Sidebar */}
      <aside
        className={`bg-gray-800/95 backdrop-blur-sm text-white w-64 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 fixed md:relative z-40 border-r border-gray-700/50`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-gray-700/50">
          <div className="bg-white/10 p-2 rounded-xl">
            <Image src={logBrand} alt="Logo" width={32} height={32} className="rounded-lg" />
          </div>
          <span className="text-lg font-bold hidden md:inline text-white">Painel Admin</span>
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
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm flex justify-between items-center px-8 py-4 shadow-lg border-b border-gray-200/20 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MdMenu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800">{getActiveLabel()}</h1>
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