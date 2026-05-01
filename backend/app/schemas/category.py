from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3B82F6"
    icon: Optional[str] = "folder"
    percentage: Optional[float] = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    percentage: Optional[float] = None

class CategoryResponse(CategoryBase):
    id: int
    user_id: int
    is_system: int
    created_at: datetime

    class Config:
        from_attributes = True