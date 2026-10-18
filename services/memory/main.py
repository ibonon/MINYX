"""
MemoClaw — MINYX Persistent Memory Service
Qdrant (vector search) + PostgreSQL (structured) + Redis (cache)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

app = FastAPI(title="MemoClaw Memory Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Memory(BaseModel):
    id: str | None = None
    companion_id: str
    content: str
    tags: list[str] = []
    importance: float = 0.5


class SearchRequest(BaseModel):
    companion_id: str
    query: str
    k: int = 5


@app.get("/health")
async def health():
    return {"status": "ok", "service": "memoclaw"}


@app.post("/v1/memory", response_model=Memory)
async def store_memory(memory: Memory):
    # TODO: embed content → Qdrant upsert + PostgreSQL insert
    raise HTTPException(status_code=501, detail="Memory storage not yet implemented")


@app.get("/v1/memory/{companion_id}")
async def get_memories(companion_id: str):
    # TODO: fetch from PostgreSQL ordered by timestamp
    raise HTTPException(status_code=501, detail="Memory retrieval not yet implemented")


@app.get("/v1/memory/search")
async def search_memory(companion_id: str, query: str, k: int = 5):
    # TODO: embed query → Qdrant similarity search
    raise HTTPException(status_code=501, detail="Memory search not yet implemented")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
