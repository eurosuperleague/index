# GM tour maintenance

The main league menu opens `00-assets/html/gm-tour.htm`. Shared `core.js` loads
`gm-tour.js` on both custom pages and export pages, so the ordinary build's
existing core injection keeps the tour available after new exports. History
and Super Cup are outside this tour.

Chapter definitions, target selectors, copy, and observed actions live in
`00-assets/js/gm-tour.js`; presentation lives in `00-assets/css/gm-tour.css`.
When a tool changes its controls, update the corresponding selectors and run
the browser checks. The controller observes existing handlers and never writes
to tool draft keys or invokes their editing controls.

Only the tour's `esl-gm-tour:v1` key stores chapter, step, completed chapters,
selected team, and the last displayed phase. The top-level frame also keeps an
in-memory copy. If storage is unavailable, tour navigation carries its state
in a temporary `gmTour` query parameter, removed on arrival. That fallback
does not promise persistence after closing a standalone page.

Phase wording uses the same title patterns and offseason-preview mapping as
the main index. It never determines whether bids or camps are open. Keep
announcements and the rulebook authoritative. Do not add actual submission
automation or claim that clipboard actions verify Discord posts.

Run `node 00-build/tests/gm_tour_browser.cjs` with Playwright available on
`NODE_PATH`. The test starts a temporary HTTP server and uses installed Edge
by default; `PLAYWRIGHT_CHANNEL` can select another installed channel. It
covers live navigation, frame integration, progress, missing targets,
clipboard failure, draft preservation, keyboard exit, and mobile bounds.
Screenshots go to the OS temporary directory.

Run `node 00-build/tests/fa_war_room_rules.cjs` for the related FA salary,
Bird-round allowance, and offseason cap-exception checks. The browser suite
reports and excludes only the pre-existing player-profile media embed's
missing standings-feed error; all other uncaught page errors fail the suite.
