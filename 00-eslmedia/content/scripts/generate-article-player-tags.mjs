import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");

const playersPath = path.join(root, "00-build/database/players.json");
const articlesDir = path.join(root, "00-eslmedia/content/articles");
const outPath = path.join(root, "00-eslmedia/content/article-player-tags.generated.json");

const players = JSON.parse(fs.readFileSync(playersPath, "utf8"));
const names = [...new Set(players.map((p) => p.name).filter(Boolean))].sort(
  (a, b) => b.length - a.length
);

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function findPlayers(hay) {
  const found = new Set();
  for (const name of names) {
    if (hay.includes(name.toLowerCase())) found.add(name);
  }
  return [...found].sort((a, b) => a.localeCompare(b));
}

const out = [];
for (const f of fs.readdirSync(articlesDir).filter((x) => x.endsWith(".html")).sort()) {
  const raw = fs.readFileSync(path.join(articlesDir, f), "utf8");
  const hay = stripHtml(raw);
  const playerTags = findPlayers(hay);
  out.push({ file: `articles/${f}`, count: playerTags.length, playerTags });
}

fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log("wrote", outPath, "entries", out.length);
