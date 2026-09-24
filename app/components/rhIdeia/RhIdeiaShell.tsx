"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { IriHeroMark } from "./RhIdeiaIllustrations";
import { useRhScope } from "./useRhScope";
import { IRI_FIELD as IRI_FIELD_TOKEN } from "./ui";

export const IRI_FIELD = IRI_FIELD_TOKEN;

const ADMIN_LINKS = [
  { href: "/admin/rh-ideia", label: "Dashboard" },
  { href: "/admin/rh-ideia/manual", label: "Manual" },
  { href: "/admin/rh-ideia/equipe", label: "Equipe" },
  { href: "/admin/rh-ideia/pontos", label: "Pontos" },
  { href: "/admin/rh-ideia/comunicados", label: "Comunicados" },
  { href: "/admin/rh-ideia/documentos", label: "Documentos" },
  { href: "/admin/rh-ideia/treinamentos", label: "Treinamentos" },
  { href: "/admin/rh-ideia/guia", label: "Como usar" },
];

const LEADER_ADMIN_LINKS = [
  { href: "/admin/rh-ideia/equipe", label: "Minha equipe" },
  { href: "/rh-ideia/manual", label: "Meu manual" },
];

const STAFF_LINKS = [
  { href: "/rh-ideia", label: "Início" },
  { href: "/rh-ideia/manual", label: "Manual" },
  { href: "/rh-ideia/comunicados", label: "Comunicados" },
  { href: "/rh-ideia/documentos", label: "Documentos" },
  { href: "/rh-ideia/treinamentos", label: "Treinamentos" },
  { href: "/rh-ideia/guia", label: "Como usar" },
];

const LEADER_STAFF_LINKS = [
  STAFF_LINKS[0],
  STAFF_LINKS[1],
  { href: "/rh-ideia/equipe", label: "Minha equipe" },
  ...STAFF_LINKS.slice(2),
];

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
  const scope = useRhScope();
  const { canAccessAdmin, canAccessJustino360 } = useSaasAccess();
  const justinoHref = mode === "admin" ? "/admin/justino360" : "/justino360";
  const links =
    mode === "admin"
      ? scope.seesAll
        ? ADMIN_LINKS
        : LEADER_ADMIN_LINKS
      : scope.isLeader
        ? LEADER_STAFF_LINKS
        : STAFF_LINKS;
  const homeHref = mode === "admin" ? "/admin/rh-ideia" : "/rh-ideia";
  const areaLabel = scope.seesAll
    ? "Painel do RH"
    : scope.isLeader
      ? "Líder da área"
      : "Área do colaborador";

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-slate-800">
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-start gap-4">
            <IriHeroMark className="mt-0.5 h-14 w-14 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                Ideia RH · Grupo Ideia Um
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                {title}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-slate-500">
                People ops centralizado. Todas as casas, um só lugar.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {canAccessAdmin && (
              <Link
                href="/admin"
                className="rounded-full bg-slate-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                Painel Agilizai
              </Link>
            )}
            {canAccessJustino360 && (
              <Link
                href={justinoHref}
                className="rounded-full bg-amber-100 px-3.5 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-200"
              >
                Justino360
              </Link>
            )}
            <p className="text-xs font-medium tracking-wide text-slate-400">{areaLabel}</p>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
          aria-label="Navegação Ideia RH"
        >
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== homeHref && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-stone-100 text-slate-600 hover:bg-stone-200 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
