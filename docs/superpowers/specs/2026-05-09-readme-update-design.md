---
title: README Update Design
date: 2026-05-09
status: approved
---

## Goal

Replace the default Vite template README with a precise, collaborator-focused document covering project purpose, architecture, local dev setup, environment variables, and deployment.

## Audience

Primary: project owner and collaborators who already know the domain. They need to get the project running quickly and understand its structure — not be sold on it.

## Chosen Approach

Single flat `README.md` at the repo root. All information in one file, structured by section, no sub-READMEs.

## Structure

### 1. Header
- Project name: **Seaweed Industry Dashboard**
- One-line description: interactive dashboard for global seaweed industry data with an AI chat interface for natural-language queries
- Live link: https://seaweed-industry.vercel.app

### 2. Architecture
Text-based diagram showing data flow:

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

Tables loaded at startup from `dataset/`:
- `seaweed_aquaculture_quantity` — farming quantity (tonnes)
- `seaweed_aquaculture_value` — farming value (USD)
- `seaweed_capture_quantity` — wild capture quantity (tonnes)
- `seaweed_global_production` — combined production (tonnes)

### 3. Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Plotly.js, Vitest |
| Backend | FastAPI, Uvicorn, DuckDB, Groq SDK, Sentence Transformers, pytest |

### 4. Local Development

**Prerequisites:** Node ≥ 18, Python ≥ 3.11

**Frontend:**
```bash
npm install
npm run dev        # http://localhost:5173
```

**Backend:**
```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
# Set GROQ_API_KEY (see Environment Variables)
uvicorn main:app --reload  # http://localhost:8000
```

### 5. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | API key from console.groq.com |

Place in `backend/.env` (loaded automatically via `python-dotenv`).

### 6. Deployment

**Frontend (Vercel):**
- Connect repo to Vercel
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: repo root

**Backend:**
- Deploy to any Python host (Railway, Fly.io, Render, etc.)
- Set `GROQ_API_KEY` as an environment variable
- Update `allow_origins` in `backend/main.py` with the deployed backend's public URL
- The `dataset/` CSVs must be bundled with the deployment (they are loaded at startup)

## Constraints

- No contribution guide needed (private/personal project)
- No badge spam — keep it clean
- No emoji in headings
