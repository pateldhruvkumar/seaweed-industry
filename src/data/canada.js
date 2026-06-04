/**
 * Canada Economics — source citations and framing copy.
 *
 * Honest-provenance principle (see scripts/fetch_canada.py): Canada does NOT
 * report seaweed separately in any official aquaculture statistic. Seaweed is
 * isolated cleanly only in international trade (HS 1212.21/1212.29). So exactly
 * one series here is seaweed-specific (EXPORTS); the StatCan series are
 * all-aquaculture (finfish + shellfish) and are labelled as such everywhere.
 */

// Reusable source citations (passed to <SourceNote />).
export const SOURCES = {
  exports: {
    source: 'UN Comtrade — Canada exports, HS 1212.21 + 1212.29 (seaweeds & other algae)',
    href: 'https://comtradeplus.un.org/',
  },
  aquaValue: {
    source: 'Statistics Canada, Table 32-10-0107 — Aquaculture, production and value',
    href: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210010701',
    caveat: 'All aquaculture (finfish + shellfish). StatCan does not report seaweed separately.',
  },
  valueAdded: {
    source: 'Statistics Canada, Table 32-10-0108 — Aquaculture economic statistics, value added account',
    href: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210010801',
    caveat: 'All aquaculture (finfish + shellfish), not seaweed-specific.',
  },
  trade: {
    source: 'Statistics Canada, Table 12-10-0088 — Interprovincial and international trade flows',
    href: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1210008801',
    caveat: 'Product group "Fish, crustaceans, shellfish & other fishery products" — not seaweed-specific.',
  },
  jobs: {
    source: 'Fisheries and Oceans Canada (DFO) — Aquaculture employment & value added',
    href: 'https://www.dfo-mpo.gc.ca/stats/aqua/aqua-val-eng.htm',
  },
  bcLicences: {
    source: 'Fisheries and Oceans Canada (DFO) — Current valid British Columbia aquaculture licence holders',
    href: 'https://open.canada.ca/data/en/dataset/522d1b67-30d8-4a34-9b62-5da99b1035e6',
    caveat: 'Current-valid snapshot (not a time series). DFO licenses finfish/shellfish/land-based only — seaweed is provincially authorized in BC and not published, so this is all-aquaculture.',
  },
  nsLeases: {
    source: 'Nova Scotia — Marine Aquaculture Leases (data.novascotia.ca)',
    href: 'https://data.novascotia.ca/Fishing-and-Aquaculture/Nova-Scotia-Marine-Aquaculture-Leases/h57h-p9mm',
    caveat: 'All-aquaculture leases; "marine plant" (seaweed) leases are flagged via the species field — these are multi-species leases that include seaweed, not seaweed-only farms.',
  },
  nsRockweed: {
    source: 'Nova Scotia — Rockweed Leases (data.novascotia.ca)',
    href: 'https://data.novascotia.ca/Fishing-and-Aquaculture/Nova-Scotia-Rockweed-Leases/exhe-htib',
    caveat: 'Dedicated wild-rockweed harvest leases (seaweed-specific). Areas are large coastal harvest zones, not cultivation farms.',
  },
}

// Master framing for the Licensing & Sites tab.
export const CANADA_LICENSING_INTRO = {
  title: 'Canada · Aquaculture Licensing & Sites',
  description:
    'Licensing, site counts and permitted area for the Cultivation & Harvesting KPI set. ' +
    'Only Nova Scotia separates seaweed (via "marine plant" leases and a dedicated wild ' +
    'rockweed lease set); BC site counts are all-aquaculture because DFO does not license ' +
    'seaweed in BC. Site/area figures are current-valid snapshots, not time series.',
  sourcesLine:
    'Sources: DFO BC aquaculture licence holders · Nova Scotia Marine Aquaculture & Rockweed Leases · Statistics Canada Table 32-10-0108',
}

// Short tags shown in KPI-card subtext (kept terse for the small footer).
export const KPI_TAGS = {
  seaweedSpecific: 'Seaweed-specific · UN Comtrade HS 1212',
  aquaAggregate: 'All aquaculture · StatCan',
}

// Master framing for the tab header.
export const CANADA_INTRO = {
  title: 'Canada · Seaweed & Aquaculture Economics',
  description:
    'Canadian economic indicators for the Economic KPI set. Only export value is ' +
    'reported for seaweed specifically (HS 1212 trade codes); the production, ' +
    'value-added and interprovincial-trade series come from Statistics Canada and ' +
    'cover all aquaculture (finfish + shellfish), shown here with that caveat.',
  sourcesLine:
    'Sources: UN Comtrade (HS 1212) · Statistics Canada Tables 32-10-0107, 32-10-0108, 12-10-0088 · Fisheries and Oceans Canada',
}
