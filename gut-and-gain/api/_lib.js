// Shared helpers for the serverless functions. Files starting with "_" are not
// exposed as routes by Vercel.

import { EVIDENCE, TRACKS, SOURCE_TYPES } from "../src/channels.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const API_BASE = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/+$/, "");

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

// ---- call Claude ------------------------------------------------------------
// Hardened for unattended runs:
//  - retries overloaded (529), rate-limit (429), timeout and 5xx errors with
//    exponential backoff, honoring the retry-after header
//  - a per-request timeout so one stuck call can't freeze a scheduled run
//  - safe handling of non-JSON error bodies
//  - follows pause_turn continuations from long web searches
//  - errors carry a `code` so the engine can explain failures in plain English

const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504, 529]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function classifyApiError(status, message = "") {
  const m = String(message).toLowerCase();
  if (status === 401 || status === 403) return "auth";
  if (m.includes("credit balance")) return "credit";
  if (m.includes("web search") && (m.includes("not enabled") || m.includes("disabled"))) return "web_search_disabled";
  if (status === 404 && m.includes("model")) return "model";
  if (status === 529 || m.includes("overloaded")) return "overloaded";
  if (status === 429) return "rate_limit";
  if (status === 408 || status === 504) return "timeout";
  if (status >= 500) return "server";
  return "bad_request";
}

async function postOnce(body, key, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${API_BASE}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const raw = await r.text();
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {
      /* non-JSON body (gateway page, etc.) */
    }
    return { status: r.status, ok: r.ok, data, raw, retryAfter: Number(r.headers.get("retry-after")) || 0 };
  } catch (err) {
    return { status: err.name === "AbortError" ? 408 : 503, ok: false, data: null, raw: err.message, retryAfter: 0, network: true };
  } finally {
    clearTimeout(timer);
  }
}

async function postWithRetry(body, key, { attempts = 5, timeoutMs } = {}) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    const res = await postOnce(body, key, timeoutMs);
    if (res.ok && res.data) return res.data;
    const message = res.data?.error?.message || (res.network ? `network error: ${res.raw}` : `HTTP ${res.status}`);
    const code = classifyApiError(res.status, message);
    last = Object.assign(new Error(message), { code, httpStatus: res.status });
    if (!RETRYABLE.has(res.status) || i === attempts) break;
    const wait = res.retryAfter ? res.retryAfter * 1000 : Math.min(60000, 2000 * 2 ** (i - 1)) + Math.random() * 1000;
    if (process.env.ENGINE_VERBOSE !== "0") console.log(`  … Anthropic ${code} (HTTP ${res.status}); retrying in ${Math.round(wait / 1000)}s (attempt ${i + 1}/${attempts})`);
    await sleep(wait);
  }
  last.status = last.code === "auth" ? 500 : 502; // status for the website's API routes
  throw last;
}

// Pasted secrets often carry stray spaces, line breaks or quotes; strip them.
export function readKey() {
  return String(process.env.ANTHROPIC_API_KEY || "").replace(/\s+/g, "").replace(/^["'`]+|["'`]+$/g, "");
}

// Describes the key's shape without revealing it (only the public prefix and length).
export function describeKey() {
  const raw = String(process.env.ANTHROPIC_API_KEY || "");
  const k = readKey();
  const notes = [];
  if (raw !== k) notes.push("had spaces, line breaks or quotes (removed automatically)");
  if (k.startsWith("sk-ant-api")) notes.push("looks like a normal API key (sk-ant-api…)");
  else if (k.startsWith("sk-ant-admin")) notes.push("is an ADMIN key (sk-ant-admin…), which can't send messages; create a regular API key instead");
  else if (k.startsWith("sk-ant-oat") || k.startsWith("sk-ant-ort")) notes.push("is a Claude subscription/Claude Code login token, not an API key; create an API key in the Claude Console");
  else if (k.startsWith("sk-")) notes.push("starts with sk- but not sk-ant-, so it's likely from another provider");
  else notes.push("doesn't start with sk-ant-, so it isn't an Anthropic API key (maybe the key's name or ID was pasted instead of the key itself)");
  notes.push(`length ${k.length} characters (a full key is usually about 108)`);
  return notes.join("; ");
}

export async function askClaude(prompt, { search = false, maxTokens = 4000, timeoutMs, attempts } = {}) {
  const key = readKey();
  if (!key) {
    throw Object.assign(new Error("ANTHROPIC_API_KEY is not set."), { status: 500, code: "missing_key" });
  }
  const perRequest = timeoutMs || Number(process.env.ANTHROPIC_TIMEOUT_MS) || (search ? 240000 : 120000);
  const tries = attempts || Number(process.env.ANTHROPIC_ATTEMPTS) || 5;

  const messages = [{ role: "user", content: prompt }];
  let data;
  for (let turn = 0; turn < 5; turn++) {
    data = await postWithRetry(
      {
        model: MODEL,
        max_tokens: maxTokens,
        messages,
        ...(search ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }] } : {}),
      },
      key,
      { attempts: tries, timeoutMs: perRequest }
    );
    if (data.stop_reason !== "pause_turn") break;
    // Long searches can pause; hand the partial turn back unchanged so Claude continues.
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
  return {
    text: use.map((b) => b.text).join(""),
    truncated: data.stop_reason === "max_tokens",
    searches: data.usage?.server_tool_use?.web_search_requests || 0,
  };
}

export function extractJSON(text, open = "{", close = "}") {
  // Models sometimes write a sentence before the JSON, and that sentence can
  // contain braces. Try each opening bracket in turn until one parses.
  const clean = String(text || "").replace(/```(?:json)?/g, "");
  const end = clean.lastIndexOf(close);
  let lastErr = new Error("No JSON found in model output");
  for (let s = clean.indexOf(open); s !== -1 && s < end; s = clean.indexOf(open, s + 1)) {
    try {
      return JSON.parse(clean.slice(s, end + 1));
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
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
    published: /^\d{4}-\d{2}(-\d{2})?$/.test(String(s?.published || "").trim()) ? String(s.published).trim() : "",
    url: /^https:\/\//.test(url) ? url : "",
  };
}
