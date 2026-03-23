from rest_framework.decorators import api_view
from rest_framework.response import Response
from .client import create_jira_ticket

@api_view(['POST'])
def test_ticket(request):
    """
    Test endpoint to manually trigger a Jira ticket.
    POST body: { jira_domain, auth_token, service, provider, cost, average, tenant_id }
    """
    data = request.data
    result = create_jira_ticket(
        jira_domain=data.get('jira_domain'),
        auth_token=data.get('auth_token'),
        issue_details={
            'service': data.get('service', 'Test Service'),
            'provider': data.get('provider', 'GCP'),
            'cost': float(data.get('cost', 0)),
            'average': float(data.get('average', 0)),
            'tenant_id': data.get('tenant_id', 'test'),
        },
    )
    return Response(result)
