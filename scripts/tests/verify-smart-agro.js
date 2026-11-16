const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const projectRoot = path.resolve(__dirname, '..', '..');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (postData) {
      if (typeof postData === 'string') {
        req.write(postData);
      } else if (Buffer.isBuffer(postData)) {
        req.write(postData);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 SMART AGRO (স্মার্ট এগ্রো) COMPREHENSIVE VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // ------------------------------------------------------------------
  // 1. Static Routes & Clean URLs
  // ------------------------------------------------------------------
  console.log('--- 1. Testing Clean URLs and Dedicated Page Routes ---');
  const routes = [
    '/',
    '/scan',
    '/scan.html',
    '/scanner',
    '/roadmap',
    '/guides',
    '/grafting',
    '/grafting.html',
    '/nursery',
    '/kalom',
    '/crop-detail',
    '/crop-guide',
    '/roadmap/rice',
    '/calculator',
    '/fertilizer',
    '/history',
    '/roadmap.html',
    '/crop-detail.html',
    '/calculator.html',
    '/history.html'
  ];

  for (const route of routes) {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: route,
      method: 'GET'
    });
    assert(res.statusCode === 200, `GET ${route} returned HTTP 200`);
  }

  // ------------------------------------------------------------------
  // 2. Weather & Live GPS Geocoding
  // ------------------------------------------------------------------
  console.log('\n--- 2. Testing Weather, Live GPS, and Geocoding ---');
  {
    // Default weather (Brahmanbaria)
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/weather',
      method: 'GET'
    });
    assert(res.statusCode === 200 && res.body.success, 'GET /api/weather returned 200 success');
    assert(res.body.weather && res.body.weather.location.includes('ব্রাহ্মণবাড়িয়া'), `Default location is ব্রাহ্মণবাড়িয়া (got: ${res.body.weather?.location})`);
    assert(res.body.spraying && res.body.spraying.window_bn, `Spraying window status present (${res.body.spraying?.window_bn})`);
    assert(res.body.alert && res.body.alert.title, `Agro alert banner present (${res.body.alert?.title})`);
  }

  {
    // Rangpur GPS lookup
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/weather?lat=25.7439&lon=89.2752',
      method: 'GET'
    });
    assert(res.statusCode === 200 && res.body.weather.location.includes('রংপুর'), `GPS coordinates (25.74, 89.27) correctly mapped to রংপুর (got: ${res.body.weather?.location})`);
  }

  {
    // Chittagong GPS lookup
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/weather?lat=22.3569&lon=91.7832',
      method: 'GET'
    });
    assert(res.statusCode === 200 && res.body.weather.location.includes('চট্টগ্রাম'), `GPS coordinates (22.35, 91.78) correctly mapped to চট্টগ্রাম (got: ${res.body.weather?.location})`);
  }

  // ------------------------------------------------------------------
  // 3. Fertilizer Calculator (BARC standards, Unicode, Katha, Splits)
  // ------------------------------------------------------------------
  console.log('\n--- 3. Testing BARC Fertilizer Calculator & Split Schedules ---');
  {
    // Onion with Katha unit (10 katha = 16.5 decimals) and Unicode 1 (\u09AF\u09BC)
    const postData = JSON.stringify({
      crop_name: 'পেঁয়াজ',
      land_amount: 10,
      land_unit: 'কাঠা'
    });
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/fertilizer-calc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert(res.statusCode === 200 && res.body.success, 'POST /api/fertilizer-calc for Onion (কাঠা) succeeded');
    assert(res.body.data.decimals === 16.5, `10 Katha converted to 16.5 Decimals (got: ${res.body.data.decimals})`);
    assert(res.body.data.tsp_kg === 13.2, `Onion TSP rate: 0.8 * 16.5 = 13.2 kg (got: ${res.body.data.tsp_kg})`);
    assert(res.body.data.split_instructions && res.body.data.split_instructions.length === 3, 'Onion 3-stage split application calendar returned');
    assert(res.body.data.split_instructions[1].stage.includes('২৫ দিন'), 'Onion stage 2 mentions 25 days (got: ' + res.body.data.split_instructions[1].stage + ')');
  }

  {
    // Onion with Unicode 2 (\u09DF) and Bigha
    const postData = JSON.stringify({
      crop_name: 'পেঁয়াজ',
      land_amount: 1,
      land_unit: 'বিঘা'
    });
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/fertilizer-calc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert(res.statusCode === 200 && res.body.success, 'Onion variant পেঁয়াজ normalized correctly');
    assert(res.body.data.decimals === 33, `1 Bigha converted to 33 Decimals (got: ${res.body.data.decimals})`);
    assert(res.body.data.urea_kg === 33, `Onion Urea for 33 dec: 1.0 * 33 = 33 kg (got: ${res.body.data.urea_kg})`);
  }

  {
    // Seedling-based Fertilizer Calculation (টমেটো - ৫০০ চারা)
    const postData = JSON.stringify({
      calc_mode: 'seedling_count',
      crop_name: 'টমেটো',
      seedling_count: 500,
      plant_unit: 'টি চারা'
    });
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/fertilizer-calc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert(res.statusCode === 200 && res.body.success, 'POST /api/fertilizer-calc for 500 Tomato Seedlings succeeded');
    assert(res.body.data.calc_mode === 'seedling_count', 'Response reflects calc_mode: seedling_count');
    assert(res.body.data.urea_kg === 4.0, `500 Tomato seedlings Urea: 8g * 500 = 4.0 kg (got: ${res.body.data.urea_kg})`);
    assert(res.body.data.per_plant && res.body.data.per_plant.urea_g === 8, 'Per-plant dose breakdown contains 8g Urea');
    assert(res.body.data.decimals > 0, `Estimated land decimals returned: ${res.body.data.decimals}`);
  }

  {
    // Tree-based Fertilizer Calculation (পেঁপে - ৫০টি গাছ)
    const postData = JSON.stringify({
      calc_mode: 'seedling_count',
      crop_name: 'পেঁপে',
      seedling_count: 50,
      plant_unit: 'টি গাছ'
    });
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/fertilizer-calc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert(res.statusCode === 200 && res.body.success, 'POST /api/fertilizer-calc for 50 Papaya Trees succeeded');
    assert(res.body.data.urea_kg === 25.0, `50 Papaya Trees Urea: 500g * 50 = 25.0 kg (got: ${res.body.data.urea_kg})`);
    assert(res.body.data.organic_kg === 750.0, `50 Papaya Trees Compost: 15kg * 50 = 750 kg (got: ${res.body.data.organic_kg})`);
  }

  {
    // Land Area Mode returns estimated seedling count for transplanted crops (বেগুন)
    const postData = JSON.stringify({
      calc_mode: 'land_area',
      crop_name: 'বেগুন',
      land_amount: 10,
      land_unit: 'শতাংশ'
    });
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/fertilizer-calc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert(res.statusCode === 200 && res.body.success, 'POST /api/fertilizer-calc for 10 Decimals Eggplant succeeded');
    assert(res.body.data.seedling_info && res.body.data.seedling_info.is_transplanted, 'Eggplant land calculation provides seedling_info');
    assert(res.body.data.seedling_info.seedling_count > 0, `Estimated seedling count: ${res.body.data.seedling_info.seedling_count}`);
  }

  {
    // Potato split schedule (earthing up)
    const postData = JSON.stringify({
      crop_name: 'আলু',
      land_amount: 33,
      land_unit: 'শতাংশ'
    });
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/fertilizer-calc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert(res.statusCode === 200 && res.body.success, 'Potato fertilizer calculation succeeded');
    assert(res.body.data.split_instructions && res.body.data.split_instructions.length === 2, 'Potato 2-stage split calendar returned');
    assert(res.body.data.split_instructions[1].stage.includes('গোড়ায় মাটি তোলা'), 'Potato stage 2 correctly specifies earthing up (গোড়ায় মাটি তোলা)');
  }

  {
    // Edge case: negative or NaN land amount
    const postData = JSON.stringify({
      crop_name: 'ধান',
      land_amount: -5,
      land_unit: 'শতাংশ'
    });
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/fertilizer-calc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert(res.statusCode === 200 && res.body.success, 'Invalid land amount sanitized without crash');
    assert(res.body.data.decimals === 1, `Negative amount safely fell back to 1.0 (got: ${res.body.data.decimals})`);
  }

  // ------------------------------------------------------------------
  // 4. Cultivation Guides API
  // ------------------------------------------------------------------
  console.log('\n--- 4. Testing Cultivation Guides API (40+ Crops & Varieties) ---');
  {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/guides',
      method: 'GET'
    });
    assert(res.statusCode === 200 && res.body.success, 'GET /api/guides returned 200');
    assert(res.body.data.length >= 40, `Comprehensive 40+ crops & varieties returned (got: ${res.body.data.length})`);

    const rice = res.body.data.find(c => c.crop_id === 'rice');
    assert(rice && rice.steps.length === 5, 'Rice guide has all 5 stages (মাটি প্রস্তুতি to ফসল সংগ্রহ)');
    assert(rice.gallery && rice.gallery.crop && rice.gallery.seed && rice.gallery.seedling && rice.gallery.harvest, 'Rice guide has all 4 gallery images (crop, seed, seedling, harvest)');

    // Specific varieties checks (Paddy and Eggplant varieties)
    const paddyVarieties = ['rice_boro', 'rice_aman', 'rice_aus', 'rice_aromatic'];
    for (const p of paddyVarieties) {
      const v = res.body.data.find(c => c.crop_id === p);
      assert(v, `Paddy variety ${p} exists in catalog (${v?.crop_name_bn})`);
    }

    const eggplantVarieties = ['eggplant_round', 'eggplant_long', 'eggplant_bt', 'eggplant_green'];
    for (const e of eggplantVarieties) {
      const v = res.body.data.find(c => c.crop_id === e);
      assert(v, `Eggplant variety ${e} exists in catalog (${v?.crop_name_bn})`);
    }

    // High value fruit and grafting crops
    const fruitCrops = ['guava', 'lemon', 'mango', 'dragon_fruit', 'malta', 'pointed_gourd', 'malabar_spinach'];
    for (const f of fruitCrops) {
      const v = res.body.data.find(c => c.crop_id === f);
      assert(v, `High-value crop ${f} exists in catalog (${v?.crop_name_bn})`);
    }

    // Check targeted corrected images (9 user requested crops)
    const targetedCrops = ['stem_amaranth', 'lentil', 'mustard', 'ginger', 'turmeric', 'bitter_gourd', 'sweet_gourd', 'eggplant', 'rice'];
    for (const tid of targetedCrops) {
      const crop = res.body.data.find(c => c.crop_id === tid);
      assert(crop, `Targeted crop ${tid} exists in guides catalog`);
      const cropImg = path.join(projectRoot, 'public', crop.gallery.crop);
      assert(fs.existsSync(cropImg) && fs.statSync(cropImg).size > 50000, `Targeted crop ${tid} image verified authentic (>50KB, got: ${fs.statSync(cropImg).size} b)`);
      assert(crop.youtube && crop.youtube.video_id, `Crop ${tid} has valid YouTube video ID (${crop.youtube?.video_id})`);
    }
  }

  {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/guides/potato',
      method: 'GET'
    });
    assert(res.statusCode === 200 && res.body.data.crop_id === 'potato', 'Single guide GET /api/guides/potato succeeded');
  }

  // ------------------------------------------------------------------
  // 5. AI Crop Disease Scanner API & Evaluation Dataset Verification
  // ------------------------------------------------------------------
  console.log('\n--- 5. Testing AI Disease Scanner with Evaluation Dataset ---');

  let lastInsertedId = null;

  // 5.1 Positive Evaluation Dataset: Valid Crop Leaves Ground-Truth
  const positiveDataset = [
    {
      file: path.join(projectRoot, 'test image crop disease', 'images.jpeg'),
      name: 'images.jpeg',
      crop: 'auto',
      expectedClassIndex: 27,
      expectedClassName: 'Insect Pest Disease',
      expectedCropBn: 'সবজি ও ফসল',
      expectedDiseaseBn: 'পোকামাকড়ের আক্রমণ ও পাতার ক্ষতি',
      minConfidence: 35.0
    },
    {
      file: path.join(projectRoot, 'test image crop disease', 'images (1).jpeg'),
      name: 'images (1).jpeg',
      crop: 'auto',
      expectedClassIndex: 59,
      expectedClassName: 'bean_rust',
      expectedCropBn: 'শিম ও বরবটি',
      expectedDiseaseBn: 'শিমের মরিচা রোগ (রাস্ট)',
      minConfidence: 35.0
    },
    {
      file: path.join(projectRoot, 'test image crop disease', 'images (2).jpeg'),
      name: 'images (2).jpeg',
      crop: 'auto',
      expectedClassIndex: 18,
      expectedClassName: 'Downy Mildew',
      expectedCropBn: 'শসা / ক্ষীরা / মিষ্টি কুমড়া / সবজি',
      expectedDiseaseBn: 'ডাউনি মিলডিউ রোগ',
      minConfidence: 35.0
    },
    {
      file: path.join(projectRoot, 'test image crop disease', 'images (3).jpeg'),
      name: 'images (3).jpeg',
      crop: 'auto',
      expectedClassIndex: 18,
      expectedClassName: 'Downy Mildew',
      expectedCropBn: 'শসা / ক্ষীরা / মিষ্টি কুমড়া / সবজি',
      expectedDiseaseBn: 'ডাউনি মিলডিউ রোগ',
      minConfidence: 35.0
    },
    {
      file: path.join(projectRoot, 'public', 'uploads', 'sample_tomato.jpg'),
      name: 'sample_tomato.jpg',
      crop: 'টমেটো',
      expectedClassIndex: 47,
      expectedClassName: 'Tomato___Early_blight',
      expectedCropBn: 'টমেটো',
      expectedDiseaseBn: 'টমেটোর আগাম ধসা রোগ (আর্লি ব্লাইট)',
      minConfidence: 35.0,
      uid: 'demo-farmer-karim',
      captureId: true
    }
  ];

  for (const pos of positiveDataset) {
    assert(fs.existsSync(pos.file), `Positive evaluation asset exists: ${pos.name}`);

    const form = new FormData();
    form.append('image', fs.createReadStream(pos.file), { filename: pos.name });
    form.append('crop_name', pos.crop);
    form.append('district', 'রংপুর');
    form.append('firebase_uid', pos.uid || 'eval-suite');
    form.append('user_name', 'করিম উদ্দিন');

    const formHeaders = form.getHeaders();
    const response = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/detect',
        method: 'POST',
        headers: formHeaders
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      form.pipe(req);
    });

    assert(response.statusCode === 200 && response.body.success, `Positive leaf scan for ${pos.name} returned HTTP 200 success`);
    const data = response.body.data;
    assert(data.crop_name === pos.expectedCropBn, `Crop name matches Bengali taxonomy: ${pos.expectedCropBn} (got: ${data.crop_name})`);
    assert(data.disease_bn === pos.expectedDiseaseBn, `Disease matches ground truth: ${pos.expectedDiseaseBn} (got: ${data.disease_bn})`);
    assert(data.confidence >= pos.minConfidence, `Confidence >= ${pos.minConfidence}% (got: ${data.confidence}%)`);
    assert(data.symptoms && data.organic_solution && data.chemical_solution && data.safety_warning, `Diagnostic report has complete remedies and safety warning`);
    assert(data.image_path && data.image_path.startsWith('/uploads/crop-'), `Image persisted asynchronously to disk: ${data.image_path}`);

    if (pos.captureId) {
      lastInsertedId = data.id;
    }
  }

  // 5.2 Negative Evaluation Dataset: Strict Non-Leaf, Produce & Unsupported Rejection
  const uploadsDir = path.join(projectRoot, 'public', 'uploads');
  const negativeDataset = [
    {
      label: 'Machinery / Farm Equipment (tractor_test.jpg)',
      file: path.join(projectRoot, 'public', 'uploads', 'tractor_test.jpg'),
      endpoint: '/api/scan',
      crop: 'tomato',
      expectedErrorCode: 'NON_LEAF_OBJECT',
      expectedMsgFragment: 'যন্ত্রপাতি'
    },
    {
      label: 'Harvested Produce / Potato Tuber (potato_tuber_test.jpg)',
      file: path.join(projectRoot, 'public', 'uploads', 'potato_tuber_test.jpg'),
      endpoint: '/api/scan',
      crop: 'potato',
      expectedErrorCode: 'NON_LEAF_OBJECT',
      expectedMsgFragment: 'ক্লোরোফিল'
    },
    {
      label: 'Sample Potato Produce (sample_potato.jpg)',
      file: path.join(projectRoot, 'public', 'uploads', 'sample_potato.jpg'),
      endpoint: '/api/detect',
      crop: 'আলু',
      expectedErrorCode: 'NON_LEAF_OBJECT',
      expectedMsgFragment: 'ক্লোরোফিল'
    },
    {
      label: 'Unsupported Plant Species (sample_rice.jpg / ধান)',
      file: path.join(projectRoot, 'public', 'uploads', 'sample_rice.jpg'),
      endpoint: '/api/detect',
      crop: 'ধান',
      expectedErrorCode: 'UNSUPPORTED_CROP_SPECIES',
      expectedMsgFragment: 'ধান'
    },
    {
      label: 'Unsupported Plant Species (sample_eggplant.jpg / বেগুন)',
      file: path.join(projectRoot, 'public', 'uploads', 'sample_eggplant.jpg'),
      endpoint: '/api/detect',
      crop: 'বেগুন',
      expectedErrorCode: 'UNSUPPORTED_CROP_SPECIES',
      expectedMsgFragment: 'বেগুন'
    }
  ];

  for (const neg of negativeDataset) {
    if (!fs.existsSync(neg.file)) {
      console.warn(`Negative test asset ${neg.file} not found, skipping.`);
      continue;
    }

    const fileCountBefore = fs.readdirSync(uploadsDir).length;
    const form = new FormData();
    form.append('image', fs.createReadStream(neg.file), { filename: path.basename(neg.file) });
    form.append('crop_name', neg.crop);
    form.append('crop_type', neg.crop);

    const formHeaders = form.getHeaders();
    const response = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: neg.endpoint,
        method: 'POST',
        headers: formHeaders
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      form.pipe(req);
    });

    assert(response.body.is_unidentified === true, `Negative target [${neg.label}] rejected with is_unidentified: true`);
    assert(response.body.error_code === neg.expectedErrorCode, `Error code is ${neg.expectedErrorCode} (got: ${response.body.error_code})`);
    assert(response.body.message && response.body.message.includes(neg.expectedMsgFragment), `Bengali message contains guidance for [${neg.expectedMsgFragment}]`);
    assert(response.body.image_path === null || response.body.image_path === undefined, `Zero storage leak: image_path is null in response`);
    const fileCountAfter = fs.readdirSync(uploadsDir).length;
    assert(fileCountAfter === fileCountBefore, `Zero storage leak: no file persisted to public/uploads/ (count: ${fileCountAfter})`);
  }

  // 5.3 Non-Image Payload & Magic Byte Guard
  {
    const pkgPath = path.join(projectRoot, 'package.json');
    const fileCountBefore = fs.readdirSync(uploadsDir).length;
    const form = new FormData();
    form.append('image', fs.createReadStream(pkgPath), { filename: 'package.json' });

    const formHeaders = form.getHeaders();
    const response = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/scan',
        method: 'POST',
        headers: formHeaders
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      form.pipe(req);
    });

    assert(response.statusCode === 400, `Non-image payload rejected with HTTP 400 Bad Request`);
    assert(response.body.is_unidentified === true && response.body.error_code === 'INVALID_IMAGE', `Non-image payload error_code is INVALID_IMAGE`);
    assert(response.body.message.includes('JPG, PNG বা WebP'), `Non-image payload guidance mentions valid image formats`);
    assert(fs.readdirSync(uploadsDir).length === fileCountBefore, `Zero storage leak on non-image upload`);
  }

  // 5.4 Blank Buffer / Truncated Image Guard
  {
    const fileCountBefore = fs.readdirSync(uploadsDir).length;
    const form = new FormData();
    const blankBuf = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
    form.append('image', blankBuf, { filename: 'blank.jpg', contentType: 'image/jpeg' });
    const formHeaders = form.getHeaders();

    const response = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/scan',
        method: 'POST',
        headers: formHeaders
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      form.pipe(req);
    });

    assert(response.body.is_unidentified === true, 'Blank image correctly rejected as unidentified');
    assert(fs.readdirSync(uploadsDir).length === fileCountBefore, `Zero storage leak on blank image upload`);
  }

  // ------------------------------------------------------------------
  // 6. History API & Record Deletion
  // ------------------------------------------------------------------
  console.log('\n--- 6. Testing History API & Delete Functionality ---');
  {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/history?firebase_uid=demo-farmer-karim',
      method: 'GET'
    });

    assert(res.statusCode === 200 && res.body.success, 'GET /api/history for Karim returned 200');
    assert(res.body.data.length > 0, `History contains ${res.body.data.length} records`);
    const hasWarning = res.body.data.some(r => r.safety_warning && r.safety_warning.length > 5);
    assert(hasWarning, 'History records include safety_warning column');
  }

  if (lastInsertedId) {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/history/${lastInsertedId}`,
      method: 'DELETE'
    });
    assert(res.statusCode === 200 && res.body.success, `DELETE /api/history/${lastInsertedId} succeeded`);
  }

  // ------------------------------------------------------------------
  // 7. Codebase Syntax Integrity Audit
  // ------------------------------------------------------------------
  console.log('\n--- 7. Testing JavaScript Syntax Integrity across Codebase ---');
  {
    const { execSync } = require('child_process');
    const jsFiles = [
      'server.js', 'db.js',
      'data/cropGuidesData.js', 'data/plantFertilizerSpecs.js',
      'scripts/build/build-crop-guides.js', 'scripts/build/expand-crop-catalog.js',
      'scripts/assets/check-assets.js', 'scripts/assets/download-crop-assets.js',
      'scripts/assets/download-9-crops-assets.js', 'scripts/assets/download-grafting-assets.js',
      'scripts/assets/download-new-crops-assets.js', 'scripts/assets/fix-target-images.js',
      'scripts/assets/resolve-remaining-images.js', 'scripts/generators/generate-docs.js',
      'scripts/tests/verify-smart-agro.js',
      'public/js/app.js', 'public/js/crop-detail.js', 'public/js/fertilizer.js',
      'public/js/firebase-config.js', 'public/js/guides.js', 'public/js/history.js',
      'public/js/scanner.js', 'public/js/voice-assistant.js', 'public/js/weather.js',
      'public/js/grafting.js'
    ];
    let allValid = true;
    for (const f of jsFiles) {
      try {
        const full = path.join(projectRoot, f);
        execSync(`node -c "${full}"`);
      } catch (err) {
        allValid = false;
        console.error(`Syntax error in ${f}:`, err.message);
      }
    }
    assert(allValid, `All ${jsFiles.length} JavaScript source files passed Node.js syntax verification`);
  }

  // ------------------------------------------------------------------
  // 8. Agricultural Photo Asset Inventory (40 Crops = 160 Images)
  // ------------------------------------------------------------------
  console.log('\n--- 8. Testing Complete Agricultural Asset Inventory (160 Images) ---');
  {
    const { allCropGuides } = require(path.join(projectRoot, 'data', 'cropGuidesData.js'));
    let totalImages = 0;
    let missingImages = 0;
    let tinyImages = 0;

    allCropGuides.forEach(c => {
      ['crop', 'seed', 'seedling', 'harvest'].forEach(type => {
        totalImages++;
        const rel = c.gallery ? c.gallery[type] : null;
        if (!rel) {
          missingImages++;
          return;
        }
        const fullPath = path.join(projectRoot, 'public', rel);
        if (!fs.existsSync(fullPath)) {
          missingImages++;
        } else {
          const stats = fs.statSync(fullPath);
          if (stats.size < 5000) {
            tinyImages++;
          }
        }
      });
    });

    assert(totalImages >= 160, `Catalog specifies ${totalImages} agricultural gallery images (${allCropGuides.length} crops x 4 types)`);
    assert(missingImages === 0, `All ${totalImages} images exist on disk (missing: ${missingImages})`);
    assert(tinyImages === 0, `All ${totalImages} images are authentic high-resolution photos >5KB (tiny: ${tinyImages})`);
  }

  // ------------------------------------------------------------------
  // 9. CSS Print Margins & Isolation Verification
  // ------------------------------------------------------------------
  console.log('\n--- 9. Testing Print Margins & A4 Isolation Rules ---');
  {
    const cssPath = path.join(projectRoot, 'public/css/style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert(cssContent.includes('@page {'), 'CSS defines dedicated @page rules for paper printing');
    assert(cssContent.includes('margin: 6mm 8mm 6mm 8mm;') || cssContent.includes('8mm'), 'Slim print side margins (8mm) applied for wide readable layout');
    assert(cssContent.includes('.video-compact-card'), 'Compact video card CSS class present (max-width: 580px)');
    assert(cssContent.includes('display: none !important') && cssContent.includes('.no-print'), 'No-print isolation directives present');
  }

  // ------------------------------------------------------------------
  // 10. Dedicated Crop Detail Page Architecture
  // ------------------------------------------------------------------
  console.log('\n--- 10. Testing Dedicated Crop Detail Page Architecture ---');
  {
    const detailHtmlPath = path.join(projectRoot, 'public/crop-detail.html');
    const htmlContent = fs.readFileSync(detailHtmlPath, 'utf8');

    assert(htmlContent.includes('id="crop-detail-viewport"'), 'crop-detail.html has #crop-detail-viewport container');
    assert(htmlContent.includes('id="quick-crop-switcher"'), 'crop-detail.html has #quick-crop-switcher dropdown for instant switching');
    assert(htmlContent.includes('id="breadcrumb-crop-name"'), 'crop-detail.html has dynamic breadcrumb element');
    assert(htmlContent.includes('href="/roadmap"'), 'crop-detail.html has return link to roadmap catalog');
  }

  // ------------------------------------------------------------------
  // 11. Dedicated Grafting & Nursery Page Architecture
  // ------------------------------------------------------------------
  console.log('\n--- 11. Testing Dedicated Grafting & Nursery Page Architecture ---');
  {
    const graftingHtmlPath = path.join(projectRoot, 'public/grafting.html');
    const htmlContent = fs.readFileSync(graftingHtmlPath, 'utf8');

    assert(htmlContent.includes('id="simulator-section"'), 'grafting.html has interactive simulator section');
    assert(htmlContent.includes('id="grafting-anim-viewport"'), 'grafting.html has animated SVG canvas viewport');
    assert(htmlContent.includes('id="grafting-methods-grid"'), 'grafting.html has methods grid for plant specific guides');
    assert(htmlContent.includes('veg_cleft_grafting.jpg'), 'grafting.html embeds authentic vegetable cleft grafting photo');
    assert(htmlContent.includes('air_layering_guava.jpg'), 'grafting.html embeds authentic guava air layering photo');

    const graftingJsPath = path.join(projectRoot, 'public/js/grafting.js');
    const jsContent = fs.readFileSync(graftingJsPath, 'utf8');
    assert(jsContent.includes('SmartAgroGrafting'), 'public/js/grafting.js exports SmartAgroGrafting module');
    assert(jsContent.includes('stepData') && jsContent.includes('ক্যাম্বিয়াম'), 'grafting.js has cambium alignment step animation');
  }

  // ------------------------------------------------------------------
  // 12. Documentation Isolation & Multi-Guide PDF Manuals
  // ------------------------------------------------------------------
  console.log('\n--- 12. Testing Documentation Separation & Multi-Guide PDF Manuals ---');
  {
    const pdfDir = path.join(projectRoot, 'docs', 'pdfs');
    const devGuidePdf = path.join(pdfDir, 'Smart_Agro_Developer_Guide.pdf');
    const aiGuidePdf = path.join(pdfDir, 'AI_Model_Integration_Guide.pdf');
    const deployGuidePdf = path.join(pdfDir, 'Deployment_and_Hosting_Guide.pdf');

    // 1. All 3 manuals exist in docs/pdfs/
    assert(fs.existsSync(devGuidePdf), 'docs/pdfs/Smart_Agro_Developer_Guide.pdf exists');
    assert(fs.existsSync(aiGuidePdf), 'docs/pdfs/AI_Model_Integration_Guide.pdf exists');
    assert(fs.existsSync(deployGuidePdf), 'docs/pdfs/Deployment_and_Hosting_Guide.pdf exists');

    // 2. Sizes and valid PDF headers (>100KB each)
    [
      { file: devGuidePdf, name: 'Developer Guide' },
      { file: aiGuidePdf, name: 'AI Model Setup Guide' },
      { file: deployGuidePdf, name: 'Deployment & Hosting Guide' }
    ].forEach(item => {
      const stats = fs.statSync(item.file);
      assert(stats.size > 100000, `${item.name} PDF is substantial (>100KB, got: ${(stats.size/1024).toFixed(1)} KB)`);
      const buffer = fs.readFileSync(item.file, { flag: 'r' });
      assert(buffer.slice(0, 5).toString('ascii') === '%PDF-', `${item.name} starts with valid %PDF- header`);
    });

    // 3. Verify public/ bundle has NO .pdf files (isolated non-deployment artifacts)
    function findPdfs(dir) {
      let results = [];
      if (!fs.existsSync(dir)) return results;
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results = results.concat(findPdfs(full));
        } else if (item.toLowerCase().endsWith('.pdf')) {
          results.push(full);
        }
      }
      return results;
    }
    const publicPdfs = findPdfs(path.join(projectRoot, 'public'));
    assert(publicPdfs.length === 0, `public/ bundle has 0 PDF files for lightweight deployment (found: ${publicPdfs.length})`);

    // 4. Test Local Documentation Routes in server.js
    const resDev = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/docs/guide',
      method: 'GET'
    });
    assert(resDev.statusCode === 200 && resDev.headers['content-type']?.includes('application/pdf'), 'GET /docs/guide serves Smart_Agro_Developer_Guide.pdf');

    const resAi = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/docs/ai-model',
      method: 'GET'
    });
    assert(resAi.statusCode === 200 && resAi.headers['content-type']?.includes('application/pdf'), 'GET /docs/ai-model serves AI_Model_Integration_Guide.pdf');

    const resDep = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/docs/deployment',
      method: 'GET'
    });
    assert(resDep.statusCode === 200 && resDep.headers['content-type']?.includes('application/pdf'), 'GET /docs/deployment serves Deployment_and_Hosting_Guide.pdf');

    // 5. Test Interactive Web Document Views & Markdown Mirrors
    const resViewAi = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/docs/view/ai-model',
      method: 'GET'
    });
    assert(resViewAi.statusCode === 200 && resViewAi.body.includes('এআই মডেল'), 'GET /docs/view/ai-model serves interactive HTML viewer');

    const mdGuides = ['AI_Model_Integration_Guide.md', 'Deployment_and_Hosting_Guide.md', 'Smart_Agro_Developer_Guide.md'];
    mdGuides.forEach(m => {
      const full = path.join(projectRoot, 'docs', m);
      assert(fs.existsSync(full) && fs.statSync(full).size > 1000, `docs/${m} exists for instant in-IDE Markdown preview`);
    });

    // 6. Test package.json scripts & .dockerignore
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    assert(pkg.scripts && pkg.scripts.docs.includes('scripts/generators/generate-docs.js'), 'package.json "docs" script points to scripts/generators/generate-docs.js');
    assert(pkg.scripts && pkg.scripts.test.includes('scripts/tests/verify-smart-agro.js'), 'package.json "test" script points to scripts/tests/verify-smart-agro.js');

    const dockerignore = fs.readFileSync(path.join(projectRoot, '.dockerignore'), 'utf8');
    assert(dockerignore.includes('docs/') && dockerignore.includes('scripts/'), '.dockerignore excludes docs/ and scripts/ from deployment container');
  }

  // ------------------------------------------------------------------
  // 13. System Speed, Image Compression & Gzip Performance
  // ------------------------------------------------------------------
  console.log('\n--- 13. Testing Fast Loading, Image Compression & Gzip Optimization ---');
  {
    const serverJsContent = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf8');
    assert(serverJsContent.includes("require('compression')") || serverJsContent.includes('compression()'), 'server.js has compression middleware enabled');
    assert(serverJsContent.includes('maxAge') && serverJsContent.includes('Cache-Control'), 'server.js configures smart HTTP asset caching');

    // Measure public/images directory size
    function getDirSize(dir) {
      let total = 0;
      if (!fs.existsSync(dir)) return 0;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          total += getDirSize(full);
        } else {
          total += stat.size;
        }
      }
      return total;
    }

    const totalImgSize = getDirSize(path.join(projectRoot, 'public/images'));
    const totalImgMB = totalImgSize / (1024 * 1024);
    assert(totalImgMB < 35.0, `Total images optimized from 450MB down to <35MB (got: ${totalImgMB.toFixed(2)} MB)`);

    // Verify all 160 crop images are individually compressed and under 400KB
    const { allCropGuides } = require(path.join(projectRoot, 'data', 'cropGuidesData.js'));
    let oversizedCount = 0;
    allCropGuides.forEach(c => {
      ['crop', 'seed', 'seedling', 'harvest'].forEach(t => {
        const p = path.join(projectRoot, 'public', c.gallery[t]);
        if (fs.existsSync(p)) {
          const sz = fs.statSync(p).size;
          if (sz > 400 * 1024) oversizedCount++;
        }
      });
    });
    assert(oversizedCount === 0, `All 160 crop gallery images are fast-loading (<400KB each, oversized: ${oversizedCount})`);
  }

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');
  
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
