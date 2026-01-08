// types/types.ts


export type EventData = EventDataApi;
// --- Interfaces de Usuário ---

// O que vem da API ao listar/obter um usuário
export type APIUser = {
  id: number;
  name: string;
  email: string;
  telefone?: string;
  created_at: string; // Vem como string
  status: string; // Ex: 'ativo', 'inativo'
  type?: string; // Ex: 'admin', 'gerente', 'promoter', 'usuario', 'cliente'
  sexo?: string;
  data_nascimento?: string; // Formato de data (string)
  cep?: string;
  cpf?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  complemento?: string;
  password: string;
  foto_perfil?: string; // Nome do arquivo no servidor
  foto_perfil_url?: string; // URL completa para a imagem
  // Nota: 'password' NUNCA deve vir da API em uma requisição GET. Se você o tem no seu 'User' local,
  // isso pode ser uma representação interna para o formulário de edição/criação.
};

// Tipo para uso no frontend (pode estender APIUser para adicionar lógica de cliente)
// Para o Dashboard, 'User' é o que você manipularia no estado do frontend.
export type User = APIUser & {
  // Você pode adicionar aqui campos derivados ou específicos do frontend se necessário.
};

// Tipo para enviar na criação de um novo usuário (sem campos gerados pelo backend)
export type NewUser = Omit<APIUser, 'id' | 'created_at' | 'status' | 'foto_perfil_url'> & {
  password: string; // A senha é obrigatória na criação
};

// --- Interfaces de Evento ---

// O que vem da API ao listar/obter eventos (GET /api/events)
export interface EventDataApi {
  id: number;
  casa_do_evento: string;
  nome_do_evento: string;
  data_do_evento: string | null; // Pode ser 'YYYY-MM-DD' ou null para semanal
  hora_do_evento: string; // Ex: 'HH:MM'
  local_do_evento: string;
  categoria: string;
  descricao: string;
  brinde: string;
  observacao: string;
 
  mesas: number; // Agora como number, se a API retornar como number
  valor_da_mesa: number; // Agora como number
  numero_de_convidados: number; // Agora como number
  valor_da_entrada: number; // Agora como number

  tipo_evento: 'unico' | 'semanal';
  dia_da_semana: number | null; // 1 (domingo) a 7 (sábado) ou null para único
  
  imagem_do_evento: string; // Nome do arquivo
  imagem_do_combo: string; // Nome do arquivo

  imagem_do_evento_url?: string; // URL completa para imagem_do_evento
  imagem_do_combo_url?: string; // URL completa para imagem_do_combo



  // NOVOS CAMPOS DO JOIN na rota GET /api/events
  total_convidados_checkin: number;
  total_convidados_cadastrados: number;
  
  // Campos opcionais para estabelecimento
  id_place?: number;
  establishment_id?: number;
}

// Tipo para o formulário de evento no frontend (pode ter campos como string antes da conversão)
export interface EventFormInput {
  id?: number; // Opcional para criação
  casa_do_evento: string;
  nome_do_evento: string;
  data_do_evento: string; // Vem do input de data como string
  hora_do_evento: string;
  local_do_evento: string;
  categoria: string;
  descricao: string;
  brinde: string;
  observacao: string;
  
  mesas: string; // Lendo do input como string
  valor_da_mesa: string; // Lendo do input como string
  numero_de_convidados: string; // Lendo do input como string
  valor_da_entrada: string; // Lendo do input como string

  tipo_evento: 'unico' | 'semanal';
  dia_da_semana: string; // Lendo do select/input como string (ex: "1" para Domingo)
  
  // Nomes de arquivos ou URLs temporárias para preview
  imagem_do_evento?: string;
  imagem_do_combo?: string;
}


// --- Interfaces de Reservas ---

// O que vem da API de /api/reservas
export interface ReservaDataApi {
  id: number;
  nome_lista: string;
  evento_id: number;
  tipo_reserva: string; // 'ANIVERSARIO', 'PROMOTER', 'NORMAL'
  status: string; // 'ATIVA', 'CANCELADA', etc.
  nome_do_criador: string; // Do JOIN com users
  quantidade_convidados: number; // Total esperado
  brindes_solicitados?: string; // Ou um tipo mais específico se for JSON
  total_checkins: number; // Contagem de check-ins da subquery
  // Adicionar outros campos da tabela reservas se a API os retorna
  user_id: number; // ID do criador da reserva
  created_at: string;
  updated_at: string;
  codigo_convite?: string;
}

// --- Interfaces de Convidados ---

// O que vem da API de /api/events/:id/guests
export interface Convidado {
  id: number;
  nome: string;
  documento?: string;
  email?: string;
  telefone?: string;
  qr_code?: string;
  status_checkin?: string; // 'CHECK-IN', 'PENDENTE'
  data_checkin?: string; // Data e hora do check-in
  nome_lista?: string; // Do JOIN com reservas
  nome_do_criador_da_lista?: string; // Do JOIN com users (via reservas)
}


// --- Interfaces de Negócios/Locais ---

// Interface para as comodidades
export interface Commodity {
  name: string;
  enabled: boolean;
  icon?: string;
  description?: string;
}

// O que a sua API de `GET /api/places` REALMENTE retorna para cada negócio
export interface Business {
  id: string; // Ou number, dependendo da sua API
  cnpj?: string;
  name: string; // Nome do lugar
  telefone?: string;
  email: string;
  logo?: string; // Nome do arquivo ou URL parcial (se a API não retornar a URL completa)
  logo_url?: string; // URL completa para a logo (ideal que a API envie)
  description?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: string; // Ou number
  longitude?: string; // Ou number
  status?: "active" | "inactive";
  visible?: boolean;
  commodities?: Commodity[];
  photos?: string[]; // Array de URLs ou nomes de arquivos de fotos
  // Outros campos que sua API possa retornar
  created_at?: string;
  updated_at?: string;
}

// O que o componente de formulário (EditPlaceModal) manipula
export interface Place {
  id?: string;
  slug?: string;
  name: string;
  email: string;
  phone?: string; // Se 'phone' for um campo distinto de 'telefone'
  address?: string; // Se 'address' for um campo distinto de 'street'
  description?: string;
  logo?: string; // Pode ser URL temporária (blob) ou nome do arquivo
  logo_url?: string; // Para exibir a URL original
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: string;
  longitude?: string;
  status?: "active" | "inactive";
  visible?: boolean;
  commodities?: Commodity[];
  photos?: string[];
  cnpj?: string; // Se for editável
  telefone?: string; // Se for editável
}

// Para a criação de um novo local
export interface NewPlace {
  name: string;
  email: string;
  // ... outros campos obrigatórios para criar um novo local (sem ID, slug, etc. iniciais)
}


// --- Interfaces de Estabelecimento (se ainda em uso) ---
export interface Establishment {
  id: string;
  cnpj: string;
  nome: string;
  telefone: string;
  site?: string;
  email: string;
  emailFinanceiro?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  status?: string;
  logo: string;
}