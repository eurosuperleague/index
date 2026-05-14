---
name: unified-design-system
description: Use for frontend work in this repo when the page should follow the unified player page visual language. Applies the repo's preferred design system for cards, spacing, colors, tables, chips, hierarchy, and responsive behavior instead of default generic UI styling.
---

# Unified Design System

Use this skill for frontend work in this repository when the target should look like the unified player page family rather than the older default site styling.

## Primary references

Read these first:

- Primary visual reference: `references/player-page-system.md`
- Supporting roster/table patterns: `references/roster-page-system.md`

## Core rule

- Treat `00-assets/html/unified-player.htm` as the main aesthetic source of truth.
- Use `00-assets/html/unified-roster.htm` as the secondary reference for hero treatments, panel framing, and sticky data-table behavior.
- Do not fall back to generic SaaS styling or default Inter-heavy utility-app aesthetics unless the existing page already requires it.

## When applying this system

- New custom HTML shells in `00-assets/html/`
- Significant redesigns of maintained custom pages
- Shared components that should visually match unified player/roster surfaces

## When not to force it

- Small fixes inside generated league-export pages that should preserve legacy structure
- ESL Media article pages, which have their own editorial visual language
- Existing pages where the user explicitly asks to preserve a different design

## Workflow

1. Read `references/player-page-system.md`
2. If the work is table-heavy or roster-like, also read `references/roster-page-system.md`
3. Reuse the same token families, component shapes, and hierarchy before inventing new patterns
4. Prefer adapting an existing unified pattern over introducing a new one

## Fast decisions

- Need page tone, color, chips, topbar, panel, or stat treatment: read `references/player-page-system.md`
- Need hero banner, sticky first-column table, or denser team dashboard layout: read `references/roster-page-system.md`
