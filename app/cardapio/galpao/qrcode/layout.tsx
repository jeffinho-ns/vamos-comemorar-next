import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Code — Cardápio Galpão | Vamos Comemorar",
  description:
    "Gere e baixe o QR Code em PNG para o cardápio do Galpão.",
  robots: { index: false, follow: false },
};

export default function GalpaoQrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
