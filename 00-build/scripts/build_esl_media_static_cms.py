"""
Build ESL Media articles from Git-backed static CMS entries.

The CMS stores article drafts as JSON files in:
  00-eslmedia/content/cms/articles/

This script exports published/scheduled entries into the existing static site:
  - 00-eslmedia/content/articles/<slug>.html
  - generated entries inside 00-eslmedia/content/media-articles.js
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
MEDIA_DIR = ROOT / "00-eslmedia"
CONTENT_DIR = MEDIA_DIR / "content"
CMS_ARTICLES_DIR = CONTENT_DIR / "cms" / "articles"
ARTICLES_DIR = CONTENT_DIR / "articles"
MANIFEST_PATH = CONTENT_DIR / "media-articles.js"
CMS_START = "  // ESL_MEDIA_CMS_START"
CMS_END = "  // ESL_MEDIA_CMS_END"

STATUSES = {"draft", "ready", "scheduled", "published", "archived"}
CATEGORIES = {"Analysis", "Scouting", "Interview", "Announcement", "Preview", "Recap", "Rankings", "Feature"}
SLUG_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*$")


def json_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if not value:
        return []
    return [item.strip() for item in str(value).split(",") if item.strip()]


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def load_entries() -> list[dict[str, Any]]:
    CMS_ARTICLES_DIR.mkdir(parents=True, exist_ok=True)
    entries = []
    for path in sorted(CMS_ARTICLES_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        data["_source"] = path
        if not data.get("slug"):
            data["slug"] = slugify(str(data.get("title", path.stem)))
        entries.append(data)
    return entries


def get_known_teams() -> set[str]:
    if not MANIFEST_PATH.exists():
        return set()
    text = MANIFEST_PATH.read_text(encoding="utf-8")
    match = re.search(r"window\.ESL_TEAM_LOGOS\s*=\s*\{(.*?)\};", text, re.S)
    return set(re.findall(r'"([^"]+)"\s*:', match.group(1))) if match else set()


def get_known_players() -> set[str]:
    path = ROOT / "00-build" / "database" / "players.json"
    if not path.exists():
        return set()
    data = json.loads(path.read_text(encoding="utf-8"))
    players = data.get("players", []) if isinstance(data, dict) else data
    return {
        str(player.get("name", "")).strip()
        for player in players
        if isinstance(player, dict) and player.get("name")
    }


def normalize(entry: dict[str, Any]) -> dict[str, Any]:
    title = str(entry.get("title", "")).strip()
    category = str(entry.get("category", "Analysis")).strip() or "Analysis"
    desk = str(entry.get("desk", category)).strip() or category
    tags = json_list(entry.get("tags"))
    teams = json_list(entry.get("related_teams") or entry.get("teams"))
    players = json_list(entry.get("related_players") or entry.get("playerTags"))
    publish_date = str(entry.get("publish_date") or dt.date.today().isoformat()).strip()
    return {
        "source": entry.get("_source"),
        "title": title,
        "slug": str(entry.get("slug") or slugify(title)).strip(),
        "author": str(entry.get("author", "ESL Media Desk")).strip() or "ESL Media Desk",
        "publish_date": publish_date[:10],
        "status": str(entry.get("status", "draft")).strip() or "draft",
        "category": category,
        "desk": desk,
        "tags": tags,
        "related_teams": teams,
        "related_players": players,
        "related_competitions": json_list(entry.get("related_competitions")),
        "hero_image": str(entry.get("hero_image") or "../article%20images/ESLM.png").strip(),
        "thumbnail": str(entry.get("thumbnail") or entry.get("hero_image") or "../article%20images/ESLM.png").strip(),
        "image_alt": str(entry.get("image_alt") or "ESL Media").strip(),
        "image_credit": str(entry.get("image_credit") or "ESL Media").strip(),
        "summary": str(entry.get("summary", "")).strip(),
        "body": str(entry.get("body") or entry.get("body_html") or "").strip(),
        "season": str(entry.get("season", "Season 8")).strip() or "Season 8",
        "sort_order": int(entry.get("sort_order") or 1),
    }


def validate(article: dict[str, Any], *, require_publishable: bool = False) -> list[str]:
    errors: list[str] = []
    if not article["title"]:
        errors.append("title is required")
    if not article["slug"] or not SLUG_RE.match(article["slug"]):
        errors.append("slug must use lowercase words separated by underscores")
    if article["status"] not in STATUSES:
        errors.append(f"status must be one of: {', '.join(sorted(STATUSES))}")
    if article["category"] not in CATEGORIES:
        errors.append(f"category must be one of: {', '.join(sorted(CATEGORIES))}")
    try:
        dt.date.fromisoformat(article["publish_date"])
    except ValueError:
        errors.append("publish_date must be YYYY-MM-DD")
    if not 1 <= article["sort_order"] <= 99:
        errors.append("sort_order must be between 1 and 99")

    known_teams = get_known_teams()
    bad_teams = [team for team in article["related_teams"] if known_teams and team not in known_teams]
    if bad_teams:
        errors.append(f"unknown teams: {', '.join(bad_teams)}")

    known_players = get_known_players()
    bad_players = [player for player in article["related_players"] if known_players and player not in known_players]
    if bad_players:
        errors.append(f"unknown players: {', '.join(bad_players)}")

    if require_publishable or article["status"] in {"ready", "scheduled", "published"}:
        for field in ("summary", "body", "hero_image", "thumbnail", "image_alt", "image_credit"):
            if not article[field]:
                errors.append(f"{field} is required before publishing")
        if not article["related_teams"]:
            errors.append("at least one related team is required before publishing")
    return errors


def is_exportable(article: dict[str, Any], today: dt.date) -> bool:
    if article["status"] == "published":
        return True
    if article["status"] != "scheduled":
        return False
    return dt.date.fromisoformat(article["publish_date"]) <= today


def sort_key(article: dict[str, Any]) -> str:
    return f"{article['publish_date']}-{article['sort_order']:02d}"


def markdown_to_html(text: str) -> str:
    if "<p" in text or "<div" in text or "<section" in text:
        return text
    blocks = [block.strip() for block in re.split(r"\n\s*\n", text) if block.strip()]
    rendered = []
    for block in blocks:
        if block.startswith("### "):
            rendered.append(f'<div class="section-header">{html.escape(block[4:].strip())}</div>')
        elif block.startswith("## "):
            rendered.append(f'<div class="section-header">{html.escape(block[3:].strip())}</div>')
        elif block.startswith("> "):
            rendered.append(f'<div class="pull-quote">{html.escape(block[2:].strip())}</div>')
        else:
            css = ' class="drop-cap"' if not rendered else ""
            rendered.append(f"<p{css}>{html.escape(block)}</p>")
    return "\n      ".join(rendered)


def render_article(article: dict[str, Any]) -> str:
    title = html.escape(article["title"])
    summary = html.escape(article["summary"])
    author = html.escape(article["author"])
    desk = html.escape(article["desk"])
    category = html.escape(article["category"])
    season = html.escape(article["season"])
    slug = html.escape(article["slug"])
    image = html.escape(article["hero_image"])
    body = markdown_to_html(article["body"])
    ticker_items = [title, summary, f"{desk} from {author}", title, summary, f"{desk} from {author}"]
    ticker = "".join(f'<div class="site-ticker-item">{item}</div>' for item in ticker_items)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} - ESL Media</title>
  <meta name="description" content="{summary}">
  <meta property="og:title" content="{title} - ESL Media">
  <meta property="og:description" content="{summary}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="{image}">
  <link rel="canonical" href="https://eurosuperleague.github.io/index/00-eslmedia/content/articles/{slug}.html">
  <style>
    @import url("../media-shared.css");
    :root {{ --gold:#111b36; --ink:#0F0F0F; --off-white:#F5F0E8; --red:#111b36; --mid:#3A3A3A; --light:#E8E2D5; --blue:#111b36; }}
    *,*::before,*::after{{box-sizing:border-box}}
    body{{background:var(--off-white);color:var(--ink);font-family:var(--font-sans);min-height:100vh}}
    .paper{{max-width:860px;margin:0 auto;background:#FEFCF7;border-top:6px solid var(--ink);box-shadow:4px 4px 0 var(--gold),8px 8px 0 var(--ink);padding:3rem 3.5rem 3.5rem}}
    .masthead{{text-align:center;border-bottom:3px double var(--ink);padding-bottom:1rem;margin-bottom:.5rem}}
    .league-name{{font-size:.75rem;font-weight:800;letter-spacing:.25em;text-transform:uppercase;color:var(--red)}}
    .section-label{{font-size:.65rem;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--mid);margin-top:.4rem}}
    .headline{{font-family:var(--font-serif);font-size:2.7rem;font-weight:900;line-height:1.05;margin:1rem 0 .4rem;letter-spacing:-.5px}}
    .dek{{font-size:1.05rem;font-weight:700;color:var(--mid);margin-bottom:1rem;line-height:1.4}}
    .byline-bar{{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);padding:.35rem 0;margin-bottom:1.8rem}}
    .byline,.dateline{{font-size:.72rem}} .byline{{font-weight:800;letter-spacing:.12em;text-transform:uppercase}} .dateline{{color:var(--mid);font-style:italic}}
    .body-text p{{font-size:.98rem;line-height:1.75;margin-bottom:1rem;color:#1a1a1a}}
    .drop-cap::first-letter{{font-family:var(--font-serif);font-size:3.8rem;font-weight:900;float:left;line-height:.8;margin:.1em .08em 0 0;color:var(--blue)}}
    .section-header{{font-size:.7rem;font-weight:800;letter-spacing:.25em;text-transform:uppercase;color:var(--blue);border-bottom:2px solid var(--blue);padding-bottom:.25rem;margin:1.8rem 0 .9rem}}
    .pull-quote{{border-left:5px solid var(--blue);padding:1rem 1.2rem;margin:1.5rem 0;background:#f7f9fd;font-family:var(--font-serif);font-size:1.35rem;font-weight:900;line-height:1.25}}
    .footer-rule{{border:none;border-top:2px solid var(--ink);margin-top:2.5rem;margin-bottom:.75rem}}
    .footer-text{{font-size:.65rem;color:var(--mid);text-align:center;letter-spacing:.15em;text-transform:uppercase}}
    @media(max-width:760px){{.paper{{padding:2rem 1.25rem 2.5rem;box-shadow:none}}.headline{{font-size:2.15rem}}.byline-bar{{align-items:flex-start;gap:.5rem;flex-direction:column}}}}
  </style>
</head>
<body class="media-article">
  <header class="site-topbar"><div class="site-topbar-inner"><div class="site-topbar-brand"><div class="site-edition-pill">Front Page</div><div>European Super League Sports Desk</div></div><ul class="site-topbar-nav"><li><a href="../../homepage.html" class="active">Home</a></li><li><a href="../all-articles.html">All Articles</a></li><li><a href="../articles/{slug}.html">Latest</a></li><li><a href="../analysis.html">Analysis</a></li><li><a href="../scouting.html">Scouting</a></li><li><a href="../interviews.html">Interviews</a></li><li><a href="../../../index.htm">League Site</a></li></ul></div></header>
  <div class="site-ticker"><div class="site-ticker-inner"><span class="site-ticker-label">{category}</span><div class="site-ticker-track">{ticker}</div></div></div>
  <div class="paper">
    <div class="masthead"><div class="league-name">European Super League - {desk}</div><div class="section-label">{category} - {season}</div></div>
    <h1 class="headline">{title}</h1>
    <p class="dek">{summary}</p>
    <div class="byline-bar"><span class="byline">{author}</span><span class="dateline">{season}</span></div>
    <div class="body-text">{body}</div>
    <hr class="footer-rule"><div class="footer-text">European Super League - {desk} - {season}</div>
  </div>
  <script src="../media-articles.js"></script>
  <script src="../media-ads.js"></script>
  <script src="../article-rail.js"></script>
</body>
</html>
"""


def manifest_object(article: dict[str, Any]) -> str:
    tag = article["tags"][0] if article["tags"] else article["category"]
    obj = {
        "file": f"articles/{article['slug']}.html",
        "title": article["title"],
        "category": article["category"],
        "desk": article["desk"],
        "sortKey": sort_key(article),
        "tag": tag,
        "author": article["author"],
        "meta": article["season"],
        "blurb": article["summary"],
        "teams": article["related_teams"],
    }
    if article["related_players"]:
        obj["playerTags"] = article["related_players"]
    lines = ["  {"]
    for index, (key, value) in enumerate(obj.items()):
        comma = "," if index < len(obj) - 1 else ""
        lines.append(f"    {key}: {json.dumps(value, ensure_ascii=False)}{comma}")
    lines.append("  },")
    return "\n".join(lines)


def inject_manifest(articles: list[dict[str, Any]], *, dry_run: bool) -> None:
    manifest = MANIFEST_PATH.read_text(encoding="utf-8")
    if CMS_START not in manifest or CMS_END not in manifest:
        manifest = manifest.replace("window.ESL_MEDIA_ARTICLES = [", f"window.ESL_MEDIA_ARTICLES = [\n{CMS_START}\n{CMS_END}", 1)
    generated = "\n".join(manifest_object(article) for article in articles)
    replacement = f"{CMS_START}\n{generated}\n{CMS_END}" if generated else f"{CMS_START}\n{CMS_END}"
    updated = re.sub(rf"{re.escape(CMS_START)}.*?{re.escape(CMS_END)}", replacement, manifest, flags=re.S)
    if not dry_run:
        MANIFEST_PATH.write_text(updated, encoding="utf-8", newline="\n")


def build(*, dry_run: bool = False) -> int:
    today = dt.date.today()
    articles = [normalize(entry) for entry in load_entries()]
    slugs = [article["slug"] for article in articles]
    errors = []
    for article in articles:
        label = article["source"].relative_to(ROOT) if isinstance(article["source"], Path) else article["slug"]
        errors.extend(f"{label}: {error}" for error in validate(article))
    duplicates = sorted({slug for slug in slugs if slugs.count(slug) > 1})
    errors.extend(f"duplicate slug: {slug}" for slug in duplicates)
    exportable = [article for article in articles if is_exportable(article, today)]
    for article in exportable:
        errors.extend(f"{article['slug']}: {error}" for error in validate(article, require_publishable=True))

    if errors:
        print("Static CMS validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    exportable.sort(key=sort_key, reverse=True)
    if not dry_run:
        ARTICLES_DIR.mkdir(parents=True, exist_ok=True)
        for article in exportable:
            (ARTICLES_DIR / f"{article['slug']}.html").write_text(render_article(article), encoding="utf-8", newline="\n")
    inject_manifest(exportable, dry_run=dry_run)
    print(f"{'Would export' if dry_run else 'Exported'} {len(exportable)} CMS article(s).")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Build ESL Media static CMS content.")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    return build(dry_run=args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
