from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..schemas import transaction as schemas
from ..services import transaction_service

router = APIRouter(prefix="/transactions", tags=["Transacciones"])

DEFAULT_USER_ID = 1

@router.post("/", response_model=schemas.TransactionResponse)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    return transaction_service.create_transaction(db, DEFAULT_USER_ID, transaction)

@router.get("/", response_model=List[schemas.TransactionWithCategory])
def get_transactions(
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category_id: Optional[int] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    transactions = transaction_service.get_transactions(
        db, DEFAULT_USER_ID, skip, limit, start_date, end_date, category_id, type
    )
    result = []
    for t in transactions:
        result.append({
            **t.__dict__,
            "category_name": t.category.name if t.category else None,
            "category_color": t.category.color if t.category else None
        })
    return result

@router.get("/summary")
def get_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    return transaction_service.get_transactions_summary(db, DEFAULT_USER_ID, start_date, end_date)

@router.get("/by-category")
def get_by_category(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    return transaction_service.get_category_spending(db, DEFAULT_USER_ID, start_date, end_date)

@router.get("/{transaction_id}", response_model=schemas.TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = transaction_service.get_transaction_by_id(db, transaction_id, DEFAULT_USER_ID)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return transaction

@router.put("/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(transaction_id: int, transaction: schemas.TransactionUpdate, db: Session = Depends(get_db)):
    updated = transaction_service.update_transaction(db, transaction_id, DEFAULT_USER_ID, transaction)
    if not updated:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return updated

@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    if not transaction_service.delete_transaction(db, transaction_id, DEFAULT_USER_ID):
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return {"message": "Transacción eliminada"}