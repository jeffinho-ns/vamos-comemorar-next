import type { IconType } from "react-icons";
import {
  MdAdminPanelSettings,
  MdChat,
  MdCheckCircle,
  MdEvent,
  MdGroup,
  MdRestaurant,
} from "react-icons/md";

export interface NavLinkItem {
  href: string;
  label: string;
  icon: IconType;
}

export interface NavGroupItem {
  label: string;
  icon: IconType;
  children: NavLinkItem[];
}

export type NavItem = NavLinkItem | NavGroupItem;

export function isNavGroup(item: NavItem): item is NavGroupItem {
  return "children" in item;
}

/** Ordem dos grupos na sidebar (Dashboard fica fora). */
const NAV_GROUP_DEFS: ReadonlyArray<{
  label: string;
  icon: IconType;
  hrefs: readonly string[];
}> = [
  {
    label: "Operações",
    icon: MdCheckCircle,
    hrefs: [
      "/admin/checkins",
      "/admin/checkins/rooftop-fluxo",
      "/admin/qrcode",
      "/admin/reservas",
      "/admin/restaurant-reservations",
      "/admin/workdays",
    ],
  },
  {
    label: "Eventos",
    icon: MdEvent,
    hrefs: [
      "/admin/eventos",
      "/admin/eventos/dashboard",
      "/admin/eventos/listas",
      "/admin/eventos/promoters",
      "/admin/painel-eventos",
      "/admin/detalhes-operacionais",
    ],
  },
  {
    label: "Cardápio",
    icon: MdRestaurant,
    hrefs: ["/admin/cardapio", "/admin/commodities", "/admin/galeria"],
  },
  {
    label: "Comunicação",
    icon: MdChat,
    hrefs: ["/admin/whatsapp"],
  },
  {
    label: "People & Ops",
    icon: MdGroup,
    hrefs: [
      "/admin/justino360",
      "/admin/rh-ideia",
      "/admin/users",
      "/admin/equipe",
    ],
  },
  {
    label: "Configurações",
    icon: MdAdminPanelSettings,
    hrefs: [
      "/admin/enterprise",
      "/admin/gifts",
      "/admin/guia",
      "/admin/logs",
      "/superadmin",
    ],
  },
];

const DASHBOARD_HREF = "/admin";

/** Agrupa links flat preservando ordem dentro de cada grupo; grupo com 1 filho vira top-level. */
export function groupNavLinks(links: NavLinkItem[]): NavItem[] {
  const hrefToLink = new Map(links.map((l) => [l.href, l]));
  const usedHrefs = new Set<string>();
  const result: NavItem[] = [];

  const dashboard = hrefToLink.get(DASHBOARD_HREF);
  if (dashboard) {
    result.push(dashboard);
    usedHrefs.add(DASHBOARD_HREF);
  }

  for (const group of NAV_GROUP_DEFS) {
    const children: NavLinkItem[] = [];
    for (const href of group.hrefs) {
      const link = hrefToLink.get(href);
      if (link) {
        children.push(link);
        usedHrefs.add(href);
      }
    }

    if (children.length === 0) continue;
    if (children.length === 1) {
      result.push(children[0]);
    } else {
      result.push({ label: group.label, icon: group.icon, children });
    }
  }

  for (const link of links) {
    if (!usedHrefs.has(link.href)) {
      result.push(link);
      usedHrefs.add(link.href);
    }
  }

  return result;
}

export function flattenNavLinks(items: NavItem[]): NavLinkItem[] {
  return items.flatMap((item) => (isNavGroup(item) ? item.children : [item]));
}

export function isNavLinkActive(
  pathname: string,
  href: string,
  atendimentoHref = "/admin/whatsapp",
): boolean {
  if (pathname === href) return true;
  if (href !== DASHBOARD_HREF && pathname.startsWith(href)) return true;
  if (
    href === atendimentoHref &&
    pathname.startsWith("/admin/estabelecimentos")
  ) {
    return true;
  }
  return false;
}
