/**
 * E2E Robustness & Performance Verification Suite (Milestone M4.2)
 *
 * Verifies:
 * 1. Direct API Evaluation across positive images:
 *    - test image crop disease/images.jpeg
 *    - test image crop disease/images (1).jpeg
 *    - test image crop disease/images (2).jpeg
 *    - test image crop disease/images (3).jpeg
 *    - public/uploads/sample_tomato.jpg
 * 2. Direct API Evaluation across negative images:
 *    - tractor_test.jpg -> NON_LEAF_OBJECT, image_path: null
 *    - potato_tuber_test.jpg -> NON_LEAF_OBJECT, image_path: null
 *    - sample_rice.jpg (crop_type=rice) -> UNSUPPORTED_CROP_SPECIES, image_path: null
 *    - sample_eggplant.jpg (crop_type=eggplant) -> UNSUPPORTED_CROP_SPECIES, image_path: null
 *    - package.json -> HTTP 400 INVALID_IMAGE, image_path: null
 * 3. Empirical Storage Leak Audit across negative uploads.
 * 4. Adversarial Challenge Suite Execution against live server.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const FormData = require('form-data');
const axios = require('axios');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'public', 'uploads');
const AI_PORT = 5098;
const SERVER_PORT = 3098;
const BASE_URL = `http://127.0.0.1:${SERVER_PORT}`;

let pyProcess = null;
let nodeProcess = null;

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
    failures.push(message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForUrl(url, timeoutMs = 35000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get(url, { timeout: 1500, proxy: false });
      if (res.status === 200) return true;
    } catch (e) {
      // wait and retry
    }
    await sleep(500);
  }
  return false;
}

async function uploadFile(endpoint, filePath, fields = {}) {
  const form = new FormData();
  form.append('image', fs.createReadStream(filePath), {
    filename: path.basename(filePath)
  });
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }

  try {
    const res = await axios.post(`${BASE_URL}${endpoint}`, form, {
      headers: form.getHeaders(),
      timeout: 25000,
      proxy: false,
      validateStatus: () => true
    });
    return { status: res.status, data: res.data };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function uploadBuffer(endpoint, buffer, filename, fields = {}) {
  const form = new FormData();
  form.append('image', buffer, { filename });
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }

  try {
    const res = await axios.post(`${BASE_URL}${endpoint}`, form, {
      headers: form.getHeaders(),
      timeout: 25000,
      proxy: false,
      validateStatus: () => true
    });
    return { status: res.status, data: res.data };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function main() {
  console.log('================================================================');
  console.log('🌾 Reviewer M4.2: Live End-to-End Robustness & Rejection Suite');
  console.log('================================================================\n');

  try {
    // 1. Spawn Python AI Microservice
    console.log(`🚀 Starting Python AI microservice on 127.0.0.1:${AI_PORT}...`);
    const pyBin = '/home/saiful_islam_bk/crop_disease_api/venv/bin/python';
    const pyScript = "from ai_service.app import app; app.run(host='127.0.0.1', port=" + AI_PORT + ", debug=False)";
    
    pyProcess = spawn(pyBin, ['-c', pyScript], {
      cwd: PROJECT_ROOT,
      env: Object.assign({}, process.env, {
        TF_CPP_MIN_LOG_LEVEL: '2',
        NO_PROXY: '*',
        no_proxy: '*'
      })
    });

    pyProcess.stderr.on('data', d => {
      const s = d.toString();
      if (s.includes('Running on')) {
        console.log(`[AI Microservice] ${s.trim()}`);
      }
    });

    const aiReady = await waitForUrl(`http://127.0.0.1:${AI_PORT}/health`, 35000);
    assert(aiReady, `Python AI Microservice healthy on port ${AI_PORT}`);
    if (!aiReady) throw new Error('AI microservice failed to start');

    // 2. Spawn Node.js Backend Server
    console.log(`🚀 Starting Node.js Express server on 127.0.0.1:${SERVER_PORT}...`);
    nodeProcess = spawn('node', ['server.js'], {
      cwd: PROJECT_ROOT,
      env: Object.assign({}, process.env, {
        PORT: String(SERVER_PORT),
        AI_SERVICE_URL: `http://127.0.0.1:${AI_PORT}/predict`,
        AI_HEALTH_URL: `http://127.0.0.1:${AI_PORT}/health`,
        NO_PROXY: '*',
        no_proxy: '*'
      })
    });

    const nodeReady = await waitForUrl(`${BASE_URL}/api/health`, 15000);
    assert(nodeReady, `Node.js Web Server healthy on port ${SERVER_PORT}`);
    if (!nodeReady) throw new Error('Node server failed to start');

    // ------------------------------------------------------------------
    // Part 1: Direct API Evaluation across Positive Images
    // ------------------------------------------------------------------
    console.log('\n--- Part 1: Positive Evaluation Images ---');
    const positiveCases = [
      {
        file: path.join(PROJECT_ROOT, 'test image crop disease', 'images.jpeg'),
        name: 'images.jpeg',
        crop: 'auto',
        expectedCropBn: 'সবজি ও ফসল',
        expectedDiseaseBn: 'পোকামাকড়ের আক্রমণ ও পাতার ক্ষতি',
        minConfidence: 35.0
      },
      {
        file: path.join(PROJECT_ROOT, 'test image crop disease', 'images (1).jpeg'),
        name: 'images (1).jpeg',
        crop: 'auto',
        expectedCropBn: 'শিম ও বরবটি',
        expectedDiseaseBn: 'শিমের মরিচা রোগ (রাস্ট)',
        minConfidence: 35.0
      },
      {
        file: path.join(PROJECT_ROOT, 'test image crop disease', 'images (2).jpeg'),
        name: 'images (2).jpeg',
        crop: 'auto',
        expectedCropBn: 'শসা / ক্ষীরা / মিষ্টি কুমড়া / সবজি',
        expectedDiseaseBn: 'ডাউনি মিলডিউ রোগ',
        minConfidence: 35.0
      },
      {
        file: path.join(PROJECT_ROOT, 'test image crop disease', 'images (3).jpeg'),
        name: 'images (3).jpeg',
        crop: 'auto',
        expectedCropBn: 'শসা / ক্ষীরা / মিষ্টি কুমড়া / সবজি',
        expectedDiseaseBn: 'ডাউনি মিলডিউ রোগ',
        minConfidence: 35.0
      },
      {
        file: path.join(PROJECT_ROOT, 'public', 'uploads', 'sample_tomato.jpg'),
        name: 'sample_tomato.jpg',
        crop: 'টমেটো',
        expectedCropBn: 'টমেটো',
        expectedDiseaseBn: 'টমেটোর আগাম ধসা রোগ (আর্লি ব্লাইট)',
        minConfidence: 35.0
      }
    ];

    for (const pos of positiveCases) {
      assert(fs.existsSync(pos.file), `Positive asset exists: ${pos.name}`);
      const res = await uploadFile('/api/scan', pos.file, { crop_name: pos.crop });
      assert(res.status === 200, `${pos.name} returned HTTP 200 (got: ${res.status})`);
      assert(res.data && res.data.success === true, `${pos.name} success: true`);
      
      const d = res.data && res.data.data;
      assert(d && d.crop_name === pos.expectedCropBn, `${pos.name} crop taxonomy: ${pos.expectedCropBn} (got: ${d && d.crop_name})`);
      assert(d && d.disease_bn === pos.expectedDiseaseBn, `${pos.name} disease diagnosis: ${pos.expectedDiseaseBn} (got: ${d && d.disease_bn})`);
      assert(d && d.confidence >= pos.minConfidence, `${pos.name} confidence >= ${pos.minConfidence}% (got: ${d && d.confidence}%)`);
      assert(d && d.symptoms && d.symptoms.length > 5, `${pos.name} has Bengali symptoms description`);
      assert(d && d.organic_solution && d.organic_solution.length > 5, `${pos.name} has organic solution`);
      assert(d && d.chemical_solution && d.chemical_solution.length > 5, `${pos.name} has chemical solution`);
      assert(d && d.safety_warning && d.safety_warning.length > 5, `${pos.name} has chemical safety warning`);
      assert(d && d.image_path && d.image_path.startsWith('/uploads/crop-'), `${pos.name} valid persisted image_path: ${d && d.image_path}`);
      
      // Verify file actually exists on disk
      if (d && d.image_path) {
        const persistedDiskPath = path.join(PROJECT_ROOT, 'public', d.image_path.replace(/^\//, ''));
        assert(fs.existsSync(persistedDiskPath), `${pos.name} physical disk file confirmed on disk`);
      }
    }

    // ------------------------------------------------------------------
    // Part 2: Direct API Evaluation across Negative Images
    // ------------------------------------------------------------------
    console.log('\n--- Part 2: Negative Evaluation Images & Storage Leak Audit ---');
    const negativeCases = [
      {
        label: 'Machinery (tractor_test.jpg)',
        file: path.join(PROJECT_ROOT, 'public', 'uploads', 'tractor_test.jpg'),
        fields: { crop_name: 'tomato' },
        expectedErrorCode: 'NON_LEAF_OBJECT',
        expectedMsgFrag: 'যন্ত্রপাতি'
      },
      {
        label: 'Potato Tuber / Harvested Produce (potato_tuber_test.jpg)',
        file: path.join(PROJECT_ROOT, 'public', 'uploads', 'potato_tuber_test.jpg'),
        fields: { crop_name: 'potato' },
        expectedErrorCode: 'NON_LEAF_OBJECT',
        expectedMsgFrag: 'ক্লোরোফিল'
      },
      {
        label: 'Sample Potato Produce (sample_potato.jpg)',
        file: path.join(PROJECT_ROOT, 'public', 'uploads', 'sample_potato.jpg'),
        fields: { crop_name: 'আলু' },
        expectedErrorCode: 'NON_LEAF_OBJECT',
        expectedMsgFrag: 'ক্লোরোফিল'
      },
      {
        label: 'Unsupported Crop Species (sample_rice.jpg / rice)',
        file: path.join(PROJECT_ROOT, 'public', 'uploads', 'sample_rice.jpg'),
        fields: { crop_type: 'rice', crop_name: 'ধান' },
        expectedErrorCode: 'UNSUPPORTED_CROP_SPECIES',
        expectedMsgFrag: 'ধান'
      },
      {
        label: 'Unsupported Crop Species (sample_eggplant.jpg / eggplant)',
        file: path.join(PROJECT_ROOT, 'public', 'uploads', 'sample_eggplant.jpg'),
        fields: { crop_type: 'eggplant', crop_name: 'বেগুন' },
        expectedErrorCode: 'UNSUPPORTED_CROP_SPECIES',
        expectedMsgFrag: 'বেগুন'
      }
    ];

    for (const neg of negativeCases) {
      assert(fs.existsSync(neg.file), `Negative asset exists: ${path.basename(neg.file)}`);
      const countBefore = fs.readdirSync(UPLOADS_DIR).length;

      const res = await uploadFile('/api/scan', neg.file, neg.fields);
      assert(res.status === 200, `${neg.label} returned HTTP 200 domain response`);
      assert(res.data && res.data.is_unidentified === true, `${neg.label} is_unidentified: true`);
      assert(res.data && res.data.error_code === neg.expectedErrorCode, `${neg.label} error_code: ${neg.expectedErrorCode} (got: ${res.data && res.data.error_code})`);
      assert(res.data && res.data.message && res.data.message.includes(neg.expectedMsgFrag), `${neg.label} message contains '${neg.expectedMsgFrag}'`);
      assert(res.data && res.data.image_path === null, `${neg.label} image_path strictly null`);

      const countAfter = fs.readdirSync(UPLOADS_DIR).length;
      assert(countAfter === countBefore, `${neg.label} ZERO storage leak (files before: ${countBefore}, after: ${countAfter})`);
    }

    // ------------------------------------------------------------------
    // Part 3: Non-Image Payload & Blank Image Guard
    // ------------------------------------------------------------------
    console.log('\n--- Part 3: Non-Image Upload (package.json) & Blank Buffer ---');
    {
      const countBefore = fs.readdirSync(UPLOADS_DIR).length;
      const res = await uploadFile('/api/scan', path.join(PROJECT_ROOT, 'package.json'));
      assert(res.status === 400, `Non-image payload (package.json) returned HTTP 400 Bad Request (got: ${res.status})`);
      assert(res.data && res.data.is_unidentified === true, `Non-image payload is_unidentified: true`);
      assert(res.data && res.data.error_code === 'INVALID_IMAGE', `Non-image payload error_code: INVALID_IMAGE (got: ${res.data && res.data.error_code})`);
      const countAfter = fs.readdirSync(UPLOADS_DIR).length;
      assert(countAfter === countBefore, `Non-image payload ZERO storage leak (files before: ${countBefore}, after: ${countAfter})`);
    }

    {
      const countBefore = fs.readdirSync(UPLOADS_DIR).length;
      const blankBuf = Buffer.alloc(1024, 0);
      const res = await uploadBuffer('/api/scan', blankBuf, 'blank.jpg');
      assert(res.status === 400 || (res.status === 200 && res.data && res.data.is_unidentified === true), `Blank image safely rejected (status: ${res.status})`);
      assert(res.data && (res.data.image_path === null || res.data.image_path === undefined), `Blank image image_path is null or omitted`);
      const countAfter = fs.readdirSync(UPLOADS_DIR).length;
      assert(countAfter === countBefore, `Blank buffer ZERO storage leak (files before: ${countBefore}, after: ${countAfter})`);
    }

    // ------------------------------------------------------------------
    // Part 4: Static Routes & Navigation Integrity on Live Server
    // ------------------------------------------------------------------
    console.log('\n--- Part 4: Core Routes Health ---');
    const routes = ['/', '/scan', '/guides', '/calculator', '/history', '/roadmap'];
    for (const route of routes) {
      const res = await axios.get(`${BASE_URL}${route}`, { proxy: false, validateStatus: () => true });
      assert(res.status === 200, `Route ${route} returned HTTP 200`);
    }

    // ------------------------------------------------------------------
    // Part 5: Execute Adversarial Challenge Suite M2
    // ------------------------------------------------------------------
    console.log('\n--- Part 5: Running Adversarial Challenge Suite M2 against Live Server ---');
    await new Promise((resolve, reject) => {
      const advProcess = spawn('node', ['scripts/tests/adversarial_challenge_m2.js'], {
        cwd: PROJECT_ROOT,
        env: Object.assign({}, process.env, {
          BASE_URL: BASE_URL,
          NO_PROXY: '*',
          no_proxy: '*'
        }),
        stdio: 'inherit'
      });

      advProcess.on('exit', (code) => {
        assert(code === 0, `Adversarial Challenge Suite M2 exited with code 0 (got: ${code})`);
        resolve();
      });
      advProcess.on('error', reject);
    });

  } catch (err) {
    console.error('❌ Fatal error during verification:', err);
    failed++;
    failures.push(err.message);
  } finally {
    console.log('\n🧹 Cleaning up test processes...');
    if (nodeProcess) {
      nodeProcess.kill('SIGKILL');
    }
    if (pyProcess) {
      pyProcess.kill('SIGKILL');
    }
    await sleep(1000);
  }

  console.log('\n================================================================');
  console.log(`📊 REVIEWER M4.2 SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    console.error('Failures list:');
    failures.forEach((f, i) => console.error(`  ${i + 1}. ${f}`));
    process.exit(1);
  } else {
    console.log('🎉 ALL END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!');
    process.exit(0);
  }
}

main();
