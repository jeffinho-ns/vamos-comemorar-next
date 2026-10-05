/**
 * Ordem das seções do cardápio público do Seu Justino (slug justino).
 * Os nomes canônicos são os pedidos pela casa; os aliases são os nomes
 * gravados hoje no cardápio. Seções fora da lista ficam no final,
 * na ordem já salva dos itens.
 */

export type NamedSubcategoryGroup<T> = {
  name: string;
  items: T[];
};

type OrderEntry = {
  aliases: string[];
};

const FOOD_ORDER: OrderEntry[] = [
  { aliases: ["Bolinhos Autorais", "Nossos incríveis bolinhos"] },
  { aliases: ["Para dividir", "Para Dividir"] },
  { aliases: ["Lanches"] },
  { aliases: ["Entradas na brasa", "Entrada na brasa"] },
  { aliases: ["Braseiro brasileiro - cortes nobres", "Braseiro brasileiro - Cortes nobres"] },
  { aliases: ["Acompanhamentos - Braseiro"] },
  { aliases: ["Principais"] },
  { aliases: ["Sobremesas"] },
];

const DRINK_ORDER: OrderEntry[] = [
  { aliases: ["Vodka"] },
  { aliases: ["Gin"] },
  { aliases: ["Whisky", "Whiskey"] },
  { aliases: ["Softs", "Soft Drinks", "Soft's"] },
  { aliases: ["Autorais", "Só Tem no Justino"] },
  { aliases: ["Clássicos"] },
  { aliases: ["Caipirinjas", "Caipirinhas do Justa!", "Caipirinhas do Justa"] },
  { aliases: ["Chopp e cerveja", "Chopps & Cervejas", "Chopps e Cervejas"] },
  { aliases: ["Licor"] },
  { aliases: ["Tequila"] },
  {
    aliases: [
      "sem alcool",
      "sem álcool",
      "Drinks não Alcoólicos",
      "Drinks não Alcoolicos",
      "Drink's não alcoolicos",
    ],
  },
  { aliases: ["Outros"] },
];

const FOOD_CATEGORIES = new Set(["menu principal", "comidas"]);
const DRINK_CATEGORIES = new Set(["bebidas"]);

export const normalizeMenuSortKey = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[`´']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const rankMapFor = (entries: OrderEntry[]) => {
  const map = new Map<string, number>();
  entries.forEach((entry, index) => {
    entry.aliases.forEach((alias) => {
      map.set(normalizeMenuSortKey(alias), index);
    });
  });
  return map;
};

const FOOD_RANK = rankMapFor(FOOD_ORDER);
const DRINK_RANK = rankMapFor(DRINK_ORDER);

const rankMapForCategory = (categoryName: string) => {
  const key = normalizeMenuSortKey(categoryName);
  if (FOOD_CATEGORIES.has(key)) return FOOD_RANK;
  if (DRINK_CATEGORIES.has(key)) return DRINK_RANK;
  return null;
};

export const isSeuJustinoCardapio = (barSlug?: string | null) =>
  normalizeMenuSortKey(barSlug || "") === "justino";

const minItemOrder = (items: { order?: number | string | null }[]) =>
  items.reduce(
    (min, item) => Math.min(min, Number(item.order || 0)),
    Number.POSITIVE_INFINITY,
  );

type OrderedItem = { order?: number | string | null };

/** Reordena subcategorias do Seu Justino. Devolve a mesma lista se não for esse cardápio. */
export const applySeuJustinoSubcategoryOrder = <T extends NamedSubcategoryGroup<OrderedItem>>(
  barSlug: string | undefined,
  categoryName: string | undefined,
  groups: T[],
): T[] => {
  if (!isSeuJustinoCardapio(barSlug)) return groups;
  const rankMap = rankMapForCategory(categoryName || "");
  if (!rankMap) return groups;

  return [...groups].sort((a, b) => {
    const aRank = rankMap.get(normalizeMenuSortKey(a.name));
    const bRank = rankMap.get(normalizeMenuSortKey(b.name));
    const aListed = aRank !== undefined;
    const bListed = bRank !== undefined;
    if (aListed && bListed && aRank !== bRank) return aRank - bRank;
    if (aListed !== bListed) return aListed ? -1 : 1;

    const orderDiff = minItemOrder(a.items) - minItemOrder(b.items);
    if (orderDiff !== 0) return orderDiff;
    return a.name.localeCompare(b.name, "pt-BR");
  });
};
