/**
 * Utilitários para formatação de datas
 * Corrige problemas de fuso horário ao exibir datas
 */

/** Timezone do estabelecimento (São Paulo) - usada para exibir horários de check-in corretamente */
export const TIMEZONE_BR = "America/Sao_Paulo";

/**
 * Formata horário de check-in para exibição no fuso de São Paulo.
 * Resolve o problema de horários aparecendo errados (ex: 15:10 quando o real é 18:10)
 * quando o navegador está em outro fuso.
 * @param isoString - Timestamp ISO (ex: "2026-02-27T21:10:00.000Z" ou "2026-02-27T21:10:00")
 * @returns Hora formatada (ex: "21:10") ou string vazia se inválido
 */
/**
 * Formata horário de check-in (HH:mm) para exibição no fuso de São Paulo.
 */
export function formatCheckinTime(isoString?: string | null): string {
  if (!isoString || String(isoString).trim() === "") return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TIMEZONE_BR,
    });
  } catch {
    return "";
  }
}

/** Alias para formatCheckinTime */
export const formatCheckinTimeShort = formatCheckinTime;

/**
 * Formata data e hora completas para o fuso de São Paulo.
 */
export function formatDateTimeCheckin(isoString?: string | null): string {
  if (!isoString || String(isoString).trim() === "") return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TIMEZONE_BR,
    });
  } catch {
    return "";
  }
}

/**
 * Formata uma data no formato YYYY-MM-DD para o padrão brasileiro
 * Adiciona T12:00:00 para evitar problemas de fuso horário
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns Data formatada no padrão brasileiro (DD/MM/YYYY)
 */
export function formatDateBR(dateString: string): string {
  if (!dateString || dateString.trim() === '') return '';
  
  try {
    // Adiciona T12:00:00 para evitar conversão de fuso horário
    const date = new Date(dateString + 'T12:00:00');
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    return '';
  }
}

/**
 * Formata uma data com hora para o padrão brasileiro
 * @param dateString - Data no formato YYYY-MM-DD
 * @param timeString - Hora no formato HH:mm ou HH:mm:ss
 * @returns Data e hora formatadas no padrão brasileiro
 */
export function formatDateTimeBR(dateString: string, timeString?: string): string {
  if (!dateString) return '';
  
  const formattedDate = formatDateBR(dateString);
  
  if (!formattedDate) return '';
  
  if (timeString && timeString.trim() !== '') {
    // Remove os segundos se existirem para exibição mais limpa
    const time = timeString.split(':').slice(0, 2).join(':');
    return `${formattedDate} às ${time}`;
  }
  
  return formattedDate;
}

/**
 * Verifica se uma data é válida
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns true se a data for válida
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString || dateString.trim() === '') return false;
  
  try {
    const date = new Date(dateString + 'T12:00:00');
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
}

/**
 * Obtém o dia da semana de uma data
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns Número do dia da semana (0=domingo, 1=segunda, etc.)
 */
export function getDayOfWeek(dateString: string): number {
  if (!dateString || dateString.trim() === '') return -1;
  
  try {
    const date = new Date(dateString + 'T12:00:00');
    if (isNaN(date.getTime())) return -1;
    return date.getDay();
  } catch (error) {
    return -1;
  }
}

/**
 * Obtém o nome do dia da semana em português
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns Nome do dia da semana em português
 */
export function getDayOfWeekName(dateString: string): string {
  const dayOfWeek = getDayOfWeek(dateString);
  if (dayOfWeek === -1) return '';
  
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[dayOfWeek] || '';
}
