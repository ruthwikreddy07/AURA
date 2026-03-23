from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.bank_account import BankAccount

router = APIRouter()


class LinkBankRequest(BaseModel):
    bank_name: str
    account_name: str
    account_number_masked: str
    ifsc_code: str | None = None
    upi_id: str | None = None


class BankAccountResponse(BaseModel):
    id: str
    bank_name: str
    account_name: str
    account_number_masked: str
    ifsc_code: str | None
    upi_id: str | None
    is_primary: bool

    model_config = {"from_attributes": True}


@router.post("/link", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
def link_bank_account(
    payload: LinkBankRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify transaction PIN before linking? Future enhancement.
    
    # Check if this is the first account; if so, make it primary
    existing_count = db.query(BankAccount).filter(BankAccount.user_id == current_user.id).count()
    is_primary = existing_count == 0

    account = BankAccount(
        user_id=current_user.id,
        bank_name=payload.bank_name,
        account_name=payload.account_name,
        account_number_masked=payload.account_number_masked,
        ifsc_code=payload.ifsc_code,
        upi_id=payload.upi_id,
        is_primary=is_primary
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    return BankAccountResponse(
        id=str(account.id),
        bank_name=account.bank_name,
        account_name=account.account_name,
        account_number_masked=account.account_number_masked,
        ifsc_code=account.ifsc_code,
        upi_id=account.upi_id,
        is_primary=account.is_primary
    )


@router.get("/user/{user_id}", response_model=list[BankAccountResponse])
def get_user_bank_accounts(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    accounts = db.query(BankAccount).filter(BankAccount.user_id == current_user.id).all()
    
    return [
        BankAccountResponse(
            id=str(acc.id),
            bank_name=acc.bank_name,
            account_name=acc.account_name,
            account_number_masked=acc.account_number_masked,
            ifsc_code=acc.ifsc_code,
            upi_id=acc.upi_id,
            is_primary=acc.is_primary
        ) for acc in accounts
    ]


@router.delete("/{account_id}")
def remove_bank_account(
    account_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
        
    db.delete(account)
    db.commit()
    
    return {"status": "success", "message": "Bank account removed"}


@router.put("/{account_id}/set-primary", response_model=BankAccountResponse)
def set_primary_bank_account(
    account_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify the account exists and belongs to the user
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    # Clear primary flag on all user accounts
    db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id
    ).update({"is_primary": False})
    
    # Set the selected account as primary
    account.is_primary = True
    db.commit()
    db.refresh(account)
    
    return BankAccountResponse(
        id=str(account.id),
        bank_name=account.bank_name,
        account_name=account.account_name,
        account_number_masked=account.account_number_masked,
        ifsc_code=account.ifsc_code,
        upi_id=account.upi_id,
        is_primary=account.is_primary
    )
