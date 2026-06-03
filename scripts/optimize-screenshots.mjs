import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(__dirname, "../public/apresentacao");

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".png"));

for (const file of files) {
  const input = path.join(DIR, file);
  const out = path.join(DIR, file.replace(/\.png$/, ".webp"));
  const isMobile = file.includes("mobile");
  const maxWidth = isMobile ? 900 : 1600;

  const before = fs.statSync(input).size;
  await sharp(input)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(out);
  const after = fs.statSync(out).size;
  console.log(
    `${file} → ${path.basename(out)}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`,
  );
}
console.log("\n✅ Otimização concluída.");
