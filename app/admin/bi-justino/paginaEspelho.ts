import type { DreAoVivo } from "./dreValor";
import type { NovidadesAoVivo } from "./FontesNovas";
import type { BiLiveData } from "./useBiLive";
import type { ZigAoVivo } from "./zigValor";

/** Props comuns às páginas do BI montadas a partir do espelho da planilha. */
export interface PaginaEspelhoProps {
  /** Sub-aba escolhida na barra do topo (ids do conteudo/*.json). */
  subId: string;
  onSub: (id: string) => void;
  live: BiLiveData | null;
  zig: ZigAoVivo | null;
  dre: DreAoVivo | null;
  novidades: NovidadesAoVivo | null;
  /** Recarrega a leitura ao vivo depois de uma gravação. */
  onSalvo: () => void;
}
