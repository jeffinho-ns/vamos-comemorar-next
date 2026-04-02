import { NextRequest, NextResponse } from "next/server";

const BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "agilizaiapp-img.firebasestorage.app";

/**
 * Caminhos permitidos no proxy: qualquer object path “normal” no bucket
 * (a listagem admin inclui todas as pastas; a origem continua a ser o teu Firebase).
 * Bloqueia só path traversal e tamanhos absurdos.
 */
function isAllowedObjectPath(path: string): boolean {
  const p = path.replace(/^\/+/, "");
  if (!p || p.length > 2048) return false;
  if (p.includes("..")) return false;
  return true;
}

function firebasePublicUrl(objectPath: string): string {
  const enc = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${enc}?alt=media`;
}

/**
 * Proxy leve com cache: mesma origem, objeto no Firebase inalterado.
 * Ative URLs desta rota com NEXT_PUBLIC_IMAGE_DELIVERY=app_proxy em apiImageProxy.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return new NextResponse(null, { status: 404 });
  }
  const objectPath = segments.join("/");
  if (!isAllowedObjectPath(objectPath)) {
    return new NextResponse(null, { status: 404 });
  }

  if (process.env.MEDIA_PROXY_REQUIRE_REFERER === "1") {
    const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
    const ref = req.headers.get("referer") || "";
    if (site && !ref.startsWith(site) && !ref.startsWith("http://localhost")) {
      return new NextResponse(null, { status: 403 });
    }
  }

  const upstream = firebasePublicUrl(objectPath);
  let res: Response;
  try {
    res = await fetch(upstream, {
      next: { revalidate: 3600 },
      headers: { Accept: "image/*,*/*" },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }

  if (!res.ok) {
    return new NextResponse(null, {
      status: res.status === 403 ? 403 : 404,
    });
  }

  const blob = await res.blob();
  const ct =
    res.headers.get("Content-Type") || "application/octet-stream";

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": ct,
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
