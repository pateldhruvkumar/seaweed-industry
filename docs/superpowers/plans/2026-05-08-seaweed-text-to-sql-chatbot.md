# Text-to-SQL Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a FastAPI Text-to-SQL backend and a React chat panel to the seaweed industry dashboard so users can query the four CSV datasets with natural language.

**Architecture:** FastAPI loads 4 CSVs into DuckDB once at startup. Each `/chat` request runs a 6-step pipeline: entity resolution → few-shot retrieval (both via bge-small-en-v1.5 + numpy cosine similarity) → prompt assembly → Groq LLM SQL generation → DuckDB execution → JSON response. React renders a 380 px right-sidebar chat panel with message bubbles and inline result tables.

**Tech Stack:** Python 3.11+, FastAPI, DuckDB, sentence-transformers (`BAAI/bge-small-en-v1.5`), Groq SDK, numpy, pytest, httpx · React 18, Vite, Tailwind CSS, Vitest, @testing-library/react

---

## File Map

**New — backend (`D:/github/seaweed-industry/backend/`):**
- `requirements.txt` — Python dependencies
- `.env.example` — env var template
- `db.py` — DuckDB startup loader
- `embeddings.py` — model load, entity index, few-shot index, search
- `pipeline.py` — 6-step query pipeline
- `few_shots.json` — 20 seed Q→SQL examples
- `main.py` — FastAPI app, lifespan, `/chat` + `/health`
- `tests/conftest.py` — sys.path fixture
- `tests/test_db.py`
- `tests/test_embeddings.py`
- `tests/test_pipeline.py`
- `tests/test_main.py`

**Modified — frontend (`.worktrees/dashboard/src/`):**
- `components/chat/ResultTable.jsx` — new
- `components/chat/MessageBubble.jsx` — new
- `components/chat/MessageThread.jsx` — new
- `components/chat/ChatInput.jsx` — new
- `components/chat/ChatPanel.jsx` — new
- `components/layout/Header.jsx` — add chat toggle button
- `App.jsx` — add `chatOpen` state, flex-row layout, `<ChatPanel>`

---

## Task 1: Backend Project Setup

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Create the backend folder and requirements**

```
backend/
├── requirements.txt
├── .env.example
└── tests/
    └── conftest.py
```

`backend/requirements.txt`:
```
fastapi==0.115.0
uvicorn[standard]==0.30.6
duckdb==1.1.3
sentence-transformers==3.2.1
groq==0.11.0
numpy==2.1.3
python-dotenv==1.0.1
pytest==8.3.3
httpx==0.27.2
pytest-asyncio==0.24.0
```

`backend/.env.example`:
```
GROQ_API_KEY=gsk_your_key_here
```

`backend/tests/conftest.py`:
```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
```

- [ ] **Step 2: Install dependencies**

```bash
cd backend
pip install -r requirements.txt
```

Expected: all packages install without error. `sentence-transformers` will download `bge-small-en-v1.5` (~33 MB) on first use.

- [ ] **Step 3: Create .env from template**

Copy `.env.example` to `.env` and fill in your Groq API key:
```
GROQ_API_KEY=gsk_your_actual_key_here
```

Add `.env` to `.gitignore` (project root):

Open `D:/github/seaweed-industry/.gitignore` (create it if absent) and add:
```
backend/.env
__pycache__/
*.pyc
.pytest_cache/
```

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt backend/.env.example backend/tests/conftest.py .gitignore
git commit -m "feat(chatbot): backend project scaffold"
```

---

## Task 2: DuckDB Loader

**Files:**
- Create: `backend/db.py`
- Create: `backend/tests/test_db.py`

- [ ] **Step 1: Write the failing test**

`backend/tests/test_db.py`:
```python
import pytest
import duckdb
from db import load_tables, get_conn

EXPECTED_TABLES = {
    "seaweed_aquaculture_quantity",
    "seaweed_aquaculture_value",
    "seaweed_capture_quantity",
    "seaweed_global_production",
}

def test_load_tables_returns_connection():
    conn = load_tables()
    assert isinstance(conn, duckdb.DuckDBPyConnection)

def test_all_four_tables_exist():
    conn = load_tables()
    tables = {row[0] for row in conn.execute("SHOW TABLES").fetchall()}
    assert EXPECTED_TABLES.issubset(tables)

def test_tables_have_rows():
    conn = load_tables()
    for table in EXPECTED_TABLES:
        count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        assert count > 0, f"{table} is empty"

def test_get_conn_returns_same_connection():
    load_tables()
    conn = get_conn()
    assert conn is not None
    result = conn.execute("SELECT 1").fetchone()
    assert result[0] == 1

def test_country_name_column_exists():
    conn = load_tables()
    result = conn.execute(
        "SELECT Country_Name FROM seaweed_global_production LIMIT 1"
    ).fetchone()
    assert result is not None
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
pytest tests/test_db.py -v
```

Expected: `ModuleNotFoundError: No module named 'db'`

- [ ] **Step 3: Write the implementation**

`backend/db.py`:
```python
from pathlib import Path
import duckdb

DATASET_DIR = Path(__file__).parent.parent / "dataset"

TABLE_MAP = {
    "seaweed_aquaculture_quantity": "seaweed_aquaculture_quantity.csv",
    "seaweed_aquaculture_value":    "seaweed_aquaculture_value.csv",
    "seaweed_capture_quantity":     "seaweed_capture_quantity.csv",
    "seaweed_global_production":    "seaweed_global_production.csv",
}

_conn: duckdb.DuckDBPyConnection | None = None


def load_tables() -> duckdb.DuckDBPyConnection:
    global _conn
    _conn = duckdb.connect(":memory:")
    for table_name, filename in TABLE_MAP.items():
        csv_path = DATASET_DIR / filename
        _conn.execute(f"""
            CREATE TABLE {table_name} AS
            SELECT * FROM read_csv_auto('{csv_path.as_posix()}', header=true)
        """)
    return _conn


def get_conn() -> duckdb.DuckDBPyConnection:
    return _conn
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_db.py -v
```

Expected: all 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/db.py backend/tests/test_db.py
git commit -m "feat(chatbot): DuckDB CSV loader"
```

---

## Task 3: Embeddings Module

**Files:**
- Create: `backend/embeddings.py`
- Create: `backend/tests/test_embeddings.py`

- [ ] **Step 1: Write the failing test**

`backend/tests/test_embeddings.py`:
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_embeddings.py -v
```

Expected: `ModuleNotFoundError: No module named 'embeddings'`

- [ ] **Step 3: Write the implementation**

`backend/embeddings.py`:
```python
import json
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

MODEL_NAME = "BAAI/bge-small-en-v1.5"
SIMILARITY_THRESHOLD = 0.75

_model: SentenceTransformer | None = None
_entity_texts: list[str] = []
_entity_embeddings: np.ndarray | None = None
_fewshot_questions: list[str] = []
_fewshot_sqls: list[str] = []
_fewshot_embeddings: np.ndarray | None = None

ENTITY_COLUMNS = [
    "Country_Name",
    "Seaweed_Name",
    "Scientific_Name",
    "GeoRegion_Group_En",
    "Continent_Group_En",
    "CPC_Class_En",
]

TABLES = [
    "seaweed_aquaculture_quantity",
    "seaweed_aquaculture_value",
    "seaweed_capture_quantity",
    "seaweed_global_production",
]


def _cosine_similarity(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    q = query_vec / (np.linalg.norm(query_vec) + 1e-9)
    m = matrix / (np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-9)
    return m @ q


def load_model() -> SentenceTransformer:
    global _model
    _model = SentenceTransformer(MODEL_NAME)
    return _model


def build_entity_index(conn) -> None:
    global _entity_texts, _entity_embeddings
    texts: set[str] = set()
    for col in ENTITY_COLUMNS:
        for table in TABLES:
            try:
                rows = conn.execute(
                    f'SELECT DISTINCT "{col}" FROM {table} WHERE "{col}" IS NOT NULL'
                ).fetchall()
                texts.update(str(r[0]) for r in rows)
            except Exception:
                pass
    _entity_texts = list(texts)
    _entity_embeddings = _model.encode(_entity_texts, normalize_embeddings=True)


def build_fewshot_index(fewshot_path: Path) -> None:
    pairs = json.loads(fewshot_path.read_text(encoding="utf-8"))
    build_fewshot_index_from_list(pairs)


def build_fewshot_index_from_list(pairs: list[dict]) -> None:
    global _fewshot_questions, _fewshot_sqls, _fewshot_embeddings
    _fewshot_questions = [p["question"] for p in pairs]
    _fewshot_sqls = [p["sql"] for p in pairs]
    _fewshot_embeddings = _model.encode(_fewshot_questions, normalize_embeddings=True)


def resolve_entities(question: str, top_k: int = 3) -> list[str]:
    if _entity_embeddings is None or len(_entity_texts) == 0:
        return []
    q_vec = _model.encode([question], normalize_embeddings=True)[0]
    scores = _cosine_similarity(q_vec, _entity_embeddings)
    indices = np.argsort(scores)[::-1][:top_k]
    return [_entity_texts[i] for i in indices if scores[i] >= SIMILARITY_THRESHOLD]


def retrieve_fewshots(question: str, top_k: int = 3) -> list[dict]:
    if _fewshot_embeddings is None or len(_fewshot_questions) == 0:
        return []
    q_vec = _model.encode([question], normalize_embeddings=True)[0]
    scores = _cosine_similarity(q_vec, _fewshot_embeddings)
    indices = np.argsort(scores)[::-1][:top_k]
    return [
        {"question": _fewshot_questions[i], "sql": _fewshot_sqls[i]}
        for i in indices
    ]
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_embeddings.py -v
```

Expected: all 7 tests PASS. First run downloads `bge-small-en-v1.5` (~33 MB).

- [ ] **Step 5: Commit**

```bash
git add backend/embeddings.py backend/tests/test_embeddings.py
git commit -m "feat(chatbot): embedding model, entity index, few-shot index"
```

---

## Task 4: Few-Shot Seed File

**Files:**
- Create: `backend/few_shots.json`

- [ ] **Step 1: Create the seed file**

`backend/few_shots.json`:
```json
[
  {
    "question": "Which country produced the most seaweed in 2022?",
    "sql": "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 1"
  },
  {
    "question": "What are the top 5 seaweed-producing countries in 2020?",
    "sql": "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2020 GROUP BY Country_Name ORDER BY total DESC LIMIT 5"
  },
  {
    "question": "How much seaweed did China produce each year from 2015 to 2022?",
    "sql": "SELECT PERIOD, SUM(VALUE) AS total FROM seaweed_global_production WHERE Country_Name = 'China' AND PERIOD BETWEEN 2015 AND 2022 GROUP BY PERIOD ORDER BY PERIOD"
  },
  {
    "question": "What is the total aquaculture value for Asia in 2021?",
    "sql": "SELECT SUM(VALUE) AS total_value FROM seaweed_aquaculture_value WHERE Continent_Group_En = 'Asia' AND PERIOD = 2021"
  },
  {
    "question": "Which seaweed species is most produced globally?",
    "sql": "SELECT Seaweed_Name, SUM(VALUE) AS total FROM seaweed_global_production GROUP BY Seaweed_Name ORDER BY total DESC LIMIT 1"
  },
  {
    "question": "What is the total capture quantity for Indonesia over all years?",
    "sql": "SELECT SUM(VALUE) AS total FROM seaweed_capture_quantity WHERE Country_Name = 'Indonesia'"
  },
  {
    "question": "Compare aquaculture vs capture quantity for the Philippines in 2019",
    "sql": "SELECT 'aquaculture' AS source, SUM(VALUE) AS total FROM seaweed_aquaculture_quantity WHERE Country_Name = 'Philippines' AND PERIOD = 2019 UNION ALL SELECT 'capture', SUM(VALUE) FROM seaweed_capture_quantity WHERE Country_Name = 'Philippines' AND PERIOD = 2019"
  },
  {
    "question": "What is the production trend for Brown algae from 2010 to 2022?",
    "sql": "SELECT PERIOD, SUM(VALUE) AS total FROM seaweed_global_production WHERE Seaweed_Name = 'Brown algae' AND PERIOD BETWEEN 2010 AND 2022 GROUP BY PERIOD ORDER BY PERIOD"
  },
  {
    "question": "Which countries in Oceania produce the most seaweed?",
    "sql": "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE Continent_Group_En = 'Oceania' GROUP BY Country_Name ORDER BY total DESC LIMIT 10"
  },
  {
    "question": "How many countries produce seaweed?",
    "sql": "SELECT COUNT(DISTINCT Country_Name) AS country_count FROM seaweed_global_production"
  },
  {
    "question": "What are the top 3 most valuable seaweed-producing countries in 2020?",
    "sql": "SELECT Country_Name, SUM(VALUE) AS total_value FROM seaweed_aquaculture_value WHERE PERIOD = 2020 GROUP BY Country_Name ORDER BY total_value DESC LIMIT 3"
  },
  {
    "question": "What is the total global seaweed production in 2022?",
    "sql": "SELECT SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022"
  },
  {
    "question": "Which high-income countries produce the most seaweed?",
    "sql": "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE EcoClass_Group_En = 'High-income countries' GROUP BY Country_Name ORDER BY total DESC LIMIT 10"
  },
  {
    "question": "What is the year with the highest total seaweed production?",
    "sql": "SELECT PERIOD, SUM(VALUE) AS total FROM seaweed_global_production GROUP BY PERIOD ORDER BY total DESC LIMIT 1"
  },
  {
    "question": "Show me the production of Red algae by country in 2021",
    "sql": "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE Seaweed_Name = 'Red algae' AND PERIOD = 2021 GROUP BY Country_Name ORDER BY total DESC"
  },
  {
    "question": "What is the total aquaculture quantity in Africa across all years?",
    "sql": "SELECT SUM(VALUE) AS total FROM seaweed_aquaculture_quantity WHERE Continent_Group_En = 'Africa'"
  },
  {
    "question": "How has global aquaculture value changed from 2000 to 2022?",
    "sql": "SELECT PERIOD, SUM(VALUE) AS total_value FROM seaweed_aquaculture_value WHERE PERIOD BETWEEN 2000 AND 2022 GROUP BY PERIOD ORDER BY PERIOD"
  },
  {
    "question": "Which species have official data (not estimated) in 2022?",
    "sql": "SELECT DISTINCT Seaweed_Name FROM seaweed_global_production WHERE PERIOD = 2022 AND STATUS = 'A' ORDER BY Seaweed_Name"
  },
  {
    "question": "What is the total production for Japan each year from 2018?",
    "sql": "SELECT PERIOD, SUM(VALUE) AS total FROM seaweed_global_production WHERE Country_Name = 'Japan' AND PERIOD >= 2018 GROUP BY PERIOD ORDER BY PERIOD"
  },
  {
    "question": "Average seaweed production per country in 2022",
    "sql": "SELECT AVG(total) AS avg_production FROM (SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name)"
  }
]
```

- [ ] **Step 2: Verify JSON is valid**

```bash
python -c "import json; data = json.load(open('few_shots.json')); print(f'{len(data)} examples loaded')"
```

Expected: `20 examples loaded`

- [ ] **Step 3: Commit**

```bash
git add backend/few_shots.json
git commit -m "feat(chatbot): 20 seed Q->SQL few-shot examples"
```

---

## Task 5: Query Pipeline

**Files:**
- Create: `backend/pipeline.py`
- Create: `backend/tests/test_pipeline.py`

- [ ] **Step 1: Write the failing test**

`backend/tests/test_pipeline.py`:
```python
import pytest
from unittest.mock import MagicMock, patch
import duckdb
import pipeline
import embeddings as emb
from db import load_tables

SCHEMA_PROMPT = """
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_pipeline.py -v
```

Expected: `ModuleNotFoundError: No module named 'pipeline'`

- [ ] **Step 3: Write the implementation**

`backend/pipeline.py`:
```python
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

GROQ_MODEL = "qwen-qwq-32b"


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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_pipeline.py -v
```

Expected: all 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/pipeline.py backend/tests/test_pipeline.py
git commit -m "feat(chatbot): 6-step Text-to-SQL query pipeline"
```

---

## Task 6: FastAPI App

**Files:**
- Create: `backend/main.py`
- Create: `backend/tests/test_main.py`

- [ ] **Step 1: Write the failing test**

`backend/tests/test_main.py`:
```python
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

def _make_pipeline_mock(result: dict):
    return MagicMock(return_value=result)

@pytest.fixture(scope="module")
def client():
    with patch("main.load_tables"), \
         patch("main.load_model"), \
         patch("main.build_entity_index"), \
         patch("main.build_fewshot_index"), \
         patch("main.Groq"):
        from main import app
        return TestClient(app)

def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}

def test_chat_returns_200(client):
    mock_result = {
        "answer": "China is top.",
        "sql": "SELECT 1",
        "data": [{"Country_Name": "China", "total": 1000.0}],
        "type": "table",
    }
    with patch("main.pipeline.run", return_value=mock_result):
        resp = client.post("/chat", json={"message": "top country?", "history": []})
    assert resp.status_code == 200
    body = resp.json()
    assert body["type"] == "table"
    assert body["answer"] == "China is top."

def test_chat_missing_message_returns_422(client):
    resp = client.post("/chat", json={"history": []})
    assert resp.status_code == 422

def test_chat_passes_history(client):
    history = [{"role": "user", "content": "hello"}]
    mock_result = {"answer": "ok", "sql": "SELECT 1", "data": [{"n": 1}], "type": "scalar"}
    with patch("main.pipeline.run", return_value=mock_result) as mock_run:
        client.post("/chat", json={"message": "follow up", "history": history})
    mock_run.assert_called_once()
    _, kwargs = mock_run.call_args
    assert kwargs.get("history") == history or mock_run.call_args[0][1] == history
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_main.py -v
```

Expected: `ModuleNotFoundError: No module named 'main'`

- [ ] **Step 3: Write the implementation**

`backend/main.py`:
```python
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel

import pipeline
from db import load_tables
from embeddings import build_entity_index, build_fewshot_index, load_model

load_dotenv()

FEWSHOT_PATH = Path(__file__).parent / "few_shots.json"
_groq_client: Groq | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _groq_client
    conn = load_tables()
    load_model()
    build_entity_index(conn)
    build_fewshot_index(FEWSHOT_PATH)
    _groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
def chat(req: ChatRequest):
    history = [m.model_dump() for m in req.history]
    return pipeline.run(req.message, history, _groq_client)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_main.py -v
```

Expected: all 4 tests PASS

- [ ] **Step 5: Start the server manually and verify health endpoint**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

In a separate terminal:
```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 6: Commit**

```bash
git add backend/main.py backend/tests/test_main.py
git commit -m "feat(chatbot): FastAPI app with /chat and /health endpoints"
```

> **Backend complete.** The Python backend is fully working. Now switching to the React frontend in `.worktrees/dashboard/`.

---

## Task 7: ResultTable Component

**Files:**
- Create: `.worktrees/dashboard/src/components/chat/ResultTable.jsx`
- Create: `.worktrees/dashboard/src/components/chat/ResultTable.test.jsx`

All frontend commands run from `.worktrees/dashboard/`.

- [ ] **Step 1: Write the failing test**

`.worktrees/dashboard/src/components/chat/ResultTable.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResultTable from './ResultTable'

const rows = [
  { Country_Name: 'China',     total: 1842303 },
  { Country_Name: 'Indonesia', total: 412000  },
]

describe('ResultTable', () => {
  it('renders column headers from first row keys', () => {
    render(<ResultTable data={rows} />)
    expect(screen.getByText('Country_Name')).toBeInTheDocument()
    expect(screen.getByText('total')).toBeInTheDocument()
  })

  it('renders all row values', () => {
    render(<ResultTable data={rows} />)
    expect(screen.getByText('China')).toBeInTheDocument()
    expect(screen.getByText('Indonesia')).toBeInTheDocument()
  })

  it('caps display at 10 rows and shows expand button', () => {
    const manyRows = Array.from({ length: 15 }, (_, i) => ({ Country_Name: `Country${i}`, total: i }))
    render(<ResultTable data={manyRows} />)
    expect(screen.getByText(/Show all 15 rows/i)).toBeInTheDocument()
    expect(screen.queryByText('Country14')).not.toBeInTheDocument()
  })

  it('shows all rows after clicking expand', () => {
    const manyRows = Array.from({ length: 15 }, (_, i) => ({ Country_Name: `Country${i}`, total: i }))
    render(<ResultTable data={manyRows} />)
    fireEvent.click(screen.getByText(/Show all 15 rows/i))
    expect(screen.getByText('Country14')).toBeInTheDocument()
  })

  it('renders nothing for empty data', () => {
    const { container } = render(<ResultTable data={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd .worktrees/dashboard
npm test -- ResultTable
```

Expected: `Cannot find module './ResultTable'`

- [ ] **Step 3: Write the implementation**

`.worktrees/dashboard/src/components/chat/ResultTable.jsx`:
```jsx
import { useState } from 'react'

const PAGE = 10

export default function ResultTable({ data }) {
  const [expanded, setExpanded] = useState(false)

  if (!data || data.length === 0) return null

  const headers = Object.keys(data[0])
  const rows = expanded ? data : data.slice(0, PAGE)

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {headers.map(h => (
              <th key={h} className="px-2 py-1 text-left font-medium text-gray-600 border-b border-gray-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {headers.map(h => (
                <td key={h} className="px-2 py-1 text-gray-700 border-b border-gray-100">
                  {row[h] == null ? '—' : String(row[h])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > PAGE && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 text-xs text-teal-600 hover:underline"
        >
          Show all {data.length} rows
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- ResultTable
```

Expected: all 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ResultTable.jsx src/components/chat/ResultTable.test.jsx
git commit -m "feat(chatbot): ResultTable component"
```

---

## Task 8: MessageBubble Component

**Files:**
- Create: `.worktrees/dashboard/src/components/chat/MessageBubble.jsx`
- Create: `.worktrees/dashboard/src/components/chat/MessageBubble.test.jsx`

- [ ] **Step 1: Write the failing test**

`.worktrees/dashboard/src/components/chat/MessageBubble.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MessageBubble from './MessageBubble'

describe('MessageBubble — user', () => {
  it('renders user message text', () => {
    render(<MessageBubble role="user" content="hello" />)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('does not render View SQL for user messages', () => {
    render(<MessageBubble role="user" content="hello" sql="SELECT 1" />)
    expect(screen.queryByText(/View SQL/i)).not.toBeInTheDocument()
  })
})

describe('MessageBubble — assistant', () => {
  it('renders assistant answer text', () => {
    render(<MessageBubble role="assistant" content="China is top." />)
    expect(screen.getByText('China is top.')).toBeInTheDocument()
  })

  it('shows View SQL toggle when sql is provided', () => {
    render(<MessageBubble role="assistant" content="ok" sql="SELECT 1" />)
    expect(screen.getByText(/View SQL/i)).toBeInTheDocument()
  })

  it('reveals SQL on toggle click', () => {
    render(<MessageBubble role="assistant" content="ok" sql="SELECT 1" />)
    expect(screen.queryByText('SELECT 1')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText(/View SQL/i))
    expect(screen.getByText('SELECT 1')).toBeInTheDocument()
  })

  it('renders ResultTable when type is table', () => {
    const data = [{ Country_Name: 'China', total: 1000 }]
    render(<MessageBubble role="assistant" content="ok" type="table" data={data} />)
    expect(screen.getByText('China')).toBeInTheDocument()
  })

  it('does not render table for scalar type', () => {
    render(<MessageBubble role="assistant" content="The result is 42." type="scalar" data={[{ n: 42 }]} />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- MessageBubble
```

Expected: `Cannot find module './MessageBubble'`

- [ ] **Step 3: Write the implementation**

`.worktrees/dashboard/src/components/chat/MessageBubble.jsx`:
```jsx
import { useState } from 'react'
import ResultTable from './ResultTable'

export default function MessageBubble({ role, content, sql, data, type }) {
  const [sqlOpen, setSqlOpen] = useState(false)
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-teal-700 text-white'
            : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>

        {!isUser && type === 'table' && data?.length > 0 && (
          <ResultTable data={data} />
        )}

        {!isUser && sql && (
          <div className="mt-2">
            <button
              onClick={() => setSqlOpen(o => !o)}
              className="text-xs text-teal-600 hover:underline"
            >
              {sqlOpen ? '▼ Hide SQL' : '▶ View SQL'}
            </button>
            {sqlOpen && (
              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                {sql}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- MessageBubble
```

Expected: all 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/MessageBubble.jsx src/components/chat/MessageBubble.test.jsx
git commit -m "feat(chatbot): MessageBubble component with SQL disclosure"
```

---

## Task 9: MessageThread Component

**Files:**
- Create: `.worktrees/dashboard/src/components/chat/MessageThread.jsx`
- Create: `.worktrees/dashboard/src/components/chat/MessageThread.test.jsx`

- [ ] **Step 1: Write the failing test**

`.worktrees/dashboard/src/components/chat/MessageThread.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageThread from './MessageThread'

const messages = [
  { role: 'user',      content: 'hello world',   sql: null,       data: [], type: null    },
  { role: 'assistant', content: 'China is top.',  sql: 'SELECT 1', data: [], type: 'scalar' },
]

describe('MessageThread', () => {
  it('renders all messages', () => {
    render(<MessageThread messages={messages} loading={false} />)
    expect(screen.getByText('hello world')).toBeInTheDocument()
    expect(screen.getByText('China is top.')).toBeInTheDocument()
  })

  it('shows loading indicator when loading is true', () => {
    render(<MessageThread messages={[]} loading={true} />)
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
  })

  it('does not show loading indicator when loading is false', () => {
    render(<MessageThread messages={[]} loading={false} />)
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
  })

  it('renders empty state when no messages', () => {
    render(<MessageThread messages={[]} loading={false} />)
    expect(screen.getByText(/Ask anything/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- MessageThread
```

Expected: `Cannot find module './MessageThread'`

- [ ] **Step 3: Write the implementation**

`.worktrees/dashboard/src/components/chat/MessageThread.jsx`:
```jsx
import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

export default function MessageThread({ messages, loading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="flex-1 overflow-y-auto p-3">
      {messages.length === 0 && !loading && (
        <p className="text-center text-gray-400 text-xs mt-8">
          Ask anything about the seaweed dataset
        </p>
      )}

      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          role={msg.role}
          content={msg.content}
          sql={msg.sql}
          data={msg.data}
          type={msg.type}
        />
      ))}

      {loading && (
        <div
          data-testid="loading-indicator"
          className="flex justify-start mb-3"
        >
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <span className="text-gray-400 text-sm animate-pulse">···</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- MessageThread
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/MessageThread.jsx src/components/chat/MessageThread.test.jsx
git commit -m "feat(chatbot): MessageThread with auto-scroll and loading state"
```

---

## Task 10: ChatInput Component

**Files:**
- Create: `.worktrees/dashboard/src/components/chat/ChatInput.jsx`
- Create: `.worktrees/dashboard/src/components/chat/ChatInput.test.jsx`

- [ ] **Step 1: Write the failing test**

`.worktrees/dashboard/src/components/chat/ChatInput.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatInput from './ChatInput'

describe('ChatInput', () => {
  it('renders textarea', () => {
    render(<ChatInput onSubmit={vi.fn()} loading={false} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('calls onSubmit with trimmed value on Enter', () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} loading={false} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '  hello  ' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    expect(onSubmit).toHaveBeenCalledWith('hello')
  })

  it('does not submit on Shift+Enter', () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} loading={false} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not submit empty string', () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} loading={false} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('disables textarea when loading', () => {
    render(<ChatInput onSubmit={vi.fn()} loading={true} />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- ChatInput
```

Expected: `Cannot find module './ChatInput'`

- [ ] **Step 3: Write the implementation**

`.worktrees/dashboard/src/components/chat/ChatInput.jsx`:
```jsx
import { useState } from 'react'

export default function ChatInput({ onSubmit, loading }) {
  const [value, setValue] = useState('')

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const trimmed = value.trim()
      if (trimmed) {
        onSubmit(trimmed)
        setValue('')
      }
    }
  }

  return (
    <div className="border-t border-gray-200 p-3">
      <div className="flex items-end gap-2">
        <textarea
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50
                     disabled:text-gray-400"
          rows={2}
          placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        {loading && (
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-1" />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- ChatInput
```

Expected: all 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ChatInput.jsx src/components/chat/ChatInput.test.jsx
git commit -m "feat(chatbot): ChatInput with Enter-to-send and loading state"
```

---

## Task 11: ChatPanel Component

**Files:**
- Create: `.worktrees/dashboard/src/components/chat/ChatPanel.jsx`
- Create: `.worktrees/dashboard/src/components/chat/ChatPanel.test.jsx`

- [ ] **Step 1: Write the failing test**

`.worktrees/dashboard/src/components/chat/ChatPanel.test.jsx`:
```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatPanel from './ChatPanel'

const MOCK_RESPONSE = {
  answer: 'China is top.',
  sql: 'SELECT Country_Name FROM seaweed_global_production LIMIT 1',
  data: [{ Country_Name: 'China', total: 1000 }],
  type: 'table',
}

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_RESPONSE) })
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ChatPanel', () => {
  it('renders panel header', () => {
    render(<ChatPanel onClose={vi.fn()} />)
    expect(screen.getByText(/Ask your data/i)).toBeInTheDocument()
  })

  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn()
    render(<ChatPanel onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('sends message and shows assistant response', async () => {
    render(<ChatPanel onClose={vi.fn()} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'top country?' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    await waitFor(() => {
      expect(screen.getByText('China is top.')).toBeInTheDocument()
    })
  })

  it('calls fetch with correct body', async () => {
    render(<ChatPanel onClose={vi.fn()} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toBe('http://localhost:8000/chat')
    const body = JSON.parse(opts.body)
    expect(body.message).toBe('hello')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- ChatPanel
```

Expected: `Cannot find module './ChatPanel'`

- [ ] **Step 3: Write the implementation**

`.worktrees/dashboard/src/components/chat/ChatPanel.jsx`:
```jsx
import { useState } from 'react'
import MessageThread from './MessageThread'
import ChatInput from './ChatInput'

const API_URL = 'http://localhost:8000/chat'

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(question) {
    const userMsg = { role: 'user', content: question, sql: null, data: [], type: null }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const history = updatedMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history }),
      })

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      const { answer, sql, data, type } = await resp.json()
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: answer, sql, data, type },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Is the backend running?',
          sql: null,
          data: [],
          type: 'error',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-sm font-semibold text-gray-700">Ask your data</span>
        <button
          aria-label="close"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ✕
        </button>
      </div>
      <MessageThread messages={messages} loading={loading} />
      <ChatInput onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- ChatPanel
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ChatPanel.jsx src/components/chat/ChatPanel.test.jsx
git commit -m "feat(chatbot): ChatPanel — orchestrates chat state and API calls"
```

---

## Task 12: Wire Into Dashboard (App.jsx + Header.jsx)

**Files:**
- Modify: `.worktrees/dashboard/src/App.jsx`
- Modify: `.worktrees/dashboard/src/components/layout/Header.jsx`

- [ ] **Step 1: Update Header to accept chat toggle prop**

`.worktrees/dashboard/src/components/layout/Header.jsx`:
```jsx
import { useYear } from '../../context/YearContext'
import YearRangeSlider from '../controls/YearRangeSlider'

export default function Header({ onChatToggle, chatOpen }) {
  const { yearRange, setYearRange } = useYear()
  return (
    <header className="bg-teal-800 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Global Seaweed Industry</h1>
        <p className="text-teal-300 text-xs mt-0.5">FAO FishStat — Aquatic algae statistics (1950–2024)</p>
      </div>
      <div className="flex items-center gap-4">
        <YearRangeSlider min={1950} max={2024} value={yearRange} onChange={setYearRange} />
        <button
          onClick={onChatToggle}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            chatOpen
              ? 'bg-teal-600 text-white'
              : 'bg-white text-teal-800 hover:bg-teal-50'
          }`}
        >
          {chatOpen ? 'Close Chat' : '💬 Ask Data'}
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Update App.jsx to render ChatPanel on the right**

`.worktrees/dashboard/src/App.jsx`:
```jsx
import { useState, Suspense, lazy } from 'react'
import { YearProvider } from './context/YearContext'
import Header from './components/layout/Header'
import TabNav from './components/layout/TabNav'
import ChatPanel from './components/chat/ChatPanel'

const OverviewTab    = lazy(() => import('./tabs/OverviewTab'))
const CountriesTab   = lazy(() => import('./tabs/CountriesTab'))
const RegionsTab     = lazy(() => import('./tabs/RegionsTab'))
const SpeciesTab     = lazy(() => import('./tabs/SpeciesTab'))
const EconomicsTab   = lazy(() => import('./tabs/EconomicsTab'))
const DataQualityTab = lazy(() => import('./tabs/DataQualityTab'))

const TAB_MAP = {
  overview:  OverviewTab,
  countries: CountriesTab,
  regions:   RegionsTab,
  species:   SpeciesTab,
  economics: EconomicsTab,
  quality:   DataQualityTab,
}

function Loading() {
  return <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [chatOpen, setChatOpen] = useState(false)
  const TabComponent = TAB_MAP[activeTab]

  return (
    <YearProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header
          onChatToggle={() => setChatOpen(o => !o)}
          chatOpen={chatOpen}
        />
        <TabNav active={activeTab} onChange={setActiveTab} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 p-6 overflow-y-auto min-w-0">
            <Suspense fallback={<Loading />}>
              <TabComponent />
            </Suspense>
          </main>
          {chatOpen && (
            <div className="w-[380px] shrink-0 flex flex-col h-[calc(100vh-8rem)]">
              <ChatPanel onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </YearProvider>
  )
}
```

- [ ] **Step 3: Start the frontend and verify**

```bash
cd .worktrees/dashboard
npm run dev
```

Open `http://localhost:5173` in the browser. Click **💬 Ask Data** in the header. The chat panel should slide in on the right. The existing charts should still fill the left area.

- [ ] **Step 4: Start the backend in a separate terminal and test end-to-end**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

In the browser chat panel, type:
> `Which country produced the most seaweed in 2022?`

Expected: assistant bubble with an answer, an inline table, and a **▶ View SQL** toggle.

- [ ] **Step 5: Run all frontend tests**

```bash
cd .worktrees/dashboard
npm test
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/components/layout/Header.jsx
git commit -m "feat(chatbot): wire ChatPanel into dashboard layout"
```

---

## Verify All Tests Pass

- [ ] **Run full backend test suite**

```bash
cd backend
pytest -v
```

Expected: all tests PASS (db, embeddings, pipeline, main)

- [ ] **Run full frontend test suite**

```bash
cd .worktrees/dashboard
npm test
```

Expected: all tests PASS

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat(chatbot): Text-to-SQL chatbot complete — backend + frontend"
```

---

## Quick Reference: Running the App

```bash
# Terminal 1 — backend
cd D:/github/seaweed-industry/backend
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd D:/github/seaweed-industry/.worktrees/dashboard
npm run dev
```

Open `http://localhost:5173`, click **💬 Ask Data**.

> **Note on Groq model ID:** If `qwen-qwq-32b` is unavailable in your Groq console, substitute `llama-3.3-70b-versatile` in `backend/pipeline.py` → `GROQ_MODEL`. Both handle SQL generation well.
