import pandas as pd
import numpy as np
import json
from pathlib import Path

# Resolve relative to the repo root. From scripts/preprocess.py:
#   .parent          = scripts/
#   .parent.parent   = repo root  (seaweed-industry/)
DATA_DIR = Path(__file__).parent.parent / 'dataset'
OUT_DIR  = Path(__file__).parent.parent / 'public' / 'data'
OUT_DIR.mkdir(parents=True, exist_ok=True)

STATUS_MAP = {
    'A': 'Official', 'E': 'Estimate', 'I': 'FAO inferred',
    'N': 'Not separately available', 'Q': 'Approximate',
}
ENV_MAP    = {'MA': 'Marine', 'BW': 'Brackish water', 'IN': 'Inland/freshwater'}
SOURCE_MAP = {
    'CAPTURE': 'Capture (wild)',
    'MARINE': 'Aquaculture - marine',
    'BRACKISHWATER': 'Aquaculture - brackish',
    'FRESHWATER': 'Aquaculture - freshwater',
}

print('Loading CSVs...')
aqua_qty   = pd.read_csv(DATA_DIR / 'seaweed_aquaculture_quantity.csv')
aqua_val   = pd.read_csv(DATA_DIR / 'seaweed_aquaculture_value.csv')
capture    = pd.read_csv(DATA_DIR / 'seaweed_capture_quantity.csv')
production = pd.read_csv(DATA_DIR / 'seaweed_global_production.csv')

for df in [aqua_qty, aqua_val, capture, production]:
    df['STATUS_LABEL'] = df['STATUS'].map(STATUS_MAP)
    if 'ENVIRONMENT.ALPHA_2_CODE' in df.columns:
        df['ENVIRONMENT_LABEL'] = df['ENVIRONMENT.ALPHA_2_CODE'].map(ENV_MAP)
    if 'PRODUCTION_SOURCE_DET.CODE' in df.columns:
        df['SOURCE_LABEL'] = df['PRODUCTION_SOURCE_DET.CODE'].map(SOURCE_MAP)


def _safe(x):
    if isinstance(x, float) and np.isnan(x):
        return None
    if isinstance(x, (np.integer,)):
        return int(x)
    if isinstance(x, (np.floating,)):
        return float(x)
    return x


def write_json(obj, filename):
    path = OUT_DIR / filename
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, separators=(',', ':'), default=_safe)
    count = len(obj) if isinstance(obj, list) else 'obj'
    size  = path.stat().st_size / 1024
    print(f'  {filename:<48} {str(count):>8}  {size:>7.1f} KB')


print('\nGenerating JSON files:')

# ── 1. global_production_by_source.json ──────────────────────────────────────
df = production.groupby(['PERIOD', 'SOURCE_LABEL'])['VALUE'].sum().reset_index()
write_json(
    [{'year': int(r.PERIOD), 'source': r.SOURCE_LABEL, 'value_mt': round(r.VALUE / 1e6, 4)}
     for _, r in df.iterrows() if pd.notna(r.SOURCE_LABEL)],
    'global_production_by_source.json',
)

# ── 2. aquaculture_share.json ─────────────────────────────────────────────────
total_yr = production.groupby('PERIOD')['VALUE'].sum()
aqua_yr  = production[production['SOURCE_LABEL'] != 'Capture (wild)'].groupby('PERIOD')['VALUE'].sum()
share    = (aqua_yr / total_yr * 100).dropna()
write_json(
    [{'year': int(y), 'share_pct': round(float(v), 2)} for y, v in share.items()],
    'aquaculture_share.json',
)

# ── 3. capture_vs_aquaculture.json ────────────────────────────────────────────
cap_yr  = capture.groupby('PERIOD')['VALUE'].sum().div(1e6)
aqua_yr = aqua_qty.groupby('PERIOD')['VALUE'].sum().div(1e6)
years   = sorted(set(cap_yr.index) | set(aqua_yr.index))
write_json(
    [{'year': int(y),
      'capture_mt':    round(float(cap_yr.get(y, 0)), 4),
      'aquaculture_mt': round(float(aqua_yr.get(y, 0)), 4)}
     for y in years],
    'capture_vs_aquaculture.json',
)

# ── 4. country_totals.json ────────────────────────────────────────────────────
max_yr  = int(production['PERIOD'].max())
windows = [
    (max_yr - 4,  max_yr),
    (max_yr - 9,  max_yr - 5),
    (max_yr - 14, max_yr - 10),
    (2000, 2004),
    (1990, 1994),
    (1970, 1974),
]
rows = []
for yr_s, yr_e in windows:
    df = production[production['PERIOD'].between(yr_s, yr_e)]
    totals = df.groupby('Country_Name')['VALUE'].sum().div(5).div(1e6)
    for country, val in totals.items():
        rows.append({'country': country, 'year_start': yr_s, 'year_end': yr_e,
                     'avg_tonnes_mt': round(float(val), 4)})
write_json(rows, 'country_totals.json')

# ── 5. country_timeseries.json ────────────────────────────────────────────────
df = production.groupby(['PERIOD', 'Country_Name'])['VALUE'].sum().reset_index()
write_json(
    [{'year': int(r.PERIOD), 'country': r.Country_Name, 'value_mt': round(r.VALUE / 1e6, 4)}
     for _, r in df.iterrows()],
    'country_timeseries.json',
)

# ── 6. by_continent.json ──────────────────────────────────────────────────────
df = production.groupby(['PERIOD', 'Continent_Group_En'])['VALUE'].sum().reset_index()
write_json(
    [{'year': int(r.PERIOD), 'continent': r.Continent_Group_En, 'value_mt': round(r.VALUE / 1e6, 4)}
     for _, r in df.iterrows() if pd.notna(r.Continent_Group_En)],
    'by_continent.json',
)

# ── 7. by_income_group.json ───────────────────────────────────────────────────
df = production.groupby(['PERIOD', 'EcoClass_Group_En'])['VALUE'].sum().reset_index()
write_json(
    [{'year': int(r.PERIOD), 'income_group': r.EcoClass_Group_En, 'value_mt': round(r.VALUE / 1e6, 4)}
     for _, r in df.iterrows() if pd.notna(r.EcoClass_Group_En)],
    'by_income_group.json',
)

# ── 8. species_totals.json ────────────────────────────────────────────────────
rows = []
for yr_s, yr_e in windows:
    df = production[production['PERIOD'].between(yr_s, yr_e)]
    totals = df.groupby('Seaweed_Name')['VALUE'].sum().div(5).div(1e6)
    for species, val in totals.items():
        if pd.notna(species):
            rows.append({'species': species, 'year_start': yr_s, 'year_end': yr_e,
                         'avg_tonnes_mt': round(float(val), 4)})
write_json(rows, 'species_totals.json')

# ── 9. country_species_matrix.json ───────────────────────────────────────────
recent = production[production['PERIOD'].between(max_yr - 4, max_yr)]
c_order = recent.groupby('Country_Name')['VALUE'].sum().sort_values(ascending=False).head(10).index.tolist()
s_order = recent.groupby('Seaweed_Name')['VALUE'].sum().sort_values(ascending=False).head(10).index.tolist()
s_order = [s for s in s_order if pd.notna(s)]
mat = (recent[recent['Country_Name'].isin(c_order) & recent['Seaweed_Name'].isin(s_order)]
       .groupby(['Country_Name', 'Seaweed_Name'])['VALUE'].sum().div(5).div(1e3)
       .unstack(fill_value=0)
       .reindex(index=c_order, columns=s_order, fill_value=0))
write_json(
    {'countries': c_order, 'species': s_order,
     'values': [[round(float(v), 1) for v in row] for row in mat.values.tolist()]},
    'country_species_matrix.json',
)

# ── 10. env_quantity.json ─────────────────────────────────────────────────────
df = aqua_qty.groupby(['PERIOD', 'ENVIRONMENT_LABEL'])['VALUE'].sum().reset_index()
write_json(
    [{'year': int(r.PERIOD), 'environment': r.ENVIRONMENT_LABEL, 'value_mt': round(r.VALUE / 1e6, 4)}
     for _, r in df.iterrows() if pd.notna(r.ENVIRONMENT_LABEL)],
    'env_quantity.json',
)

# ── 11. env_share.json ────────────────────────────────────────────────────────
pivot  = aqua_qty.groupby(['PERIOD', 'ENVIRONMENT_LABEL'])['VALUE'].sum().unstack(fill_value=0)
pshare = pivot.div(pivot.sum(axis=1), axis=0) * 100
rows = []
for year, row in pshare.iterrows():
    for env, pct in row.items():
        if pd.notna(env):
            rows.append({'year': int(year), 'environment': env, 'share_pct': round(float(pct), 2)})
write_json(rows, 'env_share.json')

# ── 12–13. price JSON files ───────────────────────────────────────────────────
join_keys = ['COUNTRY.UN_CODE', 'SPECIES.ALPHA_3_CODE', 'AREA.CODE',
             'ENVIRONMENT.ALPHA_2_CODE', 'PERIOD']
merged = aqua_val.merge(
    aqua_qty[join_keys + ['VALUE']].rename(columns={'VALUE': 'QUANTITY_TONNES'}),
    on=join_keys, how='inner',
)
merged.rename(columns={'VALUE': 'VALUE_USD_1000'}, inplace=True)

pg = (merged.groupby('PERIOD')
      .apply(lambda g: (g['VALUE_USD_1000'].sum() * 1000) / g['QUANTITY_TONNES'].sum()
             if g['QUANTITY_TONNES'].sum() > 0 else None, include_groups=False)
      .dropna())
write_json(
    [{'year': int(y), 'usd_per_tonne': round(float(v), 2)} for y, v in pg.items()],
    'price_global.json',
)

pe = (merged.groupby(['PERIOD', 'ENVIRONMENT_LABEL'])
      .apply(lambda g: (g['VALUE_USD_1000'].sum() * 1000) / g['QUANTITY_TONNES'].sum()
             if g['QUANTITY_TONNES'].sum() > 0 else None, include_groups=False)
      .reset_index().rename(columns={0: 'usd_per_tonne'})
      .dropna(subset=['usd_per_tonne']))
write_json(
    [{'year': int(r.PERIOD), 'environment': r.ENVIRONMENT_LABEL,
      'usd_per_tonne': round(float(r.usd_per_tonne), 2)}
     for _, r in pe.iterrows() if pd.notna(r.ENVIRONMENT_LABEL)],
    'price_by_env.json',
)

# ── 14. country_value_volume.json ─────────────────────────────────────────────
rows = []
for yr_s, yr_e in windows[:3]:
    df = merged[merged['PERIOD'].between(yr_s, yr_e)]
    agg = df.groupby('Country_Name').agg(
        tonnes=('QUANTITY_TONNES', 'sum'),
        value_kusd=('VALUE_USD_1000', 'sum'),
    ).div(yr_e - yr_s + 1)
    for country, r in agg.iterrows():
        if r.tonnes > 100:
            rows.append({
                'country': country, 'year_start': yr_s, 'year_end': yr_e,
                'avg_tonnes': round(float(r.tonnes), 1),
                'avg_value_musd': round(float(r.value_kusd) / 1000, 3),
                'usd_per_tonne': round(float(r.value_kusd) * 1000 / r.tonnes, 1)
                                 if r.tonnes > 0 else None,
            })
write_json(rows, 'country_value_volume.json')

# ── 15. species_price_table.json ──────────────────────────────────────────────
rows = []
for yr in sorted(merged['PERIOD'].unique(), reverse=True):
    df = merged[merged['PERIOD'] == yr]
    agg = (df.groupby('Seaweed_Name')
           .apply(lambda g: pd.Series({
               'tonnes':       g['QUANTITY_TONNES'].sum(),
               'value_kusd':   g['VALUE_USD_1000'].sum(),
               'usd_per_tonne': (g['VALUE_USD_1000'].sum() * 1000 / g['QUANTITY_TONNES'].sum()
                                 if g['QUANTITY_TONNES'].sum() > 0 else None),
           }), include_groups=False)
           .query('tonnes > 100')
           .reset_index())
    for _, r in agg.iterrows():
        if pd.notna(r.Seaweed_Name):
            rows.append({
                'year': int(yr), 'species': r.Seaweed_Name,
                'tonnes': round(float(r.tonnes), 1),
                'value_kusd': round(float(r.value_kusd), 1),
                'usd_per_tonne': round(float(r.usd_per_tonne), 1)
                                 if r.usd_per_tonne is not None else None,
            })
write_json(rows, 'species_price_table.json')

# ── 16. status_distribution.json ─────────────────────────────────────────────
ds_map = {
    'global_production': production,
    'aquaculture_quantity': aqua_qty,
    'aquaculture_value': aqua_val,
    'capture_quantity': capture,
}
status_dist = {}
for name, df in ds_map.items():
    counts = df['STATUS_LABEL'].value_counts(normalize=True).mul(100).round(1)
    status_dist[name] = [{'status': k, 'pct': float(v)} for k, v in counts.items()]
write_json(status_dist, 'status_distribution.json')

# ── 17. value_distribution.json ──────────────────────────────────────────────
val_dist = {}
for name, df in ds_map.items():
    s = np.log10(df['VALUE'].replace(0, np.nan).dropna())
    counts, edges = np.histogram(s, bins=50)
    val_dist[name] = [
        {'bin_start': round(float(edges[i]), 3),
         'bin_end':   round(float(edges[i + 1]), 3),
         'count':     int(counts[i])}
        for i in range(len(counts))
    ]
write_json(val_dist, 'value_distribution.json')

# ── 18. records_per_year.json ─────────────────────────────────────────────────
rec_rows = []
for name, df in ds_map.items():
    for year, count in df.groupby('PERIOD').size().items():
        rec_rows.append({'year': int(year), 'dataset': name, 'count': int(count)})

quality_summary = {}
for name, df in ds_map.items():
    quality_summary[name] = {
        'rows':               int(len(df)),
        'cols':               int(df.shape[1]),
        'null_cells_total':   int(df.isna().sum().sum()),
        'rows_with_any_null': int(df.isna().any(axis=1).sum()),
        'value_zeros':        int((df['VALUE'] == 0).sum()),
        'value_nulls':        int(df['VALUE'].isna().sum()),
        'duplicate_rows':     int(df.duplicated().sum()),
    }

write_json({'records': rec_rows, 'quality_summary': quality_summary}, 'records_per_year.json')

# ── 19. global_aquaculture_value_yearly.json ─────────────────────────────────
# Total aquaculture VALUE per year, summed across all countries / species /
# environments. Source values are in $1000 USD (FAO convention) — divide by
# 1000 to surface as million-USD ($M) for chart-friendly numbers.
df = aqua_val.groupby('PERIOD')['VALUE'].sum().div(1000)
write_json(
    [{'year': int(y), 'value_musd': round(float(v), 2)} for y, v in df.items()],
    'global_aquaculture_value_yearly.json',
)

# ── 20. value_by_env_yearly.json ─────────────────────────────────────────────
# Same total, but stacked by farming environment (Marine / Brackish / Inland).
df = (aqua_val.groupby(['PERIOD', 'ENVIRONMENT_LABEL'])['VALUE']
              .sum().div(1000).reset_index())
write_json(
    [{'year': int(r.PERIOD), 'environment': r.ENVIRONMENT_LABEL,
      'value_musd': round(float(r.VALUE), 4)}
     for _, r in df.iterrows() if pd.notna(r.ENVIRONMENT_LABEL)],
    'value_by_env_yearly.json',
)

# ── 21. country_value_yearly.json ────────────────────────────────────────────
# Country-level value per year — used for the "export value" KPI (proxy)
# and as the source for top-producer-by-value time-series charts.
df = (aqua_val.groupby(['PERIOD', 'Country_Name'])['VALUE']
              .sum().div(1000).reset_index())
write_json(
    [{'year': int(r.PERIOD), 'country': r.Country_Name,
      'value_musd': round(float(r.VALUE), 4)}
     for _, r in df.iterrows()],
    'country_value_yearly.json',
)

# ── EDA: summary stats per dataset ───────────────────────────────────────────
EDA_DATASETS = [
    ('global_production',     production),
    ('aquaculture_quantity',  aqua_qty),
    ('aquaculture_value',     aqua_val),
    ('capture_quantity',      capture),
]

eda_summary = []
for name, df in EDA_DATASETS:
    v = df['VALUE'].dropna()
    eda_summary.append({
        'dataset':     name,
        'rows':        int(len(df)),
        'year_min':    int(df['PERIOD'].min()),
        'year_max':    int(df['PERIOD'].max()),
        'n_countries': int(df['COUNTRY.UN_CODE'].nunique()),
        'n_species':   int(df['SPECIES.ALPHA_3_CODE'].nunique())
                       if 'SPECIES.ALPHA_3_CODE' in df.columns else None,
        'mean':        round(float(v.mean()), 2),
        'median':      round(float(v.median()), 2),
        'std':         round(float(v.std()), 2),
        'min':         round(float(v.min()), 2),
        'p25':         round(float(v.quantile(0.25)), 2),
        'p75':         round(float(v.quantile(0.75)), 2),
        'max':         round(float(v.max()), 2),
    })
write_json(eda_summary, 'eda_summary_stats.json')

# ── EDA: missing-data % per column per dataset ───────────────────────────────
eda_missing = {}
for name, df in EDA_DATASETS:
    cols = []
    for c in df.columns:
        null_pct = round(float(df[c].isna().mean() * 100), 2)
        cols.append({'column': c, 'null_pct': null_pct})
    cols.sort(key=lambda x: x['null_pct'], reverse=True)
    eda_missing[name] = cols
write_json(eda_missing, 'eda_missing_data.json')

# ── EDA: unique countries / species reporting per year ───────────────────────
eda_unique_per_year = {}
for name, df in EDA_DATASETS:
    rows = []
    grouped = df.groupby('PERIOD').agg(
        n_countries=('COUNTRY.UN_CODE', 'nunique'),
        n_species=('SPECIES.ALPHA_3_CODE', 'nunique')
                   if 'SPECIES.ALPHA_3_CODE' in df.columns else ('COUNTRY.UN_CODE', 'size'),
    ).reset_index()
    for _, r in grouped.iterrows():
        rows.append({
            'year':        int(r['PERIOD']),
            'n_countries': int(r['n_countries']),
            'n_species':   int(r['n_species'])
                           if 'SPECIES.ALPHA_3_CODE' in df.columns else None,
        })
    eda_unique_per_year[name] = rows
write_json(eda_unique_per_year, 'eda_unique_per_year.json')

# ── EDA: value vs. quantity scatter (aquaculture, country-species-year) ──────
# Pre-aggregate across ENVIRONMENT before merging so multi-environment rows
# don't produce a fan-out Cartesian product on the country-species-year key.
join_cols = ['COUNTRY.UN_CODE', 'SPECIES.ALPHA_3_CODE', 'PERIOD']
qty_slim = (aqua_qty.groupby(join_cols + ['Country_Name'], as_index=False)['VALUE']
                    .sum()
                    .rename(columns={'VALUE': 'qty'}))
val_slim = (aqua_val.groupby(join_cols, as_index=False)['VALUE']
                    .sum()
                    .rename(columns={'VALUE': 'value'}))
joined = qty_slim.merge(val_slim, on=join_cols, how='inner')
joined = joined[(joined['qty'] > 0) & (joined['value'] > 0)]
write_json(
    [{'country': r['Country_Name'], 'year': int(r['PERIOD']),
      'qty':   round(float(r['qty']), 3),
      'value': round(float(r['value']), 3)}
     for _, r in joined.iterrows()],
    'eda_value_quantity_scatter.json',
)

# ── EDA: top-20 country production correlation matrix ────────────────────────
top20 = (production.groupby('Country_Name')['VALUE'].sum()
         .sort_values(ascending=False).head(20).index.tolist())
yearly = (production[production['Country_Name'].isin(top20)]
          .groupby(['PERIOD', 'Country_Name'])['VALUE'].sum()
          .unstack(fill_value=0)
          .reindex(columns=top20))
corr = yearly.corr().round(3)
write_json(
    {
        'countries': top20,
        'matrix': [[None if pd.isna(v) else float(v) for v in row]
                   for row in corr.values.tolist()],
    },
    'eda_country_correlation.json',
)

# ── EDA: boxplot stats + IQR outlier counts on log10(VALUE) ──────────────────
eda_outliers = {}
for name, df in EDA_DATASETS:
    nz = df.loc[df['VALUE'] > 0, 'VALUE'].dropna()
    log_v = np.log10(nz)
    q1, med, q3 = log_v.quantile([0.25, 0.5, 0.75])
    iqr = q3 - q1
    lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    n_out = int(((log_v < lo) | (log_v > hi)).sum())
    eda_outliers[name] = {
        'q1':             round(float(q1), 3),
        'median':         round(float(med), 3),
        'q3':             round(float(q3), 3),
        'lower_whisker':  round(float(lo), 3),
        'upper_whisker':  round(float(hi), 3),
        'n_outliers':     n_out,
        'total':          int(len(log_v)),
    }
write_json(eda_outliers, 'eda_outliers.json')

print(f'\nDone — all JSON files written to {OUT_DIR}')
