// Arquivo types.ts

// Definição básica de um usuário, pode ser usado para listar usuários ou dados simples
export type User = {
  id: number;
  name: string;
  email: string;
  telefone?: string;
  created_at: string; // Agora é obrigatório
  status: string;
  type?: string;
  sexo?: string;
  data_nascimento: string;
  cep: string;
  cpf: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  foto_perfil?: string;
  password: string;
};

// Tipo de usuário vindo da API
export type APIUser = Omit<User, 'created_at'> & {
  created_at: string; // Sempre uma string
};

// Tipo para criação de novo usuário, omitindo campos que são gerados automaticamente
export type NewUser = Omit<User, 'id' | 'created_at' | 'status'> & {
  password: string;
};
