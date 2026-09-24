"use client";

export type AreaCapacityCheck = {
  applies: boolean;
  area_name: string | null;
  capacity: number;
  reserved_people: number;
  requested_people: number;
  fits: boolean;
  remaining: number | null;
};

type AreaCapacityNoticeProps = {
  check: AreaCapacityCheck;
  className?: string;
};

/**
 * Aviso de capacidade por área (Camarotes / Áreas VIP / Rooftop) ao confirmar reserva.
 */
export default function AreaCapacityNotice({
  check,
  className = "",
}: AreaCapacityNoticeProps) {
  if (!check.applies) return null;

  const areaLabel = check.area_name || "área";
  const remaining = check.remaining;
  const fits = check.fits;
  const capacityConfigured = check.capacity > 0;

  const base =
    "rounded-lg border px-4 py-3 text-sm " +
    (fits
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-red-200 bg-red-50 text-red-800");

  return (
    <div
      className={`${base} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <p className="font-medium">
        Capacidade — {areaLabel}
      </p>
      <p className="mt-1">
        {capacityConfigured ? (
          <>
            {check.reserved_people} pessoa(s) já reservada(s) nesta área nesta
            data · capacidade {check.capacity} · esta reserva:{" "}
            {check.requested_people} pessoa(s).
          </>
        ) : (
          <>
            Área restrita ({areaLabel}): {check.reserved_people} pessoa(s) já
            reservada(s) · esta reserva: {check.requested_people} pessoa(s).
            Capacidade da área não configurada no cadastro.
          </>
        )}
      </p>
      {fits ? (
        <p className="mt-1">
          {capacityConfigured && remaining != null && remaining >= 0
            ? `Cabe nesta confirmação. Ainda cabem mais ${remaining} pessoa(s).`
            : "Cabe nesta confirmação."}
        </p>
      ) : (
        <p className="mt-1 font-medium">
          Não cabe: a confirmação foi bloqueada. Ajuste a área, a data ou o
          número de pessoas.
        </p>
      )}
    </div>
  );
}

/** Monta mensagem curta a partir do payload da API (GET/409). */
export function formatAreaCapacityError(check: AreaCapacityCheck): string {
  const areaLabel = check.area_name || "área restrita";
  return `Capacidade insuficiente em ${areaLabel}: ${check.reserved_people} já reservados + ${check.requested_people} desta reserva excedem a capacidade de ${check.capacity}.`;
}

export function parseAreaCapacityPayload(
  data: unknown,
): AreaCapacityCheck | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as Record<string, unknown>;
  const nested =
    raw.capacity && typeof raw.capacity === "object"
      ? (raw.capacity as Record<string, unknown>)
      : raw;
  if (typeof nested.applies !== "boolean") return null;
  return {
    applies: nested.applies,
    area_name:
      nested.area_name == null ? null : String(nested.area_name),
    capacity: Math.max(0, Number(nested.capacity) || 0),
    reserved_people: Math.max(0, Number(nested.reserved_people) || 0),
    requested_people: Math.max(0, Number(nested.requested_people) || 0),
    fits: nested.fits !== false,
    remaining:
      nested.remaining == null || nested.remaining === ""
        ? null
        : Number(nested.remaining),
  };
}
