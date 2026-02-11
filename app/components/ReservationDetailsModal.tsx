"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MdClose, 
  MdPerson, 
  MdPhone, 
  MdEmail, 
  MdAccessTime, 
  MdPeople, 
  MdLocationOn, 
  MdNote,
  MdCalendarToday,
  MdEdit,
  MdDelete,
  MdCheckCircle,
  MdCancel,
  MdPlaylistAdd,
  MdEvent,
  MdCake,
  MdAttachMoney,
  MdVisibility
} from "react-icons/md";

import { Reservation } from '@/app/types/reservation';
import LinkReservationToEventModal from './LinkReservationToEventModal';
import BirthdayDetailsModal from './painel/BirthdayDetailsModal';
import { BirthdayReservation } from '@/app/services/birthdayService';
import {
  getReservationStatusColor,
  getReservationStatusText,
  isReservationStatus,
} from "@/app/utils/reservationStatus";

interface ReservationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  isReservaRooftop?: boolean;
  onEdit?: (reservation: Reservation) => void;
  onDelete?: (reservation: Reservation) => void;
  onStatusChange?: (reservation: Reservation, newStatus: string) => void;
  onAddGuestList?: (reservation: Reservation) => void;
}

export default function ReservationDetailsModal({
  isOpen,
  onClose,
  reservation,
  isReservaRooftop = false,
  onEdit,
  onDelete,
  onStatusChange,
  onAddGuestList
}: ReservationDetailsModalProps) {
  const [showLinkEventModal, setShowLinkEventModal] = useState(false);
  const [birthdayReservation, setBirthdayReservation] = useState<BirthdayReservation | null>(null);
  const [loadingBirthday, setLoadingBirthday] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [menuItems, setMenuItems] = useState<{ bebidas: any[], comidas: any[] }>({ bebidas: [], comidas: [] });
  const [menuLoading, setMenuLoading] = useState(false);

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

  // Buscar itens do cardápio quando houver reserva de aniversário
  useEffect(() => {
    if (!isOpen || !birthdayReservation || !birthdayReservation.id_casa_evento) {
      setMenuLoading(false);
      return;
    }

    const loadMenuItems = async () => {
      setMenuLoading(true);
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
          const place = places.find((p: any) => String(p.id) === String(birthdayReservation.id_casa_evento));
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
        if (!bar && birthdayReservation.id_casa_evento) {
          bar = bars.find((b: any) => String(b.id) === String(birthdayReservation.id_casa_evento));
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
          const quantidade = (birthdayReservation as any)[`item_bar_bebida_${i}`] as number;
          if (quantidade && quantidade > 0) {
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
          const quantidade = (birthdayReservation as any)[`item_bar_comida_${i}`] as number;
          if (quantidade && quantidade > 0) {
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
        setMenuItems({ bebidas: [], comidas: [] });
      } finally {
        setMenuLoading(false);
      }
    };

    loadMenuItems();
  }, [isOpen, birthdayReservation]);

  // Buscar reserva de aniversário relacionada quando o modal abrir
  useEffect(() => {
    if (isOpen && reservation) {
      const fetchBirthdayReservation = async () => {
        setLoadingBirthday(true);
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';
          const token = localStorage.getItem('authToken');
          
          console.log('🔍 [ReservationDetailsModal] Buscando reserva de aniversário para reserva:', {
            reservationId: reservation.id,
            establishmentId: reservation.establishment_id,
            clientName: reservation.client_name
          });
          
          if (reservation.establishment_id) {
            const response = await fetch(`${API_URL}/api/birthday-reservations?establishment_id=${reservation.establishment_id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              const birthdayReservations = Array.isArray(data) ? data : (data.data || []);
              
              console.log('🎂 [ReservationDetailsModal] Reservas de aniversário encontradas:', birthdayReservations.length);
              console.log('🎂 [ReservationDetailsModal] Procurando por restaurant_reservation_id:', reservation.id);
              console.log('🎂 [ReservationDetailsModal] Dados completos das reservas:', birthdayReservations.map((br: any) => ({
                id: br.id,
                aniversariante_nome: br.aniversariante_nome,
                restaurant_reservation_id: br.restaurant_reservation_id,
                restaurant_reservation_id_type: typeof br.restaurant_reservation_id,
                client_name: br.client_name,
                data_aniversario: br.data_aniversario,
                todasChaves: Object.keys(br)
              })));
              
              // Buscar reserva de aniversário que tenha restaurant_reservation_id igual ao id desta reserva
              // Tentar várias formas de comparação para garantir compatibilidade
              const related = birthdayReservations.find((br: any) => {
                const brRestaurantId = br.restaurant_reservation_id;
                const reservationId = reservation.id;
                
                // Log para debug de TODAS as reservas
                console.log('🔍 [ReservationDetailsModal] Comparando reserva de aniversário:', {
                  brId: br.id,
                  brAniversariante: br.aniversariante_nome,
                  brRestaurantId: brRestaurantId,
                  brRestaurantIdType: typeof brRestaurantId,
                  brRestaurantIdString: String(brRestaurantId),
                  reservationId: reservationId,
                  reservationIdType: typeof reservationId,
                  reservationIdString: String(reservationId),
                  clientNameReservation: reservation.client_name,
                  clientNameBirthday: br.client_name || br.aniversariante_nome,
                  equalAsNumbers: brRestaurantId && Number(brRestaurantId) === Number(reservationId),
                  equalAsStrings: brRestaurantId && String(brRestaurantId) === String(reservationId),
                  match: brRestaurantId && (
                    Number(brRestaurantId) === Number(reservationId) ||
                    String(brRestaurantId) === String(reservationId) ||
                    brRestaurantId.toString() === reservationId.toString()
                  )
                });
                
                // Primeiro tenta por restaurant_reservation_id
                if (brRestaurantId && (
                  Number(brRestaurantId) === Number(reservationId) ||
                  String(brRestaurantId) === String(reservationId) ||
                  brRestaurantId.toString() === reservationId.toString()
                )) {
                  return true;
                }
                
                // Se não encontrar por ID, tenta por nome do cliente (fallback)
                if (reservation.client_name && (
                  br.aniversariante_nome === reservation.client_name ||
                  br.client_name === reservation.client_name ||
                  String(br.aniversariante_nome).toLowerCase().trim() === String(reservation.client_name).toLowerCase().trim()
                )) {
                  console.log('✅ [ReservationDetailsModal] Encontrado por nome do cliente:', reservation.client_name);
                  return true;
                }
                
                return false;
              });
              
              if (related) {
                console.log('✅ [ReservationDetailsModal] Reserva de aniversário encontrada!', related);
                setBirthdayReservation(related);
              } else {
                console.log('❌ [ReservationDetailsModal] Nenhuma reserva de aniversário encontrada para esta reserva');
                // Limpar estado se não encontrou
                setBirthdayReservation(null);
                setMenuItems({ bebidas: [], comidas: [] });
              }
            } else {
              console.error('❌ [ReservationDetailsModal] Erro ao buscar reservas de aniversário:', response.status, response.statusText);
            }
          } else {
            console.log('⚠️ [ReservationDetailsModal] establishment_id não disponível na reserva');
          }
        } catch (error) {
          console.error('❌ [ReservationDetailsModal] Erro ao buscar reserva de aniversário:', error);
        } finally {
          setLoadingBirthday(false);
        }
      };

      fetchBirthdayReservation();
    } else {
      setBirthdayReservation(null);
      setMenuItems({ bebidas: [], comidas: [] });
    }
  }, [isOpen, reservation]);

  if (!reservation) return null;

  // Mapeia mesas do Highline para subáreas específicas
  const getHighlineSubareaLabel = (tableNumber?: string | number) => {
    if (!tableNumber) return null;
    const n = String(tableNumber);
    if (['05','06','07','08'].includes(n)) return 'Área Deck - Frente';
    if (['01','02','03','04'].includes(n)) return 'Área Deck - Esquerdo';
    if (['09','10','11','12'].includes(n)) return 'Área Deck - Direito';
    if (['15','16','17'].includes(n)) return 'Área Bar';
    if (['50','51','52','53','54','55'].includes(n)) return 'Área Rooftop - Direito';
    if (['70','71','72','73'].includes(n)) return 'Área Rooftop - Bistrô';
    if (['44','45','46','47'].includes(n)) return 'Área Rooftop - Centro';
    if (['60','61','62','63','64','65'].includes(n)) return 'Área Rooftop - Esquerdo';
    if (['40','41','42'].includes(n)) return 'Área Rooftop - Vista';
    return null;
  };

  // Mapeia mesas do Seu Justino para subáreas específicas
  const getSeuJustinoSubareaLabel = (tableNumber?: string | number) => {
    if (!tableNumber) return null;
    const n = String(tableNumber).trim();
    // Suporta múltiplas mesas separadas por vírgula
    const tableNumbers = n.includes(',') ? n.split(',').map(t => t.trim()) : [n];
    
    // Lounge (area_id 1)
    if (tableNumbers.some(t => ['200','202'].includes(t))) return 'Lounge Bar';
    if (tableNumbers.some(t => ['204','206'].includes(t))) return 'Lounge Palco';
    if (tableNumbers.some(t => ['208'].includes(t))) return 'Lounge Aquario TV';
    if (tableNumbers.some(t => ['210'].includes(t))) return 'Lounge Aquario Spaten';
    // Quintal (area_id 2)
    if (tableNumbers.some(t => ['20','22','24','26','28','29'].includes(t))) return 'Quintal Lateral Esquerdo';
    if (tableNumbers.some(t => ['30','32','34','36','38','39'].includes(t))) return 'Quintal Central Esquerdo';
    if (tableNumbers.some(t => ['40','42','44','46','48'].includes(t))) return 'Quintal Central Direito';
    if (tableNumbers.some(t => ['50','52','54','56','58','60','62','64'].includes(t))) return 'Quintal Lateral Direito';
    return null;
  };

  // Determina o nome da área baseado no número da mesa
  const getSubareaLabel = (tableNumber?: string | number, areaName?: string, areaId?: number) => {
    // Primeiro tentar pelo Seu Justino (mais específico)
    const seuJustinoArea = getSeuJustinoSubareaLabel(tableNumber);
    if (seuJustinoArea) return seuJustinoArea;
    
    // Depois tentar Highline
    const highlineArea = getHighlineSubareaLabel(tableNumber);
    if (highlineArea) return highlineArea;
    
    // Se não encontrou pela mesa, verificar se area_name já está correto (não é "Área Coberta" ou "Área Descoberta")
    if (areaName && !areaName.toLowerCase().includes('área coberta') && !areaName.toLowerCase().includes('área descoberta')) {
      return areaName;
    }
    
    // Fallback: retornar area_name original
    return areaName || null;
  };

  const derivedAreaName = getSubareaLabel(
    (reservation as any).table_number, 
    reservation.area_name, 
    (reservation as any).area_id
  ) || reservation.area_name;

  const getStatusColor = (status: string, notes?: string) => {
    // Verificar se é espera antecipada primeiro
    if (notes && notes.includes('ESPERA ANTECIPADA')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return getReservationStatusColor(status, {
      withBorder: true,
      isReservaRooftop,
    });
  };

  const getStatusText = (status: string, notes?: string) => {
    // Verificar se é espera antecipada primeiro
    if (notes && notes.includes('ESPERA ANTECIPADA')) {
      return 'ESPERA ANTECIPADA';
    }
    return getReservationStatusText(status, { isReservaRooftop });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(reservation, newStatus);
    }
  };

  const statusActionButtonBaseClass =
    "w-full h-11 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium";
  const footerActionButtonBaseClass =
    "w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="reservation-details-modal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Detalhes da Reserva
                </h2>
                <p className="text-gray-600 mt-1">
                  ID: #{reservation.id}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Status Badge */}
              <div className="mb-6">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(reservation.status, reservation.notes)}`}>
                  {getStatusText(reservation.status, reservation.notes)}
                </span>
                {(reservation as any).notes && (reservation as any).notes.includes('ESPERA ANTECIPADA') && (
                  <div className="mt-2 text-sm text-orange-700 font-medium">
                    ⏳ Esta reserva está na fila de espera antecipada (Bistrô) e não possui mesa atribuída.
                  </div>
                )}
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MdPerson className="text-blue-600" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nome Completo
                    </label>
                    <p className="text-gray-800 font-medium">{reservation.client_name}</p>
                  </div>
                  
                  {reservation.client_phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Telefone
                      </label>
                      <p className="text-gray-800 flex items-center gap-2">
                        <MdPhone className="text-gray-400" />
                        {reservation.client_phone}
                      </p>
                    </div>
                  )}

                  {reservation.client_email && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Email
                      </label>
                      <p className="text-gray-800 flex items-center gap-2">
                        <MdEmail className="text-gray-400" />
                        {reservation.client_email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reservation Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MdCalendarToday className="text-green-600" />
                  Detalhes da Reserva
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Data
                    </label>
                    <p className="text-gray-800 flex items-center gap-2">
                      <MdCalendarToday className="text-gray-400" />
                      {formatDate(reservation.reservation_date)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Horário
                    </label>
                    <p className="text-gray-800 flex items-center gap-2">
                      <MdAccessTime className="text-gray-400" />
                      {formatTime(reservation.reservation_time)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Número de Pessoas
                    </label>
                    <p className="text-gray-800 flex items-center gap-2">
                      <MdPeople className="text-gray-400" />
                      {reservation.number_of_people} pessoa{reservation.number_of_people !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Área
                    </label>
                    <p className="text-gray-800 flex items-center gap-2">
                      <MdLocationOn className="text-gray-400" />
                      {derivedAreaName}
                    </p>
                  </div>

                  {reservation.table_number && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Mesa
                      </label>
                      <p className="text-gray-800 flex items-center gap-2">
                        <span>Mesa {reservation.table_number}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Loading state para reserva de aniversário */}
              {loadingBirthday && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-500">Verificando informações de aniversário...</p>
                </div>
              )}

              {/* Notes */}
              {reservation.notes && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MdNote className="text-purple-600" />
                    Observações
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {reservation.notes}
                  </p>
                </div>
              )}

              {/* Valor Total da Reserva de Aniversário */}
              {birthdayReservation && (() => {
                console.log('💰 [ReservationDetailsModal] Calculando valor total para reserva de aniversário:', {
                  birthdayReservationId: birthdayReservation.id,
                  decoracaoTipo: birthdayReservation.decoracao_tipo,
                  decoracaoPreco: (birthdayReservation as any).decoracao_preco,
                  bebidasCompletas: (birthdayReservation as any).bebidas_completas,
                  comidasCompletas: (birthdayReservation as any).comidas_completas,
                  menuItemsBebidas: menuItems.bebidas.length,
                  menuItemsComidas: menuItems.comidas.length,
                  menuLoading
                });

                // Preços de decoração (mesmos da página de reserva)
                const decorationPrices: Record<string, number> = {
                  'Decoração Pequena 1': 200.0,
                  'Decoração Pequena 2': 220.0,
                  'Decoração Media 3': 250.0,
                  'Decoração Media 4': 270.0,
                  'Decoração Grande 5': 300.0,
                  'Decoração Grande 6': 320.0,
                };

                // Calcular valor total
                let total = 0;
                let decoValue = 0;
                let bebidasValue = 0;
                let comidasValue = 0;
                let especiaisValue = 0;
                
                // Valor da decoração (usar preço salvo no banco se disponível, senão usar mapeamento)
                const decoracaoPreco = (birthdayReservation as any).decoracao_preco;
                if (decoracaoPreco !== null && decoracaoPreco !== undefined && decoracaoPreco !== '') {
                  const preco = parseFloat(String(decoracaoPreco));
                  if (!isNaN(preco)) {
                    decoValue = preco;
                    total += decoValue;
                    console.log('💰 [ReservationDetailsModal] Decoração (do banco):', preco);
                  }
                } else if (birthdayReservation.decoracao_tipo && decorationPrices[birthdayReservation.decoracao_tipo]) {
                  decoValue = decorationPrices[birthdayReservation.decoracao_tipo];
                  total += decoValue;
                  console.log('💰 [ReservationDetailsModal] Decoração (mapeamento):', decoValue);
                }

                // Tentar usar dados completos salvos no banco primeiro (PRIORIDADE MÁXIMA)
                const bebidasCompletas = (birthdayReservation as any).bebidas_completas;
                const comidasCompletas = (birthdayReservation as any).comidas_completas;
                
                if (bebidasCompletas) {
                  // Se bebidas_completas está como string JSON, fazer parse
                  let bebidas = bebidasCompletas;
                  if (typeof bebidasCompletas === 'string') {
                    try {
                      bebidas = JSON.parse(bebidasCompletas);
                    } catch (e) {
                      console.error('❌ [ReservationDetailsModal] Erro ao fazer parse de bebidas_completas:', e);
                      bebidas = [];
                    }
                  }
                  
                  if (Array.isArray(bebidas) && bebidas.length > 0) {
                    console.log('🍺 [ReservationDetailsModal] Usando bebidas_completas do banco:', bebidas);
                    bebidas.forEach((b: any) => {
                      const price = parseFloat(String(b.price || b.preco || 0)) || 0;
                      const quantity = parseInt(String(b.quantity || b.quantidade || 0)) || 0;
                      const subtotal = price * quantity;
                      bebidasValue += subtotal;
                      total += subtotal;
                      console.log(`   - ${b.name || b.nome}: ${quantity}x R$ ${price.toFixed(2)} = R$ ${subtotal.toFixed(2)}`);
                    });
                  }
                } else {
                  // Fallback: usar preços do cardápio carregados (apenas se não houver dados salvos)
                  console.log('⚠️ [ReservationDetailsModal] bebidas_completas não encontrado, usando menuItems.bebidas');
                  menuItems.bebidas.forEach(item => {
                    const itemPrice = parseFloat(String(item.preco)) || 0;
                    const itemQuantity = parseInt(String(item.quantidade)) || 0;
                    const subtotal = itemPrice * itemQuantity;
                    bebidasValue += subtotal;
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
                      console.error('❌ [ReservationDetailsModal] Erro ao fazer parse de comidas_completas:', e);
                      comidas = [];
                    }
                  }
                  
                  if (Array.isArray(comidas) && comidas.length > 0) {
                    console.log('🍕 [ReservationDetailsModal] Usando comidas_completas do banco:', comidas);
                    comidas.forEach((c: any) => {
                      const price = parseFloat(String(c.price || c.preco || 0)) || 0;
                      const quantity = parseInt(String(c.quantity || c.quantidade || 0)) || 0;
                      const subtotal = price * quantity;
                      comidasValue += subtotal;
                      total += subtotal;
                      console.log(`   - ${c.name || c.nome}: ${quantity}x R$ ${price.toFixed(2)} = R$ ${subtotal.toFixed(2)}`);
                    });
                  }
                } else {
                  // Fallback: usar preços do cardápio carregados (apenas se não houver dados salvos)
                  console.log('⚠️ [ReservationDetailsModal] comidas_completas não encontrado, usando menuItems.comidas');
                  menuItems.comidas.forEach(item => {
                    const itemPrice = parseFloat(String(item.preco)) || 0;
                    const itemQuantity = parseInt(String(item.quantidade)) || 0;
                    const subtotal = itemPrice * itemQuantity;
                    comidasValue += subtotal;
                    total += subtotal;
                    if (subtotal > 0) {
                      console.log(`   - ${item.nome}: ${itemQuantity}x R$ ${itemPrice.toFixed(2)} = R$ ${subtotal.toFixed(2)}`);
                    }
                  });
                }

                // Valor das bebidas especiais (se houver preços)
                const bebidasEspeciaisMap: Record<string, { nome: string; preco: number }> = {
                  'bebida_balde_budweiser': { nome: 'Balde Budweiser', preco: 50.0 },
                  'bebida_balde_corona': { nome: 'Balde Corona', preco: 55.0 },
                  'bebida_balde_heineken': { nome: 'Balde Heineken', preco: 60.0 },
                  'bebida_combo_gin_142': { nome: 'Combo Gin 142', preco: 80.0 },
                  'bebida_licor_rufus': { nome: 'Licor Rufus', preco: 45.0 },
                };
                
                Object.entries(bebidasEspeciaisMap).forEach(([campo, info]) => {
                  const qtd = (birthdayReservation as any)[campo] || 0;
                  if (qtd > 0) {
                    const itemValue = info.preco * qtd;
                    especiaisValue += itemValue;
                    total += itemValue;
                    console.log('💰 [ReservationDetailsModal] Bebida Especial:', info.nome, 'Qtd:', qtd, 'Preço:', info.preco, 'Total:', itemValue);
                  }
                });

                console.log('💰 [ReservationDetailsModal] Resumo do cálculo:', {
                  decoValue,
                  bebidasValue,
                  comidasValue,
                  especiaisValue,
                  total
                });

                // Sempre exibir o valor total, mesmo se for 0, para debug
                return (
                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 rounded-xl p-6 mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <MdAttachMoney className="text-orange-500" />
                      Valor Total da Reserva
                    </h3>
                    <p className="text-4xl font-bold text-orange-600 mb-2">
                      R$ {total.toFixed(2)}
                    </p>
                    {total === 0 && (
                      <p className="text-sm text-yellow-600 mb-2">
                        ⚠️ Nenhum item com valor encontrado. Verificando cardápio...
                      </p>
                    )}
                    <p className="text-sm text-gray-600 italic">
                      Este valor será adicionado à comanda no estabelecimento.
                    </p>
                    {menuLoading && (
                      <p className="text-xs text-gray-500 mt-2">(Carregando itens do cardápio...)</p>
                    )}
                    <div className="mt-4">
                      <button
                        onClick={() => setShowBirthdayModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                      >
                        <MdVisibility size={18} />
                        Ver Detalhes Completos do Aniversário
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Status Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Ações de Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {isReservaRooftop ? (
                    <>
                      {!isReservationStatus(reservation.status, 'new') && (
                        <button
                          onClick={() => handleStatusChange('NOVA')}
                          className={`${statusActionButtonBaseClass} bg-sky-500 hover:bg-sky-600`}
                        >
                          <MdCalendarToday />
                          Reserva nova
                        </button>
                      )}

                      {!isReservationStatus(reservation.status, 'confirmed') && (
                        <button
                          onClick={() => handleStatusChange('confirmed')}
                          className={`${statusActionButtonBaseClass} bg-green-500 hover:bg-green-600`}
                        >
                          <MdCheckCircle />
                          Reserva confirmada
                        </button>
                      )}

                      {!isReservationStatus(reservation.status, 'cancelled') && (
                        <button
                          onClick={() => handleStatusChange('cancelled')}
                          className={`${statusActionButtonBaseClass} bg-red-500 hover:bg-red-600`}
                        >
                          <MdCancel />
                          Reserva cancelada
                        </button>
                      )}

                      {!isReservationStatus(reservation.status, 'seated') && (
                        <button
                          onClick={() => handleStatusChange('checked-in')}
                          className={`${statusActionButtonBaseClass} bg-indigo-500 hover:bg-indigo-600`}
                        >
                          <MdPerson />
                          Reserva sentada
                        </button>
                      )}

                      {!isReservationStatus(reservation.status, 'pending') && (
                        <button
                          onClick={() => handleStatusChange('pending')}
                          className={`${statusActionButtonBaseClass} bg-amber-500 hover:bg-amber-600`}
                        >
                          <MdAccessTime />
                          Reserva pendente
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {!isReservationStatus(reservation.status, 'confirmed') && (
                        <button
                          onClick={() => handleStatusChange('confirmed')}
                          className={`${statusActionButtonBaseClass} bg-green-500 hover:bg-green-600`}
                        >
                          <MdCheckCircle />
                          Confirmar
                        </button>
                      )}

                      {!isReservationStatus(reservation.status, 'pending') && (
                        <button
                          onClick={() => handleStatusChange('pending')}
                          className={`${statusActionButtonBaseClass} bg-yellow-500 hover:bg-yellow-600`}
                        >
                          <MdAccessTime />
                          Marcar como Pendente
                        </button>
                      )}

                      {!isReservationStatus(reservation.status, 'cancelled') && (
                        <button
                          onClick={() => handleStatusChange('cancelled')}
                          className={`${statusActionButtonBaseClass} bg-red-500 hover:bg-red-600`}
                        >
                          <MdCancel />
                          Cancelar
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(reservation)}
                    className={`${footerActionButtonBaseClass} bg-blue-500 hover:bg-blue-600`}
                  >
                    <MdEdit />
                    Editar
                  </button>
                )}
                
                {onAddGuestList && (
                  <button
                    onClick={() => onAddGuestList(reservation)}
                    className={`${footerActionButtonBaseClass} bg-purple-500 hover:bg-purple-600`}
                    title="Adicionar lista de convidados a esta reserva"
                  >
                    <MdPlaylistAdd />
                    Lista de Convidados
                  </button>
                )}
                
                {reservation.establishment_id && (
                  <button
                    onClick={() => setShowLinkEventModal(true)}
                    className={`${footerActionButtonBaseClass} bg-indigo-500 hover:bg-indigo-600`}
                    title="Vincular esta reserva a um evento e copiar a lista de convidados"
                  >
                    <MdEvent />
                    Vincular a Evento
                  </button>
                )}
                
                {onDelete && (
                  <button
                    onClick={() => onDelete(reservation)}
                    className={`${footerActionButtonBaseClass} bg-red-500 hover:bg-red-600`}
                  >
                    <MdDelete />
                    Excluir
                  </button>
                )}
              </div>

              <div className="flex justify-end mt-3">
                <button
                  onClick={onClose}
                  className={`${footerActionButtonBaseClass} bg-gray-500 hover:bg-gray-600 sm:w-auto`}
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de Vincular a Evento */}
      {reservation && reservation.establishment_id && (
        <LinkReservationToEventModal
          key="link-event-modal"
          isOpen={showLinkEventModal}
          onClose={() => setShowLinkEventModal(false)}
          reservationId={reservation.id}
          establishmentId={reservation.establishment_id}
          reservationDate={reservation.reservation_date}
          onSuccess={() => {
            // Recarregar dados se necessário
            if (onStatusChange) {
              // Forçar reload da página ou atualizar dados
              window.location.reload();
            }
          }}
        />
      )}

      {/* Modal de Detalhes do Aniversário */}
      <BirthdayDetailsModal
        reservation={birthdayReservation}
        isOpen={showBirthdayModal}
        onClose={() => setShowBirthdayModal(false)}
      />
    </AnimatePresence>
  );
}





