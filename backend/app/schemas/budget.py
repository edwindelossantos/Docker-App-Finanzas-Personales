from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BudgetBase(BaseModel):
    category_id: int
    amount: float
    period: Optional[str] = "monthly"
    start_date: datetime
    end_date: Optional[datetime] = None
    alert_threshold: Optional[float] = 80

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = None
    period: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    alert_threshold: Optional[float] = None

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BudgetWithCategory(BudgetResponse):
    category_name: Optional[str] = None
    category_color: Optional[str] = None
    spent: Optional[float] = 0
    remaining: Optional[float] = 0