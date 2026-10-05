"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
  use,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdStar,
  MdLocationOn,
  MdArrowBack,
  MdClose,
  MdMenu,
  MdHome,
  MdSearch,
  MdViewList,
  MdGridView,
  MdCropSquare,
  MdStarBorder,
} from "react-icons/md";
import { FaFacebook, FaInstagram, FaWhatsapp, FaHeart, FaRegHeart } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { useMediaQuery } from "react-responsive"; // Importação do hook
import { useGoogleAnalytics } from "../../hooks/useGoogleAnalytics";

import ImageSlider from "../../components/ImageSlider/ImageSlider";
import { applySeuJustinoSubcategoryOrder } from "../seuJustinoMenuOrder";
import { scrollToSection } from "../../utils/scrollToSection";

import {
  type CardapioImageVariant,
  getCardapioPlaceholderUrl,
  resolveCardapioImageUrl,
  warmCardapioImageIndex,
} from "@/app/utils/cardapioImageResolver";

// Constantes dos selos
const FOOD_SEALS: { [key: string]: { name: string; color: string } } = {
  "especial-do-dia": { name: "Especial do Dia", color: "#FF6B35" },
  vegetariano: { name: "Vegetariano", color: "#4CAF50" },
  "saudavel-leve": { name: "Saudável/Leve", color: "#8BC34A" },
  "prato-da-casa": { name: "Prato da Casa", color: "#FF9800" },
  artesanal: { name: "Artesanal", color: "#795548" },
};

const DRINK_SEALS: { [key: string]: { name: string; color: string } } = {
  "assinatura-bartender": { name: "Assinatura do Bartender", color: "#9C27B0" },
  "edicao-limitada": { name: "Edição Limitada", color: "#E91E63" },
  "processo-artesanal": { name: "Processo Artesanal", color: "#673AB7" },
  "sem-alcool": { name: "Sem Álcool", color: "#00BCD4" },
  refrescante: { name: "Refrescante", color: "#00E5FF" },
  citrico: { name: "Cítrico", color: "#FFEB3B" },
  doce: { name: "Doce", color: "#FFC107" },
  picante: { name: "Picante", color: "#F44336" },
};

const ALL_SEALS = { ...FOOD_SEALS, ...DRINK_SEALS };

// Função para obter selo por ID, incluindo customizados do bar
const getSealById = (sealId: string, bar?: BarFromAPI) => {
  // Primeiro tenta nos selos padrão
  if (ALL_SEALS[sealId]) {
    // Se o bar tem custom_seals e esse selo está customizado, usa o customizado
    if (bar?.custom_seals) {
      const customSeal = bar.custom_seals.find((s) => s.id === sealId);
      if (customSeal) {
        return { name: customSeal.name, color: customSeal.color };
      }
    }
    return ALL_SEALS[sealId];
  }

  // Se não encontrou nos padrão, tenta nos customizados
  if (bar?.custom_seals) {
    const customSeal = bar.custom_seals.find((s) => s.id === sealId);
    if (customSeal) {
      return { name: customSeal.name, color: customSeal.color };
    }
  }

  return null;
};

// Interfaces
type MenuDisplayStyle = "normal" | "clean";

interface Topping {
  id: string | number;
  name: string;
  price: number;
}

interface MenuItem {
  id: string | number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string | number;
  barId: string | number;
  subCategoryId?: string | number;
  subCategoryName?: string;
  toppings: Topping[];
  order: number;
  seals?: string[];
  visible?: boolean | number | null;
  effectiveVisible?: boolean;
  schedulePaused?: boolean;
  isPriceOnRequest?: boolean; // Indica se o preço é "Sob Consulta"
  featured?: boolean;
}

function variationRank(label: string): number {
  const normalized = label.trim().toLowerCase();
  if (normalized.startsWith("dose")) return 0;
  if (normalized === "garrafa") return 2;
  return 1;
}

function getItemPriceVariations(item: MenuItem): {
  id: string;
  label: string;
  price: number;
}[] {
  const toppings = item.toppings || [];
  if (toppings.length === 0) return [];

  const extras = toppings
    .map((topping) => ({
      id: String(topping.id),
      label:
        topping.name.trim().toLowerCase() === "garrafa"
          ? "Garrafa"
          : topping.name.trim(),
      price: Number(topping.price),
    }))
    .sort((left, right) => variationRank(left.label) - variationRank(right.label));

  const basePrice = Number(item.price);
  if (!Number.isFinite(basePrice) || basePrice < 0) return extras;

  const drinkStyle = extras.some((option) => variationRank(option.label) !== 1);
  return [
    {
      id: "base",
      label: drinkStyle ? "Dose" : "Tradicional",
      price: basePrice,
    },
    ...extras,
  ];
}

interface MenuCategory {
  id: string | number;
  name: string;
  barId: string | number;
  order: number;
  items: MenuItem[];
}

interface BarFromAPI {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  coverImages: string[] | string | null;
  address: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  popupImageUrl?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  // 🎨 Campos de personalização de cores
  menu_category_bg_color?: string;
  menu_category_text_color?: string;
  menu_subcategory_bg_color?: string;
  menu_subcategory_text_color?: string;
  mobile_sidebar_bg_color?: string;
  mobile_sidebar_text_color?: string;
  custom_seals?: Array<{
    id: string;
    name: string;
    color: string;
    type: "food" | "drink";
  }>;
  menu_display_style?: MenuDisplayStyle;
  partner_logos?: string[] | string | null;
  ad_images?: string[] | string | null;
}

interface Bar {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  coverImages: string[];
  address: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  popupImageUrl?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  // 🎨 Campos de personalização de cores
  menu_category_bg_color?: string;
  menu_category_text_color?: string;
  menu_subcategory_bg_color?: string;
  menu_subcategory_text_color?: string;
  mobile_sidebar_bg_color?: string;
  mobile_sidebar_text_color?: string;
  custom_seals?: Array<{
    id: string;
    name: string;
    color: string;
    type: "food" | "drink";
  }>;
  menu_display_style: MenuDisplayStyle;
  partner_logos?: string[];
  ad_images?: string[];
}

interface GroupedCategory {
  id: string | number;
  name: string;
  subCategories: {
    name: string;
    items: MenuItem[];
  }[];
}

interface CardapioBarPageProps {
  params: Promise<{ slug: string }>;
}

type MenuSpySnapshot = { category: string; subcategory: string };

type MenuSpy = {
  get: () => MenuSpySnapshot;
  set: (next: MenuSpySnapshot) => void;
  subscribe: (listener: () => void) => () => void;
};

const EMPTY_MENU_SPY: MenuSpySnapshot = { category: "", subcategory: "" };

function createMenuSpy(): MenuSpy {
  let current = EMPTY_MENU_SPY;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (next) => {
      if (
        current.category === next.category &&
        current.subcategory === next.subcategory
      ) {
        return;
      }
      current = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function scrollChipIntoRow(button: HTMLButtonElement | null) {
  const row = button?.parentElement;
  if (!button || !row) return;
  const target =
    button.offsetLeft - row.clientWidth / 2 + button.offsetWidth / 2;
  const nextLeft = Math.max(target, 0);
  if (Math.abs(row.scrollLeft - nextLeft) < 12) return;
  row.scrollTo({ left: nextLeft, behavior: "auto" });
}

function IdeiaumCategoryChips({
  categories,
  spy,
  onSelectCategory,
  onSelectSubcategory,
  registerCategoryMenuRef,
  registerSubcategoryMenuRef,
}: {
  categories: GroupedCategory[];
  spy: MenuSpy;
  onSelectCategory: (categoryName: string) => void;
  onSelectSubcategory: (categoryName: string, subcategoryName: string) => void;
  registerCategoryMenuRef: (
    categoryName: string,
    element: HTMLButtonElement | null,
  ) => void;
  registerSubcategoryMenuRef: (
    categoryName: string,
    subcategoryName: string,
    element: HTMLButtonElement | null,
  ) => void;
}) {
  const active = useSyncExternalStore(
    spy.subscribe,
    spy.get,
    () => EMPTY_MENU_SPY,
  );
  const activeCategory =
    categories.find((category) => category.name === active.category) ||
    categories[0];

  useEffect(() => {
    if (!activeCategory || !active.subcategory) return;
    scrollChipIntoRow(
      document.querySelector<HTMLButtonElement>(
        `[data-ideiaum-subcategory="${CSS.escape(activeCategory.name)}::${CSS.escape(active.subcategory)}"]`,
      ),
    );
  }, [active.category, active.subcategory, activeCategory]);

  if (!activeCategory) return null;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((category) => {
          const categoryIsActive = active.category
            ? active.category === category.name
            : category.name === activeCategory.name;
          return (
            <button
              key={category.id}
              ref={(element) => registerCategoryMenuRef(category.name, element)}
              onClick={() => onSelectCategory(category.name)}
              className={`category-tab whitespace-nowrap rounded-xl border border-neutral-900 px-4 py-2.5 text-sm font-semibold ${
                categoryIsActive
                  ? "bg-neutral-950 text-white"
                  : "bg-white text-neutral-900"
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {activeCategory.subCategories.map((subcat) => {
          const subIsActive =
            active.subcategory === subcat.name &&
            (active.category || activeCategory.name) === activeCategory.name;
          return (
            <button
              key={subcat.name}
              data-ideiaum-subcategory={`${activeCategory.name}::${subcat.name}`}
              ref={(element) =>
                registerSubcategoryMenuRef(
                  activeCategory.name,
                  subcat.name,
                  element,
                )
              }
              onClick={() =>
                onSelectSubcategory(activeCategory.name, subcat.name)
              }
              className={`subcategory-tab whitespace-nowrap rounded-xl border border-neutral-900 px-4 py-2 text-sm font-semibold ${
                subIsActive
                  ? "bg-neutral-950 text-white"
                  : "bg-white text-neutral-900"
              }`}
            >
              {subcat.name}
            </button>
          );
        })}
      </div>
    </>
  );
}

const ESTABLISHMENT_HOME_PATH: Record<string, string> = {
  justino: "/justino",
  pracinha: "/pracinha",
  "ape-do-pracinha": "/pracinha",
  highline: "/highline",
  highlineclub: "/highline",
  ohfregues: "/ohfregues",
  "reserva-rooftop": "/reserva-rooftop",
  "reserva-pinheiros": "/reserva-pinheiros",
};

const HIGHLINE_MENU_SLUG = {
  bar: "highline",
  club: "highlineclub",
} as const;

function isHighlineMenuSlug(value?: string) {
  const current = (value || "").toLowerCase();
  return (
    current === HIGHLINE_MENU_SLUG.bar || current === HIGHLINE_MENU_SLUG.club
  );
}

function parsePartnerLogosFromBar(bar: BarFromAPI): string[] {
  const raw = bar.partner_logos as unknown;
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (x): x is string => typeof x === "string" && x.trim() !== "",
    );
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (x): x is string => typeof x === "string" && x.trim() !== "",
        );
      }
    } catch {
      return [t];
    }
  }
  return [];
}

function parseAdImagesFromBar(bar: BarFromAPI): string[] {
  const raw = bar.ad_images as unknown;
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (x): x is string => typeof x === "string" && x.trim() !== "",
    );
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (x): x is string => typeof x === "string" && x.trim() !== "",
        );
      }
    } catch {
      return [t];
    }
  }
  return [];
}

const API_BASE_URL = "https://api.agilizaiapp.com.br/api/cardapio";
// Placeholders locais para evitar erros 404 externos
const PLACEHOLDER_IMAGE_URL = "/placeholder-cardapio.svg";
const PLACEHOLDER_LOGO_URL = getCardapioPlaceholderUrl();

const getValidImageUrl = (
  filename?: string | null,
  variant: CardapioImageVariant = "full",
): string => {
  return resolveCardapioImageUrl(filename || null, variant);
};

const PRACINHA_BEBIDAS_SUBCATEGORY_ORDER = [
  {
    canonical: "EXCEPCIONAIS CAIPIRINHAS DO PRACINHA",
    aliases: ["Excepcionais Caipirinhas do Pracinha"],
  },
  { canonical: "SÓ TEM NO PRACINHA", aliases: ["Só tem no Pracinha"] },
  {
    canonical: "DRINKS BRASILEIROS",
    aliases: ["Drinks Brasileirinhos", "Drinks Brasileiros"],
  },
  { canonical: "DRINKS CLÁSSICOS", aliases: ["Drinks Clássicos"] },
  {
    canonical: "CHOPPS E CERVEJA",
    aliases: ["Chopps & Cervejas", "Chopps e Cervejas"],
  },
  {
    canonical: "DRINKS SEM ALCOOL",
    aliases: ["Drinks Sem Álcool", "Drinks Sem Alcool"],
  },
  {
    canonical: "GIN NA TAÇA",
    aliases: ["Gin na Taça e Amor no Coração", "Gin na Taça"],
  },
  { canonical: "SPRITZ", aliases: ["Spritz"] },
  {
    canonical: "SHOTS DA PRAÇA",
    aliases: ["Shotzins da Praça", "Shots da Praça"],
  },
  { canonical: "OUTROS", aliases: ["Others", "Outros"] },
  { canonical: "COMBOS", aliases: ["Combos"] },
  { canonical: "WHISKY", aliases: ["Whisky"] },
  { canonical: "GIN", aliases: ["Gin"] },
  { canonical: "VODKA", aliases: ["Vodka"] },
  { canonical: "LICOR", aliases: ["Liqueur", "Licor"] },
  { canonical: "RUM", aliases: ["Rum"] },
  { canonical: "TEQUILA", aliases: ["Tequila"] },
  { canonical: "SOFT'S", aliases: ["Soft Drinks", "Soft's"] },
];

const normalizeSortKey = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[`´']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const groupItemsBySubcategory = (
  items: MenuItem[],
  categoryName?: string,
  barSlug?: string,
): { name: string; items: MenuItem[] }[] => {
  const grouped = items.reduce(
    (acc, item) => {
      const subCategoryName =
        item.subCategoryName && item.subCategoryName.trim() !== ""
          ? item.subCategoryName
          : "Tradicional";
      if (!acc[subCategoryName]) {
        acc[subCategoryName] = [];
      }
      acc[subCategoryName].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>,
  );

  const result = Object.keys(grouped).map((name) => ({
    name,
    items: grouped[name].sort(
      (a, b) => Number(a.order || 0) - Number(b.order || 0),
    ),
  }));

  const justinoOrdered = applySeuJustinoSubcategoryOrder(
    barSlug,
    categoryName,
    result,
  );
  if (justinoOrdered !== result) return justinoOrdered;

  const minItemOrder = (items: MenuItem[]) =>
    items.reduce(
      (min, item) => Math.min(min, Number(item.order || 0)),
      Number.POSITIVE_INFINITY,
    );

  const isPracinhaBebidas =
    normalizeSortKey(barSlug || "") === normalizeSortKey("pracinha") &&
    normalizeSortKey(categoryName || "") === normalizeSortKey("Bebidas");

  const pracinhaOrderMap = new Map<string, number>();
  if (isPracinhaBebidas) {
    PRACINHA_BEBIDAS_SUBCATEGORY_ORDER.forEach((entry, index) => {
      pracinhaOrderMap.set(normalizeSortKey(entry.canonical), index);
      entry.aliases.forEach((alias) =>
        pracinhaOrderMap.set(normalizeSortKey(alias), index),
      );
    });
  }

  // Ordem dos itens (salva no admin) tem prioridade; Pracinha só empatiza
  return [...result].sort((a, b) => {
    const orderDiff = minItemOrder(a.items) - minItemOrder(b.items);
    if (orderDiff !== 0) return orderDiff;

    if (isPracinhaBebidas) {
      const aRank = pracinhaOrderMap.get(normalizeSortKey(a.name));
      const bRank = pracinhaOrderMap.get(normalizeSortKey(b.name));
      if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
      if (aRank !== undefined) return -1;
      if (bRank !== undefined) return 1;
    }

    return a.name.localeCompare(b.name);
  });
};

/** Remove categorias/subcategorias sem itens visíveis (pausados ou fora da agenda). */
const filterVisibleMenuCategories = (categories: GroupedCategory[]): GroupedCategory[] =>
  categories
    .map((category) => ({
      ...category,
      subCategories: category.subCategories.filter((sub) => sub.items.length > 0),
    }))
    .filter((category) => category.subCategories.length > 0);

const normalizeToDomId = (value: string) => {
  if (!value) return "secao";
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "secao"
  );
};

const getCategoryDomId = (categoryName: string) =>
  `category-${normalizeToDomId(categoryName)}`;

const getSubcategoryDomId = (categoryName: string, subcategoryName: string) =>
  `subcategory-${normalizeToDomId(categoryName)}-${normalizeToDomId(subcategoryName)}`;

export default function CardapioBarPage({ params }: CardapioBarPageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  const {
    trackClick,
    trackMenuItemClick,
    trackMenuItemView,
    trackCategoryView,
    trackMenuPageView,
  } = useGoogleAnalytics();

  const isHighlineMenuPair = isHighlineMenuSlug(slug);
  const [showHighlineChoice, setShowHighlineChoice] =
    useState(isHighlineMenuPair);
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [menuCategories, setMenuCategories] = useState<GroupedCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [menuSearchOpen, setMenuSearchOpen] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [categoryBarHeight, setCategoryBarHeight] = useState<number>(0);
  const [menuPinned, setMenuPinned] = useState(false);
  const [menuItemView, setMenuItemView] = useState<"lista" | "grade" | "grande">(
    "grade",
  );
  const [likedItemIds, setLikedItemIds] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [selectedVariationId, setSelectedVariationId] = useState("base");
  const categoryBarRef = useRef<HTMLDivElement | null>(null);
  const menuAnchorRef = useRef<HTMLDivElement | null>(null);
  const destaquesRowRef = useRef<HTMLDivElement | null>(null);
  const menuSpyRef = useRef<MenuSpy | null>(null);
  if (!menuSpyRef.current) {
    menuSpyRef.current = createMenuSpy();
  }
  const menuSpy = menuSpyRef.current;

  // Refs para ScrollSpy
  const subcategoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const subcategoryMenuRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const categoryMenuRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isScrollingProgrammatically = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const currentActiveCategoryRef = useRef<string>("");
  const currentActiveSubcategoryRef = useRef<string>("");
  const trackedCategoryRef = useRef<string>("");
  const trackedSubcategoryRef = useRef<string>("");
  const selectedBarRef = useRef<Bar | null>(null);

  // Hook para verificar se a tela é mobile
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const isCleanStyle = useMemo(() => {
    if (!selectedBar) return false;
    return (
      selectedBar.menu_display_style === "clean" ||
      ((selectedBar.slug === "reserva-rooftop" ||
        selectedBar.slug === "reserva-pinheiros") &&
        selectedBar.menu_display_style !== "normal")
    );
  }, [selectedBar]);

  const handleItemClick = useCallback(
    (item: MenuItem) => {
      setSelectedItem(item);
      setSelectedVariationId("base");
      setImageError(null); // Resetar erro de imagem ao selecionar novo item

      // Rastrear clique no item do cardápio
      if (selectedBar) {
        const pageLocation =
          typeof window !== "undefined"
            ? window.location.href
            : `/cardapio/${slug}`;
        const category = menuCategories.find((cat) =>
          cat.subCategories.some((sub) =>
            sub.items.some((i) => i.id === item.id),
          ),
        );
        const categoryName = category?.name || "Sem categoria";

        trackMenuItemClick(
          item.name,
          item.id,
          selectedBar.name,
          slug,
          categoryName,
          item.price,
          pageLocation,
        );
      }
    },
    [setSelectedItem, selectedBar, menuCategories, slug, trackMenuItemClick],
  );

  const handleCloseModal = () => {
    setSelectedItem(null);
    setImageError(null);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const fetchBarData = useCallback(async () => {
    try {
      if (!slug) return;

      // Aquecer índice (filename -> URL Firebase) antes de resolver logo/capa
      await warmCardapioImageIndex(API_BASE_URL);

      const barsResponse = await fetch(`${API_BASE_URL}/bars`);
      if (!barsResponse.ok)
        throw new Error("Erro ao carregar estabelecimentos");

      const bars = await barsResponse.json();
      const bar = bars.find((b: BarFromAPI) => b.slug === slug);

      if (!bar) {
        setError("Estabelecimento não encontrado");
        setIsLoading(false);
        return;
      }

      let coverImages: string[] = [];
      if (bar.coverImages && typeof bar.coverImages === "string") {
        try {
          const parsed = JSON.parse(bar.coverImages);
          if (Array.isArray(parsed)) {
            coverImages = parsed.map((img: string) =>
              getValidImageUrl(img, "medium"),
            );
          }
        } catch (e) {
          coverImages = bar.coverImages.trim()
            ? [getValidImageUrl(bar.coverImages, "medium")]
            : [];
        }
      } else if (Array.isArray(bar.coverImages)) {
        coverImages = bar.coverImages.map((img: string) =>
          getValidImageUrl(img, "medium"),
        );
      }

      const barWithImages: Bar = {
        ...bar,
        logoUrl: getValidImageUrl(bar.logoUrl, "thumb"),
        coverImageUrl: getValidImageUrl(bar.coverImageUrl, "medium"),
        coverImages:
          coverImages.length > 0
            ? coverImages
            : [getValidImageUrl(bar.coverImageUrl, "medium")],
        popupImageUrl: bar.popupImageUrl
          ? getValidImageUrl(bar.popupImageUrl, "medium")
          : undefined,
        facebook: bar.facebook || "",
        instagram: bar.instagram || "",
        whatsapp: bar.whatsapp || "",
        custom_seals: bar.custom_seals || [],
        menu_display_style:
          bar.menu_display_style === "clean" ? "clean" : "normal",
        partner_logos: parsePartnerLogosFromBar(bar)
          .slice(0, 5)
          .map((img: string) => getValidImageUrl(img, "thumb")),
        ad_images: parseAdImagesFromBar(bar)
          .slice(0, 10)
          .map((img: string) => getValidImageUrl(img, "medium")),
      };

      setSelectedBar(barWithImages);
      selectedBarRef.current = barWithImages;

      const [categoriesResponse, itemsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/items`),
      ]);

      if (!categoriesResponse.ok || !itemsResponse.ok)
        throw new Error("Erro ao carregar dados do cardápio");

      const [categories, items] = await Promise.all([
        categoriesResponse.json(),
        itemsResponse.json(),
      ]);

      // Normalizar IDs para comparação (pode ser string ou number)
      const normalizedBarId = String(bar.id);
      const barCategories = categories.filter(
        (cat: MenuCategory) => String(cat.barId) === normalizedBarId,
      );
      const barItems = items.filter((item: MenuItem) => {
        // Filtrar por barId e apenas itens visíveis (visible === 1 ou true ou null/undefined)
        const matchesBar = String(item.barId) === normalizedBarId;
        const isVisible =
          item.effectiveVisible !== undefined && item.effectiveVisible !== null
            ? Boolean(item.effectiveVisible)
            : item.visible === undefined ||
              item.visible === null ||
              item.visible === 1 ||
              item.visible === true;
        const isPlaceholder = String(item.name || "")
          .trim()
          .toLowerCase()
          .startsWith("[nova subcategoria]");
        return matchesBar && isVisible && !isPlaceholder;
      });

      console.log("🔍 Debug fetchBarData:", {
        slug,
        barId: bar.id,
        normalizedBarId,
        totalCategories: categories.length,
        totalItems: items.length,
        barCategoriesCount: barCategories.length,
        barItemsCount: barItems.length,
        sampleItems: barItems.slice(0, 3).map((i: MenuItem) => ({
          id: i.id,
          name: i.name,
          barId: i.barId,
          visible: i.visible,
        })),
      });

      const groupedCategories = barCategories.map((category: MenuCategory) => {
        const normalizedCategoryId = String(category.id);
        const categoryItems = barItems.filter(
          (item: MenuItem) => String(item.categoryId) === normalizedCategoryId,
        );
        return {
          ...category,
          subCategories: groupItemsBySubcategory(
            categoryItems,
            category.name,
            bar.slug,
          ),
        };
      });

      const visibleCategories = filterVisibleMenuCategories(groupedCategories);

      console.log("📊 Categorias agrupadas:", {
        totalCategories: groupedCategories.length,
        visibleCategories: visibleCategories.length,
        categories: visibleCategories.map((c: GroupedCategory) => ({
          id: c.id,
          name: c.name,
          itemsCount: c.subCategories.reduce(
            (sum: number, sub: { name: string; items: MenuItem[] }) =>
              sum + sub.items.length,
            0,
          ),
        })),
      });

      setMenuCategories(visibleCategories);

      if (visibleCategories.length > 0) {
        const firstCategory = visibleCategories[0];
        setSelectedCategory(firstCategory.name);
        menuSpyRef.current?.set({
          category: firstCategory.name,
          subcategory: firstCategory.subCategories[0]?.name || "",
        });
      } else {
        setSelectedCategory("");
      }

      // Rastrear visualização da página do cardápio
      const pageLocation =
        typeof window !== "undefined"
          ? window.location.href
          : `/cardapio/${slug}`;
      trackMenuPageView(barWithImages.name, slug, pageLocation);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar dados do estabelecimento");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchBarData();
  }, [fetchBarData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const headerElement = document.querySelector("header");
    if (!headerElement) return;

    const updateHeaderHeight = () => {
      setHeaderHeight(headerElement.getBoundingClientRect().height);
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    if (!categoryBarRef.current) return;

    const updateCategoryBarHeight = () => {
      if (!categoryBarRef.current) return;
      setCategoryBarHeight(
        categoryBarRef.current.getBoundingClientRect().height,
      );
    };

    updateCategoryBarHeight();

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateCategoryBarHeight());
      resizeObserver.observe(categoryBarRef.current);
    }

    window.addEventListener("resize", updateCategoryBarHeight);

    return () => {
      window.removeEventListener("resize", updateCategoryBarHeight);
      if (resizeObserver && categoryBarRef.current) {
        resizeObserver.unobserve(categoryBarRef.current);
      }
    };
  }, [isLoading, menuCategories.length, menuPinned]);

  const isIdeiaumSlug = Boolean(
    ESTABLISHMENT_HOME_PATH[(slug || "").toLowerCase()],
  );

  useEffect(() => {
    if (!isIdeiaumSlug) return;
    const anchor = menuAnchorRef.current;
    if (!anchor) return;

    const updatePin = () => {
      setMenuPinned(anchor.getBoundingClientRect().top <= 0);
    };

    updatePin();
    window.addEventListener("scroll", updatePin, { passive: true });
    window.addEventListener("resize", updatePin);

    return () => {
      window.removeEventListener("scroll", updatePin);
      window.removeEventListener("resize", updatePin);
    };
  }, [isIdeiaumSlug, isLoading, menuCategories.length]);

  // Rastreamento de categoria/subcategoria agora é feito diretamente no IntersectionObserver
  // para evitar re-renders. Este useEffect foi removido.

  useEffect(() => {
    if (
      selectedBar &&
      selectedBar.popupImageUrl &&
      selectedBar.popupImageUrl.trim() !== ""
    ) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 2000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [selectedBar]);

  const formatPrice = useCallback(
    (price: number, isPriceOnRequest?: boolean) => {
      const normalizedPrice = Number(price);
      if (
        isPriceOnRequest ||
        normalizedPrice === -1 ||
        price === null ||
        price === undefined
      ) {
        // Quando o item está "Sob Consulta", não exibir texto algum
        return "";
      }
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(normalizedPrice);
    },
    [],
  );

  const currentCategory = useMemo(
    () => menuCategories.find((cat) => cat.name === selectedCategory),
    [menuCategories, selectedCategory],
  );

  const eagerItemIds = useMemo(() => {
    const ids = new Set<string | number>();
    for (const category of menuCategories) {
      for (const subcategory of category.subCategories) {
        for (const item of subcategory.items) {
          ids.add(item.id);
          if (ids.size >= 12) {
            return ids;
          }
        }
      }
    }
    return ids;
  }, [menuCategories]);

  const categoriesOnScreen = useMemo(() => {
    const query = menuSearchQuery.trim().toLowerCase();
    if (!query) return menuCategories;

    return menuCategories
      .map((category) => ({
        ...category,
        subCategories: category.subCategories
          .map((subcategory) => ({
            ...subcategory,
            items: subcategory.items.filter((item) =>
              `${item.name} ${item.description || ""}`
                .toLowerCase()
                .includes(query),
            ),
          }))
          .filter((subcategory) => subcategory.items.length > 0),
      }))
      .filter((category) => category.subCategories.length > 0);
  }, [menuCategories, menuSearchQuery]);

  const menuDestaques = useMemo(() => {
    const chosen = categoriesOnScreen.flatMap((category) =>
      category.subCategories.flatMap((subcategory) =>
        subcategory.items
          .filter((item) => item.featured === true)
          .map((item) => {
            const basePrice = Number(item.price);
            const hasFromPrice = (item.toppings || []).some(
              (topping) => Number(topping.price) > basePrice && basePrice > 0,
            );
            return {
              key: String(item.id),
              categoryName: category.name,
              subcategoryName: subcategory.name,
              item,
              minPrice: basePrice,
              hasFromPrice,
            };
          }),
      ),
    );
    if (chosen.length > 0) return chosen;

    const category =
      categoriesOnScreen.find((entry) => entry.name === selectedCategory) ||
      categoriesOnScreen[0];
    if (!category) return [];

    return category.subCategories.flatMap((subcategory) => {
      const featured =
        subcategory.items.find((item) => Boolean(item.imageUrl)) ||
        subcategory.items[0];
      if (!featured) return [];
      const prices = subcategory.items
        .map((item) => Number(item.price))
        .filter((price) => price > 0);
      const minPrice = prices.length
        ? Math.min(...prices)
        : Number(featured.price);
      const maxPrice = prices.length ? Math.max(...prices) : minPrice;
      return [
        {
          key: `${category.name}-${subcategory.name}`,
          categoryName: category.name,
          subcategoryName: subcategory.name,
          item: featured,
          minPrice,
          hasFromPrice: maxPrice > minPrice,
        },
      ];
    });
  }, [categoriesOnScreen, selectedCategory]);

  useEffect(() => {
    const row = destaquesRowRef.current;
    if (!row) return;

    const onWheel = (event: WheelEvent) => {
      if (row.scrollWidth <= row.clientWidth + 1) return;
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (delta === 0) return;
      const atStart = row.scrollLeft <= 0 && delta < 0;
      const atEnd =
        row.scrollLeft + row.clientWidth >= row.scrollWidth - 1 && delta > 0;
      if (atStart || atEnd) return;
      row.scrollLeft += delta;
      event.preventDefault();
    };

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.button !== 0) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startScroll = row.scrollLeft;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const distance = event.clientX - startX;
      if (Math.abs(distance) < 6) return;
      moved = true;
      row.scrollLeft = startScroll - distance;
    };

    const endDrag = () => {
      dragging = false;
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    };

    row.addEventListener("wheel", onWheel, { passive: false });
    row.addEventListener("pointerdown", onPointerDown);
    row.addEventListener("click", onClickCapture, true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    return () => {
      row.removeEventListener("wheel", onWheel);
      row.removeEventListener("pointerdown", onPointerDown);
      row.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
    };
  }, [menuDestaques.length, isLoading]);

  useEffect(() => {
    if (!slug || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(`agilizai-cardapio-likes:${slug}`);
      if (!raw) {
        setLikedItemIds({});
        setLikeCounts({});
        return;
      }
      const parsed = JSON.parse(raw) as {
        counts?: Record<string, number>;
        liked?: string[];
      };
      setLikeCounts(parsed.counts || {});
      setLikedItemIds(
        Object.fromEntries((parsed.liked || []).map((id) => [id, true])),
      );
    } catch {
      setLikedItemIds({});
      setLikeCounts({});
    }
  }, [slug]);

  const toggleItemLike = useCallback(
    (itemId: string | number) => {
      const key = String(itemId);
      setLikedItemIds((previousLiked) => {
        const willLike = !previousLiked[key];
        const nextLiked = { ...previousLiked };
        if (willLike) nextLiked[key] = true;
        else delete nextLiked[key];

        setLikeCounts((previousCounts) => {
          const nextCounts = {
            ...previousCounts,
            [key]: Math.max(0, (previousCounts[key] || 0) + (willLike ? 1 : -1)),
          };
          try {
            window.localStorage.setItem(
              `agilizai-cardapio-likes:${slug}`,
              JSON.stringify({
                counts: nextCounts,
                liked: Object.keys(nextLiked),
              }),
            );
          } catch {
            // O cardápio segue utilizável se o navegador bloquear o armazenamento.
          }
          return nextCounts;
        });

        return nextLiked;
      });
    },
    [slug],
  );

  useEffect(() => {
    if (!slug || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(
        `agilizai-cardapio-ratings:${slug}`,
      );
      setItemRatings(raw ? (JSON.parse(raw) as Record<string, number>) : {});
    } catch {
      setItemRatings({});
    }
  }, [slug]);

  const rateItem = useCallback(
    (itemId: string | number, stars: number) => {
      const key = String(itemId);
      setItemRatings((previous) => {
        const next = { ...previous, [key]: stars };
        try {
          window.localStorage.setItem(
            `agilizai-cardapio-ratings:${slug}`,
            JSON.stringify(next),
          );
        } catch {
          // A avaliação continua visível nesta abertura se o navegador bloquear o armazenamento.
        }
        return next;
      });
    },
    [slug],
  );

  useEffect(() => {
    if (!isHighlineMenuPair) {
      setShowHighlineChoice(false);
      return;
    }
    const tipo = new URLSearchParams(window.location.search).get("tipo");
    const current = (slug || "").toLowerCase();
    const chosen =
      (tipo === "bar" && current === HIGHLINE_MENU_SLUG.bar) ||
      (tipo === "club" && current === HIGHLINE_MENU_SLUG.club);
    setShowHighlineChoice(!chosen);
  }, [isHighlineMenuPair, slug]);

  const chooseHighlineVenue = (tipo: "bar" | "club") => {
    const target = HIGHLINE_MENU_SLUG[tipo];
    if ((slug || "").toLowerCase() === target) {
      window.history.replaceState(null, "", `/cardapio/${target}?tipo=${tipo}`);
      setShowHighlineChoice(false);
      return;
    }
    window.location.assign(`/cardapio/${target}?tipo=${tipo}`);
  };

  useEffect(() => {
    if (!selectedItem || typeof document === "undefined") return;
    if (!ESTABLISHMENT_HOME_PATH[(slug || "").toLowerCase()]) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedItem, slug]);

  const stickyCategoryOffset = useMemo(
    () => Math.max(headerHeight, 0),
    [headerHeight],
  );

  const stickySubcategoryOffset = useMemo(
    () => stickyCategoryOffset + Math.max(categoryBarHeight, 0),
    [stickyCategoryOffset, categoryBarHeight],
  );

  // Função para atualizar visualmente os botões sem re-render (ZERO re-render do React)
  // Esta função é usada tanto no IntersectionObserver quanto nos cliques
  const updateActiveButton = useCallback(
    (categoryName: string, subcategoryName: string) => {
      const bar = selectedBarRef.current;
      const activeSubcategoryKey = `${categoryName}-${subcategoryName}`;
      const isIdeiaumBar = Boolean(
        bar?.slug && ESTABLISHMENT_HOME_PATH[bar.slug.toLowerCase()],
      );

      // 1. Atualizar botões de CATEGORIA PRINCIPAL via DOM direto
      categoryMenuRefs.current.forEach((button, key) => {
        if (!button) return;
        const isActive = key === categoryName;

        if (isActive) {
          if (isIdeiaumBar) {
            button.style.backgroundColor = "#111111";
            button.style.color = "#ffffff";
            button.style.borderColor = "#111111";
          } else if (bar) {
            button.style.backgroundColor =
              bar.menu_category_bg_color || "#3b82f6";
            button.style.color = bar.menu_category_text_color || "#ffffff";
          } else {
            button.style.backgroundColor = "#3b82f6";
            button.style.color = "#ffffff";
          }
          button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          button.classList.add("active-category");
        } else {
          // Botão inativo: voltar para padrão
          if (isIdeiaumBar) {
            button.style.backgroundColor = "#ffffff";
            button.style.color = "#111111";
            button.style.borderColor = "#111111";
          } else if (bar?.menu_display_style === "clean") {
            button.style.backgroundColor = "#f6efe3";
            button.style.color = "#403a31";
          } else {
            button.style.backgroundColor = "#ffffff";
            button.style.color = "#374151";
          }
          button.style.boxShadow = "";
          button.classList.remove("active-category");
        }
      });

      // 2. Atualizar botões de SUBCATEGORIA via DOM direto
      subcategoryMenuRefs.current.forEach((button, key) => {
        if (!button) return;
        const isActive = key === activeSubcategoryKey;

        if (isActive) {
          if (isIdeiaumBar) {
            button.style.backgroundColor = "#111111";
            button.style.color = "#ffffff";
            button.style.borderColor = "#111111";
          } else if (bar) {
            button.style.backgroundColor =
              bar.menu_subcategory_bg_color || "#3b82f6";
            button.style.color = bar.menu_subcategory_text_color || "#ffffff";
          } else {
            button.style.backgroundColor = "#3b82f6";
            button.style.color = "#ffffff";
          }
          button.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
          button.classList.add("active-subcategory");
        } else {
          // Botão inativo: voltar para padrão
          if (isIdeiaumBar) {
            button.style.backgroundColor = "#ffffff";
            button.style.color = "#111111";
            button.style.borderColor = "#111111";
          } else {
            button.style.backgroundColor = "";
            button.style.color = "";
          }
          button.style.boxShadow = "";
          button.classList.remove("active-subcategory");
        }
      });

      // 3. Auto-scroll horizontal no menu de subcategorias
      const menuButton = subcategoryMenuRefs.current.get(activeSubcategoryKey);
      if (menuButton) {
        requestAnimationFrame(() => {
          scrollChipIntoRow(menuButton);
        });
      }
    },
    [],
  );

  // Intersection Observer para ScrollSpy das subcategorias
  useEffect(() => {
    if (typeof window === "undefined" || menuCategories.length === 0) return;

    // Limpar observer anterior se existir
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Criar novo observer
    const observer = new IntersectionObserver(
      (entries) => {
        // Ignorar atualizações durante scroll programático
        if (isScrollingProgrammatically.current) return;

        // Encontrar a entrada que está mais próxima do topo da viewport
        let closestEntry: IntersectionObserverEntry | null = null;
        let closestDistance = Infinity;

        for (const entry of entries) {
          if (entry.isIntersecting) {
            const rect = entry.boundingClientRect;
            const distance = Math.abs(rect.top - stickySubcategoryOffset);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestEntry = entry;
            }
          }
        }

        // Se encontrou uma entrada, atualizar a subcategoria ativa
        if (closestEntry) {
          const target = closestEntry.target;
          if (!(target instanceof HTMLElement)) return;
          const subcategoryName = target.getAttribute("data-subcategory-name");
          const categoryName = target.getAttribute("data-category-name");

          if (subcategoryName && categoryName) {
            // Verificar se realmente mudou antes de atualizar
            if (
              currentActiveCategoryRef.current !== categoryName ||
              currentActiveSubcategoryRef.current !== subcategoryName
            ) {
              // Atualizar refs imediatamente
              currentActiveCategoryRef.current = categoryName;
              currentActiveSubcategoryRef.current = subcategoryName;
              menuSpyRef.current?.set({
                category: categoryName,
                subcategory: subcategoryName,
              });

              // Só as abas mudam. A lista de itens não redesenha.
              updateActiveButton(categoryName, subcategoryName);

              // Rastreamento de Analytics (sem causar re-render)
              if (
                trackedCategoryRef.current !== categoryName ||
                trackedSubcategoryRef.current !== subcategoryName
              ) {
                trackedCategoryRef.current = categoryName;
                trackedSubcategoryRef.current = subcategoryName;

                const bar = selectedBarRef.current;
                if (bar) {
                  const pageLocation =
                    typeof window !== "undefined"
                      ? window.location.href
                      : `/cardapio/${slug}`;
                  trackCategoryView(
                    categoryName,
                    subcategoryName,
                    bar.name,
                    slug,
                    pageLocation,
                  );
                }
              }
            }
          }
        }
      },
      {
        root: null,
        rootMargin: `-${stickySubcategoryOffset + 20}px 0px -50% 0px`,
        threshold: [0, 0.1, 0.5, 1],
      },
    );

    observerRef.current = observer;

    // Observar todas as seções de subcategorias já registradas
    subcategoryRefs.current.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [menuCategories, stickySubcategoryOffset]);

  // Função auxiliar para registrar refs de subcategorias
  const registerSubcategoryRef = useCallback(
    (
      categoryName: string,
      subcategoryName: string,
      element: HTMLDivElement | null,
    ) => {
      if (element) {
        subcategoryRefs.current.set(
          `${categoryName}-${subcategoryName}`,
          element,
        );
        // Observar o elemento imediatamente se o observer já existir
        if (observerRef.current) {
          observerRef.current.observe(element);
        }
      } else {
        const key = `${categoryName}-${subcategoryName}`;
        const oldElement = subcategoryRefs.current.get(key);
        if (oldElement && observerRef.current) {
          observerRef.current.unobserve(oldElement);
        }
        subcategoryRefs.current.delete(key);
      }
    },
    [],
  );

  // Função auxiliar para registrar refs dos botões do menu de subcategorias
  const registerSubcategoryMenuRef = useCallback(
    (
      categoryName: string,
      subcategoryName: string,
      element: HTMLButtonElement | null,
    ) => {
      if (element) {
        subcategoryMenuRefs.current.set(
          `${categoryName}-${subcategoryName}`,
          element,
        );
      } else {
        subcategoryMenuRefs.current.delete(
          `${categoryName}-${subcategoryName}`,
        );
      }
    },
    [],
  );

  // Função auxiliar para registrar refs dos botões do menu de categorias principais
  const registerCategoryMenuRef = useCallback(
    (categoryName: string, element: HTMLButtonElement | null) => {
      if (element) {
        categoryMenuRefs.current.set(categoryName, element);
      } else {
        categoryMenuRefs.current.delete(categoryName);
      }
    },
    [],
  );

  const scrollToIdWithOffset = useCallback(
    (targetId: string, offset: number) => {
      if (typeof window === "undefined") return;
      const element = document.getElementById(targetId);
      if (!element) return;

      // Marcar que estamos fazendo scroll programático
      isScrollingProgrammatically.current = true;

      const elementPosition =
        element.getBoundingClientRect().top + window.scrollY;
      const targetPosition = Math.max(elementPosition - offset, 0);

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });

      // Resetar a flag após o scroll terminar
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 1000);
    },
    [],
  );

  // Vinhos - listas auxiliares para renderização
  const WINE_COUNTRIES = [
    { id: "vinho:pais:brasil", label: "Brasil", emoji: "🇧🇷" },
    { id: "vinho:pais:franca", label: "França", emoji: "🇫🇷" },
    { id: "vinho:pais:argentina", label: "Argentina", emoji: "🇦🇷" },
    { id: "vinho:pais:portugal", label: "Portugal", emoji: "🇵🇹" },
    { id: "vinho:pais:chile", label: "Chile", emoji: "🇨🇱" },
    { id: "vinho:pais:italia", label: "Itália", emoji: "🇮🇹" },
    { id: "vinho:pais:espanha", label: "Espanha", emoji: "🇪🇸" },
  ];
  const WINE_TYPES = [
    { id: "vinho:tipo:champagne", label: "Champagne", color: "#A7D3F2" },
    { id: "vinho:tipo:espumante", label: "Espumante", color: "#B8E1FF" },
    { id: "vinho:tipo:branco", label: "Branco", color: "#F3FAD7" },
    { id: "vinho:tipo:rose", label: "Rosé", color: "#FFD1DC" },
    { id: "vinho:tipo:tinto", label: "Tinto", color: "#B71C1C" },
  ];

  const renderWineSeal = (sealId: string, size: "card" | "modal") => {
    if (sealId.startsWith("vinho:pais:")) {
      const c = WINE_COUNTRIES.find((x) => x.id === sealId);
      if (!c) return null;
      return (
        <span
          key={sealId}
          className={`${size === "modal" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"} inline-flex items-center rounded-full font-semibold bg-white text-gray-800 shadow-sm`}
        >
          <span className="mr-1">{c.emoji}</span>
          País: {c.label}
        </span>
      );
    }
    if (sealId.startsWith("vinho:tipo:")) {
      const t = WINE_TYPES.find((x) => x.id === sealId);
      if (!t) return null;
      return (
        <span
          key={sealId}
          className={`${size === "modal" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"} inline-flex items-center rounded-full font-semibold text-gray-900`}
          style={{
            backgroundColor: `${t.color}44`,
            boxShadow: `0 2px 8px ${t.color}40`,
          }}
        >
          <span
            className="inline-block w-2.5 h-2.5 mr-2 rounded"
            style={{ backgroundColor: t.color }}
          />
          Tipo: {t.label}
        </span>
      );
    }
    if (sealId.startsWith("vinho:safra:")) {
      const safra = sealId.split(":")[2] || "";
      if (!safra) return null;
      return (
        <span
          key={sealId}
          className={`${size === "modal" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"} inline-flex items-center rounded-full font-semibold bg-white text-gray-800 shadow-sm`}
        >
          <span className="mr-1">🍇</span>
          Safra: {safra}
        </span>
      );
    }
    if (sealId.startsWith("vinho:local:")) {
      const local = decodeURIComponent(sealId.split(":")[2] || "");
      if (!local) return null;
      return (
        <span
          key={sealId}
          className={`${size === "modal" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"} inline-flex items-center rounded-full font-semibold bg-white text-gray-800 shadow-sm`}
        >
          <span className="mr-1">📍</span>
          Local: {local}
        </span>
      );
    }
    return null;
  };

  // Componente para renderizar selos no modal - Versão otimizada para mobile
  const renderModalSeals = useCallback(
    (seals: string[]) => {
      if (!seals || seals.length === 0) return null;

      return (
        <div className="flex flex-wrap gap-2 mb-6">
          {seals.map((sealId) => {
            const wine = renderWineSeal(sealId, "modal");
            if (wine) return wine;
            const seal = getSealById(sealId, selectedBar as BarFromAPI);
            if (!seal) return null;
            return (
              <span
                key={sealId}
                className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                style={{
                  backgroundColor: seal.color,
                  boxShadow: `0 4px 12px ${seal.color}50`,
                }}
              >
                {seal.name}
              </span>
            );
          })}
        </div>
      );
    },
    [selectedBar],
  );

  // Componente para rastrear visualização de item
  const MenuItemCardWithTracking = React.memo(
    ({
      item,
      onClick,
      selectedBar,
      menuCategories,
      slug,
      formatPrice,
      trackMenuItemView,
      getValidImageUrl,
      renderWineSeal,
      getSealById,
      eagerImage,
      viewMode = "grade",
      appearance = "default",
      likeCount = 0,
      liked = false,
      onToggleLike,
    }: {
      item: MenuItem;
      onClick: (item: MenuItem) => void;
      selectedBar: Bar | null;
      menuCategories: GroupedCategory[];
      slug: string;
      formatPrice: (price: number, isPriceOnRequest?: boolean) => string;
      trackMenuItemView: (
        itemName: string,
        itemId: string | number,
        establishmentName: string,
        establishmentSlug: string,
        category: string,
        price: number,
        pageLocation: string,
      ) => void;
      getValidImageUrl: (
        filename?: string | null,
        variant?: CardapioImageVariant,
      ) => string;
      renderWineSeal: (
        sealId: string,
        type: "card" | "modal",
      ) => JSX.Element | null;
      getSealById: (
        sealId: string,
        bar?: BarFromAPI,
      ) => { name: string; color: string } | null;
      eagerImage: boolean;
      viewMode?: "lista" | "grade" | "grande";
      appearance?: "default" | "ideiaum";
      likeCount?: number;
      liked?: boolean;
      onToggleLike?: (itemId: string | number) => void;
    }) => {
      const isReservaRooftop =
        selectedBar?.slug === "reserva-rooftop" ||
        selectedBar?.slug === "reserva-pinheiros";
      const isCleanStyle =
        selectedBar?.menu_display_style === "clean" ||
        (isReservaRooftop && selectedBar?.menu_display_style !== "normal");
      const itemRef = React.useRef<HTMLDivElement>(null);
      const hasTrackedView = React.useRef(false);
      const hasAnimated = React.useRef(false);
      const thumbImageUrl = getValidImageUrl(item.imageUrl, "thumb");
      const mediumImageUrl = getValidImageUrl(item.imageUrl, "medium");
      const [imageSrc, setImageSrc] = React.useState<string>(thumbImageUrl);

      // Atualiza o src se o imageUrl do item mudar
      React.useEffect(() => {
        setImageSrc(getValidImageUrl(item.imageUrl, "thumb"));
      }, [item.imageUrl, getValidImageUrl]);

      // Rastrear visualização quando o item aparece na tela
      React.useEffect(() => {
        if (!itemRef.current || hasTrackedView.current || !selectedBar) return;

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && !hasTrackedView.current) {
                hasTrackedView.current = true;

                const category = menuCategories.find((cat) =>
                  cat.subCategories.some((sub) =>
                    sub.items.some((i) => i.id === item.id),
                  ),
                );
                const categoryName = category?.name || "Sem categoria";
                const pageLocation =
                  typeof window !== "undefined"
                    ? window.location.href
                    : `/cardapio/${slug}`;

                trackMenuItemView(
                  item.name,
                  item.id,
                  selectedBar.name,
                  slug,
                  categoryName,
                  item.price,
                  pageLocation,
                );

                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.5 },
        );

        observer.observe(itemRef.current);

        return () => {
          if (itemRef.current) {
            observer.unobserve(itemRef.current);
          }
        };
      }, [item, selectedBar, slug, menuCategories, trackMenuItemView]);

      const isListView = viewMode === "lista";
      const toggleLike = (event: React.MouseEvent) => {
        event.stopPropagation();
        onToggleLike?.(item.id);
      };
      const imageHeart = (
        <button
          type="button"
          aria-label={liked ? "Remover curtida" : "Curtir"}
          aria-pressed={liked}
          onClick={toggleLike}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
        >
          {liked ? (
            <FaHeart className="h-4 w-4 text-red-500" />
          ) : (
            <FaRegHeart className="h-4 w-4 text-neutral-800" />
          )}
        </button>
      );
      const likeCountButton = (
        <button
          type="button"
          aria-label={liked ? "Remover curtida" : "Curtir"}
          aria-pressed={liked}
          onClick={toggleLike}
          className="inline-flex items-center gap-1 text-sm text-neutral-800"
        >
          <FaHeart className="h-4 w-4 text-red-500" />
          <span>{likeCount}</span>
        </button>
      );

      if (appearance === "ideiaum") {
        const priceLabel = formatPrice(item.price, item.isPriceOnRequest);
        return (
          <motion.div
            ref={itemRef}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => {
              if (!hasAnimated.current) hasAnimated.current = true;
            }}
            className={`menu-item-card cursor-pointer overflow-hidden bg-white shadow-sm ${
              isListView ? "flex flex-row items-stretch" : "flex flex-col"
            }`}
            onClick={() => onClick(item)}
          >
            {viewMode !== "lista" ? (
              <div
                className={`relative w-full overflow-hidden ${
                  viewMode === "grande" ? "aspect-[4/5]" : "aspect-[3/4]"
                }`}
              >
                <Image
                  src={imageSrc}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  quality={68}
                  className="object-cover"
                />
                {imageHeart}
              </div>
            ) : null}
            <div
              className={`flex min-w-0 flex-1 flex-col ${
                viewMode === "grande" ? "items-center px-4 py-4 text-center" : "p-4"
              }`}
            >
              <h3
                className={`font-semibold text-neutral-900 ${
                  viewMode === "grande" ? "text-lg" : "text-base"
                }`}
              >
                {item.name}
              </h3>
              {item.description ? (
                <p className="mt-1 line-clamp-3 text-sm text-neutral-500">
                  {item.description}
                </p>
              ) : null}
              <div className="mt-auto flex w-full items-end justify-between gap-3 pt-4">
                <p className="text-sm font-medium text-neutral-900">{priceLabel}</p>
                {likeCountButton}
              </div>
            </div>
            {isListView ? (
              <div className="relative min-h-36 w-32 shrink-0 self-stretch sm:w-40">
                <Image
                  src={imageSrc}
                  alt=""
                  fill
                  sizes="160px"
                  quality={68}
                  className="object-cover"
                />
                {imageHeart}
              </div>
            ) : null}
          </motion.div>
        );
      }

      return (
        <motion.div
          ref={itemRef}
          initial={hasAnimated.current ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={() => {
            if (!hasAnimated.current) {
              hasAnimated.current = true;
            }
          }}
          className={`menu-item-card cursor-pointer overflow-hidden transition-all duration-300 ${
            isListView ? "flex flex-row items-stretch" : "flex flex-col"
          } ${
            isCleanStyle
              ? "rounded-[28px] border border-[#d7c4a2] bg-[#f9f5ed]/95 shadow-[0_18px_38px_rgba(25,18,10,0.18)] hover:shadow-[0_28px_60px_rgba(25,18,10,0.28)]"
              : "bg-white rounded-lg shadow-lg hover:shadow-xl"
          } ${isCleanStyle ? "backdrop-blur-[2px]" : ""}`}
          onClick={() => onClick(item)}
        >
          <div
            className={`relative overflow-hidden ${
              isListView
                ? "min-h-28 w-28 shrink-0 self-stretch sm:w-36"
                : `w-full ${viewMode === "grande" ? "aspect-[16/10]" : "aspect-[4/3] sm:aspect-square"}`
            } ${isCleanStyle ? "border-b border-[#e7d9c3]" : ""}`}
          >
            <Image
              src={imageSrc}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={68}
              loading={eagerImage ? "eager" : "lazy"}
              fetchPriority={eagerImage ? "high" : "auto"}
              priority={eagerImage}
              className={`object-cover ${isCleanStyle ? "scale-[1.02]" : ""}`}
              onError={() => {
                // Primeiro tenta variante medium, depois fallback local.
                if (
                  mediumImageUrl &&
                  mediumImageUrl !== imageSrc &&
                  mediumImageUrl !== PLACEHOLDER_IMAGE_URL
                ) {
                  setImageSrc(mediumImageUrl);
                  return;
                }
                if (imageSrc !== PLACEHOLDER_IMAGE_URL) {
                  setImageSrc(PLACEHOLDER_IMAGE_URL);
                }
              }}
            />
          </div>

          <div
            className={`flex flex-col h-full p-2.5 sm:p-4 ${isCleanStyle ? "sm:p-6" : ""}`}
          >
            <div className="space-y-2">
              <h3
                className={`mb-1 line-clamp-3 sm:line-clamp-2 leading-snug break-words ${
                  isCleanStyle
                    ? "font-serif text-[0.85rem] sm:text-[1.1rem] font-bold tracking-[0.06em] sm:tracking-[0.12em] text-[#2b241a]"
                    : isReservaRooftop
                      ? "text-[0.85rem] sm:text-xl font-bold text-gray-900"
                      : "text-[0.8rem] sm:text-lg font-semibold text-gray-800"
                }`}
              >
                {item.name}
              </h3>
              {!isReservaRooftop && (
                <p
                  className={`mb-2 font-semibold ${
                    isCleanStyle
                      ? "text-[0.8rem] tracking-[0.14em] uppercase text-[#4a3c2d]"
                      : "text-sm sm:text-base text-gray-700"
                  }`}
                >
                  {formatPrice(item.price, item.isPriceOnRequest)}
                </p>
              )}
              <p
                className={`${isCleanStyle ? "text-[0.72rem]" : "text-xs sm:text-sm"} ${
                  isCleanStyle
                    ? "text-[#7a6d5b] leading-relaxed"
                    : "text-gray-600"
                }`}
              >
                {item.description.length > 120
                  ? `${item.description.slice(0, 117)}...`
                  : item.description}
              </p>
              {/* Adicionais (prévia no card) */}
              {item.toppings && item.toppings.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {item.toppings.slice(0, 3).map((topping) => (
                    <div
                      key={topping.id}
                      className={`flex items-center justify-between ${
                        isCleanStyle
                          ? "text-[0.7rem] text-[#7a6d5b]"
                          : "text-[0.7rem] text-gray-500"
                      }`}
                    >
                      <span className="truncate">{topping.name}</span>
                      <span className="ml-2 font-medium">
                        {formatPrice(topping.price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* Selos (vinho + demais) - estilo badge como antes */}
              {item.seals && item.seals.length > 0 && (
                <div
                  className={`flex flex-wrap gap-1.5 ${isCleanStyle ? "gap-2" : ""}`}
                >
                  {item.seals.map((sealId) => {
                    const wine = renderWineSeal(sealId, "card");
                    if (wine) return wine;
                    const seal = getSealById(sealId, selectedBar as BarFromAPI);
                    if (!seal) return null;
                    return (
                      <span
                        key={sealId}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold text-white shadow-sm ${
                          isCleanStyle
                            ? "uppercase tracking-[0.14em] text-[0.58rem] bg-[#3b3225]/80"
                            : ""
                        }`}
                        style={{
                          backgroundColor: seal.color,
                          boxShadow: `0 2px 8px ${seal.color}33`,
                        }}
                      >
                        {seal.name}
                      </span>
                    );
                  })}
                </div>
              )}
              {isReservaRooftop && (
                <div className="mb-2 text-right">
                  <p className="font-serif text-[#2b241a] text-sm tracking-[0.25em] font-extralight">
                    {formatPrice(item.price, item.isPriceOnRequest)}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-auto">
              <button
                type="button"
                className={`w-full rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
                  isCleanStyle
                    ? "bg-[#e9ddc8] text-[#2f251b] hover:bg-[#ddcfb3]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  onClick(item);
                }}
              >
                Ver mais
              </button>
            </div>
          </div>
        </motion.div>
      );
    },
  );

  const MenuItemCard = useCallback(
    ({
      item,
      onClick,
      eagerImage,
      viewMode = "grade",
      appearance = "default",
      likeCount = 0,
      liked = false,
      onToggleLike,
    }: {
      item: MenuItem;
      onClick: (item: MenuItem) => void;
      eagerImage: boolean;
      viewMode?: "lista" | "grade" | "grande";
      appearance?: "default" | "ideiaum";
      likeCount?: number;
      liked?: boolean;
      onToggleLike?: (itemId: string | number) => void;
    }) => {
      return (
        <MenuItemCardWithTracking
          item={item}
          onClick={onClick}
          selectedBar={selectedBar}
          menuCategories={menuCategories}
          slug={slug}
          formatPrice={formatPrice}
          trackMenuItemView={trackMenuItemView}
          getValidImageUrl={getValidImageUrl}
          renderWineSeal={renderWineSeal}
          getSealById={getSealById}
          eagerImage={eagerImage}
          viewMode={viewMode}
          appearance={appearance}
          likeCount={likeCount}
          liked={liked}
          onToggleLike={onToggleLike}
        />
      );
    },
    [
      formatPrice,
      selectedBar,
      menuCategories,
      slug,
      trackMenuItemView,
      getValidImageUrl,
      renderWineSeal,
      getSealById,
      toggleItemLike,
    ],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !selectedBar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Estabelecimento não encontrado
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "O estabelecimento solicitado não foi encontrado."}
          </p>
          <Link
            href="/cardapio"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <MdArrowBack className="w-5 h-5" />
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    );
  }

  const isReservaRooftop =
    selectedBar.slug === "reserva-rooftop" ||
    selectedBar.slug === "reserva-pinheiros";
  /** Banner para decoração-desativa navegação apenas neste cardápio. */
  const isSitioIlhaCardapio = slug?.toLowerCase() === "sitio-ilha";
  const isGrupoIdeiaumCardapio = new Set([
    "justino",
    "pracinha",
    "ape-do-pracinha",
    "highline",
    "highlineclub",
    "ohfregues",
    "reserva-rooftop",
    "reserva-pinheiros",
  ]).has(slug?.toLowerCase() || "");
  const ideiaumItemGridClass =
    menuItemView === "lista"
      ? "grid grid-cols-1 gap-3"
      : menuItemView === "grande"
        ? "grid grid-cols-1 gap-4 md:grid-cols-2"
        : "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4";
  const reveillonBannerSlugs = new Set([
    "justino",
    "pracinha",
    "ape-do-pracinha",
  ]);
  const isReveillonBannerCardapio = reveillonBannerSlugs.has(
    slug?.toLowerCase() || "",
  );
  const reveillonIngresseUrl =
    "https://www.ingresse.com/super-reveillon-harmonia-seu-justino-pracinha/";
  const categorySelectedBg =
    selectedBar.menu_category_bg_color ||
    (isCleanStyle ? "#1f1b16" : "#3b82f6");
  const categorySelectedText =
    selectedBar.menu_category_text_color ||
    (isCleanStyle ? "#f5ede1" : "#ffffff");
  const categoryUnselectedBg = isCleanStyle ? "#f6efe3" : "#ffffff";
  const categoryUnselectedText = isCleanStyle ? "#403a31" : "#374151";

  return (
    <div
      className={`cardapio-page min-h-screen ${
        isCleanStyle
          ? "bg-[#f3eee4]"
          : "bg-gradient-to-br from-gray-50 to-gray-100"
      }`}
    >
      <style jsx>{`
        .seal-badge-mobile {
          font-size: 0.7rem;
          line-height: 1.2;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .seal-badge-mobile:hover {
          transform: scale(1.05);
        }

        @media (max-width: 640px) {
          .seal-badge-mobile {
            font-size: 0.65rem;
            padding: 0.3rem 0.6rem;
            border-radius: 15px;
            font-weight: 600;
          }
        }

        @media (min-width: 641px) {
          .seal-badge-mobile {
            font-size: 0.75rem;
            padding: 0.4rem 0.8rem;
            border-radius: 18px;
          }
        }

        .menu-item-card {
          transition: all 0.3s ease;
        }

        .menu-item-card:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 640px) {
          .menu-item-card {
            min-height: 250px;
          }
        }

        .price-badge {
          z-index: 10;
        }
      `}</style>
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
          isCleanStyle ? "text-[#342b22]" : ""
        }`}
      >
        <div className="mb-6">
          <div
            className={`bar-header overflow-hidden ${
              isCleanStyle
                ? "rounded-[32px] border border-[#eadfca] bg-[#fbf8f1] shadow-[0_35px_90px_rgba(17,24,39,0.08)]"
                : "bg-white rounded-xl shadow-lg"
            }`}
          >
            {isGrupoIdeiaumCardapio ? (
              <>
                <div
                  className={`relative z-0 overflow-hidden ${
                    isCleanStyle ? "h-72 md:h-[22rem]" : "h-64 md:h-80"
                  }`}
                >
                  <ImageSlider images={selectedBar.coverImages} />
                </div>
                <div className="relative z-10 flex items-start gap-3 px-4 pb-5 md:gap-5 md:px-6">
                  <div
                    className="logo-container relative -mt-16 h-32 w-32 shrink-0 cursor-pointer md:-mt-20 md:h-40 md:w-40 md:cursor-default"
                    onClick={() =>
                      window.innerWidth < 768 && setShowMobileSidebar(true)
                    }
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
                      <Image
                        src={getValidImageUrl(selectedBar.logoUrl, "medium")}
                        alt={`${selectedBar.name} logo`}
                        fill
                        sizes="160px"
                        quality={75}
                        priority
                        className="object-cover"
                      />
                    </div>
                    <div className="menu-indicator absolute -top-1 -right-1 md:hidden">
                      <div className="rounded-full bg-blue-600 p-1.5 text-white shadow-lg">
                        <MdMenu className="menu-icon h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 pt-3 md:pt-4">
                    <h1 className="-mt-[90px] hidden text-3xl font-extrabold leading-none tracking-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.85),0_1px_2px_rgba(0,0,0,0.9)] md:block md:text-4xl">
                      {selectedBar.name}
                    </h1>
                    {selectedBar.description ? (
                      <p className="mt-2 hidden text-base font-semibold leading-snug text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.9),0_1px_2px_rgba(0,0,0,0.85)] md:line-clamp-2 md:text-lg">
                        {selectedBar.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-4 text-neutral-900">
                      <Link
                        href={
                          ESTABLISHMENT_HOME_PATH[slug?.toLowerCase() || ""] ||
                          "/"
                        }
                        className="transition-colors hover:text-neutral-500"
                        aria-label="Página do estabelecimento"
                      >
                        <MdHome className="h-5 w-5" />
                      </Link>
                      <button
                        type="button"
                        className="transition-colors hover:text-neutral-500"
                        aria-label="Buscar no cardápio"
                        aria-expanded={menuSearchOpen}
                        onClick={() => setMenuSearchOpen((open) => !open)}
                      >
                        <MdSearch className="h-6 w-6" />
                      </button>
                      {selectedBar.facebook && (
                        <a
                          href={selectedBar.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-colors hover:text-blue-600"
                          aria-label="Facebook"
                        >
                          <FaFacebook className="h-5 w-5" />
                        </a>
                      )}
                      {selectedBar.instagram && (
                        <a
                          href={selectedBar.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-colors hover:text-pink-600"
                          aria-label="Instagram"
                        >
                          <FaInstagram className="h-5 w-5" />
                        </a>
                      )}
                      {selectedBar.whatsapp && (
                        <a
                          href={selectedBar.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-colors hover:text-green-600"
                          aria-label="WhatsApp"
                        >
                          <FaWhatsapp className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                    {menuSearchOpen ? (
                      <input
                        type="search"
                        value={menuSearchQuery}
                        onChange={(event) =>
                          setMenuSearchQuery(event.target.value)
                        }
                        placeholder="Buscar no cardápio"
                        aria-label="Buscar no cardápio"
                        className="mt-3 w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 outline-none ring-neutral-900 focus:ring-2"
                        autoFocus
                      />
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-neutral-700">
                      <div className="flex items-center gap-1">
                        <MdStar className="h-5 w-5 text-amber-500" />
                        <span className="font-semibold">
                          {selectedBar.rating || 0}
                        </span>
                        <span className="text-neutral-500">
                          ({selectedBar.reviewsCount || 0})
                        </span>
                      </div>
                      <div className="hidden min-w-0 items-center gap-1 md:flex">
                        <MdLocationOn className="h-4 w-4 shrink-0" />
                        <span className="truncate text-sm">
                          {selectedBar.address}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
            <div
              className={`relative ${
                isSitioIlhaCardapio
                  ? "h-64 md:h-[22rem]"
                  : isCleanStyle
                    ? "h-72 md:h-[22rem]"
                    : "h-64 md:h-80"
              }`}
            >
              <ImageSlider images={selectedBar.coverImages} />
              <div
                className={`pointer-events-none absolute inset-0 z-10 ${
                  isCleanStyle
                    ? "bg-gradient-to-t from-black/60 via-black/15 to-transparent md:from-black/40"
                    : "bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                }`}
              />

              <div
                className={`logo-container absolute top-4 left-4 z-20 cursor-pointer md:cursor-default ${
                  isCleanStyle
                    ? "rounded-2xl border border-white/70 bg-white/80 p-3 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl"
                    : "p-2 bg-white rounded-xl shadow-md"
                }`}
                onClick={() =>
                  window.innerWidth < 768 && setShowMobileSidebar(true)
                }
              >
                <Image
                  src={getValidImageUrl(selectedBar.logoUrl, "thumb")}
                  alt={`${selectedBar.name} logo`}
                  width={64}
                  height={64}
                  quality={70}
                  className="rounded-lg"
                />

                <div className="menu-indicator absolute -top-1 -right-1 md:hidden">
                  <div className="bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                    <MdMenu className="menu-icon w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="bar-content absolute bottom-3 left-4 right-4 z-20 md:bottom-6 md:left-6 md:right-6">
                <h1
                  className={`mb-1 md:mb-3 ${
                    isCleanStyle
                      ? "text-xl tracking-[0.2em] uppercase text-white drop-shadow-[0_14px_38px_rgba(0,0,0,0.55)] md:text-[2.6rem] md:tracking-[0.32em]"
                      : "text-white text-xl md:text-4xl font-bold"
                  }`}
                >
                  {selectedBar.name}
                </h1>
                {selectedBar.description ? (
                  <p
                    className={`mb-2 line-clamp-2 md:mb-3 ${
                      isCleanStyle
                        ? "text-white/80 text-sm leading-relaxed max-w-2xl tracking-[0.08em] md:text-base"
                        : "text-white/90 text-sm md:text-lg"
                    }`}
                  >
                    {selectedBar.description}
                  </p>
                ) : null}

                <div className="mb-2 flex items-center gap-4 text-white/90 md:mb-3">
                  {selectedBar.facebook && (
                    <a
                      href={selectedBar.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-blue-500 transition-colors"
                    >
                      <FaFacebook className="w-6 h-6" />
                    </a>
                  )}
                  {selectedBar.instagram && (
                    <a
                      href={selectedBar.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-pink-500 transition-colors"
                    >
                      <FaInstagram className="w-6 h-6" />
                    </a>
                  )}
                  {selectedBar.whatsapp && (
                    <a
                      href={selectedBar.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-green-500 transition-colors"
                    >
                      <FaWhatsapp className="w-6 h-6" />
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/90">
                  <div className="flex items-center gap-1">
                    <MdStar className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold">
                      {selectedBar.rating || 0}
                    </span>
                    <span>({selectedBar.reviewsCount || 0})</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1">
                    <MdLocationOn className="h-4 w-4 shrink-0" />
                    <span className="truncate text-sm">{selectedBar.address}</span>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

        <div ref={menuAnchorRef} className="h-px w-full" aria-hidden />

        {menuCategories.length > 0 &&
          (!isGrupoIdeiaumCardapio || menuPinned) && (
          // Menu de categorias fixo (visível em todas as telas)
          <div
            ref={categoryBarRef}
            className={
              isGrupoIdeiaumCardapio
                ? "fixed inset-x-0 top-0 z-50 border-b border-neutral-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                : `sticky z-40 ${
                    isCleanStyle
                      ? "bg-[#f6f4ee]/95 backdrop-blur-sm"
                      : "bg-gradient-to-br from-gray-50 to-gray-100"
                  }`
            }
            style={
              isGrupoIdeiaumCardapio
                ? undefined
                : { top: `${stickyCategoryOffset}px` }
            }
          >
            {isGrupoIdeiaumCardapio ? (
              <div className="flex items-center justify-between gap-3 bg-neutral-950 px-4 py-3 text-white sm:px-6">
                <p className="min-w-0 truncate text-lg font-medium">
                  {selectedBar.name}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  {(
                    [
                      ["lista", "Ver em lista", MdViewList],
                      ["grade", "Ver em grade", MdGridView],
                      ["grande", "Ver em tamanho grande", MdCropSquare],
                    ] as const
                  ).map(([mode, label, Icon]) => {
                    const selected = menuItemView === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        aria-label={label}
                        aria-pressed={selected}
                        onClick={() => setMenuItemView(mode)}
                        className={`rounded-lg p-2 ${
                          selected
                            ? "bg-white text-neutral-950"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {/* Indicador de categoria ativa (oculto para clientes) */}
            <div
              className={`hidden text-center py-2 px-4 ${
                isCleanStyle
                  ? "bg-[#efe6d8] border-b border-[#e1d6c0]"
                  : isReservaRooftop
                    ? "bg-green-50 border-b border-green-200"
                    : "bg-blue-50 border-b border-blue-200"
              }`}
            >
              <span
                className={`${
                  isCleanStyle
                    ? "text-[0.7rem] text-[#7b6a55] tracking-[0.14em] uppercase font-semibold"
                    : "text-sm text-gray-600"
                }`}
              >
                {isCleanStyle ? "Categoria atual" : ""}
                <span
                  className="font-bold"
                  style={{
                    color: isCleanStyle
                      ? "#221d17"
                      : isReservaRooftop
                        ? "#0c190c"
                        : undefined,
                  }}
                >
                  {selectedCategory}
                </span>
              </span>
            </div>
            <div className={isGrupoIdeiaumCardapio ? "px-4 sm:px-6" : "pb-2"}>
              {isGrupoIdeiaumCardapio ? (
                <IdeiaumCategoryChips
                  categories={categoriesOnScreen}
                  spy={menuSpy}
                  registerCategoryMenuRef={registerCategoryMenuRef}
                  registerSubcategoryMenuRef={registerSubcategoryMenuRef}
                  onSelectCategory={(categoryName) => {
                    const category = categoriesOnScreen.find(
                      (entry) => entry.name === categoryName,
                    );
                    const subcategoryName =
                      category?.subCategories[0]?.name || "";
                    menuSpy.set({
                      category: categoryName,
                      subcategory: subcategoryName,
                    });
                    setSelectedCategory(categoryName);
                    currentActiveCategoryRef.current = categoryName;
                    currentActiveSubcategoryRef.current = subcategoryName;
                    updateActiveButton(categoryName, subcategoryName);

                    if (selectedBar) {
                      const pageLocation =
                        typeof window !== "undefined"
                          ? window.location.href
                          : `/cardapio/${slug}`;
                      trackCategoryView(
                        categoryName,
                        null,
                        selectedBar.name,
                        slug,
                        pageLocation,
                      );
                    }

                    scrollToIdWithOffset(
                      getCategoryDomId(categoryName),
                      Math.max(categoryBarHeight, 0) + 12,
                    );
                  }}
                  onSelectSubcategory={(categoryName, subcategoryName) => {
                    menuSpy.set({
                      category: categoryName,
                      subcategory: subcategoryName,
                    });
                    currentActiveCategoryRef.current = categoryName;
                    currentActiveSubcategoryRef.current = subcategoryName;
                    updateActiveButton(categoryName, subcategoryName);
                    scrollToIdWithOffset(
                      getSubcategoryDomId(categoryName, subcategoryName),
                      Math.max(categoryBarHeight, 0) + 12,
                    );
                  }}
                />
              ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categoriesOnScreen.map((category) => {
                  return (
                  <button
                    key={category.id}
                    ref={(el) => registerCategoryMenuRef(category.name, el)}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      currentActiveCategoryRef.current = category.name;

                      if (selectedBar) {
                        const pageLocation =
                          typeof window !== "undefined"
                            ? window.location.href
                            : `/cardapio/${slug}`;
                        trackCategoryView(
                          category.name,
                          null,
                          selectedBar.name,
                          slug,
                          pageLocation,
                        );
                      }

                      scrollToIdWithOffset(
                        getCategoryDomId(category.name),
                        (menuPinned ? 0 : stickyCategoryOffset) +
                          Math.max(categoryBarHeight, 0) +
                          12,
                      );
                    }}
                    className={`category-tab whitespace-nowrap font-medium transition-all duration-200 ${
                      isCleanStyle
                        ? "rounded-full px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.16em] shadow-sm hover:shadow-md border border-[#e7dbc4]/70 backdrop-blur-sm"
                        : "rounded-full px-4 py-2 text-sm hover:bg-gray-50 shadow-md"
                    }`}
                  >
                    {category.name}
                  </button>
                  );
                })}
              </div>
              )}
            </div>
          </div>
        )}

        {selectedBar.ad_images && selectedBar.ad_images.length > 0 ? (
          <div className="mt-8 mb-8 overflow-hidden rounded-xl shadow-lg">
            <ImageSlider
              images={selectedBar.ad_images}
              interval={5000}
              preserveImage
            />
          </div>
        ) : (
        <div className="mt-8 mb-8">
          {isSitioIlhaCardapio ? (
            <div
              className="block cursor-not-allowed pointer-events-none opacity-90 select-none"
              aria-disabled="true"
              title="Indisponível neste cardápio no momento"
            >
              <div className="relative overflow-hidden rounded-xl shadow-lg transition-shadow duration-300">
                <Image
                  src="/banner-regua.jpg"
                  alt="Decoração de Aniversário - Banner Promocional Desktop"
                  width={1200}
                  height={300}
                  className="hidden md:block w-full h-auto object-cover transition-transform duration-300"
                  priority
                  sizes="(max-width: 767px) 0vw, 100vw"
                />
                <Image
                  src="/banne-agilizai-mobile.jpg"
                  alt="Decoração de Aniversário - Banner Promocional Mobile"
                  width={600}
                  height={400}
                  className="block md:hidden w-full h-auto object-cover transition-transform duration-300"
                  priority
                  sizes="(max-width: 767px) 100vw, 0vw"
                />
                <div className="absolute transition-all duration-300"></div>
              </div>
            </div>
          ) : isReveillonBannerCardapio ? (
            <a
              href={reveillonIngresseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              onClick={() => {
                trackClick(
                  window.innerWidth >= 768
                    ? "banner-reveillon-harmonia-desktop"
                    : "banner-reveillon-harmonia-mobile",
                  `/cardapio/${slug}`,
                  "banner_click",
                );
              }}
            >
              <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Image
                  src="/banner-reveillon-harmonia.png"
                  alt="Super Réveillon Harmonia - Garanta já o seu ingresso"
                  width={1200}
                  height={300}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                  priority
                  sizes="100vw"
                />
                <div className="absolute transition-all duration-300"></div>
              </div>
            </a>
          ) : (
            <Link
              href="/decoracao-aniversario"
              className="block"
              onClick={() => {
                if (window.innerWidth >= 768) {
                  trackClick(
                    "banner-regua-desktop",
                    `/cardapio/${slug}`,
                    "banner_click",
                  );
                } else {
                  trackClick(
                    "banner-mobile",
                    `/cardapio/${slug}`,
                    "banner_click",
                  );
                }
              }}
            >
              <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Image
                  src="/banner-regua.jpg"
                  alt="Decoração de Aniversário - Banner Promocional Desktop"
                  width={1200}
                  height={300}
                  className="hidden md:block w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                  priority
                  sizes="(max-width: 767px) 0vw, 100vw"
                />
                <Image
                  src="/banne-agilizai-mobile.jpg"
                  alt="Decoração de Aniversário - Banner Promocional Mobile"
                  width={600}
                  height={400}
                  className="block md:hidden w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                  priority
                  sizes="(max-width: 767px) 100vw, 0vw"
                />
                <div className="absolute transition-all duration-300"></div>
              </div>
            </Link>
          )}
        </div>
        )}

        {/*
          Renderização Condicional:
          No mobile, renderiza todas as categorias de uma vez (rolagem infinita).
          No desktop, mantém a renderização de uma categoria por vez com AnimatePresence.
        */}
        {isGrupoIdeiaumCardapio && menuDestaques.length > 0 ? (
          <section className="mt-8 min-w-0 max-w-full">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">
              Destaques
            </h2>
            <div
              ref={destaquesRowRef}
              className="destaques-scroll flex w-full min-w-0 max-w-full cursor-grab gap-4 overflow-x-auto pb-3 active:cursor-grabbing"
            >
              {menuDestaques.map((destaque) => {
                const liked = Boolean(likedItemIds[String(destaque.item.id)]);
                const count = likeCounts[String(destaque.item.id)] || 0;
                return (
                  <button
                    key={destaque.key}
                    type="button"
                    onClick={() =>
                      scrollToIdWithOffset(
                        getSubcategoryDomId(
                          destaque.categoryName,
                          destaque.subcategoryName,
                        ),
                        Math.max(categoryBarHeight, 0) + 12,
                      )
                    }
                    className="w-64 shrink-0 overflow-hidden bg-white text-left shadow-sm"
                  >
                    <div className="relative aspect-[3/4] w-full">
                      <Image
                        src={getValidImageUrl(destaque.item.imageUrl, "medium")}
                        alt={destaque.item.name}
                        fill
                        sizes="256px"
                        className="object-cover"
                      />
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={liked ? "Remover curtida" : "Curtir"}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleItemLike(destaque.item.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          event.stopPropagation();
                          toggleItemLike(destaque.item.id);
                        }}
                        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
                      >
                        {liked ? (
                          <FaHeart className="h-4 w-4 text-red-500" />
                        ) : (
                          <FaRegHeart className="h-4 w-4 text-neutral-800" />
                        )}
                      </span>
                      <span className="absolute inset-x-0 bottom-0 bg-neutral-950 px-3 py-2 text-center text-sm font-semibold text-white">
                        {destaque.subcategoryName}
                      </span>
                    </div>
                    <div className="px-3 py-3">
                      <p className="font-medium text-neutral-900">
                        {destaque.item.name}
                      </p>
                      <div className="mt-3 flex items-end justify-between gap-3">
                        <p className="text-sm leading-snug text-neutral-800">
                          {destaque.hasFromPrice ? (
                            <>
                              À partir de
                              <br />
                              {formatPrice(destaque.minPrice)}
                            </>
                          ) : (
                            formatPrice(destaque.minPrice)
                          )}
                        </p>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={liked ? "Remover curtida" : "Curtir"}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleItemLike(destaque.item.id);
                          }}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            event.stopPropagation();
                            toggleItemLike(destaque.item.id);
                          }}
                          className="inline-flex items-center gap-1 text-sm text-neutral-800"
                        >
                          <FaHeart className="h-4 w-4 text-red-500" />
                          <span>{count}</span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {isMobile ? (
          <div className="mt-8">
            {categoriesOnScreen.map((category) => (
              <div
                key={category.id}
                id={getCategoryDomId(category.name)} // ID para rolagem
                data-category-name={category.name}
              >
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-6">
                  {category.name}
                </h2>

                {/* Menu de subcategorias fixo (apenas no mobile, para cada categoria) */}
                {!isGrupoIdeiaumCardapio && (
                <div
                  className="sticky z-30 bg-gradient-to-br from-gray-50 to-gray-100 pb-4 pt-2 -mt-4"
                  style={{ top: `${stickySubcategoryOffset}px` }}
                >
                  {/* Indicador de subcategoria ativa */}
                  {/* Indicador da subcategoria ativa removido conforme solicitação */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {category.subCategories.map((subcat) => (
                      <button
                        key={subcat.name}
                        ref={(el) =>
                          registerSubcategoryMenuRef(
                            category.name,
                            subcat.name,
                            el,
                          )
                        }
                        onClick={() => {
                          // Atualizar estados (aceitável no clique)
                          setSelectedCategory(category.name);
                          setActiveSubcategory(subcat.name);

                          // Atualizar refs
                          currentActiveCategoryRef.current = category.name;
                          currentActiveSubcategoryRef.current = subcat.name;

                          // Atualizar visualmente imediatamente (DOM direto)
                          updateActiveButton(category.name, subcat.name);

                          // Fazer scroll suave até a seção
                          scrollToIdWithOffset(
                            getSubcategoryDomId(category.name, subcat.name),
                            stickySubcategoryOffset + 12,
                          );
                        }}
                        className={`subcategory-tab whitespace-nowrap font-medium transition-all duration-200 ${
                          isGrupoIdeiaumCardapio
                            ? "rounded-xl border border-neutral-900 bg-white px-4 py-2 text-sm font-semibold text-neutral-900"
                            : isCleanStyle
                              ? "rounded-full px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.14em] hover:bg-gray-50"
                              : "rounded-full px-3 py-1.5 text-xs hover:bg-gray-50"
                        }`}
                      >
                        {subcat.name}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {category.subCategories.map((subcat) => (
                  <div
                    key={subcat.name}
                    ref={(el) =>
                      registerSubcategoryRef(category.name, subcat.name, el)
                    }
                    id={getSubcategoryDomId(category.name, subcat.name)}
                    data-subcategory-name={subcat.name}
                    data-category-name={category.name}
                    className="mt-8"
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {subcat.name}
                    </h3>
                    <div
                      className={
                        isGrupoIdeiaumCardapio
                          ? ideiaumItemGridClass
                          : `grid gap-3 sm:gap-4 ${
                              isCleanStyle
                                ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
                                : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                            }`
                      }
                    >
                      {subcat.items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onClick={handleItemClick}
                          eagerImage={eagerItemIds.has(item.id)}
                          viewMode={
                            isGrupoIdeiaumCardapio ? menuItemView : "grade"
                          }
                          appearance={
                            isGrupoIdeiaumCardapio ? "ideiaum" : "default"
                          }
                          likeCount={likeCounts[String(item.id)] || 0}
                          liked={Boolean(likedItemIds[String(item.id)])}
                          onToggleLike={toggleItemLike}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          // # INÍCIO DA CORREÇÃO
          // Agora o desktop também renderiza TODAS as categorias de uma vez.
          <div className="mt-8">
            {categoriesOnScreen.map((category) => (
              <div
                key={category.id}
                id={getCategoryDomId(category.name)} // ID para rolagem
                data-category-name={category.name}
              >
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-6">
                  {category.name}
                </h2>

                {/* Menu de subcategorias fixo (desktop) */}
                {!isGrupoIdeiaumCardapio && (
                <div
                  className="sticky z-30 bg-gradient-to-br from-gray-50 to-gray-100 pb-4 pt-2 -mt-4"
                  style={{ top: `${stickySubcategoryOffset}px` }}
                >
                  {/* Indicador de subcategoria ativa */}
                  {/* Indicador da subcategoria ativa removido conforme solicitação */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {category.subCategories.map((subcat) => (
                      <button
                        key={subcat.name}
                        ref={(el) =>
                          registerSubcategoryMenuRef(
                            category.name,
                            subcat.name,
                            el,
                          )
                        }
                        onClick={() => {
                          // Atualizar estados (aceitável no clique)
                          setSelectedCategory(category.name);
                          setActiveSubcategory(subcat.name);

                          // Atualizar refs
                          currentActiveCategoryRef.current = category.name;
                          currentActiveSubcategoryRef.current = subcat.name;

                          // Atualizar visualmente imediatamente (DOM direto)
                          updateActiveButton(category.name, subcat.name);

                          // Fazer scroll suave até a seção
                          scrollToIdWithOffset(
                            getSubcategoryDomId(category.name, subcat.name),
                            stickySubcategoryOffset + 12,
                          );
                        }}
                        className={`subcategory-tab whitespace-nowrap font-medium transition-all duration-200 ${
                          isGrupoIdeiaumCardapio
                            ? "rounded-xl border border-neutral-900 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900"
                            : isCleanStyle
                              ? "rounded-full bg-white px-3 py-2 text-[0.7rem] uppercase tracking-[0.14em] text-gray-600 hover:bg-gray-50"
                              : "rounded-full bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {subcat.name}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* Itens da categoria (desktop) */}
                {category.subCategories.map((subcat) => (
                  <div
                    key={subcat.name}
                    ref={(el) =>
                      registerSubcategoryRef(category.name, subcat.name, el)
                    }
                    id={getSubcategoryDomId(category.name, subcat.name)}
                    data-subcategory-name={subcat.name}
                    data-category-name={category.name}
                    className="mt-8"
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {subcat.name}
                    </h3>
                    <div
                      className={
                        isGrupoIdeiaumCardapio
                          ? ideiaumItemGridClass
                          : `grid gap-4 ${
                              isCleanStyle
                                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
                                : "grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            }`
                      }
                    >
                      {subcat.items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onClick={handleItemClick}
                          eagerImage={eagerItemIds.has(item.id)}
                          viewMode={
                            isGrupoIdeiaumCardapio ? menuItemView : "grade"
                          }
                          appearance={
                            isGrupoIdeiaumCardapio ? "ideiaum" : "default"
                          }
                          likeCount={likeCounts[String(item.id)] || 0}
                          liked={Boolean(likedItemIds[String(item.id)])}
                          onToggleLike={toggleItemLike}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          // # FIM DA CORREÇÃO
        )}

        {menuSearchQuery.trim() && categoriesOnScreen.length === 0 ? (
          <p className="mt-8 text-center text-sm text-neutral-600">
            Nenhum item encontrado para “{menuSearchQuery.trim()}”.
          </p>
        ) : null}

        {selectedBar.partner_logos && selectedBar.partner_logos.length > 0 && (
          <div
            className={`mt-16 mb-4 px-3 py-2 sm:px-4 ${
              isCleanStyle ? "text-[#5c5348]" : "text-gray-600"
            }`}
          >
            <p
              className={`mb-4 text-center text-[0.68rem] font-semibold uppercase tracking-[0.24em] sm:mb-5 ${
                isCleanStyle ? "text-[#8a7d6b]" : "text-gray-500"
              }`}
            >
              Marcas
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-4 px-1 py-1 sm:gap-x-6 sm:gap-y-5">
              {selectedBar.partner_logos.map((src, idx) => (
                <div
                  key={`partner-${idx}-${src.slice(0, 48)}`}
                  className="relative flex min-h-[12rem] min-w-[165px] max-w-[220px] flex-1 items-center justify-center px-3 py-3 sm:min-h-[13rem] sm:min-w-[200px] sm:max-w-[260px] sm:px-4 sm:py-4"
                >
                  <Image
                    src={src}
                    alt=""
                    width={500}
                    height={340}
                    className="max-h-[10.75rem] w-auto object-contain opacity-100"
                    unoptimized={src.startsWith("https://res.cloudinary.com")}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Sidebar Mobile */}
      <AnimatePresence>
        {showMobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="mobile-sidebar fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do sidebar */}
              <div
                className="sidebar-header p-6"
                style={{
                  backgroundColor:
                    selectedBar.mobile_sidebar_bg_color || "#667eea",
                  color: selectedBar.mobile_sidebar_text_color || "#ffffff",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={getValidImageUrl(selectedBar.logoUrl, "thumb")}
                      alt={`${selectedBar.name} logo`}
                      width={48}
                      height={48}
                      quality={70}
                      className="rounded-lg"
                    />
                    <h2 className="text-xl font-bold">{selectedBar.name}</h2>
                  </div>
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className="transition-colors opacity-80 hover:opacity-100"
                  >
                    <MdClose className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-sm mb-4" style={{ opacity: 0.9 }}>
                  {selectedBar.description}
                </p>
              </div>

              {/* Conteúdo do sidebar */}
              <div className="sidebar-content p-6 space-y-6 overflow-y-auto h-[calc(100%-120px)]">
                {/* Redes sociais */}
                {(selectedBar.facebook ||
                  selectedBar.instagram ||
                  selectedBar.whatsapp) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Redes Sociais
                    </h3>
                    <div className="flex items-center gap-4">
                      {selectedBar.facebook && (
                        <a
                          href={selectedBar.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors p-3 rounded-lg hover:bg-blue-50"
                        >
                          <FaFacebook className="w-5 h-5" />
                          <span className="text-sm">Facebook</span>
                        </a>
                      )}
                      {selectedBar.instagram && (
                        <a
                          href={selectedBar.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link flex items-center gap-2 text-pink-600 hover:text-pink-800 transition-colors p-3 rounded-lg hover:bg-pink-50"
                        >
                          <FaInstagram className="w-5 h-5" />
                          <span className="text-sm">Instagram</span>
                        </a>
                      )}
                      {selectedBar.whatsapp && (
                        <a
                          href={selectedBar.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link flex items-center gap-2 text-green-600 hover:text-green-800 transition-colors p-3 rounded-lg hover:bg-green-50"
                        >
                          <FaWhatsapp className="w-5 h-5" />
                          <span className="text-sm">WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Avaliações */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Avaliações
                  </h3>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MdStar className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold">
                      {selectedBar.rating || 0}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({selectedBar.reviewsCount || 0} avaliações)
                    </span>
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Localização
                  </h3>
                  <div className="flex items-start gap-2 text-gray-700">
                    <MdLocationOn className="w-5 h-5 text-red-500 mt-0.5" />
                    <span className="text-sm">{selectedBar.address}</span>
                  </div>
                </div>

                {/* Amenidades */}
                {selectedBar.amenities && selectedBar.amenities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Serviços
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBar.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="amenity-tag px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* O Modal do Popup */}
      <AnimatePresence>
        {showPopup && selectedBar?.popupImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleClosePopup}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-white rounded-lg shadow-2xl p-4 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleClosePopup}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdClose className="w-6 h-6" />
              </button>
              <div className="text-center">
                <Image
                  src={getValidImageUrl(selectedBar.popupImageUrl, "medium")}
                  alt="Popup de Propaganda"
                  width={600}
                  height={400}
                  quality={72}
                  className="w-full h-auto rounded-lg"
                  priority
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Detalhes do Item */}
      <AnimatePresence>
        {selectedItem && isGrupoIdeiaumCardapio ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex justify-center bg-black/60"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white"
            >
              {(() => {
                const variations = getItemPriceVariations(selectedItem);
                const activeVariation =
                  variations.find(
                    (variation) => variation.id === selectedVariationId,
                  ) || variations[0];
                const modalPrice = activeVariation
                  ? activeVariation.price
                  : selectedItem.price;
                const liked = Boolean(likedItemIds[String(selectedItem.id)]);
                const likeCount = likeCounts[String(selectedItem.id)] || 0;
                const rating = itemRatings[String(selectedItem.id)] || 0;
                return (
                  <>
                    <div className="relative h-[48vh] min-h-[280px] w-full shrink-0 bg-neutral-950">
                      <Image
                        src={
                          imageError
                            ? PLACEHOLDER_IMAGE_URL
                            : getValidImageUrl(selectedItem.imageUrl, "full")
                        }
                        alt={selectedItem.name}
                        fill
                        sizes="(max-width: 512px) 100vw, 512px"
                        quality={80}
                        className="object-cover"
                        priority
                        onError={() =>
                          setImageError(selectedItem.imageUrl || "error")
                        }
                      />
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        aria-label="Voltar"
                        className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white"
                      >
                        <MdArrowBack className="h-6 w-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleItemLike(selectedItem.id)}
                        aria-label={liked ? "Remover curtida" : "Curtir"}
                        aria-pressed={liked}
                        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow"
                      >
                        {liked || likeCount > 0 ? (
                          <FaHeart className="h-5 w-5 text-red-500" />
                        ) : (
                          <FaRegHeart className="h-5 w-5 text-neutral-800" />
                        )}
                        <span className="absolute -bottom-1 -right-1 text-xs font-semibold text-neutral-900">
                          {likeCount}
                        </span>
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col items-center px-6 pb-12 pt-10 text-center">
                      <h2 className="text-2xl font-medium text-neutral-900">
                        {selectedItem.name}
                      </h2>
                      {selectedItem.description ? (
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
                          {selectedItem.description}
                        </p>
                      ) : null}
                      <p className="mt-8 text-2xl font-semibold text-neutral-900">
                        {formatPrice(
                          modalPrice,
                          !activeVariation && selectedItem.isPriceOnRequest,
                        )}
                      </p>
                      {variations.length > 1 ? (
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                          {variations.map((variation) => {
                            const selected =
                              (activeVariation?.id || "base") === variation.id;
                            return (
                              <button
                                key={variation.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                  setSelectedVariationId(variation.id)
                                }
                                className={`rounded-lg px-5 py-3 text-base font-medium ${
                                  selected
                                    ? "bg-neutral-950 text-white"
                                    : "border border-neutral-900 bg-white text-neutral-900"
                                }`}
                              >
                                {variation.label}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      <p className="mt-16 text-lg text-neutral-800">
                        Deixe sua avaliação para este item
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const StarIcon =
                            rating >= star ? MdStar : MdStarBorder;
                          return (
                            <button
                              key={star}
                              type="button"
                              aria-label={`Avaliar com ${star} ${star === 1 ? "estrela" : "estrelas"}`}
                              onClick={() => rateItem(selectedItem.id, star)}
                              className="text-neutral-300"
                            >
                              <StarIcon
                                className={`h-10 w-10 ${
                                  rating >= star
                                    ? "text-neutral-700"
                                    : "text-neutral-300"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        ) : selectedItem ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-70"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-xl shadow-2xl p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10"
              >
                <MdClose className="w-8 h-8" />
              </button>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 w-full md:w-1/2 relative">
                  <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {imageError ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                        <Image
                          src={PLACEHOLDER_IMAGE_URL}
                          alt="Imagem não disponível"
                          fill
                          sizes="(max-width: 768px) 90vw, 400px"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <Image
                        src={getValidImageUrl(selectedItem.imageUrl, "medium")}
                        alt={selectedItem.name}
                        fill
                        sizes="(max-width: 768px) 90vw, 400px"
                        quality={78}
                        className="w-full h-full object-contain rounded-lg shadow-lg"
                        onError={() => {
                          setImageError(selectedItem.imageUrl || "error");
                        }}
                        onLoad={() => {
                          if (imageError) {
                            setImageError(null);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h2
                      className={`flex-1 ${
                        isReservaRooftop
                          ? "text-3xl sm:text-4xl font-bold text-gray-900"
                          : "text-2xl sm:text-3xl font-bold text-gray-900"
                      }`}
                    >
                      {selectedItem.name}
                    </h2>
                  </div>
                  {isReservaRooftop ? (
                    <div className="text-right mb-4">
                      <p className="font-serif text-[#2b241a] text-sm tracking-[0.25em] font-extralight">
                        {formatPrice(
                          selectedItem.price,
                          selectedItem.isPriceOnRequest,
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xl sm:text-2xl font-semibold text-green-600 mb-4">
                      {formatPrice(
                        selectedItem.price,
                        selectedItem.isPriceOnRequest,
                      )}
                    </p>
                  )}
                  <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed">
                    {selectedItem.description}
                  </p>

                  {renderModalSeals(selectedItem.seals || [])}

                  {selectedItem.toppings &&
                    selectedItem.toppings.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-2">
                          Adicionais
                        </h4>
                        <ul className="space-y-2">
                          {selectedItem.toppings.map((topping) => (
                            <li
                              key={topping.id}
                              className="flex items-center justify-between text-gray-700"
                            >
                              <span>{topping.name}</span>
                              <span className="font-medium text-gray-600">
                                +{formatPrice(topping.price)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <style jsx>{`
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
        }
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
        .line-clamp-3 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .destaques-scroll {
          scrollbar-width: thin;
          scrollbar-color: #d4d4d4 transparent;
        }
        .destaques-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .destaques-scroll::-webkit-scrollbar-thumb {
          background: #d4d4d4;
          border-radius: 999px;
        }
        @media (max-width: 767px) {
          .destaques-scroll {
            scrollbar-width: none;
          }
          .destaques-scroll::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
      {showHighlineChoice ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-950 px-6 text-white">
          <div className="w-full max-w-md text-center">
            <p className="text-sm uppercase tracking-[0.22em] text-white/60">
              High Line
            </p>
            <h1 className="mt-4 text-3xl font-semibold">
              Você está no Bar ou no Club?
            </h1>
            <div className="mt-10 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => chooseHighlineVenue("bar")}
                className="rounded-2xl bg-white px-4 py-10 text-xl font-semibold text-neutral-950"
              >
                Bar
              </button>
              <button
                type="button"
                onClick={() => chooseHighlineVenue("club")}
                className="rounded-2xl border border-white px-4 py-10 text-xl font-semibold text-white"
              >
                Club
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
