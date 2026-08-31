# gking-site

Source for <https://gking.harvard.edu/> — Gary King's academic website, built
with Hugo + Hugo Blox. Every push to `main` deploys via GitHub Actions to
Cloudflare Pages (project `gking-7bw`, which `gking.harvard.edu` points at;
GitHub Pages receives a backup copy only) and goes live in ~3 minutes.

> **Repository:** <https://github.com/iqss-research/gking-site> ·
> **Live site:** <https://gking.harvard.edu/> ·
> **Shortcut:** <https://GaryKing.org>

**This file is the single reference for human maintainers.** For AI-agent
workflow rules see [`AGENTS.md`](AGENTS.md). Click any section below to expand.

<details>
<summary><h2 id="overview">Overview</h2></summary>

| Layer | Choice |
|-------|--------|
| Static site generator | Hugo 0.160.1 (extended) |
| Theme | Hugo Blox (`blox-tailwind`) via Go module, vendored in `_vendor/` |
| CSS | Tailwind (compiled by Blox) + `assets/css/custom.css` for overrides |
| Search | Pagefind (static, wasm-based; index built in CI) |
| Hosting | Cloudflare Pages `gking-7bw` (`gking.harvard.edu` → `gking-7bw.pages.dev`); GitHub Pages holds a backup artifact the domain does not point at |
| CI/CD | GitHub Actions (`.github/workflows/deploy.yml`) |

All editable content lives under **`EditMe/`**. Hugo's `module.mounts` block
in `hugo.yaml` remaps every sub-folder onto Hugo's expected `content/`,
`layouts/`, and `data/` paths at build time, so URLs are unchanged. The
mounts block is auto-generated — run
`python3 _automation/scripts/generate_mounts.py` after adding or removing
folders under `EditMe/`.

**Two ways to edit** (either is live within ~3 minutes):

- **Claude Code** — describe the change in plain English. Claude edits the
  files and pushes, following [`AGENTS.md`](AGENTS.md) and
  [`CLAUDE.md`](CLAUDE.md). Ready-made prompts:
  [Copy-paste Claude prompts](#claude-prompts-for-common-tasks).
- **GitHub.com** — pencil-icon edits in the browser. No local tools needed;
  works from a phone or borrowed laptop. Step-by-step:
  [By hand on GitHub](#manual-content-templates).

</details>

<details>
<summary><h2 id="repository-layout">Repository layout</h2></summary>

```
gking-site/                           ← root of the git checkout
├── EditMe/                           ← EVERY editable thing on the site
│   ├── UI/                           ← per-section layout overrides, CSS pointer
│   │   ├── PerSectionLayouts/        ← one subfolder per section with custom templates
│   │   │   ├── HomePage/landing/     ← homepage template
│   │   │   ├── Writings/             ← publication single/list pages
│   │   │   ├── Talks/                ← talk single page
│   │   │   ├── Startups/             ← startups list/single pages
│   │   │   ├── ResearchAreas/        ← research areas page
│   │   │   ├── ResearchGroup/        ← people/research-group page
│   │   │   ├── Software/             ← software list/single pages
│   │   │   └── ...
│   │   ├── Config/                   ← editorial config snippets
│   │   └── PINNED-AT-ROOT.md         ← explains what can't move into EditMe/
│   │
│   ├── HomePage/                     ← homepage (/_index.md)
│   ├── Bio/                          ← /bio/
│   ├── Writings/                     ← papers, books, reports, patents, court
│   │   │                                briefs, software-papers, slide decks
│   │   ├── Articles/<Topic>/<Decade>/<slug>/
│   │   ├── Books/<Decade>/<slug>/
│   │   ├── Reports/<Decade>/<slug>/
│   │   ├── Patents/<Decade>/<slug>/
│   │   ├── CourtBriefs/<Decade>/<slug>/
│   │   ├── SoftwareNotes/<Decade>/<slug>/
│   │   ├── Presentations/<title-slug>/<venue-slug>/
│   │   ├── Data/                     ← featured_publications.yaml,
│   │   │                                writings_legacy_map.json, …
│   │   └── _SectionPages/            ← _index.md for /publication/ and /talk/
│   │
│   ├── Startups/                     ← /startups/ (Crimson Hexagon, Thresher, etc.)
│   ├── ResearchAreas/                ← /research-areas/ (+ Data/research_areas.json)
│   ├── Software/                     ← /software/ (+ Data/*.yaml)
│   ├── Dataverse/                    ← /dataverse/ (+ Data/dataverse.json)
│   ├── People/                       ← /research-group/, /people/, /authors/
│   │   ├── ResearchGroup/
│   │   ├── Profiles/                 ← ~350 collaborator profiles
│   │   ├── Authors/                  ← author taxonomy (gary-king)
│   │   └── Data/research_group.json
│   ├── Teaching/                     ← /teaching/ (+ per-class sub-pages)
│   ├── Blog/                         ← /blog/
│   ├── Contact/                      ← /contact/
│   ├── Misc/                         ← standalone pages (advice, recs, ask-gary, …)
│   └── Redirects/                    ← legacy URL aliases
│       ├── Data/redirects.yaml
│       └── content/                  ← auto-generated stubs (gitignored)
│
├── layouts/                          ← shared theme bits (baseof.html, _default/,
│                                        _partials/, shortcodes/, chatbot/)
├── assets/                           ← css/custom.css + media/
│
├── _site/                            ← cross-section Hugo plumbing
│   ├── static/files/                 ← PDFs, slides, supplementary downloads
│   ├── static/images/                ← bio photo, site-wide images
│   ├── static/js/                    ← gking-chat-widget.js (GaryAI popup)
│   ├── archetypes/                   ← templates for `hugo new`
│   ├── i18n/                         ← button label overrides (en.yaml)
│   └── data/                         ← cross-section data outputs
│
├── _automation/                      ← maintenance scripts
│   └── scripts/                      ← every Python helper
│       ├── writings/                 ← DOI fillers, audits
│       ├── people/                   ← profile sync, research-group scrapers
│       └── (top-level)               ← build_redirects.py, generate_mounts.py, …
│
├── docs/audits/                      ← point-in-time audit reports
├── .github/workflows/                ← CI/CD: deploy, weekly-audit
├── .githooks/                        ← post-commit auto-push hook
└── hugo.yaml                         ← site config (menus, theme, module.mounts)
```

`layouts/`, `assets/`, `.github/`, and `.githooks/` are **pinned at the
project root** — HugoBlox and GitHub read them by literal path, so they
cannot move into `EditMe/`. Details:
[`EditMe/UI/PINNED-AT-ROOT.md`](EditMe/UI/PINNED-AT-ROOT.md). Each folder
under `EditMe/` has its own small `README.md` for quick navigation.

### Where do I find X?

| You want to edit / find … | Look here |
| --- | --- |
| A specific paper | `EditMe/Writings/<Type>/<Topic>/<Decade>/<slug>/index.md` |
| A specific talk / slide deck | `EditMe/Writings/Presentations/<title-slug>/<venue-slug>/index.md` |
| A software tool's page | `EditMe/Software/<slug>/index.md` |
| A person's profile | `EditMe/People/Profiles/<slug>/index.md` |
| Site bio / CV | `EditMe/Bio/index.md` · CV PDF at `_site/static/files/vitae.pdf` |
| Home page sections | `EditMe/HomePage/_index.md` · template at `EditMe/UI/PerSectionLayouts/HomePage/landing/list.html` |
| The "Featured" working-papers spotlight | `EditMe/Writings/Data/featured_publications.yaml` |
| The Writings page tab routing | `EditMe/Writings/Data/writings_legacy_map.json` |
| The Dataverse list | `EditMe/Dataverse/Data/dataverse.json` |
| The research-group roster | `EditMe/People/Data/research_group.json` |
| The Research Areas grid | `EditMe/ResearchAreas/Data/research_areas.json` |
| Startup pages (Crimson Hexagon, Thresher, etc.) | `EditMe/Startups/<slug>/index.md` |
| Startups page layout | `EditMe/UI/PerSectionLayouts/Startups/list.html` |
| Legacy URL redirects | `EditMe/Redirects/Data/redirects.yaml` |
| PDFs | `_site/static/files/<slug>.pdf` |
| Custom CSS | `assets/css/custom.css` |
| Per-section layout overrides | `EditMe/UI/PerSectionLayouts/<Section>/` |
| All Python helpers | `_automation/scripts/` |
| GitHub workflows | `.github/workflows/` |
| Site-wide partials / shortcodes | `layouts/_partials/`, `layouts/shortcodes/` |
| GaryAI chatbot page | `EditMe/Misc/ask-gary/index.md` + `layouts/chatbot/single.html` |
| GaryAI popup widget | `_site/static/js/gking-chat-widget.js` |
| Google Analytics tracking | `layouts/_partials/hooks/head-start/google-analytics.html` (tag `G-NDZT9P326S`) |
| What runs when something is pushed to `main` | `.github/workflows/deploy.yml` |
| Navigation menu | `hugo.yaml` → `menus.main` |
| Button label overrides ("Article", etc.) | `_site/i18n/en.yaml` |

</details>

<details>
<summary><h2 id="quick-add-every-content-type">Adding content</h2></summary>

Have this ready for each content type:

| Content type | What to have ready |
|---|---|
| Paper / article | The PDF, plus: title, authors, year, journal/venue, abstract, DOI |
| Talk / presentation | The slides PDF, plus: title, venue name, year |
| Book | Title, authors, publisher, year, abstract |
| Software / R package | Name, website URL, short description |
| Patent | The PDF, plus: title, inventors, year, patent number |
| Court brief | The PDF, plus: title, authors, year, abstract |

Then either paste a [Claude prompt](#claude-prompts-for-common-tasks)
(easiest) or follow the [manual GitHub steps](#manual-content-templates).

<h3 id="claude-prompts-for-common-tasks">Copy-paste Claude prompts</h3>

To use one: copy the prompt text, replace every **`XXX`** with your actual
information, drag in the file if the prompt says "Attach:", then paste into
Claude Code and send.

<details>
<summary><strong>Add a new journal article</strong> (attach the article PDF)</summary>

```
Add a new journal article to gking-site.

- Title: XXX
- Authors: XXX (comma-separated)
- Publication venue: XXX (e.g. "American Political Science Review, 111, 3, Pp. 484–501")
- Year: XXX
- Abstract: XXX
- Publisher's DOI or URL: XXX
- Dataverse DOI (if any): XXX
- Topic: XXX (pick one: AnchoringVignettes, AutomatedTextAnalysis, CausalInference, EcologicalInference, EventCountsAndDurations, MissingDataMeasurementErrorPrivacy, QualitativeResearch, RareEvents, SurveyResearch, UnifyingStatisticalAnalysis, or Other)

The article PDF is attached. Commit and push.
```

</details>

<details>
<summary><strong>Add a new book</strong></summary>

```
Add a new book to gking-site.

- Title: XXX
- Authors: XXX
- Publisher: XXX
- Year: XXX
- Abstract: XXX
- Publisher's URL (if any): XXX

Commit and push.
```

</details>

<details>
<summary><strong>Add a new presentation</strong> (attach the slides PDF)</summary>

```
Add a new presentation to gking-site.

- Talk title: XXX
- Venue / event name: XXX
- Year: XXX
- Abstract: XXX

The slides PDF is attached. Commit and push.
```

</details>

<details>
<summary><strong>Add a new court brief</strong> (attach the brief PDF)</summary>

```
Add a new court brief to gking-site.

- Title: XXX
- Authors: XXX (all signatories)
- Year: XXX
- Abstract: XXX

The brief PDF is attached. Commit and push.
```

</details>

<details>
<summary><strong>Add a new patent</strong> (attach the patent PDF)</summary>

```
Add a new patent to gking-site.

- Title: XXX
- Inventors: XXX
- Year: XXX
- Patent number: XXX

The patent PDF is attached. Commit and push.
```

</details>

<details>
<summary><strong>Add a new software package page</strong></summary>

```
Add a new software package page to gking-site.

- Software name: XXX
- Authors / maintainers: XXX
- Year: XXX
- External website URL: XXX
- Brief description: XXX

Commit and push.
```

</details>

<details>
<summary><strong>Replace or update a PDF</strong> (attach the new PDF)</summary>

```
Replace the PDF for an existing item on gking-site.

- Item title: XXX
- Type: XXX (article / book / presentation / brief / patent)

Find the item, replace the PDF keeping the same filename. Commit and push.
```

</details>

<details>
<summary><strong>Add a short URL (redirect)</strong></summary>

```
Add a new short URL redirect to gking-site.

- Short URL path: XXX (this becomes gking.harvard.edu/XXX)
- Destination: XXX (full URL or site path like /publication/quest/)

Commit and push.
```

</details>

<details>
<summary><strong>Add a paper to a Research Area</strong></summary>

```
Add a paper to a Research Area on gking-site.

- Paper title: XXX
- Research area name: XXX
- Subcategory: XXX

Commit and push.
```

</details>

<details>
<summary><strong>Other tasks</strong> (bio/CV, blog posts, weekly audit script)</summary>

```
Update the Bio/CV page on gking-site.
Changes to make: XXX
```

```
Add a new blog post to gking-site.
- Title: XXX
- Date: XXX (YYYY-MM-DD)
- Content: XXX
```

```
Update the weekly audit script (_automation/scripts/audit_site.py) on gking-site.

I want to add a new check: XXX

The script runs every Monday via GitHub Actions and posts the report
as a GitHub Issue (labeled `audit`).
It currently checks: research area coverage, legacy map sync, PDF integrity,
broken redirects, duplicate titles, empty dirs, dependency versions, and
broken external links. Add the new check and make sure it integrates with
the existing report format (level: ERROR/WARN/INFO, category, title, details list).

Commit and push.
```

</details>

**Tips:** to find an existing item, ask Claude to search by title; to preview
before publishing, ask Claude to run `hugo server`; combine several prompts
in one message for multiple changes at once.

<h3 id="manual-content-templates">By hand on GitHub</h3>

Step-by-step instructions for adding content directly on GitHub (no Claude,
no local tools).

<details>
<summary><strong>Adding a paper or article</strong></summary>

1. Go to https://github.com/iqss-research/gking-site
2. Click into `_site/static/files/`
3. Click **"Add file"** → **"Upload files"**
4. Drag in your PDF. Name it something short with dashes (e.g., `my-paper-title.pdf`)
5. Click **"Commit changes"**
6. Now go back to the repo root and click into the folder for your content type:
   - Journal article → `EditMe/Writings/Articles/`
   - Book → `EditMe/Writings/Books/`
   - Report → `EditMe/Writings/Reports/`
   - Patent → `EditMe/Writings/Patents/`
   - Court brief → `EditMe/Writings/CourtBriefs/`
7. For articles, pick the topic subfolder that fits (e.g., `CausalInference/`, `RareEvents/`, etc.). If unsure, use `Unsorted/`.
8. Click into the decade subfolder (e.g., `2020s/`)
9. Click **"Add file"** → **"Create new file"**
10. In the filename box, type: `your-paper-name/index.md` (this creates a folder and file at once)
11. Paste the following template and replace every placeholder with your actual info:

```yaml
---
title: "PASTE YOUR PAPER TITLE HERE"
date: YYYY-MM-DD
authors:
  - "Gary King"
  - "SECOND AUTHOR NAME"
publication_types:
  - "journal_article"
publication: "JOURNAL NAME, Volume(Issue), Pages"
abstract: |-
  PASTE ABSTRACT HERE.
doi: "PASTE DOI HERE (e.g., 10.1234/example)"
links:
  - type: pdf
    url: "files/YOUR-PDF-FILENAME.pdf"
  - type: source
    url: "https://doi.org/PASTE-DOI-HERE"
---
```

12. Click **"Commit changes"**
13. Finally, open `EditMe/Writings/Data/writings_legacy_map.json`, click the pencil icon, and add this line near the bottom (before the closing `}`):

```json
"your-paper-name": { "tab": "journal", "drupal": "journal_article" }
```

Use `"tab": "book"` for books, `"tab": "patent"` for patents, `"tab": "courtbrief"` for court briefs.

14. Click **"Commit changes"** — the site rebuilds with your new paper.

</details>

<details>
<summary><strong>Adding a talk / presentation</strong></summary>

1. Upload the slides PDF to `_site/static/files/` (same as steps 2–5 for a paper)
2. Navigate to `EditMe/Writings/Presentations/`
3. Click **"Add file"** → **"Create new file"**
4. In the filename box, type: `your-talk-title/venue-name-year/index.md`
5. Paste this template and fill it in:

```yaml
---
title: "PASTE TALK TITLE HERE"
date: YYYY-MM-DD
authors:
  - "Gary King"
publication_types:
  - "presentation"
event: "CONFERENCE OR EVENT NAME"
location: "CITY, STATE"
abstract: "SHORT DESCRIPTION OF THE TALK."
links:
  - type: pdf
    url: "files/YOUR-SLIDES-FILENAME.pdf"
---
```

6. Click **"Commit changes"**

If the same talk was given at multiple venues, create another folder next to
the first one (e.g., `your-talk-title/second-venue-year/index.md`).

</details>

<details>
<summary><strong>Adding a software page</strong></summary>

1. Navigate to `EditMe/Software/`
2. Click **"Add file"** → **"Create new file"**
3. In the filename box, type: `your-software-name/index.md`
4. Paste this template and fill it in:

```yaml
---
title: "SOFTWARE NAME"
date: YYYY-MM-DD
authors:
  - "Gary King"
publication_types:
  - "software"
abstract: "ONE-SENTENCE DESCRIPTION OF WHAT THE SOFTWARE DOES."
links:
  - name: "Project Website"
    url: "https://YOUR-SOFTWARE-WEBSITE.com"
  - name: "GitHub"
    url: "https://github.com/YOUR-ORG/YOUR-REPO"
---
```

5. Click **"Commit changes"**
6. Also open `EditMe/Software/Data/software_legacy_rows.yaml`, click the pencil icon, and add a line like:

```yaml
- year: 2026
  slug: your-software-name
```

7. Click **"Commit changes"**

</details>

<details>
<summary><strong>Adding a featured image</strong></summary>

To add a thumbnail image to any paper, talk, or software page:

1. Navigate to the folder that contains the `index.md` you just created
2. Click **"Add file"** → **"Upload files"**
3. Upload an image named exactly `featured.jpg` or `featured.png`
4. Click **"Commit changes"**

</details>

<details>
<summary><strong>Link types reference</strong> (the <code>links:</code> section)</summary>

| What you type | What button appears on the page |
|---|---|
| `type: pdf` | "Article" (or "Presentation", "Brief", etc. depending on content type) |
| `type: source` | "Publisher's Version" |
| `type: code` | "Code" |
| `name: "Any Label"` | A button with whatever label you typed |

For the `url:` value: if it starts with `files/` (no slash at the beginning),
it points to a PDF you uploaded to `_site/static/files/`. Otherwise, use a
full URL starting with `https://`.

</details>

<h3 id="publication-types-reference">Publication types reference</h3>

Use exactly one of these strings in `publication_types:`.

| Type | Writings tab | Primary button label |
|---|---|---|
| `journal_article` | Journal Articles | Article |
| `book` | Books & Chapters | Article |
| `book_chapter` | varies | Book Chapter |
| `working_paper` | Working Papers spotlight | Article |
| `conference_paper` | Other | Article |
| `report` | Other | Article |
| `data` | Other | Article |
| `software` | Software | Article |
| `court_brief` | Court Briefs | Brief |
| `patent` | Patents | Patent |
| `presentation` | Presentations | Presentation |
| `poster` | Other | Poster |
| `letter` | Other | Letter |
| `other` | Other | Article |

Also recognised (legacy / Drupal): `conference_proceedings`,
`miscellaneous`, `newspaper_article`, `unpublished`, `web_article`,
`website`.

The primary button label changes automatically based on
`publication_types` (handled in `layouts/_partials/page_links.html`). For
`/publication/` entries, the Writings **tab** placement is driven by
`EditMe/Writings/Data/writings_legacy_map.json`, which takes precedence
over front-matter `publication_types` for tab routing.

</details>

<details>
<summary><h2 id="short-urls--redirects">Short URLs &amp; redirects</h2></summary>

To create a short URL like `gking.harvard.edu/quest` that sends visitors to
a page or external link:

1. On GitHub, open `EditMe/Redirects/Data/redirects.yaml` and click the
   **pencil icon** to edit
2. Add a new entry at the bottom (keeping the same spacing as existing entries):

```yaml
  - from: quest
    to:   /publication/quest/
    note: "Short URL for the Quest paper"

  - from: rd
    to:   https://docs.google.com/document/d/abcdef123/edit
    note: "Research Directions living doc"
```

3. Click **"Commit changes"** — the redirect works after the site rebuilds.

**Alternative:** for a short URL to a single paper, edit that paper's
`index.md` instead and add inside the front matter:

```yaml
aliases:
  - /your-short-url/
```

136 redirects from the old Drupal site are already configured; leave them
alone (GaryAI citations and old links depend on them).

</details>

<details>
<summary><h2 id="site-features">Site features</h2></summary>

<details>
<summary><h3 id="featured-spotlight--see-also">Featured spotlight &amp; See Also</h3></summary>

**Working Papers spotlight.** The section at the top of `/publication/` is
controlled by `EditMe/Writings/Data/featured_publications.yaml`:

```yaml
count: 5

order:
  - slug-of-pinned-paper-1
  - slug-of-pinned-paper-2

exclude:
  - slug-to-keep-out
```

How the displayed list is built:

1. Start with the manually curated `order` list.
2. Any journal-article publication NOT already in `order` or `exclude` is
   prepended by its **first-commit date** (newest first), so adding a fresh
   paper auto-promotes it.
3. The list is capped at `count` entries.

First-commit dates live in
`EditMe/Writings/Data/publication_first_commit.json`, refreshed in CI by
`_automation/scripts/writings/compute_publication_first_commit.py`.

**See Also.** The box at the bottom of every paper, talk, and software page
fills itself — the site scans titles, authors, and tags. To influence it:

- **Force specific links** with front matter:
  ```yaml
  related_talks:    ["talk-slug-1", "talk-slug-2"]
  related_papers:   ["paper-slug-1"]
  related_software: ["software-slug-1"]
  related_datasets: ["dataset-slug-1"]
  ```
- **Improve auto-matching** by adding shared `tags:` or `keywords:`.
- The box shows at most 6 items, sorted explicit-first, then by match
  strength, then by year.

**Cross-linking papers and talks:**

```yaml
# In a publication (link to talks):
related_talks:
  - "talk-slug-1"

# In a talk (link to paper):
related_paper: "publication-slug"

# Harvard Dataverse link:
dataverse_url: "https://doi.org/10.7910/DVN/XXXXX"
dataverse_name: "Replication Data for: Paper Title"
```

</details>

<details>
<summary><h3 id="research-areas-homepage-navigation--other-pages">Research areas, homepage &amp; navigation</h3></summary>

**Research areas.** Groupings live in
`EditMe/ResearchAreas/Data/research_areas.json` with two top-level keys
(`methods` and `applications`), each containing areas with subcategories and
`papers` lists:

```json
{ "title": "Paper Title", "section": "publication", "slug": "paper-slug" }
```

`section` is one of `publication`, `talk`, or `software`.

**Homepage.** `EditMe/HomePage/_index.md` is minimal. All visual blocks are
rendered by `EditMe/UI/PerSectionLayouts/HomePage/landing/list.html`, which
pulls from `EditMe/Writings/` (newest entries by date),
`writings_legacy_map.json` (for "Books"), `featured_publications.yaml` (for
the spotlight), and `research_areas.json` (for the grid). Most homepage
updates happen by editing those data files, not the homepage itself.

**Navigation menu.** Defined in `hugo.yaml` under `menus.main` (by weight):

| Weight | Name | URL |
|---|---|---|
| 10 | Bio & C.V. | `/bio/` |
| 20 | Writings | `/publication/` |
| 30 | Research Areas | `/#research-areas` |
| 40 | Software | `/software/` |
| 45 | Startups | `/startups/` |
| 50 | Dataverse | `/dataverse/` |
| 60 | People | `/research-group/` |
| 70 | Teaching | `/teaching/` |
| 75 | GaryAI | `/ask-gary/` |
| 80 | Contact | `/contact/` |

**Button labels.** Controlled by `_site/i18n/en.yaml`
(e.g. `btn_pdf: Article`, `btn_source: "Publisher's Version"`). The primary
button label also changes automatically — see
[Publication types reference](#publication-types-reference).

**Other pages:**

| Page | File |
|---|---|
| Teaching | `EditMe/Teaching/_index.md` |
| Per-class sub-page | `EditMe/Teaching/<class>/index.md` |
| Contact | `EditMe/Contact/index.md` |
| Dataverse | `EditMe/Dataverse/index.md` |
| Research Group landing | `EditMe/People/ResearchGroup/index.md` |
| Bio | `EditMe/Bio/index.md` |
| Blog posts | `EditMe/Blog/<slug>/index.md` |

The "Advice and Suggestions" links live at the bottom of
`EditMe/Teaching/_index.md` under `<h2 id="advice">`.

**Updating bio / CV:** bio text in `EditMe/Bio/index.md`; CV PDF at
`_site/static/files/vitae.pdf` (replace in place); bio photo at
`_site/static/images/gking-bio-photo.jpg`.

</details>

<details>
<summary><h3 id="people--research-group">People &amp; research group</h3></summary>

**Profiles.** Each person has a folder at
`EditMe/People/Profiles/<slug>/index.md`:

```yaml
---
title: "Jane Doe"
type: "people"
role: "Harvard University (Assistant Professor of Government)"
research_group_category: "collaborators"
website: "https://janedoe.com/"
---
```

Valid `research_group_category` values: `alumni_students`,
`alumni_postdocs`, `collaborators`.

**Roster.** The filterable roster at `/research-group/` is driven by
`EditMe/People/Data/research_group.json`:

```json
{
  "slug": "jane-doe",
  "name": "Jane Doe",
  "affiliation": "Harvard University",
  "research_group_categories": ["collaborators"],
  "last_name_range": "D-G"
}
```

`last_name_range` must be one of:
`A-C`, `D-G`, `H-J`, `K-L`, `M-P`, `Q-S`, `T-V`, `W-Z`.

**Current Research Group box.** The box at the top of `/research-group/` is
curated by hand in `EditMe/UI/PerSectionLayouts/ResearchGroup/single.html`.

</details>

<details>
<summary><h3 id="startups-section">Startups</h3></summary>

The Startups section at `/startups/` showcases Gary's startup companies,
with its own menu item and dedicated layout.

**Content.** Each startup is a page bundle under
`EditMe/Startups/<slug>/index.md`:

| Startup | Weight | Has story? |
|---|---|---|
| Crimson Hexagon | 1 | Yes (Twitter thread) |
| Thresher | 2 | Yes (Twitter thread) |
| Learning Catalytics | 3 | Yes (Harvard Gazette article) |
| OpenScholar | 4 | No (external link only) |
| Perusall | 5 | No (external link only) |
| QuickCode | 6 | No (external link only) |

Front matter fields:

```yaml
---
title: "Startup Name"
date: "2007-01-01"
weight: 1
summary: "Merged with Brandwatch, acquired by Cision"
external_site: "https://www.brandwatch.com/"
abstract: |-
  Full HTML story content here (rendered with markdownify).
  Use <p> tags for paragraph spacing.
image:
  filename: featured.png
  caption: "Photo credit text"
aliases:
  - /publication/old-slug/
---
```

- `weight` controls display order on `/startups/` (ascending).
- `summary` appears as a subtitle next to the title in the dropdown.
- `external_site` creates a "Visit site" link.
- `abstract` contains the full story (HTML allowed; requires Hugo's
  `unsafe: true` goldmark setting). Startups without stories have no
  `abstract` — they show only the dropdown with a "Visit site" link.

**Layout.** List page
`EditMe/UI/PerSectionLayouts/Startups/list.html` renders each startup as an
expandable `<details>` dropdown sorted by `weight`, with JS to auto-open via
URL hash (e.g. `/startups/#thresher`). Single page `Startups/single.html`
redirects to the list page with an anchor. The homepage shows startup
dropdowns with a short excerpt and "Read more" links to `/startups/#<slug>`;
full stories live only on `/startups/`.

**Adding a new startup:** create `EditMe/Startups/<slug>/index.md` with the
front matter above, set `weight`, optionally add `featured.png`, and run
`python3 _automation/scripts/generate_mounts.py` if the folder structure
changed.

</details>

<details>
<summary><h3 id="garyai-chatbot">GaryAI chatbot</h3></summary>

The site has an AI chatbot ("GaryAI") with two surfaces:

- **Popup widget (every page):** a floating chat bubble. Script:
  `_site/static/js/gking-chat-widget.js`, loaded in `layouts/baseof.html`
  with `data-*` attributes for API URLs, bot name, welcome message, etc.
- **Dedicated page (`/ask-gary/`):** a full-page chat UI. Content:
  `EditMe/Misc/ask-gary/index.md` (minimal — just sets `type: chatbot`);
  layout: `layouts/chatbot/single.html` (~900 lines of inline HTML/CSS/JS).

**Backend.** Three AWS endpoints (chat via CloudFront → EC2, feedback via
API Gateway, analytics pixel via Lambda URL) — the authoritative list, with
where each is wired in code, is
[`docs/garyai-endpoints.md`](docs/garyai-endpoints.md). Don't change these
unless the AWS deployment changes.

**Mobile behavior.** On `/ask-gary/` desktop, the native chat UI is used and
the popup button is hidden via JS; on mobile, the native chat is hidden and
the popup widget opens full-screen instead.

</details>

</details>

<details>
<summary><h2 id="automation--cicd">Automation &amp; CI/CD</h2></summary>

Two workflows in `.github/workflows/`:

| Workflow | Trigger | What it does |
|---|---|---|
| `deploy.yml` | Push to `main` | Build Hugo + Pagefind, run `build_redirects.py` + `apply_rewrites.py` + `compute_publication_first_commit.py`, deploy to Cloudflare Pages (`gking-7bw`, then legacy `gking`); a GitHub Pages backup copy is uploaded best-effort. |
| `weekly-audit.yml` | Weekly (Monday 10am ET) | Runs `_automation/scripts/audit_site.py` and posts the report as a GitHub Issue (labeled `audit`); the same issue is updated every week. |

**Weekly site audit.** The Monday report covers:

1. Papers not assigned to any research area
2. Legacy map entries out of sync with content folders
3. PDFs referenced in content but missing from `_site/static/files/`
4. PDFs in `static/files/` not referenced by any page
5. Internal redirect targets that point to non-existent pages
6. Duplicate titles (possible accidental copies)
7. Empty directories that can be cleaned up
8. Dependency versions (Hugo, Hugo Blox, Pagefind) and available updates
9. Broken external links (checks all URLs in content files)

Run locally with `python3 _automation/scripts/audit_site.py`
(`SKIP_LINK_CHECK=1` skips the slow external-link check). Subscribe to the
audit issue (Watch → Custom → Issues) for a Monday email — find it at
[Issues → label: audit](https://github.com/iqss-research/gking-site/issues?q=is%3Aissue+label%3Aaudit).

**Auto-push hook.** `_automation/scripts/enable-auto-push.sh` registers
`.githooks/post-commit` so every `git commit` automatically pushes. One-off
skip: `SKIP_AUTO_PUSH=1 git commit -m "wip"`. Turn off permanently:
`git config hooks.skip-auto-push true`.

**Helper scripts.** All Python helpers live under `_automation/scripts/`;
most need `pip install -r _automation/scripts/requirements.txt`.

| Script | What it does |
|---|---|
| `generate_mounts.py` | Regenerate `module.mounts` in `hugo.yaml` after adding/removing `EditMe/` folders. `--check` to verify. |
| `build_redirects.py` | Generate redirect stubs from `redirects.yaml`. Runs in CI. |
| `apply_rewrites.py` | Post-build: replace redirect stubs with rendered HTML. Runs in CI. |
| `quick_add.py` | Scaffold new content (`paper`, `talk`, `book`, `software`, `patent`). `--dry-run` to preview. |
| `regroup_articles.py` | Sort `Unsorted/` articles into `<Topic>/<Decade>/`. |
| `regroup_writings.py` | Sort into `Books/`, `Reports/`, `Patents/`, etc. |
| `regroup_presentations.py` | Cluster talks by title-slug. |
| `writings/compute_publication_first_commit.py` | Refresh spotlight ordering. Runs in CI. |
| `people/sync_research_group.py` | Refresh `research_group.json` from roster. |

</details>

<details>
<summary><h2 id="local-development">Local development</h2></summary>

### First-time setup (do this once)

1. Open Terminal (on Mac: press Cmd+Space, type "Terminal", press Enter)
2. Download the site and enter its folder:

```bash
git clone https://github.com/iqss-research/gking-site.git
```

```bash
cd gking-site
```

3. Install Hugo (the tool that builds the website):

```bash
brew install hugo
```

If you get "brew: command not found", first install Homebrew by going to
https://brew.sh and following their one-line install command, then try
again. (CI pins Hugo **0.160.1**; a matching binary is checked in at
`.tools/hugo-0.160.1/hugo` if your brew-installed version behaves
differently.)

4. (Optional) Set up auto-push so every commit automatically publishes:

```bash
bash _automation/scripts/enable-auto-push.sh
```

### Previewing the site on your computer

From the `gking-site` folder, start the local preview server:

```bash
hugo server --buildFuture
```

Open your browser at http://localhost:1313/. Changes to files show up
instantly. Press Ctrl+C in Terminal to stop the server.

Notes: `--buildFuture` is required — future-dated talks disappear without
it. Site search is expected to be broken locally (the Pagefind index is
built only in CI).

### Making changes and publishing them

```bash
cd gking-site
git pull
```

Make your edits, then save your changes:

```bash
git add -A
git commit -m "describe what you changed here"
```

If you set up auto-push, the commit publishes automatically. Otherwise run
`git push`. The site rebuilds and goes live in ~3 minutes.

To see who changed a file and when:

```bash
git log --follow -- EditMe/Writings/Articles/CausalInference/2020s/your-paper/index.md
```

</details>

<details>
<summary><h2 id="architecture--principles">Architecture &amp; principles</h2></summary>

Key architectural rules distilled from building this site:

1. **Content is updated through Claude or direct GitHub edits.** Describe a
   change to Claude in plain English or edit Markdown files directly on
   GitHub.
2. **Content and presentation are fully separated.** Content is in
   `EditMe/**/*.md`; templates are in `layouts/`. A content change never
   affects a template.
3. **Deployment is automatic on push to `main`.** No manual build needed.
4. **The `EditMe/` umbrella scales.** One place to look for everything
   editable, one menu-driven sub-folder per concept. Within
   `EditMe/Writings/`, papers nest by `<Type>/<Topic>/<Decade>/<slug>/`.
5. **Mounts are transparent for content URLs.** A page's URL doesn't depend
   on where the file sits in the folder structure.
6. **Some folders must stay at the project root.** `layouts/`, `assets/`,
   `.github/`, `.githooks/` — see
   [`EditMe/UI/PINNED-AT-ROOT.md`](EditMe/UI/PINNED-AT-ROOT.md).
7. **Never write `/foo` literally** in templates if it needs to resolve
   under `baseURL`. Use `relURL` without a leading slash:
   `{{ "pagefind/pagefind.js" | relURL }}`.
8. **Preserve URLs.** External links (CVs, citations, search indexes) point
   at the original URLs. Silent URL changes become 404s.
9. **`hugo.yaml`'s `module.mounts` block is auto-generated** — never
   hand-edit it; run `generate_mounts.py` instead.
10. **Vendored theme in `_vendor/`.** Freezes the theme version so a deploy
    doesn't break if upstream changes. To customize a Blox partial, copy it
    from `_vendor/.../layouts/_partials/<path>` to
    `layouts/_partials/<path>` and edit the project copy.

</details>

<details>
<summary><h2 id="troubleshooting">Troubleshooting</h2></summary>

**"I committed and nothing changed on the site."**
Give it 3–4 minutes, then check
<https://github.com/iqss-research/gking-site/actions>. A red X means a
build error (usually a YAML front-matter typo).

**"`git commit` succeeded but didn't auto-push."**
The post-commit hook only pushes if the branch has an upstream. Run
`git push -u origin main` once. Check that
`git config core.hooksPath` prints `.githooks`.

**"A PDF returns 404 on the live site."**
Confirm the file is in `_site/static/files/` and the `url:` in the
page's `links:` starts with `files/` (no leading slash).

**"The 'See Also' box is empty or wrong."**
Add shared `tags:` or pin specific items with `related_papers`, etc.

**"Search finds nothing."**
The Pagefind index is rebuilt each deploy. Wait for Actions to finish
and hard-refresh.

**"I accidentally broke the site."**
From terminal: `git revert <sha>`. Or on github.com: click the commit →
**Revert**. After the build finishes, the site is restored.

</details>

<details>
<summary><h2 id="audit-reports">Audit reports</h2></summary>

Point-in-time audit reports, kept in `docs/audits/` for historical reference:

- [`docs/audits/SITE_AUDIT.md`](docs/audits/SITE_AUDIT.md) — April 2026 site
  audit (broken links, performance, UX recommendations).
- [`docs/audits/CV_VS_SITE.md`](docs/audits/CV_VS_SITE.md) — CV vs site
  reconciliation.
- [`docs/audits/CLASSIFY_REVIEW.md`](docs/audits/CLASSIFY_REVIEW.md) —
  post-auto-fix classification notes.

</details>
