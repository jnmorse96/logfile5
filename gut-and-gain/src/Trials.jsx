import React from "react";

// Trial Tracker: list and sidebar for registry entries (ClinicalTrials.gov),
// filled by engine/trials.mjs. Published results use the normal story feed.

export const KINDS = ["Medication", "Symptom management", "Care & monitoring"];
const KIND_CLASS = { Medication: "k-med", "Symptom management": "k-sym", "Care & monitoring": "k-care" };
export const EMPTY_TRIAL_FILTER = { kind: "All", phase: "All", status: "All", cond: "All", sponsor: "All" };

export function phaseBucket(p) {
  if (!p) return "Not stated";
  if (p === "N/A") return "No phase (non-drug)";
  const nums = (p.match(/\d/g) || []).map(Number);
  return nums.length ? `Phase ${Math.max(...nums)}` : "Not stated";
}
const PHASE_ORDER = ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "No phase (non-drug)", "Not stated"];

function countBy(list, fn) {
  const m = new Map();
  for (const x of list) for (const k of [].concat(fn(x))) m.set(k, (m.get(k) || 0) + 1);
  return m;
}

export function filterTrials(registry, f) {
  return registry.filter(
    (t) =>
      (f.kind === "All" || t.kind === f.kind) &&
      (f.phase === "All" || phaseBucket(t.phase) === f.phase) &&
      (f.status === "All" || (t.status || "Not stated") === f.status) &&
      (f.cond === "All" || (t.conditions || []).includes(f.cond)) &&
      (f.sponsor === "All" || (f.sponsor === "Industry" ? t.industry : !t.industry))
  );
}

function Facet({ title, value, options, counts, onPick }) {
  const present = options.filter((o) => counts.get(o));
  if (present.length < 2) return null;
  return (
    <div className="panel">
      <div className="panel-title">{title}</div>
      <div className="facet">
        {["All", ...present].map((o) => (
          <button key={o} className={`facet-btn ${value === o ? "is-on" : ""}`} aria-pressed={value === o} onClick={() => onPick(o)}>
            {o}
            <span>{o === "All" ? [...counts.values()].reduce((a, b) => a + b, 0) : counts.get(o)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TrialsSide({ registry, f, setF }) {
  const kinds = countBy(registry, (t) => t.kind);
  const total = registry.length || 1;
  const industry = registry.filter((t) => t.industry).length;
  const statuses = countBy(registry, (t) => t.status || "Not stated");
  return (
    <>
      <div className="panel ev-panel">
        <div className="panel-title">What's being tested</div>
        <div className="ev-bar">
          {KINDS.map((k) =>
            kinds.get(k) ? (
              <button
                key={k}
                className={`seg ${KIND_CLASS[k]} ${f.kind !== "All" && f.kind !== k ? "dim" : ""}`}
                style={{ flexGrow: kinds.get(k) }}
                onClick={() => setF({ kind: f.kind === k ? "All" : k })}
                aria-label={`${k}: ${kinds.get(k)} trials. Show only these.`}
              >
                {Math.round((kinds.get(k) / total) * 100)}%
              </button>
            ) : null
          )}
        </div>
        <ul className="ev-legend">
          {KINDS.map((k) => (
            <li key={k}>
              <button className={`legend-row ${f.kind === k ? "is-on" : ""}`} disabled={!kinds.get(k)} aria-pressed={f.kind === k}
                onClick={() => setF({ kind: f.kind === k ? "All" : k })}>
                <span className={`dot ${KIND_CLASS[k]}`} />
                <span className="lg-name">{k === "Medication" ? "New medications" : k}</span>
                <span className="lg-count">{kinds.get(k) || 0}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="panel-sub">Who's running them</div>
        <div className="mix-bar" aria-hidden="true">
          <span className="mix-ind" style={{ flexGrow: registry.length - industry || 0.001 }} />
          <span className="mix-co" style={{ flexGrow: industry || 0.001 }} />
        </div>
        <div className="mix-legend">
          <span><b>{registry.length - industry}</b> academic & other</span>
          <span className="co"><b>{industry}</b> industry</span>
        </div>
      </div>
      <Facet title="Phase" value={f.phase} options={PHASE_ORDER} counts={countBy(registry, (t) => phaseBucket(t.phase))} onPick={(v) => setF({ phase: v })} />
      <Facet title="Status" value={f.status} options={[...statuses.keys()]} counts={statuses} onPick={(v) => setF({ status: v })} />
      <Facet title="Condition" value={f.cond} options={["Crohn's", "UC", "IBD"]} counts={countBy(registry, (t) => t.conditions || [])} onPick={(v) => setF({ cond: v })} />
      <div className="panel how">
        <div className="panel-title">About the tracker</div>
        <p style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
          Trials come from the ClinicalTrials.gov registry, which lists studies run around the world, and results from
          newly indexed PubMed trials. Both are checked every 12 hours. Interested in joining a trial? Ask your IBD team;
          the listing shows contacts for each site.
        </p>
      </div>
    </>
  );
}

function countriesText(c = []) {
  if (!c.length) return "Sites not listed yet";
  if (c.length <= 3) return c.join(", ");
  return `${c.slice(0, 2).join(", ")} +${c.length - 2} countries`;
}
const badge = (t) => (t.change === "results" ? "Results posted" : t.change === "status" ? "Updated" : "New");

export function TrialList({ trials, total, onClear }) {
  if (!trials.length) {
    return (
      <div className="empty">
        No trials match these filters.
        <button onClick={onClear}>Clear filters</button>
      </div>
    );
  }
  return (
    <div className="feed">
      {trials.length < total && (
        <div className="filter-note">
          Showing {trials.length} of {total} trials
          <button onClick={onClear}>Clear filters</button>
        </div>
      )}
      {trials.map((t) => (
        <article key={t.id} className="story trial">
          <div className="story-meta">
            {t.isNew && <span className="pill new">{badge(t)}</span>}
            <span className={`pill kind ${KIND_CLASS[t.kind] || ""}`}>{t.kind}</span>
            {(t.conditions || []).map((c) => <span key={c} className="pill cond">{c}</span>)}
            <span className="meta-text">{countriesText(t.countries)}</span>
            {t.phase && <span className="phase-tag">{t.phase === "N/A" ? "No phase" : t.phase}</span>}
          </div>
          <h2 className="story-title">{t.plain?.title || t.title}</h2>
          <p className="story-dek">{t.plain?.summary || t.summary}</p>
          {t.whoFor && (
            <div className="takeaway">
              <span className="tk-label">Who it's for</span>
              <p>{t.whoFor}</p>
            </div>
          )}
          <dl className="trial-facts">
            {t.interventions?.length > 0 && (
              <div><dt>Testing</dt><dd>{t.interventions.map((i) => `${i.name} (${i.type.toLowerCase()})`).join(" · ")}</dd></div>
            )}
            {t.status && <div><dt>Status</dt><dd className={/recruiting|invitation/i.test(t.status) && !/not recruiting/i.test(t.status) ? "open" : ""}>{t.status}</dd></div>}
            {t.enrollment ? <div><dt>Size</dt><dd>{t.enrollment.toLocaleString()} people</dd></div> : null}
            {t.primaryOutcome && <div><dt>Main measure</dt><dd>{t.primaryOutcome}</dd></div>}
            {t.firstPosted && <div><dt>Registered</dt><dd>{t.firstPosted}</dd></div>}
          </dl>
          <div className="story-foot">
            <span className="src">
              <span className="src-type">Registry</span>
              <span className="src-name">{t.sponsor || t.sourceNote || "Sponsor not listed"}</span>
              {t.industry && <span className="flag">Industry-sponsored</span>}
            </span>
            <span className="actions">
              <a className="btn small" href={t.url} target="_blank" rel="noopener noreferrer">
                {String(t.id).startsWith("NCT") ? t.id : "Listing"} ↗
              </a>
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
