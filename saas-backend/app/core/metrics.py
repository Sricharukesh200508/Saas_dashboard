from prometheus_client import Counter, Histogram, Gauge

# System Metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP Requests",
    ["method", "endpoint", "http_status"]
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP Request Latency",
    ["method", "endpoint"]
)

# Business Metrics
ACTIVE_TENANTS = Gauge(
    "saas_active_tenants",
    "Number of active tenants"
)

TOTAL_SUBSCRIPTIONS = Counter(
    "saas_subscriptions_total",
    "Total Subscriptions Created",
    ["plan"]
)

INGESTED_EVENTS = Counter(
    "saas_ingested_events_total",
    "Total Metric Events Ingested",
    ["tenant_id", "status"] # status = accepted/rejected
)

def track_request(method: str, endpoint: str, status_code: int, duration: float):
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, http_status=status_code).inc()
    REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
