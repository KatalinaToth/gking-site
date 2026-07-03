"""Shared policy for selective redirect stub inlining."""
from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
INLINE_POLICY = ROOT / "EditMe/Redirects/Data/inline_rewrites.yaml"


def load_policy() -> tuple[dict, set[str], set[str]]:
    import yaml

    defaults = {
        "deny_source_prefixes": [],
        "deny_source_substrings": [],
        "deny_targets": [],
        "allow_single_segment": True,
        "allow_publication_aliases": True,
        "allow_canonical_short_urls": True,
    }
    if not INLINE_POLICY.exists():
        return defaults, set(), set()
    data = yaml.safe_load(INLINE_POLICY.read_text()) or {}
    policy = {**defaults, **(data.get("policy") or {})}
    force_inline = {_norm_path(p) for p in data.get("force_inline") or []}
    skip_inline = {_norm_path(p) for p in data.get("skip_inline") or []}
    return policy, force_inline, skip_inline


def canonical_short_urls() -> set[str]:
    urls: set[str] = set()
    for md in (ROOT / "EditMe").rglob("index.md"):
        m = re.search(r'^url:\s*/([^/\s#]+)/\s*$', md.read_text(errors="ignore"), re.M)
        if m:
            urls.add(f"/{m.group(1)}/")
    return urls


def _norm_path(path: str) -> str:
    if not path.startswith("/"):
        path = "/" + path
    return path if path.endswith("/") else path + "/"


def should_inline(
    rel_from: str,
    rel_target: str,
    policy: dict,
    canonical: set[str],
    force_inline: set[str],
    skip_inline: set[str],
) -> bool:
    rel_from = _norm_path(rel_from)
    rel_target_norm = _norm_path(rel_target) if not rel_target.startswith("#") else rel_target

    if rel_from in skip_inline:
        return False
    if rel_from in force_inline:
        return True

    deny_targets = {_norm_path(t) for t in policy.get("deny_targets") or []}
    if rel_target_norm in deny_targets:
        return False
    if rel_target.startswith("#"):
        return False

    for prefix in policy.get("deny_source_prefixes") or []:
        if rel_from.startswith(_norm_path(prefix)):
            return False
    low = rel_from.lower()
    for sub in policy.get("deny_source_substrings") or []:
        if sub.lower() in low:
            return False

    if policy.get("allow_canonical_short_urls") and rel_from in canonical:
        return True
    segs = len(rel_from.strip("/").split("/")) if rel_from.strip("/") else 0
    if policy.get("allow_single_segment") and segs == 1:
        return True
    if policy.get("allow_publication_aliases") and segs == 2 and rel_from.startswith("/publication/"):
        return True
    return False


def base_url() -> str:
    for name in ("hugo.yaml", "hugo.toml", "config.yaml", "config.toml"):
        p = ROOT / name
        if p.exists():
            m = re.search(r'baseURL:\s*["\']?(https?://[^"\'>\s]+)', p.read_text())
            if m:
                return m.group(1).rstrip("/")
    return ""


def to_relative(url: str, base: str) -> str | None:
    url = url.strip()
    if url.startswith("/"):
        return url
    if base and url.startswith(base):
        return url[len(base) :] or "/"
    if urlparse(url).scheme in ("http", "https"):
        return None
    return "/" + url
