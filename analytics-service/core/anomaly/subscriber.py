"""
anomaly/subscriber.py

GCP Pub/Sub subscriber.
Run this as a background process: python manage.py run_subscriber
It pulls messages from the 'billing-events-sub' subscription
and passes each one to the anomaly detector.
"""

import json
import logging
import os

from google.cloud import pubsub_v1
from django.conf import settings

from core.anomaly.detector import process_billing_event

logger = logging.getLogger(__name__)


def start_subscriber():
    """
    Blocking call that continuously pulls messages from Pub/Sub
    and processes them through the anomaly detector.
    """
    project_id = settings.GCP_PROJECT_ID
    subscription_id = settings.GCP_SUBSCRIPTION_ID

    if not project_id:
        logger.error("GCP_PROJECT_ID is not set. Subscriber cannot start.")
        return

    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    def callback(message):
        try:
            data = json.loads(message.data.decode('utf-8'))
            logger.info(f"Received message: {data}")
            process_billing_event(data)
            message.ack()  # Acknowledge so Pub/Sub doesn't redeliver
        except Exception as e:
            logger.error(f"Failed to process message: {e}")
            message.nack()  # Nack so Pub/Sub retries

    logger.info(f"Subscribing to {subscription_path}...")

    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)

    with subscriber:
        try:
            streaming_pull_future.result()  # Block forever
        except KeyboardInterrupt:
            streaming_pull_future.cancel()
            logger.info("Subscriber stopped.")
