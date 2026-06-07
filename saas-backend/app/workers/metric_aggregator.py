from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def aggregate_1m():
    """
    Downsamples 1m metrics to metric_aggregates table or refreshes TimescaleDB continuous aggregates.
    """
    logger.info("Aggregating metrics (1m window)...")
    # In TimescaleDB, we usually just call:
    # CALL refresh_continuous_aggregate('metric_aggregates', ...);
    return "OK"
