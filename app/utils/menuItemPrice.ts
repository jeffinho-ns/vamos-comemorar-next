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
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  let text = String(value).trim().replace(/\s/g, '').replace(/^R\$\s?/i, '');
  if (!text) return null;
  if (text.includes(',') && text.includes('.')) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (text.includes(',')) {
    text = text.replace(',', '.');
  }

  const amount = parseFloat(text);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

export function formatMenuPriceInput(value: unknown): string {
  const amount = parseOptionalMenuPrice(value);
  if (amount == null) return '';
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

  if (both && to < from) {
    return { mode: 'promo', normal: from, promo: to };
  }
  if (both && to > from) {
    return { mode: 'range', from, to };
  }
  return { mode: 'single', amount: normal };
}
