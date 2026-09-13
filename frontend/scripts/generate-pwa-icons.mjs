// Gera os PNGs do ícone do PWA a partir de public/app-icon.svg.
// O SVG já foi desenhado full-bleed respeitando a "safe zone" de ícones
// maskable do Android, então os mesmos PNGs servem pra purpose "any" e
// "maskable" no manifest.
// Rodar com: node scripts/generate-pwa-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const srcSvg = path.join(dir, "..", "public", "app-icon.svg");
const outDir = path.join(dir, "..", "public");

const sizes = [192, 512];

for (const size of sizes) {
  const outPath = path.join(outDir, `icon-${size}.png`);
  await sharp(srcSvg).resize(size, size).png().toFile(outPath);
  console.log(`Gerado ${outPath}`);
}
