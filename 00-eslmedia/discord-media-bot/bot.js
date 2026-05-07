import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const stateDir = path.join(__dirname, "data");
const statePath = path.join(stateDir, "announced-articles.json");

loadEnv(path.join(__dirname, ".env"));

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const ROLE_ID = process.env.DISCORD_ROLE_ID || "";
const SOURCE = process.env.MEDIA_ARTICLES_SOURCE || "../content/media-articles.js";
const ARTICLE_BASE_URL = process.env.ARTICLE_BASE_URL || "https://eurosuperleague.github.io/index/00-eslmedia/content/";
const CHECK_INTERVAL_MS = Number(process.env.CHECK_INTERVAL_MS || 300000);

const mode = process.argv.includes("--once") ? "once" : "watch";

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID. Add them to discord-media-bot/.env.");
  process.exit(1);
}

async function main() {
  await checkForNewArticles();

  if (mode === "watch") {
    console.log(`Watching for new ESL Media articles every ${CHECK_INTERVAL_MS}ms...`);
    setInterval(() => {
      checkForNewArticles().catch((error) => {
        console.error("Watcher check failed:", error);
      });
    }, CHECK_INTERVAL_MS);
  }
}

async function checkForNewArticles() {
  const articles = loadArticles(resolveSourcePath(SOURCE));
  const announced = loadState();

  const freshArticles = articles
    .filter((article) => !announced.includes(article.file))
    .sort((a, b) => (a.sortKey || "").localeCompare(b.sortKey || ""));

  if (!freshArticles.length) {
    console.log("No new articles to announce.");
    return;
  }

  for (const article of freshArticles) {
    await sendArticleAnnouncement(article);
    announced.push(article.file);
  }

  saveState(announced);
  console.log(`Announced ${freshArticles.length} new article(s).`);
}

function resolveSourcePath(source) {
  return path.isAbsolute(source) ? source : path.resolve(__dirname, source);
}

function loadArticles(sourcePath) {
  const source = fs.readFileSync(sourcePath, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: sourcePath });
  const articles = context.window?.ESL_MEDIA_ARTICLES;

  if (!Array.isArray(articles)) {
    throw new Error("Could not parse ESL_MEDIA_ARTICLES from media manifest.");
  }

  return articles;
}

function loadState() {
  ensureStateDir();

  if (!fs.existsSync(statePath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveState(announced) {
  ensureStateDir();
  fs.writeFileSync(statePath, JSON.stringify(announced, null, 2));
}

function ensureStateDir() {
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
}

async function sendArticleAnnouncement(article) {
  const url = new URL(article.file, ARTICLE_BASE_URL).toString();
  const roleMention = ROLE_ID ? `<@&${ROLE_ID}> ` : "";

  const payload = {
    content: `${roleMention}New ESL Media article just dropped.`,
    embeds: [
      {
        title: article.title,
        url,
        description: article.blurb,
        color: 0x111b36,
        fields: [
          { name: "Desk", value: article.desk || article.category || "Media", inline: true },
          { name: "Writer", value: article.author || "ESL Media", inline: true },
          { name: "Tag", value: article.tag || "Feature", inline: true }
        ],
        footer: {
          text: "European Super League Media"
        }
      }
    ]
  };

  const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord API error ${response.status}: ${body}`);
  }
}

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const idx = line.indexOf("=");
    if (idx === -1) {
      continue;
    }

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
