'use client';

import React, { useState, useEffect } from "react";
import { MdClose, MdCloudUpload, MdImage } from "react-icons/md";
import Modal from "../ui/Modal";
import { uploadImage as uploadImageToFirebase } from "@/app/services/uploadService";

interface Place {
  id?: string;
  slug?: string;
  name: string;
  email: string;
  description?: string;
  logo?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: string;
  longitude?: string;
  status?: "active" | "inactive";
  visible?: boolean;
  commodities?: Array<{ name: string; enabled: boolean }>;
  photos?: string[];
}

type Commodity = {
  name: string;
  enabled: boolean;
  icon?: string; // Propriedade opcional 'icon'
  description?: string; // Propriedade opcional 'description'
};

interface EditPlaceModalProps {
  isOpen: boolean;
  currentPlace: Place | null;
  onRequestClose: () => void;
  updatePlace: (place: Place) => void;
}


const commoditiesOptions = [
  { name: "Pet Friendly", icon: "🐶", description: "Aceita animais de estimação" },
  { name: "Área Aberta", icon: "🌳", description: "Possui área externa" },
  { name: "Acessível", icon: "♿", description: "Acessibilidade garantida" },
  { name: "Estacionamento", icon: "🚗", description: "Possui estacionamento" },
  { name: "+18", icon: "🍺", description: "Permitido apenas para maiores de 18 anos" },
  { name: "Mesas", icon: "🪑", description: "Possui mesas para os clientes" },
];

const EditPlaceModal: React.FC<EditPlaceModalProps> = ({
  isOpen,
  currentPlace,
  onRequestClose,
  updatePlace,
}) => {
  const [slug, setSlug] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [logo, setLogo] = useState<string>("");
  const [street, setStreet] = useState<string>("");
  const [number, setNumber] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [zipcode, setZipcode] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [visible, setVisible] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // States for commodities and photos
  const [commodities, setCommodities] = useState(commoditiesOptions.map(option => ({ ...option, enabled: false })));
  const [photos, setPhotos] = useState<(File | null)[]>(Array(10).fill(null));
  const [previewPhotos, setPreviewPhotos] = useState<string[]>(Array(10).fill(""));
  const [logoUrl, setLogoUrl] = useState<string | null>(currentPlace?.logo || "");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  useEffect(() => {
    if (currentPlace) {
      setSlug(currentPlace.slug || "");
      setName(currentPlace.name);
      setEmail(currentPlace.email);
      setDescription(currentPlace.description || "");
      setLogo(currentPlace.logo || "");
      setStreet(currentPlace.street || "");
      setNumber(currentPlace.number?.toString() || "");
      setNeighborhood(currentPlace.neighborhood || "");
      setCity(currentPlace.city || "");
      setState(currentPlace.state || "");
      setZipcode(currentPlace.zipcode || "");
      setLatitude(currentPlace.latitude?.toString() || "");
      setLongitude(currentPlace.longitude?.toString() || "");
      setStatus(currentPlace.status || "active");
      setVisible(currentPlace.visible !== undefined ? currentPlace.visible : true);
      setLogoUrl(currentPlace.logo || "");
  
      setCommodities(
        currentPlace.commodities?.map((commodity: Commodity) => ({
          ...commodity,
          icon: commodity.icon || "",
          description: commodity.description ?? "",
        })) || commoditiesOptions.map(option => ({ ...option, enabled: false }))
      );
  
      setPreviewPhotos(currentPlace.photos || Array(10).fill(""));
    }
  }, [currentPlace]);

  useEffect(() => {
    if (!isOpen || !currentPlace?.id) return;

    const fetchPlaceDetails = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/places/${currentPlace.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;

        const place = await response.json();
        setSlug(place.slug || "");
        setName(place.name || "");
        setEmail(place.email || "");
        setDescription(place.description || "");
        setLogo(place.logo || "");
        setStreet(place.street || "");
        setNumber(place.number?.toString() || "");
        setNeighborhood(place.neighborhood || "");
        setCity(place.city || "");
        setState(place.state || "");
        setZipcode(place.zipcode || "");
        setLatitude(place.latitude?.toString() || "");
        setLongitude(place.longitude?.toString() || "");
        setStatus(place.status || "active");
        setVisible(place.visible !== undefined ? place.visible : true);
        setLogoUrl(place.logo || "");

        if (Array.isArray(place.commodities) && place.commodities.length > 0) {
          setCommodities(
            place.commodities.map((commodity: Commodity) => ({
              ...commodity,
              icon: commodity.icon || "",
              description: commodity.description ?? "",
            })),
          );
        }

        setPreviewPhotos(
          Array.isArray(place.photos) && place.photos.length > 0
            ? [...place.photos, ...Array(Math.max(0, 10 - place.photos.length)).fill("")]
            : Array(10).fill(""),
        );
      } catch {
        // Mantém dados parciais do currentPlace em caso de falha
      }
    };

    fetchPlaceDetails();
  }, [isOpen, currentPlace?.id, API_URL]);
  

  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);

  const validateForm = () => {
    if (!name || !email) {
      setErrorMessage("Nome e e-mail são obrigatórios.");
      return false;
    }
    return true;
  };

  const handleCommodityChange = (index: number) => {
    const updatedCommodities = [...commodities];
    updatedCommodities[index].enabled = !updatedCommodities[index].enabled;
    setCommodities(updatedCommodities);
  };

  const handlePhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const updatedPhotos = [...photos];
      updatedPhotos[index] = file;
      setPhotos(updatedPhotos);

      const updatedPreviews = [...previewPhotos];
      updatedPreviews[index] = URL.createObjectURL(file);
      setPreviewPhotos(updatedPreviews);
    }
  };

  useEffect(() => {
    setSlug(name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, ""));
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      setErrorMessage("Token não encontrado. Faça login novamente.");
      return;
    }

    try {
      let imageUrl = logo;
      if (selectedFile) {
        imageUrl = await uploadImageToFirebase(selectedFile, "places/logo");
      } else if (logo && (logo.startsWith("data:") || logo.startsWith("blob:"))) {
        // Se ainda estiver em preview local e não houve upload, manter vazio para evitar persistir data/blob URL
        imageUrl = currentPlace?.logo || "";
      }

      const finalPhotoUrls: string[] = [];
      for (let i = 0; i < previewPhotos.length; i++) {
        const file = photos[i];
        if (file) {
          const url = await uploadImageToFirebase(file, "places/photos");
          finalPhotoUrls.push(url);
          continue;
        }
        const existing = previewPhotos[i];
        if (existing && !existing.startsWith("blob:")) {
          finalPhotoUrls.push(existing);
        }
      }

      const dataToSend: Place = {
        id: currentPlace?.id,
        slug,
        name,
        email,
        description,
        logo: imageUrl,
        street,
        number,
        neighborhood,
        city,
        state,
        zipcode,
        latitude,
        longitude,
        status,
        visible,
        commodities,
        photos: finalPhotoUrls,
      };

      const url = `${API_URL}/api/places/${currentPlace?.id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar o local");
      }

      const updatedPlace = await response.json();
      updatePlace(updatedPlace);
      onRequestClose();
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      setErrorMessage("Ocorreu um erro ao atualizar o local. Tente novamente.");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  const previewLogoSrc = (() => {
    if (logo && (logo.startsWith("data:") || logo.startsWith("blob:"))) return logo;
    if (!logoUrl) return "";
    return logoUrl.startsWith("http") ? logoUrl : `${API_URL}/uploads/${logoUrl}`;
  })();

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="mb-4 border-b border-gray-100 pb-2 text-base font-semibold text-gray-800">
      {children}
    </h3>
  );

  const renderCommoditiesSection = () => (
    <section>
      <SectionTitle>Comodidades</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {commodities.map((commodity, index) => (
          <label
            key={index}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              commodity.enabled
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <input
              type="checkbox"
              checked={commodity.enabled}
              onChange={() => handleCommodityChange(index)}
              className="hidden"
            />
            <span className="text-lg">{commodity.icon}</span>
            <span className="truncate">{commodity.name}</span>
          </label>
        ))}
      </div>
    </section>
  );

  const renderPhotosSection = () => (
    <section>
      <SectionTitle>Fotos</SectionTitle>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {photos.map((_, index) => (
          <label
            key={index}
            className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 transition hover:border-blue-400"
          >
            {previewPhotos[index] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewPhotos[index]}
                alt={`Foto ${index + 1}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <MdImage className="text-2xl text-gray-300 group-hover:text-blue-400" />
            )}
            <input
              type="file"
              onChange={(e) => handlePhotoChange(index, e)}
              accept="image/*"
              className="hidden"
            />
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400">Clique em um quadro para adicionar/trocar a foto.</p>
    </section>
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Editar Local"
      className="mx-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Editar Local</h2>
          <p className="text-sm text-gray-500">Atualize as informações do estabelecimento</p>
        </div>
        <button
          type="button"
          onClick={onRequestClose}
          className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Fechar"
        >
          <MdClose size={22} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <section>
            <SectionTitle>Informações básicas</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>E-mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </section>

          <section>
            <SectionTitle>Endereço</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label className={labelClass}>Rua</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Número</label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-3">
                <label className={labelClass}>Bairro</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Cidade</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-1">
                <label className={labelClass}>Estado</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>CEP</label>
                <input
                  type="text"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Latitude</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Longitude</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section>
            <SectionTitle>Logo</SectionTitle>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {previewLogoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewLogoSrc} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <MdImage className="text-2xl text-gray-300" />
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                <MdCloudUpload className="text-lg" />
                Escolher imagem
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  accept="image/*"
                  className="hidden"
                />
              </label>
            </div>
          </section>

          {renderCommoditiesSection()}
          {renderPhotosSection()}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onRequestClose}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Atualizar Local
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditPlaceModal;