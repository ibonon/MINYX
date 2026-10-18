"""
MINYX Agentic Service — FastAPI endpoint for Agentic Layer execution
"""

from fastapi import FastAPI
from pydantic import BaseModel
from .tools import MinyxToolkit
from .proactive_engine import ProactiveEngine

app = FastAPI(title="MINYX Agentic Service", version="0.1.0")
proactive = ProactiveEngine()


class AgentTaskRequest(BaseModel):
    user_id: str
    companion_id: str
    action: str
    payload: dict = {}
    permissions: dict = {}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "minyx-agentic-layer"}


@app.post("/v1/agent/execute")
async def execute_tool(req: AgentTaskRequest):
    toolkit = MinyxToolkit(req.user_id, req.companion_id, req.permissions)
    if req.action == "web_search":
        result = await toolkit.web_search(req.payload.get("query", ""))
        return result
    elif req.action == "create_reminder":
        result = await toolkit.create_reminder(
            req.payload.get("title", ""), req.payload.get("when", "")
        )
        return result
    return {"success": False, "error": f"Unknown action {req.action}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
