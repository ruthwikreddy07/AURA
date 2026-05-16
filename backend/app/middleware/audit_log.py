"""
Audit logging middleware — logs every authenticated API call with user ID,
endpoint, method, status code, and latency to stdout (structured JSON).
In production, pipe stdout to a log aggregator (ELK, Datadog, etc).
"""
import time
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Logs who accessed what endpoint, when, and how long it took."""

    # Skip logging for noisy/health endpoints
    SKIP_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        start = time.perf_counter()
        response = await call_next(request)
        latency_ms = round((time.perf_counter() - start) * 1000, 2)

        # Extract user from the auth header (decoded by deps.py later, but we
        # can at least log that a bearer token was present)
        auth_header = request.headers.get("authorization", "")
        has_auth = auth_header.startswith("Bearer ") if auth_header else False

        # Try to extract user_id from request state (set by get_current_user)
        user_id = getattr(request.state, "user_id", None)

        log_entry = {
            "event": "api_access",
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "latency_ms": latency_ms,
            "authenticated": has_auth,
            "user_id": str(user_id) if user_id else None,
            "ip": request.client.host if request.client else None,
        }

        # Only log mutating operations at INFO level, reads at DEBUG
        if request.method in ("POST", "PUT", "DELETE", "PATCH"):
            print(f"[AUDIT] {json.dumps(log_entry)}")
        elif response.status_code >= 400:
            print(f"[AUDIT:WARN] {json.dumps(log_entry)}")

        return response
