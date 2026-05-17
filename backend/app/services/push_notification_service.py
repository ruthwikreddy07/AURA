"""
FCM Push Notification Service for AURA.

Uses the Firebase Admin SDK to send push notifications.
Requires FIREBASE_CREDENTIALS_JSON env var with your Firebase service account JSON.

To set up:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key (downloads JSON)
3. Set FIREBASE_CREDENTIALS_JSON=<content of JSON> in your .env

Notification types sent by AURA:
- payment_received  : When a payment token arrives in your wallet
- payment_sent      : Confirmation of your outgoing payment
- fraud_alert       : High-risk transaction flagged by ML engine
- token_expired     : When an offline token expires and is refunded
- sync_complete     : Offline queue successfully synced
"""

import os
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── FCM Initialisation (lazy, won't crash if Firebase is not configured) ────────

_fcm_app = None

def _get_fcm_app():
    """Initialise Firebase Admin SDK once. Returns None if credentials not set."""
    global _fcm_app
    if _fcm_app is not None:
        return _fcm_app

    creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if not creds_json:
        logger.warning("[FCM] FIREBASE_CREDENTIALS_JSON not set — push notifications disabled.")
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials

        cred_dict = json.loads(creds_json)
        cred = credentials.Certificate(cred_dict)
        _fcm_app = firebase_admin.initialize_app(cred)
        logger.info("[FCM] Firebase Admin SDK initialised.")
        return _fcm_app
    except Exception as e:
        logger.error(f"[FCM] Failed to initialise Firebase: {e}")
        return None


# ── Core Send Function ──────────────────────────────────────────────────────────

def send_push_notification(
    fcm_token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    image_url: Optional[str] = None,
) -> dict:
    """
    Send a single push notification to a device FCM token.

    Returns:
        {"success": True, "message_id": "..."} on success
        {"success": False, "error": "..."} on failure or when FCM not configured
    """
    app = _get_fcm_app()
    if app is None:
        # Gracefully degrade — log but don't break the payment flow
        logger.info(f"[FCM] Skipping push (FCM not configured): {title}")
        return {"success": False, "error": "FCM not configured"}

    try:
        from firebase_admin import messaging

        notification = messaging.Notification(title=title, body=body)
        if image_url:
            notification = messaging.Notification(title=title, body=body, image=image_url)

        message = messaging.Message(
            notification=notification,
            data={k: str(v) for k, v in (data or {}).items()},  # FCM data must be str→str
            token=fcm_token,
            android=messaging.AndroidConfig(priority="high"),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound="default",
                        badge=1,
                    )
                )
            ),
        )

        message_id = messaging.send(message)
        logger.info(f"[FCM] Sent '{title}' → {fcm_token[:16]}... (id={message_id})")
        return {"success": True, "message_id": message_id}

    except Exception as e:
        logger.error(f"[FCM] Send failed: {e}")
        return {"success": False, "error": str(e)}


def send_batch_notifications(notifications: list[dict]) -> list[dict]:
    """
    Send multiple notifications. Each dict must have:
      { fcm_token, title, body, data (optional) }
    """
    return [
        send_push_notification(
            fcm_token=n["fcm_token"],
            title=n["title"],
            body=n["body"],
            data=n.get("data"),
        )
        for n in notifications
    ]


# ── Typed Notification Helpers ─────────────────────────────────────────────────

def notify_payment_received(fcm_token: str, amount: float, sender_name: str, mode: str) -> dict:
    return send_push_notification(
        fcm_token=fcm_token,
        title="Payment Received",
        body=f"You received ₹{amount:,.0f} from {sender_name} via {mode}",
        data={"type": "payment_received", "amount": str(amount), "mode": mode},
    )

def notify_payment_sent(fcm_token: str, amount: float, receiver_name: str) -> dict:
    return send_push_notification(
        fcm_token=fcm_token,
        title="Payment Sent",
        body=f"₹{amount:,.0f} sent to {receiver_name} successfully.",
        data={"type": "payment_sent", "amount": str(amount)},
    )

def notify_fraud_alert(fcm_token: str, amount: float, risk_score: float) -> dict:
    return send_push_notification(
        fcm_token=fcm_token,
        title="Fraud Alert",
        body=f"High-risk transaction of ₹{amount:,.0f} blocked (Risk: {int(risk_score * 100)}%). Contact support if unexpected.",
        data={"type": "fraud_alert", "risk_score": str(risk_score)},
    )

def notify_token_expired(fcm_token: str, amount: float) -> dict:
    return send_push_notification(
        fcm_token=fcm_token,
        title="Token Expired — Refund Issued",
        body=f"An offline token worth ₹{amount:,.0f} expired. Your wallet has been credited.",
        data={"type": "token_expired", "amount": str(amount)},
    )

def notify_sync_complete(fcm_token: str, count: int) -> dict:
    return send_push_notification(
        fcm_token=fcm_token,
        title="Sync Complete",
        body=f"{count} offline transaction{'s' if count != 1 else ''} synced successfully.",
        data={"type": "sync_complete", "count": str(count)},
    )
