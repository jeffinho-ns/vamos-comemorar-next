"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MdClose, MdCake, MdPeople, MdEvent, MdLocalBar, MdRestaurant, MdCardGiftcard, MdContactPhone, MdEmail, MdDescription, MdImage, MdPalette, MdAttachMoney } from "react-icons/md";
import { BirthdayReservation } from "../../services/birthdayService";
import SafeImage from "../SafeImage";

interface BirthdayDetailsModalProps {
  reservation: BirthdayReservation | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BirthdayDetailsModal({ reservation, isOpen, onClose }: BirthdayDetailsModalProps) {
  if (!isOpen || !reservation) return null;

  const formatDate = (dateString: string) => {
    // Corrigir problema de timezone: usar apenas a data sem hora
    if (!dateString) return '';
    
    try {
      // Se a data contém 'T' (formato ISO com hora), extrair apenas a parte da data
      if (dateString.includes('T')) {
        const dateOnly = dateString.split('T')[0];
        const [year, month, day] = dateOnly.split('-');
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
      }
      
      // Se já está no formato YYYY-MM-DD, formatar diretamente
      if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [year, month, day] = dateString.split('-');
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
      }
      
      // Fallback: tentar usar Date mas ajustar para timezone local
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Usar métodos locais para evitar problemas de timezone
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      return dateString; // Retornar original se não conseguir formatar
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  // Função para formatar valores em reais com vírgula
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const isValidImageUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    // Verifica se é uma URL válida (http/https) ou um caminho que começa com /
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      // Se não for uma URL válida, verifica se é um caminho relativo válido
      return url.startsWith('/') && (url.includes('.') || url.includes('assets/'));
    }
  };

  const parseListaPresentes = (listaPresentes: any): any[] => {
    try {
      if (typeof listaPresentes === 'string') {
        return JSON.parse(listaPresentes);
      }
      if (Array.isArray(listaPresentes)) {
        return listaPresentes;
      }
      return [];
    } catch (error) {
      console.error('Erro ao processar lista de presentes:', error);
      return [];
    }
  };

  const getBebidasItems = () => {
    const items = [];
    if (reservation.bebida_balde_budweiser && reservation.bebida_balde_budweiser > 0) {
      items.push({ nome: 'Balde Budweiser', quantidade: reservation.bebida_balde_budweiser });
    }
    if (reservation.bebida_balde_corona && reservation.bebida_balde_corona > 0) {
      items.push({ nome: 'Balde Corona', quantidade: reservation.bebida_balde_corona });
    }
    if (reservation.bebida_balde_heineken && reservation.bebida_balde_heineken > 0) {
      items.push({ nome: 'Balde Heineken', quantidade: reservation.bebida_balde_heineken });
    }
    if (reservation.bebida_combo_gin_142 && reservation.bebida_combo_gin_142 > 0) {
      items.push({ nome: 'Combo Gin 142', quantidade: reservation.bebida_combo_gin_142 });
    }
    if (reservation.bebida_licor_rufus && reservation.bebida_licor_rufus > 0) {
      items.push({ nome: 'Licor Rufus', quantidade: reservation.bebida_licor_rufus });
    }
    return items;
  };

  const [menuItems, setMenuItems] = useState<{ bebidas: any[], comidas: any[] }>({ bebidas: [], comidas: [] });
  const [menuLoading, setMenuLoading] = useState(true);

  // Função para resolver URL de imagem do cardápio
  const getCardapioImageUrl = (imageUrl?: string | null): string => {
    if (!imageUrl || typeof imageUrl !== 'string') {
      return '/placeholder-cardapio.svg';
    }

    const trimmed = imageUrl.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
      return '/placeholder-cardapio.svg';
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (trimmed.includes('res.cloudinary.com')) {
        return trimmed;
      }
      return trimmed;
    }

    const cleanFilename = trimmed.startsWith('/') ? trimmed.substring(1) : trimmed;
    const filename = cleanFilename.split('/').pop() || cleanFilename;
    
    if (filename && filename !== 'null' && filename !== 'undefined') {
      return `https://res.cloudinary.com/drjovtmuw/image/upload/v1764862686/cardapio-agilizaiapp/${filename}`;
    }

    return '/placeholder-cardapio.svg';
  };

  // Buscar itens do cardápio quando o modal abrir
  useEffect(() => {
    if (!isOpen || !reservation || !reservation.id_casa_evento) {
      setMenuLoading(false);
      return;
    }

    const loadMenuItems = async () => {
      setMenuLoading(true);
      
      // PRIORIDADE 1: Se temos bebidas_completas e comidas_completas salvos, usar diretamente
      const bebidasCompletas = (reservation as any).bebidas_completas;
      const comidasCompletas = (reservation as any).comidas_completas;
      
      if (bebidasCompletas || comidasCompletas) {
        console.log('✅ [Modal] Usando dados completos salvos do banco');
        
        let bebidas = [];
        let comidas = [];
        
        if (bebidasCompletas) {
          if (typeof bebidasCompletas === 'string') {
            try {
              bebidas = JSON.parse(bebidasCompletas);
            } catch (e) {
              console.error('Erro ao fazer parse de bebidas_completas:', e);
            }
          } else if (Array.isArray(bebidasCompletas)) {
            bebidas = bebidasCompletas;
          }
        }
        
        if (comidasCompletas) {
          if (typeof comidasCompletas === 'string') {
            try {
              comidas = JSON.parse(comidasCompletas);
            } catch (e) {
              console.error('Erro ao fazer parse de comidas_completas:', e);
            }
          } else if (Array.isArray(comidasCompletas)) {
            comidas = comidasCompletas;
          }
        }
        
        // Formatar para o formato esperado pelo modal
        const bebidasFormatadas = bebidas
          .filter((b: any) => {
            const qty = parseInt(String(b.quantity || b.quantidade || 0)) || 0;
            return qty > 0; // Filtrar apenas itens com quantidade > 0
          })
          .map((b: any) => ({
            nome: b.name || b.nome || 'Bebida',
            quantidade: parseInt(String(b.quantity || b.quantidade || 0)) || 0,
            preco: parseFloat(String(b.price || b.preco || 0)) || 0,
            imagem: b.imageUrl || b.imagem || null,
            descricao: b.description || b.descricao || ''
          }));
        
        const comidasFormatadas = comidas
          .filter((c: any) => {
            const qty = parseInt(String(c.quantity || c.quantidade || 0)) || 0;
            return qty > 0; // Filtrar apenas itens com quantidade > 0
          })
          .map((c: any) => ({
            nome: c.name || c.nome || 'Porção',
            quantidade: parseInt(String(c.quantity || c.quantidade || 0)) || 0,
            preco: parseFloat(String(c.price || c.preco || 0)) || 0,
            imagem: c.imageUrl || c.imagem || null,
            descricao: c.description || c.descricao || ''
          }));
        
        console.log('📋 [Modal] Itens formatados:', {
          bebidas: bebidasFormatadas.length,
          comidas: comidasFormatadas.length,
          bebidas_detalhes: bebidasFormatadas,
          comidas_detalhes: comidasFormatadas
        });
        
        setMenuItems({
          bebidas: bebidasFormatadas,
          comidas: comidasFormatadas
        });
        setMenuLoading(false);
        return;
      }
      
      // PRIORIDADE 2: Fallback - buscar do cardápio (apenas se não houver dados salvos)
      console.log('⚠️ [Modal] Dados completos não encontrados, buscando do cardápio...');
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';
        const API_BASE_URL = `${API_URL}/api/cardapio`;
        
        // 1. Buscar o estabelecimento (place) para pegar o nome/slug
        const placesResponse = await fetch(`${API_URL}/api/places`);
        let establishmentName = '';
        let establishmentSlug = '';
        
        if (placesResponse.ok) {
          const placesData = await placesResponse.json();
          const places = Array.isArray(placesData) ? placesData : (placesData.data || []);
          const place = places.find((p: any) => String(p.id) === String(reservation.id_casa_evento));
          if (place) {
            establishmentName = place.name || '';
            establishmentSlug = place.slug || '';
          }
        }

        if (!establishmentName) {
          setMenuLoading(false);
          return;
        }

        // 2. Buscar bars do cardápio
        const barsResponse = await fetch(`${API_BASE_URL}/bars`);
        if (!barsResponse.ok) throw new Error('Erro ao carregar estabelecimentos do cardápio');
        
        const bars = await barsResponse.json();
        
        // Normalizar nomes para comparação
        const normalizeName = (name: string) => {
          return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/[^a-z0-9\s]/g, '');
        };
        
        const simplifyName = (name: string) => {
          return normalizeName(name)
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, '');
        };
        
        const normalizedEstablishmentName = normalizeName(establishmentName);
        const simplifiedEstablishmentName = simplifyName(establishmentName);
        
        // Buscar bar por slug, ID ou nome
        let bar = null;
        if (establishmentSlug) {
          bar = bars.find((b: any) => b.slug === establishmentSlug);
        }
        if (!bar && reservation.id_casa_evento) {
          bar = bars.find((b: any) => String(b.id) === String(reservation.id_casa_evento));
        }
        if (!bar) {
          bar = bars.find((b: any) => {
            const normalizedBarName = normalizeName(b.name);
            const simplifiedBarName = simplifyName(b.name);
            return normalizedBarName === normalizedEstablishmentName || 
                   simplifiedBarName === simplifiedEstablishmentName ||
                   normalizedBarName.includes(normalizedEstablishmentName) ||
                   normalizedEstablishmentName.includes(normalizedBarName);
          });
        }

        if (!bar) {
          console.warn('Bar não encontrado no cardápio');
          setMenuLoading(false);
          return;
        }

        // 3. Buscar categorias e itens
        const [categoriesResponse, itemsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/categories`),
          fetch(`${API_BASE_URL}/items`)
        ]);

        if (!categoriesResponse.ok || !itemsResponse.ok) {
          throw new Error('Erro ao carregar dados do cardápio');
        }

        const [categories, items] = await Promise.all([
          categoriesResponse.json(),
          itemsResponse.json()
        ]);

        // 4. Processar selos dos itens
        const processedItems = items.map((item: any) => {
          let seals = [];
          if (item.seals) {
            if (Array.isArray(item.seals)) {
              seals = item.seals;
            } else if (typeof item.seals === 'string') {
              try {
                seals = JSON.parse(item.seals);
                if (!Array.isArray(seals)) seals = [];
              } catch (e) {
                seals = [];
              }
            }
          }
          return { ...item, seals };
        });

        // 5. Filtrar itens do bar e visíveis
        const normalizedBarId = String(bar.id);
        const barItemsFiltered = processedItems.filter((item: any) => {
          const matchesBar = String(item.barId) === normalizedBarId;
          const isVisible = item.visible === undefined || item.visible === null || item.visible === 1 || item.visible === true;
          return matchesBar && isVisible;
        });

        // 6. Buscar selos customizados do bar
        const customSeals = bar.custom_seals || [];

        // 7. Filtrar categorias de bebidas e comidas
        const beverageCategories = categories.filter((cat: any) => {
          const categoryName = normalizeName(cat.name || '');
          return categoryName === 'drinks' || 
                 categoryName === 'carta de vinho' ||
                 categoryName === 'bebidas' ||
                 categoryName.includes('drink') || 
                 categoryName.includes('vinho') ||
                 categoryName.includes('bebida');
        }).map((cat: any) => String(cat.id));

        const foodCategories = categories.filter((cat: any) => {
          const categoryName = normalizeName(cat.name || '');
          return categoryName === 'menu' || categoryName.includes('menu');
        }).map((cat: any) => String(cat.id));

        // 8. Filtrar itens com selo B-day
        const beveragesWithBday = barItemsFiltered.filter((item: any) => {
          const hasBeverageCategory = beverageCategories.includes(String(item.categoryId));
          if (!hasBeverageCategory) return false;
          
          if (!item.seals || !Array.isArray(item.seals) || item.seals.length === 0) {
            return false;
          }

          return item.seals.some((sealId: string) => {
            if (!sealId || typeof sealId !== 'string') return false;
            
            const normalizedSeal = simplifyName(sealId);
            
            if (normalizedSeal.includes('b-day') || 
                normalizedSeal.includes('bday') ||
                normalizedSeal.includes('birthday')) {
              return true;
            }
            
            const customSeal = customSeals.find((cs: any) => cs.id === sealId);
            if (customSeal) {
              const customSealName = simplifyName(customSeal.name || '');
              if (customSealName.includes('b-day') || 
                  customSealName.includes('bday') ||
                  customSealName.includes('birthday')) {
                return true;
              }
            }
            
            return false;
          });
        });

        const foodsWithBday = barItemsFiltered.filter((item: any) => {
          const hasFoodCategory = foodCategories.includes(String(item.categoryId));
          if (!hasFoodCategory) return false;
          
          if (!item.seals || !Array.isArray(item.seals) || item.seals.length === 0) {
            return false;
          }

          return item.seals.some((sealId: string) => {
            if (!sealId || typeof sealId !== 'string') return false;
            
            const normalizedSeal = simplifyName(sealId);
            
            if (normalizedSeal.includes('b-day') || 
                normalizedSeal.includes('bday') ||
                normalizedSeal.includes('birthday')) {
              return true;
            }
            
            const customSeal = customSeals.find((cs: any) => cs.id === sealId);
            if (customSeal) {
              const customSealName = simplifyName(customSeal.name || '');
              if (customSealName.includes('b-day') || 
                  customSealName.includes('bday') ||
                  customSealName.includes('birthday')) {
                return true;
              }
            }
            
            return false;
          });
        });

        // 9. Mapear itens selecionados na reserva com os itens do cardápio
        const bebidasSelecionadas = [];
        const comidasSelecionadas = [];

        // Mapear bebidas (na ordem que foram salvas)
        for (let i = 1; i <= 10; i++) {
          const quantidade = reservation[`item_bar_bebida_${i}` as keyof BirthdayReservation] as number;
          if (quantidade && quantidade > 0) {
            // Pegar o item na posição correspondente da lista filtrada
            const itemIndex = i - 1;
            if (itemIndex < beveragesWithBday.length) {
              const item = beveragesWithBday[itemIndex];
              bebidasSelecionadas.push({
                nome: item.name || `Bebida ${i}`,
                quantidade,
                preco: parseFloat(item.price) || 0,
                imagem: item.imageUrl || null,
                descricao: item.description || ''
              });
            } else {
              // Se não encontrou na posição, adicionar como genérico
              bebidasSelecionadas.push({
                nome: `Bebida ${i}`,
                quantidade,
                preco: 0,
                imagem: null,
                descricao: ''
              });
            }
          }
        }

        // Mapear comidas (na ordem que foram salvas)
        for (let i = 1; i <= 10; i++) {
          const quantidade = reservation[`item_bar_comida_${i}` as keyof BirthdayReservation] as number;
          if (quantidade && quantidade > 0) {
            // Pegar o item na posição correspondente da lista filtrada
            const itemIndex = i - 1;
            if (itemIndex < foodsWithBday.length) {
              const item = foodsWithBday[itemIndex];
              comidasSelecionadas.push({
                nome: item.name || `Porção ${i}`,
                quantidade,
                preco: parseFloat(item.price) || 0,
                imagem: item.imageUrl || null,
                descricao: item.description || ''
              });
            } else {
              // Se não encontrou na posição, adicionar como genérico
              comidasSelecionadas.push({
                nome: `Porção ${i}`,
                quantidade,
                preco: 0,
                imagem: null,
                descricao: ''
              });
            }
          }
        }

        setMenuItems({
          bebidas: bebidasSelecionadas,
          comidas: comidasSelecionadas
        });
      } catch (error) {
        console.error('Erro ao carregar itens do cardápio:', error);
        // Em caso de erro, usar os itens genéricos
        const bebidas = [];
        const comidas = [];
        
        for (let i = 1; i <= 10; i++) {
          const quantidadeBebida = reservation[`item_bar_bebida_${i}` as keyof BirthdayReservation] as number;
          if (quantidadeBebida && quantidadeBebida > 0) {
            bebidas.push({ nome: `Bebida ${i}`, quantidade: quantidadeBebida, preco: 0, imagem: null, descricao: '' });
          }
          
          const quantidadeComida = reservation[`item_bar_comida_${i}` as keyof BirthdayReservation] as number;
          if (quantidadeComida && quantidadeComida > 0) {
            comidas.push({ nome: `Porção ${i}`, quantidade: quantidadeComida, preco: 0, imagem: null, descricao: '' });
          }
        }
        
        setMenuItems({ bebidas, comidas });
      } finally {
        setMenuLoading(false);
      }
    };

    loadMenuItems();
  }, [isOpen, reservation]);

  const bebidasItems = getBebidasItems();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <MdCake className="text-3xl" />
              <div>
                <h2 className="text-2xl font-bold">Detalhes do Aniversariante</h2>
                <p className="text-yellow-100">{reservation.place_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-yellow-200 transition-colors"
            >
              <MdClose className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdCake className="text-yellow-500" />
                Informações do Aniversariante
              </h3>
              <div className="space-y-2">
                <p><span className="font-medium">Nome:</span> {reservation.aniversariante_nome}</p>
                <p><span className="font-medium">Data do Aniversário:</span> {formatDate(reservation.data_aniversario)}</p>
                <p><span className="font-medium">Quantidade de Convidados:</span> {reservation.quantidade_convidados}</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    reservation.status === 'confirmado' ? 'bg-green-100 text-green-800' :
                    reservation.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {reservation.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdContactPhone className="text-blue-500" />
                Contato
              </h3>
              <div className="space-y-2">
                {reservation.documento && <p><span className="font-medium">Documento:</span> {reservation.documento}</p>}
                {reservation.whatsapp && <p><span className="font-medium">WhatsApp:</span> {reservation.whatsapp}</p>}
                {reservation.email && <p><span className="font-medium">Email:</span> {reservation.email}</p>}
                {reservation.user_name && <p><span className="font-medium">Cliente:</span> {reservation.user_name}</p>}
              </div>
            </div>
          </div>

          {/* Decoração */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MdPalette className="text-purple-500" />
              Decoração
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Tipo de Decoração:</span> {reservation.decoracao_tipo || 'Não especificado'}</p>
                <p><span className="font-medium">Painel Personalizado:</span> {reservation.painel_personalizado ? 'Sim' : 'Não'}</p>
                {reservation.painel_tema && <p><span className="font-medium">Tema do Painel:</span> {reservation.painel_tema}</p>}
                {reservation.painel_frase && <p><span className="font-medium">Frase do Painel:</span> {reservation.painel_frase}</p>}
              </div>
              {reservation.painel_estoque_imagem_url && isValidImageUrl(reservation.painel_estoque_imagem_url) && (
                <div>
                  <p className="font-medium mb-2">Imagem do Painel:</p>
                  <Image 
                    src={reservation.painel_estoque_imagem_url} 
                    alt="Painel personalizado"
                    width={400}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              {reservation.painel_estoque_imagem_url && !isValidImageUrl(reservation.painel_estoque_imagem_url) && (
                <div>
                  <p className="font-medium mb-2">Referência do Painel:</p>
                  <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-600 text-sm">{reservation.painel_estoque_imagem_url}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bebidas Especiais */}
          {bebidasItems.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdLocalBar className="text-blue-500" />
                Bebidas Especiais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {bebidasItems.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border">
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-gray-600">Quantidade: {item.quantidade}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Itens do Bar */}
          {(menuItems.bebidas.length > 0 || menuItems.comidas.length > 0) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdRestaurant className="text-green-500" />
                Itens do Bar
                {menuLoading && <span className="text-sm text-gray-500 font-normal">(Carregando...)</span>}
              </h3>
              
              {menuItems.bebidas.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-3">Bebidas:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menuItems.bebidas.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                        {item.imagem && (
                          <div className="relative h-32 w-full">
                            <SafeImage
                              src={getCardapioImageUrl(item.imagem)}
                              alt={item.nome}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover"
                              unoptimized={true}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                          </div>
                        )}
                        <div className="p-3">
                          <p className="font-medium text-gray-800 mb-1">{item.nome}</p>
                          {item.descricao && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.descricao}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-green-600 font-bold">
                              {item.preco > 0 ? formatCurrency(item.preco) : 'Preço não disponível'}
                            </p>
                            <p className="text-gray-600 text-sm">
                              Qtd: <span className="font-semibold">{item.quantidade}</span>
                            </p>
                          </div>
                          {item.preco > 0 && item.quantidade > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Subtotal: {formatCurrency(item.preco * item.quantidade)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {menuItems.comidas.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Porções:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menuItems.comidas.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                        {item.imagem && (
                          <div className="relative h-32 w-full">
                            <SafeImage
                              src={getCardapioImageUrl(item.imagem)}
                              alt={item.nome}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover"
                              unoptimized={true}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                          </div>
                        )}
                        <div className="p-3">
                          <p className="font-medium text-gray-800 mb-1">{item.nome}</p>
                          {item.descricao && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.descricao}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-green-600 font-bold">
                              {item.preco > 0 ? formatCurrency(item.preco) : 'Preço não disponível'}
                            </p>
                            <p className="text-gray-600 text-sm">
                              Qtd: <span className="font-semibold">{item.quantidade}</span>
                            </p>
                          </div>
                          {item.preco > 0 && item.quantidade > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Subtotal: {formatCurrency(item.preco * item.quantidade)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lista de Presentes */}
          {(() => {
            const presentes = parseListaPresentes(reservation.lista_presentes);
            if (presentes.length > 0) {
              return (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MdCardGiftcard className="text-pink-500" />
                    Lista de Presentes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {presentes.map((presente, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border">
                        <p className="font-medium">{typeof presente === 'string' ? presente : (presente.name || presente.nome)}</p>
                        {typeof presente === 'object' && presente.price && <p className="text-gray-600">R$ {presente.price}</p>}
                        {typeof presente === 'object' && presente.category && <p className="text-gray-500 text-sm">{presente.category}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Valor Total da Reserva */}
          {(() => {
            // Preços de decoração (mesmos usados no email - deve corresponder exatamente ao backend)
            const decorationPrices: Record<string, number> = {
              'Decoração Pequena 1': 200.00,
              'Decoração Pequena 2': 220.00,
              'Decoração Media 3': 250.00,
              'Decoração Media 4': 270.00,
              'Decoração Grande 5': 300.00,
              'Decoração Grande 6': 320.00,
            };

            // Calcular valor total (mesmo cálculo usado no email - EXATAMENTE IGUAL)
            let total = 0;
            
            // Debug: log dos dados da reserva
            console.log('🔍 [Modal] Dados da reserva para cálculo:', {
              decoracao_tipo: reservation.decoracao_tipo,
              decoracao_preco: (reservation as any).decoracao_preco,
              bebidas_completas: (reservation as any).bebidas_completas,
              comidas_completas: (reservation as any).comidas_completas,
              menuItems_bebidas: menuItems.bebidas,
              menuItems_comidas: menuItems.comidas,
              bebidasItems: bebidasItems
            });
            
            // Valor da decoração (usar preço salvo no banco se disponível, senão usar mapeamento)
            const decoracaoPreco = (reservation as any).decoracao_preco;
            if (decoracaoPreco !== null && decoracaoPreco !== undefined && decoracaoPreco !== '') {
              const preco = parseFloat(String(decoracaoPreco));
              if (!isNaN(preco)) {
                total += preco;
                console.log('💰 [Modal] Decoração (do banco):', preco);
              }
            } else if (reservation.decoracao_tipo && decorationPrices[reservation.decoracao_tipo]) {
              total += decorationPrices[reservation.decoracao_tipo];
              console.log('💰 [Modal] Decoração (mapeamento):', decorationPrices[reservation.decoracao_tipo]);
            }

            // Tentar usar dados completos salvos no banco primeiro (PRIORIDADE MÁXIMA)
            const bebidasCompletas = (reservation as any).bebidas_completas;
            const comidasCompletas = (reservation as any).comidas_completas;
            
            if (bebidasCompletas) {
              // Se bebidas_completas está como string JSON, fazer parse
              let bebidas = bebidasCompletas;
              if (typeof bebidasCompletas === 'string') {
                try {
                  bebidas = JSON.parse(bebidasCompletas);
                } catch (e) {
                  console.error('❌ [Modal] Erro ao fazer parse de bebidas_completas:', e);
                  bebidas = [];
                }
              }
              
              if (Array.isArray(bebidas) && bebidas.length > 0) {
                console.log('🍺 [Modal] Usando bebidas_completas do banco:', bebidas);
                bebidas.forEach((b: any) => {
                  const price = parseFloat(String(b.price || b.preco || 0)) || 0;
                  const quantity = parseInt(String(b.quantity || b.quantidade || 0)) || 0;
                  const subtotal = price * quantity;
                  total += subtotal;
                  console.log(`   - ${b.name || b.nome}: ${quantity}x R$ ${price.toFixed(2)} = R$ ${subtotal.toFixed(2)}`);
                });
              }
            } else {
              // Fallback: usar preços do cardápio carregados (apenas se não houver dados salvos)
              console.log('⚠️ [Modal] bebidas_completas não encontrado, usando menuItems.bebidas');
              menuItems.bebidas.forEach(item => {
                const itemPrice = parseFloat(String(item.preco)) || 0;
                const itemQuantity = parseInt(String(item.quantidade)) || 0;
                const subtotal = itemPrice * itemQuantity;
                total += subtotal;
                if (subtotal > 0) {
                  console.log(`   - ${item.nome}: ${itemQuantity}x R$ ${itemPrice.toFixed(2)} = R$ ${subtotal.toFixed(2)}`);
                }
              });
            }

            if (comidasCompletas) {
              // Se comidas_completas está como string JSON, fazer parse
              let comidas = comidasCompletas;
              if (typeof comidasCompletas === 'string') {
                try {
                  comidas = JSON.parse(comidasCompletas);
                } catch (e) {
                  console.error('❌ [Modal] Erro ao fazer parse de comidas_completas:', e);
                  comidas = [];
                }
              }
              
              if (Array.isArray(comidas) && comidas.length > 0) {
                console.log('🍕 [Modal] Usando comidas_completas do banco:', comidas);
                comidas.forEach((c: any) => {
                  const price = parseFloat(String(c.price || c.preco || 0)) || 0;
                  const quantity = parseInt(String(c.quantity || c.quantidade || 0)) || 0;
                  const subtotal = price * quantity;
                  total += subtotal;
                  console.log(`   - ${c.name || c.nome}: ${quantity}x R$ ${price.toFixed(2)} = R$ ${subtotal.toFixed(2)}`);
                });
              }
            } else {
              // Fallback: usar preços do cardápio carregados (apenas se não houver dados salvos)
              console.log('⚠️ [Modal] comidas_completas não encontrado, usando menuItems.comidas');
              menuItems.comidas.forEach(item => {
                const itemPrice = parseFloat(String(item.preco)) || 0;
                const itemQuantity = parseInt(String(item.quantidade)) || 0;
                const subtotal = itemPrice * itemQuantity;
                total += subtotal;
                if (subtotal > 0) {
                  console.log(`   - ${item.nome}: ${itemQuantity}x R$ ${itemPrice.toFixed(2)} = R$ ${subtotal.toFixed(2)}`);
                }
              });
            }

            // Valor das bebidas especiais (preços fixos conhecidos)
            bebidasItems.forEach(item => {
              const specialPrices: Record<string, number> = {
                'Balde Budweiser': 50.0,
                'Balde Corona': 55.0,
                'Balde Heineken': 60.0,
                'Combo Gin 142': 80.0,
                'Licor Rufus': 45.0,
              };
              const price = specialPrices[item.nome] || 0;
              const quantity = parseInt(String(item.quantidade)) || 0;
              const subtotal = price * quantity;
              total += subtotal;
              if (subtotal > 0) {
                console.log(`🍻 [Modal] Bebida especial: ${item.nome} - ${quantity}x R$ ${price.toFixed(2)} = R$ ${subtotal.toFixed(2)}`);
              }
            });

            console.log('✅ [Modal] Valor total calculado: R$', total.toFixed(2));

            return (
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <MdAttachMoney className="text-orange-500" />
                  Valor Total da Reserva
                </h3>
                <p className="text-4xl font-bold text-orange-600 mb-2">
                  {formatCurrency(total)}
                </p>
                <p className="text-sm text-gray-600 italic">
                  Este valor será adicionado à comanda no estabelecimento.
                </p>
              </div>
            );
          })()}

          {/* Informações Adicionais */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MdEvent className="text-orange-500" />
              Informações do Evento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Data de Criação:</span> {formatDate(reservation.created_at)}</p>
                <p><span className="font-medium">Última Atualização:</span> {formatDate(reservation.updated_at)}</p>
              </div>
              <div>
                <p><span className="font-medium">ID da Reserva:</span> #{reservation.id}</p>
                <p><span className="font-medium">ID do Usuário:</span> {reservation.user_id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 