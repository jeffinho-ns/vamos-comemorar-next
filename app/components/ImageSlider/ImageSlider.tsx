// components/ImageSlider.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageSliderProps {
  images: string[];
  interval?: number;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ images, interval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Image
            src={images[currentIndex]}
            alt={`Imagem de capa ${currentIndex + 1}`}
            fill
            sizes="100vw"
            className="object-cover"
            priority={currentIndex === 0}
            unoptimized={images[currentIndex]?.includes('grupoideiaum.com.br') || images[currentIndex]?.includes('cloudinary.com') || images[currentIndex]?.startsWith('blob:') || images[currentIndex]?.includes('/placeholder-') || false}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ImageSlider;