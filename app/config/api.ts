import { getPublicApiUrl } from '@/lib/publicApiUrl';

// Configurações da API (fallback de produção = Cloudflare + Render)
export const API_CONFIG = {
  PRODUCTION: 'https://api.agilizaiapp.com.br',
  LOCAL: 'http://localhost:3001',
  DEFAULT:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001'
      : 'https://api.agilizaiapp.com.br',
};

/** URL base da API (sem barra final). Preferir este helper em novo código. */
export const getApiUrl = (): string => getPublicApiUrl();

// Configurações do banco de dados (apenas para referência)
export const DB_CONFIG = {
  HOST: '193.203.175.55',
  USER: 'u621081794_vamos',
  PASSWORD: '@123Mudar!@',
  DATABASE: 'u621081794_vamos'
};
