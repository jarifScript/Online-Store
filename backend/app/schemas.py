from pydantic import BaseModel, Field


class CartItem(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=20)
    variant: str | None = None


class CheckoutRequest(BaseModel):
    items: list[CartItem] = Field(min_length=1, max_length=30)