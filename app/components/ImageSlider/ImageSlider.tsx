// components/ImageSlider.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface ImageSliderProps {
  images: string[];
  interval?: number;
  /** Mostra a imagem inteira, na proporção original, sem corte. */
  preserveImage?: boolean;
}

const ImageSlider: React.FC<ImageSliderProps> = ({
  images,
  interval = 5000,
  preserveImage = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratios, setRatios] = useState<Record<string, number>>({});

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  if (images.length === 0) return null;

  const safeIndex = currentIndex % images.length;
  const activeSrc = images[safeIndex];
  const activeRatio = ratios[activeSrc] ?? 16 / 9;

  return (
    <div
      className={
        preserveImage
          ? 'relative z-0 w-full overflow-hidden'
          : 'relative z-0 h-full w-full overflow-hidden'
      }
      style={preserveImage ? { aspectRatio: String(activeRatio) } : undefined}
    >
      {images.map((src, index) => {
        const active = index === safeIndex;
        const unoptimized = src.startsWith('blob:') || src.startsWith('data:');

        return (
          <Image
            key={`${src}-${index}`}
            src={src}
            alt={active ? `Imagem ${index + 1} de ${images.length}` : ''}
            fill
            sizes="100vw"
            quality={72}
            priority={index === 0}
            loading={index === 0 ? undefined : 'eager'}
            aria-hidden={!active}
            unoptimized={unoptimized}
            className={`transition-opacity duration-700 ease-in-out ${
              preserveImage ? 'object-contain' : 'object-cover'
            } ${active ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
            onLoad={(event) => {
              if (!preserveImage) return;
              const img = event.currentTarget;
              if (img.naturalWidth <= 0 || img.naturalHeight <= 0) return;
              const nextRatio = img.naturalWidth / img.naturalHeight;
              setRatios((prev) =>
                prev[src] === nextRatio ? prev : { ...prev, [src]: nextRatio },
              );
            }}
          />
        );
      })}
    </div>
  );
};

export default ImageSlider;
