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
