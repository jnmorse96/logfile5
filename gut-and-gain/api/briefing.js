// GET /api/briefing?channel=crohns&region=worldwide&lang=en&focus=treatments,surgery&d=2026-10-13
//
// Builds the prompt on the server from whitelisted options only, runs a live
// web-search scan, and returns JSON. The response is cached on Vercel's CDN for
// the day (keyed by the full URL, including the `d` date param), so every
// visitor asking for the same briefing shares ONE scan.

import { CHANNELS, REGIONS, LANGUAGES } from "../src/channels.js";
import { askClaude, extractJSON, cleanStory, rateLimited, sendError } from "./_lib.js";

const SPECIFIC = {
  reality: `Topic: the unwelcome but true news people with Crohn's disease or ulcerative colitis should brace for, especially those who go out at night or train in the gym.
Look for: evidence on alcohol, smoking, vaping and heated tobacco, cannabis, sleep loss, dehydration (especially with an ostomy), and interactions between IBD medicines and recreational substances; gym-related risks (steroid myopathy, SARMs and anabolic products, contaminated or emulsifier-heavy supplements, hernia risk with a stoma, fatigue, anemia); new drug safety warnings or label changes; shortages, insurance or price changes; and failed trials or disappointing long-term results.
Also look for practical tips from European patient organizations, hospitals and public-health bodies (for example Crohn & Colitis NL, Maag Lever Darm Stichting, Crohn's & Colitis UK, DCCV in Germany, ECCO, the Trimbos Institute).
Be candid but not alarmist, and give the real numbers. Never give dosing for recreational substances; harm-reduction and interaction information is fine.
"whyItMatters" = "What you can do": 1-2 sentences of practical, non-prescriptive action, such as what to ask the care team.
"tag" = short topic label, e.g. "Alcohol", "Vaping", "SARMs".
"track" = one of "Nightlife", "Gym", "Meds", "Access".
"condition" = "Crohn's", "UC" or "IBD".`,
  ibd: `Topic: INFLAMMATORY BOWEL DISEASE: Crohn's disease and ulcerative colitis.
Prioritize: drug approvals and phase 2/3 results, surgical techniques, guideline updates (ECCO, AGA, ACG, BSG), monitoring (calprotectin, intestinal ultrasound), diet and nutrition trials, cell therapies, microbiome and genetics research, and quality-of-life studies. Major conference presentations (DDW, ECCO, UEG Week, ACG) count. Report setbacks too: failed or stopped trials, safety warnings and withdrawals, not only good news.
"whyItMatters" = practical relevance for someone living with IBD, without giving individual medical advice.
"tag" = short topic label, e.g. "IL-23 biologic", "Kono-S surgery", "CDED diet".
"condition" = "Crohn's", "UC" or "IBD" (both or general).`,
  gainer: `Topic: gaining body weight and lean muscle mass for "hard gainers": people who are naturally thin, underweight, or struggle to gain, including people with GI conditions such as IBD.
Prioritize: human trials and meta-analyses on energy surplus, appetite, protein, resistance training, creatine and other evidence-backed supplements, sleep and recovery, and weight/muscle gain or sarcopenia in IBD. Include null results and safety warnings (contaminated supplements, SARMs, stimulant-heavy products). Note industry funding when the source mentions it. Skip influencer content and product listicles.
"whyItMatters" = the practical takeaway for a hard gainer.
"tag" = short topic label, e.g. "Creatine", "Protein", "Energy surplus", "IBD & muscle".`,
};

export default async function handler(req, res) {
  if (req.method !== "GET") return sendError(res, 405, "Use GET");

  const q = req.query || {};
  const channel = CHANNELS[q.channel];
  const region = REGIONS.find((r) => r.id === q.region);
  const lang = LANGUAGES.find((l) => l.code === q.lang);
  if (!channel || !region || !lang) return sendError(res, 400, "Unknown channel, region or language");

  const focusIds = String(q.focus || "").split(",").filter(Boolean);
  const focus = channel.categories.filter((c) => focusIds.includes(c.id));
  const focusText = (focus.length ? focus : channel.categories)
    .map((c) => `${c.label} (${c.hint})`)
    .join("; ");

  if (rateLimited(req, 6)) return sendError(res, 429, "Too many scans from your connection. Try again in a minute.");

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `You are a careful health-science news analyst. Today is ${today}. Search the web for the most recent developments. Prioritize the last 60 days and never include anything published more than 12 months ago.

${SPECIFIC[channel.id]}

Focus areas: ${focusText}.

${region.search}

Rules:
- Only report things you actually found in search results. Never invent studies, numbers or URLs.
- Every story must include the URL of the page you found it on and its real publication or presentation date.
- sourceType "Company" means the information comes from the company that makes the product (press release or company-run analysis), even if presented at a conference.
- Prefer independent sources (journals, medical societies, medical news) over press releases. Use at most 2 stories involving any one company.
- If you find fewer than 5 genuinely recent items, return fewer rather than padding with old ones.
- Sources in other languages are welcome; summarize them in the output language.
- Evidence: "strong" = human RCTs, meta-analyses or regulatory approvals; "emerging" = small, open-label, real-world or observational human data; "early" = animal, cell or single-arm pilot data.

Write all text values in ${lang.label}. Respond with ONLY this JSON, no markdown, no commentary:
{"stories":[{"title":"","summary":"2-3 plain-language sentences with key numbers","tag":"",${channel.id === "reality" ? '"track":"Nightlife|Gym|Meds|Access",' : ""}${channel.id !== "gainer" ? '"condition":"Crohn\'s|UC|IBD",' : ""}"region":"country or region","originalLanguage":"","evidence":"strong|emerging|early","whyItMatters":"1-2 sentences","source":"journal, regulator, conference or outlet","sourceType":"Journal|Conference|Regulator|Patient group|Company|News","date":"e.g. October 2026","url":"https://..."}]}

Return up to 6 stories, newest first${region.id === "worldwide" ? " from at least 3 different countries or regions" : ""}.`;

  try {
    const { text } = await askClaude(prompt, { search: true, maxTokens: 6000 });
    const parsed = extractJSON(text);
    const stories = (parsed.stories || []).map(cleanStory).filter((s) => s.title && s.summary);
    if (!stories.length) return sendError(res, 502, "The scan didn't find any usable recent stories. Try different focus areas.");

    // Shared CDN cache: 12h fresh, then serve stale for up to a day while refreshing.
    res.setHeader("Cache-Control", "public, s-maxage=43200, stale-while-revalidate=86400");
    return res.status(200).json({ stories, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("briefing error:", err);
    return sendError(res, err.status || 502, err.message || "Scan failed");
  }
}
