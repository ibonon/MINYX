"""
Crew Orchestrator — MINYX Agentic Layer
Multi-agent companion crew using LangGraph orchestration while preserving single companion voice.
"""


class CompanionCrew:
    """
    Le compagnon principal reste l'unique interlocuteur émotionnel.
    En coulisse, il peut invoquer des agents spécialisés pour des
    sous-tâches, puis synthétiser le résultat dans SA voix.
    """

    def __init__(self, companion_id: str, companion_personality: dict):
        self.companion_id = companion_id
        self.personality = companion_personality

    async def execute_task(self, prompt: str) -> str:
        # Multi-agent delegation skeleton
        # 1. Researcher node
        # 2. Planner node
        # 3. Synthesizer node in companion voice
        return f"[{self.personality.get('name', 'Companion')}] J'ai cherché pour toi et voici ce que j'ai préparé."
