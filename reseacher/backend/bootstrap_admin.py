"""Provision the first administrator without shipping a default password."""
from getpass import getpass
from app.db.mongodb import get_db, shutdown_disconnect
from app.core.security import hash_password
from app.models.user import UserCreate
from app.repositories import users

def main():
    email = input('Administrator email: ').strip().lower()
    name = input('Administrator name: ').strip()
    password = getpass('Password (at least 8 characters): ')
    if password != getpass('Confirm password: '):
        raise SystemExit('Passwords do not match. Nothing was changed.')
    admin = UserCreate(email=email, name=name, password=password, role='PLATFORM_ADMIN')
    db = get_db()
    if users.get_by_email(db, email):
        raise SystemExit('Account already exists. Nothing was changed.')
    data = admin.model_dump(exclude={'password'})
    data['hashed_password'] = hash_password(password)
    users.create(db, data)
    print('Administrator created.')
    shutdown_disconnect()

if __name__ == '__main__':
    main()
