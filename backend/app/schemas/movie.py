from pydantic import BaseModel
from typing import Optional

class MovieBase(BaseModel):
    title: str
    genre: str
    description: str
    poster_url: str
    backdrop_url: Optional[str] = ""
    release_year: int
    tmdb_id: Optional[int] = None
    vote_average: Optional[float] = 0.0
    runtime: Optional[int] = 0
    tagline: Optional[str] = ""

class MovieResponse(MovieBase):
    id: int

    class Config:
        from_attributes = True
