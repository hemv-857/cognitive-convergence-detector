from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./convergence.db"
    REDIS_URL: str = ""

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    ALERT_EMAIL_TO: str = ""

    DISCORD_WEBHOOK_URL: str = ""

    LOG_LEVEL: str = "INFO"

    ALERT_LEVEL1_THRESHOLD: float = 1.5
    ALERT_LEVEL2_PAIRS_PCT: float = 0.30
    ALERT_LEVEL3_PERCENTILE: float = 95.0
    CORRELATION_WINDOW: int = 30
    BASELINE_LOOKBACK: int = 252

    class Config:
        env_file = ".env"


settings = Settings()
