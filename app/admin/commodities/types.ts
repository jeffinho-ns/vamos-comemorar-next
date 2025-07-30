// types/types.ts

// --- Nova interface Commodity para consistência ---
export interface Commodity {
  name: string;
  icon?: string; // Ícone associado à comodidade, opcional
  description?: string; // Descrição da comodidade, opcional
  enabled: boolean; // Se a comodidade está ativa
}

// --- Business: O que a sua API de `GET /api/places` REALMENTE retorna para cada negócio ---
// Ajuste este tipo para *exatamente* o que seu backend envia.
// Baseado no que o frontend precisa, estou adicionando os campos ausentes.
export interface Business {
  id: string; // Identificador único, obrigatório
  cnpj?: string; // Opcional se a API pode não enviar
  name: string; // Nome do lugar, obrigatório (assumi, dado o uso no frontend)
  telefone?: string; // Telefone, opcional
  email: string; // E-mail, obrigatório (assumi)

  // Campos adicionados/ajustados para serem consistentes com o Place e o uso no frontend
  logo?: string; // Pode ser o NOME DO ARQUIVO da logo (ex: "logo.png")
  logo_url?: string; // **NOVO CAMPO SUGERIDO**: A URL COMPLETA da logo (ex: "https://api.com/uploads/logo.png") - ideal que o backend envie isso
  description?: string; // Descrição do lugar, opcional
  street?: string; // Rua
  number?: string; // Número do endereço
  neighborhood?: string; // Bairro
  city?: string; // Cidade
  state?: string; // Estado
  zipcode?: string; // CEP
  latitude?: string; // Latitude
  longitude?: string; // Longitude
  slug?: string; // Slug
  status?: "active" | "inactive"; // Status
  visible?: boolean; // Visibilidade
  commodities?: Commodity[]; // Lista de comodidades
  photos?: string[]; // URLs das fotos da galeria (se a API retornar URLs completas ou nomes de arquivos)

  // Outros campos que sua API possa retornar, mas não estão no seu Place original:
  created_at?: string; // Exemplo
  updated_at?: string; // Exemplo
}

// --- Place: O que o componente de formulário (EditPlaceModal) manipula ---
// Idealmente, Place deve ser idêntico ou uma extensão de Business se o frontend
// manipula todos os campos de Business + alguns campos exclusivos do frontend.
// Para este caso, vamos fazê-lo quase idêntico a Business, pois o modal de edição
// precisa de todos esses dados.
export interface Place {
  id?: string; // ID pode ser opcional para a criação de um novo Place
  name: string;
  email: string;
  phone?: string; // Este campo não estava em Business, se for o mesmo que 'telefone', decida qual usar
  address?: string; // Este campo não estava em Business, se for a mesma lógica de 'street', decida qual usar
  // ... continue com todos os campos que seu formulário de edição realmente usa
  // Para evitar confusão, sugiro que 'Place' seja *idêntico* a 'Business'
  // se o formulário de edição de Place é para editar um Business.

  // Replicando campos de Business para Place, para alinhamento completo:
  cnpj?: string;
  telefone?: string; // Mantenha este se 'phone' não for usado ou é uma alternativa
  description?: string;
  logo?: string; // Nome do arquivo ou URL
  logo_url?: string; // URL completa
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: string;
  longitude?: string;
  slug?: string;
  status?: "active" | "inactive";
  visible?: boolean;
  commodities?: Commodity[]; // Usando a nova interface Commodity
  photos?: string[]; // URLs das fotos
}

// --- NewPlace: Para a criação de um novo local (se o PlaceModal for só para adicionar) ---
// Pode ser um subconjunto de 'Place' ou 'Business' sem o 'id' e campos gerados pelo backend.
export interface NewPlace {
  name: string;
  email: string;
  cnpj?: string;
  telefone?: string;
  description?: string;
  // ... inclua todos os campos necessários para criar um novo local
}

// --- Establishment: Mantido como está, pois não está no fluxo atual de Businesses/Places ---
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