'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SafeImage from '../components/SafeImage';
import {
  FaBirthdayCake, FaPalette, FaGift, FaGlassCheers, FaUtensils, FaInfoCircle, FaExclamationTriangle,
  FaCheck, FaUser, FaImage, FaPlus, FaMinus, FaArrowLeft, FaArrowRight, FaTimes
} from 'react-icons/fa';
import { MdAccessTime, MdLocationOn } from 'react-icons/md';
import { BirthdayService } from '../services/birthdayService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';


interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
  slug?: string;
}

interface RestaurantArea {
  id: number;
  name: string;
  capacity_lunch: number;
  capacity_dinner: number;
}

// (Suas interfaces DecorationOption, BeverageOption, etc. permanecem as mesmas aqui)
interface DecorationOption {
  name: string;
  price: number;
  image: string;
  description: string;
}

interface BeverageOption {
  id?: number;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl?: string;
}

interface GiftOption {
  name: string;
  price: number;
  category: string;
  image: string;
}

interface FoodOption {
  id?: number;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl?: string;
}

export default function ReservaAniversarioPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('dados');

  // --- NOVO: Array para definir a ordem das seções ---
  const sections = ['dados', 'decoracao', 'painel', 'presentes'];
  const currentSectionIndex = sections.indexOf(activeSection);

  // Form data
  const [formData, setFormData] = useState({
    aniversarianteNome: '',
    documento: '',
    whatsapp: '',
    email: '',
    dataAniversario: '',
    barSelecionado: '',
    areaPreferida: '',
    horario: '',
    quantidadeConvidados: 1,
    painelTema: '',
    painelFrase: '',
  });

  // Selections
  const [selectedDecoration, setSelectedDecoration] = useState<DecorationOption | null>(null);
  const [selectedPainelOption, setSelectedPainelOption] = useState<string>('');
  const [selectedPainelImage, setSelectedPainelImage] = useState<string>('');
  const [selectedBeverages, setSelectedBeverages] = useState<Record<string, number>>({});
  const [selectedFoods, setSelectedFoods] = useState<Record<string, number>>({});
  const [selectedGifts, setSelectedGifts] = useState<GiftOption[]>([]);

  // Estados para áreas e horários
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [establishmentsLoading, setEstablishmentsLoading] = useState(true);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [areas, setAreas] = useState<RestaurantArea[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedSubareaKey, setSelectedSubareaKey] = useState<string>('');


  // Estados para modais
  const [selectedDecorationImage, setSelectedDecorationImage] = useState<string | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // (Suas opções de decoração, painel, bebidas, etc. permanecem as mesmas)
  const decorationOptions: DecorationOption[] = [
    { name: 'Decoração Pequena 1', price: 200.0, image: '/agilizai/kit-1.jpg', description: 'Decoração pequena estilo 1.' },
    { name: 'Decoração Pequena 2', price: 220.0, image: '/agilizai/kit-2.jpg', description: 'Decoração pequena estilo 2.' },
    { name: 'Decoração Media 3', price: 250.0, image: '/agilizai/kit-3.jpg', description: 'Decoração média estilo 3.' },
    { name: 'Decoração Media 4', price: 270.0, image: '/agilizai/kit-4.jpg', description: 'Decoração média estilo 4.' },
    { name: 'Decoração Grande 5', price: 300.0, image: '/agilizai/kit-5.jpg', description: 'Decoração grande estilo 5.' },
    { name: 'Decoração Grande 6', price: 320.0, image: '/agilizai/kit-6.jpg', description: 'Decoração grande estilo 6.' },
  ];

  const painelEstoqueImages = [
    '/agilizai/painel-1.jpg', '/agilizai/painel-2.jpg', '/agilizai/painel-3.jpg',
    '/agilizai/painel-4.jpg', '/agilizai/painel-5.jpg', '/agilizai/painel-6.jpg',
    '/agilizai/painel-7.jpg', '/agilizai/painel-8.jpg', '/agilizai/painel-9.jpg',
    '/agilizai/painel-10.jpg'
  ];

  // Cardápio será carregado dinamicamente quando o estabelecimento for selecionado

  const giftOptions: GiftOption[] = [
    { name: 'Lista-Presente - 1', price: 50.0, category: 'Presente', image: '/agilizai/prod-1.png' },
    { name: 'Lista-Presente - 2', price: 60.0, category: 'Presente', image: '/agilizai/prod-2.png' },
    { name: 'Lista-Presente - 3', price: 70.0, category: 'Presente', image: '/agilizai/prod-3.png' },
    { name: 'Lista-Presente - 4', price: 80.0, category: 'Presente', image: '/agilizai/prod-4.png' },
    { name: 'Lista-Presente - 5', price: 90.0, category: 'Presente', image: '/agilizai/prod-5.png' },
    { name: 'Lista-Presente - 6', price: 100.0, category: 'Presente', image: '/agilizai/prod-6.png' },
    { name: 'Lista-Presente - 7', price: 110.0, category: 'Presente', image: '/agilizai/prod-7.png' },
    { name: 'Lista-Presente - 8', price: 120.0, category: 'Presente', image: '/agilizai/prod-8.png' },
    { name: 'Lista-Presente - 9', price: 130.0, category: 'Presente', image: '/agilizai/prod-9.png' },
    { name: 'Lista-Presente - 10', price: 140.0, category: 'Presente', image: '/agilizai/prod-10.png' },
    { name: 'Lista-Presente - 11', price: 150.0, category: 'Presente', image: '/agilizai/prod-5.png' },
    { name: 'Lista-Presente - 12', price: 160.0, category: 'Presente', image: '/agilizai/prod-1.png' },
    { name: 'Lista-Presente - 13', price: 170.0, category: 'Presente', image: '/agilizai/prod-2.png' },
    { name: 'Lista-Presente - 14', price: 180.0, category: 'Presente', image: '/agilizai/prod-3.png' },
    { name: 'Lista-Presente - 15', price: 190.0, category: 'Presente', image: '/agilizai/prod-5.png' },
    { name: 'Lista-Presente - 16', price: 200.0, category: 'Presente', image: '/agilizai/prod-1.png' },
    { name: 'Lista-Presente - 17', price: 210.0, category: 'Presente', image: '/agilizai/prod-2.png' },
    { name: 'Lista-Presente - 18', price: 220.0, category: 'Presente', image: '/agilizai/prod-3.png' },
    { name: 'Lista-Presente - 19', price: 230.0, category: 'Presente', image: '/agilizai/prod-4.png' },
    { name: 'Lista-Presente - 20', price: 240.0, category: 'Presente', image: '/agilizai/prod-5.png' },
  ];

  // Subáreas específicas do Highline (mesmas da página de reserva)
  const highlineSubareas = [
    { key: 'deck-frente', area_id: 2, label: 'Área Deck - Frente', tableNumbers: ['05','06','07','08'] },
    { key: 'deck-esquerdo', area_id: 2, label: 'Área Deck - Esquerdo', tableNumbers: ['01','02','03','04'] },
    { key: 'deck-direito', area_id: 2, label: 'Área Deck - Direito', tableNumbers: ['09','10','11','12'] },
    { key: 'bar', area_id: 2, label: 'Área Bar', tableNumbers: ['15','16','17'] },
    { key: 'roof-direito', area_id: 5, label: 'Área Rooftop - Direito', tableNumbers: ['50','51','52','53','54','55'] },
    { key: 'roof-bistro', area_id: 5, label: 'Área Rooftop - Bistrô', tableNumbers: ['70','71','72','73'] },
    { key: 'roof-centro', area_id: 5, label: 'Área Rooftop - Centro', tableNumbers: ['44','45','46','47'] },
    { key: 'roof-esquerdo', area_id: 5, label: 'Área Rooftop - Esquerdo', tableNumbers: ['60','61','62','63','64','65'] },
    { key: 'roof-vista', area_id: 5, label: 'Área Rooftop - Vista', tableNumbers: ['40','41','42'] },
  ];

  // Subáreas específicas do Seu Justino
  const seuJustinoSubareas = [
    { key: 'lounge-bar', area_id: 1, label: 'Lounge Bar', tableNumbers: ['200','202'] },
    { key: 'lounge-palco', area_id: 1, label: 'Lounge Palco', tableNumbers: ['204','206'] },
    { key: 'lounge-aquario-tv', area_id: 1, label: 'Lounge Aquário TV', tableNumbers: ['208'] },
    { key: 'lounge-aquario-spaten', area_id: 1, label: 'Lounge Aquário Spaten', tableNumbers: ['210'] },
    { key: 'quintal-lateral-esquerdo', area_id: 2, label: 'Quintal Lateral Esquerdo', tableNumbers: ['20','22','24','26','28','29'] },
    { key: 'quintal-central-esquerdo', area_id: 2, label: 'Quintal Central Esquerdo', tableNumbers: ['30','32','34','36','38','39'] },
    { key: 'quintal-central-direito', area_id: 2, label: 'Quintal Central Direito', tableNumbers: ['40','42','44','46','48'] },
    { key: 'quintal-lateral-direito', area_id: 2, label: 'Quintal Lateral Direito', tableNumbers: ['50','52','54','56','58','60','62','64'] },
  ];

  const isHighline = selectedEstablishment && (
    (selectedEstablishment.name || '').toLowerCase().includes('high')
  );

  const isSeuJustino = selectedEstablishment && (
    (selectedEstablishment.name || '').toLowerCase().includes('seu justino') && 
    !(selectedEstablishment.name || '').toLowerCase().includes('pracinha')
  );

  const isPracinha = selectedEstablishment && (
    (selectedEstablishment.name || '').toLowerCase().includes('pracinha')
  );

  // Carregar estabelecimentos
  useEffect(() => {
    const loadEstablishments = async () => {
      setEstablishmentsLoading(true);
      try {
        console.log('🔍 Carregando estabelecimentos de:', `${API_URL}/api/places`);
        const response = await fetch(`${API_URL}/api/places`);
        console.log('📡 Status da resposta:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Dados recebidos (tipo):', typeof data, Array.isArray(data), data);
          
          // A API retorna { data: formattedPlaces } conforme routes/places.js linha 274
          let rawPlaces = [];
          if (Array.isArray(data)) {
            rawPlaces = data;
          } else if (data.data && Array.isArray(data.data)) {
            rawPlaces = data.data;
          } else if (data.places && Array.isArray(data.places)) {
            rawPlaces = data.places;
          }
          
          console.log('📋 Raw places extraídos:', rawPlaces.length, rawPlaces);
          
          // Formatar estabelecimentos no formato esperado
          // Filtrar apenas lugares válidos e visíveis (se tiver campo visible)
          const formattedEstablishments: Establishment[] = rawPlaces
            .filter((place: any) => {
              // Filtrar lugares válidos
              if (!place || !place.id) return false;
              // Se tiver campo visible, mostrar apenas os visíveis (ou se não tiver o campo, mostrar todos)
              if (place.visible !== undefined) {
                return place.visible === true || place.visible === 1;
              }
              return true;
            })
            .map((place: any) => ({
              id: place.id,
              name: place.name || "Sem nome",
              logo: place.logo || "",
              address: place.street ? `${place.street}, ${place.number || ''}`.trim() : (place.address || "Endereço não informado"),
              slug: place.slug || null
            }));
          
          console.log('✅ Estabelecimentos formatados:', formattedEstablishments.length, formattedEstablishments);
          setEstablishments(formattedEstablishments);
        } else {
          const errorText = await response.text();
          console.error('❌ Erro ao carregar estabelecimentos:', response.status, errorText);
          setEstablishments([]);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar estabelecimentos:', error);
        setEstablishments([]);
      } finally {
        setEstablishmentsLoading(false);
      }
    };
    loadEstablishments();
  }, []);

  // Carregar áreas quando estabelecimento for selecionado
  const loadAreas = async (establishmentId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/restaurant-areas`);
      if (response.ok) {
        const data = await response.json();
        setAreas(data.areas || []);
      } else {
        setAreas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      setAreas([]);
    }
  };


  // Janelas de horário para o Highline
  const getHighlineTimeWindows = (dateStr: string, subareaKey?: string) => {
    if (!dateStr) return [] as Array<{ start: string; end: string; label: string }>;
    const date = new Date(dateStr + 'T00:00:00');
    const weekday = date.getDay();
    const windows: Array<{ start: string; end: string; label: string }> = [];
    const isRooftop = subareaKey ? subareaKey.startsWith('roof') : false;
    const isDeckOrBar = subareaKey ? (subareaKey.startsWith('deck') || subareaKey === 'bar') : false;

    if (weekday === 5) {
      windows.push({ start: '18:00', end: '21:00', label: 'Sexta-feira: 18:00–21:00' });
    } else if (weekday === 6) {
      if (isRooftop) {
        windows.push({ start: '14:00', end: '17:00', label: 'Sábado Rooftop: 14:00–17:00' });
      } else if (isDeckOrBar) {
        windows.push({ start: '14:00', end: '20:00', label: 'Sábado Deck: 14:00–20:00' });
      } else {
        windows.push({ start: '14:00', end: '17:00', label: 'Sábado Rooftop: 14:00–17:00' });
        windows.push({ start: '14:00', end: '20:00', label: 'Sábado Deck: 14:00–20:00' });
      }
    }
    return windows;
  };

  // Janelas de horário para Seu Justino
  const getSeuJustinoTimeWindows = (dateStr: string) => {
    if (!dateStr) return [] as Array<{ start: string; end: string; label: string }>;
    const date = new Date(`${dateStr}T00:00:00`);
    const weekday = date.getDay();
    const windows: Array<{ start: string; end: string; label: string }> = [];

    if (weekday >= 2 && weekday <= 5) {
      windows.push({ start: '18:00', end: '21:00', label: 'Terça a Sexta: 18:00–21:00' });
    } else if (weekday === 6) {
      windows.push({ start: '12:00', end: '15:00', label: 'Sábado - Primeiro Giro: 12:00–15:00' });
      windows.push({ start: '20:00', end: '23:00', label: 'Sábado - Segundo Giro: 20:00–23:00' });
    } else if (weekday === 0) {
      windows.push({ start: '12:00', end: '15:00', label: 'Domingo: 12:00–15:00' });
    }

    return windows;
  };

  const getDefaultTimeWindows = (dateStr: string) => {
    if (!dateStr) return [] as Array<{ start: string; end: string; label?: string }>;
    const date = new Date(`${dateStr}T00:00:00`);
    const weekday = date.getDay();

    if (weekday === 6) {
      return [{ start: '14:00', end: '23:00', label: 'Sábado - Horário estendido' }];
    }
    if (weekday === 5) {
      return [{ start: '18:00', end: '23:30', label: 'Sexta-feira - Noite' }];
    }
    return [{ start: '18:00', end: '22:30', label: 'Horário padrão' }];
  };

  const createSlotsFromWindow = (start: string, end: string) => {
    const slots: string[] = [];
    if (!start || !end) return slots;

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    if (isNaN(startHour) || isNaN(endHour)) return slots;

    const startTotal = startHour * 60 + (isNaN(startMinute) ? 0 : startMinute);
    const endTotal = endHour * 60 + (isNaN(endMinute) ? 0 : endMinute);

    for (let current = startTotal; current <= endTotal; current += 30) {
      const hour = Math.floor(current / 60);
      const minute = current % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }

    return slots;
  };

  const computeAvailableTimeSlots = () => {
    if (!formData.dataAniversario) return [] as string[];

    if (isHighline) {
      const windows = getHighlineTimeWindows(formData.dataAniversario, selectedSubareaKey);
      if (!selectedSubareaKey && windows.length > 1) {
        return [];
      }
      return windows.flatMap((window) => createSlotsFromWindow(window.start, window.end));
    }

    if (isSeuJustino || isPracinha) {
      const windows = getSeuJustinoTimeWindows(formData.dataAniversario);
      return windows.flatMap((window) => createSlotsFromWindow(window.start, window.end));
    }

    const windows = getDefaultTimeWindows(formData.dataAniversario);
    return windows.flatMap((window) => createSlotsFromWindow(window.start, window.end));
  };

  // Calcular horários disponíveis quando área e data mudarem
  useEffect(() => {
    if (!formData.dataAniversario) {
      setAvailableTimeSlots([]);
      return;
    }

    if (!formData.areaPreferida && !(isHighline && selectedSubareaKey)) {
      setAvailableTimeSlots([]);
      return;
    }

    const slots = computeAvailableTimeSlots();
    setAvailableTimeSlots(slots);

    if (formData.horario && slots.length > 0 && !slots.includes(formData.horario)) {
      setFormData(prev => ({ ...prev, horario: '' }));
    }
  }, [formData.dataAniversario, formData.areaPreferida, selectedSubareaKey, isHighline, isSeuJustino, isPracinha, selectedEstablishment]);

  // --- NOVAS FUNÇÕES de navegação ---
  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
      setActiveSection(sections[currentSectionIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setActiveSection(sections[currentSectionIndex - 1]);
    }
  };

  // (Funções isPersonalizedPanelAllowed, calculateTotal e handleSubmit permanecem as mesmas)
  const isPersonalizedPanelAllowed = () => {
    if (selectedPainelOption === 'personalizado' && formData.dataAniversario) {
      const selectedDate = new Date(formData.dataAniversario);
      const now = new Date();
      const difference = Math.ceil((selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return difference >= 5;
    }
    return true;
  };

  // Função para verificar se há pelo menos 5 dias de antecedência para reserva com decoração
  // Esta validação só se aplica quando há decoração selecionada
  const hasMinimumDaysAdvance = () => {
    // Se não há decoração selecionada, não precisa validar (retorna true)
    if (!selectedDecoration) return true;
    
    // Se há decoração, valida os 5 dias de antecedência
    if (!formData.dataAniversario) return false;
    const selectedDate = new Date(formData.dataAniversario + 'T00:00:00');
    const now = new Date();
    // Resetar horas para comparar apenas as datas
    now.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    const difference = Math.ceil((selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return difference >= 5;
  };

  const calculateTotal = () => {
    let total = 0;
    if (selectedDecoration) {
      total += selectedDecoration.price;
    }
    return total;
  };

  const handleConfirmReservation = () => {
    // Verificar campos obrigatórios
    if (!selectedDecoration || !formData.barSelecionado || !formData.dataAniversario || !formData.areaPreferida || !formData.horario) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios:\n\n• Estabelecimento\n• Data do aniversário\n• Área preferida\n• Horário\n• Decoração');
      setShowErrorModal(true);
      return;
    }
    
    // Validação crucial: 5 dias de antecedência obrigatórios para reserva com decoração
    if (!hasMinimumDaysAdvance()) {
      const selectedDate = new Date(formData.dataAniversario + 'T00:00:00');
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      const difference = Math.ceil((selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      setErrorMessage(`❌ ATENÇÃO: REGRA DE ANTECEDÊNCIA\n\nReservas com decoração exigem no mínimo 5 dias de antecedência da data do aniversário.\n\n• Data selecionada: ${new Date(formData.dataAniversario).toLocaleDateString('pt-BR')}\n• Dias de antecedência: ${difference} dia(s)\n• Dias necessários: 5 dias\n\nPor favor, selecione uma data futura com pelo menos 5 dias de antecedência para poder finalizar sua reserva.`);
      setShowErrorModal(true);
      return;
    }
    
    setShowConfirmationModal(true);
  };

  const handleSubmit = async () => {
      setShowConfirmationModal(false);
      setIsLoading(true);
      try {
        // Validação crucial: 5 dias de antecedência obrigatórios para reserva com decoração
        if (!hasMinimumDaysAdvance()) {
          alert('❌ ATENÇÃO: Reservas com decoração exigem no mínimo 5 dias de antecedência da data do aniversário. Por favor, selecione uma data futura com pelo menos 5 dias de antecedência.');
          setIsLoading(false);
          return;
        }

        // Criar mapas vazios para manter compatibilidade com API
        const bebidasMap: Record<string, number> = {};
        const comidasMap: Record<string, number> = {};
        for (let i = 1; i <= 10; i++) {
          bebidasMap[`item_bar_bebida_${i}`] = 0;
          comidasMap[`item_bar_comida_${i}`] = 0;
        }

      // Validar que o estabelecimento foi selecionado
      const establishmentId = parseInt(formData.barSelecionado);
      if (!establishmentId || isNaN(establishmentId) || establishmentId === 0) {
        alert('Por favor, selecione um estabelecimento válido');
        setIsLoading(false);
        return;
      }

      // Obter area_id baseado na seleção
      let areaId = parseInt(formData.areaPreferida);
      if (isHighline || isSeuJustino) {
        const sub = isHighline 
          ? highlineSubareas.find(s => s.key === selectedSubareaKey)
          : seuJustinoSubareas.find(s => s.key === selectedSubareaKey);
        if (sub) {
          areaId = sub.area_id;
        }
      }

      // Validar que areaId e horario foram fornecidos
      if (!areaId || areaId === 0 || isNaN(areaId)) {
        alert('Por favor, selecione uma área válida');
        setIsLoading(false);
        return;
      }
      
      if (!formData.horario || formData.horario.trim() === '') {
        alert('Por favor, selecione um horário');
        setIsLoading(false);
        return;
      }

      const reservationData = {
        user_id: 1, // TODO: Get from auth
        aniversariante_nome: formData.aniversarianteNome,
        data_aniversario: new Date(formData.dataAniversario).toISOString(),
        quantidade_convidados: formData.quantidadeConvidados,
        id_casa_evento: establishmentId,
        area_id: areaId, // Adicionar área (garantir que é número)
        reservation_time: formData.horario.includes(':') && formData.horario.split(':').length === 2 
          ? `${formData.horario}:00` 
          : formData.horario, // Adicionar horário
        decoracao_tipo: selectedDecoration!.name,
        decoracao_preco: selectedDecoration!.price,
        decoracao_imagem: selectedDecoration!.image,
        painel_personalizado: selectedPainelOption === 'personalizado',
        painel_tema: selectedPainelOption === 'personalizado' ? formData.painelTema : undefined,
        painel_frase: selectedPainelOption === 'personalizado' ? formData.painelFrase : undefined,
        painel_estoque_imagem_url: selectedPainelOption === 'estoque' ? selectedPainelImage : undefined,
        // Manter compatibilidade com API antiga (campos vazios)
        ...bebidasMap,
        ...comidasMap,
        lista_presentes: selectedGifts.map(gift => gift.name),
        documento: formData.documento,
        whatsapp: formData.whatsapp,
        email: formData.email,
      };

      console.log('📤 Enviando dados para API:', {
        ...reservationData,
        area_id: areaId,
        reservation_time: reservationData.reservation_time,
        'area_id (tipo)': typeof areaId,
        'reservation_time (tipo)': typeof reservationData.reservation_time,
        'area_id válido?': areaId && !isNaN(areaId) && areaId > 0,
        'reservation_time válido?': reservationData.reservation_time && reservationData.reservation_time.trim() !== ''
      });
      
      const result = await BirthdayService.createBirthdayReservation(reservationData);
      
      // A criação de reserva de restaurante e lista de convidados agora é feita automaticamente na API
      console.log('✅ Reserva de aniversário criada:', result);
      if ((result as any).restaurant_reservation_id) {
        console.log('✅ Reserva de restaurante criada automaticamente:', (result as any).restaurant_reservation_id);
      } else {
        console.warn('⚠️ Reserva de restaurante não foi criada. Verifique os logs da API.');
      }
      
      alert(`Reserva criada com sucesso! ID: ${result.id}`);
      router.push('/decoracao-aniversario');
    } catch (error) {
      alert(`Erro ao criar reserva: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Widgets
  const InfoWidget = ({ text }: { text: string; title: string; message: string }) => (
    <div className="bg-orange-500 bg-opacity-10 border border-orange-500 border-opacity-30 rounded-lg p-3 mb-4">
      <div className="flex items-start space-x-3">
        <FaInfoCircle className="text-orange-500 text-xl mt-1 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-white text-sm">{text}</p>
        </div>
        <FaInfoCircle className="text-orange-500 text-lg opacity-60" />
      </div>
    </div>
  );

  const WarningWidget = ({ text }: { text: string; title: string; message: string }) => (
    <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg p-3 mb-4">
      <div className="flex items-start space-x-3">
        <FaExclamationTriangle className="text-red-500 text-xl mt-1 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-400 text-sm font-semibold">{text}</p>
        </div>
        <FaInfoCircle className="text-red-500 text-lg opacity-60" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative h-96">
        <SafeImage
          src="/agilizai/niver.jpeg" 
          alt="Reserve seu Aniversário"
          fill
          sizes="100vw"
          className="absolute z-0 object-cover"
          priority
          unoptimized={true}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-70"></div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white">
            <FaBirthdayCake className="text-6xl mx-auto mb-4" />
            <h1 className="text-5xl font-bold mb-4">Reserve seu Aniversário 🎉</h1>
            <p className="text-xl">Crie uma festa inesquecível com nossa decoração</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'dados', label: 'Dados Pessoais', icon: FaUser },
              { id: 'decoracao', label: 'Decoração', icon: FaPalette },
              { id: 'painel', label: 'Painel', icon: FaImage },
              { id: 'presentes', label: 'Presentes', icon: FaGift },
            ].map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                    activeSection === section.id
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-slate-300 hover:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className="text-lg" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Renderiza as seções com base no activeSection */}
        {/* O conteúdo de cada seção ('dados', 'decoracao', etc.) permanece o mesmo */}
        
        {/* Dados Pessoais */}
        {activeSection === 'dados' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Dados do Aniversariante</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Nome do aniversariante *</label>
                <input
                  type="text"
                  value={formData.aniversarianteNome}
                  onChange={(e) => setFormData({...formData, aniversarianteNome: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Digite o nome completo"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Documento</label>
                <input
                  type="text"
                  value={formData.documento}
                  onChange={(e) => setFormData({...formData, documento: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="CPF ou RG"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">WhatsApp</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Data do aniversário *</label>
                <input
                  type="date"
                  value={formData.dataAniversario}
                  onChange={(e) => setFormData({
                    ...formData, 
                    dataAniversario: e.target.value,
                    horario: '' // Limpar horário quando data mudar
                  })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                />
                {formData.dataAniversario && selectedDecoration && !hasMinimumDaysAdvance() && (
                  <WarningWidget
                    text="⚠️ ATENÇÃO: Reservas com decoração exigem no mínimo 5 dias de antecedência da data do aniversário. Por favor, selecione uma data futura com pelo menos 5 dias de antecedência."
                    title="Antecedência Mínima"
                    message="Reservas com decoração exigem no mínimo 5 dias de antecedência."
                  />
                )}
                {formData.dataAniversario && selectedDecoration && hasMinimumDaysAdvance() && (
                  <div className="mt-2 bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <FaCheck className="text-green-500 text-xl mt-1 flex-shrink-0" />
                      <p className="text-green-400 text-sm font-semibold">
                        ✓ Data válida! A reserva pode ser finalizada (mínimo de 5 dias de antecedência atendido).
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Estabelecimento *</label>
                <select
                  value={formData.barSelecionado}
                  onChange={(e) => {
                    const establishmentId = e.target.value;
                    setFormData({
                      ...formData, 
                      barSelecionado: establishmentId,
                      areaPreferida: '',
                      horario: ''
                    });
                    const establishment = establishments.find(est => String(est.id) === establishmentId);
                    setSelectedEstablishment(establishment || null);
                    if (establishment) {
                      loadAreas(establishment.id);
                    }
                    setSelectedSubareaKey('');
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">
                    {establishmentsLoading ? 'Carregando estabelecimentos...' : 'Selecione um estabelecimento'}
                  </option>
                  {establishmentsLoading ? (
                    <option value="" disabled>Carregando...</option>
                  ) : establishments.length === 0 ? (
                    <option value="" disabled>Nenhum estabelecimento disponível</option>
                  ) : (
                    establishments.map((establishment) => (
                      <option key={establishment.id} value={establishment.id.toString()}>
                        {establishment.name}
                      </option>
                    ))
                  )}
                </select>
                {!establishmentsLoading && establishments.length === 0 && (
                  <p className="text-yellow-400 text-sm mt-2">
                    ⚠️ Nenhum estabelecimento encontrado. Verifique a conexão com a API.
                  </p>
                )}
              </div>
              {selectedEstablishment && (
                <>
                  <div>
                    <label className="block text-white font-medium mb-2">Área Preferida *</label>
                    <select
                      value={(isHighline || isSeuJustino) ? selectedSubareaKey : formData.areaPreferida}
                      onChange={(e) => {
                        if (isHighline || isSeuJustino) {
                          const key = e.target.value;
                          setSelectedSubareaKey(key);
                          const sub = isHighline 
                            ? highlineSubareas.find(s => s.key === key)
                            : seuJustinoSubareas.find(s => s.key === key);
                          setFormData({
                            ...formData,
                            areaPreferida: sub ? String(sub.area_id) : '',
                            horario: ''
                          });
                        } else {
                          setFormData({
                            ...formData,
                            areaPreferida: e.target.value,
                            horario: ''
                          });
                        }
                      }}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">Selecione uma área</option>
                      {isHighline
                        ? highlineSubareas.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))
                        : isSeuJustino
                        ? seuJustinoSubareas.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))
                        : areas.map((area) => (
                            <option key={area.id} value={area.id.toString()}>{area.name}</option>
                          ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Horário *</label>
                    <select
                      value={formData.horario}
                      onChange={(e) => setFormData({...formData, horario: e.target.value})}
                      disabled={availableTimeSlots.length === 0}
                      className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none ${
                        availableTimeSlots.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="">
                        {availableTimeSlots.length === 0
                          ? 'Selecione a área e a data para ver os horários'
                          : 'Selecione um horário disponível'}
                      </option>
                      {availableTimeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                    {isHighline && formData.dataAniversario && (
                      <div className="mt-2 text-xs text-gray-400">
                        {(() => {
                          const windows = getHighlineTimeWindows(formData.dataAniversario, selectedSubareaKey);
                          if (windows.length === 0) {
                            return (
                              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200">
                                <p className="font-semibold">❌ RESERVAS FECHADAS</p>
                                <p className="text-sm">Reservas disponíveis apenas Sexta e Sábado.</p>
                              </div>
                            );
                          }
                          return (
                            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-200">
                              <p className="font-semibold mb-1">🕐 HORÁRIOS DISPONÍVEIS:</p>
                              <ul className="list-disc pl-5 text-sm">
                                {windows.map((w, i) => (
                                  <li key={i}>{w.label}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {(isSeuJustino || isPracinha) && formData.dataAniversario && (
                      <div className="mt-2 text-xs text-gray-400">
                        {(() => {
                          const windows = getSeuJustinoTimeWindows(formData.dataAniversario);
                          if (windows.length === 0) {
                            return (
                              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200">
                                <p className="font-semibold">❌ RESERVAS FECHADAS</p>
                                <p className="text-sm">Reservas fechadas para este dia.</p>
                              </div>
                            );
                          }
                          return (
                            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-200">
                              <p className="font-semibold mb-1">🕐 HORÁRIOS DISPONÍVEIS:</p>
                              <ul className="list-disc pl-5 text-sm">
                                {windows.map((w, i) => (
                                  <li key={i}>{w.label}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Quantidade de convidados</label>
              <div className="flex items-center space-x-4">
                <span className="text-white">1</span>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.quantidadeConvidados}
                  onChange={(e) => setFormData({...formData, quantidadeConvidados: parseInt(e.target.value)})}
                  className="flex-1"
                />
                <span className="text-white font-bold">{formData.quantidadeConvidados}</span>
              </div>
            </div>
          </div>
        )}

        {/* ... Coloque aqui as outras seções (Decoração, Painel, Bebidas, Comidas, Presentes) ... */}
        {/* Elas não precisam de alteração */}
         {/* Decoração */}
         {activeSection === 'decoracao' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Escolha sua Decoração ✨</h2>
            
            <WarningWidget
              text="⚠️ REGRA IMPORTANTE: Reservas com decoração exigem no mínimo 5 dias de antecedência da data do aniversário. Certifique-se de que a data selecionada tenha pelo menos 5 dias de antecedência."
              title="Antecedência Mínima Obrigatória"
              message="Reservas com decoração exigem no mínimo 5 dias de antecedência."
            />
            
            <InfoWidget
              text="💡 A decoração é um aluguel, não pode levar os painéis e bandejas para casa apenas os brindes que estiverem. O valor de cada opção está em cada card e deverá ser pago online e antecipadamente."
              title="Informação sobre Decoração"
              message="A decoração é um aluguel, não pode levar os painéis e bandejas para casa apenas os brindes que estiverem. O valor de cada opção está em cada card e deverá ser pago online e antecipadamente."
            />

            <div className="grid md:grid-cols-2 gap-6">
              {decorationOptions.map((option, index) => (
                <div
                  key={index}
                  className={`bg-slate-800 rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
                    selectedDecoration?.name === option.name
                      ? 'border-orange-500 bg-orange-500 bg-opacity-10'
                      : 'border-slate-700 hover:border-orange-400'
                  }`}
                >
                  <div 
                    className="h-32 relative overflow-hidden rounded-lg mb-4 cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDecorationImage(option.image);
                    }}
                  >
                    <SafeImage
                      src={option.image}
                      alt={option.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <FaImage className="text-white text-2xl" />
                    </div>
                  </div>
                  <div onClick={() => setSelectedDecoration(option)} className="cursor-pointer">
                    <h3 className="text-lg font-bold text-white mb-2">{option.name}</h3>
                    <p className="text-2xl font-bold text-orange-500 mb-2">R$ {option.price.toFixed(2)}</p>
                    <p className="text-slate-300 text-sm">{option.description}</p>
                    {selectedDecoration?.name === option.name && (
                      <div className="mt-4 flex items-center justify-center">
                        <FaCheck className="text-orange-500 text-xl" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Painel */}
        {activeSection === 'painel' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Seu Painel Personalizado ou do Estoque?</h2>
            
            <InfoWidget
              text="💡 Tanto o painel que temos no estoque quanto os personalizados não tem valor adicional pois já está incluso o valor na decoração. Para painéis personalizados, você informa o tema e a frase que deseja."
              title="Informação sobre Painéis"
              message="Tanto o painel que temos no estoque quanto os personalizados não tem valor adicional pois já está incluso o valor na decoração. Para painéis personalizados, você informa o tema e a frase que deseja."
            />

            <div className="grid md:grid-cols-2 gap-6">
              <div
                onClick={() => setSelectedPainelOption('estoque')}
                className={`bg-slate-800 rounded-xl p-6 cursor-pointer border-2 transition-all ${
                  selectedPainelOption === 'estoque'
                    ? 'border-orange-500 bg-orange-500 bg-opacity-10'
                    : 'border-slate-700 hover:border-orange-400'
                }`}
              >
                <h3 className="text-xl font-bold text-white mb-4">Painel do Estoque</h3>
                <p className="text-slate-300">Escolha entre nossos painéis disponíveis</p>
              </div>

              <div
                onClick={() => setSelectedPainelOption('personalizado')}
                className={`bg-slate-800 rounded-xl p-6 cursor-pointer border-2 transition-all ${
                  selectedPainelOption === 'personalizado'
                    ? 'border-orange-500 bg-orange-500 bg-opacity-10'
                    : 'border-slate-700 hover:border-orange-400'
                }`}
              >
                <h3 className="text-xl font-bold text-white mb-4">Painel Personalizado</h3>
                <p className="text-slate-300">Crie um painel único com tema e frase personalizados</p>
              </div>
            </div>

            {selectedPainelOption === 'estoque' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Escolha um painel do nosso estoque:</h3>
                <div className="grid grid-cols-5 gap-4">
                  {painelEstoqueImages.map((image, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedPainelImage(image)}
                      className={`h-24 w-24 relative overflow-hidden rounded-full cursor-pointer border-2 transition-all ${
                        selectedPainelImage === image
                          ? 'border-orange-500 scale-110'
                          : 'border-slate-600 hover:border-orange-400'
                      }`}
                    >
                      <SafeImage
                        src={image}
                        alt={`Painel ${index + 1}`}
                        fill
                        sizes="96px"
                        className="object-cover"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPainelOption === 'personalizado' && (
              <div className="space-y-4">
                {!isPersonalizedPanelAllowed() && (
                  <WarningWidget
                    text="Atenção: Painel personalizado só pode ser solicitado com no mínimo 5 dias de antecedência da data do aniversário."
                    title="Atenção"
                    message="Painel personalizado só pode ser solicitado com no mínimo 5 dias de antecedência da data do aniversário."
                  />
                )}
                
                <div>
                  <label className="block text-white font-medium mb-2">Qual o tema do painel?</label>
                  <input
                    type="text"
                    value={formData.painelTema}
                    onChange={(e) => setFormData({...formData, painelTema: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                    placeholder="ex: Super Heróis, Princesas, etc."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Frase que você quer no painel</label>
                  <textarea
                    value={formData.painelFrase}
                    onChange={(e) => setFormData({...formData, painelFrase: e.target.value})}
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                    placeholder='ex: "Feliz Aniversário João!"'
                  />
                </div>
              </div>
            )}
          </div>
        )}


        {/* Presentes */}
        {activeSection === 'presentes' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Lista de Presentes 🎁</h2>
            
            <InfoWidget
              text="💡 Escolha até 20 itens que você gostaria de receber como presente dos seus convidados."
              title="Informação sobre Lista de Presentes"
              message="Escolha até 20 itens que você gostaria de receber como presente dos seus convidados."
            />

            <div className="grid md:grid-cols-2 gap-6">
              {giftOptions.map((gift, index) => {
                const isSelected = selectedGifts.some(g => g.name === gift.name);
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedGifts(selectedGifts.filter(g => g.name !== gift.name));
                      } else if (selectedGifts.length < 20) {
                        setSelectedGifts([...selectedGifts, gift]);
                      } else {
                        alert('Máximo de 20 presentes selecionados');
                      }
                    }}
                    className={`bg-slate-800 rounded-xl p-6 cursor-pointer border-2 transition-all hover:shadow-lg ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500 bg-opacity-10'
                        : 'border-slate-700 hover:border-orange-400'
                    }`}
                  >
                    <div className="h-32 relative overflow-hidden rounded-lg mb-4">
                      <SafeImage
                        src={gift.image}
                        alt={gift.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform hover:scale-105"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{gift.name}</h3>
                    <p className="text-2xl font-bold text-orange-500 mb-2">R$ {gift.price.toFixed(2)}</p>
                    {isSelected && (
                      <div className="flex items-center justify-center">
                        <FaCheck className="text-orange-500 text-xl" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- SEÇÃO DE VALOR TOTAL E BOTÕES MODIFICADA --- */}
        <div className="mt-12 bg-orange-500 bg-opacity-10 border border-orange-500 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-white text-center mb-4">💰 VALOR TOTAL DA RESERVA</h3>
          <p className="text-4xl font-bold text-orange-500 text-center mb-4">
            R$ {calculateTotal().toFixed(2)}
          </p>
          <p className="text-white text-center text-sm">
            Este valor deverá ser pago online e antecipadamente antes da data do evento.
          </p>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentSectionIndex === 0}
            className="flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            <FaArrowLeft className="mr-2" />
            Anterior
          </button>

          {currentSectionIndex === sections.length - 1 ? (
            // Na última etapa, mostra o botão de confirmar
            <button
              onClick={handleConfirmReservation}
              disabled={isLoading}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processando...' : 'CONFIRMAR RESERVA'}
            </button>
          ) : (
            // Nas outras etapas, mostra o botão de próximo
            <button
              onClick={handleNext}
              className="flex items-center px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors"
            >
              Próximo
              <FaArrowRight className="ml-2" />
            </button>
          )}
        </div>
      </div>

      {/* Modal de Imagem de Decoração */}
      {selectedDecorationImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedDecorationImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedDecorationImage(null)}
              className="absolute top-4 right-4 z-10 bg-slate-800 hover:bg-slate-700 text-white rounded-full p-3 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
            <div className="relative w-full h-[90vh] rounded-lg overflow-hidden">
              <SafeImage
                src={selectedDecorationImage}
                alt="Decoração completa"
                fill
                sizes="100vw"
                className="object-contain"
                unoptimized={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {showConfirmationModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowConfirmationModal(false)}
        >
          <div 
            className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-orange-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Confirmar Reserva</h2>
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Dados Pessoais */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-xl font-bold text-orange-500 mb-3">Dados Pessoais</h3>
                <div className="space-y-2 text-white">
                  <p><span className="font-semibold">Aniversariante:</span> {formData.aniversarianteNome || 'Não informado'}</p>
                  <p><span className="font-semibold">Data:</span> {formData.dataAniversario ? new Date(formData.dataAniversario).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                  <p><span className="font-semibold">Convidados:</span> {formData.quantidadeConvidados}</p>
                  {formData.whatsapp && <p><span className="font-semibold">WhatsApp:</span> {formData.whatsapp}</p>}
                  {formData.email && <p><span className="font-semibold">E-mail:</span> {formData.email}</p>}
                </div>
              </div>

              {/* Estabelecimento */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-xl font-bold text-orange-500 mb-3">Estabelecimento</h3>
                <div className="space-y-2 text-white">
                  <p><span className="font-semibold">Bar:</span> {selectedEstablishment?.name || formData.barSelecionado || 'Não selecionado'}</p>
                  <p><span className="font-semibold">Área:</span> {
                    isHighline 
                      ? highlineSubareas.find(s => s.key === selectedSubareaKey)?.label || formData.areaPreferida
                      : isSeuJustino
                      ? seuJustinoSubareas.find(s => s.key === selectedSubareaKey)?.label || formData.areaPreferida
                      : areas.find(a => String(a.id) === formData.areaPreferida)?.name || formData.areaPreferida || 'Não selecionada'
                  }</p>
                  <p><span className="font-semibold">Horário:</span> {formData.horario || 'Não selecionado'}</p>
                </div>
              </div>

              {/* Decoração */}
              {selectedDecoration && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-orange-500 mb-3">Decoração</h3>
                  <div className="space-y-2 text-white">
                    <p><span className="font-semibold">Tipo:</span> {selectedDecoration.name}</p>
                    <p><span className="font-semibold">Valor:</span> R$ {selectedDecoration.price.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {/* Painel */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-xl font-bold text-orange-500 mb-3">Painel</h3>
                <div className="space-y-2 text-white">
                  {selectedPainelOption === 'estoque' && (
                    <>
                      <p><span className="font-semibold">Tipo:</span> Painel do Estoque</p>
                      {selectedPainelImage && (
                        <div className="mt-2 w-24 h-24 relative rounded-lg overflow-hidden">
                          <SafeImage
                            src={selectedPainelImage}
                            alt="Painel selecionado"
                            fill
                            sizes="96px"
                            className="object-cover"
                            unoptimized={true}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {selectedPainelOption === 'personalizado' && (
                    <>
                      <p><span className="font-semibold">Tipo:</span> Painel Personalizado</p>
                      {formData.painelTema && <p><span className="font-semibold">Tema:</span> {formData.painelTema}</p>}
                      {formData.painelFrase && <p><span className="font-semibold">Frase:</span> {formData.painelFrase}</p>}
                    </>
                  )}
                  {!selectedPainelOption && <p className="text-slate-400">Nenhum painel selecionado</p>}
                </div>
              </div>


              {/* Presentes */}
              {selectedGifts.length > 0 && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-orange-500 mb-3">Lista de Presentes</h3>
                  <div className="space-y-2 text-white">
                    <p>{selectedGifts.length} presente(s) selecionado(s)</p>
                    <ul className="list-disc pl-5 text-sm">
                      {selectedGifts.slice(0, 5).map((gift, idx) => (
                        <li key={idx}>{gift.name}</li>
                      ))}
                      {selectedGifts.length > 5 && <li className="text-slate-400">... e mais {selectedGifts.length - 5}</li>}
                    </ul>
                  </div>
                </div>
              )}

              {/* Valor Total */}
              <div className="bg-orange-500 bg-opacity-20 border-2 border-orange-500 rounded-lg p-4">
                <h3 className="text-2xl font-bold text-orange-500 mb-2 text-center">Valor Total</h3>
                <p className="text-4xl font-bold text-white text-center mb-4">
                  R$ {calculateTotal().toFixed(2)}
                </p>
              </div>

              {/* Lembrete Importante */}
              <div className="bg-yellow-500 bg-opacity-20 border-2 border-yellow-500 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FaExclamationTriangle className="text-yellow-500 text-2xl mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-yellow-400 font-bold text-lg mb-2">⚠️ Lembrete Importante</h4>
                    <p className="text-yellow-200">
                      Este valor deverá ser pago online e antecipadamente antes da data do evento. 
                      O pagamento não será realizado na comanda no ato do check-in. 
                      Certifique-se de que todas as informações estão corretas antes de confirmar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processando...' : 'Confirmar e Finalizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Erro */}
      {showErrorModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowErrorModal(false)}
        >
          <div 
            className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-red-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-red-500">⚠️ Não é possível finalizar a reserva</h2>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-red-500 bg-opacity-20 border-2 border-red-500 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FaExclamationTriangle className="text-red-500 text-2xl mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-200 whitespace-pre-line text-base leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="text-lg font-bold text-white mb-3">📋 O que fazer:</h4>
                <ul className="space-y-2 text-white text-sm">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Verifique se todos os campos obrigatórios estão preenchidos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Se você selecionou uma decoração, certifique-se de que a data do aniversário tenha pelo menos 5 dias de antecedência</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Selecione uma data futura que atenda aos requisitos</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors"
                >
                  Entendi, vou corrigir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}