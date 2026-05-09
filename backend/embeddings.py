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


def load_model(local_files_only: bool = False) -> SentenceTransformer:
    global _model
    _model = SentenceTransformer(MODEL_NAME, local_files_only=local_files_only)
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
