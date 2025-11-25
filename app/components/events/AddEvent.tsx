import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Modal from "../ui/Modal";

interface AddEventProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onEventAdded: () => void; // Adicionei um prop para notificar o componente pai
}

interface Establishment {
  id: number;
  name: string;
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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loadingEstablishments, setLoadingEstablishments] = useState(false);

  const [tipoEvento, setTipoEvento] = useState<'unico' | 'semanal'>('unico');
  const [diaDaSemana, setDiaDaSemana] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';

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
        id: place.id,
        name: place.name || "Sem nome",
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
    setTipoEvento('unico');
    setDiaDaSemana('');
    setError(null);
  };

  const handleEstablishmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selectedEstablishment = establishments.find(est => est.id === selectedId);
    
    setIdPlace(selectedId);
    setCasaDoEvento(selectedEstablishment?.name || "");
  };

  const uploadImage = async (file: File): Promise<string | null> => {
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
      return result.filename;
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

    let imagemEventoFilename: string | null = null;
    let imagemComboFilename: string | null = null;

    // 1. Upload da imagem do evento
    if (imagemDoEvento) {
      imagemEventoFilename = await uploadImage(imagemDoEvento);
      if (!imagemEventoFilename) {
        setIsLoading(false);
        return;
      }
    }

    // 2. Upload da imagem do combo (se houver)
    if (imagemDoCombo) {
      imagemComboFilename = await uploadImage(imagemDoCombo);
      if (!imagemComboFilename) {
        setIsLoading(false);
        return;
      }
    }

    // Validação: verificar se um estabelecimento foi selecionado
    if (!idPlace) {
      setError("Por favor, selecione um estabelecimento.");
      setIsLoading(false);
      return;
    }

    // Garantir que casa_do_evento esteja preenchido
    let finalCasaDoEvento = casaDoEvento;
    if (!finalCasaDoEvento || finalCasaDoEvento.trim() === '') {
      // Buscar o nome do estabelecimento baseado no idPlace
      const selectedEstablishment = establishments.find(est => est.id === idPlace);
      if (selectedEstablishment) {
        finalCasaDoEvento = selectedEstablishment.name;
      } else {
        setError("Erro ao identificar o estabelecimento selecionado. Por favor, selecione novamente.");
        setIsLoading(false);
        return;
      }
    }

    // 3. Criação do evento com os nomes dos arquivos
    const eventData = {
      casa_do_evento: finalCasaDoEvento,
      nome_do_evento: nomeDoEvento,
      hora_do_evento: horaDoEvento,
      local_do_evento: localDoEvento,
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
      imagem_do_evento: imagemEventoFilename,
      imagem_do_combo: imagemComboFilename,
      id_place: idPlace, // Enviando o ID do estabelecimento
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setImage: React.Dispatch<React.SetStateAction<File | null>>, setPreview: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
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
            <label className="flex flex-col items-center border-2 border-dashed border-gray-300 p-4 rounded-lg cursor-pointer hover:border-blue-400 transition">
              <span className="text-sm font-semibold text-gray-500">Imagem do evento</span>
              <input type="file" className="hidden" onChange={(e) => handleImageChange(e, setImagemDoEvento, setImagemEventoPreview)} required />
              {imagemEventoPreview ? <Image src={imagemEventoPreview} alt="Pré-visualização do evento" className="mt-2 h-24 w-auto rounded shadow" width={64} height={64} /> : <span className="text-xs text-gray-400">Selecione uma imagem</span>}
            </label>
            <label className="flex flex-col items-center border-2 border-dashed border-gray-300 p-4 rounded-lg cursor-pointer hover:border-blue-400 transition">
              <span className="text-sm font-semibold text-gray-500">Imagem do combo</span>
              <input type="file" className="hidden" onChange={(e) => handleImageChange(e, setImagemDoCombo, setImagemComboPreview)} />
              {imagemComboPreview ? <Image src={imagemComboPreview} alt="Pré-visualização do combo" className="mt-2 h-24 w-auto rounded shadow" width={64} height={64} /> : <span className="text-xs text-gray-400">Selecione uma imagem</span>}
            </label>
          </div>

          <textarea className="w-full p-2 border rounded col-span-2" placeholder="Observação" value={observacao} onChange={(e) => setObservacao(e.target.value)} />

          <button type="submit" disabled={isLoading} className="col-span-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:bg-gray-400">
            {isLoading ? 'Adicionando...' : 'Adicionar Evento'}
          </button>
          {error && <p className="col-span-2 text-red-500 text-sm mt-2">{error}</p>}
        </form>
        <button onClick={onRequestClose} className="mt-4 w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition">Fechar</button>
      </div>
    </Modal>
  );
};

export default AddEvent;