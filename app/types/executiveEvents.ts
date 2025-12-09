export interface ExecutiveEvent {
  id: number;
  establishment_id: number;
  name: string;
  event_date: string;
  logo_url?: string;
  cover_image_url?: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  establishment_name?: string;
  items_count?: number;
  category_ids?: number[];
  subcategory_ids?: string[];
  settings?: EventSettings;
}

export interface EventSettings {
  custom_colors?: {
    categoryBgColor?: string;
    categoryTextColor?: string;
    subcategoryBgColor?: string;
    subcategoryTextColor?: string;
    sidebarBgColor?: string;
    sidebarTextColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  welcome_message?: string;
  wifi_info?: {
    network?: string;
    password?: string;
  };
}

export interface EventItem {
  id: number;
  name: string;
  description: string;
  // price: number; -- REMOVIDO: Não retornado pela API pública
  imageUrl?: string;
  categoryId: number;
  category: string;
  subCategoryName?: string;
  seals: string[];
  display_order: number;
}

export interface EventCategory {
  id: number;
  name: string;
  items: EventItem[];
}

export interface EventSeal {
  id: number;
  name: string;
  color: string;
  type: 'food' | 'drink' | 'custom';
  display_order: number;
}

export interface PublicEventResponse {
  event: ExecutiveEvent & { settings: EventSettings };
  categories: EventCategory[];
  seals: EventSeal[];
}

export interface ExecutiveEventForm {
  establishment_id: string;
  name: string;
  event_date: string;
  logo_url?: string;
  cover_image_url?: string;
  category_ids: number[];
  subcategory_ids: string[];
  custom_colors: EventSettings['custom_colors'];
  welcome_message?: string;
  wifi_info?: EventSettings['wifi_info'];
  is_active?: boolean;
}

