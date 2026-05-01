from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..schemas import budget as schemas
from ..services import budget_service

router = APIRouter(prefix="/budgets", tags=["Presupuestos"])

DEFAULT_USER_ID = 1

@router.post("/", response_model=schemas.BudgetResponse)
def create_budget(budget: schemas.BudgetCreate, db: Session = Depends(get_db)):
    return budget_service.create_budget(db, DEFAULT_USER_ID, budget)

@router.get("/", response_model=List[schemas.BudgetWithCategory])
def get_budgets(
    start_date: datetime = None, 
    end_date: datetime = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = datetime.now().replace(day=1, hour=0, minute=0, second=0)
    if not end_date:
        end_date = datetime.now()
    return budget_service.get_budget_with_spending(db, DEFAULT_USER_ID, start_date, end_date)

@router.get("/alerts")
def get_alerts(
    start_date: datetime = None, 
    end_date: datetime = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = datetime.now().replace(day=1, hour=0, minute=0, second=0)
    if not end_date:
        end_date = datetime.now()
    return budget_service.check_budget_alerts(db, DEFAULT_USER_ID, start_date, end_date)

@router.get("/{budget_id}", response_model=schemas.BudgetResponse)
def get_budget(budget_id: int, db: Session = Depends(get_db)):
    budget = budget_service.get_budget_by_id(db, budget_id, DEFAULT_USER_ID)
    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return budget

@router.put("/{budget_id}", response_model=schemas.BudgetResponse)
def update_budget(budget_id: int, budget: schemas.BudgetUpdate, db: Session = Depends(get_db)):
    updated = budget_service.update_budget(db, budget_id, DEFAULT_USER_ID, budget)
    if not updated:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return updated

@router.delete("/{budget_id}")
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    if not budget_service.delete_budget(db, budget_id, DEFAULT_USER_ID):
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return {"message": "Presupuesto eliminado"}