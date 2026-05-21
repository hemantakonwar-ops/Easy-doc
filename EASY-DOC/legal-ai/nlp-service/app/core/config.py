from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # LLM Providers - Multiple keys separated by comma for round-robin
    # Example: GROQ_API_KEY="key1,key2,key3"
    groq_api_key: str | None = None  # Groq first approach
    gemini_api_key: str | None = None  # Gemini fallback with round-robin
    
    groq_model: str = "llama-3.1-8b-instant"
    gemini_model: str = "gemini-2.0-flash"
    
    # Round robin tracking (persisted in memory)
    _groq_key_index: int = 0
    _gemini_key_index: int = 0
    
    # Database
    mongodb_uri: str = "mongodb://localhost:27017"
    faiss_index_path: str = "./faiss_index"
    
    # Performance
    max_workers: int = 4
    embedding_batch_size: int = 32
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
