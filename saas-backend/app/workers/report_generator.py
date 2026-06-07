from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def generate_monthly_reports():
    logger.info("Generating monthly PDF reports for all tenants...")
    # Generate PDF
    # Upload to AWS S3
    # Email presigned URL
    return "OK"
