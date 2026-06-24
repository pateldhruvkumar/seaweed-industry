import pytest
from unittest.mock import MagicMock, patch
import pipeline
import embeddings as emb
from db import load_tables


_DEFAULT_ENRICHMENT = '{"summary": "Result summary.", "suggestions": ["a", "b"], "chart": null}'


def _make_llm_mock_seq(*contents):
    """Each create() call returns the next content; the last one repeats forever."""
    mock = MagicMock()
    completions = []
    for content in contents:
        c = MagicMock()
        c.choices[0].message.content = content
        completions.append(c)

    def next_completion(*args, **kwargs):
        return completions.pop(0) if len(completions) > 1 else completions[0]

    mock.chat.completions.create.side_effect = next_completion
    return mock


def _make_llm_mock(sql: str, enrichment: str = _DEFAULT_ENRICHMENT):
    """First create() call returns SQL; second returns the enrichment JSON string."""
    return _make_llm_mock_seq(sql, enrichment)


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
        llm = _make_llm_mock(
            "SELECT COUNT(DISTINCT Country_Name) AS n FROM seaweed_global_production"
        )
        result = pipeline.run("how many countries are there?", [], llm)
    assert result["type"] == "scalar"
    assert isinstance(result["data"], list)
    assert len(result["data"]) == 1


def test_run_returns_table(conn):
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            '{"summary": "China leads seaweed production in 2022.", "suggestions": ["How has China changed since 2010?", "Compare China vs Indonesia"], "chart": null}',
        )
        result = pipeline.run("top 5 countries in 2022", [], llm)
    assert result["type"] == "table"
    assert len(result["data"]) == 5
    assert "Country_Name" in result["data"][0]
    assert result["answer"] == "China leads seaweed production in 2022."
    assert result["suggestions"] == ["How has China changed since 2010?", "Compare China vs Indonesia"]
    assert result["chart"] is None


_BAD_WINDOW_SQL = (
    "SELECT * FROM (SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production "
    "GROUP BY Country_Name) WHERE row_number() OVER (ORDER BY total DESC) = 6"
)
_FIXED_WINDOW_SQL = (
    "SELECT * FROM (SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production "
    "GROUP BY Country_Name) QUALIFY row_number() OVER (ORDER BY total DESC) = 6"
)


def test_run_repairs_failed_sql(conn):
    """A DuckDB error is fed back to the model, which gets to correct its SQL."""
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock_seq(_BAD_WINDOW_SQL, _FIXED_WINDOW_SQL, _DEFAULT_ENRICHMENT)
        result = pipeline.run("production volume of the 6th ranked country", [], llm)
    assert result["type"] == "table"
    assert result["sql"] == _FIXED_WINDOW_SQL
    assert len(result["data"]) == 1
    assert llm.chat.completions.create.call_count == 3  # bad sql, fixed sql, enrichment

    # The repair turn shows the model its own SQL and the database error.
    repair_messages = llm.chat.completions.create.call_args_list[1].kwargs["messages"]
    assert repair_messages[-2] == {"role": "assistant", "content": _BAD_WINDOW_SQL}
    assert repair_messages[-1]["role"] == "user"
    assert "window functions" in repair_messages[-1]["content"]


def test_run_gives_up_after_max_attempts(conn):
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock_seq("SELECT nonexistent_column FROM seaweed_global_production")
        result = pipeline.run("give me nonsense", [], llm)
    assert result["type"] == "error"
    assert "Query failed" in result["answer"]
    assert llm.chat.completions.create.call_count == pipeline.MAX_SQL_ATTEMPTS


def test_run_allows_cte_select(conn):
    """Models often write rankings as CTEs; WITH ... SELECT is still read-only."""
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock(
            "WITH t AS (SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production "
            "GROUP BY Country_Name ORDER BY total DESC NULLS LAST LIMIT 5) SELECT * FROM t"
        )
        result = pipeline.run("top 5 countries as a cte", [], llm)
    assert result["type"] == "table"
    assert len(result["data"]) == 5


def test_run_rejects_multi_statement(conn):
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock("SELECT 1; DROP TABLE seaweed_global_production")
        result = pipeline.run("sneaky", [], llm)
    assert result["type"] == "error"
    assert "can only read" in result["answer"]


def test_run_refuses_write_intent_token(conn):
    """The prompt tells the model to emit REFUSE_WRITE for modify/delete requests;
    the pipeline must turn that into an explicit refusal, not retry it as bad SQL."""
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock_seq("REFUSE_WRITE")
        result = pipeline.run("Delete all the production records for China", [], llm)
    assert result["type"] == "error"
    assert "write" in result["answer"].lower()
    assert "delete" in result["answer"].lower()
    assert "nothing was changed" in result["answer"].lower()
    assert llm.chat.completions.create.call_count == 1


def test_run_refuses_write_without_retry(conn):
    """Write intent is refused immediately - repairing a DELETE into a SELECT
    would silently answer a question the user didn't ask."""
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock_seq(
            "DELETE FROM seaweed_global_production WHERE Country_Name = 'China'"
        )
        result = pipeline.run("Delete all the production records for China", [], llm)
    assert result["type"] == "error"
    assert "can only read" in result["answer"]
    assert "nothing was changed" in result["answer"].lower()
    assert llm.chat.completions.create.call_count == 1


def test_run_rejects_non_select(conn):
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock("DROP TABLE seaweed_global_production")
        result = pipeline.run("drop everything", [], llm)
    assert result["type"] == "error"
    assert "can only read" in result["answer"]
    assert llm.chat.completions.create.call_count == 1


def test_run_handles_none_content(conn):
    """Reasoning models can return content=None when the token budget is spent on reasoning."""
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock(None)
        result = pipeline.run("how many countries are there?", [], llm)
    assert result["type"] == "error"
    assert isinstance(result["answer"], str) and result["answer"]


def test_run_handles_bad_sql(conn):
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock("SELECT nonexistent_column FROM seaweed_global_production")
        result = pipeline.run("give me nonsense", [], llm)
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


def test_coerce_suggestions_dedupes():
    assert pipeline._coerce_suggestions(["a", "a", "  a  ", "b", "b", "c", "d"]) == ["a", "b", "c"]


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
        llm = _make_llm_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            '{"summary": "s", "suggestions": [], "chart": {"kind": "bar", "x": "Country_Name", "y": "total", "series": null}}',
        )
        result = pipeline.run("top 5 countries in 2022", [], llm)
    assert result["chart"] == {"kind": "bar", "x": "Country_Name", "y": "total", "series": None}


def test_run_table_drops_chart_with_unknown_column(conn):
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            '{"summary": "s", "suggestions": [], "chart": {"kind": "bar", "x": "nope", "y": "total"}}',
        )
        result = pipeline.run("top 5 countries in 2022", [], llm)
    assert result["chart"] is None


def test_run_table_malformed_enrichment_falls_back(conn):
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            "I'm sorry, here is the data but not as JSON.",
        )
        result = pipeline.run("top 5 countries in 2022", [], llm)
    assert result["type"] == "table"
    assert result["suggestions"] == []
    assert result["chart"] is None
    assert isinstance(result["answer"], str) and result["answer"]


def test_run_scalar_has_empty_chart_and_suggestions(conn):
    with patch("pipeline.get_conn", return_value=conn):
        llm = _make_llm_mock(
            "SELECT COUNT(DISTINCT Country_Name) AS n FROM seaweed_global_production"
        )
        result = pipeline.run("how many countries are there?", [], llm)
    assert result["type"] == "scalar"
    assert result["chart"] is None
    assert result["suggestions"] == []
    assert llm.chat.completions.create.call_count == 1
