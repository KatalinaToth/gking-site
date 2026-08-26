# CLAUDE.md

Source for [gking.harvard.edu](https://gking.harvard.edu/) (Gary King’s academic site).
Repo: `iqss-research/gking-site`. Shortcut: GaryKing.org.

This file is the short agent brief. **Do not duplicate** the long guides:

- [`README.md`](README.md) — human procedures, templates, prompts
- [`AGENTS.md`](AGENTS.md) — git/deploy workflow (authoritative if this file conflicts)
- [`EditMe/UI/PINNED-AT-ROOT.md`](EditMe/UI/PINNED-AT-ROOT.md) — why some paths cannot live under `EditMe/`
- [`docs/cursor-history.md`](docs/cursor-history.md) — decisions and gotchas not in the code

If this file conflicts with the README or `PINNED-AT-ROOT.md`, **defer to those**.

## What it is and how it ships

Hugo **0.160.1** extended + HugoBlox (`blox-tailwind`, vendored in `_vendor/`). CSS: Tailwind plus [`assets/css/custom.css`](assets/css/custom.css). Search: Pagefind (CI only).

**Live host is Cloudflare Pages project `gking-7bw`** (`gking.harvard.edu` → `gking-7bw.pages.dev`). Pushing `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): redirects → `generate_mounts.py --check` → Hugo `--buildFuture` → `smoke_build.py` → Pagefind → Cloudflare (`gking-7bw`, then fallback `gking`) plus a GitHub Pages artifact. The custom domain does **not** point at GitHub Pages; a green GH Pages job alone does not update visitors.

There is **no staging**. A failed CI build leaves the previous live site up but blocks later deploys until fixed. `cancel-in-progress: true` — if the live site looks stale, wait for the newest run.

## Repo map

| Path | Role |
|------|------|
| `EditMe/` | All editable *page* content. One obvious place for non-technical editors. |
| `_site/static/files/` | PDFs and downloads. Front matter: `url: files/<name>.pdf` (no leading slash). Replace **in place**; keep the filename. |
| `_site/static/` also | Intentional assets: `js/`, `mysite/`, `llms.txt`, `openapi.json`, `_redirects` input via scripts |
| `EditMe/UI/PerSectionLayouts/` | Per-section templates (mounted into `layouts/<section>/`) |
| `layouts/`, `assets/` | Pinned at repo root (theme looks up literal paths). Edit with care. |
| `hugo.yaml` `module.mounts:` | **Generated.** `python3 _automation/scripts/generate_mounts.py`. Never hand-edit. Prefer `--check` over blind regen. |
| `public/`, `resources/`, `node_modules/` | Build/cache. Never commit `public/`. |
| `_scratch/` | Local scratch. **Never commit.** |
| `hugo_stats.json` | Tailwind/Hugo noise. Don’t commit unless reviewed. |
| `_automation/` | Mounts, redirects, smoke tests, intake. |
| `.githooks/post-commit` | May auto-push on commit (`enable-auto-push.sh`). Treat commit as deploy. |

Writings live under `EditMe/Writings/` (articles by topic/decade/slug; talks under `Presentations/<title>/<venue>/`). Tab placement for `/publication/` is `EditMe/Writings/Data/writings_legacy_map.json`, **not** front-matter `publication_types`. Publication button labels: [`AGENTS.md`](AGENTS.md) § Publication types. Never use `presentation` on a paper.

## Conventions

- Edit content in `EditMe/` (PDFs under `_site/static/files/` excepted). Scattering edits elsewhere breaks the editor contract.
- Don’t change front-matter `url:` / `aliases:` without [`_automation/scripts/build_redirects.py`](_automation/scripts/build_redirects.py). Prefer adding redirects over deleting old paths (GaryAI citations).
- Presentation clustering: [`_automation/scripts/regroup_presentations_fuzzy.py`](_automation/scripts/regroup_presentations_fuzzy.py) `--dry-run` first; review `EditMe/Writings/Data/presentation_clustering_report.md`.
- After mount regen: confirm Startups + Presentations mounts; run `smoke_build.py`. Regen has dropped Startups before.
- Site is **forced light mode**. Links `#337ab7`. Harvard crimson `#A51C30` for identity accents.
- Phone gutters (≤640px): class `gk-page` on 5rem-padded shells. **Do not change desktop layout** when fixing mobile.
- Raw HTML in markdown does **not** run Hugo `{{ }}`. Use root-relative URLs (`/files/…`, `/publication/…`).
- Gary’s prose: keep wording and italics unless he asks for a rewrite. Compact academic pages beat marketing landing pages.
- One logical change per commit; messages explain *why*. No force-push to `main`.

## Preview and publish

Hugo 0.160.1, same visibility as CI:

```bash
.tools/hugo-0.160.1/hugo --buildFuture          # or: hugo --buildFuture
.tools/hugo-0.160.1/hugo server --buildFuture --bind 127.0.0.1 --port 1313
```

`--buildFuture` is required (future-dated talks). Local search is expected broken; Pagefind is CI-only.

If you changed `url:`/`aliases:`: `python3 _automation/scripts/build_redirects.py` **before** mounts check. Optional: `python3 _automation/scripts/smoke_build.py`.

**Git:** Gary King and Katalina Toth both push **directly to `main`**. `git fetch` at session start; merge if behind. Refetch before push if >~15 minutes. Build locally, then show (a) files/lines, (b) commit message, (c) build result, and wait for explicit “push” / “OK”. Never force-push. Stop and surface build failures; don’t silently retry-and-fix.

## Don’t casually touch

Theme/vendor/`go.mod`/`package.json`; `layouts/` except GaryAI, search modal, mysite, intentional chrome; `.github/workflows/*.yml` without calling it out; GaryAI API hosts in `layouts/baseof.html` (CloudFront → EC2); `/llms.txt` and `/openapi.json`.

GaryAI: widget `_site/static/js/gking-chat-widget.js`; page `/ask-gary/` (`EditMe/Misc/ask-gary/`, `layouts/chatbot/`). External hosts (chat = CloudFront→EC2, feedback = API Gateway, pixel = Lambda URL — three different AWS front doors, all verified live 2026-08-26): [`docs/garyai-endpoints.md`](docs/garyai-endpoints.md).

Mysite guide: `EditMe/Misc/mysite/`, `layouts/mysite/`, `_site/static/mysite/`. Product surface, not a one-off.

Analytics: `layouts/_partials/hooks/head-start/google-analytics.html` (`G-NDZT9P326S`).
