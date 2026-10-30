"use client";

import type { NovidadesAoVivo } from "../FontesNovas";
import type { ZigAoVivo } from "../zigValor";
import { MarketingDelivery } from "./MarketingDelivery";
import { MarketingGoogle } from "./MarketingGoogle";
import { MarketingInsights } from "./MarketingInsights";
import { MarketingInstagram } from "./MarketingInstagram";

export function MarketingCanaisPainel({
  aba,
  zig,
  novidades,
}: {
  aba: "ins" | "insta" | "deli" | "aval";
  zig: ZigAoVivo | null;
  novidades: NovidadesAoVivo | null;
}) {
  if (aba === "ins") return <MarketingInsights zig={zig} />;
  if (aba === "insta") return <MarketingInstagram novidades={novidades} />;
  if (aba === "deli") return <MarketingDelivery novidades={novidades} />;
  return <MarketingGoogle novidades={novidades} />;
}
