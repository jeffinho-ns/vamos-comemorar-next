/**
 * Captura prints reais de cada área do sistema para a página /apresentacao.
 * Uso: node scripts/capture-screenshots.mjs
 *
 * Requer o dev server rodando (BASE_URL) e credenciais de admin.
 */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public/apresentacao");

const BASE_URL = process.env.CAPTURE_BASE_URL || "http://localhost:3001";
const LOGIN = process.env.CAPTURE_EMAIL || "teste@teste";
const PASS = process.env.CAPTURE_PASS || "1234";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** Telas autenticadas (admin). */
const ADMIN_SHOTS = [
  { id: "dashboard", url: "/admin" },
  { id: "reservas", url: "/admin/restaurant-reservations" },
  { id: "cardapio", url: "/admin/cardapio" },
  { id: "checkins", url: "/admin/checkins" },
  { id: "qrcode", url: "/admin/qrcode" },
  { id: "eventos", url: "/admin/eventos/dashboard" },
  { id: "listas", url: "/admin/eventos/listas" },
  { id: "promoters", url: "/admin/eventos/promoters" },
  { id: "whatsapp", url: "/admin/whatsapp" },
  { id: "galeria", url: "/admin/galeria" },
  { id: "brindes", url: "/admin/gifts" },
  { id: "funcionamento", url: "/admin/workdays" },
  { id: "permissoes", url: "/admin/permissions" },
  { id: "commodities", url: "/admin/commodities" },
  { id: "users", url: "/admin/users" },
];

/** Páginas públicas. */
const PUBLIC_SHOTS = [
  { id: "home", url: "/" },
  { id: "aniversario", url: "/decoracao-aniversario" },
  { id: "como-funciona", url: "/como-funciona" },
];

/** Telas mobile (webapp / app). */
const MOBILE_SHOTS = [
  { id: "webapp", url: "/webapp" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HIDE_DEVTOOLS_CSS = `
  nextjs-portal { display: none !important; }
  #__next-build-watcher { display: none !important; }
  [data-nextjs-toast] { display: none !important; }
`;

async function settle(page, ms = 3000) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch {
    /* segue mesmo se a rede não estabilizar (sockets/polling) */
  }
  // Espera o indicador "Carregando..." desaparecer (quando houver)
  try {
    await page.waitForFunction(
      () => !/carregando\.\.\./i.test(document.body?.innerText || ""),
      { timeout: 12000 },
    );
  } catch {
    /* mantém o que tiver */
  }
  await sleep(ms);
  await page.addStyleTag({ content: HIDE_DEVTOOLS_CSS }).catch(() => {});
}

async function shoot(page, id, suffix = "") {
  const file = path.join(OUT_DIR, `${id}${suffix}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${id}${suffix}.png`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });
  const context = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2,
    locale: "pt-BR",
    permissions: ["camera", "geolocation"],
  });
  await context.addInitScript((css) => {
    const apply = () => {
      const style = document.createElement("style");
      style.textContent = css;
      document.documentElement.appendChild(style);
    };
    if (document.documentElement) apply();
    else document.addEventListener("DOMContentLoaded", apply);
  }, HIDE_DEVTOOLS_CSS);
  const page = await context.newPage();

  // ---- LOGIN (via API, igual handleLogin do app) ----
  console.log("→ Fazendo login via API...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.agilizaiapp.com.br";
  const auth = await page.evaluate(
    async ({ apiUrl, access, password }) => {
      const res = await fetch(`${apiUrl}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        return { ok: false, status: res.status, message: data?.message || "sem token" };
      }
      const email = access.includes("@") ? access.toLowerCase().trim() : "";
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("role", data.role);
      if (data.nome) localStorage.setItem("userName", data.nome);
      if (email) localStorage.setItem("userEmail", email);
      if (data.promoterCodigo) localStorage.setItem("promoterCodigo", data.promoterCodigo);

      document.cookie = `authToken=${data.token}; path=/`;
      document.cookie = `role=${data.role}; path=/`;
      if (email) document.cookie = `userEmail=${encodeURIComponent(email)}; path=/`;
      if (data.promoterCodigo)
        document.cookie = `promoterCodigo=${encodeURIComponent(data.promoterCodigo)}; path=/`;

      return { ok: true, role: data.role, email };
    },
    { apiUrl: API_URL, access: LOGIN, password: PASS },
  );

  if (!auth.ok) {
    throw new Error(`Login falhou (${auth.status}): ${auth.message}`);
  }
  console.log(`  ✓ autenticado como ${auth.email} (role: ${auth.role})`);

  // ---- ADMIN ----
  console.log("→ Capturando telas administrativas...");
  for (const shot of ADMIN_SHOTS) {
    try {
      await page.goto(`${BASE_URL}${shot.url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await settle(page);
      // fecha o menu lateral mobile caso esteja aberto (não deve em desktop)
      await shoot(page, shot.id);
    } catch (e) {
      console.warn(`  ✗ ${shot.id}: ${e.message}`);
    }
  }

  // ---- PÚBLICAS ----
  console.log("→ Capturando páginas públicas...");
  for (const shot of PUBLIC_SHOTS) {
    try {
      await page.goto(`${BASE_URL}${shot.url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await settle(page);
      await shoot(page, shot.id);
    } catch (e) {
      console.warn(`  ✗ ${shot.id}: ${e.message}`);
    }
  }

  // ---- MOBILE ----
  console.log("→ Capturando telas mobile...");
  const mobileCtx = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: "pt-BR",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  await mobileCtx.addInitScript((css) => {
    const apply = () => {
      const style = document.createElement("style");
      style.textContent = css;
      document.documentElement.appendChild(style);
    };
    if (document.documentElement) apply();
    else document.addEventListener("DOMContentLoaded", apply);
  }, HIDE_DEVTOOLS_CSS);
  // replica cookies de sessão
  const cookies = await context.cookies();
  await mobileCtx.addCookies(cookies);
  const mPage = await mobileCtx.newPage();
  for (const shot of MOBILE_SHOTS) {
    try {
      await mPage.goto(`${BASE_URL}${shot.url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await settle(mPage);
      await shoot(mPage, shot.id, "-mobile");
    } catch (e) {
      console.warn(`  ✗ ${shot.id} (mobile): ${e.message}`);
    }
  }

  await browser.close();
  console.log("\n✅ Capturas concluídas em public/apresentacao/");
}

main().catch((e) => {
  console.error("Erro fatal:", e);
  process.exit(1);
});
