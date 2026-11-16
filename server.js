const express = require('express');
const cors = require('cors');
const compression = require('compression');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('⚠️ nodemailer not loaded:', e.message);
}
require('dotenv').config();

const db = require('./db');
const { plantFertilizerSpecs, getPlantSpec } = require('./data/plantFertilizerSpecs');
const { diseaseMap, getDiseaseByIndex, getDiseaseByName } = require('./data/disease_map');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directory exists (guarded for read-only serverless filesystems)
const uploadDir = path.join(__dirname, 'public', 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (fsErr) {
  console.warn('⚠️ Warning: Could not create upload directory (read-only filesystem):', fsErr.message);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'crop-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('শুধুমাত্র JPG, PNG বা WebP ছবি আপলোড করা যাবে।'));
  }
});

// In-Memory Multer for direct forwarding to Python AI microservice
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/i;
    const mimetype = /^image\/(jpeg|jpg|png|webp)$/i.test(file.mimetype);
    const ext = path.extname(file.originalname || '').toLowerCase();
    const extname = filetypes.test(ext);
    const isBlobWithoutExt = ext === '' && (!file.originalname || file.originalname.toLowerCase() === 'blob');
    if (mimetype && (extname || isBlobWithoutExt)) {
      return cb(null, true);
    }
    const err = new Error('INVALID_IMAGE');
    err.code = 'INVALID_IMAGE';
    return cb(err);
  }
});

// Magic byte buffer inspector for image format authenticity
function isValidImageMagicBytes(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }
  // JPEG: 0xFF, 0xD8, 0xFF
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  if (isJpeg) return true;

  // PNG: 0x89, 0x50, 0x4E, 0x47
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  if (isPng) return true;

  // WebP: 'RIFF' (0x52, 0x49, 0x46, 0x46) at offset 0 and 'WEBP' (0x57, 0x45, 0x42, 0x50) at offset 8
  const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
                 buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  if (isWebp) return true;

  return false;
}

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Optimized Static Asset Serving with Gzip & Smart Browser Caching
const isProd = process.env.NODE_ENV === 'production';
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '1d' : 0,
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || !isProd) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');
    }
  }
}));
app.use('/uploads', express.static(uploadDir));

const { allCropGuides, getCropById } = require('./data/cropGuidesData');

// Helper to normalize Bengali crop names across all variations and input spellings
function normalizeCropName(name) {
  if (!name) return 'ধান';
  const clean = name.trim().toLowerCase();
  
  // Specific checks first
  if (clean.includes('পেঁপে') || clean === 'papaya') return 'পেঁপে';
  if (clean.includes('পেয়ারা') || clean.includes('পেয়ারা') || clean === 'guava') return 'পেয়ারা';
  if (clean.includes('পেঁয়াজ') || clean.includes('পেঁয়াজ') || clean.includes('পেয়াজ') || clean === 'onion') return 'পেঁয়াজ';
  if (clean.includes('লেবু') || clean === 'lemon' || clean === 'lime') return 'লেবু';
  if (clean.includes('আম') || clean === 'mango') return 'আম';
  if (clean.includes('ড্রাগন') || clean === 'dragon_fruit') return 'ড্রাগন ফল';
  if (clean.includes('মাল্টা') || clean === 'malta') return 'মাল্টা';
  if (clean.includes('পটল') || clean === 'pointed_gourd') return 'পটল';
  if (clean.includes('কচুর লতি') || clean.includes('কচু') || clean === 'taro_loti') return 'কচুর লতি';
  if (clean.includes('ধান') || clean === 'rice') return 'ধান';
  if (clean.includes('গম') || clean === 'wheat') return 'গম';
  if (clean.includes('ভুট্টা') || clean === 'maize' || clean === 'corn') return 'ভুট্টা';
  if (clean.includes('আলু') || clean === 'potato') return 'আলু';
  if (clean.includes('টমেটো') || clean === 'tomato') return 'টমেটো';
  if (clean.includes('বেগুন') || clean === 'eggplant' || clean === 'brinjal') return 'বেগুন';
  if (clean.includes('ফুলকপি') || clean === 'cauliflower') return 'ফুলকপি';
  if (clean.includes('বাঁধাকপি') || clean === 'cabbage') return 'বাঁধাকপি';
  if (clean.includes('লাউ') || clean.includes('কদু') || clean === 'bottle_gourd') return 'লাউ';
  if (clean.includes('মিষ্টি') || clean === 'sweet_gourd' || clean === 'pumpkin') return 'মিষ্টি কুমড়া';
  if (clean.includes('শসা') || clean.includes('ক্ষীরা') || clean === 'cucumber') return 'শসা';
  if (clean.includes('করলা') || clean.includes('উচ্ছে') || clean === 'bitter_gourd') return 'করলা';
  if (clean.includes('ঢেঁড়শ') || clean.includes('ঢেঁড়শ') || clean.includes('ভেন্ডি') || clean === 'okra') return 'ঢেঁড়শ';
  if (clean.includes('শিম') || clean === 'hyacinth_bean') return 'শিম';
  if (clean.includes('চিচিঙ্গা') || clean === 'snake_gourd') return 'চিচিঙ্গা';
  if (clean.includes('ঝিঙা') || clean === 'ridge_gourd') return 'ঝিঙা';
  if (clean.includes('চাল কুমড়া') || clean === 'ash_gourd') return 'চাল কুমড়া';
  if (clean.includes('মরিচ') || clean === 'chilli' || clean === 'pepper') return 'মরিচ';
  if (clean.includes('রসুন') || clean === 'garlic') return 'রসুন';
  if (clean.includes('আদা') || clean === 'ginger') return 'আদা';
  if (clean.includes('হলুদ') || clean === 'turmeric') return 'হলুদ';
  if (clean.includes('সরিষা') || clean === 'mustard') return 'সরিষা';
  if (clean.includes('মসুর') || clean === 'lentil') return 'মসুর ডাল';
  if (clean.includes('লালশাক') || clean === 'red_amaranth') return 'লালশাক';
  if (clean.includes('পালং') || clean === 'spinach') return 'পালং শাক';
  if (clean.includes('ডাঁটা') || clean === 'stem_amaranth') return 'ডাঁটাশাক';
  if (clean.includes('পুঁই') || clean === 'malabar_spinach') return 'পুঁইশাক';
  if (clean.includes('কলমি') || clean === 'water_spinach') return 'কলমি শাক';

  return clean;
}

// ====================================================================
// Fertilizer Calculation Recommendations (BARC Standard Guide - 25 Crops)
// ====================================================================
// Rates per decimal (শতাংশ) in KG with dynamic dataset linking
const fertilizerRatesPerDecimal = {};
allCropGuides.forEach(c => {
  const shortName = c.crop_name_bn.split(' ')[0].replace(/[\(\)]/g, '').trim();
  fertilizerRatesPerDecimal[c.crop_id] = c.fertilizer_plan;
  fertilizerRatesPerDecimal[shortName] = c.fertilizer_plan;
  fertilizerRatesPerDecimal[c.crop_name_bn] = c.fertilizer_plan;
});
// Add common aliases & spelling variants for both Unicode representations
fertilizerRatesPerDecimal['onion'] = fertilizerRatesPerDecimal['onion'] || getCropById('onion').fertilizer_plan;
fertilizerRatesPerDecimal['পেঁয়াজ'] = fertilizerRatesPerDecimal['onion'];
fertilizerRatesPerDecimal['পেঁয়াজ'] = fertilizerRatesPerDecimal['onion'];
fertilizerRatesPerDecimal['মিষ্টি কুমড়া'] = fertilizerRatesPerDecimal['sweet_gourd'];
fertilizerRatesPerDecimal['মিষ্টি কুমড়া'] = fertilizerRatesPerDecimal['sweet_gourd'];
fertilizerRatesPerDecimal['ঢেঁড়শ'] = fertilizerRatesPerDecimal['okra'];
fertilizerRatesPerDecimal['ঢেঁড়শ'] = fertilizerRatesPerDecimal['okra'];
fertilizerRatesPerDecimal['সাধারণ'] = { urea: 1.0, tsp: 0.5, mop: 0.6, gypsum: 0.35, zinc: 0.05, boron: 0.04, organic: 18.0 };

// Unit conversion to Decimals (শতাংশ)
function convertToDecimals(amount, unit) {
  const cleanUnit = (unit || '').trim().toLowerCase();
  if (cleanUnit === 'বিঘা' || cleanUnit === 'bigha') return +(amount * 33.0).toFixed(2); // 1 Bigha = 33 Decimals
  if (cleanUnit === 'একর' || cleanUnit === 'acre') return +(amount * 100.0).toFixed(2); // 1 Acre = 100 Decimals
  if (cleanUnit === 'হেক্টর' || cleanUnit === 'hectare') return +(amount * 247.1).toFixed(2); // 1 Hectare = 247.1 Decimals
  if (cleanUnit === 'কাঠা' || cleanUnit === 'katha') return +(amount * 1.65).toFixed(2); // 1 Katha = 1.65 Decimals
  return amount; // default: শতাংশ (Decimal)
}

// Tailored BARC Split Application Schedules for all 25 crops
function getSplitInstructions(crop, urea, tsp, mop, gypsum, zinc, organic, boron = 0) {
  const norm = normalizeCropName(crop);
  
  if (norm === 'আলু' || norm === 'potato') {
    return [
      {
        stage: 'শেষ চাষের সময় (Basal Dose)',
        fertilizers: `সম্পূর্ণ জৈব সার (${organic} কেজি), টিএসপি (${tsp} কেজি), জিপসাম (${gypsum} কেজি), জিংক (${zinc} কেজি), বোরন (${boron} কেজি) এবং অর্ধেক এমওপি (${(mop * 0.5).toFixed(1)} কেজি) ও অর্ধেক ইউরিয়া (${(urea * 0.5).toFixed(1)} কেজি) শেষ চাষে মাটির সাথে ভালোভাবে মিশিয়ে দিন।`
      },
      {
        stage: 'গোড়ায় মাটি তোলার সময় (রোপণের ৩০-৩৫ দিন পর)',
        fertilizers: `অবশিষ্ট অর্ধেক ইউরিয়া (${(urea * 0.5).toFixed(1)} কেজি) এবং অবশিষ্ট অর্ধেক এমওপি (${(mop * 0.5).toFixed(1)} কেজি) সার দুই সারির মাঝে ছিটিয়ে দিয়ে সেচ প্রদান করে গোড়ায় উঁচু করে ভেলি বেঁধে দিন।`
      }
    ];
  }

  if (norm === 'পেঁয়াজ' || norm === 'পেঁয়াজ' || norm === 'onion') {
    return [
      {
        stage: 'জমি তৈরির শেষ চাষে (Basal Dose)',
        fertilizers: `সম্পূর্ণ জৈব সার (${organic} কেজি), টিএসপি (${tsp} কেজি), জিপসাম (${gypsum} কেজি), জিংক (${zinc} কেজি), বোরন (${boron} কেজি) এবং অর্ধেক পটাশ (${(mop * 0.5).toFixed(1)} কেজি) মাটির সাথে মিশিয়ে দিন।`
      },
      {
        stage: '১ম কিস্তি (রোপণের ২০-২৫ দিন পর)',
        fertilizers: `ইউরিয়া সারের অর্ধেক (${(urea * 0.5).toFixed(1)} কেজি) উপরিপ্রয়োগ করে হালকা সেচ দিন।`
      },
      {
        stage: '২য় কিস্তি (কন্দ গঠনের প্রাক্কালে / ৪০-৫০ দিন পর)',
        fertilizers: `অবশিষ্ট ইউরিয়া (${(urea * 0.5).toFixed(1)} কেজি) এবং অবশিষ্ট পটাশ (${(mop * 0.5).toFixed(1)} কেজি) জমিতে পর্যাপ্ত রস থাকা অবস্থায় ছিটিয়ে দিন।`
      }
    ];
  }

  if (norm === 'ধান' || norm === 'rice') {
    return [
      {
        stage: 'শেষ চাষের সময় (জমি তৈরি)',
        fertilizers: `টিএসপি (${tsp} কেজি), দুই-তৃতীয়াংশ এমওপি (${(mop * 0.67).toFixed(1)} কেজি), জিপসাম (${gypsum} কেজি), জিংক (${zinc} কেজি), বোরন (${boron} কেজি) এবং সকল জৈব সার (${organic} কেজি) মাটির সাথে মিশিয়ে দিন।`
      },
      {
        stage: 'প্রথম কিস্তি (চারা রোপণের ১৫-২০ দিন পর)',
        fertilizers: `ইউরিয়া সারের এক-তৃতীয়াংশ (${(urea * 0.33).toFixed(1)} কেজি) উপরিপ্রয়োগ করুন।`
      },
      {
        stage: 'দ্বিতীয় কিস্তি (কুশি গজানোর সময় / ৩০-৩৫ দিন)',
        fertilizers: `ইউরিয়া সারের দ্বিতীয় কিস্তি (${(urea * 0.33).toFixed(1)} কেজি) উপরিপ্রয়োগ করুন।`
      },
      {
        stage: 'তৃতীয় কিস্তি (থোড় আসার ৫-৭ দিন আগে)',
        fertilizers: `অবশিষ্ট ইউরিয়া (${(urea * 0.34).toFixed(1)} কেজি) এবং অবশিষ্ট পটাশ (${(mop * 0.33).toFixed(1)} কেজি) জমিতে পর্যাপ্ত রস থাকা অবস্থায় ছিটিয়ে দিন।`
      }
    ];
  }

  // Dynamic matching from crop dataset
  const matched = allCropGuides.find(c => {
    const sName = c.crop_name_bn.split(' ')[0].replace(/[\(\)]/g, '').trim();
    return c.crop_id === crop || sName === crop || c.crop_name_bn.includes(crop);
  });

  if (matched && matched.fertilizer_plan && matched.fertilizer_plan.split_instructions) {
    return matched.fertilizer_plan.split_instructions;
  }

  return [
    { stage: 'শেষ চাষের সময় (জমি তৈরি)', fertilizers: `টিএসপি (${tsp} কেজি), অর্ধেক এমওপি (${(mop * 0.5).toFixed(1)} কেজি), জিপসাম (${gypsum} কেজি), জিংক (${zinc} কেজি), বোরন (${boron} কেজি) এবং সকল জৈব সার (${organic} কেজি) মাটির সাথে মিশিয়ে দিন।` },
    { stage: 'প্রথম কিস্তি (চারা রোপণের ১৫-২০ দিন পর)', fertilizers: `ইউরিয়া সারের অর্ধেক (${(urea * 0.5).toFixed(1)} কেজি) উপরিপ্রয়োগ করুন।` },
    { stage: 'দ্বিতীয় কিস্তি (ফুল/ফল আসার পূর্বে)', fertilizers: `অবশিষ্ট ইউরিয়া (${(urea * 0.5).toFixed(1)} কেজি) এবং অবশিষ্ট পটাশ (${(mop * 0.5).toFixed(1)} কেজি) জমিতে পর্যাপ্ত রস থাকা অবস্থায় ছিটিয়ে দিন।` }
  ];
}

// ====================================================================
// Routes
// ====================================================================

// ====================================================================
// Bangladesh 64 Districts Coordinates for Precision Reverse-Geocoding
// ====================================================================
const bdDistrictsCoords = [
  // Dhaka Division
  { name: 'ঢাকা', lat: 23.8103, lon: 90.4125 },
  { name: 'গাজীপুর', lat: 24.0023, lon: 90.4264 },
  { name: 'নারায়ণগঞ্জ', lat: 23.6238, lon: 90.5000 },
  { name: 'নরসিংদী', lat: 23.9193, lon: 90.7176 },
  { name: 'মুন্সীগঞ্জ', lat: 23.5422, lon: 90.5305 },
  { name: 'মানিকগঞ্জ', lat: 23.8644, lon: 90.0047 },
  { name: 'টাঙ্গাইল', lat: 24.2513, lon: 89.9167 },
  { name: 'কিশোরগঞ্জ', lat: 24.4449, lon: 90.7766 },
  { name: 'ফরিদপুর', lat: 23.6070, lon: 89.8429 },
  { name: 'গোপালগঞ্জ', lat: 23.0051, lon: 89.8266 },
  { name: 'মাদারীপুর', lat: 23.1641, lon: 90.1897 },
  { name: 'রাজবাড়ী', lat: 23.7574, lon: 89.6445 },
  { name: 'শরীয়তপুর', lat: 23.2423, lon: 90.4348 },
  // Chittagong Division
  { name: 'চট্টগ্রাম', lat: 22.3569, lon: 91.7832 },
  { name: 'কক্সবাজার', lat: 21.4272, lon: 92.0058 },
  { name: 'কুমিল্লা', lat: 23.4607, lon: 91.1809 },
  { name: 'ব্রাহ্মণবাড়িয়া', lat: 23.9608, lon: 91.1115 },
  { name: 'চাঁদপুর', lat: 23.2333, lon: 90.6667 },
  { name: 'নোয়াখালী', lat: 22.8696, lon: 91.0994 },
  { name: 'ফেনী', lat: 23.0159, lon: 91.3976 },
  { name: 'লক্ষ্মীপুর', lat: 22.9425, lon: 90.8412 },
  { name: 'খাগড়াছড়ি', lat: 23.1193, lon: 91.9847 },
  { name: 'রাঙ্গামাটি', lat: 22.7324, lon: 92.2985 },
  { name: 'বান্দরবান', lat: 22.1953, lon: 92.2184 },
  // Rajshahi Division
  { name: 'রাজশাহী', lat: 24.3745, lon: 88.6042 },
  { name: 'বগুড়া', lat: 24.8465, lon: 89.3770 },
  { name: 'পাবনা', lat: 24.0064, lon: 89.2372 },
  { name: 'সিরাজগঞ্জ', lat: 24.4534, lon: 89.7008 },
  { name: 'নওগাঁ', lat: 24.7937, lon: 88.9318 },
  { name: 'নাটোর', lat: 24.4206, lon: 88.9324 },
  { name: 'চাঁপাইনবাবগঞ্জ', lat: 24.5965, lon: 88.2776 },
  { name: 'জয়পুরহাট', lat: 25.0968, lon: 89.0227 },
  // Rangpur Division
  { name: 'রংপুর', lat: 25.7439, lon: 89.2752 },
  { name: 'দিনাজপুর', lat: 25.6217, lon: 88.6355 },
  { name: 'গাইবান্ধা', lat: 25.3288, lon: 89.5406 },
  { name: 'কুড়িগ্রাম', lat: 25.8054, lon: 89.6362 },
  { name: 'নীলফামারী', lat: 25.9318, lon: 88.8560 },
  { name: 'লালমনিরহাট', lat: 25.9923, lon: 89.2847 },
  { name: 'পঞ্চগড়', lat: 26.3411, lon: 88.5542 },
  { name: 'ঠাকুরগাঁও', lat: 26.0337, lon: 88.4617 },
  // Khulna Division
  { name: 'খুলনা', lat: 22.8456, lon: 89.5403 },
  { name: 'যশোর', lat: 23.1664, lon: 89.2081 },
  { name: 'বাগেরহাট', lat: 22.6516, lon: 89.7859 },
  { name: 'সাতক্ষীরা', lat: 22.7185, lon: 89.0705 },
  { name: 'ঝিনাইদহ', lat: 23.5450, lon: 89.1526 },
  { name: 'মাগুরা', lat: 23.4873, lon: 89.4199 },
  { name: 'নড়াইল', lat: 23.1725, lon: 89.5127 },
  { name: 'কুষ্টিয়া', lat: 23.9013, lon: 89.1205 },
  { name: 'মেহেরপুর', lat: 23.7622, lon: 88.6318 },
  { name: 'চুয়াডাঙ্গা', lat: 23.6402, lon: 88.8418 },
  // Barishal Division
  { name: 'বরিশাল', lat: 22.7010, lon: 90.3535 },
  { name: 'পটুয়াখালী', lat: 22.3596, lon: 90.3299 },
  { name: 'ভোলা', lat: 22.6859, lon: 90.6481 },
  { name: 'পিরোজপুর', lat: 22.5841, lon: 89.9720 },
  { name: 'বরগুনা', lat: 22.0953, lon: 90.1121 },
  { name: 'ঝালকাঠি', lat: 22.6406, lon: 90.1987 },
  // Sylhet Division
  { name: 'সিলেট', lat: 24.8949, lon: 91.8687 },
  { name: 'মৌলভীবাজার', lat: 24.4829, lon: 91.7774 },
  { name: 'হবিগঞ্জ', lat: 24.3749, lon: 91.4155 },
  { name: 'সুনামগঞ্জ', lat: 25.0658, lon: 91.3950 },
  // Mymensingh Division
  { name: 'ময়মনসিংহ', lat: 24.7471, lon: 90.4203 },
  { name: 'জামালপুর', lat: 24.9375, lon: 89.9378 },
  { name: 'নেত্রকোণা', lat: 24.8709, lon: 90.7279 },
  { name: 'শেরপুর', lat: 25.0205, lon: 90.0153 }
];

function findNearestDistrict(lat, lon) {
  if (!lat || !lon) return 'ব্রাহ্মণবাড়িয়া';
  let closest = bdDistrictsCoords[0];
  let minDistance = Infinity;
  for (const d of bdDistrictsCoords) {
    const dist = Math.hypot(d.lat - lat, d.lon - lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = d;
    }
  }
  return closest.name;
}

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'Smart Agro (স্মার্ট এগ্রো)',
    timestamp: new Date().toISOString(),
    postgresConnected: db.isPostgresConnected(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 1.1 Firebase Client Configuration Endpoint
app.get('/api/firebase-config', (req, res) => {
  const isConfigured = Boolean(process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID);
  res.json({
    apiKey: process.env.FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "smart-agro-bd.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "smart-agro-bd",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "smart-agro-bd.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1234567890",
    appId: process.env.FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
    configured: isConfigured
  });
});

// 1.2 User Account Database & Contact Linking API
app.post('/api/user/sync', async (req, res) => {
  try {
    const { firebase_uid, display_name, email, phone_number, photo_url, district, role, auth_provider } = req.body;
    if (!firebase_uid) {
      return res.status(400).json({ success: false, message: 'firebase_uid is required' });
    }
    const user = await db.syncUser({ firebase_uid, display_name, email, phone_number, photo_url, district, role, auth_provider });
    res.json({ success: true, user });
  } catch (err) {
    console.error('Error syncing user:', err);
    res.status(500).json({ success: false, message: 'অ্যাকাউন্ট সংরক্ষণ করতে সমস্যা হয়েছে।' });
  }
});

app.get('/api/user/profile', async (req, res) => {
  try {
    const uid = req.query.uid;
    if (!uid) {
      return res.status(400).json({ success: false, message: 'uid is required' });
    }
    const user = await db.getUserProfile(uid);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ইউজার প্রোফাইল পাওয়া যায়নি।' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('Error getting user profile:', err);
    res.status(500).json({ success: false, message: 'প্রোফাইল লোড করতে সমস্যা হয়েছে।' });
  }
});

app.post('/api/user/link-contact', async (req, res) => {
  try {
    const { firebase_uid, phone_number, email, display_name, district } = req.body;
    if (!firebase_uid) {
      return res.status(400).json({ success: false, message: 'firebase_uid is required' });
    }
    const updatedUser = await db.updateUserContact(firebase_uid, { phone_number, email, display_name, district });
    res.json({ success: true, message: 'যোগাযোগের তথ্য সফলভাবে সংরক্ষিত হয়েছে!', user: updatedUser });
  } catch (err) {
    console.error('Error linking contact info:', err);
    res.status(500).json({ success: false, message: 'তথ্য আপডেট করতে সমস্যা হয়েছে।' });
  }
});

// 1.3 Email OTP Verification Engine (Passwordless Login & Account Activation)
const emailOtpStore = new Map();

// Periodic prune of expired OTP tokens
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of emailOtpStore.entries()) {
    if (now > record.expiresAt) {
      emailOtpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

function getMailTransporter() {
  if (!nodemailer) return null;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || 'gmail',
    auth: { user, pass }
  });
}

app.post(['/api/auth/send-email-otp', '/api/send-email-otp'], async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন (যেমন: farmer@gmail.com)।' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    emailOtpStore.set(cleanEmail, {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    });

    const transporter = getMailTransporter();
    if (transporter) {
      const mailOptions = {
        from: `"স্মার্ট এগ্রো (Smart Agro)" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
        to: cleanEmail,
        subject: `🌾 ${otp} - আপনার স্মার্ট এগ্রো লগইন ওটিপি কোড`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 2px solid #10b981; border-radius: 20px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #059669; font-size: 26px; margin: 0 0 6px 0;">🌾 স্মার্ট এগ্রো (Smart Agro)</h1>
              <p style="color: #64748b; font-size: 14px; margin: 0;">কৃষি ও ফসল সুরক্ষা প্ল্যাটফর্ম</p>
            </div>
            <div style="background: #f0fdf4; border: 2px dashed #059669; border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0;">
              <p style="color: #1e293b; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">আপনার ৬ ডিজিটের এককালীন ওটিপি কোড:</p>
              <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #047857; margin: 10px 0;">${otp}</div>
              <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">⏳ এই কোডটির মেয়াদ ১০ মিনিট থাকবে।</p>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 16px 0 0 0;">
              আপনি যদি এই অনুরোধ না করে থাকেন, তবে এই বার্তাটি এড়িয়ে চলুন।
            </p>
          </div>
        `
      };
      await transporter.sendMail(mailOptions);
      console.log(`📧 [Smart Agro Auth] Real email OTP sent to ${cleanEmail}`);
      return res.json({
        success: true,
        message: `আপনার ইমেইলে (${cleanEmail}) ৬ ডিজিটের ওটিপি কোড পাঠানো হয়েছে। ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।`
      });
    } else {
      console.log(`📧 [Smart Agro Auth - Fallback] OTP for ${cleanEmail}: ${otp}`);
      return res.json({
        success: true,
        simulated: true,
        otp: otp,
        message: `ওটিপি কোড: ${otp} (সার্ভারে সরাসরি SMTP সেট না থাকায় কোডটি প্রদর্শিত হলো)`
      });
    }
  } catch (err) {
    console.error('Email OTP send error:', err);
    return res.status(500).json({ success: false, message: 'ইমেইল পাঠাতে সমস্যা হয়েছে: ' + err.message });
  }
});

app.post(['/api/auth/verify-email-otp', '/api/verify-email-otp'], async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'ইমেইল ও ওটিপি কোড উভয়ই আবশ্যক।' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const record = emailOtpStore.get(cleanEmail);
    if (!record) {
      return res.status(400).json({ success: false, message: 'কোনো সক্রিয় ওটিপি পাওয়া যায়নি অথবা মেয়াদ শেষ হয়েছে। আবার ওটিপি পাঠান।' });
    }

    if (Date.now() > record.expiresAt) {
      emailOtpStore.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'ওটিপি কোডের মেয়াদ শেষ হয়ে গেছে। নতুন কোড নিন।' });
    }

    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
      emailOtpStore.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'অতিরিক্ত ভুল ওটিপি চেষ্টা করা হয়েছে। নতুন ওটিপি পাঠান।' });
    }

    if (record.code !== cleanOtp) {
      return res.status(400).json({ success: false, message: 'ভুল ওটিপি কোড! অনুগ্রহ করে সঠিক ৬ ডিজিটের কোড দিন।' });
    }

    // OTP is verified! Prune record
    emailOtpStore.delete(cleanEmail);

    const emailHash = Buffer.from(cleanEmail).toString('hex').slice(0, 24);
    const uid = `email_${emailHash}`;
    const username = cleanEmail.split('@')[0];
    const displayName = username.charAt(0).toUpperCase() + username.slice(1);

    const userData = {
      firebase_uid: uid,
      display_name: displayName,
      email: cleanEmail,
      phone_number: null,
      photo_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
      district: 'ঢাকা',
      role: 'যাচাইকৃত ইমেইল কৃষক',
      auth_provider: 'email_otp'
    };

    let savedUser = null;
    try {
      savedUser = await db.syncUser(userData);
    } catch (dbErr) {
      console.warn('DB sync warning in verify-email-otp:', dbErr.message);
    }

    const activeUser = {
      uid: uid,
      displayName: savedUser ? savedUser.display_name : displayName,
      role: 'যাচাইকৃত ইমেইল কৃষক',
      email: cleanEmail,
      phoneNumber: savedUser ? savedUser.phone_number : '',
      photoURL: userData.photo_url,
      badge: '✓ যাচাইকৃত ইমেইল',
      isGuest: false,
      authProvider: 'email_otp'
    };

    return res.json({
      success: true,
      user: activeUser,
      message: 'অভিনন্দন! আপনার ইমেইল সফলভাবে যাচাই হয়েছে।'
    });
  } catch (err) {
    console.error('Email OTP verify error:', err);
    return res.status(500).json({ success: false, message: 'ওটিপি যাচাইয়ে সমস্যা হয়েছে: ' + err.message });
  }
});

// 2. Weather & Agro-Alerts (Live OpenWeatherMap with Geolocation & Spraying Advisory)
app.get('/api/weather', async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : null;
    const lon = req.query.lon ? parseFloat(req.query.lon) : null;
    const requestedDistrict = req.query.district || 'ব্রাহ্মণবাড়িয়া';
    const apiKey = process.env.OPENWEATHER_API_KEY;

    let weatherData = null;

    if (apiKey && apiKey !== 'your_openweathermap_api_key_here' && apiKey.length > 10) {
      try {
        let apiUrl = '';
        if (lat && lon) {
          apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=bn`;
        } else {
          apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(requestedDistrict)},BD&appid=${apiKey}&units=metric&lang=bn`;
        }

        const response = await axios.get(apiUrl, { timeout: 4000 });
        const data = response.data;
        const rain1h = data.rain ? (data.rain['1h'] || 0) : 0;
        const rainProbability = rain1h > 0 ? Math.min(Math.round(rain1h * 30), 95) : (data.weather[0].main.includes('Rain') ? 75 : 15);

        weatherData = {
          source: 'OpenWeatherMap Live API',
          location: data.name || requestedDistrict,
          temp: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          wind_speed: Math.round(data.wind.speed * 3.6),
          rain_probability: rainProbability,
          condition_bn: data.weather[0].description,
          icon: data.weather[0].icon,
          is_day: (data.weather[0].icon || '').includes('d')
        };
      } catch (apiErr) {
        console.warn('⚠️ OpenWeatherMap API fallback:', apiErr.message);
      }
    }

    if (!weatherData) {
      const currentHour = new Date().getHours();
      const isDay = currentHour >= 6 && currentHour <= 18;
      
      let districtName = requestedDistrict;
      if (lat && lon) {
        districtName = findNearestDistrict(lat, lon);
      }

      const baseTemp = isDay ? (28 + Math.round(Math.sin(currentHour / 3) * 4)) : 22;
      const roundedHumidity = Math.round(65 + (Math.cos(currentHour / 4) * 16));
      const rainProbability = roundedHumidity > 76 ? 60 : 20;

      let condition = 'পরিষ্কার ও রৌদ্রোজ্জ্বল';
      if (rainProbability > 50) condition = 'হালকা থেকে মাঝারি বৃষ্টি';
      else if (roundedHumidity > 75) condition = 'আংশিক মেঘলা ও আর্দ্র';

      weatherData = {
        source: 'Smart Agro Local Weather Model',
        location: districtName,
        temp: baseTemp,
        feels_like: baseTemp + 2,
        humidity: roundedHumidity,
        wind_speed: 12 + Math.round(Math.random() * 5),
        rain_probability: rainProbability,
        condition_bn: condition,
        icon: isDay ? '01d' : '01n',
        is_day: isDay
      };
    }

    // Dynamic Spraying Advisory
    let sprayingStatus = {
      is_safe: weatherData.rain_probability < 40 && weatherData.wind_speed < 20,
      window_bn: weatherData.rain_probability >= 40 
        ? '❌ বৃষ্টির সম্ভাবনার কারণে আজ স্প্রে করা সম্পূর্ণ নিষেধ' 
        : '✅ আজ বিকাল ৪:০০ টা থেকে ৬:০০ টা পর্যন্ত স্প্রে করার আদর্শ সময়'
    };

    // Agro-Alert
    let agroAlert = {
      level: 'normal',
      title: '✅ অনুকূল কৃষি আবহাওয়া',
      message: 'বর্তমান আবহাওয়া ফসলের জন্য উপযোগী। জমিতে নিয়মমাফিক সেচ, আগাছা দমন ও সার প্রয়োগ করতে পারেন।',
      actionable_advice: 'ক্ষেতের নালা পরিষ্কার রাখুন এবং নিয়মিত ফসলের পাতার নিচের অংশ পরীক্ষা করুন।'
    };

    if (weatherData.rain_probability >= 50) {
      agroAlert = {
        level: 'danger',
        title: '🌧️ বৃষ্টি ও বালাইনাশক সতর্কতা',
        message: `আগামী ২৪ ঘণ্টায় ${weatherData.rain_probability}% বৃষ্টির সম্ভাবনা রয়েছে! জমিতে কোনো প্রকার ছত্রাকনাশক বা কীটনাশক স্প্রে করবেন না।`,
        actionable_advice: 'স্প্রে করলে বৃষ্টির পানিতে ধুয়ে অপচয় হবে। জমির অতিরিক্ত পানি নিষ্কাশনের জন্য নালা কেটে রাখুন।'
      };
    } else if (weatherData.temp >= 34) {
      agroAlert = {
        level: 'warning',
        title: '☀️ অতিরিক্ত দাবদাহ সতর্কতা',
        message: `তাপমাত্রা ${weatherData.temp}°C অতিক্রম করেছে। ফসলের জমিতে হালকা সেচ দিন এবং মাটির রস ধরে রাখুন।`,
        actionable_advice: 'দুপুরের চড়া রোদে জমিতে কোনো সার বা ভিটামিন স্প্রে করবেন না। বিকালে সেচ দিন।'
      };
    } else if (weatherData.humidity >= 82) {
      agroAlert = {
        level: 'warning',
        title: '💧 উচ্চ আর্দ্রতা ও ছত্রাক ঝুঁকি',
        message: `বাতাসে আর্দ্রতা ${weatherData.humidity}%। ধানের ব্লাস্ট ও টমেটো/আলুর ধসা রোগের অনুকূল পরিবেশ তৈরি হয়েছে।`,
        actionable_advice: 'কুয়াশাচ্ছন্ন সকালে রোদ না ওঠা পর্যন্ত পর্যবেক্ষণ করুন। লক্ষণ দেখা মাত্র অনুমোদিত ছত্রাকনাশক স্প্রে করুন।'
      };
    }

    // 3-Day Forecast simulation
    const forecast3Days = [
      { day_bn: 'আজ', temp: weatherData.temp, rain_prob: weatherData.rain_probability, condition: weatherData.condition_bn },
      { day_bn: 'আগামীকাল', temp: weatherData.temp + 1, rain_prob: Math.max(15, weatherData.rain_probability - 10), condition: 'রৌদ্রোজ্জ্বল ও উষ্ণ' },
      { day_bn: 'পরশু', temp: weatherData.temp, rain_prob: 25, condition: 'আংশিক মেঘলা' }
    ];

    res.json({
      success: true,
      weather: weatherData,
      alert: agroAlert,
      spraying: sprayingStatus,
      forecast: forecast3Days
    });
  } catch (error) {
    console.error('Weather endpoint error:', error);
    res.status(500).json({ success: false, message: 'আবহাওয়ার তথ্য লোড করতে সমস্যা হয়েছে।' });
  }
});

// Fallback diagnostic generator when remote microservice is offline or times out in production
function getHeuristicDiagnosis(cropName, originalName) {
  const norm = normalizeCropName(cropName || originalName || 'সবজি');
  let matched = null;

  if (norm.includes('আলু') || norm.includes('potato')) {
    matched = diseaseMap.find(d => d.crop_name === 'Potato' && d.disease_name.includes('Late blight')) || diseaseMap.find(d => d.crop_name === 'Potato');
  } else if (norm.includes('টমেটো') || norm.includes('tomato')) {
    matched = diseaseMap.find(d => d.crop_name === 'Tomato' && d.disease_name.includes('Early blight')) || diseaseMap.find(d => d.crop_name === 'Tomato');
  } else if (norm.includes('মরিচ') || norm.includes('chilli') || norm.includes('pepper')) {
    matched = diseaseMap.find(d => d.crop_name.includes('Pepper'));
  } else if (norm.includes('বেগুন') || norm.includes('eggplant')) {
    matched = diseaseMap.find(d => d.crop_name_bn.includes('বেগুন'));
  } else if (norm.includes('ভুট্টা') || norm.includes('corn')) {
    matched = diseaseMap.find(d => d.crop_name === 'Corn');
  } else if (norm.includes('লেবু') || norm.includes('কমলা') || norm.includes('citrus') || norm.includes('lemon')) {
    matched = diseaseMap.find(d => d.crop_name.includes('Citrus'));
  } else if (norm.includes('লাউ') || norm.includes('কুমড়া') || norm.includes('শসা') || norm.includes('cucumber')) {
    matched = diseaseMap.find(d => d.crop_name_bn.includes('শসা'));
  } else if (norm.includes('শিম') || norm.includes('bean')) {
    matched = diseaseMap.find(d => d.crop_name_bn.includes('শিম'));
  } else if (norm.includes('কপি') || norm.includes('mustard') || norm.includes('সরিষা')) {
    matched = diseaseMap.find(d => d.crop_name_bn.includes('কপি'));
  } else {
    matched = diseaseMap.find(d => d.class_name === 'Alternaria_Leaf_Spot') || diseaseMap[0];
  }

  return {
    success: true,
    class_index: matched ? matched.class_index : 0,
    class_name: matched ? matched.class_name : 'Alternaria_Leaf_Spot',
    confidence: 0.958,
    is_valid_crop: true,
    is_unidentified: false,
    source: 'in_memory_expert_system'
  };
}

// 3. AI Crop Disease Scanner API (/api/scan & /api/detect)
// Uses Multer memoryStorage with fileFilter and magic bytes inspection,
// forwards buffer to Python Flask microservice on Port 5000 with 15s timeout and 1-retry fallback,
// persists only valid crop scans using non-blocking asynchronous fs.promises.writeFile,
// and maps 67 PlantVillage classes with localized Bengali agro-advisories
app.post(['/api/scan', '/api/detect'], (req, res, next) => {
  uploadMemory.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        is_unidentified: true,
        error_code: 'INVALID_IMAGE',
        message: 'ছবিটির ফরম্যাট সঠিক নয়। অনুগ্রহ করে JPG, PNG বা WebP ফরম্যাটের ছবি আপলোড করুন।'
      });
    }
    next();
  });
}, async (req, res) => {
  console.log(`📸 [Smart Agro API] Incoming /api/scan request at ${new Date().toISOString()}`);
  let diskPath = null;

  try {
    let fileBuffer = null;
    let originalName = 'leaf.jpg';
    let mimeType = 'image/jpeg';

    const uploadedFile = req.file || (req.files && req.files[0]);
    if (uploadedFile && uploadedFile.buffer) {
      fileBuffer = uploadedFile.buffer;
      originalName = uploadedFile.originalname || 'leaf.jpg';
      mimeType = uploadedFile.mimetype || 'image/jpeg';
    } else if (req.body && req.body.image && typeof req.body.image === 'string' && req.body.image.includes(';base64,')) {
      const parts = req.body.image.split(';base64,');
      mimeType = parts[0].replace('data:', '') || 'image/jpeg';
      fileBuffer = Buffer.from(parts[1], 'base64');
      originalName = 'capture-' + Date.now() + '.' + (mimeType.split('/')[1] || 'jpg');
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ success: false, message: 'অনুগ্রহ করে ফসলের একটি পরিষ্কার ছবি আপলোড করুন।' });
    }

    // Magic Bytes Inspection (JPEG: 0xFF, 0xD8, 0xFF; PNG: 0x89, 0x50, 0x4E, 0x47; WebP: RIFF...WEBP)
    if (!isValidImageMagicBytes(fileBuffer)) {
      return res.status(400).json({
        success: false,
        is_unidentified: true,
        error_code: 'INVALID_IMAGE',
        message: 'ছবিটির ফরম্যাট সঠিক নয়। অনুগ্রহ করে JPG, PNG বা WebP ফরম্যাটের ছবি আপলোড করুন।'
      });
    }

    const rawCrop = (req.body.crop_name || req.body.crop_type || 'auto').trim();
    const cropName = normalizeCropName(rawCrop);
    const district = (req.body.district || 'ব্রাহ্মণবাড়িয়া').trim();
    const firebaseUid = req.body.firebase_uid || 'guest';
    const userName = req.body.user_name || 'কৃষক ভাই';

    // 1. Forward image buffer to Python AI Microservice (Port 5000)
    // In production or Vercel, uses 3.5s timeout to prevent Serverless Function Invocation Timeout
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const AI_MICROSERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000/predict';
    const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS, 10) || (isProduction ? 7500 : 15000);
    let aiResult = null;
    let pyErr = null;

    const maxAttempts = isProduction ? 1 : 2; // single fast attempt on Vercel
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const form = new FormData();
        form.append('image', fileBuffer, {
          filename: originalName || 'leaf.jpg',
          contentType: mimeType || 'image/jpeg'
        });
        if (req.body.crop_type || req.body.crop_name) {
          form.append('crop_type', (req.body.crop_type || req.body.crop_name).trim());
        }

        const pyResponse = await axios.post(AI_MICROSERVICE_URL, form, {
          headers: form.getHeaders(),
          timeout: AI_TIMEOUT_MS,
          proxy: false
        });

        if (pyResponse && pyResponse.data) {
          aiResult = pyResponse.data;
          pyErr = null;
          break;
        }
      } catch (err) {
        pyErr = err;
        const isTransient = err.code && ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN'].includes(err.code);
        if (attempt < maxAttempts && isTransient) {
          console.warn(`⚠️ [Smart Agro API] Transient AI service error (${err.code}). Retrying in 500ms (attempt ${attempt}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        break;
      }
    }

    // Preserve strict authenticity: Never return a fake disease on non-leaf or timeout
    if (pyErr) {
      console.warn(`⚡ [Smart Agro API] AI service error (${pyErr.message}).`);
      return res.json({
        success: true,
        is_unidentified: true,
        error_code: 'UNIDENTIFIED_IMAGE',
        message: 'ছবিটি শনাক্ত করা সম্ভব হয়নি: এটি কোনো পরিচিত ফসলের পাতা হিসেবে নিশ্চিত করা যাচ্ছে না (টেবিল, আসবাবপত্র বা অন্যান্য বস্তু হতে পারে)। অনুগ্রহ করে নিয়ম মেনে আক্রান্ত ফসলের পাতার স্পষ্ট ক্লোজ-আপ ছবি দিন।',
        image_path: null
      });
    }

    // 2. Strict Authenticity Guard: Check if AI flagged image as invalid or non-leaf
    if (aiResult && (aiResult.is_valid_crop === false || aiResult.is_unidentified === true)) {
      return res.json({
        success: true,
        is_unidentified: true,
        error_code: aiResult.error_code || 'UNIDENTIFIED_IMAGE',
        message: aiResult.message || 'ছবিটি শনাক্ত করা সম্ভব হয়নি। এটি কোনো পরিচিত ফসলের পাতা হিসেবে মিলছে না অথবা ছবিটি অস্পষ্ট।',
        image_path: null
      });
    }

    if (!aiResult || !aiResult.success) {
      return res.json({
        success: true,
        is_unidentified: true,
        error_code: 'UNIDENTIFIED_IMAGE',
        message: 'ছবিটিতে কোনো ফসলের পাতা শনাক্ত করা যায়নি। অনুগ্রহ করে পরিষ্কার আক্রান্ত পাতার ছবি দিন।',
        image_path: null
      });
    }

    // 3. Authentic Model Inference Mapping
    const classIndex = aiResult.class_index;
    const confidenceScore = aiResult.confidence;
    const mapped = (aiResult.class_name ? getDiseaseByName(aiResult.class_name) : null) || getDiseaseByIndex(classIndex);

    if (!mapped) {
      return res.json({
        success: true,
        is_unidentified: true,
        error_code: 'UNIDENTIFIED_DISEASE',
        message: 'ফসল বা রোগটির তথ্য ডাটাবেজে পাওয়া যায়নি। অনুগ্রহ করে স্পষ্ট করে পাতার ছবি তুলুন।',
        image_path: null
      });
    }

    // Persist valid scans asynchronously to disk using non-blocking I/O
    let imagePath = null;
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(originalName || '') || (mimeType === 'image/png' ? '.png' : (mimeType === 'image/webp' ? '.webp' : '.jpg'));
      const savedFileName = 'crop-' + uniqueSuffix + ext;
      diskPath = path.join(uploadDir, savedFileName);
      await fs.promises.writeFile(diskPath, fileBuffer);
      imagePath = `/uploads/${savedFileName}`;
    } catch (writeErr) {
      console.error('Failed to persist scan image:', writeErr);
      // Non-fatal for diagnosis, imagePath remains null
    }

    const finalReport = {
      crop_name: mapped.crop_name_bn,
      crop_en: mapped.crop_name,
      disease_bn: mapped.disease_name_bn,
      disease_en: mapped.disease_name,
      severity: mapped.severity,
      severity_bn: mapped.severity_bn,
      agro_advisory_bn: mapped.agro_advisory_bn,
      symptoms: mapped.symptoms,
      organic_solution: mapped.organic_solution,
      chemical_solution: mapped.chemical_solution,
      fertilizer_solution: mapped.fertilizer_solution || 'রোগের প্রকোপ চলাকালীন ইউরিয়া সার সীমিত রাখুন। রোগ প্রতিরোধ ক্ষমতা বাড়াতে প্রতি শতকে ৩০০-৪০০ গ্রাম পটাশ (MOP) সার দিন এবং নতুন সুস্থ পাতা গজানোর জন্য সলুবর বোরন ১.৫ গ্রাম ও চিলেটেড জিংক ০.৫ গ্রাম স্প্রে করুন।',
      safety_warning: mapped.safety_warning
    };

    // Save scan to database
    const scanRecord = {
      firebase_uid: firebaseUid,
      user_name: userName,
      district: district,
      crop_name: finalReport.crop_name,
      disease_bn: finalReport.disease_bn,
      disease_en: finalReport.disease_en,
      confidence: confidenceScore,
      symptoms: finalReport.symptoms,
      organic_solution: finalReport.organic_solution,
      chemical_solution: finalReport.chemical_solution,
      safety_warning: finalReport.safety_warning,
      image_path: imagePath
    };

    let savedResult = { id: Date.now() };
    try {
      savedResult = await db.saveScan(scanRecord);
    } catch (dbErr) {
      console.warn('Scan DB save error:', dbErr.message);
    }

    // Return complete production JSON payload
    res.json({
      success: true,
      message: 'এআই সফলভাবে রোগ শনাক্ত করেছে!',
      source: aiResult ? 'mobilenetv2_microservice' : 'heuristic_fallback',
      class_index: classIndex,
      confidence: confidenceScore,
      crop_name: finalReport.crop_en,
      crop_name_bn: finalReport.crop_name,
      disease_name: finalReport.disease_en,
      disease_name_bn: finalReport.disease_bn,
      severity: finalReport.severity,
      severity_bn: finalReport.severity_bn,
      agro_advisory_bn: finalReport.agro_advisory_bn,
      fertilizer_solution: finalReport.fertilizer_solution,
      image_path: imagePath,
      data: {
        id: savedResult.id,
        crop_name: finalReport.crop_name,
        disease_bn: finalReport.disease_bn,
        disease_en: finalReport.disease_en,
        confidence: confidenceScore,
        severity: finalReport.severity,
        severity_bn: finalReport.severity_bn,
        agro_advisory_bn: finalReport.agro_advisory_bn,
        symptoms: finalReport.symptoms,
        organic_cure: finalReport.organic_solution,
        organic_solution: finalReport.organic_solution,
        chemical_cure: finalReport.chemical_solution,
        chemical_solution: finalReport.chemical_solution,
        fertilizer_cure: finalReport.fertilizer_solution,
        fertilizer_solution: finalReport.fertilizer_solution,
        safety_warning: finalReport.safety_warning,
        image_url: imagePath,
        image_path: imagePath,
        district: district,
        user_name: userName
      }
    });
  } catch (error) {
    console.error('Detection API error:', error);
    // Asynchronously unlink image if write already occurred
    if (diskPath) {
      await fs.promises.unlink(diskPath).catch(() => {});
    }
    res.status(500).json({ success: false, message: error.message || 'রোগ শনাক্তকরণ প্রক্রিয়ায় ত্রুটি হয়েছে।' });
  }
});

// 4. Scan History API
app.get('/api/history', async (req, res) => {
  try {
    const firebaseUid = req.query.firebase_uid || null;
    const history = await db.getHistory(firebaseUid);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('History API error:', error);
    res.status(500).json({ success: false, message: 'স্ক্যান ইতিহাস লোড করা যায়নি।' });
  }
});

// 4.1 Delete History Item
app.delete('/api/history/:id', async (req, res) => {
  try {
    const deleted = await db.deleteScan(req.params.id);
    if (deleted) {
      res.json({ success: true, message: 'রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।' });
    } else {
      res.status(404).json({ success: false, message: 'রেকর্ড পাওয়া যায়নি।' });
    }
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({ success: false, message: 'রেকর্ড মোছা সম্ভব হয়নি।' });
  }
});

// 5. Cultivation Guides API
app.get('/api/guides', async (req, res) => {
  try {
    const guides = await db.getCropGuides();
    res.json({ success: true, data: guides });
  } catch (error) {
    console.error('Guides API error:', error);
    res.status(500).json({ success: false, message: 'চাষাবাদ গাইড লোড করা যায়নি।' });
  }
});

// 6. Single Cultivation Guide by ID
app.get('/api/guides/:cropId', async (req, res) => {
  try {
    const guide = await db.getCropGuideById(req.params.cropId);
    if (!guide) {
      return res.status(404).json({ success: false, message: 'নির্বাচিত ফসলের গাইড পাওয়া যায়নি।' });
    }
    res.json({ success: true, data: guide });
  } catch (error) {
    console.error('Single guide API error:', error);
    res.status(500).json({ success: false, message: 'গাইড লোড করা যায়নি।' });
  }
});

// 7. Fertilizer Calculator API (BARC Standards - Land Area & Seedling-Count Dual Engine)
app.post('/api/fertilizer-calc', async (req, res) => {
  try {
    const rawCrop = (req.body.crop_name || 'ধান').trim();
    const crop = normalizeCropName(rawCrop);
    const calcMode = (req.body.calc_mode || 'land_area').trim();
    const firebaseUid = req.body.firebase_uid || 'guest';
    const plantSpec = getPlantSpec(crop);

    let ureaTotal, tspTotal, mopTotal, gypsumTotal, zincTotal, boronTotal, organicTotal;
    let amount, unit, decimals, seedlingCount, plantUnit;
    let splitInstructions = [];
    let seedlingInfo = null;

    if (calcMode === 'seedling_count') {
      seedlingCount = parseFloat(req.body.seedling_count || req.body.land_amount);
      if (isNaN(seedlingCount) || seedlingCount <= 0) {
        seedlingCount = 100;
      }
      plantUnit = (req.body.plant_unit || req.body.land_unit || (plantSpec ? plantSpec.plant_unit_label : 'টি চারা / গাছ')).trim();
      amount = seedlingCount;
      unit = plantUnit;

      // Seedling Dosage Calculation
      if (plantSpec) {
        const d = plantSpec.dose_per_plant;
        ureaTotal = +((d.urea_g * seedlingCount) / 1000).toFixed(2);
        tspTotal = +((d.tsp_g * seedlingCount) / 1000).toFixed(2);
        mopTotal = +((d.mop_g * seedlingCount) / 1000).toFixed(2);
        gypsumTotal = +((d.gypsum_g * seedlingCount) / 1000).toFixed(2);
        zincTotal = +((d.zinc_g * seedlingCount) / 1000).toFixed(3);
        boronTotal = +((d.boron_g * seedlingCount) / 1000).toFixed(3);
        organicTotal = +((d.organic_g * seedlingCount) / 1000).toFixed(1);
        decimals = +(seedlingCount / plantSpec.density_per_decimal).toFixed(2);
        splitInstructions = plantSpec.split_instructions;
      } else {
        // Fallback calculation for crops not in plantFertilizerSpecs
        const rate = fertilizerRatesPerDecimal[crop] || fertilizerRatesPerDecimal['ধান'];
        const estDensity = 100; // default 100 plants per decimal
        decimals = +(seedlingCount / estDensity).toFixed(2);
        ureaTotal = +(rate.urea * decimals).toFixed(2);
        tspTotal = +(rate.tsp * decimals).toFixed(2);
        mopTotal = +(rate.mop * decimals).toFixed(2);
        gypsumTotal = +(rate.gypsum * decimals).toFixed(2);
        zincTotal = +(rate.zinc * decimals).toFixed(3);
        boronTotal = +((rate.boron || 0.04) * decimals).toFixed(3);
        organicTotal = +(rate.organic * decimals).toFixed(1);
        splitInstructions = getSplitInstructions(crop, ureaTotal, tspTotal, mopTotal, gypsumTotal, zincTotal, organicTotal, boronTotal);
      }

      seedlingInfo = {
        is_transplanted: true,
        seedling_count: seedlingCount,
        plant_unit_label: plantUnit,
        density_per_decimal: plantSpec ? plantSpec.density_per_decimal : 100,
        per_plant: plantSpec ? plantSpec.dose_per_plant : {
          urea_g: +((ureaTotal * 1000) / seedlingCount).toFixed(1),
          tsp_g: +((tspTotal * 1000) / seedlingCount).toFixed(1),
          mop_g: +((mopTotal * 1000) / seedlingCount).toFixed(1),
          gypsum_g: +((gypsumTotal * 1000) / seedlingCount).toFixed(1),
          zinc_g: +((zincTotal * 1000) / seedlingCount).toFixed(2),
          boron_g: +((boronTotal * 1000) / seedlingCount).toFixed(2),
          organic_g: +((organicTotal * 1000) / seedlingCount).toFixed(1)
        },
        planting_advice: plantSpec ? plantSpec.planting_advice : 'সুস্থ চারা রোপণ করে পর্যাপ্ত সেচ ও নিবিড় পরিচর্যা নিশ্চিত করুন।'
      };

    } else {
      // Land Area Mode (default)
      amount = parseFloat(req.body.land_amount);
      if (isNaN(amount) || amount <= 0) {
        amount = 1.0;
      }
      unit = (req.body.land_unit || 'শতাংশ').trim();
      decimals = convertToDecimals(amount, unit);
      const rate = fertilizerRatesPerDecimal[crop] || fertilizerRatesPerDecimal['ধান'];

      ureaTotal = +(rate.urea * decimals).toFixed(1);
      tspTotal = +(rate.tsp * decimals).toFixed(1);
      mopTotal = +(rate.mop * decimals).toFixed(1);
      gypsumTotal = +(rate.gypsum * decimals).toFixed(1);
      zincTotal = +(rate.zinc * decimals).toFixed(2);
      boronTotal = +((rate.boron || 0.04) * decimals).toFixed(2);
      organicTotal = +(rate.organic * decimals).toFixed(1);

      splitInstructions = getSplitInstructions(crop, ureaTotal, tspTotal, mopTotal, gypsumTotal, zincTotal, organicTotal, boronTotal);

      if (plantSpec) {
        const estSeedlings = Math.round(decimals * plantSpec.density_per_decimal);
        seedlingInfo = {
          is_transplanted: true,
          seedling_count: estSeedlings,
          plant_unit_label: plantSpec.plant_unit_label,
          density_per_decimal: plantSpec.density_per_decimal,
          per_plant: plantSpec.dose_per_plant,
          planting_advice: plantSpec.planting_advice
        };
      }
    }

    const planRecord = {
      firebase_uid: firebaseUid,
      crop_name: crop,
      land_amount: amount,
      land_unit: unit,
      urea_kg: ureaTotal,
      tsp_kg: tspTotal,
      mop_kg: mopTotal,
      gypsum_kg: gypsumTotal,
      zinc_kg: zincTotal,
      boron_kg: boronTotal,
      organic_kg: organicTotal
    };

    const savedPlan = await db.saveFertilizerPlan(planRecord);

    res.json({
      success: true,
      message: calcMode === 'seedling_count'
        ? `${seedlingCount}টি ${plantUnit}-এর সার সুপারিশ সফলভাবে সম্পন্ন হয়েছে!`
        : 'সারের হিসাব সফলভাবে সম্পন্ন হয়েছে!',
      data: {
        ...savedPlan,
        calc_mode: calcMode,
        boron_kg: boronTotal,
        decimals: decimals,
        seedling_info: seedlingInfo,
        per_plant: seedlingInfo ? seedlingInfo.per_plant : null,
        split_instructions: splitInstructions
      }
    });
  } catch (error) {
    console.error('Fertilizer Calculator API error:', error);
    res.status(500).json({ success: false, message: 'সার হিসাব প্রক্রিয়ায় ত্রুটি হয়েছে।' });
  }
});

// ====================================================================
// Dedicated Standalone Page Routes
// ====================================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get(['/scan', '/scanner', '/scan.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scan.html'));
});

app.get(['/roadmap', '/guides', '/roadmap.html', '/guides.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'roadmap.html'));
});

app.get(['/crop-detail', '/crop-detail.html', '/crop-guide', '/crop-guide.html', '/crop'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'crop-detail.html'));
});

app.get('/roadmap/:cropId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'crop-detail.html'));
});

app.get(['/grafting', '/grafting.html', '/nursery', '/kalom'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'grafting.html'));
});

app.get(['/calculator', '/fertilizer', '/calculator.html', '/fertilizer.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calculator.html'));
});

app.get(['/history', '/history.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

// Local Development Documentation Routes (Kept strictly in docs/pdfs/ separate from production public bundle)
app.get(['/docs/guide', '/docs/developer-guide', '/developer-guide.pdf', '/docs/Smart_Agro_Developer_Guide.pdf'], (req, res) => {
  const guidePath = path.join(__dirname, 'docs', 'pdfs', 'Smart_Agro_Developer_Guide.pdf');
  if (fs.existsSync(guidePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Smart_Agro_Developer_Guide.pdf"');
    res.sendFile(guidePath);
  } else {
    res.status(404).send('Developer Guide PDF not found. Run "npm run docs" to generate it in docs/pdfs/');
  }
});

app.get(['/docs/ai-model', '/docs/ai-model-guide', '/docs/AI_Model_Integration_Guide.pdf'], (req, res) => {
  const guidePath = path.join(__dirname, 'docs', 'pdfs', 'AI_Model_Integration_Guide.pdf');
  if (fs.existsSync(guidePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="AI_Model_Integration_Guide.pdf"');
    res.sendFile(guidePath);
  } else {
    res.status(404).send('AI Model Integration Guide PDF not found. Run "npm run docs" to generate it in docs/pdfs/');
  }
});

app.get(['/docs/deployment', '/docs/deployment-guide', '/docs/Deployment_and_Hosting_Guide.pdf'], (req, res) => {
  const guidePath = path.join(__dirname, 'docs', 'pdfs', 'Deployment_and_Hosting_Guide.pdf');
  if (fs.existsSync(guidePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Deployment_and_Hosting_Guide.pdf"');
    res.sendFile(guidePath);
  } else {
    res.status(404).send('Deployment & Hosting Guide PDF not found. Run "npm run docs" to generate it in docs/pdfs/');
  }
});

// Interactive Web Views for Documentation (Instant preview in IDE Simple Browser or external browser)
app.get(['/docs/view/ai-model', '/docs/view/ai-model.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'html', 'ai-model-setup.html'));
});

app.get(['/docs/view/deployment', '/docs/view/deployment.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'html', 'deployment-hosting.html'));
});

app.get(['/docs/view/developer', '/docs/view/developer.html', '/docs/view/guide'], (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'html', 'developer-guide.html'));
});

// Alias /js/auth.js to /js/firebase-config.js to prevent 404/SyntaxError
app.get('/js/auth.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'js', 'firebase-config.js'));
});

// Fallback route for SPA (HTML only, never serve HTML for missing static assets)
app.get('*', (req, res) => {
  if (req.path.includes('.') || req.path.startsWith('/api/')) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler for Multer and Request Parsing
app.use((err, req, res, next) => {
  if (err) {
    console.warn('⚠️ Request handling error:', err.message);
    return res.status(400).json({
      success: false,
      is_unidentified: true,
      error_code: 'INVALID_IMAGE',
      message: 'ছবিটির ফরম্যাট সঠিক নয়। অনুগ্রহ করে JPG, PNG বা WebP ফরম্যাটের ছবি আপলোড করুন।'
    });
  }
  next();
});

// Export app for serverless function platforms (Vercel / Netlify)
module.exports = app;

// Start Server & Init DB if run directly from CLI
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`\n🌾 Smart Agro (স্মার্ট এগ্রো) Server running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    await db.initDb();

    // Non-fatal healthcheck ping to Python AI Microservice (Port 5000)
    const AI_HEALTH_URL = process.env.AI_HEALTH_URL || 'http://localhost:5000/health';
    try {
      const healthRes = await axios.get(AI_HEALTH_URL, { timeout: 3000, proxy: false });
      if (healthRes.status === 200) {
        console.log('🤖 Python AI Microservice (Port 5000) is online and healthy.');
      } else {
        console.warn(`⚠️ Python AI Microservice returned unexpected status: ${healthRes.status}`);
      }
    } catch (healthErr) {
      console.warn(`⚠️ Warning: Python AI Microservice (Port 5000) is not reachable on startup: ${healthErr.message}`);
    }
  });
}
