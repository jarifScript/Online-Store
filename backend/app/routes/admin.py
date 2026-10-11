from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query

from ..auth import require_admin
from ..config import supabase

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def _summary(orders: list[dict]) -> dict:
    return {
        "revenue_cents": sum(o["total_cents"] for o in orders),
        "orders": len(orders),
        "customers": len({o["customer_email"] for o in orders if o.get("customer_email")}),
    }


def _points(orders: list[dict], slots: list[tuple]) -> list[dict]:
    """slots = list of (label, start, end). Adds up the orders inside each slot."""
    out = []
    for label, start, end in slots:
        inside = [o for o in orders if start <= o["_at"] < end]
        out.append({
            "label": label,
            "revenue": round(sum(o["total_cents"] for o in inside) / 100, 2),
            "orders": len(inside),
        })
    return out


def _day_slots(today: datetime, days: int) -> list[tuple]:
    slots = []
    for i in range(days - 1, -1, -1):
        start = today - timedelta(days=i)
        slots.append((start.strftime("%b %d"), start, start + timedelta(days=1)))
    return slots


def _hour_slots(today: datetime) -> list[tuple]:
    return [
        (f"{h}:00", today + timedelta(hours=h), today + timedelta(hours=h + 1))
        for h in range(24)
    ]


def _month_slots(today: datetime, paid: list[dict]) -> list[tuple]:
    slots = []
    y, m = today.year, today.month
    for _ in range(24):  # at most the last 24 months
        start = today.replace(year=y, month=m, day=1)
        ny, nm = (y + 1, 1) if m == 12 else (y, m + 1)
        end = today.replace(year=ny, month=nm, day=1)
        slots.append((start.strftime("%b %Y"), start, end))
        y, m = (y - 1, 12) if m == 1 else (y, m - 1)
    slots.reverse()

    if paid:
        first = min(o["_at"] for o in paid)
        slots = [s for s in slots if s[2] > first]  # skip empty months before the first sale
    else:
        slots = slots[-6:]
    return slots


@router.get("/orders")
def list_orders(admin=Depends(require_admin)):
    result = (
        supabase.table("orders").select("*").order("created_at", desc=True).limit(200).execute()
    )
    return result.data


@router.get("/stats")
def stats(tz: int = Query(0, ge=-840, le=840), admin=Depends(require_admin)):
    # tz = the browser's time zone, in minutes ahead of UTC (Bangladesh = 360)
    zone = timezone(timedelta(minutes=tz))
    now = datetime.now(zone)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    paid = (
        supabase.table("orders")
        .select("*")
        .eq("status", "paid")
        .order("created_at", desc=True)
        .limit(2000)
        .execute()
        .data
    )
    for o in paid:
        o["_at"] = _parse(o["created_at"]).astimezone(zone)

    def since(start: datetime) -> list[dict]:
        return [o for o in paid if o["_at"] >= start]

    periods = {
        "today": _summary(since(today)),
        "week": _summary(since(today - timedelta(days=6))),
        "month": _summary(since(today - timedelta(days=29))),
        "all": _summary(paid),
    }

    charts = {
        "today": _points(paid, _hour_slots(today)),
        "week": _points(paid, _day_slots(today, 7)),
        "month": _points(paid, _day_slots(today, 30)),
        "all": _points(paid, _month_slots(today, paid)),
    }

    # Best sellers + low stock
    products = (
        supabase.table("products").select("id,name,price_cents,inventory,is_active").execute().data
    )
    by_id = {p["id"]: p for p in products}

    sold: dict[str, int] = {}
    for o in paid:
        for item in o["items"]:
            sold[item["product_id"]] = sold.get(item["product_id"], 0) + item["quantity"]

    top_products = sorted(
        (
            {
                "name": by_id[pid]["name"],
                "quantity": qty,
                "revenue_cents": qty * by_id[pid]["price_cents"],
            }
            for pid, qty in sold.items()
            if pid in by_id
        ),
        key=lambda x: x["quantity"],
        reverse=True,
    )[:5]

    low_stock = sorted(
        (
            {"name": p["name"], "inventory": p["inventory"]}
            for p in products
            if p["is_active"] and p["inventory"] <= 5
        ),
        key=lambda x: x["inventory"],
    )

    return {
        "periods": periods,
        "charts": charts,
        "top_products": top_products,
        "low_stock": low_stock,
    }