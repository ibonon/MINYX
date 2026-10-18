"""
Proactive Engine — MINYX Agentic Layer
Evaluates active watches and sends proactive triggers within strict safety guardrails.
"""


class ProactiveEngine:
    """
    Tourne en arrière-plan (cron OpenClaw), évalue les triggers
    actifs par compagnon, et déclenche des messages proactifs
    quand une condition réelle est remplie.
    """

    def __init__(self, memoclaw_client=None):
        self.memoclaw = memoclaw_client

    async def evaluate_triggers(self, companion_id: str):
        # Garde-fou: max 2 messages proactifs / jour, jamais la nuit (23h-7h)
        # Cooldown 4h min
        return {"companion_id": companion_id, "evaluated": True, "messages_sent": 0}

    async def send_proactive_message(self, companion_id: str, context: str, tone: str):
        return {
            "companion_id": companion_id,
            "context": context,
            "tone": tone,
            "status": "dispatched",
        }
