import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request

from ..auth import require_user
from ..config import limiter, settings
from ..stripe_customers import sync_customer

stripe.api_key = settings.stripe_secret_key
router = APIRouter(prefix="/api/account", tags=["account"])
log = logging.getLogger("uvicorn.error")


@router.post("/billing-portal")
@limiter.limit("10/minute")
def billing_portal(request: Request, user=Depends(require_user)):
    try:
        customer_id = sync_customer(user)
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{settings.frontend_url}/account",
        )
    except stripe.StripeError as e:
        log.error("Billing portal failed: %s", e)
        raise HTTPException(
            400,
            "Stripe's customer portal is not set up yet. In your Stripe dashboard (test mode) "
            "open Settings > Billing > Customer portal and click Save.",
        )
    return {"url": session.url}