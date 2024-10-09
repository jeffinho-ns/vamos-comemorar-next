// app/admin/commodities/types.ts

export interface Business {
    id: number;
    name: string;
    email: string;
    ranking: number;
    status: string;
    logo: string;
    cnpj?: string; // Se necessário
    telefone?: string; // Se necessário
  }
  