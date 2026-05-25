from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.db.database import get_db
from app.models.user import User
from app.models.follower import Follower
from app.models.rating import Rating
from app.models.movie import Movie
from app.api.deps import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class UserProfile(BaseModel):
    id: int
    username: str
    avatar_url: str | None = None
    follower_count: int
    following_count: int

    class Config:
        from_attributes = True

class AvatarUpdate(BaseModel):
    avatar_url: str

class SocialFeedItem(BaseModel):
    id: int
    movie_id: int
    movie_title: str
    rating: float
    review: str | None
    created_at: datetime
    user_id: int
    username: str
    avatar_url: str | None

@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_profile(current_user.id, db)

@router.get("/{user_id}", response_model=UserProfile)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    follower_count = db.query(Follower).filter(Follower.followed_id == user_id).count()
    following_count = db.query(Follower).filter(Follower.follower_id == user_id).count()
    
    return UserProfile(
        id=user.id,
        username=user.username,
        avatar_url=user.avatar_url,
        follower_count=follower_count,
        following_count=following_count
    )

@router.post("/me/avatar")
def update_avatar(avatar: AvatarUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.avatar_url = avatar.avatar_url
    db.commit()
    return {"message": "Avatar updated successfully"}

@router.post("/{user_id}/follow")
def follow_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    user_to_follow = db.query(User).filter(User.id == user_id).first()
    if not user_to_follow:
        raise HTTPException(status_code=404, detail="User not found")
        
    existing_follow = db.query(Follower).filter(
        Follower.follower_id == current_user.id,
        Follower.followed_id == user_id
    ).first()
    
    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")
        
    new_follow = Follower(follower_id=current_user.id, followed_id=user_id)
    db.add(new_follow)
    db.commit()
    return {"message": "User followed successfully"}

@router.post("/{user_id}/unfollow")
def unfollow_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    follow = db.query(Follower).filter(
        Follower.follower_id == current_user.id,
        Follower.followed_id == user_id
    ).first()
    
    if not follow:
        raise HTTPException(status_code=400, detail="Not following this user")
        
    db.delete(follow)
    db.commit()
    return {"message": "User unfollowed successfully"}

@router.get("/me/feed", response_model=List[SocialFeedItem])
def get_social_feed(feed_type: str = "global", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    base_query = db.query(Rating, User, Movie).join(
        User, User.id == Rating.user_id
    ).join(
        Movie, Movie.id == Rating.movie_id
    )
    
    if feed_type == "following":
        followed_users = db.query(Follower.followed_id).filter(Follower.follower_id == current_user.id).subquery()
        recent_ratings = base_query.filter(Rating.user_id.in_(followed_users)).order_by(Rating.created_at.desc()).limit(50).all()
    else:
        recent_ratings = base_query.order_by(Rating.created_at.desc()).limit(50).all()
    
    feed = []
    for rating, user, movie in recent_ratings:
        feed.append(SocialFeedItem(
            id=rating.id,
            movie_id=movie.id,
            movie_title=movie.title,
            rating=rating.rating,
            review=rating.review,
            created_at=rating.created_at,
            user_id=user.id,
            username=user.username,
            avatar_url=user.avatar_url
        ))
        
    return feed
