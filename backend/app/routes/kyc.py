"""
KYC Verification Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import time

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.kyc import KYCDocument
from app.utils.hashing import hash_password

router = APIRouter()

class SubmitKYCRequest(BaseModel):
    document_type: str = Field(..., pattern="^(AADHAAR|PAN)$")
    document_number: str

class KYCResponse(BaseModel):
    status: str
    document_type: str
    message: str


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

    # Securely hash the document number before storing it
    doc_hash = hash_password(payload.document_number)
    
    # Create the KYC record
    kyc_doc = KYCDocument(
        user_id=current_user.id,
        document_type=payload.document_type,
        document_number_hash=doc_hash,
        status="pending"
    )
    db.add(kyc_doc)
    
    # ── SIMULATED EXTERNAL KYC VERIFICATION ──
    # In a real app, you would dispatch a Celery task to verify this via Digilocker/UIDAI API.
    # Here we mock a successful verification if the length is correct (Aadhaar=12, PAN=10)
    time.sleep(1.5) # Simulate network call
    
    is_valid = False
    if payload.document_type == "AADHAAR" and len(payload.document_number) == 12 and payload.document_number.isdigit():
        is_valid = True
    elif payload.document_type == "PAN" and len(payload.document_number) == 10:
        is_valid = True

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
