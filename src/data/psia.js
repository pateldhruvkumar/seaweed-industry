/**
 * Pacific Seaweed Industry Association — KPI Data Briefing.
 *
 * Each constant pairs a small dataset with the key-notes bullets that
 * accompany the chart in the source PDF (PSIA_KPI_Charts_Light.pdf).
 *
 * Sources cited in the deck:
 *   FAO FishStat · World Bank PROBLUE 2023 · Grand View Research 2026 ·
 *   GreenWave 2026 · BC Ministry of Agriculture
 *
 * Data is hard-coded here (not pre-processed JSON) because the deck is a
 * curated synthesis of multiple external reports — not a derivation of the
 * FAO CSVs that feed our other tabs.
 */

// ──────────────────────────────────────────────────────────────────────
//  KPI 1 — Price per Wet Tonne by Species & End Use ($/tonne)
// ──────────────────────────────────────────────────────────────────────

export const GLOBAL_AQUA_TREND = {
  title: 'Global Seaweed Aquaculture Production Trend',
  tag: 'KPI 1 · Context',
  data: [
    { year: 2000, value_mt: 11.2 },
    { year: 2002, value_mt: 13.0 },
    { year: 2004, value_mt: 14.9 },
    { year: 2006, value_mt: 17.0 },
    { year: 2008, value_mt: 19.7 },
    { year: 2010, value_mt: 22.4 },
    { year: 2012, value_mt: 25.1 },
    { year: 2014, value_mt: 27.3 },
    { year: 2016, value_mt: 31.5 },
    { year: 2018, value_mt: 33.0 },
    { year: 2020, value_mt: 35.0 },
    { year: 2022, value_mt: 36.5 },
    { year: 2024, value_mt: 38.9 },
  ],
  notes: [
    'Output has grown 3.5× since 2000, reaching 38.9M wet tonnes in 2024.',
    'Growth is driven almost entirely by China, Indonesia, and South Korea.',
    'Canada contributes less than 0.01% of global aquaculture volume.',
  ],
  takeaway:
    'BC enters a large and growing global market but from a very small base. Benchmarking BC prices against global averages requires care — Asian farmgate prices are not directly comparable.',
}

export const SPECIES_PRICES_2022 = {
  title: 'Price per Wet Tonne by Species (Global, 2022)',
  tag: 'KPI 1 · Price Benchmark',
  // Tier drives the bar color in the chart.
  data: [
    { species: 'Algae NEI',      price: 33135, tier: 'Premium / specialty' },
    { species: 'Spirulina',      price: 4512,  tier: 'Premium / specialty' },
    { species: 'Sea Belt',       price: 2840,  tier: 'Mid-tier' },
    { species: 'Kelps NEI',      price: 1351,  tier: 'Mid-tier' },
    { species: 'Laver (Nori)',   price: 1256,  tier: 'Mid-tier' },
    { species: 'Caulerpa',       price: 1021,  tier: 'Mid-tier' },
    { species: 'Fus. Sargassum', price: 948,   tier: 'Mid-tier' },
    { species: 'Brown Algae',    price: 847,   tier: 'Commodity' },
    { species: 'Wakame',         price: 806,   tier: 'Commodity' },
    { species: 'Nori NEI',       price: 708,   tier: 'Commodity' },
  ],
  tierColors: {
    'Premium / specialty': '#c2410c', // orange-700
    'Mid-tier':            '#0d9488', // brand-600 (teal)
    'Commodity':           '#0e7490', // cyan-700
  },
  notes: [
    'Algae NEI at $33k/t is an outlier — tiny volume, likely lab/nutraceutical grade.',
    'Kelps NEI (the species most relevant to BC) sits at ~$1,350/t globally.',
    'Laver (Nori) has declined from $2,073/t (2010) as cultivation expanded.',
  ],
  takeaway:
    'Canada has 0 rows in FAO aquaculture data. These are Asia-dominant farmgate prices. BC premium food-grade kelp likely commands a significant markup over these figures.',
}

export const SPECIES_PRICE_TREND = {
  title: 'Price Trend by Species (2010 – 2022, Global)',
  tag: 'KPI 1 · Price Trend',
  // Long-form rows so LineChart can group by species.
  data: [
    // Laver (Nori) — declining
    { year: 2010, species: 'Laver (Nori)', price: 2073 },
    { year: 2012, species: 'Laver (Nori)', price: 1860 },
    { year: 2014, species: 'Laver (Nori)', price: 1640 },
    { year: 2016, species: 'Laver (Nori)', price: 1380 },
    { year: 2018, species: 'Laver (Nori)', price: 1300 },
    { year: 2020, species: 'Laver (Nori)', price: 1290 },
    { year: 2022, species: 'Laver (Nori)', price: 1256 },
    // Kelps NEI — flat
    { year: 2010, species: 'Kelps NEI', price: 1198 },
    { year: 2012, species: 'Kelps NEI', price: 1200 },
    { year: 2014, species: 'Kelps NEI', price: 1200 },
    { year: 2016, species: 'Kelps NEI', price: 1250 },
    { year: 2018, species: 'Kelps NEI', price: 1300 },
    { year: 2020, species: 'Kelps NEI', price: 1350 },
    { year: 2022, species: 'Kelps NEI', price: 1351 },
    // Wakame — rising
    { year: 2010, species: 'Wakame', price: 510 },
    { year: 2012, species: 'Wakame', price: 560 },
    { year: 2014, species: 'Wakame', price: 615 },
    { year: 2016, species: 'Wakame', price: 695 },
    { year: 2018, species: 'Wakame', price: 735 },
    { year: 2020, species: 'Wakame', price: 780 },
    { year: 2022, species: 'Wakame', price: 806 },
    // Brown Algae — modest rise
    { year: 2010, species: 'Brown Algae', price: 575 },
    { year: 2012, species: 'Brown Algae', price: 615 },
    { year: 2014, species: 'Brown Algae', price: 650 },
    { year: 2016, species: 'Brown Algae', price: 705 },
    { year: 2018, species: 'Brown Algae', price: 745 },
    { year: 2020, species: 'Brown Algae', price: 790 },
    { year: 2022, species: 'Brown Algae', price: 847 },
    // Fus. Sargassum — rising
    { year: 2010, species: 'Fus. Sargassum', price: 640 },
    { year: 2012, species: 'Fus. Sargassum', price: 685 },
    { year: 2014, species: 'Fus. Sargassum', price: 720 },
    { year: 2016, species: 'Fus. Sargassum', price: 795 },
    { year: 2018, species: 'Fus. Sargassum', price: 850 },
    { year: 2020, species: 'Fus. Sargassum', price: 900 },
    { year: 2022, species: 'Fus. Sargassum', price: 948 },
  ],
  notes: [
    'Nori prices falling as supply scales — a useful warning for BC.',
    'Kelps NEI has held stable at $1,200 – 1,350/t over 12 years.',
    'Wakame trending slightly upward — demand growing faster than supply.',
  ],
  takeaway:
    'BC should track whether local farmgate prices are above or below these global benchmarks, and by how much. A member survey is the only way to establish this.',
}

export const TOP_COUNTRIES_VALUE = {
  title: 'Top Countries by Seaweed Aquaculture Value',
  tag: 'KPI 1 · Global Context',
  data: [
    { country: 'China',       value_musd: 99.2, highlight: true  },
    { country: 'Indonesia',   value_musd: 14.9, highlight: false },
    { country: 'Japan',       value_musd: 9.3,  highlight: false },
    { country: 'S. Korea',    value_musd: 5.9,  highlight: false },
    { country: 'Philippines', value_musd: 1.7,  highlight: false },
    { country: 'Chile',       value_musd: 1.3,  highlight: false },
    { country: 'N. Korea',    value_musd: 0.7,  highlight: false },
    { country: 'Russia',      value_musd: 0.2,  highlight: false },
  ],
  notes: [
    'China dominates at 74% of global value — nearly $100M USD/year.',
    'Northern America (incl. Canada) contributes less than 0.01%.',
    'Japan and South Korea set the quality benchmark for premium seaweed.',
  ],
  takeaway:
    "BC's opportunity is not to compete on volume but on premium positioning — food-grade, certified, sustainably-farmed. That justifies a higher $/tonne than Asian commodity prices.",
}

export const BC_PRICE_BENCHMARKS = {
  title: 'BC & North American Price Benchmarks by Segment',
  tag: 'KPI 1 · BC Benchmarks',
  data: [
    { segment: 'Wild Bull Kelp\n(retail dried)',     low: 9500, high: 13000 },
    { segment: 'Farmed Sugar Kelp\n(food)',          low: 800,  high: 2000  },
    { segment: 'Biostimulant\nFeedstock',            low: 200,  high: 500   },
    { segment: 'FAO Kelps NEI\n(global 2022)',       low: 1200, high: 1400  },
    { segment: 'BC 2019\nFarmed Algae',              low: 9000, high: 10000 },
  ],
  notes: [
    'No official BC farmgate $/wet tonne series exists anywhere.',
    'Wild bull kelp (retail dried) implies $9,500 – 13,000/wet tonne equivalent.',
    'Biostimulant feedstock is the lowest-value channel at ~$200 – 500/t.',
    'The 2019 BC Ministry figure (~$9,500/t) is the only public BC datapoint and it is 6 years old.',
  ],
  takeaway:
    'PSIA member survey is the only way to produce a current, BC-specific price series.',
}

// ──────────────────────────────────────────────────────────────────────
//  KPI 2 — Wet vs. Processed Kelp Demand
// ──────────────────────────────────────────────────────────────────────

export const FORM_SPLIT = {
  title: 'Global Commercial Seaweed: Wet vs. Processed Form Split',
  tag: 'KPI 2 · Form Split',
  // Headline donut
  donut: [
    { label: 'Dried / Processed', value: 80.6 },
    { label: 'Fresh / Wet',       value: 19.4 },
  ],
  // Three corroborating sources for the "processed dominates" finding.
  callouts: [
    { value: '80.6%', label: 'Dried / Processed', source: 'Global Market Insights 2026' },
    { value: '62.1%', label: 'Frozen + Dried',    source: 'Mordor Intelligence 2025' },
    { value: '69.9%', label: 'Powder form',       source: 'Fortune Business Insights 2026' },
  ],
  notes: [
    '60 – 80% of commercial seaweed moves as dried or processed — consistent across 5+ reports.',
    'Fresh/wet seaweed is the fastest-growing segment (CAGR ~10%) but from a small base.',
    'The processed segment is dominated by food-grade dried seaweed and hydrocolloids.',
  ],
  takeaway:
    'Cascadia Seaweed exports liquid biostimulant (processed). Most BC operators currently sell dried whole-leaf. The sector is moving toward higher processing intensity.',
}

export const END_USE_SPLIT = {
  title: 'Global Seaweed End-Use Distribution',
  tag: 'KPI 2 · End-Use',
  data: [
    { category: 'Food & Beverage',     share_pct: 34, color: '#0d9488' }, // teal
    { category: 'Hydrocolloids',       share_pct: 28, color: '#0e7490' }, // cyan-700
    { category: 'Agri / Biostimulant', share_pct: 16, color: '#0891b2' }, // cyan-600
    { category: 'Animal Feed',         share_pct: 12, color: '#10b981' }, // emerald-500
    { category: 'Cosmetics / Pharma',  share_pct: 7,  color: '#c2410c' }, // orange-700
    { category: 'Other',               share_pct: 3,  color: '#94a3b8' }, // slate-400
  ],
  notes: [
    'Food & Beverage is the largest single channel at 34% — includes both fresh and dried.',
    'Hydrocolloids (carrageenan, alginate, agar) = 28% and are entirely processed.',
    'Agriculture and biostimulants at 16% — the fastest-growing non-food channel.',
  ],
  takeaway:
    'The two fastest-growing non-commodity channels — biostimulants and animal feed — both require processed kelp, which is where BC operators are investing.',
}

export const HYDROCOLLOID_MARKET = {
  title: 'Seaweed-Derived Hydrocolloid Market Growth',
  tag: 'KPI 2 · Processed Demand',
  // Actual values from external reports (USD billions).
  actual: [
    { year: 2020, value_busd: 10.2 },
    { year: 2021, value_busd: 10.7 },
    { year: 2022, value_busd: 11.9 },
    { year: 2023, value_busd: 12.3 },
    { year: 2024, value_busd: 13.0 },
    { year: 2025, value_busd: 13.6 },
  ],
  // 5% CAGR projection from 2025 onward.
  projected: [
    { year: 2025, value_busd: 13.6 },
    { year: 2026, value_busd: 14.28 },
    { year: 2027, value_busd: 14.99 },
    { year: 2028, value_busd: 15.74 },
    { year: 2029, value_busd: 16.53 },
    { year: 2030, value_busd: 17.36 },
    { year: 2031, value_busd: 18.22 },
    { year: 2032, value_busd: 19.13 },
    { year: 2033, value_busd: 20.09 },
  ],
  notes: [
    'Hydrocolloid market valued at $13.6B USD in 2025, growing at 5.0% CAGR.',
    'Food & beverage accounts for 69.7% of hydrocolloid end-use.',
    'Carrageenan, alginate, and agar together = 62.5% of volume.',
    'Tate & Lyle acquired CP Kelco for $1.8B (Nov 2024) — a strong demand signal.',
  ],
  takeaway:
    'Processed seaweed demand is large and growing. BC operators who invest in extraction capacity are targeting a well-established, expanding market.',
}

export const BC_VS_GLOBAL_RADAR = {
  title: 'BC Seaweed Industry: Contextual Profile vs. Global Average',
  tag: 'KPI 2 · BC Context',
  // Scale 0–5. Estimated from the source radar in the briefing PDF.
  axes: [
    'Price Premium',
    'Production Volume',
    'Regulatory Support',
    'Growth Rate',
    'Market Data Availability',
    'Processing Capacity',
  ],
  bc:     [4.5, 1.0, 2.5, 4.5, 1.0, 1.5],
  global: [2.0, 4.5, 3.0, 2.5, 4.5, 4.0],
  notes: [
    "BC's strengths: high price premium potential and strong growth trajectory.",
    "BC's gaps: processing capacity and market data availability.",
    'Regulatory support is improving but permitting timelines remain a barrier.',
  ],
  takeaway:
    "Low market data availability is itself a KPI finding. PSIA's dashboard directly addresses this gap — it is the tool that closes the loop.",
}

export const NA_EMERGING_APPS = {
  title: 'North American Emerging Seaweed Applications (to 2030)',
  tag: 'KPI 2 · Market Opportunity',
  data: [
    { application: 'Biostimulants',     value_musd: 3200, priority: 'High'     },
    { application: 'Animal Feed',       value_musd: 2800, priority: 'High'     },
    { application: 'Pet Food',          value_musd: 1400, priority: 'Medium'   },
    { application: 'Methane Additives', value_musd: 1100, priority: 'Medium'   },
    { application: 'Supplements',       value_musd: 900,  priority: 'Emerging' },
    { application: 'Alt. Proteins',     value_musd: 750,  priority: 'Emerging' },
    { application: 'Bioplastics',       value_musd: 600,  priority: 'Emerging' },
    { application: 'Cosmetics',         value_musd: 450,  priority: 'Emerging' },
  ],
  priorityColors: {
    High:     '#0d9488', // brand-600
    Medium:   '#0e7490', // cyan-700
    Emerging: '#94a3b8', // slate-400
  },
  notes: [
    'All eight applications require processed — not fresh — kelp.',
    'Biostimulants ($3.2B) and animal feed ($2.8B) are the largest opportunities.',
    "Cascadia Seaweed's current product line (liquid biostimulant) targets the #1 category.",
    'Methane-reducing feed additives (Mootral, Zelp) are an emerging high-growth niche.',
  ],
  takeaway:
    'The North American market is signalling a clear direction: value creation requires moving up the processing chain from raw wet biomass.',
}
