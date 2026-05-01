import os
import re
import json
import subprocess
from html import unescape
from html.parser import HTMLParser

# 1. PATH SETUP
ROOT = os.path.dirname(os.path.abspath(__file__))
DATABASE_DIR = os.path.join(ROOT, "database")
ROSTERS_DIR = os.path.normpath(os.path.join(ROOT, "..", "rosters"))
PLAYERS_DIR = os.path.normpath(os.path.join(ROOT, "..", "players"))
PLAYERS_OUT = os.path.join(DATABASE_DIR, "players.json")
TEAMS_OUT = os.path.join(DATABASE_DIR, "teams.json")
STANDINGS_OUT = os.path.join(DATABASE_DIR, "standings.json")
CAPREPORT_OUT = os.path.join(DATABASE_DIR, "capreport.json")
STANDINGS_PATH = os.path.normpath(os.path.join(ROOT, "..", "standings.htm"))
CAPREPORT_PATH = os.path.normpath(os.path.join(ROOT, "..", "capreport.htm"))
MDB_PATH = os.path.normpath(os.path.join(ROOT, "..", "LeagueOutput.mdb"))

# The 16 numerical stats in your roster files
ATTR_KEYS = [
    "Ins", "Jps", "Fts", "3ps", "Hnd", "Pas", "Orb", "Drb", 
    "Psd", "Prd", "Stl", "Blk", "Qkn", "Jmp", "Str", "Sta"
]

def clean(txt):
    return re.sub(r"\s+", " ", unescape(txt).replace("\xa0", " ")).strip()


def normalize_name(name):
    return clean(name).casefold()


def strip_tags(value):
    return clean(re.sub(r"<[^>]+>", " ", value))


def parse_money_value(value):
    text = strip_tags(value)
    negative = "(" in text and ")" in text
    digits = re.sub(r"[^0-9.]", "", text)
    if not digits:
        return None

    amount = float(digits)
    if negative:
        amount *= -1
    return amount


def parse_numeric_value(value):
    text = strip_tags(value)
    if text in {"", "-"}:
        return text

    try:
        if "." in text:
            return float(text)
        return int(text)
    except ValueError:
        return text


def load_mdb_ratings():
    if not os.path.exists(MDB_PATH):
        print(f"Warning: {MDB_PATH} not found. Skipping OVR/POT import.")
        return {}

    powershell_script = rf"""
$path = '{MDB_PATH.replace("'", "''")}'
$connStr = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$path;Persist Security Info=False;"
$conn = New-Object System.Data.OleDb.OleDbConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Name, OverallRating, OverallPotential FROM Player"
$adapter = New-Object System.Data.OleDb.OleDbDataAdapter($cmd)
$table = New-Object System.Data.DataTable
[void]$adapter.Fill($table)
$conn.Close()
$rows = foreach ($row in $table.Rows) {{
    [PSCustomObject]@{{
        name = [string]$row.Name
        overall = if ($null -eq $row.OverallRating -or [string]::IsNullOrWhiteSpace([string]$row.OverallRating)) {{ "" }} else {{ [string]$row.OverallRating }}
        potential = if ($null -eq $row.OverallPotential -or [string]::IsNullOrWhiteSpace([string]$row.OverallPotential)) {{ "" }} else {{ [string]$row.OverallPotential }}
    }}
}}
$rows | ConvertTo-Json -Compress
"""

    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command", powershell_script],
            capture_output=True,
            text=True,
            check=True,
        )
    except Exception as exc:
        print(f"Warning: failed to read ratings from MDB ({exc}).")
        return {}

    raw = result.stdout.strip()
    if not raw:
        return {}

    try:
        rows = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"Warning: could not parse MDB ratings JSON ({exc}).")
        return {}

    if isinstance(rows, dict):
        rows = [rows]

    ratings_by_name = {}
    for row in rows:
        name = normalize_name(row.get("name", ""))
        if not name:
            continue
        ratings_by_name[name] = {
            "overall": row.get("overall", "") or "",
            "potential": row.get("potential", "") or "",
        }

    print(f"Loaded OVR/POT ratings for {len(ratings_by_name)} players from MDB.")
    return ratings_by_name

def extract_team_metadata(html, filename):
    team_id = os.path.splitext(filename)[0]
    title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    title = clean(title_match.group(1)) if title_match else team_id

    return {
        "id": team_id,
        "name": title,
        "file": filename,
        "url": f"../rosters/{filename}"
    }

class RosterParser(HTMLParser):
    def __init__(self, team):
        super().__init__()
        self.team = team
        self.rows = []
        self.in_player_row = False
        self.table_depth = 0
        self.current_columns = []
        self.temp_data = ""
        self.current_link = ""

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if tag == "table":
            self.table_depth += 1
            
        if tag == "tr" and self.table_depth == 1:
            cls = attr_dict.get("class", "").lower()
            if "row1" in cls or "row2" in cls:
                self.in_player_row = True
                self.current_columns = []
                self.current_link = ""

        if self.in_player_row:
            if tag == "td" and self.table_depth == 1:
                self.temp_data = ""
            
            if tag == "a" and self.table_depth == 1:
                self.current_link = attr_dict.get("href", "")

    def handle_data(self, data):
        if self.in_player_row and self.table_depth == 1:
            self.temp_data += data

    def handle_endtag(self, tag):
        if tag == "td" and self.in_player_row and self.table_depth == 1:
            val = clean(self.temp_data)
            # We only want columns with text (skipping the empty color-box columns)
            if val:
                self.current_columns.append(val)
            self.temp_data = ""

        if tag == "tr" and self.in_player_row and self.table_depth == 1:
            self.process_row()
            self.in_player_row = False
            
        if tag == "table":
            self.table_depth -= 1

    def process_row(self):
        d = self.current_columns
        # Valid rows usually have ~22 columns of text (Info + 16 stats)
        if len(d) < 20:
            return

        try:
            player = {
                "name": d[1],
                "url": self.current_link,
                "team": self.team,
                "pos": d[2],
                "age": d[3],
                "ht": d[4],
                "wt": d[5]
            }

            # Map the 16 numerical stats
            for i, key in enumerate(ATTR_KEYS):
                # Since we skip the empty rating boxes, stats start at index 6
                val_idx = 6 + i
                if val_idx < len(d):
                    player[key] = d[val_idx]

            self.rows.append(player)
        except Exception:
            pass


def build_team_lookup(teams):
    lookup = {}
    for team in teams:
        name = clean(team.get("name", ""))
        if name:
            lookup[normalize_name(name)] = team["id"]
    return lookup


def parse_player_page(html, filename, team_lookup, ratings_by_name):
    name_matches = re.findall(r"<td class=teamheader>([^<]+?)&nbsp;", html, re.IGNORECASE)
    name = clean(name_matches[-1]) if name_matches else ""
    if not name:
        return None

    meta_matches = re.findall(r"<tr><td class=teamheader2 width=\*>(.*?)</tr>", html, re.IGNORECASE | re.DOTALL)
    details_line = strip_tags(meta_matches[0]) if len(meta_matches) > 0 else ""
    born_line = strip_tags(meta_matches[1]) if len(meta_matches) > 1 else ""

    detail_match = re.search(
        r"#(?P<number>\d+)\s+(?P<pos>[A-Z0-9\-\/]+)\s+\|\s+(?P<ht>\d+\-\d+),\s+(?P<wt>\d+)lbs\s+\|\s+(?P<team>.*?)\s+\|\s+Experience:\s+(?P<experience>.+)$",
        details_line,
        re.IGNORECASE,
    )

    if detail_match:
        pos = clean(detail_match.group("pos"))
        ht = clean(detail_match.group("ht"))
        wt = clean(detail_match.group("wt"))
        raw_team = clean(detail_match.group("team"))
        experience = clean(detail_match.group("experience"))
    else:
        pos = ""
        ht = ""
        wt = ""
        raw_team = ""
        experience = ""

    age_match = re.search(r"Born:\s.*?\((\d+)\)", born_line, re.IGNORECASE)
    age = age_match.group(1) if age_match else ""

    attributes_section = re.search(
        r"&nbsp;Attributes</td></tr>(.*?)</table>",
        html,
        re.IGNORECASE | re.DOTALL,
    )
    current_row_match = re.search(
        r"<tr class=row1 align=right>(.*?)</tr>",
        attributes_section.group(1) if attributes_section else "",
        re.IGNORECASE | re.DOTALL,
    )

    values = []
    if current_row_match:
        values = [
            strip_tags(cell)
            for cell in re.findall(r"<td class=main[^>]*>(.*?)</td>", current_row_match.group(1), re.IGNORECASE | re.DOTALL)
        ]

    attr_values = values[1:1 + len(ATTR_KEYS)] if len(values) > len(ATTR_KEYS) else []
    player = {
        "name": name,
        "url": f"../players/{filename}",
        "team": team_lookup.get(normalize_name(raw_team), raw_team),
        "teamLabel": raw_team,
        "pos": pos,
        "age": age,
        "ht": ht,
        "wt": wt,
        "experience": experience,
        "source": "player_page",
    }

    for key, value in zip(ATTR_KEYS, attr_values):
        player[key] = value

    rating_data = ratings_by_name.get(normalize_name(name), {})
    player["overall"] = rating_data.get("overall", "")
    player["potential"] = rating_data.get("potential", "")
    return player


def parse_standings_sections(html):
    sections = []
    title_matches = list(
        re.finditer(r"<td class=newheader>(.*?)</td>", html, re.IGNORECASE | re.DOTALL)
    )

    for index, title_match in enumerate(title_matches):
        section_title = strip_tags(title_match.group(1))
        start = title_match.end()
        end = title_matches[index + 1].start() if index + 1 < len(title_matches) else len(html)
        section_html = html[start:end]
        table_match = re.search(
            r"<table[^>]*>(.*?)</table>",
            section_html,
            re.IGNORECASE | re.DOTALL,
        )

        if not table_match:
            continue

        table_html = table_match.group(1)
        row_matches = re.findall(
            r"<tr class=(row1|row2)\s+align=center>(.*?)</tr>",
            table_html,
            re.IGNORECASE | re.DOTALL,
        )
        teams = []

        for row_class, row_html in row_matches:
            cells = re.findall(r"<td[^>]*class=main[^>]*>(.*?)</td>", row_html, re.IGNORECASE | re.DOTALL)
            link_match = re.search(
                r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>',
                row_html,
                re.IGNORECASE | re.DOTALL,
            )

            if len(cells) < 14 or not link_match:
                continue

            team_name = strip_tags(link_match.group(2))
            roster_url = clean(link_match.group(1))
            roster_file = roster_url.split("/")[-1]

            teams.append(
                {
                    "team": team_name,
                    "rosterUrl": roster_url,
                    "rosterFile": roster_file,
                    "wins": parse_numeric_value(cells[1]),
                    "losses": parse_numeric_value(cells[2]),
                    "pct": parse_numeric_value(cells[3]),
                    "gb": parse_numeric_value(cells[4]),
                    "home": strip_tags(cells[5]),
                    "road": strip_tags(cells[6]),
                    "division": strip_tags(cells[7]),
                    "conference": strip_tags(cells[8]),
                    "pf": parse_numeric_value(cells[9]),
                    "pa": parse_numeric_value(cells[10]),
                    "diff": parse_numeric_value(cells[11]),
                    "streak": strip_tags(cells[12]),
                    "last10": strip_tags(cells[13]),
                    "rowClass": row_class.lower(),
                }
            )

        if teams:
            sections.append(
                {
                    "title": section_title,
                    "slug": re.sub(r"[^a-z0-9]+", "-", section_title.lower()).strip("-"),
                    "teams": teams,
                }
            )

    return sections


def parse_capreport_sections(html):
    sections = []
    title_matches = list(
        re.finditer(r"<td class=newheader>(.*?)</td>", html, re.IGNORECASE | re.DOTALL)
    )

    for index, title_match in enumerate(title_matches):
        section_title = strip_tags(title_match.group(1))
        start = title_match.end()
        end = title_matches[index + 1].start() if index + 1 < len(title_matches) else len(html)
        section_html = html[start:end]
        table_match = re.search(
            r"<table[^>]*>(.*?)</table>",
            section_html,
            re.IGNORECASE | re.DOTALL,
        )

        if not table_match:
            continue

        table_html = table_match.group(1)
        row_matches = re.findall(
            r"<tr align=center class=(row1|row2)>(.*?)</tr>",
            table_html,
            re.IGNORECASE | re.DOTALL,
        )
        entries = []

        for row_class, row_html in row_matches:
            cells = re.findall(r"<td[^>]*class=main[^>]*>(.*?)</td>", row_html, re.IGNORECASE | re.DOTALL)
            link_match = re.search(
                r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>',
                row_html,
                re.IGNORECASE | re.DOTALL,
            )

            if len(cells) < 7 or not link_match:
                continue

            team_name = strip_tags(link_match.group(2))
            roster_url = clean(link_match.group(1))
            roster_file = roster_url.split("/")[-1]

            entries.append(
                {
                    "pick": parse_numeric_value(cells[0]),
                    "team": team_name,
                    "rosterUrl": roster_url,
                    "rosterFile": roster_file,
                    "salary": parse_money_value(cells[2]),
                    "salaryText": strip_tags(cells[2]),
                    "capRoom": parse_money_value(cells[3]),
                    "capRoomText": strip_tags(cells[3]),
                    "budgetRoom": parse_money_value(cells[4]),
                    "budgetRoomText": strip_tags(cells[4]),
                    "midException": parse_money_value(cells[5]),
                    "midExceptionText": strip_tags(cells[5]),
                    "lowException": parse_money_value(cells[6]),
                    "lowExceptionText": strip_tags(cells[6]),
                    "rowClass": row_class.lower(),
                }
            )

        if entries:
            sections.append(
                {
                    "title": section_title,
                    "slug": re.sub(r"[^a-z0-9]+", "-", section_title.lower()).strip("-"),
                    "entries": entries,
                }
            )

    return sections

def main():
    os.makedirs(DATABASE_DIR, exist_ok=True)

    if not os.path.exists(ROSTERS_DIR):
        print(f"Error: {ROSTERS_DIR} not found.")
        return

    if not os.path.exists(PLAYERS_DIR):
        print(f"Error: {PLAYERS_DIR} not found.")
        return

    if not os.path.exists(STANDINGS_PATH):
        print(f"Error: {STANDINGS_PATH} not found.")
        return

    if not os.path.exists(CAPREPORT_PATH):
        print(f"Error: {CAPREPORT_PATH} not found.")
        return

    ratings_by_name = load_mdb_ratings()
    all_teams = []
    roster_files = [f for f in os.listdir(ROSTERS_DIR) if f.lower().endswith((".htm", ".html"))]

    for file in roster_files:
        path = os.path.join(ROSTERS_DIR, file)
        with open(path, "r", encoding="latin-1") as f:
            html = f.read()

        all_teams.append(extract_team_metadata(html, file))

    team_lookup = build_team_lookup(all_teams)
    all_players = []
    player_files = sorted(
        f for f in os.listdir(PLAYERS_DIR)
        if f.lower().endswith((".htm", ".html"))
    )

    for file in player_files:
        path = os.path.join(PLAYERS_DIR, file)
        with open(path, "r", encoding="latin-1") as f:
            html = f.read()

        player = parse_player_page(html, file, team_lookup, ratings_by_name)
        if player:
            all_players.append(player)

    all_players.sort(key=lambda player: player["name"])

    with open(PLAYERS_OUT, "w", encoding="utf-8") as f:
        json.dump(all_players, f, indent=4)

    all_teams.sort(key=lambda team: team["name"])

    with open(TEAMS_OUT, "w", encoding="utf-8") as f:
        json.dump(all_teams, f, indent=4)

    with open(STANDINGS_PATH, "r", encoding="latin-1") as f:
        standings_html = f.read()

    standings_data = {
        "source": os.path.basename(STANDINGS_PATH),
        "sections": parse_standings_sections(standings_html),
    }

    with open(STANDINGS_OUT, "w", encoding="utf-8") as f:
        json.dump(standings_data, f, indent=4)

    with open(CAPREPORT_PATH, "r", encoding="latin-1") as f:
        capreport_html = f.read()

    capreport_data = {
        "source": os.path.basename(CAPREPORT_PATH),
        "sections": parse_capreport_sections(capreport_html),
    }

    with open(CAPREPORT_OUT, "w", encoding="utf-8") as f:
        json.dump(capreport_data, f, indent=4)
        
    print(f"\nFinal count: {len(all_players)} players saved to {PLAYERS_OUT}")
    print(f"Final count: {len(all_teams)} teams saved to {TEAMS_OUT}")
    print(f"Final count: {len(standings_data['sections'])} standings sections saved to {STANDINGS_OUT}")
    print(f"Final count: {len(capreport_data['sections'])} cap report sections saved to {CAPREPORT_OUT}")

if __name__ == "__main__":
    main()
