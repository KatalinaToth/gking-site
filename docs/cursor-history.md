# Cursor history (not in the files)

Knowledge from Cursor sessions that you cannot reconstruct from the tree
alone. Code comments and `AGENTS.md` now record some of this; this file is
the *why*, the false starts, and operator preference.

Last updated: 2026-08-26.

## Hosting and deploy

**Live site is Cloudflare Pages `gking-7bw`, not GitHub Pages.**
`gking.harvard.edu` CNAMEs to `gking-7bw.pages.dev`. The workflow still
uploads a GitHub Pages artifact as backup, but visitors never hit it.
`README.md` still says “deployed to GitHub Pages” in the intro — stale;
trust `AGENTS.md` and `.github/workflows/deploy.yml`.

**Why Cloudflare:** GitHub Pages has a **1 GiB artifact cap**. Inlining
every short-URL redirect as HTML (`apply_rewrites.py`) pushed the package
over the limit (~1.097 GiB after rewrites). Selective inlining plus PDF
compression got a deploy through at ~95% of the cap (~54 MB headroom) —
too tight. Cloudflare reads `_redirects` natively, so HTML duplication is
unnecessary. Prefer YouTube for long video; shrink PDFs if size bites
again.

**Wrong Cloudflare project (search-authorship fix looked like a no-op).**
Pagefind was indexing chrome (“Powered by Hugo Blox”) as if it were
authorship. Fix: `data-pagefind-body` on `<main>` in `layouts/baseof.html`,
`data-pagefind-ignore` on the search modal, drop that footer line. The
first deploy **did** succeed in CI but published to Cloudflare project
**`gking`** while DNS pointed at **`gking-7bw`**. Deploy now tries
`gking-7bw` then `gking`. A green GitHub Pages job or a Cloudflare deploy
to the unused project will not change what visitors see.

**Stale-looking live site after push:** `cancel-in-progress: true`. Wait
for the newest Actions run; an older queued build will not overwrite it.

## Mounts, smoke tests, redirects

**`generate_mounts.py` once dropped Startups** (`EditMe/Startups` and its
layout mount). Homepage startup logos 404’d; `/startups/` emptied. Startups
were added to the generator tables; `smoke_build.py` now fails CI if
required mounts or section counts look wrong. Still: prefer
`generate_mounts.py --check` over regen-and-hope, and eyeball Startups +
Presentations after any regen.

**`hugo.yaml` `module.mounts` is generated.** Hand-edits get blown away.

**URLs/aliases:** Drupal-era paths are preserved with front-matter `url:` /
`aliases:` plus `EditMe/Redirects/` → `build_redirects.py`. Removing a
redirect can break GaryAI citation links. CI order: redirects, then mounts
`--check`, then Hugo, smoke, Pagefind.

**Talks with slashes in titles** broke URL paths; at least one talk needed
a slug override (UChicago 2026). Future talk titles with `/` are a footgun.

## Search and AI surfaces

Search modal cap was **10**, not an index limit. Bumped to **50** in
`layouts/_partials/components/search-modal.html`. Local `hugo server` has
no Pagefind index — “search is broken locally” is expected.

Public machine-readable docs: `/llms.txt`, `/openapi.json` (and related
catalog work). Don’t delete them as clutter.

GaryAI: widget + `/ask-gary/`. Chat API is CloudFront → EC2
(`d325iygsd5krw9.cloudfront.net`); don’t retarget hosts without an AWS
change. Some feedback/pixel URLs may still be Lambda.

## Content and layout decisions

**Writings tabs** follow `writings_legacy_map.json`, not
`publication_types`. Papers must not use `publication_types: presentation`
(that labels the primary button “Presentation”).

**EditMe/** is a UX contract: non-technical editors (and agents) should
find page content there. PDFs stay in `_site/static/files/` because of
how static files are mounted. Replace PDFs **in place**; keep filenames so
buttons and old links keep working.

**Forced light mode** in `custom.css` (`html.dark` overridden). The
theme toggle is hidden. Don’t “enable dark mode” as a drive-by.

**Phone width (Aug 2026):** list pages used `padding: … 5rem` (80px each
side), leaving ~215px of content on a 375px phone. Class `gk-page`
drops left/right padding to 1.25rem **only at max-width 640px**. Desktop
must not change. New 5rem shells need the `gk-page` class or phones stay
narrow. Homepage already had its own ≤640px gutter rules.

**Gov 2020 / Hidden Curriculum (Aug 2026):**

- Syllabus PDF now hosted as `/files/syl2020.pdf` (was an external
  `projects.garyking.org` URL). `{{ relURL }}` in that page’s raw HTML
  was emitted literally — use root-relative `/files/…`.
- Long syllabus sections after “Who can take it” were **removed from the
  homepage on purpose** (enrollment/Perusall/office hours/grades); keep
  the footnote. Italics on the AI clause match the PDF.
- A recruiting **landing-page redesign** (dek, two cards, SPSS pull quote,
  tool buttons) was built and then **abandoned**. Gary asked to go back
  to the previous copy, add run-in headings like LaTeX `\paragraph`
  (bold title + period + rest of sentence), a seminar photo
  (`/images/gary-teaching.jpg`), and compact type. Don’t revive the
  marketing layout unless he asks.
- Drupal leftover wrappers (`hwp-*`) on that page were stripped; other
  teaching pages may still have them.

**Startups:** expandable list; copy-link anchors on homepage and
`/startups/`. `weight` in front matter is display order. After mount
regen, confirm startups still mount.

**Homepage:** “Recent Papers” renamed to “Papers”; software card order
matches `/software/`; books shown as a 3×3 cover grid; startup logos on
the homepage card.

## Approaches tried and dropped

- **Inline all short-URL HTML** for GitHub Pages → artifact over 1 GiB.
  Replaced by selective inlining, then Cloudflare `_redirects`.
- **Canvas / wireframe “options”** for Gov 2020 → hard to see; Gary wants
  a **real local webpage**.
- **Gov 2020 pitch page** (A+E+D mix) → reverted to compact syllabus
  prose + photo + `\paragraph` labels.
- Treating GitHub Pages green as “the site updated” → wrong after DNS
  moved to Cloudflare.

## Fragile areas

- `generate_mounts.py` + Startups/Presentations mounts
- `url:` / `aliases:` / `build_redirects.py` / `_redirects` rule count
  (Cloudflare caps rules; we were ~1k of ~2.1k)
- `writings_legacy_map.json` vs front matter for Writings tabs
- Hugo templates inside markdown HTML bodies
- Nested `<main>` in leftover Drupal teaching HTML (conflicts with
  `baseof.html`)
- `hugo_stats.json` merge conflicts; leave it unstaged
- Dual Cloudflare projects `gking` vs `gking-7bw`
- Repo/artifact size (PDFs, inlined HTML)
- Link contrast `#337ab7` on white is a known WCAG gap (no a11y CI)

## Operator preferences (Gary)

- Direct to `main`; no PRs/feature branches. Katalina Toth works the
  same way — fetch/merge before edit and before push.
- **Show the diff, commit message, and local Hugo result, then wait for
  “push” / “OK”.** Auto-push hook means commit ≈ deploy.
- Small commits whose messages say *why*.
- Never force-push `main`.
- If the build fails or the page looks wrong, **stop and say so**.
- Preview on `localhost:1313` for visual work; verify in a real browser,
  not only a screenshot.
- Keep his wording and italics. Compact, academic, typographic. No
  emoji/gradient marketing chrome.
- Mobile fixes must not restyle desktop.
- Replace PDFs in place; don’t invent new filenames for “updated” papers.
- Don’t commit `_scratch/` or drive-by `hugo_stats.json`.

## Recently shipped / still true as of 2026-08-26

Shipped: Gov 2020 compact page + local `syl2020.pdf`; phone `gk-page`
gutters; search cap 50; `conerr.pdf` replace-in-place for `/conjointE/`;
Pagefind body/ignore; Cloudflare dual-project deploy; smoke tests after
the Startups-mount incident.

Shipped 2026-08-26 (Claude Code): README hosting claims corrected to
Cloudflare Pages; 19 `files/abs/*-abs.shtml` redirects added for the
citation links inside `EditMe/Dataverse/Data/dataverse.json`; GaryAI
endpoint audit written up as `docs/garyai-endpoints.md`; April audit
broken-link list re-checked and annotated in
`docs/audits/SITE_AUDIT.md`.

Not done in Cursor: full WCAG AA; a11y in CI; named student
publications on the Gov 2020 page (would strengthen recruiting if Gary
supplies them).

## Resolved (were uncertainties; verified 2026-08-26)

- **Both Cloudflare projects stay.** Deliberate: `deploy.yml` lists and
  deploys to every `gking*` project the API token can see (`gking-7bw`
  first, then legacy `gking`) and fails only if none succeed. A comment
  in the workflow records the incident (commit `a3a02fc`) where
  deploying only to `gking-7bw` failed with a token/project mismatch —
  the loop is the guard against silently publishing to a dead project.
- **`apply_rewrites.py` is still invoked** in CI, after Pagefind and
  before artifact upload. It only serves the GitHub Pages *backup*
  (inlines target HTML at short URLs, since GH Pages ignores
  `_redirects`); Cloudflare uses the `_redirects` 200-rewrites instead.
  Harmless duplication — droppable only if the backup host is abandoned.
- **GaryAI endpoints confirmed live** (chat POST 200, feedback POST 200,
  pixel 200 `image/gif`): chat = CloudFront `d325iygsd5krw9` → EC2;
  feedback = API Gateway `4jk1rwjz4a.execute-api.us-east-2`; pixel =
  Lambda function URL `ueczzuogsj2hnfdr7gwfwuh5sa0oozkm…on.aws`. Full
  table with code locations: `docs/garyai-endpoints.md`. Note the pixel
  URL is hardcoded in the widget JS, not a `data-*` attribute.
- **April 2026 SITE_AUDIT broken links: all fixed.** Internal 17/17
  (removed, redirected, or — boocio — the page now exists); external
  18/20 removed or replaced, 2 replaced with URLs that now return 200;
  dead-host list cleaned except two personal sites that came back online.
  The last gap — abs-stub links inside `dataverse.json` — closed with
  the 2026-08-26 redirect batch. Details annotated in
  `docs/audits/SITE_AUDIT.md`.
- **Auto-push hook is enabled on Gary's machine** (`core.hooksPath =
  .githooks`, verified 2026-08-26) — commit ≈ deploy there. Still
  per-clone; check before assuming elsewhere.
- Local `_site/static/_redirects` is **gitignored and often stale**; CI
  regenerates it. Don't audit redirects from the local copy — read
  `EditMe/Redirects/Data/redirects.yaml` or run `build_redirects.py`.

## Uncertainties (verify; don’t guess)

- README “Claude / Cursor” prompts vs this Claude Code handoff — which
  doc Gary wants as the human source of truth going forward.
