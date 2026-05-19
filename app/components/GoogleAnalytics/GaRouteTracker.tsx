'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getGaMeasurementId } from '@/app/config/analytics';

/**
 * Envia page_view no GA4 a cada navegação client-side (App Router).
 * Sem isso, só a primeira carga conta — o restante do site parece "sem usuários".
 */
export default function GaRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const measurementId = getGaMeasurementId();
  const skipInitialRef = useRef(true);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

    if (skipInitialRef.current) {
      skipInitialRef.current = false;
      return;
    }

    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    const pageTitle = typeof document !== 'undefined' ? document.title : pagePath;

    window.gtag('config', measurementId, {
      page_path: pagePath,
      page_title: pageTitle,
      send_page_view: true,
    });
  }, [pathname, searchParams, measurementId]);

  return null;
}
