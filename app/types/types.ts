// types/types.ts
export type User = {
    id: number;
    name: string;
    email: string;
    telefone: string;
    status: string;
    created_at: string;
  };
  
  export type NewUser = Omit<User, 'id' | 'created_at' | 'status'> & {
    telefone: string; // Telefone é um campo requerido
  };