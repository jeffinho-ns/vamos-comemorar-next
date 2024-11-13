/** @type {import('next').NextConfig} */

const nextConfig = {
    images: { 
        domains: ["imgs.search.brave.com", "localhost", "10.10.1.126", "via.placeholder.com"],  // Adicione "via.placeholder.com"
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '10.10.1.126',
                port: '5001',  // Substitua pela porta do seu servidor
                pathname: '/uploads/**',  // Caminho para os uploads de imagem
            },
        ],
    },
};

export default nextConfig;
