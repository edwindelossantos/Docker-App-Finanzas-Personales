from sqlalchemy.orm import Session
from typing import List, Optional

from ..models.category import Category
from ..schemas.category import CategoryCreate, CategoryUpdate

DEFAULT_CATEGORIES = [
    {"name": "Vivienda", "color": "#10B981", "icon": "home", "percentage": 30},
    {"name": "Alimentación", "color": "#F59E0B", "icon": "utensils", "percentage": 15},
    {"name": "Ahorro", "color": "#3B82F6", "icon": "piggy-bank", "percentage": 10},
    {"name": "Salud", "color": "#EF4444", "icon": "heart", "percentage": 10},
    {"name": "Imprevistos", "color": "#8B5CF6", "icon": "exclamation-triangle", "percentage": 10},
    {"name": "Transporte", "color": "#06B6D4", "icon": "car", "percentage": 15},
    {"name": "Entretenimiento", "color": "#EC4899", "icon": "gamepad", "percentage": 10},
]

def create_category(db: Session, user_id: int, category: CategoryCreate):
    db_category = Category(**category.model_dump(), user_id=user_id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_categories(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Category).filter(Category.user_id == user_id).offset(skip).limit(limit).all()

def get_category_by_id(db: Session, category_id: int, user_id: int):
    return db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()

def update_category(db: Session, category_id: int, user_id: int, category: CategoryUpdate):
    db_category = get_category_by_id(db, category_id, user_id)
    if db_category:
        for key, value in category.model_dump(exclude_unset=True).items():
            setattr(db_category, key, value)
        db.commit()
        db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int, user_id: int):
    db_category = get_category_by_id(db, category_id, user_id)
    if db_category:
        db.delete(db_category)
        db.commit()
        return True
    return False

def create_default_categories(db: Session, user_id: int):
    for cat in DEFAULT_CATEGORIES:
        existing = db.query(Category).filter(Category.name == cat["name"], Category.user_id == user_id).first()
        if not existing:
            db_category = Category(
                user_id=user_id,
                name=cat["name"],
                color=cat["color"],
                icon=cat["icon"],
                percentage=cat["percentage"],
                is_system=1
            )
            db.add(db_category)
    db.commit()