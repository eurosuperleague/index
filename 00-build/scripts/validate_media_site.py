"""
Validate ESL Media publishing integrity.

Checks:
- media manifest exists and has required fields
- article files referenced by manifest exist
- sortKey values are valid
- teams arrays exist and are non-empty
- homepage links resolve and homepage feed hooks exist
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MEDIA_DIR = ROOT / "00-eslmedia"
CONTENT_DIR = MEDIA_DIR / "content"
MANIFEST_PATH = CONTENT_DIR / "media-articles.js"
HOMEPAGE_PATH = MEDIA_DIR / "homepage.html"
SORT_KEY_RE = re.compile(r"^\d{4}-\d{2}-\d{2}-\d{2}$")


def load_manifest_objects(js_text: str) -> list[str]:
    start = js_text.find("window.ESL_MEDIA_ARTICLES = [")
    if start < 0:
        return []
    chunk = js_text[start:]
    first_bracket = chunk.find("[")
    if first_bracket < 0:
        return []

    depth = 0
    end_index = -1
    for idx, ch in enumerate(chunk[first_bracket:], start=first_bracket):
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                end_index = idx
                break
    if end_index < 0:
        return []

    array_text = chunk[first_bracket:end_index + 1]
    objects = []
    brace_depth = 0
    obj_start = -1
    in_string = False
    escaped = False
    for idx, ch in enumerate(array_text):
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
            continue
        if ch == "{":
            if brace_depth == 0:
                obj_start = idx
            brace_depth += 1
        elif ch == "}":
            brace_depth -= 1
            if brace_depth == 0 and obj_start >= 0:
                objects.append(array_text[obj_start:idx + 1])
                obj_start = -1
    return objects


def extract_string_field(obj_text: str, field: str) -> str:
    match = re.search(rf"{re.escape(field)}\s*:\s*\"([^\"]*)\"", obj_text)
    return match.group(1).strip() if match else ""


def extract_teams(obj_text: str) -> list[str]:
    match = re.search(r"teams\s*:\s*\[(.*?)\]", obj_text, re.S)
    if not match:
        return []
    return re.findall(r"\"([^\"]+)\"", match.group(1))


def validate_manifest() -> list[str]:
    errors: list[str] = []
    if not MANIFEST_PATH.exists():
        return [f"Missing manifest: {MANIFEST_PATH}"]

    text = MANIFEST_PATH.read_text(encoding="utf-8")
    objects = load_manifest_objects(text)
    if not objects:
        return ["Could not parse window.ESL_MEDIA_ARTICLES from media-articles.js"]

    for index, obj in enumerate(objects, start=1):
        file_path = extract_string_field(obj, "file")
        title = extract_string_field(obj, "title")
        sort_key = extract_string_field(obj, "sortKey")
        teams = extract_teams(obj)
        label = f"entry #{index}" if not title else f"'{title}'"

        if not file_path:
            errors.append(f"{label}: missing file")
        else:
            article = CONTENT_DIR / file_path
            if not article.exists():
                errors.append(f"{label}: file does not exist -> {file_path}")

        if not sort_key or not SORT_KEY_RE.match(sort_key):
            errors.append(f"{label}: invalid sortKey '{sort_key}' (expected YYYY-MM-DD-##)")

        if not teams:
            errors.append(f"{label}: teams array missing or empty")

    return errors


def validate_homepage_links() -> list[str]:
    errors: list[str] = []
    if not HOMEPAGE_PATH.exists():
        return [f"Missing homepage: {HOMEPAGE_PATH}"]

    text = HOMEPAGE_PATH.read_text(encoding="utf-8")

    required_hooks = [
        "id=\"homepageLeadLink\"",
        "id=\"homepagePowerBoard\"",
        "id=\"homepageAnalysisList\"",
        "id=\"homepageBriefList\"",
        "renderHomepageStories()",
    ]
    for hook in required_hooks:
        if hook not in text:
            errors.append(f"homepage missing automation hook: {hook}")

    hrefs = re.findall(r'href="([^"]+)"', text)
    for href in hrefs:
        if href.startswith(("http://", "https://", "#", "mailto:", "tel:", "data:")):
            continue
        target = (HOMEPAGE_PATH.parent / href).resolve()
        if not target.exists():
            errors.append(f"homepage broken link: {href}")

    return errors


def main() -> int:
    all_errors = []
    all_errors.extend(validate_manifest())
    all_errors.extend(validate_homepage_links())

    if all_errors:
        print("Media validation failed:")
        for err in all_errors:
            print(f"- {err}")
        return 1

    print("Media validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
