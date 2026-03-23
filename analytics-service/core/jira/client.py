"""
jira/client.py

Calls Jira's REST API to create a high-priority ticket
when the anomaly detector flags a cost spike.
"""

import json
import logging
import requests

logger = logging.getLogger(__name__)


def create_jira_ticket(jira_domain: str, auth_token: str, issue_details: dict) -> dict:
    url = f"https://{jira_domain}/rest/api/2/issue"

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Basic {auth_token}",
    }

    description = (
        f"*Cost Anomaly Detected*\n\n"
        f"||Field||Value||\n"
        f"|Service|{issue_details['service']}|\n"
        f"|Provider|{issue_details['provider']}|\n"
        f"|Current Cost|${issue_details['cost']:.2f}|\n"
        f"|7-Day Average|${issue_details['average']:.2f}|\n"
        f"|Tenant ID|{issue_details['tenant_id']}|\n\n"
        f"Please investigate and mark resolved once the spike is explained."
    )

    payload = json.dumps({
        "fields": {
            "project": {"key": "FINOPS"},
            "summary": f"Cost Anomaly: {issue_details['service']} spiked to ${issue_details['cost']:.2f}",
            "description": description,
            "issuetype": {"name": "Task"},
            "priority": {"name": "High"},
        }
    })

    try:
        response = requests.post(url, data=payload, headers=headers, timeout=10)
        response.raise_for_status()
        result = response.json()
        logger.info(f"Jira ticket created: {result.get('key')}")
        return result
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to create Jira ticket: {e}")
        return {}
