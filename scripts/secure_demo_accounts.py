"""Inspect legacy demo accounts; --apply locks them only after a secure owner exists."""
import argparse
import secrets
import sys
from datetime import datetime
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'reseacher' / 'backend'))


def secure_demo_accounts(db, owner_email, apply=False):
    from app.core.security import hash_password, verify_password
    owner = db.users.find_one({'email': owner_email.strip().lower()})
    if not owner or owner.get('role') != 'PLATFORM_ADMIN' or not owner.get('is_active', True) or owner.get('is_locked'):
        raise ValueError('An active owner administrator must exist before demo accounts can be changed.')
    if not owner.get('hashed_password') or verify_password('demo123', owner['hashed_password']):
        raise ValueError('The owner must have a private password before demo accounts can be changed.')
    matched = 0
    for user in db.users.find({'is_active': {'$ne': False}}):
        if not verify_password('demo123', user.get('hashed_password', '')):
            continue
        if apply:
            result = db.users.update_one({'_id': user['_id'], 'hashed_password': user['hashed_password']}, {'$set': {
                'hashed_password': hash_password(secrets.token_urlsafe(32)),
                'is_locked': True,
                'locked_reason': 'Legacy public demo credential retired. Administrator password reset is required.',
                'locked_at': datetime.utcnow(),
            }})
            if result.modified_count:
                db.audit_logs.insert_one({'action': 'LEGACY_DEMO_CREDENTIAL_RETIRED', 'user_id': str(owner['_id']), 'entity_id': str(user['_id']), 'timestamp': datetime.utcnow()})
        matched += 1
    return matched


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--owner-email', required=True)
    parser.add_argument('--apply', action='store_true', help='Lock matching demo accounts and invalidate their old passwords.')
    args = parser.parse_args()
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[1] / 'reseacher' / 'backend' / '.env')
    from app.db.mongodb import get_db, shutdown_disconnect
    try:
        count = secure_demo_accounts(get_db(), args.owner_email, apply=args.apply)
        print(f'{count} legacy demo accounts ' + ('secured.' if args.apply else 'identified. No accounts were changed.'))
    except ValueError as error:
        parser.exit(1, str(error) + '\n')
    finally:
        shutdown_disconnect()


if __name__ == '__main__':
    main()
