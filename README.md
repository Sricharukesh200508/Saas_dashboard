<div align="center">

<img src="docs/screenshots/dashboard.png" alt="NexusAPI Dashboard" width="100%" />

# 🚀 NexusAPI — Enterprise SaaS Metrics & Subscription Dashboard

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-TimescaleDB-336791?style=for-the-badge&logo=postgresql)](https://www.timescale.com)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-7.5-231F20?style=for-the-badge&logo=apache-kafka)](https://kafka.apache.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> A production-grade, full-stack SaaS observability platform for monitoring API metrics, managing subscriptions, handling multi-tenant workspaces, and real-time event streaming — all in a sleek dark-themed dashboard.

[Live Demo](#getting-started) · [API Docs](http://localhost:8000/api/docs) · [Report a Bug](issues) · [Request a Feature](issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Screenshots](#-screenshots)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Background Workers](#-background-workers)
- [WebSocket Events](#-websocket-events)
- [Authentication & Security](#-authentication--security)
- [Observability](#-observability)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

**NexusAPI** is a comprehensive enterprise SaaS dashboard that provides:

- 📊 **Real-time API metrics** with sub-second latency tracking (p50, p95, p99)
- 🏢 **Multi-tenant architecture** with full tenant isolation at the database level
- 🔐 **Role-based access control** (Owner → Admin → Member → Viewer)
- ⚡ **Event-driven pipeline** via Apache Kafka for high-throughput metric ingestion
- 📈 **Time-series analytics** powered by TimescaleDB continuous aggregates
- 🤖 **Background ML tasks** via Celery for anomaly detection and forecasting
- 🔔 **Alert engine** with configurable thresholds and webhook delivery
- 💳 **Billing & subscription management** with Stripe integration
- 🌐 **GraphQL + REST + WebSocket** API surface

---

## 📸 Screenshots

### Dashboard Overview
![Dashboard Overview](docs/screenshots/dashboard.png)

The main dashboard provides a bird's-eye view of your API health with:
- Live KPI cards (Total Calls, Error Rate, p99 Latency, Data Transferred)
- 24-hour traffic chart with real-time streaming updates
- Live activity feed with per-minute call rates
- Current subscription plan usage meters

### Detailed Analytics
![Analytics Page](docs/screenshots/analytics.png)

Deep-dive analytics with:
- Tabbed views: API Calls / Latency (p99) / Errors
- Top endpoints ranked by call volume, error rate, and latency
- Error breakdown donut chart by HTTP status code (4xx/5xx)
- One-click CSV export and PDF report generation
- Configurable time-range filters (1h / 24h / 7d / 30d / 90d)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│   React 19 + TanStack Router + Zustand + React Query + D3.js    │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────────────────┐
│                   FastAPI Backend (Python 3.12)                  │
│  REST API v1  │  WebSocket Gateway  │  GraphQL (Strawberry)     │
│               │                     │                            │
│  Auth Service │  Metrics Service    │  Analytics Service         │
│  Tenant Svc   │  Billing Service    │  Alert Engine              │
└───────┬───────┴──────┬──────────────┴────────────────┬──────────┘
        │              │                                │
   ┌────▼────┐   ┌─────▼──────┐              ┌─────────▼─────────┐
   │ Postgres│   │   Kafka     │              │    ClickHouse      │
   │TimescaleDB  │(Event Bus)  │              │  (OLAP / Reports)  │
   └────┬────┘   └─────┬──────┘              └───────────────────┘
        │              │
   ┌────▼────┐   ┌─────▼──────┐   ┌──────────┐   ┌──────────────┐
   │  Redis  │   │   Celery    │   │Prometheus│   │   Grafana     │
   │ (Cache) │   │ (Workers)   │   │(Metrics) │   │(Dashboards)  │
   └─────────┘   └────────────┘   └──────────┘   └──────────────┘
```

### Data Flow

```
API Client → Kafka Producer → Topic: api_events
                                      ↓
                              Kafka Consumer (FastAPI)
                                      ↓
                         PostgreSQL (TimescaleDB hypertable)
                                      ↓
                         Celery Worker (aggregation / ML)
                                      ↓
                      ClickHouse (OLAP for heavy analytics)
                                      ↓
                         WebSocket → Frontend Dashboard
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.12 | Runtime |
| **FastAPI** | 0.111 | REST API + WebSocket server |
| **SQLAlchemy** | 2.0 (async) | ORM with async support |
| **Alembic** | 1.13 | Database migrations |
| **PostgreSQL** | 16 (TimescaleDB) | Primary time-series database |
| **ClickHouse** | Latest | OLAP analytics & reports |
| **Redis** | 7 | Caching, rate limiting, Celery broker |
| **Apache Kafka** | 7.5 | Event streaming & metric ingestion |
| **Celery** | 5.4 | Distributed task queue |
| **Strawberry** | 0.235 | GraphQL API |
| **PyJWT** | 2.8 | JWT authentication |
| **Passlib + bcrypt** | Latest | Password hashing |
| **OpenTelemetry** | 1.25 | Distributed tracing |
| **Prometheus Client** | 0.20 | Metrics export |
| **Stripe** | 9.9 | Payment processing |
| **Gunicorn + Uvicorn** | Latest | Production ASGI server |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI framework |
| **TypeScript** | 5.5 | Type safety |
| **Vite** | 5.4 | Build tool & dev server |
| **TanStack Router** | 1.58 | Type-safe file-based routing |
| **TanStack Query** | 5.56 | Server state management |
| **Zustand** | 5.0 | Client state management |
| **Framer Motion** | 11 | Animations |
| **Recharts** | 2.13 | Chart library |
| **D3.js** | 7.9 | Advanced data visualizations |
| **Socket.IO Client** | 4.8 | Real-time WebSocket events |
| **Radix UI** | Latest | Accessible component primitives |
| **React Hook Form** | 7.53 | Form management |
| **Zod** | 3.23 | Schema validation |
| **Axios** | 1.7 | HTTP client with interceptors |
| **Tailwind CSS** | 4.3 | Utility-first styling |

### Infrastructure
| Service | Purpose |
|---|---|
| **Docker Compose** | Local orchestration |
| **Prometheus** | Metrics scraping |
| **Grafana** | Infrastructure dashboards |
| **OpenTelemetry Collector** | Trace aggregation |
| **Kafka UI** | Kafka topic browser |

---

## ✨ Features

### 📊 Metrics & Analytics
- **Real-time ingestion** via Kafka at high throughput
- **Time-series storage** with TimescaleDB continuous aggregates and compression
- **Percentile latency** tracking (p50 / p95 / p99) per endpoint
- **Error rate analysis** broken down by HTTP status code
- **Top endpoints** ranked by volume, latency, and error rate
- **Traffic trend** charts with 24h / 7d / 30d / 90d ranges
- **CSV export** and **PDF report** generation
- **ClickHouse OLAP** for heavy aggregation queries

### 🏢 Multi-Tenancy
- Complete **tenant isolation** — every query is scoped by `tenant_id`
- Tenant registration with custom slug and domain
- Per-tenant API key management with scopes
- Per-tenant webhook delivery with retry logic and delivery logs
- Per-tenant subscription plan enforcement

### 🔐 Authentication & Authorization
- **JWT access tokens** (15-minute expiry) + **refresh tokens** (7-day rotation)
- **Role hierarchy**: `owner > admin > member > viewer`
- **API key authentication** with configurable scopes and expiry
- Token refresh with silent rotation via Axios interceptors
- Persisted auth state via Zustand with localStorage sync

### 🔔 Alert Engine
- Configurable alert rules with threshold conditions
- Alert severity levels: `critical / warning / info`
- Multi-channel delivery: Slack / Email / PagerDuty
- **Celery Beat** scheduled checks every minute
- Alert history and acknowledgement workflow

### 💳 Billing & Subscriptions
- **Stripe integration** for payment processing
- Subscription plans: Starter / Pro / Enterprise
- Usage meters (API calls, storage) with soft/hard limits
- Invoice history and plan upgrade/downgrade flows
- Webhook handlers for Stripe payment events

### 🌐 API Explorer
- Interactive in-app REST API explorer
- Syntax-highlighted request/response viewer
- Live request execution against the backend
- Endpoint discovery from OpenAPI schema

### 🔗 Integrations
- Connect external services (Slack, PagerDuty, Datadog, etc.)
- OAuth-based connection flows
- Integration health status monitoring

### 📋 Audit Logs
- Immutable audit trail for all sensitive actions
- Actor, resource type, action, and diff stored per event
- Filterable by date range, user, and action type

### ⚡ Real-time Features
- **WebSocket** live activity feed with per-minute call rate
- Live error rate streaming to dashboard
- Real-time alert notifications

---

## 📁 Project Structure

```
SaaS_Dashboard/
├── saas-backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/                    # REST API routes
│   │   │   │   ├── auth.py            # Login, register, refresh, logout
│   │   │   │   ├── metrics.py         # Metric ingestion & query endpoints
│   │   │   │   ├── analytics.py       # Analytics aggregation endpoints
│   │   │   │   ├── alerts.py          # Alert CRUD & trigger management
│   │   │   │   ├── api_keys.py        # API key lifecycle management
│   │   │   │   ├── audit_logs.py      # Audit log query endpoint
│   │   │   │   ├── billing.py         # Subscription & invoice endpoints
│   │   │   │   ├── integrations.py    # Third-party integration endpoints
│   │   │   │   ├── team.py            # Team member management
│   │   │   │   ├── tenant.py          # Tenant profile & settings
│   │   │   │   ├── webhooks.py        # Outbound webhook management
│   │   │   │   ├── user_webhooks.py   # User-level webhook handlers
│   │   │   │   └── router.py          # Route aggregator
│   │   │   └── ws/                    # WebSocket gateway
│   │   ├── core/
│   │   │   ├── security.py            # JWT, password hashing, API key auth
│   │   │   ├── middleware.py          # Rate limiting, tenant resolution, request ID
│   │   │   ├── circuit_breaker.py     # Circuit breaker pattern for external calls
│   │   │   ├── idempotency.py         # Idempotency key handling (Redis)
│   │   │   ├── encryption.py          # Field-level encryption utilities
│   │   │   ├── locks.py               # Distributed locks via Redis
│   │   │   ├── telemetry.py           # OpenTelemetry setup
│   │   │   ├── metrics.py             # Prometheus metrics registry
│   │   │   └── exceptions.py          # Custom exception classes
│   │   ├── models/                    # SQLAlchemy ORM models
│   │   │   ├── tenant.py              # Tenant model
│   │   │   ├── user.py                # User model
│   │   │   ├── metric_event.py        # MetricEvent hypertable (TimescaleDB)
│   │   │   ├── subscription.py        # Subscription & billing model
│   │   │   ├── alert.py               # Alert rule & alert event models
│   │   │   ├── api_key.py             # API key model
│   │   │   ├── audit_log.py           # Audit log model
│   │   │   ├── webhook.py             # Webhook endpoint & delivery models
│   │   │   └── integration.py         # Integration model
│   │   ├── services/
│   │   │   ├── auth_service.py        # Auth business logic
│   │   │   ├── metrics_service.py     # Metric ingestion & query logic
│   │   │   ├── analytics_service.py   # Analytics aggregation logic
│   │   │   ├── billing_service.py     # Billing & Stripe integration
│   │   │   └── tenant_service.py      # Tenant lifecycle management
│   │   ├── workers/
│   │   │   ├── celery_app.py          # Celery application & beat schedule
│   │   │   ├── metric_aggregator.py   # Scheduled metric aggregation task
│   │   │   ├── alert_checker.py       # Periodic alert threshold checker
│   │   │   ├── clickhouse_sync.py     # Postgres → ClickHouse ETL sync
│   │   │   ├── ml_tasks.py            # ML anomaly detection & forecasting
│   │   │   └── report_generator.py    # PDF/CSV report generation task
│   │   ├── kafka/
│   │   │   └── consumer.py            # Kafka consumer (metric event pipeline)
│   │   ├── db/
│   │   │   ├── base.py                # Async SQLAlchemy engine setup
│   │   │   └── clickhouse.py          # ClickHouse client wrapper
│   │   ├── schemas/                   # Pydantic request/response schemas
│   │   ├── utils/                     # Utility helpers
│   │   ├── config.py                  # Pydantic settings (env-based config)
│   │   └── main.py                    # FastAPI app factory & lifespan
│   ├── tests/                         # Pytest test suite
│   ├── demo_seed.py                   # Demo data seeder
│   ├── full_seed.py                   # Full production-like seeder
│   ├── traffic_simulator.py           # API traffic load simulator
│   ├── docker-compose.yml             # Core service orchestration
│   ├── docker-compose.override.yml    # Dev overrides (Grafana, Kafka UI, etc.)
│   ├── Dockerfile                     # Multi-stage production image
│   ├── pyproject.toml                 # Poetry dependencies
│   └── alembic.ini                    # Database migration config
│
└── saas-frontend/
    ├── src/
    │   ├── api/                       # Typed API client functions
    │   │   ├── client.ts              # Axios instance + token refresh interceptor
    │   │   ├── auth.ts                # Auth endpoints
    │   │   ├── metrics.ts             # Metrics endpoints
    │   │   ├── billing.ts             # Billing endpoints
    │   │   ├── team.ts                # Team management endpoints
    │   │   ├── apiKeys.ts             # API key endpoints
    │   │   └── ...
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── AuthProvider.tsx   # JWT validation + ProtectedRoute guard
    │   │   │   ├── LoginForm.tsx      # Login form with validation
    │   │   │   └── RegisterTenantForm.tsx
    │   │   ├── dashboard/             # Dashboard widget components
    │   │   ├── analytics/             # Chart components (Recharts + D3)
    │   │   ├── layout/                # Sidebar, Header, Navigation
    │   │   ├── animations/            # Framer Motion wrappers
    │   │   └── shared/                # Reusable UI primitives
    │   ├── pages/                     # Route-level page components
    │   ├── store/
    │   │   └── auth.store.ts          # Zustand auth store (persisted)
    │   ├── hooks/
    │   │   └── useAuth.ts             # Auth hook (login, logout, roles)
    │   ├── types/                     # TypeScript type definitions
    │   ├── utils/                     # Helpers (storage, format, errors)
    │   ├── config/                    # API config & endpoint constants
    │   └── router.tsx                 # TanStack Router route tree
    ├── vite.config.ts
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Linux containers enabled)
- [Node.js 20+](https://nodejs.org/) and [pnpm](https://pnpm.io/)
- [Python 3.12+](https://www.python.org/) (optional, for local dev without Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/saas-dashboard.git
cd saas-dashboard
```

### 2. Start the Backend (Docker)

```bash
cd saas-backend

# Copy environment config
cp .env.example .env

# Build and start all services (Postgres, Redis, Kafka, API, Celery, etc.)
docker-compose up -d --build
```

This starts the following services:

| Service | URL |
|---|---|
| **FastAPI API** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/api/docs |
| **API Docs (ReDoc)** | http://localhost:8000/api/redoc |
| **GraphQL Playground** | http://localhost:8000/graphql |
| **PostgreSQL** | localhost:5432 |
| **Redis** | localhost:6379 |
| **Kafka** | localhost:9092 |
| **Kafka UI** | http://localhost:8080 |
| **Prometheus** | http://localhost:9090 |
| **Grafana** | http://localhost:3000 |

### 3. Run Database Migrations

```bash
docker exec saas-backend-api-1 alembic upgrade head
```

### 4. Seed Demo Data

```bash
# Seed demo tenant + user with realistic data
docker exec saas-backend-api-1 python demo_seed.py

# Or seed a larger production-like dataset
docker exec saas-backend-api-1 python full_seed.py
```

**Demo credentials after seeding:**
```
Email:    demo@acmecorp.com
Password: password123
```

### 5. Start the Frontend

```bash
cd saas-frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open **http://localhost:5173** in your browser.

### 6. (Optional) Simulate API Traffic

```bash
docker exec saas-backend-api-1 python traffic_simulator.py
```

This generates realistic traffic patterns with varying error rates and latency distributions to populate the dashboard with live data.

---

## 🔧 Environment Variables

### Backend (`saas-backend/.env`)

```env
# App
ENVIRONMENT=development
LOG_LEVEL=INFO

# PostgreSQL (TimescaleDB)
DATABASE_URL=postgresql+asyncpg://saasuser:saaspassword@postgres:5432/saasdb
DATABASE_REPLICA_URL=postgresql+asyncpg://saasuser:saaspassword@postgres:5432/saasdb

# ClickHouse OLAP
CLICKHOUSE_URL=clickhouse://saasuser:saaspassword@clickhouse:8123/saasdb

# Redis
REDIS_URL=redis://redis:6379/0

# Kafka
KAFKA_BOOTSTRAP_SERVERS=kafka:29092

# JWT Security
SECRET_KEY=your-super-secret-key-replace-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (optional)
SENDGRID_API_KEY=SG...

# AWS S3 (optional, for report storage)
AWS_S3_BUCKET=saas-reports
AWS_REGION=us-east-1

# Telemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
```

### Frontend (`saas-frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 📡 API Reference

Full interactive docs available at **http://localhost:8000/api/docs**

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new tenant + owner |
| `POST` | `/api/v1/auth/login` | Login, returns JWT access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token |
| `POST` | `/api/v1/auth/logout` | Revoke tokens |

### Metrics

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/metrics/ingest` | Ingest a single metric event |
| `POST` | `/api/v1/metrics/ingest/batch` | Batch ingest metric events |
| `GET` | `/api/v1/metrics/summary` | Aggregated KPI summary |
| `GET` | `/api/v1/metrics/timeseries` | Time-series data (bucketed) |
| `GET` | `/api/v1/metrics/top-endpoints` | Top endpoints by volume/latency/errors |
| `GET` | `/api/v1/metrics/live` | Live activity stats |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/analytics/error-breakdown` | Errors by status code |
| `GET` | `/api/v1/analytics/latency-percentiles` | p50/p95/p99 over time |
| `GET` | `/api/v1/analytics/export/csv` | Export metrics as CSV |
| `POST` | `/api/v1/analytics/export/pdf` | Generate PDF report |

### Alerts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/alerts` | List alert rules |
| `POST` | `/api/v1/alerts` | Create alert rule |
| `PUT` | `/api/v1/alerts/{id}` | Update alert rule |
| `DELETE` | `/api/v1/alerts/{id}` | Delete alert rule |
| `GET` | `/api/v1/alerts/events` | Alert event history |

### API Keys

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/api-keys` | List API keys |
| `POST` | `/api/v1/api-keys` | Create API key |
| `DELETE` | `/api/v1/api-keys/{id}` | Revoke API key |
| `POST` | `/api/v1/api-keys/{id}/rotate` | Rotate API key |

### Webhooks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/webhooks` | List webhook endpoints |
| `POST` | `/api/v1/webhooks` | Register webhook endpoint |
| `PUT` | `/api/v1/webhooks/{id}` | Update webhook |
| `DELETE` | `/api/v1/webhooks/{id}` | Delete webhook |
| `GET` | `/api/v1/webhooks/{id}/deliveries` | Delivery history + status |
| `POST` | `/api/v1/webhooks/{id}/test` | Send test event |

### Billing

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/billing/subscription` | Current subscription |
| `POST` | `/api/v1/billing/subscribe` | Create/upgrade subscription |
| `GET` | `/api/v1/billing/invoices` | Invoice history |
| `POST` | `/api/v1/billing/portal` | Create Stripe billing portal session |

### Team

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/team/members` | List team members |
| `POST` | `/api/v1/team/invite` | Invite team member |
| `PUT` | `/api/v1/team/members/{id}/role` | Update member role |
| `DELETE` | `/api/v1/team/members/{id}` | Remove team member |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Deep health check (Postgres, Redis, Kafka, ClickHouse) |

---

## 🗃️ Database Schema

### Core Models

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│    Tenant    │ 1---N │    User      │       │  MetricEvent     │
│──────────────│       │──────────────│       │──────────────────│
│ id (uuid)    │       │ id (uuid)    │       │ id (uuid)        │
│ name         │       │ email        │       │ tenant_id (FK)   │
│ slug         │       │ hashed_pwd   │       │ timestamp (TS)   │ ← TimescaleDB
│ plan         │       │ role         │       │ endpoint         │   hypertable
│ is_active    │       │ tenant_id    │       │ method           │
│ created_at   │       │ is_active    │       │ status_code      │
└──────────────┘       └──────────────┘       │ latency_ms       │
       │                                       │ request_size     │
       │                                       │ response_size    │
       │               ┌──────────────┐        └──────────────────┘
       1               │ Subscription │
       │               │──────────────│       ┌──────────────────┐
       N               │ tenant_id    │       │    AlertRule     │
       │               │ plan         │       │──────────────────│
┌──────▼──────┐        │ status       │       │ tenant_id (FK)   │
│   ApiKey    │        │ stripe_id    │       │ metric           │
│─────────────│        │ period_start │       │ condition        │
│ tenant_id   │        │ period_end   │       │ threshold        │
│ key_hash    │        └──────────────┘       │ severity         │
│ name        │                               │ channels (JSON)  │
│ scopes      │        ┌──────────────┐       └──────────────────┘
│ expires_at  │        │  AuditLog    │
└─────────────┘        │──────────────│       ┌──────────────────┐
                       │ tenant_id    │       │    Webhook       │
                       │ actor_id     │       │──────────────────│
                       │ resource_type│       │ tenant_id (FK)   │
                       │ action       │       │ url              │
                       │ diff (JSON)  │       │ events (array)   │
                       │ created_at   │       │ secret           │
                       └──────────────┘       │ is_active        │
                                              └──────────────────┘
```

### TimescaleDB Continuous Aggregates

```sql
-- Hourly API call counts per endpoint
SELECT time_bucket('1 hour', timestamp) AS bucket,
       tenant_id,
       endpoint,
       COUNT(*) AS calls,
       AVG(latency_ms) AS avg_latency,
       PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99_latency
FROM metric_events
GROUP BY bucket, tenant_id, endpoint;
```

---

## ⚙️ Background Workers

Celery handles all async, scheduled, and computationally heavy tasks:

| Task | Schedule | Description |
|---|---|---|
| `metric_aggregator` | Every 5 minutes | Roll up raw metric events into hourly buckets |
| `alert_checker` | Every 1 minute | Evaluate alert rules against latest metrics |
| `clickhouse_sync` | Every 15 minutes | ETL from PostgreSQL → ClickHouse for OLAP queries |
| `ml_tasks.detect_anomalies` | Every 30 minutes | ML-based anomaly detection on traffic patterns |
| `report_generator` | On demand | Generate PDF/CSV report and upload to S3 |

### Starting Workers Manually

```bash
# Worker
celery -A app.workers.celery_app worker -l info --concurrency=8

# Beat scheduler
celery -A app.workers.celery_app beat -l info

# Flower monitoring UI
celery -A app.workers.celery_app flower --port=5555
```

---

## 🔌 WebSocket Events

Connect to `ws://localhost:8000/ws/metrics?token=<JWT>`

### Incoming Events (Server → Client)

```json
// Live activity update (every 5 seconds)
{
  "type": "live_activity",
  "data": {
    "calls_per_minute": 142,
    "error_rate": 0.032,
    "active_connections": 8
  }
}

// Real-time metric event
{
  "type": "metric_event",
  "data": {
    "endpoint": "/api/v1/payments",
    "method": "POST",
    "status_code": 200,
    "latency_ms": 45
  }
}

// Alert triggered
{
  "type": "alert_triggered",
  "data": {
    "alert_id": "uuid",
    "rule_name": "High Error Rate",
    "severity": "critical",
    "current_value": 0.12
  }
}
```

---

## 🔐 Authentication & Security

### JWT Flow

```
1. POST /api/v1/auth/login
   → Returns { access_token, refresh_token }

2. Include in requests:
   Authorization: Bearer <access_token>

3. On 401 response:
   → Axios interceptor silently calls POST /api/v1/auth/refresh
   → New tokens stored, original request retried

4. On refresh failure:
   → clearAuth() called on Zustand store
   → Redirect to /login
```

### API Key Authentication

```bash
# Include in request header
curl -H "X-API-Key: nexus_sk_your_key_here" \
     https://api.example.com/api/v1/metrics/summary
```

### Role Permissions

| Action | Viewer | Member | Admin | Owner |
|---|:---:|:---:|:---:|:---:|
| View dashboard | ✅ | ✅ | ✅ | ✅ |
| Ingest metrics | ❌ | ✅ | ✅ | ✅ |
| Manage alerts | ❌ | ✅ | ✅ | ✅ |
| Manage API keys | ❌ | ✅ | ✅ | ✅ |
| Manage team | ❌ | ❌ | ✅ | ✅ |
| Manage billing | ❌ | ❌ | ✅ | ✅ |
| Delete tenant | ❌ | ❌ | ❌ | ✅ |

### Enterprise Middleware

The `AdvancedMiddleware` handles:
- **Rate limiting** per tenant via Redis sliding window
- **Tenant resolution** from JWT or API key
- **Request ID injection** (`X-Request-ID`) for tracing
- **Idempotency key** enforcement for write operations

---

## 📊 Observability

### Prometheus Metrics

Available at `http://localhost:8000/metrics`

```
saas_api_requests_total{method, endpoint, status_code, tenant}
saas_api_request_duration_seconds{method, endpoint, tenant}
saas_active_websocket_connections
saas_kafka_events_ingested_total
saas_celery_tasks_total{task_name, state}
```

### Grafana Dashboards

Available at `http://localhost:3000` (admin / admin)

Pre-built dashboards:
- **API Performance** — request rates, latency percentiles, error rates
- **Infrastructure Health** — Postgres, Redis, Kafka lag
- **Celery Workers** — task throughput and queue depth

### OpenTelemetry Tracing

All FastAPI requests are automatically traced with spans for:
- Database queries (SQLAlchemy instrumentation)
- Kafka producer/consumer calls
- External HTTP calls
- Celery task execution

---

## 🧪 Testing

```bash
cd saas-backend

# Run all tests
pytest

# With coverage report
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_metrics.py -v

# Run with async support
pytest --asyncio-mode=auto
```

Frontend tests:

```bash
cd saas-frontend

# Unit tests (Vitest)
pnpm test

# Interactive test UI
pnpm test:ui

# E2E tests (Playwright)
pnpm test:e2e
```

---

## 🐳 Deployment

### Production with Docker

```bash
# Build production images
docker-compose -f docker-compose.yml up -d --build

# Scale workers
docker-compose up -d --scale celery=4

# Check health
curl http://localhost:8000/health
```

### Environment Checklist for Production

- [ ] Replace `SECRET_KEY` with a cryptographically random 64-char string
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure real `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- [ ] Point `DATABASE_URL` to a managed PostgreSQL + TimescaleDB instance
- [ ] Enable SSL/TLS on all service connections
- [ ] Set up external Redis (ElastiCache or Upstash)
- [ ] Configure `ALLOWED_ORIGINS` to your frontend domain only
- [ ] Set `ACCESS_TOKEN_EXPIRE_MINUTES=15` (do not increase)
- [ ] Enable Prometheus + Grafana alerting
- [ ] Set up log aggregation (ELK / Loki)

### Frontend Deployment (Vercel)

```bash
cd saas-frontend
pnpm build
# Deploy dist/ to Vercel / Netlify / S3+CloudFront
```

A `vercel.json` is included with SPA routing rules.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- **Backend**: Black + Ruff + isort (enforced via pre-commit)
- **Frontend**: ESLint + Prettier (Tailwind class sorting)

```bash
# Backend formatting
black app/ && isort app/ && ruff check app/

# Frontend formatting
pnpm format && pnpm lint
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ using FastAPI, React, TimescaleDB, and Kafka

⭐ Star this repo if you find it useful!

</div>
