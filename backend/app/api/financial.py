from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.user import User
from ..schemas import financial as schemas
from ..services import financial_service

router = APIRouter(prefix="/financial", tags=["Finanzas"])

DEFAULT_USER_ID = 1

@router.post("/incomes", response_model=schemas.IncomeResponse)
def create_income(income: schemas.IncomeCreate, db: Session = Depends(get_db)):
    return financial_service.create_income(db, DEFAULT_USER_ID, income)

@router.get("/incomes", response_model=List[schemas.IncomeResponse])
def get_incomes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return financial_service.get_incomes(db, DEFAULT_USER_ID, skip, limit)

@router.get("/incomes/total")
def get_total_income(db: Session = Depends(get_db)):
    return {"total": financial_service.get_total_income(db, DEFAULT_USER_ID)}

@router.delete("/incomes/{income_id}")
def delete_income(income_id: int, db: Session = Depends(get_db)):
    if not financial_service.delete_income(db, income_id, DEFAULT_USER_ID):
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return {"message": "Ingreso eliminado"}

@router.post("/goals", response_model=schemas.GoalResponse)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(get_db)):
    return financial_service.create_goal(db, DEFAULT_USER_ID, goal)

@router.get("/goals", response_model=List[schemas.GoalResponse])
def get_goals(db: Session = Depends(get_db)):
    return financial_service.get_goals(db, DEFAULT_USER_ID)

@router.get("/goals/{goal_id}", response_model=schemas.GoalResponse)
def get_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = financial_service.get_goal_by_id(db, goal_id, DEFAULT_USER_ID)
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    return goal

@router.put("/goals/{goal_id}", response_model=schemas.GoalResponse)
def update_goal(goal_id: int, goal: schemas.GoalUpdate, db: Session = Depends(get_db)):
    updated = financial_service.update_goal(db, goal_id, DEFAULT_USER_ID, goal)
    if not updated:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    return updated

@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    if not financial_service.delete_goal(db, goal_id, DEFAULT_USER_ID):
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    return {"message": "Meta eliminada"}

@router.post("/quincenas", response_model=schemas.QuincenaResponse)
def create_quincena(quincena: schemas.QuincenaCreate, db: Session = Depends(get_db)):
    return financial_service.create_quincena(db, DEFAULT_USER_ID, quincena)

@router.get("/quincenas", response_model=List[schemas.QuincenaResponse])
def get_quincenas(mes: str = None, anio: int = None, db: Session = Depends(get_db)):
    return financial_service.get_quincenas(db, DEFAULT_USER_ID, mes, anio)

@router.get("/quincenas/{quincena_id}", response_model=schemas.QuincenaResponse)
def get_quincena(quincena_id: int, db: Session = Depends(get_db)):
    quincena = financial_service.get_quincena_by_id(db, quincena_id, DEFAULT_USER_ID)
    if not quincena:
        raise HTTPException(status_code=404, detail="Quincena no encontrada")
    return quincena

@router.put("/quincenas/{quincena_id}", response_model=schemas.QuincenaResponse)
def update_quincena(quincena_id: int, data: dict, db: Session = Depends(get_db)):
    updated = financial_service.update_quincena(db, quincena_id, DEFAULT_USER_ID, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Quincena no encontrada")
    return updated

@router.delete("/quincenas/{quincena_id}")
def delete_quincena(quincena_id: int, db: Session = Depends(get_db)):
    if not financial_service.delete_quincena(db, quincena_id, DEFAULT_USER_ID):
        raise HTTPException(status_code=404, detail="Quincena no encontrada")
    return {"message": "Quincena eliminada"}

@router.post("/gastos-fijos", response_model=schemas.GastoFijoResponse)
def create_gasto_fijo(gasto: schemas.GastoFijoCreate, db: Session = Depends(get_db)):
    return financial_service.create_gasto_fijo(db, DEFAULT_USER_ID, gasto)

@router.get("/gastos-fijos", response_model=List[schemas.GastoFijoResponse])
def get_gastos_fijos(db: Session = Depends(get_db)):
    return financial_service.get_gastos_fijos(db, DEFAULT_USER_ID)

@router.delete("/gastos-fijos/{gasto_id}")
def delete_gasto_fijo(gasto_id: int, db: Session = Depends(get_db)):
    if not financial_service.delete_gasto_fijo(db, gasto_id, DEFAULT_USER_ID):
        raise HTTPException(status_code=404, detail="Gasto fijo no encontrado")
    return {"message": "Gasto fijo eliminado"}