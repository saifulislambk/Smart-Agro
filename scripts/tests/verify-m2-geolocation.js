/**
 * Milestone 2 Automated Verification Suite:
 * Geolocation District Selection & Dhaka Fallback (Requirement R2)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🌾 ===============================================================');
console.log('🌾 Milestone 2 Verification: Geolocation & Dhaka Fallback (R2)');
console.log('🌾 ===============================================================\n');

let passCount = 0;
let totalChecks = 0;

function check(desc, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`   ✅ [Pass ${totalChecks}] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`   ❌ [FAIL ${totalChecks}] ${desc}: ${err.message}`);
  }
}

// 1. Verify all 7 HTML pages
const htmlPages = [
  'public/index.html',
  'public/scan.html',
  'public/crop-detail.html',
  'public/history.html',
  'public/grafting.html',
  'public/roadmap.html',
  'public/calculator.html'
];

console.log('📄 Step 1: Checking District Default in All 7 HTML Pages...');
for (const page of htmlPages) {
  const content = fs.readFileSync(path.join(__dirname, '../../', page), 'utf-8');
  
  check(`${page}: <option value="ঢাকা" selected> is present`, () => {
    assert(content.includes('<option value="ঢাকা" selected>📍 ঢাকা</option>'), `Missing selected Dhaka in ${page}`);
  });

  check(`${page}: <option value="ব্রাহ্মণবাড়িয়া" selected> is NOT present`, () => {
    assert(!content.includes('<option value="ব্রাহ্মণবাড়িয়া" selected>'), `Brahmanbaria still selected in ${page}`);
  });
}

// 2. Verify index.html weather-location-label
console.log('\n🏷️ Step 2: Checking #weather-location-label in public/index.html...');
const indexContent = fs.readFileSync(path.join(__dirname, '../../public/index.html'), 'utf-8');
check('index.html: #weather-location-label defaults to ঢাকা', () => {
  const match = indexContent.match(/<span id="weather-location-label"[^>]*>\s*([^\s<]+)\s*<\/span>/);
  assert(match, 'weather-location-label not found');
  assert.strictEqual(match[1], 'ঢাকা', `Expected ঢাকা, got ${match[1]}`);
});

// 3. Verify public/js/scanner.js
console.log('\n🔍 Step 3: Checking fallback in public/js/scanner.js...');
const scannerContent = fs.readFileSync(path.join(__dirname, '../../public/js/scanner.js'), 'utf-8');
check('scanner.js: fallback district is ঢাকা', () => {
  assert(scannerContent.includes("districtEl ? districtEl.value : 'ঢাকা'"), 'Scanner district fallback not ঢাকা');
});

// 4. Verify server.js fallbacks
console.log('\n🖥️ Step 4: Checking fallbacks in server.js...');
const serverContent = fs.readFileSync(path.join(__dirname, '../../server.js'), 'utf-8');
check('server.js: findNearestDistrict fallback is ঢাকা', () => {
  assert(serverContent.includes("if (!lat || !lon) return 'ঢাকা'"), 'server.js findNearestDistrict fallback not ঢাকা');
});
check('server.js: /api/weather fallback district is ঢাকা', () => {
  assert(serverContent.includes("req.query.district || 'ঢাকা'"), 'server.js /api/weather fallback not ঢাকা');
});
check('server.js: /api/scan fallback district is ঢাকা', () => {
  assert(serverContent.includes("req.body.district || 'ঢাকা'"), 'server.js /api/scan fallback not ঢাকা');
});

// 5. Verify db.js fallbacks
console.log('\n💾 Step 5: Checking fallbacks in db.js...');
const dbContent = fs.readFileSync(path.join(__dirname, '../../db.js'), 'utf-8');
check('db.js: inMemoryStore sample record district is ঢাকা', () => {
  assert(dbContent.includes("district: 'ঢাকা',"), 'db.js inMemoryStore district not ঢাকা');
});
check('db.js: syncUser fallback district is ঢাকা', () => {
  assert(dbContent.includes("district || 'ঢাকা',"), 'db.js syncUser fallback not ঢাকা');
  assert(dbContent.includes("district: district || 'ঢাকা',"), 'db.js in-memory user fallback not ঢাকা');
});

// 6. Verify public/js/weather.js client-side logic
console.log('\n🛰️ Step 6: Checking 64-District Geolocation & Haversine in public/js/weather.js...');
const weatherFile = fs.readFileSync(path.join(__dirname, '../../public/js/weather.js'), 'utf-8');

// Simulate DOM and Window environment to load weather.js
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; }
};

const mockElements = {
  'gps-refresh-btn': { addEventListener: () => {} },
  'district-select': { value: '', addEventListener: () => {} },
  'weather-location-label': { innerText: '' },
  'gps-status-box': { classList: { add: () => {}, remove: () => {} } },
  'gps-status-text': { innerHTML: '' },
  'gps-action-btn': { disabled: false, classList: { add: () => {}, remove: () => {} } }
};

global.document = {
  getElementById: (id) => mockElements[id] || null,
  createElement: () => ({ id: '', className: '', innerHTML: '' }),
  body: { appendChild: () => {}, style: {} }
};

global.window = {};
global.fetch = async () => ({
  ok: true,
  json: async () => ({ success: true, weather: { location: 'ঢাকা' } })
});

// Evaluate weather.js in simulated sandbox
eval(weatherFile);

const Weather = global.window.SmartAgroWeather;
check('weather.js: SmartAgroWeather is exposed on window', () => {
  assert(Weather, 'SmartAgroWeather not exposed');
});

check('weather.js: BD_DISTRICTS_COORDS has exactly 64 districts', () => {
  assert.strictEqual(Weather.BD_DISTRICTS_COORDS.length, 64, `Expected 64 districts, found ${Weather.BD_DISTRICTS_COORDS.length}`);
});

check('weather.js: Each district has name, name_en, lat, lon', () => {
  Weather.BD_DISTRICTS_COORDS.forEach((d) => {
    assert(d.name && typeof d.name === 'string', 'Missing Bengali name');
    assert(d.name_en && typeof d.name_en === 'string', 'Missing English name');
    assert(typeof d.lat === 'number', 'Invalid latitude');
    assert(typeof d.lon === 'number', 'Invalid longitude');
  });
});

check('weather.js: Haversine correctly identifies Dhaka coordinates (23.8103, 90.4125)', () => {
  const result = Weather.findNearestDistrictClient(23.8103, 90.4125);
  assert.strictEqual(result, 'ঢাকা');
});

check('weather.js: Haversine correctly identifies Chattogram coordinates (22.3569, 91.7832)', () => {
  const result = Weather.findNearestDistrictClient(22.3569, 91.7832);
  assert.strictEqual(result, 'চট্টগ্রাম');
});

check('weather.js: Haversine correctly identifies Rajshahi coordinates (24.3745, 88.6042)', () => {
  const result = Weather.findNearestDistrictClient(24.3745, 88.6042);
  assert.strictEqual(result, 'রাজশাহী');
});

check('weather.js: Haversine correctly identifies Sylhet coordinates (24.8949, 91.8687)', () => {
  const result = Weather.findNearestDistrictClient(24.8949, 91.8687);
  assert.strictEqual(result, 'সিলেট');
});

check('weather.js: Haversine correctly identifies Barishal coordinates (22.7010, 90.3535)', () => {
  const result = Weather.findNearestDistrictClient(22.7010, 90.3535);
  assert.strictEqual(result, 'বরিশাল');
});

check('weather.js: Coordinates outside Bangladesh (London 51.5074, -0.1278) fallback to ঢাকা', () => {
  const result = Weather.findNearestDistrictClient(51.5074, -0.1278);
  assert.strictEqual(result, 'ঢাকা');
});

check('weather.js: Bounding box returns false for London', () => {
  assert.strictEqual(Weather.isInsideBangladesh(51.5074, -0.1278), false);
});

check('weather.js: Bounding box returns true for Dhaka', () => {
  assert.strictEqual(Weather.isInsideBangladesh(23.8103, 90.4125), true);
});

// 7. Verify autoDetectDistrictOnLoad handles mock geolocation
console.log('\n🌐 Step 7: Testing autoDetectDistrictOnLoad with Mock Geolocation...');

// Test 7a: Success case (user grants permission in Rangpur)
let geolocationSuccessCalled = false;
global.navigator = {
  geolocation: {
    getCurrentPosition: (success, error, options) => {
      // Mock Rangpur coordinates
      success({ coords: { latitude: 25.7439, longitude: 89.2752 } });
      geolocationSuccessCalled = true;
    }
  }
};

check('autoDetectDistrictOnLoad: Auto-resolves Rangpur on load', () => {
  Weather.autoDetectDistrictOnLoad();
  assert(geolocationSuccessCalled, 'getCurrentPosition was not invoked');
  assert.strictEqual(mockStorage['smart_agro_district'], 'রংপুর');
  assert.strictEqual(mockElements['district-select'].value, 'রংপুর');
  assert.strictEqual(mockElements['weather-location-label'].innerText, 'রংপুর');
});

// Test 7b: Denial case (user blocks permission -> falls back to Dhaka)
mockStorage['smart_agro_district'] = '';
let geolocationErrorCalled = false;
global.navigator = {
  geolocation: {
    getCurrentPosition: (success, error, options) => {
      error({ code: 1, message: 'User denied Geolocation' });
      geolocationErrorCalled = true;
    }
  }
};

check('autoDetectDistrictOnLoad: Clean fallback to Dhaka on permission denial without throwing', () => {
  Weather.autoDetectDistrictOnLoad();
  assert(geolocationErrorCalled, 'Error callback was not invoked');
  assert.strictEqual(mockStorage['smart_agro_district'], 'ঢাকা');
  assert.strictEqual(mockElements['district-select'].value, 'ঢাকা');
  assert.strictEqual(mockElements['weather-location-label'].innerText, 'ঢাকা');
});

// Test 7c: No navigator.geolocation support
delete global.navigator.geolocation;
mockStorage['smart_agro_district'] = '';
check('autoDetectDistrictOnLoad: Clean fallback to Dhaka when navigator.geolocation is absent', () => {
  Weather.autoDetectDistrictOnLoad();
  assert.strictEqual(mockStorage['smart_agro_district'], 'ঢাকা');
  assert.strictEqual(mockElements['district-select'].value, 'ঢাকা');
  assert.strictEqual(mockElements['weather-location-label'].innerText, 'ঢাকা');
});

// Summary
console.log('\n🌾 ===============================================================');
console.log(`🌾 Milestone 2 Results: ${passCount}/${totalChecks} checks passed.`);
console.log('🌾 ===============================================================\n');

if (passCount !== totalChecks) {
  process.exit(1);
} else {
  console.log('✅ ALL MILESTONE 2 REQUIREMENTS VERIFIED SUCCESSFULLY!');
}
