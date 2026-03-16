from datetime import datetime


def evaluate_transaction(
    amount: float,
    mode: str,
    timestamp: datetime,
) -> dict:
    """
    Stub risk engine. Returns a safe default until the ONNX model is wired in.
    Decision values: "approve" | "review" | "block"
    """
    risk_score: float = 0.05

    if amount > 50000:
        risk_score = 0.75
    elif amount > 20000:
        risk_score = 0.40
    elif mode in ("SOUND", "LIGHT"):
        risk_score = 0.20

    if risk_score >= 0.70:
        decision = "block"
    elif risk_score >= 0.35:
        decision = "review"
    else:
        decision = "approve"

    return {
        "risk_score": round(risk_score, 4),
        "decision": decision,
    }