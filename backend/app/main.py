from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routers.Lender_router import router as lender_router
from app.routers.Borrower_router import router as borrower_router
from app.models import model
from app.database import engine
from app.redis_client import init_redis 
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = await init_redis()
    print("----Redis is connected and ready!----")
    yield
    await app.state.redis.close()
    print("----Redis connection closed.----")

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model.Base.metadata.create_all(bind=engine)
app.include_router(lender_router)
app.include_router(borrower_router)

@app.get("/")
def read_root():
    return {"status": "online"}