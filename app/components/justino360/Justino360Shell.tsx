"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { IsaCredit } from "./IsaCredit";

const ADMIN_LINKS = [
  { href: "/admin/justino360", label: "Dashboard" },
  { href: "/admin/justino360/checklists", label: "Checklists" },
  { href: "/admin/justino360/ocorrencias", label: "Ocorrências" },
  { href: "/admin/justino360/tarefas", label: "Tarefas" },
  { href: "/admin/justino360/documentos", label: "Documentos" },
  { href: "/admin/justino360/treinamentos", label: "Treinamentos" },
  { href: "/admin/justino360/comunicados", label: "Comunicados" },
  { href: "/admin/justino360/calendario", label: "Calendário" },
  { href: "/admin/justino360/reunioes", label: "Reuniões" },
  { href: "/admin/justino360/manutencao", label: "Manutenção" },
  { href: "/admin/justino360/ia", label: "IA" },
];

const STAFF_LINKS = [
  { href: "/justino360", label: "Início" },
  { href: "/justino360/checklists", label: "Checklists" },
  { href: "/justino360/tarefas", label: "Tarefas" },
  { href: "/justino360/ocorrencias", label: "Ocorrências" },
  { href: "/justino360/comunicados", label: "Comunicados" },
  { href: "/justino360/treinamentos", label: "Treinamentos" },
  { href: "/justino360/documentos", label: "Documentos" },
  { href: "/justino360/agenda", label: "Agenda" },
];

export function Justino360Shell({
  mode,
  title,
  children,
}: {
  mode: "admin" | "staff";
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const links = mode === "admin" ? ADMIN_LINKS : STAFF_LINKS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="border-b border-white/10 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-400/90">
              Seu Justino
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-gray-300">
              Tudo da operação. Em um só lugar.
            </p>
          </div>
          <IsaCredit className="text-right" />
        </div>
        <nav className="mx-auto mt-4 flex max-w-6xl gap-2 overflow-x-auto pb-1">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/admin/justino360" &&
                link.href !== "/justino360" &&
                pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-amber-500 text-gray-900"
                    : "bg-white/5 text-gray-200 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
