import type { EstablishmentPermissionKey } from "@/app/config/establishmentPermissionCatalog";

export type OrgUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type MembershipRow = {
  id: number;
  user_id?: number;
  user_email: string;
  user_name: string;
  role_key: string;
  role_name: string;
  establishment_id: number | null;
  establishment_name: string | null;
  is_active: boolean;
};

export type EstablishmentRow = {
  id: number;
  name: string;
  legacy_place_id: number | null;
  legacy_bar_id: number | null;
};

export type ModuleCatalogItem = { key: string; name: string };

export type EstablishmentPermission = {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  establishment_id: number;
  establishment_name: string;
  canonical_establishment_id: number;
  is_active: boolean;
} & Partial<Record<EstablishmentPermissionKey, boolean>>;

export const MODULE_LABELS: Record<string, string> = {
  reservas: "Reservas",
  checkin: "Check-in",
  cardapio: "Cardápio",
  whatsapp: "WhatsApp / IA",
  eventos: "Eventos",
  promoters: "Promoters",
  relatorios: "Relatórios",
};

export const SAAS_ROLE_OPTIONS = [
  { value: "account_admin", label: "Account Admin" },
  { value: "gerente_bar", label: "Gerente do Bar" },
  { value: "recepcao", label: "Recepção" },
  { value: "hostess", label: "Hostess" },
  { value: "promoter", label: "Promoter" },
];
