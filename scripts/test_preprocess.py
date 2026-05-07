import json, pytest
from pathlib import Path

DATA = Path(__file__).parent.parent / 'public' / 'data'

def load(f):
    return json.loads((DATA / f).read_text())

def test_global_production_shape():
    data = load('global_production_by_source.json')
    assert isinstance(data, list) and len(data) > 0
    r = data[0]
    assert {'year', 'source', 'value_mt'} <= r.keys()
    assert isinstance(r['year'], int)
    assert isinstance(r['value_mt'], float)

def test_aquaculture_share_range():
    data = load('aquaculture_share.json')
    for r in data:
        assert 0 <= r['share_pct'] <= 100

def test_capture_vs_aquaculture_both_keys():
    data = load('capture_vs_aquaculture.json')
    r = data[0]
    assert 'capture_mt' in r and 'aquaculture_mt' in r

def test_country_species_matrix_shape():
    data = load('country_species_matrix.json')
    assert 'countries' in data and 'species' in data and 'values' in data
    assert len(data['values']) == len(data['countries'])
    assert len(data['values'][0]) == len(data['species'])

def test_records_per_year_structure():
    data = load('records_per_year.json')
    assert 'records' in data and 'quality_summary' in data
    assert len(data['records']) > 0
    assert 'global_production' in data['quality_summary']

def test_status_distribution_datasets():
    data = load('status_distribution.json')
    for key in ['global_production', 'aquaculture_quantity', 'aquaculture_value', 'capture_quantity']:
        assert key in data
        assert sum(r['pct'] for r in data[key]) == pytest.approx(100, abs=1)

def test_all_18_files_exist():
    expected = [
        'global_production_by_source.json', 'aquaculture_share.json',
        'capture_vs_aquaculture.json', 'country_totals.json',
        'country_timeseries.json', 'by_continent.json', 'by_income_group.json',
        'species_totals.json', 'country_species_matrix.json', 'env_quantity.json',
        'env_share.json', 'price_global.json', 'price_by_env.json',
        'country_value_volume.json', 'species_price_table.json',
        'status_distribution.json', 'value_distribution.json', 'records_per_year.json',
    ]
    for f in expected:
        assert (DATA / f).exists(), f'{f} missing'
