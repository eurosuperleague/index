import os
import re
import json
from html.parser import HTMLParser

# 1. PATH SETUP
ROOT = os.path.dirname(os.path.abspath(__file__))
ROSTERS_DIR = os.path.normpath(os.path.join(ROOT, "..", "rosters"))
PLAYERS_OUT = os.path.join(ROOT, "players.json")
TEAMS_OUT = os.path.join(ROOT, "teams.json")

# The 16 numerical stats in your roster files
ATTR_KEYS = [
    "Ins", "Jps", "Fts", "3ps", "Hnd", "Pas", "Orb", "Drb", 
    "Psd", "Prd", "Stl", "Blk", "Qkn", "Jmp", "Str", "Sta"
]

def clean(txt):
    return re.sub(r"\s+", " ", txt.replace("\xa0", " ")).strip()

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

def main():
    if not os.path.exists(ROSTERS_DIR):
        print(f"Error: {ROSTERS_DIR} not found.")
        return

    all_players_unique = []
    all_teams = []
    seen_names = set()
    
    files = [f for f in os.listdir(ROSTERS_DIR) if f.lower().endswith((".htm", ".html"))]
    
    for file in files:
        path = os.path.join(ROSTERS_DIR, file)
        with open(path, "r", encoding="latin-1") as f:
            html = f.read()

        all_teams.append(extract_team_metadata(html, file))
        
        parser = RosterParser(os.path.splitext(file)[0])
        parser.feed(html)
        
        count = 0
        for p in parser.rows:
            # DEDUPLICATION LOGIC
            if p["name"] not in seen_names:
                all_players_unique.append(p)
                seen_names.add(p["name"])
                count += 1
        
        print(f"File {file}: Added {count} new players.")

    with open(PLAYERS_OUT, "w", encoding="utf-8") as f:
        json.dump(all_players_unique, f, indent=4)

    all_teams.sort(key=lambda team: team["name"])

    with open(TEAMS_OUT, "w", encoding="utf-8") as f:
        json.dump(all_teams, f, indent=4)
        
    print(f"\nFinal count: {len(all_players_unique)} unique players saved to {PLAYERS_OUT}")
    print(f"Final count: {len(all_teams)} teams saved to {TEAMS_OUT}")

if __name__ == "__main__":
    main()
