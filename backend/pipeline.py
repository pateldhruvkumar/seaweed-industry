import re
from groq import Groq
from db import get_conn
from embeddings import resolve_entities, retrieve_fewshots

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


def _classify_type(rows: list[dict]) -> str:
    if len(rows) == 1 and len(rows[0]) == 1:
        return "scalar"
    return "table"


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
        }

    if df.empty:
        return {
            "answer": "No data found matching that question.",
            "sql": raw_sql,
            "data": [],
            "type": "error",
        }

    rows = df.to_dict(orient="records")
    result_type = _classify_type(rows)

    if result_type == "scalar":
        val = list(rows[0].values())[0]
        answer = f"The result is {val:,.2f}." if isinstance(val, float) else f"The result is {val}."
    else:
        summary = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{
                "role": "user",
                "content": (
                    f"In one sentence, summarize this data as an answer to: '{question}'\n"
                    f"Data (first 5 rows): {rows[:5]}"
                ),
            }],
            temperature=0,
            max_tokens=100,
        )
        answer = summary.choices[0].message.content.strip()

    return {"answer": answer, "sql": raw_sql, "data": rows, "type": result_type}
