// Configurações da API
export const API_CONFIG = {
  // URL da API em produção
  PRODUCTION: 'https://vamos-comemorar-api.onrender.com',
  // URL da API local para desenvolvimento
  LOCAL: 'http://localhost:3001',
  // URL padrão (usa produção se não estiver em desenvolvimento)
  DEFAULT: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001' 
    : 'https://vamos-comemorar-api.onrender.com'
};

// Função para obter a URL da API
export const getApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 
         process.env.NEXT_PUBLIC_API_URL_LOCAL || 
         API_CONFIG.DEFAULT;
};

// Configurações do banco de dados (apenas para referência)
export const DB_CONFIG = {
  HOST: '193.203.175.55',
  USER: 'u621081794_vamos',
  PASSWORD: '@123Mudar!@',
  DATABASE: 'u621081794_vamos'
};
