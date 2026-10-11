import logging

from .config import supabase

log = logging.getLogger("uvicorn.error")


def to_plain(obj):
    """Turns Stripe objects into normal dicts and lists."""
    if hasattr(obj, "to_dict"):
        obj = obj.to_dict()
    if isinstance(obj, dict):
        return {k: to_plain(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_plain(v) for v in obj]
    return obj


def fulfill_session(session: dict) -> bool:
    """Marks the order paid, saves shipping info and reduces stock.
    Safe to call many times: only a still-pending order is changed."""
    customer = session.get("customer_details") or {}
    shipping = (
        (session.get("collected_information") or {}).get("shipping_details")
        or session.get("shipping_details")
        or {}
    )

    pending_orders = (
        supabase.table("orders")
        .select("user_id")
        .eq("stripe_session_id", session["id"])
        .eq("status", "pending")
        .limit(1)
        .execute()
        .data
    )
    account_name = None
    if pending_orders and pending_orders[0].get("user_id"):
        profiles = (
            supabase.table("profiles")
            .select("full_name")
            .eq("id", pending_orders[0]["user_id"])
            .limit(1)
            .execute()
            .data
        )
        if profiles:
            account_name = (profiles[0].get("full_name") or "").strip() or None

    updated = (
        supabase.table("orders")
        .update({
            "status": "paid",
            "customer_email": customer.get("email"),
            "shipping_name": account_name or shipping.get("name") or customer.get("name"),
            "shipping_phone": customer.get("phone"),
            "shipping_address": shipping.get("address") or customer.get("address"),
        })
        .eq("stripe_session_id", session["id"])
        .eq("status", "pending")
        .execute()
    )
    log.info("Order %s: %d row(s) marked as paid", session["id"], len(updated.data))

    for order in updated.data:
        for item in order["items"]:
            product = (
                supabase.table("products")
                .select("inventory")
                .eq("id", item["product_id"])
                .single()
                .execute()
                .data
            )
            new_stock = max(0, product["inventory"] - item["quantity"])
            supabase.table("products").update({"inventory": new_stock}).eq(
                "id", item["product_id"]
            ).execute()

    return len(updated.data) > 0