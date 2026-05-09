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
