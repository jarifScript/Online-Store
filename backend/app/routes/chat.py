from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from ..auth import optional_user
from ..config import limiter, supabase

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


def _get_paid_order(token: str, user=None) -> dict:
    if not (20 <= len(token) <= 100):
        raise HTTPException(404, "Chat not found")
    result = (
        supabase.table("orders")
        .select("id,user_id,items,status,created_at,total_cents")
        .eq("chat_token", token)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Chat not found")
    order = result.data[0]
    if order.get("user_id") and (not user or str(order["user_id"]) != str(user.id)):
        raise HTTPException(404, "Chat not found")
    if order["status"] != "paid":
        raise HTTPException(403, "Chat opens as soon as your payment is confirmed")
    return order


@router.get("/{token}")
@limiter.limit("60/minute")
def get_chat(request: Request, token: str):
    order = _get_paid_order(token, optional_user(request))

    ids = list({i["product_id"] for i in order["items"]})
    names: dict[str, str] = {}
    if ids:
        rows = supabase.table("products").select("id,name").in_("id", ids).execute().data
        names = {p["id"]: p["name"] for p in rows}

    messages = (
        supabase.table("messages")
        .select("id,sender,body,created_at,read_by_buyer")
        .eq("order_id", order["id"])
        .order("created_at")
        .limit(500)
        .execute()
        .data
    )

    if any(message["sender"] == "admin" and not message["read_by_buyer"] for message in messages):
        updated = (
            supabase.table("messages")
            .update({"read_by_buyer": True})
            .eq("order_id", order["id"])
            .eq("sender", "admin")
            .eq("read_by_buyer", False)
            .select("id")
            .execute()
        )
        if updated.data is None:
            raise HTTPException(500, "Could not mark messages as read")

    return {
        "order": {
            "created_at": order["created_at"],
            "total_cents": order["total_cents"],
            "items": [
                {
                    "name": names.get(i["product_id"], "Product"),
                    "quantity": i["quantity"],
                    "variant": i.get("variant"),
                }
                for i in order["items"]
            ],
        },
        "messages": messages,
    }


@router.get("/summaries/")
@limiter.limit("60/minute")
def get_chat_summaries(
    request: Request,
    tokens: list[str] = Query(default=[], max_length=30),
):
    if not tokens:
        return []
    if len(tokens) > 30 or any(not (20 <= len(token) <= 100) for token in tokens):
        raise HTTPException(400, "Invalid chat list")

    user = optional_user(request)
    orders = (
        supabase.table("orders")
        .select("id,user_id,chat_token,items,created_at,total_cents")
        .in_("chat_token", tokens)
        .eq("status", "paid")
        .execute()
        .data
    )
    orders = [
        order for order in orders
        if not order.get("user_id") or (user and str(order["user_id"]) == str(user.id))
    ]
    if not orders:
        return []

    order_ids = [order["id"] for order in orders]
    product_ids = list({
        item["product_id"]
        for order in orders
        for item in order["items"]
        if item.get("product_id")
    })
    names: dict[str, str] = {}
    if product_ids:
        rows = (
            supabase.table("products")
            .select("id,name")
            .in_("id", product_ids)
            .execute()
            .data
        )
        names = {product["id"]: product["name"] for product in rows}

    messages = (
        supabase.table("messages")
        .select("order_id,sender,body,created_at,read_by_buyer")
        .in_("order_id", order_ids)
        .order("created_at", desc=True)
        .limit(3000)
        .execute()
        .data
    )
    by_order: dict[str, dict] = {}
    for message in messages:
        summary = by_order.setdefault(
            message["order_id"],
            {"unread": 0, "last_message": None, "last_message_at": None},
        )
        if summary["last_message"] is None:
            summary["last_message"] = message["body"]
            summary["last_message_at"] = message["created_at"]
        if message["sender"] == "admin" and not message["read_by_buyer"]:
            summary["unread"] += 1

    return [
        {
            "token": order["chat_token"],
            "created_at": order["created_at"],
            "total_cents": order["total_cents"],
            "items": [
                {
                    "name": names.get(item["product_id"], "Product"),
                    "quantity": item["quantity"],
                    "variant": item.get("variant"),
                }
                for item in order["items"]
            ],
            **by_order.get(
                order["id"],
                {"unread": 0, "last_message": None, "last_message_at": None},
            ),
        }
        for order in orders
    ]


@router.post("/{token}/messages")
@limiter.limit("20/minute")
def send_message(request: Request, token: str, payload: ChatMessageIn):
    order = _get_paid_order(token, optional_user(request))
    body = payload.body.strip()
    if not body:
        raise HTTPException(400, "Message is empty")

    row = (
        supabase.table("messages")
        .insert({"order_id": order["id"], "sender": "buyer", "body": body})
        .execute()
        .data[0]
    )
    return {k: row[k] for k in ("id", "sender", "body", "created_at")}