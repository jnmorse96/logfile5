// Shared config: imported by the React app AND the serverless functions,
// so the server only ever builds prompts from these whitelisted values.

export const SITE_NAME = "Gut & Gain";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
];

export const REGIONS = [
  {
    id: "worldwide",
    label: "Worldwide",
    search:
      "Search GLOBALLY, not just US/English sources. Deliberately look for developments from Europe (EMA, ECCO, UEG, ESPEN, national research groups), Japan, South Korea, China, Australia/NZ, Israel, Latin America, and international bodies (WHO, Cochrane). Run at least one search aimed at non-US coverage.",
  },
  { id: "namerica", label: "North America", search: "Focus on the US and Canada: FDA, Health Canada, AGA, ACG, and North American universities and hospitals." },
  {
    id: "netherlands",
    label: "Netherlands & Belgium",
    search:
      "Focus on the Netherlands and Belgium. Search in Dutch as well as English. Look at Crohn & Colitis NL, Maag Lever Darm Stichting, NVMDL guidelines, Dutch university hospitals (Amsterdam UMC, Erasmus MC, UMCG, Radboudumc, Maastricht UMC+, LUMC, UMC Utrecht), the Trimbos Institute and Jellinek, and Belgian groups (Crohn-Colitis ulcerosa Vereniging, BIRD).",
  },
  { id: "europe", label: "Europe", search: "Focus on Europe: EMA, ECCO, UEG, ESPEN, BSG, and European universities and hospitals." },
  { id: "asia", label: "Asia-Pacific", search: "Focus on Asia-Pacific: Japan (PMDA), South Korea, China, India, Australia/NZ (TGA, GESA)." },
  { id: "latam", label: "Latin America", search: "Focus on Latin America: ANVISA (Brazil), COFEPRIS (Mexico), PANCCO and Latin American research groups." },
];

export const SITE_TAGLINE = "The honest briefing for IBD and hard gainers";

export const TRACKS = ["Nightlife", "Gym", "Meds", "Access"];

export const CHANNELS = {
  reality: {
    id: "reality",
    kicker: "Brace for it",
    name: "Reality Check",
    tagline:
      "What people with Crohn's and colitis don't always get told about nights out, the gym and their meds, and what you can actually do about each.",
    accent: "#E27FA6",
    defaultSelected: ["nightlife", "gym", "meds"],
    hasTracks: true,
    categories: [
      { id: "nightlife", label: "Nightlife", hint: "alcohol, smoking and vaping, cannabis, sleep loss, dehydration, recreational substances (interactions and harm reduction only, never dosing), late-night eating" },
      { id: "gym", label: "Gym", hint: "steroids and muscle loss, SARMs and anabolic products, supplement contamination, emulsifiers and sweeteners in shakes, ostomy and hernia risk, fatigue and anemia" },
      { id: "meds", label: "Meds & safety", hint: "side effects, FDA/EMA safety warnings, drug interactions, infection and cancer risks, withdrawals" },
      { id: "access", label: "Access & costs", hint: "drug shortages, insurance and step therapy, biosimilar switching, price changes" },
      { id: "setbacks", label: "Setbacks", hint: "failed or stopped trials, null results, disappointing long-term data" },
    ],
  },
  ibd: {
    id: "ibd",
    kicker: "IBD watch",
    name: "IBD Watch",
    tagline:
      "Crohn's disease and ulcerative colitis news from around the world: new drugs and trials, surgery, monitoring, diet, and research on living well with IBD.",
    accent: "#7FB6D9",
    defaultSelected: ["crohns", "uc", "treatments"],
    categories: [
      { id: "crohns", label: "Crohn's disease", hint: "Crohn's disease specifically" },
      { id: "uc", label: "Ulcerative colitis", hint: "ulcerative colitis specifically, including pouch and proctitis" },
      { id: "treatments", label: "New treatments", hint: "IL-23, anti-TL1A, JAK, S1P, oral small molecules, biosimilars, approvals, phase 2/3 trials, combination therapy" },
      { id: "surgery", label: "Surgery", hint: "Kono-S, mesenteric excision, bowel-sparing and robotic surgery, J-pouch, perianal fistula repair" },
      { id: "management", label: "Monitoring & care", hint: "treat-to-target, guidelines (ECCO, AGA, ACG, BSG), calprotectin, intestinal ultrasound, drug levels" },
      { id: "diet", label: "Diet & nutrition", hint: "Crohn's disease exclusion diet, enteral nutrition, malnutrition, weight and muscle loss" },
      { id: "living", label: "Living with IBD", hint: "quality of life, fatigue, mental health, exercise, work, pregnancy" },
      { id: "science", label: "Research", hint: "genetics, microbiome, cell therapies, prevention" },
    ],
  },
  gainer: {
    id: "gainer",
    kicker: "Hard gainer wellness",
    name: "Hard Gainer",
    tagline:
      "Research on gaining weight and lean muscle when it doesn't come easily, including when a gut condition makes eating enough harder.",
    accent: "#E0A83C",
    defaultSelected: ["calories", "protein", "training", "supplements"],
    categories: [
      { id: "calories", label: "Calories & appetite", hint: "energy surplus size, rate of gain, appetite, energy-dense and liquid calories" },
      { id: "protein", label: "Protein & meals", hint: "protein amount, distribution, sources, meal timing" },
      { id: "training", label: "Training", hint: "resistance training for hypertrophy, volume, frequency, cardio interference" },
      { id: "supplements", label: "Supplements", hint: "creatine, protein powders, mass gainers, other evidence-backed aids" },
      { id: "recovery", label: "Sleep & recovery", hint: "sleep, stress and recovery effects on muscle gain" },
      { id: "gut", label: "Gaining with IBD", hint: "weight and muscle gain with IBD or other GI conditions, sarcopenia, malnutrition, oral nutrition supplements" },
    ],
  },
};

export const EVIDENCE = ["strong", "emerging", "early"];

export const SOURCE_TYPES = ["Journal", "Conference", "Regulator", "Patient group", "Company", "News"];
