import urllib.parse
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AnubhavAI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:5173"

    # Database
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "anubhavai"
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "anubhav2024"

    @property
    def DATABASE_URL(self) -> str:
        pwd = urllib.parse.quote_plus(self.MYSQL_PASSWORD)
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{pwd}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
        )

    # AI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    DEMO_MODE: bool = False

    @property
    def is_demo_mode(self) -> bool:
        return self.DEMO_MODE or not self.OPENAI_API_KEY

    # Security
    SECRET_KEY: str = "anubhavai-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Admin
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "anubhav2024"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
