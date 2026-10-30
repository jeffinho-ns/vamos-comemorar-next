"use client";

import { useState } from "react";
import { abrirPdfArea } from "../operacao/apiArea";

/** "📄 Tabela de pacotes (referência)" — o PDF é montado pela API em pedaços (getEventoPacotesPdfInfo/Chunk) e guardado no banco. */
export function PacotesPdf() {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function abrir() {
    setCarregando(true);
    setStatus("Carregando catálogo… (na primeira vez a API baixa o PDF inteiro da planilha, pode levar alguns minutos)");
    const r = await abrirPdfArea("/justino/eventos/pacotes/pdf");
    setCarregando(false);
    if (!r || r.startsWith("erro:")) {
      const erro = r?.slice(5);
      setStatus(erro === "pacotes_nao_encontrado" ? "Não consegui carregar o catálogo agora. (PDF ainda não foi colocado na pasta do Drive — avise o administrador do BI.)" : erro === "pdf_grande_demais" ? "O catálogo passou do tamanho que a API aceita guardar." : "Não consegui carregar o catálogo agora. Tente de novo em instantes.");
      return;
    }
    setUrl(r);
    setStatus("");
  }

  return (
    <details className="sjCollapse" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open && !url && !carregando) abrir(); }}>
      <summary><span className="sjChev">▸</span>📄 Tabela de pacotes (referência)<span className="sjHint">clique para abrir</span></summary>
      <div className="sjCard sjBloco sjCollapseBody">
        <p className="sjNote">Catálogo de pacotes do Seu Justino, pra consultar preço/formato na hora de montar uma cotação.</p>
        <p className="sjMini">{status}</p>
        {url ? <iframe src={url} title="Catálogo de pacotes" style={{ width: "100%", height: "70vh", border: 0, borderRadius: 10 }} /> : null}
        {!url && !carregando ? <button type="button" className="sjAnaliseBtn" onClick={abrir}>Abrir catálogo</button> : null}
      </div>
    </details>
  );
}
