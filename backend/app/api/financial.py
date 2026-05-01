from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..core.security import get_current_active_user
from ..models.user import User
from ..schemas import financial as schemas
from ..services import financial_service

router = APIRouter(prefix="/financial", tags=["Finanzas"])

@router.post("/incomes", response_model=schemas.IncomeResponse)
def create_income(income: schemas.IncomeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return financial_service.create_income(db, current_user.id, income)

@router.get("/incomes", response_model=List[schemas.IncomeResponse])
def get_incomes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return financial_service.get_incomes(db, current_user.id, skip, limit)

@router.get("/incomes/total")
def get_total_income(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return {"total": financial_service.get_total_income(db, current_user.id)}

@router.delete("/incomes/{income_id}")
def delete_income(income_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not financial_service.delete_income(db, income_id, current_user.id):
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return {"message": "Ingreso eliminado"}

@router.post("/goals", response_model=schemas.GoalResponse)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return financial_service.create_goal(db, current_user.id, goal)

@router.get("/goals", response_model=List[schemas.GoalResponse])
def get_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return financial_service.get_goals(db, current_user.id)

@router.get("/goals/{goal_id}", response_model=schemas.GoalResponse)
def get_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    goal = financial_service.get_goal_by_id(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    return goal

@router.put("/goals/{goal_id}", response_model=schemas.GoalResponse)
def update_goal(goal_id: int, goal: schemas.GoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    updated = financial_service.update_goal(db, goal_id, current_user.id, goal)
    if not updated:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    return updated

@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not financial_service.delete_goal(db, goal_id, current_user.id):
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    return {"message": "Meta eliminada"}

@router.post("/quincenas", response_model=schemas.QuincenaResponse)
def create_quincena(quincena: schemas.QuincenaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return financial_service.create_quincena(db, current_user.id, quincena)

@router.get("/quincenas", response_model=List[schemas.QuincenaResponse])
def get_quincenas(mes: str = None, anio: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return financial_service.get_quincenas(db, current_user.id, mes, anio)

@router.get("/quincenas/{quincena_id}", response_model=schemas.QuincenaResponse)
def get_quincena(quincena_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    quincena = financial_service.get_quincena_by_id(db, quincena_id, current_user.id)
    if not quincena:
        raise HTTPException(status_code=404, detail="Quincena no encontrada")
    return quincena

@router.put("/quincenas/{quincena_id}", response_model=schemas.QuincenaResponse)
def update_quincena(quincena_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    updated = financial_service.update_quincena(db, quincena_id, current_user.id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Quincena no encontrada")
    return updated

@router.delete("/quincenas/{quincena_id}")
def delete_quincena(quincena_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not financial_service.delete_quincena(db, quincena_id, current_user.id):
        raise HTTPException(status_code=404, detail="Quincena no encontrada")
    return {"message": "Quincena eliminada"}