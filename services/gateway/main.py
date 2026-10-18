"""
OpenClaw Gateway — MINYX AI Chat Service
FastAPI + LLM routing (Qwen2.5-7B local, Claude fallback)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import os

app = FastAPI(title="OpenClaw Gateway", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    companion_id: str
    messages: list[ChatMessage]
    stream: bool = False


class ChatResponse(BaseModel):
    message: ChatMessage
    usage: dict


@app.get("/health")
async def health():
    return {"status": "ok", "service": "openclaw-gateway"}


@app.post("/v1/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # TODO: implement LLM routing
    # 1. Load companion system prompt from DB (element, level, form, stats)
    # 2. Fetch relevant memories from MemoClaw
    # 3. Route to Qwen2.5-7B (local) or Claude (fallback)
    # 4. Stream response via SSE if req.stream
    raise HTTPException(status_code=501, detail="LLM routing not yet implemented")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
