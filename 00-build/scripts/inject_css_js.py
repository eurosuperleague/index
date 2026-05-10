"""
inject_css_js.py
Walks every .htm/.html file in the repo and injects styles.css, sort.js,
features.js, and a favicon if not already present.

Usage:
    python inject_css_js.py
    python inject_css_js.py --dry-run
"""

import os, sys

# ── CONFIGURE ───────────────────────────────────────────────────────
ROOT_FOLDER  = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CSS_FILENAME  = "00-assets/css/styles.css"
JS_FILENAME   = "00-assets/js/sort.js"
JS2_FILENAME  = "00-assets/js/features.js"
INDEX_JS_FILENAME = "00-assets/js/index.js"
FAVICON_FILE  = "00-build/database/favicon.png"   # change to .ico if needed
VIEWPORT_TAG  = '<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=0.25, maximum-scale=5.0, user-scalable=yes">'
# ────────────────────────────────────────────────────────────────────

DRY_RUN       = "--dry-run" in sys.argv
files_updated = 0
files_skipped = 0

for dirpath, dirnames, filenames in os.walk(ROOT_FOLDER):

    # Skip build, asset, and custom media folders; generated league HTML lives outside them.
    dirnames[:] = [d for d in dirnames if d not in {"00-build", "00-assets", "00-eslmedia"}]

    for filename in filenames:
        if not filename.lower().endswith((".html", ".htm")):
            continue

        filepath = os.path.join(dirpath, filename)

        # ── Calculate relative paths back to root ──────────────────
        rel_path = os.path.relpath(ROOT_FOLDER, dirpath)

        def make_rel(fname):
            p = os.path.join(rel_path, fname).replace("\\", "/")
            return p[2:] if p.startswith("./") else p

        css_rel     = make_rel(CSS_FILENAME)
        js_rel      = make_rel(JS_FILENAME)
        js2_rel     = make_rel(JS2_FILENAME)
        index_js_rel = make_rel(INDEX_JS_FILENAME)
        favicon_rel = make_rel(FAVICON_FILE)
        is_root_index = os.path.abspath(filepath) == os.path.join(ROOT_FOLDER, "index.htm")

        # ── Build tags ─────────────────────────────────────────────
        css_tag     = f'<link rel="stylesheet" href="{css_rel}">'
        js_tag      = f'<script src="{js_rel}" defer></script>'
        js2_tag     = f'<script src="{js2_rel}" defer></script>'
        index_js_tag = f'<script src="{index_js_rel}" defer></script>'
        favicon_tag = f'<link rel="icon" type="image/png" href="{favicon_rel}">'

        with open(filepath, "r", encoding="latin-1") as f:
            html = f.read()

        already_css     = CSS_FILENAME     in html
        already_js      = JS_FILENAME      in html
        already_js2     = JS2_FILENAME     in html
        already_index_js = INDEX_JS_FILENAME in html
        already_favicon = FAVICON_FILE     in html
        already_viewport = 'name="viewport"' in html.lower() or "name='viewport'" in html.lower()

        if already_css and already_js and already_js2 and already_favicon and already_viewport and (not is_root_index or already_index_js):
            print(f"SKIPPED (all present): {filepath}")
            files_skipped += 1
            continue

        # ── Build inject block ─────────────────────────────────────
        inject = ""
        if not already_viewport:
            inject += f"  {VIEWPORT_TAG}\n"
        if not already_favicon:
            inject += f"  {favicon_tag}\n"
        if not already_css:
            inject += f"  {css_tag}\n"
        if not already_js:
            inject += f"  {js_tag}\n"
        if not already_js2:
            inject += f"  {js2_tag}\n"
        if is_root_index and not already_index_js:
            inject += f"  {index_js_tag}\n"

        # ── Add <head> block if missing ────────────────────────────
        if "</head>" not in html:
            if "<body" in html:
                html = html.replace("<body", "<head>\n</head>\n<body", 1)
            else:
                html = "<head>\n</head>\n" + html

        # ── Insert before </head> ──────────────────────────────────
        if "</head>" in html:
            html = html.replace("</head>", f"{inject}</head>", 1)
        elif "</body>" in html:
            html = html.replace("</body>", f"{inject}</body>", 1)
        else:
            html += "\n" + inject
        if DRY_RUN:
            print(f"DRY RUN: would update {filepath}")
        else:
            with open(filepath, "w", encoding="latin-1") as f:
                f.write(html)
            print(f"UPDATED: {filepath}")

        files_updated += 1

print(f"\n{'[DRY RUN] ' if DRY_RUN else ''}Done — {files_updated} updated, {files_skipped} skipped.")
