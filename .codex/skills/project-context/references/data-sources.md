# Data Sources

Use this file when the task is "where does this field come from?" or "which file should I trust?"

## Main generated data area

- `00-build/database/`
  - Primary generated JSON for the main league site
- `00-build/database/supercup/`
  - Parallel generated JSON for Super Cup
- `00-build/database/monthly/`
  - Derived editorial/context JSON

## Main producer

`00-build/scripts/build_players_json.py` is the main extraction pipeline for league data.

From its path setup and output definitions, it produces:

- `players.json`
- `player_stats.json`
- `player_gamelogs.json`
- `team_stats.json`
- `teams.json`
- `standings.json`
- `capreport.json`
- `injuries.json`
- `schedule.json`
- `freeagents.json`
- `leaders.json`
- `game_results.json`
- `awards.json`

## Key source-of-truth mapping

From `build_players_json.py`:

- roster/player-page extraction comes from:
  - `rosters/`
  - `players/`
- root pages used as structured inputs include:
  - `standings.htm`
  - `capreport.htm`
  - `injuries.htm`
  - `schedule.htm`
  - `freeagents.htm`
  - `leaders.htm`
  - `awards.htm`
  - `draft.htm`
- ratings enrichment may come from:
  - `LeagueOutput.mdb`

## Interpretation rules

- If a field is visible on a player or roster page, inspect `build_players_json.py` before editing JSON by hand.
- If OVR/POT or related ratings look missing, check whether `LeagueOutput.mdb` exists and whether the build imported it.
- If a standings or cap figure looks wrong, check the corresponding root `.htm` input before blaming the frontend.
- If a monthly narrative or prompt package looks wrong, trace it through `00-build/database/monthly/` rather than directly from article output.

## Trust order

Use this order when tracing issues:

1. Producer script
2. Source HTML/MDB input
3. Generated JSON
4. Frontend consumer
