"""
Push Notification API Routes for AURA.

Endpoints:
  POST /api/v1/notifications/register-token   — Save device FCM token
  DELETE /api/v1/notifications/unregister-token — Remove FCM token on logout
  POST /api/v1/notifications/test             — Send a test notification (dev only)
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services.push_notification_service import send_push_notification

router = APIRouter()


# ── Register Device Token ───────────────────────────────────────────────────────

class RegisterTokenRequest(BaseModel):
    fcm_token: str


@router.post("/register-token")
def register_fcm_token(
    payload: RegisterTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save the FCM push token for the authenticated user's device."""
    current_user.fcm_token = payload.fcm_token
    db.commit()
    return {"status": "success", "message": "FCM token registered"}


# ── Unregister Token (e.g. on logout) ─────────────────────────────────────────

@router.delete("/unregister-token")
def unregister_fcm_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear the FCM token so the user stops receiving push notifications."""
    current_user.fcm_token = None
    db.commit()
    return {"status": "success", "message": "FCM token removed"}


# ── Test Notification (dev only) ───────────────────────────────────────────────

class TestNotificationRequest(BaseModel):
    title: str = "AURA Test"
    body: str = "This is a test push notification from AURA."


@router.post("/test")
def send_test_notification(
    payload: TestNotificationRequest,
    current_user: User = Depends(get_current_user),
):
    """Send a test notification to the current user's registered device."""
    if not current_user.fcm_token:
        raise HTTPException(
            status_code=400,
            detail="No FCM token registered for this user. Call /register-token first."
        )

    result = send_push_notification(
        fcm_token=current_user.fcm_token,
        title=payload.title,
        body=payload.body,
        data={"type": "test"},
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to send notification"))

    return {"status": "sent", "message_id": result.get("message_id")}
