from sqlalchemy.orm import Session
from typing import List, Optional

from ..models.financial import Income, Goal, Quincena
from ..schemas.financial import IncomeCreate, GoalCreate, GoalUpdate, QuincenaCreate

def create_income(db: Session, user_id: int, income: IncomeCreate):
    db_income = Income(**income.model_dump(), user_id=user_id)
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

def get_incomes(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Income).filter(Income.user_id == user_id).order_by(Income.date.desc()).offset(skip).limit(limit).all()

def delete_income(db: Session, income_id: int, user_id: int):
    db_income = db.query(Income).filter(Income.id == income_id, Income.user_id == user_id).first()
    if db_income:
        db.delete(db_income)
        db.commit()
        return True
    return False

def get_total_income(db: Session, user_id: int):
    incomes = db.query(Income).filter(Income.user_id == user_id).all()
    total = sum(i.amount for i in incomes)
    return total

def create_goal(db: Session, user_id: int, goal: GoalCreate):
    db_goal = Goal(**goal.model_dump(), user_id=user_id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def get_goals(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Goal).filter(Goal.user_id == user_id).all()

def get_goal_by_id(db: Session, goal_id: int, user_id: int):
    return db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()

def update_goal(db: Session, goal_id: int, user_id: int, goal: GoalUpdate):
    db_goal = get_goal_by_id(db, goal_id, user_id)
    if db_goal:
        for key, value in goal.model_dump(exclude_unset=True).items():
            setattr(db_goal, key, value)
        if db_goal.current_amount >= db_goal.target_amount:
            db_goal.is_achieved = 1
        db.commit()
        db.refresh(db_goal)
    return db_goal

def delete_goal(db: Session, goal_id: int, user_id: int):
    db_goal = get_goal_by_id(db, goal_id, user_id)
    if db_goal:
        db.delete(db_goal)
        db.commit()
        return True
    return False

def create_quincena(db: Session, user_id: int, quincena: QuincenaCreate):
    db_quincena = Quincena(**quincena.model_dump(), user_id=user_id)
    db.add(db_quincena)
    db.commit()
    db.refresh(db_quincena)
    return db_quincena

def get_quincenas(db: Session, user_id: int, mes: Optional[str] = None, anio: Optional[int] = None):
    query = db.query(Quincena).filter(Quincena.user_id == user_id)
    if mes:
        query = query.filter(Quincena.mes == mes)
    if anio:
        query = query.filter(Quincena.anio == anio)
    return query.order_by(Quincena.anio.desc(), Quincena.quincena_num.desc()).all()

def get_quincena_by_id(db: Session, quincena_id: int, user_id: int):
    return db.query(Quincena).filter(Quincena.id == quincena_id, Quincena.user_id == user_id).first()

def update_quincena(db: Session, quincena_id: int, user_id: int, data: dict):
    db_quincena = get_quincena_by_id(db, quincena_id, user_id)
    if db_quincena:
        for key, value in data.items():
            if hasattr(db_quincena, key):
                setattr(db_quincena, key, value)
        db.commit()
        db.refresh(db_quincena)
    return db_quincena

def delete_quincena(db: Session, quincena_id: int, user_id: int):
    db_quincena = get_quincena_by_id(db, quincena_id, user_id)
    if db_quincena:
        db.delete(db_quincena)
        db.commit()
        return True
    return False