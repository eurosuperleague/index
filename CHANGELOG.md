# Changelog

## 2026-05-01

### Added
- Added `1build/database/standings.json` generated from `standings.htm`.
- Added `1build/database/capreport.json` generated from `capreport.htm`.
- Added `1build/database/favicon.png` so generated data assets live together under the build database folder.

### Changed
- Moved generated JSON outputs into `1build/database/`.
- Updated `1build/build_players_json.py` to generate `players.json`, `teams.json`, `standings.json`, and `capreport.json` into `1build/database/`.
- Updated `assets/features.js` to load JSON data from `1build/database/`.
- Updated `1build/inject_css_js.py` so generated HTML files point to the favicon in `1build/database/favicon.png`.
- Refreshed generated HTML pages to use the new favicon path.

### Data Refresh
- Regenerated player, team, standings, and cap report database files.
- Refreshed generated league pages after the latest index update and league database export.
