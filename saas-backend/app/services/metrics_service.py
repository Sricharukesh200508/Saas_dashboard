import json
from aiokafka import AIOKafkaProducer
from app.config import settings
from app.schemas.metrics import MetricEventIngest, BatchMetricIngest
from typing import List

class MetricsService:
    _producer = None

    @classmethod
    async def get_producer(cls) -> AIOKafkaProducer:
        if not cls._producer:
            cls._producer = AIOKafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            await cls._producer.start()
        return cls._producer

    @classmethod
    async def ingest_event(cls, tenant_id: str, event: MetricEventIngest):
        producer = await cls.get_producer()
        payload = event.model_dump()
        payload['tenant_id'] = tenant_id
        # Timestamp serialization fix
        payload['timestamp'] = payload['timestamp'].isoformat()
        
        await producer.send_and_wait("metric_events", payload)

    @classmethod
    async def ingest_batch(cls, tenant_id: str, batch: BatchMetricIngest):
        producer = await cls.get_producer()
        for event in batch.events:
            payload = event.model_dump()
            payload['tenant_id'] = tenant_id
            payload['timestamp'] = payload['timestamp'].isoformat()
            # Send without waiting for each one
            await producer.send("metric_events", payload)
            
        # In a real impl, you might want to await gather on all sends or wait once at the end
