"use client";

import { useState } from 'react';
import Image, { StaticImageData } from 'next/image';

interface SafeImageProps {
  src: string | StaticImageData;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onError?: () => void;
  onLoad?: () => void;
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes,
  onError,
  onLoad,
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Se houver erro, mostrar placeholder
  if (imageError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : { width, height }}
      >
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs text-gray-500">Imagem não disponível</p>
        </div>
      </div>
    );
  }

  // Converter StaticImageData para objeto ou string conforme necessário
  // StaticImageData é um objeto com propriedades: src, height, width, blurDataURL
  const isStaticImage = typeof src === 'object' && src !== null && 'src' in src && typeof (src as any).src === 'string';
  const imageSrc = isStaticImage ? (src as StaticImageData).src : (typeof src === 'string' ? src : String(src));

  // Verificar se é URL externa (Cloudinary ou outras URLs HTTP)
  const isExternalUrl = typeof imageSrc === 'string' && (imageSrc.startsWith('http://') || imageSrc.startsWith('https://'));
  
  // Para imagens locais estáticas (StaticImageData ou arquivos da pasta public), usar img HTML diretamente
  // Imagens da pasta public (começam com /) devem ser carregadas diretamente sem otimização
  // StaticImageData sempre tem um src que aponta para /_next/static/media/...
  // Imagens da pasta public começam com / e não precisam de otimização
  const isPublicImage = typeof imageSrc === 'string' && imageSrc.startsWith('/') && !imageSrc.startsWith('/_next/');
  const isLocalStaticImage = isStaticImage || isPublicImage || (typeof imageSrc === 'string' && !isExternalUrl && imageSrc.startsWith('/_next/static/'));

  // Se for imagem local estática, usar img HTML padrão
  if (isLocalStaticImage) {
    // Para imagens da pasta public, não mostrar loading spinner pois carregam instantaneamente
    const isPublicStaticImage = isPublicImage;
    
    if (fill) {
      return (
        <div className="relative w-full h-full" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {!isPublicStaticImage && isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-0">
              <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={imageSrc}
            alt={alt}
            className={`${className} ${!isPublicStaticImage && isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: className.includes('object-cover') ? 'cover' : className.includes('object-contain') ? 'contain' : className.includes('object-fill') ? 'fill' : 'cover'
            }}
            loading={priority ? 'eager' : 'lazy'}
            onError={handleError}
            onLoad={handleLoad}
          />
        </div>
      );
    }

    return (
      <div className="relative" style={{ width, height }}>
        {!isPublicStaticImage && isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-0">
            <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${!isPublicStaticImage && isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          style={{ display: 'block' }}
          loading={priority ? 'eager' : 'lazy'}
          onError={handleError}
          onLoad={handleLoad}
        />
      </div>
    );
  }

  // Para URLs externas, usar Image do Next.js com unoptimized
  if (fill) {
    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-0">
            <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          sizes={sizes || '100vw'}
          priority={priority}
          onError={handleError}
          onLoad={handleLoad}
          unoptimized={true}
        />
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-0">
          <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={true}
      />
    </div>
  );
}

