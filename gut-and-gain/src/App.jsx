import React, { useEffect, useMemo, useState } from "react";
import { CHANNELS, REGIONS, LANGUAGES, SITE_NAME, SITE_TAGLINE, TRACKS } from "./channels.js";
import { SEED, SEED_UPDATED, PLAYBOOK, FIELD_GUIDE } from "./seedData.js";
import { EVIDENCE_LABELS, WHY_LABELS, ACTION_LABELS, SOURCE_LABELS } from "./i18n.js";
import VilliBackground from "./VilliBackground.jsx";

const today = () => new Date().toISOString().slice(0, 10);
const STORE_KEY = (ch) => `lw:last:${ch}`;
const MAX_AGE_MS = 36 * 3600 * 1000;
const LEVEL = { strong: 3, emerging: 2, early: 1 };
const LEVELS = ["strong", "emerging", "early"];
const isIndustry = (s) => s.sourceType === "Company";

// ---- per-viewer conveniences (browser storage is optional) ------------------
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};
function loadSaved(channelId) {
  try {
    const v = JSON.parse(store.get(STORE_KEY(channelId)) || "null");
    if (!v?.stories?.length || Date.now() - new Date(v.generatedAt).getTime() > MAX_AGE_MS) return null;
    return v;
  } catch {
    return null;
  }
}

function initialState(channel) {
  const saved = loadSaved(channel.id);
  return {
    selected: channel.defaultSelected,
    region: "worldwide",
    language: saved?.lang || "en",
    byLang: saved ? { [saved.lang]: saved.stories } : { en: SEED[channel.id] },
    activeLang: saved?.lang || "en",
    baseLang: saved?.lang || "en",
    mode: saved ? "live" : "saved",
    generatedAt: saved?.generatedAt || null,
    loading: false,
    translating: false,
    notice: null,
    expanded: {},
    view: "news",
    showSettings: false,
    evidence: null,
    facet: "All",
    hideIndustry: false,
  };
}

// ---- network --------------------------------------------------------------------
class NoBackend extends Error {}
async function getJSON(url, options = {}, timeoutMs = 150_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, { ...options, signal: ctrl.signal });
  } catch (e) {
    if (e.name === "AbortError") throw new Error("The scan took too long. Try again.");
    throw new NoBackend();
  } finally {
    clearTimeout(timer);
  }
  const isJSON = (res.headers.get("content-type") || "").includes("application/json");
  if (res.status === 404 || !isJSON) throw new NoBackend();
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}
const NO_BACKEND_TEXT =
  "Live scans, translation and deep dives turn on once the site is deployed with its API key (see README). You're reading the saved briefing.";

// ---- small components -------------------------------------------------------------
function Logo() {
  return (
    <svg className="logo" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="13" width="4.6" height="8" rx="1.3" fill="var(--early)" />
      <rect x="9.7" y="8" width="4.6" height="13" rx="1.3" fill="var(--emerging)" />
      <rect x="16.4" y="3" width="4.6" height="18" rx="1.3" fill="var(--strong)" />
    </svg>
  );
}

function Meter({ level, label }) {
  const n = LEVEL[level] || 2;
  return (
    <span className={`meter m-${level}`} title={label}>
      <span className="bars" aria-hidden="true">
        {[1, 2, 3].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}
      </span>
      <span className="meter-label">{label}</span>
    </span>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => store.get("lw:theme") || "system");
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    store.set("lw:theme", theme);
  }, [theme]);
  const next = { system: "light", light: "dark", dark: "system" }[theme];
  const label = { system: "Auto", light: "Light", dark: "Dark" }[theme];
  return (
    <button className="icon-btn" onClick={() => setTheme(next)} aria-label={`Theme: ${label}. Switch to ${next}.`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
      </svg>
      <span className="icon-label">{label}</span>
    </button>
  );
}

// ---- app ----------------------------------------------------------------------------
export default function App() {
  const [channelId, setChannelId] = useState("reality");
  const [guideSide, setGuideSide] = useState("Nightlife");
  const [state, setState] = useState(() =>
    Object.fromEntries(Object.values(CHANNELS).map((ch) => [ch.id, initialState(ch)]))
  );

  const channel = CHANNELS[channelId];
  const cs = state[channelId];
  const patchFor = (id) => (u) =>
    setState((prev) => ({ ...prev, [id]: { ...prev[id], ...(typeof u === "function" ? u(prev[id]) : u) } }));
  const patch = patchFor(channelId);

  const evLabels = EVIDENCE_LABELS[cs.activeLang] || EVIDENCE_LABELS.en;
  const takeawaySet = channel.hasTracks ? ACTION_LABELS : WHY_LABELS;
  const takeawayLabel = (takeawaySet[cs.activeLang] || takeawaySet.en).replace(/[:：]\s*$/, "");

  const stories = cs.byLang[cs.activeLang] || cs.byLang[cs.baseLang] || [];
  const facetKey = channel.hasTracks ? "track" : channelId === "ibd" ? "condition" : null;
  const facetValues = facetKey
    ? (facetKey === "track" ? TRACKS : ["Crohn's", "UC", "IBD"]).filter((v) => stories.some((s) => s[facetKey] === v))
    : [];

  const stats = useMemo(() => {
    const ev = { strong: 0, emerging: 0, early: 0 };
    let industry = 0;
    let words = 0;
    const sources = new Set();
    stories.forEach((s) => {
      ev[s.evidence] = (ev[s.evidence] || 0) + 1;
      if (isIndustry(s)) industry += 1;
      sources.add(s.source);
      words += `${s.title} ${s.summary} ${s.whyItMatters}`.split(/\s+/).length;
    });
    return {
      ev,
      industry,
      independent: stories.length - industry,
      sources: sources.size,
      minutes: Math.max(1, Math.round(words / 220)),
    };
  }, [stories]);

  const shown = stories
    .map((s, idx) => ({ s, idx }))
    .filter(({ s }) => !cs.evidence || s.evidence === cs.evidence)
    .filter(({ s }) => !facetKey || cs.facet === "All" || s[facetKey] === cs.facet)
    .filter(({ s }) => !cs.hideIndustry || !isIndustry(s));
  const filtersOn = cs.evidence || cs.facet !== "All" || cs.hideIndustry;
  const clearFilters = () => patch({ evidence: null, facet: "All", hideIndustry: false });

  const toggleFocus = (id) =>
    patch((s) => ({ selected: s.selected.includes(id) ? s.selected.filter((x) => x !== id) : [...s.selected, id] }));
  const errNotice = (e) =>
    e instanceof NoBackend ? { kind: "info", text: NO_BACKEND_TEXT } : { kind: "error", text: e.message };

  async function runBriefing() {
    const id = channelId;
    const p = patchFor(id);
    p({ loading: true, notice: null, showSettings: false });
    const qs = new URLSearchParams({
      channel: id,
      region: cs.region,
      lang: cs.language,
      focus: [...cs.selected].sort().join(","),
      d: today(),
    });
    try {
      const data = await getJSON(`/api/briefing?${qs}`);
      store.set(STORE_KEY(id), JSON.stringify({ stories: data.stories, generatedAt: data.generatedAt, lang: cs.language }));
      p({
        loading: false,
        mode: "live",
        byLang: { [cs.language]: data.stories },
        activeLang: cs.language,
        baseLang: cs.language,
        generatedAt: data.generatedAt,
        expanded: {},
        view: "news",
      });
    } catch (e) {
      p({ loading: false, notice: errNotice(e) });
    }
  }

  async function showLanguage(code) {
    if (cs.byLang[code]) return patch({ activeLang: code, expanded: {} });
    const id = channelId;
    const p = patchFor(id);
    p({ translating: true, notice: null });
    try {
      const data = await getJSON(
        "/api/translate",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lang: code, stories: cs.byLang[cs.baseLang] }),
        },
        90_000
      );
      p((s) => ({ translating: false, byLang: { ...s.byLang, [code]: data.stories }, activeLang: code, expanded: {} }));
    } catch (e) {
      p({ translating: false, notice: errNotice(e) });
    }
  }

  async function deepDive(idx, story) {
    const id = channelId;
    const setDive = (v) =>
      setState((prev) => ({ ...prev, [id]: { ...prev[id], expanded: { ...prev[id].expanded, [idx]: v } } }));
    setDive({ loading: true });
    const qs = new URLSearchParams({ channel: id, lang: cs.activeLang, title: story.title, tag: story.tag, source: story.source });
    try {
      const data = await getJSON(`/api/deepdive?${qs}`, {}, 120_000);
      setDive({ text: data.text });
    } catch (e) {
      setDive(null);
      patchFor(id)({ notice: errNotice(e) });
    }
  }

  const stamp =
    cs.mode === "live" && cs.generatedAt
      ? `Live scan · ${new Date(cs.generatedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
      : `Saved briefing · checked ${SEED_UPDATED}`;
  const dateline = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const secondView = channelId === "reality" ? "Field guide" : channelId === "gainer" ? "Playbook" : null;
  const total = stories.length || 1;

  return (
    <div className="site" data-ch={channelId}>
      <VilliBackground channelId={channelId} />
      {/* ------------------------------ masthead ------------------------------ */}
      <header className="masthead">
        <div className="wrap mast-inner">
          <a className="brand" href="/" onClick={(e) => { e.preventDefault(); setChannelId("reality"); }}>
            <Logo />
            <span className="brand-name">{SITE_NAME}</span>
          </a>
          <nav className="channels" aria-label="Sections">
            {Object.values(CHANNELS).map((ch) => (
              <button
                key={ch.id}
                data-ch={ch.id}
                className={`ch-link ${ch.id === channelId ? "is-active" : ""}`}
                aria-current={ch.id === channelId ? "page" : undefined}
                onClick={() => setChannelId(ch.id)}
              >
                {ch.name}
              </button>
            ))}
          </nav>
          <div className="mast-tools">
            <label className="lang-pick">
              <span className="sr-only">Read in</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <select value={cs.activeLang} disabled={cs.translating} onChange={(e) => showLanguage(e.target.value)}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </label>
            <ThemeToggle />
          </div>
        </div>
        <div className="dateline">
          <div className="wrap dateline-inner">
            <span>{dateline}</span>
            <span className="dl-tag">{SITE_TAGLINE}</span>
          </div>
        </div>
      </header>

      <main className="wrap layout">
        {/* ---------------------------- section header ---------------------------- */}
        <section className="sec-head">
          <div className="sec-text">
            <div className="kicker">{channel.kicker}</div>
            <h1>{channel.name}</h1>
            <p className="sec-tagline">{channel.tagline}</p>
          </div>
          <div className="sec-actions">
            <button className="btn primary" onClick={runBriefing} disabled={cs.loading}>
              {cs.loading ? "Scanning…" : "Run live scan"}
            </button>
            <button
              className={`btn ghost ${cs.showSettings ? "is-on" : ""}`}
              aria-expanded={cs.showSettings}
              onClick={() => patch({ showSettings: !cs.showSettings })}
            >
              Scan settings
            </button>
          </div>
        </section>

        {(cs.showSettings || cs.loading || cs.notice) && (
          <div className="sec-extra">
            {cs.showSettings && (
              <section className="settings" aria-label="Scan settings">
                <div className="label">Focus</div>
                <div className="chips">
                  {channel.categories.map((c) => (
                    <button
                      key={c.id}
                      className={`chip ${cs.selected.includes(c.id) ? "is-on" : ""}`}
                      aria-pressed={cs.selected.includes(c.id)}
                      title={c.hint}
                      onClick={() => toggleFocus(c.id)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="set-row">
                  <label className="field">
                    <span className="label">Where to look</span>
                    <select value={cs.region} onChange={(e) => patch({ region: e.target.value })}>
                      {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span className="label">Write it in</span>
                    <select value={cs.language} onChange={(e) => patch({ language: e.target.value })}>
                      {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </label>
                </div>
              </section>
            )}
            {cs.loading && (
              <div className="notice info" role="status">
                Searching journals, regulators and conference news worldwide. This takes 30–90 seconds.
              </div>
            )}
            {cs.notice && <div className={`notice ${cs.notice.kind}`} role="status">{cs.notice.text}</div>}
          </div>
        )}

        {/* -------------------------- sidebar: evidence bar -------------------------- */}
        <aside className="side" aria-label="About this briefing">
          <div className="panel ev-panel">
            <div className="panel-title">Evidence behind this briefing</div>
            <div className="ev-bar">
              {LEVELS.map((lvl) =>
                stats.ev[lvl] ? (
                  <button
                    key={lvl}
                    className={`seg s-${lvl} ${cs.evidence && cs.evidence !== lvl ? "dim" : ""}`}
                    style={{ flexGrow: stats.ev[lvl] }}
                    onClick={() => patch({ evidence: cs.evidence === lvl ? null : lvl, view: "news" })}
                    aria-label={`${evLabels[lvl]}: ${stats.ev[lvl]} stories. Show only these.`}
                  >
                    {Math.round((stats.ev[lvl] / total) * 100)}%
                  </button>
                ) : null
              )}
            </div>
            <ul className="ev-legend">
              {LEVELS.map((lvl) => (
                <li key={lvl}>
                  <button
                    className={`legend-row ${cs.evidence === lvl ? "is-on" : ""}`}
                    disabled={!stats.ev[lvl]}
                    aria-pressed={cs.evidence === lvl}
                    onClick={() => patch({ evidence: cs.evidence === lvl ? null : lvl, view: "news" })}
                  >
                    <span className={`dot d-${lvl}`} />
                    <span className="lg-name">{evLabels[lvl]}</span>
                    <span className="lg-count">{stats.ev[lvl]}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="panel-sub">Who's behind the stories</div>
            <div className="mix-bar" aria-hidden="true">
              <span className="mix-ind" style={{ flexGrow: stats.independent || 0.001 }} />
              <span className="mix-co" style={{ flexGrow: stats.industry || 0.001 }} />
            </div>
            <div className="mix-legend">
              <span><b>{stats.independent}</b> independent</span>
              <span className="co"><b>{stats.industry}</b> industry-sourced</span>
            </div>
            {stats.industry > 0 && (
              <label className="switch">
                <input
                  type="checkbox"
                  checked={cs.hideIndustry}
                  onChange={(e) => patch({ hideIndustry: e.target.checked, view: "news" })}
                />
                <span className="track-ui" aria-hidden="true" />
                <span>Hide industry-sourced</span>
              </label>
            )}
          </div>

          {facetValues.length > 1 && (
            <div className="panel facet-panel">
              <div className="panel-title">{facetKey === "track" ? "Situation" : "Condition"}</div>
              <div className="facet">
                {["All", ...facetValues].map((v) => (
                  <button
                    key={v}
                    className={`facet-btn ${cs.facet === v ? "is-on" : ""}`}
                    aria-pressed={cs.facet === v}
                    onClick={() => patch({ facet: v, view: "news" })}
                  >
                    {v}
                    <span>{v === "All" ? stories.length : stories.filter((s) => s[facetKey] === v).length}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="panel how">
            <div className="panel-title">How we rate evidence</div>
            <dl>
              <div><dt><Meter level="strong" label="Strong" /></dt><dd>Randomized trials, meta-analyses, regulatory decisions</dd></div>
              <div><dt><Meter level="emerging" label="Emerging" /></dt><dd>Smaller, open-label or observational human studies</dd></div>
              <div><dt><Meter level="early" label="Early" /></dt><dd>Animal, cell or single-arm pilot data</dd></div>
            </dl>
            <p><span className="flag">Industry source</span> The information comes from the company that makes the product.</p>
          </div>
        </aside>

        {/* ------------------------------ main column ------------------------------ */}
        <section className="main" aria-live="polite">
          <div className="briefing-bar">
            <div className="bb-left">
              <span className="bb-title">Daily briefing</span>
              <span className="bb-stats">
                <b>{stories.length}</b> stories <i>·</i> <b>{stats.sources}</b> sources <i>·</i> <b>{stats.minutes}</b> min read
              </span>
            </div>
            <span className="bb-stamp">{cs.translating ? "Translating…" : stamp}</span>
          </div>

          {secondView && (
            <div className="subtabs" role="tablist" aria-label="View">
              {["news", "second"].map((v) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={cs.view === v}
                  className={`subtab ${cs.view === v ? "is-on" : ""}`}
                  onClick={() => patch({ view: v })}
                >
                  {v === "news" ? "News" : secondView}
                  <span>{v === "news" ? stories.length : channelId === "reality" ? FIELD_GUIDE.length : PLAYBOOK.length}</span>
                </button>
              ))}
            </div>
          )}

          {cs.view === "news" && (
            <>
              {filtersOn && (
                <div className="filter-note">
                  Showing {shown.length} of {stories.length} stories
                  <button onClick={clearFilters}>Clear filters</button>
                </div>
              )}
              <div className="feed">
                {shown.map(({ s, idx }, i) => {
                  const dive = cs.expanded[idx];
                  return (
                    <article key={`${cs.activeLang}-${idx}`} className={`story ${i === 0 && !filtersOn ? "lead" : ""}`} lang={cs.activeLang}>
                      <div className="story-meta">
                        {s.track && <span className="pill track">{s.track}</span>}
                        {s.condition && <span className="pill cond">{s.condition}</span>}
                        <span className="meta-text">
                          {s.region}
                          {s.originalLanguage && !/^english$/i.test(s.originalLanguage) ? ` · orig. ${s.originalLanguage}` : ""}
                          <span className="sep">·</span>
                          <time>{s.date}</time>
                        </span>
                        <Meter level={s.evidence} label={evLabels[s.evidence] || s.evidence} />
                      </div>
                      <h2 className="story-title">{s.title}</h2>
                      <p className="story-dek">{s.summary}</p>
                      <div className="takeaway">
                        <span className="tk-label">{takeawayLabel}</span>
                        <p>{s.whyItMatters}</p>
                      </div>
                      <div className="story-foot">
                        <span className="src">
                          <span className="src-type">{s.sourceType || "Source"}</span>
                          <span className="src-name">{s.source}</span>
                          {isIndustry(s) && <span className="flag">Industry source</span>}
                        </span>
                        <span className="actions">
                          {s.url && (
                            <a className="btn small" href={s.url} target="_blank" rel="noopener noreferrer">
                              {SOURCE_LABELS[cs.activeLang] || "Source"} ↗
                            </a>
                          )}
                          {!dive && (
                            <button className="btn small ghost" onClick={() => deepDive(idx, s)}>Deep dive</button>
                          )}
                        </span>
                      </div>
                      {dive && <div className="dive">{dive.loading ? <em>Reading the research…</em> : dive.text}</div>}
                    </article>
                  );
                })}
                {!shown.length && (
                  <div className="empty">
                    No stories match these filters.
                    <button onClick={clearFilters}>Clear filters</button>
                  </div>
                )}
              </div>
            </>
          )}

          {cs.view === "second" && channelId === "reality" && (
            <section className="guide" aria-label="Field guide">
              <div className="guide-head">
                <p>Practical tips and tools from Dutch, Belgian, German, UK and European IBD care, each linked to its source.</p>
                <div className="seg-ctl" role="tablist" aria-label="Field guide section">
                  {["Nightlife", "Lifting"].map((side) => (
                    <button
                      key={side}
                      role="tab"
                      aria-selected={guideSide === side}
                      className={guideSide === side ? "is-on" : ""}
                      onClick={() => setGuideSide(side)}
                    >
                      {side}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="tips">
                {FIELD_GUIDE.filter((t) => t.side === guideSide).map((t) => (
                  <li key={t.title} className="tip">
                    <span className="origin">{t.origin}</span>
                    <div>
                      <h3>{t.title}</h3>
                      <p>{t.body}</p>
                      <a className="tip-src" href={t.url} target="_blank" rel="noopener noreferrer">{t.source} ↗</a>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {cs.view === "second" && channelId === "gainer" && (
            <section className="guide" aria-label="Playbook">
              <div className="guide-head">
                <p>The fundamentals of gaining weight and muscle change slowly, so they live here. The News tab is what's new.</p>
              </div>
              <ul className="tips">
                {PLAYBOOK.map((p) => (
                  <li key={p.title} className="tip">
                    <Meter level={p.evidence} label={p.evidence.charAt(0).toUpperCase() + p.evidence.slice(1)} />
                    <div>
                      <h3>{p.title}</h3>
                      <p>{p.body}</p>
                      {p.url ? (
                        <a className="tip-src" href={p.url} target="_blank" rel="noopener noreferrer">{p.source} ↗</a>
                      ) : (
                        <span className="tip-src">{p.source}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      </main>

      <footer className="site-foot">
        <div className="wrap foot-inner">
          <div className="foot-brand"><Logo /> {SITE_NAME}</div>
          <p>
            Informational only, not medical advice.{" "}
            {channelId === "gainer"
              ? "If you have IBD or another medical condition, check diet and supplement changes with your care team."
              : "Make treatment decisions with your gastroenterologist."}{" "}
            Summaries and translations are AI-written; check the source before relying on any figure.
            {channelId === "reality" && (
              <>
                {" "}For drug-checking and harm-reduction information, see{" "}
                <a href="https://dancesafe.org" target="_blank" rel="noopener noreferrer">DanceSafe</a>. If someone is very unwell,
                call emergency services.
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
