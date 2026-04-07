"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdDelete, MdEdit, MdLink, MdSwapHoriz, MdUpload } from "react-icons/md";
import ImageCropModal from "@/app/components/ImageCropModal";
import {
  getDownloadURLsForStoragePaths,
  listImagePathsFromStoragePrefix,
  uploadImage,
} from "@/app/services/uploadService";
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

/** Alinha paths como `cardapio/items/<arquivo>` para cruzar Firebase + API. */
function normalizeGalleryKey(value: string): string {
  if (!value) return "";
  let s = value.trim().split("?")[0];
  if (s.includes("firebasestorage.googleapis.com")) {
    const m = s.match(/\/o\/([^?]+)/);
    if (m) {
      try {
        s = decodeURIComponent(m[1]);
      } catch {
        s = m[1];
      }
    }
  }
  s = s.replace(/^\/+/, "");
  return s;
}

/** Pasta de upload ao usar “pasta exibida”: `cardapio` sozinho vira itens do cardápio. */
function uploadTargetForPrefix(prefix: string): string {
  if (prefix === "cardapio") return "cardapio/items";
  return prefix;
}

function buildApiProxyImageUrl(apiUrl: string, objectPath: string): string {
  const base = String(apiUrl || "").replace(/\/+$/, "");
  const cleanPath = String(objectPath || "").replace(/^\/+/, "");
  return `${base}/public/images/${encodeURIComponent(cleanPath)}`;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isFirebaseStorageUrl(value: string): boolean {
  return value.includes("firebasestorage.googleapis.com");
}

function pickGalleryPreviewUrl(
  apiUrl: string,
  storagePath: string,
  ...candidates: Array<string | null | undefined>
): string {
  for (const raw of candidates) {
    const value = String(raw || "").trim();
    if (!value) continue;
    // Prioriza URL direta recebida da API (inclui Firebase com alt=media).
    if (isHttpUrl(value)) return value;
  }

  return buildApiProxyImageUrl(apiUrl, storagePath);
}

function buildGalleryPreviewCandidates(
  apiUrl: string,
  storagePath: string,
  ...candidates: Array<string | null | undefined>
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (value?: string) => {
    const v = String(value || "").trim();
    if (!v || seen.has(v)) return;
    seen.add(v);
    out.push(v);
  };

  for (const raw of candidates) {
    const value = String(raw || "").trim();
    if (!value) continue;
    push(value);
  }

  // Só depois tenta proxy da API para reduzir 404 em lote.
  push(buildApiProxyImageUrl(apiUrl, storagePath));
  if (storagePath && !storagePath.includes("/")) {
    push(buildApiProxyImageUrl(apiUrl, `cardapio/items/${storagePath}`));
  }

  for (const raw of candidates) {
    const value = String(raw || "").trim();
    if (!value || !isFirebaseStorageUrl(value)) continue;
    const extracted = normalizeGalleryKey(value);
    if (extracted) push(buildApiProxyImageUrl(apiUrl, extracted));
  }

  return out;
}

const STORAGE_PREFIX_OPTIONS: { value: string; label: string }[] = [
  { value: "cardapio/items", label: "cardapio/items — itens do cardápio" },
  { value: "cardapio/bars", label: "cardapio/bars — bares" },
  { value: "cardapio", label: "cardapio/ — tudo (use subpastas)" },
  { value: "events", label: "events/" },
  { value: "users", label: "users/" },
  { value: "giro-certo", label: "giro-certo/" },
  { value: "migrations", label: "migrations/" },
  { value: "smoke-test", label: "smoke-test/" },
];

const PAGE_SIZE = 10;
const RECURSIVE_FAST_MAX_FILES = 300;

function readViewerEmailLower(): string {
  if (typeof document === "undefined") return "";
  const hit = document.cookie.split("; ").find((row) => row.startsWith("userEmail="));
  const raw = hit ? hit.split("=").slice(1).join("=").trim() : "";
  let decoded = raw;
  try {
    decoded = raw ? decodeURIComponent(raw) : "";
  } catch {
    decoded = raw;
  }
  if (decoded) return decoded.trim().toLowerCase();
  if (typeof window !== "undefined") {
    return (localStorage.getItem("userEmail") || "").trim().toLowerCase();
  }
  return "";
}

export default function AdminGaleriaPage() {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL_LOCAL ||
    "https://api.agilizaiapp.com.br";
  const API_BASE_URL = `${API_URL}/api/cardapio`;

  const [viewerEmail, setViewerEmail] = useState("");
  const canSeeAllStorageFolders = useMemo(
    () =>
      SUPER_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()).includes(viewerEmail),
    [viewerEmail],
  );
  const storagePrefixOptions = useMemo(() => {
    if (canSeeAllStorageFolders) return STORAGE_PREFIX_OPTIONS;
    return STORAGE_PREFIX_OPTIONS.filter((o) => o.value === "cardapio/items");
  }, [canSeeAllStorageFolders]);

  const [galleryRows, setGalleryRows] = useState<GalleryImage[]>([]);
  const [page, setPage] = useState(1);
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
  const [cropFolder, setCropFolder] = useState<string>("cardapio/items");
  const [storagePrefix, setStoragePrefix] = useState("cardapio/items");
  const [recursiveSubfolders, setRecursiveSubfolders] = useState(false);
  /** Evita loop de efeito se getDownloadURL falhar para sempre os mesmos paths. */
  const previewAttemptedRef = useRef<Set<string>>(new Set());
  const warnedStorageEnvRef = useRef(false);
  const [previewFailedPaths, setPreviewFailedPaths] = useState<Set<string>>(
    () => new Set(),
  );
  const hasFirebaseEnv =
    !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
    !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return galleryRows;
    return galleryRows.filter((img) =>
      String(img.filename || "").toLowerCase().includes(q),
    );
  }, [galleryRows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setViewerEmail(readViewerEmailLower());
  }, []);

  useEffect(() => {
    if (!canSeeAllStorageFolders && storagePrefix !== "cardapio/items") {
      setStoragePrefix("cardapio/items");
      setCropFolder("cardapio/items");
    }
  }, [canSeeAllStorageFolders, storagePrefix]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pageSlice = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => {
    const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const missing = slice
      .filter(
        (r) =>
          !r.url && !previewAttemptedRef.current.has(r.filename),
      )
      .map((r) => r.filename);
    if (missing.length === 0) return;

    for (const p of missing) previewAttemptedRef.current.add(p);

    let cancelled = false;
    (async () => {
      try {
        const resolved = await getDownloadURLsForStoragePaths(missing);
        if (cancelled) return;
        setGalleryRows((prev) => {
          let changed = false;
          const next = prev.map((row) => {
            const u = pickGalleryPreviewUrl(
              API_URL,
              row.filename,
              resolved[row.filename],
              row.url,
              row.thumbUrl,
              row.mediumUrl,
              row.fullUrl,
            );
            if (!u || row.url === u) return row;
            changed = true;
            return {
              ...row,
              url: u,
              thumbUrl: u,
              mediumUrl: u,
              fullUrl: u,
            };
          });
          return changed ? next : prev;
        });
        const failed = missing.filter((p) => !resolved[p]);
        if (failed.length > 0) {
          setPreviewFailedPaths(
            (prev) => new Set([...Array.from(prev), ...failed]),
          );
        }
      } catch (e) {
        console.error("Galeria: falha ao resolver URLs da página:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [API_URL, page, filtered]);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setPage(1);
    previewAttemptedRef.current = new Set();
    setPreviewFailedPaths(new Set());
    try {
      let paths: string[] = [];
      try {
        if (hasFirebaseEnv) {
          paths = await listImagePathsFromStoragePrefix(storagePrefix, {
            recursive: recursiveSubfolders,
            maxFiles: recursiveSubfolders ? RECURSIVE_FAST_MAX_FILES : undefined,
          });
        } else if (!warnedStorageEnvRef.current) {
          warnedStorageEnvRef.current = true;
          console.warn(
            "Galeria: variáveis NEXT_PUBLIC_FIREBASE_* ausentes no ambiente. Usando fallback via API.",
          );
        }
      } catch (firebaseErr) {
        if (!warnedStorageEnvRef.current) {
          warnedStorageEnvRef.current = true;
          console.warn(
            "Galeria: listagem no Firebase Storage falhou (regras/credenciais?). Tentando só API.",
            firebaseErr,
          );
        }
      }

      let apiImages: GalleryImage[] = [];
      const shouldLoadApiGallery =
        storagePrefix === "cardapio/items" ||
        storagePrefix === "cardapio/bars" ||
        storagePrefix === "cardapio";
      if (shouldLoadApiGallery) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/gallery/images?limit=2000`,
            { method: "GET" },
          );
          if (res.ok) {
            const data = await res.json();
            apiImages = Array.isArray(data.images) ? data.images : [];
          }
        } catch {
          /* silencioso: Firebase pode ser suficiente */
        }
      }

      const usageByPath = new Map<string, GalleryImage>();
      for (const img of apiImages) {
        const key = normalizeGalleryKey(img.filename || img.url || "");
        if (key) usageByPath.set(key, img);
      }

      if (paths.length > 0) {
        const merged: GalleryImage[] = paths.map((fullPath) => {
          const key = fullPath.replace(/^\/+/, "");
          const apiMatch = usageByPath.get(key);
          const apiUrl = pickGalleryPreviewUrl(
            API_URL,
            key,
            apiMatch?.url,
            apiMatch?.thumbUrl,
            apiMatch?.mediumUrl,
            apiMatch?.fullUrl,
          );
          return {
            filename: key,
            url: apiUrl,
            thumbUrl: apiUrl,
            mediumUrl: apiMatch?.mediumUrl || apiUrl,
            fullUrl: apiMatch?.fullUrl || apiUrl,
            imageId: apiMatch?.imageId ?? null,
            usageCount: apiMatch?.usageCount,
            sourceType: apiMatch?.sourceType ?? "firebase_storage",
            imageType: "item",
          };
        });
        merged.sort((a, b) =>
          String(a.filename).localeCompare(String(b.filename), undefined, {
            sensitivity: "base",
          }),
        );
        setGalleryRows(merged);
        return;
      }

      const fallbackRows = apiImages
        .map((img) => {
          const key = normalizeGalleryKey(String(img.filename || img.url || ""));
          if (!key) return null;
          const previewUrl = pickGalleryPreviewUrl(
            API_URL,
            key,
            img.url,
            img.thumbUrl,
            img.mediumUrl,
            img.fullUrl,
          );
          return {
            ...img,
            filename: key,
            url: previewUrl,
            thumbUrl: previewUrl,
            mediumUrl: img.mediumUrl || previewUrl,
            fullUrl: img.fullUrl || previewUrl,
          } as GalleryImage;
        })
        .filter((row): row is GalleryImage => !!row);
      setGalleryRows(fallbackRows);
    } catch (err) {
      console.error("Erro ao buscar imagens da galeria:", err);
      setGalleryRows([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, hasFirebaseEnv, storagePrefix, recursiveSubfolders]);

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

  const pickFile = useCallback((folder: string) => {
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
  }, []);

  const createVariantFromUrl = useCallback(
    async (imageUrl: string | null | undefined) => {
      if (!imageUrl) return;
      try {
        setCropFolder(uploadTargetForPrefix(storagePrefix));
        // Evitar download duplicado via fetch()+blob().
        // O modal já carrega a imagem diretamente (com crossOrigin quando aplicável).
        setCropSrc(imageUrl);
        setCropOpen(true);
      } catch (err) {
        console.error("Erro ao carregar imagem para edição:", err);
        alert("Não foi possível abrir a imagem para edição.");
      }
    },
    [storagePrefix],
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
              Liste por pasta do bucket (como no console) e, se quiser, inclua subpastas.
              Referências do banco entram na mesma grade quando existirem. Regras do Storage
              precisam permitir <span className="font-mono">list</span> em cada prefixo.
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
            <button
              onClick={() => pickFile(uploadTargetForPrefix(storagePrefix))}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              disabled={uploading}
              title={`Enviar para: ${uploadTargetForPrefix(storagePrefix)}`}
            >
              <MdUpload size={20} />
              Upload (pasta exibida)
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex flex-col gap-1 text-sm text-gray-700 sm:min-w-[280px]">
            <span className="font-semibold text-gray-900">Pasta no Storage</span>
            <select
              value={storagePrefix}
              onChange={(e) => setStoragePrefix(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {storagePrefixOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={recursiveSubfolders}
              onChange={(e) => setRecursiveSubfolders(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Incluir subpastas (varre toda a árvore abaixo do prefixo; limite ~2500 arquivos)
          </label>
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
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-700">
              <span>
                <b>{filtered.length}</b> arquivo(s) com filtro — página{" "}
                <b>{page}</b> de <b>{totalPages}</b> ({PAGE_SIZE} por página)
                {recursiveSubfolders && (
                  <> — limite rápido: primeiros {RECURSIVE_FAST_MAX_FILES}</>
                )}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pageSlice.map((img) => {
              const fallbackCandidates = buildGalleryPreviewCandidates(
                API_URL,
                img.filename,
                img.url,
                img.thumbUrl,
                img.mediumUrl,
                img.fullUrl,
              );
              const url = img.url || fallbackCandidates[0] || "";
              return (
                <div
                  key={img.filename}
                  className="group border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
                >
                  <div className="relative aspect-square bg-gray-100">
                    {url && !previewFailedPaths.has(img.filename) ? (
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        data-fallback-index="0"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => {
                          const imgEl = e.currentTarget;
                          const currentIndex = Number(
                            (imgEl?.dataset?.fallbackIndex as string | undefined) || "0",
                          );
                          const nextIndex = currentIndex + 1;
                          const next = fallbackCandidates[nextIndex];
                          if (next) {
                            if (imgEl) {
                              imgEl.dataset.fallbackIndex = String(nextIndex);
                              imgEl.src = next;
                            }
                            return;
                          }
                          setPreviewFailedPaths((prev) => new Set([...Array.from(prev), img.filename]));
                        }}
                      />
                    ) : previewFailedPaths.has(img.filename) ? (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-amber-700 text-center px-2">
                        Preview indisponível (regras, arquivo ou token). Path no Storage está listado.
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 text-center px-2">
                        Carregando preview…
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
          </>
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

