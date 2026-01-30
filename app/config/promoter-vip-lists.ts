/**
 * Configuração de listas VIP por promoter
 * 
 * Para cada promoter, define uma lista de nomes que devem ter check-in VIP automático
 * Os nomes são comparados de forma case-insensitive e com normalização de espaços
 */

export interface PromoterVIPConfig {
  promoterEmail: string;
  vipNames: string[];
}

/**
 * Lista de configurações VIP por promoter
 * 
 * Para adicionar novos nomes à lista VIP da promoter rafacolelho@highlinebar.com.br,
 * basta adicionar os nomes no array vipNames abaixo.
 */
export const promoterVIPLists: PromoterVIPConfig[] = [
  {
    promoterEmail: 'rafacolelho@highlinebar.com.br',
    vipNames: [
      // Adicione aqui os nomes que devem ter check-in VIP automático
      // Exemplo:
      // 'João Silva',
      // 'Maria Santos',
    ]
  }
];

/**
 * Verifica se um nome está na lista VIP de uma promoter específica
 * 
 * @param promoterEmail Email da promoter
 * @param guestName Nome do convidado
 * @returns true se o nome está na lista VIP, false caso contrário
 */
export function isNameInVIPList(promoterEmail: string, guestName: string): boolean {
  const config = promoterVIPLists.find(c => 
    c.promoterEmail.toLowerCase() === promoterEmail.toLowerCase()
  );
  
  if (!config) {
    return false;
  }
  
  // Normalizar nome do convidado (remover espaços extras, converter para minúsculas)
  const normalizedGuestName = guestName.trim().toLowerCase();
  
  // Verificar se algum nome da lista VIP corresponde (case-insensitive)
  return config.vipNames.some(vipName => {
    const normalizedVIPName = vipName.trim().toLowerCase();
    // Comparação exata (case-insensitive)
    return normalizedGuestName === normalizedVIPName;
  });
}

/**
 * Obtém a lista VIP de uma promoter específica
 * 
 * @param promoterEmail Email da promoter
 * @returns Array de nomes VIP ou array vazio se não encontrado
 */
export function getVIPListForPromoter(promoterEmail: string): string[] {
  const config = promoterVIPLists.find(c => 
    c.promoterEmail.toLowerCase() === promoterEmail.toLowerCase()
  );
  
  return config?.vipNames || [];
}
