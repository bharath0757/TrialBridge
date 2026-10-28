import logging
import time
from pymongo import MongoClient
from pymongo.database import Database
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)
class MongoDB:
    client = None
    db = None
    is_connected = False
    connection_error = None
    last_attempt = 0.0

db_instance = MongoDB()

def connection_failure_category(exc):
    """Return fixed diagnostic labels without exposing connection-string details."""
    message = str(exc).lower()
    if getattr(exc, 'code', None) == 18 or 'authentication failed' in message:
        return 'authentication'
    if 'certificate_verify_failed' in message or 'certificate verify failed' in message:
        return 'tls_certificate'
    if 'ssl handshake' in message or 'tls' in message:
        return 'tls_handshake_or_network_access'
    if 'dns' in message or 'resolution' in message or 'nxdomain' in message:
        return 'dns_resolution'
    if 'timed out' in message or 'timeout' in message:
        return 'network_timeout'
    if 'connection refused' in message:
        return 'connection_refused'
    return 'connection_configuration'

def startup_connect():
    if db_instance.is_connected:
        return
    if time.monotonic() - db_instance.last_attempt < 15:
        return
    db_instance.last_attempt = time.monotonic()
    if not settings.MONGODB_URI:
        db_instance.connection_error = 'Database configuration is missing.'
        return
    client = None
    try:
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=10000,
                             connectTimeoutMS=10000, socketTimeoutMS=5000,
                             maxPoolSize=30, minPoolSize=0, appname='TrialBridge')
        client.admin.command('ping')
        db_instance.client = client
        db_instance.db = client[settings.MONGODB_DATABASE]
        db_instance.is_connected = True
        db_instance.connection_error = None
    except Exception as exc:
        if client is not None:
            client.close()
        db_instance.connection_error = 'Database connection unavailable.'
        logger.warning('MongoDB connection failed: %s. Check server credentials and network access.', connection_failure_category(exc))

def shutdown_disconnect():
    if db_instance.client is not None:
        db_instance.client.close()
    db_instance.client = None
    db_instance.db = None
    db_instance.is_connected = False
    db_instance.last_attempt = 0.0

def get_db() -> Database:
    if not db_instance.is_connected or db_instance.db is None:
        startup_connect()
    if not db_instance.is_connected or db_instance.db is None:
        raise HTTPException(status_code=503, detail='The database service is temporarily unavailable.')
    return db_instance.db
