/** @type {import('next').NextConfig} */

const nextConfig = {
    images: { 
        domains: ["imgs.search.brave.com", "localhost", "192.168.15.3", "via.placeholder.com"],  // Adicione "via.placeholder.com"
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '192.168.15.3',
                port: '5001',  // Substitua pela porta do seu servidor
                pathname: '/uploads/**',  // Caminho para os uploads de imagem
            },
        ],
    },
};

export default nextConfig;
