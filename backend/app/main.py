from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
)
from app.config import settings
from app.routes import simulation
from app.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AURA",
    description="Offline Adaptive Payment Protocol API",
    version="1.0.0",
    debug=settings.DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.get("/health", tags=["health"])
def health_check() -> dict:
    return {"status": "ok"}