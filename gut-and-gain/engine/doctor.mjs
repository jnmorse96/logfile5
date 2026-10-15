// Preflight checks for the news engine. Runs at the start of every scheduled
// run (and on its own with `npm run engine:doctor`), so a broken setup fails
// in seconds with a plain-English fix instead of failing every search.

import { askClaude } from "../api/_lib.js";

export const FIX = {
  missing_key:
    "Add your Anthropic API key as a repository secret: GitHub repo → Settings → Secrets and variables → Actions → New repository secret, named ANTHROPIC_API_KEY.",
  auth: "The ANTHROPIC_API_KEY secret is invalid or was revoked. Create a new key at https://platform.claude.com/settings/keys and update the secret in GitHub (Settings → Secrets and variables → Actions).",
  credit: "Your Anthropic account is out of credit. Add credit at https://platform.claude.com/settings/billing.",
  web_search_disabled:
    "Web search is turned off for your Anthropic organization. An admin can turn it on at https://platform.claude.com/settings/capabilities.",
  model: "The model name isn't available to your account. Remove or fix the ANTHROPIC_MODEL variable in GitHub (Settings → Secrets and variables → Actions → Variables).",
  overloaded: "Anthropic's API was overloaded during the check. This usually clears on its own; the next run will retry.",
  rate_limit: "Your Anthropic account hit its rate limit. Wait and re-run, or raise your limits in the Anthropic Console.",
  timeout: "The Anthropic API didn't respond in time. The next run will retry.",
  server: "Anthropic's API returned a server error. The next run will retry.",
  bad_request: "Anthropic rejected the request. See the error text above.",
};
export const FATAL = new Set(["missing_key", "auth", "credit", "model"]);

async function checkHttp(name, url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { "user-agent": "GutAndGainBot/1.0 (preflight)" }, signal: ctrl.signal });
    return r.ok ? { name, ok: true } : { name, ok: false, detail: `HTTP ${r.status}` };
  } catch (err) {
    return { name, ok: false, detail: err.name === "AbortError" ? "timed out" : err.message };
  } finally {
    clearTimeout(t);
  }
}

/**
 * @returns {{ ok: boolean, canSearch: boolean, problems: {code,message,fix}[], lines: string[] }}
 */
export async function preflight({ mock = false, checkSources = true } = {}) {
  const lines = [];
  const problems = [];
  let canSearch = true;
  if (mock) return { ok: true, canSearch: true, problems, lines: ["✓ mock mode: skipping live checks"] };

  // 1. Anthropic key + model (tiny request, no search)
  try {
    await askClaude("Reply with the single word OK.", { maxTokens: 5, attempts: 3, timeoutMs: 60000 });
    lines.push(`✓ Anthropic API key works (model ${process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5"})`);
  } catch (err) {
    const code = err.code || "bad_request";
    problems.push({ code, message: err.message, fix: FIX[code] });
    lines.push(`✗ Anthropic API: ${err.message}\n   → ${FIX[code]}`);
    return { ok: false, canSearch: false, problems, lines };
  }

  // 2. Web search allowed for this organization (request-level check; Claude is told not to search)
  try {
    await askClaude("Reply with the single word OK. Do not search.", { search: true, maxTokens: 5, attempts: 3, timeoutMs: 60000 });
    lines.push("✓ Web search is enabled for your Anthropic organization");
  } catch (err) {
    const code = err.code || "bad_request";
    canSearch = false;
    problems.push({ code, message: err.message, fix: FIX[code] });
    lines.push(`✗ Web search: ${err.message}\n   → ${FIX[code]}`);
  }

  // 3. Trial Tracker sources (free, no key)
  if (checkSources) {
    const ct = process.env.ENGINE_CT_BASE || "https://clinicaltrials.gov/api/v2/studies";
    const eu = process.env.ENGINE_EUTILS_BASE || "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
    for (const r of await Promise.all([
      checkHttp("ClinicalTrials.gov", `${ct}?query.cond=Crohn%20Disease&pageSize=1&format=json`),
      checkHttp("PubMed", `${eu}/esearch.fcgi?db=pubmed&term=crohn&retmax=1&retmode=json`),
    ])) {
      lines.push(r.ok ? `✓ ${r.name} reachable` : `⚠ ${r.name} not reachable (${r.detail}); the Trial Tracker keeps its last data`);
      if (!r.ok) problems.push({ code: "source_unreachable", message: `${r.name}: ${r.detail}`, fix: "Usually temporary; the next run will retry." });
    }
  }

  const fatal = problems.some((p) => FATAL.has(p.code));
  return { ok: !fatal, canSearch, problems, lines };
}

// `node engine/doctor.mjs` runs the checks on their own.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("doctor.mjs")) {
  const res = await preflight({});
  console.log(["Gut & Gain engine preflight", ...res.lines].join("\n"));
  process.exit(res.ok && res.canSearch ? 0 : 1);
}
