import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galpão - Cardápio | Vamos Comemorar",
  description:
    "Cardápio do Galpão — cervejas, drinks, combos, doses, garrafas e soft drinks.",
  keywords:
    "Galpão, cardápio, drinks, cerveja, combos, doses, garrafa, Vamos Comemorar",
  openGraph: {
    title: "Galpão - Cardápio",
    description: "Confira o cardápio completo do Galpão.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function GalpaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="galpao-cardapio-layout">{children}</div>;
}
