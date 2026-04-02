'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.agilizaiapp.com.br';

/**
 * Regista visualização de páginas /admin (page view) na API de action-logs.
 */
export default function AdminPageViewLogger() {
  const pathname = usePathname();
  const lastSentRef = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    if (!pathname?.startsWith('/admin')) return;

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) return;

    const now = Date.now();
    const prev = lastSentRef.current;
    if (
      prev &&
      prev.path === pathname &&
      now - prev.at < 1500
    ) {
      return;
    }
    lastSentRef.current = { path: pathname, at: now };

    const t = window.setTimeout(() => {
      fetch(`${API_URL}/api/action-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          actionType: 'page_view_admin',
          actionDescription: `Visualizou página admin: ${pathname}`,
          resourceType: 'admin_page',
          resourceId: null,
          status: 'success',
          additionalData: {
            path: pathname,
            source: 'next_admin_layout',
          },
        }),
      }).catch(() => {});
    }, 300);

    return () => window.clearTimeout(t);
  }, [pathname]);

  return null;
}
