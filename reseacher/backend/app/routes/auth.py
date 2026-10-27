from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.db.mongodb import db_instance, get_db
from app.core.security import verify_password, create_access_token, hash_password, get_current_user
from app.models.user import UserCreate, UserResponse
from datetime import datetime
from app.core.rate_limiter import login_rate_limiter

router = APIRouter()

@router.post("/login")
async def login(request: Request):
    content_type = request.headers.get("content-type", "")
    username = ""
    password = ""
    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("username") or body.get("email") or ""
            password = body.get("password") or ""
        except Exception:
            pass
    else:
        try:
            form = await request.form()
            username = form.get("username") or form.get("email") or ""
            password = form.get("password") or ""
        except Exception:
            try:
                body = await request.json()
                username = body.get("username") or body.get("email") or ""
                password = body.get("password") or ""
            except Exception:
                pass

    if not isinstance(username, str) or not isinstance(password, str):
        raise HTTPException(status_code=400, detail="Email and password must be strings")
    username = username.strip().lower()
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username or email is required")

    get_db()

    # 0. Check Rate Limiter (Dual-key: IP and Username) & apply progressive exponential backoff (after 3 failed attempts)
    await login_rate_limiter.check_and_apply_backoff(request, username)

    def _record_login(email: str, success: bool, u_id: str = None, o_id: str = None, reason: str = None):
        try:
            if db_instance.is_connected and db_instance.db is not None:
                from app.repositories import security_repository as sec_repo
                from app.services import security_service
                ip = request.client.host if request.client else "unknown"
                ua = request.headers.get("user-agent", "unknown")
                sec_repo.insert_login_event(db_instance.db, {
                    "user_id": u_id,
                    "email": email,
                    "ip_address": ip,
                    "user_agent": ua,
                    "success": success,
                    "failure_reason": reason,
                    "organization_id": o_id,
                    "risk_score": 0 if success else 25
                })
                if not success:
                    security_service.detect_brute_force(db_instance.db, email, ip)
        except Exception:
            pass

    # 1. Check live MongoDB database if connected
    if db_instance.is_connected and db_instance.db is not None:
        from app.repositories import users as user_repo
        user = user_repo.get_by_email(db_instance.db, username)
        if user:
            # Check if account is locked by administrator or security policy
            if user.get("is_locked", False):
                _record_login(username, False, u_id=str(user.get("_id", "")), reason="Account locked due to security policy")
                raise HTTPException(
                    status_code=423, 
                    detail="Account is locked due to security policy. Please contact Platform Administrator to unlock your account."
                )

            # Allow bcrypt verification or fallback demo password for testing
            pwd_valid = verify_password(password, user.get("hashed_password", ""))
            if not pwd_valid:
                login_rate_limiter.record_failure(request, username, db=db_instance.db if db_instance.is_connected else None)
                _record_login(username, False, u_id=str(user.get("_id", "")), reason="Incorrect password")
                raise HTTPException(status_code=400, detail="Incorrect email or password")
            if not user.get("is_active", True):
                login_rate_limiter.record_failure(request, username, db=db_instance.db if db_instance.is_connected else None)
                _record_login(username, False, u_id=str(user.get("_id", "")), reason="Inactive user")
                raise HTTPException(status_code=400, detail="Inactive user")
            
            token_payload = {
                "sub": user["_id"],
                "role": user["role"],
                "email": user["email"],
                "name": user.get("name", ""),
                "organization_id": user.get("organization_id")
            }
            access_token = create_access_token(data=token_payload)
            login_rate_limiter.reset_on_success(request, username)
            _record_login(username, True, u_id=str(user["_id"]), o_id=user.get("organization_id"))
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user["_id"],
                    "name": user.get("name", ""),
                    "email": user["email"],
                    "role": user["role"],
                    "organization_id": user.get("organization_id")
                }
            }

    login_rate_limiter.record_failure(request, username, db=db_instance.db if db_instance.is_connected else None)
    _record_login(username, False, reason="User not found")
    raise HTTPException(status_code=400, detail="Incorrect email or password")

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate):
    get_db()
    if user_in.role != 'PARTICIPANT':
        raise HTTPException(status_code=403, detail='Public registration is only available to participants.')
    user_in.email = str(user_in.email).strip().lower()
    from app.repositories import users as user_repo
    if user_repo.get_by_email(db_instance.db, user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user_data = user_in.model_dump(exclude={"password"})
    user_data["hashed_password"] = hash_password(user_in.password)
    user_data["role"] = "PARTICIPANT"
    user_data["organization_id"] = None
    user_data["is_active"] = True
    user_data["locked_at"] = None
    user_data["locked_reason"] = None
    user_data["is_locked"] = False
    
    created_user = user_repo.create(db_instance.db, user_data)
    user_id_str = str(created_user.get("_id") or created_user.get("id"))

    # If the user registered as a PARTICIPANT, auto-create participant record
    if user_data["role"] == "PARTICIPANT":
        import uuid
        code = f"P-{uuid.uuid4().hex[:6].upper()}"
        participant_doc = {
            "user_id": user_id_str,
            "participant_code": code,
            "email": user_in.email,
            "name": user_in.name,
            "status": "active",
            "organization_id": None,
            "created_at": datetime.utcnow()
        }
        try:
            db_instance.db.participants.insert_one(participant_doc)
        except Exception as e:
            print(f"Error creating participant record: {e}")

    # Create immutable audit log for registration
    try:
        db_instance.db.audit_logs.insert_one({
            "action": "USER_REGISTERED",
            "entity_type": "user",
            "entity_id": user_id_str,
            "user_id": user_id_str,
            "timestamp": datetime.utcnow(),
            "details": {"email": user_in.email, "role": user_data["role"]}
        })
    except Exception:
        pass

    return created_user

@router.get("/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    get_db()
    # Fetch fresh state; never restore a locked/deactivated account.
    if db_instance.is_connected and db_instance.db is not None:
        from app.repositories import users as user_repo
        user = user_repo.get_by_id(db_instance.db, current_user["id"])
        if not user and current_user.get("email"):
            user = user_repo.get_by_email(db_instance.db, current_user["email"])
        if user:
            if user.get("is_locked") or not user.get("is_active", True):
                raise HTTPException(status_code=401, detail="Account is locked or inactive")
            user.pop("hashed_password", None)
            if "_id" in user and "id" not in user:
                user["id"] = str(user["_id"])
            return user
    
    raise HTTPException(status_code=401, detail="Account no longer exists")
