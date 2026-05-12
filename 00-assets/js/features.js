(function () {
  "use strict";

  var SEARCH_STYLE_ID = "player-search-styles";
  var WAIVER_TABLE_STYLE_ID = "waiver-table-styles";
  var PLAYER_RATING_STYLE_ID = "player-rating-pill-styles";
  var ROSTER_RATING_STYLE_ID = "roster-rating-pill-styles";
  var PLAYER_PREVIEW_STYLE_ID = "player-preview-pill-styles";
  var MENU_STYLE_ID = "league-menu-enhancement-styles";
  var RESPONSIVE_MENU_STYLE_ID = "responsive-menu-toggle-styles";
  var MENU_BREAKPOINT = 760;
  var ZOOMABLE_VIEWPORT = "width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes";
  var SETTINGS_KEY = "leagueSiteSettings";
  var SETTINGS_STYLE_ID = "league-settings-styles";
  var PREFERENCE_STYLE_ID = "league-preference-styles";

  function getSettings() {
    try {
      return JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function saveSettings(settings) {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings || {}));
  }

  function ensureZoomableViewport() {
    var viewport = document.querySelector('meta[name="viewport"]');

    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head.appendChild(viewport);
    }

    viewport.setAttribute("content", ZOOMABLE_VIEWPORT);
  }

  function isNestedPage() {
    return /\/(players|rosters|boxes)\//i.test(window.location.pathname);
  }

  function isAssetHtmlPage() {
    return /\/00-assets\/html\//i.test(window.location.pathname) || /\\00-assets\\html\\/i.test(window.location.pathname);
  }

  function getBuildJsonPath(filename) {
    if (isNestedPage()) {
      return "../00-build/database/" + filename;
    }

    if (isAssetHtmlPage()) {
      return "../../00-build/database/" + filename;
    }

    return "00-build/database/" + filename;
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

  function isSettingsPage() {
    return /\/settings\.htm$/i.test(window.location.pathname) || /\\settings\.htm$/i.test(window.location.pathname);
  }

  function isPlayerPage() {
    return /\/players\/player\d+\.htm$/i.test(window.location.pathname) || /\\players\\player\d+\.htm$/i.test(window.location.pathname);
  }

  function isRosterPage() {
    return /\/rosters\/roster\d+\.htm$/i.test(window.location.pathname) || /\\rosters\\roster\d+\.htm$/i.test(window.location.pathname);
  }

  function shouldUseLegacyViewport() {
    var path = window.location.pathname;
    var rootLegacyPagePattern = /\/(schedule|leaders|playoffleaders|teamleaders|transactions|injuries|freeagents|potentialfreeagents|capreport|draft|staff|awards|seasonawards|champs|humancoaches)\.htm$/i;
    var nestedLegacyPagePattern = /\/(players|boxes|coaches)\/.+\.htm$/i;
    var windowsRootLegacyPagePattern = /\\(schedule|leaders|playoffleaders|teamleaders|transactions|injuries|freeagents|potentialfreeagents|capreport|draft|staff|awards|seasonawards|champs|humancoaches)\.htm$/i;
    var windowsNestedLegacyPagePattern = /\\(players|boxes|coaches)\\.+\.htm$/i;

    return rootLegacyPagePattern.test(path) || nestedLegacyPagePattern.test(path) || windowsRootLegacyPagePattern.test(path) || windowsNestedLegacyPagePattern.test(path);
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
    var menuFrame = document.querySelector('frame[name="Options"], iframe[name="Options"]');

    if (!menuFrame) {
      return;
    }

    menuFrame.setAttribute("scrolling", "auto");
    menuFrame.style.overflow = "auto";
  }

  function getParentShellDocument() {
    try {
      if (window.parent === window || !window.parent.document) {
        return null;
      }

      return window.parent.document.querySelector(".site-shell") ? window.parent.document : null;
    } catch (error) {
      return null;
    }
  }

  function setParentMenuOpen(isOpen) {
    var parentDocument = getParentShellDocument();

    if (!parentDocument || !parentDocument.body) {
      return;
    }

    parentDocument.body.classList.toggle("league-menu-open", !!isOpen);
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
    var parentDocument = getParentShellDocument();

    if (!parentDocument || !parentDocument.body) {
      return false;
    }

    return parentDocument.body.classList.contains("league-menu-open");
  }

  function ensurePreferenceStyles() {
    if (document.getElementById(PREFERENCE_STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = PREFERENCE_STYLE_ID;
    style.textContent = [
      "html.league-pref-text-small body { font-size: 92%; }",
      "html.league-pref-text-large body { font-size: 112%; }",
      "html.league-pref-density-compact td.main, html.league-pref-density-compact td.header { padding-top: 3px !important; padding-bottom: 3px !important; }",
      "html.league-pref-density-spacious td.main, html.league-pref-density-spacious td.header { padding-top: 8px !important; padding-bottom: 8px !important; }",
      ".league-favorite-row > td { background-color: #fff3bf !important; }",
      ".league-favorite-row a { font-weight: 800 !important; }",
      "body.page-settings { background: #f4f2ec !important; color: #172033; font-family: Georgia, 'Times New Roman', serif; margin: 0; }"
    ].join("");
    document.head.appendChild(style);
  }

  function applySavedPreferences() {
    var settings = getSettings();
    var root = document.documentElement;

    ensurePreferenceStyles();
    root.classList.remove(
      "league-pref-text-small",
      "league-pref-text-normal",
      "league-pref-text-large",
      "league-pref-density-compact",
      "league-pref-density-normal",
      "league-pref-density-spacious"
    );

    root.classList.add("league-pref-text-" + (settings.textSize || "normal"));
    root.classList.add("league-pref-density-" + (settings.tableDensity || "normal"));
  }

  function highlightFavoriteTeam(teams) {
    var settings = getSettings();
    var favorite = normalizeName(settings.favoriteTeam);
    var favoriteTeam;
    var favoritePattern;

    if (!favorite || isMenuPage() || isSettingsPage()) {
      return;
    }

    favoriteTeam = (teams || []).find(function (team) {
      return normalizeName(team && team.name) === favorite;
    });

    if (!favoriteTeam) {
      return;
    }

    favoritePattern = new RegExp("(^|[^a-z0-9])" + favorite.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z0-9]|$)", "i");

    Array.prototype.slice.call(document.querySelectorAll("tr.row1, tr.row2")).forEach(function (row) {
      var directCells = Array.prototype.slice.call(row.children);
      var hasNestedTable = directCells.some(function (cell) {
        return cell.querySelector && cell.querySelector("table");
      });
      var links = Array.prototype.slice.call(row.querySelectorAll("a"));
      var linkMatch = links.some(function (link) {
        return normalizeName(link.textContent) === favorite;
      });
      var rowText = normalizeName(row.textContent);

      if (hasNestedTable || !directCells.some(function (cell) { return cell.classList && cell.classList.contains("main"); })) {
        return;
      }

      if (linkMatch || favoritePattern.test(rowText)) {
        row.classList.add("league-favorite-row");
      }
    });
  }

  function isParentCompactWidth(parentWindow) {
    var screenWidth = parentWindow.screen && parentWindow.screen.width ? parentWindow.screen.width : parentWindow.innerWidth;

    return Math.min(parentWindow.innerWidth, screenWidth) <= MENU_BREAKPOINT;
  }

  function syncResponsiveMenuState(button) {
    var parentWindow;
    var isNarrow;

    try {
      parentWindow = window.parent;
      isNarrow = isParentCompactWidth(parentWindow);
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
    var parentDocument = getParentShellDocument();
    var button;

    if (
      !parentDocument ||
      isMenuPage() ||
      document.querySelector(".league-menu-hamburger") ||
      parentDocument.querySelector(".site-menu-toggle")
    ) {
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

  function ensureSettingsStyles() {
    if (document.getElementById(SETTINGS_STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = SETTINGS_STYLE_ID;
    style.textContent = [
      ".league-settings { max-width: 920px; margin: 0 auto; padding: 34px 22px 46px; }",
      ".league-settings__eyebrow { color: #8b6f32; font: 800 11px/1.2 Inter, Tahoma, Arial, sans-serif; letter-spacing: 0.14em; margin: 0 0 8px; text-transform: uppercase; }",
      ".league-settings__title { color: #121826; font: 800 34px/1.02 Georgia, 'Times New Roman', serif; margin: 0; }",
      ".league-settings__lede { color: #4c5870; font: 500 15px/1.45 Inter, Tahoma, Arial, sans-serif; margin: 10px 0 22px; max-width: 650px; }",
      ".league-settings__grid { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); }",
      ".league-settings__card { background: #fffdf7; border: 1px solid #d7c9a8; box-shadow: 0 8px 20px rgba(23, 32, 51, 0.08); padding: 16px; }",
      ".league-settings__card label { color: #172033; display: block; font: 800 12px/1.2 Inter, Tahoma, Arial, sans-serif; letter-spacing: 0.08em; margin-bottom: 8px; text-transform: uppercase; }",
      ".league-settings__card p { color: #5b6475; font: 500 13px/1.35 Inter, Tahoma, Arial, sans-serif; margin: 8px 0 0; }",
      ".league-settings select { background: #ffffff; border: 1px solid #a99b78; color: #172033; font: 600 14px/1.2 Inter, Tahoma, Arial, sans-serif; min-height: 38px; padding: 7px 9px; width: 100%; }",
      ".league-settings__actions { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }",
      ".league-settings__button { background: #111b36; border: 0; color: #fff; cursor: pointer; font: 800 12px/1 Inter, Tahoma, Arial, sans-serif; letter-spacing: 0.08em; padding: 12px 16px; text-transform: uppercase; }",
      ".league-settings__button--secondary { background: transparent; border: 1px solid #111b36; color: #111b36; }",
      ".league-settings__status { color: #2f6b3b; font: 700 13px/1.3 Inter, Tahoma, Arial, sans-serif; min-height: 18px; }",
      "@media (max-width: 720px) { .league-settings { padding: 26px 14px 36px; } .league-settings__grid { grid-template-columns: 1fr; } .league-settings__title { font-size: 28px; } }"
    ].join("");
    document.head.appendChild(style);
  }

  function createOption(value, label, selectedValue) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = value === selectedValue;
    return option;
  }

  function addSettingsSelect(form, config) {
    var card = document.createElement("section");
    var label = document.createElement("label");
    var select = document.createElement("select");
    var help = document.createElement("p");

    card.className = "league-settings__card";
    label.setAttribute("for", config.id);
    label.textContent = config.label;
    select.id = config.id;
    select.name = config.name;
    config.options.forEach(function (option) {
      select.appendChild(createOption(option.value, option.label, config.value));
    });
    help.textContent = config.help;

    card.appendChild(label);
    card.appendChild(select);
    card.appendChild(help);
    form.appendChild(card);
  }

  function buildTeamOptions(teams, selectedValue) {
    var options = [{ value: "", label: "None" }];

    (teams || []).slice().sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""));
    }).forEach(function (team) {
      if (team && team.name) {
        options.push({ value: team.name, label: team.name });
      }
    });

    return options.map(function (option) {
      return {
        value: option.value,
        label: option.label,
        selected: option.value === selectedValue
      };
    });
  }

  function initSettingsPage(teams) {
    var root = document.getElementById("league-settings-root");
    var settings = getSettings();
    var form;
    var status;

    if (!isSettingsPage() || !root) {
      return;
    }

    ensureSettingsStyles();
    document.body.classList.add("page-settings");
    root.innerHTML = [
      '<div class="league-settings">',
      '  <p class="league-settings__eyebrow">League Site</p>',
      '  <h1 class="league-settings__title">Settings</h1>',
      '  <p class="league-settings__lede">Tune the site for how you actually browse it. These preferences save in this browser only.</p>',
      '  <form class="league-settings__grid" id="league-settings-form"></form>',
      '  <div class="league-settings__actions">',
      '    <button class="league-settings__button" id="league-settings-save" type="button">Save Settings</button>',
      '    <button class="league-settings__button league-settings__button--secondary" id="league-settings-reset" type="button">Reset</button>',
      '    <span class="league-settings__status" id="league-settings-status" aria-live="polite"></span>',
      '  </div>',
      '</div>'
    ].join("");

    form = document.getElementById("league-settings-form");
    status = document.getElementById("league-settings-status");

    addSettingsSelect(form, {
      id: "setting-default-page",
      name: "defaultPage",
      label: "Default Landing Page",
      value: settings.defaultPage || "standings.htm",
      help: "The page the main league frame opens to first.",
      options: [
        { value: "standings.htm", label: "Standings" },
        { value: "schedule.htm", label: "Schedule" },
        { value: "00-assets/html/league%20dashboard.htm", label: "League Dashboard" },
        { value: "leaders.htm", label: "League Leaders" },
        { value: "teamleaders.htm", label: "Team Leaders" },
        { value: "transactions.htm", label: "Transactions" },
        { value: "freeagents.htm", label: "Free Agents" },
        { value: "awards.htm", label: "Awards" }
      ]
    });
    addSettingsSelect(form, {
      id: "setting-favorite-team",
      name: "favoriteTeam",
      label: "Favorite Team",
      value: settings.favoriteTeam || "",
      help: "Highlights rows where your team appears.",
      options: buildTeamOptions(teams, settings.favoriteTeam || "")
    });
    addSettingsSelect(form, {
      id: "setting-text-size",
      name: "textSize",
      label: "Text Size",
      value: settings.textSize || "normal",
      help: "Adjusts general readability across league pages.",
      options: [
        { value: "small", label: "Small" },
        { value: "normal", label: "Normal" },
        { value: "large", label: "Large" }
      ]
    });
    addSettingsSelect(form, {
      id: "setting-density",
      name: "tableDensity",
      label: "Table Density",
      value: settings.tableDensity || "normal",
      help: "Changes vertical spacing in generated tables.",
      options: [
        { value: "compact", label: "Compact" },
        { value: "normal", label: "Normal" },
        { value: "spacious", label: "Spacious" }
      ]
    });
    addSettingsSelect(form, {
      id: "setting-roster-ratings",
      name: "rosterRatingDisplay",
      label: "Roster Rating Display",
      value: settings.rosterRatingDisplay || "colors",
      help: "Shows Cur/Fut as readable rating pills on roster attribute tables.",
      options: [
        { value: "colors", label: "Color Boxes" },
        { value: "numbers", label: "Number Pills" }
      ]
    });
    document.getElementById("league-settings-save").addEventListener("click", function () {
      var nextSettings = {};

      Array.prototype.slice.call(form.elements).forEach(function (field) {
        if (field.name) {
          nextSettings[field.name] = field.value;
        }
      });

      nextSettings.theme = "classic";
      nextSettings.spoilerMode = "show";
      saveSettings(nextSettings);
      applySavedPreferences();
      status.textContent = "Saved. Reload the main page to apply default page/menu startup changes.";
    });

    document.getElementById("league-settings-reset").addEventListener("click", function () {
      window.localStorage.removeItem(SETTINGS_KEY);
      window.location.reload();
    });
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
          { label: "Settings", href: "00-assets/html/settings.htm" },
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

  function createRosterRatingPill(text, backgroundColor) {
    var pill = document.createElement("span");

    pill.className = "roster-rating-pill" + (text === "N/A" ? " roster-rating-pill--na" : "");
    pill.textContent = text;
    if (backgroundColor && text !== "N/A") {
      pill.style.backgroundColor = backgroundColor;
    }
    return pill;
  }

  function setRosterRatingCellDisplay(cell, value, showNumbers) {
    var text = formatRatingValue(value);
    var color = findRosterRatingColor(cell);

    setRosterRatingCell(cell, value);

    if (!showNumbers) {
      return;
    }

    cell.classList.add("roster-rating-pill-host");
    cell.innerHTML = "";
    cell.appendChild(createRosterRatingPill(text, color));
  }

  function enhanceRosterRatingTables(players) {
    if (!isRosterPage()) {
      return;
    }

    var settings = getSettings();
    var showNumbers = settings.rosterRatingDisplay === "numbers";
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

        setRosterRatingCellDisplay(curCell, player.overall, showNumbers);
        setRosterRatingCellDisplay(futCell, player.potential, showNumbers);
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

  function getPlayerFileFromUrl(url) {
    var match = String(url || "").match(/(?:^|\/)(player\d+\.htm)(?:$|[?#])/i);
    return match ? match[1].toLowerCase() : "";
  }

  function getUnifiedPlayerUrl(url) {
    var file = getPlayerFileFromUrl(url);
    var id = file ? file.replace(/\.htm$/i, "") : "";

    if (!id) {
      return normalizePlayerUrl(url);
    }

    if (isAssetHtmlPage()) {
      return "./unified-player.htm?id=" + encodeURIComponent(id);
    }

    if (isNestedPage()) {
      return "../00-assets/html/unified-player.htm?id=" + encodeURIComponent(id);
    }

    return "./00-assets/html/unified-player.htm?id=" + encodeURIComponent(id);
  }

  function ensurePlayerPreviewStyles() {
    if (document.getElementById(PLAYER_PREVIEW_STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = PLAYER_PREVIEW_STYLE_ID;
    style.textContent = [
      ".player-preview-pill { --preview-primary: #111b36; --preview-secondary: #f4d35e; --preview-ink: #10131b; position: fixed; z-index: 5000; width: min(300px, calc(100vw - 16px)); max-height: calc(100dvh - 16px); overflow: auto; -webkit-overflow-scrolling: touch; border: 1px solid color-mix(in srgb, var(--preview-primary) 35%, transparent); border-top: 4px solid var(--preview-primary); border-radius: 12px; background: #fffdf8; color: var(--preview-ink); box-shadow: 0 18px 42px rgba(15,23,42,.24); padding: 9px; font-family: Inter, Tahoma, Arial, sans-serif; overscroll-behavior: contain; }",
      ".player-preview-pill[hidden] { display: none; }",
      ".player-preview-pill__head { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; border-bottom: 1px solid #ddd5c6; padding-bottom: 8px; margin-bottom: 9px; }",
      ".player-preview-pill__name { margin: 0; font: 800 15px/1.1 Inter, Tahoma, Arial, sans-serif; color: var(--preview-primary); }",
      ".player-preview-pill__meta { margin: 3px 0 0; color: #6a5f4d; font: 700 10px/1.2 Inter, Tahoma, Arial, sans-serif; letter-spacing: .09em; text-transform: uppercase; }",
      ".player-preview-pill__rating { display: grid; gap: 3px; min-width: 52px; text-align: right; }",
      ".player-preview-pill__rating strong { color: var(--preview-primary); font-size: 18px; line-height: 1; }",
      ".player-preview-pill__rating span { color: #6a5f4d; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; font-weight: 800; }",
      ".player-preview-pill__attrs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }",
      ".player-preview-pill__col { min-width: 0; border: 1px solid #ddd5c6; background: #faf8f2; padding: 6px 5px; }",
      ".player-preview-pill__col-title { margin: 0 0 4px; color: var(--preview-primary); font-size: 8px; letter-spacing: .1em; text-transform: uppercase; font-weight: 900; }",
      ".player-preview-pill__attr { display: flex; justify-content: space-between; gap: 4px; padding: 1px 0; border-bottom: 1px solid rgba(221,213,198,.7); font-size: 10px; line-height: 1.08; }",
      ".player-preview-pill__attr:last-child { border-bottom: 0; }",
      ".player-preview-pill__attr span { color: #6a5f4d; font-weight: 800; }",
      ".player-preview-pill__attr strong { color: #10131b; font-weight: 900; }",
      ".player-preview-pill__pra { margin-top: 9px; border: 1px solid var(--preview-primary); background: linear-gradient(135deg, var(--preview-primary), color-mix(in srgb, var(--preview-primary) 78%, #000)); color: #fff; padding: 7px; }",
      ".player-preview-pill__pra-title { margin: 0 0 6px; color: rgba(255,255,255,.76); font-size: 9px; letter-spacing: .13em; text-transform: uppercase; font-weight: 900; }",
      ".player-preview-pill__pra-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }",
      ".player-preview-pill__pra-item { min-width: 0; }",
      ".player-preview-pill__pra-item span { display: block; color: rgba(255,255,255,.7); font-size: 9px; letter-spacing: .09em; text-transform: uppercase; font-weight: 800; }",
      ".player-preview-pill__pra-item strong { display: block; margin-top: 1px; color: #fff; font-size: 16px; line-height: 1; }",
      'a[href*="player"] { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }',
      "@media (max-width: 420px) { .player-preview-pill { width: calc(100vw - 12px); max-height: calc(100dvh - 12px); padding: 8px; } .player-preview-pill__head { padding-bottom: 6px; margin-bottom: 7px; } .player-preview-pill__attrs { gap: 4px; } .player-preview-pill__col { padding: 5px 4px; } .player-preview-pill__col-title { font-size: 7.5px; margin-bottom: 3px; } .player-preview-pill__attr { font-size: 9px; padding: 1px 0; } .player-preview-pill__pra { margin-top: 7px; padding: 6px; } .player-preview-pill__pra-item strong { font-size: 14px; } }"
    ].join("");
    document.head.appendChild(style);
  }

  function getPlayerPreviewAttr(player, key) {
    var aliases = {
      Ins: ["Ins", "InsideScoring"],
      Jps: ["Jps", "JumpShot"],
      Fts: ["Fts", "FtShot"],
      "3ps": ["3ps", "3pShot"],
      Hnd: ["Hnd", "Handling"],
      Pas: ["Pas", "Passing"],
      Orb: ["Orb", "OffRebounding"],
      Drb: ["Drb", "DefRebounding"],
      Psd: ["Psd", "PostDefense"],
      Prd: ["Prd", "PerimeterDefense"],
      Stl: ["Stl", "Stealing"],
      Blk: ["Blk", "Blocking"],
      Qkn: ["Qkn", "Quickness"],
      Jmp: ["Jmp", "Jumping"],
      Str: ["Str", "Strength"],
      Sta: ["Sta", "Stamina"]
    };
    var keys = aliases[key] || [key];
    var i;

    for (i = 0; i < keys.length; i += 1) {
      if (player[keys[i]] !== undefined && player[keys[i]] !== null && player[keys[i]] !== "") {
        return player[keys[i]];
      }
    }

    return "--";
  }

  function normalizePreviewTeamName(teamName) {
    return String(teamName || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
  }

  function getPlayerPreviewTheme(player) {
    var teamName = player.teamLabel || player.teamName || player.team || "";
    var teamKey = normalizePreviewTeamName(teamName);
    var themes = {
      acmilan: { primary: "#d00027", secondary: "#050505" },
      afcrichmond: { primary: "#1d2d86", secondary: "#f0c33c" },
      ajax: { primary: "#d71920", secondary: "#ffffff" },
      astonvilla: { primary: "#670e36", secondary: "#95bfe5" },
      atleticomadrid: { primary: "#c8102e", secondary: "#0b2f6b" },
      barcelona: { primary: "#004d98", secondary: "#a50044" },
      bayernmunich: { primary: "#dc052d", secondary: "#0066b2" },
      benfica: { primary: "#e30613", secondary: "#f4c430" },
      brighton: { primary: "#0057b8", secondary: "#ffffff" },
      chelsea: { primary: "#034694", secondary: "#dba111" },
      crystalpalace: { primary: "#1b458f", secondary: "#c4122e" },
      flfart: { primary: "#e83e5f", secondary: "#ffffff" },
      intermilan: { primary: "#0057b8", secondary: "#000000" },
      juventus: { primary: "#111111", secondary: "#ffffff" },
      manchestercity: { primary: "#6cabdd", secondary: "#1c2c5b" },
      manchesterunited: { primary: "#da291c", secondary: "#fbe122" },
      marseille: { primary: "#2faee0", secondary: "#ffffff" },
      monaco: { primary: "#d91023", secondary: "#ffffff" },
      parisstgermain: { primary: "#004170", secondary: "#da291c" },
      parisgermain: { primary: "#004170", secondary: "#da291c" },
      realmadrid: { primary: "#552583", secondary: "#febe10" },
      sheffieldunited: { primary: "#ee2737", secondary: "#000000" },
      sportingcp: { primary: "#00843d", secondary: "#ffffff" },
      tottenhamhotspur: { primary: "#132257", secondary: "#ffffff" },
      valencia: { primary: "#f15a24", secondary: "#000000" }
    };

    return themes[teamKey] || { primary: "#111b36", secondary: "#f4d35e" };
  }

  function applyPlayerPreviewTheme(preview, player) {
    var theme = getPlayerPreviewTheme(player);

    preview.style.setProperty("--preview-primary", theme.primary);
    preview.style.setProperty("--preview-secondary", theme.secondary);
  }

  function buildPlayerPreviewStatIndex(leadersData) {
    var index = {};
    var sections = Array.isArray(leadersData) ? leadersData : leadersData && leadersData.sections ? leadersData.sections : [];
    var wanted = { points: "points", rebounds: "rebounds", assists: "assists" };

    sections.forEach(function (section) {
      (section.categories || []).forEach(function (category) {
        var slug = String(category.slug || category.title || "").toLowerCase().replace(/\s+/g, "-");
        var statKey = wanted[slug];

        if (!statKey) {
          return;
        }

        (category.leaders || []).forEach(function (leader) {
          var file = getPlayerFileFromUrl(leader.playerUrl || leader.playerFile);

          if (!file) {
            return;
          }

          if (!index[file]) {
            index[file] = {};
          }

          if (index[file][statKey] === undefined) {
            index[file][statKey] = {
              value: leader.valueText || leader.value || "--",
              rank: leader.rank || null
            };
          }
        });
      });
    });

    return index;
  }

  function buildPlayerPreviewMarkup(player, stats) {
    var groups = [
      { title: "Offense", attrs: [["INS", "Ins"], ["JPS", "Jps"], ["3PS", "3ps"], ["HND", "Hnd"], ["PAS", "Pas"]] },
      { title: "Defense", attrs: [["ORB", "Orb"], ["DRB", "Drb"], ["PSD", "Psd"], ["PRD", "Prd"], ["STL", "Stl"], ["BLK", "Blk"]] },
      { title: "Physical", attrs: [["QKN", "Qkn"], ["JMP", "Jmp"], ["STR", "Str"], ["STA", "Sta"]] }
    ];
    var overall = player.overall || player.ovr || "--";
    var meta = [player.teamLabel || player.teamName || player.team, player.pos, player.age ? "Age " + player.age : ""].filter(Boolean).join(" | ");
    var pra = {
      points: stats && stats.points !== undefined ? stats.points : null,
      rebounds: stats && stats.rebounds !== undefined ? stats.rebounds : null,
      assists: stats && stats.assists !== undefined ? stats.assists : null
    };

    function statLabel(label, stat) {
      if (!stat || !stat.rank) {
        return label;
      }

      return label + " #" + stat.rank;
    }

    function statValue(stat) {
      return stat && stat.value !== undefined ? stat.value : "--";
    }

    return [
      '<div class="player-preview-pill__head">',
      '  <div>',
      '    <h3 class="player-preview-pill__name">' + escapeHtml(player.name || "Unknown Player") + "</h3>",
      '    <p class="player-preview-pill__meta">' + escapeHtml(meta || "Player profile") + "</p>",
      "  </div>",
      '  <div class="player-preview-pill__rating"><strong>' + escapeHtml(overall) + '</strong><span>OVR</span></div>',
      "</div>",
      '<div class="player-preview-pill__attrs">',
      groups.map(function (group) {
        return [
          '<section class="player-preview-pill__col">',
          '  <h4 class="player-preview-pill__col-title">' + group.title + "</h4>",
          group.attrs.map(function (attr) {
            return '<div class="player-preview-pill__attr"><span>' + attr[0] + "</span><strong>" + escapeHtml(getPlayerPreviewAttr(player, attr[1])) + "</strong></div>";
          }).join(""),
          "</section>"
        ].join("");
      }).join(""),
      "</div>",
      '<section class="player-preview-pill__pra">',
      '  <p class="player-preview-pill__pra-title">Top 25 Ranks</p>',
      '  <div class="player-preview-pill__pra-grid">',
      '    <div class="player-preview-pill__pra-item"><span>' + escapeHtml(statLabel("PTS", pra.points)) + "</span><strong>" + escapeHtml(statValue(pra.points)) + "</strong></div>",
      '    <div class="player-preview-pill__pra-item"><span>' + escapeHtml(statLabel("REB", pra.rebounds)) + "</span><strong>" + escapeHtml(statValue(pra.rebounds)) + "</strong></div>",
      '    <div class="player-preview-pill__pra-item"><span>' + escapeHtml(statLabel("AST", pra.assists)) + "</span><strong>" + escapeHtml(statValue(pra.assists)) + "</strong></div>",
      "  </div>",
      "</section>"
    ].join("");
  }

  function positionPlayerPreview(preview, x, y) {
    var margin = 8;
    var viewport = window.visualViewport || { width: window.innerWidth, height: window.innerHeight, offsetLeft: 0, offsetTop: 0 };
    var rect;
    var left;
    var top;
    var minLeft = viewport.offsetLeft + margin;
    var minTop = viewport.offsetTop + margin;
    var maxLeft;
    var maxTop;

    preview.hidden = false;
    rect = preview.getBoundingClientRect();
    maxLeft = viewport.offsetLeft + viewport.width - rect.width - margin;
    maxTop = viewport.offsetTop + viewport.height - rect.height - margin;
    left = minLeft <= maxLeft ? minLeft : viewport.offsetLeft;
    top = Math.max(minTop, Math.min(y + 12, maxTop));
    preview.style.left = left + "px";
    preview.style.top = top + "px";
  }

  function initPlayerPreviewPill() {
    var longPressTimer = null;
    var suppressNextClick = false;
    var startPoint = null;
    var preview;
    var playerIndex = {};
    var statIndex = {};

    function hidePreview() {
      if (preview) {
        preview.hidden = true;
      }
    }

    function findPlayerLink(target) {
      var link = target && target.closest ? target.closest('a[href*="player"]') : null;
      return link && getPlayerFileFromUrl(link.getAttribute("href")) ? link : null;
    }

    function showPreview(link, x, y) {
      var file = getPlayerFileFromUrl(link.getAttribute("href"));
      var player = playerIndex[file];

      if (!player) {
        return;
      }

      suppressNextClick = true;
      applyPlayerPreviewTheme(preview, player);
      preview.innerHTML = buildPlayerPreviewMarkup(player, statIndex[file]);
      positionPlayerPreview(preview, x, y);
    }

    ensurePlayerPreviewStyles();
    preview = document.createElement("aside");
    preview.className = "player-preview-pill";
    preview.hidden = true;
    preview.setAttribute("aria-live", "polite");
    document.body.appendChild(preview);

    Promise.all([loadJsonData("players.json"), loadJsonData("leaders.json").catch(function () { return { sections: [] }; })])
      .then(function (results) {
        (results[0] || []).forEach(function (player) {
          var file = getPlayerFileFromUrl(player.url);

          if (file) {
            playerIndex[file] = player;
          }
        });

        statIndex = buildPlayerPreviewStatIndex(results[1]);
      })
      .catch(function () {
        playerIndex = {};
        statIndex = {};
      });

    document.addEventListener("pointerdown", function (event) {
      var link = findPlayerLink(event.target);

      if (preview && !preview.hidden && (!link || !preview.contains(event.target))) {
        hidePreview();
        return;
      }

      if (!link || event.button > 0) {
        return;
      }

      startPoint = { x: event.clientX, y: event.clientY };
      window.clearTimeout(longPressTimer);
      longPressTimer = window.setTimeout(function () {
        event.preventDefault();
        showPreview(link, startPoint.x, startPoint.y);
      }, 450);
    });

    document.addEventListener("pointermove", function (event) {
      if (!startPoint) {
        return;
      }

      if (Math.abs(event.clientX - startPoint.x) > 10 || Math.abs(event.clientY - startPoint.y) > 10) {
        window.clearTimeout(longPressTimer);
      }
    });

    document.addEventListener("pointerup", function () {
      window.clearTimeout(longPressTimer);
      startPoint = null;
    });

    document.addEventListener("pointercancel", function () {
      window.clearTimeout(longPressTimer);
      startPoint = null;
    });

    document.addEventListener("click", function (event) {
      if (suppressNextClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressNextClick = false;
        return;
      }

      if (preview && !preview.hidden && !preview.contains(event.target)) {
        hidePreview();
      }
    }, true);

    document.addEventListener("contextmenu", function (event) {
      if (findPlayerLink(event.target)) {
        event.preventDefault();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        hidePreview();
      }
    });

    window.addEventListener("scroll", hidePreview, true);
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
          window.location.href = getUnifiedPlayerUrl(player.url);
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
    if (shouldUseLegacyViewport()) {
      ensureZoomableViewport();
    }

    applySavedPreferences();
    enableMenuFrameScroll();
    initResponsiveFrameMenu();
    markStandingsPage();
    applyRosterHeaderPhoto();
    ensureCapReportMenuLink();
    ensureDepthChartsMenuLink();
    enhanceLeagueMenu();
    initPlayerRatings();
    initRosterRatings();
    initPlayerPreviewPill();
    loadJsonData("teams.json")
      .then(function (teams) {
        var teamMap = buildTeamMap(teams);
        initSettingsPage(teams);
        highlightFavoriteTeam(teams);
        initPlayerSearch(teamMap);
        initWaiverDatabaseTable(teamMap);
      })
      .catch(function () {
        initSettingsPage([]);
        initPlayerSearch({});
        initWaiverDatabaseTable({});
      });
  });
})();



