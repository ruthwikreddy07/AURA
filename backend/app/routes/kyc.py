"""
KYC Verification Routes
"""
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.kyc import KYCDocument
from app.utils.hashing import hash_password

router = APIRouter()

VALID_KYC_STATUSES = {"pending", "verified", "rejected", "unverified"}

class SubmitKYCRequest(BaseModel):
    document_type: str = Field(..., pattern="^(AADHAAR|PAN)$")
    document_number: str

class KYCResponse(BaseModel):
    status: str
    document_type: str
    message: str


def _simulate_kyc_verification(document_type: str, document_number: str) -> bool:
    """
    Simulate an external KYC API call without blocking the event loop.
    In production, replace with a proper async HTTP call to UIDAI/Digilocker.
    """
    if document_type == "AADHAAR":
        return len(document_number) == 12 and document_number.isdigit()
    elif document_type == "PAN":
        # PAN format: AAAAA9999A (5 letters, 4 digits, 1 letter)
        if len(document_number) != 10:
            return False
        doc = document_number.upper()
        return doc[:5].isalpha() and doc[5:9].isdigit() and doc[9].isalpha()
    return False


@router.post("/submit", response_model=KYCResponse, status_code=status.HTTP_200_OK)
def submit_kyc(
    payload: SubmitKYCRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check if user already has an active/pending KYC
    existing_kyc = db.query(KYCDocument).filter(
        KYCDocument.user_id == current_user.id
    ).first()

    if existing_kyc:
        if existing_kyc.status == "verified":
            raise HTTPException(status_code=400, detail="KYC is already verified")
        elif existing_kyc.status == "pending":
            raise HTTPException(status_code=400, detail="KYC verification is already pending")
        # If rejected, allow re-submission by updating the existing record
        elif existing_kyc.status == "rejected":
            existing_kyc.document_type = payload.document_type
            existing_kyc.document_number_hash = hash_password(payload.document_number)
            existing_kyc.status = "pending"
            kyc_doc = existing_kyc
        else:
            kyc_doc = existing_kyc
    else:
        # Securely hash the document number before storing it
        doc_hash = hash_password(payload.document_number)
        kyc_doc = KYCDocument(
            user_id=current_user.id,
            document_type=payload.document_type,
            document_number_hash=doc_hash,
            status="pending"
        )
        db.add(kyc_doc)
        db.flush()

    # ── SIMULATED EXTERNAL KYC VERIFICATION ──
    # NOTE: time.sleep() removed — it blocks the entire server process.
    # In production, dispatch a Celery background task here instead.
    is_valid = _simulate_kyc_verification(payload.document_type, payload.document_number)

    if is_valid:
        kyc_doc.status = "verified"
        current_user.kyc_status = "verified"
        msg = "KYC verified successfully. Your transaction limits have been increased to ₹1,00,000."
    else:
        kyc_doc.status = "rejected"
        current_user.kyc_status = "rejected"
        msg = "KYC verification failed. Please check your document number and try again."

    db.commit()

    return KYCResponse(
        status=kyc_doc.status,
        document_type=kyc_doc.document_type,
        message=msg
    )


@router.get("/status", response_model=KYCResponse)
def get_kyc_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kyc_doc = db.query(KYCDocument).filter(
        KYCDocument.user_id == current_user.id
    ).first()

    if not kyc_doc:
        return KYCResponse(
            status="unverified",
            document_type="NONE",
            message="No KYC documents submitted yet."
        )

    return KYCResponse(
        status=kyc_doc.status,
        document_type=kyc_doc.document_type,
        message=f"Your KYC status is currently {kyc_doc.status}."
    )
