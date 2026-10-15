#!/usr/bin/env node
// Gut & Gain news engine.
//
// Runs every 12 hours (GitHub Actions, see .github/workflows/daily-engine.yml)
// or by hand with `npm run engine`. Each run ADDS new stories to a rolling feed
// for every channel; nothing good is thrown away between runs. For every
// channel it runs the beats in engine/beats.js (rotating each beat through a
// different region of the world on each run), then:
//
//   gather  -> one web-search scan per beat (same rules as the live scan)
//   clean   -> validate fields, drop anything older than 12 months
//   dedupe  -> against each other and everything published in the last 30 days
//   verify  -> check every source link; drop clear 404s
//   rank    -> freshness + evidence strength + independence, round-robin across
//              beats, max 2 stories per company
//   merge   -> new stories go on top of the feed; stories older than 7 days
//              roll off
//   trials  -> Trial Tracker: new and updated trials from ClinicalTrials.gov
//              and newly published results from PubMed (engine/trials.mjs)
//   publish -> public/data/latest.json, public/data/archive/<date>.json,
//              public/data/index.json
//
// Environment:
//   ANTHROPIC_API_KEY      required (unless ENGINE_MOCK=1)
//   ANTHROPIC_MODEL        optional model override
//   ENGINE_CHANNELS        comma list to run a subset (default: all)
//   ENGINE_LANGUAGES       comma list of extra languages to pre-translate (e.g. "es,nl,pt")
//   ENGINE_SKIP_LINKCHECK  "1" to skip link checks
//   ENGINE_DRY_RUN         "1" to print the edition without writing files
//   ENGINE_MOCK            "1" to use canned responses (for testing, no API calls)
//   ENGINE_OUT             output folder (default: public/data)
//   ENGINE_NOW             override the current time (ISO), for testing
//   NCBI_API_KEY / NCBI_EMAIL  optional, for PubMed rate limits

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHANNELS, REGIONS, LANGUAGES } from "../src/channels.js";
import { askClaude as realAsk, extractJSON, cleanStory } from "../api/_lib.js";
import { buildBriefingPrompt } from "../api/_prompts.js";
import { BEATS, EDITION, REGION_ROTATION } from "./beats.js";
import { isDuplicate, ageDays, checkLink, mapLimit, selectEdition, storyId } from "./lib.mjs";
import { runTrials } from "./trials.mjs";
import { preflight, FATAL, FIX } from "./doctor.mjs";

// Next scheduled run, matching the cron in .github/workflows/news-engine.yml
// (minute 17 at 10:00 and 22:00 UTC). Override with ENGINE_SCHEDULE_UTC="10:17,22:17".
function nextScheduled(nowISO) {
  const slots = (process.env.ENGINE_SCHEDULE_UTC || "10:17,22:17").split(",").map((t) => t.trim().split(":").map(Number));
  const now = Date.parse(nowISO);
  const day = new Date(now); day.setUTCHours(0, 0, 0, 0);
  for (let d = 0; d < 2; d++) for (const [h, m] of slots) {
    const t = day.getTime() + d * 86400000 + (h * 60 + m) * 60000;
    if (t > now + 60000) return new Date(t).toISOString();
  }
  return new Date(now + EDITION.runHours * 3600000).toISOString();
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Command-line flags work on every OS (Windows can't use `VAR=1 node ...`):
//   --mock  --dry-run  --skip-links  --channels=ibd,trials
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => (argv.find((a) => a.startsWith(`--${name}=`)) || "").split("=")[1];
const env = { ...process.env };
if (flag("mock")) env.ENGINE_MOCK = "1";
if (flag("dry-run")) env.ENGINE_DRY_RUN = "1";
if (flag("skip-links")) env.ENGINE_SKIP_LINKCHECK = "1";
if (opt("channels")) env.ENGINE_CHANNELS = opt("channels");
const OUT = path.resolve(ROOT, env.ENGINE_OUT || "public/data");
const NOW = env.ENGINE_NOW || (env.ENGINE_TODAY ? `${env.ENGINE_TODAY}T10:17:00.000Z` : new Date().toISOString());
const TODAY = NOW.slice(0, 10);
// Which 12-hour run this is; used to rotate regions so each run looks somewhere new.
const SLOT = Math.floor(Date.parse(NOW) / (EDITION.runHours * 3600000));
const MOCK = env.ENGINE_MOCK === "1";
const DRY = env.ENGINE_DRY_RUN === "1";
const SKIP_LINKS = env.ENGINE_SKIP_LINKCHECK === "1" || MOCK;
const CHANNEL_IDS = (env.ENGINE_CHANNELS || Object.keys(CHANNELS).join(",")).split(",").map((s) => s.trim()).filter((id) => CHANNELS[id]);
const EXTRA_LANGS = (env.ENGINE_LANGUAGES || "").split(",").map((s) => s.trim()).filter((c) => c && c !== "en" && LANGUAGES.some((l) => l.code === c));

const ask = MOCK ? (await import("./mock.mjs")).mockAsk : realAsk;
const log = (...a) => console.log(`[engine ${NOW.slice(0, 16)}Z]`, ...a);
const hoursSince = (iso) => (iso ? (Date.parse(NOW) - Date.parse(iso)) / 3600000 : Infinity);

async function readJSON(file, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}
async function writeJSON(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n");
}
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

// ---- history: what was published recently -------------------------------------
async function loadHistory() {
  const latest = await readJSON(path.join(OUT, "latest.json"));
  const index = await readJSON(path.join(OUT, "index.json"), { editions: [] });
  const recentDates = (index.editions || [])
    .map((e) => e.date)
    .filter((d) => d < TODAY && daysBetween(d, TODAY) <= EDITION.dedupeDays);
  const byChannel = Object.fromEntries(CHANNEL_IDS.map((id) => [id, []]));
  for (const d of recentDates) {
    const ed = await readJSON(path.join(OUT, "archive", `${d}.json`));
    for (const id of CHANNEL_IDS) for (const s of ed?.channels?.[id]?.stories || []) byChannel[id].push(s);
  }
  return { latest, index, byChannel };
}

// ---- one beat ---------------------------------------------------------------------
function beatRegion(beat, beatIndex, channelIndex) {
  if (beat.region) return beat.region;
  return REGION_ROTATION[(SLOT + beatIndex + channelIndex * 2) % REGION_ROTATION.length];
}

async function runBeat(channel, beat, exclude, regionId) {
  const focus = channel.categories.filter((c) => beat.focus.includes(c.id));
  const region = REGIONS.find((r) => r.id === regionId) || REGIONS[0];
  const lang = LANGUAGES.find((l) => l.code === "en");
  const prompt = buildBriefingPrompt({ channel, focus, region, lang, max: beat.max || 4, exclude, today: TODAY, extra: beat.extra || "" });
  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { text } = await ask(prompt, { search: true, maxTokens: 8000, channel: channel.id, beat: beat.id });
      let parsed;
      try {
        parsed = extractJSON(text);
        if (!Array.isArray(parsed.stories)) throw new Error("no stories array");
      } catch {
        // Claude answered in prose or broke the format: ask it (cheaply, no search)
        // to convert its own answer into the required JSON instead of losing the beat.
        log(`  ${channel.id}/${beat.id}: answer wasn't valid JSON; repairing`);
        parsed = extractJSON(
          (
            await ask(
              `Convert the news findings below into JSON with this exact shape and nothing else: {"stories":[{"title":"","summary":"","tag":"","track":"","condition":"","region":"","originalLanguage":"","evidence":"strong|emerging|early","whyItMatters":"","source":"","sourceType":"Journal|Conference|Regulator|Patient group|Company|News","date":"","published":"YYYY-MM-DD","url":"https://..."}]}. Use only facts and URLs present in the text; drop any item without a URL.\n\n${String(text).slice(0, 12000)}`,
              { maxTokens: 6000, repair: true }
            )
          ).text
        );
      }
      return (parsed.stories || []).map((s) => ({ ...cleanStory(s), beat: beat.id, foundIn: region.label }));
    } catch (err) {
      lastErr = err;
      if (FATAL.has(err.code) || err.code === "web_search_disabled") throw err; // retrying won't help
      log(`  ${channel.id}/${beat.id} attempt ${attempt} failed: ${err.message}`);
      if (attempt === 1) await new Promise((r) => setTimeout(r, MOCK ? 10 : 8000));
    }
  }
  throw lastErr;
}

// ---- translation of a finished edition -------------------------------------------
async function translate(stories, code) {
  const target = LANGUAGES.find((l) => l.code === code);
  const slim = stories.map((s, i) => ({ i, title: s.title, summary: s.summary, whyItMatters: s.whyItMatters }));
  const { text } = await ask(
    `Translate into natural, fluent ${target.label}. Keep drug, compound, trial and gene names as they are. Return ONLY a JSON array with the same objects and "i" values, translating title, summary and whyItMatters. No markdown.\n\n${JSON.stringify(slim)}`,
    { maxTokens: 8000, translate: code }
  );
  const out = extractJSON(text, "[", "]");
  return stories.map((s, i) => {
    const t = out.find((o) => o.i === i) || {};
    return { ...s, title: t.title || s.title, summary: t.summary || s.summary, whyItMatters: t.whyItMatters || s.whyItMatters };
  });
}

// ---- one channel --------------------------------------------------------------------
async function runChannel(id, history, report, channelIndex) {
  const channel = CHANNELS[id];
  const recent = history.byChannel[id] || [];
  const previous = history.latest?.channels?.[id]?.stories || [];
  const exclude = [...new Set([...previous, ...recent].map((s) => s.title))];

  // gather
  const gathered = [];
  for (const [beatIndex, beat] of BEATS[id].entries()) {
    const regionId = beatRegion(beat, beatIndex, channelIndex);
    const row = { channel: id, beat: beat.id, region: regionId, found: 0, kept: 0, error: null };
    try {
      const got = await runBeat(channel, beat, exclude, regionId);
      row.found = got.length;
      gathered.push(...got);
    } catch (err) {
      row.error = err.message;
      row.code = err.code || null;
      report.beats.push(row);
      if (FATAL.has(err.code) || err.code === "web_search_disabled") throw err;
      continue;
    }
    report.beats.push(row);
  }

  // clean + date filter
  const drops = { invalid: 0, old: 0, future: 0, duplicate: 0, deadLink: 0, cap: 0 };
  let pool = gathered.filter((s) => {
    if (!s.title || !s.summary || !s.url) return drops.invalid++, false;
    const age = ageDays(s.published, TODAY);
    if (age != null && age > EDITION.maxAgeDays) return drops.old++, false;
    if (age != null && age < -2) return drops.future++, false;
    return true;
  });

  // dedupe: within today's batch, then against the last 30 days
  const unique = [];
  for (const s of pool) {
    if (isDuplicate(s, unique) || isDuplicate(s, recent) || isDuplicate(s, previous)) drops.duplicate++;
    else unique.push(s);
  }
  pool = unique;

  // verify links
  if (!SKIP_LINKS && pool.length) {
    const results = await mapLimit(pool, 6, (s) => checkLink(s.url));
    pool = pool.filter((s, i) => {
      s.linkStatus = results[i];
      if (results[i] === "dead") return drops.deadLink++, false;
      return true;
    });
  }

  // rank + select (the company cap also counts stories already in the feed)
  const kept = previous.filter((s) => hoursSince(s.firstSeenAt || `${s.firstSeen}T00:00:00Z`) <= EDITION.carryDays * 24);
  const { picked, capped } = selectEdition(pool, { ...EDITION, target: EDITION.perRun, alreadyPicked: kept }, TODAY);
  drops.cap = capped;
  for (const row of report.beats.filter((r) => r.channel === id)) row.kept = picked.filter((s) => s.beat === row.beat).length;

  const fresh = picked.map((s) => ({ ...s, id: storyId(s), firstSeen: TODAY, firstSeenAt: NOW }));

  // Rolling feed: new stories on top, then everything still fresh from earlier
  // runs, up to the target size.
  const carried = [];
  for (const s of kept) {
    if (fresh.length + carried.length >= EDITION.target) break;
    if (isDuplicate(s, fresh)) continue;
    carried.push({ ...s, firstSeenAt: s.firstSeenAt || `${s.firstSeen}T00:00:00.000Z` });
  }

  let stories = [...fresh, ...carried].map((s) => ({ ...s, isNew: hoursSince(s.firstSeenAt) <= EDITION.newHours }));
  let status = fresh.length ? "updated" : "no-new-stories";
  if (!stories.length) {
    // Never publish an empty channel: keep yesterday's stories as they were.
    stories = previous.map((s) => ({ ...s, isNew: false }));
    status = previous.length ? "kept-previous" : "empty";
  }

  const translations = {};
  for (const code of EXTRA_LANGS) {
    if (!stories.length) break;
    try {
      translations[code] = await translate(stories, code);
    } catch (err) {
      log(`  ${id} translation to ${code} failed: ${err.message}`);
    }
  }

  log(`${id}: gathered ${gathered.length}, published ${stories.length} (${fresh.length} new, ${carried.length} carried) · dropped ${JSON.stringify(drops)} · ${status}`);
  return { status, stories, translations, stats: { gathered: gathered.length, new: fresh.length, carried: carried.length, drops } };
}

// ---- main ---------------------------------------------------------------------------
// ---- run status: public/data/status.json + GitHub run summary ----------------------
async function writeStatus(status) {
  const file = path.join(OUT, "status.json");
  const prev = await readJSON(file, {});
  const next = {
    lastRunAt: NOW,
    lastRunOk: status.ok,
    lastSuccessAt: status.ok ? NOW : prev.lastSuccessAt || null,
    nextRunAt: nextScheduled(NOW),
    message: status.message,
    problems: status.problems || [],
    counts: status.counts || prev.counts || {},
  };
  if (!DRY) await writeJSON(file, next);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    const rows = (status.beats || []).map((b) => `| ${b.channel} | ${b.beat} | ${b.region || ""} | ${b.found} | ${b.kept} | ${b.error ? `❌ ${b.error.slice(0, 90)}` : "✅"} |`);
    const md = [
      `## ${status.ok ? "✅" : "❌"} Gut & Gain news engine`,
      "",
      status.message,
      "",
      ...(status.problems?.length ? ["### What needs attention", ...status.problems.map((p) => `- **${p.message}**${p.fix ? `  \n  ${p.fix}` : ""}${p.keyCheck ? `  \n  Key check: the saved secret ${p.keyCheck}.` : ""}`), ""] : []),
      ...(status.preflight?.length ? ["### Preflight", "```", ...status.preflight, "```", ""] : []),
      ...(rows.length ? ["### Searches", "| Section | Beat | Region | Found | Added | Result |", "|---|---|---|---|---|---|", ...rows, ""] : []),
      ...(status.trials ? [`### Trial Tracker`, `Registry: ${status.trials.registryFetched} fetched, ${status.trials.newTrials} new, ${status.trials.updatedTrials} updated · PubMed: ${status.trials.resultsFetched} fetched, ${status.trials.newResults} new${status.trials.errors?.length ? ` · ⚠ ${status.trials.errors.join("; ")}` : ""}`, ""] : []),
    ].join("\n");
    await fs.appendFile(summary, md + "\n").catch(() => {});
  }
  return next;
}

async function main() {
  const startedAt = new Date().toISOString();
  log(`starting · channels: ${CHANNEL_IDS.join(", ")}${MOCK ? " · MOCK" : ""}${DRY ? " · DRY RUN" : ""}`);

  // Preflight: fail fast, in plain English, if the setup is broken.
  const pre = await preflight({ mock: MOCK });
  for (const line of pre.lines) log(line);
  if (!pre.ok) {
    const st = await writeStatus({ ok: false, message: "The engine couldn't start: " + pre.problems.map((p) => p.message).join("; "), problems: pre.problems, preflight: pre.lines });
    console.error(`\nENGINE NOT RUN. ${pre.problems.map((p) => p.fix).join(" ")}`);
    process.exitCode = 1;
    return st;
  }

  const history = await loadHistory();
  const report = { beats: [], problems: [...pre.problems] };

  const channels = {};
  const storyChannels = pre.canSearch ? CHANNEL_IDS.filter((id) => BEATS[id]) : [];
  if (!pre.canSearch) log("web search unavailable: skipping news searches this run; the Trial Tracker still updates");
  try {
    for (const [i, id] of storyChannels.entries()) channels[id] = await runChannel(id, history, report, i);
  } catch (err) {
    // A fatal error mid-run (key revoked, credit ran out): keep what we have, report it.
    const code = err.code || "bad_request";
    report.problems.push({ code, message: err.message, fix: FIX[code] });
    log(`stopping searches: ${err.message}`);
  }

  if (CHANNEL_IDS.includes("trials")) {
    const t = await runTrials({ nowISO: NOW, previous: history.latest?.channels?.trials, ask, extractJSON, mock: MOCK, log });
    t.stories = t.stories.map((s) => ({ ...s, isNew: hoursSince(s.firstSeenAt) <= EDITION.newHours }));
    t.registry = t.registry.map((r) => ({ ...r, isNew: hoursSince(r.changedAt || r.firstSeenAt) <= EDITION.newHours }));
    t.translations = {};
    for (const code of EXTRA_LANGS) {
      if (!t.stories.length) break;
      try {
        t.translations[code] = await translate(t.stories, code);
      } catch (err) {
        log(`  trials translation to ${code} failed: ${err.message}`);
      }
    }
    channels.trials = t;
    report.trials = t.stats;
  }

  // Keep channels that weren't part of this run.
  for (const [id, ch] of Object.entries(history.latest?.channels || {})) if (!channels[id]) channels[id] = ch;

  const anyStories = Object.values(channels).some((c) => (c.stories?.length || c.registry?.length) && c.status !== "kept-previous" && c.status !== "empty");
  const beatErrors = report.beats.filter((b) => b.error);
  if (!anyStories) {
    const allFailed = (!report.beats.length || report.beats.every((b) => b.error)) && (!report.trials || report.trials.errors.length === 2);
    if (allFailed) {
      // Mark the run failed so GitHub emails you; the site keeps the current feed.
      console.error("Every source failed this run. Leaving the current feed in place.");
      console.error(JSON.stringify(report.beats, null, 2));
      await writeStatus({ ok: false, message: "Every source failed this run, so the site kept its previous stories.", problems: report.problems, beats: report.beats, trials: report.trials, preflight: pre.lines });
      process.exitCode = 1;
      return;
    }
    log("No new stories this run and nothing fresh to carry over. Keeping the current feed.");
    await writeStatus({ ok: true, message: "Checked all sources; nothing new this run.", problems: report.problems, beats: report.beats, trials: report.trials, preflight: pre.lines });
    return;
  }

  const edition = {
    date: TODAY,
    generatedAt: NOW,
    nextRunAt: nextScheduled(NOW),
    run: { startedAt, finishedAt: new Date().toISOString(), model: MOCK ? "mock" : env.ANTHROPIC_MODEL || "default", beats: report.beats, trials: report.trials || null },
    channels,
  };

  if (DRY) {
    console.log(JSON.stringify(edition, null, 2));
    return;
  }

  await writeJSON(path.join(OUT, "latest.json"), edition);
  await writeJSON(path.join(OUT, "archive", `${TODAY}.json`), edition);
  const editions = [
    { date: TODAY, updated: NOW, counts: Object.fromEntries(Object.entries(channels).map(([id, c]) => [id, (c.stories || []).length + (c.registry || []).length])) },
    ...(history.index.editions || []).filter((e) => e.date !== TODAY),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, EDITION.archiveKeep);
  await writeJSON(path.join(OUT, "index.json"), { updated: edition.generatedAt, editions });
  log(`published ${path.relative(ROOT, OUT)}/latest.json and archive/${TODAY}.json`);

  const counts = Object.fromEntries(Object.entries(channels).map(([id, c]) => [id, { stories: (c.stories || []).length, new: (c.stories || []).filter((x) => x.isNew).length, trials: (c.registry || []).length }]));
  const added = Object.values(counts).reduce((a, c) => a + c.new, 0);
  // Setup problems (e.g. web search switched off, key revoked mid-run) still publish
  // what we could, but mark the run as needing attention so GitHub emails you.
  const attention = report.problems.filter((p) => p.code !== "source_unreachable" && p.code !== "overloaded" && p.code !== "rate_limit" && p.code !== "timeout" && p.code !== "server");
  const sections = Object.keys(channels).length;
  await writeStatus({
    ok: attention.length === 0,
    message: `${attention.length ? "Partly updated" : "Updated"}: ${added} new item${added === 1 ? "" : "s"} across ${sections} section${sections === 1 ? "" : "s"}.${beatErrors.length ? ` ${beatErrors.length} of ${report.beats.length} searches failed and will retry next run.` : ""}${attention.length ? ` Needs attention: ${attention.map((p) => p.fix || p.message).join(" ")}` : ""}`,
    problems: report.problems,
    beats: report.beats,
    trials: report.trials,
    counts,
    preflight: pre.lines,
  });
  if (attention.length) {
    console.error(`\nNEEDS ATTENTION: ${attention.map((p) => p.fix || p.message).join(" ")}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
