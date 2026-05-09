# Seaweed Industry Dashboard

Interactive dashboard for global seaweed industry data with an AI chat interface for natural-language queries.

**Live:** https://seaweed-industry.vercel.app

---

## Architecture

```
Browser (React + Vite)
  ├── 12 dashboard tabs  (Plotly charts, Tailwind UI)
  └── ChatPanel ──► POST /chat
                            ↓
                   FastAPI backend
                     ├── Embeddings  (BAAI/bge-small-en-v1.5)
                     │     ├── Entity resolution
                     │     └── Few-shot retrieval
                     ├── Groq LLM  (llama-3.3-70b-versatile)
                     │     ├── SQL generation
                     │     └── Result summarization
                     └── DuckDB (in-memory)
                           └── 4 FAO CSV tables
```

FAO tables loaded at startup from `dataset/`:

| Table | Description |
|---|---|
| `seaweed_aquaculture_quantity` | Farming quantity (tonnes) |
| `seaweed_aquaculture_value` | Farming value (USD) |
| `seaweed_capture_quantity` | Wild capture quantity (tonnes) |
| `seaweed_global_production` | Combined production (tonnes) |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Plotly.js, Vitest |
| Backend | FastAPI, Uvicorn, DuckDB, Groq SDK, Sentence Transformers, pytest |

---

## Local Development

**Prerequisites:** Node ≥ 18, Python ≥ 3.11

### Frontend

```bash
npm install
npm run dev        # http://localhost:5173
```

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

---

## Environment Variables

Create `backend/.env` with the following:

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | API key from [console.groq.com](https://console.groq.com) |

---

## Deployment

### Frontend — Vercel

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Root directory | ` .` (repo root) |
| Build command | `npm run build` |
| Output directory | `dist` |

### Backend

Deploy to any Python host (Railway, Fly.io, Render, etc.):

1. Set `GROQ_API_KEY` as an environment variable on the host.
2. Ensure the `dataset/` CSVs are bundled — they are loaded into DuckDB at startup.
3. Update `allow_origins` in `backend/main.py` with the backend's public URL so the frontend can reach it.
