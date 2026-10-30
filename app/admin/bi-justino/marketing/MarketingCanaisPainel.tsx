"use client";

import type { DadosPlanilha } from "../usePlanilha";
import { MarketingDelivery } from "./MarketingDelivery";
import { MarketingGoogle } from "./MarketingGoogle";
import { MarketingInsights } from "./MarketingInsights";
import { MarketingInstagram } from "./MarketingInstagram";

export function MarketingCanaisPainel({
  aba,
  dados,
  onSalvo,
}: {
  aba: "ins" | "insta" | "deli" | "aval";
  dados: DadosPlanilha;
  onSalvo: () => void;
}) {
  if (aba === "ins") return <MarketingInsights dados={dados} onSalvo={onSalvo} />;
  if (aba === "insta") return <MarketingInstagram dados={dados} onSalvo={onSalvo} />;
  if (aba === "deli") return <MarketingDelivery dados={dados} onSalvo={onSalvo} />;
  return <MarketingGoogle dados={dados} onSalvo={onSalvo} />;
}
