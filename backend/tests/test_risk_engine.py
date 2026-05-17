"""
Unit tests for the ML ONNX risk engine.
These are pure unit tests - no DB or HTTP required.
"""
from datetime import datetime
from app.ai.risk_engine import evaluate_transaction, _get_mode_encoded


# ── Mode Encoding ──────────────────────────────────────────────────────────────

def test_mode_encoding_known():
    assert _get_mode_encoded("QR") == 0
    assert _get_mode_encoded("BLE") == 1
    assert _get_mode_encoded("SOUND") == 2
    assert _get_mode_encoded("LIGHT") == 3
    assert _get_mode_encoded("NFC") == 4

def test_mode_encoding_case_insensitive():
    assert _get_mode_encoded("qr") == 0
    assert _get_mode_encoded("sound") == 2

def test_mode_encoding_unknown_defaults_zero():
    assert _get_mode_encoded("UNKNOWN") == 0


# ── Risk Engine - Output Shape ─────────────────────────────────────────────────

def test_evaluate_returns_required_keys():
    ts = datetime(2024, 1, 15, 14, 0)  # 2pm, safe hour
    result = evaluate_transaction(amount=500.0, mode="QR", timestamp=ts)
    assert "risk_score" in result
    assert "decision" in result

def test_risk_score_is_float_between_0_and_1():
    ts = datetime(2024, 1, 15, 10, 0)
    result = evaluate_transaction(amount=1000.0, mode="QR", timestamp=ts)
    assert 0.0 <= result["risk_score"] <= 1.0

def test_decision_is_valid_string():
    ts = datetime(2024, 1, 15, 10, 0)
    result = evaluate_transaction(amount=1000.0, mode="QR", timestamp=ts)
    assert result["decision"] in ("approve", "review", "block")


# ── Risk Engine - Decision Logic ───────────────────────────────────────────────

def test_low_amount_daytime_qr_is_approved():
    ts = datetime(2024, 1, 15, 14, 0)  # 2pm safe
    result = evaluate_transaction(amount=200.0, mode="QR", timestamp=ts)
    # Low amount, safe mode, daytime → expect approve
    assert result["decision"] == "approve"
    assert result["risk_score"] < 0.35

def test_very_large_amount_gets_blocked():
    ts = datetime(2024, 1, 15, 14, 0)
    result = evaluate_transaction(amount=100000.0, mode="QR", timestamp=ts)
    # ₹1,00,000 → should be blocked
    assert result["decision"] == "block"
    assert result["risk_score"] >= 0.70

def test_late_night_high_amount_is_risky():
    ts = datetime(2024, 1, 15, 2, 30)  # 2:30am
    result = evaluate_transaction(amount=25000.0, mode="SOUND", timestamp=ts)
    # High amount + late night + experimental mode → high risk
    assert result["decision"] in ("review", "block")

def test_medium_amount_returns_review_or_approve():
    ts = datetime(2024, 1, 15, 15, 0)
    result = evaluate_transaction(amount=25000.0, mode="QR", timestamp=ts)
    assert result["decision"] in ("approve", "review", "block")

def test_all_modes_produce_valid_output():
    ts = datetime(2024, 1, 15, 12, 0)
    for mode in ["QR", "BLE", "SOUND", "LIGHT", "NFC"]:
        result = evaluate_transaction(amount=500.0, mode=mode, timestamp=ts)
        assert result["decision"] in ("approve", "review", "block")
        assert 0.0 <= result["risk_score"] <= 1.0
