-- ====================================================================
-- Smart Agro (স্মার্ট এগ্রো) - Complete PostgreSQL Schema & Seed Data
-- ====================================================================

-- 1. Create Scan History Table
CREATE TABLE IF NOT EXISTS scan_history (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) DEFAULT 'guest',
    user_name VARCHAR(128) DEFAULT 'কৃষক ভাই',
    district VARCHAR(100) NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    disease_bn VARCHAR(150) NOT NULL,
    disease_en VARCHAR(150) NOT NULL,
    confidence NUMERIC(5, 2) NOT NULL,
    symptoms TEXT NOT NULL,
    organic_solution TEXT NOT NULL,
    chemical_solution TEXT NOT NULL,
    safety_warning TEXT,
    image_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scan_history_uid ON scan_history(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON scan_history(created_at DESC);

-- 2. Create Crop Cultivation Guides Table
CREATE TABLE IF NOT EXISTS crop_guides (
    id SERIAL PRIMARY KEY,
    crop_id VARCHAR(50) UNIQUE NOT NULL,
    crop_name_bn VARCHAR(100) NOT NULL,
    crop_name_en VARCHAR(100) NOT NULL,
    variety_info VARCHAR(255) NOT NULL,
    season VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    hero_color VARCHAR(50) DEFAULT 'emerald',
    steps JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Fertilizer Calculation Plans Table
CREATE TABLE IF NOT EXISTS fertilizer_plans (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) DEFAULT 'guest',
    crop_name VARCHAR(100) NOT NULL,
    land_amount NUMERIC(10, 2) NOT NULL,
    land_unit VARCHAR(50) NOT NULL,
    urea_kg NUMERIC(8, 2) NOT NULL,
    tsp_kg NUMERIC(8, 2) NOT NULL,
    mop_kg NUMERIC(8, 2) NOT NULL,
    gypsum_kg NUMERIC(8, 2) NOT NULL,
    zinc_kg NUMERIC(8, 2) NOT NULL,
    boron_kg NUMERIC(8, 3) DEFAULT 0.000,
    organic_kg NUMERIC(8, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Seed Comprehensive Crop Guides (8 Major Bangladeshi Crops)
INSERT INTO crop_guides (crop_id, crop_name_bn, crop_name_en, variety_info, season, icon, hero_color, steps)
VALUES 
(
    'rice',
    'ধান (Rice)',
    'Rice',
    'ব্রি ধান-২৮, ব্রি ধান-২৯, ব্রি ধান-৮৯ ও আমন জাত',
    'বোরো (নভেম্বর - মে) / আমন (জুন - ডিসেম্বর)',
    '🌾',
    'emerald',
    '[
        {"step_number": 1, "title_bn": "মাটি প্রস্তুতি ও জমি তৈরি", "title_en": "Soil Preparation", "duration": "১০ - ১৫ দিন", "badge": "ধাপ ১", "description_bn": "জমি ৩-৪ বার আড়াআড়ি চাষ দিয়ে মই দিয়ে কাদা করে সমান করুন। শেষ চাষের সময় টিএসপি, পটাশ ও জিপসাম সার প্রয়োগ করুন।", "pro_tip_bn": "শেষ চাষের সময় প্রতি শতাংশে ১ কেজি জিপসাম সার দিলে ফলন ১০-১৫% বৃদ্ধি পায়।", "icon": "🚜"},
        {"step_number": 2, "title_bn": "বীজ শোধন ও চারা রোপণ", "title_en": "Seeding & Transplanting", "duration": "২০ - ২৫ দিনের চারা", "badge": "ধাপ ২", "description_bn": "লবণ পানিতে সুস্থ বীজ নির্বাচন করে কার্বেনডাজিম দিয়ে শোধন করুন। সারি থেকে সারি ২০ সেমি এবং গুছি থেকে গুছি ১৫ সেমি দূরত্বে রোপণ করুন।", "pro_tip_bn": "প্রতি গুছিতে ২-৩টি পুষ্ট চারা মাটির ২-৩ সেমি গভীরে রোপণ করুন।", "icon": "🌱"},
        {"step_number": 3, "title_bn": "নিবিড় পরিচর্যা ও সার ব্যবস্থাপনা", "title_en": "Caring & Fertilization", "duration": "১৫ - ৫০ দিন", "badge": "ধাপ ৩", "description_bn": "ইউরিয়া সমান ৩ কিস্তিতে দিন (রোপণের ১৫ দিন পর, কুশি আসার সময় এবং থোড় আসার আগে)। এডব্লিউডি পদ্ধতিতে পর্যায়ক্রমে সেচ ও নিষ্কাশন করুন।", "pro_tip_bn": "জমিতে বাঁশের কঞ্চি পুঁতে পার্চিং করলে মাজরা পোকার আক্রমণ ৬০% কমে যায়।", "icon": "💧"},
        {"step_number": 4, "title_bn": "ফসল কর্তন ও মাড়াই", "title_en": "Harvesting & Threshing", "duration": "শীষ ৮০% সোনালী হলে", "badge": "ধাপ ৪", "description_bn": "শীষের উপরের ৮০% অংশ পেকে সোনালী বর্ণ ধারণ করলে এবং নিচের অংশ কিছুটা সবুজ থাকতেই ধান কেটে মাড়াই করুন।", "pro_tip_bn": "সকালের দিকে শিশির শুকানোর পর ধান কাটলে ফলন নষ্ট কম হয়।", "icon": "🌾"},
        {"step_number": 5, "title_bn": "শুকানো ও সংরক্ষণ", "title_en": "Drying & Preservation", "duration": "৩ - ৪ দিন রোদে", "badge": "ধাপ ৫", "description_bn": "রোদে ৩-৪ দিন শুকিয়ে আর্দ্রতা ১২% এর নিচে নামিয়ে বায়ুরোধী পাত্র বা ড্রামে শুকনো নিমপাতা দিয়ে সংরক্ষণ করুন।", "pro_tip_bn": "বীজ ধানের পাত্রের নিচে ও উপরে শুকনো নিমপাতা দিলে ঘুণপোকা ধরে না।", "icon": "📦"}
    ]'::jsonb
),
(
    'tomato',
    'টমেটো (Tomato)',
    'Tomato',
    'বাহার, মানিক, রতন, বিজলী ও হাইব্রিড জাতসমূহ',
    'শীতকালীন (অক্টোবর - মার্চ) / গ্রীষ্মকালীন',
    '🍅',
    'red',
    '[
        {"step_number": 1, "title_bn": "মাটি তৈরি ও বেড নির্মাণ", "title_en": "Soil Prep & Bed Construction", "duration": "৭ - ১০ দিন", "badge": "ধাপ ১", "description_bn": "বেলে-দোআঁশ মাটিতে ৪-৫ বার গভীর চাষ দিন। ১ মিটার চওড়া এবং ১৫ সেমি উঁচু বেড তৈরি করুন এবং প্রতি দুই বেডের মাঝে ৩০ সেমি নালা রাখুন।", "pro_tip_bn": "মাটি তৈরিতে ট্রাইকো-কম্পোস্ট ব্যবহার করলে শিকড় পচা রোগ থেকে রক্ষা পাওয়া যায়।", "icon": "🚜"},
        {"step_number": 2, "title_bn": "চারা রোপণ ও ফাঁপা দূরত্ব", "title_en": "Transplanting", "duration": "২৫ - ৩০ দিনের চারা", "badge": "ধাপ ২", "description_bn": "বিকাল বেলা সারি থেকে সারি ৬০ সেমি এবং চারা থেকে চারা ৫০ সেমি দূরত্বে সুস্থ চারা রোপণ করুন। রোপণের পর হালকা পানি দিন।", "pro_tip_bn": "রোপণের আগের দিন বীজতলায় পানি দিলে চারা তোলার সময় শিকড় অক্ষত থাকে।", "icon": "🌱"},
        {"step_number": 3, "title_bn": "খুঁটি দেওয়া ও ছাঁটাই (Pruning)", "title_en": "Staking & Caring", "duration": "২০ - ৬০ দিন", "badge": "ধাপ ৩", "description_bn": "গাছ ২০ সেমি বড় হলে বাঁশের খুঁটি দিয়ে বেঁধে দিন। নিচের দিকের অপ্রয়োজনীয় ডালপালা ভেঙে দিন এবং ফল ধরার পর ক্যালসিয়াম ও বোরন স্প্রে করুন।", "pro_tip_bn": "ফল ধরার পর ক্যালসিয়াম ও বোরন স্প্রে করলে ফল ফাটা বন্ধ হয়।", "icon": "🪵"},
        {"step_number": 4, "title_bn": "ফল সংগ্রহ ও গ্রেডিং", "title_en": "Harvesting", "duration": "৬০ - ৯০ দিন", "badge": "ধাপ ৪", "description_bn": "হালকা গোলাপী বা হলুদ আভা এলেই সংগ্রহ করুন। স্থানীয় বাজারের জন্য পাকা লাল টমেটো বৃন্তসহ সংগ্রহ করে প্লাস্টিকের ক্রেটে রাখুন।", "pro_tip_bn": "দুপুরের তীব্র রোদে টমেটো তুলবেন না; সকালে সংগ্রহ করুন।", "icon": "🧺"},
        {"step_number": 5, "title_bn": "সংরক্ষণ ও পরিবহন", "title_en": "Storage & Marketing", "duration": "১০ - ১৫ দিন", "badge": "ধাপ ৫", "description_bn": "বায়ু চলাচলযুক্ত ঠান্ডা ছায়াযুক্ত স্থানে ১০-১২ ডিগ্রি সেলসিয়াস তাপমাত্রায় সংরক্ষণ করুন। কাঠের বা প্লাস্টিকের বাক্সে পরিবহন করুন।", "pro_tip_bn": "কাগজে মুড়িয়ে বাক্সে রাখলে টমেটো দ্রুত নষ্ট হয় না।", "icon": "🚚"}
    ]'::jsonb
),
(
    'potato',
    'আলু (Potato)',
    'Potato',
    'ডায়মন্ড, কার্ডিনাল, গ্র্যানোলা ও অ্যাস্টেরিক্স',
    'রবি মৌসুম (নভেম্বর - ফেব্রুয়ারি)',
    '🥔',
    'amber',
    '[
        {"step_number": 1, "title_bn": "জমি তৈরি ও সার প্রয়োগ", "title_en": "Land Preparation", "duration": "১০ - ১২ দিন", "badge": "ধাপ ১", "description_bn": "জমি ৫-৬ বার আড়াআড়ি চাষ দিয়ে মাটি ধুলার মতো নরম করুন। প্রচুর পটাশ ও পচা গোবর সার মাটিতে মিশিয়ে দিন।", "pro_tip_bn": "মাটি অতিরিক্ত ভেজা থাকলে আলু রোপণ করবেন না।", "icon": "🚜"},
        {"step_number": 2, "title_bn": "বীজ আলু শোধন ও রোপণ", "title_en": "Seed Sprouting & Planting", "duration": "নভেম্বরের ১ম - ৩য় সপ্তাহ", "badge": "ধাপ ২", "description_bn": "অঙ্কুরিত আস্ত বীজ আলু ব্যবহার করা উত্তম। সারি থেকে সারি ৬০ সেমি এবং আলু থেকে আলুর দূরত্ব ২৫ সেমি রাখুন।", "pro_tip_bn": "বীজ আলু রোপণের আগে ম্যানকোজেব দ্রবণে ডুবিয়ে নিলে মড়ক রোগ থেকে নিরাপদ থাকে।", "icon": "🌱"},
        {"step_number": 3, "title_bn": "গোড়ায় মাটি তোলা ও সেচ", "title_en": "Earthing Up & Irrigation", "duration": "২৫ - ৪৫ দিন", "badge": "ধাপ ৩", "description_bn": "গাছের উচ্চতা ১৫-২০ সেমি হলে দুই সারির মাঝের মাটি তুলে গাছের গোড়ায় ভেলি তৈরি করে দিন। প্রয়োজন অনুযায়ী হালকা সেচ দিন।", "pro_tip_bn": "কুয়াশাচ্ছন্ন আবহাওয়ায় লেইট ব্লাইট দেখা দিলে তাৎক্ষণিক প্রতিরোধক স্প্রে করুন।", "icon": "⛏️"},
        {"step_number": 4, "title_bn": "গাছ কাটা ও উত্তোলন", "title_en": "Harvesting", "duration": "৮০ - ৯০ দিন", "badge": "ধাপ ৪", "description_bn": "আলু তোলার ৭-১০ দিন আগে গাছের গোড়া কেটে দিন যাতে আলুর চামড়া শক্ত হয়। শুষ্ক আবহাওয়ায় মাটি খুঁড়ে আলু তুলুন।", "pro_tip_bn": "চামড়া শক্ত না হওয়া পর্যন্ত আলু পরিবহন করবেন না।", "icon": "🧺"},
        {"step_number": 5, "title_bn": "ছায়ায় শুকানো ও সংরক্ষণ", "title_en": "Curing & Storage", "duration": "১ - ৩ মাস", "badge": "ধাপ ৫", "description_bn": "উত্তোলনের পর আলু ছায়াযুক্ত শুকনা মেঝেতে পাতলা করে ৭ দিন রাখুন (Curing)। বীজ আলু হিমাগারে সংরক্ষণ করুন।", "pro_tip_bn": "মাচায় আলুর স্তূপ ১ ফুটের বেশি উঁচু করবেন না।", "icon": "🏠"}
    ]'::jsonb
),
(
    'eggplant',
    'বেগুন (Eggplant)',
    'Eggplant / Brinjal',
    'উত্তরা, কাজলা, ইসলামপুরী ও হাইব্রিড জাত',
    'সারা বছর (রবি ও খরিপ)',
    '🍆',
    'purple',
    '[
        {"step_number": 1, "title_bn": "মাটি নির্বাচন ও বেড প্রস্তুতি", "title_en": "Soil Preparation", "duration": "৮ - ১০ দিন", "badge": "ধাপ ১", "description_bn": "পানি জমে না এমন উঁচু দোআঁশ মাটিতে ৪-৫ বার চাষ দিয়ে মাটি ঝুরঝুরে করে বেড তৈরি করুন।", "pro_tip_bn": "টমেটো বা মরিচ আবাদ করা জমিতে নতুন করে বেগুন লাগাবেন না।", "icon": "🚜"},
        {"step_number": 2, "title_bn": "চারা রোপণ পদ্ধতি", "title_en": "Transplanting", "duration": "৩০ - ৩৫ দিনের চারা", "badge": "ধাপ ২", "description_bn": "সারি থেকে সারি ৭৫ সেমি এবং চারা থেকে চারা ৬০ সেমি দূরত্বে বিকালে চারা রোপণ করে গোড়ায় পানি সেচ দিন।", "pro_tip_bn": "চারা রোপণের পর ২-৩ দিন কলাপাতা দিয়ে ছায়া দিলে চারার বৃদ্ধি দ্রুত হয়।", "icon": "🌱"},
        {"step_number": 3, "title_bn": "পোকা দমন ও পরিচর্যা", "title_en": "Pest Management", "duration": "২৫ - ৯০ দিন", "badge": "ধাপ ৩", "description_bn": "আক্রান্ত ডগা দেখা মাত্রই কেটে ধ্বংস করুন। জমিতে সেক্স ফেরোমোন ফাঁদ স্থাপন করুন।", "pro_tip_bn": "প্রতি ৩ শতাংশ জমিতে একটি করে ফেরোমোন ফাঁদ বসালে ৮০% পোকা দমন হয়।", "icon": "🪤"},
        {"step_number": 4, "title_bn": "বেগুন সংগ্রহ", "title_en": "Harvesting", "duration": "৬০ দিন পর থেকে", "badge": "ধাপ ৪", "description_bn": "উপযুক্ত আকারে চকচকে থাকা অবস্থায় কাঁচি বা ছুরি দিয়ে বৃন্তসহ কাটুন। প্রতি সপ্তাহে ২-৩ বার সংগ্রহ করা যায়।", "pro_tip_bn": "হাত দিয়ে টেনে বেগুন ছিঁড়বেন না।", "icon": "🧺"},
        {"step_number": 5, "title_bn": "গ্রেডিং ও পরিবহন", "title_en": "Packaging & Sales", "duration": "২ - ৪ দিন", "badge": "ধাপ ৫", "description_bn": "সংগৃহীত বেগুন পরিষ্কার কাপড়ে মুছে প্লাস্টিক ক্রেটে বাজারে দ্রুত পরিবহন করুন।", "pro_tip_bn": "বেগুনের গায়ে পানি ছিটিয়ে প্লাস্টিক বস্তায় ভরবেন না।", "icon": "🚚"}
    ]'::jsonb
),
(
    'chilli',
    'মরিচ (Chilli)',
    'Chilli / Pepper',
    'বগুড়ার ঝাল মরিচ, বিন্দু, বিজলী প্লাস ও বারি মরিচ-১ ও ২',
    'রবি (অক্টোবর - মার্চ) ও খরিপ (এপ্রিল - আগস্ট)',
    '🌶️',
    'red',
    '[
        {"step_number": 1, "title_bn": "জমি নির্বাচন ও বেড তৈরি", "title_en": "Soil Preparation", "duration": "৭ - ১০ দিন", "badge": "ধাপ ১", "description_bn": "পানি নিষ্কাশনযুক্ত উর্বর বেলে-দোআঁশ মাটি নির্বাচন করুন। ৪-৫ বার চাষ ও মই দিয়ে মাটি ঝুরঝুরে করে ১ মিটার চওড়া বেড তৈরি করুন।", "pro_tip_bn": "মরিচ গাছ জলাবদ্ধতা একদম সহ্য করতে পারে না, তাই নিকাশ নালা গভীর রাখুন।", "icon": "🚜"},
        {"step_number": 2, "title_bn": "চারা রোপণ ও ফাঁপা দূরত্ব", "title_en": "Transplanting", "duration": "৩০ - ৩৫ দিনের চারা", "badge": "ধাপ ২", "description_bn": "সারি থেকে সারি ৫০ সেমি এবং চারা থেকে চারা ৪০ সেমি দূরত্বে চারা রোপণ করুন। বিকালে চারা লাগানো উত্তম।", "pro_tip_bn": "চারা রোপণের পূর্বে ইমিডাক্লোপ্রিড দিয়ে শিকড় শোধন করলে থ্রিপস পোকা ধরে না।", "icon": "🌱"},
        {"step_number": 3, "title_bn": "পাতা কোঁকড়ানো রোগ ও পরিচর্যা", "title_en": "Pest Control & Caring", "duration": "২০ - ৫০ দিন", "badge": "ধাপ ৩", "description_bn": "সাদা মাছি ও মাকড় দমনে প্রতি লিটার পানিতে ৫ মিলি নিমতেল অথবা মাকড়নাশক (যেমন: ভার্টিমেক) স্প্রে করুন। নিয়মিত আগাছা পরিষ্কার রাখুন।", "pro_tip_bn": "হলুদ ও নীল আঠালো ফাঁদ ব্যবহার করলে রাসায়নিক ছাড়াই পোকা দমন হয়।", "icon": "💧"},
        {"step_number": 4, "title_bn": "কাঁচা ও পাকা মরিচ সংগ্রহ", "title_en": "Harvesting", "duration": "৬০ - ৭০ দিন পর থেকে", "badge": "ধাপ ৪", "description_bn": "কাঁচা মরিচ পুষ্ট ও উজ্জ্বল সবুজ হলে এবং শুকনা মরিচের জন্য সম্পূর্ণ লাল হয়ে পাকলে বৃন্তসহ ছিঁড়ে নিন।", "pro_tip_bn": "সপ্তাহে একবার নিয়মিত মরিচ তুললে গাছে নতুন ফুল ও ফলের সংখ্যা বাড়ে।", "icon": "🧺"},
        {"step_number": 5, "title_bn": "শুকানো ও সংরক্ষণ", "title_en": "Drying & Packaging", "duration": "৫ - ৭ দিন রোদে", "badge": "ধাপ ৫", "description_bn": "পাকা মরিচ পরিষ্কার পলিথিন বা চাটাইয়ের উপর ৫-৭ দিন কড়া রোদে শুকিয়ে বায়ুরোধী টিনের পাত্রে সংরক্ষণ করুন।", "pro_tip_bn": "শুকানোর সময় মাঝে মাঝে উল্টে দিন যাতে সব মরিচ সমানভাবে শুকায়।", "icon": "📦"}
    ]'::jsonb
),
(
    'maize',
    'ভুট্টা (Maize)',
    'Maize / Corn',
    'প্যাসিফিক ৯৮৪, সুপার শাইন, বারি ভুট্টা-৯ ও এনকে-৪০',
    'রবি (অক্টোবর - নভেম্বর) / খরিপ (মার্চ - এপ্রিল)',
    '🌽',
    'amber',
    '[
        {"step_number": 1, "title_bn": "জমি তৈরি ও সার প্রয়োগ", "title_en": "Soil Preparation", "duration": "৮ - ১০ দিন", "badge": "ধাপ ১", "description_bn": "ভুট্টার শিকড় অনেক গভীরে যায়, তাই জমি ৪-৫ বার গভীর চাষ দিতে হবে। ভুট্টায় প্রচুর নাইট্রোজেন ও জিংক সারের প্রয়োজন হয়।", "pro_tip_bn": "বেলে-দোআঁশ ও পলি-দোআঁশ মাটিতে ভুট্টার ফলন সবচেয়ে বেশি হয়।", "icon": "🚜"},
        {"step_number": 2, "title_bn": "সরাসরি বীজ বপন", "title_en": "Direct Seeding", "duration": "কার্তিক - অগ্রহায়ণ", "badge": "ধাপ ২", "description_bn": "সারি থেকে সারির দূরত্ব ৬০ সেমি এবং বীজ থেকে বীজের দূরত্ব ২৫ সেমি রাখুন। মাটির ৩-৪ সেমি গভীরে বীজ বপন করুন।", "pro_tip_bn": "বীজ বপনের পূর্বে ছত্রাকনাশক দিয়ে শোধন করলে চারা গজানোর হার ৯৫% হয়।", "icon": "🌱"},
        {"step_number": 3, "title_bn": "ফল আর্মিওয়ার্ম দমন ও সেচ", "title_en": "Fall Armyworm & Caring", "duration": "১৫ - ৬০ দিন", "badge": "ধাপ ৩", "description_bn": "ভুট্টার সবচেয়ে ক্ষতিকর পোকা ফল আর্মিওয়ার্ম। পাতার কুণ্ডলীতে পোকার উপস্থিতি খেয়াল করুন। জমিতে মোট ৩-৪টি সেচ প্রদান করুন।", "pro_tip_bn": "আর্মিওয়ার্ম দমনে গাছের কুণ্ডলীতে শুকনো বালু বা ছাই দিলে পোকা মরে যায়।", "icon": "🪤"},
        {"step_number": 4, "title_bn": "মোচা সংগ্রহ", "title_en": "Harvesting", "duration": "১২০ - ১৩৫ দিন", "badge": "ধাপ ৪", "description_bn": "মোচার খোসা শুকিয়ে খড়ের রঙ ধারণ করলে এবং দানার গোড়ায় কালো দাগ তৈরি হলে মোচা সংগ্রহ করুন।", "pro_tip_bn": "মোচা সংগ্রহের পর দ্রুত খোসা ছাড়িয়ে রোদে দিন।", "icon": "🧺"},
        {"step_number": 5, "title_bn": "দানা মাড়াই ও সংরক্ষণ", "title_en": "Shelling & Storage", "duration": "৩ - ৪ দিন রোদে শুকানো", "badge": "ধাপ ৫", "description_bn": "ভুট্টা মাড়াই মেশিন দিয়ে দানা আলাদা করুন। দানার আর্দ্রতা ১২% এর নিচে এনে বায়ুরোধী ড্রামে সংরক্ষণ করুন।", "pro_tip_bn": "আর্দ্রতা বেশি থাকলে ভুট্টায় আফলাটক্সিন ছত্রাক বিষাক্ততা ছড়ায়।", "icon": "📦"}
    ]'::jsonb
),
(
    'mustard',
    'সরিষা (Mustard)',
    'Mustard',
    'বারি সরিষা-১৪, বারি সরিষা-১৫, বারি সরিষা-১৭ ও ১৮',
    'রবি মৌসুম (অক্টোবর - নভেম্বর)',
    '🌼',
    'yellow',
    '[
        {"step_number": 1, "title_bn": "জমি প্রস্তুতি ও সার দেওয়া", "title_en": "Soil Preparation", "duration": "৬ - ৮ দিন", "badge": "ধাপ ১", "description_bn": "আমন ধান কাটার পর মাটিতে আর্দ্রতা থাকতেই ৩-৪ বার চাষ দিয়ে মাটি ঝুরঝুরে করুন। শেষ চাষে গন্ধক (জিপসাম) ও বোরন সার প্রয়োগ করুন।", "pro_tip_bn": "সরিষায় গন্ধক সার দিলে তেলের পরিমাণ ও দানার ওজন ২০% বৃদ্ধি পায়।", "icon": "🚜"},
        {"step_number": 2, "title_bn": "বীজ বপন পদ্ধতি", "title_en": "Sowing", "duration": "কার্তিক মাস (অক্টোবর শেষ)", "badge": "ধাপ ২", "description_bn": "সারি করে বুনলে সারি থেকে সারির দূরত্ব ৩০ সেমি রাখুন। অথবা জমিতে সমানভাবে ছিটিয়ে বপন করে হালকা মই দিয়ে ঢেকে দিন।", "pro_tip_bn": "বীজের সাথে শুকনা ছাই বা বালি মিশিয়ে বুনলে জমিতে সমানভাবে পড়ে।", "icon": "🌱"},
        {"step_number": 3, "title_bn": "জাবপোকা দমন ও ফুলকালীন সেচ", "title_en": "Aphid Control & Irrigation", "duration": "২০ - ৫০ দিন", "badge": "ধাপ ৩", "description_bn": "সরিষার প্রধান শত্রু জাবপোকা (Aphids)। ফুল আসার পর গাছে জাবপোকা দেখা দিলে বিকেলে ইমিডাক্লোপ্রিড অথবা নিমপাতা রস স্প্রে করুন।", "pro_tip_bn": "ফুল ফোটার সময় জমিতে মৌমাছির বাক্স বসালে পরাগায়ন ভালো হয় ও ফলন বাড়ে।", "icon": "🐝"},
        {"step_number": 4, "title_bn": "ফসল কর্তন", "title_en": "Harvesting", "duration": "৭৫ - ৮৫ দিন", "badge": "ধাপ ৪", "description_bn": "গাছের পাতা ও ফলের ৭৫-৮০% হলুদাভ সোনালী বর্ণ ধারণ করলে সকালের দিকে শিশির শুকানোর আগেই কেটে ফেলুন।", "pro_tip_bn": "দুপুরে কাটলে শুকনা ফল ফেটে বীজ জমিতে ঝরে পড়ে।", "icon": "🌾"},
        {"step_number": 5, "title_bn": "মাড়াই ও তেল নিষ্কাশন", "title_en": "Threshing & Storage", "duration": "২ - ৩ দিন রোদে", "badge": "ধাপ ৫", "description_bn": "রোদে ভালো করে শুকিয়ে লাঠি দিয়ে পিটিয়ে বা মাড়াই যন্ত্র দিয়ে বীজ আলাদা করুন। আর্দ্রতা ৯% এ এনে সংরক্ষণ করুন।", "pro_tip_bn": "ভালো করে না শুকালে তেলের গুণগত মান ও ঝাঁঝ কমে যায়।", "icon": "📦"}
    ]'::jsonb
),
(
    'onion',
    'পেঁয়াজ (Onion)',
    'Onion',
    'তাহেরপুরী, বারি পেঁয়াজ-১, বারি পেঁয়াজ-৪ ও মেটাল কিং',
    'রবি (নভেম্বর - মার্চ) ও গ্রীষ্মকালীন (বারি-৫)',
    '🧅',
    'rose',
    '[
        {"step_number": 1, "title_bn": "উর্বর জমি তৈরি", "title_en": "Land Preparation", "duration": "৭ - ৯ দিন", "badge": "ধাপ ১", "description_bn": "দোআঁশ বা পলি-দোআঁশ মাটিতে ৪-৫ বার চাষ দিন। শতকে ৪০ কেজি গোবর সার, ১ কেজি টিএসপি এবং ১.৫ কেজি পটাশ সার দিন।", "pro_tip_bn": "পেঁয়াজ মাটির অম্লতা সহ্য করতে পারে না, তাই চুন প্রয়োগ করা ভালো।", "icon": "🚜"},
        {"step_number": 2, "title_bn": "চারা রোপণ", "title_en": "Transplanting", "duration": "৪০ - ৪৫ দিনের চারা", "badge": "ধাপ ২", "description_bn": "সারি থেকে সারি ১৫ সেমি এবং চারা থেকে চারা ১০ সেমি দূরত্বে মাটির ২-৩ সেমি গভীরে রোপণ করুন। চারা লাগানোর পর হালকা পানি দিন।", "pro_tip_bn": "চারার অগ্রভাগের এক-তৃতীয়াংশ কেটে লাগালে চারার নতুন শিকড় দ্রুত গজায়।", "icon": "🌱"},
        {"step_number": 3, "title_bn": "থ্রিপস পোকা ও বেগুনি দাগ রোগ", "title_en": "Thrips & Purple Blotch", "duration": "২০ - ৬০ দিন", "badge": "ধাপ ৩", "description_bn": "পাতায় সাদাটে ছোপ ও ডগা শুকিয়ে যাওয়া রোধে রোভরাল (ইপ্রোডিয়ন) এবং থ্রিপস দমনে নীল আঠালো ফাঁদ ব্যবহার করুন।", "pro_tip_bn": "মাটি শক্ত হলে পেঁয়াজের আকার ছোট হয়, তাই নিড়ানি দিয়ে মাটি আলগা রাখুন।", "icon": "💧"},
        {"step_number": 4, "title_bn": "পেঁয়াজ উত্তোলন", "title_en": "Harvesting", "duration": "৯০ - ১১০ দিন", "badge": "ধাপ ৪", "description_bn": "গাছের পাতা ৬০-৭০% শুকিয়ে ভেঙে পড়লে শুষ্ক আবহাওয়ায় মাটি নরম করে সাবধানে পেঁয়াজ তুলুন।", "pro_tip_bn": "তোলার ১০ দিন আগে থেকে জমিতে পানি সেচ দেওয়া সম্পূর্ণ বন্ধ রাখুন।", "icon": "🧺"},
        {"step_number": 5, "title_bn": "ছায়ায় শুকানো ও মাচায় সংরক্ষণ", "title_en": "Curing & Storage", "duration": "৪ - ৬ মাস", "badge": "ধাপ ৫", "description_bn": "উত্তোলনের পর পাতাসহ ছায়াযুক্ত স্থানে ৭ দিন শুকান (Curing)। ২-৩ সেমি ডাঁটা রেখে কেটে বাঁশের মাচায় পাতলা করে সাজিয়ে রাখুন।", "pro_tip_bn": "ঘরের আর্দ্রতা কম ও বাতাস চলাচল ভালো থাকলে পেঁয়াজে পচন ধরে না।", "icon": "🏠"}
    ]'::jsonb
)
ON CONFLICT (crop_id) DO UPDATE 
SET crop_name_bn = EXCLUDED.crop_name_bn,
    crop_name_en = EXCLUDED.crop_name_en,
    variety_info = EXCLUDED.variety_info,
    season = EXCLUDED.season,
    icon = EXCLUDED.icon,
    hero_color = EXCLUDED.hero_color,
    steps = EXCLUDED.steps;
