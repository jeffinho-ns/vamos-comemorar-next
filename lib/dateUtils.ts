/**
 * Utilitários para formatação de datas
 * Corrige problemas de fuso horário ao exibir datas
 */

/**
 * Formata uma data no formato YYYY-MM-DD para o padrão brasileiro
 * Adiciona T12:00:00 para evitar problemas de fuso horário
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns Data formatada no padrão brasileiro (DD/MM/YYYY)
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  
  // Adiciona T12:00:00 para evitar conversão de fuso horário
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('pt-BR');
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
  
  if (timeString) {
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
  if (!dateString) return false;
  
  const date = new Date(dateString + 'T12:00:00');
  return !isNaN(date.getTime());
}

/**
 * Obtém o dia da semana de uma data
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns Número do dia da semana (0=domingo, 1=segunda, etc.)
 */
export function getDayOfWeek(dateString: string): number {
  if (!dateString) return -1;
  
  const date = new Date(dateString + 'T12:00:00');
  return date.getDay();
}

/**
 * Obtém o nome do dia da semana em português
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns Nome do dia da semana em português
 */
export function getDayOfWeekName(dateString: string): string {
  const dayOfWeek = getDayOfWeek(dateString);
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[dayOfWeek] || '';
}
