from datetime import datetime
import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.alert import Alert

router = APIRouter()

class AlertResponse(BaseModel):
    id: str
    user_id: str
    type: str
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}

@router.get("/user/{user_id}", response_model=list[AlertResponse])
def get_user_alerts(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = db.query(Alert).filter(Alert.user_id == uuid.UUID(user_id)).order_by(Alert.created_at.desc()).all()
    
    return [
        AlertResponse(
            id=str(a.id),
            user_id=str(a.user_id),
            type=a.type,
            message=a.message,
            created_at=a.created_at
        ) for a in alerts
    ]
