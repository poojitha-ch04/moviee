from sqlalchemy import Column, Integer, String, Text, Float
from app.db.database import Base

class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, index=True, nullable=True)
    title = Column(String, index=True)
    genre = Column(String)
    description = Column(Text)
    poster_url = Column(String)
    backdrop_url = Column(String)
    release_year = Column(Integer)
    vote_average = Column(Float, default=0.0)
    runtime = Column(Integer, default=0)
    tagline = Column(String, default="")
    language = Column(String, default="en", index=True)
