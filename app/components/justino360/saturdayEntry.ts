export type DraftSale = {
  key: string;
  name: string;
  code: string;
  amount: string;
  fee: string;
  people: string;
};

export const FIELD =
  "mt-1 min-h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-base text-white outline-none placeholder:text-zinc-500 [color-scheme:dark]";
export const GOLD =
  "min-h-12 w-full rounded-full bg-[#e2b657] px-4 text-base font-bold text-black disabled:opacity-40";
export const CARD = "rounded-3xl border border-white/10 bg-[#121214] p-4";

export function brl(value: number | null | undefined) {
  return (Number(value) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function parseMoney(value: string) {
  const raw = value.trim();
  if (!raw) return null;
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(number * 100) / 100;
}

export function parseCount(value: string) {
  const raw = value.trim();
  if (!raw) return null;
  const number = Number(raw.replace(/\./g, ""));
  if (!Number.isInteger(number) || number < 0) return null;
  return number;
}

export function moneyText(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return "";
  return Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function upcomingSaturday() {
  const now = new Date();
  const day = now.getDay();
  const add = day === 6 ? 0 : (6 - day + 7) % 7;
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + add);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayText = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${dayText}`;
}

export function blankSale(): DraftSale {
  return { key: `${Date.now()}-${Math.random()}`, name: "", code: "", amount: "", fee: "", people: "" };
}
