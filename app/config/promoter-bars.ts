// Configuração para mapear promoters aos bares que podem gerenciar
// Este arquivo pode ser expandido para buscar do banco de dados no futuro

export interface PromoterBarMapping {
  userId: number;
  userEmail: string;
  userName: string;
  barId: number;
  barName: string;
  barSlug: string;
}

// Mapeamento estático de promoters para bares
// ATUALIZADO: IDs corretos dos bares baseado no que está funcionando
export const PROMOTER_BAR_MAPPINGS: PromoterBarMapping[] = [
  {
    userId: 59, // ID real do usuário 'analista@seujustino.com'
    userEmail: "analista@seujustino.com",
    userName: "Analista Seu Justino",
    barId: 1, // ID do bar "Seu Justino" - ESTE ESTÁ FUNCIONANDO
    barName: "Seu Justino",
    barSlug: "seu-justino"
  },
  {
    userId: 60, // ID real do usuário 'analista@ohfregues.com'
    userEmail: "analista@ohfregues.com",
    userName: "Analista Oh Fregues",
    barId: 2, // ID do bar "Oh Fregues" - CORRIGIDO
    barName: "Oh Fregues",
    barSlug: "oh-fregues"
  },
  {
    userId: 61, // ID real do usuário 'analista@highline.com'
    userEmail: "analista@highline.com",
    userName: "Analista HighLine",
    barId: 7, // ID do bar "HighLine" (corrigido para 7 que é o usado atualmente)
    barName: "HighLine",
    barSlug: "highline"
  },
  {
    userId: 0, // Será atualizado quando obtivermos o ID do banco
    userEmail: "fran@highlinebar.com.br",
    userName: "Fran HighLine",
    barId: 7, // ID do bar "HighLine"
    barName: "HighLine",
    barSlug: "highline"
  },
  {
    userId: 62, // ID real do usuário 'analista@pracinha.com'
    userEmail: "analista@pracinha.com",
    userName: "Analista Pracinha",
    barId: 4, // ID do bar "Pracinha do Seu Justino" - CORRIGIDO
    barName: "Pracinha do Seu Justino",
    barSlug: "pracinha-do-seu-justino"
  },
  {
    userId: 63, // ID real do usuário 'analista@reserva.com'
    userEmail: "analista@reserva.com",
    userName: "Analista Reserva Rooftop",
    barId: 5, // ID do bar "Reserva Rooftop" - CORRIGIDO
    barName: "Reserva Rooftop",
    barSlug: "reserva-rooftop"
  }
];

// Função para buscar o bar associado a um promoter
export function getPromoterBar(userId: number): PromoterBarMapping | null {
  return PROMOTER_BAR_MAPPINGS.find(mapping => mapping.userId === userId) || null;
}

// Função para buscar o bar associado a um promoter por email
export function getPromoterBarByEmail(email: string): PromoterBarMapping | null {
  return PROMOTER_BAR_MAPPINGS.find(mapping => mapping.userEmail === email) || null;
}

// Função para verificar se um usuário é promoter de um bar específico
export function isPromoterOfBar(userId: number, barId: number): boolean {
  const mapping = getPromoterBar(userId);
  return mapping ? mapping.barId === barId : false;
}

// Função para obter todos os bares que um promoter pode gerenciar
export function getPromoterBars(userId: number): PromoterBarMapping[] {
  return PROMOTER_BAR_MAPPINGS.filter(mapping => mapping.userId === userId);
}
