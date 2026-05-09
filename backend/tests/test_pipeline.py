import pytest
from unittest.mock import MagicMock, patch
import pipeline
import embeddings as emb
from db import load_tables


def _make_groq_mock(sql: str, summary: str = "Result summary."):
    mock = MagicMock()
    first_call = MagicMock()
    first_call.choices[0].message.content = sql
    second_call = MagicMock()
    second_call.choices[0].message.content = summary
    mock.chat.completions.create.side_effect = [first_call, second_call]
    return mock


@pytest.fixture(scope="module")
def conn():
    c = load_tables()
    emb.load_model()
    emb.build_entity_index(c)
    emb.build_fewshot_index_from_list([
        {"question": "top countries 2022", "sql": "SELECT Country_Name FROM seaweed_global_production LIMIT 1"}
    ])
    return c


def test_run_returns_scalar(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock(
            "SELECT COUNT(DISTINCT Country_Name) AS n FROM seaweed_global_production"
        )
        result = pipeline.run("how many countries are there?", [], groq)
    assert result["type"] == "scalar"
    assert isinstance(result["data"], list)
    assert len(result["data"]) == 1


def test_run_returns_table(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            "China leads seaweed production in 2022."
        )
        result = pipeline.run("top 5 countries in 2022", [], groq)
    assert result["type"] == "table"
    assert len(result["data"]) == 5
    assert "Country_Name" in result["data"][0]


def test_run_rejects_non_select(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock("DROP TABLE seaweed_global_production")
        result = pipeline.run("drop everything", [], groq)
    assert result["type"] == "error"
    assert "Only read queries" in result["answer"]


def test_run_handles_bad_sql(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock("SELECT nonexistent_column FROM seaweed_global_production")
        result = pipeline.run("give me nonsense", [], groq)
    assert result["type"] == "error"


def test_extract_sql_strips_fences():
    raw = "```sql\nSELECT 1\n```"
    assert pipeline._extract_sql(raw) == "SELECT 1"


def test_classify_type_scalar():
    assert pipeline._classify_type([{"count": 5}]) == "scalar"


def test_classify_type_table():
    assert pipeline._classify_type([{"a": 1, "b": 2}]) == "table"
    assert pipeline._classify_type([{"a": 1}, {"a": 2}]) == "table"
