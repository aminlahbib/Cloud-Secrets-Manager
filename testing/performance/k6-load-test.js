import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * K6 Load Test for Cloud Secrets Manager
 * 
 * Tests core CRUD operations under load
 * Measures latency, throughput, and error rates
 * 
 * Usage:
 *   k6 run testing/performance/k6-load-test.js
 *   k6 run --vus 50 --duration 5m testing/performance/k6-load-test.js
 */

//=============================================================================
// Configuration
//=============================================================================

const BASE_URL = __ENV.BASE_URL || 'https://secrets-staging.yourdomain.com';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'your-jwt-token-here';

//=============================================================================
// Test Stages (Ramp-up/Steady/Ramp-down)
//=============================================================================

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up to 50 VUs
    { duration: '5m', target: 50 },    // Stay at 50 VUs
    { duration: '2m', target: 100 },   // Ramp up to 100 VUs
    { duration: '5m', target: 100 },   // Stay at 100 VUs
    { duration: '2m', target: 0 },     // Ramp down to 0 VUs
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests under 500ms
    http_req_failed: ['rate<0.05'],     // Error rate under 5%
    'http_req_duration{operation:create}': ['p(95)<600'],
    'http_req_duration{operation:read}': ['p(95)<300'],
    'http_req_duration{operation:list}': ['p(95)<400'],
    'http_req_duration{operation:update}': ['p(95)<500'],
    'http_req_duration{operation:delete}': ['p(95)<400'],
  },
};

//=============================================================================
// Custom Metrics
//=============================================================================

const errorRate = new Rate('errors');
const createLatency = new Trend('create_latency', true);
const readLatency = new Trend('read_latency', true);
const updateLatency = new Trend('update_latency', true);
const deleteLatency = new Trend('delete_latency', true);
const listLatency = new Trend('list_latency', true);
const operationCount = new Counter('operations_total');

//=============================================================================
// Helper Functions
//=============================================================================

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`,
};

function generateSecretKey() {
  return `perf_test_secret_${__VU}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function createSecret(key, value) {
  const payload = JSON.stringify({
    key: key,
    value: value,
  });

  const res = http.post(`${BASE_URL}/api/v1/secrets`, payload, {
    headers: headers,
    tags: { operation: 'create' },
  });

  createLatency.add(res.timings.duration);
  operationCount.add(1);

  return check(res, {
    'create: status 201': (r) => r.status === 201,
    'create: has key': (r) => r.json('key') !== undefined,
  });
}

function readSecret(key) {
  const res = http.get(`${BASE_URL}/api/v1/secrets/${key}`, {
    headers: headers,
    tags: { operation: 'read' },
  });

  readLatency.add(res.timings.duration);
  operationCount.add(1);

  return check(res, {
    'read: status 200': (r) => r.status === 200,
    'read: has value': (r) => r.json('encryptedValue') !== undefined,
  });
}

function listSecrets() {
  const res = http.get(`${BASE_URL}/api/v1/secrets?page=0&size=20`, {
    headers: headers,
    tags: { operation: 'list' },
  });

  listLatency.add(res.timings.duration);
  operationCount.add(1);

  return check(res, {
    'list: status 200': (r) => r.status === 200,
    'list: is array': (r) => Array.isArray(r.json('content')),
  });
}

function updateSecret(key, newValue) {
  const payload = JSON.stringify({
    value: newValue,
  });

  const res = http.put(`${BASE_URL}/api/v1/secrets/${key}`, payload, {
    headers: headers,
    tags: { operation: 'update' },
  });

  updateLatency.add(res.timings.duration);
  operationCount.add(1);

  return check(res, {
    'update: status 200': (r) => r.status === 200,
  });
}

function deleteSecret(key) {
  const res = http.del(`${BASE_URL}/api/v1/secrets/${key}`, null, {
    headers: headers,
    tags: { operation: 'delete' },
  });

  deleteLatency.add(res.timings.duration);
  operationCount.add(1);

  return check(res, {
    'delete: status 204 or 200': (r) => r.status === 204 || r.status === 200,
  });
}

function rotateSecret(key) {
  const res = http.post(`${BASE_URL}/api/v1/secrets/${key}/rotate`, null, {
    headers: headers,
    tags: { operation: 'rotate' },
  });

  operationCount.add(1);

  return check(res, {
    'rotate: status 200': (r) => r.status === 200,
  });
}

//=============================================================================
// Test Scenarios
//=============================================================================

export default function () {
  const secretKey = generateSecretKey();
  const secretValue = `test_value_${Date.now()}`;

  // Scenario 1: Full CRUD Lifecycle (60% of traffic)
  if (Math.random() < 0.6) {
    group('Full CRUD Lifecycle', () => {
      // Create
      const created = createSecret(secretKey, secretValue);
      if (!created) {
        errorRate.add(1);
        return;
      }
      errorRate.add(0);

      sleep(0.5);

      // Read
      const read = readSecret(secretKey);
      if (!read) errorRate.add(1);
      else errorRate.add(0);

      sleep(0.5);

      // Update
      const updated = updateSecret(secretKey, secretValue + '_updated');
      if (!updated) errorRate.add(1);
      else errorRate.add(0);

      sleep(0.5);

      // Read again to verify update
      const readAfterUpdate = readSecret(secretKey);
      if (!readAfterUpdate) errorRate.add(1);
      else errorRate.add(0);

      sleep(0.5);

      // Delete
      const deleted = deleteSecret(secretKey);
      if (!deleted) errorRate.add(1);
      else errorRate.add(0);
    });
  }

  // Scenario 2: Read-Heavy (30% of traffic)
  else if (Math.random() < 0.9) {
    group('Read-Heavy Scenario', () => {
      // Create once
      const created = createSecret(secretKey, secretValue);
      if (!created) {
        errorRate.add(1);
        return;
      }
      errorRate.add(0);

      sleep(0.2);

      // Read multiple times (simulating multiple consumers)
      for (let i = 0; i < 5; i++) {
        const read = readSecret(secretKey);
        if (!read) errorRate.add(1);
        else errorRate.add(0);
        sleep(0.1);
      }

      // Cleanup
      deleteSecret(secretKey);
    });
  }

  // Scenario 3: List Operations (10% of traffic)
  else {
    group('List Operations', () => {
      const listed = listSecrets();
      if (!listed) errorRate.add(1);
      else errorRate.add(0);
    });
  }

  sleep(1);
}

//=============================================================================
// Teardown
//=============================================================================

export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total operations: ${operationCount.value}`);
}

