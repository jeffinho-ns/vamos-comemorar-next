/** @type {import('next').NextConfig} */

const nextConfig = {
    images: { 
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'vamos-comemorar-api.onrender.com',
                pathname: '/uploads/**',
            },
            {
                protocol: 'https',
                hostname: 'grupoideiaum.com.br',
                pathname: '/cardapio-agilizaiapp/**',
            },
            {
                protocol: 'https',
                hostname: 'www.grupoideiaum.com.br',
                pathname: '/cardapio-agilizaiapp/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
                pathname: '/**',
            },
        ],
        // Configurações para melhor performance em produção
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
};

export default nextConfig;
