from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .config import limiter, settings
from .routes import account, admin, chat, checkout, orders, webhook

app = FastAPI(title="Store API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(checkout.router)
app.include_router(webhook.router)
app.include_router(orders.router)
app.include_router(account.router)
app.include_router(admin.router)
app.include_router(chat.router)

app.frontend("/", directory="frontend/dist", fallback="index.html")


@app.get("/health")
def health():
    return {"status": "ok"}