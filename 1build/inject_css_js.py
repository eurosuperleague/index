"""
inject_css_js.py
Walks every .htm/.html file in the repo and injects styles.css, sort.js,
and features.js if not already present.

Usage:
    python inject_css_js.py
    python inject_css_js.py --dry-run
"""

import os, sys

# ── CONFIGURE ─────────────────────────────────────────────────────
ROOT_FOLDER   = r"C:\Users\santo\OneDrive - UNSW\Documents\GitHub\index"
CSS_FILENAME  = "assets/styles.css"
JS_FILENAME   = "assets/sort.js"
JS2_FILENAME  = "assets/features.js"
# ──────────────────────────────────────────────────────────────────

DRY_RUN       = "--dry-run" in sys.argv
files_updated = 0
files_skipped = 0

for dirpath, dirnames, filenames in os.walk(ROOT_FOLDER):
    for filename in filenames:
        if not filename.lower().endswith((".html", ".htm")):
            continue

        filepath = os.path.join(dirpath, filename)

        # ── Calculate relative paths back to root ──────────────────
        rel_path = os.path.relpath(ROOT_FOLDER, dirpath)

        def make_rel(fname):
            p = os.path.join(rel_path, fname).replace("\\", "/")
            return p[2:] if p.startswith("./") else p

        css_rel  = make_rel(CSS_FILENAME)
        js_rel   = make_rel(JS_FILENAME)
        js2_rel  = make_rel(JS2_FILENAME)

        # ── Build tags ─────────────────────────────────────────────
        css_tag  = f'<link rel="stylesheet" href="{css_rel}">'
        js_tag   = f'<script src="{js_rel}" defer></script>'
        js2_tag  = f'<script src="{js2_rel}" defer></script>'

        with open(filepath, "r", encoding="latin-1") as f:
            content = f.read()

        already_css  = CSS_FILENAME  in content
        already_js   = JS_FILENAME   in content
        already_js2  = JS2_FILENAME  in content

        if already_css and already_js and already_js2:
            print(f"SKIPPED  (all present): {filepath}")
            files_skipped += 1
            continue

        # ── Build inject block ─────────────────────────────────────
        inject = ""
        if not already_css:  inject += f"  {css_tag}\n"
        if not already_js:   inject += f"  {js_tag}\n"
        if not already_js2:  inject += f"  {js2_tag}\n"

        # ── Insert before </head> or <body>, else append to top ────
        if "</head>" in content:
            content = content.replace("</head>", f"{inject}</head>", 1)
        elif "<body" in content:
            idx = content.index("<body")
            content = content[:idx] + inject + content[idx:]
        else:
            content = inject + content

        if DRY_RUN:
            print(f"DRY RUN  would update: {filepath}")
            print(f"         injecting:\n{inject.rstrip()}")
        else:
            with open(filepath, "w", encoding="latin-1") as f:
                f.write(content)
            print(f"UPDATED: {filepath}")

        files_updated += 1

print(f"\n{'[DRY RUN] ' if DRY_RUN else ''}Done — {files_updated} updated, {files_skipped} skipped.")
