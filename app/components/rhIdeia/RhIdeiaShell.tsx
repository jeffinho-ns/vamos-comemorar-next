"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const ADMIN_LINKS = [
  { href: "/admin/rh-ideia", label: "Dashboard" },
  { href: "/admin/rh-ideia/comunicados", label: "Comunicados" },
  { href: "/admin/rh-ideia/documentos", label: "Documentos" },
  { href: "/admin/rh-ideia/treinamentos", label: "Treinamentos" },
  { href: "/admin/rh-ideia/guia", label: "Como usar" },
];

const STAFF_LINKS = [
  { href: "/rh-ideia", label: "Início" },
  { href: "/rh-ideia/comunicados", label: "Comunicados" },
  { href: "/rh-ideia/documentos", label: "Documentos" },
  { href: "/rh-ideia/treinamentos", label: "Treinamentos" },
  { href: "/rh-ideia/guia", label: "Como usar" },
];

export const IRI_FIELD =
  "rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-teal-400/60";

export function RhIdeiaShell({
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
  const homeHref = mode === "admin" ? "/admin/rh-ideia" : "/rh-ideia";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 text-white">
      <header className="border-b border-white/10 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-teal-400/90">
              Grupo Ideia Um
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-slate-300">
              People ops centralizado. Todas as casas, um só lugar.
            </p>
          </div>
          <p className="text-right text-xs tracking-wide text-slate-500">
            Ideia RH · people hub
          </p>
        </div>
        <nav className="mx-auto mt-4 flex max-w-6xl gap-2 overflow-x-auto pb-1">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== homeHref && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-teal-500 text-slate-900"
                    : "bg-white/5 text-slate-200 hover:bg-white/10"
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
