import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Modal from "../ui/Modal";
import { MdSearch, MdUpload, MdDelete } from "react-icons/md";

interface AddEventProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onEventAdded: () => void; // Adicionei um prop para notificar o componente pai
}

interface Establishment {
  id: number;
  name: string;
  street?: string;
  number?: string;
}

const AddEvent: React.FC<AddEventProps> = ({ isOpen, onRequestClose, onEventAdded }) => {
  const [idPlace, setIdPlace] = useState<number | null>(null);
  const [casaDoEvento, setCasaDoEvento] = useState("");
  const [nomeDoEvento, setNomeDoEvento] = useState("");
  const [dataDoEvento, setDataDoEvento] = useState("");
  const [horaDoEvento, setHoraDoEvento] = useState("");
  const [localDoEvento, setLocalDoEvento] = useState("");
  const [categoria, setCategoria] = useState("");
  const [mesas, setMesas] = useState("");
  const [valorDaMesa, setValorDaMesa] = useState("");
  const [brinde, setBrinde] = useState("");
  const [numeroDeConvidados, setNumeroDeConvidados] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valorDaEntrada, setValorDaEntrada] = useState("");
  const [observacao, setObservacao] = useState("");
  const [imagemDoEvento, setImagemDoEvento] = useState<File | null>(null);
  const [imagemDoCombo, setImagemDoCombo] = useState<File | null>(null);
  const [imagemEventoPreview, setImagemEventoPreview] = useState<string | null>(null);
  const [imagemComboPreview, setImagemComboPreview] = useState<string | null>(null);
  const [imagemEventoFilename, setImagemEventoFilename] = useState<string | null>(null);
  const [imagemComboFilename, setImagemComboFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loadingEstablishments, setLoadingEstablishments] = useState(false);

  const [tipoEvento, setTipoEvento] = useState<'unico' | 'semanal'>('unico');
  const [diaDaSemana, setDiaDaSemana] = useState('');

  // Estados para atrações
  interface Atracao {
    nome_atracao: string;
    ambiente: string;
    horario_inicio: string;
    horario_termino: string;
  }
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);

  // Estados para galeria de imagens
  const [showImageGalleryModal, setShowImageGalleryModal] = useState(false);
  const [imageGalleryField, setImageGalleryField] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<Array<{
    filename: string;
    url?: string | null;
    sourceType: string;
    imageType: string;
    usageCount: number;
  }>>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySearchTerm, setGallerySearchTerm] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';
  const API_BASE_URL = `${API_URL}/api/cardapio`;
  const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';

  const fetchEstablishments = useCallback(async () => {
    setLoadingEstablishments(true);
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      setError("Token não encontrado. Faça login novamente.");
      setLoadingEstablishments(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/places`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar estabelecimentos');
      }

      const data = await response.json();
      const placesList = Array.isArray(data) ? data : (data.data || []);
      
      const formattedEstablishments: Establishment[] = placesList.map((place: any) => ({
        id: typeof place.id === 'string' ? parseInt(place.id) : place.id,
        name: place.name || "Sem nome",
        street: place.street || "",
        number: place.number || "",
      }));

      setEstablishments(formattedEstablishments);
    } catch (error) {
      console.error("Erro ao carregar estabelecimentos:", error);
      setError("Erro ao carregar lista de estabelecimentos.");
    } finally {
      setLoadingEstablishments(false);
    }
  }, [API_URL]);

  // Carregar estabelecimentos quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      fetchEstablishments();
    }
  }, [isOpen, fetchEstablishments]);

  // Função para buscar imagens da galeria
  const fetchGalleryImages = useCallback(async (): Promise<Array<{
    filename: string;
    url?: string | null;
    sourceType: string;
    imageType: string;
    usageCount: number;
  }>> => {
    setGalleryLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/gallery/images`);
      if (response.ok) {
        const data = await response.json();
        const images = data.images || [];
        setGalleryImages(images);
        return images;
      } else {
        console.error('Erro ao buscar imagens da galeria');
        setGalleryImages([]);
        return [];
      }
    } catch (error) {
      console.error('Erro ao buscar imagens da galeria:', error);
      setGalleryImages([]);
      return [];
    } finally {
      setGalleryLoading(false);
    }
  }, [API_BASE_URL]);

  // Função auxiliar para montar URL da imagem
  const getValidImageUrl = useCallback((filename: string): string => {
    if (!filename) return '';
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    return `${BASE_IMAGE_URL}${filename}`;
  }, []);

  // Função para abrir galeria de imagens
  const openImageGallery = useCallback((field: string) => {
    setImageGalleryField(field);
    setShowImageGalleryModal(true);
    fetchGalleryImages();
  }, [fetchGalleryImages]);

  // Função para selecionar imagem da galeria
  const handleSelectGalleryImage = useCallback((filename: string, imageUrl?: string | null) => {
    // Usar a URL completa para preview, mas manter o filename para envio à API
    const previewUrl = imageUrl || getValidImageUrl(filename);
    
    if (imageGalleryField === 'imagem_do_evento') {
      setImagemDoEvento(null);
      setImagemEventoPreview(previewUrl);
      setImagemEventoFilename(filename);
    } else if (imageGalleryField === 'imagem_do_combo') {
      setImagemDoCombo(null);
      setImagemComboPreview(previewUrl);
      setImagemComboFilename(filename);
    }
    
    setShowImageGalleryModal(false);
    setImageGalleryField('');
    setGallerySearchTerm('');
  }, [imageGalleryField, getValidImageUrl]);

  // Função para deletar imagem da galeria
  const handleDeleteGalleryImage = useCallback(
    async (filename: string, e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (!confirm(`Tem certeza que deseja deletar a imagem "${filename}"?`)) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/gallery/images/${encodeURIComponent(filename)}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchGalleryImages();
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(errorData.message || errorData.error || 'Erro ao deletar imagem.');
        }
      } catch (err) {
        console.error('Erro ao deletar imagem:', err);
        alert('Erro ao deletar imagem. Tente novamente.');
      }
    },
    [API_BASE_URL, fetchGalleryImages],
  );

  const resetForm = () => {
    setIdPlace(null);
    setCasaDoEvento("");
    setNomeDoEvento("");
    setDataDoEvento("");
    setHoraDoEvento("");
    setLocalDoEvento("");
    setCategoria("");
    setMesas("");
    setValorDaMesa("");
    setBrinde("");
    setNumeroDeConvidados("");
    setDescricao("");
    setValorDaEntrada("");
    setObservacao("");
    setImagemDoEvento(null);
    setImagemDoCombo(null);
    setImagemEventoPreview(null);
    setImagemComboPreview(null);
    setImagemEventoFilename(null);
    setImagemComboFilename(null);
    setTipoEvento('unico');
    setDiaDaSemana('');
    setAtracoes([]);
    setError(null);
  };

  const handleEstablishmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    // Normalizar comparação para funcionar com string ou number
    const selectedEstablishment = establishments.find(est => {
      const estId = typeof est.id === 'string' ? parseInt(est.id) : est.id;
      return estId === selectedId;
    });
    
    setIdPlace(selectedId);
    setCasaDoEvento(selectedEstablishment?.name || "");
    
    // Preencher automaticamente o campo "Local do Evento" com o endereço
    if (selectedEstablishment) {
      const addressParts: string[] = [];
      if (selectedEstablishment.street) {
        addressParts.push(selectedEstablishment.street);
      }
      if (selectedEstablishment.number) {
        addressParts.push(selectedEstablishment.number);
      }
      const fullAddress = addressParts.join(', ');
      if (fullAddress) {
        setLocalDoEvento(fullAddress);
      }
    }
  };

  const uploadImage = async (file: File): Promise<{ filename: string; url: string } | null> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token não encontrado. Faça login novamente.");
      return null;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('entityType', 'event');

    try {
      const response = await fetch(`${API_URL}/api/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(`Erro no upload da imagem: ${errorData.error || 'Erro desconhecido.'}`);
        return null;
      }

      const result = await response.json();
      return {
        filename: result.filename,
        url: result.url || result.filename // URL completa do Cloudinary ou fallback para filename
      };
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      setError("Ocorreu um erro de conexão ao enviar a imagem.");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token não encontrado. Faça login novamente.");
      setIsLoading(false);
      return;
    }

    let finalImagemEventoFilename: string | null = null;
    let finalImagemComboFilename: string | null = null;

    // 1. Upload da imagem do evento
    if (imagemDoEvento) {
      // Se é um File, fazer upload
      const uploadResult = await uploadImage(imagemDoEvento);
      if (!uploadResult) {
        setIsLoading(false);
        return;
      }
      finalImagemEventoFilename = uploadResult.filename;
      // Atualiza o preview imediatamente com a URL completa do Cloudinary
      setImagemEventoPreview(uploadResult.url);
      setImagemEventoFilename(uploadResult.filename);
    } else if (imagemEventoFilename) {
      // Se foi selecionada da galeria, usar o filename armazenado
      finalImagemEventoFilename = imagemEventoFilename;
    }

    // 2. Upload da imagem do combo (se houver)
    if (imagemDoCombo) {
      // Se é um File, fazer upload
      const uploadResult = await uploadImage(imagemDoCombo);
      if (!uploadResult) {
        setIsLoading(false);
        return;
      }
      finalImagemComboFilename = uploadResult.filename;
      // Atualiza o preview imediatamente com a URL completa do Cloudinary
      setImagemComboPreview(uploadResult.url);
      setImagemComboFilename(uploadResult.filename);
    } else if (imagemComboFilename) {
      // Se foi selecionada da galeria, usar o filename armazenado
      finalImagemComboFilename = imagemComboFilename;
    }

    // Validação: verificar se um estabelecimento foi selecionado
    if (!idPlace) {
      setError("Por favor, selecione um estabelecimento.");
      setIsLoading(false);
      return;
    }

    // Validação: verificar se a imagem do evento foi fornecida
    if (!finalImagemEventoFilename && !imagemDoEvento && !imagemEventoFilename) {
      setError("Por favor, selecione ou faça upload de uma imagem para o evento.");
      setIsLoading(false);
      return;
    }

    // Garantir que casa_do_evento esteja preenchido e preencher local_do_evento se necessário
    let finalCasaDoEvento = casaDoEvento;
    let finalLocalDoEvento = localDoEvento;
    
    // Buscar o estabelecimento baseado no idPlace
    const selectedEstablishment = establishments.find(est => {
      const estId = typeof est.id === 'string' ? parseInt(est.id) : est.id;
      const placeId = typeof idPlace === 'string' ? parseInt(idPlace) : idPlace;
      return estId === placeId;
    });
    
    if (!selectedEstablishment) {
      console.error('Estabelecimento não encontrado:', { idPlace, establishments });
      setError("Erro ao identificar o estabelecimento selecionado. Por favor, selecione novamente.");
      setIsLoading(false);
      return;
    }
    
    // Preencher casa_do_evento se estiver vazio
    if (!finalCasaDoEvento || finalCasaDoEvento.trim() === '') {
      finalCasaDoEvento = selectedEstablishment.name;
    }
    
    // Preencher local_do_evento se estiver vazio e o estabelecimento tiver endereço
    if ((!finalLocalDoEvento || finalLocalDoEvento.trim() === '') && selectedEstablishment.street) {
      const addressParts: string[] = [];
      if (selectedEstablishment.street) {
        addressParts.push(selectedEstablishment.street);
      }
      if (selectedEstablishment.number) {
        addressParts.push(selectedEstablishment.number);
      }
      finalLocalDoEvento = addressParts.join(', ');
    }

    // 3. Criação do evento com os nomes dos arquivos
    const eventData = {
      casa_do_evento: finalCasaDoEvento,
      nome_do_evento: nomeDoEvento,
      hora_do_evento: horaDoEvento,
      local_do_evento: finalLocalDoEvento,
      categoria: categoria,
      mesas: mesas ? parseInt(mesas) : null,
      valor_da_mesa: valorDaMesa ? parseFloat(valorDaMesa) : null,
      brinde: brinde || null,
      numero_de_convidados: numeroDeConvidados ? parseInt(numeroDeConvidados) : null,
      descricao: descricao,
      valor_da_entrada: valorDaEntrada ? parseFloat(valorDaEntrada) : null,
      observacao: observacao || null,
      tipo_evento: tipoEvento,
      data_do_evento: tipoEvento === 'unico' ? dataDoEvento : null,
      dia_da_semana: tipoEvento === 'semanal' ? (diaDaSemana ? parseInt(diaDaSemana) : null) : null,
      imagem_do_evento: finalImagemEventoFilename,
      imagem_do_combo: finalImagemComboFilename,
      id_place: idPlace, // Enviando o ID do estabelecimento
      atracoes: atracoes, // Enviando as atrações
    };

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        const errorMessage = errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`;
        console.error('Erro da API:', errorData);
        throw new Error(errorMessage);
      }

      alert("Evento criado com sucesso!");
      resetForm();
      onRequestClose();
      onEventAdded(); // Notifica o pai para recarregar a lista
    } catch (err) {
      console.error("Erro ao adicionar evento:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro ao adicionar o evento. Verifique se todos os campos estão corretos.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setImage: React.Dispatch<React.SetStateAction<File | null>>, setPreview: React.Dispatch<React.SetStateAction<string | null>>, setFilename?: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      // Limpar filename da galeria se um novo arquivo for selecionado
      if (setFilename) {
        setFilename(null);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Adicionar Evento" className="fixed inset-0 flex items-center justify-center p-4" overlayClassName="fixed inset-0 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Adicionar Evento</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <select 
              className="w-full p-2 border rounded" 
              value={idPlace || ""} 
              onChange={handleEstablishmentChange} 
              required
              disabled={loadingEstablishments}
            >
              <option value="" disabled>
                {loadingEstablishments ? "Carregando estabelecimentos..." : "Selecione o estabelecimento"}
              </option>
              {establishments.map((establishment) => (
                <option key={establishment.id} value={establishment.id}>
                  {establishment.name}
                </option>
              ))}
            </select>
          </div>
          <input className="w-full p-2 border rounded" type="text" placeholder="Nome do evento" value={nomeDoEvento} onChange={(e) => setNomeDoEvento(e.target.value)} required />

          <div className="col-span-2 border rounded p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento</label>
            <div className="flex items-center gap-x-6">
              <div className="flex items-center">
                <input id="tipo-unico" name="tipo-evento" type="radio" value="unico" checked={tipoEvento === 'unico'} onChange={() => setTipoEvento('unico')} className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="tipo-unico" className="ml-2 block text-sm font-medium text-gray-900">Evento Único</label>
              </div>
              <div className="flex items-center">
                <input id="tipo-semanal" name="tipo-evento" type="radio" value="semanal" checked={tipoEvento === 'semanal'} onChange={() => setTipoEvento('semanal')} className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="tipo-semanal" className="ml-2 block text-sm font-medium text-gray-900">Evento Semanal</label>
              </div>
            </div>
          </div>
          
          {tipoEvento === 'unico' ? (
            <input className="w-full p-2 border rounded" type="date" placeholder="Data do evento" value={dataDoEvento} onChange={(e) => setDataDoEvento(e.target.value)} required />
          ) : (
            <select className="w-full p-2 border rounded" value={diaDaSemana} onChange={(e) => setDiaDaSemana(e.target.value)} required>
              <option value="" disabled>Selecione o dia da semana</option>
              <option value="0">Domingo</option>
              <option value="1">Segunda-feira</option>
              <option value="2">Terça-feira</option>
              <option value="3">Quarta-feira</option>
              <option value="4">Quinta-feira</option>
              <option value="5">Sexta-feira</option>
              <option value="6">Sábado</option>
            </select>
          )}

          <input className="w-full p-2 border rounded" type="time" placeholder="Hora do evento" value={horaDoEvento} onChange={(e) => setHoraDoEvento(e.target.value)} required />
          
          <input className="w-full p-2 border rounded" type="text" placeholder="Local do evento" value={localDoEvento} onChange={(e) => setLocalDoEvento(e.target.value)} required />
          <input className="w-full p-2 border rounded" type="text" placeholder="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} required />
          <input className="w-full p-2 border rounded" type="number" placeholder="Mesas" value={mesas} onChange={(e) => setMesas(e.target.value)} />
          <input className="w-full p-2 border rounded" type="number" placeholder="Valor da mesa" value={valorDaMesa} onChange={(e) => setValorDaMesa(e.target.value)} step="0.01" />
          <input className="w-full p-2 border rounded" type="text" placeholder="Brinde" value={brinde} onChange={(e) => setBrinde(e.target.value)} />
          <input className="w-full p-2 border rounded" type="number" placeholder="Número de convidados" value={numeroDeConvidados} onChange={(e) => setNumeroDeConvidados(e.target.value)} />
          <input className="w-full p-2 border rounded" type="number" placeholder="Valor da entrada" value={valorDaEntrada} onChange={(e) => setValorDaEntrada(e.target.value)} step="0.01" required />
          
          <textarea className="w-full p-2 border rounded col-span-2" placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />

          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="flex flex-col items-center border-2 border-dashed border-gray-300 p-4 rounded-lg cursor-pointer hover:border-blue-400 transition">
                <span className="text-sm font-semibold text-gray-500">Imagem do evento</span>
                <input type="file" className="hidden" onChange={(e) => handleImageChange(e, setImagemDoEvento, setImagemEventoPreview, setImagemEventoFilename)} />
                {imagemEventoPreview ? (
                  <Image src={imagemEventoPreview} alt="Pré-visualização do evento" className="mt-2 h-24 w-auto rounded shadow" width={64} height={64} />
                ) : (
                  <span className="text-xs text-gray-400">Selecione uma imagem</span>
                )}
              </label>
              <button
                type="button"
                onClick={() => openImageGallery('imagem_do_evento')}
                className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-white text-sm hover:bg-green-700 transition-colors"
              >
                <MdUpload className="h-4 w-4" />
                Abrir Galeria
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex flex-col items-center border-2 border-dashed border-gray-300 p-4 rounded-lg cursor-pointer hover:border-blue-400 transition">
                <span className="text-sm font-semibold text-gray-500">Imagem do combo</span>
                <input type="file" className="hidden" onChange={(e) => handleImageChange(e, setImagemDoCombo, setImagemComboPreview, setImagemComboFilename)} />
                {imagemComboPreview ? (
                  <Image src={imagemComboPreview} alt="Pré-visualização do combo" className="mt-2 h-24 w-auto rounded shadow" width={64} height={64} />
                ) : (
                  <span className="text-xs text-gray-400">Selecione uma imagem</span>
                )}
              </label>
              <button
                type="button"
                onClick={() => openImageGallery('imagem_do_combo')}
                className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-white text-sm hover:bg-green-700 transition-colors"
              >
                <MdUpload className="h-4 w-4" />
                Abrir Galeria
              </button>
            </div>
          </div>

          <textarea className="w-full p-2 border rounded col-span-2" placeholder="Observação" value={observacao} onChange={(e) => setObservacao(e.target.value)} />

          {/* Seção de Atrações */}
          <div className="col-span-2 border rounded p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-700">Atrações do Evento</h3>
              <button
                type="button"
                onClick={() => setAtracoes([...atracoes, { nome_atracao: '', ambiente: '', horario_inicio: '', horario_termino: '' }])}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
              >
                + Adicionar Atração
              </button>
            </div>
            {atracoes.map((atracao, index) => (
              <div key={index} className="mb-4 p-3 bg-white border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Atração {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => setAtracoes(atracoes.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remover
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full p-2 border rounded"
                    type="text"
                    placeholder="Nome da Atração"
                    value={atracao.nome_atracao}
                    onChange={(e) => {
                      const novasAtracoes = [...atracoes];
                      novasAtracoes[index].nome_atracao = e.target.value;
                      setAtracoes(novasAtracoes);
                    }}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    type="text"
                    placeholder="Ambiente"
                    value={atracao.ambiente}
                    onChange={(e) => {
                      const novasAtracoes = [...atracoes];
                      novasAtracoes[index].ambiente = e.target.value;
                      setAtracoes(novasAtracoes);
                    }}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    type="time"
                    placeholder="Horário de Início"
                    value={atracao.horario_inicio}
                    onChange={(e) => {
                      const novasAtracoes = [...atracoes];
                      novasAtracoes[index].horario_inicio = e.target.value;
                      setAtracoes(novasAtracoes);
                    }}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    type="time"
                    placeholder="Horário de Término"
                    value={atracao.horario_termino}
                    onChange={(e) => {
                      const novasAtracoes = [...atracoes];
                      novasAtracoes[index].horario_termino = e.target.value;
                      setAtracoes(novasAtracoes);
                    }}
                  />
                </div>
              </div>
            ))}
            {atracoes.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">Nenhuma atração adicionada. Clique em "Adicionar Atração" para incluir.</p>
            )}
          </div>

          <button type="submit" disabled={isLoading} className="col-span-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:bg-gray-400">
            {isLoading ? 'Adicionando...' : 'Adicionar Evento'}
          </button>
          {error && <p className="col-span-2 text-red-500 text-sm mt-2">{error}</p>}
        </form>
        <button onClick={onRequestClose} className="mt-4 w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition">Fechar</button>
      </div>

      {/* Modal da Galeria de Imagens */}
      <Modal
        isOpen={showImageGalleryModal}
        onRequestClose={() => {
          setShowImageGalleryModal(false);
          setImageGalleryField('');
          setGallerySearchTerm('');
        }}
        contentLabel="Galeria de Imagens"
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold mb-4">Galeria de Imagens</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar imagens por nome..."
                  value={gallerySearchTerm}
                  onChange={(e) => setGallerySearchTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={async () => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files[0]) {
                      const uploadResult = await uploadImage(files[0]);
                      if (uploadResult) {
                        // Aguardar um pouco para garantir que a imagem foi salva no banco
                        await new Promise(resolve => setTimeout(resolve, 500));
                        // Buscar imagens e obter a lista atualizada
                        const updatedImages = await fetchGalleryImages();
                        // Buscar a imagem recém-enviada na galeria para obter a URL completa
                        const uploadedImage = updatedImages.find(img => img.filename === uploadResult.filename);
                        const imageUrl = uploadedImage?.url || uploadResult.url;
                        // Selecionar automaticamente a imagem recém-enviada
                        handleSelectGalleryImage(uploadResult.filename, imageUrl);
                      }
                    }
                  };
                  input.click();
                }}
                className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
              >
                <MdUpload className="h-5 w-5" />
                <span>Upload</span>
              </button>
            </div>
            {!galleryLoading && galleryImages.length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                {galleryImages.filter(img => 
                  !gallerySearchTerm || 
                  img.filename.toLowerCase().includes(gallerySearchTerm.toLowerCase())
                ).length} imagem(s) encontrada(s)
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {galleryLoading ? (
              <div className="flex justify-center items-center py-12">
                <span className="text-gray-500">Carregando imagens...</span>
              </div>
            ) : galleryImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <MdUpload className="h-12 w-12 mb-4 text-gray-300" />
                <p>Nenhuma imagem encontrada.</p>
                <p className="text-sm mt-1">Faça upload de uma imagem para começar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {galleryImages
                  .filter(img => 
                    !gallerySearchTerm || 
                    img.filename.toLowerCase().includes(gallerySearchTerm.toLowerCase())
                  )
                  .map((image, index) => {
                    const imageUrl = image.url || getValidImageUrl(image.filename);
                    return (
                      <div
                        key={`${image.filename}-${index}`}
                        className="relative group cursor-pointer rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all overflow-hidden shadow-md hover:shadow-lg"
                        onClick={() => handleSelectGalleryImage(image.filename, image.url || undefined)}
                      >
                        <div className="aspect-square relative bg-gray-100">
                          <Image
                            src={imageUrl}
                            alt={image.filename}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                            className="object-cover transition-transform group-hover:scale-105"
                            unoptimized
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute inset-0 flex items-center justify-center gap-2">
                            <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
                              Selecionar
                            </span>
                            <button
                              onClick={(e) => handleDeleteGalleryImage(image.filename, e)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                              title="Deletar imagem"
                            >
                              <MdDelete className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-2">
                          <p className="truncate font-medium">{image.filename}</p>
                          {image.sourceType && (
                            <p className="text-xs text-gray-300 mt-0.5">
                              {image.sourceType === 'menu_item' ? 'Item' : 'Bar'} • {image.usageCount}x usado
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default AddEvent;