/** @type {import('next').NextConfig} */

const nextConfig = {
    images: { 
        domains: ["imgs.search.brave.com", "localhost", "10.10.1.234", "via.placeholder.com"],  // Adicione "via.placeholder.com"
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '10.10.1.234',
                port: '5001', 
                pathname: '/uploads/**',
            },
        ],
    },
};

export default nextConfig;