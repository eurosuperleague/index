import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const outputDir = path.resolve(cwd, process.argv[2] ?? "modernized");
const skipDirs = new Set([".git", "node_modules", path.basename(outputDir)]);
const textExtensions = new Set([".htm", ".html"]);

const SHARED_CSS = `:root {
  color-scheme: light;
  --bg: #eef3f8;
  --bg-accent: radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 14%, white) 0%, rgba(255, 255, 255, 0) 35%), linear-gradient(180deg, #f9fbfd 0%, #eef3f8 100%);
  --surface: rgba(255, 255, 255, 0.88);
  --surface-strong: rgba(255, 255, 255, 0.97);
  --border: rgba(15, 23, 42, 0.08);
  --text: #152033;
  --muted: #5b667a;
  --shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  --accent: #2f6fed;
  --accent-contrast: #ffffff;
  --table-row: rgba(255, 255, 255, 0.82);
  --table-row-alt: rgba(238, 243, 248, 0.98);
  --header-bg: color-mix(in srgb, var(--accent) 86%, #08101d);
  --header-text: #ffffff;
  --radius: 22px;
  --page-width: 1440px;
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--text);
  background: var(--bg-accent);
}

a {
  color: color-mix(in srgb, var(--accent) 84%, #0a1020);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

img {
  max-width: 100%;
  height: auto;
}

.site-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
}

.site-nav {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 28px 20px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 20%, #0f172a) 0%, #101827 100%);
  color: rgba(255, 255, 255, 0.92);
  box-shadow: 18px 0 40px rgba(15, 23, 42, 0.18);
}

.brand {
  margin-bottom: 24px;
}

.brand h1 {
  margin: 0;
  font-size: 1.7rem;
  letter-spacing: 0.02em;
}

.brand p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.5;
}

.nav-list {
  display: grid;
  gap: 10px;
}

.nav-link {
  display: block;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  color: inherit;
  background: rgba(255, 255, 255, 0.04);
  transition: transform 120ms ease, background-color 120ms ease, border-color 120ms ease;
}

.nav-link:hover,
.nav-link.is-active {
  text-decoration: none;
  transform: translateX(2px);
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.18);
}

.site-main {
  padding: 28px;
}

.frame-card,
.page-card {
  width: min(100%, var(--page-width));
  margin: 0 auto;
  background: var(--surface);
  backdrop-filter: blur(18px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.frame-toolbar,
.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.76);
}

.toolbar-copy h2,
.toolbar-copy h1 {
  margin: 0;
  font-size: 1.25rem;
}

.toolbar-copy p {
  margin: 6px 0 0;
  color: var(--muted);
}

.frame-window {
  width: 100%;
  min-height: calc(100vh - 140px);
  border: 0;
  background: transparent;
}

.page-body {
  padding: 24px;
}

.page-body > *:first-child {
  margin-top: 0;
}

.page-body > *:last-child {
  margin-bottom: 0;
}

.legacy-table {
  width: 100% !important;
  max-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 0 0 18px;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--surface-strong);
}

.legacy-table td,
.legacy-table th {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  vertical-align: middle;
}

.legacy-table tr:last-child td {
  border-bottom: 0;
}

td.header,
td.plainheader,
td.headerbg,
td.teamheader,
td.teamheader2 {
  background: var(--header-bg) !important;
  color: var(--header-text) !important;
}

td.main,
td.newheader,
td.tableheader {
  color: var(--text);
}

td.newheader,
td.teamheader,
td.plainheader {
  font-size: clamp(1.5rem, 2vw, 2.15rem) !important;
  letter-spacing: 0.01em;
}

td.tableheader {
  font-size: 1.1rem !important;
}

tr.row1,
tr.row1 td {
  background: var(--table-row);
}

tr.row2,
tr.row2 td {
  background: var(--table-row-alt);
}

tr.teamcolor,
tr.teamcolor td {
  background: var(--header-bg) !important;
  color: var(--header-text) !important;
}

hr {
  border: 0;
  border-top: 1px solid rgba(15, 23, 42, 0.1);
  margin: 16px 0 22px;
}

.menu-toggle {
  display: none;
}

.menu-page .nav-list {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.menu-page .nav-link {
  color: var(--text);
  background: rgba(255, 255, 255, 0.74);
  border-color: var(--border);
}

@media (max-width: 1080px) {
  .site-shell {
    grid-template-columns: 1fr;
  }

  .site-nav {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(320px, 88vw);
    transform: translateX(-100%);
    transition: transform 160ms ease;
    z-index: 20;
  }

  body.nav-open .site-nav {
    transform: translateX(0);
  }

  .menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.92);
    color: var(--text);
    cursor: pointer;
  }

  .site-main {
    padding: 18px;
  }

  .page-body {
    padding: 16px;
  }
}
`;

const SHELL_JS = `const iframe = document.querySelector("[data-frame]");
const links = [...document.querySelectorAll("[data-link]")];
const toggle = document.querySelector("[data-menu-toggle]");
const closeNav = () => document.body.classList.remove("nav-open");

if (toggle) {
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });
}

const setActive = (href) => {
  links.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === href);
  });
};

const loadPage = (href, pushHash = true) => {
  if (!iframe || !href) return;
  iframe.src = href;
  setActive(href);
  if (pushHash) {
    history.replaceState(null, "", "#" + href);
  }
  closeNav();
};

links.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    loadPage(link.getAttribute("href"));
  });
});

iframe?.addEventListener("load", () => {
  const current = iframe.getAttribute("src");
  setActive(current);
});

const initial = location.hash ? location.hash.slice(1) : iframe?.getAttribute("src");
if (initial) {
  loadPage(initial, false);
}
`;

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const menuLinks = await extractMenuLinks();
await writeSharedAssets();
await convertTree(cwd);

console.log(`Modernized site written to ${outputDir}`);

async function convertTree(sourceDir) {
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (skipDirs.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const outputPath = path.join(outputDir, path.relative(cwd, sourcePath));

    if (entry.isDirectory()) {
      if (entry.name === "images") {
        await cp(sourcePath, outputPath, { recursive: true });
        continue;
      }

      await mkdir(outputPath, { recursive: true });
      await convertTree(sourcePath);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (textExtensions.has(extension)) {
      const original = await readFile(sourcePath, "utf8");
      const converted = convertPage({
        original,
        relativePath: path.relative(cwd, sourcePath).replace(/\\/g, "/"),
        menuLinks,
      });
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, converted, "utf8");
      continue;
    }

    await mkdir(path.dirname(outputPath), { recursive: true });
    await cp(sourcePath, outputPath);
  }
}

function convertPage({ original, relativePath, menuLinks }) {
  const normalized = original.replace(/\r\n/g, "\n");
  const title = decodeEntities(extractTitle(normalized) || "League Export");
  const accent = extractAccent(normalized);
  const assetPrefix = depthPrefix(relativePath);

  if (path.basename(relativePath).toLowerCase() === "index.htm") {
    return renderShellPage({ title, accent, assetPrefix, menuLinks });
  }

  if (path.basename(relativePath).toLowerCase() === "menu.htm") {
    return renderMenuPage({ title: "League Navigation", accent, assetPrefix, menuLinks });
  }

  const bodyHtml = extractBody(normalized);
  const modernBody = modernizeBody(bodyHtml);
  return renderContentPage({
    title,
    accent,
    assetPrefix,
    bodyHtml: modernBody,
  });
}

function renderShellPage({ title, accent, assetPrefix, menuLinks }) {
  const navHtml = renderNavLinks(menuLinks);
  const initialPage = menuLinks[0]?.href ?? "standings.htm";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${assetPrefix}_modern/style.css">
  <style>:root { --accent: ${accent}; }</style>
</head>
<body>
  <div class="site-shell">
    <aside class="site-nav">
      <div class="brand">
        <h1>${escapeHtml(title)}</h1>
        <p>Modernized league browser with responsive navigation and preserved legacy data pages.</p>
      </div>
      <nav class="nav-list">
        ${navHtml}
      </nav>
    </aside>
    <main class="site-main">
      <div class="frame-card">
        <div class="frame-toolbar">
          <div class="toolbar-copy">
            <h2>League Dashboard</h2>
            <p>Select a page from the left to browse the converted export.</p>
          </div>
          <button class="menu-toggle" type="button" data-menu-toggle>Menu</button>
        </div>
        <iframe class="frame-window" title="League content" src="${escapeHtml(initialPage)}" data-frame></iframe>
      </div>
    </main>
  </div>
  <script type="module" src="${assetPrefix}_modern/shell.js"></script>
</body>
</html>
`;
}

function renderMenuPage({ title, accent, assetPrefix, menuLinks }) {
  const navHtml = renderNavLinks(menuLinks);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${assetPrefix}_modern/style.css">
  <style>:root { --accent: ${accent}; }</style>
</head>
<body class="menu-page">
  <main class="site-main">
    <section class="page-card">
      <div class="page-toolbar">
        <div class="toolbar-copy">
          <h1>${escapeHtml(title)}</h1>
          <p>The old frame menu has been replaced with a responsive navigation page.</p>
        </div>
      </div>
      <div class="page-body">
        <nav class="nav-list">
          ${navHtml}
        </nav>
      </div>
    </section>
  </main>
</body>
</html>
`;
}

function renderContentPage({ title, accent, assetPrefix, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${assetPrefix}_modern/style.css">
  <style>:root { --accent: ${accent}; }</style>
</head>
<body>
  <main class="site-main">
    <section class="page-card">
      <div class="page-toolbar">
        <div class="toolbar-copy">
          <h1>${escapeHtml(title)}</h1>
          <p>Converted from the legacy export with a responsive, modern presentation layer.</p>
        </div>
      </div>
      <div class="page-body">
        ${bodyHtml}
      </div>
    </section>
  </main>
</body>
</html>
`;
}

function renderNavLinks(menuLinks) {
  return menuLinks
    .map(
      ({ href, label }) =>
        `<a class="nav-link" href="${escapeAttribute(href)}" data-link>${escapeHtml(label)}</a>`,
    )
    .join("\n        ");
}

function modernizeBody(html) {
  let output = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<body\b[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .replace(/<table\b([^>]*)>/gi, (match, attrs) => {
      if (/class\s*=/.test(attrs)) {
        return `<table${attrs.replace(/class\s*=\s*(['"]?)([^'">\s]+(?:\s+[^'">\s]+)*)\1/i, (full, quote, classes) => ` class="${classes} legacy-table"`)}>`;
      }
      return `<table class="legacy-table"${attrs}>`;
    })
    .replace(/\swidth=\*/gi, "")
    .replace(/<br\s*\/?>/gi, "<br>\n");

  return output.trim();
}

function extractTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : "";
}

function extractBody(html) {
  const match = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (match) {
    return match[1].trim();
  }
  return html;
}

function extractAccent(html) {
  const match = html.match(/td\.header\s*\{[^}]*background:\s*([^;}\n]+)/i);
  return normalizeColor(match?.[1] ?? "#2f6fed");
}

function normalizeColor(value) {
  const color = value.trim().replace(/["']/g, "");
  return color.startsWith("#") ? color : "#2f6fed";
}

function depthPrefix(relativePath) {
  const depth = relativePath.split("/").length - 1;
  return "../".repeat(depth);
}

async function extractMenuLinks() {
  const menuPath = path.join(cwd, "menu.htm");
  const menuText = await readFile(menuPath, "utf8");
  const links = [...menuText.matchAll(/<a\b[^>]*href=(["']?)([^"'\s>]+)\1[^>]*>([\s\S]*?)<\/a>/gi)].map(
    (match) => ({
      href: match[2],
      label: decodeEntities(stripTags(match[3]).trim()),
    }),
  );

  return links.filter((link) => link.href && link.label);
}

async function writeSharedAssets() {
  const assetsDir = path.join(outputDir, "_modern");
  await mkdir(assetsDir, { recursive: true });
  await writeFile(path.join(assetsDir, "style.css"), SHARED_CSS, "utf8");
  await writeFile(path.join(assetsDir, "shell.js"), SHELL_JS, "utf8");
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, "");
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
