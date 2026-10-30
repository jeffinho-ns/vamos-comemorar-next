"use client";

import type { DadosPlanilha } from "../usePlanilha";
import { DuvidasBox } from "./Duvidas";

/** Card `duvidasBox_operacao` (data-duvida-area="gestores") da aba Gerente Operador. */
export function Duvidas({ dados, aoSalvar, recarregar }: { dados: DadosPlanilha; aoSalvar: () => void; recarregar: () => void }) {
  return <DuvidasBox area="gestores" dados={dados} aoSalvar={aoSalvar} recarregar={recarregar} />;
}
