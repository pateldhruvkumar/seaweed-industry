import pytest
import numpy as np
from db import load_tables
import embeddings as emb

@pytest.fixture(scope="module")
def conn():
    return load_tables()

@pytest.fixture(scope="module", autouse=True)
def setup(conn):
    emb.load_model()
    emb.build_entity_index(conn)
    emb.build_fewshot_index_from_list([
        {"question": "top countries by production", "sql": "SELECT Country_Name FROM seaweed_global_production LIMIT 5"},
        {"question": "total value for Asia",        "sql": "SELECT SUM(VALUE) FROM seaweed_aquaculture_value WHERE Continent_Group_En='Asia'"},
    ])

def test_model_loads():
    assert emb._model is not None

def test_entity_index_populated():
    assert len(emb._entity_texts) > 0
    assert emb._entity_embeddings is not None
    assert emb._entity_embeddings.shape[0] == len(emb._entity_texts)

def test_resolve_entities_returns_list():
    results = emb.resolve_entities("China seaweed production")
    assert isinstance(results, list)

def test_resolve_entities_finds_china():
    results = emb.resolve_entities("China production")
    assert any("China" in r for r in results)

def test_retrieve_fewshots_returns_dicts():
    results = emb.retrieve_fewshots("which countries produce the most")
    assert isinstance(results, list)
    if results:
        assert "question" in results[0]
        assert "sql" in results[0]

def test_cosine_similarity_shape():
    vecs = np.random.rand(10, 4).astype(np.float32)
    query = np.random.rand(4).astype(np.float32)
    scores = emb._cosine_similarity(query, vecs)
    assert scores.shape == (10,)
