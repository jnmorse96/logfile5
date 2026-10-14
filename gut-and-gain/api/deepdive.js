// GET /api/deepdive?title=...&tag=...&source=...&lang=en&channel=crohns
// A GET so identical deep dives are shared through the CDN cache too.

import { LANGUAGES, CHANNELS } from "../src/channels.js";
import { askClaude, rateLimited, sendError } from "./_lib.js";

const clip = (v, n) => String(v || "").slice(0, n);

export default async function handler(req, res) {
  if (req.method !== "GET") return sendError(res, 405, "Use GET");
  const q = req.query || {};
  const lang = LANGUAGES.find((l) => l.code === q.lang);
  const channel = CHANNELS[q.channel];
  const title = clip(q.title, 200);
  if (!lang || !channel || !title) return sendError(res, 400, "Missing title, language or channel");
  if (rateLimited(req, 10)) return sendError(res, 429, "Too many requests. Try again in a minute.");

  const angle = {
    ibd: "what someone living with Crohn's or ulcerative colitis might want to ask their gastroenterologist or surgeon about it (no individual medical advice)",
    reality: "how worried someone with IBD should realistically be, and practical steps that reduce the risk (no dosing for recreational substances, no individual medical advice)",
    gainer: "how a hard gainer trying to add weight and muscle could apply it, and who should be cautious",
    trials: "what the trial tested and found, its limitations, and what someone with Crohn's or colitis might ask their gastroenterologist about it (no individual medical advice)",
  }[channel.id];

  try {
    const { text } = await askClaude(
      `Search the web, then write a deeper analysis of this development:
"${title}" (topic: ${clip(q.tag, 60)}; source: ${clip(q.source, 160)}).

About 170 words of plain prose in ${lang.label}: what was actually found (with numbers), study design and limitations (size, blinding, funding), how it fits prior evidence, and ${angle}. Only state what your search results support. No headings, bullets or markdown.`,
      { search: true, maxTokens: 3000 }
    );
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
    return res.status(200).json({ text: text.trim() });
  } catch (err) {
    console.error("deepdive error:", err);
    return sendError(res, err.status || 502, err.message || "Deep dive failed");
  }
}
