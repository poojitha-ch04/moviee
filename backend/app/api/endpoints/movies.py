from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import requests
from app.db.database import get_db
from app.models.movie import Movie
from app.schemas.movie import MovieResponse
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[MovieResponse])
def get_movies(
    skip: int = 0, 
    limit: int = 20, 
    decade: Optional[int] = None,
    sort_by: Optional[str] = None,
    min_rating: Optional[float] = None,
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    max_runtime: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Movie)
    
    # Old decade filter backward compatibility
    if decade:
        query = query.filter(Movie.release_year >= decade, Movie.release_year < decade + 10)
        
    # Advanced filters
    if min_rating is not None:
        query = query.filter(Movie.vote_average >= min_rating)
    if min_year is not None:
        query = query.filter(Movie.release_year >= min_year)
    if max_year is not None:
        query = query.filter(Movie.release_year <= max_year)
    if max_runtime is not None:
        query = query.filter(Movie.runtime <= max_runtime)
    
    if sort_by == 'rating':
        query = query.order_by(Movie.vote_average.desc())
    elif sort_by == 'reviews':
        from app.models.rating import Rating
        from sqlalchemy import func
        query = query.outerjoin(Rating, Movie.id == Rating.movie_id) \
                  .group_by(Movie.id) \
                  .order_by(func.count(Rating.id).desc())
            
    movies = query.offset(skip).limit(limit).all()
    return movies

@router.get("/trending", response_model=List[MovieResponse])
def get_trending_movies(db: Session = Depends(get_db)):
    movies = db.query(Movie).order_by(Movie.vote_average.desc()).limit(12).all()
    return movies

@router.get("/top-rated", response_model=List[MovieResponse])
def get_top_rated(db: Session = Depends(get_db)):
    movies = db.query(Movie).filter(Movie.vote_average >= 7.5).order_by(Movie.vote_average.desc()).limit(20).all()
    return movies

@router.get("/by-genre/{genre}", response_model=List[MovieResponse])
def get_by_genre(genre: str, db: Session = Depends(get_db)):
    movies = db.query(Movie).filter(Movie.genre.ilike(f"%{genre}%")).limit(20).all()
    return movies

@router.get("/search/smart", response_model=List[MovieResponse])
def smart_search_movies(q: str, db: Session = Depends(get_db)):
    import google.generativeai as genai
    import json
    import os
    from dotenv import load_dotenv
    import re
    
    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return search_movies(q=q, db=db)
        
    genai.configure(api_key=api_key)
    
    movies = db.query(Movie).all()
    movie_context = []
    for m in movies:
        movie_context.append({"id": m.id, "title": m.title, "genre": m.genre, "desc": m.description[:150]})
    
    prompt = f"""
    You are a smart movie recommendation engine. 
    User Query: "{q}"
    
    Catalog:
    {json.dumps(movie_context)}
    
    Return a raw JSON array containing up to 10 movie IDs (integers) that best match the user query semantically.
    Only return the JSON array, no markdown formatting, no explanations.
    """
    
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        text = response.text.strip()
        text = re.sub(r'```json|```', '', text).strip()
        matched_ids = json.loads(text)
        
        if not matched_ids:
            return []
            
        matched_movies = db.query(Movie).filter(Movie.id.in_(matched_ids)).all()
        movie_dict = {m.id: m for m in matched_movies}
        sorted_movies = [movie_dict[mid] for mid in matched_ids if mid in movie_dict]
        return sorted_movies
    except Exception as e:
        print(f"Gemini error: {e}")
        return search_movies(q=q, db=db)

@router.get("/search", response_model=List[MovieResponse])
def search_movies(
    q: str, 
    decade: Optional[int] = None,
    sort_by: Optional[str] = None,
    min_rating: Optional[float] = None,
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    max_runtime: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Movie).filter(
        Movie.title.ilike(f"%{q}%") | Movie.genre.ilike(f"%{q}%") | Movie.description.ilike(f"%{q}%")
    )
    
    if decade:
        query = query.filter(Movie.release_year >= decade, Movie.release_year < decade + 10)
        
    if min_rating is not None:
        query = query.filter(Movie.vote_average >= min_rating)
    if min_year is not None:
        query = query.filter(Movie.release_year >= min_year)
    if max_year is not None:
        query = query.filter(Movie.release_year <= max_year)
    if max_runtime is not None:
        query = query.filter(Movie.runtime <= max_runtime)
        
    if sort_by == 'rating':
        query = query.order_by(Movie.vote_average.desc())
    elif sort_by == 'reviews':
        from app.models.rating import Rating
        from sqlalchemy import func
        query = query.outerjoin(Rating, Movie.id == Rating.movie_id) \
                  .group_by(Movie.id) \
                  .order_by(func.count(Rating.id).desc())

    movies = query.limit(20).all()
    return movies

@router.get("/{movie_id}/trailer")
def get_movie_trailer(movie_id: int, db: Session = Depends(get_db)):
    """Fetches the pre-mapped YouTube trailer key for a given movie."""
    import os
    import json
    
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
        
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "..", "trailer_links.json")
    
    # Clean up path to absolute root of backend folder
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    json_path = os.path.join(backend_dir, "trailer_links.json")

    # Default fallback video
    fallback_key = "Ywyei5orJ2M"

    try:
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                links = json.load(f)
                video_id = links.get(str(movie_id))
                if video_id:
                    return {"key": video_id, "name": f"{movie.title} Trailer"}
    except Exception as e:
        print(f"Error reading trailer JSON: {e}")
        
    # If not mapped yet, just return the fallback immediately
    return {"key": fallback_key, "name": f"{movie.title} Trailer (Fallback)"}

@router.get("/{movie_id}/similar", response_model=List[MovieResponse])
def get_similar_movies(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    primary_genre = movie.genre.split(",")[0].strip() if movie.genre else ""
    similar = db.query(Movie).filter(
        Movie.genre.ilike(f"%{primary_genre}%"),
        Movie.id != movie_id
    ).order_by(Movie.vote_average.desc()).limit(12).all()
    return similar

@router.get("/{movie_id}", response_model=MovieResponse)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

# In-memory cache for AI insights to save API calls
insights_cache = {}

class MovieInsights(BaseModel):
    why_watch: str
    trivia: List[str]

@router.get("/{movie_id}/insights", response_model=MovieInsights)
def get_movie_insights(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
        
    if movie_id in insights_cache:
        return insights_cache[movie_id]
        
    import google.generativeai as genai
    import json
    import os
    import re
    from dotenv import load_dotenv
    from google import genai
    
    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")
        
    prompt = f"""
    You are a movie expert. Generate exciting insights for the movie: "{movie.title}" (Release Year: {movie.release_year}, Genre: {movie.genre}, Synopsis: {movie.description}).
    
    Provide exactly two things in a raw JSON format without markdown code blocks:
    1. "why_watch": A single compelling 2-3 sentence paragraph on why someone should watch this movie right now. Make it sound exciting and premium.
    2. "trivia": A list of exactly 3 fascinating, mind-blowing trivia facts about the production, cast, or story of the film.
    
    Example format:
    {{
      "why_watch": "...",
      "trivia": ["Fact 1", "Fact 2", "Fact 3"]
    }}
    """
    
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        text = response.text.strip()
        text = re.sub(r'```json|```', '', text).strip()
        data = json.loads(text)
        
        result = MovieInsights(
            why_watch=data.get("why_watch", "This is an incredible movie that you absolutely must watch!"),
            trivia=data.get("trivia", ["Great movie!", "Amazing cast!", "Must watch!"])
        )
        insights_cache[movie_id] = result
        return result
    except Exception as e:
        print(f"Gemini error: {e}")
        return MovieInsights(
            why_watch="This is an incredible movie that you absolutely must watch!",
            trivia=["Great movie!", "Amazing cast!", "Must watch!"]
        )
