from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.db.database import get_db
from app.models.watchlist import Watchlist
from app.models.movie import Movie
from app.models.user import User
from app.schemas.movie import MovieResponse
from app.api.deps import get_current_user

router = APIRouter()

class WatchlistAdd(BaseModel):
    movie_id: int

@router.get("", response_model=List[MovieResponse])
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    watchlist_items = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()
    movies = [item.movie for item in watchlist_items if item.movie]
    return movies

@router.post("")
def add_to_watchlist(
    item: WatchlistAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.movie_id == item.movie_id
    ).first()
    if existing:
        return {"message": "Movie already in watchlist"}
    new_item = Watchlist(user_id=current_user.id, movie_id=item.movie_id)
    db.add(new_item)
    db.commit()
    return {"message": "Added to watchlist"}

@router.delete("/{movie_id}")
def remove_from_watchlist(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.movie_id == movie_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in watchlist")
    db.delete(item)
    db.commit()
    return {"message": "Removed from watchlist"}
