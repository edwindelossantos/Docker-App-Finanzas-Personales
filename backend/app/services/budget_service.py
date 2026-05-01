from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..models.budget import Budget
from ..models.transaction import Transaction
from ..schemas.budget import BudgetCreate, BudgetUpdate

def create_budget(db: Session, user_id: int, budget: BudgetCreate):
    db_budget = Budget(**budget.model_dump(), user_id=user_id)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

def get_budgets(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Budget).filter(Budget.user_id == user_id).offset(skip).limit(limit).all()

def get_budget_by_id(db: Session, budget_id: int, user_id: int):
    return db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()

def update_budget(db: Session, budget_id: int, user_id: int, budget: BudgetUpdate):
    db_budget = get_budget_by_id(db, budget_id, user_id)
    if db_budget:
        for key, value in budget.model_dump(exclude_unset=True).items():
            setattr(db_budget, key, value)
        db.commit()
        db.refresh(db_budget)
    return db_budget

def delete_budget(db: Session, budget_id: int, user_id: int):
    db_budget = get_budget_by_id(db, budget_id, user_id)
    if db_budget:
        db.delete(db_budget)
        db.commit()
        return True
    return False

def get_budget_with_spending(db: Session, user_id: int, start_date: datetime, end_date: datetime):
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    
    result = []
    for budget in budgets:
        spent = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.category_id == budget.category_id,
            Transaction.type == "expense",
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).all()
        
        total_spent = sum(t.amount for t in spent)
        remaining = budget.amount - total_spent
        
        result.append({
            "id": budget.id,
            "category_id": budget.category_id,
            "amount": budget.amount,
            "period": budget.period,
            "start_date": budget.start_date,
            "end_date": budget.end_date,
            "alert_threshold": budget.alert_threshold,
            "spent": total_spent,
            "remaining": remaining,
            "percentage_used": (total_spent / budget.amount * 100) if budget.amount > 0 else 0
        })
    
    return result

def check_budget_alerts(db: Session, user_id: int, start_date: datetime, end_date: datetime):
    budgets = get_budget_with_spending(db, user_id, start_date, end_date)
    alerts = []
    
    for budget in budgets:
        if budget["percentage_used"] >= budget["alert_threshold"]:
            alerts.append({
                "budget_id": budget["id"],
                "category_id": budget["category_id"],
                "percentage_used": budget["percentage_used"],
                "message": f"Alerta: Has alcanzado el {budget['percentage_used']:.1f}% de tu presupuesto"
            })
    
    return alerts