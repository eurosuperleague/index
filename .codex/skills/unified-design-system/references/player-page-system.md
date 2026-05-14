# Player Page System

Primary source:

- `00-assets/html/unified-player.htm`

Use this as the main source of truth for the preferred visual language.

## Overall feel

- Clean sports-reference surface, not startup dashboard chrome
- Light paper background with white content cards
- Strong team-color accent used sparingly for emphasis
- Compact spacing with clear hierarchy and dense useful information
- Minimal radius and restrained shadows

## Token direction

Use these token ideas unless the page already supplies dynamic team colors:

- team accent: `#111b36`
- secondary accent: `#1d3666`
- paper background: `#f6f7f9`
- card background: `#ffffff`
- line color: `#d8dee7`
- muted text: `#5f6368`
- body ink: `#202124`

Typography direction:

- Sans-led interface
- Tight, crisp uppercase labels
- Large player/team names with stronger weight
- Avoid decorative gradients or oversized rounded-pill UI

## Components to reuse

- `topbar`
  - simple bordered white utility bar
  - compact controls
  - search and nav actions live here

- `player-header`
  - white card
  - left accent border in team color
  - strong title, muted metadata, rating chips, statline

- `panel`
  - white block
  - thin border
  - optional pale header strip
  - no oversized radius or floating-card excess

- `panel-head` and `panel-title`
  - uppercase label treatment
  - high contrast and tight letterspacing

- `rating-chip`, `skill-chip`, `info-chip`
  - small, dense, informative, never bloated
  - use accent fills only for important status

- `tab-btn`
  - rectangular, compact, bordered
  - accent fill only for active state

## Table behavior

- Tables should feel dense and readable, not roomy
- Use clear borders and sticky headers where helpful
- Let data density win over decorative spacing
- Horizontal overflow is acceptable when it preserves comparability

## Do

- Preserve compact information density
- Use team color as the anchor color, not as a full-page wash
- Prefer white cards on a pale paper field
- Use strong hierarchy for names, labels, and key values
- Keep interactions restrained and practical

## Avoid

- Rounded-corner-heavy app UI
- Purple-first palettes
- Large soft shadows
- Generic glassmorphism, neon gradients, or trendy dashboard fluff
- Huge empty spacing that lowers information density
