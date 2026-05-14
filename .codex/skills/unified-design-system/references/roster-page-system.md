# Roster Page System

Supporting source:

- `00-assets/html/unified-roster.htm`

Read this when the page is more team-centric, tabular, or dashboard-like.

## What it adds beyond the player page

- A stronger team hero/banner treatment
- More visible card framing with top accent borders
- Sticky-column and sticky-header table patterns
- A slightly warmer paper palette

## Token direction

Useful supporting tokens from the roster page:

- paper background: `#f4f2ec`
- line color: `#d9d2c2`
- ink: `#111318`
- muted text: `#5a5246`

These pair well with the same navy team accent used by the player page.

## Patterns to reuse

- Hero block
  - dark team-color banner
  - logo, name, subline, actions
  - compact but dramatic

- Panel framing
  - white card
  - thin border
  - top accent border in team color
  - subtle offset shadow, not blur-heavy shadow

- Dense sortable tables
  - sticky header row
  - sticky first column when comparing many columns
  - narrow uppercase headers
  - strong scanability over decorative styling

## Use this file when

- Building roster/team pages
- Building dashboard-like layouts with modules and data tables
- You need a stronger shell than the player page's flatter card treatment

## Avoid

- Converting everything into a full-width dark theme
- Using the hero banner on pages that should stay mostly neutral
- Making tables roomy enough to lose comparison value
