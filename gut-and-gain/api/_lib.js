// Shared helpers for the serverless functions. Files starting with "_" are not
// exposed as routes by Vercel.

import { EVIDENCE, TRACKS, SOURCE_TYPES } from "../src/channels.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

// ---- best-effort per-instance rate limit (use Upstash/WAF for real limits) --
const hits = new Map();
export function rateLimited(req, max = 8, windowMs = 60_000) {
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const e = hits.get(ip) || { n: 0, t: now };
  if (now - e.t > windowMs) { e.n = 0; e.t = now; }
  e.n += 1;
  hits.set(ip, e);
  return e.n > max;
}

export function sendError(res, status, message) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json({ error: message });
}

// ---- call Claude, following pause_turn continuations from server tools ------
export async function askClaude(prompt, { search = false, maxTokens = 4000 } = {}) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const err = new Error("The server is missing its ANTHROPIC_API_KEY environment variable.");
    err.status = 500;
    throw err;
  }

  const messages = [{ role: "user", content: prompt }];
  let data;
  for (let turn = 0; turn < 4; turn++) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        messages,
        ...(search
          ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }] }
          : {}),
      }),
    });
    data = await r.json();
    if (!r.ok) {
      const err = new Error(data?.error?.message || `Anthropic API error (${r.status})`);
      err.status = r.status === 401 ? 500 : 502;
      throw err;
    }
    if (data.stop_reason !== "pause_turn") break;
    // Long searches can pause; hand the partial turn back so Claude continues.
    messages.push({ role: "assistant", content: data.content });
  }

  // Use only the text written after the last search result. Earlier text is
  // usually "Let me search for..." chatter that breaks JSON parsing.
  const blocks = data.content || [];
  let lastTool = -1;
  blocks.forEach((b, i) => {
    if (b.type === "server_tool_use" || b.type === "web_search_tool_result") lastTool = i;
  });
  const tail = blocks.slice(lastTool + 1).filter((b) => b.type === "text");
  const use = tail.length ? tail : blocks.filter((b) => b.type === "text");
  return { text: use.map((b) => b.text).join(""), truncated: data.stop_reason === "max_tokens" };
}

export function extractJSON(text, open = "{", close = "}") {
  const clean = text.replace(/```(?:json)?/g, "");
  const s = clean.indexOf(open);
  const e = clean.lastIndexOf(close);
  if (s === -1 || e <= s) throw new Error("No JSON found in model output");
  return JSON.parse(clean.slice(s, e + 1));
}

// ---- validate and clamp a story so nothing odd reaches the page -------------
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export function cleanStory(s) {
  const url = str(s?.url, 500);
  return {
    title: str(s?.title, 200),
    summary: str(s?.summary, 900),
    tag: str(s?.tag, 60),
    condition: ["Crohn's", "UC", "IBD"].includes(s?.condition) ? s.condition : "",
    track: TRACKS.includes(s?.track) ? s.track : "",
    region: str(s?.region, 60),
    originalLanguage: str(s?.originalLanguage, 40),
    evidence: EVIDENCE.includes(s?.evidence) ? s.evidence : "emerging",
    whyItMatters: str(s?.whyItMatters, 500),
    source: str(s?.source, 160),
    sourceType: SOURCE_TYPES.includes(s?.sourceType) ? s.sourceType : "News",
    date: str(s?.date, 40),
    url: /^https:\/\//.test(url) ? url : "",
  };
}
