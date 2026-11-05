"use client";

import {
  ADMIN_MENU_ITEMS,
  filterMenuItemsForEstablishments,
  groupedMenuItems,
  type EstablishmentLike,
} from "@/app/config/adminMenuAccess";

type Props = {
  establishment: EstablishmentLike;
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
};

export default function UserMenuAccessFields({
  establishment,
  selectedKeys,
  onChange,
}: Props) {
  const visibleItems = filterMenuItemsForEstablishments(ADMIN_MENU_ITEMS, [
    establishment,
  ]);
  const groups = groupedMenuItems(visibleItems);
  const selected = new Set(selectedKeys);

  const toggleKey = (key: string, checked: boolean) => {
    if (checked) {
      if (selected.has(key)) return;
      onChange([...selectedKeys, key]);
      return;
    }
    onChange(selectedKeys.filter((k) => k !== key));
  };

  const toggleGroup = (keys: string[], allSelected: boolean) => {
    if (allSelected) {
      const drop = new Set(keys);
      onChange(selectedKeys.filter((k) => !drop.has(k)));
      return;
    }
    const next = new Set(selectedKeys);
    keys.forEach((k) => next.add(k));
    onChange([...next]);
  };

  if (groups.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        Nenhum menu disponível para este estabelecimento.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((block) => {
        const groupKeys = block.items.map((item) => item.key);
        const allSelected = groupKeys.every((k) => selected.has(k));
        return (
          <div key={block.group}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-yellow-500/90">
                {block.label}
              </p>
              <button
                type="button"
                onClick={() => toggleGroup(groupKeys, allSelected)}
                className="text-[10px] text-slate-400 hover:text-yellow-400"
              >
                {allSelected ? "Desmarcar grupo" : "Marcar grupo"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {block.items.map((item) => (
                <label key={item.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(item.key)}
                    onChange={(e) => toggleKey(item.key, e.target.checked)}
                    className="w-3 h-3 rounded border-slate-600 bg-slate-900 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-slate-200">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
