#!/usr/bin/env python3
"""Report build-time cost of inlining redirect stubs (apply_rewrites).

Run after `hugo --minify` and BEFORE apply_rewrites.py. Scans public/ for
meta-refresh redirect stubs and estimates how many bytes each would add if
inlined.

Usage:
    hugo --minify
    python3 _automation/scripts/report_rewrite_costs.py
    python3 _automation/scripts/report_rewrite_costs.py --top 50
"""
from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
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
    if "#" in rel_path:
        return None
    cleaned = rel_path.strip("/")
    candidate = PUBLIC / "index.html" if not cleaned else PUBLIC / cleaned / "index.html"
    return candidate if candidate.exists() else None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--top", type=int, default=30, help="Rows to show per table")
    args = parser.parse_args()

    if not PUBLIC.exists():
        print("[report_rewrite_costs] public/ not found — run `hugo` first.", file=sys.stderr)
        return 1

    policy, force_inline, skip_inline = load_policy()
    canonical = canonical_short_urls()
    base = base_url()

    rows: list[tuple[int, int, str, str, bool]] = []
    for html_file in sorted(PUBLIC.rglob("index.html")):
        head = html_file.read_text(encoding="utf-8", errors="replace")[:4096]
        m = _REFRESH_RE.search(head)
        if not m:
            continue
        rel_target = to_relative(m.group(1), base)
        if rel_target is None:
            continue
        src = _resolve_src(rel_target)
        if src is None or src.resolve() == html_file.resolve():
            continue
        stub_size = html_file.stat().st_size
        src_size = src.stat().st_size
        added = src_size - stub_size
        rel_from = "/" + str(html_file.parent.relative_to(PUBLIC)).strip("/")
        if rel_from != "/":
            rel_from += "/"
        inline = should_inline(rel_from, rel_target, policy, canonical, force_inline, skip_inline)
        rows.append((added, src_size, rel_from, rel_target, inline))

    rows.sort(reverse=True)
    all_added = sum(r[0] for r in rows)
    sel_added = sum(r[0] for r in rows if r[4])

    print(f"Redirect stubs with internal targets: {len(rows)}")
    print(f"Bytes if ALL inlined:     +{all_added:,} ({all_added / 1e6:.1f} MB)")
    print(f"Bytes with SELECTIVE policy: +{sel_added:,} ({sel_added / 1e6:.1f} MB)")
    print(f"Saved vs full inline:     {(all_added - sel_added) / 1e6:.1f} MB")
    print(f"Canonical EditMe short URLs: {len(canonical)}")
    print()

    print(f"Top {args.top} by bytes added (all candidates):")
    for added, src_size, rel_from, rel_target, inline in rows[: args.top]:
        flag = "INLINE" if inline else "stub"
        print(f"  [{flag:5s}] +{added / 1024:6.0f} KB  {rel_from:45s} -> {rel_target}")

    by_target: dict[str, list[tuple]] = defaultdict(list)
    for row in rows:
        by_target[row[3]].append(row)
    print()
    print(f"Top {args.top} targets by total waste if all stubs inlined:")
    target_rows = []
    for tgt, items in by_target.items():
        target_rows.append((sum(i[0] for i in items), len(items), max(i[1] for i in items), tgt))
    for waste, n, pagesz, tgt in sorted(target_rows, reverse=True)[: args.top]:
        print(f"  {n:3d} stubs -> {tgt:50s} page {pagesz / 1024:5.0f} KB  waste {waste / 1024:5.0f} KB")

    return 0


if __name__ == "__main__":
    sys.exit(main())
