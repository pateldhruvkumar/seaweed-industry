import pytest
from unittest.mock import MagicMock, patch
import pipeline
import embeddings as emb
from db import load_tables


_DEFAULT_ENRICHMENT = '{"summary": "Result summary.", "suggestions": ["a", "b"], "chart": null}'


def _make_groq_mock(sql: str, enrichment: str = _DEFAULT_ENRICHMENT):
    """First create() call returns SQL; second returns the enrichment JSON string."""
    mock = MagicMock()
    first_call = MagicMock()
    first_call.choices[0].message.content = sql
    second_call = MagicMock()
    second_call.choices[0].message.content = enrichment
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
            '{"summary": "China leads seaweed production in 2022.", "suggestions": ["How has China changed since 2010?", "Compare China vs Indonesia"], "chart": null}',
        )
        result = pipeline.run("top 5 countries in 2022", [], groq)
    assert result["type"] == "table"
    assert len(result["data"]) == 5
    assert "Country_Name" in result["data"][0]
    assert result["answer"] == "China leads seaweed production in 2022."
    assert result["suggestions"] == ["How has China changed since 2010?", "Compare China vs Indonesia"]
    assert result["chart"] is None


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


def test_extract_json_plain():
    assert pipeline._extract_json('{"a": 1}') == {"a": 1}


def test_extract_json_with_fences_and_prose():
    raw = 'Sure! ```json\n{"a": 1, "b": "x"}\n``` done'
    assert pipeline._extract_json(raw) == {"a": 1, "b": "x"}


def test_extract_json_invalid_returns_none():
    assert pipeline._extract_json("not json at all") is None
    assert pipeline._extract_json("") is None


def test_validate_chart_valid():
    cols = ["PERIOD", "VALUE", "Country_Name"]
    chart = {"kind": "line", "x": "PERIOD", "y": "VALUE", "series": "Country_Name"}
    assert pipeline._validate_chart(chart, cols) == chart


def test_validate_chart_unknown_kind():
    assert pipeline._validate_chart(
        {"kind": "pie", "x": "PERIOD", "y": "VALUE"}, ["PERIOD", "VALUE"]
    ) is None


def test_validate_chart_missing_column():
    assert pipeline._validate_chart(
        {"kind": "bar", "x": "nope", "y": "VALUE"}, ["PERIOD", "VALUE"]
    ) is None


def test_validate_chart_drops_bad_series():
    out = pipeline._validate_chart(
        {"kind": "line", "x": "PERIOD", "y": "VALUE", "series": "nope"},
        ["PERIOD", "VALUE"],
    )
    assert out == {"kind": "line", "x": "PERIOD", "y": "VALUE", "series": None}


def test_coerce_suggestions_caps_and_filters():
    assert pipeline._coerce_suggestions(["a", "  b  ", "", 5, "c", "d"]) == ["a", "b", "c"]


def test_coerce_suggestions_non_list():
    assert pipeline._coerce_suggestions("nope") == []
    assert pipeline._coerce_suggestions(None) == []


def test_extract_json_ignores_trailing_object():
    raw = '{"a": 1}  some note: {"b": 2}'
    assert pipeline._extract_json(raw) == {"a": 1}


def test_extract_json_brace_inside_string():
    raw = '{"summary": "growth was { strong } overall"}'
    assert pipeline._extract_json(raw) == {"summary": "growth was { strong } overall"}


def test_extract_json_nested_object():
    raw = '{"chart": {"kind": "line"}, "suggestions": ["a"]}'
    assert pipeline._extract_json(raw) == {"chart": {"kind": "line"}, "suggestions": ["a"]}


def test_run_table_includes_valid_chart(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            '{"summary": "s", "suggestions": [], "chart": {"kind": "bar", "x": "Country_Name", "y": "total", "series": null}}',
        )
        result = pipeline.run("top 5 countries in 2022", [], groq)
    assert result["chart"] == {"kind": "bar", "x": "Country_Name", "y": "total", "series": None}


def test_run_table_drops_chart_with_unknown_column(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            '{"summary": "s", "suggestions": [], "chart": {"kind": "bar", "x": "nope", "y": "total"}}',
        )
        result = pipeline.run("top 5 countries in 2022", [], groq)
    assert result["chart"] is None


def test_run_table_malformed_enrichment_falls_back(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            "I'm sorry, here is the data but not as JSON.",
        )
        result = pipeline.run("top 5 countries in 2022", [], groq)
    assert result["type"] == "table"
    assert result["suggestions"] == []
    assert result["chart"] is None
    assert isinstance(result["answer"], str) and result["answer"]


def test_run_scalar_has_empty_chart_and_suggestions(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock(
            "SELECT COUNT(DISTINCT Country_Name) AS n FROM seaweed_global_production"
        )
        result = pipeline.run("how many countries are there?", [], groq)
    assert result["type"] == "scalar"
    assert result["chart"] is None
    assert result["suggestions"] == []
    assert groq.chat.completions.create.call_count == 1
