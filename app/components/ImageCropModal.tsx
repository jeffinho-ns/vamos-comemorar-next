'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'framer-motion';
import { MdClose, MdCheck, MdZoomIn, MdZoomOut, MdRotateRight, MdFilter, MdAspectRatio } from 'react-icons/md';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedImageBlob: Blob) => void;
  aspectRatio?: number; // Se não fornecido, será quadrado (1:1)
  minZoom?: number;
  maxZoom?: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 1, // Quadrado por padrão
  minZoom = 1,
  maxZoom = 3,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<string>('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [outputWidth, setOutputWidth] = useState<number | null>(null);
  const [outputHeight, setOutputHeight] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Resetar estado quando uma nova imagem é carregada
  useEffect(() => {
    if (isOpen && imageSrc) {
      console.log('🔄 Iniciando carregamento da imagem no modal:', imageSrc);
      setImageLoaded(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
      setOutputWidth(null);
      setOutputHeight(null);
      
      // Verificar se a imagem carrega corretamente
      const img = new Image();
      // Só definir crossOrigin para URLs externas, não para blob URLs
      if (!imageSrc.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        console.log('✅ Imagem carregada com sucesso:', {
          src: imageSrc,
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
        setImageLoaded(true);
        
        // Calcular área de crop inicial automaticamente
        // Isso garante que croppedAreaPixels seja definido mesmo sem interação do usuário
        setTimeout(() => {
          const imgWidth = img.naturalWidth || img.width;
          const imgHeight = img.naturalHeight || img.height;
          
          // Calcular o crop inicial baseado no aspect ratio
          let cropWidth: number;
          let cropHeight: number;
          let cropX = 0;
          let cropY = 0;
          
          if (aspectRatio === 1) {
            // Quadrado: usar a menor dimensão
            const size = Math.min(imgWidth, imgHeight);
            cropWidth = size;
            cropHeight = size;
            cropX = (imgWidth - size) / 2;
            cropY = (imgHeight - size) / 2;
          } else {
            // Outros aspect ratios
            const imgAspect = imgWidth / imgHeight;
            if (imgAspect > aspectRatio) {
              // Imagem mais larga: altura é limitante
              cropHeight = imgHeight;
              cropWidth = imgHeight * aspectRatio;
              cropX = (imgWidth - cropWidth) / 2;
            } else {
              // Imagem mais alta: largura é limitante
              cropWidth = imgWidth;
              cropHeight = imgWidth / aspectRatio;
              cropY = (imgHeight - cropHeight) / 2;
            }
          }
          
          const initialCrop: CropArea = {
            x: cropX,
            y: cropY,
            width: cropWidth,
            height: cropHeight
          };
          
          console.log('📐 Área de crop inicial calculada:', initialCrop);
          setCroppedAreaPixels(initialCrop);
        }, 100); // Pequeno delay para garantir que o Cropper esteja renderizado
      };
      img.onerror = (error) => {
        console.error('❌ Erro ao carregar imagem no modal de crop:', {
          error,
          src: imageSrc,
          type: typeof imageSrc,
          isBlob: imageSrc.startsWith('blob:')
        });
        setImageLoaded(false);
        alert('Erro ao carregar a imagem. Por favor, tente novamente.');
      };
      img.src = imageSrc;
    } else if (!isOpen) {
      // Resetar quando o modal fechar
      setImageLoaded(false);
      setCroppedAreaPixels(null);
    }
  }, [isOpen, imageSrc]);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation: number) => {
    setRotation(rotation);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: CropArea, croppedAreaPixels: CropArea) => {
      console.log('📐 Área de crop atualizada:', {
        croppedArea,
        croppedAreaPixels,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
        x: croppedAreaPixels.x,
        y: croppedAreaPixels.y
      });
      // Garantir que croppedAreaPixels seja sempre definido
      if (croppedAreaPixels && croppedAreaPixels.width > 0 && croppedAreaPixels.height > 0) {
        setCroppedAreaPixels(croppedAreaPixels);
      } else {
        console.warn('⚠️ croppedAreaPixels inválido recebido:', croppedAreaPixels);
      }
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  // Aplicar filtros na imagem usando canvas
  const applyFilters = useCallback((imageData: ImageData, brightness: number, contrast: number, saturation: number, filter: string): ImageData => {
    const data = imageData.data;
    const brightnessFactor = brightness / 100;
    const contrastFactor = (contrast / 100) * 255;
    const saturationFactor = saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Aplicar brilho
      r = Math.max(0, Math.min(255, r * brightnessFactor));
      g = Math.max(0, Math.min(255, g * brightnessFactor));
      b = Math.max(0, Math.min(255, b * brightnessFactor));

      // Aplicar contraste
      r = Math.max(0, Math.min(255, ((r - 128) * contrastFactor / 128) + 128));
      g = Math.max(0, Math.min(255, ((g - 128) * contrastFactor / 128) + 128));
      b = Math.max(0, Math.min(255, ((b - 128) * contrastFactor / 128) + 128));

      // Aplicar saturação
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = Math.max(0, Math.min(255, gray + (r - gray) * saturationFactor));
      g = Math.max(0, Math.min(255, gray + (g - gray) * saturationFactor));
      b = Math.max(0, Math.min(255, gray + (b - gray) * saturationFactor));

      // Aplicar filtros pré-definidos
      switch (filter) {
        case 'grayscale':
          const grayValue = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = grayValue;
          break;
        case 'sepia':
          r = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          g = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          b = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
          break;
        case 'vintage':
          r = Math.min(255, r * 1.1);
          g = Math.min(255, g * 0.95);
          b = Math.min(255, b * 0.9);
          break;
        case 'cool':
          r = Math.max(0, r * 0.9);
          g = Math.min(255, g * 1.05);
          b = Math.min(255, b * 1.1);
          break;
        case 'warm':
          r = Math.min(255, r * 1.1);
          g = Math.min(255, g * 1.05);
          b = Math.max(0, b * 0.9);
          break;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    return imageData;
  }, []);

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CropArea,
    rotation = 0,
    targetWidth?: number,
    targetHeight?: number
  ): Promise<Blob> => {
    console.log('🎨 Iniciando getCroppedImg:', {
      imageSrc: imageSrc.substring(0, 50) + '...',
      pixelCrop,
      rotation,
      targetWidth,
      targetHeight
    });

    let image: HTMLImageElement;
    try {
      image = await createImage(imageSrc);
      console.log('✅ Imagem criada:', {
        width: image.width,
        height: image.height,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight
      });
    } catch (error) {
      console.error('❌ Erro ao criar imagem:', error);
      throw new Error(`Erro ao carregar a imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Não foi possível obter o contexto 2D do canvas');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    // Set each dimensions to double largest dimension to allow for a safe area for the
    // image to rotate in without being clipped by canvas context
    canvas.width = safeArea;
    canvas.height = safeArea;

    // Translate canvas context to a central location on image to allow rotating around the center.
    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    // Draw rotated image and store data.
    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    let imageData = ctx.getImageData(0, 0, safeArea, safeArea);

    // Aplicar filtros
    imageData = applyFilters(imageData, brightness, contrast, saturation, filter);

    // Set canvas width to final desired crop size - this will clear existing context
    const finalWidth = targetWidth || pixelCrop.width;
    const finalHeight = targetHeight || pixelCrop.height;
    
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    // Criar canvas temporário para aplicar o crop
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = safeArea;
    tempCanvas.height = safeArea;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('No 2d context');
    
    tempCtx.putImageData(imageData, 0, 0);

    // Paste generated rotate image with correct offsets for x,y crop values.
    ctx.drawImage(
      tempCanvas,
      safeArea / 2 - image.width * 0.5 - pixelCrop.x,
      safeArea / 2 - image.height * 0.5 - pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      finalWidth,
      finalHeight
    );

    // As Base64 string
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  // Tamanhos pré-definidos
  const presetSizes = [
    { label: 'Original', width: null, height: null },
    { label: 'Pequeno (300x300)', width: 300, height: 300 },
    { label: 'Médio (500x500)', width: 500, height: 500 },
    { label: 'Grande (800x800)', width: 800, height: 800 },
    { label: 'HD (1024x1024)', width: 1024, height: 1024 },
  ];

  const handleSave = async () => {
    console.log('💾 Iniciando salvamento da imagem...', {
      hasCroppedAreaPixels: !!croppedAreaPixels,
      croppedAreaPixels,
      imageSrc,
      rotation,
      outputWidth,
      outputHeight,
      imageLoaded
    });

    if (!imageLoaded) {
      console.warn('⚠️ Imagem ainda não carregou');
      alert('Por favor, aguarde a imagem carregar completamente.');
      return;
    }

    if (!croppedAreaPixels) {
      console.warn('⚠️ croppedAreaPixels não está definido, tentando calcular...');
      
      // Tentar calcular novamente se não estiver definido
      if (imageSrc) {
        const img = new Image();
        img.onload = () => {
          const imgWidth = img.naturalWidth || img.width;
          const imgHeight = img.naturalHeight || img.height;
          
          let cropWidth: number;
          let cropHeight: number;
          let cropX = 0;
          let cropY = 0;
          
          if (aspectRatio === 1) {
            const size = Math.min(imgWidth, imgHeight);
            cropWidth = size;
            cropHeight = size;
            cropX = (imgWidth - size) / 2;
            cropY = (imgHeight - size) / 2;
          } else {
            const imgAspect = imgWidth / imgHeight;
            if (imgAspect > aspectRatio) {
              cropHeight = imgHeight;
              cropWidth = imgHeight * aspectRatio;
              cropX = (imgWidth - cropWidth) / 2;
            } else {
              cropWidth = imgWidth;
              cropHeight = imgWidth / aspectRatio;
              cropY = (imgHeight - cropHeight) / 2;
            }
          }
          
          const calculatedCrop: CropArea = {
            x: cropX,
            y: cropY,
            width: cropWidth,
            height: cropHeight
          };
          
          console.log('📐 Área de crop calculada no handleSave:', calculatedCrop);
          setCroppedAreaPixels(calculatedCrop);
          
          // Tentar salvar novamente após definir croppedAreaPixels
          setTimeout(() => {
            handleSave();
          }, 100);
        };
        img.src = imageSrc;
        return;
      }
      
      alert('Por favor, ajuste a imagem antes de salvar. Aguarde a imagem carregar completamente.');
      return;
    }

    if (!imageSrc) {
      console.error('❌ imageSrc não está definido');
      alert('Erro: Nenhuma imagem foi fornecida.');
      return;
    }

    setIsProcessing(true);
    try {
      const finalWidth = outputWidth || croppedAreaPixels.width;
      const finalHeight = outputHeight || croppedAreaPixels.height;
      
      console.log('🔄 Processando imagem com dimensões:', {
        finalWidth,
        finalHeight,
        originalCrop: croppedAreaPixels
      });
      
      const croppedImage = await getCroppedImg(
        imageSrc, 
        croppedAreaPixels, 
        rotation,
        finalWidth,
        finalHeight
      );
      
      console.log('✅ Imagem processada com sucesso:', {
        blobSize: croppedImage.size,
        blobType: croppedImage.type
      });
      
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Detalhes do erro:', {
        errorMessage,
        errorName: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      alert(`Erro ao processar a imagem: ${errorMessage}. Tente novamente.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setFilter('none');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Recortar Imagem {aspectRatio === 1 ? '(Quadrado Obrigatório)' : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="relative flex-1 bg-gray-900" style={{ minHeight: '400px' }}>
            {!imageSrc ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-red-400">Erro: Nenhuma imagem fornecida</p>
              </div>
            </div>
          ) : !imageLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin mb-4 text-4xl">⏳</div>
                <p>Carregando imagem...</p>
              </div>
            </div>
          ) : (
            <div 
              className="relative w-full h-full"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${
                  filter === 'grayscale' ? 'grayscale(100%)' :
                  filter === 'sepia' ? 'sepia(100%)' :
                  filter === 'vintage' ? 'sepia(30%) contrast(110%) brightness(105%)' :
                  filter === 'cool' ? 'sepia(0%) hue-rotate(180deg)' :
                  filter === 'warm' ? 'sepia(20%) hue-rotate(-20deg)' :
                  ''
                }`,
              }}
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onRotationChange={onRotationChange}
                onCropComplete={onCropCompleteCallback}
                minZoom={minZoom}
                maxZoom={maxZoom}
                cropShape={aspectRatio === 1 ? 'rect' : 'rect'}
                showGrid={true}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-gray-200 space-y-4">
          {/* Zoom Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zoom
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setZoom(Math.max(minZoom, zoom - 0.1))}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                <MdZoomOut className="h-5 w-5" />
              </button>
              <input
                type="range"
                min={minZoom}
                max={maxZoom}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setZoom(Math.min(maxZoom, zoom + 0.1))}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                <MdZoomIn className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600 w-16 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>

          {/* Rotation Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotação
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setRotation((rotation - 90) % 360)}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                <MdRotateRight className="h-5 w-5" />
              </button>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-16 text-right">
                {rotation}°
              </span>
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <MdFilter className="h-5 w-5" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros e Ajustes
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Resetar
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Brightness Control */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brilho: {brightness}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={1}
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Contrast Control */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraste: {contrast}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={1}
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Saturation Control */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saturação: {saturation}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={1}
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Filter Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtros
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'none', label: 'Nenhum' },
                    { value: 'grayscale', label: 'Preto e Branco' },
                    { value: 'sepia', label: 'Sépia' },
                    { value: 'vintage', label: 'Vintage' },
                    { value: 'cool', label: 'Frio' },
                    { value: 'warm', label: 'Quente' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFilter(f.value)}
                      className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        filter === f.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MdAspectRatio className="inline h-4 w-4 mr-1" />
                  Tamanho de Saída
                </label>
                <select
                  value={outputWidth && outputHeight ? `${outputWidth}x${outputHeight}` : 'original'}
                  onChange={(e) => {
                    if (e.target.value === 'original') {
                      setOutputWidth(null);
                      setOutputHeight(null);
                    } else {
                      const [w, h] = e.target.value.split('x').map(Number);
                      setOutputWidth(w);
                      setOutputHeight(h);
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {presetSizes.map((size) => (
                    <option
                      key={size.label}
                      value={size.width && size.height ? `${size.width}x${size.height}` : 'original'}
                    >
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Processando...
                </>
              ) : (
                <>
                  <MdCheck className="h-5 w-5" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

