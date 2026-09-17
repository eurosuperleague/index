# Player Database tools

The maintained player database loads `player-database-tools.js` and its scoped stylesheet. The controller provides the field registry, snapshot-aware expiry rule, prepared statistics, and rendering callbacks. Filters and CSV use the same getters as visible columns. Career statistics use current player details; the existing Current statistics fallback also applies to mixed-category views.

Preferences use browser storage key `esl.playerDatabase.tools.v1`. Named views contain ordered columns and sorting per tab; filter presets are separate. Explicit URL filter state takes precedence. View imports are versioned JSON and reject unsupported fields before mutation. No server or generated-feed edits are required.

Drag table headers to reorder columns; Player remains pinned first. A short click still sorts. Right-click actions remain available for keyboard users. Drag the filter dialog by its title bar; its bounds adjust to screen and content size. Status, Team and Position in the top bar share applied filter state with the dialog, including a combined label when several court positions are selected. Filters sits alongside the database tabs.

## Later integration

Add these tools to free-agent, potential-free-agent, and youth-intake pages in a follow-up. Supply a page-specific field registry and player pool; namespace local storage per surface before reuse. Keep each page's existing eligibility rules. Intake must expose only fields actually available in its feed, rather than inventing ratings or contracts. Do not alter generated export pages directly.

## Checks

Run `node --test 00-build/tests/test_player_database_tools.cjs`. With the site served on localhost:8765 and Playwright on NODE_PATH, run `node 00-build/tests/player_database_browser.cjs`. Existing feed checks: `python -m unittest discover -s 00-build/tests -p test_player_database.py`.
