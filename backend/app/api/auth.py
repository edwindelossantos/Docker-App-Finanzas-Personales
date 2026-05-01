from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from ..database import get_db
from ..core.security import get_current_active_user, get_password_hash
from ..models.user import User
from ..schemas.user import UserCreate, UserResponse, LoginRequest, Token
from ..services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if auth_service.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    if auth_service.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    return auth_service.create_user(db, user)

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth_service.create_user_token(user)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/change-password")
def change_password(old_password: str, new_password: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not auth_service.authenticate_user(db, current_user.username, old_password):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    return {"message": "Contraseña actualizada"}