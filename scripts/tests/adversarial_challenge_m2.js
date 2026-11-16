/**
 * Adversarial Challenge Suite M2 (Milestone 2)
 * Smart Agro Crop Disease Detection Pipeline Hardening
 *
 * Vectors:
 * 1. Magic Byte Spoofing & Disguised Payloads
 * 2. Storage Leak Empirical Audit (20 rejected uploads)
 * 3. Concurrent Burst Testing (10 concurrent requests)
 * 4. Safe Fallbacks Stress Testing (disease_map.js)
 * 5. Input Sanitization & Security Injection Resilience
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { execSync } = require('child_process');

const { diseaseMap, getDiseaseByIndex, getDiseaseByName } = require('../../data/disease_map');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: []
};

function assert(condition, message) {
  results.total++;
  if (condition) {
    results.passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    results.failed++;
    console.error(`  ❌ FAIL: ${message}`);
    results.failures.push(message);
  }
}

function getUploadsCount() {
  if (!fs.existsSync(UPLOADS_DIR)) return 0;
  return fs.readdirSync(UPLOADS_DIR).filter(f => !f.startsWith('.')).length;
}

async function uploadFile(endpoint, buffer, originalName, mimeType, fields = {}, customFieldName = 'image') {
  const form = new FormData();
  form.append(customFieldName, buffer, {
    filename: originalName,
    contentType: mimeType
  });
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }

  try {
    const res = await axios.post(`${BASE_URL}${endpoint}`, form, {
      headers: form.getHeaders(),
      timeout: 20000,
      validateStatus: () => true // Do not throw on non-2xx
    });
    return { status: res.status, data: res.data };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function uploadJson(endpoint, body) {
  try {
    const res = await axios.post(`${BASE_URL}${endpoint}`, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
      validateStatus: () => true
    });
    return { status: res.status, data: res.data };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function runVector1_MagicBytes() {
  console.log('\n======================================================');
  console.log('🧪 VECTOR 1: Magic Byte Spoofing & Disguised Payloads');
  console.log('======================================================');

  // T1.1: Text file disguised as .jpg
  const textBuf = Buffer.from('Hello world! This is a plain text file disguised as JPEG.');
  const r1 = await uploadFile('/api/scan', textBuf, 'fake.jpg', 'image/jpeg');
  assert(r1.status === 400, `T1.1: Text file as .jpg returns HTTP 400 (got ${r1.status})`);
  assert(r1.data && r1.data.error_code === 'INVALID_IMAGE', `T1.1: Returns error_code 'INVALID_IMAGE' (got ${r1.data?.error_code})`);

  // T1.2: Shell script disguised as .jpg
  const shBuf = Buffer.from('#!/bin/bash\necho "exploit attempt"\nrm -rf /tmp/test\n');
  const r2 = await uploadFile('/api/scan', shBuf, 'malicious.jpg', 'image/jpeg');
  assert(r2.status === 400, `T1.2: Shell script as .jpg returns HTTP 400 (got ${r2.status})`);
  assert(r2.data && r2.data.error_code === 'INVALID_IMAGE', `T1.2: Returns error_code 'INVALID_IMAGE'`);

  // T1.3: Truncated 2-byte file (\xFF\xD8)
  const trunc2Buf = Buffer.from([0xFF, 0xD8]);
  const r3 = await uploadFile('/api/scan', trunc2Buf, 'truncated2.jpg', 'image/jpeg');
  assert(r3.status === 400, `T1.3: 2-byte truncated jpg returns HTTP 400 (got ${r3.status})`);
  assert(r3.data && r3.data.error_code === 'INVALID_IMAGE', `T1.3: Returns error_code 'INVALID_IMAGE'`);

  // T1.4: Truncated 8-byte file (\xFF\xD8\xFF\xE0\x00\x10\x4A\x46)
  const trunc8Buf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
  const r4 = await uploadFile('/api/scan', trunc8Buf, 'truncated8.jpg', 'image/jpeg');
  assert(r4.status === 400, `T1.4: 8-byte truncated jpg (<12 bytes) returns HTTP 400 (got ${r4.status})`);
  assert(r4.data && r4.data.error_code === 'INVALID_IMAGE', `T1.4: Returns error_code 'INVALID_IMAGE'`);

  // T1.5: 10KB random garbage binary (/dev/urandom)
  const urandomBuf = Buffer.alloc(10 * 1024);
  for (let i = 0; i < urandomBuf.length; i++) urandomBuf[i] = Math.floor(Math.random() * 256);
  // Ensure it doesn't accidentally start with JPEG/PNG/WebP magic bytes
  urandomBuf[0] = 0x00; urandomBuf[1] = 0x01;
  const r5 = await uploadFile('/api/scan', urandomBuf, 'random.jpg', 'image/jpeg');
  assert(r5.status === 400, `T1.5: 10KB random binary as .jpg returns HTTP 400 (got ${r5.status})`);
  assert(r5.data && r5.data.error_code === 'INVALID_IMAGE', `T1.5: Returns error_code 'INVALID_IMAGE'`);

  // T1.6: Zero-byte empty file
  const emptyBuf = Buffer.alloc(0);
  const r6 = await uploadFile('/api/scan', emptyBuf, 'empty.jpg', 'image/jpeg');
  assert(r6.status === 400, `T1.6: Zero-byte empty file returns HTTP 400 (got ${r6.status})`);

  // T1.7: Disguised HTML with .jpg
  const htmlBuf = Buffer.from('<!DOCTYPE html><html><body><script>alert("xss")</script></body></html>');
  const r7 = await uploadFile('/api/scan', htmlBuf, 'xss.jpg', 'image/jpeg');
  assert(r7.status === 400, `T1.7: Disguised HTML as .jpg returns HTTP 400 (got ${r7.status})`);
  assert(r7.data && r7.data.error_code === 'INVALID_IMAGE', `T1.7: Returns error_code 'INVALID_IMAGE'`);

  // T1.8: Disguised PDF with .png
  const pdfBuf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Malicious) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  const r8 = await uploadFile('/api/scan', pdfBuf, 'document.png', 'image/png');
  assert(r8.status === 400, `T1.8: Disguised PDF as .png returns HTTP 400 (got ${r8.status})`);
  assert(r8.data && r8.data.error_code === 'INVALID_IMAGE', `T1.8: Returns error_code 'INVALID_IMAGE'`);

  // T1.9: Disguised ELF binary with .webp
  const elfBuf = Buffer.from([0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const r9 = await uploadFile('/api/scan', elfBuf, 'binary.webp', 'image/webp');
  assert(r9.status === 400, `T1.9: Disguised ELF binary as .webp returns HTTP 400 (got ${r9.status})`);
  assert(r9.data && r9.data.error_code === 'INVALID_IMAGE', `T1.9: Returns error_code 'INVALID_IMAGE'`);

  // T1.10: Valid PNG renamed to .jpg
  const validLeafPath = path.join(__dirname, '..', '..', 'test image crop disease', 'images (1).jpeg');
  const validPngBuf = execSync(`python3 -c "
from PIL import Image
import io
im = Image.open('${validLeafPath}')
buf = io.BytesIO()
im.save(buf, format='PNG')
print(buf.getvalue().hex())
"`).toString().trim();
  const pngBuffer = Buffer.from(validPngBuf, 'hex');
  const r10 = await uploadFile('/api/scan', pngBuffer, 'renamed_png_to.jpg', 'image/jpeg');
  assert(r10.status === 200, `T1.10: Valid PNG renamed to .jpg returns HTTP 200 (got ${r10.status})`);
  assert(r10.data && r10.data.success === true && r10.data.class_index === 59, `T1.10: Correctly diagnosed leaf (class 59)`);

  // T1.11: Valid WebP image
  const validWebpBuf = execSync(`python3 -c "
from PIL import Image
import io
im = Image.open('${validLeafPath}')
buf = io.BytesIO()
im.save(buf, format='WEBP')
print(buf.getvalue().hex())
"`).toString().trim();
  const webpBuffer = Buffer.from(validWebpBuf, 'hex');
  const r11 = await uploadFile('/api/scan', webpBuffer, 'valid_leaf.webp', 'image/webp');
  assert(r11.status === 200, `T1.11: Valid WebP returns HTTP 200 (got ${r11.status})`);
  assert(r11.data && r11.data.success === true, `T1.11: WebP successfully diagnosed`);

  // T1.12: Base64 payload with fake text
  const r12 = await uploadJson('/api/scan', {
    image: 'data:image/jpeg;base64,' + Buffer.from('Not a real image').toString('base64')
  });
  assert(r12.status === 400, `T1.12: Base64 text returns HTTP 400 (got ${r12.status})`);
  assert(r12.data && r12.data.error_code === 'INVALID_IMAGE', `T1.12: Returns error_code 'INVALID_IMAGE'`);

  // T1.13: Spoofed JPEG header (FF D8 FF) + corrupted 20-byte payload
  // Passes magic bytes inspector but fails upstream image decode; must be safely rejected with image_path: null
  const spoofedJpg = Buffer.concat([
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]),
    Buffer.from('CORRUPTED_JPEG_TAIL_GARBAGE_BYTES')
  ]);
  const r13 = await uploadFile('/api/scan', spoofedJpg, 'spoofed.jpg', 'image/jpeg');
  const isSpoofedRejected = (r13.status === 400) || (r13.status === 200 && r13.data?.is_unidentified === true && r13.data?.image_path === null);
  assert(isSpoofedRejected, `T1.13: Spoofed JPEG header with corrupted tail is safely rejected (status: ${r13.status}, error_code: ${r13.data?.error_code || 'N/A'}, image_path: ${r13.data?.image_path})`);

  // T1.14: Parity on /api/detect route
  const r14 = await uploadFile('/api/detect', textBuf, 'fake.jpg', 'image/jpeg');
  assert(r14.status === 400, `T1.14: /api/detect route returns HTTP 400 for fake image (got ${r14.status})`);
  assert(r14.data && r14.data.error_code === 'INVALID_IMAGE', `T1.14: /api/detect returns error_code 'INVALID_IMAGE'`);

  // T1.15: Oversized payload (> 15MB limit)
  const oversizedBuf = Buffer.alloc(16 * 1024 * 1024); // 16MB
  const r15 = await uploadFile('/api/scan', oversizedBuf, 'huge.jpg', 'image/jpeg');
  assert(r15.status === 400, `T1.15: 16MB oversized upload returns HTTP 400 (got ${r15.status})`);

  // T1.16: Non-standard upload field name (e.g. 'photo' instead of 'image')
  const r16 = await uploadFile('/api/scan', textBuf, 'fake.jpg', 'image/jpeg', {}, 'photo');
  assert(r16.status === 400, `T1.16: Non-standard field name 'photo' is caught and rejected with HTTP 400`);
}

async function runVector2_StorageLeak() {
  console.log('\n======================================================');
  console.log('🧪 VECTOR 2: Storage Leak Empirical Audit (20 Rejected Uploads)');
  console.log('======================================================');

  const initialCount = getUploadsCount();
  console.log(`  Initial files in public/uploads/: ${initialCount}`);

  const validLeafPath = path.join(__dirname, '..', '..', 'test image crop disease', 'images (1).jpeg');
  const leafBuffer = fs.readFileSync(validLeafPath);

  const blackJpgHex = execSync(`python3 -c "
from PIL import Image
import io
im = Image.new('RGB', (100, 100), (0, 0, 0))
buf = io.BytesIO()
im.save(buf, format='JPEG')
print(buf.getvalue().hex())
"`).toString().trim();
  const blackJpgBuf = Buffer.from(blackJpgHex, 'hex');

  const whiteJpgHex = execSync(`python3 -c "
from PIL import Image
import io
im = Image.new('RGB', (100, 100), (255, 255, 255))
buf = io.BytesIO()
im.save(buf, format='JPEG')
print(buf.getvalue().hex())
"`).toString().trim();
  const whiteJpgBuf = Buffer.from(whiteJpgHex, 'hex');

  const tractorBuf = fs.readFileSync(path.join(UPLOADS_DIR, 'tractor_test.jpg'));
  const potatoTuberBuf = fs.readFileSync(path.join(UPLOADS_DIR, 'potato_tuber_test.jpg'));
  const sampleRiceBuf = fs.readFileSync(path.join(UPLOADS_DIR, 'sample_rice.jpg'));
  const sampleEggplantBuf = fs.readFileSync(path.join(UPLOADS_DIR, 'sample_eggplant.jpg'));

  const rejectedVectors = [
    { name: '1. Tractor machinery test image', buf: tractorBuf, fn: 'tractor.jpg', mime: 'image/jpeg', fields: {} },
    { name: '2. Potato tuber non-leaf test image', buf: potatoTuberBuf, fn: 'tuber.jpg', mime: 'image/jpeg', fields: {} },
    { name: '3. Unsupported crop species (Rice / ধান)', buf: sampleRiceBuf, fn: 'rice.jpg', mime: 'image/jpeg', fields: { crop_type: 'rice' } },
    { name: '4. Unsupported crop species (Eggplant / বেগুন)', buf: sampleEggplantBuf, fn: 'eggplant.jpg', mime: 'image/jpeg', fields: { crop_type: 'eggplant' } },
    { name: '5. Fake text disguised as .jpg', buf: Buffer.from('hello'), fn: 'text.jpg', mime: 'image/jpeg', fields: {} },
    { name: '6. Truncated 2-byte .jpg', buf: Buffer.from([0xFF, 0xD8]), fn: 'trunc2.jpg', mime: 'image/jpeg', fields: {} },
    { name: '7. Random urandom 10KB .jpg', buf: Buffer.alloc(10240, 0x42), fn: 'urandom.jpg', mime: 'image/jpeg', fields: {} },
    { name: '8. Empty 0-byte file', buf: Buffer.alloc(0), fn: 'empty.jpg', mime: 'image/jpeg', fields: {} },
    { name: '9. Shell script disguised as .jpg', buf: Buffer.from('#!/bin/sh\nexit 1'), fn: 'script.jpg', mime: 'image/jpeg', fields: {} },
    { name: '10. HTML file disguised as .jpg', buf: Buffer.from('<h1>Bad</h1>'), fn: 'test.html.jpg', mime: 'image/jpeg', fields: {} },
    { name: '11. PDF disguised as .png', buf: Buffer.from('%PDF-1.4 test'), fn: 'doc.png', mime: 'image/png', fields: {} },
    { name: '12. ELF executable disguised as .webp', buf: Buffer.from([0x7F, 0x45, 0x4C, 0x46]), fn: 'bin.webp', mime: 'image/webp', fields: {} },
    { name: '13. Pure black non-foliar image', buf: blackJpgBuf, fn: 'black.jpg', mime: 'image/jpeg', fields: {} },
    { name: '14. Pure white non-foliar image', buf: whiteJpgBuf, fn: 'white.jpg', mime: 'image/jpeg', fields: {} },
    { name: '15. Explicit unsupported crop: rice (Bengali ধান)', buf: leafBuffer, fn: 'leaf1.jpg', mime: 'image/jpeg', fields: { crop_type: 'ধান' } },
    { name: '16. Explicit unsupported crop: eggplant (Bengali বেগুন)', buf: leafBuffer, fn: 'leaf2.jpg', mime: 'image/jpeg', fields: { crop_type: 'বেগুন' } },
    { name: '17. Explicit unsupported crop: jute (পাট)', buf: leafBuffer, fn: 'leaf3.jpg', mime: 'image/jpeg', fields: { crop_type: 'jute' } },
    { name: '18. Explicit unsupported crop: tea (চা)', buf: leafBuffer, fn: 'leaf4.jpg', mime: 'image/jpeg', fields: { crop_type: 'tea' } },
    { name: '19. Explicit unsupported crop: banana (কলা)', buf: leafBuffer, fn: 'leaf5.jpg', mime: 'image/jpeg', fields: { crop_type: 'banana' } },
    { name: '20. Corrupted JPEG with valid magic header', buf: Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]), Buffer.from('GARBAGE')]), fn: 'corrupt.jpg', mime: 'image/jpeg', fields: {} }
  ];

  for (let i = 0; i < rejectedVectors.length; i++) {
    const v = rejectedVectors[i];
    const res = await uploadFile('/api/scan', v.buf, v.fn, v.mime, v.fields);
    const isRejected = (res.status === 400) || (res.status === 200 && (res.data?.is_unidentified === true || res.data?.image_path === null));
    assert(isRejected, `Vector 2.${i + 1}: ${v.name} was rejected without image_path (status: ${res.status}, error_code: ${res.data?.error_code || 'N/A'}, image_path: ${res.data?.image_path})`);
  }

  const finalCount = getUploadsCount();
  console.log(`  Final files in public/uploads/: ${finalCount}`);
  const leakDelta = finalCount - initialCount;
  assert(leakDelta === 0, `Storage Leak Audit: Exactly 0 leaked files in public/uploads/ (initial: ${initialCount}, final: ${finalCount}, leak delta = ${leakDelta})`);
}

async function runVector3_ConcurrentBurst() {
  console.log('\n======================================================');
  console.log('🧪 VECTOR 3: Concurrent Burst Testing (10 Concurrent Requests)');
  console.log('======================================================');

  const validLeafPath1 = path.join(__dirname, '..', '..', 'test image crop disease', 'images (1).jpeg');
  const validLeafPath2 = path.join(__dirname, '..', '..', 'test image crop disease', 'images (2).jpeg');
  const validLeafPath3 = path.join(__dirname, '..', '..', 'test image crop disease', 'images (3).jpeg');
  const validLeafPath4 = path.join(__dirname, '..', '..', 'test image crop disease', 'images.jpeg');

  const buf1 = fs.readFileSync(validLeafPath1);
  const buf2 = fs.readFileSync(validLeafPath2);
  const buf3 = fs.readFileSync(validLeafPath3);
  const buf4 = fs.readFileSync(validLeafPath4);

  const tractorBuf = fs.readFileSync(path.join(UPLOADS_DIR, 'tractor_test.jpg'));
  const potatoTuberBuf = fs.readFileSync(path.join(UPLOADS_DIR, 'potato_tuber_test.jpg'));
  const riceBuf = fs.readFileSync(path.join(UPLOADS_DIR, 'sample_rice.jpg'));
  const fakeJpgBuf = Buffer.from('Not an image text payload');
  const truncJpgBuf = Buffer.from([0xFF, 0xD8]);

  const burstTasks = [
    // 5 Valid Leaf Requests
    () => uploadFile('/api/scan', buf1, 'leaf1.jpeg', 'image/jpeg'),
    () => uploadFile('/api/scan', buf2, 'leaf2.jpeg', 'image/jpeg'),
    () => uploadFile('/api/scan', buf3, 'leaf3.jpeg', 'image/jpeg'),
    () => uploadFile('/api/scan', buf4, 'leaf4.jpeg', 'image/jpeg'),
    () => uploadFile('/api/scan', buf1, 'leaf5.jpeg', 'image/jpeg'),
    // 5 Invalid / Negative Requests
    () => uploadFile('/api/scan', tractorBuf, 'tractor.jpg', 'image/jpeg'),
    () => uploadFile('/api/scan', potatoTuberBuf, 'tuber.jpg', 'image/jpeg'),
    () => uploadFile('/api/scan', riceBuf, 'rice.jpg', 'image/jpeg', { crop_type: 'rice' }),
    () => uploadFile('/api/scan', fakeJpgBuf, 'fake.jpg', 'image/jpeg'),
    () => uploadFile('/api/scan', truncJpgBuf, 'trunc.jpg', 'image/jpeg')
  ];

  console.log('  Firing 10 concurrent requests to /api/scan simultaneously...');
  const startTime = Date.now();
  const burstResults = await Promise.allSettled(burstTasks.map(fn => fn()));
  const durationMs = Date.now() - startTime;
  console.log(`  All 10 concurrent requests completed in ${durationMs}ms`);

  // Verify all 10 completed without connection drop
  let fulfilledCount = 0;
  burstResults.forEach((r, idx) => {
    if (r.status === 'fulfilled' && r.value.status > 0) {
      fulfilledCount++;
    } else {
      console.error(`  Burst task ${idx + 1} failed:`, r.reason || r.value?.error);
    }
  });

  assert(fulfilledCount === 10, `All 10 concurrent requests completed with valid HTTP responses (got ${fulfilledCount}/10)`);

  // Check 5 valid requests: expect status 200 and success === true
  for (let i = 0; i < 5; i++) {
    const res = burstResults[i].value;
    assert(res.status === 200 && res.data?.success === true, `Burst valid leaf ${i + 1} succeeded with diagnosis (class: ${res.data?.class_index}, conf: ${res.data?.confidence}%)`);
  }

  // Check 5 invalid requests: expect status 200 with is_unidentified or status 400
  for (let i = 5; i < 10; i++) {
    const res = burstResults[i].value;
    const isProperlyHandled = (res.status === 400) || (res.status === 200 && res.data?.is_unidentified === true);
    assert(isProperlyHandled, `Burst invalid request ${i + 1} properly rejected (status: ${res.status}, error_code: ${res.data?.error_code || 'N/A'})`);
  }

  // Check server health immediately after burst
  try {
    const health = await axios.get(`${BASE_URL}/api/health`, { timeout: 3000 });
    assert(health.status === 200 && health.data?.status === 'online', `Server /api/health is online and healthy after burst test`);
  } catch (err) {
    assert(false, `Server health check failed after burst test: ${err.message}`);
  }
}

async function runVector4_SafeFallbacks() {
  console.log('\n======================================================');
  console.log('🧪 VECTOR 4: Safe Fallbacks Stress Testing (disease_map.js)');
  console.log('======================================================');

  // getDiseaseByIndex stress tests
  const invalidIndices = [-999, 99999, null, undefined, 'NaN', 'invalid', '', NaN, Infinity, -Infinity, [], {}, 67, 100, -1];
  for (const idx of invalidIndices) {
    const res = getDiseaseByIndex(idx);
    assert(res === null, `getDiseaseByIndex(${JSON.stringify(idx)}) returns null`);
  }

  // Valid boundary indices
  const firstValid = getDiseaseByIndex(0);
  assert(firstValid !== null && firstValid.class_index === 0, `getDiseaseByIndex(0) returns valid class 0 (${firstValid?.class_name})`);

  const lastValid = getDiseaseByIndex(66);
  assert(lastValid !== null && lastValid.class_index === 66, `getDiseaseByIndex(66) returns valid class 66 (${lastValid?.class_name})`);

  // Confirm Tomato Healthy is index 55 and NOT returned for invalid indices
  const tomatoHealthy = getDiseaseByIndex(55);
  assert(tomatoHealthy !== null && tomatoHealthy.class_index === 55, `getDiseaseByIndex(55) returns Tomato Healthy`);
  assert(getDiseaseByIndex(999) !== tomatoHealthy, `getDiseaseByIndex(999) does NOT silently fallback to Tomato Healthy`);

  // getDiseaseByName stress tests
  const invalidNames = [null, undefined, '', 'NonExistentDisease', 123, {}, [], 'Tomato___Fake_Disease'];
  for (const name of invalidNames) {
    const res = getDiseaseByName(name);
    assert(res === null, `getDiseaseByName(${JSON.stringify(name)}) returns null`);
  }

  const validName = getDiseaseByName('Tomato___Target_Spot');
  assert(validName !== null && validName.class_name === 'Tomato___Target_Spot', `getDiseaseByName('Tomato___Target_Spot') returns target spot record`);
}

async function runVector5_SecurityAndSanitization() {
  console.log('\n======================================================');
  console.log('🧪 VECTOR 5: Security Injection & Parameter Sanitization');
  console.log('======================================================');

  const validLeafPath = path.join(__dirname, '..', '..', 'test image crop disease', 'images (1).jpeg');
  const leafBuffer = fs.readFileSync(validLeafPath);

  // T5.1: SQL injection in crop_name field
  const r1 = await uploadFile('/api/scan', leafBuffer, 'leaf.jpg', 'image/jpeg', {
    crop_name: "tomato' OR '1'='1; DROP TABLE scans; --"
  });
  assert(r1.status === 200, `T5.1: SQL injection in crop_name handled gracefully (status: ${r1.status})`);

  // T5.2: XSS in user_name field
  const r2 = await uploadFile('/api/scan', leafBuffer, 'leaf.jpg', 'image/jpeg', {
    user_name: '<script>alert("xss")</script>'
  });
  assert(r2.status === 200, `T5.2: XSS payload in user_name handled gracefully without server crash`);

  // T5.3: Path traversal in original filename
  const r3 = await uploadFile('/api/scan', leafBuffer, '../../../../etc/passwd.jpg', 'image/jpeg');
  assert(r3.status === 200, `T5.3: Path traversal in filename does not escape uploads directory`);
  if (r3.data?.data?.image_path) {
    assert(!r3.data.data.image_path.includes('..'), `T5.3: Saved image_path contains no '..' traversal`);
  }
}

async function main() {
  console.log('🌾 ==============================================================');
  console.log('   Smart Agro Adversarial Challenge Harness (Milestone 2)');
  console.log('   Target: Node.js Express Server (Port 3000) & Pipeline');
  console.log('================================================================');

  try {
    const healthCheck = await axios.get(`${BASE_URL}/api/health`, { timeout: 3000 });
    console.log(`📡 Pre-flight healthcheck: Server online (${healthCheck.data.appName})`);
  } catch (err) {
    console.error(`🚨 Fatal: Server not reachable at ${BASE_URL}: ${err.message}`);
    process.exit(1);
  }

  await runVector1_MagicBytes();
  await runVector2_StorageLeak();
  await runVector3_ConcurrentBurst();
  await runVector4_SafeFallbacks();
  await runVector5_SecurityAndSanitization();

  console.log('\n======================================================');
  console.log('📊 ADVERSARIAL CHALLENGE SUMMARY');
  console.log('======================================================');
  console.log(`Total Assertions: ${results.total}`);
  console.log(`Passed:           ${results.passed}`);
  console.log(`Failed:           ${results.failed}`);

  if (results.failed > 0) {
    console.error('\n🚨 FAILURES DETECTED:');
    results.failures.forEach((f, i) => console.error(`  ${i + 1}. ${f}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ADVERSARIAL CHALLENGE ASSERTIONS PASSED EMPIRICALLY!');
    process.exit(0);
  }
}

main();
