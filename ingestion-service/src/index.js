require('dotenv').config();
const express = require('express');
const { PubSub } = require('@google-cloud/pubsub');

const app = express();
app.use(express.json());

const pubSubClient = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
});

const BILLING_TOPIC = 'billing-events';
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'ingestion-service' });
});

// ─────────────────────────────────────────────
// Billing webhook — receives events from GCP billing,
// AWS Cost Explorer webhooks, or Stripe billing alerts.
// Instantly pushes to Pub/Sub so we never block the sender.
// ─────────────────────────────────────────────
app.post('/api/webhooks/billing', async (req, res) => {
  const { tenantId, provider, serviceName, cost } = req.body;

  // Basic validation
  if (!tenantId || !provider || !serviceName || cost === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: tenantId, provider, serviceName, cost',
    });
  }

  const payload = JSON.stringify({
    tenantId,
    provider,       // 'GCP' | 'AWS' | 'Stripe'
    serviceName,
    cost: parseFloat(cost),
    receivedAt: new Date().toISOString(),
  });

  const dataBuffer = Buffer.from(payload);

  try {
    // Publish to Pub/Sub — Django analytics-service subscribes to this topic
    const messageId = await pubSubClient
      .topic(BILLING_TOPIC)
      .publishMessage({ data: dataBuffer });

    console.log(`[ingestion] Published message ${messageId} for tenant ${tenantId}`);

    // Respond 200 immediately so the webhook sender doesn't time out
    return res.status(200).json({ success: true, messageId });
  } catch (error) {
    console.error('[ingestion] Pub/Sub publish error:', error.message);
    return res.status(500).json({ error: 'Failed to publish event' });
  }
});

// ─────────────────────────────────────────────
// Mock endpoint — simulate a billing spike for local testing
// POST /api/test/simulate-spike
// Body: { tenantId, provider, serviceName, cost }
// ─────────────────────────────────────────────
app.post('/api/test/simulate-spike', async (req, res) => {
  const mockPayload = {
    tenantId: req.body.tenantId || 'test-tenant-id',
    provider: req.body.provider || 'GCP',
    serviceName: req.body.serviceName || 'Cloud Run',
    cost: req.body.cost || 9999.99,
    receivedAt: new Date().toISOString(),
  };

  const dataBuffer = Buffer.from(JSON.stringify(mockPayload));

  try {
    const messageId = await pubSubClient
      .topic(BILLING_TOPIC)
      .publishMessage({ data: dataBuffer });

    console.log(`[ingestion] Simulated spike published: ${messageId}`);
    return res.status(200).json({ success: true, messageId, payload: mockPayload });
  } catch (error) {
    console.error('[ingestion] Simulate spike error:', error.message);
    return res.status(500).json({ error: 'Failed to publish simulated event' });
  }
});

app.listen(PORT, () => {
  console.log(`Ingestion service running on http://localhost:${PORT}`);
});
