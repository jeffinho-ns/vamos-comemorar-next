// components/ImageSlider.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [imageRatio, setImageRatio] = useState(16 / 9);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  useEffect(() => {
    setImageRatio(16 / 9);
  }, [currentIndex]);

  const currentSrc = images[currentIndex];
  const unoptimized =
    currentSrc?.startsWith('blob:') || currentSrc?.startsWith('data:') || false;

  return (
    <div className={preserveImage ? 'relative w-full' : 'relative h-full w-full overflow-hidden'}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={preserveImage ? 'w-full' : 'absolute inset-0'}
        >
          {preserveImage ? (
            <Image
              src={currentSrc}
              alt={`Imagem de capa ${currentIndex + 1}`}
              width={1600}
              height={Math.max(1, Math.round(1600 / imageRatio))}
              sizes="100vw"
              quality={72}
              className="h-auto w-full object-contain"
              style={{ width: '100%', height: 'auto' }}
              priority={currentIndex === 0}
              unoptimized={unoptimized}
              onLoad={(event) => {
                const img = event.currentTarget;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  setImageRatio(img.naturalWidth / img.naturalHeight);
                }
              }}
            />
          ) : (
            <Image
              src={currentSrc}
              alt={`Imagem de capa ${currentIndex + 1}`}
              fill
              sizes="100vw"
              quality={72}
              className="object-cover"
              priority={currentIndex === 0}
              unoptimized={unoptimized}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ImageSlider;