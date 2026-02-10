"use client";

import React, { useState, useEffect, useCallback } from "react";
import { EventData } from "../../types/types";
import Image from "next/image";
import Modal from "../ui/Modal";
import { MdSearch, MdUpload, MdDelete } from "react-icons/md";
import { uploadImage as uploadImageToFirebase } from "@/app/services/uploadService";

// Adicione a URL base do seu servidor de imagens
const BASE_IMAGE_URL = "https://grupoideiaum.com.br/cardapio-agilizaiapp/";

interface EditEventProps {
  isOpen: boolean;
  onRequestClose: () => void;
  event: EventData;
  onEventUpdated: () => void; // Adicionei um prop para notificar o componente pai
}

const EditEvent: React.FC<EditEventProps> = ({
  isOpen,
  onRequestClose,
  event,
  onEventUpdated,
}) => {
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
  const [imagemEventoPreview, setImagemEventoPreview] = useState<string | null>(
    null,
  );
  const [imagemComboPreview, setImagemComboPreview] = useState<string | null>(
    null,
  );
  const [imagemEventoFilename, setImagemEventoFilename] = useState<
    string | null
  >(null);
  const [imagemComboFilename, setImagemComboFilename] = useState<string | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [tipoEvento, setTipoEvento] = useState<"unico" | "semanal">("unico");
  const [diaDaSemana, setDiaDaSemana] = useState("");

  // Estados para galeria de imagens
  const [showImageGalleryModal, setShowImageGalleryModal] = useState(false);
  const [imageGalleryField, setImageGalleryField] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<
    Array<{
      filename: string;
      url?: string | null;
      sourceType: string;
      imageType: string;
      usageCount: number;
    }>
  >([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySearchTerm, setGallerySearchTerm] = useState("");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;
  const API_BASE_URL = `${API_URL}/api/cardapio`;

  // Função auxiliar para montar URL da imagem (para galeria)
  const getValidImageUrl = useCallback((filename: string): string => {
    if (!filename) return "";
    if (filename.startsWith("http://") || filename.startsWith("https://")) {
      return filename;
    }
    return `${BASE_IMAGE_URL}${filename}`;
  }, []);

  // Função auxiliar para montar a URL completa da imagem
  // Suporta URLs completas do Cloudinary e filenames legados do FTP
  const getImageUrl = useCallback(
    (
      imageValue: string | null | undefined,
      imageUrl?: string | null,
    ): string => {
      // Se temos uma URL completa já construída pela API, usar ela
      if (
        imageUrl &&
        (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
      ) {
        return imageUrl;
      }

      if (!imageValue) {
        return "https://via.placeholder.com/150";
      }

      const trimmed = String(imageValue).trim();
      if (!trimmed || trimmed === "null" || trimmed === "undefined") {
        return "https://via.placeholder.com/150";
      }

      // Se já é uma URL completa (Cloudinary, FTP ou outro serviço), usar diretamente
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }

      // Se ainda é apenas um filename (legado do FTP), construir URL do FTP
      return `${BASE_IMAGE_URL}${trimmed}`;
    },
    [],
  );

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
      setValorDaMesa(
        event.valor_da_mesa !== null ? String(event.valor_da_mesa) : "",
      );
      setBrinde(event.brinde || "");
      setNumeroDeConvidados(
        event.numero_de_convidados !== null
          ? String(event.numero_de_convidados)
          : "",
      );
      setDescricao(event.descricao || "");
      setValorDaEntrada(
        event.valor_da_entrada !== null ? String(event.valor_da_entrada) : "",
      );
      setObservacao(event.observacao || "");

      // Define os estados de tipo de evento e dia da semana
      setTipoEvento(event.tipo_evento || "unico");
      setDiaDaSemana(
        event.dia_da_semana !== null ? String(event.dia_da_semana) : "",
      );

      // Define os previews das imagens
      // Usar imagem_do_evento_url se disponível (URL completa do Cloudinary)
      setImagemEventoPreview(
        getImageUrl(event.imagem_do_evento, event.imagem_do_evento_url),
      );
      setImagemComboPreview(
        getImageUrl(event.imagem_do_combo, event.imagem_do_combo_url),
      );

      setImagemDoEvento(null); // Limpa o arquivo recém-selecionado ao mudar de evento
      setImagemDoCombo(null); // Limpa o arquivo recém-selecionado ao mudar de evento
      setImagemEventoFilename(null);
      setImagemComboFilename(null);
    }
  }, [event, getImageUrl]);

  // Função para buscar imagens da galeria
  const fetchGalleryImages = useCallback(async (): Promise<
    Array<{
      filename: string;
      url?: string | null;
      sourceType: string;
      imageType: string;
      usageCount: number;
    }>
  > => {
    if (!API_BASE_URL) return [];
    setGalleryLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/gallery/images`);
      if (response.ok) {
        const data = await response.json();
        const images = data.images || [];
        setGalleryImages(images);
        return images;
      } else {
        console.error("Erro ao buscar imagens da galeria");
        setGalleryImages([]);
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar imagens da galeria:", error);
      setGalleryImages([]);
      return [];
    } finally {
      setGalleryLoading(false);
    }
  }, [API_BASE_URL]);

  // Função para abrir galeria de imagens
  const openImageGallery = useCallback(
    (field: string) => {
      setImageGalleryField(field);
      setShowImageGalleryModal(true);
      fetchGalleryImages();
    },
    [fetchGalleryImages],
  );

  // Função para selecionar imagem da galeria
  const handleSelectGalleryImage = useCallback(
    (filename: string, imageUrl?: string | null) => {
      // A partir da migração para Firebase, sempre persistimos a URL completa.
      const imageValue = imageUrl || filename;
      const previewUrl = getValidImageUrl(imageValue);

      if (imageGalleryField === "imagem_do_evento") {
        setImagemDoEvento(null);
        setImagemEventoPreview(previewUrl);
        setImagemEventoFilename(imageValue);
      } else if (imageGalleryField === "imagem_do_combo") {
        setImagemDoCombo(null);
        setImagemComboPreview(previewUrl);
        setImagemComboFilename(imageValue);
      }

      setShowImageGalleryModal(false);
      setImageGalleryField("");
      setGallerySearchTerm("");
    },
    [imageGalleryField, getValidImageUrl],
  );

  // Função para deletar imagem da galeria
  const handleDeleteGalleryImage = useCallback(
    async (filename: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!confirm(`Tem certeza que deseja deletar a imagem "${filename}"?`)) {
        return;
      }

      if (!API_BASE_URL) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/gallery/images/${encodeURIComponent(filename)}`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          fetchGalleryImages();
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(
            errorData.message || errorData.error || "Erro ao deletar imagem.",
          );
        }
      } catch (err) {
        console.error("Erro ao deletar imagem:", err);
        alert("Erro ao deletar imagem. Tente novamente.");
      }
    },
    [API_BASE_URL, fetchGalleryImages],
  );

  const uploadImage = async (file: File): Promise<{ url: string } | null> => {
    try {
      const url = await uploadImageToFirebase(file, "events");
      return { url };
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      setError(
        `Erro no upload da imagem: ${error instanceof Error ? error.message : "Erro desconhecido."}`,
      );
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

    let finalImagemEventoFilename = event.imagem_do_evento;
    let finalImagemComboFilename = event.imagem_do_combo;

    // 1. Faz o upload da imagem do evento se um novo arquivo foi selecionado
    if (imagemDoEvento) {
      const uploadResult = await uploadImage(imagemDoEvento);
      if (!uploadResult) {
        setIsLoading(false);
        return;
      }
      finalImagemEventoFilename = uploadResult.url;
      // Atualiza o preview imediatamente com a URL pública do Firebase Storage
      setImagemEventoPreview(uploadResult.url);
      setImagemEventoFilename(uploadResult.url);
    } else if (imagemEventoFilename) {
      // Se foi selecionada da galeria, usar o filename armazenado
      finalImagemEventoFilename = imagemEventoFilename;
    }

    // 2. Faz o upload da imagem do combo se um novo arquivo foi selecionado
    if (imagemDoCombo) {
      const uploadResult = await uploadImage(imagemDoCombo);
      if (!uploadResult) {
        setIsLoading(false);
        return;
      }
      finalImagemComboFilename = uploadResult.url;
      // Atualiza o preview imediatamente com a URL pública do Firebase Storage
      setImagemComboPreview(uploadResult.url);
      setImagemComboFilename(uploadResult.url);
    } else if (imagemComboFilename) {
      // Se foi selecionada da galeria, usar o filename armazenado
      finalImagemComboFilename = imagemComboFilename;
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
      data_do_evento: tipoEvento === "unico" ? dataDoEvento : null,
      imagem_do_evento: finalImagemEventoFilename,
      imagem_do_combo: finalImagemComboFilename,
    };

    // 4. Faz a requisição PUT para atualizar o evento
    try {
      const response = await fetch(`${API_URL}/api/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        setError(
          `Erro ao atualizar o evento: ${errorData.message || "Erro desconhecido."}`,
        );
        setIsLoading(false);
        return;
      }

      // Captura a resposta com o evento atualizado (incluindo URLs completas)
      const responseData = await response.json();
      const updatedEvent = responseData.event;

      // Atualiza os previews com as URLs completas retornadas pela API
      // Usa getImageUrl para garantir que a URL seja construída corretamente
      if (updatedEvent) {
        setImagemEventoPreview(
          getImageUrl(
            updatedEvent.imagem_do_evento,
            updatedEvent.imagem_do_evento_url,
          ),
        );
        setImagemComboPreview(
          getImageUrl(
            updatedEvent.imagem_do_combo,
            updatedEvent.imagem_do_combo_url,
          ),
        );
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

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    setFilename?: React.Dispatch<React.SetStateAction<string | null>>,
  ) => {
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
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Editar Evento"
      className="fixed inset-0 flex items-center justify-center p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Editar Evento</h2>
        {event && (
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              className="w-full p-2 border rounded"
              type="text"
              placeholder="Casa do evento"
              value={casaDoEvento}
              onChange={(e) => setCasaDoEvento(e.target.value)}
              required
            />
            <input
              className="w-full p-2 border rounded"
              type="text"
              placeholder="Nome do evento"
              value={nomeDoEvento}
              onChange={(e) => setNomeDoEvento(e.target.value)}
              required
            />

            <div className="col-span-2 border rounded p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Evento
              </label>
              <div className="flex items-center gap-x-6">
                <div className="flex items-center">
                  <input
                    id="edit-tipo-unico"
                    name="edit-tipo-evento"
                    type="radio"
                    value="unico"
                    checked={tipoEvento === "unico"}
                    onChange={() => setTipoEvento("unico")}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="edit-tipo-unico"
                    className="ml-2 block text-sm font-medium text-gray-900"
                  >
                    Evento Único
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="edit-tipo-semanal"
                    name="edit-tipo-evento"
                    type="radio"
                    value="semanal"
                    checked={tipoEvento === "semanal"}
                    onChange={() => setTipoEvento("semanal")}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="edit-tipo-semanal"
                    className="ml-2 block text-sm font-medium text-gray-900"
                  >
                    Evento Semanal
                  </label>
                </div>
              </div>
            </div>

            {tipoEvento === "unico" ? (
              <input
                className="w-full p-2 border rounded"
                type="date"
                value={dataDoEvento}
                onChange={(e) => setDataDoEvento(e.target.value)}
                required
              />
            ) : (
              <select
                className="w-full p-2 border rounded"
                value={diaDaSemana}
                onChange={(e) => setDiaDaSemana(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione o dia da semana
                </option>
                <option value="0">Domingo</option>
                <option value="1">Segunda-feira</option>
                <option value="2">Terça-feira</option>
                <option value="3">Quarta-feira</option>
                <option value="4">Quinta-feira</option>
                <option value="5">Sexta-feira</option>
                <option value="6">Sábado</option>
              </select>
            )}

            <input
              className="w-full p-2 border rounded"
              type="time"
              placeholder="Hora do evento"
              value={horaDoEvento}
              onChange={(e) => setHoraDoEvento(e.target.value)}
              required
            />

            <input
              className="w-full p-2 border rounded"
              type="text"
              placeholder="Local do evento"
              value={localDoEvento}
              onChange={(e) => setLocalDoEvento(e.target.value)}
              required
            />
            <input
              className="w-full p-2 border rounded"
              type="text"
              placeholder="Categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
            />
            <input
              className="w-full p-2 border rounded"
              type="number"
              placeholder="Mesas"
              value={mesas}
              onChange={(e) => setMesas(e.target.value)}
            />
            <input
              className="w-full p-2 border rounded"
              type="number"
              placeholder="Valor da mesa"
              value={valorDaMesa}
              onChange={(e) => setValorDaMesa(e.target.value)}
              step="0.01"
            />
            <input
              className="w-full p-2 border rounded"
              type="text"
              placeholder="Brinde"
              value={brinde}
              onChange={(e) => setBrinde(e.target.value)}
            />
            <input
              className="w-full p-2 border rounded"
              type="number"
              placeholder="Número de convidados"
              value={numeroDeConvidados}
              onChange={(e) => setNumeroDeConvidados(e.target.value)}
            />
            <input
              className="w-full p-2 border rounded"
              type="number"
              placeholder="Valor da entrada"
              value={valorDaEntrada}
              onChange={(e) => setValorDaEntrada(e.target.value)}
              step="0.01"
              required
            />
            <textarea
              className="w-full p-2 border rounded col-span-2"
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex flex-col items-center border-2 border-dashed border-gray-300 p-4 rounded-lg cursor-pointer hover:border-blue-400 transition">
                  <span className="text-sm font-semibold text-gray-500">
                    Imagem do evento
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setImagemDoEvento,
                        setImagemEventoPreview,
                        setImagemEventoFilename,
                      )
                    }
                  />
                  {imagemEventoPreview && (
                    <Image
                      src={imagemEventoPreview}
                      alt="Pré-visualização do evento"
                      className="mt-2 h-24 w-auto rounded shadow"
                      width={96}
                      height={96}
                      unoptimized={true}
                    />
                  )}
                  {!imagemEventoPreview && (
                    <span className="text-xs text-gray-400">
                      Selecione nova imagem
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => openImageGallery("imagem_do_evento")}
                  className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-white text-sm hover:bg-green-700 transition-colors"
                >
                  <MdUpload className="h-4 w-4" />
                  Abrir Galeria
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex flex-col items-center border-2 border-dashed border-gray-300 p-4 rounded-lg cursor-pointer hover:border-blue-400 transition">
                  <span className="text-sm font-semibold text-gray-500">
                    Imagem do combo
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setImagemDoCombo,
                        setImagemComboPreview,
                        setImagemComboFilename,
                      )
                    }
                  />
                  {imagemComboPreview && (
                    <Image
                      src={imagemComboPreview}
                      alt="Pré-visualização do combo"
                      className="mt-2 h-24 w-auto rounded shadow"
                      width={96}
                      height={96}
                      unoptimized={true}
                    />
                  )}
                  {!imagemComboPreview && (
                    <span className="text-xs text-gray-400">
                      Selecione nova imagem
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => openImageGallery("imagem_do_combo")}
                  className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-white text-sm hover:bg-green-700 transition-colors"
                >
                  <MdUpload className="h-4 w-4" />
                  Abrir Galeria
                </button>
              </div>
            </div>

            <textarea
              className="w-full p-2 border rounded col-span-2"
              placeholder="Observação"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="col-span-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:bg-gray-400"
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </button>
            {error && (
              <p className="col-span-2 text-red-500 text-sm mt-2">{error}</p>
            )}
          </form>
        )}
        <button
          onClick={onRequestClose}
          className="mt-4 w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition"
        >
          Fechar
        </button>
      </div>

      {/* Modal da Galeria de Imagens */}
      <Modal
        isOpen={showImageGalleryModal}
        onRequestClose={() => {
          setShowImageGalleryModal(false);
          setImageGalleryField("");
          setGallerySearchTerm("");
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
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files[0]) {
                      const uploadResult = await uploadImage(files[0]);
                      if (uploadResult) {
                        // Selecionar automaticamente a imagem recém-enviada (URL Firebase)
                        handleSelectGalleryImage(
                          uploadResult.url,
                          uploadResult.url,
                        );
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
                {
                  galleryImages.filter(
                    (img) =>
                      !gallerySearchTerm ||
                      img.filename
                        .toLowerCase()
                        .includes(gallerySearchTerm.toLowerCase()),
                  ).length
                }{" "}
                imagem(s) encontrada(s)
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
                <p className="text-sm mt-1">
                  Faça upload de uma imagem para começar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {galleryImages
                  .filter(
                    (img) =>
                      !gallerySearchTerm ||
                      img.filename
                        .toLowerCase()
                        .includes(gallerySearchTerm.toLowerCase()),
                  )
                  .map((image, index) => {
                    const imageUrl =
                      image.url || getValidImageUrl(image.filename);
                    return (
                      <div
                        key={`${image.filename}-${index}`}
                        className="relative group cursor-pointer rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all overflow-hidden shadow-md hover:shadow-lg"
                        onClick={() =>
                          handleSelectGalleryImage(
                            image.filename,
                            image.url || undefined,
                          )
                        }
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
                              onClick={(e) =>
                                handleDeleteGalleryImage(image.filename, e)
                              }
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                              title="Deletar imagem"
                            >
                              <MdDelete className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-2">
                          <p className="truncate font-medium">
                            {image.filename}
                          </p>
                          {image.sourceType && (
                            <p className="text-xs text-gray-300 mt-0.5">
                              {image.sourceType === "menu_item"
                                ? "Item"
                                : "Bar"}{" "}
                              • {image.usageCount}x usado
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

export default EditEvent;
