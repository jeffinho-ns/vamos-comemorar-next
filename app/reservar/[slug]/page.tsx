import { redirect } from 'next/navigation';

const establishmentSlugMap: Record<string, string> = {
  reservarooftop: 'reserva rooftop',
  highline: 'highline',
  pracinha: 'pracinha',
  justino: 'seu justino',
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

