from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pandas as pd
from io import BytesIO
from fastapi.responses import StreamingResponse

from .database import init_db, get_db
from .core.security import get_password_hash, get_current_active_user
from .models.user import User
from .models.category import Category
from .services.category_service import create_default_categories
from .api import auth, categories, transactions, budgets, financial

app = FastAPI(title="API de Gestión Financiera", description="API REST para finanzas personales y empresariales")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")
app.include_router(financial.router, prefix="/api")

@app.on_event("startup")
def startup_event():
    init_db()
    db = next(get_db())
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            try:
                hashed = get_password_hash("admin123")
                admin_user = User(
                    username="admin",
                    email="admin@finanzas.com",
                    hashed_password=hashed,
                    full_name="Administrador",
                    is_active=True,
                    is_admin=True
                )
                db.add(admin_user)
                db.commit()
                create_default_categories(db, admin_user.id)
            except Exception as e:
                print(f"Error creating admin user: {e}")
                db.rollback()
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "API de Gestión Financiera", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/report/excel")
def export_excel(
    start_date: datetime = None,
    end_date: datetime = None,
    db = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from .services.transaction_service import get_transactions
    from .services.category_service import get_categories
    
    if not start_date:
        start_date = datetime(2024, 1, 1)
    if not end_date:
        end_date = datetime.now()
    
    txs = get_transactions(db, current_user.id, 0, 1000, start_date, end_date)
    cats = {c.id: c.name for c in get_categories(db, current_user.id)}
    
    data = []
    for t in txs:
        data.append({
            "Fecha": t.date.strftime("%d/%m/%Y"),
            "Tipo": t.type,
            "Categoría": cats.get(t.category_id, "Sin categoría"),
            "Monto": t.amount,
            "Descripción": t.description or ""
        })
    
    df = pd.DataFrame(data)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Transacciones")
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=reporte.xlsx"}
    )