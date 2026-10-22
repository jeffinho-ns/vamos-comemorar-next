export type TipoNumero = "int" | "money" | "pct";
export type TipoCampo = TipoNumero | "data" | "texto";

export function semente(texto: string) {
  let n = 7;
  for (let i = 0; i < texto.length; i += 1) n = (n * 33 + texto.charCodeAt(i)) >>> 0;
  return n;
}

export function tipoCampo(label: string): TipoCampo {
  const t = label.toLowerCase();
  if (/senha|e-mail|email|telefone|observa|buscar|texto da|para quem|nome|origem|tipo de|status|ação|acao/.test(t)) {
    return "texto";
  }
  if (/^data|mês de|mes de|semana|admiss|página|pagina/.test(t)) return "data";
  if (/margem|cmv|percent|cobertura/.test(t)) return "pct";
  if (/fatur|custo|gasto|invest|receita|aluguel|energia|água|agua|gás|gas|imposto|taxa|bônus|bonus|salár|salar|valor|economia|ticket|contrato|sinal/.test(t)) {
    return "money";
  }
  if (/pax|pesso|reserv|clientes|seguidor|alcance|post|headcount|giro|leitura|qtd|quantidade|público|publico|colaborador/.test(t)) {
    return "int";
  }
  return "texto";
}

export function baseNumero(label: string, tipo: TipoNumero) {
  const n = semente(label);
  if (tipo === "pct") return 8 + (n % 24);
  if (tipo === "money") return 1200 + (n % 180000);
  return 3 + (n % 160);
}

export function chaveCampo(bloco: string, campo: string) {
  return `${bloco}::${campo}`;
}

const TEXTOS = ["Ana Costa", "Bruno Alves", "Salão", "Confirmado", "Samba de quinta", "Equipe da casa", "Dentro da meta"];

export function textoMock(label: string) {
  const t = label.toLowerCase();
  if (/senha/.test(t)) return "••••••";
  if (/e-mail|email/.test(t)) return "exemplo@seujustino.com.br";
  if (/telefone|celular|whats/.test(t)) return "(11) 98800-1200";
  if (/cpf|cnpj/.test(t)) return "00.000.000/0001-00";
  if (/data|mês|mes |semana|admiss/.test(t)) return "22/10/2026";
  if (/página|pagina/.test(t)) return "12";
  if (/status|situa|pendente/.test(t)) return "Em aberto";
  if (/nome|cliente/.test(t)) return "Ana Costa";
  if (/área|area|setor|para quem/.test(t)) return "Salão";
  if (/origem|ação|acao/.test(t)) return "Instagram";
  if (/tipo/.test(t)) return "Aniversário";
  if (/observa|dúvida|duvida|buscar|texto/.test(t)) return "Mesa perto do palco";
  return TEXTOS[semente(label) % TEXTOS.length];
}

export function ehNota(campo: string) {
  const limpo = campo.trim();
  return limpo.length > 46 || /[:.]$/.test(limpo);
}
