/** @type {import('next').NextConfig} */

const nextConfig = {
    images: { 
        domains: ["imgs.search.brave.com", "localhost", "10.10.1.105", "via.placeholder.com"],  // Adicione "via.placeholder.com"
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '10.10.1.105',
                port: '5001', 
                pathname: '/uploads/**',
            },
        ],
    },
};

export default nextConfig;