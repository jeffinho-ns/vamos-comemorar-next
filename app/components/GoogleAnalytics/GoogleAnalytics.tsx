'use client';

import { Suspense, useEffect } from 'react';
import Script from 'next/script';
import { areGaIdsMisconfigured, getGaMeasurementId } from '@/app/config/analytics';
import GaRouteTracker from './GaRouteTracker';

const GA_MEASUREMENT_ID = getGaMeasurementId();
const GA_DEBUG = process.env.NEXT_PUBLIC_GA_DEBUG === 'true';

export default function GoogleAnalytics() {
  useEffect(() => {
    if (areGaIdsMisconfigured()) {
      console.warn(
        '[GA] NEXT_PUBLIC_GA_ID e NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID são diferentes. ' +
          'O gtag usa NEXT_PUBLIC_GA_ID. Alinhe os dois no Vercel para evitar dados em propriedades distintas.',
      );
    }
  }, []);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: true,
            ${GA_DEBUG ? "debug_mode: true," : ''}
            anonymize_ip: true
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <GaRouteTracker />
      </Suspense>
    </>
  );
}
