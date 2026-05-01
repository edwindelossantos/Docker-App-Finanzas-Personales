from app.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.services.category_service import create_default_categories

db = SessionLocal()
try:
    admin = db.query(User).filter(User.username == 'admin').first()
    if not admin:
        admin_user = User(
            username='admin',
            email='admin@finanzas.com',
            hashed_password=get_password_hash('admin123'),
            full_name='Administrador',
            is_active=True,
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f'Admin created with id: {admin_user.id}')
        create_default_categories(db, admin_user.id)
        print('Categories created')
    else:
        print('Admin already exists')
finally:
    db.close()