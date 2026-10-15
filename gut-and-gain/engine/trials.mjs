// Trial Tracker: new Crohn's and colitis clinical trials worldwide, plus newly
// published trial results. Uses official, structured sources instead of web
// search:
//
//   - ClinicalTrials.gov API v2 (no key needed). Covers trials registered in
//     the US and around the world, with their sites by country.
//   - PubMed E-utilities (no key needed; NCBI_API_KEY raises the rate limit).
//     Newly indexed randomized trials, phase 2/3 trials and meta-analyses.
//
// Claude is only used (without web search) to rewrite registry text and
// abstracts into plain language. If that fails, the official text is used.

const CT_BASE = process.env.ENGINE_CT_BASE || "https://clinicaltrials.gov/api/v2/studies";
const EUTILS = process.env.ENGINE_EUTILS_BASE || "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const UA = "GutAndGainBot/1.0 (+https://github.com; trial tracker)";

export const TRIALS = {
  conditions: "Crohn Disease OR Ulcerative Colitis OR Inflammatory Bowel Diseases",
  registryDays: 45,      // newly registered within this window
  resultsPostedDays: 90, // registry entries whose results were posted recently
  keepDays: 60,          // how long a trial stays in the tracker after first seen
  maxRegistry: 80,
  pubmedDays: 30,
  maxResults: 30,
  summarizePerRun: 15,
};

const MED_TYPES = new Set(["DRUG", "BIOLOGICAL", "GENETIC", "COMBINATION_PRODUCT"]);
const SYMPTOM_RE =
  /fatigue|pain|urgency|diarrh|incontinen|quality of life|sleep|anxiety|depress|stress|diet|nutrition|enteral|exercise|physical activity|yoga|mindful|psycholog|cognitive|hypnotherap|symptom|bloating|nausea|appetite|weight|muscle|sarcopen|fistula|stoma|ostomy|pouch|hydrat|itch|arthralg|joint/i;
const STATUS = {
  RECRUITING: "Recruiting",
  NOT_YET_RECRUITING: "Not yet recruiting",
  ENROLLING_BY_INVITATION: "Enrolling by invitation",
  ACTIVE_NOT_RECRUITING: "Active, not recruiting",
  COMPLETED: "Completed",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
  WITHDRAWN: "Withdrawn",
  UNKNOWN: "Unknown",
};
const TYPE = {
  DRUG: "Drug", BIOLOGICAL: "Biologic", DEVICE: "Device", PROCEDURE: "Procedure", BEHAVIORAL: "Behavioral",
  DIETARY_SUPPLEMENT: "Supplement", GENETIC: "Genetic", COMBINATION_PRODUCT: "Combination", DIAGNOSTIC_TEST: "Diagnostic test",
  RADIATION: "Radiation", OTHER: "Other",
};

const daysAgoISO = (nowISO, n) => new Date(Date.parse(nowISO) - n * 86400000).toISOString().slice(0, 10);
const hoursSince = (iso, nowISO) => (Date.parse(nowISO) - Date.parse(iso)) / 3600000;
const clip = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…` : s || "");

async function fetchWithRetry(url, { json = true, tries = 3, timeoutMs = 25000 } = {}) {
  let last;
  for (let i = 1; i <= tries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { headers: { "user-agent": UA, accept: json ? "application/json" : "*/*" }, signal: ctrl.signal });
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { fatal: true });
      return json ? await r.json() : await r.text();
    } catch (err) {
      last = err;
      if (err.fatal) break;
      await new Promise((res) => setTimeout(res, 1500 * i));
    } finally {
      clearTimeout(t);
    }
  }
  throw last;
}

// ------------------------------------------------------------ registry --------

export function formatPhase(phases = []) {
  const p = (phases || []).filter((x) => x && x !== "NA");
  if (!p.length) return "N/A";
  const nums = p.map((x) => (x === "EARLY_PHASE1" ? "Early 1" : x.replace("PHASE", "")));
  return `Phase ${nums.join("/")}`;
}

export function conditionTags(list = []) {
  const text = list.join(" ").toLowerCase();
  const tags = [];
  if (/crohn/.test(text)) tags.push("Crohn's");
  if (/ulcerative|colitis|proctitis|pouchitis/.test(text)) tags.push("UC");
  if (!tags.length && /inflammatory bowel|ibd/.test(text)) tags.push("IBD");
  return tags.length ? tags : ["IBD"];
}

export function classifyKind(interventionTypes = [], text = "") {
  if (interventionTypes.some((t) => MED_TYPES.has(t))) return "Medication";
  if (SYMPTOM_RE.test(text)) return "Symptom management";
  return "Care & monitoring";
}

/** Turn one ClinicalTrials.gov v2 study into a tracker entry. */
export function normalizeStudy(study) {
  const ps = study?.protocolSection || {};
  const id = ps.identificationModule?.nctId;
  if (!id) return null;
  const status = ps.statusModule?.overallStatus || "UNKNOWN";
  if (status === "WITHDRAWN") return null;
  const interventions = (ps.armsInterventionsModule?.interventions || []).map((i) => ({
    type: TYPE[i.type] || "Other",
    rawType: i.type || "OTHER",
    name: clip(i.name || "", 80),
  }));
  const conditions = ps.conditionsModule?.conditions || [];
  const brief = ps.descriptionModule?.briefSummary || "";
  const outcomes = (ps.outcomesModule?.primaryOutcomes || []).map((o) => o.measure).filter(Boolean);
  const countryCount = {};
  for (const loc of ps.contactsLocationsModule?.locations || []) {
    if (loc.country) countryCount[loc.country] = (countryCount[loc.country] || 0) + 1;
  }
  const countries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const sponsorClass = ps.sponsorCollaboratorsModule?.leadSponsor?.class || "";
  const title = ps.identificationModule?.briefTitle || ps.identificationModule?.officialTitle || id;
  const kindText = [title, brief, outcomes.join(" "), conditions.join(" ")].join(" ");
  return {
    id,
    title,
    officialTitle: ps.identificationModule?.officialTitle || "",
    summary: clip(brief.replace(/\s+/g, " ").trim(), 420),
    plain: null,
    whoFor: "",
    kind: classifyKind(interventions.map((i) => i.rawType), kindText),
    conditions: conditionTags(conditions),
    phase: formatPhase(ps.designModule?.phases),
    status: STATUS[status] || status,
    randomized: ps.designModule?.designInfo?.allocation === "RANDOMIZED",
    interventions: interventions.map(({ type, name }) => ({ type, name })).slice(0, 4),
    primaryOutcome: clip(outcomes[0] || "", 160),
    sponsor: ps.sponsorCollaboratorsModule?.leadSponsor?.name || "",
    industry: sponsorClass === "INDUSTRY",
    countries,
    enrollment: ps.designModule?.enrollmentInfo?.count ?? null,
    start: ps.statusModule?.startDateStruct?.date || "",
    firstPosted: ps.statusModule?.studyFirstPostDateStruct?.date || "",
    lastUpdate: ps.statusModule?.lastUpdatePostDateStruct?.date || "",
    resultsPosted: ps.statusModule?.resultsFirstPostDateStruct?.date || "",
    hasResults: !!study.hasResults,
    url: `https://clinicaltrials.gov/study/${id}`,
  };
}

export function registryUrls(nowISO) {
  const q = (advanced) =>
    `${CT_BASE}?${new URLSearchParams({
      "query.cond": TRIALS.conditions,
      "filter.advanced": advanced,
      pageSize: "100",
      format: "json",
      countTotal: "true",
    })}`;
  return {
    newlyRegistered: q(`AREA[StudyType]INTERVENTIONAL AND AREA[StudyFirstPostDate]RANGE[${daysAgoISO(nowISO, TRIALS.registryDays)},MAX]`),
    resultsPosted: q(`AREA[StudyType]INTERVENTIONAL AND AREA[ResultsFirstPostDate]RANGE[${daysAgoISO(nowISO, TRIALS.resultsPostedDays)},MAX]`),
  };
}

async function fetchRegistry(nowISO, { mock }) {
  if (mock) return (await import("./mock.mjs")).mockRegistry(nowISO);
  const urls = registryUrls(nowISO);
  const out = [];
  for (const [name, url] of Object.entries(urls)) {
    const data = await fetchWithRetry(url);
    out.push(...(data.studies || []));
    if (name === "newlyRegistered" && data.nextPageToken) {
      const more = await fetchWithRetry(`${url}&pageToken=${encodeURIComponent(data.nextPageToken)}`);
      out.push(...(more.studies || []));
    }
  }
  return out;
}

// ------------------------------------------------------------ PubMed --------

const PUBMED_TERM =
  '("Crohn Disease"[Mesh] OR "Colitis, Ulcerative"[Mesh] OR "Inflammatory Bowel Diseases"[Mesh] OR crohn*[tiab] OR "ulcerative colitis"[tiab]) AND ("randomized controlled trial"[pt] OR "clinical trial, phase ii"[pt] OR "clinical trial, phase iii"[pt] OR "meta-analysis"[pt]) AND english[la]';

function eutilsParams(extra) {
  const p = new URLSearchParams({ db: "pubmed", tool: "gut-and-gain", ...extra });
  if (process.env.NCBI_EMAIL) p.set("email", process.env.NCBI_EMAIL);
  if (process.env.NCBI_API_KEY) p.set("api_key", process.env.NCBI_API_KEY);
  return p;
}

export function parsePubmedXml(xml) {
  const out = {};
  for (const block of String(xml).split(/<PubmedArticle[\s>]/).slice(1)) {
    const pmid = (block.match(/<PMID[^>]*>(\d+)<\/PMID>/) || [])[1];
    if (!pmid) continue;
    const parts = [...block.matchAll(/<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g)].map(([, attrs, body]) => {
      const label = (attrs.match(/Label="([^"]+)"/) || [])[1];
      const text = body.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      return label ? `${label}: ${text}` : text;
    });
    const countries = [...block.matchAll(/<Affiliation>([\s\S]*?)<\/Affiliation>/g)]
      .map(([, a]) => a.replace(/<[^>]+>/g, "").split(",").pop().replace(/\.\s*$/, "").replace(/\S+@\S+/g, "").trim())
      .filter((c) => c && c.length < 40);
    out[pmid] = { abstract: parts.join(" "), country: countries[0] || "" };
  }
  return out;
}

async function fetchPubmed({ mock }) {
  if (mock) return (await import("./mock.mjs")).mockPubmed();
  const search = await fetchWithRetry(
    `${EUTILS}/esearch.fcgi?${eutilsParams({ term: PUBMED_TERM, datetype: "edat", reldate: String(TRIALS.pubmedDays), retmax: "40", sort: "pub_date", retmode: "json" })}`
  );
  const ids = search?.esearchresult?.idlist || [];
  if (!ids.length) return [];
  await new Promise((r) => setTimeout(r, 400));
  const summary = await fetchWithRetry(`${EUTILS}/esummary.fcgi?${eutilsParams({ id: ids.join(","), retmode: "json" })}`);
  await new Promise((r) => setTimeout(r, 400));
  const xml = await fetchWithRetry(`${EUTILS}/efetch.fcgi?${eutilsParams({ id: ids.join(","), retmode: "xml" })}`, { json: false });
  const abstracts = parsePubmedXml(xml);
  return ids
    .map((id) => {
      const r = summary?.result?.[id];
      if (!r) return null;
      return {
        pmid: id,
        title: String(r.title || "").replace(/\.$/, ""),
        journal: r.fulljournalname || r.source || "",
        pubdate: r.sortpubdate ? r.sortpubdate.slice(0, 10).replace(/\//g, "-") : "",
        pubtypes: r.pubtype || [],
        abstract: abstracts[id]?.abstract || "",
        country: abstracts[id]?.country || "",
      };
    })
    .filter(Boolean);
}

/** Turn a PubMed record into a story card (before any plain-language rewrite). */
export function pubmedToStory(rec) {
  const isStrong = rec.pubtypes.some((t) => /randomized controlled trial|meta-analysis|phase iii/i.test(t));
  const results = (rec.abstract.match(/RESULTS?:\s*([^]*?)(?:\s[A-Z][A-Z ]{3,}:|$)/) || [])[1];
  const text = `${rec.title} ${rec.abstract}`;
  const design = rec.pubtypes.find((t) => /randomized|meta-analysis|phase/i.test(t)) || "Clinical study";
  return {
    title: rec.title,
    summary: clip((results || rec.abstract || "Abstract not available yet.").trim(), 380),
    tag: design.replace("Clinical Trial, ", ""),
    condition: conditionTags([text])[0],
    kind: /\b(placebo|mg|dose|antibod|inhibitor|biolog|drug|tablet|infusion|subcutaneous)\b/i.test(text) ? "Medication" : SYMPTOM_RE.test(text) ? "Symptom management" : "Care & monitoring",
    region: rec.country || "International",
    originalLanguage: "English",
    evidence: isStrong ? "strong" : "emerging",
    whyItMatters: "",
    source: rec.journal,
    sourceType: "Journal",
    date: rec.pubdate ? new Date(`${rec.pubdate}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
    published: rec.pubdate,
    url: `https://pubmed.ncbi.nlm.nih.gov/${rec.pmid}/`,
    pmid: rec.pmid,
    id: `pmid-${rec.pmid}`,
    abstract: rec.abstract,
  };
}

// ------------------------------------------------------ plain language --------

async function summarizeTrials(ask, extractJSON, trials, log) {
  if (!trials.length) return;
  const input = trials.map((t, i) => ({
    i,
    title: t.title,
    summary: t.summary,
    testing: t.interventions.map((x) => `${x.type}: ${x.name}`).join("; "),
    primaryOutcome: t.primaryOutcome,
    phase: t.phase,
  }));
  try {
    const { text } = await ask(
      `Rewrite these clinical trial registry entries for patients with Crohn's disease or ulcerative colitis. Use ONLY the information given; do not add claims.
For each, return: "title" (a plain-language headline under 90 characters saying what is being tested), "summary" (2 short sentences: what is tested and what the trial measures), "whoFor" (1 short sentence on who the trial is for, from the text; empty string if unclear).
Return ONLY a JSON array of objects with the same "i" values. No markdown.

${JSON.stringify(input)}`,
      { maxTokens: 6000, kind: "trial-summaries" }
    );
    for (const o of extractJSON(text, "[", "]")) {
      const t = trials[o.i];
      if (!t) continue;
      t.plain = { title: clip(String(o.title || ""), 110), summary: clip(String(o.summary || ""), 420) };
      t.whoFor = clip(String(o.whoFor || ""), 200);
    }
  } catch (err) {
    log(`  trials: plain-language rewrite failed (${err.message}); using registry text`);
  }
}

async function summarizeResults(ask, extractJSON, stories, log) {
  if (!stories.length) return;
  const input = stories.map((s, i) => ({ i, title: s.title, journal: s.source, abstract: clip(s.abstract, 2500) }));
  try {
    const { text } = await ask(
      `These are newly published clinical trials and meta-analyses about Crohn's disease or ulcerative colitis. For each, using ONLY the abstract:
"title": plain-language headline under 100 characters with the main finding,
"summary": 2-3 plain sentences with the key numbers,
"whyItMatters": 1 sentence on the practical relevance for someone living with IBD (no individual medical advice),
"evidence": "strong" (randomized trial or meta-analysis), "emerging" (smaller or open-label), or "early" (pilot),
"kind": "Medication", "Symptom management" or "Care & monitoring",
"condition": "Crohn's", "UC" or "IBD",
"tag": a short topic label (for example "JAK inhibitor", "Diet", "Fatigue").
Return ONLY a JSON array with the same "i" values. No markdown.

${JSON.stringify(input)}`,
      { maxTokens: 8000, kind: "result-summaries" }
    );
    for (const o of extractJSON(text, "[", "]")) {
      const s = stories[o.i];
      if (!s) continue;
      if (o.title) s.title = clip(String(o.title), 120);
      if (o.summary) s.summary = clip(String(o.summary), 600);
      if (o.whyItMatters) s.whyItMatters = clip(String(o.whyItMatters), 300);
      if (["strong", "emerging", "early"].includes(o.evidence)) s.evidence = o.evidence;
      if (["Medication", "Symptom management", "Care & monitoring"].includes(o.kind)) s.kind = o.kind;
      if (["Crohn's", "UC", "IBD"].includes(o.condition)) s.condition = o.condition;
      if (o.tag) s.tag = clip(String(o.tag), 40);
      s.originalTitle = input[o.i].title;
    }
  } catch (err) {
    log(`  trials: results rewrite failed (${err.message}); using abstracts`);
  }
}

// ------------------------------------------------------------ run --------

export async function runTrials({ nowISO, previous, ask, extractJSON, mock, log }) {
  const prevRegistry = previous?.registry || [];
  const prevResults = previous?.stories || [];
  const report = { registryFetched: 0, newTrials: 0, updatedTrials: 0, resultsFetched: 0, newResults: 0, errors: [] };

  // --- registry
  let registry = prevRegistry.map((t) => ({ ...t }));
  try {
    const studies = await fetchRegistry(nowISO, { mock });
    report.registryFetched = studies.length;
    const byId = new Map(registry.map((t) => [t.id, t]));
    for (const st of studies) {
      const t = normalizeStudy(st);
      if (!t) continue;
      const old = byId.get(t.id);
      if (!old) {
        byId.set(t.id, { ...t, firstSeenAt: nowISO, change: t.hasResults ? "results" : "new" });
        report.newTrials++;
      } else {
        const changed = old.status !== t.status || (!old.hasResults && t.hasResults);
        byId.set(t.id, {
          ...old,
          ...t,
          plain: old.plain,
          whoFor: old.whoFor,
          firstSeenAt: old.firstSeenAt,
          change: changed ? (t.hasResults && !old.hasResults ? "results" : "status") : old.change,
          changedAt: changed ? nowISO : old.changedAt,
        });
        if (changed) report.updatedTrials++;
      }
    }
    registry = [...byId.values()];
  } catch (err) {
    report.errors.push(`registry: ${err.message}`);
    log(`  trials: registry fetch failed: ${err.message}`);
  }
  registry = registry
    .filter((t) => hoursSince(t.firstSeenAt, nowISO) <= TRIALS.keepDays * 24 || (t.changedAt && hoursSince(t.changedAt, nowISO) <= 30 * 24))
    .sort((a, b) => (b.changedAt || b.firstSeenAt).localeCompare(a.changedAt || a.firstSeenAt) || (b.firstPosted || "").localeCompare(a.firstPosted || ""))
    .slice(0, TRIALS.maxRegistry);
  const needPlain = registry.filter((t) => !t.plain).slice(0, TRIALS.summarizePerRun);
  await summarizeTrials(ask, extractJSON, needPlain, log);

  // --- published results
  let results = prevResults.map((s) => ({ ...s }));
  try {
    const recs = await fetchPubmed({ mock });
    report.resultsFetched = recs.length;
    const known = new Set(results.map((s) => s.pmid).filter(Boolean));
    const fresh = recs.filter((r) => !known.has(r.pmid)).map(pubmedToStory).slice(0, 10);
    await summarizeResults(ask, extractJSON, fresh, log);
    for (const s of fresh) {
      delete s.abstract;
      s.firstSeenAt = nowISO;
    }
    report.newResults = fresh.length;
    results = [...fresh, ...results];
  } catch (err) {
    report.errors.push(`pubmed: ${err.message}`);
    log(`  trials: PubMed fetch failed: ${err.message}`);
  }
  results = results.filter((s) => hoursSince(s.firstSeenAt, nowISO) <= TRIALS.keepDays * 24).slice(0, TRIALS.maxResults);

  log(`trials: registry ${report.registryFetched} fetched, ${report.newTrials} new, ${report.updatedTrials} updated, ${registry.length} tracked · results ${report.resultsFetched} fetched, ${report.newResults} new, ${results.length} listed`);
  const failedBoth = report.errors.length === 2;
  return {
    status: failedBoth ? (prevRegistry.length || prevResults.length ? "kept-previous" : "empty") : report.newTrials || report.newResults || report.updatedTrials ? "updated" : "no-new-stories",
    registry,
    stories: results,
    stats: report,
  };
}
