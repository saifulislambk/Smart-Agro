#!/usr/bin/env node
/**
 * Smart Agro (স্মার্ট এগ্রো) - Automated Local Production Smoke Verification
 *
 * Requirements Verified:
 * 1. Web server build and boot initialization
 * 2. GET /api/health returns HTTP 200 with status "online" & zero-credential in-memory DB fallback
 * 3. OPTIONS and GET requests return 'access-control-allow-origin: *'
 * 4. GET /api/weather returns HTTP 200 with structured JSON
 * 5. POST /api/fertilizer-calc returns HTTP 200 with valid BARC calculations
 * 6. GET /api/guides & GET /api/guides/tomato return HTTP 200 with rich catalog
 * 7. POST /api/scan with synthetic image buffer proxies to mock AI service and returns HTTP 200 diagnosis
 * 8. POST /api/scan with non-image returns HTTP 400 INVALID_IMAGE
 *
 * Runs self-contained on ephemeral ports (Web: 3099, Mock AI: 5099) without external credentials.
 */

const http = require('http');
const { spawn, execSync } = require('child_process');
const path = require('path');
const FormData = require('form-data');

const WEB_PORT = 3099;
const MOCK_AI_PORT = 5099;

let mockServer = null;
let nodeProcess = null;

// Synthetic 1x1 JPEG with valid magic bytes (0xFF 0xD8 0xFF) and standard JFIF header
const SYNTHETIC_JPEG = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
  0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
  0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
  0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
  0x00, 0x7F, 0xFF, 0xD9
]);

const NON_IMAGE_BUFFER = Buffer.from('NOT_AN_IMAGE_FILE_BUFFER_FOR_TESTING_MAGIC_BYTE_REJECTION');

// HTTP helper that bypasses proxy and handles JSON parsing
function httpRequest({ method = 'GET', path = '/', headers = {}, body = null, host = '127.0.0.1', port = WEB_PORT }) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host,
      port,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', reject);

    if (body) {
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === 'string') {
        req.write(body);
      } else if (typeof body === 'object') {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

// Multipart POST helper
function httpMultipartPost({ path = '/api/scan', buffer, filename, contentType, fields = {}, host = '127.0.0.1', port = WEB_PORT }) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('image', buffer, { filename, contentType });
    for (const [key, val] of Object.entries(fields)) {
      form.append(key, val);
    }

    const req = http.request({
      host,
      port,
      path,
      method: 'POST',
      headers: form.getHeaders()
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

function cleanup() {
  if (nodeProcess) {
    try {
      nodeProcess.kill('SIGTERM');
    } catch (_) {}
    nodeProcess = null;
  }
  if (mockServer) {
    try {
      mockServer.close();
    } catch (_) {}
    mockServer = null;
  }
}

process.on('SIGINT', () => { cleanup(); process.exit(1); });
process.on('SIGTERM', () => { cleanup(); process.exit(1); });

async function runSmokeTests() {
  console.log('🌾 ===============================================================');
  console.log('🌾 Smart Agro (স্মার্ট এগ্রো) - Automated Local Production Smoke Suite');
  console.log('🌾 ===============================================================\n');

  // Step 1: Verify production build script
  console.log('📦 Step 1: Verifying production build script (npm run build)...');
  try {
    const buildOutput = execSync('npm run build', {
      cwd: path.resolve(__dirname, '../..'),
      encoding: 'utf8'
    });
    console.log(`   Output: ${buildOutput.trim()}`);
    console.log('   ✅ Build script executed successfully.\n');
  } catch (err) {
    console.error('   ❌ Build script failed:', err.message);
    process.exit(1);
  }

  // Step 2: Start Mock AI Microservice on Port 5099
  console.log(`🤖 Step 2: Starting in-process Mock Python AI Microservice on port ${MOCK_AI_PORT}...`);
  mockServer = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'healthy',
        framework: 'MockTensorFlow/Keras',
        model_loaded: true,
        num_classes: 67,
        service: 'smart_agro_ai_microservice'
      }));
    }

    if (req.url === '/predict' && req.method === 'POST') {
      // Consume request body stream
      let bodyData = [];
      req.on('data', chunk => bodyData.push(chunk));
      req.on('end', () => {
        // Return valid mock diagnosis for Tomato___Early_blight (Class 47)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          is_valid_crop: true,
          class_index: 47,
          class_name: 'Tomato___Early_blight',
          confidence: 98.42,
          margin: 95.10,
          top_candidates: [
            { class_name: 'Tomato___Early_blight', confidence: 98.42 },
            { class_name: 'Tomato___healthy', confidence: 1.15 }
          ]
        }));
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  await new Promise((resolve) => mockServer.listen(MOCK_AI_PORT, '127.0.0.1', resolve));
  console.log(`   ✅ Mock AI Microservice listening on http://127.0.0.1:${MOCK_AI_PORT}\n`);

  // Step 3: Spawn Ephemeral Node.js Express Server on Port 3099
  console.log(`🚀 Step 3: Spawning ephemeral Smart Agro Express server on port ${WEB_PORT}...`);
  const serverEnv = Object.assign({}, process.env, {
    PORT: String(WEB_PORT),
    NODE_ENV: 'test',
    AI_SERVICE_URL: `http://127.0.0.1:${MOCK_AI_PORT}/predict`,
    AI_HEALTH_URL: `http://127.0.0.1:${MOCK_AI_PORT}/health`,
    AI_TIMEOUT_MS: '15000',
    DATABASE_URL: '', // Intentionally blank to verify zero-cost in-memory fallback
    OPENWEATHER_API_KEY: '' // Intentionally blank to verify Bangladesh 64-district simulation
  });

  nodeProcess = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '../..'),
    env: serverEnv,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let serverStarted = false;
  nodeProcess.stdout.on('data', (d) => {
    const msg = d.toString();
    if (msg.includes('Smart Agro') && msg.includes(String(WEB_PORT))) {
      serverStarted = true;
    }
  });

  // Wait for web server to become ready (poll /api/health)
  let bootAttempts = 0;
  while (bootAttempts < 30) {
    bootAttempts++;
    try {
      const ping = await httpRequest({ path: '/api/health', port: WEB_PORT });
      if (ping.statusCode === 200) {
        break;
      }
    } catch (_) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`   ✅ Web server successfully initialized and booted on http://127.0.0.1:${WEB_PORT}\n`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`   ❌ Assertion Failed: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`   ✅ Passed: ${message}`);
  }

  // --- Test Suite Execution ---
  console.log('🧪 Step 4: Executing API & CORS Functional Validations...');

  // Test 1: GET /api/health
  console.log('\n[Test 1] GET /api/health (Server Status & In-Memory Mode)');
  const healthRes = await httpRequest({ path: '/api/health' });
  assert(healthRes.statusCode === 200, 'HTTP status is 200');
  assert(healthRes.json && healthRes.json.status === 'online', 'Status is "online"');
  assert(healthRes.json && healthRes.json.postgresConnected === false, 'Zero-cost in-memory fallback active (postgresConnected === false)');
  assert(healthRes.json && healthRes.json.appName.includes('Smart Agro'), 'appName matches "Smart Agro"');

  // Test 2: CORS Headers Verification (OPTIONS & GET)
  console.log('\n[Test 2] CORS Headers Verification (OPTIONS & GET)');
  const optionsRes = await httpRequest({
    method: 'OPTIONS',
    path: '/api/health',
    headers: {
      Origin: 'https://mobile.smartagro.app',
      'Access-Control-Request-Method': 'POST'
    }
  });
  assert(
    optionsRes.headers['access-control-allow-origin'] === '*',
    'OPTIONS returns access-control-allow-origin: *'
  );

  const corsGetRes = await httpRequest({
    method: 'GET',
    path: '/api/health',
    headers: { Origin: 'https://mobile.smartagro.app' }
  });
  assert(
    corsGetRes.headers['access-control-allow-origin'] === '*',
    'GET returns access-control-allow-origin: *'
  );

  // Test 3: GET /api/weather
  console.log('\n[Test 3] GET /api/weather (Simulated Local Meteorology)');
  const weatherRes = await httpRequest({ path: '/api/weather?district=dhaka' });
  assert(weatherRes.statusCode === 200, 'HTTP status is 200');
  assert(weatherRes.json && weatherRes.json.success === true, 'Response contains success: true');
  assert(weatherRes.json && weatherRes.json.weather && typeof weatherRes.json.weather.temp === 'number', 'Weather temperature is present and numeric');
  assert(weatherRes.json && weatherRes.json.spraying && weatherRes.json.spraying.window_bn, 'Agro-meteorological spraying advisory is present');
  assert(weatherRes.json && weatherRes.json.alert && weatherRes.json.alert.message, 'Agro-meteorological alert is present');
  assert(weatherRes.json && Array.isArray(weatherRes.json.forecast) && weatherRes.json.forecast.length > 0, 'Forecast array contains entries');

  // Test 4: POST /api/fertilizer-calc
  console.log('\n[Test 4] POST /api/fertilizer-calc (BARC Dual Engine Calculation)');
  const fertRes = await httpRequest({
    method: 'POST',
    path: '/api/fertilizer-calc',
    headers: { 'Content-Type': 'application/json' },
    body: {
      crop_name: 'টমেটো',
      land_amount: 10,
      land_unit: 'শতক (decimal)',
      calc_mode: 'land_area'
    }
  });
  assert(fertRes.statusCode === 200, 'HTTP status is 200');
  assert(fertRes.json && fertRes.json.success === true, 'Fertilizer response contains success: true');
  assert(fertRes.json && fertRes.json.data && (fertRes.json.data.urea_kg !== undefined || fertRes.json.data.urea !== undefined), 'Urea dosage calculation present');
  assert(fertRes.json && fertRes.json.data && (fertRes.json.data.tsp_kg !== undefined || fertRes.json.data.tsp !== undefined), 'TSP dosage calculation present');
  assert(fertRes.json && fertRes.json.data && (fertRes.json.data.mop_kg !== undefined || fertRes.json.data.mop !== undefined), 'MOP dosage calculation present');
  assert(fertRes.json && Array.isArray(fertRes.json.data.split_instructions), 'Split fertilizer application instructions present');

  // Test 5: GET /api/guides & GET /api/guides/tomato
  console.log('\n[Test 5] GET /api/guides & GET /api/guides/tomato (Crop Catalog)');
  const guidesRes = await httpRequest({ path: '/api/guides' });
  assert(guidesRes.statusCode === 200, 'GET /api/guides returns HTTP 200');
  assert(guidesRes.json && guidesRes.json.success === true, 'Catalog response success is true');
  assert(guidesRes.json && Array.isArray(guidesRes.json.data) && guidesRes.json.data.length >= 25, 'Catalog has at least 25 crop guides');

  const tomatoGuideRes = await httpRequest({ path: '/api/guides/tomato' });
  assert(tomatoGuideRes.statusCode === 200, 'GET /api/guides/tomato returns HTTP 200');
  assert(tomatoGuideRes.json && tomatoGuideRes.json.success === true, 'Single crop guide success is true');
  assert(tomatoGuideRes.json && tomatoGuideRes.json.data.crop_id === 'tomato', 'Guide crop_id matches "tomato"');
  assert(tomatoGuideRes.json.data.crop_name_bn && tomatoGuideRes.json.data.crop_name_bn.includes('টমেটো'), 'Guide Bengali crop name contains "টমেটো"');

  // Test 6: POST /api/scan with Synthetic Image Buffer (AI Proxying & Diagnosis)
  console.log('\n[Test 6] POST /api/scan (Valid Synthetic Image -> AI Microservice Proxy)');
  const scanSuccessRes = await httpMultipartPost({
    path: '/api/scan',
    buffer: SYNTHETIC_JPEG,
    filename: 'tomato_leaf.jpg',
    contentType: 'image/jpeg',
    fields: {
      crop_name: 'টমেটো',
      district: 'কুমিল্লা'
    }
  });

  assert(scanSuccessRes.statusCode === 200, 'POST /api/scan returns HTTP 200');
  assert(scanSuccessRes.json && scanSuccessRes.json.success === true, 'Diagnosis response success is true');
  assert(
    scanSuccessRes.json.crop_name === 'Tomato' || scanSuccessRes.json.crop_name_bn === 'টমেটো',
    'Diagnosed crop_name is Tomato / টমেটো'
  );
  assert(
    (scanSuccessRes.json.disease_name_bn && scanSuccessRes.json.disease_name_bn.includes('আর্লি ব্লাইট')) ||
    (scanSuccessRes.json.data && scanSuccessRes.json.data.disease_bn && scanSuccessRes.json.data.disease_bn.includes('আর্লি ব্লাইট')),
    'Diagnosed disease contains "আর্লি ব্লাইট"'
  );
  assert(scanSuccessRes.json.confidence >= 90, 'Confidence score exceeds 90%');
  assert(
    (scanSuccessRes.json.chemical_solution !== undefined) || (scanSuccessRes.json.data && scanSuccessRes.json.data.chemical_solution !== undefined),
    'Chemical advisory solution returned'
  );
  assert(
    (scanSuccessRes.json.organic_solution !== undefined) || (scanSuccessRes.json.data && scanSuccessRes.json.data.organic_solution !== undefined),
    'Organic advisory solution returned'
  );

  // Test 7: POST /api/scan with Non-Image Buffer (Format Rejection)
  console.log('\n[Test 7] POST /api/scan (Non-Image Buffer -> Magic Byte Rejection)');
  const scanRejectRes = await httpMultipartPost({
    path: '/api/scan',
    buffer: NON_IMAGE_BUFFER,
    filename: 'document.txt',
    contentType: 'text/plain',
    fields: { crop_name: 'টমেটো' }
  });

  assert(scanRejectRes.statusCode === 400, 'POST /api/scan with non-image returns HTTP 400');
  assert(scanRejectRes.json && scanRejectRes.json.success === false, 'Error response contains success: false');
  assert(scanRejectRes.json && scanRejectRes.json.error_code === 'INVALID_IMAGE', 'Error code matches "INVALID_IMAGE"');

  // Teardown
  console.log('\n🧹 Step 5: Gracefully shutting down ephemeral test processes...');
  cleanup();

  console.log('\n🌾 ===============================================================');
  console.log(`🌾 ALL CHECKS PASSED: ${passedTests}/${totalTests} assertions verified successfully.`);
  console.log('🌾 Production readiness & mobile compatibility confirmed.');
  console.log('🌾 ===============================================================\n');
  process.exit(0);
}

runSmokeTests().catch((err) => {
  console.error('\n❌ Fatal error in smoke test suite:', err);
  cleanup();
  process.exit(1);
});
