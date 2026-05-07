(() => {
  const STORAGE_KEY = "eslMediaReadArticles";
  const page = document.body?.dataset?.listingPage;
  const validPages = new Set(["all-articles", "analysis", "scouting", "interviews"]);

  if (!validPages.has(page)) {
    return;
  }

  const grids = Array.from(document.querySelectorAll(".article-grid"));
  if (!grids.length) {
    return;
  }

  const readArticles = loadReadArticles();
  injectReadStyles();

  for (const grid of grids) {
    sortGrid(grid);
    applyReadState(grid, readArticles);
    bindReadTracking(grid, readArticles);
  }

  function loadReadArticles() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }

  function saveReadArticles(readSet) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(readSet)));
    } catch {
      // Ignore storage failures and leave the page usable.
    }
  }

  function normalizeHref(href) {
    try {
      return new URL(href, window.location.href).pathname;
    } catch {
      return href;
    }
  }

  function sortGrid(grid) {
    const cards = Array.from(grid.querySelectorAll(".article-card"));
    cards
      .sort((a, b) => {
        const aKey = a.dataset.sortKey || "";
        const bKey = b.dataset.sortKey || "";
        return bKey.localeCompare(aKey);
      })
      .forEach((card) => grid.appendChild(card));
  }

  function applyReadState(grid, readSet) {
    const cards = Array.from(grid.querySelectorAll(".article-card"));
    for (const card of cards) {
      const link = card.querySelector(".card-title a");
      if (!link) {
        continue;
      }
      const articleKey = normalizeHref(link.getAttribute("href"));
      if (readSet.has(articleKey)) {
        card.classList.add("is-read");
        link.setAttribute("data-read", "true");
      }
    }
  }

  function bindReadTracking(grid, readSet) {
    const links = Array.from(grid.querySelectorAll(".card-title a"));
    for (const link of links) {
      link.addEventListener("click", () => {
        const articleKey = normalizeHref(link.getAttribute("href"));
        readSet.add(articleKey);
        saveReadArticles(readSet);
      });
    }
  }

  function injectReadStyles() {
    if (document.getElementById("media-list-read-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "media-list-read-styles";
    style.textContent = `
      .article-card.is-read {
        background: #ebe8e1 !important;
        border-color: #d2ccc0 !important;
        opacity: 0.82;
      }

      .article-card.is-read .card-title,
      .article-card.is-read .card-title a,
      .article-card.is-read .card-dek,
      .article-card.is-read .card-tag,
      .article-card.is-read .card-meta {
        color: #666a73 !important;
      }

      .article-card.is-read .card-title a:hover {
        color: #4e5563 !important;
      }
    `;
    document.head.appendChild(style);
  }
})();
