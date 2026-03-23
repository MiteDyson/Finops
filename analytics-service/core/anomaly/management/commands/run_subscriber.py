"""
Custom Django management command.
Run with: python manage.py run_subscriber
"""

from django.core.management.base import BaseCommand
from core.anomaly.subscriber import start_subscriber


class Command(BaseCommand):
    help = 'Start the GCP Pub/Sub subscriber for billing event anomaly detection'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting billing event subscriber...'))
        start_subscriber()
