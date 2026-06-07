from celery import Celery
from app.config import settings

celery_app = Celery(
    "saas_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.ml_tasks", "app.workers.metric_aggregator", "app.workers.alert_checker", "app.workers.report_generator"]
)

celery_app.conf.task_routes = {
    "app.workers.ml_tasks.*": {"queue": "ml"},
    "app.workers.metric_aggregator.*": {"queue": "default"},
}

celery_app.conf.beat_schedule = {
    "aggregate_metrics_1m": {
        "task": "app.workers.metric_aggregator.aggregate_1m",
        "schedule": 60.0,
    },
    "check_alerts_1m": {
        "task": "app.workers.alert_checker.evaluate_all_alerts",
        "schedule": 60.0,
    },
    "score_churn_daily": {
        "task": "app.workers.ml_tasks.score_all_tenants",
        "schedule": 86400.0, # 1 day
    }
}
celery_app.conf.timezone = "UTC"
