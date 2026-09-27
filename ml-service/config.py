from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str = "postgresql://landslide_user:password@localhost:5432/landslide_db"
    model_dir: str = "./models"
    metadata_dir: str = "./models/metadata"
    
    # Risk thresholds
    risk_low_max: float = 0.25
    risk_moderate_max: float = 0.50
    risk_high_max: float = 0.75
    
    # ML config
    n_estimators: int = 200
    max_depth: int = 15
    min_samples_split: int = 5
    random_state: int = 42
    
    class Config:
        env_file = ".env"

settings = Settings()
