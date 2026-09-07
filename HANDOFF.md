# Handoff — gk-wip — 2026-09-07

## Goal
Routine maintenance of gking.harvard.edu: a README reorganization plus two
new content items (a publication and a talk). Everything is already merged
to `main` and live; this note records the follow-ups that remain. Not
machine-specific — any clone can continue.

## Decisions, with reasons
- Confirmed the live host is Cloudflare Pages project `gking-7bw`; the
  deploy loop keeps both `gking-7bw` and legacy `gking` on purpose (a past
  API-token/project mismatch broke deploys, so CI tries both and fails only
  if neither succeeds).
- Kept `apply_rewrites.py` in CI: it inlines redirect targets for the
  GitHub Pages backup host only; Cloudflare uses `_redirects` natively.
- README rewritten (commits `3f5ac4f`, `c56ab90`, `4061f1b`): 17 flat
  sections collapsed to 9 roll-downs; `<summary>` uses bold text, not
  h2/h3, because heading margins created large gaps; nested items are
  wrapped in `<blockquote>` so the whole row (triangle included) indents;
  `name=` groups on `<details>` give a native exclusive accordion — GitHub's
  sanitizer keeps `name` and `id` (verified with `gh api markdown`).
- New publication "Improving Computational Reproducibility in the Social
  Sciences" (Nature Human Behaviour, `c472f9d`): no `doi:` front-matter
  field because the site convention is DOI via `type: source` only — the
  `doi:` field renders a duplicate DOI button; Fig. 1 extracted from the
  PDF as `featured.png` so the abstract wraps around it.
- New talk venue for "Who's to Blame for Survey Instability" at APSA,
  9/5/2026 (`e435aad`): duplicated the Michigan State bundle; slides at
  `/files/mw-apsa.pdf`; the homepage Presentations card picks up the 4
  newest talks by date, so no homepage edit was needed.
- Local `_site/static/_redirects` is gitignored and stale (July 4) — CI
  regenerates it; do not audit redirects from the local copy.

## Rejected paths
- Em-space indent for nested roll-downs: only the text shifted, the
  disclosure triangles stayed flush-left; replaced by blockquote wrapping.
- Numbered table of contents in the README: redundant once the collapsed
  summaries act as the TOC; removed.
- Hardcoding GaryAI endpoints in the README: the old list was stale (it
  showed the analytics-pixel Lambda URL as the chat API); the README now
  points at `docs/garyai-endpoints.md` instead.

## Next
Nothing is in flight; all shipped work is deployed and verified live.
Remaining follow-ups, in suggested order:
1. Annotate `docs/audits/SITE_AUDIT.md` with the 2026-08-31 re-check
   results (all 17 internal broken links fixed; 18 of 20 external 404s
   fixed; `gsg.skku.edu` was unreachable from the test network — verify in
   a browser). Gary has not yet chosen the annotation format.
2. `EditMe/Dataverse/Data/dataverse.json` still contains absolute
   `https://gking.harvard.edu/files/abs/*-abs.shtml` links inside dataset
   descriptions; some of those stubs (`counterft`, `smooth`, `words`, `sv`)
   have no redirect entry, so they 404. Either add redirects to
   `EditMe/Redirects/Data/redirects.yaml` or rewrite the JSON links to the
   matching `/publication/<slug>/` pages.
3. Add volume/pages to the reproducibility paper's `publication:` string
   once Nature Human Behaviour assigns them (currently online-first).
4. Update `docs/cursor-history.md` "Uncertainties": the dual-Cloudflare
   question and the `apply_rewrites.py` question are now answered (see
   Decisions above).

## Open questions
- How Gary wants `SITE_AUDIT.md` annotated (a status column per finding vs
  a dated addendum section).
- Whether the GitHub Pages backup host — and therefore the
  `apply_rewrites.py` inlining step — is worth keeping long-term.
