# Changelog

## 0.1.1 - 2026-04-28

- Added a player search feature to the standings view using shared logic in `assets/features.js`.
- Search results now appear as a live dropdown while typing player names.
- Selecting a player from the dropdown opens that player's page within the existing index/frame site flow.
- Moved the search UI to a compact top-right floating control to avoid blocking the standings tables.
- Kept the standings HTML generator-safe by injecting the search interface through JavaScript instead of editing page structure.
- Added local data-loading support for `1build/players.json` so the feature works more reliably across supported browsers and local setups.
