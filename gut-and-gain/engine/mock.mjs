// Canned responses for testing the engine without API calls (ENGINE_MOCK=1).
// Includes deliberate problems the pipeline must catch: an old story, a missing
// URL, an exact duplicate, a near-duplicate title, and a third story from the
// same company.

const today = () => process.env.ENGINE_TODAY || new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.parse(`${today()}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10);

function story(o) {
  return {
    summary: "Mock summary with numbers (12% vs 8%).",
    tag: "Mock",
    region: "International",
    originalLanguage: "English",
    evidence: "emerging",
    whyItMatters: "Mock takeaway.",
    source: "Mock Journal",
    sourceType: "Journal",
    date: "October 2026",
    published: daysAgo(3),
    ...o,
  };
}

export async function mockAsk(prompt, opts = {}) {
  if (opts.kind === "trial-summaries" || opts.kind === "result-summaries") {
    const arr = JSON.parse(prompt.slice(prompt.indexOf("\n[") + 1));
    return {
      text: JSON.stringify(
        arr.map((x) =>
          opts.kind === "trial-summaries"
            ? { i: x.i, title: `Plain: ${x.title}`.slice(0, 85), summary: "Tests a new approach and measures remission at 12 weeks.", whoFor: "Adults with moderate to severe disease." }
            : { i: x.i, title: `Plain finding: ${x.title}`.slice(0, 95), summary: "Mock plain summary (40% vs 20%).", whyItMatters: "Mock relevance.", evidence: "strong", kind: "Medication", condition: "UC", tag: "Mock" }
        )
      ),
    };
  }
  if (opts.translate) {
    const arr = JSON.parse(prompt.slice(prompt.indexOf("[")));
    return { text: JSON.stringify(arr.map((x) => ({ ...x, title: `[${opts.translate}] ${x.title}` }))) };
  }
  const TOPICS = {
    nightlife: ["alcohol hangovers", "festival dehydration"], gym: ["creatine kidneys", "protein shake emulsifiers"],
    "meds-access": ["biosimilar switching", "drug shortage"], treatments: ["anti-TL1A antibody", "oral pill remission"],
    "surgery-care": ["robotic resection", "intestinal ultrasound"], "diet-living": ["exclusion diet", "fatigue program"],
    symptoms: ["urgency device", "fatigue pill"], eating: ["calorie surplus", "casein bedtime"], training: ["training volume", "sleep recovery"], gut: ["sarcopenia IBD", "grip strength"],
  };
  const [t1, t2] = TOPICS[opts.beat] || ["topic one", "topic two"];
  const k = `${opts.channel}`;
  const day = today();
  const base = `https://example.org/${opts.channel}/${opts.beat}/${day}`;
  const stories = [
    story({ title: `Randomized trial on ${t1} reports clear benefit`, url: `${base}/a`, evidence: "strong", published: daysAgo(2), source: `${t1} Journal` }),
    story({ title: `Cohort links ${t2} to better outcomes in ${k}`, url: `${base}/b?utm_source=x`, source: `${t2} Review` }),
    story({ title: `Ancient ${t1} paper resurfaces`, url: `${base}/old`, published: daysAgo(500) }),
    story({ title: `Unlinked claim about ${t2}`, url: "" }),
  ];
  if (opts.beat === "treatments" || opts.beat === "nightlife") {
    // exact duplicate (same URL after removing tracking params) and a near-duplicate title
    stories.push(story({ title: `Cohort study links ${t2} to better outcomes`, url: `${base}/b`, source: `${t2} Review` }));
    stories.push(story({ title: `Randomized trial on ${t1} reports clear benefits`, url: `${base}/a2`, source: `${t1} Journal` }));
    // three company stories from the same firm: only two may be published
    for (const n of [1, 2, 3]) {
      stories.push(story({ title: `Acme Pharma ${["phase 3 readout", "label expansion", "long-term extension"][n - 1]} for ${opts.beat}`, url: `${base}/co${n}`, sourceType: "Company", source: "ACG 2026 (Acme Pharma)", published: daysAgo(1) }));
    }
  }
  return { text: `Let me search {for this}.\n\n${JSON.stringify({ stories })}` };
}

// ---- ClinicalTrials.gov v2 and PubMed shapes ---------------------------------------
function study({ id, title, status = "RECRUITING", phases = ["PHASE3"], types = ["DRUG"], cond = ["Crohn Disease"], sponsorClass = "INDUSTRY", countries = ["United States", "Netherlands", "Germany"], posted, results = false }) {
  return {
    hasResults: results,
    protocolSection: {
      identificationModule: { nctId: id, briefTitle: title, officialTitle: `Official: ${title}` },
      statusModule: {
        overallStatus: status,
        startDateStruct: { date: "2026-11", type: "ESTIMATED" },
        studyFirstPostDateStruct: { date: posted, type: "ACTUAL" },
        lastUpdatePostDateStruct: { date: posted, type: "ACTUAL" },
        ...(results ? { resultsFirstPostDateStruct: { date: posted, type: "ACTUAL" } } : {}),
      },
      sponsorCollaboratorsModule: { leadSponsor: { name: sponsorClass === "INDUSTRY" ? "Acme Pharma" : "University Medical Center", class: sponsorClass } },
      descriptionModule: { briefSummary: `The purpose of this study is to evaluate ${title.toLowerCase()} in participants with moderately to severely active disease.` },
      conditionsModule: { conditions: cond },
      designModule: { studyType: "INTERVENTIONAL", phases, designInfo: { allocation: "RANDOMIZED" }, enrollmentInfo: { count: 420, type: "ESTIMATED" } },
      armsInterventionsModule: { interventions: types.map((t, k) => ({ type: t, name: `${t.toLowerCase()} intervention ${k + 1}` })) },
      outcomesModule: { primaryOutcomes: [{ measure: "Clinical remission at week 12" }] },
      contactsLocationsModule: { locations: countries.flatMap((c, k) => Array.from({ length: 3 - Math.min(k, 2) }, () => ({ country: c, city: "City" }))) },
    },
  };
}

export async function mockRegistry(nowISO) {
  const d = (n) => new Date(Date.parse(nowISO) - n * 86400000).toISOString().slice(0, 10);
  const slot = Math.floor(Date.parse(nowISO) / (24 * 3600000)); // changes every run (daily)
  return [
    study({ id: "NCT90000001", title: "Oral TL1A Inhibitor for Crohn's Disease", posted: d(3) }),
    study({ id: "NCT90000002", title: "Hypnotherapy for Bowel Urgency in Ulcerative Colitis", types: ["BEHAVIORAL"], phases: ["NA"], cond: ["Ulcerative Colitis"], sponsorClass: "OTHER", countries: ["United Kingdom"], posted: d(5) }),
    study({ id: "NCT90000003", title: "Intestinal Ultrasound-Guided Treat-to-Target Strategy", types: ["DIAGNOSTIC_TEST"], phases: ["NA"], sponsorClass: "OTHER", countries: ["Netherlands", "Belgium"], posted: d(9) }),
    study({ id: "NCT90000004", title: "Withdrawn Study That Must Be Hidden", status: "WITHDRAWN", posted: d(2) }),
    study({ id: "NCT90000005", title: "Vitamin D and Exercise for Fatigue in IBD", types: ["DIETARY_SUPPLEMENT", "BEHAVIORAL"], phases: ["PHASE2"], cond: ["Inflammatory Bowel Diseases"], sponsorClass: "OTHER", countries: ["Australia"], posted: d(1) }),
    study({ id: `NCT9100${String(slot % 1000).padStart(4, "0")}`, title: `Anti-IL-23 Combination Study Wave ${slot % 1000}`, phases: ["PHASE2", "PHASE3"], cond: ["Ulcerative Colitis"], posted: d(0), countries: ["Japan", "South Korea"] }),
    study({ id: "NCT90000006", title: "Completed Phase 3 Trial With New Results", status: "COMPLETED", posted: d(60), results: true, countries: ["Spain", "Italy"] }),
  ];
}

export async function mockPubmed() {
  return [
    { pmid: "99000001", title: "Upadacitinib versus placebo in moderate Crohn's disease: a randomized trial.", journal: "The Lancet Gastroenterology & Hepatology", pubdate: "2026-10-05", pubtypes: ["Journal Article", "Randomized Controlled Trial"], abstract: "BACKGROUND: Test. METHODS: 300 patients. RESULTS: Remission 45% vs 20% (p<0.001). CONCLUSIONS: Effective.", country: "Belgium" },
    { pmid: "99000002", title: "Cognitive behavioural therapy for fatigue in IBD: a meta-analysis.", journal: "Journal of Crohn's and Colitis", pubdate: "2026-09-28", pubtypes: ["Journal Article", "Meta-Analysis"], abstract: "RESULTS: Fatigue scores improved (SMD -0.4).", country: "Netherlands" },
  ];
}
