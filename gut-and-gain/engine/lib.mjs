// Pure helpers for the daily engine: URL canonicalization, duplicate
// detection, date checks, link checking and ranking.

import { createHash } from "node:crypto";

const TRACKING = /^(utm_|fbclid|gclid|mc_|ref$|ref_|cmpid|sc_|icid|ito$)/i;

export function canonicalUrl(raw) {
  try {
    const u = new URL(raw);
    u.hash = "";
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
    let path = u.pathname.replace(/\/+$/, "");
    // NCBI serves the same PMC article under two hosts
    if (u.hostname === "ncbi.nlm.nih.gov" && path.startsWith("/pmc/articles/")) {
      u.hostname = "pmc.ncbi.nlm.nih.gov";
      path = path.replace("/pmc/articles/", "/articles/");
    }
    const q = u.searchParams.toString();
    return `${u.hostname}${path}${q ? `?${q}` : ""}`;
  } catch {
    return String(raw || "").trim().toLowerCase();
  }
}

const STOP = new Set(
  "a an the and or of in on for to with by at from as is are was were be after over under new study trial shows show finds find may could than into its their your you vs versus".split(" ")
);
export function titleTokens(t) {
  return new Set(
    String(t || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  );
}
export function similarity(a, b) {
  const A = titleTokens(a);
  const B = titleTokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

export function storyId(s) {
  return createHash("sha1").update(s.url ? canonicalUrl(s.url) : s.title).digest("hex").slice(0, 12);
}

/**
 * Same story if: same canonical URL, or near-identical titles (>= 0.75), or
 * clearly overlapping titles (>= 0.55) from the same source.
 */
export function isDuplicate(story, pool) {
  const cu = story.url ? canonicalUrl(story.url) : "";
  const src = String(story.source || "").toLowerCase();
  return (
    pool.find((p) => {
      if (cu && p.url && canonicalUrl(p.url) === cu) return true;
      const sim = similarity(p.title, story.title);
      if (sim >= 0.75) return true;
      return sim >= 0.55 && src && String(p.source || "").toLowerCase() === src;
    }) || null
  );
}

/** Days between a YYYY-MM-DD / YYYY-MM date and today (null if unknown). */
export function ageDays(published, today) {
  if (!published) return null;
  const iso = /^\d{4}-\d{2}$/.test(published) ? `${published}-15` : published;
  const d = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(d)) return null;
  return Math.floor((Date.parse(`${today}T00:00:00Z`) - d) / 86400000);
}

/**
 * Check a source link. "dead" only for clear not-found answers; bot blocks,
 * paywalls and timeouts count as "unknown" and the story is kept.
 */
export async function checkLink(url, timeoutMs = 9000) {
  const attempt = async (method) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, {
        method,
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; GutAndGainBot/1.0; link check)", accept: "text/html,*/*" },
      });
      return r.status;
    } finally {
      clearTimeout(t);
    }
  };
  try {
    let status = await attempt("HEAD");
    if (status === 405 || status === 403 || status === 501) status = await attempt("GET");
    if (status === 404 || status === 410) return "dead";
    return status < 400 ? "ok" : "unknown";
  } catch {
    return "unknown";
  }
}

export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k], k);
    }
  });
  await Promise.all(workers);
  return out;
}

const EV_SCORE = { strong: 2, emerging: 1, early: 0.4 };
export function score(s, today) {
  const age = ageDays(s.published, today);
  const fresh = age == null ? 0.8 : age <= 7 ? 3 : age <= 30 ? 2 : age <= 90 ? 1 : 0.3;
  const independent = s.sourceType === "Company" ? 0 : 1;
  return fresh + (EV_SCORE[s.evidence] ?? 1) + independent;
}

/** Rough company key for the per-company cap. */
export function companyKey(s) {
  if (s.sourceType !== "Company") return null;
  const m = String(s.source || "").match(/\(([^)]+)\)/);
  return (m ? m[1] : s.source || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24) || null;
}

/**
 * Pick the edition: rank, then round-robin across beats so every category is
 * represented, respecting the per-company cap.
 */
export function selectEdition(candidates, { target, companyCap, alreadyPicked = [] }, today) {
  const byBeat = new Map();
  for (const c of [...candidates].sort((a, b) => score(b, today) - score(a, today))) {
    if (!byBeat.has(c.beat)) byBeat.set(c.beat, []);
    byBeat.get(c.beat).push(c);
  }
  const queues = [...byBeat.values()];
  const picked = [];
  const perCompany = new Map();
  for (const s of alreadyPicked) {
    const key = companyKey(s);
    if (key) perCompany.set(key, (perCompany.get(key) || 0) + 1);
  }
  let capped = 0;
  while (picked.length < target && queues.some((q) => q.length)) {
    for (const q of queues) {
      if (picked.length >= target) break;
      while (q.length) {
        const c = q.shift();
        const key = companyKey(c);
        if (key && (perCompany.get(key) || 0) >= companyCap) {
          capped++;
          continue;
        }
        if (key) perCompany.set(key, (perCompany.get(key) || 0) + 1);
        picked.push(c);
        break;
      }
    }
  }
  return { picked: picked.sort((a, b) => score(b, today) - score(a, today)), capped };
}
