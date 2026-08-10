/**
 * Utilitários para manipulação de datas
 * Resolve problemas de timezone e formatação inconsistente
 */

/**
 * Extrai YYYY-MM-DD de strings do banco/API sem aplicar fuso.
 * Evita o clássico "um dia a menos" ao fazer `new Date('2026-08-22')` (UTC).
 */
export function extractDateKey(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const raw = String(dateString).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const datePart = raw.split('T')[0]?.split(' ')[0] || '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  return null;
}

/** Date local ao meio-dia a partir de YYYY-MM-DD / ISO date-only. */
export function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  try {
    const key = extractDateKey(dateString);
    if (key) {
      const date = new Date(`${key}T12:00:00`);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Formata uma data do banco (YYYY-MM-DD) para exibição em pt-BR
 * Adiciona T12:00:00 para evitar problemas de timezone
 * 
 * @param dateString - String de data no formato YYYY-MM-DD ou YYYY-MM-DD HH:mm:ss
 * @returns String formatada como DD/MM/YYYY
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = parseLocalDate(dateString);
    if (!date) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Erro ao formatar data:', dateString, error);
    return 'Data inválida';
  }
}

/**
 * Formata data e hora completa
 * 
 * @param dateString - String de data/hora
 * @returns String formatada como DD/MM/YYYY HH:mm
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Erro ao formatar data/hora:', dateString, error);
    return 'Data inválida';
  }
}

/**
 * Formata data de forma curta (DD/MM)
 * 
 * @param dateString - String de data
 * @returns String formatada como DD/MM
 */
export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = parseLocalDate(dateString);
    if (!date) return '';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  } catch (error) {
    console.error('Erro ao formatar data curta:', dateString, error);
    return '';
  }
}

/**
 * Formata data para exibição com mês por extenso
 * 
 * @param dateString - String de data
 * @returns String formatada como "sábado, 22 de agosto de 2026"
 */
export function formatDateLong(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = parseLocalDate(dateString);
    if (!date) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Erro ao formatar data longa:', dateString, error);
    return 'Data inválida';
  }
}

/**
 * Formata data para input HTML (YYYY-MM-DD)
 * 
 * @param date - Date object ou string
 * @returns String no formato YYYY-MM-DD
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      const key = extractDateKey(date);
      if (key) return key;
    }
    const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
    if (!dateObj) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao formatar data para input:', date, error);
    return '';
  }
}

/**
 * Verifica se uma data é válida
 * 
 * @param dateString - String de data
 * @returns boolean
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Converte data do banco (YYYY-MM-DD) para Date object correto
 * Evita problemas de timezone
 * 
 * @param dateString - String de data no formato YYYY-MM-DD
 * @returns Date object
 */
export function parseDateFromDB(dateString: string | null | undefined): Date | null {
  return parseLocalDate(dateString);
}

/**
 * Formata horário (HH:mm:ss) para exibição (HH:mm)
 * 
 * @param timeString - String de horário HH:mm:ss
 * @returns String formatada como HH:mm
 */
export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return '';
  
  try {
    // Se já está no formato HH:mm, retorna direto
    if (timeString.length === 5) return timeString;
    
    // Se está no formato HH:mm:ss, remove os segundos
    return timeString.substring(0, 5);
  } catch (error) {
    console.error('Erro ao formatar horário:', timeString, error);
    return timeString || '';
  }
}

/**
 * Retorna o nome do dia da semana em português
 * 
 * @param dayNumber - Número do dia (0 = Domingo, 6 = Sábado)
 * @returns Nome do dia em português
 */
export function getDayName(dayNumber: number | null | undefined): string {
  if (dayNumber === null || dayNumber === undefined) return '';
  
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[dayNumber] || '';
}

/**
 * Retorna o nome do dia da semana de forma curta
 * 
 * @param dayNumber - Número do dia (0 = Domingo, 6 = Sábado)
 * @returns Nome curto do dia
 */
export function getDayNameShort(dayNumber: number | null | undefined): string {
  if (dayNumber === null || dayNumber === undefined) return '';
  
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[dayNumber] || '';
}














