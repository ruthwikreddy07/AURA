"""
Contacts / Favorites routes.

Allows users to:
- Add a contact by phone number
- List their contacts (with favorites first)
- Toggle favorite status
- Remove a contact
- Search AURA users by phone number
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.contact import Contact

router = APIRouter()


class AddContactRequest(BaseModel):
    phone_number: str
    nickname: str | None = None


class ContactResponse(BaseModel):
    id: str
    contact_user_id: str
    full_name: str
    phone_number: str
    nickname: str | None
    is_favorite: bool

    model_config = {"from_attributes": True}


class UserSearchResult(BaseModel):
    id: str
    full_name: str
    phone_number: str


@router.post("/add", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def add_contact(
    payload: AddContactRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find the target user by phone number
    target = db.query(User).filter(
        User.phone_number == payload.phone_number
    ).first()

    if not target:
        raise HTTPException(404, "No AURA user found with this phone number")

    if target.id == current_user.id:
        raise HTTPException(400, "Cannot add yourself as a contact")

    # Check duplicate
    existing = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.contact_user_id == target.id,
    ).first()

    if existing:
        raise HTTPException(409, "Contact already exists")

    contact = Contact(
        user_id=current_user.id,
        contact_user_id=target.id,
        nickname=payload.nickname,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)

    return ContactResponse(
        id=str(contact.id),
        contact_user_id=str(target.id),
        full_name=target.full_name,
        phone_number=target.phone_number or "",
        nickname=contact.nickname,
        is_favorite=contact.is_favorite,
    )


@router.get("/list", response_model=list[ContactResponse])
def list_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str | None = Query(None, description="Search by name or phone"),
):
    query = (
        db.query(Contact, User)
        .join(User, Contact.contact_user_id == User.id)
        .filter(Contact.user_id == current_user.id)
    )

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            User.full_name.ilike(pattern) | User.phone_number.ilike(pattern)
        )

    results = (
        query.order_by(Contact.is_favorite.desc(), User.full_name.asc()).all()
    )

    return [
        ContactResponse(
            id=str(c.id),
            contact_user_id=str(u.id),
            full_name=u.full_name,
            phone_number=u.phone_number or "",
            nickname=c.nickname,
            is_favorite=c.is_favorite,
        )
        for c, u in results
    ]


@router.put("/{contact_id}/favorite")
def toggle_favorite(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.query(Contact).filter(
        Contact.id == uuid.UUID(contact_id),
        Contact.user_id == current_user.id,
    ).first()

    if not contact:
        raise HTTPException(404, "Contact not found")

    contact.is_favorite = not contact.is_favorite
    db.commit()

    return {
        "status": "success",
        "is_favorite": contact.is_favorite,
    }


@router.delete("/{contact_id}")
def remove_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.query(Contact).filter(
        Contact.id == uuid.UUID(contact_id),
        Contact.user_id == current_user.id,
    ).first()

    if not contact:
        raise HTTPException(404, "Contact not found")

    db.delete(contact)
    db.commit()

    return {"status": "success", "message": "Contact removed"}


@router.get("/search", response_model=list[UserSearchResult])
def search_users(
    phone: str = Query(..., min_length=3, description="Phone number to search"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search AURA users by phone number for adding as contacts."""
    results = (
        db.query(User)
        .filter(
            User.phone_number.ilike(f"%{phone}%"),
            User.id != current_user.id,
            User.is_active.is_(True),
        )
        .limit(10)
        .all()
    )

    return [
        UserSearchResult(
            id=str(u.id),
            full_name=u.full_name,
            phone_number=u.phone_number or "",
        )
        for u in results
    ]
