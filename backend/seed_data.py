import sys
import random
import requests
from faker import Faker
from app.db.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.movie import Movie
from app.models.rating import Rating
from app.models.watchlist import Watchlist
from app.core.security import get_password_hash
from app.core.config import settings
from sqlalchemy import text

fake = Faker()

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def fetch_tmdb_genres():
    url = f"{settings.TMDB_BASE_URL}/genre/movie/list?api_key={settings.TMDB_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        genres = response.json().get("genres", [])
        return {genre['id']: genre['name'] for genre in genres}
    except Exception as e:
        print(f"Error fetching genres: {e}")
        return {}

def fetch_tmdb_popular_movies(pages=10):
    movies = []
    genre_map = fetch_tmdb_genres()
    
    for page in range(1, pages + 1):
        url = f"{settings.TMDB_BASE_URL}/movie/popular?api_key={settings.TMDB_API_KEY}&page={page}"
        try:
            response = requests.get(url)
            response.raise_for_status()
            results = response.json().get("results", [])
            for item in results:
                if not item.get("poster_path"):
                    continue
                
                # Map genre IDs to names
                genre_names = [genre_map.get(gid) for gid in item.get("genre_ids", []) if genre_map.get(gid)]
                
                movies.append({
                    "tmdb_id": item["id"],
                    "title": item["title"],
                    "genre": ",".join(genre_names),
                    "description": item.get("overview", ""),
                    "poster_url": f"{settings.TMDB_IMAGE_BASE}/w500{item['poster_path']}",
                    "backdrop_url": f"{settings.TMDB_IMAGE_BASE}/original{item['backdrop_path']}" if item.get("backdrop_path") else None,
                    "release_year": int(item["release_date"][:4]) if item.get("release_date") else 2024,
                    "vote_average": item.get("vote_average", 0.0)
                })
        except Exception as e:
            print(f"Error fetching movies page {page}: {e}")
    
    return movies

def seed_data():
    db = SessionLocal()
    
    # 1. Clear existing data
    print("Clearing existing data...")
    # Delete in correct order to respect foreign keys
    db.query(Watchlist).delete()
    db.query(Rating).delete()
    db.query(Movie).delete()
    db.query(User).delete()
    db.commit()

    # 2. Fetch and seed real movies from TMDB
    print("Fetching popular movies from TMDB...")
    tmdb_movies = fetch_tmdb_popular_movies(pages=10) # 200 movies
    
    if not tmdb_movies:
        print("Failed to fetch movies from TMDB. Aborting.")
        return

    print("Seeding Movies...")
    db_movies = []
    for m_data in tmdb_movies:
        movie = Movie(
            tmdb_id=m_data["tmdb_id"],
            title=m_data["title"],
            genre=m_data["genre"],
            description=m_data["description"],
            poster_url=m_data["poster_url"],
            backdrop_url=m_data["backdrop_url"],
            release_year=m_data["release_year"],
            vote_average=m_data["vote_average"]
        )
        db.add(movie)
        db_movies.append(movie)
    db.commit()

    # 3. Seed Users
    print("Seeding Users...")
    users = []
    # Create 50 dummy users
    for _ in range(50):
        user = User(
            username=fake.user_name() + str(random.randint(1,1000)),
            email=fake.email(),
            password_hash=get_password_hash("password123")
        )
        db.add(user)
        users.append(user)
    db.commit()

    # 4. Seed Ratings
    print("Seeding Ratings...")
    # Create random ratings
    for user in users:
        # Each user rates between 10 and 30 movies
        rated_movies = random.sample(db_movies, k=random.randint(10, 30))
        for movie in rated_movies:
            rating = Rating(
                user_id=user.id,
                movie_id=movie.id,
                rating=round(random.uniform(2.0, 5.0), 1)
            )
            db.add(rating)
    db.commit()

    print("Seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_data()
