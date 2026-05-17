import smtplib
import os
import logging
from email.message import EmailMessage

logger = logging.getLogger(__name__)

def send_large_transaction_receipt(
    to_email: str,
    amount: float,
    recipient_name: str,
    txn_hash: str,
    mode: str
):
    """
    Sends an email receipt for transactions exceeding the defined threshold (e.g., ₹50,000).
    Degrades gracefully if SMTP isn't configured in the environment.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("FROM_EMAIL", "receipts@aura-pay.com")

    subject = f"AURA Payment Receipt: ₹{amount:,.2f}"
    body = f"""
Hello,

This is a confirmation of a large transaction made from your AURA account.

Amount: ₹{amount:,.2f}
Sent To: {recipient_name}
Mode Used: {mode.upper()}
Transaction Hash: {txn_hash}

If you did not authorize this transaction, please open your AURA app and navigate to the Disputes section immediately.

Stay Secure,
The AURA Team
    """

    if not all([smtp_host, smtp_user, smtp_password]):
        logger.info(f"[DEV EMAIL MOCK] Sending email to {to_email}:\n{subject}\n{body}")
        return True

    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email

    try:
        server = smtplib.SMTP(smtp_host, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"Successfully sent transaction receipt to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email receipt to {to_email}: {e}")
        return False
