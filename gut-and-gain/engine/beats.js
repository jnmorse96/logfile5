// What the engine searches for. It runs once a day; each channel runs a few
// focused "beats" (combinations of its focus areas) so every category is
// covered on every run. Edit freely: ids must match the category ids in
// src/channels.js.
//
// Regions: unless a beat pins one with `region`, each run rotates every beat
// through REGION_ROTATION, so each topic is searched in every part of the
// world within a few days.
//
// `extra` adds beat-specific instructions to the search.
//
// Cost guide: one beat is one web-search scan (roughly a few cents).

export const REGION_ROTATION = ["worldwide", "europe", "asia", "namerica", "netherlands", "latam"];

export const BEATS = {
  reality: [
    { id: "nightlife", label: "Nightlife", focus: ["nightlife"], max: 4 },
    { id: "gym", label: "Gym", focus: ["gym"], max: 4 },
    { id: "meds-access", label: "Meds, access & setbacks", focus: ["meds", "access", "setbacks"], max: 4 },
  ],
  ibd: [
    { id: "treatments", label: "Treatments & research", focus: ["treatments", "science", "crohns", "uc"], max: 4 },
    { id: "surgery-care", label: "Surgery & monitoring", focus: ["surgery", "management"], max: 4 },
    { id: "diet-living", label: "Diet & living with IBD", focus: ["diet", "living"], max: 4 },
    {
      id: "symptoms",
      label: "New trials & symptom management",
      focus: ["treatments", "management", "living"],
      max: 4,
      extra:
        "Focus specifically on NEW clinical trial results (phase 2, phase 3, and real-world studies) for new medications, and on new evidence-based ways to manage symptoms: bowel urgency, diarrhea, abdominal pain, fatigue, perianal disease, joint and skin symptoms, sleep, anxiety and depression. Include drugs, devices, diet, exercise and psychological programs. Give the trial name or registry number when the source does.",
    },
  ],
  gainer: [
    { id: "eating", label: "Calories, protein & supplements", focus: ["calories", "protein", "supplements"], max: 4 },
    { id: "training", label: "Training & recovery", focus: ["training", "recovery"], max: 4 },
    { id: "gut", label: "Gaining with IBD", focus: ["gut"], max: 4 },
  ],
};

// Edition shape per channel.
export const EDITION = {
  runHours: 24,     // how often the engine runs (set the matching cron in .github/workflows)
  newHours: 30,     // stories first seen within this window get the "New" badge
  target: 14,       // stories per channel in the rolling feed (newest first)
  perRun: 8,        // max new stories added per channel per run
  carryDays: 7,     // how long a story stays in the feed
  dedupeDays: 30,   // never re-publish something covered in this window
  maxAgeDays: 365,  // drop anything published longer ago than this
  companyCap: 2,    // max stories per company in one channel
  archiveKeep: 120, // days listed in the archive index
};
