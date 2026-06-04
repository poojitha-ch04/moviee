from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base
from app.models import User, Movie, Rating, Watchlist

# Schema migration patch for the language column
try:
    with engine.connect() as conn:
        from sqlalchemy import text
        # Ignore errors if column already exists or if it's SQLite
        conn.execute(text("ALTER TABLE movies ADD COLUMN language VARCHAR DEFAULT 'en'"))
        conn.commit()
except Exception as e:
    pass # Column might already exist, which is fine

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all frontends
    allow_credentials=False, # Must be False if origins is *
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.api import api_router

@app.get("/")
def root():
    return {"message": "Welcome to Moviee API"}

app.include_router(api_router, prefix=settings.API_V1_STR)
