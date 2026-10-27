from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db.mongodb import startup_connect, shutdown_disconnect, get_db, db_instance
from app.db.indexes import create_indexes
from app.routes import auth, users, organizations, studies, participants, screening, eligibility, consent, enrollment, visits, tasks, documents, notifications, messages, reports, simulation, audit, admet, ws
from app.routes import security as admin_security

@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_connect()
    if db_instance.is_connected and db_instance.db is not None:
        try:
            create_indexes(db_instance.db)
        except Exception as e:
            print(f"Index creation warning: {e}")
    yield
    shutdown_disconnect()

app = FastAPI(title="TrialBridge API", lifespan=lifespan)

from app.core.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(',') if origin.strip()],
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type'],
)

# Security event logging middleware (must be added after CORS middleware)
from app.core.security_middleware import SecurityEventMiddleware
app.add_middleware(SecurityEventMiddleware)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(organizations.router, prefix="/api/organizations", tags=["organizations"])
app.include_router(studies.router, prefix="/api/studies", tags=["studies"])
app.include_router(participants.router, prefix="/api/participants", tags=["participants"])
app.include_router(screening.router, prefix="/api/screening", tags=["screening"])
app.include_router(eligibility.router, prefix="/api/eligibility", tags=["eligibility"])
app.include_router(consent.router, prefix="/api/consent", tags=["consent"])
app.include_router(consent.router, prefix="/api/consent-records", tags=["consent-records"])
app.include_router(enrollment.router, prefix="/api/enrollment", tags=["enrollment"])
app.include_router(visits.router, prefix="/api/visits", tags=["visits"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
app.include_router(audit.router, prefix="/api/audit", tags=["audit"])
app.include_router(admet.router, prefix="/api/admet", tags=["admet"])
app.include_router(ws.router, prefix="/api/ws", tags=["websocket"])
app.include_router(admin_security.router, prefix="/api/admin/security", tags=["admin-security"])

@app.get("/")
def root_status():
    return {
        "service": "TrialBridge API",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    if not db_instance.is_connected:
        startup_connect()
    if db_instance.is_connected and len(settings.JWT_SECRET) >= 32:
        return {"status": "ok", "database": "mongodb", "database_status": "connected"}
    raise HTTPException(
        status_code=503,
        detail={
            "status": "unavailable",
            "database": "mongodb",
            "database_status": "disconnected",
            "message": "Database or authentication configuration is unavailable."
        }
    )
