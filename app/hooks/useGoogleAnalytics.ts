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

  // Função específica para rastrear visualização de item do cardápio
  const trackMenuItemView = (
    itemName: string,
    itemId: string | number,
    establishmentName: string,
    establishmentSlug: string,
    category: string,
    price: number,
    pageLocation: string
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        event_category: 'menu_item',
        event_label: itemName,
        item_id: String(itemId),
        item_name: itemName,
        item_category: category,
        price: price,
        currency: 'BRL',
        establishment_name: establishmentName,
        establishment_slug: establishmentSlug,
        page_location: pageLocation,
      });
    }
  };

  // Função específica para rastrear clique em item do cardápio
  const trackMenuItemClick = (
    itemName: string,
    itemId: string | number,
    establishmentName: string,
    establishmentSlug: string,
    category: string,
    price: number,
    pageLocation: string
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'select_item', {
        event_category: 'menu_item',
        event_label: itemName,
        item_id: String(itemId),
        item_name: itemName,
        item_category: category,
        price: price,
        currency: 'BRL',
        establishment_name: establishmentName,
        establishment_slug: establishmentSlug,
        page_location: pageLocation,
      });
    }
  };

  // Função para rastrear visualização de categoria/subcategoria
  const trackCategoryView = (
    categoryName: string,
    subcategoryName: string | null,
    establishmentName: string,
    establishmentSlug: string,
    pageLocation: string
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item_list', {
        event_category: 'menu_category',
        event_label: subcategoryName ? `${categoryName} - ${subcategoryName}` : categoryName,
        category_name: categoryName,
        subcategory_name: subcategoryName || '',
        establishment_name: establishmentName,
        establishment_slug: establishmentSlug,
        page_location: pageLocation,
      });
    }
  };

  // Função para rastrear visualização da página do cardápio
  const trackMenuPageView = (
    establishmentName: string,
    establishmentSlug: string,
    pageLocation: string
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: `Cardápio - ${establishmentName}`,
        page_location: pageLocation,
        establishment_name: establishmentName,
        establishment_slug: establishmentSlug,
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackMenuItemView,
    trackMenuItemClick,
    trackCategoryView,
    trackMenuPageView,
  };
};















