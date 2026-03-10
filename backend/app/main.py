from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created / verified.")
    except Exception as e:
        print(f"⚠️  Could not connect to DB (tables not created): {e}")
    yield


app = FastAPI(
    title="Inventory Alert System",
    version="1.0.0",
    description="Monitor stock levels, generate reports and low‑stock alerts.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "Inventory Alert API"}
