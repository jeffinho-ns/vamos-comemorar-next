'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaBirthdayCake, FaPalette, FaGift, FaGlassCheers, FaUtensils, FaInfoCircle, FaExclamationTriangle, FaCheck, FaCalendarAlt, FaUser, FaIdCard, FaPhone, FaEnvelope, FaStore, FaUsers, FaImage, FaPalette as FaPaletteIcon, FaTextHeight, FaPlus, FaMinus, FaArrowLeft } from 'react-icons/fa';
import { BirthdayService } from '../services/birthdayService';

interface DecorationOption {
  name: string;
  price: number;
  image: string;
  description: string;
}

interface BeverageOption {
  name: string;
  price: number;
  category: string;
  description: string;
}

interface GiftOption {
  name: string;
  price: number;
  category: string;
  image: string;
}

interface FoodOption {
  name: string;
  price: number;
  category: string;
  description: string;
}

export default function ReservaAniversarioPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('dados');

  // Form data
  const [formData, setFormData] = useState({
    aniversarianteNome: '',
    documento: '',
    whatsapp: '',
    email: '',
    dataAniversario: '',
    barSelecionado: '',
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

  // Data options
  const decorationOptions: DecorationOption[] = [
    { name: 'Decoração Pequena 1', price: 200.0, image: '/agilizai/kit-1.jpg', description: 'Decoração pequena estilo 1.' },
    { name: 'Decoração Pequena 2', price: 220.0, image: '/agilizai/kit-2.jpg', description: 'Decoração pequena estilo 2.' },
    { name: 'Decoração Media 3', price: 250.0, image: '/agilizai/kit-3.jpg', description: 'Decoração média estilo 3.' },
    { name: 'Decoração Media 4', price: 270.0, image: '/assets/agilizai/kit-4.jpg', description: 'Decoração média estilo 4.' },
    { name: 'Decoração Grande 5', price: 300.0, image: '/agilizai/kit-5.jpg', description: 'Decoração grande estilo 5.' },
    { name: 'Decoração Grande 6', price: 320.0, image: '/agilizai/kit-6.jpg', description: 'Decoração grande estilo 6.' },
  ];

  const painelEstoqueImages = [
    '/agilizai/painel-1.jpg', '/agilizai/painel-2.jpg', '/agilizai/painel-3.jpg',
    '/agilizai/painel-4.jpg', '/agilizai/painel-5.jpg', '/agilizai/painel-6.jpg',
    '/agilizai/painel-7.jpg', '/agilizai/painel-8.jpg', '/agilizai/painel-9.jpg',
    '/agilizai/painel-10.jpg'
  ];

  const beverageOptions: BeverageOption[] = [
    { name: 'Item-bar-Bebida - 1', price: 12.0, category: 'Bebida', description: 'Bebida do bar item 1.' },
    { name: 'Item-bar-Bebida - 2', price: 15.0, category: 'Bebida', description: 'Bebida do bar item 2.' },
    { name: 'Item-bar-Bebida - 3', price: 18.0, category: 'Bebida', description: 'Bebida do bar item 3.' },
    { name: 'Item-bar-Bebida - 4', price: 20.0, category: 'Bebida', description: 'Bebida do bar item 4.' },
    { name: 'Item-bar-Bebida - 5', price: 22.0, category: 'Bebida', description: 'Bebida do bar item 5.' },
    { name: 'Item-bar-Bebida - 6', price: 25.0, category: 'Bebida', description: 'Bebida do bar item 6.' },
    { name: 'Item-bar-Bebida - 7', price: 28.0, category: 'Bebida', description: 'Bebida do bar item 7.' },
    { name: 'Item-bar-Bebida - 8', price: 30.0, category: 'Bebida', description: 'Bebida do bar item 8.' },
    { name: 'Item-bar-Bebida - 9', price: 35.0, category: 'Bebida', description: 'Bebida do bar item 9.' },
    { name: 'Item-bar-Bebida - 10', price: 40.0, category: 'Bebida', description: 'Bebida do bar item 10.' },
  ];

  const foodOptions: FoodOption[] = [
    { name: 'Item-bar-Comida - 1', price: 25.0, category: 'Comida', description: 'Comida do bar item 1' },
    { name: 'Item-bar-Comida - 2', price: 28.0, category: 'Comida', description: 'Comida do bar item 2' },
    { name: 'Item-bar-Comida - 3', price: 30.0, category: 'Comida', description: 'Comida do bar item 3' },
    { name: 'Item-bar-Comida - 4', price: 32.0, category: 'Comida', description: 'Comida do bar item 4' },
    { name: 'Item-bar-Comida - 5', price: 35.0, category: 'Comida', description: 'Comida do bar item 5' },
    { name: 'Item-bar-Comida - 6', price: 38.0, category: 'Comida', description: 'Comida do bar item 6' },
    { name: 'Item-bar-Comida - 7', price: 40.0, category: 'Comida', description: 'Comida do bar item 7' },
    { name: 'Item-bar-Comida - 8', price: 42.0, category: 'Comida', description: 'Comida do bar item 8' },
    { name: 'Item-bar-Comida - 9', price: 45.0, category: 'Comida', description: 'Comida do bar item 9' },
    { name: 'Item-bar-Comida - 10', price: 48.0, category: 'Comida', description: 'Comida do bar item 10' },
  ];

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

  const barOptions = ['Seu Justino', 'Oh Fregues', 'HighLine', 'Pracinha do Seu Justino'];

  // Validation
  const isPersonalizedPanelAllowed = () => {
    if (selectedPainelOption === 'personalizado' && formData.dataAniversario) {
      const selectedDate = new Date(formData.dataAniversario);
      const now = new Date();
      const difference = Math.ceil((selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return difference >= 5;
    }
    return true;
  };

  // Calculate total
  const calculateTotal = () => {
    let total = 0;
    if (selectedDecoration) {
      total += selectedDecoration.price;
    }
    for (const [name, quantity] of Object.entries(selectedBeverages)) {
      const beverage = beverageOptions.find(b => b.name === name);
      if (beverage) total += beverage.price * quantity;
    }
    for (const [name, quantity] of Object.entries(selectedFoods)) {
      const food = foodOptions.find(f => f.name === name);
      if (food) total += food.price * quantity;
    }
    return total;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedDecoration || !formData.barSelecionado || !formData.dataAniversario) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      // Mapear bebidas selecionadas
      const bebidasMap: Record<string, number> = {};
      for (let i = 1; i <= 10; i++) {
        const key = `Item-bar-Bebida - ${i}`;
        bebidasMap[`item_bar_bebida_${i}`] = selectedBeverages[key] || 0;
      }

      // Mapear comidas selecionadas
      const comidasMap: Record<string, number> = {};
      for (let i = 1; i <= 10; i++) {
        const key = `Item-bar-Comida - ${i}`;
        comidasMap[`item_bar_comida_${i}`] = selectedFoods[key] || 0;
      }

      const reservationData = {
        user_id: 1, // TODO: Get from auth
        aniversariante_nome: formData.aniversarianteNome,
        data_aniversario: new Date(formData.dataAniversario).toISOString(),
        quantidade_convidados: formData.quantidadeConvidados,
        id_casa_evento: parseInt(formData.barSelecionado) || 0,
        decoracao_tipo: selectedDecoration.name,
        painel_personalizado: selectedPainelOption === 'personalizado',
        painel_tema: selectedPainelOption === 'personalizado' ? formData.painelTema : undefined,
        painel_frase: selectedPainelOption === 'personalizado' ? formData.painelFrase : undefined,
        painel_estoque_imagem_url: selectedPainelOption === 'estoque' ? selectedPainelImage : undefined,
        ...bebidasMap,
        ...comidasMap,
        lista_presentes: selectedGifts.map(gift => gift.name),
        documento: formData.documento,
        whatsapp: formData.whatsapp,
        email: formData.email,
      };

      const result = await BirthdayService.createBirthdayReservation(reservationData);
      alert(`Reserva criada com sucesso! ID: ${result.id}`);
      router.push('/decoracao-aniversario');
    } catch (error) {
      alert(`Erro ao criar reserva: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Info widgets
  const InfoWidget = ({ text, title, message }: { text: string; title: string; message: string }) => (
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

  const WarningWidget = ({ text, title, message }: { text: string; title: string; message: string }) => (
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
        <Image
          src="/agilizai/niver.jpeg" 
          alt="Reserve seu Aniversário"
          fill
          className="absolute z-0 object-cover"
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
              { id: 'bebidas', label: 'Bebidas', icon: FaGlassCheers },
              { id: 'comidas', label: 'Comidas', icon: FaUtensils },
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
                  onChange={(e) => setFormData({...formData, dataAniversario: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Bar *</label>
                <select
                  value={formData.barSelecionado}
                  onChange={(e) => setFormData({...formData, barSelecionado: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Selecione um bar</option>
                  {barOptions.map((bar) => (
                    <option key={bar} value={bar}>{bar}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Quantidade de convidados</label>
              <div className="flex items-center space-x-4">
                <span className="text-white">1</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={formData.quantidadeConvidados}
                  onChange={(e) => setFormData({...formData, quantidadeConvidados: parseInt(e.target.value)})}
                  className="flex-1"
                />
                <span className="text-white font-bold">{formData.quantidadeConvidados}</span>
              </div>
            </div>
          </div>
        )}

        {/* Decoração */}
        {activeSection === 'decoracao' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Escolha sua Decoração ✨</h2>
            
            <InfoWidget
              text="💡 A decoração é um aluguel, não pode levar os painéis e bandejas para casa apenas os brindes que estiverem. O valor de cada opção está em cada card e será adicionado à sua comanda."
              title="Informação sobre Decoração"
              message="A decoração é um aluguel, não pode levar os painéis e bandejas para casa apenas os brindes que estiverem. O valor de cada opção está em cada card e será adicionado à sua comanda."
            />

            <div className="grid md:grid-cols-2 gap-6">
              {decorationOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedDecoration(option)}
                  className={`bg-slate-800 rounded-xl p-6 cursor-pointer border-2 transition-all hover:shadow-lg ${
                    selectedDecoration?.name === option.name
                      ? 'border-orange-500 bg-orange-500 bg-opacity-10'
                      : 'border-slate-700 hover:border-orange-400'
                  }`}
                >
                  <div className="h-32 relative overflow-hidden rounded-lg mb-4">
                    <Image
                      src={option.image}
                      alt={option.name}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{option.name}</h3>
                  <p className="text-2xl font-bold text-orange-500 mb-2">R$ {option.price.toFixed(2)}</p>
                  <p className="text-slate-300 text-sm">{option.description}</p>
                  {selectedDecoration?.name === option.name && (
                    <div className="mt-4 flex items-center justify-center">
                      <FaCheck className="text-orange-500 text-xl" />
                    </div>
                  )}
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
                      <Image
                        src={image}
                        alt={`Painel ${index + 1}`}
                        fill
                        className="object-cover"
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

        {/* Bebidas */}
        {activeSection === 'bebidas' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Adicionar Bebidas 🥂</h2>
            
            <InfoWidget
              text="💡 Cada bebida que for adicionada será acrescentada o valor na comanda de quem está criando essa lista."
              title="Informação sobre Bebidas"
              message="Cada bebida que for adicionada será acrescentada o valor na comanda de quem está criando essa lista."
            />

            <div className="space-y-4">
              {beverageOptions.map((beverage) => (
                <div key={beverage.name} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{beverage.name}</h4>
                      <p className="text-orange-500 font-bold">R$ {beverage.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          const current = selectedBeverages[beverage.name] || 0;
                          if (current > 0) {
                            setSelectedBeverages({
                              ...selectedBeverages,
                              [beverage.name]: current - 1
                            });
                          }
                        }}
                        className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white hover:bg-slate-600"
                      >
                        <FaMinus className="text-sm" />
                      </button>
                      <span className="text-white font-bold w-8 text-center">
                        {selectedBeverages[beverage.name] || 0}
                      </span>
                      <button
                        onClick={() => {
                          const current = selectedBeverages[beverage.name] || 0;
                          setSelectedBeverages({
                            ...selectedBeverages,
                            [beverage.name]: current + 1
                          });
                        }}
                        className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600"
                      >
                        <FaPlus className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comidas */}
        {activeSection === 'comidas' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Adicionar Porções 🍽️</h2>
            
            <InfoWidget
              text="💡 Lembre que cada porção será acrescentada na comanda."
              title="Informação sobre Porções"
              message="Lembre que cada porção será acrescentada na comanda."
            />

            <div className="space-y-4">
              {foodOptions.map((food) => (
                <div key={food.name} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{food.name}</h4>
                      <p className="text-orange-500 font-bold">R$ {food.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          const current = selectedFoods[food.name] || 0;
                          if (current > 0) {
                            setSelectedFoods({
                              ...selectedFoods,
                              [food.name]: current - 1
                            });
                          }
                        }}
                        className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white hover:bg-slate-600"
                      >
                        <FaMinus className="text-sm" />
                      </button>
                      <span className="text-white font-bold w-8 text-center">
                        {selectedFoods[food.name] || 0}
                      </span>
                      <button
                        onClick={() => {
                          const current = selectedFoods[food.name] || 0;
                          setSelectedFoods({
                            ...selectedFoods,
                            [food.name]: current + 1
                          });
                        }}
                        className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600"
                      >
                        <FaPlus className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                    <Image
                      src={gift.image}
                      alt={gift.name}
                      fill
                      className="object-cover transition-transform hover:scale-105"
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

        {/* Total Value Section */}
        <div className="mt-12 bg-orange-500 bg-opacity-10 border border-orange-500 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-white text-center mb-4">💰 VALOR TOTAL DA RESERVA</h3>
          <p className="text-4xl font-bold text-orange-500 text-center mb-4">
            R$ {calculateTotal().toFixed(2)}
          </p>
          <p className="text-white text-center text-sm">
            Este valor será adicionado à sua comanda no bar selecionado.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => router.push('/decoracao-aniversario')}
            className="flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Voltar
          </button>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedDecoration || !formData.barSelecionado || !formData.dataAniversario}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processando...' : 'CONFIRMAR RESERVA'}
          </button>
        </div>
      </div>
    </div>
  );
}
