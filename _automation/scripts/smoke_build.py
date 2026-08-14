#!/usr/bin/env python3
"""Post-build smoke checks for gking-site.

Run after `hugo` (and before deploy). Fails fast when mounts or section
output look wrong — e.g. missing Startups mount, or /talk/ collapsing to
a handful of pages.

Usage:
    python3 _automation/scripts/smoke_build.py
    python3 _automation/scripts/smoke_build.py --public /path/to/public
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
HUGO_YAML = ROOT / "hugo.yaml"

# EditMe sources that must stay mounted. Catches omissions from
# generate_mounts.py (like the Startups regression in 084fbf2).
REQUIRED_MOUNT_SOURCES = (
    "EditMe/Startups",
    "EditMe/UI/PerSectionLayouts/Startups",
    "EditMe/Writings/Presentations",
    "EditMe/Writings/_SectionPages/talk",
    "EditMe/Writings/_SectionPages/publication",
    "EditMe/HomePage",
    "EditMe/Bio",
    "EditMe/Software",
    "EditMe/ResearchAreas",
    "EditMe/Teaching",
    "EditMe/Contact",
)

# Minimum HTML pages per public section (leaf index.html files).
SECTION_MIN_PAGES = {
    "talk": 100,
    "publication": 250,
    "startups": 6,
    "software": 20,
    "bio": 1,
}

# Representative output paths and assets.
REQUIRED_FILES = (
    "index.html",
    "startups/index.html",
    "startups/crimson-hexagon/logo.png",
    "startups/thresher/logo.png",
    "startups/learning-catalytics/logo.png",
    "startups/openscholar/logo.png",
    "startups/perusall/logo.png",
    "startups/quickcode/logo.png",
    "publication/index.html",
    "software/index.html",
    "bio/index.html",
)

# Snippets that must appear in built HTML (catches empty/wrong templates).
HTML_SNIPPETS = (
    ("index.html", "startups/crimson-hexagon/logo"),
    ("index.html", "Startups"),
    ("startups/index.html", "Crimson Hexagon"),
    ("startups/index.html", "QuickCode"),
)


def read_mount_sources(hugo_yaml: Path) -> set[str]:
    text = hugo_yaml.read_text(encoding="utf-8")
    return set(re.findall(r"source:\s*(EditMe/[^\s,}]+)", text))


def count_section_pages(public: Path, section: str) -> int:
    section_dir = public / section
    if not section_dir.is_dir():
        return 0
    return sum(1 for _ in section_dir.rglob("index.html"))


def check_mounts(errors: list[str]) -> None:
    if not HUGO_YAML.is_file():
        errors.append(f"hugo.yaml not found at {HUGO_YAML}")
        return
    mounted = read_mount_sources(HUGO_YAML)
    for src in REQUIRED_MOUNT_SOURCES:
        if src not in mounted:
            errors.append(f"missing required mount source: {src}")


def check_page_counts(public: Path, errors: list[str]) -> None:
    for section, minimum in SECTION_MIN_PAGES.items():
        count = count_section_pages(public, section)
        if count < minimum:
            errors.append(
                f"section /{section}/ has {count} pages (expected >= {minimum})"
            )


def check_required_files(public: Path, errors: list[str]) -> None:
    for rel in REQUIRED_FILES:
        path = public / rel
        if not path.is_file():
            errors.append(f"missing output file: {rel}")


def check_sitemap(public: Path, errors: list[str]) -> None:
    """Sitemap must exist, parse, stay https-only, and never advertise
    robots-disallowed /authors/ pages (regressions of the 2026-08 AI
    visibility fixes)."""
    import xml.etree.ElementTree as ET

    path = public / "sitemap.xml"
    if not path.is_file():
        errors.append("sitemap.xml missing from build output")
        return
    try:
        root = ET.parse(path).getroot()
    except ET.ParseError as exc:
        errors.append(f"sitemap.xml is not well-formed XML: {exc}")
        return
    ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    locs = [el.text or "" for el in root.iter(f"{ns}loc")]
    if len(locs) < 800:
        errors.append(f"sitemap.xml has {len(locs)} URLs (expected >= 800)")
    bad_scheme = [u for u in locs if not u.startswith("https://")]
    if bad_scheme:
        errors.append(
            f"sitemap.xml has {len(bad_scheme)} non-https URLs, e.g. {bad_scheme[0]}"
        )
    authors = [u for u in locs if "/authors/" in u]
    if authors:
        errors.append(
            f"sitemap.xml advertises {len(authors)} robots-disallowed /authors/ pages"
        )


def check_machine_readable(public: Path, errors: list[str]) -> None:
    """Crawler/AI-facing surfaces: scholarly metadata on paper pages, the
    Person block on the homepage, and the corpus map / JSON catalog."""
    import json

    # Count real paper pages carrying scholarly metadata (redirect stubs for
    # papers that moved to custom URLs legitimately lack it).
    tagged = 0
    pub_dir = public / "publication"
    if pub_dir.is_dir():
        for candidate in pub_dir.iterdir():
            page = candidate / "index.html"
            if not page.is_file():
                continue
            text = page.read_text(encoding="utf-8", errors="replace")
            if "citation_title" in text and "application/ld+json" in text:
                tagged += 1
    if tagged < 200:
        errors.append(
            f"only {tagged} publication pages carry citation_*/JSON-LD metadata "
            "(expected >= 200)"
        )

    home = public / "index.html"
    if home.is_file():
        text = home.read_text(encoding="utf-8", errors="replace")
        if '"@type":"Person"' not in text:
            errors.append("homepage lacks the Person JSON-LD block")

    corpus = public / "llms-full.txt"
    if not corpus.is_file():
        errors.append("llms-full.txt missing from build output")
    else:
        entries = corpus.read_text(encoding="utf-8", errors="replace").count("\n- ")
        if entries < 300:
            errors.append(f"llms-full.txt has {entries} entries (expected >= 300)")

    catalog = public / "publication" / "index.json"
    if not catalog.is_file():
        errors.append("publication/index.json missing from build output")
    else:
        try:
            items = json.loads(catalog.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"publication/index.json is not valid JSON: {exc}")
        else:
            if not isinstance(items, list) or len(items) < 250:
                errors.append(
                    f"publication/index.json has {len(items)} entries (expected >= 250)"
                )


def check_html_snippets(public: Path, errors: list[str]) -> None:
    for rel, needle in HTML_SNIPPETS:
        path = public / rel
        if not path.is_file():
            errors.append(f"snippet check skipped; file missing: {rel}")
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            errors.append(f"cannot read {rel}: {exc}")
            continue
        if needle not in text:
            errors.append(f"{rel} does not contain expected text: {needle!r}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--public",
        type=Path,
        default=PUBLIC,
        help=f"path to Hugo output (default: {PUBLIC})",
    )
    args = parser.parse_args(argv)
    public: Path = args.public

    errors: list[str] = []

    check_mounts(errors)

    if not public.is_dir():
        errors.append(
            f"public/ not found at {public} — run `hugo` before smoke_build.py"
        )
    else:
        check_page_counts(public, errors)
        check_required_files(public, errors)
        check_html_snippets(public, errors)
        check_sitemap(public, errors)
        check_machine_readable(public, errors)

    if errors:
        print("[smoke_build] FAILED:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print("[smoke_build] OK: mounts, section counts, and canary pages look good.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
