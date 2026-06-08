"""
ClickHouse client — parses connection from CLICKHOUSE_URL setting.

URL format: clickhouse://user:password@host:port/database
"""
import logging
from urllib.parse import urlparse

import clickhouse_connect

from app.config import settings

logger = logging.getLogger(__name__)


class ClickHouseClient:
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            cls._client = cls._create_client()
        return cls._client

    @classmethod
    def _create_client(cls):
        """Parse CLICKHOUSE_URL and create a typed client."""
        try:
            parsed = urlparse(settings.CLICKHOUSE_URL)
            host = parsed.hostname or "localhost"
            port = parsed.port or 8123
            username = parsed.username or "default"
            password = parsed.password or ""
            database = (parsed.path or "/default").lstrip("/") or "default"

            logger.info(
                "Connecting to ClickHouse: %s:%d/%s (user=%s)",
                host, port, database, username
            )
            return clickhouse_connect.get_client(
                host=host,
                port=port,
                username=username,
                password=password,
                database=database,
                connect_timeout=10,
                send_receive_timeout=60,
            )
        except Exception as exc:
            logger.error("Failed to create ClickHouse client: %s", exc)
            raise


def get_clickhouse_client():
    return ClickHouseClient.get_client()
