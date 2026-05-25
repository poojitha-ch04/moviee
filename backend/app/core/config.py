from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Moviee API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "moviee_super_secret_key_2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./moviee.db"
    DATABASE_URL: str | None = None
    TMDB_API_KEY: str = "726dd5ec2d64def910b6e96bce09de29"
    TMDB_BASE_URL: str = "https://api.themoviedb.org/3"
    TMDB_IMAGE_BASE: str = "https://image.tmdb.org/t/p"
    GEMINI_API_KEY: str | None = None

    @property
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            # SQLAlchemy 1.4+ requires postgresql:// instead of postgres://
            if self.DATABASE_URL.startswith("postgres://"):
                return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
            return self.DATABASE_URL
        return self.SQLALCHEMY_DATABASE_URI

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
