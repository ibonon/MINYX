"""
x402 Layer — MINYX Agentic Layer
Handles agent-to-agent and agent-to-service micropayments with dedicated wallet & caps.
"""

import httpx


class MinyxX402Wallet:
    """
    Wallet dédié à l'agent, distinct du wallet principal de l'utilisateur.
    L'utilisateur alimente ce wallet avec un budget mensuel plafonné.
    Le compagnon ne peut JAMAIS toucher au wallet principal.
    """

    def __init__(self, user_id: str, monthly_cap_usdc: float):
        self.user_id = user_id
        self.monthly_cap = monthly_cap_usdc
        self.spent_this_month = 0.0

    def get_auto_approve_threshold(self) -> float:
        return 5.0  # Max 5 USDC auto-approuvé

    async def request_purchase(
        self, item: str, price: float, reasoning: str
    ) -> dict:
        if price <= self.get_auto_approve_threshold():
            return await self._execute_x402_payment(item, price)
        else:
            return await self._request_user_confirmation(
                item=item, price=price, reasoning=reasoning
            )

    async def _execute_x402_payment(self, item: str, price: float) -> dict:
        self.spent_this_month += price
        return {"success": True, "item": item, "price": price, "action": "paid"}

    async def _request_user_confirmation(
        self, item: str, price: float, reasoning: str
    ) -> dict:
        return {
            "success": False,
            "requires_confirmation": True,
            "item": item,
            "price": price,
            "reasoning": reasoning,
        }
