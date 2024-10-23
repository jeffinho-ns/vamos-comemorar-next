export type User = {
    id: number;
    name: string;
    email: string;
    telefone: string;
    status: string;
    created_at: string;
    type: string;
  };
  
  export type APIUser = {
    id: number;
    name: string;
    email: string;
    telefone: string;
    created_at: string;
    status: string;
    type: string;
    // Adicione outros campos relevantes da sua API aqui
  };
  
  // Definição de NewUser correta
  export type NewUser = Omit<APIUser, 'id' | 'created_at' | 'status'> & {
    type: number;
  };
  