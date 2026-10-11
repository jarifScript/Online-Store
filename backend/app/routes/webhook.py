import json
import logging

import stripe
from fastapi import APIRouter, HTTPException, Request

from ..config import settings
from ..fulfillment import fulfill_session

router = APIRouter(prefix="/api", tags=["webhook"])
log = logging.getLogger("uvicorn.error")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, signature, settings.stripe_webhook_secret
        )
    except (ValueError, stripe.SignatureVerificationError) as e:
        log.error("Webhook rejected: %s", e)
        raise HTTPException(status_code=400, detail="Invalid signature")

    log.info("Webhook received: %s", event["type"])

    if event["type"] == "checkout.session.completed":
        # The signature is verified, so it is safe to read the plain JSON now
        fulfill_session(json.loads(payload)["data"]["object"])

    return {"received": True}