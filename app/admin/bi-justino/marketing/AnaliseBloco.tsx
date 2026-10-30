"use client";

import { useEffect, useState } from "react";

export function AnaliseBloco({ texto, forcar }: { texto: string; forcar: number }) {
  const [aberta, setAberta] = useState(false);
  useEffect(() => {
    if (forcar > 0) setAberta(true);
  }, [forcar]);
  return (
    <>
      <button type="button" className="sjAnaliseBtn" onClick={() => setAberta((atual) => !atual)}>📊 Análise do gráfico</button>
      {aberta ? (
        <p className="sjAnalise">
          {texto} Leitura automática dos números do gráfico (regressão linear e médias). Indica o rumo dos dados, não é previsão.
        </p>
      ) : null}
    </>
  );
}
