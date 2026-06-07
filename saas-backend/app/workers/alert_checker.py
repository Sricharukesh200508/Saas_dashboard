from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def evaluate_all_alerts():
    logger.info("Evaluating all active alerts...")
    # 1. Fetch active alerts from DB
    # 2. Query recent metrics
    # 3. Check thresholds
    # 4. If triggered, send to SendGrid / Slack
    return "OK"
