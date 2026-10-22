import auditoria from "./auditoria.json";
import auditoriaop from "./auditoriaop.json";
import cmv from "./cmv.json";
import contatos from "./contatos.json";
import documentos from "./documentos.json";
import eventos from "./eventos.json";
import financeiro from "./financeiro.json";
import manual from "./manual.json";
import marketing from "./marketing.json";
import marketingInsta from "./marketing-insta.json";
import master from "./master.json";
import operacao from "./operacao.json";
import reservas from "./reservas.json";
import rh from "./rh.json";

export interface TabelaConteudo {
  colunas: string[];
}

export interface BlocoConteudo {
  titulo: string;
  campos: string[];
  tabelas?: TabelaConteudo[];
}

export interface AbaConteudo {
  id: string;
  label: string;
  blocos: BlocoConteudo[];
}

function abas(valor: unknown): AbaConteudo[] {
  return valor as AbaConteudo[];
}

export const CONTEUDO: Record<string, AbaConteudo[]> = {
  master: abas(master),
  marketing: abas([...marketing, ...marketingInsta]),
  financeiro: abas(financeiro),
  rh: abas(rh),
  operacao: abas(operacao),
  cmv: abas(cmv),
  eventos: abas(eventos),
  reservas: abas(reservas),
  auditoriaop: abas(auditoriaop),
  auditoria: abas(auditoria),
  documentos: abas(documentos),
  manual: abas(manual),
  contatos: abas(contatos),
};
