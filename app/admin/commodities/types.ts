export interface Business {
  id: string;
  cnpj: string;
  telefone: string;
  email: string;
  logo?: string; 
  name?: string; // Mantendo opcional, já que pode não estar presente
}

export interface Place {
  id: string; // Identificador único, obrigatório
  name: string; // Nome do lugar, obrigatório
  email: string; // E-mail, obrigatório
  phone?: string; // Telefone, opcional
  address?: string; // Endereço, opcional
  number?: string; // Número do endereço, opcional
  neighborhood?: string; // Bairro, opcional
  city?: string; // Cidade, opcional
  state?: string; // Estado, opcional
  zipcode?: string; // CEP, opcional
  description?: string; // Descrição, opcional
  latitude?: string; // Latitude para localização, opcional
  longitude?: string; // Longitude para localização, opcional
  slug?: string; // Slug para URL, opcional
  status?: "active" | "inactive"; // Status do lugar, pode ser "active" ou "inactive", opcional
  logo?: string; // URL ou caminho para o logo, opcional
  cnpj?: string; // CNPJ, opcional
  telefone?: string; // Alternativa para "phone", opcional
  commodities?: Array<{

    name: string; // Nome da comodidade
    icon?: string; // Ícone associado à comodidade, opcional
    description?: string; // Descrição da comodidade, opcional
    enabled: boolean; // Se a comodidade está ativa, opcional
  }>; // Lista de comodidades disponíveis no lugar, opcional
  photos?: string[]; // URLs das fotos, opcional
}

export interface Establishment {
  id: string; // Consistente com os outros tipos
  cnpj: string; // Deve ser obrigatório
  nome: string; // Deve ser obrigatório
  telefone: string; // Deve ser obrigatório
  site?: string; // Opcional
  email: string; // Deve ser obrigatório
  emailFinanceiro?: string; // Opcional
  cep?: string; // Opcional
  endereco?: string; // Opcional
  numero?: string; // Opcional
  bairro?: string; // Opcional
  complemento?: string; // Opcional
  cidade?: string; // Opcional
  estado?: string; // Opcional
  status?: string; // Opcional
  logo: string; // Obrigatório
}
