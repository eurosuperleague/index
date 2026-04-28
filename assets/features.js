(function () {
  "use strict";

  var SEARCH_STYLE_ID = "player-search-styles";

  function isNestedPage() {
    return /\/(players|rosters|boxes)\//i.test(window.location.pathname);
  }

  function getPlayersJsonPath() {
    return isNestedPage() ? "../1build/players.json" : "1build/players.json";
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

  function loadPlayersData() {
    var jsonPath = getPlayersJsonPath();

    return fetch(jsonPath)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load player data");
        }
        return response.json();
      })
      .catch(function () {
        return loadPlayersDataFromFrame(jsonPath);
      });
  }

  function loadPlayersDataFromFrame(jsonPath) {
    return new Promise(function (resolve, reject) {
      var frame = document.createElement("iframe");
      frame.hidden = true;
      frame.setAttribute("aria-hidden", "true");
      frame.src = jsonPath;

      frame.addEventListener("load", function () {
        try {
          var frameDocument = frame.contentDocument || frame.contentWindow.document;
          var raw = frameDocument && frameDocument.body ? frameDocument.body.textContent : "";
          frame.remove();

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
      ".player-search__option { display: block; width: 100%; padding: 9px 11px; border: 0; border-bottom: 1px solid #eef2f7; background: transparent; color: #0f172a; text-align: left; cursor: pointer; }",
      ".player-search__option:last-child { border-bottom: 0; }",
      ".player-search__option:hover, .player-search__option:focus { background: #f8fafc; outline: none; }",
      ".player-search__name { display: block; font: 600 12px/1.3 Inter, Tahoma, Arial, sans-serif; }",
      ".player-search__meta { display: block; margin-top: 2px; font: 500 10px/1.3 Inter, Tahoma, Arial, sans-serif; color: #64748b; }",
      ".player-search__empty { padding: 10px 11px; font: 500 11px/1.4 Inter, Tahoma, Arial, sans-serif; color: #64748b; }",
      "@media (max-width: 900px) { #player-search-root { position: sticky; top: 8px; right: auto; margin: 0 0 12px auto; } .player-search { padding: 8px; } }"
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

  function markStandingsPage() {
    if (shouldAttachStandingsSearch()) {
      document.body.classList.add("page-standings");
    }
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
      option.innerHTML =
        '<span class="player-search__name">' + escapeHtml(player.name) + "</span>" +
        '<span class="player-search__meta">' +
        escapeHtml([player.pos, player.team].filter(Boolean).join(" | ")) +
        "</span>";
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

  function initPlayerSearch() {
    var root = ensureSearchRoot();
    if (!root) {
      return;
    }

    ensureSearchStyles();
    createSearchMarkup(root);

    var input = document.getElementById("player-search-input");
    var dropdown = document.getElementById("player-search-dropdown");

    loadPlayersData()
      .then(function (players) {
        var searchIndex = (players || []).map(function (player) {
          return {
            name: player.name || "",
            url: normalizePlayerUrl(player.url),
            team: player.team || "",
            pos: player.pos || "",
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

  document.addEventListener("DOMContentLoaded", function () {
    markStandingsPage();
    initPlayerSearch();
  });
})();
