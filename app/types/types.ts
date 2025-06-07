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

export interface EventData {
  id: number; // Usar 'number' é mais comum para IDs de banco de dados
  casa_do_evento: string;
  nome_do_evento: string;
  data_do_evento: string | null;
  hora_do_evento: string;
  local_do_evento: string;
  categoria: string;
  descricao: string;
  brinde: string;
  observacao: string;
  
  // Campos que vem do formulário como string, mesmo sendo números
  mesas: string;
  valor_da_mesa: string;
  numero_de_convidados: string;
  valor_da_entrada: string;

  // Campos para o tipo de evento
  tipo_evento: 'unico' | 'semanal';
  dia_da_semana: number | null;
  
  // Imagens (os nomes dos arquivos que vem da API)
  imagem_do_evento: string;
  imagem_do_combo: string;

  // URLs completas (se você as constrói no frontend ou backend)
  imagem_do_evento_url?: string;
  imagem_do_combo_url?: string;
}

// Tipo de usuário vindo da API
export type APIUser = Omit<User, 'created_at'> & {
  created_at: string; // Sempre uma string
};

// Tipo para criação de novo usuário, omitindo campos que são gerados automaticamente
export type NewUser = Omit<User, 'id' | 'created_at' | 'status'> & {
  password: string;
};
