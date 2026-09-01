import { redirect } from 'next/navigation';

const establishmentSlugMap: Record<string, string> = {
  // slugs canônicos (usados nas URLs para redes sociais)
  'reserva-pinheiros': 'reserva pinheiros',
  'reserva-rooftop': 'reserva pinheiros',
  highline: 'highline',
  pracinha: 'pracinha',
  justino: 'seu justino',
  ohfregues: 'oh fregues',

  // compatibilidade com slugs antigos
  reservarooftop: 'reserva pinheiros',
  reservapinheiros: 'reserva pinheiros',
};

interface ReservarSlugPageProps {
  params: {
    slug: string;
  };
}

export default function ReservarSlugPage({ params }: ReservarSlugPageProps) {
  const rawSlug = params.slug?.toLowerCase();
  const establishment = establishmentSlugMap[rawSlug];

  if (!establishment) {
    return redirect('/reservar');
  }

  const search = new URLSearchParams({
    establishment,
  }).toString();

  return redirect(`/reservar?${search}`);
}

