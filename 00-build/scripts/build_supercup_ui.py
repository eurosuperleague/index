"""
build_supercup_ui.py
Inject shared league CSS/JS into the raw 00-SuperCup HTML export.

Usage:
  python 00-build/scripts/build_supercup_ui.py
  python 00-build/scripts/build_supercup_ui.py --dry-run
"""

import os
import subprocess
import sys


SCRIPT_ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_ROOT))
INJECT_SCRIPT = os.path.join(SCRIPT_ROOT, "inject_css_js.py")
TARGET_ROOT = os.path.join(PROJECT_ROOT, "00-SuperCup")
DRY_RUN = "--dry-run" in sys.argv


def main():
    if not os.path.isdir(TARGET_ROOT):
        raise SystemExit(f"Error: Super Cup folder not found: {TARGET_ROOT}")

    args = [
        sys.executable,
        INJECT_SCRIPT,
        "--target-root",
        TARGET_ROOT,
    ]
    if DRY_RUN:
        args.append("--dry-run")

    print("Super Cup UI injection" + (" [DRY RUN]" if DRY_RUN else ""))
    print(f"  target: {TARGET_ROOT}")
    result = subprocess.run(args, cwd=SCRIPT_ROOT)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


if __name__ == "__main__":
    main()
