export interface Pagina {
  id: string;
  label: string;
  grupo: "topo" | "setores" | "eventos" | "meio" | "docs" | "fim";
}

export const PAGINAS: Pagina[] = [
  { id: "master", label: "📊 Diretoria", grupo: "topo" },
  { id: "operacao", label: "Gerente Operador", grupo: "setores" },
  { id: "marketing", label: "Marketing", grupo: "setores" },
  { id: "financeiro", label: "Financeiro", grupo: "setores" },
  { id: "rh", label: "RH", grupo: "setores" },
  { id: "cmv", label: "CMV", grupo: "setores" },
  { id: "eventos", label: "Eventos", grupo: "eventos" },
  { id: "reservas", label: "Reservas", grupo: "eventos" },
  { id: "auditoriaop", label: "🛠️ Auditoria Operacional", grupo: "meio" },
  { id: "auditoria", label: "🛠️ Histórico Sistema", grupo: "meio" },
  { id: "documentos", label: "Documentações", grupo: "docs" },
  { id: "manual", label: "📘 Manual Operacional", grupo: "fim" },
  { id: "contatos", label: "📞 Contatos de Emergência", grupo: "fim" },
];

export const GRUPO_LABEL: Record<Pagina["grupo"], string | null> = {
  topo: null,
  setores: "Setores",
  eventos: "🎉 Eventos & Reservas",
  meio: null,
  docs: "📄 Documentos",
  fim: null,
};
