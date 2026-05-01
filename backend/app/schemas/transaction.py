from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TransactionBase(BaseModel):
    category_id: int
    type: str
    amount: float
    description: Optional[str] = None
    date: datetime
    payment_method: Optional[str] = None
    is_recurring: Optional[int] = 0

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    payment_method: Optional[str] = None
    is_recurring: Optional[int] = None

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionWithCategory(TransactionResponse):
    category_name: Optional[str] = None
    category_color: Optional[str] = None