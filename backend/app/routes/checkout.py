import logging
import secrets

import stripe
from fastapi import APIRouter, HTTPException, Request

from ..auth import optional_user
from ..config import limiter, settings, supabase
from ..schemas import CheckoutRequest
from ..stripe_customers import sync_customer

stripe.api_key = settings.stripe_secret_key
router = APIRouter(prefix="/api", tags=["checkout"])
log = logging.getLogger("uvicorn.error")


@router.post("/checkout")
@limiter.limit("10/minute")
def create_checkout(request: Request, body: CheckoutRequest):
    ids = list({item.product_id for item in body.items})
    result = (
        supabase.table("products").select("*").in_("id", ids).eq("is_active", True).execute()
    )
    products = {p["id"]: p for p in result.data}

    line_items, order_items, total = [], [], 0
    for item in body.items:
        product = products.get(item.product_id)
        if not product:
            raise HTTPException(400, "A product in your cart is no longer available")
        if product["inventory"] < item.quantity:
            raise HTTPException(400, f"Not enough stock for {product['name']}")

        name = product["name"] + (f" ({item.variant})" if item.variant else "")
        product_data = {"name": name}
        if product["images"]:
            product_data["images"] = product["images"][:1]

        line_items.append({
            "quantity": item.quantity,
            "price_data": {
                "currency": product["currency"],
                "unit_amount": product["price_cents"],
                "product_data": product_data,
            },
        })
        delivery_cents = product.get("delivery_cents") or 0
        if delivery_cents > 0:
            line_items.append({
                "quantity": item.quantity,
                "price_data": {
                    "currency": product["currency"],
                    "unit_amount": delivery_cents,
                    "product_data": {"name": f"Delivery - {product['name']}"},
                },
            })
        order_items.append(
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "variant": item.variant,
                "delivery_cents": delivery_cents,
            }
        )
        total += (product["price_cents"] + delivery_cents) * item.quantity

    # Logged-in buyers: link a Stripe customer (prefilled address, "save my card" box).
    # Guests, or any problem here: normal guest checkout.
    user = optional_user(request)
    customer_args: dict = {}
    if user:
        try:
            customer_args = {
                "customer": sync_customer(user),
                "customer_update": {"shipping": "auto"},
                "saved_payment_method_options": {"payment_method_save": "enabled"},
            }
        except Exception as e:
            log.error("Could not prepare Stripe customer: %s: %s", type(e).__name__, e)

    chat_token = secrets.token_urlsafe(32)

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=line_items,
        shipping_address_collection={"allowed_countries": settings.country_list},
        phone_number_collection={"enabled": True},
        success_url=(
            f"{settings.frontend_url}/success?session_id={{CHECKOUT_SESSION_ID}}&chat={chat_token}"
        ),
        cancel_url=settings.frontend_url,
        **customer_args,
    )

    supabase.table("orders").insert({
        "stripe_session_id": session.id,
        "items": order_items,
        "total_cents": total,
        "status": "pending",
        "chat_token": chat_token,
        "user_id": user.id if user else None,
    }).execute()

    return {"url": session.url}