"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchEstablishmentRules,
  type EstablishmentRulesPayload,
} from "@/app/utils/establishmentRulesClient";
import {
  deriveEstablishmentRulesFlags,
  type EstablishmentRulesFlags,
} from "@/app/utils/establishmentRulesFlags";

export function useEstablishmentRules(
  establishmentId: number | null | undefined,
  establishmentName?: string | null,
): {
  rules: EstablishmentRulesPayload | null;
  flags: EstablishmentRulesFlags;
  loading: boolean;
} {
  const [rules, setRules] = useState<EstablishmentRulesPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = Number(establishmentId);
    if (!Number.isFinite(id) || id <= 0) {
      setRules(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchEstablishmentRules(id)
      .then((data) => {
        if (!cancelled) setRules(data);
      })
      .catch(() => {
        if (!cancelled) setRules(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [establishmentId]);

  const flags = useMemo(
    () => deriveEstablishmentRulesFlags(rules, establishmentName),
    [rules, establishmentName],
  );

  return { rules, flags, loading };
}
