/** Catálogo único de permissões UEP — Super Admin e /admin/users. */

export type EstablishmentPermissionKey =
  | "can_manage_reservations"
  | "can_create_edit_reservations"
  | "can_manage_checkins"
  | "can_manage_whatsapp"
  | "can_configure_ia"
  | "can_view_cardapio"
  | "can_create_cardapio"
  | "can_edit_cardapio"
  | "can_delete_cardapio"
  | "can_view_os"
  | "can_download_os"
  | "can_create_os"
  | "can_edit_os"
  | "can_view_operational_detail"
  | "can_create_operational_detail"
  | "can_edit_operational_detail"
  | "can_view_reports";

export type EstablishmentPermissionFlags = Record<EstablishmentPermissionKey, boolean>;

export type PermissionGroup = {
  id: string;
  title: string;
  description?: string;
  fields: { key: EstablishmentPermissionKey; label: string; hint?: string }[];
};

export const ESTABLISHMENT_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "reservas",
    title: "Reservas",
    description: "Sistema de reservas, lista de espera e walk-ins.",
    fields: [
      { key: "can_manage_reservations", label: "Acessar módulo de reservas" },
      {
        key: "can_create_edit_reservations",
        label: "Criar, editar e excluir reservas / lista de espera",
        hint: "Desligado = só visualizar, check-in e alocar mesa",
      },
    ],
  },
  {
    id: "checkin",
    title: "Check-in",
    fields: [{ key: "can_manage_checkins", label: "Gerenciar check-ins e listas" }],
  },
  {
    id: "atendimento",
    title: "Atendimento (WhatsApp)",
    description: "Inbox de conversas, assumir atendimento e responder clientes.",
    fields: [{ key: "can_manage_whatsapp", label: "Acessar atendimento WhatsApp" }],
  },
  {
    id: "ia",
    title: "IA e automação",
    fields: [
      {
        key: "can_configure_ia",
        label: "Configurar e treinar IA do estabelecimento",
        hint: "Regras, FAQs, tom de voz e handoff humano",
      },
    ],
  },
  {
    id: "cardapio",
    title: "Cardápio",
    fields: [
      { key: "can_view_cardapio", label: "Ver cardápio" },
      { key: "can_create_cardapio", label: "Criar itens/categorias" },
      { key: "can_edit_cardapio", label: "Editar cardápio" },
      { key: "can_delete_cardapio", label: "Excluir itens do cardápio" },
    ],
  },
  {
    id: "eventos",
    title: "Eventos e OS",
    fields: [
      { key: "can_view_os", label: "Ver ordens de serviço (OS)" },
      { key: "can_download_os", label: "Baixar/exportar OS" },
      { key: "can_create_os", label: "Criar OS" },
      { key: "can_edit_os", label: "Editar OS de artista/banda/DJ" },
    ],
  },
  {
    id: "operacional",
    title: "Detalhes operacionais",
    fields: [
      { key: "can_view_operational_detail", label: "Ver detalhes operacionais" },
      { key: "can_create_operational_detail", label: "Criar detalhes operacionais" },
      { key: "can_edit_operational_detail", label: "Editar detalhes operacionais" },
    ],
  },
  {
    id: "relatorios",
    title: "Relatórios",
    fields: [{ key: "can_view_reports", label: "Ver relatórios e logs" }],
  },
];

export const ALL_ESTABLISHMENT_PERMISSION_KEYS: EstablishmentPermissionKey[] =
  ESTABLISHMENT_PERMISSION_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

export function emptyEstablishmentPermissions(): EstablishmentPermissionFlags {
  return Object.fromEntries(
    ALL_ESTABLISHMENT_PERMISSION_KEYS.map((k) => [k, false]),
  ) as EstablishmentPermissionFlags;
}

export function cardapioOnlyPermissions(): EstablishmentPermissionFlags {
  return {
    ...emptyEstablishmentPermissions(),
    can_view_cardapio: true,
    can_create_cardapio: true,
    can_edit_cardapio: true,
  };
}

export function atendimentoOnlyPermissions(): EstablishmentPermissionFlags {
  return {
    ...emptyEstablishmentPermissions(),
    can_manage_whatsapp: true,
    can_manage_reservations: true,
    can_create_edit_reservations: false,
    can_manage_checkins: true,
    can_view_operational_detail: true,
  };
}

/** Só liga flags de atendimento — use com merge para não apagar o resto. */
export function additiveAtendimentoFlags(): Partial<EstablishmentPermissionFlags> {
  return {
    can_manage_whatsapp: true,
    can_manage_reservations: true,
    can_manage_checkins: true,
    can_view_operational_detail: true,
  };
}

export function additiveReservasFlags(): Partial<EstablishmentPermissionFlags> {
  return {
    can_manage_reservations: true,
    can_create_edit_reservations: true,
    can_manage_checkins: true,
  };
}

export function additiveCardapioFlags(): Partial<EstablishmentPermissionFlags> {
  return {
    can_view_cardapio: true,
    can_create_cardapio: true,
    can_edit_cardapio: true,
  };
}

export function mergePermissionFlags(
  base: EstablishmentPermissionFlags,
  patch: Partial<EstablishmentPermissionFlags>,
): EstablishmentPermissionFlags {
  return { ...base, ...patch };
}

export function fullOperationPermissions(): EstablishmentPermissionFlags {
  const all = emptyEstablishmentPermissions();
  for (const key of ALL_ESTABLISHMENT_PERMISSION_KEYS) {
    all[key] = true;
  }
  return all;
}

export function permissionFlagsFromRow(
  row: Partial<Record<EstablishmentPermissionKey, boolean | undefined>>,
): EstablishmentPermissionFlags {
  const base = emptyEstablishmentPermissions();
  for (const key of ALL_ESTABLISHMENT_PERMISSION_KEYS) {
    if (row[key] === true) base[key] = true;
    else if (key.startsWith("can_view_") || key === "can_download_os") {
      base[key] = row[key] !== false;
    } else if (
      key === "can_create_edit_reservations" ||
      key === "can_create_cardapio" ||
      key === "can_edit_cardapio"
    ) {
      base[key] = row[key] !== false;
    }
  }
  if (row.can_manage_reservations && row.can_manage_whatsapp === undefined) {
    base.can_manage_whatsapp = true;
  }
  return base;
}

export function activePermissionLabels(
  row: Partial<Record<EstablishmentPermissionKey, boolean | undefined>>,
): string[] {
  const flags = permissionFlagsFromRow(row);
  return ESTABLISHMENT_PERMISSION_GROUPS.flatMap((g) =>
    g.fields.filter((f) => flags[f.key]).map((f) => f.label),
  );
}
