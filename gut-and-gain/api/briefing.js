// GET /api/briefing?channel=ibd&region=worldwide&lang=en&focus=treatments,surgery&d=2026-10-13
//
// On-demand live scan. Builds the prompt on the server from whitelisted options
// only (see api/_prompts.js), runs a web-search scan, and returns JSON. The
// response is cached on Vercel's CDN for the day (keyed by the full URL,
// including the `d` date param), so visitors asking for the same scan share one.
// The scheduled daily edition is produced separately by engine/run.mjs.

import { CHANNELS, REGIONS, LANGUAGES } from "../src/channels.js";
import { askClaude, extractJSON, cleanStory, rateLimited, sendError } from "./_lib.js";
import { buildBriefingPrompt } from "./_prompts.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendError(res, 405, "Use GET");

  const q = req.query || {};
  const channel = CHANNELS[q.channel];
  const region = REGIONS.find((r) => r.id === q.region);
  const lang = LANGUAGES.find((l) => l.code === q.lang);
  if (!channel || !region || !lang) return sendError(res, 400, "Unknown channel, region or language");
  if (channel.isTrials) return sendError(res, 400, "The Trial Tracker is updated by the scheduled engine, not by live scans.");

  const focusIds = String(q.focus || "").split(",").filter(Boolean);
  const focus = channel.categories.filter((c) => focusIds.includes(c.id));

  if (rateLimited(req, 6)) return sendError(res, 429, "Too many scans from your connection. Try again in a minute.");

  const prompt = buildBriefingPrompt({ channel, focus, region, lang, max: 6 });

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
