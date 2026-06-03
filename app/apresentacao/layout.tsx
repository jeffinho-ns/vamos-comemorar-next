import type { Metadata } from "next";
import "./apresentacao.css";

export const metadata: Metadata = {
  title: "Apresentação | Agilizaí App — Plataforma para Estabelecimentos",
  description:
    "Conheça o ecossistema Agilizaí: reservas, cardápio digital, check-ins, eventos, WhatsApp com IA e muito mais. Solução completa para bares e restaurantes.",
  openGraph: {
    title: "Agilizaí App — Apresentação Comercial",
    description:
      "Plataforma completa para gestão de estabelecimentos: reservas, eventos, cardápio digital e operação integrada.",
    type: "website",
  },
};

export default function ApresentacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="apresentacao-root">{children}</div>;
}
