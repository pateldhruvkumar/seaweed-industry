"""
Fetch & slim the Canadian source data for the Canada Economics tab.

Honest-provenance note: Canada does NOT report seaweed separately in any official
aquaculture statistic (StatCan/DFO aquaculture = finfish + shellfish only). Seaweed is
isolated cleanly in exactly one series: international trade under HS 1212.21 / 1212.29.
So this script pulls:

  * Seaweed-SPECIFIC: UN Comtrade exports, Canada, HS 121221 + 121229 (public preview API).
  * All-AQUACULTURE aggregates (shown with a caveat in the UI):
      - StatCan 32-10-0107  Aquaculture, production and value
      - StatCan 32-10-0108  Aquaculture economic statistics, value added account
      - StatCan 12-10-0088  Interprovincial/international trade flows (fishery products)

Outputs slim CSVs into dataset/ (committed). Re-run to refresh:  python scripts/fetch_canada.py
"""
import csv
import io
import json
import ssl
import urllib.request
import zipfile
from pathlib import Path

OUT = Path(__file__).parent.parent / 'dataset'
# StatCan TLS sometimes trips Windows revocation checks; Python uses its own SSL stack,
# but disable verification defensively so the script runs in restricted environments.
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def _get(url, timeout=180):
    req = urllib.request.Request(url, headers={'User-Agent': 'seaweed-dashboard/1.0'})
    return urllib.request.urlopen(req, timeout=timeout, context=CTX).read()


def statcan_full_table(pid):
    """Return rows (list of dicts) for a StatCan table via the Web Data Service zip."""
    meta = json.loads(_get(f'https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/{pid}/en'))
    zurl = meta['object']
    zbytes = _get(zurl)
    with zipfile.ZipFile(io.BytesIO(zbytes)) as z:
        name = next(n for n in z.namelist() if n.lower() == f'{pid}.csv')
        with z.open(name) as f:
            text = io.TextIOWrapper(f, encoding='utf-8-sig')
            return list(csv.DictReader(text))


def write_csv(rows, fields, filename):
    path = OUT / filename
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction='ignore')
        w.writeheader()
        w.writerows(rows)
    print(f'  wrote {filename:<46} {len(rows):>7} rows  {path.stat().st_size/1024:>7.1f} KB')


print('Fetching Canadian source data...')

# ── 1. 32-10-0107 production & value — keep the three totals, all geographies ──
CAT = {'Total aquaculture', 'Total finfish', 'Total shellfish'}
rows = [r for r in statcan_full_table('32100107') if r['Finfish and shellfish'] in CAT]
write_csv(rows,
          ['REF_DATE', 'GEO', 'Finfish and shellfish', 'Production', 'SCALAR_FACTOR', 'VALUE', 'STATUS'],
          'canada_aquaculture_production_value.csv')

# ── 2. 32-10-0108 value-added account — keep the components we surface ──────────
COMP = {'Gross output', 'Gross value added (factor cost)', 'Salaries and wages',
        'Total operating revenue', 'Sales of aqua products and services'}
rows = [r for r in statcan_full_table('32100108') if r['Output and input components'] in COMP]
write_csv(rows,
          ['REF_DATE', 'GEO', 'Output and input components', 'SCALAR_FACTOR', 'VALUE', 'STATUS'],
          'canada_aquaculture_valueadded.csv')

# ── 3. 12-10-0088 interprovincial trade — fishery products only ────────────────
PROD = 'Fish, crustaceans, shellfish and other fishery products [M1140]'
rows = [r for r in statcan_full_table('12100088') if r['Product'] == PROD]
write_csv(rows,
          ['REF_DATE', 'GEO', 'Trade flow detail', 'Product', 'SCALAR_FACTOR', 'VALUE', 'STATUS'],
          'canada_interprovincial_trade.csv')

# ── 4. UN Comtrade — Canada seaweed exports, HS 121221 + 121229 (SEAWEED-SPECIFIC) ─
yrs = ','.join(str(y) for y in range(2012, 2024))
series = {}
for code in ('121221', '121229'):
    url = ('https://comtradeapi.un.org/public/v1/preview/C/A/HS'
           f'?reporterCode=124&period={yrs}&cmdCode={code}&flowCode=X&partnerCode=0')
    data = json.loads(_get(url, timeout=120))['data']
    seen = {}
    for r in data:
        # World partner, all modes of transport, de-dupe dual partner2Code rows (prefer 0)
        if r['partnerCode'] == 0 and r['motCode'] == 0:
            y = int(r['period'])
            if y not in seen or r['partner2Code'] == 0:
                seen[y] = round(r['primaryValue'] or 0)
    for y, v in seen.items():
        series.setdefault(y, {})[code] = v
rows = []
for y in sorted(series):
    food = series[y].get('121221', 0)
    other = series[y].get('121229', 0)
    rows.append({'year': y, 'hs_121221_usd': food, 'hs_121229_usd': other, 'total_usd': food + other})
write_csv(rows, ['year', 'hs_121221_usd', 'hs_121229_usd', 'total_usd'], 'canada_seaweed_exports.csv')

print('Done.')
