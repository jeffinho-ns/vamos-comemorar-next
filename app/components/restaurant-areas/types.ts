export interface RestaurantAreaDTO {
  id: number;
  name: string;
  description?: string | null;
  capacity_lunch: number;
  capacity_dinner: number;
  is_active?: boolean | number;
  /** null/undefined = área legada (padrão do sistema, compartilhada). */
  establishment_id?: number | null;
}

export interface RestaurantTableDTO {
  id: number;
  area_id: number;
  table_number: string;
  capacity: number;
  table_type?: string | null;
  description?: string | null;
  is_active?: boolean | number;
  establishment_id?: number | null;
  is_reserved?: boolean;
}

/** Uma área é "própria" (editável) quando pertence ao estabelecimento selecionado. */
export function isOwnedArea(
  area: Pick<RestaurantAreaDTO, "establishment_id">,
  establishmentId: number | null | undefined,
): boolean {
  return (
    area.establishment_id != null &&
    Number(area.establishment_id) === Number(establishmentId)
  );
}

/** Área legada/compartilhada (sem dono) — somente leitura no admin. */
export function isLegacyArea(
  area: Pick<RestaurantAreaDTO, "establishment_id">,
): boolean {
  return area.establishment_id == null;
}

export function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
