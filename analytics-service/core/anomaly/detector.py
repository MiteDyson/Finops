"""
anomaly/detector.py

Core anomaly detection logic.
Compares incoming spend against 7-day moving average.
If cost exceeds ANOMALY_THRESHOLD_MULTIPLIER x average, it flags an anomaly
and triggers a Jira ticket via the jira module.
"""

import json
import logging
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
from django.conf import settings

from core.jira.client import create_jira_ticket

logger = logging.getLogger(__name__)


def get_db_connection():
    """Open a direct psycopg2 connection to Supabase."""
    return psycopg2.connect(settings.DATABASES['default']['NAME']
                            if 'sqlite' in settings.DATABASES['default'].get('ENGINE', '')
                            else _build_dsn())


def _build_dsn():
    db = settings.DATABASES['default']
    return (
        f"host={db.get('HOST', 'localhost')} "
        f"port={db.get('PORT', 5432)} "
        f"dbname={db.get('NAME', 'postgres')} "
        f"user={db.get('USER', 'postgres')} "
        f"password={db.get('PASSWORD', '')} "
        f"sslmode=require"
    )


def get_7day_average(conn, tenant_id: str, service_name: str) -> float:
    """
    Calculate the average daily spend for a given tenant + service
    over the past 7 days. Returns 0.0 if no history exists yet.
    """
    since = datetime.utcnow() - timedelta(days=7)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COALESCE(AVG(cost), 0)
            FROM cloud_expenses
            WHERE tenant_id = %s
              AND service_name = %s
              AND recorded_at >= %s
            """,
            (tenant_id, service_name, since),
        )
        row = cur.fetchone()
        return float(row[0]) if row else 0.0


def save_expense(conn, tenant_id: str, provider: str, service_name: str, cost: float):
    """Persist the incoming billing event to Supabase."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO cloud_expenses (tenant_id, provider, service_name, cost)
            VALUES (%s, %s, %s, %s)
            """,
            (tenant_id, provider, service_name, cost),
        )
    conn.commit()


def get_tenant(conn, tenant_id: str) -> dict:
    """Fetch tenant config (needed to get Jira credentials)."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            "SELECT * FROM tenants WHERE id = %s",
            (tenant_id,),
        )
        return cur.fetchone()


def process_billing_event(message_data: dict):
    """
    Main entry point called by the Pub/Sub subscriber.

    1. Save the expense to Supabase.
    2. Calculate 7-day moving average for the same service.
    3. If cost > threshold * average → create Jira ticket.
    """
    tenant_id = message_data.get('tenantId')
    provider = message_data.get('provider')
    service_name = message_data.get('serviceName')
    cost = float(message_data.get('cost', 0))

    logger.info(f"Processing event: tenant={tenant_id}, service={service_name}, cost={cost}")

    conn = get_db_connection()

    try:
        # Step 1: Save to DB
        save_expense(conn, tenant_id, provider, service_name, cost)

        # Step 2: Get 7-day average
        avg = get_7day_average(conn, tenant_id, service_name)
        threshold = settings.ANOMALY_THRESHOLD_MULTIPLIER

        logger.info(f"7-day avg for {service_name}: {avg:.2f}, threshold: {threshold}x")

        # Step 3: Check for anomaly
        if avg > 0 and cost > (avg * threshold):
            logger.warning(
                f"ANOMALY DETECTED: {service_name} cost ${cost:.2f} "
                f"exceeds {threshold}x avg (${avg:.2f})"
            )

            tenant = get_tenant(conn, tenant_id)

            if tenant and tenant.get('jira_domain') and tenant.get('jira_auth_token'):
                create_jira_ticket(
                    jira_domain=tenant['jira_domain'],
                    auth_token=tenant['jira_auth_token'],
                    issue_details={
                        'service': service_name,
                        'provider': provider,
                        'cost': cost,
                        'average': avg,
                        'tenant_id': tenant_id,
                    },
                )
            else:
                logger.warning(f"Tenant {tenant_id} has no Jira config — skipping ticket creation")

    except Exception as e:
        logger.error(f"Error processing billing event: {e}")
        conn.rollback()
    finally:
        conn.close()
