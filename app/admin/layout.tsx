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
} from "react-icons/md";
import logBrand from "../assets/logo-agilizai-h.png"; // Verifique o caminho
import UserMenu from "../components/UserMenu/UserMenu"; // Verifique o caminho

// A lista de links da sua navegação
const navLinks = [
  { href: "/admin", label: "Dashboard", icon: MdDashboard },
  { href: "/admin/qrcode", label: "Scanner QR Code", icon: MdQrCodeScanner },
  { href: "/admin/users", label: "Usuários", icon: MdPerson },
  { href: "/admin/events", label: "Eventos", icon: MdEvent },
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-indigo-700 text-white w-64 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 fixed md:relative z-40`}
      >
        <div className="p-4 flex items-center gap-2 border-b border-indigo-800">
          <Image src={logBrand} alt="Logo" width={40} height={40} />
          <span className="text-lg font-bold hidden md:inline">Painel Admin</span>
        </div>
        <nav className="mt-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-5 py-3 hover:bg-indigo-600 transition-colors duration-200 ${
                  isActive ? "bg-indigo-800 font-semibold" : ""
                }`}
              >
                <Icon size={22} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white flex justify-between items-center px-6 py-3 shadow-md z-30">
          <button className="md:hidden text-indigo-700" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <MdMenu size={28} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">{getActiveLabel()}</h1>
          <UserMenu />
        </header>

        {/* O conteúdo da página ativa é renderizado aqui */}
        <main className="flex-1 p-6 overflow-auto bg-gray-50">
            {children}
        </main>
      </div>
    </div>
  );
}