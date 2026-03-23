# FinOps SaaS — Cloud Cost Anomaly Resolution Platform

A multi-tenant microservices architecture for monitoring cloud spend and auto-creating Jira tickets when anomalies are detected.

## Architecture

```
[Cloud Billing Webhooks]
         │
         ▼
 ingestion-service        ← Express.js (port 3001)
 Catches webhooks, pushes to GCP Pub/Sub
         │
         ▼
  GCP Pub/Sub
  (billing-events topic)
         │
         ▼
 analytics-service        ← Django (port 8000)
 Subscribes to Pub/Sub, runs anomaly detection,
 creates Jira tickets via REST API
         │
         ▼
    Supabase (PostgreSQL)
         │
         ▼
  gateway-service         ← NestJS + GraphQL (port 3000)
  Serves GraphQL API to the frontend dashboard
```

## Setup

### 1. Supabase — run this SQL in the Supabase SQL Editor

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    jira_domain TEXT,
    jira_auth_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cloud_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    service_name TEXT NOT NULL,
    cost NUMERIC(10, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_expenses ENABLE ROW LEVEL SECURITY;
```

### 2. gateway-service (NestJS)

```bash
cd gateway-service
npm install
cp .env.example .env   # fill in your DATABASE_URL
npm run start:dev
# GraphQL playground → http://localhost:3000/graphql
```

### 3. ingestion-service (Express)

```bash
cd ingestion-service
npm install
cp .env.example .env   # fill in GCP_PROJECT_ID
npm run dev
# Webhook endpoint → POST http://localhost:3001/api/webhooks/billing
# Test spike      → POST http://localhost:3001/api/test/simulate-spike
```

### 4. analytics-service (Django)

```bash
cd analytics-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in DATABASE_URL and GCP_PROJECT_ID
python manage.py migrate
python manage.py runserver  # REST API on port 8000
python manage.py run_subscriber  # Start Pub/Sub listener (separate terminal)
```

## GraphQL Example Queries

```graphql
# Create a tenant
mutation {
  createTenant(createTenantInput: {
    companyName: "Acme Corp"
    jiraDomain: "acme.atlassian.net"
    jiraAuthToken: "your-base64-token"
  }) {
    id
    companyName
  }
}

# Get all expenses for a tenant
query {
  getTenantExpenses(tenantId: "your-tenant-uuid") {
    id
    provider
    serviceName
    cost
    recordedAt
  }
}
```

## Tech Stack

| Service | Tech |
|---|---|
| API Gateway | NestJS + GraphQL + TypeORM |
| Ingestion | Express.js + GCP Pub/Sub |
| Analytics | Django + psycopg2 |
| Database | PostgreSQL via Supabase |
| Messaging | GCP Pub/Sub |
| Ticketing | Jira REST API |
