from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IncomeBase(BaseModel):
    source: str
    amount: float
    frequency: Optional[str] = "monthly"
    date: datetime
    notes: Optional[str] = None

class IncomeCreate(IncomeBase):
    pass

class IncomeResponse(IncomeBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GoalBase(BaseModel):
    name: str
    target_amount: float
    current_amount: Optional[float] = 0
    deadline: Optional[datetime] = None
    category: Optional[str] = None

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[datetime] = None
    category: Optional[str] = None
    is_achieved: Optional[int] = None

class GoalResponse(GoalBase):
    id: int
    user_id: int
    is_achieved: int
    created_at: datetime

    class Config:
        from_attributes = True

class QuincenaBase(BaseModel):
    quincena_num: int
    mes: str
    anio: int
    ingresos: Optional[float] = 0
    gastos_fijos: Optional[float] = 0
    disponible: Optional[float] = 0
    ahorrado: Optional[float] = 0

class QuincenaCreate(QuincenaBase):
    pass

class QuincenaResponse(QuincenaBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True