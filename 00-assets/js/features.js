(function () {
  "use strict";

  var SEARCH_STYLE_ID = "player-search-styles";
  var WAIVER_TABLE_STYLE_ID = "waiver-table-styles";
  var PLAYER_RATING_STYLE_ID = "player-rating-pill-styles";
  var ROSTER_RATING_STYLE_ID = "roster-rating-pill-styles";
  var MENU_STYLE_ID = "league-menu-enhancement-styles";
  var RESPONSIVE_MENU_STYLE_ID = "responsive-menu-toggle-styles";
  var MENU_BREAKPOINT = 760;

  function isNestedPage() {
    return /\/(players|rosters|boxes)\//i.test(window.location.pathname);
  }

  function getBuildJsonPath(filename) {
    return isNestedPage() ? "../00-build/database/" + filename : "00-build/database/" + filename;
  }

  function normalizePlayerUrl(url) {
    if (!url) {
      return "#";
    }

    if (!isNestedPage() && url.indexOf("../") === 0) {
      return "./" + url.slice(3);
    }

    return url;
  }

  function loadJsonData(filename) {
    var jsonPath = getBuildJsonPath(filename);

    return fetch(jsonPath)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load " + filename);
        }
        return response.json();
      })
      .catch(function () {
        return loadJsonDataFromFrame(jsonPath);
      });
  }

  function loadJsonDataFromFrame(jsonPath) {
    return new Promise(function (resolve, reject) {
      var frame = document.createElement("iframe");
      frame.hidden = true;
      frame.setAttribute("aria-hidden", "true");
      frame.src = jsonPath;

      frame.addEventListener("load", function () {
        try {
          var frameDocument = frame.contentDocument || frame.contentWindow.document;
          var raw = "";

          if (frameDocument) {
            if (frameDocument.body && frameDocument.body.textContent) {
              raw = frameDocument.body.textContent;
            }

            if (!raw && frameDocument.documentElement && frameDocument.documentElement.textContent) {
              raw = frameDocument.documentElement.textContent;
            }

            if (!raw) {
              var pre = frameDocument.querySelector("pre");
              raw = pre && pre.textContent ? pre.textContent : "";
            }
          }

          frame.remove();
          raw = String(raw || "").replace(/^\uFEFF/, "").trim();

          if (!raw) {
            reject(new Error("No player data found"));
            return;
          }

          resolve(JSON.parse(raw));
        } catch (error) {
          frame.remove();
          reject(error);
        }
      });

      frame.addEventListener("error", function () {
        frame.remove();
        reject(new Error("Unable to load player data"));
      });

      document.body.appendChild(frame);
    });
  }

  function ensureSearchStyles() {
    if (document.getElementById(SEARCH_STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = SEARCH_STYLE_ID;
    style.textContent = [
      "#player-search-root { position: fixed; top: 14px; right: 18px; z-index: 120; width: min(300px, calc(100vw - 40px)); }",
      ".player-search { position: relative; width: 100%; padding: 10px; border: 1px solid rgba(148, 163, 184, 0.5); border-radius: 10px; background: rgba(255, 255, 255, 0.96); box-shadow: 0 10px 26px rgba(15, 23, 42, 0.12); backdrop-filter: blur(8px); }",
      ".player-search__label { display: block; margin-bottom: 6px; font: 700 11px/1.2 Inter, Tahoma, Arial, sans-serif; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }",
      ".player-search__input { width: 100%; height: 38px; padding: 0 11px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #0f172a; font: 500 13px/1.4 Inter, Tahoma, Arial, sans-serif; }",
      ".player-search__input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }",
      ".player-search__dropdown { position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 121; max-height: 240px; overflow-y: auto; border: 1px solid #dbe3ee; border-radius: 10px; background: #fff; box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16); }",
      ".player-search__dropdown[hidden] { display: none; }",
      ".player-search__option { display: block; width: 100%; padding: 10px 11px; border: 0; border-bottom: 1px solid #eef2f7; background: transparent; color: #0f172a; text-align: left; cursor: pointer; }",
      ".player-search__option:last-child { border-bottom: 0; }",
      ".player-search__option:hover, .player-search__option:focus { background: #f8fafc; outline: none; }",
      ".player-search__name { display: block; font: 600 12px/1.3 Inter, Tahoma, Arial, sans-serif; }",
      ".player-search__meta { display: block; margin-top: 2px; font: 500 10px/1.3 Inter, Tahoma, Arial, sans-serif; color: #475569; }",
      ".player-search__submeta { display: block; margin-top: 3px; font: 500 10px/1.3 Inter, Tahoma, Arial, sans-serif; color: #64748b; }",
      ".player-search__empty { padding: 10px 11px; font: 500 11px/1.4 Inter, Tahoma, Arial, sans-serif; color: #64748b; }",
      "@media (max-width: 900px) { #player-search-root { position: sticky; top: 8px; right: auto; margin: 0 0 12px auto; } .player-search { padding: 8px; } }"
    ].join("");
    document.head.appendChild(style);
  }

  function ensureWaiverTableStyles() {
    if (document.getElementById(WAIVER_TABLE_STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = WAIVER_TABLE_STYLE_ID;
    style.textContent = [
      "#waiver-database-root { margin: 0; max-width: 100%; }",
      ".waiver-database { margin: 0 0 10px; }",
      ".waiver-database__title { margin: 0; font: 700 17pt/1.1 Inter, Tahoma, Arial, sans-serif; color: #1e293b; letter-spacing: -0.02em; }",
      ".waiver-database__title-rule { margin: 6px 0 10px; border: 0; border-top: 1px solid #cbd5e1; }",
      ".waiver-database__section-title { margin: 0 0 6px; padding: 0 8px; font: 700 11pt/1.2 Inter, Tahoma, Arial, sans-serif; color: #1e293b; }",
      ".waiver-database__subtitle { margin: 6px 0 8px; font: 500 8.5pt/1.3 Inter, Tahoma, Arial, sans-serif; color: #64748b; }",
      ".waiver-database__controls { display: flex; flex-wrap: wrap; gap: 4px; align-items: end; margin: 0 0 10px; }",
      ".waiver-database__control { display: flex; flex-direction: column; gap: 4px; }",
      ".waiver-database__control--search { min-width: 220px; flex: 1 1 220px; }",
      ".waiver-database__control label { font: 700 7.5pt/1.1 Inter, Tahoma, Arial, sans-serif; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }",
      ".waiver-database__control input, .waiver-database__control select { height: 28px; padding: 0 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; color: #0f172a; font: 500 8.5pt/1.1 Inter, Tahoma, Arial, sans-serif; }",
      ".waiver-database__control input:focus, .waiver-database__control select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }",
      ".waiver-database__clear { height: 28px; padding: 0 10px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; color: #0f172a; font: 600 8.5pt/1 Inter, Tahoma, Arial, sans-serif; cursor: pointer; }",
      ".waiver-database__clear:hover { background: #eef2f7; }",
      ".waiver-database__top-scroll { overflow-x: auto; overflow-y: hidden; height: 14px; margin: 0 0 4px; }",
      ".waiver-database__top-scroll-inner { height: 1px; }",
      ".waiver-database__table-wrap { overflow-x: auto; border-radius: 0; box-shadow: none; }",
      ".waiver-database__table { width: 100%; min-width: 1155px; border-collapse: collapse; background: #ffffff; table-layout: fixed; }",
      ".waiver-database__table td.header { position: sticky; top: 0; z-index: 2; padding: 6px 3px; background: #990000; color: #ffffff !important; font: 700 var(--waiver-header-font-size, 7.5pt)/1.05 Inter, Tahoma, Arial, sans-serif; text-align: center; white-space: nowrap; }",
      ".waiver-database__table td.header--sortable { cursor: pointer; user-select: none; }",
      ".waiver-database__table td.header--left, .waiver-database__table tbody td.main--left { text-align: left; }",
      ".waiver-database__table tbody td.main { padding: 5px 7px; border-bottom: 0; font: 400 14pt/1.2 Inter ..., Tahoma, Arial, sans-serif; color: #1e293b; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
      ".waiver-database__table tbody tr.row1 { background: #f1f5f9; }",
      ".waiver-database__table tbody tr.row2 { background: #e2e8f0; }",
      ".waiver-database__table tbody tr.row1:hover { background: #e8f0fe; }",
      ".waiver-database__table tbody tr.row2:hover { background: #dbeafe; }",
      ".waiver-database__sort-indicator { margin-left: 3px; opacity: 0.55; font-size: 8px; }",
      ".waiver-database__table col.player { width: 150px; }",
      ".waiver-database__table col.team { width: 100px; }",
      ".waiver-database__table col.small { width: 40px; }",
      ".waiver-database__table col.medium { width: 50px; }",
      ".waiver-database__player-link { color: #4a4a6a; font-weight: 500; text-decoration: none; }",
      ".waiver-database__player-link:hover { text-decoration: underline; }"
    ].join("");

    document.head.appendChild(style);
  }

  function createSearchMarkup(root) {
    root.innerHTML = [
      '<div class="player-search">',
      '  <label class="player-search__label" for="player-search-input">Player Search</label>',
      '  <input class="player-search__input" id="player-search-input" type="search" placeholder="Search players" autocomplete="off" />',
      '  <div class="player-search__dropdown" id="player-search-dropdown" hidden></div>',
      "</div>"
    ].join("");
  }

  function shouldAttachStandingsSearch() {
    return /\/standings\.htm$/i.test(window.location.pathname) || /\\standings\.htm$/i.test(window.location.pathname);
  }

  function isWaiverWirePage() {
    return /\/waiverwire\.htm$/i.test(window.location.pathname) || /\\waiverwire\.htm$/i.test(window.location.pathname);
  }

  function isMenuPage() {
    return /\/menu\.htm$/i.test(window.location.pathname) || /\\menu\.htm$/i.test(window.location.pathname);
  }

  function isPlayerPage() {
    return /\/players\/player\d+\.htm$/i.test(window.location.pathname) || /\\players\\player\d+\.htm$/i.test(window.location.pathname);
  }

  function isRosterPage() {
    return /\/rosters\/roster\d+\.htm$/i.test(window.location.pathname) || /\\rosters\\roster\d+\.htm$/i.test(window.location.pathname);
  }

  function getRosterPhotoPath(filename) {
    if (!filename) {
      return "";
    }

    return isNestedPage() ? "../00-assets/photos/" + filename : "00-assets/photos/" + filename;
  }

  function getRosterPhotoFilename(teamName) {
    var photoMap = {
      "Manchester United": "manutd.jpg",
      "Crystal Palace": "crystalpalace.jpg",
      "Bayern Munich": "bayern.jpg",
      "Real Madrid": "realmadrid.jpg",
      "AC Milan": "acmilan.jpg",
      "Brighton": "brighton.jpg",
      "Atletico Madrid": "atletico.jpg",
      "AFC Richmond": "richmond.jpg",
      "Benfica": "benfica.jpg",
      "Juventus": "juventus.jpg",
      "Marseille": "marseille.jpg",
      "Sheffield United": "sheffield.jpg",
      "Chelsea": "chelsea.jpg",
      "Ajax": "ajax.jpg",
      "Aston Villa": "astonvilla.jpg",
      "Monaco": "monaco.jpg",
      "Paris Saint-Germain": "psg.jpg",
      "Tottenham Hotspur": "tottenham.jpg",
      "Sporting CP": "sportingcp.jpg",
      "Barcelona": "barcelona.jpg",
      "Valencia": "valencia.jpg",
      "Inter Milan": "intermilan.jpg",
      "Manchester City": "manchestercity.jpg",
      "FL Fart": "flfart.jpg"
    };

    return photoMap[teamName] || "";
  }

  function applyRosterHeaderPhoto() {
    if (!isRosterPage()) {
      return;
    }

    var teamName = document.title ? document.title.trim() : "";
    var photoFilename = getRosterPhotoFilename(teamName);

    if (!photoFilename) {
      return;
    }

    var headerImage = document.querySelector("body > table img");

    if (!headerImage) {
      return;
    }

    headerImage.setAttribute("src", getRosterPhotoPath(photoFilename));
  }

  function enableMenuFrameScroll() {
    var menuFrame = document.querySelector('frame[name="Options"]');

    if (!menuFrame) {
      return;
    }

    menuFrame.setAttribute("scrolling", "auto");
    menuFrame.style.overflow = "auto";
  }

  function getParentFrameset() {
    try {
      if (window.parent === window || !window.parent.document) {
        return null;
      }

      return window.parent.document.querySelector("frameset");
    } catch (error) {
      return null;
    }
  }

  function setParentMenuOpen(isOpen) {
    var frameset = getParentFrameset();

    if (!frameset) {
      return;
    }

    frameset.setAttribute("cols", isOpen ? "150,*" : "0,*");
  }

  function syncDataFrameMenuButton() {
    try {
      if (
        window.parent &&
        window.parent.frames &&
        window.parent.frames.data &&
        typeof window.parent.frames.data.__syncLeagueMenuButton === "function"
      ) {
        window.parent.frames.data.__syncLeagueMenuButton();
      }
    } catch (error) {
      return;
    }
  }

  function isParentMenuOpen() {
    var frameset = getParentFrameset();

    if (!frameset) {
      return false;
    }

    return String(frameset.getAttribute("cols") || "").split(",")[0] !== "0";
  }

  function syncResponsiveMenuState(button) {
    var parentWindow;
    var isNarrow;

    try {
      parentWindow = window.parent;
      isNarrow = parentWindow.innerWidth <= MENU_BREAKPOINT;
    } catch (error) {
      return;
    }

    if (!isNarrow) {
      setParentMenuOpen(true);
      button.hidden = true;
      parentWindow.__leagueMenuUserToggled = false;
      return;
    }

    if (!parentWindow.__leagueMenuUserToggled) {
      setParentMenuOpen(false);
    }

    button.hidden = false;
    button.setAttribute("aria-expanded", String(isParentMenuOpen()));
  }

  function ensureResponsiveMenuToggleStyles() {
    if (document.getElementById(RESPONSIVE_MENU_STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = RESPONSIVE_MENU_STYLE_ID;
    style.textContent = [
      ".league-menu-hamburger { position: fixed; top: 8px; left: 8px; z-index: 3000; width: 36px; height: 34px; border: 1px solid rgba(255,255,255,0.24); border-radius: 8px; background: #111b36; color: #ffffff; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.22); cursor: pointer; font: 800 18px/1 Inter, Tahoma, Arial, sans-serif; }",
      ".league-menu-hamburger:hover { background: #17274b; }",
      ".league-menu-hamburger[hidden] { display: none; }"
    ].join("");
    document.head.appendChild(style);
  }

  function initResponsiveFrameMenu() {
    var frameset = getParentFrameset();
    var button;

    if (!frameset || isMenuPage() || document.querySelector(".league-menu-hamburger")) {
      return;
    }

    ensureResponsiveMenuToggleStyles();
    button = document.createElement("button");
    button.className = "league-menu-hamburger";
    button.type = "button";
    button.setAttribute("aria-label", "Toggle league menu");
    button.textContent = "\u2630";
    document.body.appendChild(button);

    button.addEventListener("click", function () {
      var parentWindow = window.parent;
      var nextOpen = !isParentMenuOpen();

      parentWindow.__leagueMenuUserToggled = true;
      setParentMenuOpen(nextOpen);
      button.setAttribute("aria-expanded", String(nextOpen));
    });

    window.__syncLeagueMenuButton = function () {
      syncResponsiveMenuState(button);
    };
    syncResponsiveMenuState(button);
    window.setInterval(function () {
      syncResponsiveMenuState(button);
    }, 500);

    try {
      window.parent.addEventListener("resize", function () {
        syncResponsiveMenuState(button);
      });
    } catch (error) {
      window.addEventListener("resize", function () {
        syncResponsiveMenuState(button);
      });
    }
  }

  function markStandingsPage() {
    if (shouldAttachStandingsSearch()) {
      document.body.classList.add("page-standings");
    }
  }

  function ensurePlayerRatingStyles() {
    if (document.getElementById(PLAYER_RATING_STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = PLAYER_RATING_STYLE_ID;
    style.textContent = [
      ".player-rating-pills-row td { padding-top: 6px; vertical-align: top; }",
      ".player-rating-pill-cell { white-space: nowrap; }",
      ".player-rating-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 26px; padding: 2px 8px; border-radius: 999px; color: #ffffff; font: 700 10px/1 Inter, Tahoma, Arial, sans-serif; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18); }",
      ".player-rating-pill--na { background: rgba(255, 255, 255, 0.18); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.28); box-shadow: none; }",
      ".player-rating-pill-separator { display: inline-block; margin-right: 6px; color: rgba(255, 255, 255, 0.92); font: 700 12px/1 Inter, Tahoma, Arial, sans-serif; }"
    ].join("");
    document.head.appendChild(style);
  }

  function ensureRosterRatingStyles() {
    if (document.getElementById(ROSTER_RATING_STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = ROSTER_RATING_STYLE_ID;
    style.textContent = [
      ".roster-rating-pill-host { text-align: center; }",
      ".roster-rating-pill { align-items: center; border-radius: 999px; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22); color: #ffffff !important; display: inline-block; font-family: Inter, Tahoma, Arial, sans-serif; font-size: 12px; font-style: normal; font-variant: normal; font-weight: 600; justify-content: center; line-height: 1.05; min-height: 0; min-width: 28px; padding: 2px 7px; text-align: center; text-decoration: none; text-indent: 0; text-shadow: 0 1px 1px rgba(15, 23, 42, 0.35); vertical-align: middle; white-space: nowrap; }",
      ".roster-rating-pill--na { background: rgba(148, 163, 184, 0.35); color: #e2e8f0; text-shadow: none; }"
    ].join("");
    document.head.appendChild(style);
  }

  function ensureSearchRoot() {
    if (!shouldAttachStandingsSearch()) {
      return null;
    }

    var existingRoot = document.getElementById("player-search-root");
    if (existingRoot) {
      return existingRoot;
    }

    var titleTable = document.querySelector("body > table");
    if (!titleTable || !titleTable.parentNode) {
      return null;
    }

    var root = document.createElement("div");
    root.id = "player-search-root";
    titleTable.parentNode.insertBefore(root, titleTable);

    return root;
  }

  function ensureWaiverTableRoot() {
    if (!isWaiverWirePage()) {
      return null;
    }

    var existingRoot = document.getElementById("waiver-database-root");
    if (existingRoot) {
      return existingRoot;
    }

    var footerRule = document.querySelector("hr");
    var root = document.createElement("div");
    root.id = "waiver-database-root";

    if (footerRule && footerRule.parentNode) {
      footerRule.parentNode.insertBefore(root, footerRule);
    } else {
      document.body.appendChild(root);
    }

    return root;
  }

  function ensureCapReportMenuLink() {
    if (!isMenuPage()) {
      return;
    }

    var menuTable = document.querySelector("body > table");
    if (!menuTable || menuTable.querySelector('a[href="capreport.htm"]')) {
      return;
    }

    var anchor = menuTable.querySelector('a[href="injuries.htm"]');
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    var link = document.createElement("a");

    row.setAttribute("valign", "top");
    link.className = "menulink";
    link.target = "data";
    link.href = "capreport.htm";
    link.textContent = "Cap Report";
    cell.appendChild(link);
    row.appendChild(cell);

    if (anchor && anchor.parentNode && anchor.parentNode.parentNode && anchor.parentNode.parentNode.parentNode === menuTable) {
      anchor.parentNode.parentNode.insertAdjacentElement("afterend", row);
      return;
    }

    menuTable.appendChild(row);
  }

  function ensureDepthChartsMenuLink() {
    if (!isMenuPage()) {
      return;
    }

    var menuTable = document.querySelector("body > table");
    if (!menuTable || menuTable.querySelector('a[href="00-assets/html/depthcharts.htm"]')) {
      return;
    }

    var anchor = menuTable.querySelector('a[href="capreport.htm"]') || menuTable.querySelector('a[href="injuries.htm"]');
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    var link = document.createElement("a");

    row.setAttribute("valign", "top");
    link.className = "menulink";
    link.target = "data";
    link.href = "00-assets/html/depthcharts.htm";
    link.textContent = "Depth Charts";
    cell.appendChild(link);
    row.appendChild(cell);

    if (anchor && anchor.parentNode && anchor.parentNode.parentNode && anchor.parentNode.parentNode.parentNode === menuTable) {
      anchor.parentNode.parentNode.insertAdjacentElement("afterend", row);
      return;
    }

    menuTable.appendChild(row);
  }

  function ensureLeagueMenuStyles() {
    if (document.getElementById(MENU_STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = MENU_STYLE_ID;
    style.textContent = [
      "body.menu-body { background: #111b36 !important; color: #ffffff; font-family: 'Inter', Tahoma, Arial, sans-serif; font-size: 10.8pt; line-height: 1.16; margin: 0; padding: 0; overflow-x: hidden; }",
      ".league-menu-shell { display: flex; flex-direction: column; gap: 0; }",
      ".league-menu-link, .league-menu-toggle { font-family: 'Inter', Tahoma, Arial, sans-serif; text-decoration: none; }",
      ".league-menu-link { color: #ffffff; display: block; font-size: 9.8pt; font-weight: 600; line-height: 1.08; padding: 6px 7px 6px 9px; }",
      ".league-menu-link:hover { background: rgba(255, 255, 255, 0.08); color: #ffffff; text-decoration: none; }",
      ".league-menu-feature { align-items: center; background: #111b36; color: #ffffff !important; display: flex; justify-content: center; min-height: 42px; padding: 5px 2px; }",
      ".league-menu-feature:hover { background: rgba(255, 255, 255, 0.08); }",
      ".league-menu-feature-row { align-items: center; border-bottom: 1px solid rgba(148, 163, 184, 0.45); display: flex; justify-content: center; min-height: 50px; padding: 5px 7px; }",
      ".league-menu-logo { display: block; max-width: 84px; width: 100%; max-height: 38px; object-fit: contain; filter: brightness(0) invert(1); }",
      ".league-menu-eslm-logo { display: block; max-width: 94px; width: 100%; max-height: 22px; object-fit: contain; object-position: left center; filter: brightness(0) invert(1); }",
      ".league-menu-fallback { color: #ffffff; font: 800 11pt/1 Inter, Tahoma, Arial, sans-serif; letter-spacing: 0.05em; text-transform: uppercase; }",
      ".league-menu-group { border-bottom: 1px solid rgba(148, 163, 184, 0.24); overflow: hidden; }",
      ".league-menu-toggle { align-items: center; background: #111b36; border: 0; color: #94a3b8; cursor: pointer; display: flex; font-size: 8.7pt; font-weight: 800; justify-content: space-between; letter-spacing: 0.09em; padding: 7px 7px 3px 9px; text-align: left; text-transform: uppercase; width: 100%; }",
      ".league-menu-toggle:hover { background: rgba(255, 255, 255, 0.08); }",
      ".league-menu-toggle::after { content: '-'; font-weight: 800; }",
      ".league-menu-group.is-collapsed .league-menu-toggle::after { content: '+'; }",
      ".league-menu-links { display: flex; flex-direction: column; gap: 0; padding-top: 0; }",
      ".league-menu-group.is-collapsed .league-menu-links { display: none; }",
      "@media (max-height: 680px) { .league-menu-link { font-size: 9.2pt; padding: 5px 6px 5px 8px; } .league-menu-toggle { font-size: 8.1pt; padding: 6px 6px 2px 8px; } .league-menu-feature-row { min-height: 42px; padding-left: 6px; padding-right: 6px; } .league-menu-feature { min-height: 34px; } .league-menu-logo { max-height: 32px; } }"
    ].join("");
    document.head.appendChild(style);
  }

  function makeMenuLink(label, href, className) {
    var link = document.createElement("a");
    link.className = className || "league-menu-link";
    link.target = "data";
    link.href = href;
    link.textContent = label;
    link.addEventListener("click", function (event) {
      if (link.target !== "data") {
        return;
      }
      try {
        if (window.parent && window.parent.frames && window.parent.frames.data) {
          event.preventDefault();
          window.parent.frames.data.location.href = link.getAttribute("href");
        }
      } catch (error) {
        // Let default navigation proceed when frame access is blocked.
      }
    });
    return link;
  }

  function makeLeagueLogoLink() {
    var link = makeMenuLink("", "00-assets/html/league%20dashboard.htm", "league-menu-link league-menu-feature");
    var logo = document.createElement("img");
    var fallback = document.createElement("span");

    logo.className = "league-menu-logo";
    logo.src = "00-assets/images/ESLcropped-removebg-preview.png";
    logo.alt = "European Super League";

    fallback.className = "league-menu-fallback";
    fallback.textContent = "ESL";

    logo.addEventListener("error", function () {
      logo.remove();
      if (!link.contains(fallback)) {
        link.appendChild(fallback);
      }
    });

    link.appendChild(logo);
    return link;
  }

  function makeEslMediaLogoLink() {
    var link = makeMenuLink("", "00-eslmedia/homepage.html");
    var logo = document.createElement("img");
    var fallback = document.createElement("span");

    link.target = "_top";
    logo.className = "league-menu-eslm-logo";
    logo.src = "00-eslmedia/content/article images/ESLM.png";
    logo.alt = "ESL Media";

    fallback.textContent = "ESL Media";

    logo.addEventListener("error", function () {
      logo.remove();
      if (!link.contains(fallback)) {
        link.appendChild(fallback);
      }
    });

    link.appendChild(logo);
    return link;
  }

  function makeMenuGroup(title, links, options) {
    var section = document.createElement("section");
    var toggle = document.createElement("button");
    var linkWrap = document.createElement("div");
    var opts = options || {};
    var isCollapsed = !!opts.collapsed;

    section.className = "league-menu-group";
    if (isCollapsed) {
      section.classList.add("is-collapsed");
    }
    toggle.className = "league-menu-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", String(!isCollapsed));
    toggle.textContent = title;
    linkWrap.className = "league-menu-links";

    links.forEach(function (link) {
      var menuLink = link.logo === "eslm" ? makeEslMediaLogoLink() : makeMenuLink(link.label, link.href);

      if (link.target) {
        menuLink.target = link.target;
      }

      linkWrap.appendChild(menuLink);
    });

    toggle.addEventListener("click", function () {
      var collapsed = section.classList.toggle("is-collapsed");
      toggle.setAttribute("aria-expanded", String(!collapsed));
    });

    section.appendChild(toggle);
    section.appendChild(linkWrap);
    return section;
  }

  function enhanceLeagueMenu() {
    if (!isMenuPage() || document.querySelector(".league-menu-shell")) {
      return;
    }

    ensureLeagueMenuStyles();
    document.body.className = (document.body.className ? document.body.className + " " : "") + "menu-body";
    document.body.setAttribute("bgcolor", "#111b36");

    var groups = [
      {
        title: "League",
        links: [
          { label: "Standings", href: "standings.htm" },
          { label: "Schedule", href: "schedule.htm" },
          { label: "League Leaders", href: "leaders.htm" },
          { label: "Team Leaders", href: "teamleaders.htm" },
          { label: "Transactions", href: "transactions.htm" }
        ]
      },
      {
        title: "Teams",
        links: [
          { label: "Injuries", href: "injuries.htm" },
          { label: "Cap Report", href: "capreport.htm" },
          { label: "Depth Charts", href: "00-assets/html/depthcharts.htm" },
          { label: "Free Agents", href: "freeagents.htm" },
          { label: "Waiver Wire", href: "waiverwire.htm" },
          { label: "Potential FAs", href: "potentialfreeagents.htm" }
        ]
      },
      {
        title: "Season",
        links: [
          { label: "Youth Intake", href: "00-assets/html/youth-intake.htm" },
          { label: "Awards", href: "awards.htm" },
          { label: "Season Awards", href: "seasonawards.htm" },
          { label: "Playoff Standings", href: "playoffstandings.htm" },
          { label: "Past Champs", href: "champs.htm" }
        ]
      },
      {
        title: "Admin",
        links: [
          { label: "Human Coaches", href: "humancoaches.htm" }
        ]
      },
      {
        title: "Legacy",
        links: [
          { label: "Draft Preview", href: "draft.htm" },
          { label: "Available Staff", href: "staff.htm" },
          { label: "Playoffs", href: "playoffs.htm" },
          { label: "Playoff Leaders", href: "playoffleaders.htm" }
        ],
        collapsed: true
      }
    ];
    var shell = document.createElement("nav");
    var featureRow = document.createElement("div");

    shell.className = "league-menu-shell";
    shell.setAttribute("aria-label", "League navigation");
    featureRow.className = "league-menu-feature-row";
    featureRow.appendChild(makeLeagueLogoLink());
    shell.appendChild(featureRow);
    shell.appendChild(makeMenuGroup("Media", [
      { label: "ESL Media", href: "00-eslmedia/homepage.html", target: "_top", logo: "eslm" }
    ]));
    groups.forEach(function (group) {
      shell.appendChild(makeMenuGroup(group.title, group.links, { collapsed: !!group.collapsed }));
    });

    document.body.innerHTML = "";
    document.body.appendChild(shell);
  }

  function getCurrentPlayerPath() {
    return window.location.pathname.replace(/\\/g, "/").toLowerCase();
  }

  function normalizeName(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findCurrentPlayerRecord(players) {
    var currentPath = getCurrentPlayerPath();
    var currentFile = currentPath.split("/").pop();
    var currentNameNode = document.querySelector("body > table:first-of-type td.teamheader table td.teamheader");
    var currentName = normalizeName(currentNameNode ? currentNameNode.textContent : "");

    return (players || []).find(function (player) {
      var playerUrl = String(player && player.url ? player.url : "").replace(/\\/g, "/").toLowerCase();
      var playerFile = playerUrl.split("/").pop();
      if (playerFile && currentFile && playerFile === currentFile) {
        return true;
      }

      if (playerUrl && currentPath && currentPath.indexOf(playerUrl.replace("../", "/")) !== -1) {
        return true;
      }

      return currentName && normalizeName(player && player.name) === currentName;
    }) || null;
  }

  function getColorBarCells() {
    return Array.prototype.slice.call(
      document.querySelectorAll("body > table:first-of-type td.teamheader table td[bgcolor]")
    ).slice(0, 2);
  }

  function formatRatingValue(value) {
    var text = String(value || "").trim();
    return text || "N/A";
  }

  function createRatingPill(text, backgroundColor, fallbackClassName) {
    var pill = document.createElement("span");
    pill.className = "player-rating-pill" + (fallbackClassName ? " " + fallbackClassName : "");
    pill.textContent = text;
    if (backgroundColor) {
      pill.style.backgroundColor = backgroundColor;
    }
    return pill;
  }

  function buildPlayerRecordMaps(players) {
    var byUrl = {};
    var byName = {};

    (players || []).forEach(function (player) {
      var normalizedUrl = normalizePlayerUrl(player && player.url ? player.url : "").replace(/\\/g, "/").toLowerCase();
      var normalizedName = normalizeName(player && player.name);

      if (normalizedUrl) {
        byUrl[normalizedUrl] = player;
      }

      if (normalizedName && !byName[normalizedName]) {
        byName[normalizedName] = player;
      }
    });

    return {
      byUrl: byUrl,
      byName: byName
    };
  }

  function findRosterRatingColor(cell) {
    var colorNode = cell && cell.querySelector("[bgcolor]");
    return colorNode ? colorNode.getAttribute("bgcolor") || "" : "";
  }

  function findRosterPlayerRecord(row, playerMaps) {
    var playerLink = row.querySelector('a[href*="player"]');
    var playerCell = row.children[1];
    var href = playerLink ? normalizePlayerUrl(playerLink.getAttribute("href") || "").replace(/\\/g, "/").toLowerCase() : "";
    var name = normalizeName(playerCell ? playerCell.textContent : "");

    if (href && playerMaps.byUrl[href]) {
      return playerMaps.byUrl[href];
    }

    return name && playerMaps.byName[name] ? playerMaps.byName[name] : null;
  }

  function setRosterRatingCell(cell, value) {
    var text = formatRatingValue(value);

    cell.dataset.sortValue = text === "N/A" ? "" : String(value);
    cell.title = text === "N/A" ? "Rating unavailable" : text;
  }

  function enhanceRosterRatingTables(players) {
    if (!isRosterPage()) {
      return;
    }

    var playerMaps = buildPlayerRecordMaps(players);
    var tables = Array.prototype.slice.call(document.querySelectorAll("table"));
    var enhancedCount = 0;

    tables.forEach(function (table) {
      var headerRow = Array.prototype.slice.call(table.querySelectorAll("tr")).find(function (row) {
        return row.querySelector("td.header");
      });
      var headerCells = headerRow ? Array.prototype.slice.call(headerRow.querySelectorAll("td.header")) : [];
      var curIndex = -1;
      var futIndex = -1;

      if (!headerCells.length) {
        return;
      }

      headerCells.forEach(function (headerCell, index) {
        var label = String(headerCell.textContent || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
        if (label.indexOf("CUR") === 0) {
          curIndex = index;
        } else if (label.indexOf("FUT") === 0) {
          futIndex = index;
        }
      });

      if (curIndex === -1 || futIndex === -1) {
        return;
      }

      Array.prototype.slice.call(table.querySelectorAll("tr.row1, tr.row2")).forEach(function (row) {
        var cells = row.children;
        var player = findRosterPlayerRecord(row, playerMaps);
        var curCell = cells[curIndex];
        var futCell = cells[futIndex];

        if (!curCell || !futCell || !player) {
          return;
        }

        setRosterRatingCell(curCell, player.overall);
        setRosterRatingCell(futCell, player.potential);
        enhancedCount += 1;
      });
    });

    if (enhancedCount) {
      ensureRosterRatingStyles();
    }
  }

  function injectPlayerRatingPills(player) {
    if (!isPlayerPage()) {
      return;
    }

    var headerTable = document.querySelector("body > table:first-of-type td.teamheader table");
    var headerRow = headerTable && headerTable.querySelector("tr");
    var colorCells = getColorBarCells();

    if (!headerTable || !headerRow || colorCells.length < 2 || headerTable.querySelector(".player-rating-pills-row")) {
      return;
    }

    ensurePlayerRatingStyles();

    var overallColor = colorCells[0].getAttribute("bgcolor") || "";
    var potentialColor = colorCells[1].getAttribute("bgcolor") || overallColor;
    var overallText = formatRatingValue(player && player.overall);
    var potentialText = formatRatingValue(player && player.potential);

    var ratingRow = document.createElement("tr");
    ratingRow.className = "player-rating-pills-row";

    var overallCell = document.createElement("td");
    overallCell.className = "player-rating-pill-cell";
    overallCell.appendChild(
      createRatingPill(overallText, overallText === "N/A" ? "" : overallColor, overallText === "N/A" ? "player-rating-pill--na" : "")
    );

    var potentialCell = document.createElement("td");
    potentialCell.className = "player-rating-pill-cell";
    var separator = document.createElement("span");
    separator.className = "player-rating-pill-separator";
    separator.textContent = "/";
    separator.setAttribute("aria-label", "OVR slash POT");
    separator.title = "OVR/POT";
    potentialCell.appendChild(separator);
    potentialCell.appendChild(
      createRatingPill(potentialText, potentialText === "N/A" ? "" : potentialColor, potentialText === "N/A" ? "player-rating-pill--na" : "")
    );

    var spacerCell = document.createElement("td");

    ratingRow.appendChild(overallCell);
    ratingRow.appendChild(potentialCell);
    ratingRow.appendChild(spacerCell);

    headerTable.appendChild(ratingRow);
  }

  function buildWaiverTable(players) {
    var columns = [
      { key: "name", label: "Player" },
      { key: "teamName", label: "Team" },
      { key: "pos", label: "Pos" },
      { key: "age", label: "Age" },
      { key: "ht", label: "Ht" },
      { key: "wt", label: "Wt" },
      { key: "Ins", label: "INS" },
      { key: "Jps", label: "JPS" },
      { key: "Fts", label: "FT" },
      { key: "3ps", label: "3PS" },
      { key: "Hnd", label: "HND" },
      { key: "Pas", label: "PAS" },
      { key: "Orb", label: "ORB" },
      { key: "Drb", label: "DRB" },
      { key: "Psd", label: "PSD" },
      { key: "Prd", label: "PRD" },
      { key: "Stl", label: "STL" },
      { key: "Blk", label: "BLK" },
      { key: "Qkn", label: "QKN" },
      { key: "Jmp", label: "JMP" },
      { key: "Str", label: "STR" },
      { key: "Sta", label: "STA" }
    ];
    var sortOptions = [
      { key: "name", label: "Player" },
      { key: "teamName", label: "Team" },
      { key: "pos", label: "Position" },
      { key: "age", label: "Age" },
      { key: "ht", label: "Height" },
      { key: "Ins", label: "INS" },
      { key: "Jps", label: "JPS" },
      { key: "Fts", label: "FT" },
      { key: "3ps", label: "3PS" },
      { key: "Pas", label: "PAS" },
      { key: "Orb", label: "ORB" },
      { key: "Drb", label: "DRB" },
      { key: "Stl", label: "STL" },
      { key: "Blk", label: "BLK" },
      { key: "Sta", label: "STA" }
    ];
    var container = document.createElement("section");
    var title = document.createElement("h1");
    var titleRule = document.createElement("hr");
    var sectionTitle = document.createElement("div");
    var subtitle = document.createElement("p");
    var controls = document.createElement("div");
    var searchControl = document.createElement("div");
    var searchLabel = document.createElement("label");
    var searchInput = document.createElement("input");
    var teamControl = document.createElement("div");
    var teamLabel = document.createElement("label");
    var teamSelect = document.createElement("select");
    var posControl = document.createElement("div");
    var posLabel = document.createElement("label");
    var posSelect = document.createElement("select");
    var sortControl = document.createElement("div");
    var sortLabel = document.createElement("label");
    var sortSelect = document.createElement("select");
    var directionControl = document.createElement("div");
    var directionLabel = document.createElement("label");
    var directionSelect = document.createElement("select");
    var clearButton = document.createElement("button");
    var topScroll = document.createElement("div");
    var topScrollInner = document.createElement("div");
    var tableWrap = document.createElement("div");
    var table = document.createElement("table");
    var colgroup = document.createElement("colgroup");
    var tbody = document.createElement("tbody");
    var headRow = document.createElement("tr");
    var state = {
      query: "",
      team: "",
      pos: "",
      sortKey: "name",
      sortDirection: "asc"
    };

    container.className = "waiver-database";
    title.className = "waiver-database__title";
    titleRule.className = "waiver-database__title-rule";
    sectionTitle.className = "waiver-database__section-title";
    subtitle.className = "waiver-database__subtitle";
    controls.className = "waiver-database__controls";
    searchControl.className = "waiver-database__control waiver-database__control--search";
    teamControl.className = "waiver-database__control";
    posControl.className = "waiver-database__control";
    sortControl.className = "waiver-database__control";
    directionControl.className = "waiver-database__control";
    clearButton.className = "waiver-database__clear";
    topScroll.className = "waiver-database__top-scroll";
    topScrollInner.className = "waiver-database__top-scroll-inner";
    tableWrap.className = "waiver-database__table-wrap";
    table.className = "waiver-database__table";

    title.textContent = "Waiver Wire";
    sectionTitle.textContent = "Attributes";
    subtitle.textContent = players.length + " players shown from the shared player database.";

    searchLabel.textContent = "Search";
    searchInput.type = "search";
    searchInput.placeholder = "Player or team";

    teamLabel.textContent = "Team";
    posLabel.textContent = "Position";
    sortLabel.textContent = "Sort By";
    directionLabel.textContent = "Order";
    clearButton.type = "button";
    clearButton.textContent = "Clear";

    appendSelectOption(teamSelect, "", "All Teams");
    uniqueValues(players, "teamName").forEach(function (teamName) {
      appendSelectOption(teamSelect, teamName, teamName);
    });

    appendSelectOption(posSelect, "", "All Positions");
    uniqueValues(players, "pos").forEach(function (pos) {
      appendSelectOption(posSelect, pos, pos);
    });

    sortOptions.forEach(function (option) {
      appendSelectOption(sortSelect, option.key, option.label);
    });

    appendSelectOption(directionSelect, "asc", "Ascending");
    appendSelectOption(directionSelect, "desc", "Descending");

    searchControl.appendChild(searchLabel);
    searchControl.appendChild(searchInput);
    teamControl.appendChild(teamLabel);
    teamControl.appendChild(teamSelect);
    posControl.appendChild(posLabel);
    posControl.appendChild(posSelect);
    sortControl.appendChild(sortLabel);
    sortControl.appendChild(sortSelect);
    directionControl.appendChild(directionLabel);
    directionControl.appendChild(directionSelect);

    controls.appendChild(searchControl);
    controls.appendChild(teamControl);
    controls.appendChild(posControl);
    controls.appendChild(sortControl);
    controls.appendChild(directionControl);
    controls.appendChild(clearButton);

    columns.forEach(function (column) {
      var col = document.createElement("col");
      var cell = document.createElement("td");
      var indicator = document.createElement("span");

      if (column.key === "name") {
        col.className = "player";
      } else if (column.key === "teamName") {
        col.className = "team";
      } else if (column.key === "ht" || column.key === "wt") {
        col.className = "medium";
      } else {
        col.className = "small";
      }

      cell.className = "header";
      if (column.key === "name" || column.key === "teamName") {
        cell.classList.add("header--left");
      }
      cell.textContent = column.label;
      cell.dataset.sortKey = column.key;
      cell.classList.add("header--sortable");
      indicator.className = "waiver-database__sort-indicator";
      indicator.textContent = column.key === state.sortKey ? "v" : "-";
      cell.appendChild(indicator);
      cell.addEventListener("click", function () {
        if (state.sortKey === column.key) {
          state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = column.key;
          state.sortDirection = "asc";
        }

        sortSelect.value = state.sortKey;
        directionSelect.value = state.sortDirection;
        renderBody();
      });

      colgroup.appendChild(col);
      headRow.appendChild(cell);
    });

    tbody.appendChild(headRow);

    topScroll.appendChild(topScrollInner);
    table.appendChild(colgroup);
    table.appendChild(tbody);
    container.appendChild(title);
    container.appendChild(titleRule);
    container.appendChild(sectionTitle);
    container.appendChild(subtitle);
    container.appendChild(controls);
    container.appendChild(topScroll);
    tableWrap.appendChild(table);
    container.appendChild(tableWrap);

    searchInput.addEventListener("input", function () {
      state.query = searchInput.value.trim().toLowerCase();
      renderBody();
    });

    teamSelect.addEventListener("change", function () {
      state.team = teamSelect.value;
      renderBody();
    });

    posSelect.addEventListener("change", function () {
      state.pos = posSelect.value;
      renderBody();
    });

    sortSelect.addEventListener("change", function () {
      state.sortKey = sortSelect.value;
      renderBody();
    });

    directionSelect.addEventListener("change", function () {
      state.sortDirection = directionSelect.value;
      renderBody();
    });

    clearButton.addEventListener("click", function () {
      state.query = "";
      state.team = "";
      state.pos = "";
      state.sortKey = "name";
      state.sortDirection = "asc";
      searchInput.value = "";
      teamSelect.value = "";
      posSelect.value = "";
      sortSelect.value = "name";
      directionSelect.value = "asc";
      renderBody();
    });

    sortSelect.value = state.sortKey;
    directionSelect.value = state.sortDirection;
    syncWaiverScrollbars(topScroll, tableWrap, topScrollInner, table);
    renderBody();
    updateWaiverTableFontSize(table);

    window.addEventListener("resize", function () {
      updateWaiverTableFontSize(table);
      syncWaiverScrollbars(topScroll, tableWrap, topScrollInner, table);
    });

    return container;

    function renderBody() {
      clearDataRows(tbody);

      applyWaiverHeaderState(headRow, state);

      var visiblePlayers = getVisiblePlayers(players, state);

      visiblePlayers.forEach(function (player, index) {
        var row = document.createElement("tr");
        row.className = index % 2 === 0 ? "row1" : "row2";

        columns.forEach(function (column) {
          var cell = document.createElement("td");
          cell.className = "main";

          if (column.key === "name") {
            var link = document.createElement("a");
            link.className = "waiver-database__player-link";
            link.href = normalizePlayerUrl(player.url);
            link.textContent = player.name || "";
            cell.classList.add("main--left");
            cell.appendChild(link);
          } else if (column.key === "teamName") {
            cell.classList.add("main--left");
            cell.textContent = player[column.key] || "";
          } else {
            cell.textContent = player[column.key] || "";
          }

          row.appendChild(cell);
        });

        tbody.appendChild(row);
      });

      subtitle.textContent = visiblePlayers.length + " players shown from the shared player database.";
      updateWaiverTableFontSize(table);
      syncWaiverScrollbars(topScroll, tableWrap, topScrollInner, table);
    }
  }

  function updateWaiverTableFontSize(table) {
    if (!table) {
      return;
    }

    var playerCol = table.querySelector("col.player");
    var teamCol = table.querySelector("col.team");
    var smallCol = table.querySelector("col.small");
    var playerWidth = playerCol ? parseInt(playerCol.style.width || playerCol.getAttribute("width") || 150, 10) : 150;
    var teamWidth = teamCol ? parseInt(teamCol.style.width || teamCol.getAttribute("width") || 110, 10) : 110;
    var statWidth = smallCol ? parseInt(smallCol.style.width || smallCol.getAttribute("width") || 42, 10) : 42;
    var containerWidth = table.parentElement ? table.parentElement.clientWidth : 0;
    var tableWidth = Math.max(table.scrollWidth, 1);
    var scale = containerWidth > 0 ? Math.min(containerWidth / tableWidth, 1) : 1;
    var baseHeader = 8;
    var baseCell = 9;
    var compressedHeader = Math.max(7, Math.min(baseHeader, Math.floor((statWidth * scale) / 4.3)));
    var compressedCell = Math.max(7, Math.min(baseCell, Math.floor((Math.min(playerWidth, teamWidth, statWidth) * scale) / 4.7)));

    table.style.setProperty("--waiver-header-font-size", compressedHeader + "px");
    table.style.setProperty("--waiver-cell-font-size", compressedCell + "px");
  }

  function syncWaiverScrollbars(topScroll, tableWrap, topScrollInner, table) {
    if (!topScroll || !tableWrap || !topScrollInner || !table) {
      return;
    }

    topScrollInner.style.width = table.scrollWidth + "px";

    if (!topScroll.dataset.bound) {
      topScroll.addEventListener("scroll", function () {
        tableWrap.scrollLeft = topScroll.scrollLeft;
      });

      tableWrap.addEventListener("scroll", function () {
        topScroll.scrollLeft = tableWrap.scrollLeft;
      });

      topScroll.dataset.bound = "true";
    }
  }

  function appendSelectOption(select, value, label) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  function uniqueValues(items, key) {
    var values = items
      .map(function (item) {
        return item[key] || "";
      })
      .filter(Boolean)
      .filter(function (value, index, array) {
        return array.indexOf(value) === index;
      });

    values.sort(function (a, b) {
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });

    return values;
  }

  function clearDataRows(tbody) {
    while (tbody.children.length > 1) {
      tbody.removeChild(tbody.lastChild);
    }
  }

  function applyWaiverHeaderState(headRow, state) {
    Array.from(headRow.children).forEach(function (cell) {
      var indicator = cell.querySelector(".waiver-database__sort-indicator");
      if (!indicator) {
        return;
      }

      if (cell.dataset.sortKey === state.sortKey) {
        indicator.textContent = state.sortDirection === "asc" ? "v" : "^";
        indicator.style.opacity = "1";
      } else {
        indicator.textContent = "-";
        indicator.style.opacity = "0.55";
      }
    });
  }

  function getVisiblePlayers(players, state) {
    return players
      .filter(function (player) {
        var haystack = [player.name, player.teamName, player.pos].join(" ").toLowerCase();
        var matchesQuery = !state.query || haystack.indexOf(state.query) !== -1;
        var matchesTeam = !state.team || player.teamName === state.team;
        var matchesPos = !state.pos || player.pos === state.pos;
        return matchesQuery && matchesTeam && matchesPos;
      })
      .sort(function (a, b) {
        return compareWaiverPlayers(a, b, state.sortKey, state.sortDirection);
      });
  }

  function compareWaiverPlayers(a, b, sortKey, sortDirection) {
    var direction = sortDirection === "desc" ? -1 : 1;
    var aValue = a[sortKey] || "";
    var bValue = b[sortKey] || "";
    var aHeight = parseHeightValue(aValue);
    var bHeight = parseHeightValue(bValue);
    var aNumber = parseFloat(aValue);
    var bNumber = parseFloat(bValue);

    if (aHeight !== null && bHeight !== null) {
      return (aHeight - bHeight) * direction;
    }

    if (!isNaN(aNumber) && !isNaN(bNumber)) {
      return (aNumber - bNumber) * direction;
    }

    return aValue.toString().localeCompare(bValue.toString(), undefined, { sensitivity: "base" }) * direction;
  }

  function parseHeightValue(value) {
    var match = String(value || "").match(/^(\d+)-(\d+)$/);
    if (!match) {
      return null;
    }

    return parseInt(match[1], 10) * 12 + parseInt(match[2], 10);
  }

  function buildTeamMap(teams) {
    return (teams || []).reduce(function (map, team) {
      if (team && team.id) {
        map[team.id] = team.name || team.id;
      }
      return map;
    }, {});
  }

  function enrichPlayers(players, teamMap) {
    return (players || []).map(function (player) {
      var copy = {};

      Object.keys(player || {}).forEach(function (key) {
        copy[key] = player[key];
      });

      copy.teamName = teamMap[player.team] || player.team || "";
      return copy;
    });
  }

  function renderResults(dropdown, matches, navigateToPlayer) {
    dropdown.innerHTML = "";

    if (!matches.length) {
      var empty = document.createElement("div");
      empty.className = "player-search__empty";
      empty.textContent = "No matching players";
      dropdown.appendChild(empty);
      dropdown.hidden = false;
      return;
    }

    matches.forEach(function (player) {
      var option = document.createElement("button");
      option.type = "button";
      option.className = "player-search__option";
      var metaBits = [player.teamName, player.pos ? player.pos : null, player.age ? "Age " + player.age : null].filter(Boolean);
      var submetaBits = [player.ht, player.wt ? player.wt + " lbs" : null].filter(Boolean);
      option.innerHTML =
        '<span class="player-search__name">' + escapeHtml(player.name) + "</span>" +
        '<span class="player-search__meta">' +
        escapeHtml(metaBits.join(" | ")) +
        "</span>";
      if (submetaBits.length) {
        option.innerHTML +=
          '<span class="player-search__submeta">' +
          escapeHtml(submetaBits.join(" | ")) +
          "</span>";
      }
      option.addEventListener("click", function () {
        navigateToPlayer(player);
      });
      dropdown.appendChild(option);
    });

    dropdown.hidden = false;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initPlayerSearch(teamMap) {
    var root = ensureSearchRoot();
    if (!root) {
      return;
    }

    ensureSearchStyles();
    createSearchMarkup(root);

    var input = document.getElementById("player-search-input");
    var dropdown = document.getElementById("player-search-dropdown");

    loadJsonData("players.json")
      .then(function (players) {
        var searchIndex = enrichPlayers(players, teamMap).map(function (player) {
          return {
            name: player.name || "",
            url: normalizePlayerUrl(player.url),
            team: player.team || "",
            teamName: player.teamName || "",
            pos: player.pos || "",
            age: player.age || "",
            ht: player.ht || "",
            wt: player.wt || "",
            searchName: (player.name || "").toLowerCase()
          };
        });

        function navigateToPlayer(player) {
          window.location.href = player.url;
        }

        input.addEventListener("input", function () {
          var query = input.value.trim().toLowerCase();
          if (!query) {
            dropdown.hidden = true;
            dropdown.innerHTML = "";
            return;
          }

          var matches = searchIndex
            .filter(function (player) {
              return player.searchName.indexOf(query) !== -1;
            })
            .slice(0, 8);

          renderResults(dropdown, matches, navigateToPlayer);
        });

        input.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            var query = input.value.trim().toLowerCase();
            var firstMatch = searchIndex.find(function (player) {
              return player.searchName.indexOf(query) !== -1;
            });

            if (firstMatch) {
              event.preventDefault();
              navigateToPlayer(firstMatch);
            }
          } else if (event.key === "Escape") {
            dropdown.hidden = true;
          }
        });

        document.addEventListener("click", function (event) {
          if (!root.contains(event.target)) {
            dropdown.hidden = true;
          }
        });
      })
      .catch(function () {
        root.innerHTML = "";
      });
  }

  function initWaiverDatabaseTable(teamMap) {
    var root = ensureWaiverTableRoot();
    if (!root) {
      return;
    }

    ensureWaiverTableStyles();

    loadJsonData("players.json")
      .then(function (players) {
        var enrichedPlayers = enrichPlayers(players, teamMap);

        root.innerHTML = "";
        root.appendChild(buildWaiverTable(enrichedPlayers));
      })
      .catch(function () {
        root.innerHTML = "";
      });
  }

  function initPlayerRatings() {
    if (!isPlayerPage()) {
      return;
    }

    loadJsonData("players.json")
      .then(function (players) {
        injectPlayerRatingPills(findCurrentPlayerRecord(players));
      })
        .catch(function () {
          injectPlayerRatingPills(null);
        });
  }

  function initRosterRatings() {
    if (!isRosterPage()) {
      return;
    }

    loadJsonData("players.json")
      .then(function (players) {
        enhanceRosterRatingTables(players);
      })
      .catch(function () {
        enhanceRosterRatingTables([]);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    enableMenuFrameScroll();
    initResponsiveFrameMenu();
    markStandingsPage();
    applyRosterHeaderPhoto();
    ensureCapReportMenuLink();
    ensureDepthChartsMenuLink();
    enhanceLeagueMenu();
    initPlayerRatings();
    initRosterRatings();
    loadJsonData("teams.json")
      .then(function (teams) {
        var teamMap = buildTeamMap(teams);
        initPlayerSearch(teamMap);
        initWaiverDatabaseTable(teamMap);
      })
      .catch(function () {
        initPlayerSearch({});
        initWaiverDatabaseTable({});
      });
  });
})();
