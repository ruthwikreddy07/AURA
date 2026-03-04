# app/ai/risk_engine.py

from datetime import datetime, timezone


def evaluate_transaction(
    amount: float,
    mode: str,
    timestamp: datetime,
) -> dict:
    """
    SECURITY: simple risk evaluation engine.
    Later this can be replaced with a ML model.
    """

    risk_score = 0.0

    # large transaction risk
    if amount > 5000:
        risk_score += 0.4

    # very large transaction
    if amount > 20000:
        risk_score += 0.4

    # night-time anomaly
    hour = timestamp.astimezone(timezone.utc).hour
    if hour >= 1 and hour <= 5:
        risk_score += 0.2

    # mode risk differences
    if mode == "sound":
        risk_score += 0.05
    elif mode == "qr":
        risk_score += 0.03
    elif mode == "light":
        risk_score += 0.01
    elif mode == "ble":
        risk_score += 0.02

    # decision logic
    if risk_score >= 0.85:
        decision = "block"
    elif risk_score >= 0.55:
        decision = "review"
    else:
        decision = "allow"

    return {
        "risk_score": round(risk_score, 3),
        "decision": decision,
    }