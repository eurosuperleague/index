# Build Flow

Use this file when the task involves refreshing data, tracing generated output, or deciding where a change belongs in the pipeline.

## Main build entrypoints

- `00-build/scripts/build.py`
  - Runs the main league-site build
  - Supports `--dry-run`
  - Calls, in order:
    1. `build_players_json.py`
    2. `build_youth_intake_json.py`
    3. `build_monthly_jsons.py`
    4. `build_media_package_prompts.py`
    5. `ensure_settings_page.py`
    6. `inject_css_js.py`
    7. `validate_media_site.py`

- `00-build/scripts/build_supercup.py`
  - Runs the Super Cup build
  - Supports `--dry-run`
  - Calls, in order:
    1. `build_supercup_json.py`
    2. `build_supercup_knockout.py`
    3. `build_supercup_ui.py`
  - Verifies required Super Cup shell files exist

## Practical build rules

- If a task affects league data extraction, start with `build_players_json.py`.
- If a task affects monthly editorial/context JSON, start with `build_monthly_jsons.py` or `build_media_package_prompts.py`.
- If a task affects shared league-page UI availability, start with `inject_css_js.py`.
- If a task affects ESL Media publishing integrity, check `validate_media_site.py`.

## High-value source files

- `00-assets/FEATURES_README_DRAFT.md`
  - Human-readable quick start for local build/server flow
- `00-build/scripts/build.py`
  - Canonical sequence for the main build
- `00-build/scripts/build_supercup.py`
  - Canonical sequence for the Super Cup build

## Output expectations

- `00-build/database/` holds generated JSON consumed by newer site features.
- `00-build/database/monthly/` holds monthly editorial/supporting JSON.
- HTML pages may be rewritten or augmented by injection steps, so verify whether a file is source, template, or emitted output before editing it directly.

## Safe debugging order

1. Identify whether the bug is in source data, transformation logic, or frontend rendering.
2. Read the build script that produces the affected output.
3. Check the generated file in `00-build/database/` only after understanding the producer.
4. Use dry-run capable entrypoints when verifying pipeline changes.
