import React, { useState, useEffect, useCallback } from "react";
import { EventData } from "../../types/types";
import Image from "next/image";
import Modal from "../ui/Modal";
import { resolve } from "path";

// Adicione a URL base do seu servidor de imagens
const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';

interface EditEventProps {
  isOpen: boolean;
  onRequestClose: () => void;
  event: EventData;
  onEventUpdated: () => void; // Adicionei um prop para notificar o componente pai
}

const EditEvent: React.FC<EditEventProps> = ({ isOpen, onRequestClose, event, onEventUpdated }) => {
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [tipoEvento, setTipoEvento] = useState<'unico' | 'semanal'>('unico');
  const [diaDaSemana, setDiaDaSemana] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  // Função auxiliar para montar a URL completa da imagem
  const getImageUrl = useCallback((filename: string | null | undefined): string => {
    if (!filename) {
      return "https://via.placeholder.com/150";
    }
    // Se já é uma URL completa, retorna
    if (filename.startsWith('http')) {
      return filename;
    }
    return `${BASE_IMAGE_URL}${filename}`;
  }, []);

  useEffect(() => {
    if (event) {
      const formattedDate = event.data_do_evento
        ? new Date(event.data_do_evento).toISOString().split("T")[0]
        : "";

      setCasaDoEvento(event.casa_do_evento || "");
      setNomeDoEvento(event.nome_do_evento || "");
      setDataDoEvento(formattedDate);
      setLocalDoEvento(event.local_do_evento || "");
      setCategoria(event.categoria || "");
      
      // Ajustes de tipo para garantir que os inputs funcionem
      setMesas(event.mesas !== null ? String(event.mesas) : "");
      setValorDaMesa(event.valor_da_mesa !== null ? String(event.valor_da_mesa) : "");
      setBrinde(event.brinde || "");
      setNumeroDeConvidados(event.numero_de_convidados !== null ? String(event.numero_de_convidados) : "");
      setDescricao(event.descricao || "");
      setValorDaEntrada(event.valor_da_entrada !== null ? String(event.valor_da_entrada) : "");
      setObservacao(event.observacao || "");

      // Define os estados de tipo de evento e dia da semana
      setTipoEvento(event.tipo_evento || "unico");
      setDiaDaSemana(event.dia_da_semana !== null ? String(event.dia_da_semana) : "");
      
      // Define os previews das imagens
      setImagemEventoPreview(getImageUrl(event.imagem_do_evento));
      setImagemComboPreview(getImageUrl(event.imagem_do_combo));
      
      setImagemDoEvento(null); // Limpa o arquivo recém-selecionado ao mudar de evento
      setImagemDoCombo(null); // Limpa o arquivo recém-selecionado ao mudar de evento
    }
  }, [event, getImageUrl]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const token = localStorage.getItem("authToken");
    if (!token || !API_URL) return null;

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
    if (!event) return;
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token não encontrado. Faça login novamente.");
      setIsLoading(false);
      return;
    }

    let imagemEventoFilename = event.imagem_do_evento;
    let imagemComboFilename = event.imagem_do_combo;

    // 1. Faz o upload da imagem do evento se um novo arquivo foi selecionado
    if (imagemDoEvento) {
      const filename = await uploadImage(imagemDoEvento);
      if (!filename) {
        setIsLoading(false);
        return;
      }
      imagemEventoFilename = filename;
    }

    // 2. Faz o upload da imagem do combo se um novo arquivo foi selecionado
    if (imagemDoCombo) {
      const filename = await uploadImage(imagemDoCombo);
      if (!filename) {
        setIsLoading(false);
        return;
      }
      imagemComboFilename = filename;
    }

    // 3. Monta o objeto de dados para a requisição PUT
    const eventData = {
      casa_do_evento: casaDoEvento,
      nome_do_evento: nomeDoEvento,
      hora_do_evento: horaDoEvento,
      local_do_evento: localDoEvento,
      categoria: categoria,
      mesas: mesas,
      valor_da_mesa: valorDaMesa,
      brinde: brinde,
      numero_de_convidados: numeroDeConvidados,
      descricao: descricao,
      valor_da_entrada: valorDaEntrada,
      observacao: observacao,
      tipo_evento: tipoEvento,
      data_do_evento: tipoEvento === 'unico' ? dataDoEvento : null,
      dia_da_semana: tipoEvento === 'semanal' ? diaDaSemana : null,
      imagem_do_evento: imagemEventoFilename,
      imagem_do_combo: imagemComboFilename,
    };

    // 4. Faz a requisição PUT para atualizar o evento
    try {
      const response = await fetch(`${API_URL}/api/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        setError(`Erro ao atualizar o evento: ${errorData.message || 'Erro desconhecido.'}`);
        setIsLoading(false);
        return;
      }

      alert("Evento atualizado com sucesso!");
      onRequestClose();
      onEventUpdated();
    } catch (err) {
      console.error("Erro ao atualizar evento:", err);
      setError("Ocorreu um erro ao atualizar o evento. Tente novamente.");
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
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Editar Evento" className="fixed inset-0 flex items-center justify-center p-4" overlayClassName="fixed inset-0 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Editar Evento</h2>
        {event && (
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input className="w-full p-2 border rounded" type="text" placeholder="Casa do evento" value={casaDoEvento} onChange={(e) => setCasaDoEvento(e.target.value)} required />
            <input className="w-full p-2 border rounded" type="text" placeholder="Nome do evento" value={nomeDoEvento} onChange={(e) => setNomeDoEvento(e.target.value)} required />

            <div className="col-span-2 border rounded p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento</label>
              <div className="flex items-center gap-x-6">
                <div className="flex items-center">
                  <input id="edit-tipo-unico" name="edit-tipo-evento" type="radio" value="unico" checked={tipoEvento === 'unico'} onChange={() => setTipoEvento('unico')} className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="edit-tipo-unico" className="ml-2 block text-sm font-medium text-gray-900">Evento Único</label>
                </div>
                <div className="flex items-center">
                  <input id="edit-tipo-semanal" name="edit-tipo-evento" type="radio" value="semanal" checked={tipoEvento === 'semanal'} onChange={() => setTipoEvento('semanal')} className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="edit-tipo-semanal" className="ml-2 block text-sm font-medium text-gray-900">Evento Semanal</label>
                </div>
              </div>
            </div>

            {tipoEvento === 'unico' ? (
              <input className="w-full p-2 border rounded" type="date" value={dataDoEvento} onChange={(e) => setDataDoEvento(e.target.value)} required />
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
                <input type="file" className="hidden" onChange={(e) => handleImageChange(e, setImagemDoEvento, setImagemEventoPreview)} />
                {imagemEventoPreview && (
                  <Image src={imagemEventoPreview} alt="Pré-visualização do evento" className="mt-2 h-24 w-auto rounded shadow" width={96} height={96} />
                )}
                {!imagemEventoPreview && <span className="text-xs text-gray-400">Selecione nova imagem</span>}
              </label>

              <label className="flex flex-col items-center border-2 border-dashed border-gray-300 p-4 rounded-lg cursor-pointer hover:border-blue-400 transition">
                <span className="text-sm font-semibold text-gray-500">Imagem do combo</span>
                <input type="file" className="hidden" onChange={(e) => handleImageChange(e, setImagemDoCombo, setImagemComboPreview)} />
                {imagemComboPreview && (
                  <Image src={imagemComboPreview} alt="Pré-visualização do combo" className="mt-2 h-24 w-auto rounded shadow" width={96} height={96} />
                )}
                {!imagemComboPreview && <span className="text-xs text-gray-400">Selecione nova imagem</span>}
              </label>
            </div>

            <textarea className="w-full p-2 border rounded col-span-2" placeholder="Observação" value={observacao} onChange={(e) => setObservacao(e.target.value)} />

            <button type="submit" disabled={isLoading} className="col-span-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:bg-gray-400">
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            {error && <p className="col-span-2 text-red-500 text-sm mt-2">{error}</p>}
          </form>
        )}
        <button onClick={onRequestClose} className="mt-4 w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition">Fechar</button>
      </div>
    </Modal>
  );
};

export default EditEvent;