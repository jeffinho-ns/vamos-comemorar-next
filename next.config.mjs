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
                hostname: 'grupoideiaum.com.br',
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
        ],
    },
};

export default nextConfig;
