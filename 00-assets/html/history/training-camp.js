(function () {
  "use strict";
  const model = window.TrainingCampHistory;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const signed = (value, digits = 1) => (value > 0 ? "+" : "") + value.toFixed(digits);
  const tone = value => value > 0 ? "camp-positive" : value < 0 ? "camp-negative" : "";
  let rows = [], displayed = [], failures = [], selected = null;
  const cache = new Map();
  function fetchJson(url) {
    if (!cache.has(url)) cache.set(url, fetch(url).then(response => {
      if (!response.ok) throw new Error(`Could not load ${url.split("/").slice(-3).join("/")}`);
      return response.json();
    }));
    return cache.get(url);
  }
  function delta(value, digits = 1) { return `<td class="${tone(value)}">${signed(value, digits)}</td>`; }
  function syncUrl() {
    const url = new URL(window.location.href);
    ["view", "weight", "camp", "team", "order"].forEach(id => url.searchParams.set(id, $(id).value));
    window.history.replaceState({}, "", url);
    document.querySelectorAll("[data-view]").forEach(tab => {
      const active = tab.dataset.view === $("view").value;
      tab.classList.toggle("active", active);
      if (active) tab.setAttribute("aria-current", "page"); else tab.removeAttribute("aria-current");
      const target = new URL(url); target.searchParams.set("view", tab.dataset.view); tab.href = target.href;
    });
  }

  function renderBreakdown() {
    if (!selected) { $("breakdown").hidden = true; return; }
    const weight = $("weight").value;
    const rating = weight === "potImpact" ? "potential" : "overall";
    $("breakdown").hidden = false;
    if (selected.members) {
      $("breakdown-title").textContent = `${selected.label} · Franchise Camp History`;
      $("breakdown-note").textContent = `${selected.camps} recorded camps · ${signed(selected[weight], 2)} average impact · ${signed(selected[weight === "potImpact" ? "totalPotImpact" : "totalOvrImpact"], 2)} total impact. Select a camp to inspect its players.`;
      $("players").innerHTML = `<table class="ref-table"><thead><tr><th>#</th><th>Camp</th><th>Impact</th><th>Raw POT Δ</th><th>Net skills</th><th>OVR / player</th><th>POT / player</th><th>Players</th></tr></thead><tbody>${selected.members.slice().sort((a, b) => b.camp.order - a.camp.order).map((row, index) => `<tr><td>${index + 1}</td><td><button class="intake-class-toggle" data-camp="${esc(row.camp.id)}" data-team="${esc(row.team)}">${esc(row.camp.label)} <span aria-hidden="true">▸</span></button></td>${delta(row[weight], 2)}${delta(row.potDelta, 0)}${delta(row.net, 0)}${delta(row.overall)}${delta(row.potential)}<td>${row.count}</td></tr>`).join("")}</tbody></table>`;
      return;
    }
    $("breakdown-title").textContent = `${selected.label} · ${selected.camp.label}`;
    $("breakdown-note").textContent = `${selected.camp.historical ? "Archived season-to-season comparison" : "Live ratings versus saved PreTC snapshot"}. Contributions use POT delta weighted by pre-camp ${rating === "potential" ? "POT" : "OVR"}. ${selected.excluded} eligible players excluded for missing matches or ratings.`;
    const players = selected.players.slice().sort((a, b) => b[weight] - a[weight] || a.player.name.localeCompare(b.player.name));
    $("players").innerHTML = `<table class="ref-table"><thead><tr><th>#</th><th>Player</th><th>Pre OVR</th><th>Pre POT</th><th>Net skills</th><th>OVR Δ</th><th>POT Δ</th><th>Impact</th></tr></thead><tbody>${players.map((row, index) => {
      const id = String(row.player.url || row.player.playerId || "").match(/player\d+/i)?.[0];
      const href = selected.camp.historical ? `player.htm?key=${encodeURIComponent(row.key)}` : id ? `../unified-player.htm?id=${encodeURIComponent(id)}` : "";
      return `<tr><td>${index + 1}</td><td>${href ? `<a href="${esc(href)}">${esc(row.player.name)}</a>` : esc(row.player.name)}</td><td>${esc(row.prior.overall)}</td><td>${esc(row.prior.potential)}</td>${delta(row.net, 0)}${delta(row.overall, 0)}${delta(row.potential, 0)}${delta(row[weight], 2)}</tr>`;
    }).join("")}</tbody></table>`;
  }

  function render() {
    const team = $("team").value, camp = $("camp").value, weight = $("weight").value;
    const historical = $("view").value === "franchises";
    const filtered = rows.filter(row => (team === "all" || row.team === team) && (camp === "all" || row.camp.id === camp));
    const direction = $("order").value === "best" ? -1 : 1;
    displayed = (historical ? model.franchises(filtered) : filtered).slice().sort((a, b) => direction * (a[weight] - b[weight] || a.potential - b.potential || a.improved - b.improved) || a.label.localeCompare(b.label) || (b.camp?.order || 0) - (a.camp?.order || 0));
    $("formula").textContent = `Impact = sum of (POT delta × pre-camp ${weight === "potImpact" ? "POT" : "OVR"} ÷ 100). ${historical ? "Scores and development metrics are averages per recorded team camp." : "Each row is one team's camp; scores are summed player contributions."}`;
    $("ranking-title").textContent = historical ? "Overall Franchise Development" : "Best Team Camps";
    $("ranking-note").textContent = historical ? "Franchises rank by average impact per recorded camp. Total impact shows cumulative development. Select a team to explore its camps." : "Select a team or impact score to inspect every player's contribution.";
    const ranked = filtered.slice().sort((a, b) => b[weight] - a[weight]);
    const franchiseRanks = model.franchises(filtered).sort((a, b) => b[weight] - a[weight]);
    const best = ranked[0], leader = franchiseRanks[0];
    const card = (label, title, note) => `<div class="dashboard-card"><div class="dashboard-card-label">${esc(label)}</div><strong>${esc(title)}</strong><p>${esc(note)}</p></div>`;
    $("highlights").innerHTML = card("Best Team Camp", best ? `${best.label} · ${best.camp.label}` : "—", best ? `${signed(best[weight], 2)} weighted impact` : "No recorded camps") + card("Leading Franchise", leader?.label || "—", leader ? `${signed(leader[weight], 2)} average impact across ${leader.camps} camps` : "No recorded camps") + card("Positive Camps", `${filtered.filter(row => row[weight] > 0).length} / ${filtered.length}`, "Team camps with a positive weighted impact");
    $("status").textContent = `${displayed.length} ${historical ? "teams" : "team camps"}${failures.length ? ` · Unavailable comparisons: ${failures.join(", ")}` : ""}`;
    const count = filtered.reduce((sum, row) => sum + row.count, 0);
    $("summary").innerHTML = `<div class="camp-chip">Camps<strong>${new Set(filtered.map(row => row.camp.id)).size}</strong></div><div class="camp-chip">Teams<strong>${new Set(filtered.map(row => row.team)).size}</strong></div><div class="camp-chip">Matched player entries<strong>${count}</strong></div><div class="camp-chip">Excluded entries<strong>${filtered.reduce((sum, row) => sum + row.excluded, 0)}</strong></div>`;
    if (!displayed.length) {
      $("rankings").innerHTML = '<p class="camp-empty">No matched team camps available for these filters.</p>';
    } else {
      $("rankings").innerHTML = `<table class="ref-table"><thead><tr><th>Rank</th><th>Team</th><th>${historical ? "Camps" : "Camp"}</th><th>${historical ? "Avg " : ""}${weight === "potImpact" ? "POT" : "OVR"} impact</th>${historical ? "<th>Total impact</th><th>Positive camps</th>" : ""}<th>${historical ? "Avg " : ""}Raw POT Δ</th>${historical ? "<th>Total raw POT Δ</th>" : ""}<th>${historical ? "Avg " : ""}Net skills</th><th>Skills / player</th><th>OVR / player</th><th>POT / player</th><th>POT improved</th><th>${historical ? "Avg players" : "Players"}</th><th>Excluded</th></tr></thead><tbody>${displayed.map((row, index) => `<tr><td>${index + 1}</td><td><button class="intake-class-toggle" data-row="${index}" aria-label="Inspect ${esc(row.label)} ${historical ? "franchise" : esc(row.camp.label)}"><span>${esc(row.label)}</span><span class="intake-class-chevron" aria-hidden="true">▸</span></button></td><td>${historical ? row.camps : esc(row.camp.label)}</td><td class="${tone(row[weight])}">${historical ? signed(row[weight], 2) : `<button class="camp-score ${tone(row[weight])}" data-row="${index}" aria-label="Inspect ${esc(row.label)} ${esc(row.camp.label)} contributions">${signed(row[weight], 2)}</button>`}</td>${historical ? delta(row[weight === "potImpact" ? "totalPotImpact" : "totalOvrImpact"], 2) + `<td>${row.members.filter(camp => camp[weight] > 0).length}/${row.camps}</td>` : ""}${delta(row.potDelta)}${historical ? delta(row.totalPotDelta, 0) : ""}${delta(row.net)}${delta(row.average)}${delta(row.overall)}${delta(row.potential)}<td>${row.improved.toFixed(1)}%</td><td>${historical ? row.count.toFixed(1) : row.count}</td><td>${row.excluded}</td></tr>`).join("")}</tbody></table>`;
    }
    renderBreakdown();
    syncUrl();
  }

  async function initialize() {
    const controls = ["view", "weight", "camp", "team", "order"];
    const params = new URLSearchParams(window.location.search);
    controls.forEach(id => { if (id !== "view" && [...$(id).options].some(option => option.value === params.get(id))) $(id).value = params.get(id); $(id).disabled = true; $(id).addEventListener("change", () => { selected = null; render(); }); });
    $("view").value = params.get("view") === "franchises" ? "franchises" : "camps";
    document.querySelectorAll("[data-view]").forEach(tab => tab.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); $("view").value = tab.dataset.view; selected = null; render();
    }));
    $("players").addEventListener("click", event => {
      const button = event.target.closest("[data-camp]");
      if (!button) return;
      selected = rows.find(row => row.team === button.dataset.team && row.camp.id === button.dataset.camp);
      renderBreakdown();
    });
    $("close").addEventListener("click", () => { selected = null; renderBreakdown(); });
    $("rankings").addEventListener("click", event => {
      const button = event.target.closest("[data-row]");
      if (!button) return;
      selected = displayed[Number(button.dataset.row)];
      renderBreakdown();
      $("breakdown").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    try {
      const index = await fetchJson("../../../00-build/history/index.json");
      const camps = model.configs(index);
      const results = await Promise.allSettled(camps.map(async camp => {
        const [current, previous, currentKeys, previousKeys] = await Promise.all([fetchJson(camp.current), fetchJson(camp.previous), camp.currentKeys ? fetchJson(camp.currentKeys) : null, camp.previousKeys ? fetchJson(camp.previousKeys) : null]);
        return model.compare(current, previous, camp, currentKeys?.keys, previousKeys?.keys);
      }));
      const available = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value.length) { rows.push(...result.value); available.push(camps[i]); }
        else failures.push(camps[i].label);
      });
      // Stable roster identity groups renamed franchises; prefer the most recent available name.
      const labels = new Map();
      rows.slice().sort((a, b) => a.camp.order - b.camp.order).forEach(row => labels.set(row.team, row.label));
      rows.forEach(row => { row.label = labels.get(row.team); });
      $("camp").innerHTML += available.map(camp => `<option value="${esc(camp.id)}">${esc(camp.label)}</option>`).join("");
      $("team").innerHTML += [...labels].sort((a, b) => a[1].localeCompare(b[1])).map(([id, label]) => `<option value="${esc(id)}">${esc(label)}</option>`).join("");
      ["team", "camp"].forEach(id => { if ([...$(id).options].some(option => option.value === params.get(id))) $(id).value = params.get(id); });
      controls.forEach(id => { $(id).disabled = false; });
      render();
    } catch (error) {
      $("status").textContent = "Unable to load history";
      $("rankings").innerHTML = `<p class="camp-empty">${esc(error.message)}. Reload the page to retry.</p>`;
    }
  }
  initialize();
}());
