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
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        unoptimized: false,
    },
    experimental: {
        optimizePackageImports: ['framer-motion', 'react-icons'],
    },
    serverExternalPackages: [],
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    poweredByHeader: false,
    compress: true,
    generateEtags: false,
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    output: 'standalone',
    trailingSlash: false,
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
