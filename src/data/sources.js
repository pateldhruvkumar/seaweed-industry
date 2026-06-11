/**
 * Per-tab dataset registries for the <AboutDataPanel/> shown at the top of a tab.
 *
 * Shape mirrors the SOURCES registry in ./canada.js but is tab-scoped: each tab
 * gets a `summary` (one plain-language line) plus a `datasets` array. Each dataset
 * is { name, provider, years, href?, caveat? } — `href` adds a "link", `caveat`
 * renders an italic amber disclaimer (same idioms as <SourceNote/>).
 *
 * Most tabs draw from FAO FishStat aquatic-algae statistics (1950–2024),
 * aggregated by scripts/preprocess.py from 4 FAO CSVs in dataset/. The PSIA
 * tabs additionally mix in market-research estimates, which are flagged as such.
 */

// FAO FishStat is the backbone of nearly every tab — define once, reuse.
const FAO = 'FAO FishStat · Food and Agriculture Organization of the UN'
const FAO_HREF = 'https://www.fao.org/fishery/en/statistics'
const FAO_YEARS = '1950–2024'

export const OVERVIEW_DATA = {
  summary:
    'Every chart on this tab comes from FAO FishStat aquatic-algae statistics, 1950–2024.',
  datasets: [
    {
      name: 'Global seaweed production — by source, species & country',
      provider: FAO,
      years: FAO_YEARS,
      href: FAO_HREF,
      caveat:
        'Aggregated from FAO capture + aquaculture tables; status flags (official / estimate / FAO-inferred) are not filtered out.',
    },
  ],
}

export const COUNTRIES_DATA = {
  summary:
    'Country production rankings and trends, from FAO FishStat global seaweed statistics, 1950–2024.',
  datasets: [
    {
      name: 'Global seaweed production by country (annual + 5-year windows)',
      provider: FAO,
      years: FAO_YEARS,
      href: FAO_HREF,
      caveat:
        'Live-weight tonnes across all species and sources; FAO status flags are not filtered out.',
    },
  ],
}

export const ECONOMICS_DATA = {
  summary:
    'Aquaculture price and value indicators derived from FAO FishStat, 1950–2024.',
  datasets: [
    {
      name: 'Aquaculture value & quantity (price = value ÷ quantity)',
      provider: FAO,
      years: FAO_YEARS,
      href: FAO_HREF,
      caveat:
        'Value covers the aquaculture stream only (wild capture excluded); prices are derived USD/tonne live weight, not observed market prices.',
    },
  ],
}

export const REGIONS_DATA = {
  summary:
    'Production grouped by continent and by income group, from FAO FishStat, 1950–2024.',
  datasets: [
    {
      name: 'Global seaweed production by continent & income group',
      provider: FAO,
      years: FAO_YEARS,
      href: FAO_HREF,
      caveat:
        'Live-weight tonnes; records missing a continent/income-group classification are excluded. Income groups use the World Bank classification.',
    },
  ],
}

export const SPECIES_DATA = {
  summary:
    'Top species, country–species specialization, and farming-environment splits, from FAO FishStat, 1950–2024.',
  datasets: [
    {
      name: 'Global seaweed production by species & farming environment',
      provider: FAO,
      years: FAO_YEARS,
      href: FAO_HREF,
      caveat:
        'Live-weight tonnes; environment splits (marine / brackish / inland) cover the aquaculture stream only.',
    },
  ],
}

export const EDA_DATA = {
  summary:
    'Exploratory data analysis across all four FAO FishStat source tables, 1950–2024.',
  datasets: [
    {
      name: 'FAO source tables — production, aquaculture quantity, aquaculture value, capture',
      provider: FAO,
      years: FAO_YEARS,
      href: FAO_HREF,
      caveat:
        'This tab profiles the raw data itself (missing values, status flags A/E/I/N/Q, distributions, outliers) — series here are diagnostic, not market figures.',
    },
  ],
}

export const KPI_EXPORT_VALUE_DATA = {
  summary:
    'Production value by year and country, used as a directional proxy for export value (FAO FishStat).',
  datasets: [
    {
      name: 'Aquaculture production value (global + by country)',
      provider: FAO,
      years: FAO_YEARS,
      href: FAO_HREF,
      caveat:
        'FAO publishes production value, not trade flows. Figures are a directional proxy for exports; true export values need UN Comtrade HS 1212.21 trade data.',
    },
  ],
}

export const KPI_GROSS_OUTPUT_DATA = {
  summary:
    'Gross value of seaweed aquaculture output by environment and country (FAO FishStat).',
  datasets: [
    {
      name: 'Aquaculture production value (global, by environment, by country)',
      provider: FAO,
      years: FAO_YEARS,
      href: FAO_HREF,
      caveat:
        'Aquaculture stream only — FAO publishes no value series for wild capture, so wild harvest is excluded.',
    },
  ],
}

export const KPI_VALUE_PER_LB_DATA = {
  summary:
    'Volume-weighted average aquaculture price ($/lb · $/kg · $/tonne), from FAO FishStat quantity & value tables.',
  datasets: [
    {
      name: 'Aquaculture price (value ÷ quantity, by environment & species)',
      provider: FAO,
      years: FAO_YEARS,
      href: FAO_HREF,
      caveat:
        'FAO publishes prices in $/tonne; $/lb and $/kg are converted (1 tonne = 2204.6226 lb). Derived farm-gate prices, not retail.',
    },
  ],
}

export const PSIA_PRICING_DATA = {
  summary:
    'Species $/tonne price benchmarks from FAO FishStat, with BC positioning context.',
  datasets: [
    {
      name: 'Species & country price benchmarks ($/wet tonne)',
      provider: FAO,
      years: '2000–2024',
      href: FAO_HREF,
      caveat:
        'Asia-dominant farm-gate prices; FAO has no Canadian seaweed aquaculture rows.',
    },
    {
      name: 'BC price benchmarks & market context',
      provider: 'BC Ministry of Agriculture · GreenWave · industry reports',
      caveat:
        'BC figures are dated (≈2019) and survey-based, not FAO empirical data.',
    },
  ],
}

export const CANADA_ECONOMICS_DATA = {
  summary:
    'Seaweed export value (UN Comtrade) plus all-aquaculture economic series from Statistics Canada & DFO — only exports are seaweed-specific.',
  datasets: [
    {
      name: 'Canada seaweed exports — HS 1212.21 + 1212.29',
      provider: 'UN Comtrade',
      href: 'https://comtradeplus.un.org/',
      caveat: 'The only seaweed-specific series on this tab.',
    },
    {
      name: 'Aquaculture production & value — Table 32-10-0107',
      provider: 'Statistics Canada',
      href: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210010701',
      caveat:
        'All aquaculture (finfish + shellfish). StatCan does not report seaweed separately.',
    },
    {
      name: 'Aquaculture value-added account — Table 32-10-0108',
      provider: 'Statistics Canada',
      href: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210010801',
      caveat: 'All aquaculture, not seaweed-specific.',
    },
    {
      name: 'Interprovincial & international trade flows — Table 12-10-0088',
      provider: 'Statistics Canada',
      href: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1210008801',
      caveat:
        'Product group "Fish, crustaceans, shellfish & other fishery products"; not seaweed-specific.',
    },
    {
      name: 'Aquaculture employment & value added',
      provider: 'Fisheries and Oceans Canada (DFO)',
      href: 'https://www.dfo-mpo.gc.ca/stats/aqua/aqua-val-eng.htm',
    },
  ],
}

export const CANADA_LICENSING_DATA = {
  summary:
    'Licence holders and lease sites for BC and Nova Scotia. Only Nova Scotia separates seaweed; figures are current-valid snapshots, not time series.',
  datasets: [
    {
      name: 'BC aquaculture licence holders (current valid)',
      provider: 'Fisheries and Oceans Canada (DFO)',
      href: 'https://open.canada.ca/data/en/dataset/522d1b67-30d8-4a34-9b62-5da99b1035e6',
      caveat:
        'Snapshot, not a time series. DFO licenses finfish/shellfish/land-based only; BC seaweed is provincially authorized and unpublished, so this is all-aquaculture.',
    },
    {
      name: 'Nova Scotia Marine Aquaculture Leases',
      provider: 'Province of Nova Scotia (data.novascotia.ca)',
      href: 'https://data.novascotia.ca/Fishing-and-Aquaculture/Nova-Scotia-Marine-Aquaculture-Leases/h57h-p9mm',
      caveat:
        'All-aquaculture leases; seaweed appears via the species field on multi-species leases, not seaweed-only farms.',
    },
    {
      name: 'Nova Scotia Rockweed Leases',
      provider: 'Province of Nova Scotia (data.novascotia.ca)',
      href: 'https://data.novascotia.ca/Fishing-and-Aquaculture/Nova-Scotia-Rockweed-Leases/exhe-htib',
      caveat:
        'Seaweed-specific: dedicated wild-rockweed harvest zones, not cultivation farms.',
    },
    {
      name: 'Aquaculture value-added account — Table 32-10-0108',
      provider: 'Statistics Canada',
      href: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210010801',
      caveat: 'All aquaculture, not seaweed-specific.',
    },
  ],
}

export const PSIA_DEMAND_DATA = {
  summary:
    'Market form-split, end-use and demand projections — analyst estimates, not FAO empirical data.',
  datasets: [
    {
      name: 'Form split, end-use distribution, hydrocolloid & emerging-application sizing',
      provider:
        'Grand View Research · Mordor Intelligence · Global Market Insights · Fortune Business Insights · World Bank PROBLUE',
      years: '2023–2026',
      caveat:
        'Market-research consensus estimates and forecasts (not empirical FAO data); figures vary between firms and project forward from 2025.',
    },
  ],
}
