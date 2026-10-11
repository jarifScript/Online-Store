import stripe

from .config import settings, supabase

stripe.api_key = settings.stripe_secret_key

ADDRESS_KEYS = ("line1", "line2", "city", "state", "postal_code", "country")


def sync_customer(user) -> str:
    rows = supabase.table("profiles").select("*").eq("id", user.id).limit(1).execute().data
    profile = rows[0] if rows else {}

    fields = {
        "email": user.email,
        "name": profile.get("full_name"),
        "phone": profile.get("phone"),
    }
    fields = {k: v for k, v in fields.items() if v}

    address = profile.get("address") or {}
    if address.get("line1") and address.get("country"):
        fields["shipping"] = {
            "name": profile.get("full_name") or user.email,
            "address": {k: address[k] for k in ADDRESS_KEYS if address.get(k)},
        }

    customer_id = profile.get("stripe_customer_id")
    if customer_id:
        try:
            stripe.Customer.modify(customer_id, **fields)
            return customer_id
        except stripe.InvalidRequestError:
            pass  # that customer no longer exists, create a new one

    customer = stripe.Customer.create(**fields, metadata={"user_id": user.id})
    if rows:
        supabase.table("profiles").update({"stripe_customer_id": customer.id}).eq(
            "id", user.id
        ).execute()
    else:
        supabase.table("profiles").insert(
            {"id": user.id, "email": user.email, "stripe_customer_id": customer.id}
        ).execute()
    return customer.id