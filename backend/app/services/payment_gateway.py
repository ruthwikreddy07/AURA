"""
Razorpay Payment Gateway Integration.

Handles:
- Creating payment orders (for wallet top-up)
- Verifying payment signatures
- Processing refunds

Env vars required:
  RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
"""
import os
import hmac
import hashlib


_razorpay_client = None


def _get_client():
    """Lazy-init Razorpay client."""
    global _razorpay_client
    if _razorpay_client is not None:
        return _razorpay_client

    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")

    if not key_id or not key_secret:
        return None  # Gateway not configured — stub mode

    try:
        import razorpay
        _razorpay_client = razorpay.Client(auth=(key_id, key_secret))
        print("[Payment] Razorpay client initialized")
        return _razorpay_client
    except Exception as e:
        print(f"[Payment] Razorpay init failed: {e}")
        return None


def create_order(amount_inr: float, user_id: str, notes: dict | None = None) -> dict:
    """
    Create a Razorpay order for wallet top-up.
    Amount is in INR (e.g. 500.00 = ₹500).
    Returns order dict with id, amount, currency, status.
    """
    client = _get_client()

    if client is None:
        # Stub mode for development
        import uuid
        stub_order_id = f"order_stub_{uuid.uuid4().hex[:16]}"
        return {
            "id": stub_order_id,
            "amount": int(amount_inr * 100),
            "currency": "INR",
            "status": "created",
            "stub": True,
            "notes": {"user_id": user_id},
        }

    order_data = {
        "amount": int(amount_inr * 100),  # Razorpay expects paise
        "currency": "INR",
        "receipt": f"aura_{user_id[:8]}",
        "notes": {
            "user_id": user_id,
            **(notes or {}),
        },
    }
    order = client.order.create(data=order_data)
    return order


def verify_payment_signature(
    order_id: str,
    payment_id: str,
    signature: str,
) -> bool:
    """
    Verify Razorpay payment signature using HMAC-SHA256.
    Returns True if the signature is valid.
    """
    client = _get_client()

    if client is None:
        # Stub mode — accept if order_id starts with 'order_stub_'
        return order_id.startswith("order_stub_")

    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    message = f"{order_id}|{payment_id}"
    expected = hmac.new(
        key_secret.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, signature)


def process_refund(payment_id: str, amount_inr: float) -> dict:
    """
    Initiate a refund via Razorpay.
    Amount is in INR.
    """
    client = _get_client()

    if client is None:
        return {
            "id": f"rfnd_stub_{payment_id[:8]}",
            "amount": int(amount_inr * 100),
            "status": "processed",
            "stub": True,
        }

    refund = client.payment.refund(
        payment_id,
        {"amount": int(amount_inr * 100)},
    )
    return refund
