import json
import logging
import re
import duckdb
from openai import OpenAI
from db import get_conn
from embeddings import resolve_entities, retrieve_fewshots

logger = logging.getLogger(__name__)

SCHEMA = """
Tables in DuckDB:

seaweed_aquaculture_quantity — farming/cultivation quantity (tonnes)
seaweed_aquaculture_value    — farming/cultivation value (USD)
seaweed_capture_quantity     — wild capture quantity (tonnes)
seaweed_global_production    — combined production, all sources (tonnes)

Shared columns (all tables):
  Country_Name, Seaweed_Name, Scientific_Name, PERIOD (integer year),
  VALUE (numeric), STATUS ('A'=official, 'E'=estimated),
  Continent_Group_En, GeoRegion_Group_En, EcoClass_Group_En, CPC_Class_En

Use seaweed_global_production for general production questions.
Use seaweed_aquaculture_value when the user asks about money or USD value.
PERIOD is an integer, not a string: WHERE PERIOD = 2022
"""

LLM_MODEL = "qwen/qwen3.6-35b-a3b"
# Qwen3.x is a hybrid reasoning model: without this, it spends the max_tokens
# budget on reasoning and can return content=None.
_NO_REASONING = {"reasoning": {"enabled": False}}

# Total SQL generation attempts: 1 initial + repair retries with the DB error
# fed back to the model.
MAX_SQL_ATTEMPTS = 3

_WRITE_REFUSAL = (
    "I can't write, update, or delete data — I can only read it. "
    "Nothing was changed. Try asking a question about the data instead."
)


def _refusal_response(sql: str = "") -> dict:
    return {
        "answer": _WRITE_REFUSAL,
        "sql": sql,
        "data": [],
        "type": "error",
        "chart": None,
        "suggestions": [],
    }


def _build_system_prompt(entity_hints: list[str], fewshots: list[dict]) -> str:
    parts = [
        "You are a SQL expert. Generate DuckDB SQL SELECT statements only.",
        "Never use INSERT, UPDATE, DELETE, DROP, CREATE, or any DDL.",
        "If the user asks you to insert, update, delete, drop, or otherwise modify"
        " the data, do not write any SQL — reply with exactly REFUSE_WRITE.",
        "Return ONLY the SQL query — no explanation, no markdown fences.",
        "When computing a ratio or percent change, wrap the denominator in NULLIF(..., 0)"
        " and add a HAVING clause that excludes rows where the baseline is 0 or NULL.",
        "When using ORDER BY ... DESC for rankings, append NULLS LAST so NULL values do not win the sort.",
        "To pick the Nth-ranked row, use LIMIT 1 OFFSET N-1 or a QUALIFY clause —"
        " window functions are never allowed in WHERE.",
        "",
        "Schema:",
        SCHEMA,
    ]
    if entity_hints:
        parts += [
            "",
            "Entity hints — use exact spelling in WHERE clauses:",
            *[f"  - {h}" for h in entity_hints],
        ]
    if fewshots:
        parts.append("")
        parts.append("Examples:")
        for fs in fewshots:
            parts.append(f"Q: {fs['question']}")
            parts.append(f"SQL: {fs['sql']}")
            parts.append("")
    return "\n".join(parts)


def _extract_sql(text: str) -> str:
    text = re.sub(r"```(?:sql)?", "", text, flags=re.IGNORECASE)
    return text.strip("`\n ")


def _classify_sql(sql: str) -> str:
    """Classify generated SQL as 'select', 'write', or 'invalid'.

    Uses DuckDB's parser rather than a string prefix so WITH ... SELECT
    counts as a select and multi-statement payloads (SELECT 1; DROP ...)
    do not. 'write' covers any non-SELECT statement type and is refused
    without retry — the problem there is intent, not syntax.
    """
    try:
        statements = duckdb.extract_statements(sql)
    except duckdb.Error:
        return "invalid"
    if not statements:
        return "invalid"
    if any(s.type != duckdb.StatementType.SELECT for s in statements):
        return "write"
    return "select" if len(statements) == 1 else "invalid"


_CHART_KINDS = {"line", "bar", "donut", "scatter"}


def _extract_json(text: str) -> dict | None:
    """Extract the first complete top-level JSON object from an LLM response.

    Tolerates markdown fences and surrounding prose. String-aware so braces
    inside string values do not confuse the bracket counting.
    """
    if not text:
        return None
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if escape:
            escape = False
            continue
        if ch == "\\" and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    parsed = json.loads(text[start : i + 1])
                except (json.JSONDecodeError, ValueError):
                    return None
                return parsed if isinstance(parsed, dict) else None
    return None


def _validate_chart(chart: object, columns: list[str]) -> dict | None:
    """Return a normalized chart hint, or None if it is unusable."""
    if not isinstance(chart, dict):
        return None
    kind, x, y = chart.get("kind"), chart.get("x"), chart.get("y")
    if kind not in _CHART_KINDS or x not in columns or y not in columns:
        return None
    series = chart.get("series")
    if series is not None and series not in columns:
        series = None
    return {"kind": kind, "x": x, "y": y, "series": series}


def _coerce_suggestions(suggestions) -> list[str]:
    """Keep at most 3 unique, non-empty, stripped strings (order preserved)."""
    if not isinstance(suggestions, list):
        return []
    out = []
    seen = set()
    for s in suggestions:
        if isinstance(s, str) and s.strip():
            stripped = s.strip()
            if stripped not in seen:
                seen.add(stripped)
                out.append(stripped)
        if len(out) == 3:
            break
    return out


def _classify_type(rows: list[dict]) -> str:
    if len(rows) == 1 and len(rows[0]) == 1:
        return "scalar"
    return "table"


def _enrich(question: str, rows: list[dict], llm_client: OpenAI) -> dict:
    """One LLM call returning {summary, suggestions, chart} for a table result.

    Any failure degrades to {summary: None, suggestions: [], chart: None} so the
    chat never breaks on a bad model response.
    """
    if not rows:
        return {"summary": None, "suggestions": [], "chart": None}
    columns = list(rows[0].keys())
    prompt = (
        "You are a data analyst. Given a question and its query result, reply with "
        "ONLY a JSON object (no markdown fences, no prose) of this exact shape:\n"
        '{"summary": "<one sentence answering the question>", '
        '"suggestions": ["<short follow-up question>", "<another>"], '
        '"chart": {"kind": "line|bar|donut|scatter", "x": "<column>", '
        '"y": "<column>", "series": "<column or null>"} }\n'
        "Rules: suggestions = 2-3 short natural follow-up questions the user might ask "
        "next. Set chart ONLY when a visualization clearly fits (trend over time -> "
        "line, ranking -> bar, share of a total -> donut) and x/y are real columns; "
        "otherwise set chart to null.\n"
        f"Columns: {columns}\n"
        f"Question: {question}\n"
        f"Result rows (first 5): {json.dumps(rows[:5])}"
    )
    try:
        completion = llm_client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=300,
            extra_body=_NO_REASONING,
        )
        parsed = _extract_json(completion.choices[0].message.content)
    except Exception as exc:
        logger.warning("_enrich failed: %s", exc)
        parsed = None

    if not parsed:
        return {"summary": None, "suggestions": [], "chart": None}

    summary = parsed.get("summary")
    return {
        "summary": summary.strip() if isinstance(summary, str) and summary.strip() else None,
        "suggestions": _coerce_suggestions(parsed.get("suggestions")),
        "chart": _validate_chart(parsed.get("chart"), columns),
    }


def run(question: str, history: list[dict], llm_client: OpenAI) -> dict:
    entity_hints = resolve_entities(question)
    fewshots = retrieve_fewshots(question)
    system_prompt = _build_system_prompt(entity_hints, fewshots)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-10:]:
        if msg.get("role") in ("user", "assistant"):
            messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})

    conn = get_conn()
    raw_sql, df, failure = "", None, None
    for _ in range(MAX_SQL_ATTEMPTS):
        completion = llm_client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0,
            max_tokens=512,
            extra_body=_NO_REASONING,
        )
        raw_sql = _extract_sql(completion.choices[0].message.content or "")

        if "REFUSE_WRITE" in raw_sql.upper():
            return _refusal_response()

        if not raw_sql:
            failure = ("empty", "Empty response.")
        else:
            kind = _classify_sql(raw_sql)
            if kind == "write":
                return _refusal_response(raw_sql)
            if kind == "invalid":
                failure = (
                    "invalid",
                    "Not a single valid SELECT statement (WITH ... SELECT is allowed).",
                )
            else:
                try:
                    df = conn.execute(raw_sql).fetchdf()
                    failure = None
                    break
                except Exception as exc:
                    failure = ("exec", str(exc))

        logger.warning("SQL attempt failed (%s): %s", failure[0], failure[1])
        messages = messages + [
            {"role": "assistant", "content": raw_sql},
            {
                "role": "user",
                "content": (
                    f"That SQL failed: {failure[1]}\n"
                    "Return ONLY the corrected DuckDB SELECT statement — no explanation."
                ),
            },
        ]

    if failure is not None:
        kind, detail = failure
        if kind == "empty":
            answer = "The model returned an empty response — please try asking again."
        elif kind == "invalid":
            answer = "I couldn't generate a valid query for that — try rephrasing your question."
        else:
            answer = f"Query failed: {detail}"
        return {
            "answer": answer,
            "sql": raw_sql,
            "data": [],
            "type": "error",
            "chart": None,
            "suggestions": [],
        }

    if df.empty:
        return {
            "answer": "No data found matching that question.",
            "sql": raw_sql,
            "data": [],
            "type": "error",
            "chart": None,
            "suggestions": [],
        }

    rows = json.loads(df.to_json(orient="records", date_format="iso"))
    result_type = _classify_type(rows)

    if result_type == "scalar":
        val = list(rows[0].values())[0]
        answer = f"The result is {val:,.2f}." if isinstance(val, float) else f"The result is {val}."
        return {
            "answer": answer,
            "sql": raw_sql,
            "data": rows,
            "type": "scalar",
            "chart": None,
            "suggestions": [],
        }

    enrichment = _enrich(question, rows, llm_client)
    answer = enrichment["summary"] or "Here are the results — see the table below."
    return {
        "answer": answer,
        "sql": raw_sql,
        "data": rows,
        "type": "table",
        "chart": enrichment["chart"],
        "suggestions": enrichment["suggestions"],
    }
