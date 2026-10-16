# Gut & Gain

Four sections, rated by strength of evidence and readable in 10 languages:

- **Reality Check** (front page): the unwelcome but true things people with Crohn's and colitis should brace for, around nightlife (alcohol, vaping, cannabis, sleep, dehydration with an ostomy, painkillers) and the gym (emulsifiers in shakes, SARMs, steroids, muscle loss, stoma hernias, iron). Each card pairs the evidence with "What you can do", and filters split it by Nightlife, Gym and Meds. A **Field guide** adds practical tips from Dutch, Belgian, German, UK and European IBD care: toilet apps and keys, Dutch hospital rules on alcohol with thiopurines and methotrexate, Dutch drug-checking, festival kits, and Maastricht University muscle research.
- **IBD Watch**: Crohn's disease and ulcerative colitis news worldwide: new drugs and trials, surgery, monitoring, diet, cell therapies and quality of life. Each story is tagged Crohn's, UC or IBD.
- **Trial Tracker**: new Crohn's and colitis clinical trials registered around the world (ClinicalTrials.gov) and newly published trial results (PubMed), sorted into new medications, symptom management, and care and monitoring, with filters for phase, status and condition.
- **Hard Gainer**: an evidence-graded playbook for gaining weight and lean muscle, plus the latest research, including gaining with IBD.

To rename the site, change `SITE_NAME` in `src/channels.js` and the `<title>` in `index.html`.

The site opens with a **saved briefing** of real, linked studies (in `src/seedData.js`), so it works with no setup. New stories come only from the daily news engine; there are no on-demand scans, so visitors can't run up API costs. With an Anthropic API key in Vercel, **translation** and **deep dives** turn on.

## News engine (once a day)

Once a day the engine adds new stories from around the world to every section and refreshes the Trial Tracker. The site loads the latest feed first, falls back to the saved briefing if the engine hasn't run yet, and lets readers browse earlier days with the edition picker.

**What each run does** (`engine/run.mjs`):

1. **Gather, rotating around the world.** Each section runs focused searches ("beats"), defined in `engine/beats.js`. On every run, each beat searches a different region: worldwide, Europe, Asia-Pacific, North America, the Netherlands and Belgium, and Latin America. Within six days, every topic has been searched in every region. IBD Watch includes a dedicated **"New trials & symptom management"** beat (urgency, pain, fatigue, perianal disease, joint and skin symptoms, sleep, mental health), covering drugs as well as devices, diet, exercise and psychological programs.
2. **Clean.** Drops stories with missing fields or no link, anything published more than 12 months ago, and impossible future dates.
3. **Dedupe.** Removes repeats within the run and anything already published in the last 30 days (matching cleaned-up links and near-identical titles).
4. **Verify.** Checks every source link and drops clear 404s. Paywalls and bot-blocks are kept.
5. **Rank.** Scores freshness, evidence strength and independence; takes stories round-robin across beats; allows at most 2 stories per company, counting stories already in the feed.
6. **Add to the rolling feed.** New stories go on top (up to 8 per section per run). The feed holds up to 14 stories; anything older than 7 days rolls off. Stories first seen in the last 24 hours get a **New** badge and an "added 3 h ago" note.
7. **Trial Tracker** (`engine/trials.mjs`), from official sources rather than web search:
   - **ClinicalTrials.gov registry:** interventional Crohn's, ulcerative colitis and IBD trials registered in the last 45 days, plus trials whose results were posted in the last 90 days, with sites in any country. Each trial is labeled **New medication**, **Symptom management** or **Care & monitoring**. The tracker shows phase, status, size, main measure, sponsor (industry flagged), countries, and a link to the registry entry. Trials that change status or post results come back to the top with an **Updated** or **Results posted** badge.
   - **PubMed:** newly indexed randomized trials, phase 2/3 trials and meta-analyses on Crohn's and colitis from journals worldwide, shown under **Published results**.
   - Claude rewrites the registry text and abstracts into plain language, without web search, using only the source text. If that step fails, the official text is shown instead.
8. **Publish.** Writes `public/data/latest.json`, `public/data/archive/<date>.json` and `public/data/index.json`. Optionally pre-translates (`ENGINE_LANGUAGES`).

**Safety nets:** a section never publishes empty (it keeps its last stories); if every source fails, nothing is written and the run is marked failed so GitHub emails you; a run with nothing new keeps the current feed.

**Reliability:** every run starts with a preflight check (API key, credit, web search access, ClinicalTrials.gov and PubMed). Setup problems stop the run in seconds with a plain-English fix. Anthropic "overloaded" and rate-limit errors are retried with backoff; each request has a timeout; if Claude answers in prose instead of the expected format, the engine asks it to convert its own answer rather than losing the search. Each run writes `public/data/status.json`, which the site's footer shows ("News last updated … · next check …", or a warning if the latest run needs attention), and a summary table on the GitHub run page.

**Schedule** (`.github/workflows/news-engine.yml` at the top of the repository, outside this folder): once a day, at 10:17 UTC (6:17 a.m. New York in summer, 5:17 a.m. in winter). It commits the update and Vercel redeploys automatically. Set it up once:

1. Push the project to GitHub (the same repo Vercel deploys).
2. In the repo: **Settings → Secrets and variables → Actions**
   - **Secret** `ANTHROPIC_API_KEY` (required)
   - Optional: **secret** `NCBI_API_KEY` and **variable** `NCBI_EMAIL` (PubMed rate limits), **variables** `ENGINE_LANGUAGES` (for example `es,nl,pt`) and `ANTHROPIC_MODEL`
3. Open the **Actions** tab, choose **News engine**, and click **Run workflow** to publish the first update now.

To change the timing, edit the `cron` line (UTC) and `runHours` in `engine/beats.js`.

**Cost:** 10 web-search scans per run, once a day, plus 1–2 cheap plain-language calls for the Trial Tracker. Roughly $0.50–1.50 a day depending on the model. ClinicalTrials.gov and PubMed are free. Set a monthly limit in the Anthropic Console.

**Run it yourself:**

```bash
npm run engine         # real run (needs ANTHROPIC_API_KEY), writes public/data
npm run engine:doctor  # preflight checks only: key, credit, web search, trial sources
npm run engine:test    # mock run: no API calls, prints the result instead of writing it
```

These work on Windows, macOS and Linux. Options (as flags): `--channels=trials` runs one section; `--dry-run` prints without writing; `--skip-links` skips link checks.

### Troubleshooting

- **The Actions tab shows no "News engine" workflow.** The workflow file must be at `.github/workflows/news-engine.yml` at the top of the repository. Uploading through GitHub's website can silently skip folders whose names start with a dot (`.github`). Upload it with GitHub Desktop or git, or create the file in the browser via **Add file → Create new file** and paste its contents.
- **A run is red.** Open the run and read the **Summary**: it names the problem and the fix (missing or invalid key, no credit, web search turned off).
- **Runs are green but the site doesn't change.** Check that Vercel is connected to this repository (Vercel → Project → Settings → Git) with **Root Directory** set to `gut-and-gain`.

**Rolling back a bad update:** revert the "News update" commit on GitHub, and Vercel redeploys the previous one.

## Design

Built like a news product, borrowing information-design ideas from Ground News:

- **Evidence bar** (sidebar): the share of the briefing resting on strong, emerging or early evidence. Click a segment to filter. It's the equivalent of Ground News' coverage bar.
- **Industry source flag**: stories that come from the company that makes the product, with a switch to hide them. It's the equivalent of Ground News' Blindspot flag.
- **Daily briefing bar** with story count, source count and reading time; a larger **lead story**; then a scannable feed.
- Every story card shows its section, condition, region, date, an evidence meter, the source type (Journal, Conference, Regulator, Patient group, Company) and the source name.
- Light and dark themes (auto, or toggle in the header), sticky header with the language picker, and a compact layout on phones.
- Typefaces are bundled with the site (Schibsted Grotesk, Public Sans, IBM Plex Mono), so nothing loads from Google.
- **3D background** (`src/VilliBackground.jsx`, `src/villiScene.js`): a field of intestinal villi, the folds that line the gut and absorb nutrients, built with three.js. The villi sway, and scrolling moves the camera along the lining. It takes its colors from the page, so it follows light and dark mode and each section's accent, and fades into fog behind the headlines. It loads after the news (123 KB, gzipped), pauses when the tab is hidden, uses fewer villi on phones, shows a still frame for people who have reduced motion turned on, and falls back to the plain background if WebGL isn't available. To make it stronger or fainter, change `--bg-strength` in `src/styles.css`.

## Freshness rules for the engine

The engine only includes items published in the last 12 months, report setbacks and safety warnings as well as good news, never give dosing for recreational substances, prefer journals and medical societies over press releases, cap any single company at 2 stories, and return fewer stories rather than padding with old ones.

## Why it said "can't assemble briefing" before

The page asked a backend (`/api/...`) for every briefing. That backend only exists on Vercel with an API key set, so anywhere else every request failed. Now:

- the saved briefing always shows, whether or not the backend is there
- without a backend, the page shows a short note instead of an error
- with a backend, real errors are shown plainly (for example, a missing API key)

## Deploy (about 10 minutes)

1. **Get an API key** at https://console.anthropic.com → API Keys. Set a monthly spend limit while you're there.
2. **Push this folder to GitHub** (a new private repo is fine).
3. **Import it in Vercel**: vercel.com → Add New → Project → pick the repo. It auto-detects Vite and turns `api/` into serverless functions. No settings to change.
4. **Add the key**: Project → Settings → Environment Variables → `ANTHROPIC_API_KEY` = your key, for Production and Preview. Then redeploy (Deployments → ⋯ → Redeploy).
5. **Custom domain (optional)**: Settings → Domains → add your domain, then create the DNS records Vercel shows you at your registrar (normally an `A` record to `76.76.21.21` for the root and a `CNAME` for `www` to `cname.vercel-dns.com`).

## Run locally

```bash
npm install
npm run dev          # front end only: saved briefings work; translation and deep dives show the setup note
```

For translation and deep dives locally:

```bash
npm i -g vercel
cp .env.example .env.local   # paste your key in
vercel dev
```

## How cost is kept down

- **Engine-only news.** There is no on-demand scan endpoint; all web searching happens in the once-a-day engine.
- **No open prompt proxy.** The server builds every prompt itself from whitelisted options in `src/channels.js`. Visitors can't send arbitrary prompts on your key.
- **Rate limit.** A simple per-IP limit runs in each function instance. For a big public launch, add Vercel WAF rate limiting or Upstash Redis.
- **Searches capped** at 6 per scan.

Rough cost: a few cents per uncached scan with web search. Cached repeats are free.

## Files

| Path | What it does |
| --- | --- |
| `src/App.jsx` | The page |
| `src/channels.js` | Channels, focus areas, regions, languages (shared with the server) |
| `src/seedData.js` | The saved briefings (real studies with source links), the hard gainer playbook and the Reality Check field guide. Update whenever you like |
| `src/i18n.js` | Interface labels in 10 languages |
| `api/translate.js` | Translates a briefing |
| `api/deepdive.js` | Deeper analysis of one story (cached GET) |
| `api/_lib.js` | Calls Claude, handles paused searches, cleans and validates output |
| `api/_prompts.js` | Scan instructions used by the daily engine |
| `engine/run.mjs` | The news engine (runs once a day) |
| `engine/beats.js` | What the engine searches for, region rotation, and feed settings |
| `engine/trials.mjs` | Trial Tracker: ClinicalTrials.gov and PubMed |
| `src/Trials.jsx` | Trial Tracker list and filters |
| `engine/lib.mjs` | Dedupe, link checks and ranking |
| `engine/mock.mjs` | Canned responses for testing without API calls |
| `.github/workflows/daily-engine.yml` | Runs the engine once a day |
| `public/data/` | Published feed and archive (written by the engine) |

To change the model, set `ANTHROPIC_MODEL` in Vercel's environment variables.

## Disclaimer

Informational only, not medical advice. Make IBD treatment decisions with your gastroenterologist, and check diet or supplement changes with your care team if you have a medical condition.
