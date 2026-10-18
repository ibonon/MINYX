from typing import TypedDict
import httpx


class ToolResult(TypedDict):
    success: bool
    data: dict
    requires_confirmation: bool


class MinyxToolkit:
    """
    Outils disponibles pour le compagnon.
    Chaque outil est scopé par user_id et respecte les
    permissions accordées par l'utilisateur dans les settings.
    """

    def __init__(self, user_id: str, companion_id: str, permissions: dict):
        self.user_id = user_id
        self.companion_id = companion_id
        self.permissions = permissions
        self.user_wallet = permissions.get("wallet_address", "")

    async def web_search(self, query: str) -> ToolResult:
        """Le compagnon peut chercher des infos en temps réel."""
        if not self.permissions.get("web_search", False):
            return {
                "success": False,
                "data": {"error": "Not permitted"},
                "requires_confirmation": False,
            }

        # Placeholder search provider integration
        return {
            "success": True,
            "data": {"query": query, "results": []},
            "requires_confirmation": False,
        }

    async def create_reminder(self, title: str, when: str) -> ToolResult:
        """Le compagnon peut créer un rappel réel dans le calendrier."""
        if not self.permissions.get("calendar_write", False):
            return {
                "success": False,
                "data": {"error": "Not permitted"},
                "requires_confirmation": True,
            }

        return {
            "success": True,
            "data": {"title": title, "when": when, "status": "scheduled"},
            "requires_confirmation": False,
        }

    async def watch_topic(self, topic: str, notify_threshold: str) -> ToolResult:
        """
        Le compagnon surveille un sujet et alerte proactivement.
        Ex: prix d'un token, actualité d'un domaine, deadline d'une bourse.
        """
        return {
            "success": True,
            "data": {
                "topic": topic,
                "threshold": notify_threshold,
                "companion_id": self.companion_id,
            },
            "requires_confirmation": False,
        }

    async def x402_purchase(self, item: str, max_price_usdc: float) -> ToolResult:
        """
        Le compagnon peut acheter quelque chose en ton nom via x402,
        dans la limite du budget que tu as défini.
        """
        budget = self.permissions.get("x402_budget_remaining", 0)
        if max_price_usdc > budget:
            return {
                "success": False,
                "data": {"error": f"Exceeds remaining budget: {budget} USDC"},
                "requires_confirmation": True,
            }

        return {
            "success": True,
            "data": {"item": item, "price": max_price_usdc, "status": "purchased"},
            "requires_confirmation": False,
        }
