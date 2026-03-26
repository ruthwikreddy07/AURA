import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import (
    auth,
    wallet,
    tokens,
    transactions,
    sync,
    analytics,
    risk,
    mode,
    payment_session,
    payment_packet,
    bank,
    alerts,
)
from app.config import settings
from app.routes import simulation
from app.database import Base, engine

# NOTE: Schema is now managed by Alembic migrations.
# Run: py -3.12 -m alembic upgrade head

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app = FastAPI(
    title="AURA",
    description="Offline Adaptive Payment Protocol API",
    version="1.0.0",
    debug=False,  # Must be False so global_exception_handler can add CORS headers
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler so that even 500 responses carry CORS headers."""
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    traceback.print_exc()  # still log the full traceback to the console

    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers=headers,
    )


app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(wallet.router, prefix="/api/v1/wallet", tags=["wallet"])
app.include_router(tokens.router, prefix="/api/v1/tokens", tags=["tokens"])
app.include_router(transactions.router, prefix="/api/v1/transactions", tags=["transactions"])
app.include_router(sync.router, prefix="/api/v1/sync", tags=["sync"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(risk.router, prefix="/api/v1/risk", tags=["risk"])
app.include_router(mode.router, prefix="/api/v1/mode", tags=["mode"])
app.include_router(payment_session.router, prefix="/api/v1/payment-session", tags=["payment-session"])
app.include_router(payment_packet.router, prefix="/api/v1/payment-packet", tags=["payment-packet"])
app.include_router(simulation.router, prefix="/api/v1/simulation", tags=["simulation"])
app.include_router(bank.router, prefix="/api/v1/bank", tags=["bank"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])

# ── Token Expiry Background Task ──────────────────────────────
from app.tasks.token_expiry import process_expired_tokens

@app.on_event("startup")
def run_expiry_on_startup():
    """Process any expired tokens when the server starts."""
    try:
        result = process_expired_tokens()
        print(f"[Startup] Token expiry: {result['processed']} tokens processed, ₹{result['total_refunded']} refunded")
    except Exception as e:
        print(f"[Startup] Token expiry check failed: {e}")


@app.post("/api/v1/admin/expire-tokens", tags=["admin"])
def trigger_expiry():
    """Manual trigger for the token expiry auto-refund task."""
    result = process_expired_tokens()
    return result


@app.get("/health", tags=["health"])
def health_check() -> dict:
    return {"status": "ok"}