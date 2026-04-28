(function () {
  "use strict";

  var SEARCH_STYLE_ID = "player-search-styles";
  var WAIVER_TABLE_STYLE_ID = "waiver-table-styles";
  var TEAM_NAMES = {
    roster5: "Arsenal",
    roster6: "Aston Villa",
    roster7: "Chelsea",
    roster8: "Everton",
    roster9: "Liverpool",
    roster10: "Manchester City",
    roster11: "Manchester United",
    roster12: "Tottenham",
    roster13: "Leicester",
    roster14: "Newcastle",
    roster15: "Nottingham Forest",
    roster16: "West Ham",
    roster17: "Wolves",
    roster18: "Leeds United",
    roster19: "Sheffield United",
    roster20: "Sunderland",
    roster21: "Bournemouth",
    roster22: "Brentford",
    roster23: "Brighton",
    roster24: "Crystal Palace",
    roster25: "Fulham",
    roster26: "Ipswich",
    roster27: "Southampton",
    roster28: "Wrexham"
  };

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
      "#waiver-database-root { margin: 0; }",
      ".waiver-database { margin: 4px 0 10px; }",
      ".waiver-database__title { margin: 0 0 6px; font: 700 20px/1.2 Inter, Tahoma, Arial, sans-serif; color: #1e293b; }",
      ".waiver-database__subtitle { margin: 0 0 8px; font: 500 12px/1.4 Inter, Tahoma, Arial, sans-serif; color: #64748b; }",
      ".waiver-database__controls { display: flex; flex-wrap: wrap; gap: 6px; align-items: end; margin: 0 0 8px; }",
      ".waiver-database__control { display: flex; flex-direction: column; gap: 4px; }",
      ".waiver-database__control--search { min-width: 220px; flex: 1 1 220px; }",
      ".waiver-database__control label { font: 700 10px/1.2 Inter, Tahoma, Arial, sans-serif; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }",
      ".waiver-database__control input, .waiver-database__control select { height: 32px; padding: 0 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #0f172a; font: 500 12px/1.2 Inter, Tahoma, Arial, sans-serif; }",
      ".waiver-database__control input:focus, .waiver-database__control select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }",
      ".waiver-database__clear { height: 32px; padding: 0 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; color: #0f172a; font: 600 12px/1 Inter, Tahoma, Arial, sans-serif; cursor: pointer; }",
      ".waiver-database__clear:hover { background: #eef2f7; }",
      ".waiver-database__table-wrap { overflow-x: auto; border-radius: 10px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); }",
      ".waiver-database__table { width: 100%; min-width: 1080px; border-collapse: collapse; background: #ffffff; table-layout: fixed; }",
      ".waiver-database__table td.header { position: sticky; top: 0; z-index: 2; padding: 6px 4px; background: #7f1d1d; color: #ffffff !important; font: 700 9px/1.15 Inter, Tahoma, Arial, sans-serif; text-align: center; white-space: nowrap; }",
      ".waiver-database__table td.header--sortable { cursor: pointer; user-select: none; }",
      ".waiver-database__table td.header:first-child, .waiver-database__table tbody td:first-child { text-align: left; }",
      ".waiver-database__table tbody td { padding: 5px 4px; border-bottom: 1px solid #e2e8f0; font: 500 9px/1.25 Inter, Tahoma, Arial, sans-serif; color: #1e293b; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
      ".waiver-database__table tbody tr:nth-child(odd) { background: #f8fafc; }",
      ".waiver-database__table tbody tr:nth-child(even) { background: #eef2f7; }",
      ".waiver-database__table tbody tr:hover { background: #e0f2fe; }",
      ".waiver-database__sort-indicator { margin-left: 3px; opacity: 0.55; font-size: 8px; }",
      ".waiver-database__table col.player { width: 170px; }",
      ".waiver-database__table col.team { width: 110px; }",
      ".waiver-database__table col.small { width: 42px; }",
      ".waiver-database__table col.medium { width: 50px; }",
      ".waiver-database__player-link { color: #0f172a; font-weight: 600; text-decoration: none; }",
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
    subtitle.className = "waiver-database__subtitle";
    controls.className = "waiver-database__controls";
    searchControl.className = "waiver-database__control waiver-database__control--search";
    teamControl.className = "waiver-database__control";
    posControl.className = "waiver-database__control";
    sortControl.className = "waiver-database__control";
    directionControl.className = "waiver-database__control";
    clearButton.className = "waiver-database__clear";
    tableWrap.className = "waiver-database__table-wrap";
    table.className = "waiver-database__table";

    title.textContent = "Player Database";
    subtitle.textContent = players.length + " players loaded from the shared player database.";

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

    table.appendChild(colgroup);
    table.appendChild(tbody);
    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(controls);
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
    renderBody();

    return container;

    function renderBody() {
      clearDataRows(tbody);

      applyWaiverHeaderState(headRow, state);

      getVisiblePlayers(players, state).forEach(function (player, index) {
        var row = document.createElement("tr");
        row.className = index % 2 === 0 ? "row1" : "row2";

        columns.forEach(function (column) {
          var cell = document.createElement("td");

          if (column.key === "name") {
            var link = document.createElement("a");
            link.className = "waiver-database__player-link";
            link.href = normalizePlayerUrl(player.url);
            link.textContent = player.name || "";
            cell.appendChild(link);
          } else {
            cell.textContent = player[column.key] || "";
          }

          row.appendChild(cell);
        });

        tbody.appendChild(row);
      });

      subtitle.textContent = getVisiblePlayers(players, state).length + " players shown from the shared player database.";
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
            teamName: TEAM_NAMES[player.team] || player.team || "",
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

  function initWaiverDatabaseTable() {
    var root = ensureWaiverTableRoot();
    if (!root) {
      return;
    }

    ensureWaiverTableStyles();

    loadPlayersData()
      .then(function (players) {
        var enrichedPlayers = (players || []).map(function (player) {
          var copy = {};

          Object.keys(player).forEach(function (key) {
            copy[key] = player[key];
          });

          copy.teamName = TEAM_NAMES[player.team] || player.team || "";
          return copy;
        });

        root.innerHTML = "";
        root.appendChild(buildWaiverTable(enrichedPlayers));
      })
      .catch(function () {
        root.innerHTML = "";
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    markStandingsPage();
    initPlayerSearch();
    initWaiverDatabaseTable();
  });
})();
