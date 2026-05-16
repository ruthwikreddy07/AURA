"""
Payment routes — wallet top-up via Razorpay.

Flow:
  1. POST /payments/create-order  → returns Razorpay order_id + amount
  2. Client opens Razorpay checkout, user pays
  3. POST /payments/verify        → verifies signature, credits wallet
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.wallet import Wallet
from app.services import payment_gateway

router = APIRouter()


# ── Request / Response schemas ──

class CreateOrderRequest(BaseModel):
    amount: float  # INR


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int  # paise
    currency: str
    key_id: str | None = None


class VerifyPaymentRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: str


class RefundRequest(BaseModel):
    payment_id: str
    amount: float  # INR


# ── Endpoints ──

@router.post(
    "/create-order",
    response_model=CreateOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment_order(
    payload: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    if payload.amount > 100000:
        raise HTTPException(400, "Maximum top-up is ₹1,00,000")

    import os
    order = payment_gateway.create_order(
        amount_inr=payload.amount,
        user_id=str(current_user.id),
    )

    return CreateOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order.get("currency", "INR"),
        key_id=os.getenv("RAZORPAY_KEY_ID"),
    )


@router.post("/verify")
def verify_payment(
    payload: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_valid = payment_gateway.verify_payment_signature(
        order_id=payload.order_id,
        payment_id=payload.payment_id,
        signature=payload.signature,
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature",
        )

    # Credit wallet
    wallet = (
        db.query(Wallet)
        .filter(Wallet.user_id == current_user.id)
        .first()
    )
    if not wallet:
        raise HTTPException(404, "Wallet not found")

    # Razorpay amount is in paise — we don't have it directly here,
    # so we re-fetch from the order. For stub mode, accept 0 credit.
    # In production, fetch order details from Razorpay to get amount.
    import os
    client = payment_gateway._get_client()
    if client and not payload.order_id.startswith("order_stub_"):
        order = client.order.fetch(payload.order_id)
        credit_amount = order["amount_paid"] / 100  # paise → INR
    else:
        # Stub mode — extract from order_id isn't possible, 
        # so the mobile client must pass amount separately.
        # For now, just mark as verified.
        credit_amount = 0

    from decimal import Decimal
    if credit_amount > 0:
        wallet.balance += Decimal(str(credit_amount))

    db.commit()

    return {
        "status": "success",
        "message": "Payment verified and wallet credited",
        "credited": credit_amount,
        "new_balance": float(wallet.balance),
    }


@router.post("/refund")
def request_refund(
    payload: RefundRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.amount <= 0:
        raise HTTPException(400, "Refund amount must be positive")

    result = payment_gateway.process_refund(
        payment_id=payload.payment_id,
        amount_inr=payload.amount,
    )

    return {
        "status": "success",
        "refund_id": result.get("id"),
        "amount": payload.amount,
    }
