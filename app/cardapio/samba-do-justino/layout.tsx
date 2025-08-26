import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Samba do Justino - Cardápio Especial | Vamos Comemorar',
  description: 'Cardápio especial do evento Samba do Justino - Uma noite especial com samba, drinks e muita animação no Mirante. 30 de Agosto.',
  keywords: 'Samba do Justino, evento, Mirante, cardápio, drinks, open bar, samba',
  openGraph: {
    title: 'Samba do Justino - Cardápio Especial',
    description: 'Uma noite especial com samba, drinks e muita animação!',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function SambaDoJustinoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="samba-justino-layout">
      {children}
    </div>
  );
}
