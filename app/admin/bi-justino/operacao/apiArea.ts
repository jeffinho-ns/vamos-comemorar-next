"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "../../../config/api";
import { chamarBi, tokenPainel } from "../usePlanilha";

export interface RespostaArea {
  ok: boolean;
  error?: string;
  id?: string;
  count?: number;
  solicitacao?: boolean;
  eventoId?: string;
  url?: string;
  fileName?: string;
}

const MENSAGENS: Record<string, string> = {
  acesso_negado: "Sem permissão para esta ação.",
  somente_diretoria: "Só a Diretoria pode fazer isso.",
  month_closed: "Mês fechado — peça pro diretor reabrir.",
  credenciais_ausentes: "A API ainda não tem as credenciais da planilha.",
  login_recusado: "A planilha recusou o login do robô.",
  planilha_indisponivel: "A planilha não respondeu. Tente de novo em instantes.",
  timeout: "A planilha demorou demais. Tente de novo.",
  leitura_recusada: "A planilha recusou a gravação.",
  forbidden: "A planilha recusou: sem permissão.",
  not_found: "Registro não encontrado na planilha.",
  not_pending: "Este item não está mais aguardando decisão.",
  busy: "Planilha ocupada, tente de novo em alguns segundos.",
  falha_ao_gravar: "Não consegui gravar agora.",
};

export function mensagemErro(codigo: string | undefined, padrao = "Não consegui salvar.") {
  if (!codigo) return padrao;
  return MENSAGENS[codigo] ?? `${padrao} (${codigo})`;
}

/** POST em /api/bi/justino/... devolvendo a resposta padronizada da área. */
export async function postArea(caminho: string, corpo: unknown): Promise<RespostaArea> {
  try {
    const r = await chamarBi<RespostaArea>(`/api/bi${caminho}`, corpo);
    if (!r.json) return { ok: false, error: r.ok ? "resposta_invalida" : "falha_ao_gravar" };
    return r.json;
  } catch {
    return { ok: false, error: "sem_conexao" };
  }
}

/** POST multipart (evidência / documento) em /api/bi/justino/... */
export async function enviarArquivoArea(caminho: string, campos: Record<string, string>, arquivo: File): Promise<RespostaArea> {
  const token = tokenPainel();
  const form = new FormData();
  Object.entries(campos).forEach(([chave, valor]) => form.append(chave, valor));
  form.append("file", arquivo);
  try {
    const res = await fetch(`${getApiUrl()}/api/bi${caminho}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token ?? ""}` },
      body: form,
    });
    const json = (await res.json().catch(() => null)) as RespostaArea | null;
    if (!json) return { ok: false, error: res.ok ? "resposta_invalida" : "falha_ao_gravar" };
    return json;
  } catch {
    return { ok: false, error: "sem_conexao" };
  }
}

/** GET autenticado em /api/bi/justino/... (rotas próprias da área). */
export async function getArea<T>(caminho: string): Promise<{ ok: boolean; status: number; json: T | null }> {
  const token = tokenPainel();
  try {
    const res = await fetch(`${getApiUrl()}/api/bi${caminho}`, { headers: { Authorization: `Bearer ${token ?? ""}` }, cache: "no-store" });
    const json = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, json };
  } catch {
    return { ok: false, status: 0, json: null };
  }
}

/** Abre um PDF servido pela API (precisa do token, então baixa como blob). */
export async function abrirPdfArea(caminho: string): Promise<string | null> {
  const token = tokenPainel();
  try {
    const res = await fetch(`${getApiUrl()}/api/bi${caminho}`, { headers: { Authorization: `Bearer ${token ?? ""}` } });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      return json?.error ? `erro:${json.error}` : "erro:falha";
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return "erro:sem_conexao";
  }
}

/** O usuário atual pode executar as ações que no painel do Renato são só da Diretoria? */
export function usePermissoesArea() {
  const [diretoria, setDiretoria] = useState(false);
  useEffect(() => {
    let vivo = true;
    getArea<{ ok: boolean; diretoria?: boolean }>("/justino/operacao/permissoes").then((r) => {
      if (vivo) setDiretoria(Boolean(r.json?.diretoria));
    });
    return () => { vivo = false; };
  }, []);
  return { diretoria };
}
