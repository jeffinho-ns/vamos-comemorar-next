import type { ComponentType } from "react";
import type { PaginaEspelhoProps } from "./paginaEspelho";
import * as Diretoria from "./diretoria/DiretoriaPagina";
import * as Financeiro from "./financeiro/FinanceiroPagina";
import * as Rh from "./rh/RhPagina";
import * as Cmv from "./cmv/CmvPagina";
import * as Operacao from "./operacao/OperacaoPagina";
import * as Eventos from "./eventos/EventosPagina";
import * as Reservas from "./reservas/ReservasPagina";
import * as AuditoriaOp from "./auditoria/AuditoriaOpPagina";
import * as AuditoriaSistema from "./auditoria/AuditoriaSistemaPagina";
import * as Documentos from "./documentos/DocumentosPagina";
import * as Manual from "./manual/ManualPagina";
import * as Contatos from "./contatos/ContatosPagina";

interface Entrada {
  pronta: boolean;
  Pagina: ComponentType<PaginaEspelhoProps>;
}

/**
 * Páginas do BI que já são cópia do painel do Renato lendo do espelho no banco.
 * Enquanto `pronta` for false, o PainelConteudo usa a montagem genérica antiga.
 */
const PAGINAS_ESPELHO: Record<string, Entrada> = {
  master: { pronta: Diretoria.PRONTA, Pagina: Diretoria.DiretoriaPagina },
  financeiro: { pronta: Financeiro.PRONTA, Pagina: Financeiro.FinanceiroPagina },
  rh: { pronta: Rh.PRONTA, Pagina: Rh.RhPagina },
  cmv: { pronta: Cmv.PRONTA, Pagina: Cmv.CmvPagina },
  operacao: { pronta: Operacao.PRONTA, Pagina: Operacao.OperacaoPagina },
  eventos: { pronta: Eventos.PRONTA, Pagina: Eventos.EventosPagina },
  reservas: { pronta: Reservas.PRONTA, Pagina: Reservas.ReservasPagina },
  auditoriaop: { pronta: AuditoriaOp.PRONTA, Pagina: AuditoriaOp.AuditoriaOpPagina },
  auditoria: { pronta: AuditoriaSistema.PRONTA, Pagina: AuditoriaSistema.AuditoriaSistemaPagina },
  documentos: { pronta: Documentos.PRONTA, Pagina: Documentos.DocumentosPagina },
  manual: { pronta: Manual.PRONTA, Pagina: Manual.ManualPagina },
  contatos: { pronta: Contatos.PRONTA, Pagina: Contatos.ContatosPagina },
};

export function paginaEspelho(paginaId: string): ComponentType<PaginaEspelhoProps> | null {
  const entrada = PAGINAS_ESPELHO[paginaId];
  return entrada && entrada.pronta ? entrada.Pagina : null;
}
