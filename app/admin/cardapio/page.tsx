'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Gate from '@/app/components/Gate';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdStar,
  MdLocationOn,
  MdUpload,
  MdSearch,
  MdSecurity,
  MdPause,
  MdPlayArrow,
  MdRestore,
  MdDeleteOutline,
  MdEvent,
  MdViewModule,
  MdViewList,
  MdContentCopy,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from 'react-icons/md';
import { useSaasAccess } from '../../hooks/useSaasAccess';
import ImageCropModal from '../../components/ImageCropModal';
import MenuPauseScheduleModal, {
  type MenuPauseApplyMode,
  type PauseWindowDraft,
} from '../../components/MenuPauseScheduleModal';
import { useRouter } from 'next/navigation';
import { uploadImage as uploadImageToFirebase } from '@/app/services/uploadService';
import { filterEstablishmentListForUser } from '@/app/utils/establishmentAccessRules';
import { establishmentAllowsModule } from '@/app/utils/establishmentModuleAccess';
import { toCardapioBarIds } from '@/app/config/cardapioBarResolver';
import { fetchCardapioMappings } from '@/app/utils/establishmentRulesClient';

type MenuDisplayStyle = 'normal' | 'clean';

// Interfaces atualizadas para corresponder à API
interface Topping {
  id: string | number;
  name: string;
  price: number;
}

interface MenuCategory {
    id: string | number;
    name: string;
    barId: string | number;
    order: number;
    items?: MenuItem[]; // Adicionado para incluir itens
}

interface MenuSubCategory {
  id: string | number;
  name: string;
  categoryId: string | number;
  barId: string | number;
  order: number;
}

// Tipos para selos
type FoodSeal = 'especial-do-dia' | 'vegetariano' | 'saudavel-leve' | 'prato-da-casa' | 'artesanal';
type DrinkSeal = 'assinatura-bartender' | 'edicao-limitada' | 'processo-artesanal' | 'sem-alcool' | 'refrescante' | 'citrico' | 'doce' | 'picante';

interface Seal {
  id: string;
  name: string;
  color: string;
  type: 'food' | 'drink';
}

interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  categoryId: string;
  barId: string;
  subCategory: string; // Sub-categoria como string simples
  toppings: Topping[];
  order: number;
  seals: string[]; // IDs dos selos selecionados
  isPriceOnRequest?: boolean; // Indica se o preço é "Sob Consulta"
}

interface EditableSubCategory {
  id?: string | number;
  name: string;
  order: number;
  originalName: string;
  originalOrder: number;
  count?: number;
}

interface MenuCategoryForm {
  name: string;
  barId: string;
  order: number;
  subCategories: EditableSubCategory[];
}

interface BarForm {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  coverImages: string[]; // Adicionado para múltiplos uploads
  address: string;
  rating: string;
  reviewsCount: string;
  amenities: string[];
  latitude: string;
  longitude: string;
  popupImageUrl: string; // ✨ Adicionado
  facebook?: string; // <-- Adicionado
  instagram?: string; // <-- Adicionado
  whatsapp?: string; // <-- Adicionado
  // 🎨 Campos de personalização de cores
  menu_category_bg_color?: string;
  menu_category_text_color?: string;
  menu_subcategory_bg_color?: string;
  menu_subcategory_text_color?: string;
  mobile_sidebar_bg_color?: string;
  mobile_sidebar_text_color?: string;
  custom_seals?: Array<{ id: string; name: string; color: string; type: 'food' | 'drink' }>;
  menu_display_style: MenuDisplayStyle;
  /** Até 5 logos exibidos no cardápio público entre o banner e o menu de categorias */
  partner_logos?: string[];
}

interface MenuItem {
  id: string | number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  categoryId: string | number;
  barId: string | number;
  subCategory?: string; // Sub-categoria como string simples
  subCategoryName?: string; // Nome da sub-categoria para exibição (mesmo que subCategory)
  toppings: Topping[];
  order: number;
  seals?: string[]; // IDs dos selos selecionados
  visible?: number | boolean; // Indica se o item está visível (1 ou true = visível, 0 ou false = oculto)
  effectiveVisible?: boolean;
  schedulePaused?: boolean;
  pauseSchedules?: Array<{
    id: number;
    summary: string;
    weekdays: number[];
    start_time: string;
    end_time: string;
  }>;
  isPriceOnRequest?: boolean; // Indica se o preço é "Sob Consulta"
}

function isItemEffectivelyPaused(item: MenuItem): boolean {
  if (item.visible === 0 || item.visible === false) return true;
  if (item.schedulePaused) return true;
  if (item.effectiveVisible === false) return true;
  return false;
}

function sameItemId(a: string | number, b: string | number): boolean {
  return String(a) === String(b);
}

function itemMatchesSelection(item: MenuItem, selectedIds: Array<string | number>): boolean {
  return selectedIds.some((id) => sameItemId(id, item.id));
}

function hasConfiguredPauseSchedule(item: MenuItem): boolean {
  return (item.pauseSchedules?.length ?? 0) > 0;
}

function derivePauseWindowsFromItems(items: MenuItem[]): PauseWindowDraft[] {
  const seen = new Set<number>();
  const windows: PauseWindowDraft[] = [];

  for (const item of items) {
    for (const schedule of item.pauseSchedules ?? []) {
      if (seen.has(schedule.id)) continue;
      seen.add(schedule.id);
      windows.push({
        weekdays: [...schedule.weekdays],
        startTime: schedule.start_time,
        endTime: schedule.end_time,
      });
    }
  }

  return windows;
}

// **CORREÇÃO**: Interface Bar atualizada para incluir os campos sociais
interface Bar {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  coverImages: string[]; // Adicionado para múltiplos uploads
  address: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  popupImageUrl?: string; // ✨ Adicionado
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
  custom_seals?: Array<{ id: string; name: string; color: string; type: 'food' | 'drink' }>;
  menu_display_style?: MenuDisplayStyle;
  partner_logos?: string[];
}

declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    indeterminate?: boolean;
  }
}

const API_BASE_URL = 'https://api.agilizaiapp.com.br/api/cardapio';

const isPersistedSubcategoryId = (id: string | number | undefined | null): boolean =>
  id !== undefined && id !== null && String(id).trim() !== '' && /^\d+$/.test(String(id));

const getItemSubcategoryName = (item: Pick<MenuItem, 'subCategoryName' | 'subCategory'>): string =>
  String(item.subCategoryName || item.subCategory || '').trim();

const fetchCategorySubcategoriesFromApi = async (
  categoryId: string | number,
  barId: string | number,
): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/subcategories/category/${categoryId}`);
  if (!response.ok) return [];
  const data = await response.json();
  const list = Array.isArray(data) ? data : [];
  const filtered = list.filter((sub: any) => {
    if (sub.barId === undefined || sub.barId === null || sub.barId === '') return true;
    return String(sub.barId) === String(barId);
  });
  // Se o filtro por bar esvaziar (barId inconsistente na API), usa a lista da categoria
  return filtered.length > 0 || list.length === 0 ? filtered : list;
};

const buildEditableSubcategories = (
  apiSubs: any[],
  items: MenuItem[],
  categoryId: string | number,
  barId: string | number,
): EditableSubCategory[] => {
  const itemStats = new Map<string, { name: string; count: number; minOrder: number }>();

  items.forEach((item) => {
    if (String(item.categoryId) !== String(categoryId) || String(item.barId) !== String(barId)) {
      return;
    }
    const name = getItemSubcategoryName(item);
    if (!name) return;
    const key = name.toLowerCase();
    const itemOrder = item.order !== undefined && item.order !== null ? Number(item.order) : 999;
    const existing = itemStats.get(key);
    if (!existing) {
      itemStats.set(key, { name, count: 1, minOrder: itemOrder });
    } else {
      existing.count += 1;
      existing.minOrder = Math.min(existing.minOrder, itemOrder);
    }
  });

  const byKey = new Map<string, EditableSubCategory>();

  apiSubs.forEach((sub: any) => {
    const name = String(sub.name || '').trim();
    if (!name) return;
    const key = name.toLowerCase();
    const stats = itemStats.get(key);
    // Ordem exibida prioriza itens (página pública usa ordem dos itens).
    // ID oficial vem da API para permitir rename/delete.
    const order =
      stats !== undefined
        ? stats.minOrder
        : sub.order !== undefined && sub.order !== null
          ? Number(sub.order)
          : 999;
    byKey.set(key, {
      id: sub.id,
      name,
      order,
      originalName: name,
      originalOrder: order,
      count: stats?.count ?? (Number(sub.itemsCount) || 0),
    });
  });

  itemStats.forEach((stats, key) => {
    if (byKey.has(key)) {
      const current = byKey.get(key)!;
      byKey.set(key, { ...current, count: stats.count });
      return;
    }
    byKey.set(key, {
      id: undefined,
      name: stats.name,
      order: stats.minOrder,
      originalName: stats.name,
      originalOrder: stats.minOrder,
      count: stats.count,
    });
  });

  return Array.from(byKey.values())
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.name.localeCompare(b.name);
    })
    .map((sub, index) => ({
      ...sub,
      order: index,
      originalOrder: index,
    }));
};

const renameItemsSubcategory = async (
  items: MenuItem[],
  categoryId: string | number,
  barId: string | number,
  oldName: string,
  newName: string,
): Promise<number> => {
  const matching = items.filter((item) => {
    if (String(item.categoryId) !== String(categoryId) || String(item.barId) !== String(barId)) {
      return false;
    }
    return getItemSubcategoryName(item) === oldName;
  });

  let updated = 0;
  for (const item of matching) {
    try {
      const response = await fetch(`${API_BASE_URL}/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          subCategory: newName,
          subCategoryName: newName,
        }),
      });
      if (response.ok) updated += 1;
    } catch (error) {
      console.error(`Erro ao renomear subcategoria no item ${item.id}:`, error);
    }
  }
  return updated;
};

const syncItemOrdersToSubcategoryOrder = async (
  items: MenuItem[],
  categoryId: string | number,
  barId: string | number,
  orderedNames: string[],
): Promise<number> => {
  const categoryItems = items.filter(
    (item) =>
      String(item.categoryId) === String(categoryId) && String(item.barId) === String(barId),
  );

  let updated = 0;
  for (let subIndex = 0; subIndex < orderedNames.length; subIndex += 1) {
    const subName = orderedNames[subIndex];
    const subItems = categoryItems
      .filter((item) => getItemSubcategoryName(item) === subName)
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    for (let itemIndex = 0; itemIndex < subItems.length; itemIndex += 1) {
      const item = subItems[itemIndex];
      const nextOrder = subIndex * 1000 + itemIndex;
      if (Number(item.order) === nextOrder) continue;
      try {
        const response = await fetch(`${API_BASE_URL}/items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...item,
            order: nextOrder,
            subCategory: subName,
            subCategoryName: subName,
          }),
        });
        if (response.ok) updated += 1;
      } catch (error) {
        console.error(`Erro ao sincronizar ordem do item ${item.id}:`, error);
      }
    }
  }
  return updated;
};

const persistEditableSubcategories = async ({
  categoryId,
  barId,
  subCategories,
  items,
}: {
  categoryId: string | number;
  barId: string | number;
  subCategories: EditableSubCategory[];
  items: MenuItem[];
}): Promise<{ renamed: number; created: number; updatedItems: number; reordered: boolean }> => {
  const valid = subCategories
    .filter((sub) => sub.name.trim() !== '')
    .map((sub, index) => ({ ...sub, name: sub.name.trim(), order: index }));

  // Cópia local para sincronizar ordem após renomes (itens em memória ainda têm o nome antigo)
  let workingItems: MenuItem[] = items.map((item) => ({ ...item }));

  const applyLocalRename = (oldName: string, newName: string) => {
    workingItems = workingItems.map((item) => {
      if (
        String(item.categoryId) !== String(categoryId) ||
        String(item.barId) !== String(barId) ||
        getItemSubcategoryName(item) !== oldName
      ) {
        return item;
      }
      return { ...item, subCategory: newName, subCategoryName: newName };
    });
  };

  let renamed = 0;
  let created = 0;
  let updatedItems = 0;

  for (const sub of valid) {
    const hasPersistedId = isPersistedSubcategoryId(sub.id);
    const originalName = (sub.originalName || '').trim();
    const nameChanged = Boolean(originalName) && sub.name !== originalName;

    if (hasPersistedId) {
      if (nameChanged || sub.order !== sub.originalOrder) {
        try {
          const response = await fetch(`${API_BASE_URL}/subcategories/${sub.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: sub.name,
              order: sub.order,
            }),
          });
          if (!response.ok) {
            console.warn(`Falha ao atualizar subcategoria ${sub.id}:`, response.status);
          }
        } catch (error) {
          console.error(`Erro ao atualizar subcategoria ${sub.id}:`, error);
        }
      }

      if (nameChanged) {
        const itemUpdates = await renameItemsSubcategory(
          workingItems,
          categoryId,
          barId,
          originalName,
          sub.name,
        );
        updatedItems += itemUpdates;
        applyLocalRename(originalName, sub.name);
        renamed += 1;
      }
    } else if (!originalName) {
      try {
        const response = await fetch(`${API_BASE_URL}/subcategories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: sub.name,
            categoryId,
            barId,
            order: sub.order,
          }),
        });
        if (response.ok) {
          created += 1;
        } else {
          console.warn(`Falha ao criar subcategoria "${sub.name}":`, response.status);
        }
      } catch (error) {
        console.error(`Erro ao criar subcategoria "${sub.name}":`, error);
      }
    } else if (nameChanged) {
      const itemUpdates = await renameItemsSubcategory(
        workingItems,
        categoryId,
        barId,
        originalName,
        sub.name,
      );
      updatedItems += itemUpdates;
      applyLocalRename(originalName, sub.name);
      if (itemUpdates > 0) renamed += 1;
    }
  }

  const orderedNames = valid.map((sub) => sub.name);
  const hasOrderChanges = valid.some((sub) => sub.order !== sub.originalOrder);
  let reordered = false;

  if (hasOrderChanges || renamed > 0 || created > 0) {
    try {
      const response = await fetch(`${API_BASE_URL}/subcategories/reorder/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcategoryNames: orderedNames,
          barId,
        }),
      });
      reordered = response.ok;
      if (!response.ok) {
        console.warn('Falha ao reordenar subcategorias via API:', response.status);
      }
    } catch (error) {
      console.error('Erro ao reordenar subcategorias via API:', error);
    }

    // Página pública agrupa pelos itens: sincroniza order dos itens com a ordem salva
    updatedItems += await syncItemOrdersToSubcategoryOrder(
      workingItems,
      categoryId,
      barId,
      orderedNames,
    );
    reordered = true;
  }

  return { renamed, created, updatedItems, reordered };
};
// Base sem o sufixo /cardapio, usada só para consultar enabled_modules em /api/bars
const MODULES_API_URL = 'https://api.agilizaiapp.com.br';
const FULL_CARDAPIO_ACCESS_EMAILS = new Set([
  'luisfelipe@ideiaum.com.br',
]);

// Placeholder local para todos os pontos do admin
const PLACEHOLDER_IMAGE_URL = '/placeholder-cardapio.svg';

// Índice em memória: resolve valores antigos (filename/objectPath) -> URL pública (Firebase/Cloudinary/etc)
// Isso evita construir URLs quebradas do Cloudinary e melhora o preview ao selecionar da galeria.
const imageUrlIndex = new Map<string, string>();

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function toThumbVariant(value: string) {
  if (!value) return value;
  return value.replace(/_(full|medium)\.webp$/i, '_thumb.webp');
}

function toThumbPublicImagesUrl(urlValue: string) {
  const marker = '/public/images/';
  if (!urlValue.includes(marker)) return toThumbVariant(urlValue);
  const [withoutQuery, queryPart] = urlValue.split('?');
  const raw = withoutQuery.split(marker)[1] || '';
  if (!raw) return toThumbVariant(urlValue);
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const thumbPath = toThumbVariant(decoded.replace(/^\/+/, ''));
  const rebuilt = `${withoutQuery.split(marker)[0]}${marker}${encodeURIComponent(thumbPath)}`;
  return queryPart ? `${rebuilt}?${queryPart}` : rebuilt;
}

const indexImageUrl = (key: unknown, url: unknown) => {
  if (typeof key !== 'string' || typeof url !== 'string') return;
  const k = key.trim();
  const u = url.trim();
  if (!k || !u) return;
  // Só indexar URLs absolutas válidas (evita mapear "filename" -> "filename" e gerar 404 em /admin/*.jpg)
  if (!isHttpUrl(u)) return;
  // Não indexar Cloudinary (objetivo é remover completamente)
  if (u.includes('res.cloudinary.com') || u.includes('cloudinary.com')) return;
  imageUrlIndex.set(k, u);
  const last = k.split('/').pop();
  if (last) imageUrlIndex.set(last, u);
};

// Constantes dos selos
const FOOD_SEALS: Seal[] = [
  { id: 'especial-do-dia', name: 'Especial do Dia', color: '#FF6B35', type: 'food' },
  { id: 'vegetariano', name: 'Vegetariano', color: '#4CAF50', type: 'food' },
  { id: 'saudavel-leve', name: 'Saudável/Leve', color: '#8BC34A', type: 'food' },
  { id: 'prato-da-casa', name: 'Prato da Casa', color: '#FF9800', type: 'food' },
  { id: 'artesanal', name: 'Artesanal', color: '#795548', type: 'food' },
];

const DRINK_SEALS: Seal[] = [
  { id: 'assinatura-bartender', name: 'Assinatura do Bartender', color: '#9C27B0', type: 'drink' },
  { id: 'edicao-limitada', name: 'Edição Limitada', color: '#E91E63', type: 'drink' },
  { id: 'processo-artesanal', name: 'Processo Artesanal', color: '#673AB7', type: 'drink' },
  { id: 'sem-alcool', name: 'Sem Álcool', color: '#00BCD4', type: 'drink' },
  { id: 'refrescante', name: 'Refrescante', color: '#00E5FF', type: 'drink' },
  { id: 'citrico', name: 'Cítrico', color: '#FFEB3B', type: 'drink' },
  { id: 'doce', name: 'Doce', color: '#FFC107', type: 'drink' },
  { id: 'picante', name: 'Picante', color: '#F44336', type: 'drink' },
];

const ALL_SEALS = [...FOOD_SEALS, ...DRINK_SEALS];

// Vinhos - opções especiais (serializadas em seals como vinho:*)
const WINE_COUNTRIES: { id: string; label: string; emoji: string }[] = [
  { id: 'vinho:pais:brasil', label: 'Brasil', emoji: '🇧🇷' },
  { id: 'vinho:pais:franca', label: 'França', emoji: '🇫🇷' },
  { id: 'vinho:pais:argentina', label: 'Argentina', emoji: '🇦🇷' },
  { id: 'vinho:pais:portugal', label: 'Portugal', emoji: '🇵🇹' },
  { id: 'vinho:pais:chile', label: 'Chile', emoji: '🇨🇱' },
  { id: 'vinho:pais:italia', label: 'Itália', emoji: '🇮🇹' },
  { id: 'vinho:pais:espanha', label: 'Espanha', emoji: '🇪🇸' },
];

const WINE_TYPES: { id: string; label: string; color: string }[] = [
  { id: 'vinho:tipo:champagne', label: 'Champagne', color: '#A7D3F2' },
  { id: 'vinho:tipo:espumante', label: 'Espumante', color: '#B8E1FF' },
  { id: 'vinho:tipo:branco', label: 'Branco', color: '#F3FAD7' },
  { id: 'vinho:tipo:rose', label: 'Rosé', color: '#FFD1DC' },
  { id: 'vinho:tipo:tinto', label: 'Tinto', color: '#B71C1C' },
];

const getValidImageUrl = (filename?: string | null): string => {
  // Verificar se filename é válido
  if (!filename || typeof filename !== 'string') {
    return PLACEHOLDER_IMAGE_URL;
  }

  const trimmed = filename.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NULL') {
    return PLACEHOLDER_IMAGE_URL;
  }

  // Preview local (upload) ou data URL - manter blob URLs para renderização especial
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    // Verificar se o blob URL ainda é válido (não foi revogado)
    if (trimmed.startsWith('blob:')) {
      try {
        // Tentar criar um objeto URL para verificar se ainda é válido
        // Se falhar, retornar placeholder
        return trimmed;
      } catch {
        return PLACEHOLDER_IMAGE_URL;
      }
    }
    return trimmed;
  }
  
  // Se for Cloudinary, NÃO usar (evita 404 e remove dependência).
  // Tenta resolver por filename/objectPath no índice local; se não achar, placeholder.
  if (trimmed.includes('res.cloudinary.com') || trimmed.includes('cloudinary.com')) {
    const last = trimmed.split('?')[0]?.split('/').pop()?.trim();
    if (last) {
      const mapped = imageUrlIndex.get(last);
      if (mapped) return toThumbVariant(mapped);
    }
    return PLACEHOLDER_IMAGE_URL;
  }

  // Se já é uma URL completa (Firebase/FTP/Unsplash/etc), retornar como está
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // URLs legadas /public/images/... podem quebrar (404) em alguns cenários.
    // Tenta remapear para URL real pelo índice; se não achar, placeholder para ativar fallback.
    if (trimmed.includes('/public/images/')) {
      const marker = '/public/images/';
      const rawKey = trimmed.split(marker)[1]?.split('?')[0]?.trim() || '';
      if (rawKey) {
        let decodedKey = rawKey;
        try {
          decodedKey = decodeURIComponent(rawKey);
        } catch {
          decodedKey = rawKey;
        }
        const key = decodedKey.replace(/^\/+/, '');
        const byExact = imageUrlIndex.get(key);
        if (byExact) return toThumbVariant(byExact);
        const last = key.split('/').pop();
        if (last) {
          const byLast = imageUrlIndex.get(last);
          if (byLast) return toThumbVariant(byLast);
        }
      }
      // Se não houver índice local, mantém a URL de proxy em variante thumb
      // para evitar sumir imagem no admin.
      return toThumbPublicImagesUrl(trimmed);
    }
    return toThumbVariant(trimmed);
  }

  // Resolver via índice da galeria (filename/objectPath -> url pública)
  const byExact = imageUrlIndex.get(trimmed);
  if (byExact && (isHttpUrl(byExact) || byExact.startsWith('/') || byExact.startsWith('blob:') || byExact.startsWith('data:'))) {
    return toThumbVariant(byExact);
  }

  const lastSegment = trimmed.split('/').pop();
  if (lastSegment) {
    const byLast = imageUrlIndex.get(lastSegment);
    if (byLast && (isHttpUrl(byLast) || byLast.startsWith('/') || byLast.startsWith('blob:') || byLast.startsWith('data:'))) {
      return toThumbVariant(byLast);
    }
  }

  // Não conseguimos resolver: não construa URL do Cloudinary (evita 404); use placeholder.
  return PLACEHOLDER_IMAGE_URL;
};

const resolveBarCoverImage = (bar: { coverImageUrl?: string; coverImages?: string[] }) => {
  const primary = getValidImageUrl(bar.coverImageUrl);
  const firstCover = Array.isArray(bar.coverImages) && bar.coverImages[0]
    ? getValidImageUrl(bar.coverImages[0])
    : PLACEHOLDER_IMAGE_URL;

  const primaryLooksLegacyProxy =
    typeof primary === 'string' && primary.includes('/public/images/');

  if (
    primaryLooksLegacyProxy &&
    firstCover &&
    firstCover !== PLACEHOLDER_IMAGE_URL
  ) {
    return firstCover;
  }

  if (primary && primary !== PLACEHOLDER_IMAGE_URL) return primary;
  return firstCover || PLACEHOLDER_IMAGE_URL;
};

export default function CardapioAdminPage() {
  const {
    isAdmin,
    isSuperAdmin,
    isPromoter,
    promoterBar,
    canManageBar,
    userEmail,
    myEstablishmentPermissions,
    canAccessCardapio,
  } = useSaasAccess();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'bars' | 'categories' | 'items'>('bars');
  const [showBarModal, setShowBarModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showImageGalleryModal, setShowImageGalleryModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showImageEditorModal, setShowImageEditorModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [cropImageField, setCropImageField] = useState<string>('');
  const [imageGalleryField, setImageGalleryField] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<Array<{
    filename: string;
    url?: string | null; // URL completa do Cloudinary se disponível
    sourceType: string;
    imageType: string;
    usageCount: number;
    barIds?: Array<{ id: number; name: string; type: string }>;
    firstItemId?: number;
  }>>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySearchTerm, setGallerySearchTerm] = useState('');
  const [trashItems, setTrashItems] = useState<Array<{
    id: number | string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    categoryId: number | string;
    barId: number | string;
    category: string;
    deletedAt: string;
    daysDeleted: number;
    canRestore: boolean;
  }>>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingBar, setEditingBar] = useState<Bar | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [menuData, setMenuData] = useState<{
    bars: Bar[];
    categories: MenuCategory[];
    subCategories: MenuSubCategory[];
    items: MenuItem[];
  }>({
    bars: [],
    categories: [],
    subCategories: [],
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<string | number>>([]);
  
  // Novos estados para filtros e visualização
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [filterSubCategory, setFilterSubCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingPriceId, setEditingPriceId] = useState<string | number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [pauseModalScopeLabel, setPauseModalScopeLabel] = useState('');
  const [pauseModalMode, setPauseModalMode] = useState<MenuPauseApplyMode>('scheduled');
  const [pauseModalInitialWindows, setPauseModalInitialWindows] = useState<PauseWindowDraft[]>([]);
  
  // Estados para controlar expansão de categorias e subcategorias na visualização em lista
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());

  const promoterBarIdNum = promoterBar ? Number(promoterBar.barId) : null;

  const normalizeKey = (value: unknown) => {
    // Remove acentos, pontuação e normaliza espaços para aumentar taxa de match.
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  };

  const allowedEstablishmentIdsFromPerms = myEstablishmentPermissions
    .filter((p) => p.can_view_cardapio !== false)
    .map((p) => Number(p.establishment_id))
    .filter((id) => !Number.isNaN(id) && id > 0);

  const uniqueAllowedEstablishmentIds = Array.from(new Set(allowedEstablishmentIdsFromPerms));

  const allowedEstablishmentNameKeys = myEstablishmentPermissions
    .filter((p) => p.can_view_cardapio !== false)
    .map((p) => (p.establishment_name ? normalizeKey(p.establishment_name) : ""))
    .filter((k) => k);
  const allowedEstablishmentNameKeysSet = new Set(allowedEstablishmentNameKeys);
  const hasFullCardapioAccessByEmail = FULL_CARDAPIO_ACCESS_EMAILS.has(
    (userEmail || '').trim().toLowerCase()
  );

  // Mantém regra especial existente (compatibilidade)
  const isReservaRooftopRestrictedUser =
    (userEmail || "").trim().toLowerCase() === "vbs14@hotmail.com" && promoterBarIdNum !== null;

  const shouldRestrictByPerms =
    canAccessCardapio &&
    !isSuperAdmin &&
    !hasFullCardapioAccessByEmail &&
    !isReservaRooftopRestrictedUser &&
    (uniqueAllowedEstablishmentIds.length > 0 || allowedEstablishmentNameKeys.length > 0);

  const visibleBars =
    !isSuperAdmin && isReservaRooftopRestrictedUser && promoterBarIdNum !== null
      ? menuData.bars.filter((bar) => Number(bar.id) === promoterBarIdNum)
      : shouldRestrictByPerms
        ? (() => {
            const cardapioBarIdsFromPerms = toCardapioBarIds(
              uniqueAllowedEstablishmentIds,
              menuData.bars,
            );
            const barsById = menuData.bars.filter((bar) =>
              cardapioBarIdsFromPerms.includes(Number(bar.id)),
            );

            if (barsById.length > 0) return barsById;

            // Fallback por nome apenas quando o mapeamento place → bar não resolveu.
            const barsByName = menuData.bars.filter((bar) => {
              const barKey = normalizeKey(bar.name);
              if (!barKey) return false;
              if (allowedEstablishmentNameKeysSet.has(barKey)) return true;

              return allowedEstablishmentNameKeys.some(
                (permKey) => permKey && barKey.includes(permKey),
              );
            });

            if (barsByName.length > 0) return barsByName;

            // Se nada casou, loga e não quebra a UX do admin.
            console.warn("[CARDAPIO] Falha ao mapear permissões do usuário para bars.", {
              uniqueAllowedEstablishmentIds,
              cardapioBarIdsFromPerms,
              allowedEstablishmentNameKeys,
              sampleBars: menuData.bars.slice(0, 5).map((b) => ({ id: b.id, name: b.name })),
            });
            return menuData.bars;
          })()
        : menuData.bars;

  const visibleBarIdsForFiltering = Array.from(
    new Set(visibleBars.map((bar) => Number(bar.id)).filter((id) => !Number.isNaN(id)))
  );

  const visibleCategories =
    !isSuperAdmin && visibleBarIdsForFiltering.length > 0
      ? menuData.categories.filter((category) => visibleBarIdsForFiltering.includes(Number(category.barId)))
      : menuData.categories;

  const visibleItems =
    !isSuperAdmin && visibleBarIdsForFiltering.length > 0
      ? menuData.items.filter((item) => visibleBarIdsForFiltering.includes(Number(item.barId)))
      : menuData.items;

  const [barForm, setBarForm] = useState<BarForm>({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    coverImageUrl: '',
    coverImages: [],
    address: '',
    rating: '',
    reviewsCount: '',
    amenities: [],
    latitude: '',
    longitude: '',
    popupImageUrl: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
    menu_category_bg_color: '',
    menu_category_text_color: '',
    menu_subcategory_bg_color: '',
    menu_subcategory_text_color: '',
    mobile_sidebar_bg_color: '',
    mobile_sidebar_text_color: '',
    custom_seals: [],
    menu_display_style: 'normal',
    partner_logos: [],
  });

  const [categoryForm, setCategoryForm] = useState<MenuCategoryForm>({
    name: '',
    barId: '',
    order: 0,
    subCategories: [],
  });

  const [itemForm, setItemForm] = useState<MenuItemForm>({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: '',
    barId: '',
    subCategory: '',
    toppings: [],
    order: 0,
    seals: [],
    isPriceOnRequest: false,
  });

  const [newTopping, setNewTopping] = useState({ name: '', price: '' });
  const [editingToppingId, setEditingToppingId] = useState<string | null>(null);
  const [imageIndexVersion, setImageIndexVersion] = useState(0);
  const [availableSubCategories, setAvailableSubCategories] = useState<Array<{ name: string; order: number }>>([]);

  const fetchData = useCallback(async () => {
    const isInitialLoad = menuData.bars.length === 0;
    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);
    try {
      const barsRes = await fetch(`${API_BASE_URL}/bars`);
      if (!barsRes.ok) {
        throw new Error('Erro ao carregar estabelecimentos');
      }
      const bars = await barsRes.json();
      const barsList = Array.isArray(bars) ? bars : [];

      // A rota /api/cardapio/bars não retorna enabled_modules; buscar de /api/bars
      // (mesma tabela, mesmos ids) só para saber quais casas têm o módulo "cardapio".
      let modulesByBarId = new Map<number, unknown>();
      try {
        const modulesRes = await fetch(`${MODULES_API_URL}/api/bars`);
        if (modulesRes.ok) {
          const modulesList = await modulesRes.json();
          if (Array.isArray(modulesList)) {
            modulesByBarId = new Map(
              modulesList.map((b: any) => [Number(b.id), b.enabled_modules]),
            );
          }
        }
      } catch {
        // Sem dados de módulos: nenhum estabelecimento é ocultado.
      }

      const scopedBarIds = (() => {
        if (isSuperAdmin) return null;
        if (uniqueAllowedEstablishmentIds.length > 0) {
          const mapped = toCardapioBarIds(uniqueAllowedEstablishmentIds, barsList);
          if (mapped.length > 0) return mapped;
        }
        if (isPromoter && promoterBarIdNum != null) {
          const fromPromoter = toCardapioBarIds([promoterBarIdNum], barsList);
          return fromPromoter.length > 0 ? fromPromoter : [promoterBarIdNum];
        }
        return null;
      })();

      let categories: MenuCategory[] = [];
      let items: MenuItem[] = [];

      if (scopedBarIds && scopedBarIds.length > 0) {
        const catResults = await Promise.all(
          scopedBarIds.map((id) =>
            fetch(`${API_BASE_URL}/categories?barId=${id}`).then((r) =>
              r.ok ? r.json() : [],
            ),
          ),
        );
        const itemResults = await Promise.all(
          scopedBarIds.map((id) =>
            fetch(`${API_BASE_URL}/items?barId=${id}`).then((r) =>
              r.ok ? r.json() : [],
            ),
          ),
        );
        categories = catResults.flat();
        items = itemResults.flat();
      } else {
        const [categoriesRes, itemsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/categories`),
          fetch(`${API_BASE_URL}/items`),
        ]);
        if (!categoriesRes.ok || !itemsRes.ok) {
          throw new Error('Erro ao carregar dados da API');
        }
        [categories, items] = await Promise.all([
          categoriesRes.json(),
          itemsRes.json(),
        ]);
      }

      console.log('📥 [API] Dados recebidos da API:', {
        totalBars: Array.isArray(bars) ? bars.length : 0,
        totalCategories: Array.isArray(categories) ? categories.length : 0,
        totalItems: Array.isArray(items) ? items.length : 0,
        bars: bars?.slice(0, 3).map((b: any) => ({ id: b.id, name: b.name, idType: typeof b.id })),
        categories: categories?.slice(0, 3).map((c: any) => ({ id: c.id, name: c.name, barId: c.barId, barIdType: typeof c.barId })),
        items: items?.slice(0, 3).map((i: any) => ({ id: i.id, name: i.name, barId: i.barId, barIdType: typeof i.barId }))
      });

      const subCategories = items.reduce((acc: any[], item: any) => {
        if (item.subCategoryName && item.subCategoryName.trim() !== '') {
          const existing = acc.find(
            (sub) =>
              sub.name === item.subCategoryName &&
              sub.categoryId === item.categoryId &&
              sub.barId === item.barId,
          );
          if (!existing) {
            acc.push({
              id: `${item.categoryId}-${item.barId}-${item.subCategoryName}`,
              name: item.subCategoryName,
              categoryId: item.categoryId,
              barId: item.barId,
              order: 0,
            });
          }
        }
        return acc;
      }, []);

      let barsData = Array.isArray(bars)
        ? bars.map((bar) => {
            // Normalizar URLs: nunca manter Cloudinary (conta removida)
            const processImageUrl = (url: string | null | undefined): string => {
              if (!url || typeof url !== 'string') return '';
              
              const trimmed = url.trim();
              if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return '';
              
              if (trimmed.includes('res.cloudinary.com') || trimmed.includes('cloudinary.com')) {
                const filename = trimmed.split('?')[0]?.split('/').pop()?.trim() || '';
                return filename;
              }
              
              // Se é uma URL antiga (grupoideiaum.com.br), extrair apenas o filename
              if (trimmed.includes('grupoideiaum.com.br') || (trimmed.includes('/cardapio-agilizaiapp/') && !trimmed.startsWith('https://res.cloudinary.com'))) {
                const parts = trimmed.split('/');
                const filename = parts[parts.length - 1] || '';
                return filename;
              }
              
              // Se já é apenas um filename (sem http), manter como está
              if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
                return trimmed;
              }
              
              // Para outras URLs (ex: Unsplash), manter como está
              return trimmed;
            };
            
            const cleanedBar = {
              ...bar,
              logoUrl: processImageUrl(bar.logoUrl),
              coverImageUrl: processImageUrl(bar.coverImageUrl),
              coverImages: Array.isArray(bar.coverImages)
                ? bar.coverImages.map((url: string) => processImageUrl(url))
                : typeof bar.coverImages === 'string'
                  ? JSON.parse(bar.coverImages).map((url: string) => processImageUrl(url))
                  : [],
              popupImageUrl: processImageUrl(bar.popupImageUrl),
              menu_display_style:
                bar.menu_display_style === 'clean'
                  ? 'clean'
                  : bar.slug === 'reserva-rooftop' && bar.menu_display_style !== 'normal'
                    ? 'clean'
                    : 'normal',
            };
            return cleanedBar;
          })
        : [];

      // Filtrar bares para promoters (não para admins com escopo por estabelecimento no banco),
      // exceto e-mails explicitamente liberados para cardápio global.
      if (promoterBar && isPromoter && !hasFullCardapioAccessByEmail) {
        const promoterBarIdNum = Number(promoterBar.barId);
        const promoterBarName = String(promoterBar.barName || '').toLowerCase();

        const normalizeName = (value: string) =>
          (value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
        const normalizeCompact = (value: string) =>
          normalizeName(value).replace(/\s+/g, '');

        const targetNameNorm = normalizeName(promoterBarName);
        const targetNameCompact = normalizeCompact(promoterBarName);

        let filteredBars = barsData.filter((bar) => {
          const barIdNum = Number(bar.id);
          const barName = (bar.name || '').toLowerCase();
          const barNameNorm = normalizeName(barName);
          const barNameCompact = normalizeCompact(barName);
          const matchById = barIdNum === promoterBarIdNum || String(bar.id) === String(promoterBar.barId);
          const matchByName =
            (promoterBarName && barName.includes(promoterBarName)) ||
            (targetNameNorm &&
              barNameNorm &&
              (barNameNorm.includes(targetNameNorm) || targetNameNorm.includes(barNameNorm))) ||
            (targetNameCompact &&
              barNameCompact &&
              (barNameCompact.includes(targetNameCompact) ||
                targetNameCompact.includes(barNameCompact)));
          return matchById || matchByName;
        });

        // Fallback: se não encontrou nenhum bar correspondente, tenta heurística por palavra-chave.
        // Ex.: "highline" vs "high line" (diferença de espaços) ou nomes com variações.
        if (filteredBars.length === 0) {
          const wantsHighline =
            targetNameCompact.includes('highline') || targetNameNorm.includes('high line') || targetNameNorm.includes('high');
          if (wantsHighline) {
            const hi = barsData.filter((bar) => normalizeCompact(String(bar.name || '')).includes('high'));
            if (hi.length > 0) filteredBars = hi;
          }
        }

        // Se ainda assim não achou, não aplica filtro (evita tela vazia).
        barsData = filteredBars.length > 0 ? filteredBars : barsData;
      }

      barsData = filterEstablishmentListForUser(
        userEmail,
        barsData.map((b) => ({ ...b, name: String((b as { name?: string }).name || '') })),
      ) as typeof barsData;

      // Só estabelecimentos com o módulo "cardapio" habilitado aparecem na gestão de cardápio
      barsData = barsData.filter((bar) =>
        establishmentAllowsModule(
          { enabled_modules: modulesByBarId.get(Number(bar.id)) },
          'cardapio',
        ),
      );

      if (scopedBarIds && scopedBarIds.length > 0) {
        const allowedBarIdSet = new Set(scopedBarIds.map((id) => Number(id)));
        barsData = barsData.filter((bar) => allowedBarIdSet.has(Number(bar.id)));
      }

      let categoriesData = Array.isArray(categories) ? categories : [];
      let subCategoriesData = Array.isArray(subCategories) ? subCategories : [];
      let itemsData = Array.isArray(items)
        ? items.map((item) => {
            const cleanedItem = {
              ...item,
              // A API pode retornar URL completa (Firebase/Cloudinary/etc) ou valores legados.
              // Mantemos como veio; a exibição resolve via getValidImageUrl().
              imageUrl: item.imageUrl,
            };
            return cleanedItem;
          })
        : [];

      const visibleBarIds = new Set(barsData.map((b) => Number(b.id)));
      categoriesData = categoriesData.filter((c) =>
        visibleBarIds.has(Number(c.barId)),
      );
      subCategoriesData = subCategoriesData.filter((sub: { barId: string | number }) =>
        visibleBarIds.has(Number(sub.barId)),
      );
      itemsData = itemsData.filter((item) =>
        visibleBarIds.has(Number(item.barId)),
      );

      // Filtrar categorias e itens pelos ids dos bares permitidos (barsData já filtrado acima)
      if (promoterBar && !hasFullCardapioAccessByEmail && barsData.length > 0) {
        const allowedBarIds = new Set(barsData.map((b) => Number(b.id)));
        categoriesData = categoriesData.filter((category) => {
          const catBarId = Number(category.barId);
          return allowedBarIds.has(catBarId);
        });
        subCategoriesData = subCategoriesData.filter((sub: any) => {
          const subBarId = Number(sub.barId);
          return allowedBarIds.has(subBarId);
        });
        itemsData = itemsData.filter((item) => {
          const itemBarId = Number(item.barId);
          return allowedBarIds.has(itemBarId);
        });
      } else if (promoterBar && !hasFullCardapioAccessByEmail) {
        const promoterBarIdNum = Number(promoterBar.barId);
        categoriesData = categoriesData.filter(
          (category) =>
            Number(category.barId) === promoterBarIdNum ||
            String(category.barId) === String(promoterBar.barId),
        );
        subCategoriesData = subCategoriesData.filter(
          (sub: any) =>
            Number(sub.barId) === promoterBarIdNum ||
            String(sub.barId) === String(promoterBar.barId),
        );
        itemsData = itemsData.filter(
          (item) =>
            Number(item.barId) === promoterBarIdNum ||
            String(item.barId) === String(promoterBar.barId),
        );
      }

      console.log('💾 [FINAL] Dados que serão salvos no estado:', {
        bars: barsData.length,
        categories: categoriesData.length,
        subCategories: subCategoriesData.length,
        items: itemsData.length,
        barsNames: barsData.map(b => b.name),
        categoriesNames: categoriesData.map(c => c.name),
        firstBar: barsData[0] ? { id: barsData[0].id, name: barsData[0].name } : null,
        firstCategory: categoriesData[0] ? { id: categoriesData[0].id, name: categoriesData[0].name, barId: categoriesData[0].barId } : null,
        firstItem: itemsData[0] ? { id: itemsData[0].id, name: itemsData[0].name, barId: itemsData[0].barId } : null
      });
      
      setMenuData({
        bars: barsData,
        categories: categoriesData,
        subCategories: subCategoriesData,
        items: itemsData,
      });
      setSelectedItems([]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Falha ao carregar os dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, [
    isAdmin,
    isSuperAdmin,
    isPromoter,
    promoterBarIdNum,
    hasFullCardapioAccessByEmail,
    userEmail,
    uniqueAllowedEstablishmentIds.join(','),
    menuData.bars.length,
  ]);

  useEffect(() => {
    fetchCardapioMappings().catch(() => undefined);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Índice de imagens: adiar em máquinas lentas (evita competir com o carregamento principal).
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/gallery/images?limit=80`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const images = Array.isArray(data?.images) ? data.images : [];
        for (const img of images) {
          const url =
            (typeof img?.url === 'string' && img.url.trim()) ||
            (typeof img?.thumbUrl === 'string' && img.thumbUrl.trim()) ||
            (typeof img?.mediumUrl === 'string' && img.mediumUrl.trim()) ||
            '';
          if (img?.filename && url) {
            indexImageUrl(img.filename, url);
          }
        }
        if (!cancelled) setImageIndexVersion((v) => v + 1);
      } catch {
        // silencioso
      }
    };
    const timerId = window.setTimeout(() => void run(), 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, []);

  const formatPrice = useCallback((price: number, isPriceOnRequest?: boolean) => {
    const normalizedPrice = Number(price);
    if (isPriceOnRequest || normalizedPrice === -1 || price === null || price === undefined) {
      return 'Sob Consulta';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(normalizedPrice);
  }, []);

  const handleAddTopping = useCallback(() => {
    if (!newTopping.name || !newTopping.price) return;

    const priceNumber = parseFloat(newTopping.price);
    if (Number.isNaN(priceNumber)) return;

    setItemForm((prev: MenuItemForm) => {
      // Editando um adicional existente
      if (editingToppingId) {
        return {
          ...prev,
          toppings: prev.toppings.map((t) =>
            String(t.id) === editingToppingId
              ? { ...t, name: newTopping.name, price: priceNumber }
              : t,
          ),
        };
      }

      // Adicionando um novo adicional
      const topping: Topping = {
        id: Date.now().toString(),
        name: newTopping.name,
        price: priceNumber,
      };
      return {
        ...prev,
        toppings: [...prev.toppings, topping],
      };
    });

    setNewTopping({ name: '', price: '' });
    setEditingToppingId(null);
  }, [newTopping, editingToppingId]);

  const handleEditTopping = useCallback((topping: Topping) => {
    setNewTopping({
      name: topping.name,
      price: topping.price != null ? String(topping.price) : '',
    });
    setEditingToppingId(String(topping.id));
  }, []);

  const handleRemoveTopping = useCallback((toppingId: string | number) => {
    setItemForm((prev: MenuItemForm) => ({
      ...prev,
      toppings: prev.toppings.filter((t) => String(t.id) !== String(toppingId)),
    }));
    if (editingToppingId && String(toppingId) === editingToppingId) {
      setEditingToppingId(null);
      setNewTopping({ name: '', price: '' });
    }
  }, [editingToppingId]);

  // Funções para gerenciar selos customizados
  const handleAddCustomSeal = useCallback((type: 'food' | 'drink') => {
    const newSeal: Seal = {
      id: `custom-${Date.now()}`,
      name: 'Novo Selo',
      color: '#3b82f6',
      type,
    };
    setBarForm((prev) => ({
      ...prev,
      custom_seals: [...(prev.custom_seals || []), newSeal],
    }));
  }, []);

  const handleUpdateCustomSeal = useCallback((sealId: string, field: 'name' | 'color', value: string) => {
    setBarForm((prev) => ({
      ...prev,
      custom_seals: (prev.custom_seals || []).map((seal) =>
        seal.id === sealId ? { ...seal, [field]: value } : seal
      ),
    }));
  }, []);

  const handleRemoveCustomSeal = useCallback((sealId: string) => {
    if (!confirm('Tem certeza que deseja remover este selo customizado?')) {
      return;
    }
    setBarForm((prev) => ({
      ...prev,
      custom_seals: (prev.custom_seals || []).filter((seal) => seal.id !== sealId),
    }));
  }, []);

  const handleUpdateDefaultSealColor = useCallback((sealId: string, newColor: string) => {
    // Verifica se já existe um selo customizado com esse ID
    const existingCustom = (barForm.custom_seals || []).find((s) => s.id === sealId);
    
    if (existingCustom) {
      // Atualiza o existente
      handleUpdateCustomSeal(sealId, 'color', newColor);
    } else {
      // Cria um novo selo customizado baseado no padrão
      const defaultSeal = ALL_SEALS.find((s) => s.id === sealId);
      if (defaultSeal) {
        const customSeal: Seal = {
          ...defaultSeal,
          color: newColor,
        };
        setBarForm((prev) => ({
          ...prev,
          custom_seals: [...(prev.custom_seals || []), customSeal],
        }));
      }
    }
  }, [barForm.custom_seals, handleUpdateCustomSeal]);

  const handleToggleSeal = useCallback((sealId: string) => {
    setItemForm((prev: MenuItemForm) => ({
      ...prev,
      seals: prev.seals.includes(sealId)
        ? prev.seals.filter((id) => id !== sealId)
        : [...prev.seals, sealId],
    }));
  }, []);

  const getSealById = useCallback((sealId: string) => {
    // Primeiro tenta buscar nos selos padrão
    const defaultSeal = ALL_SEALS.find((seal) => seal.id === sealId);
    if (defaultSeal) return defaultSeal;
    
    // Se não encontrou, busca nos selos customizados do bar atual
    if (editingBar && editingBar.custom_seals) {
      const customSeal = editingBar.custom_seals.find((seal) => seal.id === sealId);
      if (customSeal) return customSeal;
    }
    
    // Se não encontrou, tenta buscar nos selos customizados do bar do item (se estiver editando item)
    if (itemForm.barId) {
      const currentBar = menuData.bars.find((bar) => bar.id.toString() === itemForm.barId.toString());
      if (currentBar && currentBar.custom_seals) {
        const customSeal = currentBar.custom_seals.find((seal) => seal.id === sealId);
        if (customSeal) return customSeal;
      }
    }
    
    return null;
  }, [editingBar, itemForm.barId, menuData.bars]);

  // Componente para renderizar selos de um item
  const renderItemSeals = useCallback((seals: string[]) => {
    if (!seals || seals.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {seals.map((sealId) => {
          // Renderização especial para vinhos
          if (sealId.startsWith('vinho:pais:')) {
            const country = WINE_COUNTRIES.find(c => c.id === sealId);
            if (!country) return null;
            return (
              <span key={sealId} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border" style={{ borderColor: '#8883' }}>
                <span>{country.emoji}</span>
                <span>País: {country.label}</span>
              </span>
            );
          }
          if (sealId.startsWith('vinho:tipo:')) {
            const type = WINE_TYPES.find(t => t.id === sealId);
            if (!type) return null;
            return (
              <span key={sealId} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border" style={{ backgroundColor: `${type.color}44`, borderColor: `${type.color}77`, color: '#333' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: type.color }} />
                <span>Tipo: {type.label}</span>
              </span>
            );
          }
          if (sealId.startsWith('vinho:safra:')) {
            const safra = sealId.split(':')[2] || '';
            return (
              <span key={sealId} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border border-gray-300 text-gray-700">
                <span>🍇</span>
                <span>Safra: {safra}</span>
              </span>
            );
          }
          if (sealId.startsWith('vinho:local:')) {
            const local = decodeURIComponent(sealId.split(':')[2] || '');
            return (
              <span key={sealId} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border border-gray-300 text-gray-700">
                <span>📍</span>
                <span>Local: {local}</span>
              </span>
            );
          }

          const seal = getSealById(sealId);
          if (!seal) return null;
          return (
            <span
              key={sealId}
              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white shadow-sm"
              style={{ backgroundColor: seal.color }}
            >
              {seal.name}
            </span>
          );
        })}
      </div>
    );
  }, [getSealById]);

  const handleCloseBarModal = useCallback(() => {
    setShowBarModal(false);
    setEditingBar(null);
    setBarForm({
      name: '',
      slug: '',
      description: '',
      logoUrl: '',
      coverImageUrl: '',
      coverImages: [],
      address: '',
      rating: '',
      reviewsCount: '',
      amenities: [],
      latitude: '',
      longitude: '',
      popupImageUrl: '',
      facebook: '',
      instagram: '',
      whatsapp: '',
      menu_display_style: 'normal',
      partner_logos: [],
    });
  }, []);

  const handleCloseCategoryModal = useCallback(() => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', barId: '', order: 0, subCategories: [] });
  }, []);

  const handleCloseItemModal = useCallback(() => {
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      categoryId: '',
      barId: '',
      subCategory: '',
      toppings: [],
      order: 0,
      seals: [],
    });
    setNewTopping({ name: '', price: '' });
    setAvailableSubCategories([]);
  }, []);

  const updateCategorySubCategory = (
    index: number,
    field: 'name' | 'order',
    value: string | number,
  ) => {
    setCategoryForm((prev) => {
      const next = [...prev.subCategories];
      next[index] = {
        ...next[index],
        [field]: field === 'order' ? Number(value) : value,
      };
      return { ...prev, subCategories: next };
    });
  };

  const reorderCategorySubCategories = (fromIndex: number, toIndex: number) => {
    setCategoryForm((prev) => {
      const next = [...prev.subCategories];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return {
        ...prev,
        subCategories: next.map((sub, index) => ({ ...sub, order: index })),
      };
    });
  };

  const addCategorySubCategory = () => {
    setCategoryForm((prev) => ({
      ...prev,
      subCategories: [
        ...prev.subCategories,
        {
          id: undefined,
          name: '',
          order: prev.subCategories.length,
          originalName: '',
          originalOrder: prev.subCategories.length,
          count: 0,
        },
      ],
    }));
  };

  const removeCategorySubCategory = async (index: number) => {
    const subCategory = categoryForm.subCategories[index];
    if (!subCategory) return;

    if (!isPersistedSubcategoryId(subCategory.id)) {
      setCategoryForm((prev) => ({
        ...prev,
        subCategories: prev.subCategories
          .filter((_, i) => i !== index)
          .map((sub, i) => ({ ...sub, order: i })),
      }));
      return;
    }

    if (
      !confirm(
        `Tem certeza que deseja excluir a subcategoria '${subCategory.name}'?\n\n⚠️ Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subcategories/${subCategory.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCategoryForm((prev) => ({
          ...prev,
          subCategories: prev.subCategories
            .filter((_, i) => i !== index)
            .map((sub, i) => ({ ...sub, order: i })),
        }));
        alert('Subcategoria excluída com sucesso!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Erro ao excluir subcategoria: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao excluir subcategoria:', error);
      alert('Erro ao excluir subcategoria. Tente novamente.');
    }
  };

  const getCategorySubcategoryChangesSummary = () => {
    let added = 0;
    let modified = 0;
    categoryForm.subCategories.forEach((sub) => {
      if (!sub.originalName && sub.name.trim() !== '') {
        added += 1;
      } else if (
        sub.name.trim() !== sub.originalName ||
        sub.order !== sub.originalOrder
      ) {
        modified += 1;
      }
    });
    return { added, modified };
  };

  const handleSaveBar = useCallback(async () => {
    try {
      if (!barForm.name.trim()) {
        alert('Nome do estabelecimento é obrigatório');
        return;
      }

      if (!barForm.slug.trim()) {
        alert('Slug do estabelecimento é obrigatório');
        return;
      }

      const url = editingBar
        ? `${API_BASE_URL}/bars/${editingBar.id}`
        : `${API_BASE_URL}/bars`;

      const method = editingBar ? 'PUT' : 'POST';

      // Processar URLs das imagens antes de salvar
      // Se for URL completa do Cloudinary, manter; se for filename, manter também (API vai processar)
      const processUrlForSave = (url: string): string => {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim();
        // Nunca salvar placeholder no banco
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === PLACEHOLDER_IMAGE_URL) {
          return '';
        }
        if (trimmed.includes('res.cloudinary.com') || trimmed.includes('cloudinary.com')) {
          return trimmed.split('?')[0]?.split('/').pop()?.trim() || '';
        }
        return trimmed;
      };

      const normalizedCoverImages = Array.isArray(barForm.coverImages)
        ? barForm.coverImages
            .map((u) => processUrlForSave(u))
            .filter((u) => !!u)
        : [];

      // Como a UI usa "Imagens de Capa (Carrossel)" e não expõe um campo separado para coverImageUrl,
      // garantimos um coverImageUrl principal usando a primeira imagem do carrossel quando necessário.
      const normalizedCoverImageUrl =
        processUrlForSave(barForm.coverImageUrl) || normalizedCoverImages[0] || '';

      const normalizedPartnerLogos = Array.isArray(barForm.partner_logos)
        ? barForm.partner_logos
            .map((u) => processUrlForSave(u))
            .filter((u) => !!u)
            .slice(0, 5)
        : [];

      const barData = {
        ...barForm,
        logoUrl: processUrlForSave(barForm.logoUrl),
        coverImageUrl: normalizedCoverImageUrl,
        coverImages: normalizedCoverImages,
        popupImageUrl: processUrlForSave(barForm.popupImageUrl),
        partner_logos: normalizedPartnerLogos,
        rating: barForm.rating ? parseFloat(barForm.rating) : 0,
        reviewsCount: barForm.reviewsCount ? parseInt(barForm.reviewsCount) : 0,
        latitude: barForm.latitude ? parseFloat(barForm.latitude) : null,
        longitude: barForm.longitude ? parseFloat(barForm.longitude) : null,
        facebook: barForm.facebook || '',
        instagram: barForm.instagram || '',
        whatsapp: barForm.whatsapp || '',
      };

      console.log('🔄 Salvando estabelecimento:', method, url);
      console.log('📸 URLs das imagens sendo salvas:', {
        logoUrl: barData.logoUrl,
        coverImageUrl: barData.coverImageUrl,
        coverImages: barData.coverImages,
        popupImageUrl: barData.popupImageUrl
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barData),
      });

      console.log('📡 Resposta do servidor:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Estabelecimento salvo com sucesso');
        await fetchData(); // Atualiza os dados após o salvamento
        handleCloseBarModal();
        alert(editingBar ? 'Estabelecimento atualizado com sucesso!' : 'Estabelecimento criado com sucesso!');
      } else {
        const errorText = await response.text();
        console.error('❌ Erro do servidor:', errorText);

        let errorData: { error?: string; message?: string } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }

        const errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('❌ Erro ao salvar estabelecimento:', err);

      let errorMessage = 'Erro desconhecido';
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = err.message;
        }
      }

      alert(`Erro ao salvar estabelecimento: ${errorMessage}`);
    }
  }, [editingBar, barForm, fetchData, handleCloseBarModal]);

  const handleSaveCategory = useCallback(async () => {
    try {
      if (!categoryForm.name.trim()) {
        alert('Nome da categoria é obrigatório');
        return;
      }

      if (!categoryForm.barId) {
        alert('Estabelecimento é obrigatório');
        return;
      }

      const url = editingCategory
        ? `${API_BASE_URL}/categories/${editingCategory.id}`
        : `${API_BASE_URL}/categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      const categoryData = {
        name: categoryForm.name,
        barId: categoryForm.barId,
        order: parseInt(categoryForm.order.toString()) || 0,
      };

      console.log('🔄 Salvando categoria:', method, url, categoryData);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      console.log('📡 Resposta do servidor:', response.status, response.statusText);

      if (response.ok) {
        const savedCategory = await response.json();
        const categoryId = editingCategory ? editingCategory.id : savedCategory.id;

        console.log('🔄 Salvando subcategorias:', categoryForm.subCategories);
        const subResult = await persistEditableSubcategories({
          categoryId,
          barId: categoryForm.barId,
          subCategories: categoryForm.subCategories,
          items: menuData.items,
        });

        console.log('✅ Categoria e sub-categorias salvas com sucesso', subResult);
        await fetchData();
        handleCloseCategoryModal();

        let message = editingCategory
          ? 'Categoria atualizada com sucesso!'
          : 'Categoria criada com sucesso!';
        if (subResult.renamed > 0) {
          message += `\n${subResult.renamed} subcategoria(s) renomeada(s).`;
        }
        if (subResult.created > 0) {
          message += `\n${subResult.created} subcategoria(s) criada(s).`;
        }
        if (subResult.reordered) {
          message += '\nOrdem das subcategorias atualizada.';
        }
        alert(message);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro do servidor:', errorText);

        let errorData: { error?: string; message?: string } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }

        const errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('❌ Erro ao salvar categoria:', err);

      let errorMessage = 'Erro desconhecido';
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = err.message;
        }
      }

      alert(`Erro ao salvar categoria: ${errorMessage}`);
    }
  }, [editingCategory, categoryForm, fetchData, handleCloseCategoryModal, menuData.items]);

  const handleSaveItem = useCallback(async () => {
    try {
      if (!itemForm.name.trim()) {
        alert('Nome do item é obrigatório');
        return;
      }

      // Se "Sob Consulta" estiver marcado, não validar o preço
      if (!itemForm.isPriceOnRequest && (!itemForm.price || parseFloat(itemForm.price) <= 0)) {
        alert('Preço deve ser maior que zero ou marque "Sob Consulta"');
        return;
      }

      if (!itemForm.categoryId) {
        alert('Categoria é obrigatória');
        return;
      }

      if (!itemForm.barId) {
        alert('Estabelecimento é obrigatório');
        return;
      }

      const url = editingItem
        ? `${API_BASE_URL}/items/${editingItem.id}`
        : `${API_BASE_URL}/items`;

      const method = editingItem ? 'PUT' : 'POST';

      // Se "Sob Consulta" estiver marcado, salvar preço como -1
      const finalPrice = itemForm.isPriceOnRequest ? -1 : parseFloat(itemForm.price);

      const itemData = {
        ...itemForm,
        price: finalPrice,
        order: parseInt(itemForm.order.toString()) || 0,
      };

      console.log('🔄 Salvando item:', method, url, itemData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      console.log('📡 Resposta do servidor:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Item salvo com sucesso');
        await fetchData();
        handleCloseItemModal();
        alert(editingItem ? 'Item atualizado com sucesso!' : 'Item criado com sucesso!');
      } else {
        const errorText = await response.text();
        console.error('❌ Erro do servidor:', errorText);

        let errorData: { error?: string; message?: string } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }

        const errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('❌ Erro ao salvar item:', err);

      let errorMessage = 'Erro desconhecido';
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = err.message;
        }
      }

      alert(`Erro ao salvar item: ${errorMessage}`);
    }
  }, [editingItem, itemForm, fetchData, handleCloseItemModal]);

  const handleEditBar = useCallback((bar: Bar) => {
    setEditingBar(bar);
    
    // IMPORTANTE:
    // - Não converta para placeholder aqui. O estado do form deve guardar o valor "real" (URL/filename).
    // - O preview usa getValidImageUrl() para resolver (Firebase URL via índice ou placeholder).
    const processUrlForForm = (url: string | null | undefined): string => {
      if (!url || typeof url !== 'string') return '';
      const trimmed = url.trim();
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return '';
      // Nunca persistir placeholder como valor real
      if (trimmed === PLACEHOLDER_IMAGE_URL) return '';
      return trimmed; // URL absoluta (Firebase etc) ou filename/objectPath legado
    };
    
    setBarForm({
      name: bar.name,
      slug: bar.slug,
      description: bar.description,
      logoUrl: processUrlForForm(bar.logoUrl),
      coverImageUrl: processUrlForForm(bar.coverImageUrl),
      coverImages: Array.isArray(bar.coverImages) 
        ? bar.coverImages.map(url => processUrlForForm(url))
        : [],
      address: bar.address,
      rating: bar.rating?.toString() || '',
      reviewsCount: bar.reviewsCount?.toString() || '',
      amenities: bar.amenities || [],
      latitude: bar.latitude?.toString() || '',
      longitude: bar.longitude?.toString() || '',
      popupImageUrl: processUrlForForm(bar.popupImageUrl),
      // **CORREÇÃO**: Garante que os campos não sejam undefined
      facebook: bar.facebook || '', 
      instagram: bar.instagram || '',
      whatsapp: bar.whatsapp || '',
      // 🎨 Cores personalizadas
      menu_category_bg_color: bar.menu_category_bg_color || '',
      menu_category_text_color: bar.menu_category_text_color || '',
      menu_subcategory_bg_color: bar.menu_subcategory_bg_color || '',
      menu_subcategory_text_color: bar.menu_subcategory_text_color || '',
      mobile_sidebar_bg_color: bar.mobile_sidebar_bg_color || '',
      mobile_sidebar_text_color: bar.mobile_sidebar_text_color || '',
      custom_seals: bar.custom_seals || [],
      menu_display_style:
        bar.menu_display_style === 'clean'
          ? 'clean'
          : bar.slug === 'reserva-rooftop' && bar.menu_display_style !== 'normal'
            ? 'clean'
            : 'normal',
      partner_logos: Array.isArray(bar.partner_logos)
        ? bar.partner_logos.map((u) => processUrlForForm(u)).filter(Boolean).slice(0, 5)
        : [],
    });
    setShowBarModal(true);
  }, []);

  const handleEditCategory = useCallback(
    async (category: MenuCategory) => {
      setEditingCategory(category);

      let apiSubCategories: any[] = [];
      try {
        apiSubCategories = await fetchCategorySubcategoriesFromApi(category.id, category.barId);
      } catch (error) {
        console.error('❌ Erro ao carregar subcategorias:', error);
      }

      const categorySubCategories = buildEditableSubcategories(
        apiSubCategories,
        menuData.items,
        category.id,
        category.barId,
      );

      setCategoryForm({
        name: category.name,
        barId: category.barId?.toString() || '',
        order: category.order,
        subCategories: categorySubCategories,
      });
      setShowCategoryModal(true);
    },
    [menuData.items],
  );

  const handleEditItem = useCallback(async (item: MenuItem) => {
    setEditingItem(item);
    // Verificar se o preço é -1 (Sob Consulta)
    const isPriceOnRequest = Number(item.price) === -1 || item.isPriceOnRequest === true;
    setItemForm({
      name: item.name,
      description: item.description,
      price: isPriceOnRequest ? '' : item.price.toString(),
      imageUrl: item.imageUrl,
      categoryId: item.categoryId?.toString() || '',
      barId: item.barId?.toString() || '',
      subCategory: item.subCategory || item.subCategoryName || '',
      toppings: item.toppings || [],
      order: item.order,
      seals: item.seals || [],
      isPriceOnRequest: isPriceOnRequest,
    });
    
    // Carregar subcategorias da categoria selecionada
    if (item.categoryId) {
      try {
        const response = await fetch(`${API_BASE_URL}/subcategories/category/${item.categoryId}`);
        if (response.ok) {
          const subCategories = await response.json();
          setAvailableSubCategories(
            subCategories.map((sub: any) => ({
              name: sub.name,
              order: sub.order || 0,
            })).sort((a: any, b: any) => a.order - b.order)
          );
        } else {
          setAvailableSubCategories([]);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar subcategorias:', error);
        setAvailableSubCategories([]);
      }
    } else {
      setAvailableSubCategories([]);
    }
    
    setShowItemModal(true);
  }, []);

  // Função para abrir modal de categoria para promoters
  const handleAddCategoryForPromoter = useCallback(() => {
    if (promoterBar) {
      const effectiveBarId = menuData.bars[0]?.id ?? promoterBar.barId;
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        barId: String(effectiveBarId),
        order: 0,
        subCategories: [],
      });
      setShowCategoryModal(true);
    }
  }, [promoterBar, menuData.bars]);

  // Função para abrir modal de item para promoters
  const handleAddItemForPromoter = useCallback(() => {
    if (promoterBar) {
      const effectiveBarId = menuData.bars[0]?.id ?? promoterBar.barId;
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        categoryId: '',
        barId: String(effectiveBarId),
        subCategory: '',
        toppings: [],
        order: 0,
        seals: [],
      });
      setShowItemModal(true);
    }
  }, [promoterBar, menuData.bars]);

  const handleDeleteBar = useCallback(
    async (barId: string | number) => {
      if (confirm('Tem certeza que deseja excluir este estabelecimento?')) {
        try {
          const response = await fetch(`${API_BASE_URL}/bars/${barId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchData();
          } else {
            throw new Error('Falha ao deletar estabelecimento.');
          }
        } catch (err) {
          console.error(err);
          alert('Erro ao deletar estabelecimento.');
        }
      }
    },
    [fetchData],
  );

  const handleDeleteCategory = useCallback(
    async (categoryId: string | number) => {
      if (confirm('Tem certeza que deseja excluir esta categoria?')) {
        try {
          const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchData();
          } else {
            throw new Error('Falha ao deletar categoria.');
          }
        } catch (err) {
          console.error(err);
          alert('Erro ao deletar categoria.');
        }
      }
    },
    [fetchData],
  );

  const handleDeleteItem = useCallback(
    async (itemId: string | number) => {
      if (confirm('Tem certeza que deseja excluir este item? Ele será movido para a lixeira e poderá ser restaurado dentro de 30 dias.')) {
        try {
          const response = await fetch(`${API_BASE_URL}/items/${itemId}`, { method: 'DELETE' });
          if (response.ok) {
            const result = await response.json();
            fetchData();
            alert(result.message || 'Item movido para a lixeira com sucesso!');
          } else {
            throw new Error('Falha ao deletar item.');
          }
        } catch (err) {
          console.error(err);
          alert('Erro ao deletar item.');
        }
      }
    },
    [fetchData],
  );

  // Função para buscar itens da lixeira
  const fetchTrashItems = useCallback(async () => {
    setTrashLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/items/trash`);
      if (response.ok) {
        const data = await response.json();
        setTrashItems(data.items || []);
      } else {
        console.error('Erro ao buscar itens da lixeira');
        setTrashItems([]);
      }
    } catch (error) {
      console.error('Erro ao buscar itens da lixeira:', error);
      setTrashItems([]);
    } finally {
      setTrashLoading(false);
    }
  }, []);

  // Função para abrir modal de lixeira
  const openTrashModal = useCallback(() => {
    setShowTrashModal(true);
    fetchTrashItems();
  }, [fetchTrashItems]);

  // Função para restaurar item da lixeira
  const handleRestoreItem = useCallback(
    async (itemId: string | number) => {
      try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}/restore`, {
          method: 'PATCH',
        });
        
        if (response.ok) {
          const result = await response.json();
          alert(result.message || 'Item restaurado com sucesso!');
          fetchTrashItems(); // Atualizar lista da lixeira
          fetchData(); // Atualizar lista principal
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Falha ao restaurar item.');
        }
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao restaurar item.';
        alert(errorMessage);
      }
    },
    [fetchTrashItems, fetchData],
  );

  // Função para pausar/ativar item (alterna visibilidade)
  const handleToggleItemVisibility = useCallback(
    async (itemId: string | number, currentVisible: boolean | number | undefined) => {
      try {
        // Alternar visibilidade: se está visível (1/true), pausar (0), senão ativar (1)
        const newVisible = currentVisible === 1 || currentVisible === true ? false : true;
        
        const response = await fetch(`${API_BASE_URL}/items/${itemId}/visibility`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visible: newVisible }),
        });

        if (response.ok) {
          // Atualizar o item localmente sem recarregar tudo
          setMenuData((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId
                ? { ...item, visible: newVisible ? 1 : 0 }
                : item
            ),
          }));
        } else {
          throw new Error('Falha ao alterar visibilidade do item.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao pausar/ativar item.');
      }
    },
    [],
  );

  // Função para buscar imagens da galeria
  const fetchGalleryImages = useCallback(async () => {
    setGalleryLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/gallery/images?limit=2000`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Galeria atualizada:', { total: data.total, images: data.images?.length });
        
        // Processar imagens: manter URLs como vierem da API (Firebase/Cloudinary/FTP/etc)
        // e atualizar o índice local para resolver filenames -> URL pública (melhora preview e evita 404).
        const processedImages = (data.images || []).map((img: any) => {
          const rawUrl = (typeof img.url === 'string' && img.url.trim()) ? img.url.trim() : null;
          const isCloudinary = !!rawUrl && (rawUrl.includes('res.cloudinary.com') || rawUrl.includes('cloudinary.com'));
          const isAbsolute = !!rawUrl && /^https?:\/\//i.test(rawUrl);

          // Só manter URL se for absoluta e NÃO for Cloudinary
          const safeUrl = rawUrl && isAbsolute && !isCloudinary ? rawUrl : null;

          // Indexar somente URLs seguras
          if (img?.filename && safeUrl) indexImageUrl(img.filename, safeUrl);

          return { ...img, url: safeUrl };
        });
        
        // Log das primeiras imagens processadas para debug
        if (processedImages.length > 0) {
          console.log('📊 Primeiras 5 imagens processadas:', processedImages.slice(0, 5).map((img: any) => ({
            filename: img.filename,
            url: img.url,
            hasUrl: !!img.url,
            isFirebase: typeof img.url === 'string' && img.url.includes('firebasestorage.googleapis.com')
          })));
        }
        
        setGalleryImages(processedImages);
      } else {
        console.error('Erro ao buscar imagens da galeria');
        setGalleryImages([]);
      }
    } catch (error) {
      console.error('Erro ao buscar imagens da galeria:', error);
      setGalleryImages([]);
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  // Função para fazer upload da imagem após o crop
  const uploadCroppedImage = useCallback(
    async (croppedBlob: Blob, field: string) => {
      try {
        console.log('🔄 Iniciando upload da imagem recortada', { field, blobSize: croppedBlob.size });

        const mimeType = croppedBlob.type || 'image/png';
        const fileExt = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/jpeg' ? 'jpg' : 'png';
        const file = new File([croppedBlob], `cropped-image.${fileExt}`, {
          type: mimeType,
        });

        const folder =
          field === 'imageUrl' ? 'cardapio/items' : 'cardapio/bars';

        const imageValue = await uploadImageToFirebase(file, folder);
        console.log('✅ Upload concluído (Firebase Storage):', { imageValue, field, folder });
          
          // Se o upload foi feito através da galeria, atualizar a galeria primeiro
          // Verificar se o campo corresponde ao campo da galeria (mesmo que o modal esteja fechado temporariamente)
          // Também verificar se o campo é 'imageUrl' e a galeria estava aberta (para itens do menu)
          const isGalleryUpload = (imageGalleryField === field && imageGalleryField !== '') || 
                                  (field === 'imageUrl' && imageGalleryField === 'imageUrl');
          
          console.log('🔍 Verificando se é upload da galeria:', {
            isGalleryUpload,
            imageGalleryField,
            field,
            imageValue
          });
          
          if (isGalleryUpload) {
            console.log('📸 Upload via galeria detectado (agora Firebase Storage)', { field, imageGalleryField, imageValue });
            
            // Atualizar o formulário diretamente com a URL completa ou filename
            // Usar o field que foi passado (que deve ser o mesmo do imageGalleryField)
            const targetField = field;
            
            if (targetField === 'coverImages') {
              setBarForm((prev) => {
                const nextCoverImages = [...prev.coverImages, imageValue];
                const nextCoverImageUrl =
                  prev.coverImageUrl && prev.coverImageUrl !== PLACEHOLDER_IMAGE_URL
                    ? prev.coverImageUrl
                    : imageValue;
                return {
                  ...prev,
                  coverImages: nextCoverImages,
                  coverImageUrl: nextCoverImageUrl,
                };
              });
            } else if (targetField === 'partner_logos') {
              setBarForm((prev) => {
                const current = prev.partner_logos || [];
                if (current.length >= 5) return prev;
                return { ...prev, partner_logos: [...current, imageValue] };
              });
            } else if (targetField === 'logoUrl' || targetField === 'coverImageUrl' || targetField === 'popupImageUrl') {
              setBarForm((prev) => ({ ...prev, [targetField]: imageValue }));
            } else if (targetField === 'imageUrl') {
              // Para itens do menu (imageUrl) - usar a URL completa do Cloudinary se disponível
              console.log('🖼️ Atualizando itemForm.imageUrl com:', imageValue);
              setItemForm((prev) => {
                const updated = { ...prev, imageUrl: imageValue };
                console.log('✅ itemForm atualizado:', updated);
                return updated;
              });
            }
            
            // Fechar o modal da galeria após selecionar
            setShowImageGalleryModal(false);
            setImageGalleryField('');
            setGallerySearchTerm('');
            
            console.log('✅ Imagem adicionada à galeria e selecionada automaticamente!');
          } else {
            // Atualizar os formulários normalmente
            if (field === 'coverImages') {
              setBarForm((prev) => {
                const nextCoverImages = [...prev.coverImages, imageValue];
                const nextCoverImageUrl =
                  prev.coverImageUrl && prev.coverImageUrl !== PLACEHOLDER_IMAGE_URL
                    ? prev.coverImageUrl
                    : imageValue;
                return {
                  ...prev,
                  coverImages: nextCoverImages,
                  coverImageUrl: nextCoverImageUrl,
                };
              });
            } else if (field === 'partner_logos') {
              setBarForm((prev) => {
                const current = prev.partner_logos || [];
                if (current.length >= 5) return prev;
                return { ...prev, partner_logos: [...current, imageValue] };
              });
            } else if (field === 'logoUrl' || field === 'coverImageUrl' || field === 'popupImageUrl') {
              setBarForm((prev) => ({ ...prev, [field]: imageValue }));
            } else {
              setItemForm((prev) => ({ ...prev, imageUrl: imageValue }));
            }
            console.log('✅ Upload concluído com sucesso');
            alert('Imagem carregada com sucesso!');
          }
      } catch (error) {
        console.error('❌ Erro no upload:', error);

        let errorMessage = 'Erro desconhecido';
        if (error instanceof Error) {
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else {
            errorMessage = error.message;
          }
        }

        alert(`Erro no upload: ${errorMessage}`);
        throw error; // Re-throw para que o handleCropComplete possa tratar
      }
    },
    [imageGalleryField],
  );

  // Handler quando o crop for completado
  const handleCropComplete = useCallback(
    async (croppedBlob: Blob) => {
      try {
        await uploadCroppedImage(croppedBlob, cropImageField);
        // Limpar URL temporária apenas após sucesso
        if (cropImageSrc && cropImageSrc.startsWith('blob:')) {
          URL.revokeObjectURL(cropImageSrc);
        }
        setCropImageSrc('');
        setCropImageField('');
      } catch (error) {
        // Erro já foi tratado em uploadCroppedImage
        console.error('Erro no handleCropComplete:', error);
        // Não limpar o estado para permitir que o usuário tente novamente
      }
    },
    [cropImageField, cropImageSrc, uploadCroppedImage],
  );

  const handleImageUpload = useCallback(
    (file: File, field: string) => {
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Apenas imagens são permitidas');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 5MB.');
        return;
      }

      // Preservar o imageGalleryField antes de abrir o crop
      // Isso garante que mesmo que o modal da galeria seja fechado, o campo será preservado
      console.log('📸 Preparando upload com campo:', field, 'imageGalleryField atual:', imageGalleryField);
      
      // Abrir modal de crop antes de fazer upload
      const tempUrl = URL.createObjectURL(file);
      setCropImageSrc(tempUrl);
      setCropImageField(field);
      // Garantir que o imageGalleryField seja preservado se for um upload da galeria
      if (imageGalleryField && imageGalleryField === field) {
        console.log('✅ Preservando imageGalleryField:', imageGalleryField);
        // O imageGalleryField já está definido, não precisa fazer nada
      }
      setShowCropModal(true);
    },
    [imageGalleryField],
  );

  const handleRemoveCoverImage = (urlToRemove: string) => {
    setBarForm((prev) => ({
      ...prev,
      coverImages: prev.coverImages.filter((url) => url !== urlToRemove),
    }));
  };

  const handleRemovePartnerLogo = (urlToRemove: string) => {
    setBarForm((prev) => ({
      ...prev,
      partner_logos: (prev.partner_logos || []).filter((url) => url !== urlToRemove),
    }));
  };

  // Função para abrir galeria de imagens
  const openImageGallery = useCallback((field: string) => {
    setImageGalleryField(field);
    setShowImageGalleryModal(true);
    fetchGalleryImages();
  }, [fetchGalleryImages]);

  // Função para selecionar imagem da galeria
  const handleSelectGalleryImage = useCallback((filename: string, fullUrl?: string | null) => {
    // Persistir SEMPRE o filename/objectPath quando disponível (estável e independente de cache/CDN).
    // Só persistir URL quando o "filename" já for URL completa (legado).
    const f = String(filename || '').trim();
    const imageValue =
      f && !f.startsWith('http://') && !f.startsWith('https://')
        ? f
        : (String(fullUrl || '').trim() || f);
    
    console.log('🖼️ Selecionando imagem da galeria:', { 
      filename, 
      fullUrl, 
      imageValue, 
      imageGalleryField,
      isCloudinaryUrl: imageValue.startsWith('https://res.cloudinary.com')
    });
    
    if (imageGalleryField === 'coverImages') {
      setBarForm((prev) => {
        const nextCoverImages = [...prev.coverImages, imageValue];
        const nextCoverImageUrl =
          prev.coverImageUrl && prev.coverImageUrl !== PLACEHOLDER_IMAGE_URL
            ? prev.coverImageUrl
            : imageValue;
        return {
          ...prev,
          coverImages: nextCoverImages,
          coverImageUrl: nextCoverImageUrl,
        };
      });
    } else if (imageGalleryField === 'partner_logos') {
      setBarForm((prev) => {
        const current = prev.partner_logos || [];
        if (current.length >= 5) return prev;
        return { ...prev, partner_logos: [...current, imageValue] };
      });
    } else if (imageGalleryField === 'logoUrl' || imageGalleryField === 'coverImageUrl' || imageGalleryField === 'popupImageUrl') {
      setBarForm((prev) => ({ ...prev, [imageGalleryField]: imageValue }));
    } else {
      setItemForm((prev) => {
        const updated = { ...prev, imageUrl: imageValue };
        console.log('✅ itemForm atualizado ao selecionar da galeria:', updated);
        return updated;
      });
    }
    setShowImageGalleryModal(false);
    setImageGalleryField('');
    setGallerySearchTerm('');
  }, [imageGalleryField]);

  // Função para deletar imagem da galeria
  const handleDeleteGalleryImage = useCallback(
    async (filename: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Impedir que selecione a imagem ao clicar em deletar
      
      if (!confirm(`Tem certeza que deseja deletar a imagem "${filename}"?\n\nIsso só será possível se a imagem não estiver sendo usada em nenhum item ou estabelecimento.`)) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/gallery/images/${encodeURIComponent(filename)}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const result = await response.json();
          alert(result.message || 'Imagem deletada com sucesso!');
          fetchGalleryImages(); // Atualizar lista
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || 'Erro ao deletar imagem.';
          alert(errorMessage);
        }
      } catch (err) {
        console.error('Erro ao deletar imagem:', err);
        alert('Erro ao deletar imagem. Tente novamente.');
      }
    },
    [fetchGalleryImages],
  );

  const selectImageFile = useCallback(
    (field: string) => {
      // Abrir galeria em vez de input direto
      openImageGallery(field);
    },
    [openImageGallery],
  );

  const Modal = useCallback(({ isOpen, onClose, children, title }: any) => (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  ), []);

  const handleSelectItem = useCallback((itemId: string | number, isSelected: boolean) => {
    setSelectedItems((prev) =>
      isSelected ? [...prev, itemId] : prev.filter((id) => id !== itemId),
    );
  }, []);

  const handleSelectAll = useCallback(
    (items: MenuItem[]) => {
      const allItemIds = items.map((item) => item.id);
      const allSelected = selectedItems.length === allItemIds.length;
      setSelectedItems(allSelected ? [] : allItemIds);
    },
    [selectedItems],
  );

  const handleBulkDelete = useCallback(async () => {
    if (
      !confirm(
        `Tem certeza que deseja excluir os ${selectedItems.length} itens selecionados?`,
      )
    ) {
      return;
    }

    try {
      const deletePromises = selectedItems.map((itemId) =>
        fetch(`${API_BASE_URL}/items/${itemId}`, { method: 'DELETE' }),
      );
      const results = await Promise.all(deletePromises);

      const failedDeletions = results.filter((res) => !res.ok);
      if (failedDeletions.length > 0) {
        throw new Error(`Falha ao excluir ${failedDeletions.length} item(s).`);
      }

      alert('Itens excluídos com sucesso!');
      setSelectedItems([]);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(`Erro ao excluir itens: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }, [selectedItems, fetchData]);

  // Função para duplicar item
  const handleDuplicateItem = useCallback(async (item: MenuItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${item.name} (Cópia)`,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          categoryId: item.categoryId,
          barId: item.barId,
          subCategory: item.subCategory || item.subCategoryName || '',
          toppings: item.toppings || [],
          order: item.order,
          seals: item.seals || [],
          visible: item.visible !== undefined ? item.visible : 1,
        }),
      });

      if (response.ok) {
        alert('Item duplicado com sucesso!');
        await fetchData();
      } else {
        throw new Error('Falha ao duplicar item.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao duplicar item.');
    }
  }, [fetchData]);

  // Função para atualização rápida de preço
  const handleQuickPriceUpdate = useCallback(async (itemId: string | number, newPrice: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice }),
      });

      if (response.ok) {
        setMenuData((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, price: newPrice } : item
          ),
        }));
      } else {
        throw new Error('Falha ao atualizar preço.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar preço.');
    }
  }, []);

  // Ações em massa
  const handleBulkChangeCategory = useCallback(async (newCategoryId: string) => {
    if (!newCategoryId || selectedItems.length === 0) return;
    
    if (!confirm(`Alterar categoria de ${selectedItems.length} item(s) selecionado(s)?`)) {
      return;
    }

    try {
      const updatePromises = selectedItems.map((itemId) =>
        fetch(`${API_BASE_URL}/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId: newCategoryId }),
        })
      );
      const results = await Promise.all(updatePromises);
      const failed = results.filter((res) => !res.ok);
      
      if (failed.length > 0) {
        throw new Error(`Falha ao atualizar ${failed.length} item(s).`);
      }

      alert('Categorias alteradas com sucesso!');
      setSelectedItems([]);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(`Erro ao alterar categorias: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }, [selectedItems, fetchData]);

  const buildPauseScopeLabel = useCallback(
    (itemIds: Array<string | number>) => {
      const items = menuData.items.filter((item) => itemMatchesSelection(item, itemIds));
      const categoryNames = new Set<string>();
      for (const item of items) {
        const cat = menuData.categories.find((c) => String(c.id) === String(item.categoryId));
        categoryNames.add(cat?.name || 'Categoria');
      }
      const names = Array.from(categoryNames);
      if (names.length === 1) return names[0];
      if (names.length <= 3) return names.join(', ');
      return `${names.length} categorias`;
    },
    [menuData.items, menuData.categories],
  );

  const handleBulkActivate = useCallback(async () => {
    if (selectedItems.length === 0) return;
    if (
      !confirm(
        `Ativar ${selectedItems.length} item(s)? Isso remove pausa imediata e agendas por horário.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/pause-schedules/clear-for-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: selectedItems }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao ativar itens.');
      }
      alert(data.message || 'Itens ativados.');
      setSelectedItems([]);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao ativar itens.');
    }
  }, [selectedItems, fetchData]);

  const handleBulkToggleVisibility = useCallback(() => {
    if (selectedItems.length === 0) return;

    const itemsToToggle = menuData.items.filter((item) => itemMatchesSelection(item, selectedItems));
    const allPaused = itemsToToggle.every((item) => isItemEffectivelyPaused(item));

    if (allPaused) {
      void handleBulkActivate();
      return;
    }

    const existingWindows = derivePauseWindowsFromItems(itemsToToggle);
    setPauseModalScopeLabel(buildPauseScopeLabel(selectedItems));
    setPauseModalMode('scheduled');
    setPauseModalInitialWindows(existingWindows);
    setPauseModalOpen(true);
  }, [selectedItems, menuData.items, buildPauseScopeLabel, handleBulkActivate]);

  const handlePauseModalConfirm = useCallback(
    async ({
      mode,
      windows,
    }: {
      mode: MenuPauseApplyMode;
      windows: PauseWindowDraft[];
    }) => {
      const res = await fetch(`${API_BASE_URL}/pause-schedules/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          itemIds: selectedItems,
          windows: windows.map((w) => ({
            weekdays: w.weekdays,
            start_time: w.startTime,
            end_time: w.endTime,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao aplicar pausa.');
      }
      alert(data.message || 'Pausa aplicada.');
      await fetchData();
    },
    [selectedItems, fetchData],
  );

  // Filtros inteligentes com useMemo
  const filteredSubCategories = useMemo(() => {
    if (!filterCategoryId) return [];
    
    const itemsInCategory = menuData.items.filter(
      (item) => String(item.categoryId) === filterCategoryId
    );
    
    const uniqueSubCategories = new Set<string>();
    itemsInCategory.forEach((item) => {
      const subCat = item.subCategory || item.subCategoryName;
      if (subCat && subCat.trim() !== '') {
        uniqueSubCategories.add(subCat.trim());
      }
    });
    
    return Array.from(uniqueSubCategories).sort();
  }, [filterCategoryId, menuData.items]);

  // Resetar subcategoria quando categoria mudar
  useEffect(() => {
    if (filterCategoryId) {
      setFilterSubCategory('');
    }
  }, [filterCategoryId]);

  // Carregar subcategorias quando categoria for selecionada no modal de item
  useEffect(() => {
    const loadSubCategories = async () => {
      if (itemForm.categoryId) {
        try {
          const response = await fetch(`${API_BASE_URL}/subcategories/category/${itemForm.categoryId}`);
          if (response.ok) {
            const subCategories = await response.json();
            setAvailableSubCategories(
              subCategories.map((sub: any) => ({
                name: sub.name,
                order: sub.order || 0,
              })).sort((a: any, b: any) => a.order - b.order)
            );
          } else {
            setAvailableSubCategories([]);
          }
        } catch (error) {
          console.error('❌ Erro ao carregar subcategorias:', error);
          setAvailableSubCategories([]);
        }
      } else {
        setAvailableSubCategories([]);
        // Limpar subcategoria selecionada quando não há categoria
        setItemForm((prev) => ({ ...prev, subCategory: '' }));
      }
    };

    loadSubCategories();
  }, [itemForm.categoryId]);

  // Filtragem de itens com useMemo
  const filteredItems = useMemo(() => {
    return menuData.items.filter((item) => {
      // Filtro de busca por texto
      const matchesSearch = !searchTerm || 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de categoria
      const matchesCategory = !filterCategoryId || 
        String(item.categoryId) === filterCategoryId;

      // Filtro de subcategoria
      const matchesSubCategory = !filterSubCategory ||
        (item.subCategory || item.subCategoryName || '').trim() === filterSubCategory;

      // Filtro de status
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = !isItemEffectivelyPaused(item);
      } else if (filterStatus === 'paused') {
        matchesStatus = isItemEffectivelyPaused(item);
      } else if (filterStatus === 'inactive') {
        matchesStatus = item.visible === 0 || item.visible === false;
      }

      return matchesSearch && matchesCategory && matchesSubCategory && matchesStatus;
    });
  }, [menuData.items, searchTerm, filterCategoryId, filterSubCategory, filterStatus]);

  // Funções para controlar expansão de categorias e subcategorias
  const toggleCategory = useCallback((categoryKey: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  }, []);

  const toggleSubCategory = useCallback((subCategoryKey: string) => {
    setExpandedSubCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subCategoryKey)) {
        newSet.delete(subCategoryKey);
      } else {
        newSet.add(subCategoryKey);
      }
      return newSet;
    });
  }, []);

  const expandAllCategories = useCallback((itemsForBar: MenuItem[]) => {
    const categoryKeys = new Set<string>();
    itemsForBar.forEach((item) => {
      const categoryKey = `${item.barId}-${item.categoryId}`;
      categoryKeys.add(categoryKey);
    });
    setExpandedCategories(categoryKeys);
  }, []);

  const collapseAllCategories = useCallback(() => {
    setExpandedCategories(new Set());
    setExpandedSubCategories(new Set());
  }, []);

  const expandAllSubCategories = useCallback((itemsForBar: MenuItem[]) => {
    const subCategoryKeys = new Set<string>();
    itemsForBar.forEach((item) => {
      const subCategory = item.subCategory || item.subCategoryName;
      if (subCategory) {
        const subCategoryKey = `${item.barId}-${item.categoryId}-${subCategory}`;
        subCategoryKeys.add(subCategoryKey);
      }
    });
    setExpandedSubCategories(subCategoryKeys);
  }, []);

  const collapseAllSubCategories = useCallback(() => {
    setExpandedSubCategories(new Set());
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 admin-container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-gray-900 admin-title">Gerenciamento do Cardápio</h1>
          <p className="text-sm sm:text-base text-gray-600 admin-subtitle">Gerencie estabelecimentos, categorias e itens do cardápio</p>
          {promoterBar && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <MdSecurity className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    Você está gerenciando: <span className="font-bold">{promoterBar.barName}</span>
                  </p>
                  <p className="text-sm text-green-600">
                    Acesso restrito apenas aos dados deste estabelecimento
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
              {[
                { id: 'bars', name: 'Estabelecimentos', count: visibleBars.length },
                { id: 'categories', name: 'Categorias', count: visibleCategories.length },
                { id: 'items', name: 'Itens do Menu', count: visibleItems.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`border-b-2 py-2 px-1 text-sm font-medium w-full sm:w-auto text-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {tab.name}
                  <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-900">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Banner para Promoters / Gerentes com acesso restrito a um bar */}
            {promoterBar && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-3">
                  <MdSecurity className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      Gerenciando: {promoterBar.barName}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Você tem acesso restrito apenas aos dados deste estabelecimento
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bars' && (
              <div>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Estabelecimentos</h2>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => setShowBarModal(true)}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 w-full sm:w-auto justify-center"
                        >
                          <MdAdd className="h-5 w-5" />
                          Adicionar Estabelecimento
                        </button>
                        <button
                          onClick={() => router.push('/admin/executive-events')}
                          className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-gray-900 hover:bg-yellow-600 w-full sm:w-auto justify-center font-semibold"
                        >
                          <MdEvent className="h-5 w-5" />
                          Executive Events
                        </button>
                      </>
                    )}
                  </div>
                  {promoterBar && (
                    <button
                      onClick={() => {
                        const bar = menuData.bars[0] ?? menuData.bars.find((b) => Number(b.id) === Number(promoterBar.barId));
                        if (bar) {
                          handleEditBar(bar);
                        } else {
                          setShowBarModal(true);
                        }
                      }}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 w-full sm:w-auto justify-center"
                    >
                      <MdEdit className="h-5 w-5" />
                      Editar {promoterBar.barName}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 admin-grid-4">
                  {visibleBars.map((bar) => (
                    <div key={bar.id} className="overflow-hidden rounded-lg bg-white shadow-md">
                      <div className="relative h-48">
                        <Image
                          src={resolveBarCoverImage(bar)}
                          alt={bar.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                          onError={(e) => {
                            e.currentTarget.src = PLACEHOLDER_IMAGE_URL;
                          }}
                          unoptimized={true}
                        />
                        <div className="absolute right-2 top-2 flex gap-1">
                          {(isAdmin || canManageBar(Number(bar.id)) || (promoterBar && menuData.bars.some((b) => Number(b.id) === Number(bar.id)))) && (
                            <>
                              <button
                                onClick={() => handleEditBar(bar)}
                                className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700"
                              >
                                <MdEdit className="h-4 w-4" />
                              </button>
                              <Gate permission="cardapio:update">
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteBar(bar.id)}
                                    className="rounded-full bg-red-600 p-2 text-white hover:bg-red-700"
                                  >
                                    <MdDelete className="h-4 w-4" />
                                  </button>
                                )}
                              </Gate>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">{bar.name}</h3>
                        <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                          {bar.description}
                        </p>
                        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                          <MdStar className="h-4 w-4 text-yellow-400" />
                          <span>{bar.rating}</span>
                          <span>({bar.reviewsCount})</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MdLocationOn className="h-4 w-4" />
                          <span className="line-clamp-1">{bar.address}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Categorias</h2>
                  {isAdmin && (
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 w-full sm:w-auto justify-center"
                    >
                      <MdAdd className="h-5 w-5" />
                      Adicionar Categoria
                    </button>
                  )}
                  {promoterBar && (
                    <button
                      onClick={handleAddCategoryForPromoter}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      <MdAdd className="h-5 w-5" />
                      Adicionar Categoria para {promoterBar.barName}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 admin-grid-4">
                  {visibleCategories.map((category) => {
                    const bar = visibleBars.find((b) => b.id === category.barId);
                    if (!bar) return null;

                    return (
                      <div key={category.id} className="rounded-lg bg-white p-6 shadow-md">
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-500">{bar.name}</p>
                          </div>
                          <div className="flex gap-1">
                            {(isAdmin || canManageBar(Number(category.barId)) || (promoterBar && menuData.bars.some((b) => Number(b.id) === Number(category.barId)))) && (
                              <>
                                <button
                                  onClick={() => handleEditCategory(category)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Editar categoria e subcategorias"
                                >
                                  <MdEdit className="h-4 w-4" />
                                </button>
                                <Gate permission="cardapio:update">
                                  <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <MdDelete className="h-4 w-4" />
                                  </button>
                                </Gate>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Ordem: {category.order}</p>
                          <p className="text-blue-600">
                            {(() => {
                              const subCategoriesCount = menuData.subCategories.filter(
                                (sub) =>
                                  sub.categoryId === category.id && sub.barId === category.barId,
                              ).length;
                              const itemsWithSubCategories = menuData.items.filter(
                                (item) =>
                                  item.categoryId === category.id &&
                                  item.barId === category.barId &&
                                  item.subCategoryName,
                              ).length;
                              const uniqueSubCategories =
                                itemsWithSubCategories > 0
                                  ? new Set(
                                      menuData.items
                                        .filter(
                                          (item) =>
                                            item.categoryId === category.id &&
                                            item.barId === category.barId &&
                                            item.subCategoryName,
                                        )
                                        .map((item) => item.subCategoryName),
                                    ).size
                                  : subCategoriesCount;
                              return `${uniqueSubCategories} subcategoria(s)`;
                            })()}
                          </p>

                          {/* Preview das subcategorias */}
                          {(() => {
                            const subCategories = menuData.subCategories
                              .filter(
                                (sub) =>
                                  sub.categoryId === category.id && sub.barId === category.barId,
                              )
                              .sort((a, b) => a.order - b.order);

                            if (subCategories.length === 0) {
                              // Tentar extrair das subcategorias dos itens
                              const itemSubCategories = Array.from(
                                new Set(
                                  menuData.items
                                    .filter(
                                      (item) =>
                                        item.categoryId === category.id &&
                                        item.barId === category.barId &&
                                        item.subCategoryName,
                                    )
                                    .map((item) => item.subCategoryName),
                                ),
                              ).slice(0, 3); // Mostrar apenas as 3 primeiras

                              if (itemSubCategories.length > 0) {
                                return (
                                  <div className="mt-2">
                                    <p className="mb-1 text-xs text-gray-500">
                                      Subcategorias detectadas:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {itemSubCategories.map((subName, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                                        >
                                          {subName}
                                        </span>
                                      ))}
                                      {itemSubCategories.length >= 3 && (
                                        <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-400">
                                          +{
                                            Array.from(
                                              new Set(
                                                menuData.items
                                                  .filter(
                                                    (item) =>
                                                      item.categoryId === category.id &&
                                                      item.barId === category.barId &&
                                                      item.subCategoryName,
                                                  )
                                                  .map((item) => item.subCategoryName),
                                              ),
                                            ).length - 3
                                          }{' '}
                                          mais
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }

                            return (
                              <div className="mt-2">
                                <p className="mb-1 text-xs text-gray-500">Subcategorias:</p>
                                <div className="flex flex-wrap gap-1">
                                  {subCategories.slice(0, 3).map((sub) => (
                                    <span
                                      key={sub.id}
                                      className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600"
                                    >
                                      {sub.name}
                                    </span>
                                  ))}
                                  {subCategories.length > 3 && (
                                    <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-400">
                                      +{subCategories.length - 3} mais
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div>
                <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Itens do Menu</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 w-full lg:w-auto">
                    <div className="relative flex-grow">
                      <MdSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar item..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={openTrashModal}
                      className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                      title="Ver itens deletados (lixeira)"
                    >
                      <MdDeleteOutline className="h-5 w-5" />
                      Lixeira
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setShowItemModal(true)}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        <MdAdd className="h-5 w-5" />
                        Adicionar Item
                      </button>
                    )}
                    {promoterBar && (
                      <button
                        onClick={handleAddItemForPromoter}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        <MdAdd className="h-5 w-5" />
                        Adicionar Item para {promoterBar.barName}
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtros Inteligentes */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
                    <select
                      value={filterCategoryId}
                      onChange={(e) => setFilterCategoryId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas as categorias</option>
                      {menuData.categories.map((cat) => (
                        <option key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Subcategoria</label>
                    <select
                      value={filterSubCategory}
                      onChange={(e) => setFilterSubCategory(e.target.value)}
                      disabled={!filterCategoryId}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Todas as subcategorias</option>
                      {filteredSubCategories.map((subCat) => (
                        <option key={subCat} value={subCat}>
                          {subCat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos</option>
                      <option value="active">Ativo</option>
                      <option value="paused">Pausado</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title="Visualização em grade"
                      >
                        <MdViewModule className="h-5 w-5" />
                        <span className="hidden sm:inline">Grade</span>
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                          viewMode === 'list'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title="Visualização em lista"
                      >
                        <MdViewList className="h-5 w-5" />
                        <span className="hidden sm:inline">Lista</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Toolbar para Ações em Massa */}
                {selectedItems.length > 0 && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedItems.length} item(s) selecionado(s)
                    </span>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBulkChangeCategory(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue=""
                      >
                        <option value="" disabled>Alterar Categoria</option>
                        {menuData.categories.map((cat) => (
                          <option key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleBulkToggleVisibility}
                        className="flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-1.5 text-sm text-white hover:bg-yellow-700"
                      >
                        <MdPause className="h-4 w-4" />
                        Pausar / Ativar
                      </button>
                      <Gate permission="cardapio:update">
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700"
                      >
                        <MdDelete className="h-4 w-4" />
                        Excluir
                      </button>
                      </Gate>
                      <button
                        onClick={() => setSelectedItems([])}
                        className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-1.5 text-sm text-white hover:bg-gray-700"
                      >
                        <MdClose className="h-4 w-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Agrupamento de itens por bar */}
                {menuData.bars.map((bar) => {
                  const itemsForBar = filteredItems.filter((item) => item.barId === bar.id);
                  if (itemsForBar.length === 0) return null;

                  const isAllSelectedInBar = itemsForBar.every((item) =>
                    selectedItems.includes(item.id),
                  );
                  const isAnySelectedInBar = itemsForBar.some((item) =>
                    selectedItems.includes(item.id),
                  );

                  return (
                    <div key={bar.id} className="mb-8">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-800">{bar.name}</h3>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={isAllSelectedInBar}
                            onChange={() => {
                              if (isAllSelectedInBar) {
                                setSelectedItems((prev) =>
                                  prev.filter((id) => !itemsForBar.map((i) => i.id).includes(id)),
                                );
                              } else {
                                setSelectedItems((prev) => [
                                  ...new Set([...prev, ...itemsForBar.map((i) => i.id)]),
                                ]);
                              }
                            }}
                            ref={(el) => {
                              if (el) {
                                el.indeterminate = !isAllSelectedInBar && isAnySelectedInBar;
                              }
                            }}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {isAllSelectedInBar ? 'Desmarcar Todos' : 'Selecionar Todos'}
                          </span>
                        </div>
                      </div>
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 admin-grid-4">
                          {itemsForBar.map((item) => {
                            const category = menuData.categories.find(
                              (c) => c.id === item.categoryId,
                            );
                            return (
                              <div
                                key={item.id}
                                className={`relative overflow-hidden rounded-lg bg-white shadow-md ${
                                  isItemEffectivelyPaused(item) ? 'opacity-60' : ''
                                }`}
                              >
                                {/* Badge de pausado */}
                                {isItemEffectivelyPaused(item) && (
                                  <div
                                    className={`absolute left-0 top-0 z-20 rounded-br-lg px-3 py-1 ${
                                      item.schedulePaused && item.visible !== 0 && item.visible !== false
                                        ? 'bg-blue-600'
                                        : 'bg-yellow-500'
                                    }`}
                                  >
                                    <span className="text-xs font-bold text-white">
                                      {item.schedulePaused && item.visible !== 0 && item.visible !== false
                                        ? 'AGENDA'
                                        : 'PAUSADO'}
                                    </span>
                                  </div>
                                )}
                                {hasConfiguredPauseSchedule(item) && !isItemEffectivelyPaused(item) && (
                                  <div className="absolute right-0 top-0 z-20 rounded-bl-lg bg-blue-100 px-3 py-1">
                                    <span className="text-xs font-semibold text-blue-800">AGENDA</span>
                                  </div>
                                )}
                                <div className="absolute left-2 top-2 z-10">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={selectedItems.includes(item.id)}
                                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                  />
                                </div>
                                <div className="relative h-48">
                                  {(() => {
                                    const imageUrl = getValidImageUrl(item.imageUrl);
                                    const isBlob = imageUrl.startsWith('blob:');
                                    
                                    if (isBlob) {
                                      return (
                                        <img
                                          src={imageUrl}
                                          alt={item.name}
                                          className="absolute inset-0 w-full h-full object-cover"
                                          onError={(e) => {
                                            console.error('❌ Erro ao carregar imagem blob do item:', item.name, item.imageUrl);
                                            const target = e.currentTarget;
                                            target.src = PLACEHOLDER_IMAGE_URL;
                                          }}
                                        />
                                      );
                                    }
                                    
                                    return (
                                      <Image
                                        src={imageUrl}
                                        alt={item.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover"
                                        unoptimized={item.imageUrl?.includes('cloudinary.com') || false}
                                        onError={(e) => {
                                          console.error('❌ Erro ao carregar imagem do item:', item.name, item.imageUrl);
                                          const target = e.currentTarget;
                                          if (item.imageUrl?.includes('cloudinary.com') && target.src !== item.imageUrl) {
                                            target.src = item.imageUrl;
                                          } else {
                                            target.src = PLACEHOLDER_IMAGE_URL;
                                          }
                                        }}
                                      />
                                    );
                                  })()}
                                  <div className="absolute right-2 top-2 flex gap-1">
                                    {(isAdmin || canManageBar(Number(item.barId)) || (promoterBar && menuData.bars.some((b) => Number(b.id) === Number(item.barId)))) && (
                                      <>
                                        <button
                                          onClick={() => handleToggleItemVisibility(item.id, item.visible)}
                                          className={`rounded-full p-2 text-white hover:opacity-90 ${
                                            item.visible === 1 || item.visible === true || item.visible === undefined || item.visible === null
                                              ? 'bg-yellow-600 hover:bg-yellow-700'
                                              : 'bg-green-600 hover:bg-green-700'
                                          }`}
                                          title={
                                            item.visible === 1 || item.visible === true || item.visible === undefined || item.visible === null
                                              ? 'Pausar item'
                                              : 'Ativar item'
                                          }
                                        >
                                          {item.visible === 1 || item.visible === true || item.visible === undefined || item.visible === null ? (
                                            <MdPause className="h-4 w-4" />
                                          ) : (
                                            <MdPlayArrow className="h-4 w-4" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => handleEditItem(item)}
                                          className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700"
                                          title="Editar item"
                                        >
                                          <MdEdit className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDuplicateItem(item)}
                                          className="rounded-full bg-purple-600 p-2 text-white hover:bg-purple-700"
                                          title="Duplicar item"
                                        >
                                          <MdContentCopy className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteItem(item.id)}
                                          className="rounded-full bg-red-600 p-2 text-white hover:bg-red-700"
                                          title="Excluir item"
                                        >
                                          <MdDelete className="h-4 w-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                  <div className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-1 shadow-md">
                                    <span className="text-sm font-bold text-green-600">
                                      {formatPrice(item.price, item.isPriceOnRequest)}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900">
                                    {item.name}
                                  </h3>
                                  <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                                    {item.description}
                                  </p>
                                  {renderItemSeals(item.seals || [])}
                                  <div className="text-xs text-gray-500">
                                    <p>Categoria: {category?.name}</p>
                                    {(item.subCategory || item.subCategoryName) && (
                                      <p>Sub-categoria: {item.subCategory || item.subCategoryName}</p>
                                    )}
                                    {hasConfiguredPauseSchedule(item) && (
                                      <p className="mt-1 text-blue-600">
                                        Pausa agendada:{' '}
                                        {item.pauseSchedules!.map((schedule) => schedule.summary).join(' · ')}
                                      </p>
                                    )}
                                    {item.toppings?.length > 0 && (
                                      <p>{item.toppings.length} adicionais</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Botões de controle de expansão */}
                          <div className="flex items-center justify-end gap-2 mb-4">
                            <button
                              onClick={() => expandAllCategories(itemsForBar)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Expandir todas as categorias"
                            >
                              <MdKeyboardArrowDown className="h-4 w-4" />
                              Expandir Todas
                            </button>
                            <button
                              onClick={collapseAllCategories}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Recolher todas as categorias"
                            >
                              <MdKeyboardArrowUp className="h-4 w-4" />
                              Recolher Todas
                            </button>
                          </div>

                          {/* Agrupar itens por categoria */}
                          {(() => {
                            // Agrupar itens por categoria
                            const itemsByCategory = new Map<string, MenuItem[]>();
                            itemsForBar.forEach((item) => {
                              const category = menuData.categories.find((c) => c.id === item.categoryId);
                              const categoryName = category?.name || 'Sem Categoria';
                              const categoryKey = `${bar.id}-${item.categoryId}`;
                              
                              if (!itemsByCategory.has(categoryKey)) {
                                itemsByCategory.set(categoryKey, []);
                              }
                              itemsByCategory.get(categoryKey)!.push(item);
                            });

                            return Array.from(itemsByCategory.entries()).map(([categoryKey, categoryItems]) => {
                              const category = menuData.categories.find(
                                (c) => c.id === categoryItems[0].categoryId
                              );
                              const categoryName = category?.name || 'Sem Categoria';
                              const isCategoryExpanded = expandedCategories.has(categoryKey);
                              
                              // Agrupar itens da categoria por subcategoria
                              const itemsBySubCategory = new Map<string, MenuItem[]>();
                              categoryItems.forEach((item) => {
                                const subCategory = item.subCategory || item.subCategoryName || 'Sem Subcategoria';
                                const subCategoryKey = `${categoryKey}-${subCategory}`;
                                
                                if (!itemsBySubCategory.has(subCategoryKey)) {
                                  itemsBySubCategory.set(subCategoryKey, []);
                                }
                                itemsBySubCategory.get(subCategoryKey)!.push(item);
                              });

                              const subCategories = Array.from(itemsBySubCategory.entries());
                              const hasSubCategories = subCategories.length > 1 || (subCategories.length === 1 && subCategories[0][0] !== `${categoryKey}-Sem Subcategoria`);

                              return (
                                <div key={categoryKey} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                  {/* Cabeçalho da Categoria */}
                                  <button
                                    onClick={() => toggleCategory(categoryKey)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      {isCategoryExpanded ? (
                                        <MdKeyboardArrowUp className="h-5 w-5 text-gray-600" />
                                      ) : (
                                        <MdKeyboardArrowDown className="h-5 w-5 text-gray-600" />
                                      )}
                                      <span className="font-semibold text-gray-900">{categoryName}</span>
                                      <span className="text-sm text-gray-500">({categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={categoryItems.every((item) => selectedItems.includes(item.id))}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          if (e.target.checked) {
                                            setSelectedItems((prev) => [
                                              ...new Set([...prev, ...categoryItems.map((i) => i.id)]),
                                            ]);
                                          } else {
                                            setSelectedItems((prev) =>
                                              prev.filter((id) => !categoryItems.map((i) => i.id).includes(id))
                                            );
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </button>

                                  {/* Conteúdo da Categoria (Subcategorias e Itens) */}
                                  {isCategoryExpanded && (
                                    <div className="divide-y divide-gray-100">
                                      {hasSubCategories ? (
                                        // Renderizar subcategorias
                                        subCategories.map(([subCategoryKey, subCategoryItems]) => {
                                          const subCategory = subCategoryItems[0].subCategory || subCategoryItems[0].subCategoryName || 'Sem Subcategoria';
                                          const isSubCategoryExpanded = expandedSubCategories.has(subCategoryKey);

                                          return (
                                            <div key={subCategoryKey} className="bg-white">
                                              {/* Cabeçalho da Subcategoria */}
                                              <button
                                                onClick={() => toggleSubCategory(subCategoryKey)}
                                                className="w-full flex items-center justify-between px-6 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                                              >
                                                <div className="flex items-center gap-3">
                                                  {isSubCategoryExpanded ? (
                                                    <MdKeyboardArrowUp className="h-4 w-4 text-gray-500" />
                                                  ) : (
                                                    <MdKeyboardArrowDown className="h-4 w-4 text-gray-500" />
                                                  )}
                                                  <span className="text-sm font-medium text-gray-700">{subCategory}</span>
                                                  <span className="text-xs text-gray-500">({subCategoryItems.length} item{subCategoryItems.length !== 1 ? 's' : ''})</span>
                                                </div>
                                                <input
                                                  type="checkbox"
                                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                  checked={subCategoryItems.every((item) => selectedItems.includes(item.id))}
                                                  onChange={(e) => {
                                                    e.stopPropagation();
                                                    if (e.target.checked) {
                                                      setSelectedItems((prev) => [
                                                        ...new Set([...prev, ...subCategoryItems.map((i) => i.id)]),
                                                      ]);
                                                    } else {
                                                      setSelectedItems((prev) =>
                                                        prev.filter((id) => !subCategoryItems.map((i) => i.id).includes(id))
                                                      );
                                                    }
                                                  }}
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                              </button>

                                              {/* Itens da Subcategoria */}
                                              {isSubCategoryExpanded && (
                                                <div className="overflow-x-auto">
                                                  <table className="min-w-full">
                                                    <thead className="bg-gray-50">
                                                      <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                                          <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            checked={subCategoryItems.every((item) => selectedItems.includes(item.id))}
                                                            onChange={(e) => {
                                                              if (e.target.checked) {
                                                                setSelectedItems((prev) => [
                                                                  ...new Set([...prev, ...subCategoryItems.map((i) => i.id)]),
                                                                ]);
                                                              } else {
                                                                setSelectedItems((prev) =>
                                                                  prev.filter((id) => !subCategoryItems.map((i) => i.id).includes(id))
                                                                );
                                                              }
                                                            }}
                                                          />
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 bg-white">
                                                      {subCategoryItems.map((item) => {
                                                        const isPaused = isItemEffectivelyPaused(item);
                                                        const isEditingPrice = editingPriceId === item.id;
                                                        
                                                        return (
                                                          <tr
                                                            key={item.id}
                                                            className={`hover:bg-gray-50 ${isPaused ? 'opacity-60' : ''}`}
                                                          >
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                              <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                checked={selectedItems.includes(item.id)}
                                                                onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                                              />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                              {item.description && (
                                                                <div className="text-xs text-gray-500 line-clamp-1">{item.description}</div>
                                                              )}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                              {isEditingPrice ? (
                                                                <div className="flex items-center gap-2">
                                                                  <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={editingPriceValue}
                                                                    onChange={(e) => setEditingPriceValue(e.target.value)}
                                                                    onBlur={() => {
                                                                      const newPrice = parseFloat(editingPriceValue);
                                                                      if (!isNaN(newPrice) && newPrice >= 0) {
                                                                        handleQuickPriceUpdate(item.id, newPrice);
                                                                      }
                                                                      setEditingPriceId(null);
                                                                      setEditingPriceValue('');
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                      if (e.key === 'Enter') {
                                                                        const newPrice = parseFloat(editingPriceValue);
                                                                        if (!isNaN(newPrice) && newPrice >= 0) {
                                                                          handleQuickPriceUpdate(item.id, newPrice);
                                                                        }
                                                                        setEditingPriceId(null);
                                                                        setEditingPriceValue('');
                                                                      } else if (e.key === 'Escape') {
                                                                        setEditingPriceId(null);
                                                                        setEditingPriceValue('');
                                                                      }
                                                                    }}
                                                                    className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    autoFocus
                                                                  />
                                                                </div>
                                                              ) : (
                                                                <button
                                                                  onClick={() => {
                                                                    setEditingPriceId(item.id);
                                                                    // Se for "Sob Consulta", iniciar com campo vazio
                                                                    setEditingPriceValue(item.isPriceOnRequest || Number(item.price) === -1 ? '' : item.price.toString());
                                                                  }}
                                                                  className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
                                                                >
                                                                  {formatPrice(item.price, item.isPriceOnRequest)}
                                                                </button>
                                                              )}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                              <button
                                                                onClick={() => handleToggleItemVisibility(item.id, item.visible)}
                                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                                                  isPaused
                                                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                                    : hasConfiguredPauseSchedule(item)
                                                                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                }`}
                                                              >
                                                                {isPaused ? (
                                                                  <>
                                                                    <MdPause className="h-3 w-3" />
                                                                    {item.schedulePaused &&
                                                                    item.visible !== 0 &&
                                                                    item.visible !== false
                                                                      ? 'Agenda'
                                                                      : 'Pausado'}
                                                                  </>
                                                                ) : hasConfiguredPauseSchedule(item) ? (
                                                                  <>
                                                                    <MdPause className="h-3 w-3" />
                                                                    Agenda configurada
                                                                  </>
                                                                ) : (
                                                                  <>
                                                                    <MdPlayArrow className="h-3 w-3" />
                                                                    Ativo
                                                                  </>
                                                                )}
                                                              </button>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                              <div className="flex items-center gap-2">
                                                                {(isAdmin || canManageBar(Number(item.barId)) || (promoterBar && menuData.bars.some((b) => Number(b.id) === Number(item.barId)))) && (
                                                                  <>
                                                                    <button
                                                                      onClick={() => handleEditItem(item)}
                                                                      className="rounded bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                                                                      title="Editar item"
                                                                    >
                                                                      <MdEdit className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                      onClick={() => handleDuplicateItem(item)}
                                                                      className="rounded bg-purple-600 p-1.5 text-white hover:bg-purple-700"
                                                                      title="Duplicar item"
                                                                    >
                                                                      <MdContentCopy className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                      onClick={() => handleDeleteItem(item.id)}
                                                                      className="rounded bg-red-600 p-1.5 text-white hover:bg-red-700"
                                                                      title="Excluir item"
                                                                    >
                                                                      <MdDelete className="h-4 w-4" />
                                                                    </button>
                                                                  </>
                                                                )}
                                                              </div>
                                                            </td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      ) : (
                                        // Se não há subcategorias, renderizar itens diretamente
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full">
                                            <thead className="bg-gray-50">
                                              <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                                  <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={categoryItems.every((item) => selectedItems.includes(item.id))}
                                                    onChange={(e) => {
                                                      if (e.target.checked) {
                                                        setSelectedItems((prev) => [
                                                          ...new Set([...prev, ...categoryItems.map((i) => i.id)]),
                                                        ]);
                                                      } else {
                                                        setSelectedItems((prev) =>
                                                          prev.filter((id) => !categoryItems.map((i) => i.id).includes(id))
                                                        );
                                                      }
                                                    }}
                                                  />
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                              {categoryItems.map((item) => {
                                                const isPaused = isItemEffectivelyPaused(item);
                                                const isEditingPrice = editingPriceId === item.id;
                                                
                                                return (
                                                  <tr
                                                    key={item.id}
                                                    className={`hover:bg-gray-50 ${isPaused ? 'opacity-60' : ''}`}
                                                  >
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                      <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={selectedItems.includes(item.id)}
                                                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                                      />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                      {item.description && (
                                                        <div className="text-xs text-gray-500 line-clamp-1">{item.description}</div>
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                      {isEditingPrice ? (
                                                        <div className="flex items-center gap-2">
                                                          <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={editingPriceValue}
                                                            onChange={(e) => setEditingPriceValue(e.target.value)}
                                                            onBlur={() => {
                                                              const newPrice = parseFloat(editingPriceValue);
                                                              if (!isNaN(newPrice) && newPrice >= 0) {
                                                                handleQuickPriceUpdate(item.id, newPrice);
                                                              }
                                                              setEditingPriceId(null);
                                                              setEditingPriceValue('');
                                                            }}
                                                            onKeyDown={(e) => {
                                                              if (e.key === 'Enter') {
                                                                const newPrice = parseFloat(editingPriceValue);
                                                                if (!isNaN(newPrice) && newPrice >= 0) {
                                                                  handleQuickPriceUpdate(item.id, newPrice);
                                                                }
                                                                setEditingPriceId(null);
                                                                setEditingPriceValue('');
                                                              } else if (e.key === 'Escape') {
                                                                setEditingPriceId(null);
                                                                setEditingPriceValue('');
                                                              }
                                                            }}
                                                            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            autoFocus
                                                          />
                                                        </div>
                                                      ) : (
                                                        <button
                                                          onClick={() => {
                                                            setEditingPriceId(item.id);
                                                            // Se for "Sob Consulta", iniciar com campo vazio
                                                            setEditingPriceValue(item.isPriceOnRequest || Number(item.price) === -1 ? '' : item.price.toString());
                                                          }}
                                                          className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
                                                        >
                                                          {formatPrice(item.price, item.isPriceOnRequest)}
                                                        </button>
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                      <button
                                                        onClick={() => handleToggleItemVisibility(item.id, item.visible)}
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                                          isPaused
                                                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                            : hasConfiguredPauseSchedule(item)
                                                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        }`}
                                                      >
                                                        {isPaused ? (
                                                          <>
                                                            <MdPause className="h-3 w-3" />
                                                            {item.schedulePaused &&
                                                            item.visible !== 0 &&
                                                            item.visible !== false
                                                              ? 'Agenda'
                                                              : 'Pausado'}
                                                          </>
                                                        ) : hasConfiguredPauseSchedule(item) ? (
                                                          <>
                                                            <MdPause className="h-3 w-3" />
                                                            Agenda configurada
                                                          </>
                                                        ) : (
                                                          <>
                                                            <MdPlayArrow className="h-3 w-3" />
                                                            Ativo
                                                          </>
                                                        )}
                                                      </button>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                      <div className="flex items-center gap-2">
                                                        {(isAdmin || canManageBar(Number(item.barId)) || (promoterBar && menuData.bars.some((b) => Number(b.id) === Number(item.barId)))) && (
                                                          <>
                                                            <button
                                                              onClick={() => handleEditItem(item)}
                                                              className="rounded bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                                                              title="Editar item"
                                                            >
                                                              <MdEdit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                              onClick={() => handleDuplicateItem(item)}
                                                              className="rounded bg-purple-600 p-1.5 text-white hover:bg-purple-700"
                                                              title="Duplicar item"
                                                            >
                                                              <MdContentCopy className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                              onClick={() => handleDeleteItem(item.id)}
                                                              className="rounded bg-red-600 p-1.5 text-white hover:bg-red-700"
                                                              title="Excluir item"
                                                            >
                                                              <MdDelete className="h-4 w-4" />
                                                            </button>
                                                          </>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bar Modal */}
        <Modal
          isOpen={showBarModal}
          onClose={handleCloseBarModal}
          title={editingBar ? 'Editar Estabelecimento' : 'Adicionar Estabelecimento'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  value={barForm.name}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  value={barForm.slug}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

          {((editingBar?.slug || barForm.slug || '').toLowerCase() === 'reserva-rooftop') && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-800">Estilo do cardápio</p>
                <p className="text-xs text-gray-500">
                  Escolha entre o visual minimalista premium (Clean) ou mantenha a versão atual (Normal).
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setBarForm((prev) => ({
                      ...prev,
                      menu_display_style: 'clean',
                    }))
                  }
                  className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                    barForm.menu_display_style === 'clean'
                      ? 'border-gray-900 bg-gray-900 text-white shadow-xl'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <p className="text-sm font-semibold">Cardápio Clean</p>
                  <p className="text-xs opacity-80">
                    Layout minimalista, foco em tipografia e destaque no item.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBarForm((prev) => ({
                      ...prev,
                      menu_display_style: 'normal',
                    }))
                  }
                  className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                    barForm.menu_display_style === 'normal'
                      ? 'border-gray-900 bg-white text-gray-900 shadow-lg'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <p className="text-sm font-semibold">Cardápio Normal</p>
                  <p className="text-xs opacity-70">Mantém o visual atual do cardápio.</p>
                </button>
              </div>
            </div>
          )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                value={barForm.description}
                onChange={(e) => setBarForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Logo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barForm.logoUrl}
                    onChange={(e) => setBarForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="Nome do arquivo (ex: ABC123.jpg)"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => selectImageFile('logoUrl')}
                    className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                  >
                    <MdUpload className="h-4 w-4" />
                  </button>
                </div>
                {barForm.logoUrl && barForm.logoUrl.trim() !== '' && (
                  <div className="mt-2">
                    <Image
                      src={getValidImageUrl(barForm.logoUrl)}
                      alt="Preview do logo"
                      width={100}
                      height={100}
                      className="rounded-lg border object-cover"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE_URL;
                      }}
                      unoptimized={barForm.logoUrl.startsWith('blob:') || barForm.logoUrl.startsWith('https://res.cloudinary.com')}
                      priority={true}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Imagens de Capa (Carrossel)
                </label>
                <div className="mb-2 flex items-center gap-2">
                  <button
                    onClick={() => selectImageFile('coverImages')}
                    className="flex w-full items-center justify-center gap-1 rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                  >
                    <MdAdd className="h-4 w-4" />
                    Adicionar Imagem(ns)
                  </button>
                </div>
                {barForm.coverImages.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {barForm.coverImages.map((imageUrl, index) => (
                      <div key={index} className="group relative">
                        <Image
                          src={getValidImageUrl(imageUrl)}
                          alt={`Preview da imagem de capa ${index + 1}`}
                          width={200}
                          height={100}
                          className="rounded-lg border object-cover"
                          onError={(e) => {
                            e.currentTarget.src = PLACEHOLDER_IMAGE_URL;
                          }}
                          unoptimized={imageUrl.startsWith('blob:') || imageUrl.startsWith('https://res.cloudinary.com')}
                          priority={true}
                        />
                        <button
                          onClick={() => handleRemoveCoverImage(imageUrl)}
                          className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MdClose className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
              <label className="mb-1 block text-sm font-semibold text-gray-800">
                Parceiros
              </label>
              <p className="mb-3 text-xs text-gray-500">
                Até 5 logos exibidos no cardápio público, entre o banner e o menu de categorias.
              </p>
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if ((barForm.partner_logos || []).length >= 5) {
                      alert('Limite de 5 logos de parceiros.');
                      return;
                    }
                    selectImageFile('partner_logos');
                  }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  disabled={(barForm.partner_logos || []).length >= 5}
                >
                  <MdAdd className="h-4 w-4" />
                  Adicionar logo
                </button>
                <span className="text-xs text-gray-500">
                  {(barForm.partner_logos || []).length}/5
                </span>
              </div>
              {(barForm.partner_logos || []).length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(barForm.partner_logos || []).map((url, index) => (
                    <div key={`${url}-${index}`} className="group relative">
                      <Image
                        src={getValidImageUrl(url)}
                        alt={`Logo parceiro ${index + 1}`}
                        width={160}
                        height={80}
                        className="h-16 w-full rounded-lg border border-gray-200 bg-white object-contain p-2"
                        onError={(e) => {
                          e.currentTarget.src = PLACEHOLDER_IMAGE_URL;
                        }}
                        unoptimized={
                          url.startsWith('blob:') ||
                          url.startsWith('https://res.cloudinary.com')
                        }
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePartnerLogo(url)}
                        className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        title="Remover"
                      >
                        <MdClose className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ✨ Campo de Upload para a Imagem do Popup */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Imagem do Popup
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barForm.popupImageUrl}
                  onChange={(e) =>
                    setBarForm((prev) => ({ ...prev, popupImageUrl: e.target.value }))
                  }
                  placeholder="Nome do arquivo (ex: popup.jpg)"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => selectImageFile('popupImageUrl')}
                  className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                >
                  <MdUpload className="h-4 w-4" />
                </button>
              </div>
              {barForm.popupImageUrl && barForm.popupImageUrl.trim() !== '' && (
                <div className="mt-2">
                  <Image
                    src={getValidImageUrl(barForm.popupImageUrl)}
                    alt="Preview do popup"
                    width={200}
                    height={150}
                    className="rounded-lg border object-contain"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_IMAGE_URL;
                    }}
                    unoptimized={barForm.popupImageUrl.startsWith('blob:') || barForm.popupImageUrl.startsWith('https://res.cloudinary.com')}
                    priority={true}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Endereço</label>
              <input
                type="text"
                value={barForm.address}
                onChange={(e) => setBarForm((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* **NOVO**: Campos de links sociais */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Facebook</label>
                <input
                  type="text"
                  value={barForm.facebook}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, facebook: e.target.value }))}
                  placeholder="Link do Facebook"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Instagram</label>
                <input
                  type="text"
                  value={barForm.instagram}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, instagram: e.target.value }))}
                  placeholder="Link do Instagram"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">WhatsApp</label>
                <input
                  type="text"
                  value={barForm.whatsapp}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="Link do WhatsApp"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Avaliação</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={barForm.rating}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, rating: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Número de Avaliações
                </label>
                <input
                  type="number"
                  min="0"
                  value={barForm.reviewsCount}
                  onChange={(e) =>
                    setBarForm((prev) => ({ ...prev, reviewsCount: e.target.value }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={barForm.latitude}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, latitude: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                value={barForm.longitude}
                onChange={(e) => setBarForm((prev) => ({ ...prev, longitude: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 🎨 Seção de Personalização de Cores */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🎨 Personalização de Cores do Menu</h3>
              
              {/* Cores das Categorias */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📂 Categorias</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Cor de Fundo das Categorias
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={barForm.menu_category_bg_color || '#3b82f6'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, menu_category_bg_color: e.target.value }))}
                        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={barForm.menu_category_bg_color || '#3b82f6'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, menu_category_bg_color: e.target.value }))}
                        placeholder="#3b82f6"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Cor do Texto das Categorias
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={barForm.menu_category_text_color || '#ffffff'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, menu_category_text_color: e.target.value }))}
                        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={barForm.menu_category_text_color || '#ffffff'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, menu_category_text_color: e.target.value }))}
                        placeholder="#ffffff"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cores das Subcategorias */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Subcategorias</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Cor de Fundo das Subcategorias
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={barForm.menu_subcategory_bg_color || '#f3f4f6'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, menu_subcategory_bg_color: e.target.value }))}
                        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={barForm.menu_subcategory_bg_color || '#f3f4f6'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, menu_subcategory_bg_color: e.target.value }))}
                        placeholder="#f3f4f6"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Cor do Texto das Subcategorias
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={barForm.menu_subcategory_text_color || '#374151'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, menu_subcategory_text_color: e.target.value }))}
                        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={barForm.menu_subcategory_text_color || '#374151'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, menu_subcategory_text_color: e.target.value }))}
                        placeholder="#374151"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cores do Sidebar Mobile */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📱 Sidebar Mobile (Menu Lateral)</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Cor de Fundo do Sidebar
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={barForm.mobile_sidebar_bg_color || '#667eea'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, mobile_sidebar_bg_color: e.target.value }))}
                        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={barForm.mobile_sidebar_bg_color || '#667eea'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, mobile_sidebar_bg_color: e.target.value }))}
                        placeholder="#667eea"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Cor do Texto do Sidebar
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={barForm.mobile_sidebar_text_color || '#ffffff'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, mobile_sidebar_text_color: e.target.value }))}
                        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={barForm.mobile_sidebar_text_color || '#ffffff'}
                        onChange={(e) => setBarForm((prev) => ({ ...prev, mobile_sidebar_text_color: e.target.value }))}
                        placeholder="#ffffff"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🏷️ Seção de Gerenciamento de Selos */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🏷️ Gerenciamento de Selos</h3>
              <p className="text-sm text-gray-600 mb-4">
                Personalize as cores dos selos padrão e crie novos selos customizados para seu estabelecimento.
              </p>

              {/* Selos de Comida */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">🍽️ Selos de Comida</h4>
                  <button
                    onClick={() => handleAddCustomSeal('food')}
                    className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                  >
                    <MdAdd className="h-4 w-4" />
                    Novo Selo
                  </button>
                </div>
                <div className="space-y-3">
                  {FOOD_SEALS.map((seal) => {
                    const customSeal = (barForm.custom_seals || []).find((s) => s.id === seal.id);
                    const displaySeal = customSeal || seal;
                    return (
                      <div key={seal.id} className="flex items-center gap-3 rounded-md border border-gray-200 p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="h-4 w-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: displaySeal.color }}
                            />
                            <span className="text-sm font-medium text-gray-700">{seal.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={displaySeal.color}
                            onChange={(e) => handleUpdateDefaultSealColor(seal.id, e.target.value)}
                            className="h-8 w-16 rounded border border-gray-300 cursor-pointer"
                            title="Alterar cor"
                          />
                          <input
                            type="text"
                            value={displaySeal.color}
                            onChange={(e) => handleUpdateDefaultSealColor(seal.id, e.target.value)}
                            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="#hex"
                          />
                        </div>
                      </div>
                    );
                  })}
                  {/* Selos customizados de comida */}
                  {(barForm.custom_seals || [])
                    .filter((s) => s.type === 'food' && !FOOD_SEALS.find((ds) => ds.id === s.id))
                    .map((seal) => (
                      <div key={seal.id} className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={seal.name}
                            onChange={(e) => handleUpdateCustomSeal(seal.id, 'name', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nome do selo"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={seal.color}
                            onChange={(e) => handleUpdateCustomSeal(seal.id, 'color', e.target.value)}
                            className="h-8 w-16 rounded border border-gray-300 cursor-pointer"
                            title="Alterar cor"
                          />
                          <input
                            type="text"
                            value={seal.color}
                            onChange={(e) => handleUpdateCustomSeal(seal.id, 'color', e.target.value)}
                            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="#hex"
                          />
                          <button
                            onClick={() => handleRemoveCustomSeal(seal.id)}
                            className="rounded-md bg-red-600 p-1.5 text-white hover:bg-red-700"
                            title="Remover selo"
                          >
                            <MdDelete className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Selos de Bebida */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">🥤 Selos de Bebida</h4>
                  <button
                    onClick={() => handleAddCustomSeal('drink')}
                    className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                  >
                    <MdAdd className="h-4 w-4" />
                    Novo Selo
                  </button>
                </div>
                <div className="space-y-3">
                  {DRINK_SEALS.map((seal) => {
                    const customSeal = (barForm.custom_seals || []).find((s) => s.id === seal.id);
                    const displaySeal = customSeal || seal;
                    return (
                      <div key={seal.id} className="flex items-center gap-3 rounded-md border border-gray-200 p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="h-4 w-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: displaySeal.color }}
                            />
                            <span className="text-sm font-medium text-gray-700">{seal.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={displaySeal.color}
                            onChange={(e) => handleUpdateDefaultSealColor(seal.id, e.target.value)}
                            className="h-8 w-16 rounded border border-gray-300 cursor-pointer"
                            title="Alterar cor"
                          />
                          <input
                            type="text"
                            value={displaySeal.color}
                            onChange={(e) => handleUpdateDefaultSealColor(seal.id, e.target.value)}
                            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="#hex"
                          />
                        </div>
                      </div>
                    );
                  })}
                  {/* Selos customizados de bebida */}
                  {(barForm.custom_seals || [])
                    .filter((s) => s.type === 'drink' && !DRINK_SEALS.find((ds) => ds.id === s.id))
                    .map((seal) => (
                      <div key={seal.id} className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={seal.name}
                            onChange={(e) => handleUpdateCustomSeal(seal.id, 'name', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nome do selo"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={seal.color}
                            onChange={(e) => handleUpdateCustomSeal(seal.id, 'color', e.target.value)}
                            className="h-8 w-16 rounded border border-gray-300 cursor-pointer"
                            title="Alterar cor"
                          />
                          <input
                            type="text"
                            value={seal.color}
                            onChange={(e) => handleUpdateCustomSeal(seal.id, 'color', e.target.value)}
                            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="#hex"
                          />
                          <button
                            onClick={() => handleRemoveCustomSeal(seal.id)}
                            className="rounded-md bg-red-600 p-1.5 text-white hover:bg-red-700"
                            title="Remover selo"
                          >
                            <MdDelete className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleCloseBarModal}
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveBar()}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </Modal>

        {/* Category Modal */}
        <Modal
          isOpen={showCategoryModal}
          onClose={handleCloseCategoryModal}
          title={editingCategory ? 'Editar Categoria' : 'Adicionar Categoria'}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome da Categoria
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Estabelecimento
              </label>
              <select
                value={categoryForm.barId}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, barId: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um estabelecimento</option>
                {menuData.bars.map((bar) => (
                  <option key={bar.id} value={bar.id}>
                    {bar.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ordem</label>
              <input
                type="number"
                min="0"
                value={categoryForm.order}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, order: parseInt(e.target.value) }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sub-categorias */}
            <div className="border-t pt-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Subcategorias</label>
                <button
                  type="button"
                  onClick={addCategorySubCategory}
                  className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                >
                  <MdAdd className="h-4 w-4" />
                  Adicionar
                </button>
              </div>

              <div className="max-h-96 space-y-2 overflow-y-auto">
                {categoryForm.subCategories.map((subCategory, index) => (
                  <div
                    key={`${subCategory.id ?? 'new'}-${index}`}
                    className={`flex items-center gap-2 rounded-lg border p-3 ${
                      !isPersistedSubcategoryId(subCategory.id) && !subCategory.originalName
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-xs font-medium">#{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => index > 0 && reorderCategorySubCategories(index, index - 1)}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Mover para cima"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          index < categoryForm.subCategories.length - 1 &&
                          reorderCategorySubCategories(index, index + 1)
                        }
                        disabled={index === categoryForm.subCategories.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Mover para baixo"
                      >
                        ↓
                      </button>
                    </div>

                    <input
                      type="text"
                      value={subCategory.name || ''}
                      onChange={(e) => updateCategorySubCategory(index, 'name', e.target.value)}
                      placeholder="Nome da subcategoria"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex h-9 w-14 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
                      {index + 1}
                    </div>

                    <div
                      className={`rounded px-2 py-1 text-xs ${
                        subCategory.count && subCategory.count > 0
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {subCategory.count || 0} item(s)
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCategorySubCategory(index)}
                      className="px-2 py-2 text-red-600 hover:text-red-800"
                      title={
                        isPersistedSubcategoryId(subCategory.id)
                          ? 'Excluir subcategoria'
                          : 'Remover subcategoria'
                      }
                    >
                      <MdDelete className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {categoryForm.subCategories.length === 0 && (
                  <p className="text-sm italic text-gray-500">Nenhuma subcategoria adicionada.</p>
                )}
              </div>

              {(() => {
                const changes = getCategorySubcategoryChangesSummary();
                if (changes.added === 0 && changes.modified === 0) return null;
                return (
                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    {changes.added > 0 && <span className="mr-3">+{changes.added} nova(s)</span>}
                    {changes.modified > 0 && <span>~{changes.modified} modificada(s)</span>}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleCloseCategoryModal}
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveCategory()}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </Modal>

        {/* Item Modal */}
        <Modal
          isOpen={showItemModal}
          onClose={handleCloseItemModal}
          title={editingItem ? 'Editar Item' : 'Adicionar Item'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nome do Item
                </label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Preço</label>
                <div className="space-y-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.price}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, price: e.target.value }))}
                    disabled={itemForm.isPriceOnRequest}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={itemForm.isPriceOnRequest || false}
                      onChange={(e) => {
                        setItemForm((prev) => ({
                          ...prev,
                          isPriceOnRequest: e.target.checked,
                          price: e.target.checked ? '' : prev.price,
                        }));
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Sob Consulta</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                value={itemForm.description}
                onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_140px] admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nome do arquivo da imagem do item
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={itemForm.imageUrl}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="Nome do arquivo (ex: ABC123.jpg)"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => openImageGallery('imageUrl')}
                    className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                    title="Abrir galeria de imagens"
                  >
                    <MdUpload className="h-4 w-4" />
                    Galeria
                  </button>
                </div>
                {itemForm.imageUrl && itemForm.imageUrl.trim() !== '' && (
                  <div className="mt-2">
                    <Image
                      src={getValidImageUrl(itemForm.imageUrl)}
                      alt="Preview da imagem do item"
                      width={150}
                      height={100}
                      className="rounded-lg border object-cover"
                      unoptimized={itemForm.imageUrl.startsWith('blob:') || itemForm.imageUrl.includes('cloudinary.com')}
                      priority={true}
                      key={itemForm.imageUrl} // Forçar re-render quando a URL mudar
                      onError={(e) => {
                        console.error('❌ Erro ao carregar imagem:', itemForm.imageUrl);
                        console.error('URL usada:', getValidImageUrl(itemForm.imageUrl));
                        // Em caso de erro, tentar usar a URL diretamente
                        const target = e.target as HTMLImageElement;
                        if (target.src !== itemForm.imageUrl && itemForm.imageUrl.startsWith('http')) {
                          target.src = itemForm.imageUrl;
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ordem</label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.order}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, order: parseInt(e.target.value) }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Estabelecimento
                </label>
                <select
                  value={itemForm.barId}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, barId: e.target.value, categoryId: '' }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um estabelecimento</option>
                  {menuData.bars.map((bar) => (
                    <option key={bar.id} value={bar.id}>
                      {bar.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!itemForm.barId}
                >
                  <option value="">Selecione uma categoria</option>
                  {menuData.categories
                    .filter((cat) => cat.barId?.toString() === itemForm.barId)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Subcategoria</label>
              <select
                value={itemForm.subCategory}
                onChange={(e) => setItemForm((prev) => ({ ...prev, subCategory: e.target.value }))}
                disabled={!itemForm.categoryId}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">Selecione uma sub-categoria (opcional)</option>
                {availableSubCategories.map((subCategory) => (
                  <option key={subCategory.name} value={subCategory.name}>
                    {subCategory.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {itemForm.categoryId
                  ? availableSubCategories.length > 0
                    ? 'Selecione uma sub-categoria da lista ou deixe em branco'
                    : 'Nenhuma sub-categoria disponível para esta categoria. Crie subcategorias na aba Categorias.'
                  : 'Selecione uma categoria primeiro'}
              </p>
            </div>

            {/* Toppings */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Adicionais</label>
              <div className="space-y-2">
                {itemForm.toppings.map((topping) => (
                  <div key={topping.id} className="flex items-center gap-2 rounded-md bg-gray-50 p-2">
                    <span className="flex-1 text-sm">{topping.name}</span>
                    <span className="text-sm font-medium text-green-600">
                      +{formatPrice(topping.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEditTopping(topping)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopping(topping.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <MdClose className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome do adicional"
                    value={newTopping.name}
                    onChange={(e) => setNewTopping((prev) => ({ ...prev, name: e.target.value }))}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Preço"
                    value={newTopping.price}
                    onChange={(e) => setNewTopping((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-24 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddTopping}
                    className="flex items-center rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                  >
                    <MdAdd className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Seção de Selos */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Selos</label>
              <div className="space-y-4">
                {/* Selos de Comida */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Comida</h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(() => {
                      // Busca o bar atual para pegar os selos customizados
                      const currentBar = menuData.bars.find((bar) => bar.id.toString() === itemForm.barId.toString());
                      const customSeals = currentBar?.custom_seals || [];
                      
                      // Combina selos padrão e customizados
                      const allFoodSeals = [
                        ...FOOD_SEALS.map((seal) => {
                          const customSeal = customSeals.find((s) => s.id === seal.id);
                          return customSeal || seal;
                        }),
                        ...customSeals.filter((s) => s.type === 'food' && !FOOD_SEALS.find((ds) => ds.id === s.id)),
                      ];
                      
                      return allFoodSeals.map((seal) => {
                        const sealInfo = getSealById(seal.id) || seal;
                        return (
                          <label
                            key={seal.id}
                            className="flex cursor-pointer items-center space-x-2 rounded-md border p-2 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={itemForm.seals.includes(seal.id)}
                              onChange={() => handleToggleSeal(seal.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: sealInfo.color }}
                            />
                            <span className="text-sm text-gray-700">{sealInfo.name}</span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Selos de Bebida */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Bebida</h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(() => {
                      // Busca o bar atual para pegar os selos customizados
                      const currentBar = menuData.bars.find((bar) => bar.id.toString() === itemForm.barId.toString());
                      const customSeals = currentBar?.custom_seals || [];
                      
                      // Combina selos padrão e customizados
                      const allDrinkSeals = [
                        ...DRINK_SEALS.map((seal) => {
                          const customSeal = customSeals.find((s) => s.id === seal.id);
                          return customSeal || seal;
                        }),
                        ...customSeals.filter((s) => s.type === 'drink' && !DRINK_SEALS.find((ds) => ds.id === s.id)),
                      ];
                      
                      return allDrinkSeals.map((seal) => {
                        const sealInfo = getSealById(seal.id) || seal;
                        return (
                          <label
                            key={seal.id}
                            className="flex cursor-pointer items-center space-x-2 rounded-md border p-2 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={itemForm.seals.includes(seal.id)}
                              onChange={() => handleToggleSeal(seal.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: sealInfo.color }}
                            />
                            <span className="text-sm text-gray-700">{sealInfo.name}</span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Vinhos - País */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Vinho - País</h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {WINE_COUNTRIES.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 rounded border p-2">
                        <input
                          type="checkbox"
                          checked={itemForm.seals.includes(c.id)}
                          onChange={() => handleToggleSeal(c.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-lg">{c.emoji}</span>
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Vinhos - Tipo */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Vinho - Tipo</h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {WINE_TYPES.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 rounded border p-2">
                        <input
                          type="checkbox"
                          checked={itemForm.seals.includes(t.id)}
                          onChange={() => handleToggleSeal(t.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: t.color }} />
                        <span>{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Vinhos - Safra */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Vinho - Safra</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ex: 2018"
                      onChange={(e) => {
                        const id = `vinho:safra:${e.target.value.trim()}`;
                        // Atualiza selos substituindo qualquer safra anterior
                        setItemForm((prev) => ({
                          ...prev,
                          seals: [
                            ...prev.seals.filter((s) => !s.startsWith('vinho:safra:')),
                            ...(e.target.value.trim() ? [id] : []),
                          ],
                        }));
                      }}
                      className="w-40 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500 text-sm">Use apenas números do ano</span>
                  </div>
                </div>

                {/* Vinhos - Local */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Vinho - Local</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Vale dos Vinhedos - RS"
                      onChange={(e) => {
                        const val = encodeURIComponent(e.target.value.trim());
                        const id = `vinho:local:${val}`;
                        setItemForm((prev) => ({
                          ...prev,
                          seals: [
                            ...prev.seals.filter((s) => !s.startsWith('vinho:local:')),
                            ...(e.target.value.trim() ? [id] : []),
                          ],
                        }));
                      }}
                      className="w-80 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500 text-sm">Cidade/Região/Denominação</span>
                  </div>
                </div>

                {/* Preview dos selos selecionados */}
                {itemForm.seals.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-600">Preview dos Selos Selecionados</h4>
                    <div className="flex flex-wrap gap-2">
                      {itemForm.seals.map((sealId) => {
                        const seal = getSealById(sealId);
                        if (!seal) return null;
                        return (
                          <span
                            key={sealId}
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                            style={{ backgroundColor: seal.color }}
                          >
                            {seal.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleCloseItemModal}
              className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleSaveItem()}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </Modal>

        {/* Image Gallery Modal */}
        <Modal
          isOpen={showImageGalleryModal}
          onClose={() => {
            setShowImageGalleryModal(false);
            setImageGalleryField('');
            setGallerySearchTerm('');
          }}
          title="Galeria de Imagens"
        >
          <div className="space-y-4">
            {/* Header com busca e ações */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar imagens por nome..."
                  value={gallerySearchTerm}
                  onChange={(e) => setGallerySearchTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files[0]) {
                      // Preservar o imageGalleryField antes de abrir o crop
                      const currentGalleryField = imageGalleryField;
                      console.log('📸 Iniciando upload da galeria com campo:', currentGalleryField);
                      await handleImageUpload(files[0], currentGalleryField);
                      // Não atualizar a galeria aqui, será feito após o upload completo
                    }
                  };
                  input.click();
                }}
                className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors shadow-sm"
              >
                <MdUpload className="h-5 w-5" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              {galleryLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 px-4">
                  <span className="animate-spin">⏳</span>
                  <span className="hidden sm:inline">Carregando...</span>
                </div>
              )}
            </div>

            {/* Estatísticas */}
            {!galleryLoading && galleryImages.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <span className="font-medium">
                  📊 {galleryImages.length} imagem{galleryImages.length !== 1 ? 's' : ''} na galeria
                </span>
                {gallerySearchTerm && (
                  <span className="text-blue-600">
                    {galleryImages.filter(img => 
                      img.filename.toLowerCase().includes(gallerySearchTerm.toLowerCase())
                    ).length} resultado(s) para "{gallerySearchTerm}"
                  </span>
                )}
              </div>
            )}

            {/* Grid de imagens */}
            {galleryLoading ? (
              <div className="flex justify-center items-center py-12">
                <span className="text-gray-500">Carregando imagens...</span>
              </div>
            ) : galleryImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <MdUpload className="h-12 w-12 mb-4 text-gray-300" />
                <p>Nenhuma imagem encontrada.</p>
                <p className="text-sm mt-1">Faça upload de uma imagem para começar.</p>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600 mb-2">
                  {galleryImages.filter(img => 
                    !gallerySearchTerm || 
                    img.filename.toLowerCase().includes(gallerySearchTerm.toLowerCase())
                  ).length} imagem(s) encontrada(s)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto p-1">
                  {galleryImages
                    .filter(img => 
                      !gallerySearchTerm || 
                      img.filename.toLowerCase().includes(gallerySearchTerm.toLowerCase())
                    )
                    .map((image, index) => {
                      // A imagem já foi processada no fetchGalleryImages:
                      // - image.url (Firebase/Cloudinary/etc) quando disponível
                      // - fallback via getValidImageUrl(image.filename) usando o índice local
                      const imageUrl = getValidImageUrl((image.url as any) || image.filename);
                      
                      // Persistência: sempre preferir salvar o filename/objectPath (estável).
                      // Preview: usar thumb quando existir.
                      const selectUrl = (image as any).fullUrl || (image as any).url || null;
                      
                      // Log apenas para as primeiras imagens para não poluir o console
                      if (index < 3) {
                        console.log('🖼️ Exibindo imagem na galeria:', {
                          index,
                          filename: image.filename,
                          imageUrl: image.url,
                          finalImageUrl: imageUrl,
                          selectUrl,
                          isFirebase: imageUrl.includes('firebasestorage.googleapis.com')
                        });
                      }
                      
                      return (
                        <div
                          key={`${image.filename}-${index}`}
                          className="relative group cursor-pointer rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all overflow-hidden shadow-md hover:shadow-lg"
                        onClick={() => handleSelectGalleryImage(image.filename, selectUrl)}
                        >
                          <div className="aspect-square relative bg-gray-100">
                            <Image
                              src={imageUrl}
                              alt={image.filename}
                              fill
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                              className="object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                console.error('❌ Erro ao carregar imagem:', imageUrl, 'para', image.filename);
                                e.currentTarget.src = PLACEHOLDER_IMAGE_URL;
                              }}
                              onLoad={() => {
                                if (index < 3) {
                                  console.log('✅ Imagem carregada com sucesso:', imageUrl);
                                }
                              }}
                              unoptimized={true}
                            />
                          </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute inset-0 flex items-center justify-center gap-2">
                            <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
                              Selecionar
                            </span>
                            <button
                              onClick={(e) => handleDeleteGalleryImage(image.filename, e)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                              title="Deletar imagem"
                            >
                              <MdDelete className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-2">
                          <p className="truncate font-medium">{image.filename}</p>
                          {image.sourceType && (
                            <p className="text-xs text-gray-300 mt-0.5">
                              {image.sourceType === 'menu_item' ? 'Item' : 'Bar'} • {image.usageCount}x usado
                            </p>
                          )}
                        </div>
                        {image.usageCount > 1 && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-lg font-semibold">
                            {image.usageCount}x
                          </div>
                        )}
                      </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Trash Modal - Lixeira */}
        <Modal
          isOpen={showTrashModal}
          onClose={() => {
            setShowTrashModal(false);
          }}
          title="Lixeira - Itens Deletados"
        >
          <div className="space-y-4">
            {trashLoading ? (
              <div className="flex justify-center items-center py-12">
                <span className="text-gray-500">Carregando itens deletados...</span>
              </div>
            ) : trashItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <MdDeleteOutline className="h-12 w-12 mb-4 text-gray-300" />
                <p>A lixeira está vazia.</p>
                <p className="text-sm mt-1">Itens deletados aparecerão aqui por até 30 dias.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Atenção:</strong> Os itens na lixeira serão excluídos permanentemente após 30 dias. 
                    Você pode restaurá-los clicando no botão "Restaurar".
                  </p>
                  {trashItems.filter(item => item.daysDeleted >= 25 && item.daysDeleted < 30).length > 0 && (
                    <p className="text-sm text-orange-800 mt-2">
                      <strong>⚠️ Urgente:</strong> {trashItems.filter(item => item.daysDeleted >= 25 && item.daysDeleted < 30).length} item(s) expirando em breve (mais de 25 dias deletados)!
                    </p>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {trashItems.length} item(s) deletado(s) na lixeira
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                  {trashItems.map((item) => {
                    const category = menuData.categories.find((c) => c.id === item.categoryId);
                    const daysRemaining = Math.max(0, 30 - item.daysDeleted);
                    const isExpiringSoon = item.daysDeleted >= 25;

                    return (
                      <div
                        key={item.id}
                        className={`relative overflow-hidden rounded-lg bg-white border-2 shadow-md ${
                          isExpiringSoon ? 'border-orange-300' : 'border-gray-200'
                        }`}
                      >
                        <div className="relative h-32">
                          {(() => {
                            const imageUrl = getValidImageUrl(item.imageUrl);
                            const isBlob = imageUrl.startsWith('blob:');
                            
                            if (isBlob) {
                              return (
                                <img
                                  src={imageUrl}
                                  alt={item.name}
                                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                                  onError={(e) => {
                                    console.error('❌ Erro ao carregar imagem blob do item na lixeira:', item.name, item.imageUrl);
                                    const target = e.currentTarget;
                                    target.src = PLACEHOLDER_IMAGE_URL;
                                  }}
                                />
                              );
                            }
                            
                            return (
                              <Image
                                src={imageUrl}
                                alt={item.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover opacity-60"
                                unoptimized={item.imageUrl?.includes('cloudinary.com') || false}
                                onError={(e) => {
                                  console.error('❌ Erro ao carregar imagem do item na lixeira:', item.name, item.imageUrl);
                                  const target = e.currentTarget;
                                  if (item.imageUrl?.includes('cloudinary.com') && target.src !== item.imageUrl) {
                                    target.src = item.imageUrl;
                                  } else {
                                    target.src = PLACEHOLDER_IMAGE_URL;
                                  }
                                }}
                              />
                            );
                          })()}
                          {isExpiringSoon && (
                            <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                              Expirando em {Math.ceil(daysRemaining)} dia(s)
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                            {Math.floor(item.daysDeleted)} dia(s) atrás
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-gray-900">
                            {item.name}
                          </h3>
                          <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                            {item.description}
                          </p>
                          <div className="mb-3 text-xs text-gray-500">
                            <p>Categoria: {category?.name || 'N/A'}</p>
                            <p className="mt-1">
                              Deletado em: {new Date(item.deletedAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {item.canRestore ? (
                              <button
                                onClick={() => handleRestoreItem(item.id)}
                                className="flex-1 flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                                title="Restaurar item"
                              >
                                <MdRestore className="h-4 w-4" />
                                Restaurar
                              </button>
                            ) : (
                              <div className="flex-1 rounded-md bg-gray-300 px-3 py-2 text-sm text-gray-600 text-center">
                                Expirado
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Image Crop Modal */}
        <ImageCropModal
          isOpen={showCropModal}
          imageSrc={cropImageSrc}
          onClose={() => {
            setShowCropModal(false);
            if (cropImageSrc && cropImageSrc.startsWith('blob:')) {
              URL.revokeObjectURL(cropImageSrc);
            }
            setCropImageSrc('');
            setCropImageField('');
          }}
          onCropComplete={handleCropComplete}
          aspectRatio={1} // Quadrado obrigatório
          minZoom={1}
          maxZoom={3}
        />

        <MenuPauseScheduleModal
          isOpen={pauseModalOpen}
          onClose={() => setPauseModalOpen(false)}
          itemCount={selectedItems.length}
          scopeLabel={pauseModalScopeLabel}
          initialMode={pauseModalMode}
          initialWindows={pauseModalInitialWindows}
          onConfirm={handlePauseModalConfirm}
        />
      </div>

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
      `}</style>
    </div>
  );
}