'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';
import { rewriteRemoteImageToApiProxy } from '@/app/utils/apiImageProxy';

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string | any; // Aceita string ou import estático do Next.js
  fallbackSrc?: string;
}

export default function SafeImage({ src, alt, fallbackSrc = '/images/default-logo.png', ...props }: SafeImageProps) {
  const initialSrc =
    typeof src === 'string' ? rewriteRemoteImageToApiProxy(src) : src;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (typeof src === 'string') {
      setImgSrc(rewriteRemoteImageToApiProxy(src));
      setHasError(false);
    } else {
      setImgSrc(src);
      setHasError(false);
    }
  }, [src]);

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  const remoteUnopt =
    typeof imgSrc === 'string' &&
    (imgSrc.startsWith('http://') || imgSrc.startsWith('https://'));

  return (
    <Image
      src={imgSrc}
      alt={alt || 'Image'}
      onError={handleError}
      {...props}
      unoptimized={
        props.unoptimized !== undefined ? props.unoptimized : remoteUnopt
      }
    />
  );
}

