import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from ..config import limiter, settings
from ..fulfillment import fulfill_session, to_plain

stripe.api_key = settings.stripe_secret_key
router = APIRouter(prefix="/api/orders", tags=["orders"])


class ConfirmIn(BaseModel):
    session_id: str = Field(min_length=10, max_length=200)


@router.post("/confirm")
@limiter.limit("30/minute")
def confirm_order(request: Request, payload: ConfirmIn):
    # We ask Stripe itself, so this cannot be faked from the browser
    try:
        session = stripe.checkout.Session.retrieve(payload.session_id)
    except stripe.StripeError:
        raise HTTPException(404, "Payment session not found")

    data = to_plain(session)
    if data.get("payment_status") != "paid":
        return {"status": "unpaid"}

    fulfill_session(data)
    return {"status": "paid"}