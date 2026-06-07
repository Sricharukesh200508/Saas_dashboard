import clickhouse_connect
from app.config import settings

class ClickHouseClient:
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            # Parse Clickhouse URL "clickhouse://default:password@host:port/database"
            # Note: For production use proper parsed values.
            # Using basic default connection for the example.
            cls._client = clickhouse_connect.get_client(
                host='clickhouse', # Should parse from settings.CLICKHOUSE_URL
                port=8123,
                username='default',
                password='',
                database='default'
            )
        return cls._client

def get_clickhouse_client():
    return ClickHouseClient.get_client()
