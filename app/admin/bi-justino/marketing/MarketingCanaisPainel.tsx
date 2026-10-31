"use client";

import type { DadosPlanilha } from "../usePlanilha";
import { FalhaAba } from "./FalhaAba";
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
  if (aba === "ins") return <FalhaAba nome="Insights"><MarketingInsights dados={dados} onSalvo={onSalvo} /></FalhaAba>;
  if (aba === "insta") return <FalhaAba nome="Instagram"><MarketingInstagram dados={dados} onSalvo={onSalvo} /></FalhaAba>;
  if (aba === "deli") return <FalhaAba nome="Delivery"><MarketingDelivery dados={dados} onSalvo={onSalvo} /></FalhaAba>;
  return <FalhaAba nome="Avaliações Google"><MarketingGoogle dados={dados} onSalvo={onSalvo} /></FalhaAba>;
}
