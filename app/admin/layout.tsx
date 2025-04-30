"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MdMenu,
  MdDashboard,
  MdPerson3,
  MdFactory,
  MdSpaceBar,
  MdTableBar,
  MdPlace,
  MdTimer,
  MdEditCalendar,
  MdCardGiftcard,
  MdPerson,
  MdEvent,
  MdAssignmentTurnedIn,
} from "react-icons/md";
import logBrand from "../assets/logo_white.png";
import UserMenu from "../components/UserMenu/UserMenu";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: MdDashboard },
  { href: "/admin/users", label: "Usuários", icon: MdPerson3 },
  { href: "/admin/enterprise", label: "Empresa", icon: MdFactory },
  { href: "/admin/commodities", label: "Commodities", icon: MdSpaceBar },
  { href: "/admin/places", label: "Lugares", icon: MdPlace },
  { href: "/admin/tables", label: "Mesas", icon: MdTableBar },
  { href: "/admin/gifts", label: "Brindes", icon: MdCardGiftcard },
  { href: "/admin/workdays", label: "Funcionamento", icon: MdTimer },
  { href: "/admin/events", label: "Eventos", icon: MdEvent },
  { href: "/admin/reservas", label: "Reservas", icon: MdEditCalendar },
];

// Tipagem para os dados das reservas por evento
interface ReservaPorEvento {
  name: string;
  count: number;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pathname, setPathname] = useState("Dashboard");

  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    reservas: 0,
  });

  // Tipagem para o estado de reservasPorEvento
  const [reservasPorEvento, setReservasPorEvento] = useState<ReservaPorEvento[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const [usersRes, eventsRes, reservasRes] = await Promise.all([
          fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/events`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/reservas`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const usersData = await usersRes.json();
        const eventsData = await eventsRes.json();
        const reservasData = await reservasRes.json();

        setStats({
          users: usersData.length,
          events: eventsData.length,
          reservas: reservasData.length,
        });

        // Dados agrupados para gráfico
        const contagemPorEvento = reservasData.reduce((acc: { [key: string]: number }, reserva: any) => {
          const evento = reserva.nome_evento || reserva.evento_id || "Desconhecido";
          acc[evento] = (acc[evento] || 0) + 1;
          return acc;
        }, {});

        // Convertendo para o formato esperado
        const chartData: ReservaPorEvento[] = Object.entries(contagemPorEvento).map(([name, count]) => ({
          name,
          count: parseInt(count as string, 10), 
        }));

        setReservasPorEvento(chartData);
      } catch (err) {
        console.error("Erro ao buscar dados da dashboard:", err);
      }
    };

    fetchData();
  }, [API_URL]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-indigo-700 text-white w-64 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 fixed md:relative z-40`}
      >
        <div className="p-4 flex items-center gap-2">
          <Image src={logBrand} alt="Logo" width={40} height={40} />
          <span className="text-lg font-bold hidden md:inline">Painel</span>
        </div>
        <nav className="mt-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => {
                setPathname(label);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-5 py-2 hover:bg-indigo-600 transition ${
                pathname === label ? "bg-indigo-600 font-semibold" : ""
              }`}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white flex justify-between items-center px-4 py-3 shadow-md">
          <button className="md:hidden text-indigo-700" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <MdMenu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">{pathname}</h1>
          <UserMenu />
        </header>

        {/* Dashboard Summary */}
        {pathname === "Dashboard" ? (
          <main className="p-6 space-y-6 overflow-auto">
            {/* Cards Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: "Usuários", value: stats.users, icon: MdPerson3 },
                { label: "Eventos", value: stats.events, icon: MdEvent },
                { label: "Reservas", value: stats.reservas, icon: MdAssignmentTurnedIn },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4 hover:shadow-lg transition">
                  <div className="bg-indigo-100 text-indigo-700 p-3 rounded-full">
                    <Icon size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <h2 className="text-2xl font-bold">{value}</h2>
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfico */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Reservas por Evento</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reservasPorEvento}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </main>
        ) : (
          <main className="p-6 overflow-auto">{children}</main>
        )}

        {/* Footer */}
        <footer className="bg-white text-center text-sm text-gray-500 py-3 border-t">
          &copy; 2025 - Vamos Comemorar
        </footer>
      </div>
    </div>
  );
}
