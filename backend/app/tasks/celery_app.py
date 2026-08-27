"""Celery tasks for async pipeline processing."""

import logging
from datetime import datetime

from celery import Celery

from app.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "convergence_detector",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="US/Eastern",
    enable_utc=True,
)


@celery_app.task(bind=True, max_retries=3)
def run_daily_pipeline(self):
    """Execute the full daily convergence detection pipeline."""
    try:
        from app.tasks.pipeline import execute_pipeline
        execute_pipeline()
    except Exception as exc:
        logger.error(f"Pipeline failed: {exc}")
        self.retry(exc=exc, countdown=300)


@celery_app.task
def recompute_baselines():
    """Recompute historical baselines (run weekly)."""
    from app.tasks.pipeline import recompute_all_baselines
    recompute_all_baselines()
