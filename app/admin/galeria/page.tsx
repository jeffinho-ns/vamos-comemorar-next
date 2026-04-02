"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { MdDelete, MdEdit, MdLink, MdSwapHoriz, MdUpload } from "react-icons/md";
import ImageCropModal from "@/app/components/ImageCropModal";
import { uploadImage } from "@/app/services/uploadService";
import { WithPermission } from "@/app/components/WithPermission/WithPermission";

type GalleryImage = {
  imageId?: number | null;
  filename: string;
  url?: string | null;
  thumbUrl?: string | null;
  mediumUrl?: string | null;
  fullUrl?: string | null;
  sourceType?: string;
  imageType?: string;
  usageCount?: number;
};

const SUPER_ADMIN_EMAILS = ["teste@teste", "jeffinho_ns@hotmail.com"];

export default function AdminGaleriaPage() {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL_LOCAL ||
    "https://api.agilizaiapp.com.br";
  const API_BASE_URL = `${API_URL}/api/cardapio`;

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageTitle, setUsageTitle] = useState("");
  const [usageData, setUsageData] = useState<any>(null);
  const [replaceFrom, setReplaceFrom] = useState("");
  const [replaceTo, setReplaceTo] = useState("");

  // edição/manipulação (gera uma variação e faz upload)
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropFolder, setCropFolder] = useState<"cardapio/items" | "cardapio/bars">(
    "cardapio/items",
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return images;
    return images.filter((img) =>
      String(img.filename || "").toLowerCase().includes(q),
    );
  }, [images, search]);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/gallery/images`, { method: "GET" });
      if (!res.ok) throw new Error("Falha ao buscar imagens");
      const data = await res.json();
      setImages(Array.isArray(data.images) ? data.images : []);
    } catch (err) {
      console.error("Erro ao buscar imagens da galeria:", err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const openUsage = useCallback(
    async (value: string) => {
      setUsageOpen(true);
      setUsageLoading(true);
      setUsageTitle(value);
      setUsageData(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/gallery/usage/${encodeURIComponent(value)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Erro ao buscar uso");
        setUsageData(data);
      } catch (e) {
        console.error(e);
        setUsageData({ error: e instanceof Error ? e.message : "Erro" });
      } finally {
        setUsageLoading(false);
      }
    },
    [API_BASE_URL],
  );

  const runReplace = useCallback(async () => {
    const from = replaceFrom.trim();
    const to = replaceTo.trim();
    if (!from || !to) {
      alert("Preencha FROM e TO para substituir.");
      return;
    }
    if (
      !confirm(
        `Substituir referências?\n\nFROM: ${from}\nTO: ${to}\n\nIsso vai atualizar menu_items e bars no banco.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/gallery/replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erro ao substituir");
      alert(
        `Substituição concluída.\nAtualizações: ${JSON.stringify(data.updated)}`,
      );
      setReplaceFrom("");
      setReplaceTo("");
      await fetchImages();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Erro ao substituir");
    }
  }, [API_BASE_URL, fetchImages, replaceFrom, replaceTo]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const pickFile = useCallback(
    (folder: "cardapio/items" | "cardapio/bars") => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files?.[0]) return;
        const tempUrl = URL.createObjectURL(files[0]);
        setCropFolder(folder);
        setCropSrc(tempUrl);
        setCropOpen(true);
      };
      input.click();
    },
    [],
  );

  const createVariantFromUrl = useCallback(
    async (imageUrl: string | null | undefined) => {
      if (!imageUrl) return;
      try {
        setCropFolder("cardapio/items");
        // Evitar download duplicado via fetch()+blob().
        // O modal já carrega a imagem diretamente (com crossOrigin quando aplicável).
        setCropSrc(imageUrl);
        setCropOpen(true);
      } catch (err) {
        console.error("Erro ao carregar imagem para edição:", err);
        alert("Não foi possível abrir a imagem para edição.");
      }
    },
    [],
  );

  const handleCropComplete = useCallback(
    async (blob: Blob) => {
      setUploading(true);
      try {
        const file = new File([blob], "galeria.jpg", {
          type: blob.type || "image/jpeg",
        });
        await uploadImage(file, cropFolder);
        await fetchImages();
      } catch (err) {
        console.error("Erro ao enviar imagem:", err);
        alert("Erro ao enviar imagem.");
      } finally {
        setUploading(false);
      }
    },
    [cropFolder, fetchImages],
  );

  const handleDelete = useCallback(
    async (filename: string) => {
      if (
        !confirm(
          `Tem certeza que deseja deletar a imagem "${filename}"?\n\nIsso pode falhar se ela estiver sendo usada em algum lugar.`,
        )
      ) {
        return;
      }
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(
          `${API_BASE_URL}/gallery/images/${encodeURIComponent(filename)}`,
          {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || data?.error || "Erro ao deletar imagem");
        }
        await fetchImages();
      } catch (err) {
        console.error("Erro ao deletar imagem:", err);
        alert(err instanceof Error ? err.message : "Erro ao deletar imagem");
      }
    },
    [API_BASE_URL, fetchImages],
  );

  return (
    <WithPermission allowedRoles={["admin"]} allowedEmails={SUPER_ADMIN_EMAILS}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Galeria de Imagens</h1>
            <p className="text-sm text-gray-600">
              Upload, exclusão e criação de variações (crop/rotação/filtros).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => pickFile("cardapio/items")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              disabled={uploading}
            >
              <MdUpload size={20} />
              Upload (Itens)
            </button>
            <button
              onClick={() => pickFile("cardapio/bars")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              disabled={uploading}
            >
              <MdUpload size={20} />
              Upload (Bares)
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome do arquivo..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchImages}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-black text-white font-semibold"
            disabled={loading}
          >
            Atualizar
          </button>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <MdSwapHoriz size={20} />
            Substituir imagem (em massa)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={replaceFrom}
              onChange={(e) => setReplaceFrom(e.target.value)}
              placeholder="FROM (filename ou URL antiga)"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={replaceTo}
              onChange={(e) => setReplaceTo(e.target.value)}
              placeholder="TO (filename ou URL nova)"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={runReplace}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold"
              disabled={uploading}
            >
              Aplicar substituição
            </button>
          </div>
          <div className="text-xs text-gray-600">
            Dica: você pode colar uma URL do Firebase/Cloudinary ou apenas o filename/objectPath.
          </div>
        </div>

        {loading ? (
          <div className="text-gray-600">Carregando imagens...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-600">Nenhuma imagem encontrada.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((img) => {
              const url = img.url || "";
              return (
                <div
                  key={img.filename}
                  className="group border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
                >
                  <div className="relative aspect-square bg-gray-100">
                    {url ? (
                      <Image
                        src={url}
                        alt={img.filename}
                        fill
                        sizes="(max-width: 768px) 50vw, 16vw"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                        Sem preview
                      </div>
                    )}
                  </div>

                  <div className="p-2 space-y-2">
                    <div className="text-xs font-medium text-gray-800 truncate">
                      {img.filename}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openUsage(img.url || img.filename)}
                        className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold"
                        title="Ver onde está sendo usada"
                        disabled={uploading}
                      >
                        <MdLink size={16} />
                      </button>
                      <button
                        onClick={() => createVariantFromUrl(img.fullUrl || img.url)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold"
                        title="Criar variação (editar/manipular)"
                        disabled={!img.url || uploading}
                      >
                        <MdEdit size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(img.filename)}
                        className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                        title="Excluir"
                        disabled={uploading}
                      >
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {usageOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setUsageOpen(false)}
          >
            <div
              className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    Uso da imagem
                  </div>
                  <div className="text-xs text-gray-600 break-all">
                    {usageTitle}
                  </div>
                </div>
                <button
                  className="px-3 py-1 rounded-lg bg-gray-900 text-white font-semibold"
                  onClick={() => setUsageOpen(false)}
                >
                  Fechar
                </button>
              </div>

              {usageLoading ? (
                <div className="text-gray-700">Carregando...</div>
              ) : usageData?.error ? (
                <div className="text-red-600">{String(usageData.error)}</div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-700">
                    Total:{" "}
                    <b>
                      {usageData?.counts?.total ?? 0}
                    </b>{" "}
                    (itens: {usageData?.counts?.items ?? 0}, bares:{" "}
                    {usageData?.counts?.bars ?? 0})
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-gray-900">Itens</div>
                    <div className="max-h-56 overflow-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">ID</th>
                            <th className="text-left p-2">Item</th>
                            <th className="text-left p-2">Bar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(usageData?.matches?.items || []).map((row: any) => (
                            <tr key={row.id} className="border-t">
                              <td className="p-2">{row.id}</td>
                              <td className="p-2">{row.name}</td>
                              <td className="p-2">{row.barName || row.barId}</td>
                            </tr>
                          ))}
                          {(usageData?.matches?.items || []).length === 0 && (
                            <tr>
                              <td className="p-2 text-gray-500" colSpan={3}>
                                Nenhum item usando essa imagem.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-gray-900">Bares</div>
                    <div className="max-h-56 overflow-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">ID</th>
                            <th className="text-left p-2">Bar</th>
                            <th className="text-left p-2">Campos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(usageData?.matches?.bars || []).map((row: any) => (
                            <tr key={row.barId} className="border-t">
                              <td className="p-2">{row.barId}</td>
                              <td className="p-2">{row.barName}</td>
                              <td className="p-2">
                                {row.logoUrl ? "logo " : ""}
                                {row.coverImageUrl ? "capa " : ""}
                                {row.popupImageUrl ? "popup " : ""}
                              </td>
                            </tr>
                          ))}
                          {(usageData?.matches?.bars || []).length === 0 && (
                            <tr>
                              <td className="p-2 text-gray-500" colSpan={3}>
                                Nenhum bar usando essa imagem.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <ImageCropModal
          isOpen={cropOpen}
          imageSrc={cropSrc}
          onClose={() => {
            if (cropSrc?.startsWith("blob:")) {
              URL.revokeObjectURL(cropSrc);
            }
            setCropOpen(false);
            setCropSrc("");
          }}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      </div>
    </WithPermission>
  );
}

