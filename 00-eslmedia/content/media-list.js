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

  initFilters();

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

  function collectCardValues(cards, attr, splitter) {
    const values = new Set();
    for (const card of cards) {
      const raw = String(card.getAttribute(attr) || "");
      if (!raw) continue;
      if (splitter) {
        raw.split(splitter).map((item) => item.trim()).filter(Boolean).forEach((item) => values.add(item));
      } else {
        values.add(raw);
      }
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }

  function appendOptions(select, values) {
    if (!select) return;
    const options = values.map((value) => `<option value="${value}">${value}</option>`).join("");
    select.insertAdjacentHTML("beforeend", options);
  }

  function initFilters() {
    if (page !== "all-articles") return;

    const teamSelect = document.getElementById("filterTeam");
    const deskSelect = document.getElementById("filterDesk");
    const authorSelect = document.getElementById("filterAuthor");
    const categorySelect = document.getElementById("filterCategory");
    const monthSelect = document.getElementById("filterMonth");
    const readSelect = document.getElementById("filterRead");
    const note = document.getElementById("filtersNote");
    const cards = Array.from(document.querySelectorAll(".article-card"));
    if (!cards.length) return;

    appendOptions(teamSelect, collectCardValues(cards, "data-teams", "|"));
    appendOptions(deskSelect, collectCardValues(cards, "data-desk"));
    appendOptions(authorSelect, collectCardValues(cards, "data-author"));
    appendOptions(categorySelect, collectCardValues(cards, "data-category"));
    appendOptions(monthSelect, collectCardValues(cards, "data-month"));

    const applyFilters = () => {
      let visible = 0;
      cards.forEach((card) => {
        const teams = String(card.getAttribute("data-teams") || "").split("|").filter(Boolean);
        const desk = String(card.getAttribute("data-desk") || "");
        const author = String(card.getAttribute("data-author") || "");
        const category = String(card.getAttribute("data-category") || "");
        const month = String(card.getAttribute("data-month") || "");
        const isRead = card.classList.contains("is-read");

        const teamMatch = !teamSelect.value || teams.includes(teamSelect.value);
        const deskMatch = !deskSelect.value || desk === deskSelect.value;
        const authorMatch = !authorSelect.value || author === authorSelect.value;
        const categoryMatch = !categorySelect.value || category === categorySelect.value;
        const monthMatch = !monthSelect.value || month === monthSelect.value;
        const readMatch = !readSelect.value || (readSelect.value === "read" ? isRead : !isRead);
        const match = teamMatch && deskMatch && authorMatch && categoryMatch && monthMatch && readMatch;

        card.style.display = match ? "" : "none";
        if (match) visible += 1;
      });

      document.querySelectorAll(".article-section").forEach((section) => {
        const visibleInSection = Array.from(section.querySelectorAll(".article-card")).some((card) => card.style.display !== "none");
        section.style.display = visibleInSection ? "" : "none";
      });

      if (note) {
        note.textContent = `${visible} stories match current filters`;
      }
    };

    [teamSelect, deskSelect, authorSelect, categorySelect, monthSelect, readSelect].forEach((select) => {
      if (select) select.addEventListener("change", applyFilters);
    });

    applyFilters();
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
