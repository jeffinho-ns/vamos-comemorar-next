'use client';

declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: Record<string, any>
    ) => void;
  }
}

export const useGoogleAnalytics = () => {
  const trackEvent = (
    action: string,
    category: string,
    label?: string,
    value?: number
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };

  const trackPageView = (page_title: string, page_location: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: page_title,
        page_location: page_location,
      });
    }
  };

  const trackClick = (
    element_name: string,
    page_location: string,
    category: string = 'engagement'
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'click', {
        event_category: category,
        event_label: element_name,
        page_location: page_location,
        custom_parameter: 'banner_click',
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
    trackClick,
  };
};












