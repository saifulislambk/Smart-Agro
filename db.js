const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool = null;
let isPostgresConnected = false;

// In-Memory store for graceful local dev fallback
const inMemoryStore = {
  scan_history: [
    {
      id: 1,
      firebase_uid: 'guest',
      user_name: 'কৃষক ভাই',
      district: 'ব্রাহ্মণবাড়িয়া',
      crop_name: 'ধান',
      disease_bn: 'ধানের ব্লাস্ট রোগ (Leaf Blast)',
      disease_en: 'Rice Blast',
      confidence: 94.5,
      symptoms: 'পাতায় চোখের মতো বা ডিম্বাকৃতির দাগ, যার কেন্দ্রস্থল ধূসর এবং কিনারা বাদামী বর্ণ ধারণ করে।',
      organic_solution: 'প্রতি লিটার পানিতে ৫ গ্রাম ট্রাইকোডার্মা মিশিয়ে স্প্রে করুন। পরিমিত জৈব সার ব্যবহার করুন।',
      chemical_solution: 'ট্রাইসাইক্লাজোল ৭৫ ডব্লিউপি প্রতি লিটার পানিতে ০.৭৫ গ্রাম অথবা অ্যাজোক্সিস্ট্রবিন স্প্রে করুন।',
      safety_warning: 'স্প্রে করার সময় মুখে মাস্ক ও হাতে গ্লাভস পরিধান করুন। ফসল কাটার অন্তত ১৫ দিন পূর্বে রাসায়নিক স্প্রে বন্ধ রাখুন।',
      image_path: '/uploads/sample_rice.jpg',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 2,
      firebase_uid: 'guest',
      user_name: 'কৃষক ভাই',
      district: 'রংপুর',
      crop_name: 'টমেটো',
      disease_bn: 'টমেটোর লেইট ব্লাইট বা নাবি ধসা (Late Blight)',
      disease_en: 'Tomato Late Blight',
      confidence: 96.2,
      symptoms: 'পাতায় দ্রুত সম্প্রসারণশীল জলছাপ দাগ, পাতার নিচে সাদা পাউডারের মতো ছত্রাক আস্তরণ দেখা যায়।',
      organic_solution: 'বোর্দো মিশ্রণ (১%) অথবা তামাঘটিত জৈব ছত্রাকনাশক কুয়াশার আগে স্প্রে করুন।',
      chemical_solution: 'ম্যানকোজেব + মেটালেক্সিল (রিডোমিল গোল্ড) প্রতি লিটার পানিতে ২ গ্রাম হারে স্প্রে করুন।',
      safety_warning: 'টমেটো তোলার আগে স্প্রে করলে অন্তত ৭ দিন পর্যন্ত সেই টমেটো খাওয়ার জন্য বাজারে তোলা বা খাওয়া যাবে না।',
      image_path: '/uploads/sample_tomato.jpg',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ],
  crop_guides: require('./data/cropGuidesData').allCropGuides,
  fertilizer_plans: []
};

// Rich in-memory crop guides fallback (25 Comprehensive Crops)
function initCropGuidesData() {
  inMemoryStore.crop_guides = require('./data/cropGuidesData').allCropGuides;
}

initCropGuidesData();

// Initialize Postgres Connection
async function initDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.log('\x1b[33m%s\x1b[0m', 'ℹ️ [Smart Agro DB] No DATABASE_URL provided. Running with high-performance In-Memory repository fallback.');
    return;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    console.log('\x1b[32m%s\x1b[0m', '✅ [Smart Agro DB] Successfully connected to PostgreSQL Database.');
    isPostgresConnected = true;

    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const ddl = fs.readFileSync(schemaPath, 'utf8');
        await client.query(ddl);
        console.log('\x1b[32m%s\x1b[0m', '✅ [Smart Agro DB] schema.sql tables & seed data verified.');
      }
    } catch (schemaErr) {
      console.warn('⚠️ [Smart Agro DB] Warning while running schema.sql:', schemaErr.message);
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('\x1b[33m%s\x1b[0m', `⚠️ [Smart Agro DB] PostgreSQL connection error: ${err.message}. Seamlessly falling back to In-Memory repository.`);
    isPostgresConnected = false;
  }
}

// Save scan result
async function saveScan(scanData) {
  if (isPostgresConnected && pool) {
    try {
      const queryText = `
        INSERT INTO scan_history (
          firebase_uid, user_name, district, crop_name, disease_bn, disease_en, 
          confidence, symptoms, organic_solution, chemical_solution, safety_warning, image_path
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `;
      const values = [
        scanData.firebase_uid || 'guest',
        scanData.user_name || 'কৃষক ভাই',
        scanData.district || 'অজানা জেলা',
        scanData.crop_name,
        scanData.disease_bn,
        scanData.disease_en,
        scanData.confidence,
        scanData.symptoms,
        scanData.organic_solution,
        scanData.chemical_solution,
        scanData.safety_warning || '',
        scanData.image_path
      ];
      const res = await pool.query(queryText, values);
      return res.rows[0];
    } catch (err) {
      console.error('Postgres saveScan error, using in-memory store:', err.message);
    }
  }

  // In-Memory Fallback
  const newScan = {
    id: inMemoryStore.scan_history.length + 1,
    ...scanData,
    created_at: new Date().toISOString()
  };
  inMemoryStore.scan_history.unshift(newScan);
  return newScan;
}

// Get scan history
async function getHistory(firebase_uid = null) {
  if (isPostgresConnected && pool) {
    try {
      let queryText = 'SELECT * FROM scan_history ORDER BY created_at DESC LIMIT 50;';
      let params = [];
      if (firebase_uid && firebase_uid !== 'guest') {
        queryText = 'SELECT * FROM scan_history WHERE firebase_uid = $1 OR firebase_uid = \'guest\' ORDER BY created_at DESC LIMIT 50;';
        params = [firebase_uid];
      }
      const res = await pool.query(queryText, params);
      return res.rows;
    } catch (err) {
      console.error('Postgres getHistory error, using in-memory store:', err.message);
    }
  }

  // In-Memory Fallback
  if (firebase_uid && firebase_uid !== 'guest') {
    return inMemoryStore.scan_history.filter(s => s.firebase_uid === firebase_uid || s.firebase_uid === 'guest');
  }
  return inMemoryStore.scan_history;
}

// Get all crop guides
async function getCropGuides() {
  // cropGuidesData is our encyclopedic source of truth containing 25 crops,
  // 100 gallery images, detailed 5-stage agronomy, checklists, and YouTube tutorials
  const cropData = require('./data/cropGuidesData');
  return cropData.allCropGuides;
}

// Get single crop guide by crop_id
async function getCropGuideById(cropId) {
  if (!cropId) return null;
  const cropData = require('./data/cropGuidesData');
  return cropData.getCropById(cropId);
}

// Save Fertilizer Calculation Plan
async function saveFertilizerPlan(planData) {
  if (isPostgresConnected && pool) {
    try {
      const queryText = `
        INSERT INTO fertilizer_plans (
          firebase_uid, crop_name, land_amount, land_unit, 
          urea_kg, tsp_kg, mop_kg, gypsum_kg, zinc_kg, boron_kg, organic_kg
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;
      const values = [
        planData.firebase_uid || 'guest',
        planData.crop_name,
        planData.land_amount,
        planData.land_unit,
        planData.urea_kg,
        planData.tsp_kg,
        planData.mop_kg,
        planData.gypsum_kg,
        planData.zinc_kg,
        planData.boron_kg || 0,
        planData.organic_kg
      ];
      const res = await pool.query(queryText, values);
      return res.rows[0];
    } catch (err) {
      console.error('Postgres saveFertilizerPlan error, using in-memory store:', err.message);
    }
  }

  const newPlan = {
    id: inMemoryStore.fertilizer_plans.length + 1,
    ...planData,
    created_at: new Date().toISOString()
  };
  inMemoryStore.fertilizer_plans.unshift(newPlan);
  return newPlan;
}

// Get Fertilizer Plans
async function getFertilizerPlans(firebase_uid = null) {
  if (isPostgresConnected && pool) {
    try {
      let queryText = 'SELECT * FROM fertilizer_plans ORDER BY created_at DESC LIMIT 30;';
      let params = [];
      if (firebase_uid && firebase_uid !== 'guest') {
        queryText = 'SELECT * FROM fertilizer_plans WHERE firebase_uid = $1 ORDER BY created_at DESC LIMIT 30;';
        params = [firebase_uid];
      }
      const res = await pool.query(queryText, params);
      return res.rows;
    } catch (err) {
      console.error('Postgres getFertilizerPlans error, using in-memory store:', err.message);
    }
  }

  return inMemoryStore.fertilizer_plans;
}

// Delete scan from history
async function deleteScan(id) {
  const numericId = parseInt(id, 10);
  if (isPostgresConnected && pool) {
    try {
      const res = await pool.query('DELETE FROM scan_history WHERE id = $1 RETURNING *;', [numericId]);
      return res.rowCount > 0;
    } catch (err) {
      console.error('Postgres deleteScan error:', err.message);
    }
  }

  const initialLength = inMemoryStore.scan_history.length;
  inMemoryStore.scan_history = inMemoryStore.scan_history.filter(s => s.id !== numericId);
  return inMemoryStore.scan_history.length < initialLength;
}

module.exports = {
  initDb,
  saveScan,
  getHistory,
  deleteScan,
  getCropGuides,
  getCropGuideById,
  saveFertilizerPlan,
  getFertilizerPlans,
  isPostgresConnected: () => isPostgresConnected
};
