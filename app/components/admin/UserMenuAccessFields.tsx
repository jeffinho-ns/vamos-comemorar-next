"use client";

import {
  ADMIN_MENU_ITEMS,
  filterMenuItemsForEstablishments,
  groupedMenuItems,
  isSeuJustinoEstablishment,
  type EstablishmentLike,
} from "@/app/config/adminMenuAccess";
import { BI_JUSTINO_MENU_ITEMS } from "@/app/config/biJustinoMenuAccess";

type Props = {
  establishment: EstablishmentLike;
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  biSelectedKeys?: string[];
  onBiChange?: (keys: string[]) => void;
};

export default function UserMenuAccessFields({
  establishment,
  selectedKeys,
  onChange,
  biSelectedKeys = [],
  onBiChange,
}: Props) {
  const isJustino = isSeuJustinoEstablishment(establishment);
  const visibleItems = filterMenuItemsForEstablishments(ADMIN_MENU_ITEMS, [
    establishment,
  ]);
  const groups = groupedMenuItems(visibleItems);
  const selected = new Set(selectedKeys);
  const biSelected = new Set(biSelectedKeys);
  const showBiPages = isJustino && selected.has("bi-justino");

  const clearBiPages = () => {
    if (biSelectedKeys.length > 0) onBiChange?.([]);
  };

  const toggleKey = (key: string, checked: boolean) => {
    if (key === "bi-justino" && !checked) clearBiPages();
    if (checked) {
      if (selected.has(key)) return;
      onChange([...selectedKeys, key]);
      return;
    }
    onChange(selectedKeys.filter((k) => k !== key));
  };

  const toggleGroup = (keys: string[], allSelected: boolean) => {
    if (allSelected) {
      if (keys.includes("bi-justino")) clearBiPages();
      const drop = new Set(keys);
      onChange(selectedKeys.filter((k) => !drop.has(k)));
      return;
    }
    const next = new Set(selectedKeys);
    keys.forEach((k) => next.add(k));
    onChange([...next]);
  };

  const toggleBiKey = (key: string, checked: boolean) => {
    if (!onBiChange) return;
    if (checked) {
      if (biSelected.has(key)) return;
      onBiChange([...biSelectedKeys, key]);
      return;
    }
    onBiChange(biSelectedKeys.filter((k) => k !== key));
  };

  const toggleAllBiPages = (allSelected: boolean) => {
    if (!onBiChange) return;
    if (allSelected) {
      onBiChange([]);
      return;
    }
    onBiChange(BI_JUSTINO_MENU_ITEMS.map((item) => item.key));
  };

  if (groups.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        Nenhum menu disponível para este estabelecimento.
      </p>
    );
  }

  const allBiSelected =
    BI_JUSTINO_MENU_ITEMS.length > 0 &&
    BI_JUSTINO_MENU_ITEMS.every((item) => biSelected.has(item.key));

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
                <div
                  key={item.key}
                  className={item.key === "bi-justino" && showBiPages ? "col-span-2" : undefined}
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(item.key)}
                      onChange={(e) => toggleKey(item.key, e.target.checked)}
                      className="w-3 h-3 rounded border-slate-600 bg-slate-900 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-slate-200">{item.label}</span>
                  </label>
                  {item.key === "bi-justino" && showBiPages && (
                    <div className="mt-2 ml-5 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-yellow-500/90">
                          Abas do BI Seu Justino
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleAllBiPages(allBiSelected)}
                          className="text-[10px] text-slate-400 hover:text-yellow-400"
                        >
                          {allBiSelected ? "Desmarcar todas" : "Marcar todas"}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {BI_JUSTINO_MENU_ITEMS.map((page) => (
                          <label key={page.key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={biSelected.has(page.key)}
                              onChange={(e) => toggleBiKey(page.key, e.target.checked)}
                              className="w-3 h-3 rounded border-slate-600 bg-slate-900 text-yellow-500 focus:ring-yellow-500"
                            />
                            <span className="text-slate-200">{page.label}</span>
                          </label>
                        ))}
                      </div>
                      {biSelectedKeys.length === 0 && (
                        <p className="mt-2 text-[10px] text-amber-400/90">
                          Precisa marcar pelo menos uma aba.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
