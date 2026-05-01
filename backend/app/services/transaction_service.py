from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..models.transaction import Transaction
from ..schemas.transaction import TransactionCreate, TransactionUpdate

def create_transaction(db: Session, user_id: int, transaction: TransactionCreate):
    db_transaction = Transaction(**transaction.model_dump(), user_id=user_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_transactions(db: Session, user_id: int, skip: int = 0, limit: int = 100, 
                     start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
                     category_id: Optional[int] = None, type: Optional[str] = None):
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if type:
        query = query.filter(Transaction.type == type)
    
    return query.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()

def get_transaction_by_id(db: Session, transaction_id: int, user_id: int):
    return db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == user_id).first()

def update_transaction(db: Session, transaction_id: int, user_id: int, transaction: TransactionUpdate):
    db_transaction = get_transaction_by_id(db, transaction_id, user_id)
    if db_transaction:
        for key, value in transaction.model_dump(exclude_unset=True).items():
            setattr(db_transaction, key, value)
        db.commit()
        db.refresh(db_transaction)
    return db_transaction

def delete_transaction(db: Session, transaction_id: int, user_id: int):
    db_transaction = get_transaction_by_id(db, transaction_id, user_id)
    if db_transaction:
        db.delete(db_transaction)
        db.commit()
        return True
    return False

def get_transactions_summary(db: Session, user_id: int, start_date: Optional[datetime] = None, 
                             end_date: Optional[datetime] = None):
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    transactions = query.all()
    
    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")
    
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "transaction_count": len(transactions)
    }

def get_category_spending(db: Session, user_id: int, start_date: Optional[datetime] = None,
                          end_date: Optional[datetime] = None):
    query = db.query(Transaction).filter(Transaction.user_id == user_id, Transaction.type == "expense")
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    transactions = query.all()
    
    spending_by_category = {}
    for t in transactions:
        cat_id = t.category_id
        if cat_id not in spending_by_category:
            spending_by_category[cat_id] = 0
        spending_by_category[cat_id] += t.amount
    
    return spending_by_category