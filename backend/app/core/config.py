from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Customer Support Automation Platform"
    API_V1_STR: str = "/api/v1"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return "sqlite+aiosqlite:///./ai_support.db"
    
    @property
    def SQLALCHEMY_SYNC_DATABASE_URI(self) -> str:
        return "sqlite:///./ai_support.db"

    # JWT Authentication
    SECRET_KEY: str = "supersecretkey_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    class Config:
        case_sensitive = True

settings = Settings()
