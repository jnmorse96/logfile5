// Shared scan instructions, used by the live-scan endpoint (api/briefing.js)
// and the daily engine (engine/run.mjs), so both follow exactly the same rules.

export const SPECIFIC = {
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

/**
 * Build a scan prompt from whitelisted config values only.
 * @param {object} o
 * @param {object} o.channel   entry from CHANNELS
 * @param {Array}  o.focus     category objects from channel.categories
 * @param {object} o.region    entry from REGIONS
 * @param {object} o.lang      entry from LANGUAGES
 * @param {number} [o.max=6]   maximum stories to return
 * @param {string[]} [o.exclude] titles already covered recently (to avoid repeats)
 * @param {string} [o.today]   YYYY-MM-DD
 * @param {string} [o.extra]   extra beat-specific instructions
 */
export function buildBriefingPrompt({ channel, focus, region, lang, max = 6, exclude = [], today, extra = "" }) {
  const day = today || new Date().toISOString().slice(0, 10);
  const focusText = (focus && focus.length ? focus : channel.categories)
    .map((c) => `${c.label} (${c.hint})`)
    .join("; ");
  const excludeText = exclude.length
    ? `\nAlready covered recently, so do NOT return these again (find different developments):\n${exclude
        .slice(0, 40)
        .map((t) => `- ${t}`)
        .join("\n")}\n`
    : "";

  return `You are a careful health-science news analyst. Today is ${day}. Search the web for the most recent developments. Prioritize the last 60 days and never include anything published more than 12 months ago.

${SPECIFIC[channel.id]}

Focus areas: ${focusText}.

${region.search}
${extra ? `\n${extra}\n` : ""}${excludeText}
Rules:
- Only report things you actually found in search results. Never invent studies, numbers or URLs.
- Every story must include the URL of the page you found it on and its real publication or presentation date.
- sourceType "Company" means the information comes from the company that makes the product (press release or company-run analysis), even if presented at a conference.
- Prefer independent sources (journals, medical societies, medical news) over press releases. Use at most 2 stories involving any one company.
- If you find fewer genuinely recent items than asked, return fewer rather than padding with old ones.
- Sources in other languages are welcome; summarize them in the output language.
- Evidence: "strong" = human RCTs, meta-analyses or regulatory approvals; "emerging" = small, open-label, real-world or observational human data; "early" = animal, cell or single-arm pilot data.

Write all text values in ${lang.label}. Respond with ONLY this JSON, no markdown, no commentary:
{"stories":[{"title":"","summary":"2-3 plain-language sentences with key numbers","tag":"",${channel.id === "reality" ? '"track":"Nightlife|Gym|Meds|Access",' : ""}${channel.id !== "gainer" ? '"condition":"Crohn\'s|UC|IBD",' : ""}"region":"country or region","originalLanguage":"","evidence":"strong|emerging|early","whyItMatters":"1-2 sentences","source":"journal, regulator, conference or outlet","sourceType":"Journal|Conference|Regulator|Patient group|Company|News","date":"human-readable, e.g. October 2026","published":"YYYY-MM-DD (or YYYY-MM if the day is unknown)","url":"https://..."}]}

Return up to ${max} stories, newest first${region.id === "worldwide" ? ", from more than one country or region where possible" : ""}.`;
}
