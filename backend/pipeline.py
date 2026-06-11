import json
import logging
import re
from groq import Groq
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

GROQ_MODEL = "llama-3.3-70b-versatile"


def _build_system_prompt(entity_hints: list[str], fewshots: list[dict]) -> str:
    parts = [
        "You are a SQL expert. Generate DuckDB SQL SELECT statements only.",
        "Never use INSERT, UPDATE, DELETE, DROP, CREATE, or any DDL.",
        "Return ONLY the SQL query — no explanation, no markdown fences.",
        "When computing a ratio or percent change, wrap the denominator in NULLIF(..., 0)"
        " and add a HAVING clause that excludes rows where the baseline is 0 or NULL.",
        "When using ORDER BY ... DESC for rankings, append NULLS LAST so NULL values do not win the sort.",
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
    """Keep at most 3 non-empty strings."""
    if not isinstance(suggestions, list):
        return []
    out = []
    for s in suggestions:
        if isinstance(s, str) and s.strip():
            out.append(s.strip())
        if len(out) == 3:
            break
    return out


def _classify_type(rows: list[dict]) -> str:
    if len(rows) == 1 and len(rows[0]) == 1:
        return "scalar"
    return "table"


def _enrich(question: str, rows: list[dict], groq_client: Groq) -> dict:
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
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=300,
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


def run(question: str, history: list[dict], groq_client: Groq) -> dict:
    entity_hints = resolve_entities(question)
    fewshots = retrieve_fewshots(question)
    system_prompt = _build_system_prompt(entity_hints, fewshots)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-10:]:
        if msg.get("role") in ("user", "assistant"):
            messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})

    completion = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=0,
        max_tokens=512,
    )
    raw_sql = _extract_sql(completion.choices[0].message.content)

    if not raw_sql.upper().lstrip().startswith("SELECT"):
        return {
            "answer": "Only read queries are supported.",
            "sql": raw_sql,
            "data": [],
            "type": "error",
            "chart": None,
            "suggestions": [],
        }

    conn = get_conn()
    try:
        df = conn.execute(raw_sql).fetchdf()
    except Exception as exc:
        return {
            "answer": f"Query failed: {exc}",
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

    enrichment = _enrich(question, rows, groq_client)
    answer = enrichment["summary"] or "Here are the results — see the table below."
    return {
        "answer": answer,
        "sql": raw_sql,
        "data": rows,
        "type": "table",
        "chart": enrichment["chart"],
        "suggestions": enrichment["suggestions"],
    }
