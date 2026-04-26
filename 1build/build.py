"""
build.py
Master build script — run this one file to update everything.

Usage:
  python 1build/build.py           # full build
  python 1build/build.py --dry-run # preview only, no files written
"""

import subprocess, sys, os

BUILD_DIR = os.path.dirname(os.path.abspath(__file__))
DRY_RUN = "--dry-run" in sys.argv

SCRIPTS = [
    (os.path.join(BUILD_DIR, "build_players_json.py"), "Scraping player attributes → players.json"),
    (os.path.join(BUILD_DIR, "inject_css_js.py"),      "Injecting CSS/JS links into all HTML files"),
]

def run(path, label):
    if not os.path.exists(path):
        print(f"  [SKIP] {os.path.basename(path)} not found")
        return
    print(f"\n── {label}")
    args = [sys.executable, path]
    if DRY_RUN:
        args.append("--dry-run")
    result = subprocess.run(args, cwd=BUILD_DIR)
    if result.returncode != 0:
        print(f"  [ERROR] {os.path.basename(path)} exited with code {result.returncode}")
        sys.exit(result.returncode)

print("=" * 50)
print("BSL Build" + (" [DRY RUN]" if DRY_RUN else ""))
print("=" * 50)

for path, label in SCRIPTS:
    run(path, label)

print("\n✓ Build complete")
