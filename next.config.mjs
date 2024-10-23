/** @type {import('next').NextConfig} */

const nextConfig = {
    images: { 
        domains: ["imgs.search.brave.com", "localhost", "192.168.15.9"],
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '192.168.15.9',
                port: '5000',  // Substitua pela porta do seu servidor
                pathname: '/uploads/**',  // Caminho para os uploads de imagem
            },
        ],
    },
};

export default nextConfig;
