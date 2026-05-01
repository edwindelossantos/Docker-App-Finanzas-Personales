from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(String(20), default="monthly")
    date = Column(DateTime(timezone=True), nullable=False)
    notes = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0)
    deadline = Column(DateTime(timezone=True))
    category = Column(String(50))
    is_achieved = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

class Quincena(Base):
    __tablename__ = "quincenas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quincena_num = Column(Integer, nullable=False)
    mes = Column(String(20), nullable=False)
    anio = Column(Integer, nullable=False)
    ingresos = Column(Float, default=0)
    gastos_fijos = Column(Float, default=0)
    disponible = Column(Float, default=0)
    ahorrado = Column(Float, default=0)
    fecha_inicio = Column(DateTime(timezone=True), nullable=False)
    fecha_fin = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")