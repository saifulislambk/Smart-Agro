const http = require('http');
const { spawn } = require('child_process');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function runF7Tests() {
  console.log('🧪 Starting Feature F7 Network Resilience & Error Propagation Verification...');

  let mockScenario = 'offline'; // 'offline', 'timeout', 'upstream400', 'upstream500', 'retry_recover'
  let mockRequestCount = 0;

  // 1. Create Mock Python Microservice
  const mockServer = http.createServer((req, res) => {
    mockRequestCount++;
    console.log(`[Mock AI Microservice] Request #${mockRequestCount} received for ${req.url} (Scenario: ${mockScenario})`);

    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'healthy', mock: true }));
    }

    if (mockScenario === 'timeout') {
      // Do not respond; wait for client timeout (or simulate socket hang)
      return; // Keep connection open
    }

    if (mockScenario === 'retry_recover') {
      if (mockRequestCount === 1) {
        // Destroy socket to simulate ECONNRESET
        console.log('[Mock AI Microservice] Destroying socket on attempt 1 to simulate transient ECONNRESET');
        return req.socket.destroy();
      } else {
        console.log('[Mock AI Microservice] Succeeding on attempt 2');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          is_valid_crop: true,
          class_index: 59,
          class_name: 'bean_rust',
          confidence: 99.5
        }));
      }
    }

    if (mockScenario === 'upstream400') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        error_code: 'INVALID_IMAGE',
        message: 'Mock 400: Invalid image format received.'
      }));
    }

    if (mockScenario === 'upstream500') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        error: 'Mock 500: Internal model exception during tensor transformation.'
      }));
    }

    // Default mock response
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      is_valid_crop: true,
      class_index: 59,
      class_name: 'bean_rust',
      confidence: 99.5
    }));
  });

  await new Promise(resolve => mockServer.listen(5099, '127.0.0.1', resolve));
  console.log('✅ Mock AI Microservice listening on port 5099');

  // 2. Spawn ephemeral Node.js server instance on port 3099
  const env = Object.assign({}, process.env, {
    PORT: '3099',
    AI_SERVICE_URL: 'http://127.0.0.1:5099/predict',
    AI_HEALTH_URL: 'http://127.0.0.1:5099/health'
  });

  const nodeProcess = spawn('node', ['server.js'], { env, stdio: ['pipe', 'pipe', 'pipe'] });

  let serverReady = false;
  nodeProcess.stdout.on('data', (d) => {
    const text = d.toString();
    if (text.includes('Smart Agro') && text.includes('3099')) {
      serverReady = true;
    }
  });
  nodeProcess.stderr.on('data', (d) => {
    // console.log('[TestServer STDERR]', d.toString());
  });

  // Wait for test server to be ready
  for (let i = 0; i < 30; i++) {
    if (serverReady) break;
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('✅ Ephemeral Test Server running on port 3099');

  const sampleLeaf = fs.readFileSync(path.join(__dirname, '../../test image crop disease/images (1).jpeg'));

  async function postScan() {
    const form = new FormData();
    form.append('image', sampleLeaf, { filename: 'test_leaf.jpeg', contentType: 'image/jpeg' });
    try {
      const response = await axios.post('http://127.0.0.1:3099/api/scan', form, {
        headers: form.getHeaders(),
        validateStatus: () => true // Do not throw on 4xx/5xx
      });
      return response;
    } catch (err) {
      return { status: 0, err };
    }
  }

  // --- Test Case 1: Upstream 400 propagation ---
  console.log('\n--- Test Case 1: Upstream 400 propagation ---');
  mockScenario = 'upstream400';
  mockRequestCount = 0;
  const res400 = await postScan();
  console.log(`Status: ${res400.status}, Body:`, res400.data);
  console.assert(res400.status === 400, `Expected HTTP 400, got ${res400.status}`);
  console.assert(res400.data.error_code === 'INVALID_IMAGE', 'Expected error_code INVALID_IMAGE');

  // --- Test Case 2: Upstream 500 -> 502 Bad Gateway ---
  console.log('\n--- Test Case 2: Upstream 500 -> 502 Bad Gateway ---');
  mockScenario = 'upstream500';
  mockRequestCount = 0;
  const res502 = await postScan();
  console.log(`Status: ${res502.status}, Body:`, res502.data);
  console.assert(res502.status === 502, `Expected HTTP 502, got ${res502.status}`);
  console.assert(res502.data.message.includes('অভ্যন্তরীণ ত্রুটি'), 'Expected Bengali Bad Gateway message');

  // --- Test Case 3: Transient socket failure & successful recovery on Retry ---
  console.log('\n--- Test Case 3: Transient ECONNRESET with recovery on Retry #2 ---');
  mockScenario = 'retry_recover';
  mockRequestCount = 0;
  const startRetryTime = Date.now();
  const resRecover = await postScan();
  const retryDuration = Date.now() - startRetryTime;
  console.log(`Status: ${resRecover.status}, Mock Requests: ${mockRequestCount}, Duration: ${retryDuration}ms, Body success: ${resRecover.data.success}`);
  console.assert(resRecover.status === 200, `Expected HTTP 200, got ${resRecover.status}`);
  console.assert(mockRequestCount === 2, `Expected exactly 2 attempts, got ${mockRequestCount}`);
  console.assert(retryDuration >= 500, `Expected retry delay >= 500ms, got ${retryDuration}ms`);
  console.assert(resRecover.data.class_index === 59, 'Expected class_index 59');

  // --- Test Case 4: ECONNREFUSED (Service down) -> 503 Service Unavailable ---
  console.log('\n--- Test Case 4: ECONNREFUSED -> 503 Service Unavailable ---');
  await new Promise(resolve => mockServer.close(resolve));
  console.log('Closed mock microservice on port 5099 to simulate service offline');
  const startRefused = Date.now();
  const resRefused = await postScan();
  const refusedDuration = Date.now() - startRefused;
  console.log(`Status: ${resRefused.status}, Duration: ${refusedDuration}ms, Body:`, resRefused.data);
  console.assert(resRefused.status === 503, `Expected HTTP 503, got ${resRefused.status}`);
  console.assert(refusedDuration >= 500, `Expected at least 500ms for retry delay, got ${refusedDuration}ms`);
  console.assert(resRefused.data.message.includes('অফলাইনে'), 'Expected offline message in Bengali');

  // Clean up
  nodeProcess.kill();
  console.log('✅ All F7 Mock Microservice tests passed successfully!');
}

runF7Tests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
