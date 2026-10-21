export type MenuPriceFields = {
  price?: number | string | null;
  isPriceOnRequest?: boolean;
  priceFrom?: number | string | null;
  priceTo?: number | string | null;
};

export type MenuPriceDisplay =
  | { mode: 'consult' }
  | { mode: 'single'; amount: number }
  | { mode: 'range'; from: number; to: number }
  | { mode: 'promo'; normal: number; promo: number };

export function parseOptionalMenuPrice(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const amount = typeof value === 'number' ? value : parseFloat(String(value));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

export function formatMenuCurrency(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

export function resolveMenuPriceDisplay(item: MenuPriceFields): MenuPriceDisplay {
  const normal = Number(item.price);
  if (
    item.isPriceOnRequest ||
    normal === -1 ||
    item.price === null ||
    item.price === undefined ||
    !Number.isFinite(normal)
  ) {
    return { mode: 'consult' };
  }

  const from = parseOptionalMenuPrice(item.priceFrom);
  const to = parseOptionalMenuPrice(item.priceTo);
  const both = from != null && to != null;

  if (both && to < normal) {
    return { mode: 'promo', normal, promo: to };
  }
  if (both && to > from) {
    return { mode: 'range', from, to };
  }
  return { mode: 'single', amount: normal };
}
