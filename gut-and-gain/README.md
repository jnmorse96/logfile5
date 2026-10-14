# Gut & Gain

Three channels, rated by strength of evidence and readable in 10 languages:

- **Reality Check** (front page): the unwelcome but true things people with Crohn's and colitis should brace for, around nightlife (alcohol, vaping, cannabis, sleep, dehydration with an ostomy, painkillers) and the gym (emulsifiers in shakes, SARMs, steroids, muscle loss, stoma hernias, iron). Each card pairs the evidence with "What you can do", and filters split it by Nightlife, Gym and Meds. A **Field guide** adds practical tips from Dutch, Belgian, German, UK and European IBD care: toilet apps and keys, Dutch hospital rules on alcohol with thiopurines and methotrexate, Dutch drug-checking, festival kits, and Maastricht University muscle research.
- **IBD Watch**: Crohn's disease and ulcerative colitis news worldwide: new drugs and trials, surgery, monitoring, diet, cell therapies and quality of life. Each story is tagged Crohn's, UC or IBD.
- **Hard Gainer**: an evidence-graded playbook for gaining weight and lean muscle, plus the latest research, including gaining with IBD.

To rename the site, change `SITE_NAME` in `src/channels.js` and the `<title>` in `index.html`.

The site opens with a **saved briefing** of real, linked studies (in `src/seedData.js`), so it works with no setup. Once it's deployed with an Anthropic API key, **Run a live scan** searches the web for new developments, and **translation** and **deep dives** turn on.

## Design

Built like a news product, borrowing information-design ideas from Ground News:

- **Evidence bar** (sidebar): the share of the briefing resting on strong, emerging or early evidence. Click a segment to filter. It's the equivalent of Ground News' coverage bar.
- **Industry source flag**: stories that come from the company that makes the product, with a switch to hide them. It's the equivalent of Ground News' Blindspot flag.
- **Daily briefing bar** with story count, source count and reading time; a larger **lead story**; then a scannable feed.
- Every story card shows its section, condition, region, date, an evidence meter, the source type (Journal, Conference, Regulator, Patient group, Company) and the source name.
- Light and dark themes (auto, or toggle in the header), sticky header with the language picker, and a compact layout on phones.
- Typefaces are bundled with the site (Schibsted Grotesk, Public Sans, IBM Plex Mono), so nothing loads from Google.
- **3D background** (`src/VilliBackground.jsx`, `src/villiScene.js`): a field of intestinal villi, the folds that line the gut and absorb nutrients, built with three.js. The villi sway, and scrolling moves the camera along the lining. It takes its colors from the page, so it follows light and dark mode and each section's accent, and fades into fog behind the headlines. It loads after the news (123 KB, gzipped), pauses when the tab is hidden, uses fewer villi on phones, shows a still frame for people who have reduced motion turned on, and falls back to the plain background if WebGL isn't available. To make it stronger or fainter, change `--bg-strength` in `src/styles.css`.

## Freshness rules for live scans

Live scans only include items published in the last 12 months, report setbacks and safety warnings as well as good news, never give dosing for recreational substances, prefer journals and medical societies over press releases, cap any single company at 2 stories, and return fewer stories rather than padding with old ones.

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
npm run dev          # front end only: saved briefings work, live scans show the setup note
```

For live scans locally:

```bash
npm i -g vercel
cp .env.example .env.local   # paste your key in
vercel dev
```

## How cost is kept down

- **Shared daily cache.** `/api/briefing` is a GET request whose URL includes the channel, region, language, focus areas and today's date. Vercel's CDN caches the response for 12 hours, so everyone who asks for the same briefing that day shares one scan. Deep dives are cached the same way.
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
| `api/briefing.js` | Live scan (cached GET) |
| `api/translate.js` | Translates a briefing |
| `api/deepdive.js` | Deeper analysis of one story (cached GET) |
| `api/_lib.js` | Calls Claude, handles paused searches, cleans and validates output |

To change the model, set `ANTHROPIC_MODEL` in Vercel's environment variables.

## Disclaimer

Informational only, not medical advice. Make IBD treatment decisions with your gastroenterologist, and check diet or supplement changes with your care team if you have a medical condition.
