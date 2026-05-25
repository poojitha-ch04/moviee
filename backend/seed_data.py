import sys
import random
from faker import Faker
from app.db.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.movie import Movie
from app.models.rating import Rating
from app.core.security import get_password_hash

fake = Faker()

# Create tables
Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(Movie).first():
        print("Database already seeded.")
        return

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

    print("Seeding Movies...")
    movies = []
    genres = ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance", "Thriller", "Fantasy", "Animation", "Documentary"]
    # Create 200 dummy movies
    for i in range(200):
        movie_genres = random.sample(genres, k=random.randint(1, 3))
        movie = Movie(
            tmdb_id=random.randint(1000, 999999),
            title=fake.catch_phrase(),
            genre=",".join(movie_genres),
            description=fake.text(max_nb_chars=300),
            poster_url=f"https://picsum.photos/seed/movie{i}/400/600",
            release_year=random.randint(1990, 2024)
        )
        db.add(movie)
        movies.append(movie)
    db.commit()

    print("Seeding Ratings...")
    # Create random ratings
    for user in users:
        # Each user rates between 10 and 30 movies
        rated_movies = random.sample(movies, k=random.randint(10, 30))
        for movie in rated_movies:
            rating = Rating(
                user_id=user.id,
                movie_id=movie.id,
                rating=round(random.uniform(1.0, 5.0), 1)
            )
            db.add(rating)
    db.commit()

    print("Seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_data()
