(function (root) {
  "use strict";
  var clone = function (value) { return JSON.parse(JSON.stringify(value)); };
  var missing = function (v) { return v === null || v === undefined || v === "" || v === "-" || (typeof v === "number" && !isFinite(v)); };
  function emptyFilters() { return { status: "all", team: "all", positions: [], ageMin: "", ageMax: "", overallMin: "", overallMax: "", potentialMin: "", potentialMax: "", attributes: [], match: "all", conditions: [] }; }
  function comparable(v, field) {
    if (missing(v)) { return null; }
    if (field.type === "grade") { var i = ["F", "E", "D", "C", "B", "A"].indexOf(String(v).toUpperCase()); return i < 0 ? null : i; }
    if (field.type === "text") { return String(v).toLowerCase(); }
    return Number.isFinite(Number(v)) ? Number(v) : null;
  }
  function conditionMatches(player, rule, fields) {
    var field = fields.find(function (f) { return f.key === rule.field; });
    if (!field) { return false; }
    var actual = comparable(field.get(player), field);
    if (rule.op === "missing") { return actual === null; }
    if (rule.op === "present") { return actual !== null; }
    var expected = comparable(rule.value, field), high = comparable(rule.high, field);
    if (actual === null || expected === null) { return false; }
    if (field.percent) { expected /= 100; if (high !== null) { high /= 100; } }
    switch (rule.op) {
      case "gte": return actual >= expected;
      case "lte": return actual <= expected;
      case "eq": return actual === expected;
      case "neq": return actual !== expected;
      case "between": return high !== null && actual >= expected && actual <= high;
      default: return false;
    }
  }
  function matches(player, filters, fields, expires) {
    if (filters.status !== "all" && (filters.status === "potential_fa" ? !expires(player) : player.status !== filters.status)) { return false; }
    if (filters.team !== "all" && player.team !== filters.team) { return false; }
    if (filters.positions.length && filters.positions.indexOf(player.pos) < 0) { return false; }
    if (![ ["age", "ageMin", "ageMax"], ["overall", "overallMin", "overallMax"], ["potential", "potentialMin", "potentialMax"] ].every(function (range) {
      var v = comparable(player[range[0]], {});
      return (filters[range[1]] === "" || (v !== null && v >= Number(filters[range[1]]))) && (filters[range[2]] === "" || (v !== null && v <= Number(filters[range[2]])));
    })) { return false; }
    var count = filters.attributes.filter(function (r) { return conditionMatches(player, r, fields); }).length;
    var needed = filters.match === "all" ? filters.attributes.length : Number(filters.match);
    return count >= needed && filters.conditions.every(function (r) { return conditionMatches(player, r, fields); });
  }
  function validateFilters(f, fields) {
    if (!f || typeof f !== "object" || !Array.isArray(f.positions) || !Array.isArray(f.attributes) || !Array.isArray(f.conditions)) { return "Invalid filter configuration."; }
    if (["all", "rostered", "free_agent", "potential_fa"].indexOf(f.status) < 0 || typeof f.team !== "string" || f.positions.some(function (p) { return ["PG", "SG", "SF", "PF", "C"].indexOf(p) < 0; })) { return "Invalid team, status or position."; }
    if (f.attributes.length > 50 || f.conditions.length > 50) { return "Use at most 50 conditions per section."; }
    for (var range of [["ageMin", "ageMax"], ["overallMin", "overallMax"], ["potentialMin", "potentialMax"]]) {
      var low = f[range[0]], high = f[range[1]];
      if ([low, high].some(function (v) { return v !== "" && (missing(v) || !Number.isFinite(Number(v)) || Number(v) < 0); }) || (low !== "" && high !== "" && Number(low) > Number(high))) { return "Enter valid age, overall and potential ranges (minimum ≤ maximum)."; }
    }
    if (f.match !== "all" && (!Number.isInteger(Number(f.match)) || Number(f.match) < 1 || Number(f.match) > f.attributes.length)) { return "Match count must be between 1 and the number of attributes."; }
    for (var rule of f.attributes.concat(f.conditions)) {
      var field = rule && fields.find(function (item) { return item.key === rule.field; });
      if (!field) { return "Unavailable filter field: " + (rule && rule.field); }
      var allowed = field.type === "text" ? ["eq", "neq", "missing", "present"] : ["gte", "lte", "eq", "neq", "between", "missing", "present"];
      if (allowed.indexOf(rule.op) < 0) { return "Invalid comparison for " + field.title; }
      if (rule.op !== "missing" && rule.op !== "present") {
        var a = comparable(rule.value, field), b = comparable(rule.high, field);
        if (a === null || (rule.op === "between" && (b === null || a > b))) { return "Enter a valid value or range for " + field.title + "."; }
      }
    }
    if (f.attributes.some(function (r) { return r.field.indexOf("attr_") !== 0; })) { return "Attribute conditions must use FBB3 attributes."; }
    return "";
  }
  var model = { emptyFilters: emptyFilters, matches: matches, conditionMatches: conditionMatches, validateFilters: validateFilters };
  if (typeof module !== "undefined" && module.exports) { module.exports = model; }
  root.ESLDatabaseTools = { model: model, create: create };

  function create(api) {
    var KEY = "esl.playerDatabase.tools.v1", data = { version: 1, layouts: {}, views: [], presets: [], filters: emptyFilters() };
    var filters = emptyFilters(), draft, fields = [], menuAnchor, menuKey, menuMode, lastFocus;
    var esc = api.escape, notice;
    try { var stored = JSON.parse(localStorage.getItem(KEY)); if (stored && stored.version === 1) { data = Object.assign(data, stored); } } catch (_) { /* Storage is optional. */ }
    if (!data.layouts || typeof data.layouts !== "object" || Array.isArray(data.layouts)) { data.layouts = {}; }
    if (!Array.isArray(data.views)) { data.views = []; } if (!Array.isArray(data.presets)) { data.presets = []; }
    data.views = data.views.filter(function (v) { return validLayout(v) && typeof v.name === "string" && typeof v.id === "string" && api.tabs.indexOf(v.tab) >= 0; });
    data.presets = data.presets.filter(function (p) { return p && typeof p.name === "string" && p.filters; }).map(function (p) { return Object.assign({}, p, { filters: Object.assign(emptyFilters(), p.filters) }); });
    if (!data.heightDefaults) {
      ["attributes", "potential"].forEach(function (tab) {
        var layout = data.layouts[tab], defaults = api.defaults(tab).map(function (f) { return f.key; });
        if (validLayout(layout) && JSON.stringify(layout.columns) === JSON.stringify(defaults.filter(function (key) { return key !== "height"; }))) { layout.columns = defaults; }
      });
      data.heightDefaults = 1;
    }
    function save() { data.filters = filters; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { message("Browser storage is unavailable. Changes remain available until this page closes."); } }
    function message(text) { notice.textContent = text; }
    function button(label, attrs) { return '<button type="button" class="db-button ui-button" ' + (attrs || "") + '>' + label + '</button>'; }
    function options(items, value) { return items.map(function (item) { var pair = Array.isArray(item) ? item : [item, item]; return '<option value="' + esc(pair[0]) + '"' + (String(pair[0]) === String(value) ? ' selected' : '') + '>' + esc(pair[1]) + '</option>'; }).join(""); }
    function fieldOptions(list, selected) {
      var groups = Array.from(new Set(list.map(function (f) { return f.group; })));
      return groups.map(function (group) { return '<optgroup label="' + esc(group) + '">' + options(list.filter(function (f) { return f.group === group; }).map(function (f) { return [f.key, f.title]; }), selected) + '</optgroup>'; }).join("");
    }
    function refreshFields() { fields = api.fields(); }
    function validLayout(view) { return view && Array.isArray(view.columns) && view.columns.length && view.columns[0] === "name" && new Set(view.columns).size === view.columns.length && view.columns.every(function (key) { return typeof key === "string" && key.length < 100; }) && view.columns.indexOf(view.sort) >= 0 && ["asc", "desc"].indexOf(view.direction) >= 0; }
    function activeLayout() { return data.layouts[api.state.tab]; }
    function visibleColumns(defaults) {
      refreshFields();
      var layout = activeLayout();
      if (!validLayout(layout)) { return defaults; }
      return layout.columns.map(function (key) {
        return fields.find(function (f) { return f.key === key; }) || { key: key, label: key.indexOf("salary_") === 0 ? key.slice(7) : key, title: "Unavailable field", get: function () { return null; }, format: function () { return "—"; } };
      });
    }
    function capture() { return { columns: api.columns().map(function (f) { return f.key; }), sort: api.state.sorts[api.state.tab], direction: api.state.directions[api.state.tab] }; }
    function updateLayout(view) {
      data.layouts[api.state.tab] = clone(view); api.state.sorts[api.state.tab] = view.sort; api.state.directions[api.state.tab] = view.direction;
      save(); closeMenu(); api.changed();
    }
    var controls = document.querySelector(".db-controls");
    ["statusFilter", "teamFilter", "positionFilter"].forEach(function (id) { document.getElementById(id).closest("label").hidden = false; });
    controls.classList.add("db-controls-tools");
    var toolbar = document.createElement("div"); toolbar.className = "db-tools-bar";
    toolbar.innerHTML = button("Filters", 'id="dbOpenFilters" aria-haspopup="dialog"') + '<label class="db-view-label">View <select class="db-select ui-select" id="dbViews" aria-label="Saved view"></select></label>' + button("Manage views", 'id="dbManageViews" aria-haspopup="dialog"') + button("Columns", 'id="dbColumns" aria-haspopup="menu"');
    document.querySelector(".db-tabs").after(toolbar);
    var tabRow = document.createElement("div"); tabRow.className = "db-tab-row";
    var tabs = document.querySelector(".db-tabs"); tabs.before(tabRow); tabRow.appendChild(tabs);
    tabRow.appendChild(document.getElementById("dbOpenFilters"));
    var chips = document.createElement("div"); chips.className = "db-filter-chips"; tabRow.appendChild(chips);
    tabRow.appendChild(toolbar);
    notice = document.createElement("div"); notice.className = "db-tools-notice"; notice.setAttribute("role", "status"); tabRow.after(notice);
    var dialog = document.createElement("dialog"); dialog.className = "db-dialog"; dialog.setAttribute("aria-labelledby", "dbFilterTitle"); document.body.appendChild(dialog);
    var viewDialog = document.createElement("dialog"); viewDialog.className = "db-dialog db-view-dialog"; viewDialog.setAttribute("aria-labelledby", "dbViewTitle"); document.body.appendChild(viewDialog);
    var menu = document.createElement("div"); menu.className = "db-column-menu"; menu.hidden = true; document.body.appendChild(menu);
    function openDialog(el) { closeMenu(); lastFocus = document.activeElement; el.showModal(); }
    [dialog, viewDialog].forEach(function (el) { el.addEventListener("close", function () { if (lastFocus && lastFocus.isConnected) { lastFocus.focus(); } }); });
    var windowDrag = null;
    function positionDialog(x, y) {
      var rect = dialog.getBoundingClientRect();
      dialog.style.margin = "0"; dialog.style.right = "auto"; dialog.style.bottom = "auto";
      dialog.style.left = Math.max(8, Math.min(x, innerWidth - rect.width - 8)) + "px";
      dialog.style.top = Math.max(8, Math.min(y, innerHeight - rect.height - 8)) + "px";
    }
    dialog.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || !e.target.closest(".db-dialog-head") || e.target.closest("button")) { return; }
      var rect = dialog.getBoundingClientRect();
      windowDrag = { id: e.pointerId, x: e.clientX - rect.left, y: e.clientY - rect.top };
      dialog.setPointerCapture(e.pointerId); dialog.classList.add("db-window-dragging"); e.preventDefault();
    });
    dialog.addEventListener("pointermove", function (e) { if (windowDrag && e.pointerId === windowDrag.id) { positionDialog(e.clientX - windowDrag.x, e.clientY - windowDrag.y); } });
    function endWindowDrag() { windowDrag = null; dialog.classList.remove("db-window-dragging"); }
    dialog.addEventListener("pointerup", endWindowDrag); dialog.addEventListener("pointercancel", endWindowDrag); dialog.addEventListener("lostpointercapture", endWindowDrag);
    window.addEventListener("resize", function () { if (dialog.open && dialog.style.left) { var rect = dialog.getBoundingClientRect(); positionDialog(rect.left, rect.top); } });
    new ResizeObserver(function () { if (dialog.open && dialog.style.left) { var rect = dialog.getBoundingClientRect(); positionDialog(rect.left, rect.top); } }).observe(dialog);
    function syncQuickFilters() {
      var team = document.getElementById("teamFilter"), position = document.getElementById("positionFilter");
      document.getElementById("statusFilter").value = filters.status;
      if (filters.team !== "all" && !Array.from(team.options).some(function (o) { return o.value === filters.team; })) { team.add(new Option(filters.team, filters.team)); }
      team.value = filters.team;
      position.querySelectorAll('[data-multiple]').forEach(function (option) { option.remove(); });
      if (filters.positions.length > 1) { var multiple = new Option(filters.positions.join(" / "), "multiple"); multiple.dataset.multiple = "true"; multiple.disabled = true; position.add(multiple); position.value = "multiple"; }
      else { position.value = filters.positions.length ? filters.positions[0] : "all"; }
    }
    function hydrate() {
      refreshFields();
      var params = new URLSearchParams(location.search), raw = params.get("filters"), candidate = data.filters;
      if (raw) { try { var parsed = JSON.parse(raw); candidate = parsed.version === 1 ? parsed.filters : null; } catch (_) { candidate = null; } }
      else if (["status", "team", "pos", "q"].some(function (key) { return params.has(key); })) {
        candidate = emptyFilters(); candidate.status = api.state.status; candidate.team = api.state.team;
        candidate.positions = api.state.position === "all" ? [] : [api.state.position];
      }
      if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) { candidate = Object.assign(emptyFilters(), candidate); }
      if (candidate && !validateFilters(candidate, fields)) { filters = clone(candidate); }
      else if (raw) { message("The linked filters could not be loaded. Filters have been cleared."); }
      api.state.status = "all"; api.state.team = "all"; api.state.position = "all";
      var layout = activeLayout(); if (!params.has("sort") && validLayout(layout)) { api.state.sorts[api.state.tab] = layout.sort; api.state.directions[api.state.tab] = layout.direction; }
    }
    function renderChips() {
      var entries = [];
      if (filters.status !== "all") { entries.push(["status", filters.status === "potential_fa" ? "No contract next season" : filters.status.replace("_", " ")]); }
      if (filters.team !== "all") { entries.push(["team", filters.team]); }
      if (filters.positions.length) { entries.push(["positions", filters.positions.join(" / ")]); }
      [["age", "Age"], ["overall", "Overall"], ["potential", "POT"]].forEach(function (item) { if (filters[item[0] + "Min"] !== "" || filters[item[0] + "Max"] !== "") { entries.push([item[0], item[1] + " " + (filters[item[0] + "Min"] || "0") + "–" + (filters[item[0] + "Max"] || "Any")]); } });
      if (filters.attributes.length) { entries.push(["attributes", "Match " + (filters.match === "all" ? filters.attributes.length : filters.match) + " of " + filters.attributes.length + " attributes"]); }
      filters.conditions.forEach(function (r, i) { var f = fields.find(function (item) { return item.key === r.field; }); entries.push(["condition:" + i, (f ? f.title : r.field) + " " + ({ gte: "≥", lte: "≤", eq: "=", neq: "≠", between: "between", missing: "is missing", present: "is available" }[r.op]) + ((r.op === "missing" || r.op === "present") ? "" : " " + (f && f.key === "height" ? f.format(Number(r.value)) : r.value) + (r.op === "between" ? "–" + (f && f.key === "height" ? f.format(Number(r.high)) : r.high) : ""))]); });
      chips.innerHTML = entries.map(function (e) { return button(esc(e[1]) + ' <span aria-hidden="true">×</span>', 'data-chip="' + e[0] + '" aria-label="Remove filter: ' + esc(e[1]) + '"'); }).join("");
      document.getElementById("dbOpenFilters").textContent = "Filters" + (entries.length ? " (" + entries.length + ")" : "");
    }
    chips.addEventListener("click", function (e) {
      var b = e.target.closest("[data-chip]"); if (!b) { return; } var key = b.dataset.chip;
      if (key.indexOf("condition:") === 0) { filters.conditions.splice(Number(key.split(":")[1]), 1); }
      else if (key === "age" || key === "overall" || key === "potential") { filters[key + "Min"] = ""; filters[key + "Max"] = ""; }
      else { filters[key] = emptyFilters()[key]; if (key === "attributes") { filters.match = "all"; } }
      save(); api.changed();
    });
    function rangeInput(key, label) { return '<label class="db-field"><span class="db-label">' + label + '</span><span class="db-range"><input class="db-input" aria-label="Minimum ' + label + '" type="number" min="0" data-basic="' + key + 'Min" value="' + esc(draft[key + "Min"]) + '" placeholder="Any"><span>to</span><input class="db-input" aria-label="Maximum ' + label + '" type="number" min="0" data-basic="' + key + 'Max" value="' + esc(draft[key + "Max"]) + '" placeholder="Any"></span></label>'; }
    function rulesHtml(rules, section) {
      return rules.map(function (r, index) {
        var field = fields.find(function (f) { return f.key === r.field; });
        var ops = [["gte", "At least"], ["lte", "At most"], ["eq", "Is"], ["neq", "Is not"], ["between", "Between"], ["missing", "Is missing"], ["present", "Is available"]];
        if (field && field.type === "text") { ops = ops.filter(function (op) { return ["eq", "neq", "missing", "present"].indexOf(op[0]) >= 0; }); }
        function valueInput(key) {
          var attrs = ' data-rule-part="' + key + '" aria-label="' + (key === "high" ? "Maximum" : "Value") + '"';
          if (field && field.key === "height") {
            var heights = Array.from({ length: 61 }, function (_, i) { var inches = i + 48; return [String(inches), Math.floor(inches / 12) + "′" + inches % 12 + "″"]; });
            if (r[key] !== "" && r[key] != null && !heights.some(function (h) { return h[0] === String(r[key]); })) { heights.push([String(r[key]), field.format(Number(r[key]))]); }
            return '<select class="db-select"' + attrs + '>' + options([["", "Choose height…"]].concat(heights), r[key]) + '</select>';
          }
          if (field && field.key === "expiring") { return '<select class="db-select"' + attrs + '>' + options([["", "Choose…"], ["Yes", "Yes"], ["No", "No"]], r[key]) + '</select>'; }
          if (field && field.type === "grade") { return '<select class="db-select"' + attrs + '>' + options(["A", "B", "C", "D", "E", "F"], r[key]) + '</select>'; }
          return '<input class="db-input" type="' + (field && field.type === "text" ? "text" : "number") + '" step="any"' + attrs + ' value="' + esc(r[key] || (r[key] === 0 ? "0" : "")) + '" placeholder="' + (field && field.percent ? "%" : field && field.currency ? "$" : "Value") + '">';
        }
        return '<div class="db-rule" data-section="' + section + '" data-index="' + index + '"><select class="db-select" data-rule-part="field" aria-label="Condition field">' + fieldOptions(fields.filter(function (f) { return f.key !== "name" && (section !== "attributes" || f.group === "Attributes"); }), r.field) + '</select><select class="db-select" data-rule-part="op" aria-label="Comparison">' + options(ops, r.op) + '</select><div class="db-rule-values">' + (["missing", "present"].indexOf(r.op) >= 0 ? '<span class="db-summary">No value needed</span>' : valueInput("value") + (r.op === "between" ? '<span>to</span>' + valueInput("high") : "")) + '</div>' + button("−", 'data-remove-rule aria-label="Remove condition"') + '</div>';
      }).join("");
    }
    function drawDialog() {
      var focused = dialog.contains(document.activeElement) ? document.activeElement : null;
      var focusedRow = focused && focused.closest("[data-section]");
      var focusSelector = focusedRow && focused.dataset.rulePart ? '[data-section="' + focusedRow.dataset.section + '"][data-index="' + focusedRow.dataset.index + '"] [data-rule-part="' + focused.dataset.rulePart + '"]' : focused && focused.id ? '#' + focused.id : null;
      var teams = Array.from(new Set(api.players().map(function (p) { return p.team; }).filter(Boolean))).sort(); if (draft.team !== "all" && teams.indexOf(draft.team) < 0) { teams.push(draft.team); }
      dialog.innerHTML = '<header class="db-dialog-head"><h2 id="dbFilterTitle">Filter players</h2>' + button("×", 'data-close aria-label="Close filters"') + '</header><div class="db-dialog-body"><div class="db-preset-bar"><label>Preset <select class="db-select" id="dbPreset">' + options([["", "Custom"]].concat(data.presets.map(function (p, i) { return [String(i), p.name]; })), "") + '</select></label>' + button("Save preset", 'data-preset="save"') + button("Rename", 'data-preset="rename"') + button("Delete", 'data-preset="delete"') + '</div><div class="db-filter-grid"><section class="db-filter-section"><h3>Positions</h3><div class="db-court"><svg viewBox="0 0 240 210" aria-hidden="true"><path d="M1 1H239V209H1Z M77 1V95H163V1 M98 1V65H142V1 M15 1V40C15 210 225 210 225 40V1"/><circle cx="120" cy="95" r="29"/><path d="M107 16H133"/><circle cx="120" cy="24" r="7"/></svg>' + ["PG", "SG", "SF", "PF", "C"].map(function (p) { return button(p, 'data-position="' + p + '" aria-pressed="' + (draft.positions.indexOf(p) >= 0) + '"'); }).join("") + '</div><div class="db-inline-actions">' + button("Select all", 'data-positions="all"') + button("Clear", 'data-positions="clear"') + '</div></section><section class="db-filter-section db-basics"><h3>Player details</h3><label class="db-field"><span class="db-label">Status</span><select class="db-select" data-basic="status">' + options([["all", "All statuses"], ["rostered", "Rostered"], ["free_agent", "Free agents"], ["potential_fa", "No contract next season"]], draft.status) + '</select></label><label class="db-field"><span class="db-label">Team</span><select class="db-select" data-basic="team">' + options([["all", "All teams"]].concat(teams), draft.team) + '</select></label>' + rangeInput("age", "Age") + rangeInput("overall", "Overall") + rangeInput("potential", "POT") + '</section><section class="db-filter-section db-attributes"><h3>Attribute conditions</h3><label class="db-match-label">Match <select class="db-select" id="dbMatch">' + options([["all", "All (" + draft.attributes.length + ")"]].concat(draft.attributes.map(function (_, i) { return [String(i + 1), (i + 1) + " of " + draft.attributes.length]; })), draft.match) + '</select></label><div>' + rulesHtml(draft.attributes, "attributes") + '</div>' + button("+ Add attribute", 'data-add="attributes"') + '</section></div><section class="db-filter-section db-additional"><h3>Additional conditions <small>All must match</small></h3>' + rulesHtml(draft.conditions, "conditions") + button("+ Add condition", 'data-add="conditions"') + '<p class="db-summary">Use Games or Minutes per game to exclude small samples. Potential gap = POT − OVR.</p></section><p class="db-summary">' + esc(api.context()) + '</p><p id="dbFilterError" class="db-filter-error" role="alert"></p></div><footer class="db-dialog-footer"><strong id="dbDraftCount" aria-live="polite"></strong><div class="db-inline-actions">' + button("Clear filters", 'data-clear') + button("Cancel", 'data-close') + button("Apply filters", 'data-apply') + '</div></footer>';
      var presetName = document.createElement("label");
      presetName.innerHTML = '<span class="db-label">Name</span><input class="db-input" id="dbPresetName" maxlength="80" placeholder="Filter preset name">';
      dialog.querySelector(".db-preset-bar label").after(presetName);
      preview();
      if (focusSelector && dialog.querySelector(focusSelector)) { dialog.querySelector(focusSelector).focus(); }
    }
    function preview() {
      var error = validateFilters(draft, fields); dialog.querySelector("#dbFilterError").textContent = error;
      dialog.querySelector("[data-apply]").disabled = !!error;
      dialog.querySelector("#dbDraftCount").textContent = error ? "Check conditions" : api.players().filter(function (p) { return api.matchesSearch(p) && matches(p, draft, fields, api.expires); }).length + " players match";
    }
    dialog.addEventListener("input", function (e) {
      var el = e.target;
      if (el.dataset.basic) { draft[el.dataset.basic] = el.value; }
      var row = el.closest("[data-section]"); if (row && el.dataset.rulePart) { draft[row.dataset.section][Number(row.dataset.index)][el.dataset.rulePart] = el.value; }
      preview();
    });
    dialog.addEventListener("change", function (e) {
      var el = e.target, row = el.closest("[data-section]");
      if (el.id === "dbMatch") { draft.match = el.value; preview(); }
      if (row && ["field", "op"].indexOf(el.dataset.rulePart) >= 0) {
        var rule = draft[row.dataset.section][Number(row.dataset.index)]; rule[el.dataset.rulePart] = el.value;
        if (el.dataset.rulePart === "field") { var f = fields.find(function (item) { return item.key === rule.field; }); rule.op = f.type === "text" ? "eq" : "gte"; rule.value = f.type === "grade" ? "B" : row.dataset.section === "attributes" ? "70" : ""; rule.high = f.type === "grade" ? "A" : ""; }
        drawDialog();
      }
      if (el.id === "dbPreset" && el.value !== "") { var p = data.presets[Number(el.value)]; var error = validateFilters(p.filters, fields); if (error) { dialog.querySelector("#dbFilterError").textContent = error; } else { draft = clone(p.filters); drawDialog(); dialog.querySelector("#dbPreset").value = el.value; dialog.querySelector("#dbPresetName").value = p.name; } }
    });
    dialog.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) { return; }
      if (b.hasAttribute("data-close")) { dialog.close(); }
      if (b.hasAttribute("data-apply") && !validateFilters(draft, fields)) { filters = clone(draft); save(); dialog.close(); api.changed(); }
      if (b.hasAttribute("data-clear")) { draft = emptyFilters(); drawDialog(); }
      if (b.dataset.position) { var i = draft.positions.indexOf(b.dataset.position); if (i < 0) { draft.positions.push(b.dataset.position); } else { draft.positions.splice(i, 1); } b.setAttribute("aria-pressed", i < 0 ? "true" : "false"); preview(); }
      if (b.dataset.positions) { draft.positions = b.dataset.positions === "all" ? ["PG", "SG", "SF", "PF", "C"] : []; drawDialog(); }
      if (b.dataset.add) { draft[b.dataset.add].push({ field: b.dataset.add === "attributes" ? "attr_3ps" : "potentialGap", op: "gte", value: b.dataset.add === "attributes" ? "70" : "", high: "" }); drawDialog(); var rows = dialog.querySelectorAll('[data-section="' + b.dataset.add + '"]'); rows[rows.length - 1].querySelector("select").focus(); }
      if (b.hasAttribute("data-remove-rule")) { var row = b.closest("[data-section]"); draft[row.dataset.section].splice(Number(row.dataset.index), 1); if (draft.match !== "all" && Number(draft.match) > draft.attributes.length) { draft.match = "all"; } drawDialog(); }
      if (b.dataset.preset) {
        var select = dialog.querySelector("#dbPreset"), selected = select.value === "" ? null : data.presets[Number(select.value)];
        var name = dialog.querySelector("#dbPresetName").value.trim();
        if ((b.dataset.preset === "save" || b.dataset.preset === "rename") && !name) { dialog.querySelector("#dbFilterError").textContent = "Enter a preset name."; return; }
        if (b.dataset.preset === "save") { if (validateFilters(draft, fields)) { preview(); return; } if (selected) { selected.name = name; selected.filters = clone(draft); } else { data.presets.push({ name: name, filters: clone(draft) }); } }
        else if (!selected) { dialog.querySelector("#dbFilterError").textContent = "Choose a saved preset first."; return; }
        else if (b.dataset.preset === "rename") { selected.name = name; }
        else { data.presets.splice(Number(select.value), 1); }
        save(); drawDialog();
      }
    });
    function closeMenu() { menu.hidden = true; menu.innerHTML = ""; }
    function placeMenu() {
      menu.style.left = "8px"; menu.style.top = "8px";
      var rect = menu.getBoundingClientRect(); menu.style.left = Math.max(8, Math.min(menuAnchor.x, innerWidth - rect.width - 8)) + "px"; menu.style.top = Math.max(8, Math.min(menuAnchor.y, innerHeight - rect.height - 8)) + "px";
    }
    function openMenu(key, x, y) {
      refreshFields(); menuKey = key; menuAnchor = { x: x, y: y }; menuMode = "insert"; menu.hidden = false;
      menu.innerHTML = '<div class="db-menu-level" role="menu" aria-label="Column actions">' + [["insert", "Insert column ›"], ["replace", "Replace column ›"], ["remove", "Remove column"], ["left", "Move left"], ["right", "Move right"], ["reset", "Reset layout"]].map(function (a) { var disabled = key === "name" && ["replace", "remove", "left", "right"].indexOf(a[0]) >= 0; return button(a[1], 'role="menuitem" data-action="' + a[0] + '"' + (disabled ? ' disabled' : '')); }).join("") + '</div>';
      placeMenu(); menu.querySelector("button").focus();
    }
    function categories(mode) {
      menuMode = mode; menu.querySelectorAll(".db-menu-level").forEach(function (el, i) { if (i > 0) { el.remove(); } });
      var panel = document.createElement("div"); panel.className = "db-menu-level"; panel.setAttribute("role", "menu"); panel.setAttribute("aria-label", "Column categories");
      panel.innerHTML = Array.from(new Set(fields.map(function (f) { return f.group; }))).map(function (g) { return button(esc(g) + " ›", 'role="menuitem" data-group="' + esc(g) + '"'); }).join(""); menu.appendChild(panel); placeMenu(); panel.querySelector("button").focus();
    }
    function fieldMenu(group) {
      var previous = menu.querySelector(".db-menu-fields"); if (previous) { previous.remove(); }
      var panel = document.createElement("div"); panel.className = "db-menu-level db-menu-fields";
      panel.innerHTML = '<strong>' + esc(group) + '</strong><input class="db-input" type="search" aria-label="Find a column" placeholder="Find a column…"><div role="menu" aria-label="Available columns"></div><small>' + (menuMode === "replace" ? "Replace " : "Insert after ") + esc((fields.find(function (f) { return f.key === menuKey; }) || {}).label || menuKey) + '</small>';
      var visible = api.columns().map(function (f) { return f.key; });
      function draw(q) { panel.querySelector('[role="menu"]').innerHTML = fields.filter(function (f) { return f.group === group && f.title.toLowerCase().indexOf(q.toLowerCase()) >= 0; }).map(function (f) { var exists = visible.indexOf(f.key) >= 0; return button(esc(f.title) + (exists ? ' <small>✓ visible</small>' : ""), 'role="menuitem" data-field="' + esc(f.key) + '"' + (exists ? ' disabled' : '')); }).join("") || '<p class="db-summary">No matching columns.</p>'; placeMenu(); }
      menu.appendChild(panel); draw(""); panel.querySelector("input").addEventListener("input", function (e) { draw(e.target.value); }); panel.querySelector("input").focus();
    }
    menu.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) { return; }
      if (b.dataset.group) { fieldMenu(b.dataset.group); return; }
      var view = capture(), index = view.columns.indexOf(menuKey), action = b.dataset.action;
      if (action === "insert" || action === "replace") { categories(action); return; }
      if (action === "reset") { delete data.layouts[api.state.tab]; save(); closeMenu(); api.resetSort(); api.changed(); return; }
      if (action === "remove" && index > 0) { view.columns.splice(index, 1); }
      if (action === "left" && index > 1) { view.columns.splice(index - 1, 0, view.columns.splice(index, 1)[0]); }
      if (action === "right" && index > 0 && index < view.columns.length - 1) { view.columns.splice(index + 1, 0, view.columns.splice(index, 1)[0]); }
      if (b.dataset.field) { view.columns.splice(index + (menuMode === "insert" ? 1 : 0), menuMode === "replace" ? 1 : 0, b.dataset.field); }
      if (view.columns.indexOf(view.sort) < 0) { view.sort = "name"; view.direction = "asc"; }
      updateLayout(view);
    });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeMenu(); document.getElementById("dbColumns").focus(); }
      if (["ArrowDown", "ArrowUp", "Home", "End"].indexOf(e.key) >= 0 && e.target.tagName !== "INPUT") {
        var buttons = Array.from(e.target.closest(".db-menu-level").querySelectorAll("button:not(:disabled)")), i = buttons.indexOf(document.activeElement);
        e.preventDefault(); var next = e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length; if (buttons[next]) { buttons[next].focus(); }
      }
      if (e.key === "ArrowRight" && (e.target.dataset.group || ["insert", "replace"].indexOf(e.target.dataset.action) >= 0)) { e.preventDefault(); e.target.click(); }
      if (e.key === "ArrowLeft") { var level = e.target.closest(".db-menu-level"), prev = level.previousElementSibling; if (prev) { level.remove(); prev.querySelector("button:not(:disabled)").focus(); placeMenu(); } }
    });
    document.addEventListener("pointerdown", function (e) { if (!menu.contains(e.target)) { closeMenu(); } });
    window.addEventListener("resize", closeMenu); document.getElementById("databaseTable").addEventListener("scroll", closeMenu);
    var table = document.getElementById("playerTable");
    var columnDrag = null, suppressSortUntil = 0;
    function clearDropMarks() { table.querySelectorAll(".db-drop-before, .db-drop-after").forEach(function (th) { th.classList.remove("db-drop-before", "db-drop-after"); }); }
    function finishColumnDrag(commit) {
      if (!columnDrag) { return; }
      var drag = columnDrag; columnDrag = null;
      table.classList.remove("db-column-dragging"); table.querySelectorAll(".db-drag-source").forEach(function (th) { th.classList.remove("db-drag-source"); }); clearDropMarks();
      if (table.hasPointerCapture(drag.id)) { table.releasePointerCapture(drag.id); }
      if (!drag.moved) { return; }
      suppressSortUntil = Date.now() + 250;
      if (commit && drag.target && drag.target !== drag.key) {
        var view = capture(), old = view.columns.indexOf(drag.key);
        view.columns.splice(old, 1);
        var target = view.columns.indexOf(drag.target) + (drag.after ? 1 : 0);
        view.columns.splice(Math.max(1, target), 0, drag.key); updateLayout(view);
      }
    }
    table.addEventListener("pointerdown", function (e) {
      var th = e.target.closest("th"), sort = th && th.querySelector("[data-sort]");
      if (e.button !== 0 || !sort || sort.dataset.sort === "name") { return; }
      columnDrag = { id: e.pointerId, key: sort.dataset.sort, x: e.clientX, y: e.clientY, moved: false };
    });
    table.addEventListener("pointermove", function (e) {
      var drag = columnDrag; if (!drag || drag.id !== e.pointerId) { return; }
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) { return; }
      drag.moved = true; e.preventDefault(); closeMenu(); table.setPointerCapture(e.pointerId); table.classList.add("db-column-dragging");
      var source = table.querySelector('[data-sort="' + drag.key + '"]').closest("th"); source.classList.add("db-drag-source");
      var wrap = document.getElementById("databaseTable"), bounds = wrap.getBoundingClientRect();
      if (e.clientX > bounds.right - 35) { wrap.scrollLeft += 22; } else if (e.clientX < bounds.left + 35) { wrap.scrollLeft -= 22; }
      var hit = document.elementFromPoint(e.clientX, e.clientY), th = hit && hit.closest("th"); clearDropMarks(); drag.target = null;
      if (th && table.contains(th)) {
        var rect = th.getBoundingClientRect(); drag.target = th.querySelector("[data-sort]").dataset.sort;
        drag.after = drag.target === "name" || e.clientX > rect.left + rect.width / 2;
        if (drag.target !== drag.key) { th.classList.add(drag.after ? "db-drop-after" : "db-drop-before"); }
      }
    });
    table.addEventListener("pointerup", function () { finishColumnDrag(true); });
    table.addEventListener("pointercancel", function () { finishColumnDrag(false); });
    table.addEventListener("lostpointercapture", function () { finishColumnDrag(false); });
    table.addEventListener("click", function (e) { if (Date.now() < suppressSortUntil) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { finishColumnDrag(false); } });
    table.addEventListener("contextmenu", function (e) { var th = e.target.closest("th"); if (!th) { return; } e.preventDefault(); openMenu(th.querySelector("[data-sort]").dataset.sort, e.clientX, e.clientY); });
    table.addEventListener("keydown", function (e) { if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) { var b = e.target.closest("[data-sort]"); if (b) { e.preventDefault(); var r = b.getBoundingClientRect(); openMenu(b.dataset.sort, r.left, r.bottom); } } });
    function drawViews() {
      var current = capture(), views = data.views.filter(function (v) { return v.tab === api.state.tab; });
      var selected = views.find(function (v) { return JSON.stringify(v.columns) === JSON.stringify(current.columns) && v.sort === current.sort && v.direction === current.direction; });
      var isDefault = JSON.stringify(current.columns) === JSON.stringify(api.defaults().map(function (f) { return f.key; }));
      document.getElementById("dbViews").innerHTML = options([["", isDefault ? "Default layout" : "Custom layout"]].concat(views.map(function (v) { return [v.id, v.name]; })), selected ? selected.id : "");
    }
    function manageViews() {
      viewDialog.innerHTML = '<header class="db-dialog-head"><h2 id="dbViewTitle">Manage views</h2>' + button("×", 'data-close-views aria-label="Close views"') + '</header><div class="db-dialog-body"><p class="db-summary">Views save columns and sorting for this tab. Filter presets are separate.</p><label class="db-field"><span class="db-label">Saved view</span><select id="dbViewChoice" class="db-select">' + options([["", "Current layout"]].concat(data.views.filter(function (v) { return v.tab === api.state.tab; }).map(function (v) { return [v.id, v.name]; })), "") + '</select></label><label class="db-field"><span class="db-label">View name</span><input id="dbViewName" class="db-input" maxlength="80" placeholder="e.g. Young perimeter scorers"></label><div class="db-inline-actions">' + ["Create", "Save", "Duplicate", "Rename", "Delete", "Export"].map(function (s) { return button(s, 'data-view-action="' + s.toLowerCase() + '"'); }).join("") + '</div><label class="db-field"><span class="db-label">Import view (.json)</span><input type="file" id="dbImportView" accept=".json,application/json"></label><p id="dbViewMessage" role="status"></p></div>';
    }
    viewDialog.addEventListener("change", function (e) {
      if (e.target.id === "dbViewChoice") { var v = data.views.find(function (v) { return v.id === e.target.value; }); viewDialog.querySelector("#dbViewName").value = v ? v.name : ""; }
      if (e.target.id === "dbImportView" && e.target.files[0]) {
        var file = e.target.files[0]; if (file.size > 100000) { viewDialog.querySelector("#dbViewMessage").textContent = "View files must be under 100 KB."; return; }
        file.text().then(function (text) {
          var imported = JSON.parse(text), v = imported.view;
          if (imported.version !== 1 || !validLayout(v) || typeof v.name !== "string" || !v.name.trim() || api.tabs.indexOf(v.tab) < 0) { throw new Error("Invalid view file."); }
          var unknown = v.columns.filter(function (key) { return !fields.some(function (f) { return f.key === key; }); });
          if (unknown.length) { throw new Error("Unsupported fields: " + unknown.join(", ") + ". Nothing was imported."); }
          v = Object.assign({}, v, { id: newId(), name: v.name.trim().slice(0, 80) }); data.views.push(v); save(); drawViews(); manageViews(); viewDialog.querySelector("#dbViewMessage").textContent = "Imported “" + v.name + "” into " + v.tab + " views.";
        }).catch(function (err) { viewDialog.querySelector("#dbViewMessage").textContent = err.message; });
      }
    });
    function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
    viewDialog.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) { return; } if (b.hasAttribute("data-close-views")) { viewDialog.close(); return; }
      var action = b.dataset.viewAction; if (!action) { return; }
      var id = viewDialog.querySelector("#dbViewChoice").value, selected = data.views.find(function (v) { return v.id === id; });
      var name = viewDialog.querySelector("#dbViewName").value.trim();
      if (["save", "rename", "delete"].indexOf(action) >= 0 && !selected) { viewDialog.querySelector("#dbViewMessage").textContent = "Choose a saved view first."; return; }
      if (["create", "duplicate", "rename"].indexOf(action) >= 0 && !name) { viewDialog.querySelector("#dbViewMessage").textContent = "Enter a view name."; return; }
      if (action === "create" || action === "duplicate") { data.views.push(Object.assign({}, action === "duplicate" && selected ? clone(selected) : capture(), { id: newId(), name: name, tab: api.state.tab })); }
      if (action === "save") { Object.assign(selected, capture()); }
      if (action === "rename") { selected.name = name; }
      if (action === "delete") { data.views = data.views.filter(function (v) { return v.id !== id; }); }
      if (action === "export") { var v = selected || Object.assign(capture(), { name: name || "Custom view", tab: api.state.tab }); var url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, view: v }, null, 2)], { type: "application/json" })); var a = document.createElement("a"); a.href = url; a.download = "player-database-view.json"; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); return; }
      save(); drawViews(); manageViews(); viewDialog.querySelector("#dbViewMessage").textContent = "View updated.";
    });
    document.getElementById("dbOpenFilters").addEventListener("click", function () { refreshFields(); draft = clone(filters); drawDialog(); openDialog(dialog); });
    document.getElementById("dbColumns").addEventListener("click", function (e) { var r = e.target.getBoundingClientRect(), cols = api.columns(); openMenu(cols[cols.length - 1].key, r.left, r.bottom); categories("insert"); });
    document.getElementById("dbManageViews").addEventListener("click", function () { refreshFields(); manageViews(); openDialog(viewDialog); });
    document.getElementById("dbViews").addEventListener("change", function (e) { var v = data.views.find(function (v) { return v.id === e.target.value; }); if (v && validLayout(v)) { updateLayout(v); } });
    hydrate();
    return {
      columns: visibleColumns,
      matches: function (p) { return matches(p, filters, fields, api.expires); },
      writeUrl: function (params) { params.set("filters", JSON.stringify({ version: 1, filters: filters })); },
      reset: function () { filters = emptyFilters(); save(); },
      quickFilter: function (id, value) {
        if (id === "statusFilter") { filters.status = value; }
        if (id === "teamFilter") { filters.team = value; }
        if (id === "positionFilter" && value !== "multiple") { filters.positions = value === "all" ? [] : [value]; }
        save(); api.changed();
      },
      rendered: function () { refreshFields(); renderChips(); drawViews(); syncQuickFilters(); data.layouts[api.state.tab] = capture(); save(); },
      selectTab: function () { var v = activeLayout(); if (validLayout(v)) { api.state.sorts[api.state.tab] = v.sort; api.state.directions[api.state.tab] = v.direction; } }
    };
  }
}(typeof window !== "undefined" ? window : globalThis));
