/** @type {import('next').NextConfig} */

const nextConfig = {
    images: { 
        domains: [
            "vamos-comemorar-api.onrender.com"  // Apenas o domínio da API no Render
        ],
        remotePatterns: [
            {
                protocol: 'https',  // Usando https para o Render
                hostname: 'vamos-comemorar-api.onrender.com',  // Domínio da API no Render
                pathname: '/uploads/**',  // Ajuste para o caminho correto onde as imagens são armazenadas
            },
        ],
    },
};

export default nextConfig;
