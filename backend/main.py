import truststore

truststore.inject_into_ssl()

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
    allow_origins=[
        "http://localhost:5173",
        "https://seaweed-industry.vercel.app",
    ],
    allow_origin_regex=r"http://localhost:\d+",
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
