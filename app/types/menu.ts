export interface Topping {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  barId: string;
  category: string;
  toppings: Topping[];
  order: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  barId: string;
  order: number;
  items: MenuItem[];
}

export interface Bar {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  address: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
}

export interface BarForm {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  address: string;
  rating: string;
  reviewsCount: string;
  amenities: string[];
  latitude: string;
  longitude: string;
}

export interface MenuCategoryForm {
  name: string;
  barId: string;
  order: number;
}

export interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  categoryId: string;
  barId: string;
  toppings: Topping[];
  order: number;
} 