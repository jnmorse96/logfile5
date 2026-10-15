// POST /api/translate  body: { lang: "pt", stories: [...] }
// Translates title, summary and whyItMatters. Everything else is passed through
// untouched so compound names, sources, dates and links never get mangled.

import { LANGUAGES } from "../src/channels.js";
import { askClaude, extractJSON, cleanStory, rateLimited, sendError } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendError(res, 405, "Use POST");

  const { lang, stories } = req.body || {};
  const target = LANGUAGES.find((l) => l.code === lang);
  if (!target || !Array.isArray(stories) || !stories.length || stories.length > 8) {
    return sendError(res, 400, "Send a supported language and 1-8 stories");
  }
  if (rateLimited(req, 10)) return sendError(res, 429, "Too many requests. Try again in a minute.");

  const input = stories.map(cleanStory);
  const slim = input.map((s, i) => ({ i, title: s.title, summary: s.summary, whyItMatters: s.whyItMatters }));

  try {
    const { text } = await askClaude(
      `Translate into natural, fluent ${target.label}. Keep drug, compound, trial and gene names as they are. Return ONLY a JSON array with the same objects and "i" values, translating title, summary and whyItMatters. No markdown.\n\n${JSON.stringify(slim)}`,
      { maxTokens: 5000, attempts: 2, timeoutMs: 60000 }
    );
    const out = extractJSON(text, "[", "]");
    const translated = input.map((s, i) => {
      const t = out.find((o) => o.i === i) || {};
      return cleanStory({
        ...s,
        title: t.title || s.title,
        summary: t.summary || s.summary,
        whyItMatters: t.whyItMatters || s.whyItMatters,
      });
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ stories: translated });
  } catch (err) {
    console.error("translate error:", err);
    return sendError(res, err.status || 502, err.message || "Translation failed");
  }
}
