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
