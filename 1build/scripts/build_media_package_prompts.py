import json
import os
import re


ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD_DIR = os.path.dirname(ROOT)
DATABASE_DIR = os.path.join(BUILD_DIR, "database")
MONTHLY_DIR = os.path.join(DATABASE_DIR, "monthly")
PROJECT_ROOT = os.path.dirname(BUILD_DIR)
PROMPTS_DIR = os.path.join(PROJECT_ROOT, "2bslmedia", "content", "prompts")
OUTPUT_PATH = os.path.join(PROMPTS_DIR, "monthly_editorial_package.json")
ARTICLES_DIR = os.path.join(PROJECT_ROOT, "2bslmedia", "content", "articles")

LATEST_SIM_RESULTS_PATH = os.path.join(MONTHLY_DIR, "latest_sim_results.json")
MONTHLY_TEAM_FORM_PATH = os.path.join(MONTHLY_DIR, "monthly_team_form.json")
OVERALL_TEAM_FORM_PATH = os.path.join(MONTHLY_DIR, "overall_team_form.json")
TIER_RACE_SNAPSHOT_PATH = os.path.join(MONTHLY_DIR, "tier_race_snapshot.json")
MONTHLY_STORYLINES_PATH = os.path.join(MONTHLY_DIR, "monthly_storylines.json")
TEAMS_PATH = os.path.join(DATABASE_DIR, "teams.json")

TIER_ORDER = ["Tier 1", "Tier 2", "Tier 3"]
POWER_RANKING_SERIES = {
    "Tier 1": "clb_power_rankings",
    "Tier 2": "elb_power_rankings",
    "Tier 3": "ecl_power_rankings",
}


def load_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def find_latest_power_ranking_article(tier_name):
    series = POWER_RANKING_SERIES.get(tier_name, "")
    if not series or not os.path.isdir(ARTICLES_DIR):
        return ""

    pattern = re.compile(rf"^{re.escape(series)}_(\d+)_(\d+)\.html$", re.IGNORECASE)
    matches = []
    for filename in os.listdir(ARTICLES_DIR):
        match = pattern.match(filename)
        if not match:
            continue
        matches.append((int(match.group(1)), int(match.group(2)), filename))

    if not matches:
        return ""

    _, _, filename = max(matches, key=lambda item: (item[0], item[1]))
    return f"../articles/{filename}"


def build_team_star_lookup(teams):
    return {
        team.get("name", ""): team.get("starPlayer")
        for team in teams
        if team.get("name") and team.get("starPlayer")
    }


def compact_team_stars(team_star_lookup):
    return [
        {
            "team": team,
            "starPlayer": star_player,
        }
        for team, star_player in sorted(team_star_lookup.items())
    ]


def build_power_rankings(overall_team_form, monthly_team_form, period_label, team_star_lookup):
    prompts = []
    overall_tiers = overall_team_form.get("tiers", {})
    monthly_tiers = monthly_team_form.get("tiers", {})

    for tier_name in TIER_ORDER:
        overall_teams = list(overall_tiers.get(tier_name, []))
        monthly_lookup = {
            team["team"]: team
            for team in monthly_tiers.get(tier_name, [])
        }
        prompts.append(
            {
                "id": f'{tier_name.lower().replace(" ", "-")}-power-rankings',
                "type": "power_rankings",
                "tier": tier_name,
                "title": f"{tier_name} Power Rankings",
                "period": period_label,
                "previousArticle": find_latest_power_ranking_article(tier_name),
                "prompt": (
                    f"Write a {tier_name} power rankings article for {period_label}. Rank the teams yourself "
                    "using the context below. Use overall season-to-date performance as the base ranking logic, "
                    "and use the latest sim performance to explain changes, jumps, or drops from the previous board. "
                    "Explicitly note changes from the last published power rankings article if those changes feel "
                    "meaningful, but do not force movement notes for every team. You are allowed to pull extra "
                    "context from any of the linked JSON sources if it strengthens the board. When it fits the "
                    "article, mention the listed star players as roster context; starPlayer is the highest OVR "
                    "player on that team's current roster."
                ),
                "writerNotes": [
                    "Use the team pool as context, not as a locked final order.",
                    "Base the ranking on overall form, not just one sim.",
                    "Use the latest sim to justify movement, momentum, and skepticism.",
                    "Work in star-player mentions for the biggest teams, risers, fallers, or arguments where roster quality matters.",
                    "Call out at least one riser, one faller, and one team you are still unsure about.",
                ],
                "availableContext": [
                    "../../1build/database/monthly/overall_team_form.json",
                    "../../1build/database/monthly/monthly_team_form.json",
                    "../../1build/database/monthly/latest_sim_results.json",
                    "../../1build/database/monthly/tier_race_snapshot.json",
                    "../../1build/database/monthly/monthly_storylines.json",
                    "../../1build/database/standings.json",
                    "../../1build/database/game_results.json",
                    "../../1build/database/teams.json",
                    "../../1build/database/players.json",
                    "../../1build/database/player_stats.json",
                ],
                "teamPool": [
                    {
                        "team": team["team"],
                        "overall": {
                            "record": team["record"],
                            "streak": team["streak"],
                            "last3": team["last3"],
                            "avgMargin": team["avgMargin"],
                            "pointDiff": team["pointDiff"],
                            "bestWin": team["bestWin"],
                            "worstLoss": team["worstLoss"],
                            "closeGameCount": team["closeGameCount"],
                        },
                        "latestSim": {
                            "record": monthly_lookup.get(team["team"], {}).get("record", "0-0"),
                            "streak": monthly_lookup.get(team["team"], {}).get("streak", "-"),
                            "last3": monthly_lookup.get(team["team"], {}).get("last3", "-"),
                            "avgMargin": monthly_lookup.get(team["team"], {}).get("avgMargin", 0.0),
                            "pointDiff": monthly_lookup.get(team["team"], {}).get("pointDiff", 0),
                            "bestWin": monthly_lookup.get(team["team"], {}).get("bestWin"),
                            "worstLoss": monthly_lookup.get(team["team"], {}).get("worstLoss"),
                            "closeGameCount": monthly_lookup.get(team["team"], {}).get("closeGameCount", 0),
                        },
                        "rosterUrl": team["rosterUrl"],
                        "starPlayer": team_star_lookup.get(team["team"]),
                    }
                    for team in overall_teams
                ],
            }
        )

    return prompts


def build_race_watch(tier_race_snapshot, period_label):
    return {
        "id": "promotion-relegation-watch",
        "type": "race_watch",
        "title": "Promotion / Relegation Watch",
        "period": period_label,
        "prompt": (
            f"Write a promotion/relegation watch article for {period_label}. Cover Tier 1 relegation, "
            "Tier 2 promotion and relegation, and Tier 3 promotion. Focus on the live line, the closest "
            "chasers, and who has momentum. You can use any of the linked JSON context if it helps explain "
            "why a race is tightening or loosening."
        ),
        "writerNotes": [
            "Tier 1 has 2 relegation spots.",
            "Tier 2 has 2 promotion spots and 1 relegation spot.",
            "Tier 3 has 1 promotion spot.",
            "Explain the pressure line clearly before making bigger editorial claims.",
        ],
        "availableContext": [
            "../../1build/database/monthly/tier_race_snapshot.json",
            "../../1build/database/monthly/monthly_team_form.json",
            "../../1build/database/monthly/overall_team_form.json",
            "../../1build/database/monthly/latest_sim_results.json",
            "../../1build/database/standings.json",
            "../../1build/database/game_results.json",
        ],
        "races": tier_race_snapshot.get("races", []),
    }


def build_stock_report(monthly_team_form, period_label):
    teams = [team for tier in monthly_team_form.get("tiers", {}).values() for team in tier]
    ordered_up = sorted(
        teams,
        key=lambda team: (team["wins"], team["pointDiff"], team["avgMargin"]),
        reverse=True,
    )
    ordered_down = sorted(
        teams,
        key=lambda team: (team["wins"], team["pointDiff"], team["avgMargin"]),
    )

    stock_up = ordered_up[:3]
    stock_down = ordered_down[:3]

    return {
        "id": "stock-up-stock-down",
        "type": "stock_report",
        "title": "Stock Up / Stock Down",
        "period": period_label,
        "prompt": (
            f"Write a Stock Up / Stock Down piece for {period_label}. Pick exactly three teams up and "
            "three teams down from the latest sim and explain the change in plain language. You can pull "
            "supporting detail from any linked JSON source if a team's monthly record alone is too thin."
        ),
        "writerNotes": [
            "Do not just sort by record; explain why the shape of the month matters.",
            "A close 1-0 month can be less convincing than a dominant 1-0 month.",
            "Use concise, punchy sections rather than one long essay.",
        ],
        "availableContext": [
            "../../1build/database/monthly/monthly_team_form.json",
            "../../1build/database/monthly/overall_team_form.json",
            "../../1build/database/monthly/monthly_storylines.json",
            "../../1build/database/monthly/latest_sim_results.json",
            "../../1build/database/standings.json",
            "../../1build/database/game_results.json",
        ],
        "stockUpPool": stock_up,
        "stockDownPool": stock_down,
    }


def build_month_in_review(monthly_storylines, latest_sim_results, period_label, team_star_lookup):
    storyline_lookup = {item["id"]: item for item in monthly_storylines.get("storylines", [])}
    featured_ids = monthly_storylines.get("featured", [])
    featured = [storyline_lookup[item_id] for item_id in featured_ids if item_id in storyline_lookup]

    return {
        "id": "month-in-review",
        "type": "month_in_review",
        "title": "Month in Review",
        "period": period_label,
        "prompt": (
            f"Write a Month in Review feature for {period_label}. Use the featured storylines below to build "
            "a coherent recap of the sim: best performances, biggest swings, weirdest result, and what matters next. "
            "You can pull from any linked JSON source if the strongest story sits outside the featured shortlist. "
            "Use star-player context when it helps explain a result, a hot team, or why a matchup mattered."
        ),
        "writerNotes": [
            "Lead with the strongest monthly theme, not just the biggest scoreline.",
            "Work across tiers if the month demands it.",
            "Mention star players naturally, not as a checklist.",
            "End with a forward-looking note about next month.",
        ],
        "availableContext": [
            "../../1build/database/monthly/monthly_storylines.json",
            "../../1build/database/monthly/monthly_team_form.json",
            "../../1build/database/monthly/overall_team_form.json",
            "../../1build/database/monthly/tier_race_snapshot.json",
            "../../1build/database/monthly/latest_sim_results.json",
            "../../1build/database/standings.json",
            "../../1build/database/game_results.json",
            "../../1build/database/teams.json",
            "../../1build/database/players.json",
            "../../1build/database/freeagents.json",
        ],
        "featuredStorylines": featured,
        "teamStarPlayers": compact_team_stars(team_star_lookup),
        "latestSimGameCount": len(latest_sim_results.get("results", [])),
    }


def main():
    os.makedirs(PROMPTS_DIR, exist_ok=True)

    latest_sim_results = load_json(LATEST_SIM_RESULTS_PATH)
    monthly_team_form = load_json(MONTHLY_TEAM_FORM_PATH)
    overall_team_form = load_json(OVERALL_TEAM_FORM_PATH)
    tier_race_snapshot = load_json(TIER_RACE_SNAPSHOT_PATH)
    monthly_storylines = load_json(MONTHLY_STORYLINES_PATH)
    teams = load_json(TEAMS_PATH)

    period_label = latest_sim_results.get("period", {}).get("label", "Latest Sim")
    team_star_lookup = build_team_star_lookup(teams)

    output = {
        "source": [
            "../../1build/database/monthly/latest_sim_results.json",
            "../../1build/database/monthly/monthly_team_form.json",
            "../../1build/database/monthly/overall_team_form.json",
            "../../1build/database/monthly/tier_race_snapshot.json",
            "../../1build/database/monthly/monthly_storylines.json",
            "../../1build/database/teams.json",
        ],
        "period": latest_sim_results.get("period", {}),
        "package": {
            "powerRankings": build_power_rankings(overall_team_form, monthly_team_form, period_label, team_star_lookup),
            "promotionRelegationWatch": build_race_watch(tier_race_snapshot, period_label),
            "stockUpStockDown": build_stock_report(monthly_team_form, period_label),
            "monthInReview": build_month_in_review(monthly_storylines, latest_sim_results, period_label, team_star_lookup),
        },
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=4)

    print(f"Final count: 1 monthly editorial package saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
