(function () {
  "use strict";
  var core = window.LeagueSiteCore;
  if (!core || core.isMenuPage() || /\/index\.htm$/i.test(location.pathname) || window.LeagueGmTour) return;
  var KEY = "esl-gm-tour:v1";
  var root = core.paths.gmTour.replace(/00-assets\/html\/gm-tour\.htm$/, "");
  var home = root + "00-assets/html/gm-tour.htm";
  var isHome = /\/gm-tour\.htm$/i.test(location.pathname);
  var owner = window;
  try { if (window.top.location.origin === location.origin) owner = window.top; } catch (ignore) {}
  var storageAvailable = true;
  var teams = [];
  var panel, ring, target, timer, started = 0, previousFocus;

  function fresh() { return { version: 1, active: false, chapter: 0, step: 0, completed: [], team: "", phase: "" }; }
  function valid(raw) {
    var value = fresh();
    if (!raw || raw.version !== 1) return value;
    value.active = raw.active === true;
    value.chapter = Number.isInteger(raw.chapter) && raw.chapter >= 0 && raw.chapter < 6 ? raw.chapter : 0;
    value.step = Number.isInteger(raw.step) && raw.step >= 0 && raw.step < 20 ? raw.step : 0;
    value.completed = Array.isArray(raw.completed) ? raw.completed.filter(function (n) { return Number.isInteger(n) && n >= 0 && n < 6; }) : [];
    value.team = /^roster\d+\.htm$/i.test(raw.team || "") ? raw.team : "";
    value.phase = typeof raw.phase === "string" ? raw.phase.slice(0, 60) : "";
    return value;
  }
  function read() {
    var incoming = new URL(location.href).searchParams.get("gmTour");
    if (incoming) {
      try {
        var restored = valid(JSON.parse(incoming));
        var cleanUrl = new URL(location.href); cleanUrl.searchParams.delete("gmTour");
        history.replaceState(null, "", cleanUrl);
        return restored;
      } catch (ignore) {}
    }
    if (owner.__leagueGmTourMemory) return valid(owner.__leagueGmTourMemory);
    try {
      localStorage.setItem(KEY + ":probe", "1"); localStorage.removeItem(KEY + ":probe");
      return valid(JSON.parse(localStorage.getItem(KEY) || "null"));
    } catch (ignore) { storageAvailable = false; return fresh(); }
  }
  var state = read();
  function save() {
    owner.__leagueGmTourMemory = JSON.parse(JSON.stringify(state));
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (ignore) { storageAvailable = false; }
  }
  function esc(text) { return core.escapeHtml(String(text || "")); }
  function page(file) { return root + "00-assets/html/" + file; }
  function roster() { return page("unified-roster.htm") + (state.team ? "?file=" + encodeURIComponent(state.team) : ""); }
  function step(title, text, selector, extra) {
    return Object.assign({ title: title, text: text, selector: selector || "" }, extra || {});
  }
  var chapters = [
    { title: "League Format", summary: "How divisions, sims, and the season fit together.", route: function () { return home; }, steps: [
      step("You manage. The game simulates.", "You choose lineups, tactics, player development, and roster moves. The commissioner processes submissions and runs FBB3 simulations, called sims. The website then shows the updated league. Start with your team and results; learn the submission tools next.", ".gm-tour-hero"),
      step("Three divisions, one league", "ESL has 24 teams across Champions League (CLB), Europa League (ELB), and Conference League (ECL). Final regular-season standings decide promotion and relegation: the top two move up and the bottom two move down where a neighbouring division exists. The Super Cup is a separate competition.", "#gm-tour-chapters"),
      step("The season has different windows", "The cycle includes offseason roster building and free-agency rounds, training camp and preseason, regular-season sims, and postseason events. Depth charts set your rotation for games. Bids belong to announced free-agency windows; camps have their own eligibility and allocation rules. You can learn every tool now without sending anything.", "#gm-tour-chapters"),
      step("Check announcements before sending", "The website label gives context, not permission to submit. Always check commissioner announcements for the current window, deadline, and destination. Current rules govern legality. The next chapters take you to the real pages and controls.", ".gm-tour-note")
    ] },
    { title: "Your Team", summary: "Find your roster, ratings, contracts, and player pages.", route: roster, steps: [
      step("Choose your team", "This is the team selector on your roster page. Choose your club to load its roster. The tour remembers your choice but does not change selections in your saved tool drafts.", "#teamPicker", { event: "change", rememberTeam: true, navigation: true }),
      step("Your team at a glance", "The header identifies the club and its recent form. This is your starting point for checking what changed after a sim.", ".hero"),
      step("Players, ratings, and contracts", "Use these tabs to inspect your players. OVR means overall rating; POT means potential; POS means position. Look for age, salaries, and contract information before making roster moves. The GM dashboard and Cap Report provide financial context; the hard cap includes dead salary.", "#playerTable"),
      step("Open a player", "Click a player name to inspect their individual profile. You can look more closely at ratings and stats there. After looking, use Next to return to your team.", "#playerTable a[href*='player']", { event: "click", link: true }),
      step("The player profile", "This page is where you inspect one player in detail. Ratings describe skills; statistics describe recorded performance. Use the roster's schedule to open games, or use Match Centre for league-wide results.", "main, .shell", { route: null, match: function () { return /unified-player\.htm|\/players\//i.test(location.pathname); }, returnTo: roster })
    ] },
    { title: "Box Scores", summary: "Find completed games and read individual performances.", route: function () { return core.paths.matchCentre; }, steps: [
      step("Find your team's games", "Match Centre holds upcoming fixtures and completed results. Choose your team in this filter. Competition and month filters help narrow the list. Your roster also has a schedule with links to games.", "#teamFilter", { event: "change", rememberTeam: true, match: function () { return /match-centre\.htm$/i.test(location.pathname) && !new URL(location.href).searchParams.has("game"); } }),
      step("Open a completed game", "Recent Results contains completed games. Click a result to open its box score. If the selected month has no results, change the results month or team filter. An upcoming game opens a preview instead.", "#recentResults a[href*='game=']", { event: "click", link: true, match: function () { return /match-centre\.htm$/i.test(location.pathname) && !new URL(location.href).searchParams.has("game"); } }),
      step("The final score", "This is the completed game's score and period breakdown. Check the date and teams so you know which sim's game you are reading.", "#boxscoreHero", { route: null }),
      step("Read the player lines", "Switch between Away and Home for each team's player stats. MIN is minutes; PTS points; REB rebounds; AST assists; TO turnovers. Shooting makes and attempts show efficiency. Find a player on your team and check their minutes and points.", "#teamTablePanel", { route: null })
    ] },
    { title: "Depth Charts", summary: "Build a rotation and copy it for Discord.", route: function () { return core.paths.depthCharts; }, steps: [
      step("Select your club", "Depth Charts prepares a formatted lineup for the commissioner. Choose your team. These are the real tool's controls: your edits may be saved as a draft. The tour never fills or clears them for you.", "#team-select", { event: "change", rememberTeam: true }),
      step("Set your rotation", "Assign players to the active slots, check positions, and enter minutes. PG, SG, SF, PF, and C are the five positions. The tool also offers auto-fill and minute distribution, but using them replaces parts of your draft. Review your lineup before proceeding.", "#depth-table"),
      step("Set the gameplan", "These controls describe how you want the team to play. Review the available offensive and defensive choices. You can leave your existing settings while learning; the tour does not require changing every field.", ".depth-gameplan"),
      step("Review and copy", "Check the formatted template before using Copy to Clipboard. If copying is blocked, select the template text and copy it manually. Copying only puts text on your device; it does not submit your lineup.", "#copy-button", { event: "click" }),
      step("Post it to Discord", "Paste the complete depth chart into the designated depth-chart submission channel before the announced deadline. Check the correct team and full text are included. This tour cannot verify a Discord post. You can finish this chapter without sending a practice lineup.", "#copy-status")
    ] },
    { title: "Camps", summary: "Understand allocations and prepare a camp submission.", route: function () { return core.paths.camps; }, steps: [
      step("Camps are player-development requests", "Camps Submission Planner prepares requests; Training Camp is a different page for reviewing training-camp results. Choose your team here. Check current announcements before sending a request; the sim number alone does not establish availability.", "#teamSelect", { event: "change", rememberTeam: true }),
      step("Check your allocation", "Review the allocation snapshot and Camp Tracker, then check the current camp rules. Availability depends on team allocation, player eligibility, and previous usage. A prepared draft does not reserve or spend camps.", "#allocationSummary"),
      step("Choose a player and camp", "Choose Camp Type and Player, then fill in the details that appear. Read the eligibility help. Different camps have different effects and restrictions; you do not need to make a real request to learn this screen.", "#campType"),
      step("Add to the plan", "Add Camp puts your completed entry into the local plan. It does not send it. If you are only looking around, use Next without adding anything. Existing plans are left untouched by the tour.", "#addCampButton", { event: "click", after: "#entryList .camp-entry" }),
      step("Review warnings and copy", "Inspect Current Plan and Warnings before copying the Discord Template. The planner flags common problems; the rulebook and commissioner determine eligibility. If clipboard access fails, select the template and copy it manually.", "#copyButton", { event: "click" }),
      step("Send only when applicable", "Paste the complete template using the camp destination and deadline in commissioner announcements. Check player, camp type, and requested changes before sending. Copying did not send or approve the request. You can stop here without submitting a practice request.", "#templateOutput")
    ] },
    { title: "Bids", summary: "Learn offseason bidding and the in-season alternative.", route: function () { return core.paths.faWarRoom; }, steps: [
      step("Learn bids at any time", "Offseason bids are accepted during announced free-agency rounds, not every sim. You can inspect this tool year-round. Only prepare a live sheet if bidding is open and you intend to use it. For example, a bid includes Player Name — Starting Salary — Annual Increase % — Total Years.", ".fa-header, .fa-title, h1"),
      step("Team and round", "Select the correct team and announced round. Round 1 normally allows three bids plus your own Bird-eligible players; later rounds normally allow ten total. Commissioner announcements may change allowances. Choosing a round in this tool does not open bidding.", "#fa-round"),
      step("Select your team", "Select your own club before building a bid sheet. Changing team or round loads that tool's corresponding saved draft. The tour leaves these selections to you.", "#fa-team", { event: "change", rememberTeam: true }),
      step("Find an available player", "Search or filter the free-agent list, then double-click a player's row to open the offer fields. A single click selects a row; clicking a name opens the player profile. OVR is overall rating. If there are no free agents, skip this step.", "#fa-player-body", { event: "dblclick", delegate: "[data-player-file]", after: "#fa-drawer[aria-hidden='false']" }),
      step("Enter contract terms", "Starting Salary is year-one pay; Annual % Increase sets raises based on that first-year amount; Years is the contract length. Bird Rights require the qualifying service shown in-game. Read the current rules for your division and the player's experience. Add Bid saves to this sheet, not to the league. You may skip this practice step.", "#fa-save-bid", { event: "click", after: "#fa-bid-list .fa-bid-row" }),
      step("Review the complete sheet", "Review every bid and warning. The copied sheet is numbered and alphabetised. Check contract limits, cap restrictions, Bird eligibility, and round allowance. A revised complete submission replaces your previous entire sheet before the deadline.", "#fa-bid-list"),
      step("Copy, then DM the commissioner", "Use Copy and paste the complete sheet in a commissioner DM before the announced deadline. If copying fails, select the output below and copy manually. Copying does not send a bid, reserve a player, or guarantee acceptance.", "#fa-copy", { event: "click" }),
      step("In-season signings work differently", "Ordinary in-season free-agent requests are for one-year minimum contracts and go in the designated public channel. The first valid request received gets the player, subject to cap and roster rules. Do not use an offseason bid-sheet DM as a substitute. Check announcements whenever you are unsure.", "#fa-output")
    ] }
  ];
  state.step = Math.min(state.step, chapters[state.chapter].steps.length - 1);

  function current() { return chapters[state.chapter].steps[state.step]; }
  function routeFor(item) {
    if (item.returnTo) return item.returnTo();
    if (item.route === null) return "";
    return chapters[state.chapter].route();
  }
  function navigate(url) {
    save();
    var destination = new URL(url, location.href);
    // Carry a bounded tour-only state when storage is blocked, including standalone navigation.
    if (!storageAvailable) destination.searchParams.set("gmTour", JSON.stringify(state));
    location.assign(destination.href);
  }
  function inPlace(item) {
    if (item.match) return item.match();
    if (item.route === null) return true;
    return new URL(routeFor(item), location.href).pathname === location.pathname;
  }
  function startChapter(index) {
    state.chapter = index; state.step = 0; state.active = true; save();
    var url = chapters[index].route();
    if (new URL(url, location.href).href === location.href) render(); else navigate(url);
  }
  function advance(direction) {
    if (direction > 0 && current().rememberTeam) remember(document.querySelector(current().selector));
    if (direction < 0) {
      if (!state.step) return;
      state.step -= 1;
    } else if (state.step < chapters[state.chapter].steps.length - 1) state.step += 1;
    else {
      if (state.completed.indexOf(state.chapter) < 0) state.completed.push(state.chapter);
      state.active = false; save(); showFinished(); return;
    }
    save();
    var item = current(), route = routeFor(item);
    if (route && !inPlace(item)) navigate(route); else render();
  }
  function clear() {
    clearInterval(timer); target = null;
    if (panel) panel.remove(); if (ring) ring.remove();
    panel = ring = null;
    document.documentElement.classList.remove("gm-tour-running");
    var reopen = document.getElementById("gm-tour-reopen"); if (reopen) reopen.remove();
  }
  function phaseText() {
    return (state.phase ? "Site label: " + state.phase + ". " : "Current phase unconfirmed. ") + "Check announcements for open windows and deadlines.";
  }
  function detectPhase(title) {
    var match = String(title || "").match(/\b(Pre[-\s]?Offseason|Offseason Preview|Sim\s*\d+|FA\s*[12]|FA\s*3(?:\s*\/\s*TC)?|TC|Preseason)\b/i);
    if (!match) return "";
    // Same display mapping used by index.js; a label is deliberately not an open/closed gate.
    if (/^pre[-\s]?offseason|^offseason preview/i.test(match[1])) return "Sim 6";
    return match[1].replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ");
  }
  function phaseChanged() {
    save();
    var element = document.getElementById("gm-tour-phase"); if (element) element.textContent = phaseText();
    var context = document.getElementById("gm-tour-context"); if (context) context.textContent = phaseText();
  }
  function loadPhase() {
    try { state.phase = detectPhase(owner.document.title); } catch (ignore) { state.phase = ""; }
    phaseChanged();
    if (!state.phase) fetch(core.paths.mainIndex).then(function (response) { if (!response.ok) throw new Error("phase"); return response.text(); }).then(function (html) {
      var match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      state.phase = detectPhase(match && match[1]); phaseChanged();
    }).catch(function () { state.phase = ""; phaseChanged(); });
  }
  function teamLabel() {
    var team = teams.find(function (entry) { return entry.file === state.team; });
    return team ? team.name : "";
  }
  function remember(select) {
    if (!select || !select.options || !select.selectedOptions.length) return;
    var value = select.value, label = select.selectedOptions[0].textContent.trim();
    if (/^roster\d+\.htm$/i.test(value)) { state.team = value; save(); return; }
    var team = teams.find(function (entry) { return entry.file === value || entry.id === value || entry.name === label; });
    if (team) { state.team = team.file; save(); }
  }
  function visible(selector) {
    return Array.from(document.querySelectorAll(selector)).find(function (element) {
      return element.getClientRects().length && getComputedStyle(element).visibility !== "hidden";
    });
  }
  function position() {
    if (!target || !ring || !panel) return;
    var rect = target.getBoundingClientRect();
    var panelRect = panel.getBoundingClientRect();
    // Dock opposite the highlighted element where possible; keep the real controls clickable.
    var overlapBottom = rect.height < innerHeight - panelRect.height - 48 && rect.bottom > innerHeight - panelRect.height - 28 && rect.top < innerHeight;
    panel.style.bottom = overlapBottom ? "auto" : "16px";
    panel.style.top = overlapBottom ? "8px" : "auto";
    rect = target.getBoundingClientRect();
    ring.style.left = Math.max(2, rect.left - 4) + "px";
    ring.style.top = Math.max(2, rect.top - 4) + "px";
    ring.style.width = Math.max(0, Math.min(innerWidth - 4, rect.right + 4) - Math.max(2, rect.left - 4)) + "px";
    ring.style.height = Math.max(0, Math.min(innerHeight - 2, rect.bottom + 4) - Math.max(2, rect.top - 4)) + "px";
    ring.hidden = rect.bottom < 0 || rect.top > innerHeight;
  }
  function buttons() {
    return '<div class="gm-tour-controls"><button data-tour="back"' + (!state.step ? " disabled" : "") + '>Back</button><button data-tour="next">' + (state.step === chapters[state.chapter].steps.length - 1 ? "Finish chapter" : "Next") + '</button><button data-tour="retry" hidden>Retry</button></div><div class="gm-tour-secondary"><button data-tour="skip-step">Skip step</button><button data-tour="skip">Skip chapter</button><button data-tour="exit">Exit</button><a href="' + esc(home) + '">Chapters</a></div>';
  }
  function makePanel() {
    panel = document.createElement("section"); panel.id = "gm-tour-panel";
    panel.setAttribute("role", "region"); panel.setAttribute("aria-label", "New GM guided tour");
    document.body.appendChild(panel);
    document.documentElement.classList.add("gm-tour-running");
    panel.addEventListener("click", function (event) {
      var button = event.target.closest("[data-tour]"); if (!button) return;
      var action = button.dataset.tour;
      if (action === "back") advance(-1);
      if (action === "next" || action === "skip-step") advance(1);
      if (action === "retry") {
        var route = routeFor(current());
        if ((!inPlace(current()) || !target) && route && new URL(route, location.href).href !== location.href) navigate(route);
        else render();
      }
      if (action === "return") navigate(routeFor(current()) || chapters[state.chapter].route());
      if (action === "skip") {
        state.active = false; save(); clear(); navigate(home);
      }
      if (action === "exit") {
        state.active = false; save(); clear(); showResume();
        if (previousFocus && previousFocus.isConnected) previousFocus.focus();
      }
      if (action === "continue") startChapter(Math.min(state.chapter + 1, chapters.length - 1));
    });
  }
  function showFinished() {
    clear(); makePanel();
    panel.innerHTML = '<p class="gm-tour-meta">Chapter complete</p><h2>' + esc(chapters[state.chapter].title) + '</h2><p>' + (state.chapter >= 3 ? "You have learned the preparation process. Only send a real submission when the applicable window is open. Nothing has been sent by this tour." : "You can revisit this chapter at any time.") + '</p><div class="gm-tour-controls">' + (state.chapter < 5 ? '<button data-tour="continue">Next chapter</button>' : '') + '<a href="' + esc(home) + '">All chapters</a><button data-tour="exit">Exit</button></div>';
    focusPanel();
  }
  function focusPanel() {
    var heading = panel.querySelector("h2"); heading.tabIndex = -1; heading.focus({ preventScroll: true });
  }
  function render() {
    clear();
    if (!state.active) { showResume(); return; }
    previousFocus = document.activeElement;
    makePanel();
    var item = current();
    panel.innerHTML = '<div class="gm-tour-reading"><div class="gm-tour-meta">' + esc(chapters[state.chapter].title) + ' · ' + (state.step + 1) + ' / ' + chapters[state.chapter].steps.length + '</div><p class="gm-tour-context" id="gm-tour-context">' + esc(phaseText()) + '</p><h2>' + esc(item.title) + '</h2><p>' + esc(item.text) + '</p>' + (teamLabel() ? '<p class="gm-tour-meta">Your club: ' + esc(teamLabel()) + ' · Check the tool selection matches.</p>' : '') + '<p id="gm-tour-status" role="status" aria-live="polite"></p></div>' + buttons();
    if (!storageAvailable) panel.insertAdjacentHTML("beforeend", '<p class="gm-tour-context">Browser storage is unavailable. Progress follows this open tour, but may not survive closing the page.</p>');
    if (!inPlace(item)) {
      panel.querySelector('[data-tour="next"]').hidden = true;
      panel.querySelector('[data-tour="retry"]').hidden = false;
      document.getElementById("gm-tour-status").textContent = "This step is on another page. Retry returns to the walkthrough; you can also skip this step.";
      focusPanel(); return;
    }
    ring = document.createElement("div"); ring.id = "gm-tour-highlight"; ring.hidden = true; ring.setAttribute("aria-hidden", "true"); document.body.appendChild(ring);
    started = Date.now();
    var status = document.getElementById("gm-tour-status");
    status.textContent = "Waiting for the page and league data…";
    panel.querySelector('[data-tour="next"]').disabled = true;
    function locate() {
      if (!panel || !state.active) return;
      var found = visible(item.selector);
      // Team lists and tables are async; do not highlight their initial loading shell.
      if (found && found.tagName === "SELECT" && found.options.length < 2) found = null;
      if (found && /^(playerTable|fa-player-body|teamTablePanel)$/.test(found.id) && !found.querySelector("a, tbody tr, .fa-player-row")) found = null;
      if (found) {
        var changed = target !== found; target = found;
        if (changed) {
          var tall = target.getBoundingClientRect().height > innerHeight - panel.getBoundingClientRect().height - 48;
          target.scrollIntoView({ block: tall ? "start" : "center", inline: "nearest", behavior: "instant" });
          ring.hidden = false;
          status.textContent = item.event ? "Use the highlighted control, or choose Next to continue without changing your draft." : "Read the explanation, then choose Next.";
          panel.querySelector('[data-tour="next"]').disabled = false;
          panel.querySelector('[data-tour="retry"]').hidden = true;
        }
        position();
      } else {
        target = null; ring.hidden = true;
        if (Date.now() - started > 12000) {
          status.textContent = "This control or data is unavailable. It may still be loading, or there may be no eligible entries. Retry or skip this step to continue.";
          panel.querySelector('[data-tour="retry"]').hidden = false;
        }
      }
    }
    locate(); timer = setInterval(locate, 350); focusPanel();
  }
  function showResume() {
    if (isHome || (!state.step && !state.chapter && !state.completed.length)) return;
    var button = document.createElement("button"); button.id = "gm-tour-reopen"; button.textContent = "Resume GM tour";
    button.addEventListener("click", function () { state.active = true; save(); var route = routeFor(current()); if (!inPlace(current()) && route) navigate(route); else render(); });
    document.body.appendChild(button);
  }
  function renderHome() {
    var container = document.getElementById("gm-tour-chapters"); if (!container) return;
    container.innerHTML = chapters.map(function (chapter, index) {
      var complete = state.completed.indexOf(index) >= 0;
      return '<article class="gm-tour-chapter"><span class="gm-tour-kicker">' + (complete ? "Completed" : "Chapter " + (index + 1)) + '</span><h3>' + esc(chapter.title) + '</h3><p>' + esc(chapter.summary) + '</p><button type="button" data-chapter="' + index + '">' + (complete ? "Restart chapter" : "Start chapter") + '</button></article>';
    }).join("");
    container.addEventListener("click", function (event) { var button = event.target.closest("[data-chapter]"); if (button) startChapter(Number(button.dataset.chapter)); });
    var resume = document.getElementById("gm-tour-resume");
    resume.textContent = state.active || state.step || state.chapter ? "Resume tour" : "Start tour";
    resume.addEventListener("click", function () { state.active = true; save(); var route = routeFor(current()); if (route && !inPlace(current())) navigate(route); else render(); });
    document.getElementById("gm-tour-reset").addEventListener("click", function () {
      if (!window.confirm("Reset only your GM tour progress? Your tool drafts will be kept.")) return;
      var phase = state.phase; state = fresh(); state.phase = phase; save(); clear(); location.reload();
    });
    document.getElementById("gm-tour-storage").textContent = storageAvailable ? "Progress is saved only in this browser. Tool drafts are separate." : "Storage is unavailable. You can still take the tour, but progress may not survive closing this page.";
  }
  // Observe existing controls without replacing their handlers or mutating tool state.
  ["click", "change", "dblclick"].forEach(function (type) {
    document.addEventListener(type, function (event) {
      if (!state.active || !panel || panel.contains(event.target)) return;
      var item = current(), anchor = event.target.closest("a[href]");
      if (item.event === type && inPlace(item) && event.target.closest(item.selector) && (!item.delegate || event.target.closest(item.delegate))) {
        if (type === "change" && event.target.tagName === "SELECT" && !event.target.value) return;
        if (item.rememberTeam) remember(event.target);
        if (item.link || item.navigation) {
          state.step = Math.min(state.step + 1, chapters[state.chapter].steps.length - 1); save();
          if (item.navigation && !storageAvailable) event.gmTourNavigation = true;
          setTimeout(render, 100);
        } else {
          var before = item.after ? document.querySelectorAll(item.after).length : 0;
          var observed = state.chapter + ":" + state.step;
          setTimeout(function () {
            if (!state.active || observed !== state.chapter + ":" + state.step) return;
            if (!item.after || document.querySelectorAll(item.after).length > before) advance(1);
          }, 150);
        }
      }
      // Native links keep normal navigation, including targets. Carry state only if needed.
      if (anchor && !storageAvailable) {
        var url = new URL(anchor.href, location.href);
        if (url.origin === location.origin && /\.(?:htm|html)$/i.test(url.pathname)) {
          url.searchParams.set("gmTour", JSON.stringify(state)); anchor.href = url.href;
        }
      }
    }, true);
  });
  // Roster selection navigates in the tool's own handler. Carry the fallback
  // after that handler runs, without replacing it or changing frame names.
  window.addEventListener("change", function (event) {
    if (event.gmTourNavigation) navigate(roster());
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && panel) { state.active = false; save(); clear(); showResume(); if (previousFocus && previousFocus.isConnected) previousFocus.focus(); }
  });
  window.addEventListener("resize", position);
  document.addEventListener("scroll", position, true);
  window.LeagueGmTour = { start: startChapter, phaseFromTitle: detectPhase };
  if (!isHome && !state.active && !state.step && !state.chapter && !state.completed.length) return;
  var css = document.createElement("link"); css.rel = "stylesheet"; css.href = root + "00-assets/css/gm-tour.css?v=1"; document.head.appendChild(css);
  function init() {
    save(); renderHome(); loadPhase();
    core.loadJsonData("teams.json").then(function (data) { teams = Array.isArray(data) ? data : []; }).catch(function () {});
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
