import { redirect } from 'next/navigation';

const establishmentSlugMap: Record<string, string> = {
  'reserva-pinheiros': 'reserva pinheiros',
  'reserva-rooftop': 'reserva rooftop',
  highline: 'highline',
  pracinha: 'pracinha',
  justino: 'seu justino',
  ohfregues: 'oh fregues',

  // compatibilidade com slugs antigos
  reservarooftop: 'reserva rooftop',
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

