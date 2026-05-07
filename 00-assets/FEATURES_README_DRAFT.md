# Site Features Guide Draft

This is a draft guide for running the extra site features. Read and edit this before posting it anywhere.

## Quick Start

1. Put the latest sim export files in the project like normal.
2. Run `00-build/run_build.bat`.
3. Run `00-build/scripts/server.bat`.
4. Open `http://localhost:8000/index.htm` in your browser.

If you are only viewing the site locally from files, most pages still work by opening `index.htm`, but the local server is safer because browsers can block some JSON loading from `file://`.

## What The Build Does

Run:

```bat
00-build/run_build.bat
```

This runs `00-build/scripts/build.py`, which currently does two main jobs:

1. Builds the shared JSON databases from the generated league HTML files.
2. Injects the shared CSS and JavaScript links into the generated HTML pages.

The build creates or updates files in:

```text
00-build/database/
```

Important JSON files:

```text
players.json
player_stats.json
teams.json
standings.json
capreport.json
injuries.json
```

These JSONs are what the newer JavaScript features read from. The features do not need to scrape the HTML every time someone opens the site.

## Running The Local Server

Run:

```bat
00-build/scripts/server.bat
```

Then open:

```text
http://localhost:8000/index.htm
```

The server starts from the main repo folder, so links like `players/`, `rosters/`, `00-assets/`, and `00-build/database/` should all resolve correctly.

## Main Feature Files

Shared styling:

```text
00-assets/css/styles.css
```

General site features:

```text
00-assets/js/features.js
```

Table sorting:

```text
00-assets/js/sort.js
```

Depth chart builder:

```text
00-assets/html/depthcharts.htm
00-assets/js/depthcharts.js
```

Build scripts:

```text
00-build/scripts/build.py
00-build/scripts/build_players_json.py
00-build/scripts/inject_css_js.py
```

## Current Features

### Shared Site Styling

`00-assets/css/styles.css` controls the newer look across the generated HTML pages. The build injects this into the HTML pages so the league output keeps the custom design after every sim update.

### Player Search

The player search uses `players.json`. It lets you search players quickly instead of manually opening team pages.

If search is not updating after a new sim, run the build again so `players.json` is refreshed.

### Ratings Pills

OVR and POT are pulled into `players.json` from `LeagueOutput.mdb` when available. The frontend can then show rating-style labels without manually editing player pages.

If ratings are missing, check that `LeagueOutput.mdb` exists in the project root before running the build.

### Cap Report

The cap report data is generated into:

```text
00-build/database/capreport.json
```

The menu link is injected through JavaScript instead of manually editing `menu.htm`.

### Injuries

The injury data is generated into:

```text
00-build/database/injuries.json
```

If the file is empty, the site will not have injury data to display yet. Once injuries are present, frontend features can use it for red injury tags, injury reports, or depth chart IR helpers.

### Waiver Wire Table

The waiver wire feature uses the shared player database to create a cleaner searchable/filterable table.

If players are missing here, rebuild `players.json`.

### Depth Chart Builder

Open:

```text
00-assets/html/depthcharts.htm
```

The depth chart builder lets you:

1. Pick a team.
2. Select players from that team roster.
3. Type in any player name if someone is traded or missing from the roster list.
4. Set positions and minutes.
5. Bold specific changed lines.
6. Set offense and defense gameplan values.
7. Auto-fill top 13.
8. Auto-distribute minutes to exactly 240.
9. Copy the formatted depth chart template.
10. Load a pasted depth chart text back into the builder.

Depth charts are saved in browser local storage by team, so refreshing the page should keep the current chart on the same computer/browser.

## After Uploading A New Sim

Do this each time the league HTML output changes:

1. Replace or update the generated league files.
2. Make sure `LeagueOutput.mdb` is present if you want OVR/POT ratings.
3. Run `00-build/run_build.bat`.
4. Run or restart `00-build/scripts/server.bat`.
5. Refresh the browser.

If a feature still looks old, do a hard refresh. Some browsers cache JavaScript aggressively.

## Things You Should Not Need To Edit Manually

Do not manually edit generated pages unless it is temporary. They can be overwritten by the next sim export.

Usually avoid manually editing:

```text
players/
rosters/
standings.htm
leaders.htm
transactions.htm
menu.htm
```

Prefer editing:

```text
00-assets/css/styles.css
00-assets/js/features.js
00-assets/js/depthcharts.js
00-assets/html/depthcharts.htm
00-build/scripts/
```

This keeps custom features separate from generated league output.

## Troubleshooting

If a feature is missing:

1. Run `00-build/run_build.bat`.
2. Check that the page has links to `00-assets/css/styles.css`, `00-assets/js/sort.js`, and `00-assets/js/features.js`.
3. Use the local server instead of opening files directly.
4. Hard refresh the browser.

If JSON is missing or outdated:

1. Check `00-build/database/`.
2. Run the build again.
3. Make sure the source HTML files exist, especially `players/`, `rosters/`, `standings.htm`, `capreport.htm`, and `injuries.htm`.

If depth charts do not save:

1. Make sure browser local storage is enabled.
2. Use the same browser and same URL.
3. Avoid clearing browser site data unless you want to reset saved charts.

## Simple Mental Model

The generated sim HTML is the raw league output.

The build scripts turn that output into JSON databases.

The JavaScript features read those JSON databases and upgrade the site in the browser.

The custom feature code lives in `00-assets/`, so it survives new sim uploads better than direct edits to generated HTML.
