import time
import uuid
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from datetime import datetime

from app.db.mongodb import db_instance
from app.core.security import verify_token

class SecurityEventMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Generate a unique request_id (UUID4) for each request
        request_id = str(uuid.uuid4())
        
        # 2. Capture start time for duration calculation
        start_time = time.time()
        
        # 3. Call call_next(request) to process the request
        response = await call_next(request)
        
        # Calculate duration in ms
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Skip logging for health checks, OPTIONS requests, and static files
        path = request.url.path
        if (
            path.startswith("/api/health") or 
            request.method == "OPTIONS" or 
            path.startswith("/static/") or
            path.startswith("/favicon.ico")
        ):
            return response
            
        # 4. After response, fire-and-forget logging in a try/except
        try:
            db = db_instance.db
            if db is not None:
                # a. Extract user info from Authorization header
                user_id = None
                role = None
                try:
                    auth = request.headers.get("authorization", "")
                    if auth.startswith("Bearer "):
                        token = auth[7:]
                        payload = verify_token(token)
                        user_id = payload.get("sub")
                        role = payload.get("role")
                except Exception:
                    pass

                # b. Capture basic info
                method = request.method
                status_code = response.status_code
                ip = request.client.host if request.client else "unknown"
                user_agent = request.headers.get("user-agent", "unknown")
                
                # Base event dict
                def create_security_event(event_type: str, severity: str, additional_details: dict = None):
                    event = {
                        "request_id": request_id,
                        "timestamp": datetime.utcnow(),
                        "event_type": event_type,
                        "severity": severity,
                        "user_id": user_id,
                        "role": role,
                        "endpoint": path,
                        "method": method,
                        "status_code": status_code,
                        "duration_ms": duration_ms,
                        "ip_address": ip,
                        "user_agent": user_agent,
                        "details": additional_details or {}
                    }
                    db.security_events.insert_one(event)

                # c. For 401 responses
                if status_code == 401:
                    if "/auth/login" in path:
                        create_security_event("LOGIN_FAILED", "MEDIUM")
                    else:
                        create_security_event("ACCESS_DENIED", "MEDIUM")
                
                # d. For 403 responses
                elif status_code == 403:
                    create_security_event("ACCESS_DENIED", "HIGH")
                    
                # e. For 429 responses
                elif status_code == 429:
                    create_security_event("RATE_LIMIT_EXCEEDED", "MEDIUM")
                    
                # f. For 5xx responses
                elif status_code >= 500:
                    create_security_event("API_ERROR", "HIGH")
                    
                # g. For successful requests to PHI endpoints
                elif 200 <= status_code < 300:
                    if path.startswith("/api/participants") or path.startswith("/api/consent"):
                        resource_type = "participant" if path.startswith("/api/participants") else "consent"
                        access_event = {
                            "request_id": request_id,
                            "timestamp": datetime.utcnow(),
                            "user_id": user_id,
                            "role": role,
                            "resource_type": resource_type,
                            "endpoint": path,
                            "method": method,
                            "duration_ms": duration_ms,
                            "ip_address": ip
                        }
                        db.access_events.insert_one(access_event)
                        
                    # h. For successful requests returning large result sets
                    # We check if it's a GET request (list endpoint) and potentially has large data.
                    # Since we can't easily read response body in middleware without consuming it,
                    # we will look at custom metadata headers or attempt a basic heuristic, but the prompt says:
                    # "if the response is to a list endpoint and metadata indicates >50 records"
                    # We'll check for a custom header "X-Total-Count" or "X-Record-Count" injected by the route.
                    # Alternatively, if not available, we skip.
                    record_count_str = response.headers.get("X-Record-Count") or response.headers.get("X-Total-Count")
                    if record_count_str and record_count_str.isdigit():
                        if int(record_count_str) > 50 and method == "GET":
                            create_security_event("BULK_EXPORT", "MEDIUM", {"record_count": int(record_count_str)})
                        
        except Exception:
            # NEVER block the main request if logging fails
            pass
            
        # 5. Returns the response unchanged
        return response
