#!/usr/bin/env python3
"""Post-build rewrite: serve target-page content at short URL paths.

Run this AFTER `hugo build` (and after Pagefind indexing, to avoid
duplicating search entries).  It scans every index.html in public/ for
meta-refresh redirects.  When the target is an internal page that also
exists in public/, the redirect stub is overwritten with a copy of the
target page's fully rendered HTML.  The result: GitHub Pages serves the
real content at the short URL — no client-side redirect.

Only stubs allowed by EditMe/Redirects/Data/inline_rewrites.yaml are
inlined; other stubs stay as lightweight meta-refresh pages.  Run
_automation/scripts/report_rewrite_costs.py to audit duplication cost.

External targets (https://…) are left untouched.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rewrite_inline_policy import (
    base_url,
    canonical_short_urls,
    load_policy,
    should_inline,
    to_relative,
)

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"

_REFRESH_RE = re.compile(
    r'<meta\s+http-equiv=["\']?refresh["\']?\s+'
    r'content=["\']?\d+;\s*url=([^"\'>\s]+)',
    re.IGNORECASE,
)


def _resolve_src(rel_path: str) -> Path | None:
    """Find the rendered index.html for a root-relative URL path."""
    if "#" in rel_path:
        return None
    cleaned = rel_path.strip("/")
    if not cleaned:
        candidate = PUBLIC / "index.html"
    else:
        candidate = PUBLIC / cleaned / "index.html"
    return candidate if candidate.exists() else None


def main() -> int:
    if not PUBLIC.exists():
        print("[apply_rewrites] public/ not found — run `hugo` first.")
        return 1

    policy, force_inline, skip_inline = load_policy()
    canonical = canonical_short_urls()
    base = base_url()
    applied = skipped_ext = skipped_miss = skipped_policy = 0

    for html_file in sorted(PUBLIC.rglob("index.html")):
        try:
            head = html_file.read_text(encoding="utf-8", errors="replace")[:4096]
        except OSError:
            continue

        m = _REFRESH_RE.search(head)
        if not m:
            continue

        raw_target = m.group(1)
        rel_target = to_relative(raw_target, base)
        if rel_target is None:
            skipped_ext += 1
            continue

        src = _resolve_src(rel_target)
        if src is None:
            rel_from = str(html_file.parent.relative_to(PUBLIC))
            print(
                f"  SKIP /{rel_from}/ → {rel_target} "
                f"(target not found in public/)"
            )
            skipped_miss += 1
            continue

        if src.resolve() == html_file.resolve():
            continue

        rel_from = "/" + str(html_file.parent.relative_to(PUBLIC)).strip("/")
        if rel_from != "/":
            rel_from += "/"

        if not should_inline(rel_from, rel_target, policy, canonical, force_inline, skip_inline):
            skipped_policy += 1
            continue

        html_file.write_bytes(src.read_bytes())
        applied += 1

    print(
        f"[apply_rewrites] {applied} page(s) rewritten, "
        f"{skipped_policy} left as redirect stubs (policy), "
        f"{skipped_ext} external skipped, "
        f"{skipped_miss} target(s) not found."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
