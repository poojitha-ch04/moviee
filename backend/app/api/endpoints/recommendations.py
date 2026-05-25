from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.schemas.movie import MovieResponse
from app.api.deps import get_current_user
from app.services.recommendation import get_recommendations

router = APIRouter()

@router.get("/", response_model=List[MovieResponse])
def get_user_recommendations(current_user: User = Depends(get_current_user)):
    movies = get_recommendations(current_user.id)
    return movies
