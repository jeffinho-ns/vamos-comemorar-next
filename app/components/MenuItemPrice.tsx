import {
  formatMenuCurrency,
  resolveMenuPriceDisplay,
  type MenuPriceFields,
} from '@/app/utils/menuItemPrice';

type MenuItemPriceProps = {
  item: MenuPriceFields;
  className?: string;
  promoClassName?: string;
  consultLabel?: string;
};

export default function MenuItemPrice({
  item,
  className = '',
  promoClassName = 'text-rose-600',
  consultLabel = '',
}: MenuItemPriceProps) {
  const display = resolveMenuPriceDisplay(item);

  if (display.mode === 'consult') {
    if (!consultLabel) return null;
    return <span className={className}>{consultLabel}</span>;
  }

  if (display.mode === 'range') {
    return (
      <span className={className}>
        De {formatMenuCurrency(display.from)} até {formatMenuCurrency(display.to)}
      </span>
    );
  }

  if (display.mode === 'promo') {
    return (
      <span className={`inline-flex flex-col leading-tight ${className}`}>
        <span className="text-[0.85em] font-medium text-neutral-400 line-through">
          De {formatMenuCurrency(display.normal)}
        </span>
        <span className={`font-semibold ${promoClassName}`}>
          Por {formatMenuCurrency(display.promo)}
        </span>
      </span>
    );
  }

  return <span className={className}>{formatMenuCurrency(display.amount)}</span>;
}
