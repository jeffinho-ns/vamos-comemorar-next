import React, { useState } from "react";
import Image from "next/image";
import Modal from "react-modal";

interface AddEventProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const AddEvent: React.FC<AddEventProps> = ({ isOpen, onRequestClose }) => {
  // Estados existentes
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
  
  // --- NOVOS ESTADOS ---
  const [tipoEvento, setTipoEvento] = useState<'unico' | 'semanal'>('unico');
  const [diaDaSemana, setDiaDaSemana] = useState(''); // 0-6 (Domingo-Sábado)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- LÓGICA DE ENVIO ATUALIZADA ---
    const formData = new FormData();
    formData.append("casa_do_evento", casaDoEvento);
    formData.append("nome_do_evento", nomeDoEvento);
    formData.append("hora_do_evento", horaDoEvento);
    formData.append("local_do_evento", localDoEvento);
    formData.append("categoria", categoria);
    formData.append("mesas", mesas);
    formData.append("valor_da_mesa", valorDaMesa);
    formData.append("brinde", brinde);
    formData.append("numero_de_convidados", numeroDeConvidados);
    formData.append("descricao", descricao);
    formData.append("valor_da_entrada", valorDaEntrada);
    formData.append("observacao", observacao);
    
    // Adiciona os novos campos e os campos condicionais
    formData.append("tipo_evento", tipoEvento);
    if (tipoEvento === 'unico') {
      formData.append("data_do_evento", dataDoEvento);
    } else {
      formData.append("dia_da_semana", diaDaSemana);
    }

    if (imagemDoEvento) formData.append("imagem_do_evento", imagemDoEvento);
    if (imagemDoCombo) formData.append("imagem_do_combo", imagemDoCombo);

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar evento");
      }

      onRequestClose(); // Idealmente, você também deve limpar o formulário aqui
    } catch (err) {
      console.error("Erro ao adicionar evento:", err);
      setError("Ocorreu um erro ao adicionar o evento. Verifique se todos os campos estão corretos.");
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
          <input className="w-full p-2 border rounded" type="text" placeholder="Casa do evento" value={casaDoEvento} onChange={(e) => setCasaDoEvento(e.target.value)} required />
          <input className="w-full p-2 border rounded" type="text" placeholder="Nome do evento" value={nomeDoEvento} onChange={(e) => setNomeDoEvento(e.target.value)} required />

          {/* --- SELETOR DE TIPO DE EVENTO --- */}
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
          
          {/* --- CAMPOS CONDICIONAIS --- */}
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

          {/* Upload de imagem com pré-visualização */}
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

          <button type="submit" className="col-span-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition">Adicionar Evento</button>
          {error && <p className="col-span-2 text-red-500 text-sm mt-2">{error}</p>}
        </form>
        <button onClick={onRequestClose} className="mt-4 w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition">Fechar</button>
      </div>
    </Modal>
  );
};

export default AddEvent;