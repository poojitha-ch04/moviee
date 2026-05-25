from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.db.database import get_db
from app.models.rating import Rating
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

class RatingSubmit(BaseModel):
    movie_id: int
    rating: float = Field(..., ge=1, le=5)
    review_text: str | None = None

@router.post("")
def submit_rating(
    rating_in: RatingSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == rating_in.movie_id
    ).first()
    if existing:
        existing.rating = rating_in.rating
        if rating_in.review_text is not None:
            existing.review_text = rating_in.review_text
    else:
        new_rating = Rating(
            user_id=current_user.id,
            movie_id=rating_in.movie_id,
            rating=rating_in.rating,
            review_text=rating_in.review_text
        )
        db.add(new_rating)
    db.commit()
    return {"message": "Rating saved successfully"}

@router.get("")
def get_my_ratings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ratings = db.query(Rating).filter(Rating.user_id == current_user.id).all()
    return [{"movie_id": r.movie_id, "rating": r.rating, "review_text": r.review_text} for r in ratings]

@router.get("/{movie_id}/reviews")
def get_movie_reviews(movie_id: int, db: Session = Depends(get_db)):
    ratings = db.query(Rating).filter(Rating.movie_id == movie_id).order_by(Rating.created_at.desc()).all()
    result = []
    for r in ratings:
        if r.review_text: # only return if they wrote a review
            result.append({
                "id": r.id,
                "rating": r.rating,
                "review_text": r.review_text,
                "username": r.user.username,
                "created_at": r.created_at
            })
    return result
