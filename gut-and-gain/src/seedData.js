// Saved briefings shown the moment the site opens, with no API key or backend.
// Every story is a real, published study, trial or conference result, linked
// to where it was reported, newest first. Summaries are paraphrased; check the
// source before quoting a figure. Last checked: October 13, 2026.

export const SEED_UPDATED = "October 13, 2026";

export const SEED = {
  // Reality Check: "whyItMatters" holds the "What you can do" text for this channel.
  reality: [
    {
      title: "Vaping or heated tobacco won't protect you after Crohn's surgery",
      summary:
        "In 937 people who had ileocolic resection at 9 centers in Italy, Spain and France, Crohn's had returned on endoscopy within a year in 69.4% of cigarette smokers, 63.9% of heated-tobacco users and 60.6% of e-cigarette users, versus 40.8% of non-smokers. Quitting at the time of surgery helped less than quitting more than a year before (60.0% vs 44.4% recurrence).",
      tag: "Vaping & smoking",
      track: "Nightlife",
      condition: "Crohn's",
      region: "Italy · Spain · France",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "If you smoke or vape on nights out, switching products isn't the fix; stopping is. The earlier before surgery you stop, the better. Ask your GI team for quit support.",
      sourceType: "Journal",
      source: "American Journal of Gastroenterology 2026; 121(8)",
      date: "August 2026",
      url: "https://www.hmpgloballearningnetwork.com/site/aibd-nppa/research-report/heat-not-burn-tobacco-linked-crohns-disease-recurrence-after-surgery",
    },
    {
      title: "Your sleep may fall apart weeks before a flare",
      summary:
        "Mount Sinai researchers followed more than 100 people with IBD for about seven months using Apple Watches, Fitbits and Oura rings. Less REM and more light sleep showed up only when there was real inflammation, and sleep worsened over the six weeks before a flare.",
      tag: "Sleep",
      track: "Nightlife",
      condition: "IBD",
      region: "USA",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "This shows sleep tracks inflammation; it doesn't prove late nights cause flares. Still, if your tracker shows weeks of worse sleep you can't explain, tell your GI team before symptoms hit.",
      sourceType: "Journal",
      source: "Clinical Gastroenterology and Hepatology (Mount Sinai)",
      date: "March 2026",
      url: "https://sleepreviewmag.com/sleep-health/sleep-whole-body/wearable-data-sleep-disruption-ibd-inflammation/",
    },
    {
      title: "Cannabis may ease symptoms while inflammation keeps going",
      summary:
        "Matched against non-users, people with IBD who used cannabis had active inflammation on endoscopy more often (69.4% vs 50%). Their procedures ran longer (41 vs 33.5 minutes) and needed more total sedation. It was a small, retrospective study of 124 people at one center.",
      tag: "Cannabis",
      track: "Nightlife",
      condition: "IBD",
      region: "USA",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "Feeling better isn't the same as healing, so keep your monitoring tests. Tell your GI team and anesthetist about cannabis use before a scope.",
      sourceType: "Journal",
      source: "Crohn's & Colitis 360",
      date: "July 2025",
      url: "https://academic.oup.com/crohnscolitis360/article/7/3/otaf034/8181141",
    },
    {
      title: "Drinking: many people with Crohn's feel worse, and some meds make it riskier",
      summary:
        "Surveys found 40–55% of people with Crohn's report worse symptoms after alcohol, with beer a common culprit. In UC, sulfite-containing wine and beer tracked with disease activity, but spirits didn't. Heavy drinking on methotrexate speeds liver damage, and alcohol with metronidazole can cause a severe reaction.",
      tag: "Alcohol",
      track: "Nightlife",
      condition: "IBD",
      region: "International",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "Know your meds: avoid heavy drinking on methotrexate and any alcohol on metronidazole. If you drink, note which drinks hit you, alternate with water, and don't drink on an empty gut.",
      sourceType: "Journal",
      source: "Gastroenterology & Hepatology review (known for years)",
      date: "2021",
      url: "https://www.gastroenterologyandhepatology.net/archives/may-2021/alcohol-use-in-patients-with-inflammatory-bowel-disease/",
    },
    {
      title: "With an ileostomy, a night of drinking and dancing can dehydrate you fast",
      summary:
        "In a two-center cohort of 277 people with a temporary ileostomy, 18% developed acute kidney injury. These were rectal-cancer patients, not IBD patients, but the physiology is the same: an ileostomy loses fluid and salt that the colon would normally reabsorb, and alcohol, heat and sweating add to it.",
      tag: "Ostomy",
      track: "Nightlife",
      condition: "IBD",
      region: "France · Morocco",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "Drink an oral rehydration solution, not just water, before and during a night out. Watch your output, and if you're dizzy, barely peeing or your output is unusually high, get help.",
      sourceType: "Journal",
      source: "BMC Surgery",
      date: "2023",
      url: "https://bmcsurg.biomedcentral.com/articles/10.1186/s12893-023-02016-4",
    },
    {
      title: "Ibuprofen for the hangover? It's been linked to flares",
      summary:
        "In 35,031 US veterans with IBD, NSAID users were 24% more likely to flare (HR 1.24), with risk highest in the first two weeks after starting. The authors note part of this may be confounding, since people already heading into a flare may reach for painkillers.",
      tag: "Painkillers",
      track: "Meds",
      condition: "IBD",
      region: "USA",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "Ask your GI team which painkiller to keep at home. Many IBD teams prefer acetaminophen (paracetamol) for occasional aches.",
      sourceType: "Journal",
      source: "American Journal of Gastroenterology 2022",
      date: "2022",
      url: "https://gi.org/?p=51343",
    },
    {
      title: "The emulsifiers in your shakes and bars may be working against your gut",
      summary:
        "In the randomized, double-blind ADDapt trial (154 people with active Crohn's at 19 UK hospitals), those on a low-emulsifier diet were three times more likely to see symptoms improve and twice as likely to reach remission as those given the same foods with emulsifiers added back.",
      tag: "Emulsifiers",
      track: "Gym",
      condition: "Crohn's",
      region: "UK",
      originalLanguage: "English",
      evidence: "strong",
      whyItMatters:
        "Protein bars, ready-to-drink shakes and mass gainers often contain emulsifiers like carrageenan, polysorbate 80 and carboxymethylcellulose (cellulose gum). Read labels, and ask an IBD dietitian before cutting foods broadly.",
      sourceType: "Conference",
      source: "ADDapt trial, King's College London (ECCO and DDW 2025)",
      date: "February 2025",
      url: "https://www.kcl.ac.uk/news/new-research-presented-at-ecco-congress-on-low-emulsifier-diet-and-crohns-disease",
    },
    {
      title: "SARMs and 'research chemicals' can injure your liver",
      summary:
        "In December 2025 warning letters, the FDA said life-threatening reactions including liver toxicity have occurred with SARMs like LGD-4033, RAD-140, S-4 and YK-11, and that they may raise heart attack and stroke risk. They're unapproved drugs, even when sold as 'research only.'",
      tag: "SARMs",
      track: "Gym",
      condition: "",
      region: "USA",
      originalLanguage: "English",
      evidence: "strong",
      whyItMatters:
        "Skip them. Several IBD medicines are already monitored with liver tests, so you don't want an extra liver risk. Creatine, protein and a calorie surplus are the evidence-based route.",
      sourceType: "Regulator",
      source: "U.S. Food and Drug Administration",
      date: "December 2025",
      url: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/titan-sarms-llc-719645-12122025",
    },
    {
      title: "Losing muscle doubles the odds your treatment fails",
      summary:
        "Across 17 studies and 2,895 people with IBD, sarcopenia was linked to twice the odds of treatment failure (OR 2.00) and higher odds of needing surgery (OR 1.54). This held in both Crohn's and UC.",
      tag: "Muscle & outcomes",
      track: "Gym",
      condition: "IBD",
      region: "Spain",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "Muscle isn't vanity here; it's tied to how well treatment works. Lifting and enough protein are part of looking after your IBD. See the Hard Gainer playbook.",
      sourceType: "Journal",
      source: "Revista Española de Enfermedades Digestivas",
      date: "2024",
      url: "https://www.reed.es/sarcopenia-and-treatment-failure-in-inflammatory-bowel-disease-a-systematic-review-and-meta-analysis13150",
    },
    {
      title: "Steroids can eat your muscle and bone, and they're not a long-term fix",
      summary:
        "Corticosteroids like prednisone can cause muscle weakness, osteoporosis and osteonecrosis (loss of blood flow to joints, especially the hip), along with weight gain and mood swings. IBD specialists don't use them as maintenance therapy.",
      tag: "Steroids",
      track: "Gym",
      condition: "IBD",
      region: "Canada",
      originalLanguage: "English",
      evidence: "strong",
      whyItMatters:
        "Expect training to feel harder during a steroid course and don't chase PRs. If you keep needing steroids, that's a sign to discuss a different long-term treatment with your GI.",
      sourceType: "Patient group",
      source: "Crohn's and Colitis Canada (known for years)",
      date: "Established",
      url: "https://crohnsandcolitis.ca/about-crohn-s-colitis/ibd-journey/Treatment-and-Medications/Steroids",
    },
    {
      title: "With a stoma, heavy lifting raises your hernia risk",
      summary:
        "Up to 70% of people with a stoma develop a parastomal hernia, and straining from heavy lifting is a known risk factor. The usual guidance is no heavy lifting for the first three months after surgery, then a support garment and good technique for heavy lifts.",
      tag: "Ostomy & lifting",
      track: "Gym",
      condition: "IBD",
      region: "UK",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "You can still train. Rebuild your core with a stoma nurse or specialist physio before going heavy, and wear a support belt for big lifts.",
      sourceType: "Patient group",
      source: "Colostomy UK",
      date: "December 2025",
      url: "https://www.colostomyuk.org/wp-content/uploads/2025/12/Parastomal-Hernias.pdf",
    },
    {
      title: "If the gym feels harder than it should, check your iron",
      summary:
        "Recent studies put iron deficiency at 23.7–43.4% of people with IBD. A 2025 review found it likely contributes to fatigue but doesn't explain all of it, and the evidence is low-certainty.",
      tag: "Iron & fatigue",
      track: "Gym",
      condition: "IBD",
      region: "International",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "Ask for ferritin and iron tests, not just hemoglobin. Iron deficiency can show up before anemia does.",
      sourceType: "Journal",
      source: "PLoS ONE",
      date: "January 2025",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11730394",
    },
  ],

  ibd: [
    {
      title: "Injectable infliximab beat IV infliximab in Crohn's of the small intestine",
      summary:
        "A pooled, propensity-matched analysis of 140 people with ileal or ileocolonic Crohn's (70 per group, from four registration trials) compared under-the-skin infliximab (Zymfentra) with standard IV infusions. At week 54, the injectable group had higher clinical remission (71.4% vs 51.4%) and endoscopic remission (41.4% vs 17.1%). Responders had higher drug levels in their blood.",
      tag: "Infliximab",
      condition: "Crohn's",
      region: "South Korea · USA",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "Crohn's in the ileum is often harder to heal. Steadier drug levels from regular injections may help. This is a company-run, after-the-fact comparison, not a head-to-head trial.",
      sourceType: "Company",
      source: "ACG 2026, Nashville (Celltrion)",
      date: "October 11, 2026",
      url: "https://www.prnewswire.com/news-releases/celltrion-to-present-new-analyses-of-zymfentra-infliximab-dyyb-in-crohns-disease-and-ulcerative-colitis-at-acg-2026-302903609.html",
    },
    {
      title: "Skyrizi injections from day one met their Week 12 goals; 5-year fistula data look durable",
      summary:
        "In the phase 3 AFFIRM trial, risankizumab given entirely by injection (no IV start) produced significantly higher clinical remission and endoscopic response than placebo at Week 12 in people new to advanced therapy. Separately, 74.5% of people with fistulizing Crohn's in the FORTIFY extension had no draining fistulas after five years. AbbVie has asked the FDA to approve injectable induction.",
      tag: "IL-23 biologic",
      condition: "Crohn's",
      region: "USA",
      originalLanguage: "English",
      evidence: "strong",
      whyItMatters:
        "Starting a biologic without infusion-center visits would be easier for many people. Full AFFIRM numbers haven't been published yet, and the fistula figure comes from people who stayed on the drug.",
      sourceType: "Company",
      source: "ACG 2026 (AbbVie)",
      date: "October 11, 2026",
      url: "https://news.abbvie.com/2026-10-11-New-SKYRIZI-R-risankizumab-rzaa-and-RINVOQ-R-upadacitinib-Data-Demonstrate-Disease-Control-for-Patients-Living-With-Inflammatory-Bowel-Disease",
    },
    {
      title: "Engineered cell therapies, including CAR-T, move toward IBD trials",
      summary:
        "A perspective in Nature Reviews Gastroenterology & Hepatology (authors include Mount Sinai's Saurabh Mehandru and Jean-Frederic Colombel) reviews stem-cell, regulatory T-cell and CAR-T approaches for IBD. A recent case of long-term UC remission after CD19 CAR-T therapy suggests immune B cells may drive some disease. Engineered regulatory T-cell therapies are in early trials.",
      tag: "Cell therapy",
      condition: "IBD",
      region: "USA · Germany",
      originalLanguage: "English",
      evidence: "early",
      whyItMatters:
        "This is years away from routine care, but it's the most different approach in the pipeline for people who haven't responded to any drug.",
      sourceType: "Journal",
      source: "Nature Reviews Gastroenterology & Hepatology",
      date: "October 2026 issue",
      url: "https://www.nature.com/articles/s41575-026-01226-4",
    },
    {
      title: "Low BMI was the strongest warning sign for muscle loss in IBD",
      summary:
        "A meta-analysis of 13 cohort studies (5,559 people with IBD) found low body mass index raised the odds of sarcopenia nearly fivefold (OR 4.70), and past bowel surgery roughly doubled them (OR 2.07). Biologic use, perianal disease and steroids were linked to low muscle mass, though that may reflect more severe disease rather than the drugs themselves.",
      tag: "Sarcopenia",
      condition: "IBD",
      region: "International",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "If you're underweight with IBD, protecting muscle deserves attention alongside controlling inflammation. Ask about a dietitian and body-composition checks.",
      sourceType: "Journal",
      source: "BMC Gastroenterology",
      date: "September 18, 2026",
      url: "https://link.springer.com/article/10.1186/s12876-026-05283-6",
    },
    {
      title: "Obefazimod, a once-daily pill for UC, kept half of patients in remission at 44 weeks",
      summary:
        "In the phase 3 ABTECT maintenance trial (580 people who responded to 8 weeks of induction), 50.8% on 25 mg and 51.3% on 50 mg were in clinical remission at week 44, versus 10.4% on placebo. There were no deaths or pancreatitis cases. Full results are being presented at UEG Week in Barcelona (October 17–20), and Abivax plans to file with the FDA in late 2026.",
      tag: "Oral small molecule",
      condition: "UC",
      region: "France",
      originalLanguage: "English",
      evidence: "strong",
      whyItMatters:
        "It works through a new mechanism (raising miR-124, a brake on inflammation), not by broad immune suppression. If approved, it would be a new oral option for UC.",
      sourceType: "Company",
      source: "Abivax, ABTECT phase 3",
      date: "June 1, 2026",
      url: "https://ir.abivax.com/news-releases/news-release-details/abivax-announces-landmark-phase-3-abtect-maintenance-trial",
    },
    {
      title: "Crohn's exclusion diet review: 45–83% of adults reached remission across 22 studies",
      summary:
        "A scoping review of 22 studies of the Crohn's Disease Exclusion Diet (CDED), which pairs a partial liquid-nutrition formula with a whole-food diet, found clinical remission rates of 70–94% in children and 45–83% in adults. Protocols ran in two or three phases. Adherence and study quality varied.",
      tag: "CDED diet",
      condition: "Crohn's",
      region: "International",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "It's among the best-supported diet options for mild-to-moderate Crohn's. Do it with an IBD dietitian, especially if you're also trying to gain weight.",
      sourceType: "Journal",
      source: "The Journal of Nutrition",
      date: "March 2026",
      url: "https://www.sciencedirect.com/science/article/abs/pii/S0022316626001318",
    },
    {
      title: "International panel defines when ultrasound can check for Crohn's coming back after surgery",
      summary:
        "An international, multidisciplinary expert panel used the formal RAND/UCLA appropriateness method to set out when intestinal ultrasound is appropriate for detecting Crohn's recurrence after surgery. Ultrasound needs no sedation or bowel prep, unlike the colonoscopy usually done around 6 to 12 months after resection.",
      tag: "Intestinal ultrasound",
      condition: "Crohn's",
      region: "International",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "After a resection, ultrasound could mean easier and more frequent checks. Ask whether your center offers it alongside colonoscopy.",
      sourceType: "Journal",
      source: "Lancet Gastroenterology & Hepatology",
      date: "2026",
      url: "https://www.sciencedirect.com/science/article/abs/pii/S2468125326000828",
    },
  ],

  gainer: [
    {
      title: "In IBD, low body weight was the biggest predictor of losing muscle",
      summary:
        "Pooling 13 cohort studies and 5,559 people with IBD, researchers found low BMI raised the odds of sarcopenia (low muscle mass plus weakness) about 4.7 times. A history of bowel surgery roughly doubled the odds.",
      tag: "IBD & muscle",
      region: "International",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "For a hard gainer with IBD, gaining is a health issue, not just a look. Lifting plus enough protein is the main lever, timed around flares with your care team.",
      sourceType: "Journal",
      source: "BMC Gastroenterology",
      date: "September 18, 2026",
      url: "https://link.springer.com/article/10.1186/s12876-026-05283-6",
    },
    {
      title: "Adults with IBD had weaker grip strength that declined faster with age",
      summary:
        "In a US national (NHANES) sample of 5,522 adults aged 20–59, the 25 people with treated IBD had grip strength about 9.4 kg lower than others after adjusting for age, sex and BMI. Their strength also declined faster with age, and their appendicular lean mass was lower.",
      tag: "IBD & strength",
      region: "USA",
      originalLanguage: "English",
      evidence: "early",
      whyItMatters:
        "It's a small IBD group, so treat it as a signal, not proof. But it fits the case for regular strength training if you have IBD.",
      sourceType: "Journal",
      source: "Journal of Lifestyle Medicine",
      date: "February 2026",
      url: "https://www.jlifestylemed.org/journal/view.html?doi=10.15280%2Fjlm.2026.16.1.32",
    },
    {
      title: "Creatine added lean mass whether lifters were beginners or experienced",
      summary:
        "A systematic review and dose-response meta-analysis compared creatine plus resistance training in novice and experienced lifters. Creatine increased fat-free mass, with no meaningful difference between trained and untrained people.",
      tag: "Creatine",
      region: "International",
      originalLanguage: "English",
      evidence: "strong",
      whyItMatters:
        "Creatine monohydrate is still the best-supported supplement for adding muscle. It helps from day one of training, not just once you're advanced. Some early weight gain is water.",
      sourceType: "Journal",
      source: "Journal of the International Society of Sports Nutrition",
      date: "2025",
      url: "https://www.tandfonline.com/doi/full/10.1080/15502783.2025.2586523",
    },
    {
      title: "Guidance for intentional weight gain: small surplus, slow rate, lift hard",
      summary:
        "A 2025 study of 168 athletes trying to gain weight summarizes current guidance: a surplus around 300–500 kcal a day, gaining roughly 0.25–0.45 kg a week, 1.2–2.0 g/kg of protein, and rigorous resistance training. Without training, studies show only about a third of overfed weight is lean mass.",
      tag: "Weight gain",
      region: "International",
      originalLanguage: "English",
      evidence: "emerging",
      whyItMatters:
        "Slower, deliberate gain with lifting puts more of the weight on as muscle. Eating a lot without training mostly adds fat.",
      sourceType: "Journal",
      source: "Dietetics (MDPI)",
      date: "April 2025",
      url: "https://www.mdpi.com/2674-0311/4/2/13",
    },
  ],
};

// Evergreen, evidence-graded advice for the Hard Gainer channel.
export const PLAYBOOK = [
  {
    title: "Eat a little more, consistently",
    body:
      "Aim for about 5–10% above maintenance (roughly 250–500 kcal a day) and a gain of about 0.25–0.5% of body weight per week. In a trial of trained lifters comparing maintenance, a 5% surplus and a 15% surplus, muscle gains were broadly similar, while the groups that gained the most weight gained the most fat.",
    evidence: "strong",
    source: "Helms et al., Sports Medicine – Open 2023",
    url: "https://pubmed.ncbi.nlm.nih.gov/37914977/",
  },
  {
    title: "Lift, and keep adding weight or reps",
    body:
      "Train each muscle group about twice a week with progressive overload. Training is what steers extra calories into muscle. Without it, only about a third of gained weight is lean tissue.",
    evidence: "strong",
    source: "Dietetics 2025 (review of overfeeding studies)",
    url: "https://www.mdpi.com/2674-0311/4/2/13",
  },
  {
    title: "Get about 1.6 g of protein per kg of body weight",
    body:
      "A meta-analysis of 49 trials found gains in lean mass plateau around 1.6 g/kg/day, with some people benefiting up to about 2.2 g/kg. Spread it over 3–5 meals.",
    evidence: "strong",
    source: "Morton et al., British Journal of Sports Medicine 2018",
    url: "https://bjsm.bmj.com/content/52/6/376",
  },
  {
    title: "Take 3–5 g of creatine monohydrate daily",
    body:
      "It's the best-researched muscle-building supplement and works for beginners and experienced lifters. No loading phase is needed. Expect 1–2 kg of early water weight.",
    evidence: "strong",
    source: "JISSN 2025 meta-analysis",
    url: "https://www.tandfonline.com/doi/full/10.1080/15502783.2025.2586523",
  },
  {
    title: "Drink calories when appetite is the bottleneck",
    body:
      "Smoothies with whole milk, oats, banana and nut butter, plus energy-dense add-ons like olive oil and cheese, add calories without much fullness. Smaller, more frequent meals help if large portions are hard.",
    evidence: "emerging",
    source: "Dietetics 2025",
    url: "https://www.mdpi.com/2674-0311/4/2/13",
  },
  {
    title: "Weigh in weekly and adjust",
    body:
      "Use the weekly average of morning weigh-ins. If it hasn't moved in two to three weeks, add 100–200 kcal a day. Sleep 7–9 hours, which supports recovery and appetite.",
    evidence: "emerging",
    source: "Standard sports-nutrition practice",
    url: "",
  },
  {
    title: "If you have IBD: gain with your care team",
    body:
      "Unplanned weight loss can mean active inflammation, so check with your GI team first. European guidelines put protein needs at 1.2–1.5 g/kg/day during active IBD. During flares, gentler energy-dense foods (smooth nut butters, eggs, white rice, oral nutrition shakes) are often easier, and an IBD dietitian can help.",
    evidence: "strong",
    source: "ESPEN guideline on clinical nutrition in IBD, Clinical Nutrition 2023",
    url: "https://doi.org/10.1016/j.clnu.2022.12.004",
  },
];

// Reality Check field guide: practical tips from Dutch, Belgian, German, UK and
// European sources. "origin" is where the tip or tool comes from.
export const FIELD_GUIDE = [
  // ---------------- Nightlife ----------------
  {
    side: "Nightlife",
    origin: "NL",
    title: "Map the toilets before you go out",
    body:
      "Dutch apps like HogeNood show the nearest public and business toilets, and venues can add theirs for free. Young members of Crohn & Colitis NL describe planning trips around toilet stops, including the last petrol station before the destination. Do the same for a night out: know the venue's toilets, and the ones on the way home.",
    source: "Emerce (May 2026); Crohn & Colitis NL, Crohniek Jong 2023",
    url: "https://www.emerce.nl/wire/provincie-groningen-eerste-actief-aangesloten-provincie-hogenood-app",
  },
  {
    side: "Nightlife",
    origin: "DE·AT·CH",
    title: "Get a Euro key for locked accessible toilets",
    body:
      "In German-speaking countries, the Euroschlüssel opens accessible toilets at motorway services, stations, pedestrian zones and museums. Crohn's disease, ulcerative colitis and having a stoma are all named in the eligibility rules. It costs €28.90 from CBF Darmstadt, with a medical certificate if you don't have a German disability card.",
    source: "CBF Darmstadt eligibility, via City of Dormagen",
    url: "https://www.dormagen.de/fileadmin/civserv/pdf-dateien/fachbereich_1/Ehrenamt/Bezugsberechtigung_Euro_Schluessel_neu.pdf",
  },
  {
    side: "Nightlife",
    origin: "UK",
    title: "Carry a Can't Wait Card, plus a RADAR key in the UK",
    body:
      "Crohn's & Colitis UK members get a Can't Wait Card, available in several languages for travel, to ask for toilet access without explaining. The charity also lists the RADAR key, which opens more than 9,000 locked public toilets across the UK.",
    source: "Crohn's & Colitis UK",
    url: "https://www.crohnsandcolitis.org.uk/get-involved/become-a-member/membership-benefits",
  },
  {
    side: "Nightlife",
    origin: "BE",
    title: "In Belgium, ask for a toiletpas",
    body:
      "Belgian insurer CM and the Crohn's and colitis patient association issue a personal toilet pass that lets you use toilets at participating cafés, restaurants and shops. It's free for association members and carries an English note for abroad. It isn't a legal right, so it relies on goodwill.",
    source: "CM / Crohn-Colitis ulcerosa Vereniging",
    url: "https://cm-mc.bynder.com/m/3ee4df5ec0a19e4/original/Toiletpas.pdf",
  },
  {
    side: "Nightlife",
    origin: "NL",
    title: "On thiopurines or methotrexate? Dutch hospitals say skip the drinks",
    body:
      "Jeroen Bosch Hospital strongly advises against alcohol for people taking azathioprine, mercaptopurine, thioguanine or methotrexate, because the liver is already working hard. It also notes that carbonation and hops in beer can irritate the gut. Crohn & Colitis NL's youth magazine puts it bluntly: one glass a day at most, and none is better.",
    source: "Jeroen Bosch Ziekenhuis; Crohn & Colitis NL",
    url: "https://jeroenboschziekenhuis.nl/afdelingen/maag-darm-en-leverziekten-mdl/zorg-bij-de-ziekte-van-crohn-en-colitis-ulcerosa-ibd/leven-met-de-ziekte-van-crohn-of-colitis-ulcerosa/pdf",
  },
  {
    side: "Nightlife",
    origin: "NL",
    title: "The Dutch approach to drugs: know what's in it, and know your meds",
    body:
      "Crohn & Colitis NL strongly discourages drugs, partly because they can change how your medication works. The Netherlands also runs the world's oldest drug-checking network (DIMS, coordinated by the Trimbos Institute since 1999), which offers anonymous testing and publishes warnings about dangerous pills. If you do go out with friends who use, make sure someone knows your diagnosis and medicines.",
    source: "Jellinek; Crohn & Colitis NL",
    url: "https://jellinek.nl/vraag-antwoord/why-do-they-test-drugs-the-netherlands-and-how-does-it-work",
  },
  {
    side: "Nightlife",
    origin: "NL",
    title: "Festival and travel kit, Dutch style",
    body:
      "Crohn & Colitis NL's checklist: pack oral rehydration salts (ORS), drink at least two liters a day in hot weather, only drink sealed or boiled water abroad, carry extra medication in your hand luggage, and check that any vaccines are safe with your immune-suppressing medicines before you go.",
    source: "Crohn & Colitis NL, Crohniek Jong 2023",
    url: "https://www.crohn-colitis.nl/wp-content/uploads/2023/08/Crohniek-Jong-2023_UITVOUW.pdf",
  },
  // ---------------- Lifting ----------------
  {
    side: "Lifting",
    origin: "NL",
    title: "The Maastricht bedtime shake",
    body:
      "In a 12-week Maastricht University study of 44 young men, those who drank about 30 g of casein protein with 15 g of carbs before bed gained more strength and muscle size than those given a placebo drink. It may be the extra protein rather than the timing. For hard gainers it's an easy way to add calories without fighting daytime appetite. With IBD, pick a shake you tolerate (lactose-free, low in emulsifiers).",
    source: "Snijders et al. (Maastricht), Frontiers in Nutrition 2019 review",
    url: "https://www.sciencedaily.com/releases/2019/03/190306081832.htm",
  },
  {
    side: "Lifting",
    origin: "NL",
    title: "Big protein meals aren't wasted",
    body:
      "Maastricht researchers found 100 g of protein after exercise produced a larger and longer-lasting muscle-building response than 25 g, with no upper limit seen in healthy young men. If your gut or schedule only allows a few big meals, that can still work. The authors note people who are ill may hit a ceiling sooner.",
    source: "Trommelen et al., Cell Reports Medicine 2023",
    url: "https://www.nutraingredients.com/Article/2024/01/10/new-research-questions-20-gram-protein-intake-limit/",
  },
  {
    side: "Lifting",
    origin: "EU",
    title: "During a flare, protein needs go up, not down",
    body:
      "The European nutrition society's IBD guideline (ESPEN) raises protein to 1.2–1.5 g per kg of body weight a day during active disease, because inflammation breaks muscle down. Flares are a time to protect muscle with lighter training and steady protein, not to stop eating.",
    source: "ESPEN guideline, Clinical Nutrition 2023",
    url: "https://doi.org/10.1016/j.clnu.2022.12.004",
  },
  {
    side: "Lifting",
    origin: "NL",
    title: "Start near a toilet, then build up",
    body:
      "Crohn & Colitis NL suggests starting small: walking loops that pass a toilet, or a few squats every half hour. Many Dutch gyms offer physio-guided training, and a sports doctor can help you plan. The Dutch Health Council's target is at least 2.5 hours of moderate activity a week.",
    source: "Crohn & Colitis NL; Jeroen Bosch Ziekenhuis",
    url: "https://www.crohn-colitis.nl/wp-content/uploads/2023/08/Crohniek-Jong-2023_UITVOUW.pdf",
  },
  {
    side: "Lifting",
    origin: "NL",
    title: "Tired all the time? Raise it at your next visit",
    body:
      "Dutch hospitals such as Jeroen Bosch have IBD nurses working alongside gastroenterologists, and tell patients to raise fatigue with either one. Fatigue can come from inflammation, low iron, poor sleep or medication, and each has a different fix.",
    source: "Jeroen Bosch Ziekenhuis",
    url: "https://jeroenboschziekenhuis.nl/afdelingen/maag-darm-en-leverziekten-mdl/zorg-bij-de-ziekte-van-crohn-en-colitis-ulcerosa-ibd/leven-met-de-ziekte-van-crohn-of-colitis-ulcerosa/pdf",
  },
];

// Trial Tracker: saved entries shown until the engine's first run. Only trials
// confirmed in public listings or company announcements; registry numbers are
// included only where the source gave one.
SEED.trialsRegistry = [
  {
    id: "NCT06850727",
    title: "OD-001: a first-in-class oral pill (RIPK2 scaffolding inhibitor) for ulcerative colitis",
    summary:
      "A phase 2a trial testing OD-001, an oral drug that blocks RIPK2, an immune signaling protein, in moderately to severely active ulcerative colitis. More induction results are being presented at UEG Week in Barcelona on October 20, 2026.",
    whoFor: "Adults with moderately to severely active ulcerative colitis.",
    kind: "Medication",
    conditions: ["UC"],
    phase: "Phase 2",
    status: "",
    interventions: [{ type: "Drug", name: "OD-001 (oral)" }],
    sponsor: "Odyssey Therapeutics",
    industry: true,
    countries: [],
    firstPosted: "",
    url: "https://clinicaltrials.gov/study/NCT06850727",
    sourceNote: "Odyssey Therapeutics, October 6, 2026",
  },
  {
    id: "seed-afimkibart",
    title: "Afimkibart (RO7790121), an anti-TL1A antibody, in a phase 3 Crohn's disease program",
    summary:
      "A multicenter, double-blind, placebo-controlled phase 3 treat-through study of afimkibart for both induction and maintenance in moderately to severely active Crohn's disease.",
    whoFor: "Adults with moderately to severely active Crohn's disease.",
    kind: "Medication",
    conditions: ["Crohn's"],
    phase: "Phase 3",
    status: "",
    interventions: [{ type: "Biologic", name: "Afimkibart (RO7790121)" }],
    sponsor: "Roche",
    industry: true,
    countries: ["United States"],
    firstPosted: "",
    url: "https://clinicaltrials.ucsf.edu/crohns-disease",
    sourceNote: "UCSF clinical trials listing, 2026",
  },
  {
    id: "seed-dtt-vedo-upa",
    title: "Dual targeted therapy: vedolizumab plus upadacitinib for Crohn's disease",
    summary:
      "Tests whether giving two advanced therapies together (vedolizumab with upadacitinib) reduces bowel inflammation and ulcers more than standard single-drug treatment.",
    whoFor: "Adults with moderate to severe Crohn's disease.",
    kind: "Medication",
    conditions: ["Crohn's"],
    phase: "",
    status: "",
    interventions: [
      { type: "Biologic", name: "Vedolizumab" },
      { type: "Drug", name: "Upadacitinib" },
    ],
    sponsor: "",
    industry: false,
    countries: ["United States"],
    firstPosted: "",
    url: "https://clinicaltrials.ucsd.edu/crohns-disease",
    sourceNote: "UC San Diego clinical trials listing, 2026",
  },
  {
    id: "seed-tilpisertib",
    title: "Tilpisertib fosmecarbil versus placebo in ulcerative colitis",
    summary:
      "A placebo-controlled trial of tilpisertib fosmecarbil, an investigational oral drug, in people with ulcerative colitis.",
    whoFor: "Adults with ulcerative colitis.",
    kind: "Medication",
    conditions: ["UC"],
    phase: "",
    status: "",
    interventions: [{ type: "Drug", name: "Tilpisertib fosmecarbil" }],
    sponsor: "",
    industry: false,
    countries: ["United States"],
    firstPosted: "",
    url: "https://clinicaltrials.ucsf.edu/inflammatory-bowel-disease",
    sourceNote: "UCSF clinical trials listing, 2026",
  },
  {
    id: "seed-t2t-switch",
    title: "Switch or stay? Treating to healing when symptoms are gone but inflammation isn't",
    summary:
      "A real-world strategy trial for people whose symptoms are in remission but who still have moderate to severe inflammation on endoscopy. It compares switching to a different advanced therapy with staying on the current one.",
    whoFor: "People with Crohn's or ulcerative colitis in symptom remission with ongoing inflammation.",
    kind: "Care & monitoring",
    conditions: ["Crohn's", "UC"],
    phase: "N/A",
    status: "",
    interventions: [{ type: "Other", name: "Treatment strategy" }],
    sponsor: "",
    industry: false,
    countries: ["United States"],
    firstPosted: "",
    url: "https://clinicaltrials.ucsd.edu/crohns-disease",
    sourceNote: "UC San Diego clinical trials listing, 2026",
  },
];

// Published results: real trial readouts already in the saved briefings.
SEED.trials = [
  ...SEED.ibd.filter((s) => /Obefazimod|Skyrizi|Injectable infliximab/.test(s.title)),
  ...SEED.reality.filter((s) => /emulsifiers/.test(s.title)),
].map((s) => ({
  ...s,
  kind: /emulsifiers/.test(s.title) ? "Symptom management" : "Medication",
}));
