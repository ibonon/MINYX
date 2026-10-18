"""
OpenClaw-RL — MINYX Reinforcement Learning Service
Analyzes companion interaction patterns and adapts system prompts based on implicit feedback.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

app = FastAPI(title="OpenClaw-RL Service", version="0.1.0")


class RLUpdateRequest(BaseModel):
    companion_id: str
    user_feedback: dict | None = None
    interaction_stats: dict | None = None


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "openclaw-rl",
        "reward_signal": os.getenv("REWARD_SIGNAL", "implicit_feedback"),
        "update_frequency": os.getenv("UPDATE_FREQUENCY", "daily"),
    }


@app.post("/v1/rl/optimize")
async def optimize_prompt(req: RLUpdateRequest):
    # Analyze implicit feedback & update policy weights
    return {
        "companion_id": req.companion_id,
        "status": "optimized",
        "prompt_adjustments": {
            "warmth_delta": 0.05,
            "verbosity_factor": 0.95,
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
