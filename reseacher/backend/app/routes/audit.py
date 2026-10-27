from fastapi import APIRouter, Depends
from typing import List
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role
from app.models.audit import AuditLogResponse
from app.repositories import audit as audit_repo

router = APIRouter()

@router.get("/", response_model=List[AuditLogResponse])
def get_logs(db = Depends(get_db), current_user: dict = Depends(require_role("PLATFORM_ADMIN", "PRINCIPAL_INVESTIGATOR"))):
    raw_logs = audit_repo.list_all(db)
    from bson import ObjectId
    enriched = []
    for log in raw_logs:
        u_id = log.get("user_id")
        user_display = u_id or "System"
        role_display = log.get("role") or (log.get("details") or {}).get("role") or "PLATFORM_ADMIN"
        
        # Try to resolve user_id to user name/email if it's an ObjectId or hex
        if u_id and len(str(u_id)) == 24:
            try:
                u_doc = db.users.find_one({"_id": ObjectId(u_id)})
                if u_doc:
                    user_display = u_doc.get("name") or u_doc.get("email") or str(u_id)
                    if not log.get("role"):
                        role_display = u_doc.get("role") or role_display
            except Exception:
                pass
        elif log.get("details", {}).get("email"):
            user_display = log["details"]["email"]

        entity_id = log.get("entity_id") or log.get("target_entity") or (log.get("details") or {}).get("email") or "system"
        reason = log.get("reason") or (log.get("details") or {}).get("resolution_notes") or (log.get("details") or {}).get("reason")

        enriched.append({
            "id": str(log.get("_id") or log.get("id")),
            "_id": str(log.get("_id") or log.get("id")),
            "user_id": user_display,
            "role": role_display,
            "action": log.get("action", "SYSTEM_EVENT"),
            "entity_type": log.get("entity_type", "system"),
            "entity_id": str(entity_id),
            "old_status": log.get("old_status"),
            "new_status": log.get("new_status"),
            "reason": reason,
            "timestamp": log.get("timestamp", log.get("created_at")),
            "details": log.get("details")
        })
    return enriched
