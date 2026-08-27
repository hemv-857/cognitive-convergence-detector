import pytest
from app.config import Settings


def test_settings_defaults():
    settings = Settings()
    assert settings.DATABASE_URL == "sqlite:///./convergence.db"
    assert settings.CORRELATION_WINDOW == 30
    assert settings.ALERT_LEVEL1_THRESHOLD == 1.5


def test_settings_custom():
    import os
    os.environ["DATABASE_URL"] = "sqlite:///./custom.db"
    os.environ["CORRELATION_WINDOW"] = "60"
    
    settings = Settings()
    assert settings.DATABASE_URL == "sqlite:///./custom.db"
    assert settings.CORRELATION_WINDOW == 60
    
    # Clean up
    del os.environ["DATABASE_URL"]
    del os.environ["CORRELATION_WINDOW"]
