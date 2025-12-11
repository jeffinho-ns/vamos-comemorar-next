'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string | any; // Aceita string ou import estático do Next.js
  fallbackSrc?: string;
}

export default function SafeImage({ src, alt, fallbackSrc = '/images/default-logo.png', ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt || 'Image'}
      onError={handleError}
      {...props}
    />
  );
}

