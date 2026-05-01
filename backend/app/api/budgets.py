from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..core.security import get_current_active_user
from ..models.user import User
from ..schemas import budget as schemas
from ..services import budget_service

router = APIRouter(prefix="/budgets", tags=["Presupuestos"])

@router.post("/", response_model=schemas.BudgetResponse)
def create_budget(budget: schemas.BudgetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return budget_service.create_budget(db, current_user.id, budget)

@router.get("/", response_model=List[schemas.BudgetWithCategory])
def get_budgets(
    start_date: datetime = None, 
    end_date: datetime = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    if not start_date:
        start_date = datetime.now().replace(day=1, hour=0, minute=0, second=0)
    if not end_date:
        end_date = datetime.now()
    return budget_service.get_budget_with_spending(db, current_user.id, start_date, end_date)

@router.get("/alerts")
def get_alerts(
    start_date: datetime = None, 
    end_date: datetime = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    if not start_date:
        start_date = datetime.now().replace(day=1, hour=0, minute=0, second=0)
    if not end_date:
        end_date = datetime.now()
    return budget_service.check_budget_alerts(db, current_user.id, start_date, end_date)

@router.get("/{budget_id}", response_model=schemas.BudgetResponse)
def get_budget(budget_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    budget = budget_service.get_budget_by_id(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return budget

@router.put("/{budget_id}", response_model=schemas.BudgetResponse)
def update_budget(budget_id: int, budget: schemas.BudgetUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    updated = budget_service.update_budget(db, budget_id, current_user.id, budget)
    if not updated:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return updated

@router.delete("/{budget_id}")
def delete_budget(budget_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not budget_service.delete_budget(db, budget_id, current_user.id):
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return {"message": "Presupuesto eliminado"}