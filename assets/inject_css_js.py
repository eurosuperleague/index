import os

# ── CONFIGURE THIS ────────────────────────────────────────────────
ROOT_FOLDER  = r"C:\Users\santo\OneDrive - UNSW\Documents\GitHub\index"
CSS_FILENAME = "assets/styles.css"
JS_FILENAME  = "assets/sort.js"
# ─────────────────────────────────────────────────────────────────

files_updated = 0
files_skipped = 0

for dirpath, dirnames, filenames in os.walk(ROOT_FOLDER):
    for filename in filenames:
        if not filename.lower().endswith((".html", ".htm")):
            continue

        filepath = os.path.join(dirpath, filename)

        # auto-calculate relative path from this file back to root
        rel_path = os.path.relpath(ROOT_FOLDER, dirpath)

        css_rel = os.path.join(rel_path, CSS_FILENAME).replace("\\", "/")
        js_rel  = os.path.join(rel_path, JS_FILENAME).replace("\\", "/")

        # strip leading ./ if file is in root
        if css_rel.startswith("./"):
            css_rel = css_rel[2:]
        if js_rel.startswith("./"):
            js_rel = js_rel[2:]

        css_tag = f'<link rel="stylesheet" href="{css_rel}">'
        js_tag  = f'<script src="{js_rel}" defer></script>'

        with open(filepath, "r", encoding="latin-1") as f:
            content = f.read()

        already_css = CSS_FILENAME in content
        already_js  = JS_FILENAME  in content

        if already_css and already_js:
            print(f"SKIPPED (both already injected): {filepath}")
            files_skipped += 1
            continue

        inject = ""
        if not already_css:
            inject += f"  {css_tag}\n"
        if not already_js:
            inject += f"  {js_tag}\n"

        if "</head>" in content:
            content = content.replace("</head>", f"{inject}</head>", 1)
        elif "<body" in content:
            content = content.replace("<body", f"{inject}<body", 1)
        else:
            content = inject + content

        with open(filepath, "w", encoding="latin-1") as f:
            f.write(content)

        print(f"UPDATED: {filepath}")
        files_updated += 1

print(f"\nDone — {files_updated} updated, {files_skipped} skipped.")
