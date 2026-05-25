"""
TMDB Movie Sync Script
Fetches real movies from TMDB API and stores them in the SQLite database.
Run once: venv\Scripts\python tmdb_sync.py
"""
import requests
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine, Base
from app.models.movie import Movie
from app.models.user import User
from app.models.rating import Rating
from app.core.config import settings

Base.metadata.create_all(bind=engine)

TMDB_KEY = settings.TMDB_API_KEY
TMDB_BASE = settings.TMDB_BASE_URL
IMAGE_BASE = f"{settings.TMDB_IMAGE_BASE}/w500"
BACKDROP_BASE = f"{settings.TMDB_IMAGE_BASE}/original"

GENRE_MAP = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
    80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
    14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
    9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
    10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
}

def fetch_movies_from_tmdb():
    db = SessionLocal()
    
    # Drop existing movies and re-seed with real TMDB data
    existing = db.query(Movie).filter(Movie.tmdb_id != None).count()
    if existing > 50:
        print(f"Already have {existing} TMDB movies. Skipping sync.")
        db.close()
        return

    print("Fetching real movies from TMDB...")
    endpoints = [
        f"{TMDB_BASE}/movie/popular",
        f"{TMDB_BASE}/movie/top_rated",
        f"{TMDB_BASE}/movie/now_playing",
        f"{TMDB_BASE}/trending/movie/week",
    ]

    all_movies = []
    seen_ids = set()

    for endpoint in endpoints:
        for page in range(1, 6):  # 5 pages each = ~100 movies per endpoint
            try:
                resp = requests.get(endpoint, params={"api_key": TMDB_KEY, "page": page, "language": "en-US"})
                data = resp.json()
                results = data.get("results", [])
                for m in results:
                    if m["id"] not in seen_ids and m.get("poster_path") and m.get("backdrop_path"):
                        seen_ids.add(m["id"])
                        all_movies.append(m)
            except Exception as e:
                print(f"Error fetching {endpoint} page {page}: {e}")

    print(f"Fetched {len(all_movies)} unique movies from TMDB.")

    count = 0
    for m in all_movies:
        existing = db.query(Movie).filter(Movie.tmdb_id == m["id"]).first()
        if existing:
            continue
        
        genres = [GENRE_MAP.get(gid, "Other") for gid in m.get("genre_ids", [])]
        genre_str = ", ".join(genres) if genres else "General"
        
        release_year = 0
        if m.get("release_date") and len(m["release_date"]) >= 4:
            try:
                release_year = int(m["release_date"][:4])
            except:
                release_year = 2020
        
        movie = Movie(
            tmdb_id=m["id"],
            title=m.get("title", "Unknown"),
            genre=genre_str,
            description=m.get("overview", "No description available."),
            poster_url=f"{IMAGE_BASE}{m['poster_path']}",
            backdrop_url=f"{BACKDROP_BASE}{m['backdrop_path']}" if m.get("backdrop_path") else "",
            release_year=release_year,
            vote_average=round(m.get("vote_average", 0.0), 1),
        )
        db.add(movie)
        count += 1

    db.commit()
    print(f"SUCCESS: Added {count} real movies to database!")
    db.close()

if __name__ == "__main__":
    fetch_movies_from_tmdb()
