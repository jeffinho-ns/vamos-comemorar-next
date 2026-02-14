/**
 * Service para persistência de "condução" do Fluxo Rooftop.
 * Chama a API externa (backend). Contrato em docs/ROOFTOP_CONDUCTION_API.md
 */

export type RooftopConductionEntityType =
  | "owner"
  | "guest"
  | "reservation_owner";

export interface RooftopConductionConfirmPayload {
  establishment_id: number;
  flow_date: string;
  queue_item_id: string;
  entity_type: RooftopConductionEntityType;
  entity_id: number;
  guest_list_id?: number | null;
  reservation_id?: number | null;
}

export interface RooftopConductionListResponse {
  conduced_ids: string[];
}

const getAuthHeaders = (): HeadersInit => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Retorna os IDs dos itens já conduzidos no dia (fila rooftop).
 * Em caso de 404 ou erro de rede, retorna array vazio para não quebrar o fluxo.
 */
export async function getConducedIds(
  baseUrl: string,
  establishmentId: number,
  flowDate: string,
): Promise<string[]> {
  const params = new URLSearchParams({
    establishment_id: String(establishmentId),
    flow_date: flowDate,
  });
  const url = `${baseUrl.replace(/\/$/, "")}/api/rooftop/conduction?${params.toString()}`;
  try {
    const res = await fetch(url, { method: "GET", headers: getAuthHeaders() });
    if (res.status === 404) return [];
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Erro ${res.status}`);
    }
    const data = (await res.json()) as RooftopConductionListResponse;
    return Array.isArray(data.conduced_ids)
      ? data.conduced_ids.filter((id) => typeof id === "string")
      : [];
  } catch (e) {
    if (e instanceof Error && e.message.includes("404")) return [];
    throw e;
  }
}

/**
 * Confirma condução de um item da fila. Idempotente: duplo clique não duplica.
 */
export async function confirmConduction(
  baseUrl: string,
  payload: RooftopConductionConfirmPayload,
): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/rooftop/conduction`;
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Erro ao confirmar condução (${res.status})`);
  }
}

/**
 * Monta o payload de confirmação a partir do id do item da fila e metadados opcionais.
 */
export function buildConductionPayload(
  queueItemId: string,
  establishmentId: number,
  flowDate: string,
  guestListId?: number | null,
  reservationId?: number | null,
): RooftopConductionConfirmPayload {
  if (queueItemId.startsWith("owner-")) {
    const entityId = Number(queueItemId.replace("owner-", ""));
    return {
      establishment_id: establishmentId,
      flow_date: flowDate,
      queue_item_id: queueItemId,
      entity_type: "owner",
      entity_id: Number.isFinite(entityId) ? entityId : 0,
      guest_list_id: guestListId ?? entityId,
      reservation_id: reservationId ?? undefined,
    };
  }
  if (queueItemId.startsWith("guest-")) {
    const parts = queueItemId.split("-");
    const glId = parts[1] ? Number(parts[1]) : 0;
    const guestId = parts[2] ? Number(parts[2]) : 0;
    return {
      establishment_id: establishmentId,
      flow_date: flowDate,
      queue_item_id: queueItemId,
      entity_type: "guest",
      entity_id: guestId,
      guest_list_id: guestListId ?? glId,
      reservation_id: reservationId ?? undefined,
    };
  }
  if (queueItemId.startsWith("reservation-")) {
    const resId = Number(queueItemId.replace("reservation-", ""));
    return {
      establishment_id: establishmentId,
      flow_date: flowDate,
      queue_item_id: queueItemId,
      entity_type: "reservation_owner",
      entity_id: Number.isFinite(resId) ? resId : 0,
      reservation_id: reservationId ?? resId,
    };
  }
  return {
    establishment_id: establishmentId,
    flow_date: flowDate,
    queue_item_id: queueItemId,
    entity_type: "reservation_owner",
    entity_id: 0,
    reservation_id: reservationId ?? undefined,
  };
}
